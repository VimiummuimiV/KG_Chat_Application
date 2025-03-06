import { userListDelay } from "./definitions.js";
import { privateMessageState } from "./helpers.js";

/**
 * Creates and manages an XMPP client with user and message handling
 * @param {Object} xmppConnection - XMPP connection instance
 * @param {Object} userManager - User manager instance
 * @param {Object} messageManager - Message manager instance
 * @param {string} username - Current username
 * @returns {Object} XMPP client object
 */
export function createXMPPClient(xmppConnection, userManager, messageManager, username) {
  const xmppClient = {
    userManager,
    messageManager,
    async connect() {
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
        userManager.updatePresence(joinResponse);
        messageManager.processMessages(joinResponse);

        const infoPayload = `<body rid='${xmppConnection.nextRid()}' sid='${session.sid}'
                 xmlns='http://jabber.org/protocol/httpbind'>
            <iq type='get' id='info1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru'>
              <query xmlns='http://jabber.org/protocol/disco#info'/>
            </iq>
          </body>`;
        await xmppConnection.sendRequestWithRetry(infoPayload);

        // Start polling for presence and messages.
        setInterval(async () => {
          const xmlResponse = await xmppConnection.sendRequestWithRetry(
            `<body rid='${xmppConnection.nextRid()}' sid='${session.sid}' xmlns='http://jabber.org/protocol/httpbind'/>`
          );
          userManager.updatePresence(xmlResponse);
          messageManager.processMessages(xmlResponse);
        }, userListDelay);

        console.log('🚀 Step 10: Connected! Starting presence updates...');
      } catch (error) {
        console.error(`💥 Error: ${error.message}`);
      }
    },
    sendMessage(text) {
      const messageId = `msg_${Date.now()}`;
      let messageStanza;
      
      // Check if we're in private message mode
      if (privateMessageState.isPrivateMode && privateMessageState.fullJid) {
        // Create a private message stanza
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
          </body>
        `;
        
        // Add message to messageManager with private flag
        messageManager.addSentMessage(text, {
          isPrivate: true,
          recipient: privateMessageState.targetUsername
        });
      } else {
        // Regular group chat message
        messageStanza = `
          <body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'>
            <message to='general@conference.jabber.klavogonki.ru'
                     type='groupchat'
                     id='${messageId}'
                     xmlns='jabber:client'>
              <body>${text}</body>
            </message>
          </body>
        `;
        
        // Add message to messageManager for group chat
        messageManager.addSentMessage(text);
      }
      
      xmppConnection.sendRequestWithRetry(messageStanza)
        .then(response => {
          messageManager.processMessages(response);
        })
        .catch(console.error);
    }
  };

  return xmppClient;
}