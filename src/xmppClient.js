import { reconnectionDelay, userListDelay } from "./definitions.js";
import { privateMessageState, showChatAlert } from "./helpers.js";

export function createXMPPClient(xmppConnection, userManager, messageManager, username) {
  // Compact wrapper functions.
  const safeUpdatePresence = (xmlResponse) =>
    xmlResponse && userManager.updatePresence(xmlResponse);

  const safeProcessMessages = (xmlResponse) =>
    xmlResponse && messageManager.processMessages(xmlResponse);

  const xmppClient = {
    userManager,
    messageManager,
    presenceInterval: null,
    isReconnecting: false,
    isConnected: false,
    // Queue of messages waiting to be sent.
    messageQueue: [],

    // Helper: Create the XML stanza for a message.
    _createMessageStanza(text, messageId, isPrivate, fullJid) {
      if (isPrivate && fullJid) {
        return `
          <body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'>
            <message from='${username}@jabber.klavogonki.ru/web'
                     to='${fullJid}'
                     type='chat'
                     id='${messageId}'
                     xmlns='jabber:client'>
              <body>${text}</body>
              <x xmlns='klavogonki:userdata'>
                <user>
                  <login>${username.replace(/^\d+#/, '')}</login>
                  <avatar>/storage/avatars/${username.split('#')[0]}.png</avatar>
                  <background>#7788cc</background>
                </user>
              </x>
            </message>
          </body>`;
      } else {
        return `
          <body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'>
            <message to='general@conference.jabber.klavogonki.ru'
                     type='groupchat'
                     id='${messageId}'
                     xmlns='jabber:client'>
              <body>${text}</body>
            </message>
          </body>`;
      }
    },

    // Process queued messages sequentially.
    async processQueue() {
      if (!this.isConnected || this.isReconnecting) return;

      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue[0]; // Peek the first message.
        const messageStanza = this._createMessageStanza(msg.text, msg.id, msg.isPrivate, msg.fullJid);
        try {
          await xmppConnection.sendRequestWithRetry(messageStanza);
          // On success, remove the message from the queue.
          this.messageQueue.shift();
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
        if (this.presenceInterval) {
          clearInterval(this.presenceInterval);
          this.presenceInterval = null;
        }
        let retries = 5;
        while (retries > 0 && !this.isConnected) {
          try {
            const session = await xmppConnection.connect();
            console.log('💬 Step 8: Joining chat room...');
            const joinPayload = `<body rid='${xmppConnection.nextRid()}' sid='${session.sid}'
                     xmlns='http://jabber.org/protocol/httpbind'>
                <presence id='pres_1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru/${username}'>
                  <x xmlns='http://jabber.org/protocol/muc'/>
                </presence>
              </body>`;
            const joinResponse = await xmppConnection.sendRequestWithRetry(joinPayload);
            console.log('📥 Join response:', joinResponse);

            safeUpdatePresence(joinResponse);
            safeProcessMessages(joinResponse);

            const infoPayload = `<body rid='${xmppConnection.nextRid()}' sid='${session.sid}'
                     xmlns='http://jabber.org/protocol/httpbind'>
                <iq type='get' id='info1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru'>
                  <query xmlns='http://jabber.org/protocol/disco#info'/>
                </iq>
              </body>`;
            await xmppConnection.sendRequestWithRetry(infoPayload);
            console.log('🚀 Step 10: Connected! Starting presence updates...');

            this.isConnected = true;
            if (this.isReconnecting) {
              showChatAlert("Chat connected successfully!", { type: 'success' });
              this.isReconnecting = false;
            }
            this.startPresencePolling(xmppConnection);
            // Process any queued messages.
            this.processQueue();
            break;
          } catch (error) {
            console.error(`💥 Connection error: ${error.message}`);
            retries--;
            if (retries === 0) {
              console.log('⏳ Scheduling reconnection attempt in 5 seconds...');
              this.isReconnecting = true;
              setTimeout(() => this.connect(), reconnectionDelay);
            } else {
              console.log(`🔄 Retrying connection... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
        }
      } catch (error) {
        console.error(`💥 Final connection error: ${error.message}`);
        this.isConnected = false;
        if (!this.isReconnecting) {
          console.log('⏳ Scheduling reconnection attempt in 5 seconds...');
          this.isReconnecting = true;
          setTimeout(() => this.connect(), reconnectionDelay);
        }
      }
    },

    startPresencePolling(xmppConnection) {
      this.presenceInterval = setInterval(async () => {
        if (!this.isConnected) {
          console.log('⚠️ Skipping presence poll - not connected');
          return;
        }
        try {
          const xmlResponse = await xmppConnection.sendRequestWithRetry(
            `<body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'/>`
          );
          safeUpdatePresence(xmlResponse);
          safeProcessMessages(xmlResponse);
          this.isReconnecting = false;
        } catch (error) {
          console.error('Presence polling error:', error.message);
          if (error.message.includes('404') && !this.isReconnecting) {
            console.log('🛑 Connection lost (404). Reconnecting in 5 seconds...');
            showChatAlert("Chat connection lost. Reconnecting...", { type: 'warning' });
            messageManager.clearMessages();
            this.isReconnecting = true;
            this.isConnected = false;
            clearInterval(this.presenceInterval);
            this.presenceInterval = null;
            setTimeout(() => this.connect(), reconnectionDelay);
          }
        }
      }, userListDelay);
    },

    sendMessage(text) {
      const messageId = `msg_${Date.now()}`;
      let isPrivate = false;
      let fullJid = null;
      let recipient = null;

      // Only mark as pending if we're disconnected
      const isPending = !this.isConnected || this.isReconnecting;

      // Use original condition for private messages.
      if (privateMessageState.isPrivateMode && privateMessageState.fullJid) {
        isPrivate = true;
        fullJid = privateMessageState.fullJid;
        recipient = privateMessageState.targetUsername;
        // Only mark as pending if we're disconnected
        messageManager.addSentMessage(text, {
          isPrivate: true,
          recipient,
          pending: isPending
        });
      } else {
        messageManager.addSentMessage(text, {
          pending: isPending
        });
      }

      // Enqueue the message
      this.messageQueue.push({
        text,
        id: messageId,
        isPrivate,
        fullJid,
        recipient,
        pending: isPending
      });

      // Process the queue if connected.
      if (this.isConnected && !this.isReconnecting) {
        this.processQueue();
      }
    }
  };

  return xmppClient;
}
