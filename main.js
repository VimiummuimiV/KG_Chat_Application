import { closeSVG, openSVG, sendSVG } from "./src/icons.js"; // icons
import {
  delay,
  username,
  password,
  emojiFaces,
  BASE_URL,
  GAME_URL,
  XMPP_BIND_URL,
  userListDelay
} from "./src/definitions.js"; // definitions

import XMPPConnection from './src/xmppConnection.js';
import UserManager from './src/userManager.js';
import MessageManager from './src/messageManager.js';
import { handleElementsBehavior, restoreChatState } from "./src/helpers.js";
import { createChatUI } from "./src/chatUI.js";
import { addChatToggleFeature } from "./src/chatFeatures.js";
import { setupDragHandlers, setupResizeHandlers, setupWindowResizeHandler } from './src/events.js';
import { loadChatHistory } from './src/storage.js';
import { createXMPPClient } from './src/xmppClient.js';

// ------------------------- Main Application Initialization -------------------------

function initializeApp() {
  // Create the chat UI
  createChatUI();
  addChatToggleFeature();

  // Set up event handlers
  setupDragHandlers();
  setupResizeHandlers();
  setupWindowResizeHandler();

  // Instantiate managers now that the chat UI is in the DOM.
  const userManager = new UserManager('user-list');
  const messageManager = new MessageManager('messages-panel', username);

  // Create an instance of our XMPP connection.
  const xmppConnection = new XMPPConnection({
    username,
    password,
    bindUrl: XMPP_BIND_URL,
    delay
  });

  // Create our overall XMPP client object.
  const xmppClient = createXMPPClient(xmppConnection, userManager, messageManager, username);

  // Load persisted messages and update the messages panel.
  const persistedMessages = loadChatHistory();
  console.log('Loaded persisted messages:', persistedMessages);
  messageManager.messages = persistedMessages;
  messageManager.updatePanel();

  // Set up the send form events.
  const input = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');

  function sendMessage() {
    const text = input.value.trim();
    if (text) {
      xmppClient.sendMessage(text);
      input.value = '';
    }
  }

  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Start the XMPP connection.
  xmppClient.connect();

  // Optionally, expose xmppClient for debugging.
  window.xmppClient = xmppClient;
}

// Initialize the application when the DOM is fully loaded
initializeApp();