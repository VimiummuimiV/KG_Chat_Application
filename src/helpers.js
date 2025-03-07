import { convertImageLinksToImage } from "./converters/image-converter.js";
import { convertVideoLinksToPlayer } from "./converters/video-converter.js";
import { emojiFaces, trustedDomains } from "./definitions.js";
import { state } from "./definitions.js";
import { openSVG, closeSVG } from "./icons.js";

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

// Color generation factory
function colorGenerator(config) {
  return {
    hueMap: {},
    hueStep: config.hueStep || 30,
    maxHue: config.maxHue || 360,
    saturation: config.saturation || '80%',
    lightness: config.lightness || '50%',

    getColor(key) {
      let hue = this.hueMap[key];
      if (!hue) {
        const maxSteps = this.maxHue / this.hueStep;
        hue = Math.floor(Math.random() * maxSteps) * this.hueStep;
        this.hueMap[key] = hue;
      }
      return `hsl(${hue}, ${this.saturation}, ${this.lightness})`;
    }
  };
}

export const usernameColors = colorGenerator({
  maxHue: 210,
  hueStep: 30,
  saturation: '80%',
  lightness: '50%'
});

export const mentionColors = colorGenerator({
  maxHue: 210,
  hueStep: 30,
  saturation: '80%',
  lightness: '50%'
});

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
  const wrapper = document.querySelector('#app-chat-container .chat-wrapper');
  if (!wrapper) return;

  const chatContainer = document.querySelector('#app-chat-container');
  const isNarrow = wrapper.offsetWidth <= 780;
  const isMaximized = chatContainer.classList.contains('maximized');

  const userList = document.querySelector('#app-chat-container .user-list-container');
  if (userList) {
    userList.style.display = (isNarrow && !isMaximized) ? 'none' : '';
  }

  document.querySelectorAll('#app-chat-container .message').forEach(msg => {
    msg.style.flexDirection = (isNarrow && !isMaximized) ? 'column' : 'row';
    msg.style.marginBottom = (isNarrow && !isMaximized) ? '1em' : '0';
  });
}

export function observeMessagesPanel() {
  const messagesPanel = document.getElementById('messages-panel');
  if (!messagesPanel) return;

  const observer = new MutationObserver(() => {
    handleElementsBehavior();
    convertVideoLinksToPlayer();
    convertImageLinksToImage();
    scrollToBottom();
  });

  observer.observe(messagesPanel, { childList: true, subtree: true });
}

export function restoreChatState() {
  const chat = document.getElementById('app-chat-container');
  const toggleButton = document.querySelector('.chat-toggle-button');
  if (!chat || !toggleButton) return;

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
    chat.style.display = state.isVisible ? 'flex' : 'none';
    chat.style.opacity = state.isVisible ? '1' : '0';
    toggleButton.innerHTML = state.isVisible ? closeSVG : openSVG;
  } else {
    chat.style.bottom = '0';
    chat.style.top = '';
    chat.classList.remove("floating-chat");
    chat.classList.remove('visible-chat', 'hidden-chat');
    chat.classList.add(state.isVisible ? 'visible-chat' : 'hidden-chat');
    toggleButton.innerHTML = state.isVisible ? closeSVG : openSVG;
  }

  handleElementsBehavior();
}

// 1. Update helpers.js to include the font size in the getChatState function

// In getChatState() function in helpers.js
export function getChatState() {
  const savedState = localStorage.getItem('chatState');
  const defaultState = {
    height: 300,
    width: Math.min(window.innerWidth, 600),
    left: 0,
    floating: false,
    top: window.innerHeight - 300,
    isVisible: true,
    fontSizeMultiplier: 1.0 // Add the new default font size multiplier
  };

  return savedState ? { ...defaultState, ...JSON.parse(savedState) } : defaultState;
}

// 2. Add a function to apply font size changes
export function applyFontSize(multiplier) {
  const chatContainer = document.getElementById('app-chat-container');
  const messageInput = document.getElementById('message-input');
  if (!chatContainer) return;

  // Apply font size to the main container
  chatContainer.style.fontSize = `${multiplier}em`;

  // Apply base font size to message input without multiplier
  // since it inherits the multiplier from the container
  if (messageInput) {
    messageInput.style.fontSize = '1em';
  }

  // Save the current multiplier in the chat state
  const chatState = getChatState();
  saveChatState({
    ...chatState,
    fontSizeMultiplier: multiplier
  });
}

