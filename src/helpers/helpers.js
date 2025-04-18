import { convertImageLinksToImage } from "../converters/image-converter.js";
import { convertVideoLinksToPlayer } from "../converters/video-converter.js";

import {
  emojiFaces,
  trustedDomains
} from "../data/definitions.js";

import {
  openSVG,
  closeSVG,
  expandSVG,
  collapseSVG
} from "../data/icons.js";

import { addShakeEffect } from "../data/animations.js";
import { emojiKeywords } from "../data/emojiData.js";
import { mentionColors } from "./chatUsernameColors.js";


// ==================================================================================================

let lastEmojiAvatar = null;
export function getRandomEmojiAvatar() {
  let newEmoji;
  do {
    newEmoji = emojiFaces[Math.floor(Math.random() * emojiFaces.length)];
  } while (newEmoji === lastEmojiAvatar);
  lastEmojiAvatar = newEmoji;
  return newEmoji;
}

// ==================================================================================================

export function handleElementsBehavior() {
  const wrapper = document.querySelector('#app-chat-container .chat-wrapper');
  if (!wrapper) return;
  const chatContainer = document.querySelector('#app-chat-container');
  const isNarrow = wrapper.offsetWidth <= 780;
  const isVeryNarrow = wrapper.offsetWidth <= 380;
  const userList = document.querySelector('#app-chat-container .user-list-container');
  const systemMessages = document.querySelectorAll('#app-chat-container .message.system');
  let isUserListOpen = false;
  const isMobile = checkIsMobile();

  // Handle user list for narrow screens
  if (userList) {
    // Check if the screen (chat) is narrow on PC or mobile devices
    if (isNarrow || isMobile) {
      userList.style.position = 'absolute';
      userList.style.height = '100%';
      userList.style.top = '0';
      userList.style.right = '0';
      userList.style.transition = 'transform 0.3s ease';
      userList.style.zIndex = '1001';
      userList.style.transform = 'translateX(100%)';

      // Apply alignment to all system messages if they exist
      if (systemMessages && systemMessages.length > 0) {
        systemMessages.forEach(message => {
          message.style.setProperty('align-items', 'start', 'important');
        });
      }

      let revealButton = document.querySelector('#app-chat-container .reveal-userlist-btn');
      if (!revealButton) {
        revealButton = document.createElement('button');
        revealButton.className = 'reveal-userlist-btn hidden-userlist';
        revealButton.textContent = '📋';
        chatContainer.appendChild(revealButton);
        function closeUserList(event) {
          if (!userList.contains(event.target) && event.target !== revealButton) {
            userList.style.transform = 'translateX(100%)';
            revealButton.classList.remove('shown-userlist');
            revealButton.classList.add('hidden-userlist');
            isUserListOpen = false;
            document.removeEventListener('click', closeUserList, true);
          }
        }
        revealButton.addEventListener('click', (event) => {
          event.stopPropagation();
          if (!isUserListOpen) {
            userList.style.transform = 'translateX(0)';
            revealButton.classList.remove('hidden-userlist');
            revealButton.classList.add('shown-userlist');
            isUserListOpen = true;
            setTimeout(() => {
              document.addEventListener('click', closeUserList, true);
            }, 10);
          }
        });
      }
    } else {
      userList.style.position = '';
      userList.style.height = '';
      userList.style.top = '';
      userList.style.right = '';
      userList.style.transform = '';
      userList.style.zIndex = '';

      // Remove alignment property from all system messages if they exist
      if (systemMessages && systemMessages.length > 0) {
        systemMessages.forEach(message => {
          message.style.removeProperty('align-items');
        });
      }

      const revealButton = document.querySelector('#app-chat-container .reveal-userlist-btn');
      if (revealButton) {
        revealButton.remove();
      }
    }
  }

  // Adjust message layout for narrow screens
  document.querySelectorAll('#app-chat-container .message').forEach(msg => {
    const msgText = msg.querySelector('.message-text');

    msg.style.flexDirection = (isNarrow) ? 'column' : 'row';
    msg.style.marginBottom = (isNarrow) ? '0.8em' : '0';
    msgText.style.marginTop = (isNarrow) ? '0.2em' : '0';
  });

  // Apply scaling to video containers and YouTube thumbnails
  const mediaElements = document.querySelectorAll('#app-chat-container .video-container, #app-chat-container .youtube-thumb');
  mediaElements.forEach(element => element.style.maxWidth = isVeryNarrow ? '100%' : '');
}

