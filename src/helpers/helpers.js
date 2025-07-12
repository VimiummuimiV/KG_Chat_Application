import { convertImageLinksToImage } from "../converters/imageConverter/imageConverter.js";
import { convertVideoLinksToPlayer } from "../converters/videoConverter.js";
import { handleLayoutBehavior } from "./layoutBehavior.js";
import { showChatAlert } from "../helpers/chatHeaderAlert.js";

import {
  emojiAvatar,
  settings,
  trustedDomains,
  eventsColorMap,
  defaultLanguage
} from "../data/definitions.js";

// ==================================================================================================

let lastEmojiAvatar = null;
export function getRandomEmojiAvatar() {
  let newEmoji;
  do {
    newEmoji = emojiAvatar[Math.floor(Math.random() * emojiAvatar.length)];
  } while (newEmoji === lastEmojiAvatar);
  lastEmojiAvatar = newEmoji;
  return newEmoji;
}

// ==================================================================================================

export function observeMessagesPanel() {
  const messagesPanel = document.getElementById('messages-panel');
  if (!messagesPanel) return;

  const observer = new MutationObserver(() => {
    handleLayoutBehavior();
    convertVideoLinksToPlayer();
    convertImageLinksToImage();
    scrollToBottom(350);
  });

  observer.observe(messagesPanel, { childList: true, subtree: true });
}

// ==================================================================================================

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
    logMessage({
      en: `Error in isTrustedDomain: ${err.message}`,
      ru: `Ошибка в isTrustedDomain: ${err.message}`
    }, 'error');
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

export function scrollToBottom(scrollThreshold) {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  if (distanceFromBottom <= scrollThreshold) {
    container.scrollTop = container.scrollHeight;
  }
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
    console.error(`Error fetching user ID for ${userName}: ${error.message}`);
    return null;
  }
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

export function addViewportMeta() {
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0';
    document.head.appendChild(viewportMeta);
    console.log('Viewport meta tag added dynamically');
  }
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

// Debounce helper with cancel support
export function debounce(func, wait) {
  let timeout = null;

  function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }

  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = null;
  };

  return debounced;
}

// ===================================================================================================

export function removeChatTraces() {
  localStorage.removeItem('userAvatarCache');
  localStorage.removeItem('chatState');
  localStorage.removeItem('chatEvents');
}

// ==================================================================================================

export function isTextSelected() {
  return window.getSelection().toString().length > 0;
}

// ==================================================================================================

// Function to log messages with different types and show alerts
// Accepts: message (string or {en,ru}), type, showAlert, lang
export function logMessage(message, type = 'info', showAlert = true, lang = null) {
  const styles = {
    info: `color: ${eventsColorMap.info}`,
    warning: `color: ${eventsColorMap.warning}`,
    error: `color: ${eventsColorMap.error}`,
    success: `color: ${eventsColorMap.success}`
  };
  const style = styles[type] || styles.info;

  // Language detection: use param, else imported default, else 'en'
  lang = lang || defaultLanguage || 'en';

  // If message is an object with en/ru, pick the right one for alert, always use en/raw for console
  let alertMsg = message;
  if (typeof message === 'object' && message !== null && (message.en || message.ru)) {
    alertMsg = message[lang] || message.en || message.ru;
    message = message.en || message.ru || '';
  }

  // Console logging with appropriate method and color (always EN/RAW)
  switch (type) {
    case 'error':
      console.error(`%c${message}`, style);
      break;
    case 'warning':
      console.warn(`%c${message}`, style);
      break;
    case 'success':
      console.log(`%c${message}`, style);
      break;
    case 'info':
    default:
      console.info(`%c${message}`, style);
      break;
  }

  if (showAlert) {
    showChatAlert(alertMsg, { type, duration: settings.showAlertDuration });
  }
}
