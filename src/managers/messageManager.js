import {
  parseUsername,
  parseMessageText,
  scrollToBottom,
  highlightMentionWords,
  playMentionSound,
  usernameColors,
  handlePrivateMessageInput,
  calibrateToMoscowTime
} from '../helpers.js';

import ChatMessagesRemover from '../ChatMessagesRemover.js';

export default class MessageManager {
  constructor(panelId = 'messages-panel', currentUsername = '') {
    this.panel = document.getElementById(panelId);
    this.messages = [];
    this.currentUsername = currentUsername;
    this.processedMessageIds = new Set(); // For deduplication of public messages only
    this.chatHistory = new Map(); // Local in-memory map for chat history
    this.initialLoadComplete = false;

    // Integrate the message remover
    this.chatRemover = new ChatMessagesRemover();
  }

  // Helper to generate a unique ID based on whether the message is private.
  _generateUniqueId(isPrivate, username, text) {
    if (isPrivate) {
      return `pm-${Math.random().toString(36).slice(2)}`;
    }
    return `<${username}>${text}`;
  }

  processMessages(xmlResponse) {
    if (!xmlResponse || typeof xmlResponse !== 'string') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const messageElements = doc.getElementsByTagName("message");
    let newMessagesAdded = false;

    Array.from(messageElements).forEach(msg => {
      const bodyNode = msg.getElementsByTagName("body")[0];
      if (!bodyNode || !bodyNode.textContent) return;

      const text = bodyNode.textContent.trim();
      if (text === "This room is not anonymous") return;

      const fromAttr = msg.getAttribute("from");
      const from = fromAttr ? fromAttr.split('#')[1]?.split('@')[0] || "unknown" : "unknown";
      const cleanFrom = parseUsername(from);

      const toAttr = msg.getAttribute("to");
      const type = msg.getAttribute("type");
      const isPrivate = type === 'chat';
      let recipient = null;
      if (isPrivate && toAttr) {
        recipient = toAttr.split('#')[1]?.split('@')[0] || toAttr;
        recipient = parseUsername(recipient);
      }

      const uniqueId = this._generateUniqueId(isPrivate, cleanFrom, text);
      if (!isPrivate && this.processedMessageIds.has(uniqueId)) return;

      let timestamp = new Date().toISOString();
      const delayNodes = msg.getElementsByTagName("delay");
      if (delayNodes.length && delayNodes[0].getAttribute("stamp")) {
        timestamp = delayNodes[0].getAttribute("stamp");
      }

      const messageObj = {
        id: uniqueId,
        from: cleanFrom,
        text,
        timestamp,
        isPrivate,
        recipient,
        pending: false
      };

      this.messages.push(messageObj);
      this.chatHistory.set(uniqueId, messageObj);
      if (!isPrivate) {
        this.processedMessageIds.add(uniqueId);
      }
      newMessagesAdded = true;
    });

    // Limit the size of the processedMessageIds set for public messages.
    while (this.processedMessageIds.size > 20) {
      this.processedMessageIds.delete(this.processedMessageIds.values().next().value);
    }

    if (newMessagesAdded) {
      this.updatePanel();
    }
  }

  // Method to add a sent message.
  addSentMessage(text, options = {}) {
    const isPrivate = options.isPrivate || false;
    const uniqueId = this._generateUniqueId(isPrivate, this.currentUsername, text);
    if (!isPrivate && this.processedMessageIds.has(uniqueId)) return;

    const messageObj = {
      id: uniqueId,
      from: this.currentUsername,
      text,
      timestamp: new Date().toISOString(),
      isPrivate,
      recipient: options.recipient || null,
      pending: options.pending || false
    };

    this.messages.push(messageObj);
    this.chatHistory.set(uniqueId, messageObj);
    if (!isPrivate) {
      this.processedMessageIds.add(uniqueId);
    }
    this.updatePanel();

    return uniqueId;
  }

  updatePendingStatus(messageId, pendingStatus) {
    const msg = this.chatHistory.get(messageId);
    if (msg) {
      msg.pending = pendingStatus;
      this.updatePanel();
    }
  }