// ==================================================================================================

export function observeMessagesPanel() {
  const messagesPanel = document.getElementById('messages-panel');
  if (!messagesPanel) return;

  const observer = new MutationObserver(() => {
    handleElementsBehavior();
    convertVideoLinksToPlayer();
    convertImageLinksToImage();
    scrollToBottom(250);
  });

  observer.observe(messagesPanel, { childList: true, subtree: true });
}

// ==================================================================================================

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

// 1. Add a function to get the chat state from localStorage

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

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ==================================================================================================

export function parseUsername(username) {
  if (typeof username !== 'string') return username;
  return username.replace(/^\d+#/, '');
}

// Extract userId from JID, handling formats like "123456#Username"
export function extractUserId(jid) {
  if (!jid) return null;
  const parts = jid.split('/');
  if (parts.length < 2) return null;

  const secondPart = parts[1];
  return secondPart.split('#')[0]; // Get everything before the # character
}

// Extract username from the full JID or login string
export function extractUsername(login) {
  if (!login) return "Unknown";

  // If login contains #, get everything after it
  if (login.includes('#')) {
    return login.split('#')[1];
  }

  // Replace the parseUsername call with direct implementation
  return login.replace(/^\d+#/, '');
}

// ==================================================================================================

export function adjustVisibility(element, action, opacity) {
  if (!element) return;
  void element.offsetHeight; // Force reflow
  element.style.transition = 'opacity 0.3s ease';
  element.style.opacity = action === 'show' ? opacity : '0';
  if (action === 'hide') {
    element.addEventListener('transitionend', () => {
      if (element.style.opacity === '0' && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, { once: true });
  }
}

// ==================================================================================================

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

// ==================================================================================================

export function isEncodedURL(url) {
  const urlPattern = /^https?:\/\//;
  const encodedPattern = /%[0-9A-Fa-f]{2}/;
  return urlPattern.test(url) && encodedPattern.test(url);
}

export function decodeURL(url) {
  const [base] = url.split('#');
  return decodeURIComponent(base).replace(/ /g, '_');
}

export function decodeEncodedURL(text) {
  return text.replace(/\b(https?:\/\/[^\s]+)/gi, match =>
    isEncodedURL(match) ? decodeURL(match) : match
  );
}

// ==================================================================================================

export const notification = 'https://github.com/VimiummuimiV/KG_Chat_Application/raw/refs/heads/main/src/sounds/notification-pluck-on.mp3';
export const banned = 'https://github.com/VimiummuimiV/KG_Chat_Application/raw/refs/heads/main/src/sounds/mario-game-over.mp3';

export function playAudio(url) {
  const audio = new Audio(url);
  audio.volume = 1;
  audio.play();
}

export function highlightMentionWords() {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  // Get username from auth data
  const authData = localStorage.getItem('klavoauth');
  let username = '';
  try {
    if (authData) {
      const parsedAuth = JSON.parse(authData);
      if (parsedAuth && parsedAuth.username) {
        username = extractUsername(parsedAuth.username);
      }
    }
  } catch (e) {
    console.error('Error parsing auth data:', e);
  }

  // Don't proceed if no username to check
  if (!username) return;

  // Use username as the only term to highlight
  const highlightTerms = [username];
  const globalProcessed = new WeakSet();

  const messages = container.querySelectorAll('.message-text:not(.processed-for-mention)');
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

    if (nodes.length > 0) {
      nodes.forEach((node) => {
        if (!globalProcessed.has(node)) {
          processNode(node, highlightTerms);
          globalProcessed.add(node);
        }
      });

      // Mark this message as processed
      message.classList.add('processed-for-mention');
    }
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

// ==================================================================================================

export function scrollToBottom(scrollThreshold) {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  if (distanceFromBottom <= scrollThreshold) {
    container.scrollTop = container.scrollHeight;
  }
}

// ==================================================================================================

export function showChatAlert(message, options = {}) {
  const dragArea = document.querySelector('.chat-drag-area');
  if (!dragArea) return;

  const existingAlert = dragArea.querySelector('.chat-dynamic-alert');
  if (existingAlert && existingAlert.parentNode === dragArea) {
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
    white-space: nowrap;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: ${colorMap[settings.type] || colorMap.info};
    padding: 5px 10px;
    border-radius: 3px;
    z-index: 1000;
    font-family: "Montserrat", sans-serif;
    font-size: 10px;
    font-weight: 500;
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
          if (alertElement && alertElement.parentNode === dragArea) {
            dragArea.removeChild(alertElement);
          }
        }, 300);
      }, settings.duration);
    });
  }

  animateAlert();
}

