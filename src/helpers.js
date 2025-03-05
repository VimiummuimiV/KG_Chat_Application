import { convertImageLinksToImage } from "./converters/image-converter.js";
import { convertVideoLinksToPlayer } from "./converters/video-converter.js";
import { emojiFaces, trustedDomains } from "./definitions.js";
import { state } from "./definitions.js";
import { openSVG, closeSVG } from "./icons.js"

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

// Specific color generators
export const usernameColors = colorGenerator({
  maxHue: 210, // Cooler colors for usernames
  hueStep: 30,
  saturation: '80%',
  lightness: '50%'
});

export const mentionColors = colorGenerator({
  maxHue: 210, // Full spectrum for mentions
  hueStep: 30, // More color variation
  saturation: '80%',
  lightness: '50%'
});

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
  const wrapper = document.querySelector('#app-chat-container .chat-wrapper');
  if (!wrapper) return;

  const isNarrow = wrapper.offsetWidth <= 780;
  const userList = document.querySelector('#app-chat-container .user-list-container');
  if (userList) userList.style.display = isNarrow ? 'none' : '';

  document.querySelectorAll('#app-chat-container .message').forEach(msg => {
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
    convertVideoLinksToPlayer();
    convertImageLinksToImage();
    scrollToBottom()
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
    // For floating chat, manage display based on isVisible
    chat.style.display = state.isVisible ? 'flex' : 'none';
    chat.style.opacity = state.isVisible ? '1' : '0';
    
    // Update toggle button SVG for floating chat
    toggleButton.innerHTML = state.isVisible ? closeSVG : openSVG;
  } else {
    chat.style.bottom = '0';
    chat.style.top = '';
    chat.classList.remove("floating-chat");
    // Explicitly remove both classes first, then add the correct one
    chat.classList.remove('visible-chat', 'hidden-chat');
    chat.classList.add(state.isVisible ? 'visible-chat' : 'hidden-chat');
    
    // Update toggle button SVG for non-floating chat
    toggleButton.innerHTML = state.isVisible ? closeSVG : openSVG;
  }

  handleElementsBehavior();
}

export function getChatState() {
  const savedState = localStorage.getItem('chatState');
  const defaultState = {
    height: 300,
    width: Math.min(window.innerWidth, 600),
    left: 0,
    floating: false,
    top: window.innerHeight - 300,
    isVisible: true  // Add this to persist visibility state
  };
  
  return savedState ? { ...defaultState, ...JSON.parse(savedState) } : defaultState;
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

// Adjust element visibility with smooth opacity transition
export function adjustVisibility(element, action, opacity) {
  if (!element) return; // Exit if element doesn't exist

  // Force reflow to ensure initial state is recognized
  void element.offsetHeight;

  element.style.transition = 'opacity 0.3s'; // Apply smooth transition for both show and hide
  element.style.opacity = action === 'show' ? opacity : '0'; // Set target opacity

  // If hiding, wait for transition to finish before removing the element
  if (action === 'hide') {
    element.addEventListener(
      'transitionend',
      () => {
        if (element.style.opacity === '0') element.remove();
      },
      { once: true }
    );
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

// Function to check if a URL is valid and contains encoded characters
export function isEncodedURL(url) {
  const urlPattern = /^https?:\/\//; // Regex pattern to check if the value is a URL
  const encodedPattern = /%[0-9A-Fa-f]{2}/; // Regex pattern to check if the URL is encoded
  return urlPattern.test(url) && encodedPattern.test(url);
}

// Function to decode a URL and replace spaces with underscores
export function decodeURL(url) {
  const [base] = url.split('#'); // Split at the '#' symbol and take the base part
  return decodeURIComponent(base).replace(/ /g, '_'); // Decode and replace spaces with underscores
}

export function highlightMentionWords() {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  // Get mention keywords from localStorage
  const storedKeywords = localStorage.getItem('mentionKeywords');
  if (!storedKeywords) return;
  
  // Parse and validate the keywords
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

        // Colorize each letter individually
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