// 3. Add a function to restore font size from state on initialization
export function restoreFontSize() {
  const chatState = getChatState();
  applyFontSize(chatState.fontSizeMultiplier);
}

// 4. Function to create the font size slider
export function createFontSizeControl() {
  const chatContainer = document.getElementById('app-chat-container');
  if (!chatContainer) return;

  const chatState = getChatState();

  // Create font size control container
  const fontSizeControl = document.createElement('div');
  fontSizeControl.className = 'font-size-control';

  // Create the slider
  const fontSlider = document.createElement('input');
  fontSlider.type = 'range';
  fontSlider.min = '0.8';
  fontSlider.max = '1.5';
  fontSlider.step = '0.1';
  fontSlider.value = chatState.fontSizeMultiplier;
  fontSlider.className = 'font-size-slider';

  // Prevent dragging the chat when interacting with the slider
  fontSlider.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  // Update font size on input change
  fontSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    applyFontSize(value);
  });

  // Append the slider to the control container
  fontSizeControl.appendChild(fontSlider);

  // Add the control container to the chat drag area
  const dragArea = document.querySelector('.chat-drag-area');
  if (dragArea) {
    dragArea.appendChild(fontSizeControl);
  }
}

export function saveChatState(state) {
  localStorage.setItem('chatState', JSON.stringify(state));
}