// ==================================================================================================

export function focusTextInput() {
  const chatContainer = document.getElementById('app-chat-container');
  const element = document.getElementById('message-input');
  if (element && chatContainer && chatContainer.style.display !== 'none') {
    element.focus();
    return true;
  }
  return false;
}

// ==================================================================================================

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
    // console.error('Error getting user ID:', error);
    showChatAlert(`Could not find user "${userName}"`, { type: 'error', duration: 5000 });
    return null;
  }
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

// Global reference for ESC key handler
let escKeyHandler = null;

// Function to handle ESC key press
function handleEscKeyPress(event) {
  if (event.key === 'Escape' && privateMessageState.isPrivateMode) {
    exitPrivateMode();
  }
}

// Toggle private message mode based on input value
export async function handlePrivateMessageInput(inputElement) {
  if (!inputElement) return;
  const input = inputElement.value;
  // Updated regex to include hyphens and other common username special characters
  const privateModeRegex = /^\/pm\s+([\wа-яА-ЯёЁ\-\.\_\+]+)\s/;
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

    // Create or update exit button
    let exitButton = document.querySelector('.private-mode-exit');
    if (!exitButton) {
      exitButton = document.createElement('span');
      exitButton.className = 'button private-mode-exit';

      // Add click event to exit private mode
      exitButton.addEventListener('click', () => {
        exitPrivateMode();
        messageInput.focus();
      });

      // Add the exit button to the UI near the input
      const inputContainer = messageInput.parentElement;
      inputContainer.insertBefore(exitButton, messageInput.nextSibling);
    }

    // Set default closed lock emoji and title
    exitButton.innerHTML = "🔒";
    exitButton.title = "Exit private mode";

    // Change emoji on hover: open lock on mouseenter, closed lock on mouseleave
    exitButton.addEventListener('mouseenter', () => {
      exitButton.innerHTML = "🔓";
    });

    exitButton.addEventListener('mouseleave', () => {
      exitButton.innerHTML = "🔒";
    });

    showChatAlert(`Private chat with ${username} activated`, { type: 'warning', duration: 3000 });
    privateMessageState.isPrivateMode = true;
    privateMessageState.targetUsername = username;

    // Add ESC key event listener when entering private mode
    if (!escKeyHandler) {
      escKeyHandler = handleEscKeyPress;
      document.addEventListener('keydown', escKeyHandler);
    }
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

    // Remove the exit button
    const exitButton = document.querySelector('.private-mode-exit');
    if (exitButton) exitButton.remove();

    privateMessageState.exitPrivateMode();
    showChatAlert('Exited private chat mode', { type: 'success', duration: 3000 });

    // Remove ESC key event listener when exiting private mode
    if (escKeyHandler) {
      document.removeEventListener('keydown', escKeyHandler);
      escKeyHandler = null;
    }
  }
}

