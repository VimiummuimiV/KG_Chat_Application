import { emojiFaces } from "./definitions.js";

export const getAuthData = () => {
  const pageData = JSON.parse([...document.scripts]
    .find(s => s.text.includes('PageData'))
    ?.text.match(/\.constant\('PageData', ({[\s\S]*?})\)/)?.[1]
    .replace(/(\w+):/g, '"$1":').replace(/'/g, '"') || '{}');

  return pageData?.chatParams && {
    username: `${pageData.chatParams.user.id}#${pageData.chatParams.user.login}`,
    password: pageData.chatParams.pass
  };
};

// Color generation utilities
export const colorHelpers = {
  // Store username to color hue mapping
  usernameHueMap: {},
  hueStep: 30,

  // Generate a consistent color for a username
  getUsernameColor(username) {
    // Check if the hue for this username is already stored
    let hueForUsername = this.usernameHueMap[username];

    // If the hue is not stored, generate a new random hue with the specified step
    if (!hueForUsername) {
      hueForUsername = Math.floor(Math.random() * (210 / this.hueStep)) * this.hueStep; // Limit hue to a maximum of 210
      // Store the generated hue for this username
      this.usernameHueMap[username] = hueForUsername;
    }

    return `hsl(${hueForUsername}, 80%, 50%)`;
  }
};

// Avatar utilities
let lastEmojiAvatar = null;
export function getRandomEmojiAvatar() {
  let newEmoji;
  do {
    newEmoji = emojiFaces[Math.floor(Math.random() * emojiFaces.length)];
  } while (newEmoji === lastEmojiAvatar);
  lastEmojiAvatar = newEmoji;
  return newEmoji;
}

export function handleElementsBehavior() {
  const wrapper = document.querySelector('#chat-container .chat-wrapper');
  if (!wrapper) return;

  const isNarrow = wrapper.offsetWidth <= 750;
  const userList = document.querySelector('#chat-container .user-list-container');
  if (userList) userList.style.display = isNarrow ? 'none' : '';

  document.querySelectorAll('#chat-container .message').forEach(msg => {
    msg.style.flexDirection = isNarrow ? 'column' : 'row';
    msg.style.marginBottom = isNarrow ? '1em' : '0';
  });
}

// Observe DOM changes in #messages-panel
export function observeMessagesPanel() {
  const messagesPanel = document.getElementById('messages-panel');
  if (!messagesPanel) return;

  const observer = new MutationObserver(() => {
    handleElementsBehavior();
    scrollToBottom()
  });

  observer.observe(messagesPanel, { childList: true, subtree: true });
}

export function restoreChatState() {
  const chat = document.getElementById('chat-container');
  const state = getChatState();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const computedStyle = getComputedStyle(document.documentElement);
  const minWidth = parseInt(computedStyle.getPropertyValue('--min-chat-width')) || 250;
  const minHeight = parseInt(computedStyle.getPropertyValue('--min-chat-height')) || 200;

  chat.style.width = Math.min(viewportWidth, Math.max(minWidth, state.width)) + 'px';
  chat.style.height = Math.min(viewportHeight, Math.max(minHeight, state.height)) + 'px';
  chat.style.left = clamp(state.left, 0, viewportWidth - chat.offsetWidth) + 'px';

  if (state.floating) {
    chat.style.top = clamp(state.top, 0, viewportHeight - chat.offsetHeight) + 'px';
    chat.style.bottom = '';
    chat.classList.add("floating-chat");
  } else {
    chat.style.bottom = '0';
    chat.style.top = '';
    chat.classList.remove("floating-chat");
  }
  handleElementsBehavior();
}

export function getChatState() {
  const savedState = localStorage.getItem('chatState');
  return savedState ? JSON.parse(savedState) : {
    height: 300,
    width: Math.min(window.innerWidth, 600),
    left: 0,
    floating: false,
    top: window.innerHeight - 300
  };
}

export function saveChatState(state) {
  localStorage.setItem('chatState', JSON.stringify(state));
}

export const parseMessageText = text =>
  text
    .replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>')
    .replace(/:(\w+):/g, (m, e) => `<img src="https://klavogonki.ru/img/smilies/${e}.gif" alt="${e}" />`);

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Cleans a username string by removing a numeric prefix and the '#' symbol.
// For example: "12345#JohnDoe" becomes "JohnDoe".
export function parseUsername(username) {
  if (typeof username !== 'string') return username;
  // This regex finds a sequence of digits followed by a '#' at the start of the string
  return username.replace(/^\d+#/, '');
}


export function scrollToBottom() {
  const messagesPanel = document.getElementById('messages-panel');
  if (messagesPanel) {
    messagesPanel.scrollTop = messagesPanel.scrollHeight;
  }
}