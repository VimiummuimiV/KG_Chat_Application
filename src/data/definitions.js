import "../styles/style.scss"; // main styles
import "../styles/emojiPanel.scss"; // emoji panel styles
import "../styles/helpPanel.scss"; // help panel styles
import "../styles/updateCheck.scss"; // update panel styles
import '../styles/chatUsernameColors.scss'; // chat username colors styles
import "../styles/ignoredUsers.scss"; // ignored users styles
import "../styles/animationKeyframes.scss"; // animation keyframes styles
import "../styles/themesPanel.scss"; // themes panel styles
import "../styles/eventsPanel.scss"; // events panel styles

// URL constants
export const BASE_URL = 'https://klavogonki.ru';
export const GAME_URL = `${BASE_URL}/g/?gmid=`;
export const XMPP_BIND_URL = `${BASE_URL}/xmpp-httpbind/`;

export const settings = {
  connectionDelay: 100,
  reconnectionDelay: 3000,
  pendingUserDelay: 500,
  longPressDuration: 300,
  clearSelectionDelay: 500,
  revealUserListDelay: 150,
  themePreviewDelay: 150,
  showAlertDuration: 2000,
  pingInterval: 10000,
  deduplicationDelay: 2000
};

export const connectionMessages = {
  chat: {
    online: 'Chat connection established.',
    offline: 'Chat connection lost.'
  },
  network: {
    online: 'Network connection restored.',
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
  'freepik.com',
  'fastpic.org'
];

// Define a single fallback username color for consistency
export const FALLBACK_COLOR = "#1e1e1e";

export const loadUsernameColorsUrl = "https://raw.githubusercontent.com/VimiummuimiV/KG_Chat_Application/refs/heads/main/src/data/usernameColors.json";

// Define a color map for the chat alerts
export const eventsColorMap = {
  info: '#2196F3',
  warning: '#FF9800',
  error: '#F44336',
  success: '#4CAF50'
};