// Handle ESC key to exit private mode
export function setupPrivateMessageEvents(inputElement) {
  if (!inputElement) return;

  // Check for private message mode on input changes
  inputElement.addEventListener('input', () => {
    handlePrivateMessageInput(inputElement);
  });
}

// ==================================================================================================

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================================================================================================

export function base64Encode(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return btoa(String.fromCharCode(...data));
}

// ==================================================================================================

// Helper function to check if an image exists
export function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// ==================================================================================================

// Function to randomize emoji and add shake effect
export function setupRandomEmojiAttention(emojiButton, frequency) {
  // Get all emoji keys from the emojiKeywords object
  const emojis = Object.keys(emojiKeywords);

  // Original emoji to return to after attention-getting effect
  const originalEmoji = "🙂";

  // Function to select random emoji and apply shake effect
  const showRandomEmoji = () => {
    // Get a random emoji from the collection
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    // Set the random emoji
    emojiButton.innerHTML = randomEmoji;

    // Apply shake effect
    addShakeEffect(emojiButton);

    // Return to original emoji after animation completes
    setTimeout(() => {
      emojiButton.innerHTML = originalEmoji;
    }, 1500);
  };

  // Set interval to periodically show random emoji
  const intervalId = setInterval(showRandomEmoji, frequency);

  // Store the intervalId on the element for potential cleanup
  emojiButton.randomEmojiIntervalId = intervalId;

  return intervalId;
}

/**
 * Generates a random number of milliseconds between the specified minimum and maximum values
 * @param {number} minMs - Minimum time in milliseconds
 * @param {number} maxMs - Maximum time in milliseconds
 * @returns {number} - A random number of milliseconds between minMs and maxMs (inclusive)
 */
export function getRandomInterval(minMs, maxMs) {
  // Ensure min is not greater than max
  if (minMs > maxMs) {
    [minMs, maxMs] = [maxMs, minMs]; // Swap values if min > max
  }

  // Calculate a random value between min and max (inclusive)
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

// ==================================================================================================

export function addViewportMeta() {
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(viewportMeta);
    console.log('Viewport meta tag added dynamically');
  }
}

// ==================================================================================================

// Instead of getting the elements immediately, we declare module-level variables.
let chatField = null;
let messagesContainer = null;
let lengthPopup = null;

/**
 * Create and append the length popup.
 * @param {HTMLElement} container - The container (messagesPanel) to which the popup should be appended.
 */
export function createLengthPopup(container) {
  messagesContainer = container;
  lengthPopup = document.createElement('div');
  lengthPopup.className = 'length-field-popup';
  messagesContainer.appendChild(lengthPopup);
}

// Create a canvas for text measurement.
const textMeasurementCanvas = document.createElement('canvas');
const textMeasurementContext = textMeasurementCanvas.getContext('2d');

let isPopupVisible = false;
let previousLength = 0;
let hidePopupTimeout;

function updateLengthPopupColor(length) {
  if (!lengthPopup) {
    console.error('lengthPopup is not defined');
    return;
  }

  let h, s = 100, l = 50;

  if (length === 0) {
    h = 200; s = 20; l = 50;
  } else if (length <= 90) {
    h = 120;
  } else if (length <= 100) {
    h = 120 - ((length - 90) / 10) * 60;
  } else if (length <= 190) {
    h = 60;
  } else if (length <= 200) {
    h = 60 - ((length - 190) / 10) * 20;
  } else if (length <= 250) {
    h = 40;
  } else if (length <= 300) {
    h = 40 - ((length - 250) / 50) * 40;
  } else {
    h = 0;
  }

  const textColor = `hsl(${h}, ${s}%, ${l}%)`;
  const backgroundColor = `hsl(${h}, ${s}%, ${Math.max(l - (length > 250 ? 35 : 30), 8)}%)`;
  const borderColor = `hsla(${h}, ${s}%, ${l}%, 0.1)`;

  lengthPopup.style.setProperty('color', textColor, 'important');
  lengthPopup.style.setProperty('background-color', backgroundColor, 'important');
  lengthPopup.style.setProperty('border', `1px solid ${borderColor}`, 'important');
  lengthPopup.style.setProperty('border-radius', '0.4em', 'important');
}

