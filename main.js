import {
  delay,
  XMPP_BIND_URL
} from "./src/data/definitions.js";
import XMPPConnection from "./src/xmpp/xmppConnection.js";
import UserManager from "./src/managers/userManager.js";
import MessageManager from "./src/managers/messageManager.js";
import { createChatUI } from "./src/chat/chatUI.js";

import {
  setupDragHandlers,
  setupResizeHandlers,
  setupWindowResizeHandler
} from "./src/chat/chatEvents.js";

import { createXMPPClient } from "./src/xmpp/xmppClient.js";
import { config } from "./src/data/definitions.js";

import {
  observeMessagesPanel,
  setupPrivateMessageEvents,
  parseUsername,
  handlePrivateMessageInput,
  addViewportMeta,
  addChatToggleFeature
} from "./src/helpers.js";

import { getAuthData } from "./src/auth.js";
import { HelpPanel } from "./src/components/helpPanel.js";


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
    console.error('Application cannot run in an iframe');
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
  if (!authData || !config.username || !config.password) {
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
    const messageManager = new MessageManager('messages-panel', parseUsername(config.username));
    const xmppConnection = new XMPPConnection({
      username: config.username,
      password: config.password,
      bindUrl: XMPP_BIND_URL,
      delay
    });

    const xmppClient = createXMPPClient(
      xmppConnection,
      userManager,
      messageManager,
      config.username
    );

    // Message sending setup
    const input = document.getElementById('message-input');
    const sendMessage = () => {
      const text = input.value.trim();
      if (!text) return;
      xmppClient.sendMessage(text);
      input.value = ''; // Clear the input field after sending
      input.focus();
    };

    document.getElementById('send-button').addEventListener('click', sendMessage);
    input.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());

    // Set up private messaging events
    setupPrivateMessageEvents();
    // New: Set up help command events (similar to /pm command)
    HelpPanel.setupHelpCommandEvents();

    // Connect to XMPP and join the room
    await xmppClient.connect();
    window.xmppClient = xmppClient; // For debugging

    // Detect /pm username command and activate private mode, and /exit to exit private mode
    input.addEventListener('input', function (event) {
      handlePrivateMessageInput(event.target);
    });
  } catch (error) {
    console.error('App init error:', error);
    localStorage.removeItem('klavoauth');
    window.location.href = 'https://klavogonki.ru/gamelist/';
  }
}

// Start the app
initializeApp();