import XMPPConnection from "./xmpp/xmppConnection.js";
import UserManager from "./managers/userManager.js";
import MessageManager from "./managers/messageManager.js";
import { createChatUI } from "./chat/chatUI.js";
import { removeChatParams, checkAuth, klavoauth } from "./auth.js";
import { checkForUpdates } from "./components/updateCheck.js";
import { setupCommandEvents } from "./helpers/commands.js";
import { pruneDeletedMessages } from "./chat/chatMessagesRemover.js";

import {
  setupDragHandlers,
  setupResizeHandlers,
  setupWindowResizeHandler
} from "./chat/chatEvents.js";

import { createXMPPClient } from "./xmpp/xmppClient.js";

import {
  observeMessagesPanel,
  parseUsername,
  addViewportMeta,
  decodeEncodedURL,
  logMessage
} from "./helpers/helpers.js";

import { addChatToggleFeature } from "../src/chat/chatState.js"
import { setupPrivateMessageEvents } from "./helpers/privateMessagesHandler.js";
import { createExtraToggleButton } from "../src/chat/chatState.js";

// ------------------------- Main App ---------------------------
async function initializeApp() {
  try {
    // Add viewport meta tag
    addViewportMeta();

    if (!checkAuth()) return;

    // Initialize UI and features
    createChatUI();
    addChatToggleFeature();
    createExtraToggleButton();
    setupDragHandlers();
    setupResizeHandlers();
    setupWindowResizeHandler();

    // Set up the messages panel observer
    observeMessagesPanel();

    // Initialize managers and XMPP connection
    const userManager = new UserManager('user-list');
    window.userManager = userManager; // Make userManager globally accessible
    const messageManager = new MessageManager('messages-panel', parseUsername(klavoauth.username));
    window.messageManager = messageManager; // Make messageManager globally accessible
    const xmppConnection = new XMPPConnection({
      username: klavoauth.username,
      password: klavoauth.password
    });

    const xmppClient = createXMPPClient(
      xmppConnection,
      userManager,
      messageManager,
      klavoauth.username
    );

    const input = document.getElementById('message-input');

    const sendMessage = () => {
      const text = input.value.trim();
      if (!text) return;
      xmppClient.sendMessage(text);
      input.value = '';
      input.focus();
    };

    // Set up event listeners
    document.getElementById('send-button').addEventListener('click', sendMessage);
    input.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());
    input.addEventListener('paste', e => requestAnimationFrame(() => input.value = decodeEncodedURL(input.value)));

    // Set up private messaging events
    setupPrivateMessageEvents(input);
    // Set up reset command event
    setupCommandEvents(input);

    // Connect to XMPP and join the room
    await xmppClient.connect();
    window.xmppClient = xmppClient; // For debugging

  } catch (error) {
    logMessage(`App initialization error: ${error.message}`, 'error');
    removeChatParams();
  }
}

// Start the app and perform initial operations
initializeApp().then(() => {
  pruneDeletedMessages(); // Remove unexisting deleted messages IDs from localStorage
  checkForUpdates(); // Check for updates on page load
});