function updatePopupMetrics(text) {
  if (!chatField) {
    console.error('chatField is not set.');
    return;
  }
  // Get current font from input field.
  const computedStyle = getComputedStyle(chatField);
  textMeasurementContext.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
  // Measure text.
  const textWidth = textMeasurementContext.measureText(text).width;
  // Calculate position.
  const newLeft = chatField.offsetLeft + textWidth + 5;
  const maxLeft = chatField.offsetLeft + chatField.offsetWidth - lengthPopup.offsetWidth;
  lengthPopup.style.left = `${Math.min(newLeft, maxLeft)}px`;
}

const arrowRightBold = "➡"; // Heavy right arrow
const arrowLeftBold = "⬅"; // Heavy left arrow

function updateLengthPopup(length) {
  let displayText =
    length > previousLength ? `${length} ${arrowRightBold}` :
      length < previousLength ? `${arrowLeftBold} ${length}` :
        `${length}`;

  lengthPopup.textContent = displayText;
  updateLengthPopupColor(length);
  previousLength = length;
}

function togglePopup(show) {
  if (isPopupVisible === show) return;
  lengthPopup.classList.toggle('bounce-in', show);
  lengthPopup.classList.toggle('bounce-out', !show);
  isPopupVisible = show;
  if (!show) setTimeout(() => lengthPopup.classList.remove('bounce-out'), 500);
}

function resetPopup() {
  updateLengthPopup(0);
  Object.assign(lengthPopup.style, { left: '0px', color: 'hsl(200, 20%, 50%)' });
}

function handleInputEvent() {
  clearTimeout(hidePopupTimeout);
  updateLengthPopup(chatField.value.length);
  updatePopupMetrics(chatField.value);
  togglePopup(true);
  hidePopupTimeout = setTimeout(() => togglePopup(false), 1000);
}

function handleKeydownEvent(e) {
  if (e.key !== 'Enter') return;
  resetPopup();
  togglePopup(true);
  hidePopupTimeout = setTimeout(() => togglePopup(false), 1000);
}

/**
 * Initializes chat length popup events.
 * @param {HTMLElement} field - The chat input field.
 */
export function initChatLengthPopupEvents(field) {
  chatField = field;
  if (!chatField) {
    console.error('chatField is null');
    return;
  }
  // Only attach event listeners if the popup was created.
  if (!lengthPopup) return;
  chatField.addEventListener('input', handleInputEvent);
  chatField.addEventListener('keydown', handleKeydownEvent);
}

// ==================================================================================================

/**
 * Converts a given local time to Moscow time (UTC+3) based on the system's timezone.
 *
 * How it works:
 * 1. Gets the system's local timezone offset in minutes (positive if behind UTC).
 * 2. Converts the local offset to total minutes from UTC.
 * 3. Defines Moscow's fixed offset as UTC+3 (180 minutes).
 * 4. Calculates the difference between Moscow's offset and the local offset.
 * 5. Parses the input time and converts it into total minutes since midnight.
 * 6. Adjusts the time by the calculated difference.
 * 7. Ensures the result stays within the 24-hour format (wrap-around handling).
 * 8. Converts the result back to HH:MM:SS format and returns it.
 *
 * @param {string} time - The local time in "HH:MM:SS" format.
 * @returns {string} - The converted time in Moscow time (HH:MM:SS).
 */
