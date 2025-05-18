import {
  compactXML,
  extractUsername,
  logMessage
} from "../helpers/helpers.js";

import { settings, FALLBACK_COLOR } from "../data/definitions.js";
import { privateMessageState } from "../helpers/privateMessagesHandler.js";
import { optimizeColor } from "../helpers/chatUsernameColors.js";

export function createXMPPClient(xmppConnection, userManager, messageManager, username) {
  // Compact wrapper functions.
  const safeUpdatePresence = (xmlResponse) =>
    xmlResponse && userManager.updatePresence(xmlResponse);

  const safeProcessMessages = (xmlResponse) =>
    xmlResponse && messageManager.processMessages(xmlResponse);

  function getUserInfo() {
    const cleanedUsername = extractUsername(username);
    const baseAvatarPath = `/storage/avatars/${username.split('#')[0]}.png`;
    const timestamp = Math.floor(Date.now() / 1000);

    // Get color from localStorage or use fallback
    const storedColor = localStorage.getItem('chatUsernameColor');
    const chatUsernameColor = optimizeColor(storedColor) || FALLBACK_COLOR;

    return {
      cleanedUsername, chatUsernameColor, baseAvatarPath, timestamp
    };
  }

  let userInfo = getUserInfo(); // Initialize user info

  // ─── Inline Web Worker for steady pings ───
  const workerBlob = new Blob([`
    const PING_INTERVAL = ${settings.pingInterval};
    let isRunning = false;

    function schedulePing() {
      if (!isRunning) return;
      // send a tick back to the main thread
      self.postMessage('tick');
      // schedule the next ping
      setTimeout(schedulePing, PING_INTERVAL);
    }

    self.onmessage = messageEvent => {
      if (messageEvent.data === 'start' && !isRunning) {
        isRunning = true;
        schedulePing();
      } else if (messageEvent.data === 'stop' && isRunning) {
        isRunning = false;
      }
    };
  `], { type: 'text/javascript' });
  const pingWorker = new Worker(URL.createObjectURL(workerBlob));

  pingWorker.onmessage = async ({ data }) => {
    if (data === 'tick' && xmppClient.isConnected && !xmppClient.isReconnecting && !xmppClient.isReloading) {
      try {
        const pingPayload = `<body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'/>`;
        await xmppConnection.sendRequestWithRetry(pingPayload);
      } catch (error) {
        logMessage("Ping failed.", 'warning');
        xmppClient.isConnected = false;
        xmppClient.isReconnecting = true;
        xmppClient.connect();
      }
    }
  };

  const xmppClient = {
    userManager,
    messageManager,
    isHttpBindingActive: false,
    isReconnecting: false,
    isConnected: false,
    messageQueue: new Map(),
    lastSentMessage: null,
    isReloading: false,

    // Helper: Create the XML stanza for a message.
    _createMessageStanza(text, messageId, isPrivate, fullJid) {

      const info = userInfo;

      // Create the user data block
      const userDataBlock = `
      <x xmlns='klavogonki:userdata'>
        <user>
          <login>${info.cleanedUsername}</login>
          <avatar>${info.baseAvatarPath}?updated=${info.timestamp}</avatar>
          <background>${info.chatUsernameColor}</background>
        </user>
      </x>
      `;

      // Determine the destination and message type
      const destination = isPrivate && fullJid
        ? fullJid
        : 'general@conference.jabber.klavogonki.ru';
      const messageType = isPrivate ? 'chat' : 'groupchat';

      // Create the full message stanza with readable formatting
      const formattedXML = `
      <body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'>
        <message 
          from='${username}@jabber.klavogonki.ru/web' 
          to='${destination}' 
          type='${messageType}' 
          id='${messageId}' 
          xmlns='jabber:client'>
          <body>${text}</body>
          ${userDataBlock}
        </message>
      </body>
      `;

      // Return the compacted version for actual use
      return compactXML(formattedXML);
    },

    // Process queued messages sequentially.
    async processQueue() {
      if (!this.isConnected || this.isReconnecting) return;

      for (const [messageId, msg] of this.messageQueue) {
        const messageStanza = this._createMessageStanza(msg.text, msg.id, msg.isPrivate, msg.fullJid);
        try {
          await xmppConnection.sendRequestWithRetry(messageStanza);
          // On success, remove the message from the queue.
          this.messageQueue.delete(messageId);
          // Optionally, update the UI to remove the pending flag.
          messageManager.updatePendingStatus(msg.id, false);
          safeProcessMessages(null);
        } catch (error) {
          logMessage(`Failed to send queued message (${msg.id}): ${error.message}`, 'error');
          // Stop processing; the message remains in the queue for later retry.
          break;
        }
      }
    },

    async connect() {
      try {
        // Stop any existing HTTP binding
        this.stopHttpBinding();

        let retries = 5;
        while (retries > 0 && !this.isConnected) {
          try {
            const session = await xmppConnection.connect();
            console.log('💬 Step 8: Joining chat room...');

            const info = userInfo;

            const joinPayload = compactXML(`
            <body rid='${xmppConnection.nextRid()}' xmlns='http://jabber.org/protocol/httpbind' sid='${session.sid}'>
              <presence from='${username}@jabber.klavogonki.ru/web' to='general@conference.jabber.klavogonki.ru/${username}' xmlns='jabber:client'>
                <x xmlns='http://jabber.org/protocol/muc'/>
                <x xmlns='klavogonki:userdata'>
                  <user>
                    <login>${info.cleanedUsername}</login>
                    <avatar>${info.baseAvatarPath}?updated=${info.timestamp}</avatar>
                    <background>${info.chatUsernameColor}</background>
                  </user>
                </x>
              </presence>
            </body>
            `);

            const joinResponse = await xmppConnection.sendRequestWithRetry(joinPayload);

            console.log('📥 Join response:', joinResponse);

            safeUpdatePresence(joinResponse);
            safeProcessMessages(joinResponse);

            const infoPayload = compactXML(`
              <body 
                rid='${xmppConnection.nextRid()}' 
                sid='${session.sid}' 
                xmlns='http://jabber.org/protocol/httpbind'>
                <iq 
                  type='get' 
                  id='info_${Math.random().toString(36).substring(2, 10)}' 
                  xmlns='jabber:client' 
                  to='general@conference.jabber.klavogonki.ru'>
                  <query xmlns='http://jabber.org/protocol/disco#info'/>
                </iq>
              </body>
            `);

            await xmppConnection.sendRequestWithRetry(infoPayload);
            console.log('🚀 Step 10: Connected!');

            this.isConnected = true;
            if (this.isReconnecting) {
              logMessage("Chat connected successfully.", 'success');
              messageManager.refreshMessages(true);
              this.isReconnecting = false;
            }

            pingWorker.postMessage('start'); // Start the ping worker
            this.startHttpBinding(); // Start HTTP binding
            this.processQueue(); // Process the message queue
            break; // Exit the retry loop on success
          } catch (error) {
            logMessage(`XMPP Client: Connection error: ${error.message}`, 'error');
            retries--;
            if (retries === 0) {
              logMessage(`Scheduling reconnection attempt in ${settings.reconnectionDelay / 1000} seconds...`, 'warning');
              this.isReconnecting = true;
              setTimeout(() => this.connect(), settings.reconnectionDelay);
            } else {
              logMessage(`Retrying connection... (${retries} attempts left)`, 'warning');
              await new Promise(resolve => setTimeout(resolve, settings.reconnectionDelay));
            }
          }
        }
      } catch (error) {
        logMessage(`XMPP Client: Final connection error: ${error.message}`, 'error');
        this.isConnected = false;
        if (!this.isReconnecting) {
          logMessage(`Scheduling reconnection attempt in ${settings.reconnectionDelay / 1000} seconds...`, 'warning');
          this.isReconnecting = true;
          setTimeout(() => this.connect(), settings.reconnectionDelay);
        }
      }
    },

    // Start HTTP binding for XMPP server updates
    async startHttpBinding() {
      if (this.isHttpBindingActive) return;
      this.isHttpBindingActive = true;
      console.log('💬 Starting XMPP HTTP binding...');

      const pollRequest = async () => {
        if (!this.isConnected || this.isReconnecting || !this.isHttpBindingActive) {
          this.isHttpBindingActive = false;
          return;
        }

        try {
          // Define the bind payload
          const bindPayload = `<body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'/>`;

          // Send a request that the server can respond to when it has updates
          const xmlResponse = await xmppConnection.sendRequestWithRetry(bindPayload);

          // Process any updates in the response
          safeUpdatePresence(xmlResponse);
          safeProcessMessages(xmlResponse);

          // Immediately send another request to maintain the HTTP binding connection
          if (this.isHttpBindingActive) {
            pollRequest();
          }
        } catch (error) {
          if (error.message.includes('404') && !this.isReconnecting) {
            logMessage("Chat connection lost.", 'warning');
            messageManager.refreshMessages(false);
            this.isReconnecting = true;
            this.isConnected = false;
            this.isHttpBindingActive = false;
            this.connect();
          }
        }
      };

      // Start the initial poll
      pollRequest();
    },

    stopHttpBinding() {
      if (this.isHttpBindingActive) {
        this.isHttpBindingActive = false;
      }
      // Stop inline worker pinger
      pingWorker.postMessage('stop');
    },

    sendMessage(text) {
      const messageId = `msg_${Date.now()}`;
      let isPrivate = false;
      let fullJid = null;
      let recipient = null;

      // Only mark as pending if we're disconnected
      const isPending = !this.isConnected || this.isReconnecting;

      if (privateMessageState.isPrivateMode && privateMessageState.fullJid) {
        isPrivate = true;
        fullJid = privateMessageState.fullJid;
        recipient = privateMessageState.targetUsername;
        messageManager.addSentMessage(text, {
          isPrivate: true,
          recipient,
          pending: isPending
        });
      } else {
        messageManager.addSentMessage(text, { pending: isPending });
      }

      const now = Date.now();

      // Check against the last sent message.
      if (this.lastSentMessage && this.lastSentMessage.text === text && (now - this.lastSentMessage.timestamp) < settings.deduplicationDelay) {
        logMessage(`Duplicate message prevented: ${text}`, 'warning');
        return;
      }

      // Prevent duplicate messages in the queue
      if (this.messageQueue.has(messageId)) {
        logMessage(`Message already in queue: ${messageId}`, 'warning');
        return;
      }

      // Update lastSentMessage info.
      this.lastSentMessage = {
        text,
        timestamp: now
      };

      // Enqueue the message with timestamp.
      this.messageQueue.set(messageId, {
        text,
        id: messageId,
        isPrivate,
        fullJid,
        recipient,
        pending: isPending,
        enqueueTime: now
      });

      // Process the queue on connection establishment.
      if (this.isConnected && !this.isReconnecting) {
        this.processQueue();
      }
    }
  };

  window.addEventListener('beforeunload', () => {
    xmppClient.isReloading = true;
    xmppClient.stopHttpBinding();
  });

  // --- Network connectivity handling ---
  // Listen for offline events to stop HTTP binding.
  window.addEventListener('offline', () => {
    logMessage("Network connection lost.", 'warning');
    xmppClient.stopHttpBinding();
    xmppClient.isConnected = false;
    messageManager.refreshMessages(false, 'network');
  });

  // Listen for online events to attempt reconnection immediately.
  window.addEventListener('online', () => {
    logMessage("Network connection restored.", 'success');
    if (!xmppClient.isConnected && !xmppClient.isReconnecting) {
      xmppClient.connect();
    }
    messageManager.refreshMessages(true, 'network');
  });

  return xmppClient;
}
