import "../styles/style.scss"; // main styles
import "../styles/emojiPanel.scss"; // emoji panel styles
import "../styles/helpPanel.scss"; // help panel styles
import "../styles/updateCheck.scss"; // update panel styles
import '../styles/chatUsernameColors.scss'; // chat username colors styles
import "../styles/ignoredUsers.scss"; // ignored users styles
import "../styles/animationKeyframes.scss"; // animation keyframes styles
import "../styles/themesPanel.scss"; // themes panel styles

// URL constants
export const BASE_URL = 'https://klavogonki.ru';
export const GAME_URL = `${BASE_URL}/g/?gmid=`;
export const XMPP_BIND_URL = `${BASE_URL}/xmpp-httpbind/`;

// Sleep time (ms)
export const connectionDelay = 100;
export const reconnectionDelay = 3000;

export const connectionMessages = {
  chat: {
    online: 'Chat connection established. ✓',
    offline: 'Chat connection lost. Reconnecting...'
  },
  network: {
    online: 'Network connection restored. ✓',
    offline: 'Network connection lost.'
  }
};

export const emojiFaces = [
  // People Emojis (Facial expressions)
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆',
  '😉', '😊', '😋', '😎', '😏', '😐', '😑', '😒',
  '😓', '😔', '😕', '😖', '😗', '😘', '😙', '😚',
  '😜', '😝', '😛', '🤑', '🤗', '🤔', '🤐', '🤨',
  '😣', '😥', '😮', '🤯', '😳', '😱', '😨', '😰',
  '😢', '🤪', '😵', '😲', '🤤', '😷', '🤒', '🤕',
  '🤢', '🤧', '😇', '🥳', '🥺', '😬', '😴', '😌',
  '🤥', '🥴', '🥵', '🥶', '🤧', '🤭', '🤫', '😠',
  '😡', '😳', '😞', '😟', '😕',

  // Cat Emojis (Expressive faces of cats)
  '🐱', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',

  // Other Animal Emojis (Various animals' faces)
  '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
  '🙈', '🙉', '🙊', '🐔', '🦄'
];

// List of trusted domains
export const trustedDomains = [
  'klavogonki.ru',
  'youtube.com', // youtube main
  'youtu.be', // youtube share
  'imgur.com',
  'pikabu.ru',
  'userapi.com', // vk.com
  'ibb.co', // imgbb.com
  'yaplakal.com',
  'freepik.com'
];

// Define a single fallback username color for consistency
export const FALLBACK_COLOR = "#1e1e1e";

