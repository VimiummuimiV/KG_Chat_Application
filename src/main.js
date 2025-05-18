import {
  settings,
  XMPP_BIND_URL
} from "./data/definitions.js";

import XMPPConnection from "./xmpp/xmppConnection.js";
import UserManager from "./managers/userManager.js";
import MessageManager from "./managers/messageManager.js";
import { createChatUI } from "./chat/chatUI.js";
import { removeChatParams } from "./auth.js";
import { getAuthData } from "./auth.js";
import { checkForUpdates } from "./components/updateCheck.js";
import { setupCommandEvents } from "./helpers/commands.js";
import { pruneDeletedMessages } from "./chat/chatMessagesRemover.js";

import {
  setupDragHandlers,
  setupResizeHandlers,
  setupWindowResizeHandler
} from "./chat/chatEvents.js";

import { createXMPPClient } from "./xmpp/xmppClient.js";
import { klavoauth } from "./auth.js";

import {
  observeMessagesPanel,
  parseUsername,
  addViewportMeta,
  decodeEncodedURL,
  logMessage
} from "./helpers/helpers.js";

import { addChatToggleFeature } from "../src/chat/chatState.js"
import { setupPrivateMessageEvents } from "./helpers/privateMessagesHandler.js";

// Function to detect if running in an iframe
function isInIframe() {
  try {
    return window !== window.top;
  } catch (e) {
    // If there's an error when trying to access window.top, 
    // it's likely due to cross-origin restrictions, which means we're in an iframe
    return true;
  }
}

// ------------------------- Auth Check ---------------------------
function checkAuth() {
  // First check if running in iframe
  if (isInIframe()) {
    logMessage("Application cannot run in an iframe", 'error');
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  if (window.location.pathname === '/g/' && params.has('gmid')) {
    return false;
  }
  if (window.location.href.includes('/gamelist/')) {
    getAuthData();
    return false;
  }
  const authData = localStorage.getItem('klavoauth');
  if (!authData || !klavoauth.username || !klavoauth.password) {
    localStorage.removeItem('klavoauth');
    window.location.href = 'https://klavogonki.ru/gamelist/';
    return false;
  }
  return true;
}

// ------------------------- Main App ---------------------------
async function initializeApp() {
  try {
    // Add viewport meta tag
    addViewportMeta();

    if (!checkAuth()) return;

    // Initialize UI and features
    createChatUI();
    addChatToggleFeature();
    setupDragHandlers();
    setupResizeHandlers();
    setupWindowResizeHandler();

    // Set up the messages panel observer
    observeMessagesPanel();

    // Initialize managers and XMPP connection
    const userManager = new UserManager('user-list');
    const messageManager = new MessageManager('messages-panel', parseUsername(klavoauth.username));
    const xmppConnection = new XMPPConnection({
      username: klavoauth.username,
      password: klavoauth.password,
      bindUrl: XMPP_BIND_URL,
      connectionDelay: settings.connectionDelay
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