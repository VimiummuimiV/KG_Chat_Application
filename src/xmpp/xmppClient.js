import {
  reconnectionDelay
} from "../data/definitions.js";
import { FALLBACK_COLOR } from "../data/definitions.js";

import {
  compactXML,
  extractUsername
} from "../helpers/helpers.js";

import { showChatAlert } from "../helpers/chatHeaderAlert.js";
import { privateMessageState } from "../helpers/privateMessagesHandler.js";
import { showAlertDuration } from "../data/definitions.js";
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
      cleanedUsername,
      chatUsernameColor,
      baseAvatarPath,
      timestamp
    };
  }

  const xmppClient = {
    userManager,
    messageManager,
    isHttpBindingActive: false,
    isReconnecting: false,
    isConnected: false,
    // Queue of messages waiting to be sent.
    messageQueue: new Map(),
    // Store last sent message to prevent duplicates
    lastSentMessage: null,

    // Helper: Create the XML stanza for a message.
    _createMessageStanza(text, messageId, isPrivate, fullJid) {

      const info = getUserInfo();

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
          console.error(`Failed to send queued message (${msg.id}): ${error.message}`);
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

            const info = getUserInfo();

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
              showChatAlert("Chat connected successfully!", { type: 'success', duration: showAlertDuration });
              messageManager.refreshMessages(true);
              this.isReconnecting = false;
            }

            // Start HTTP binding for server updates
            this.startHttpBinding();

            // Process any queued messages
            this.processQueue();
            break;
          } catch (error) {
            console.error(`💥 Connection error: ${error.message}`);
            retries--;
            if (retries === 0) {
              console.log(`⏳ Scheduling reconnection attempt in ${reconnectionDelay / 1000} seconds...`);
              this.isReconnecting = true;
              setTimeout(() => this.connect(), reconnectionDelay);
            } else {
              console.log(`🔄 Retrying connection... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, reconnectionDelay));
            }
          }
        }
      } catch (error) {
        console.error(`💥 Final connection error: ${error.message}`);
        this.isConnected = false;
        if (!this.isReconnecting) {
          console.log(`⏳ Scheduling reconnection attempt in ${reconnectionDelay / 1000} seconds...`);
          this.isReconnecting = true;
          setTimeout(() => this.connect(), reconnectionDelay);
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
          // Send a request that the server can respond to when it has updates
          const xmlResponse = await xmppConnection.sendRequestWithRetry(
            `<body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'/>`
          );

          // Process any updates in the response
          safeUpdatePresence(xmlResponse);
          safeProcessMessages(xmlResponse);

          // Immediately send another request to maintain the HTTP binding connection
          if (this.isHttpBindingActive) {
            pollRequest();
          }
        } catch (error) {
          console.error('HTTP binding error:', error.message);
          if (error.message.includes('404') && !this.isReconnecting) {
            console.log(`🛑 Chat connection lost. Reconnecting...`);
            showChatAlert("Chat connection lost. Reconnecting...", { type: 'warning', duration: showAlertDuration });
            messageManager.refreshMessages(false);
            this.isReconnecting = true;
            this.isConnected = false;
            this.isHttpBindingActive = false;
            this.connect(); // Immediately attempt to reconnect
          }
        }
      };

      // Start the initial poll
      pollRequest();
    },

    stopHttpBinding() {
      if (this.isHttpBindingActive) {
        this.isHttpBindingActive = false;
        console.log('💬 HTTP binding stopped.');
      }
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
      const debounceTime = 2000; // 2 seconds to prevent duplicates

      // Check against the last sent message.
      if (this.lastSentMessage && this.lastSentMessage.text === text && (now - this.lastSentMessage.timestamp) < debounceTime) {
        console.log('Duplicate message prevented:', text);
        return;
      }

      // Prevent duplicate messages in the queue
      if (this.messageQueue.has(messageId)) {
        console.log('Message already in queue:', messageId);
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

  // --- Network connectivity handling ---
  // Listen for offline events to stop HTTP binding.
  window.addEventListener('offline', () => {
    console.log("Network offline. Stopping HTTP binding.");
    xmppClient.stopHttpBinding();
    xmppClient.isConnected = false;
    showChatAlert("Network connection lost.", { type: 'warning', duration: showAlertDuration });
    messageManager.refreshMessages(false, 'network');
  });

  // Listen for online events to attempt reconnection immediately.
  window.addEventListener('online', () => {
    console.log("Network online. Reconnecting immediately...");
    if (!xmppClient.isConnected && !xmppClient.isReconnecting) {
      xmppClient.connect();
    }
    showChatAlert("Network connection restored.", { type: 'success', duration: showAlertDuration });
    messageManager.refreshMessages(true, 'network');
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    xmppClient.stopHttpBinding();
  });
  // --- End network handling ---

  return xmppClient;
}