// Centralized theme variables
export const themeVariables = {
  // Main Background Colors
  '--main-background-color': {
    'light-theme': '#ffffff',
    'light-gray-theme': '#d3d3d3',
    'dark-theme': '#1e1e1e',
  },
  '--secondary-background-color': {
    'light-theme': '#f0f0f0',
    'light-gray-theme': '#e0e0e0',
    'dark-theme': '#2a2a2a',
  },
  '--main-text-color': {
    'light-theme': '#555555',
    'light-gray-theme': '#3e3e3e',
    'dark-theme': '#cdb398',
  },
  '--main-accent-color': {
    'light-theme': '#555555',
    'light-gray-theme': '#3e3e3e',
    'dark-theme': '#cdb398',
  },
  '--secondary-accent-color': {
    'light-theme': '#ff7f50',
    'light-gray-theme': '#ff7f50',
    'dark-theme': '#ffa500',
  },
  '--third-accent-color': {
    'light-theme': '#77b300',
    'light-gray-theme': '#77b300',
    'dark-theme': '#00ff58',
  },
  '--link-color': {
    'light-theme': '#007acc',
    'light-gray-theme': '#005f99',
    'dark-theme': '#82b32a',
  },
  '--link-hover-color': {
    'light-theme': '#005f99',
    'light-gray-theme': '#007acc',
    'dark-theme': '#95cc30',
  },
  '--drag-area-background-color': {
    'light-theme': '#e0e0e0',
    'light-gray-theme': '#c0c0c0',
    'dark-theme': '#161616cc',
  },
  '--scrollbar-thumb-color': {
    'light-theme': '#eaeaea',
    'light-gray-theme': '#bdbdbd',
    'dark-theme': '#333333',
  },
  '--scrollbar-track-color': {
    'light-theme': '#ffffff',
    'light-gray-theme': '#d3d3d3',
    'dark-theme': '#1e1e1e',
  },
  '--border-color': {
    'light-theme': '#eaeaea',
    'light-gray-theme': '#bdbdbd',
    'dark-theme': '#333333',
  },

  // Button Colors
  '--confirm-button-color': {
    'light-theme': '#2e6c30',
    'light-gray-theme': '#2e6c30',
    'dark-theme': '#2e6c30',
  },
  '--confirm-button-hover-color': {
    'light-theme': '#38833c',
    'light-gray-theme': '#38833c',
    'dark-theme': '#38833c',
  },
  '--confirm-button-text-color': {
    'light-theme': '#90ee90',
    'light-gray-theme': '#90ee90',
    'dark-theme': '#90ee90',
  },
  '--yes-button-color': {
    'light-theme': '#5f821f',
    'light-gray-theme': '#5f821f',
    'dark-theme': '#82b32a',
  },
  '--no-button-color': {
    'light-theme': '#b34a2a',
    'light-gray-theme': '#b34a2a',
    'dark-theme': '#b34a2a',
  },
  '--theme-button-color': {
    'light-theme': '#2a75b3',
    'light-gray-theme': '#2a75b3',
    'dark-theme': '#b3a52a',
  },

  // Hotkey Label
  '--hotkey-label-text-color': {
    'light-theme': '#40bfff',
    'light-gray-theme': '#3aa1d5',
    'dark-theme': '#7ed4ff',
  },
  '--hotkey-label-background-color': {
    'light-theme': '#7ed4ff60',
    'light-gray-theme': '#7ed4ff60',
    'dark-theme': '#7ed4ff1a',
  },
  '--hotkey-label-border-color': {
    'light-theme': '#7ed4ff66',
    'light-gray-theme': '#7ed4ff',
    'dark-theme': '#7ed4ff66',
  },

  // Private Mode Input
  '--private-mode-color': {
    'light-theme': '#9b2b2b',
    'light-gray-theme': '#9b2b2b',
    'dark-theme': '#ff6b6b',
  },
  '--private-mode-placeholder-color': {
    'light-theme': '#9b2b2b99',
    'light-gray-theme': '#9b2b2bbb',
    'dark-theme': '#ff6b6bbb',
  },
  '--private-mode-background-color': {
    'light-theme': '#ff6b6b55',
    'light-gray-theme': '#ff6b6b70',
    'dark-theme': '#ff6b6b38',
  },

  // Private Messages Sent
  '--private-message-sent-color': {
    'light-theme': '#228b22',
    'light-gray-theme': '#228b22',
    'dark-theme': '#00d000',
  },
  '--private-message-sent-background-color': {
    'light-theme': '#228b2220',
    'light-gray-theme': '#228b2220',
    'dark-theme': '#00ff0020',
  },
  '--private-message-sent-border-color': {
    'light-theme': '#228b2230',
    'light-gray-theme': '#228b2230',
    'dark-theme': '#00ff0030',
  },
  '--private-message-sent-time-color': {
    'light-theme': '#228b22',
    'light-gray-theme': '#228b22',
    'dark-theme': '#00ff0060',
  },

  // Private Messages Received
  '--private-message-received-color': {
    'light-theme': '#b22222',
    'light-gray-theme': '#b22222',
    'dark-theme': '#ff4d4d',
  },
  '--private-message-received-background-color': {
    'light-theme': '#b2222220',
    'light-gray-theme': '#b2222220',
    'dark-theme': '#ff4d4d20',
  },
  '--private-message-received-border-color': {
    'light-theme': '#b2222230',
    'light-gray-theme': '#b2222230',
    'dark-theme': '#ff4d4d30',
  },
  '--private-message-received-time-color': {
    'light-theme': '#b22222',
    'light-gray-theme': '#b22222',
    'dark-theme': '#ff4d4d60',
  },

  // System Messages
  '--system-message-color': {
    'light-theme': '#d2691e',
    'light-gray-theme': '#d2691e',
    'dark-theme': '#ffa500',
  },
  '--system-message-background-color': {
    'light-theme': '#d2691e20',
    'light-gray-theme': '#d2691e20',
    'dark-theme': '#ffa50020',
  },
  '--system-message-border-color': {
    'light-theme': '#d2691e30',
    'light-gray-theme': '#d2691e30',
    'dark-theme': '#ffa60030',
  },
  '--system-message-time-color': {
    'light-theme': '#d2691e',
    'light-gray-theme': '#d2691e',
    'dark-theme': '#ffa50060',
  },
};
