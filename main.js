import {
  delay,
  XMPP_BIND_URL,
} from "./src/definitions.js"; // definitions

import XMPPConnection from './src/xmppConnection.js';
import UserManager from './src/userManager.js';
import MessageManager from './src/messageManager.js';
import { createChatUI } from "./src/chatUI.js";
import { addChatToggleFeature } from "./src/chatFeatures.js";
import { setupDragHandlers, setupResizeHandlers, setupWindowResizeHandler } from './src/events.js';
import { createXMPPClient } from './src/xmppClient.js';
import { config } from "./src/definitions.js";
import { observeMessagesPanel } from "./src/helpers.js";
import { getAuthData } from "./src/auth.js";

// ------------------------- Auth Check ---------------------------
// Ensure checkAuth() clears invalid credentials and redirects
function checkAuth() {
  getAuthData();
  if (window.location.href.includes('/gamelist/')) return false;

  if (!config.username || !config.password) {
    localStorage.removeItem('klavoauth'); // Uncommented to clear stale data
    window.location.href = 'https://klavogonki.ru/gamelist/';
    return false;
  }
  return true;
}

// ------------------------- Main App ---------------------------
async function initializeApp() {
  try {
    if (!checkAuth()) return;

    // Initialize UI and features
    createChatUI();
    addChatToggleFeature();
    setupDragHandlers();
    setupResizeHandlers();
    setupWindowResizeHandler();

    const userManager = new UserManager('user-list');
    const messageManager = new MessageManager('messages-panel', config.username);

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
      if (text) {
        xmppClient.sendMessage(text);
        input.value = '';
        input.focus();
      }
    };

    document.getElementById('send-button').addEventListener('click', sendMessage);
    input.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());

    // Connect to XMPP and join the room first
    await xmppClient.connect();

    // Since we're not using localStorage, we don't load previous messages

    window.xmppClient = xmppClient; // For debugging

  } catch (error) {
    console.error('App init error:', error);
    localStorage.removeItem('klavoauth');
    window.location.href = 'https://klavogonki.ru/gamelist/';
  }
}

// Start the app only if NOT on gamelist page
initializeApp();

// Initialize the observer when the script loads
observeMessagesPanel();
