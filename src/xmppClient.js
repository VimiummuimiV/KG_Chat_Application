import { reconnectionDelay, userListDelay } from "./definitions.js";
import { privateMessageState, showChatAlert } from "./helpers.js";

export function createXMPPClient(xmppConnection, userManager, messageManager, username) {
  const xmppClient = {
    userManager,
    messageManager,
    presenceInterval: null,
    isReconnecting: false,
    isConnected: false, // Add connection state flag

    async connect() {
      try {
        // Clear existing interval if reconnecting
        if (this.presenceInterval) {
          clearInterval(this.presenceInterval);
          this.presenceInterval = null;
        }
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
        userManager.updatePresence(joinResponse);
        messageManager.processMessages(joinResponse);
        const infoPayload = `<body rid='${xmppConnection.nextRid()}' sid='${session.sid}'
                 xmlns='http://jabber.org/protocol/httpbind'>
            <iq type='get' id='info1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru'>
              <query xmlns='http://jabber.org/protocol/disco#info'/>
            </iq>
          </body>`;
        await xmppConnection.sendRequestWithRetry(infoPayload);
        console.log('🚀 Step 10: Connected! Starting presence updates...');
        // Set connected status after successful connection
        this.isConnected = true;

        // Notify user about successful connection
        if (this.isReconnecting) {
          showChatAlert("Chat connected successfully!", { type: 'success' });
          this.isReconnecting = false;
        }

        // Start polling for presence and messages AFTER the connection is established
        this.startPresencePolling(xmppConnection);
      } catch (error) {
        console.error(`💥 Connection error: ${error.message}`);
        this.isConnected = false; // Update connection state
        if (!this.isReconnecting) {
          console.log('⏳ Scheduling reconnection attempt in 5 seconds...');
          this.isReconnecting = true;
          setTimeout(() => this.connect(), reconnectionDelay);
        }
      }
    },

    // Separate method for presence polling
    startPresencePolling(xmppConnection) {
      // Start polling for presence and messages
      this.presenceInterval = setInterval(async () => {
        if (!this.isConnected) {
          console.log('⚠️ Skipping presence poll - not connected');
          return;
        }
        try {
          const xmlResponse = await xmppConnection.sendRequestWithRetry(
            `<body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'/>`
          );
          // Process updates safely
          try {
            userManager.updatePresence(xmlResponse);
          } catch (userError) {
            console.error('Error updating user presence:', userError);
          }
          try {
            messageManager.processMessages(xmlResponse);
          } catch (msgError) {
            console.error('Error processing messages:', msgError);
          }
          this.isReconnecting = false; // Reset reconnection flag
        } catch (error) {
          console.error('Presence polling error:', error.message);
          // If a 404 error occurs and we're not already reconnecting
          if (error.message.includes('404') && !this.isReconnecting) {
            console.log('🛑 Connection lost (404). Reconnecting in 5 seconds...');
            // Notify user about the connection loss
            showChatAlert("Chat connection lost. Reconnecting...", { type: 'warning' });
            // Clear the previous messages from the UI and in-memory storage
            messageManager.clearMessages();
            this.isReconnecting = true;
            this.isConnected = false; // Update connection state
            clearInterval(this.presenceInterval);
            this.presenceInterval = null;
            setTimeout(() => this.connect(), reconnectionDelay);
          }
        }
      }, userListDelay);
    },

    sendMessage(text) {
      if (this.isReconnecting || !this.isConnected) {
        console.warn('⚠️ Message not sent - connection not ready');
        return;
      }
      const messageId = `msg_${Date.now()}`;
      let messageStanza;
      if (privateMessageState.isPrivateMode && privateMessageState.fullJid) {
        messageStanza = `
          <body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'>
            <message from='${username}@jabber.klavogonki.ru/web'
                     to='${privateMessageState.fullJid}'
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
        messageManager.addSentMessage(text, { isPrivate: true, recipient: privateMessageState.targetUsername });
      } else {
        messageStanza = `
          <body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'>
            <message to='general@conference.jabber.klavogonki.ru'
                     type='groupchat'
                     id='${messageId}'
                     xmlns='jabber:client'>
              <body>${text}</body>
            </message>
          </body>`;
        messageManager.addSentMessage(text);
      }
      xmppConnection.sendRequestWithRetry(messageStanza)
        .then(response => messageManager.processMessages(response))
        .catch(error => console.error('Message send error:', error.message));
    }
  };
  return xmppClient;
}