export function calibrateToMoscowTime(time) {
  // Get local timezone offset in minutes (positive if local is behind UTC)
  const localOffsetMinutes = new Date().getTimezoneOffset();

  // Convert local offset to total minutes from UTC (local time = UTC + localTotalOffset)
  const localTotalOffset = -localOffsetMinutes;

  // Moscow is UTC+3 (180 minutes)
  const moscowOffset = 3 * 60; // 180 minutes

  // Calculate the adjustment needed: Moscow offset - local offset
  const diffMinutes = moscowOffset - localTotalOffset;

  // Parse input time
  const [hours, minutes, seconds] = time.split(':').map(Number);

  // Convert input time to total minutes since 00:00
  const totalInputMinutes = hours * 60 + minutes;

  // Adjust by diff and wrap within a single day (1440 minutes)
  let adjustedMinutes = totalInputMinutes + diffMinutes;
  adjustedMinutes = ((adjustedMinutes % 1440) + 1440) % 1440; // Ensure positive

  // Convert back to hours and minutes
  const adjustedHours = Math.floor(adjustedMinutes / 60);
  const adjustedMins = adjustedMinutes % 60;

  // Format the result with original seconds
  return `${adjustedHours.toString().padStart(2, '0')}:` +
    `${adjustedMins.toString().padStart(2, '0')}:` +
    `${seconds.toString().padStart(2, '0')}`;
}

// ==================================================================================================

// Removes newlines and excess whitespace from XML strings to create a compact single-line format while preserving content.
export function compactXML(xmlString) {
  // Remove all newlines and trim excess whitespace to single spaces
  return xmlString
    .replace(/\n/g, '')      // Remove all newlines
    .replace(/\s+/g, ' ')    // Replace multiple spaces/tabs with a single space
    .replace(/>\s+</g, '><') // Remove spaces between tags
    .trim();                 // Remove leading/trailing whitespace
}

// ==================================================================================================

export function checkIsMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window);
}

// ==================================================================================================

export function toggleChatVisibility() {
  const chatContainer = document.getElementById('app-chat-container');
  const toggleButton = document.querySelector('.chat-toggle-button');
  if (!chatContainer) return;

  // Prevent toggling visibility if chat is maximized
  if (chatContainer.classList.contains('maximized')) {
    showChatAlert('Chat is currently maximized', {
      type: 'warning',
      duration: 1000
    });
    return;
  }

  const chatState = JSON.parse(localStorage.getItem('chatState')) || {};
  const isFloating = chatState.floating || false;

  if (isFloating) {
    const isBecomingVisible = chatContainer.style.opacity === '0';
    chatContainer.style.opacity = isBecomingVisible ? '1' : '0';
    setTimeout(() => {
      chatContainer.style.display = isBecomingVisible ? 'flex' : 'none';
      toggleButton.innerHTML = isBecomingVisible ? closeSVG : openSVG;
      toggleButton.title = isBecomingVisible ? 'Hide chat' : 'Show chat';

      saveChatState({
        ...chatState,
        isVisible: isBecomingVisible
      });
      if (isBecomingVisible) {
        focusTextInput(); // Focus input after chat becomes visible
      }
    }, 300);
  } else {
    const isCurrentlyVisible = chatContainer.classList.contains('visible-chat');
    const isBecomingVisible = !isCurrentlyVisible;
    chatContainer.classList.remove('visible-chat', 'hidden-chat');
    chatContainer.classList.add(isBecomingVisible ? 'visible-chat' : 'hidden-chat');
    toggleButton.innerHTML = isBecomingVisible ? closeSVG : openSVG;
    toggleButton.title = isBecomingVisible ? 'Hide chat' : 'Show chat';

    saveChatState({
      ...chatState,
      isVisible: isBecomingVisible
    });
    if (isBecomingVisible) {
      focusTextInput(); // Focus input immediately when shown
    }
  }
}

// ==================================================================================================