export const parseMessageText = text => text
  // Convert URLs to clickable links
  .replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>')
  
  // Handle :emoji: syntax with specific images
  .replace(/:(\w+):/g, (m, e) => `<img src="https://klavogonki.ru/img/smilies/${e}.gif" alt="${e}" />`)
  
  // Wrap all emoji characters in spans with the emoji-adjuster class
  .replace(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu, '<span class="emoji-adjuster">$&</span>');

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function parseUsername(username) {
  if (typeof username !== 'string') return username;
  return username.replace(/^\d+#/, '');
}

export function addBigImageEventListeners() {
  Object.entries(state.bigImageEvents).forEach(([event, handler]) => {
    document.addEventListener(event, handler);
  });
}

export function removeBigImageEventListeners() {
  Object.entries(state.bigImageEvents).forEach(([event, handler]) => {
    document.removeEventListener(event, handler);
  });
}

export function adjustVisibility(element, action, opacity) {
  if (!element) return;

  void element.offsetHeight;
  element.style.transition = 'opacity 0.3s';
  element.style.opacity = action === 'show' ? opacity : '0';

  if (action === 'hide') {
    element.addEventListener('transitionend', () => {
      if (element.style.opacity === '0') element.remove();
    }, { once: true });
  }
}

export const isTrustedDomain = url => {
  try {
    const { hostname } = new URL(url);
    const domain = hostname.toLowerCase().split('.').slice(-2).join('.');
    return { isTrusted: trustedDomains.includes(domain), domain };
  } catch (err) {
    console.error("Error in isTrustedDomain:", err.message);
    return { isTrusted: false, domain: url };
  }
};

export function isEncodedURL(url) {
  const urlPattern = /^https?:\/\//;
  const encodedPattern = /%[0-9A-Fa-f]{2}/;
  return urlPattern.test(url) && encodedPattern.test(url);
}

export function decodeURL(url) {
  const [base] = url.split('#');
  return decodeURIComponent(base).replace(/ /g, '_');
}

export function highlightMentionWords() {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  const storedKeywords = localStorage.getItem('mentionKeywords');
  if (!storedKeywords) return;

  let mentionKeywords;
  try {
    mentionKeywords = JSON.parse(storedKeywords);
    if (!Array.isArray(mentionKeywords)) return;
  } catch (e) {
    return;
  }

  const globalProcessed = new WeakSet();
  const messages = container.querySelectorAll('.message-text');

  messages.forEach((message) => {
    const walker = document.createTreeWalker(
      message,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (globalProcessed.has(node)) return NodeFilter.FILTER_SKIP;
          const parent = node.parentElement;
          if (parent.closest('.mention, .time, .username')) {
            return NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) nodes.push(currentNode);

    nodes.forEach((node) => {
      if (!globalProcessed.has(node)) {
        processNode(node, mentionKeywords);
        globalProcessed.add(node);
      }
    });
  });

  function processNode(node, keywords) {
    const regex = /(@?[\wа-яА-ЯёЁ'-]+)|[\s]+|[^@\s\wа-яА-ЯёЁ'-]+/gu;
    const tokens = node.textContent.match(regex) || [];

    const fragment = document.createDocumentFragment();

    tokens.forEach(token => {
      const isMatch = keywords.some(keyword =>
        keyword.localeCompare(token, undefined, { sensitivity: 'accent' }) === 0
      );

      if (isMatch) {
        const mentionSpan = document.createElement('span');
        mentionSpan.className = 'mention';
        token.split('').forEach(char => {
          const charSpan = document.createElement('span');
          charSpan.style.color = mentionColors.getColor(char);
          charSpan.textContent = char;
          mentionSpan.appendChild(charSpan);
        });
        fragment.appendChild(mentionSpan);
      } else {
        fragment.appendChild(document.createTextNode(token));
      }
    });

    node.parentNode.replaceChild(fragment, node);
  }
}

let firstTime = true;
const scrollThreshold = 600;

export function scrollToBottom() {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  if (firstTime) {
    container.scrollTop = container.scrollHeight;
    firstTime = false;
  } else {
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom <= scrollThreshold) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

export function showChatAlert(message, options = {}) {
  const dragArea = document.querySelector('.chat-drag-area');
  if (!dragArea) return;

  const existingAlert = dragArea.querySelector('.chat-dynamic-alert');
  if (existingAlert) {
    dragArea.removeChild(existingAlert);
  }

  const defaultOptions = { type: 'info', duration: 3000 };
  const settings = { ...defaultOptions, ...options };

  const colorMap = {
    info: '#2196F3',
    warning: '#FF9800',
    error: '#F44336',
    success: '#4CAF50'
  };

  const alertElement = document.createElement('div');
  alertElement.className = 'chat-dynamic-alert';
  alertElement.innerHTML = message;

  alertElement.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: ${colorMap[settings.type] || colorMap.info};
    padding: 5px 10px;
    border-radius: 3px;
    z-index: 1000;
    font-family: Roboto, Montserrat;
    font-size: 10px;
    font-weight: normal;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    opacity: 0;
  `;

  dragArea.appendChild(alertElement);

  function animateAlert() {
    requestAnimationFrame(() => {
      alertElement.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
      alertElement.style.opacity = '1';
      alertElement.style.transform = 'translate(-50%, -50%)';

      setTimeout(() => {
        alertElement.style.transition = 'transform 0.05s ease-in-out';
        const shakeSequence = [
          { x: 5, delay: 0 },
          { x: -7, delay: 50 },
          { x: 9, delay: 100 },
          { x: -6, delay: 150 },
          { x: 4, delay: 200 },
          { x: -3, delay: 250 },
          { x: 0, delay: 300 }
        ];

        shakeSequence.forEach((move) => {
          setTimeout(() => {
            alertElement.style.transform = `translate(calc(-50% + ${move.x}px), -50%)`;
          }, move.delay);
        });
      }, 300);

      setTimeout(() => {
        alertElement.style.transition = 'opacity 0.3s ease-in-out';
        alertElement.style.opacity = '0';
        setTimeout(() => {
          dragArea.removeChild(alertElement);
        }, 300);
      }, settings.duration);
    });
  }

  animateAlert();
}

export function focusTextInput() {
  const chatContainer = document.getElementById('app-chat-container');
  const element = document.getElementById('message-input');
  if (element && chatContainer && chatContainer.style.display !== 'none') {
    element.focus();
    return true;
  }
  return false;
}

// Helper to fetch JSON and validate response
export async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
}

// Helper function to get Exact user ID by username via the search API
export async function getExactUserIdByName(userName) {
  // Define the search API URL
  const searchApiUrl = `https://klavogonki.ru/api/profile/search-users?query=${encodeURIComponent(userName)}`;

  try {
    // Get search results from the API
    const searchResults = await fetchJSON(searchApiUrl);

    // Ensure search results exist and contain data
    if (!searchResults.all?.length) {
      throw new Error(`User ${userName} not found.`);
    }

    // Return the ID of the user with the exact matching login
    const user = searchResults.all.find(user => user.login === userName);
    if (!user) {
      throw new Error(`Exact match for user ${userName} not found.`);
    }

    return user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    showChatAlert(`Could not find user "${userName}"`, { type: 'error', duration: 5000 });
    return null;
  }
}

// Function to extract target username from message input
export function extractTargetUsername(input) {
  const match = input.match(/<([^>]+)>/);
  return match ? match[1] : null;
}

// State management for private messaging
export const privateMessageState = {
  isPrivateMode: false,
  targetUsername: null,
  targetId: null,
  fullJid: null,

  async setPrivateTarget(username) {
    if (!username) {
      this.exitPrivateMode();
      return false;
    }

    try {
      const userId = await getExactUserIdByName(username);
      if (!userId) return false;

      this.isPrivateMode = true;
      this.targetUsername = username;
      this.targetId = userId;
      this.fullJid = `${userId}#${username}@jabber.klavogonki.ru/web`;

      return true;
    } catch (error) {
      console.error('Error setting private target:', error);
      return false;
    }
  },

  exitPrivateMode() {
    this.isPrivateMode = false;
    this.targetUsername = null;
    this.targetId = null;
    this.fullJid = null;
  }
};

// Toggle private message mode based on input value
export async function handlePrivateMessageInput(inputElement) {
  if (!inputElement) return;

  const input = inputElement.value;
  const privateModeRegex = /^\/pm\s+([\wа-яА-ЯёЁ]+)\s/;
  const exitPrivateModeRegex = /^\/exit\s*$/;
  const match = input.match(privateModeRegex);

  if (match) {
    const username = match[1];
    const success = await privateMessageState.setPrivateTarget(username);

    if (success) {
      enterPrivateMode(username);
      inputElement.value = input.replace(privateModeRegex, ''); // Remove the /pm username part
    } else {
      showChatAlert(`Could not find user "${username}"`, { type: 'error', duration: 3000 });
      exitPrivateMode();
    }
  } else if (exitPrivateModeRegex.test(input)) {
    exitPrivateMode();
    inputElement.value = ''; // Clear the input
  }
}

export function enterPrivateMode(username) {
  const messageInput = document.getElementById('message-input');
  if (privateMessageState.isPrivateMode && privateMessageState.targetUsername !== username) {
    exitPrivateMode();
  }
  if (!messageInput.classList.contains('private-mode') || privateMessageState.targetUsername !== username) {
    messageInput.classList.add('private-mode');
    messageInput.placeholder = `PM to ➡ ${username}`;
    showChatAlert(`Private chat with ${username} activated`, { type: 'warning', duration: 3000 });
    privateMessageState.isPrivateMode = true;
    privateMessageState.targetUsername = username;
  } else if (privateMessageState.targetUsername === username) {
    messageInput.placeholder = `️PM to ➡ ${username}`;
    showChatAlert(`Private chat with ${username} activated`, { type: 'warning', duration: 3000 });
  }
}

export function exitPrivateMode() {
  const messageInput = document.getElementById('message-input');
  if (messageInput.classList.contains('private-mode')) {
    messageInput.classList.remove('private-mode');
    messageInput.placeholder = ''; // Reset placeholder
    privateMessageState.exitPrivateMode();
    showChatAlert('Exited private chat mode', { type: 'success', duration: 3000 });
  }
}

// Handle ESC key to exit private mode
export function setupPrivateMessageEvents() {
  const input = document.getElementById('message-input');
  if (!input) return;

  // Add ESC key handler to exit private mode
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && privateMessageState.isPrivateMode) {
      exitPrivateMode();
      e.preventDefault();
    }
  });

  // Check for private message mode on input changes
  input.addEventListener('input', () => {
    handlePrivateMessageInput(input);
  });
}