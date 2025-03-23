import {
  parseUsername,
  parseMessageText,
  scrollToBottom,
  highlightMentionWords,
  playMentionSound,
  usernameColors,
  handlePrivateMessageInput,
  calibrateToMoscowTime,
  generateRandomString
} from "../helpers.js";
import ChatMessagesRemover from "../chat/chatMessagesRemover.js";

export default class MessageManager {
  constructor(panelId = 'messages-panel', currentUsername = '') {
    this.panel = document.getElementById(panelId);
    this.messageMap = new Map();
    // renderedMessageIds will be maintained in sync with the DOM
    this.renderedMessageIds = new Set();
    this.currentUsername = currentUsername;
    this.maxMessages = 20;
    this.initialLoadComplete = false;
    this.chatRemover = new ChatMessagesRemover();
    this.messageInput = document.getElementById('message-input');
    this._delegatedClickAttached = false;
  }

  // Consolidated unique ID generation
  generateUniqueId(type, username, text) {
    if (type === 'private') {
      return `private-${generateRandomString()}`;
    }
    return `<${username}>${text}`;
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
    const doc = new DOMParser().parseFromString(xmlResponse, "text/xml");
    const messageElements = doc.getElementsByTagName("message");
    let newMessagesAdded = false;

    Array.from(messageElements).forEach(msg => {
      const bodyNode = msg.getElementsByTagName("body")[0];
      if (!bodyNode || !bodyNode.textContent) return;
      const text = bodyNode.textContent.trim();
      if (text === "This room is not anonymous") return;

      const fromAttr = msg.getAttribute("from");
      const from = fromAttr
        ? fromAttr.split('#')[1]?.split('@')[0] || "unknown"
        : "unknown";
      const cleanFrom = parseUsername(from);

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
          timestamp = stampDate.toLocaleTimeString('en-GB', { hour12: false });
        } catch (e) {
          console.error("Error parsing timestamp:", e);
        }
      }
      // Fallback to current time if no timestamp found
      if (!timestamp) {
        timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
      }

      // Check if a message with the same username and text already exists
      const isDuplicate = Array.from(this.messageMap.values()).some(existingMsg =>
        existingMsg.from === cleanFrom &&
        existingMsg.text === text
      );

      // Only add the message if it's not a duplicate
      if (!isDuplicate) {
        const uniqueId = this.generateUniqueId(isPrivate ? 'private' : 'public', cleanFrom, text);
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
    const uniqueId = this.generateUniqueId(isPrivate ? 'private' : 'public', this.currentUsername, text);
    const messageObj = {
      id: uniqueId,
      from: this.currentUsername,
      text,
      isPrivate,
      recipient: options.recipient || null,
      pending: options.pending || false,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false })
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

        if (msg.isPrivate) {
          messageEl.classList.add('private-message');
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
        if (msg.pending) {
          const pendingIconEl = document.createElement('span');
          pendingIconEl.className = 'pending-emoji';
          pendingIconEl.textContent = ' ⏱️';
          messageTextEl.appendChild(pendingIconEl);
        }

        messageEl.appendChild(messageInfoEl);
        messageEl.appendChild(messageTextEl);
        fragment.appendChild(messageEl);

        // Mark this message as rendered.
        this.renderedMessageIds.add(id);

        if (this.currentUsername && msg.text.includes(this.currentUsername)) {
          mentionDetected = true;
        }
      }
    });

    // Append all new messages in one DOM operation.
    this.panel.appendChild(fragment);
    this.addDelegatedClickListeners();
    highlightMentionWords([this.currentUsername]);

    requestAnimationFrame(() => {
      scrollToBottom(250);
    });

    if (this.initialLoadComplete && mentionDetected) {
      playMentionSound();
    }
    this.initialLoadComplete = true;

    if (this.chatRemover) {
      this.chatRemover.updateDeletedMessages();
      this.chatRemover.renderToggle();
    }
  }

  addDelegatedClickListeners() {
    if (!this.panel._delegatedClickAttached) {
      this.panel.addEventListener("click", (event) => {
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

          if (event.ctrlKey) {
            // Use the cached messageInput and ensure a trailing space.
            this.messageInput.value = `/pm ${selectedUsername} `;
            handlePrivateMessageInput(this.messageInput);
          } else {
            const appendUsername = `${selectedUsername},`;
            if (!this.messageInput.value.includes(appendUsername)) {
              this.messageInput.value += appendUsername;
            }
          }
          this.messageInput.focus();
        }

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

  refreshMessages(connectionStatus = false) {
    const messageText = connectionStatus
      ? "Chat connection established. ✓"
      : "Chat connection lost. Reconnecting...";

    // Use a consistent ID for the connection status message.
    const systemMessageId = 'chat-connection';

    // Remove the specific system connection message from our map and from our in‑memory rendered IDs.
    this.messageMap.delete(systemMessageId);
    this.renderedMessageIds.delete(systemMessageId);

    // Create and add the new system message.
    const systemMessage = {
      id: systemMessageId,
      from: "System",
      text: messageText,
      isPrivate: false,
      recipient: null,
      isSystem: true,
      pending: false,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false })
    };

    this.messageMap.set(systemMessageId, systemMessage);
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
}
