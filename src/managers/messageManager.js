import {
  parseUsername,
  calibrateToMoscowTime,
  getExactUserIdByName,
  logMessage
} from "../helpers/helpers.js";

import {
  createNewMessagesSeparator,
  removeNewMessagesSeparator
} from "../helpers/messagesSeparator.js";

import {
  banned,
  notification,
  playAudio,
  highlightMentionWords
} from "../helpers/mentionWatcher.js";

import ChatMessagesRemover from "../chat/chatMessagesRemover.js";
import { parseMessageText } from "../helpers/parser.js";
import { usernameColors } from "../helpers/chatUsernameColors.js";
import { getAllIgnoredUsers } from "../components/ignoredUsersPanel.js";
import { connectionMessages } from '../data/definitions.js';
import { loadProfileIntoIframe } from "../helpers/iframeProfileLoader.js";
import { handlePrivateMessageInput } from "../helpers/privateMessagesHandler.js";


export default class MessageManager {
  constructor(panelId = 'messages-panel', currentUsername = '') {
    this.panel = document.getElementById(panelId);
    this.messageMap = new Map();
    // renderedMessageIds will be maintained in sync with the DOM
    this.renderedMessageIds = new Set();
    this.currentUsername = currentUsername;
    this.maxMessages = 30;
    this.defaultMessagesCount = 20;
    this.initialLoadComplete = false;
    this.chatRemover = new ChatMessagesRemover();
    this.messageInput = document.getElementById('message-input');
    this.shouldCreateSeparator = true;
    this._delegatedClickAttached = false;

    // Listen for tab visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        removeNewMessagesSeparator(this.panel);
        this.shouldCreateSeparator = true;
      }
    });

    // Remove separator when user focuses on message input
    if (this.messageInput) {
      this.messageInput.addEventListener('focus', () => {
        removeNewMessagesSeparator(this.panel);
        this.shouldCreateSeparator = true;
      });
    }
  }

  // Updated unique ID generator to include the timestamp
  generateUniqueId(type, timestamp, username, text) {
    const time = timestamp || new Date().toLocaleTimeString('en-GB', { hour12: false });
    if (type === 'private') {
      const now = Date.now(); // milliseconds since epoch
      return `private-${now}`;
    }
    return `${time}-${username}-${text}`;
  }

  addMessage(messageObj) {
    this.messageMap.set(messageObj.id, messageObj);
    this.trimMessages();
    return true;
  }

  trimMessages() {
    while (this.messageMap.size > this.maxMessages) {
      const oldestKey = this.messageMap.keys().next().value;
      this.messageMap.delete(oldestKey);
      this.renderedMessageIds.delete(oldestKey);
    }
  }

  processMessages(xmlResponse) {
    if (typeof xmlResponse !== 'string' || !xmlResponse) return;
    // Use centralized helper for ignored users
    const { forever, temporary } = getAllIgnoredUsers();
    const ignoredUsers = [...forever, ...temporary];

    const doc = new DOMParser().parseFromString(xmlResponse, "text/xml");
    const messageElements = doc.getElementsByTagName("message");
    let newMessagesAdded = false;

    Array.from(messageElements).forEach(msg => {
      const bodyNode = msg.getElementsByTagName("body")[0];
      if (!bodyNode || !bodyNode.textContent) return;
      const text = bodyNode.textContent.trim();
      if (text === "This room is not anonymous") return;

      // Skip messages addressed to ignored users, e.g. "Mark, how are you?"
      const addressMatch = /^([^,\s]+),/.exec(text);
      if (addressMatch && ignoredUsers.includes(addressMatch[1])) {
        return;
      }

      const fromAttr = msg.getAttribute("from");
      const from = fromAttr
        ? fromAttr.split('#')[1]?.split('@')[0] || "unknown"
        : "unknown";
      const cleanFrom = parseUsername(from);

      // Skip messages from ignored users
      if (ignoredUsers.includes(cleanFrom)) return;

      const toAttr = msg.getAttribute("to");
      const typeAttr = msg.getAttribute("type");
      const isPrivate = typeAttr === 'chat';
      let recipient = null;
      if (isPrivate && toAttr) {
        recipient = parseUsername(toAttr.split('#')[1]?.split('@')[0] || toAttr);
      }

      // Extract timestamp from delay element
      let timestamp = null;
      const delayEl = msg.getElementsByTagName("delay")[0];
      if (delayEl && delayEl.getAttribute("stamp")) {
        const stampStr = delayEl.getAttribute("stamp");
        try {
          const stampDate = new Date(stampStr);
          // Always use the server timestamp here.
          timestamp = stampDate.toLocaleTimeString('en-GB', { hour12: false });
        } catch (e) {
          logMessage(`Message manager: Error parsing timestamp: ${e.message}`, 'error');
        }
      }

      if (!timestamp) {
        // Only fall back to local time if there's no server timestamp at all.
        timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
      }

      // Prevent loading my own messages if already loaded
      if (cleanFrom === this.currentUsername && this.initialLoadComplete) return;

      const isDuplicate = Array.from(this.messageMap.values()).some(existingMsg =>
        existingMsg.from === cleanFrom &&
        existingMsg.text === text
      );

      if (!isDuplicate) {
        const uniqueId = this.generateUniqueId(
          isPrivate ? 'private' : 'public',
          timestamp, // server timestamp
          cleanFrom,
          text
        );

        const messageObj = {
          id: uniqueId,
          from: cleanFrom,
          text,
          isPrivate,
          recipient,
          pending: false,
          timestamp
        };

        if (this.addMessage(messageObj)) {
          newMessagesAdded = true;
        }
      }
    });

    if (newMessagesAdded) {
      this.updatePanel();
    }
  }

  addSentMessage(text, options = {}) {
    const isPrivate = options.isPrivate || false;
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
    const uniqueId = this.generateUniqueId(
      isPrivate ? 'private' : 'public',
      currentTime, // local timestamp
      this.currentUsername,
      text
    );

    const messageObj = {
      id: uniqueId,
      from: this.currentUsername,
      text,
      isPrivate,
      recipient: options.recipient || null,
      pending: options.pending || false,
      timestamp: currentTime
    };

    if (this.addMessage(messageObj)) {
      this.updatePanel();
    }

    return uniqueId;
  }

  updatePendingStatus(messageId, pendingStatus) {
    const msg = this.messageMap.get(messageId);
    if (msg) {
      msg.pending = pendingStatus;
      this.updatePanel();
    }
  }

  updatePanel() {
    if (!this.panel) return;
    // Compute the set of IDs already rendered in the DOM.
    const domRenderedIds = new Set(
      Array.from(this.panel.querySelectorAll('.message')).map(el => el.getAttribute('data-message-id'))
    );
    // Synchronize the in‑memory set with the DOM.
    this.renderedMessageIds = domRenderedIds;

    // Create a single fragment for new messages.
    const fragment = document.createDocumentFragment();
    let mentionDetected = false;

    // Iterate over our messages from the messageMap.
    this.messageMap.forEach((msg, id) => {
      if (!this.renderedMessageIds.has(id)) {
        const formattedTime = msg.timestamp || new Date().toLocaleTimeString('en-GB', { hour12: false });
        const normalizedUsername = parseUsername(msg.from);
        const usernameColor = usernameColors.getColor(normalizedUsername);
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.setAttribute('data-message-id', id);

        // Add classname 'banned' for Клавобот
        if (msg.from === 'Клавобот') {
          messageEl.classList.add('banned');
          if (this.initialLoadComplete) {
            playAudio(banned);
          }
        }

        // Play notification sound for new private messages when the tab is inactive
        if (msg.isPrivate && msg.from !== this.currentUsername && document.hidden) {
          playAudio(notification);
        }

        if (msg.isPrivate) {
          messageEl.classList.add('private');
          messageEl.classList.add(msg.from === this.currentUsername ? 'sent' : 'received');
          if (msg.recipient) {
            messageEl.setAttribute('data-recipient', msg.recipient);
          }
        }

        if (msg.text.startsWith('/me ')) {
          messageEl.classList.add('system');
          msg.text = `${msg.from} ${msg.text.substring(msg.text.indexOf(' ') + 1)}`;
        }

        if (msg.isSystem) {
          messageEl.classList.add('system');
        }

        // Build message info.
        const messageInfoEl = document.createElement('div');
        messageInfoEl.className = 'message-info';
        let usernameDisplay = msg.from;
        if (msg.isPrivate) {
          usernameDisplay = msg.from === this.currentUsername && msg.recipient
            ? `→ ${msg.recipient}`
            : `${msg.from} →`;
        }
        messageInfoEl.innerHTML = `
          <span class="time">${formattedTime}</span>
          <span class="username" style="color: ${usernameColor}">${usernameDisplay}</span>
        `;

        // Build message text.
        const messageTextEl = document.createElement('div');
        messageTextEl.className = 'message-text';
        messageTextEl.innerHTML = parseMessageText(msg.text);

        messageEl.appendChild(messageInfoEl);
        messageEl.appendChild(messageTextEl);

        if (msg.pending) {
          const pendingIconEl = document.createElement('span');
          pendingIconEl.className = 'pending-emoji';
          pendingIconEl.textContent = '⏱️';
          messageEl.appendChild(pendingIconEl); // Append after messageTextEl
        }

        fragment.appendChild(messageEl);

        // Mark this message as rendered.
        this.renderedMessageIds.add(id);

        if (this.currentUsername && msg.text.includes(this.currentUsername)) {
          mentionDetected = true;
        }
      }
    });

    // If the tab is inactive and new messages have arrived, insert the separator.
    if (document.hidden && this.initialLoadComplete && fragment.childNodes.length > 0 && this.shouldCreateSeparator) {
      const separator = createNewMessagesSeparator();
      fragment.insertBefore(separator, fragment.firstChild); // Insert at the beginning of the fragment
      this.shouldCreateSeparator = false;
    }

    // Append all new messages in one DOM operation.
    this.panel.appendChild(fragment);
    this.addDelegatedClickListeners();
    highlightMentionWords([this.currentUsername]);

    if (this.initialLoadComplete && mentionDetected) {
      playAudio(notification);
    }

    requestAnimationFrame(() => {
      // Scroll to the bottom when all messages are loaded.
      if (!this.initialLoadComplete && this.messageMap.size >= this.defaultMessagesCount) {
        // Scroll to the bottom only once when the initial load is complete.
        this.panel.scrollTop = this.panel.scrollHeight;
        this.initialLoadComplete = true;
      }
    });

    if (this.chatRemover) {
      this.chatRemover.updateDeletedMessages();
      this.chatRemover.renderToggle();
    }
  }

  addDelegatedClickListeners() {
    if (!this.panel._delegatedClickAttached) {
      // Track click count and timing for double-click detection
      let lastClickTime = 0;
      let lastClickUsername = '';

      this.panel.addEventListener("click", async (event) => {
        const usernameEl = event.target.closest('.username');
        if (usernameEl && this.panel.contains(usernameEl)) {
          const usernameText = usernameEl.textContent.trim();
          let selectedUsername = usernameText;

          if (selectedUsername.includes('→')) {
            if (selectedUsername.startsWith('→')) {
              selectedUsername = selectedUsername.replace('→', '').trim();
            } else {
              selectedUsername = selectedUsername.split('→')[0].trim();
            }
          }

          // Handle Shift+Click to navigate to user profile
          if (event.shiftKey) {
            // Prevent text selection
            window.getSelection().removeAllRanges();

            // Get the stored username IDs object from sessionStorage
            let usernameIds = {};
            const storedIds = sessionStorage.getItem('usernameIds');
            if (storedIds) {
              try {
                usernameIds = JSON.parse(storedIds);
              } catch (e) {
                logMessage(`Message manager: Error parsing stored username IDs: ${e.message}`, 'error');
                usernameIds = {};
              }
            }

            // Check if the username already has a stored ID
            let userId = usernameIds[selectedUsername];

            if (!userId) {
              // If not cached, fetch the user ID and store it
              userId = await getExactUserIdByName(selectedUsername);
              if (userId) {
                // Update the object and save it back to sessionStorage
                usernameIds[selectedUsername] = userId;
                sessionStorage.setItem('usernameIds', JSON.stringify(usernameIds));
              }
            }

            if (userId) {
              const profileUrl = `https://klavogonki.ru/u/#/${userId}/`;
              loadProfileIntoIframe(profileUrl);
            }
            return;
          }

          // Original Ctrl+Click behavior for private messaging
          if (event.ctrlKey) {
            this.messageInput.value = `/pm ${selectedUsername} `;
            handlePrivateMessageInput(this.messageInput);
          } else {
            // Detect double-click
            const now = Date.now();
            const isDoubleClick = (now - lastClickTime < 300) && (lastClickUsername === selectedUsername);

            if (isDoubleClick) {
              // Double-click: Replace entire input with username
              this.messageInput.value = `${selectedUsername}, `;
            } else {
              // Single-click: Append username
              const appendUsername = `${selectedUsername}, `;
              if (!this.messageInput.value.includes(appendUsername)) {
                this.messageInput.value += appendUsername;
              }
            }

            // Update tracking variables
            lastClickTime = now;
            lastClickUsername = selectedUsername;
          }
          this.messageInput.focus();
        }

        // Original time element click behavior
        const timeEl = event.target.closest('.time');
        if (timeEl && this.panel.contains(timeEl)) {
          const localTime = timeEl.textContent.trim();
          const moscowTime = calibrateToMoscowTime(localTime);
          const today = new Intl.DateTimeFormat('en-CA').format(new Date());
          const url = `https://klavogonki.ru/chatlogs/${today}.html#${moscowTime}`;
          window.open(url, '_blank');
        }
      });
      this.panel._delegatedClickAttached = true;
    }
  }

  getChatHistory() {
    return Array.from(this.messageMap.values());
  }

  refreshMessages(connectionStatus = false, connectionType = 'chat') {
    const messageId = 'connection-status';
    // Get language from localStorage, default to 'en'
    const lang = localStorage.getItem('emojiPanelLanguage') === 'ru' ? 'ru' : 'en';
    const messageText = connectionMessages[connectionType][lang][connectionStatus ? 'online' : 'offline'];

    // Remove the specific system connection message from our map and from our in‑memory rendered IDs.
    this.messageMap.delete(messageId);
    this.renderedMessageIds.delete(messageId);

    // Create and add the new system message.
    const systemMessage = {
      id: messageId,
      from: "System",
      text: messageText,
      isPrivate: false,
      recipient: null,
      isSystem: true,
      pending: false,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false })
    };

    this.messageMap.set(messageId, systemMessage);
    this.updateConnectionStatusInUI(systemMessage);
  }

  updateConnectionStatusInUI(systemMessage) {
    // Remove all pending icons.
    this.panel.querySelectorAll('.pending-emoji').forEach(el => el.remove());

    // Remove the existing system message element (if any).
    const systemMessageElement = this.panel.querySelector(`[data-message-id="${systemMessage.id}"]`);
    if (systemMessageElement) {
      systemMessageElement.remove();
    }

    // Re-render messages (using the updated DOM as the source of rendered IDs).
    this.updatePanel();
  }

  removePrivateMessages() {
    // Remove private messages from messageMap and renderedMessageIds
    for (const [id, message] of this.messageMap.entries()) {
      if (message.isPrivate) {
        this.messageMap.delete(id);
        this.renderedMessageIds.delete(id);
      }
    }

    // Remove private message elements from DOM
    const privateMessageElements = this.panel.querySelectorAll('.message.private');
    privateMessageElements.forEach(element => element.remove());
  }
}
