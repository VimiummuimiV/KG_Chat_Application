import { reconnectionDelay, userListDelay } from "./definitions.js";
import { privateMessageState } from "./helpers.js";
import { showChatAlert } from "./helpers.js";

export function createXMPPClient(xmppConnection, userManager, messageManager, username) {
  const xmppClient = {
    userManager,
    messageManager,
    presenceInterval: null,
    isReconnecting: false,

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

        // Start polling for presence and messages
        this.presenceInterval = setInterval(async () => {
          try {
            const xmlResponse = await xmppConnection.sendRequestWithRetry(
              `<body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'/>`
            );
            userManager.updatePresence(xmlResponse);
            messageManager.processMessages(xmlResponse);
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
              clearInterval(this.presenceInterval);
              this.presenceInterval = null;
              setTimeout(() => this.connect(), reconnectionDelay);
            }
          }
        }, userListDelay);
        console.log('🚀 Step 10: Connected! Starting presence updates...');
        // Notify user about successful connection
        if (this.isReconnecting) {
          showChatAlert("Chat connected successfully!", { type: 'success' });
          this.isReconnecting = false;
        }
      } catch (error) {
        console.error(`💥 Connection error: ${error.message}`);
        if (!this.isReconnecting) {
          console.log('⏳ Scheduling reconnection attempt in 5 seconds...');
          this.isReconnecting = true;
          setTimeout(() => this.connect(), reconnectionDelay);
        }
      }
    },

    sendMessage(text) {
      if (this.isReconnecting) {
        console.warn('⚠️ Message not sent - reconnection in progress');
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