export function addChatToggleFeature() {
  const chatContainer = document.getElementById('app-chat-container');
  const closeButton = document.getElementById('chat-close-btn');
  const draggableHeader = document.getElementById('chat-header');
  if (!chatContainer) return;

  // Restore initial visibility from saved state
  const chatState = JSON.parse(localStorage.getItem('chatState')) || {};
  const isFloating = chatState.floating || false;
  const isVisible = chatState.isVisible !== false;

  if (isFloating) {
    chatContainer.style.display = isVisible ? 'flex' : 'none';
    chatContainer.style.opacity = isVisible ? '1' : '0';
  } else {
    chatContainer.classList.remove('visible-chat', 'hidden-chat');
    chatContainer.classList.add(isVisible ? 'visible-chat' : 'hidden-chat');
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      toggleChatMaximize();
    } else if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      toggleChatVisibility();
    }
  });

  if (closeButton) {
    closeButton.addEventListener('click', toggleChatVisibility);
  }

  if (draggableHeader) {
    draggableHeader.addEventListener('dblclick', toggleChatVisibility);
  }
}

// ==================================================================================================

let originalChatState = null;

export function toggleChatMaximize() {
  const chat = document.getElementById('app-chat-container');
  const maximizeButton = document.querySelector('.chat-maximize-button');

  if (!chat) return;

  if (!chat.classList.contains('maximized')) {
    const hasVisibilityClass = !chat.classList.contains('visible-chat') && !chat.classList.contains('hidden-chat');
    originalChatState = getChatState();
    const calculateHeight = () => `${Math.floor(window.innerHeight * 0.9)}px`;
    chat.style.cssText = `
      width: 100vw !important;
      height: ${calculateHeight()} !important;
      max-width: 100vw !important;
      min-width: 100vw !important;
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      top: auto !important;
      margin: 0 !important;
      transform: none !important;
    `;
    if (hasVisibilityClass) {
      chat.classList.remove('visible-chat', 'hidden-chat');
    }
    chat.classList.add('maximized');
    maximizeButton.classList.add('maximized');
    maximizeButton.innerHTML = collapseSVG;
    maximizeButton.title = "Collapse chat";

    const resizeHandler = () => {
      chat.style.height = calculateHeight();
      chat.style.bottom = '0';
      chat.style.top = 'auto';
    };
    window.addEventListener('resize', resizeHandler);
    chat.maximizeResizeHandler = resizeHandler;
    handleElementsBehavior();
    focusTextInput();
    restoreFontSize();
  } else {
    const container = document.getElementById('messages-panel');
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const shouldScrollToBottom = distanceFromBottom <= 300;
    if (chat.maximizeResizeHandler) {
      window.removeEventListener('resize', chat.maximizeResizeHandler);
      delete chat.maximizeResizeHandler;
    }
    if (originalChatState) {
      chat.style.width = `${originalChatState.width}px`;
      chat.style.height = `${originalChatState.height}px`;
      chat.style.left = `${originalChatState.left}px`;
      chat.style.maxWidth = '';
      chat.style.minWidth = '';
      chat.style.position = 'fixed';
      chat.style.right = '';
      chat.style.margin = '';
      chat.style.transform = '';
      chat.style.top = 'auto';
      if (originalChatState.floating) {
        const viewportHeight = window.innerHeight;
        const proposedTop = originalChatState.top;
        if (proposedTop + originalChatState.height <= viewportHeight) {
          chat.style.top = `${proposedTop}px`;
        } else {
          chat.style.bottom = '0';
          chat.style.top = 'auto';
        }
      } else {
        chat.style.bottom = '0';
        chat.style.top = '';
      }
      const currentState = getChatState();
      const newState = {
        ...currentState,
        width: originalChatState.width,
        height: originalChatState.height,
        left: originalChatState.left,
        top: originalChatState.top,
        floating: originalChatState.floating,
        isVisible: originalChatState.isVisible,
      };
      saveChatState(newState);
    }
    chat.classList.remove('maximized');
    maximizeButton.classList.remove('maximized');
    maximizeButton.innerHTML = expandSVG;
    maximizeButton.title = "Expand chat";

    requestAnimationFrame(() => {
      handleElementsBehavior();
      if (shouldScrollToBottom) {
        container.scrollTop = container.scrollHeight;
      }
      focusTextInput();
      restoreFontSize();
    });
  }
}

