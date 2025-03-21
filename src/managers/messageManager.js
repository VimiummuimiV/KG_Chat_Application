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
    this.messageMap = new Map(); // Single map to store all messages
    this.currentUsername = currentUsername;
    this.maxMessages = 20; // Maximum number of messages to keep
    this.initialLoadComplete = false;
    // Integrate the message remover
    this.chatRemover = new ChatMessagesRemover();
  }

  // Helper to generate a unique ID based on message type
  generateUniqueId(messageType, username, text) {
    if (messageType === 'system') {
      return 'chat-connection';
    } else if (messageType === 'private') {
      return `private-${generateRandomString()}`;
    } else {
      return `<${username}>${text}`;
    }
  }

  // Helper to add a message to the map
  addMessage(messageObj) {
    const { id } = messageObj;

    this.messageMap.set(id, messageObj);
    this.trimMessages();

    console.log(this.messageMap);
    return true;
  }

  // Helper to trim excess messages
  trimMessages() {
    const messages = Array.from(this.messageMap.entries());
    if (messages.length > this.maxMessages) {
      const toRemove = messages.slice(0, messages.length - this.maxMessages);
      toRemove.forEach(([id]) => this.messageMap.delete(id));
    }
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

      const uniqueId = this.generateUniqueId(isPrivate ? 'private' : 'public', cleanFrom, text);
      const messageObj = {
        id: uniqueId,
        from: cleanFrom,
        text,
        isPrivate,
        recipient,
        pending: false
      };

      if (this.addMessage(messageObj)) {
        newMessagesAdded = true;
      }
    });

    if (newMessagesAdded) {
      this.updatePanel();
    }
  }

  // Method to add a sent message.
  addSentMessage(text, options = {}) {
    const isPrivate = options.isPrivate || false;
    const uniqueId = this.generateUniqueId(isPrivate ? 'private' : 'public', this.currentUsername, text);
    const messageObj = {
      id: uniqueId,
      from: this.currentUsername,
      text,
      isPrivate,
      recipient: options.recipient || null,
      pending: options.pending || false
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
    const renderedIds = new Set(
      Array.from(this.panel.querySelectorAll('.message')).map(el => el.getAttribute('data-message-id'))
    );
    let mentionDetected = false;

    // Render messages from the map
    const messageEntries = Array.from(this.messageMap.entries());
    messageEntries.forEach(([id, msg]) => {
      if (!renderedIds.has(id)) {
        const formattedTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
        const normalizedUsername = parseUsername(msg.from);
        const usernameColor = usernameColors.getColor(normalizedUsername);
        const messageEl = document.createElement('div');
        messageEl.className = 'message';

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

        messageEl.setAttribute('data-message-id', id);
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
        this.panel.appendChild(messageEl);

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
            messageInput.value = `/pm ${selectedUsername}`;
            handlePrivateMessageInput(messageInput);
          } else {
            const appendUsername = `${selectedUsername},`;
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
    return Array.from(this.messageMap.values());
  }

  refreshMessages(connectionStatus = false) {
    const messageText = connectionStatus
      ? "Chat connection established. ✓"
      : "Chat connection lost. Reconnecting...";

    // Remove previous system messages
    Array.from(this.messageMap.entries()).forEach(([id, msg]) => {
      if (msg.isSystem) {
        this.messageMap.delete(id);
      }
    });

    const systemMessageId = this.generateUniqueId('system', 'System', messageText);
    const systemMessage = {
      id: systemMessageId,
      from: "System",
      text: messageText,
      isPrivate: false,
      recipient: null,
      isSystem: true,
      pending: false
    };

    this.messageMap.set(systemMessageId, systemMessage);
    this.updateConnectionStatusInUI(systemMessage);
  }

  updateConnectionStatusInUI(systemMessage) {
    // Ensure the clock icon is removed if present
    this.panel.querySelectorAll('.pending-emoji').forEach(el => el.remove());

    // Find the system message element and remove it if it exists
    const systemMessageElement = this.panel.querySelector(`[data-message-id="${systemMessage.id}"]`);
    if (systemMessageElement) {
      systemMessageElement.remove();
    }

    // Update the panel to reflect changes
    this.updatePanel();
  }
}