  updatePanel() {
    if (!this.panel) return;
    this.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const renderedIds = new Set(
      Array.from(this.panel.querySelectorAll('.message')).map(el => el.getAttribute('data-message-id'))
    );

    let mentionDetected = false;

    this.messages.forEach(msg => {
      if (!renderedIds.has(msg.id)) {
        const date = new Date(msg.timestamp);
        const formattedTime = date.toLocaleTimeString('en-GB', { hour12: false });
        const normalizedUsername = parseUsername(msg.from);
        const usernameColor = usernameColors.getColor(normalizedUsername);

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        if (msg.isPrivate) {
          messageDiv.classList.add('private-message');
          messageDiv.classList.add(msg.from === this.currentUsername ? 'sent' : 'received');
          if (msg.recipient) {
            messageDiv.setAttribute('data-recipient', msg.recipient);
          }
        }

        if (msg.text.startsWith('/me ')) {
          messageDiv.classList.add('system');
          msg.text = `${msg.from} ${msg.text.substring(msg.text.indexOf(' ') + 1)}`;
        }

        if (msg.isSystem) {
          messageDiv.classList.add('system');
        }

        messageDiv.setAttribute('data-message-id', msg.id);

        const messageInfoDiv = document.createElement('div');
        messageInfoDiv.className = 'message-info';

        let usernameDisplay = msg.from;
        if (msg.isPrivate) {
          usernameDisplay = msg.from === this.currentUsername && msg.recipient
            ? `→ ${msg.recipient}`
            : `${msg.from} →`;
        }

        messageInfoDiv.innerHTML = `
          <span class="time">${formattedTime}</span>
          <span class="username" style="color: ${usernameColor}">${usernameDisplay}</span>
        `;

        const messageTextDiv = document.createElement('div');
        messageTextDiv.className = 'message-text';
        messageTextDiv.innerHTML = parseMessageText(msg.text);

        if (msg.pending) {
          const pendingIcon = document.createElement('span');
          pendingIcon.className = 'pending-emoji';
          pendingIcon.textContent = ' ⏱️';
          messageTextDiv.appendChild(pendingIcon);
        }

        messageDiv.appendChild(messageInfoDiv);
        messageDiv.appendChild(messageTextDiv);
        this.panel.appendChild(messageDiv);

        if (this.currentUsername && msg.text.includes(this.currentUsername)) {
          mentionDetected = true;
        }
      }
    });

    this.addDelegatedClickListeners();
    highlightMentionWords([this.currentUsername]);

    requestAnimationFrame(() => {
      scrollToBottom();
    });

    if (this.initialLoadComplete && mentionDetected) {
      playMentionSound();
    }

    if (!this.initialLoadComplete) {
      this.initialLoadComplete = true;
    }

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
          const messageInput = document.getElementById('message-input');
          if (event.ctrlKey) {
            messageInput.value = `/pm ${selectedUsername} `;
            handlePrivateMessageInput(messageInput);
          } else {
            const appendUsername = `${selectedUsername}, `;
            if (!messageInput.value.includes(appendUsername)) {
              messageInput.value += appendUsername;
            }
          }
          messageInput.focus();
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
    return Array.from(this.chatHistory.values());
  }

  refreshMessages(connectionStatus = false) {
    const systemMessageId = "connection-status";
    const messageText = connectionStatus
      ? "Chat connection established. ✓"
      : "Chat connection lost. Reconnecting...";

    let systemMessage = this.chatHistory.get(systemMessageId);
    if (systemMessage) {
      systemMessage.text = messageText;
      systemMessage.timestamp = new Date().toISOString();
    } else {
      systemMessage = {
        id: systemMessageId,
        from: "System",
        text: messageText,
        timestamp: new Date().toISOString(),
        isPrivate: false,
        recipient: null,
        isSystem: true,
        pending: false
      };
      this.messages.push(systemMessage);
      this.chatHistory.set(systemMessageId, systemMessage);
      this.processedMessageIds.add(systemMessageId);
    }

    this.updateConnectionStatusInUI(systemMessage);
  }

  updateConnectionStatusInUI(systemMessage) {
    const messageDiv = this.panel.querySelector(`[data-message-id="${systemMessage.id}"]`);
    if (messageDiv) {
      messageDiv.remove();
    }
    this.updatePanel();
  }
}