// ==================================================================================================

// Add this function to handle mobile/touch devices
export function handleMobileLayout(chatContainer, chatContent, messagesPanel, dragArea, inputContainer) {
  const isMobile = checkIsMobile();
  if (isMobile) {

    // Add styles for mobile view
    const globalMobileStyles = document.createElement('style');
    globalMobileStyles.classList.add('global-mobile-styles');
    globalMobileStyles.textContent = `
      html, body {
        overflow: hidden !important;
        height: 0 !important;
      }

      #app-chat-container .emoji-panel {
        transform: translate(-50%, 0%) !important;
        height: 60vh !important;
        top: 1em !important;
        left: 50% !important;
        right: unset !important;
      }

      #app-chat-container .user-list-container {
        top: 1em !important;
        height: fit-content !important;
        max-height: 70vh !important;
        border-top: 1px solid #333 !important;
        border-bottom: 1px solid #333 !important;
        border-radius: 0.5em 0 0 0.5em !important;
      }

      #app-chat-container .toggle-button {
        border: none !important;
        top: 0 !important;
        right: 0 !important;
        border-radius: 0.2em !important;
        margin: 1em !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1) !important;
      }
    `;
    document.head.appendChild(globalMobileStyles);

    // Use Visual Viewport API for keyboard detection and correct positioning
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        // Calculate the bottom offset taking into account the viewport offset when scrolling
        const bottomOffset = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
        // Update the chat container height to fit the available space when keyboard is open
        chatContainer.style.setProperty('height', `calc(100% - ${bottomOffset}px)`, 'important');

        // Get the current height of the chat container
        const hideElements = chatContainer.getBoundingClientRect().height < 100;

        // Hide or show elements based on the chat container height
        messagesPanel.style.display = hideElements ? 'none' : '';
        chatContent.style.margin = hideElements ? '0' : '';
        chatContent.style.marginTop = hideElements ? '0' : '';
        inputContainer.style.position = hideElements ? 'absolute' : '';
        inputContainer.style.bottom = hideElements ? '0' : '';
        dragArea.style.display = hideElements ? 'none' : '';
        const revealBtn = document.querySelector('.reveal-userlist-btn');
        if (revealBtn) revealBtn.style.display = hideElements ? 'none' : '';

        // Forse to scroll the messages panel to the bottom when keyboard is opened or closed
        messagesPanel.scrollTop = messagesPanel.scrollHeight;
      });
    }
  }
}

// ==================================================================================================

// Helper function to generate a random string
export function generateRandomString() {
  return Math.random().toString(36).slice(2);
}

// ==================================================================================================

/**
 * Creates an HR-like separator with an emoji icon.
 * @returns {HTMLElement} The separator element.
 */
export function createNewMessagesSeparator() {
  const separator = document.createElement('div');
  separator.className = 'new-messages-separator';

  const hr = document.createElement('hr');
  hr.className = 'separator-line';

  // Use an emoji icon (feel free to change it)
  const iconContainer = document.createElement('div');
  iconContainer.className = 'separator-icon';
  iconContainer.textContent = '🔥';

  separator.appendChild(hr);
  separator.appendChild(iconContainer);

  return separator;
}

/**
 * Removes the separator if it exists from the provided container.
 * @param {HTMLElement} panel - The container element to check for the separator.
 */
export function removeNewMessagesSeparator(panel) {
  const separator = panel.querySelector('.new-messages-separator');
  if (separator) {
    separator.remove();
  }
}

// ==================================================================================================

// Debounce helper
export const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// ===================================================================================================

export function removeChatTraces() {
  // Remove localStorage keys userAvatarCache, chatState
  localStorage.removeItem('userAvatarCache');
  localStorage.removeItem('chatState');
  // Remove sessionStorage keys userAvatarCache
  sessionStorage.removeItem('userAvatarCache');
}

// ==================================================================================================

export function isTextSelected() {
  return window.getSelection().toString().length > 0;
}