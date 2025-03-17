import {
  parseUsername,
  parseMessageText,
  scrollToBottom,
  highlightMentionWords,
  playMentionSound,
  usernameColors,
  handlePrivateMessageInput,
  calibrateToMoscowTime
} from './helpers.js';

import ChatMessagesRemover from './ChatMessagesRemover.js';

export default class MessageManager {
  constructor(panelId = 'messages-panel', currentUsername = '') {
    this.panel = document.getElementById(panelId);
    this.messages = [];
    this.messageIdCounter = 0;
    this.currentUsername = currentUsername;
    this.sentMessageTexts = new Set(); // Track recently sent messages
    this.processedMessageIds = new Set(); // Now used exclusively for deduplication
    this.chatHistory = new Map(); // Local in-memory map for chat history
    this.initialLoadComplete = false;

    // Integrate the message remover
    this.chatRemover = new ChatMessagesRemover();
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

      // Generate a unique id based solely on username and message text.
      const uniqueId = `<${cleanFrom}>${text}`;

      // Skip this message if it has already been processed.
      if (this.processedMessageIds.has(uniqueId)) return;

      // Get timestamp from <delay> if available, otherwise use current time.
      let timestamp = new Date().toISOString();
      const delayNodes = msg.getElementsByTagName("delay");
      if (delayNodes.length && delayNodes[0].getAttribute("stamp")) {
        timestamp = delayNodes[0].getAttribute("stamp");
      }

      const toAttr = msg.getAttribute("to");
      const type = msg.getAttribute("type");
      const isPrivate = type === 'chat';
      let recipient = null;
      if (isPrivate && toAttr) {
        recipient = toAttr.split('#')[1]?.split('@')[0] || toAttr;
        recipient = parseUsername(recipient);
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
      this.processedMessageIds.add(uniqueId);
      newMessagesAdded = true;
    });

    if (newMessagesAdded) {
      this.updatePanel();
    }
  }

  // Method to add a sent message.
  addSentMessage(text, options = {}) {
    this.sentMessageTexts.add(text);

    // Generate a unique ID using the same format as processMessages
    const uniqueId = `<${this.currentUsername}>${text}`;

    const messageObj = {
      id: uniqueId,
      from: this.currentUsername,
      text,
      timestamp: new Date().toISOString(),
      isPrivate: options.isPrivate || false,
      recipient: options.recipient || null,
      pending: options.pending || false
    };

    // Skip if this exact message has already been processed
    if (this.processedMessageIds.has(uniqueId)) return;

    this.messages.push(messageObj);
    this.chatHistory.set(uniqueId, messageObj);
    this.processedMessageIds.add(uniqueId);
    this.updatePanel();

    // Limit the size of the sent messages set.
    if (this.sentMessageTexts.size > 20) {
      const entries = Array.from(this.sentMessageTexts);
      for (let i = 0; i < entries.length - 20; i++) {
        this.sentMessageTexts.delete(entries[i]);
      }
    }

    return uniqueId; // Return the ID so it can be used for updating pending status
  }

  // New: Update pending status of a message by ID.
  updatePendingStatus(messageId, pendingStatus) {
    const msg = this.chatHistory.get(messageId);
    if (msg) {
      msg.pending = pendingStatus;
      this.updatePanel();
    }
  }

  updatePanel() {
    if (!this.panel) return;
    // Ensure messages are in chronological order.
    this.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Get IDs of messages already rendered.
    const renderedIds = new Set(
      Array.from(this.panel.querySelectorAll('.message')).map(el => el.getAttribute('data-message-id'))
    );

    let mentionDetected = false;

    // Append only messages that haven't been rendered.
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

        // Append pending icon if message is pending.
        if (msg.pending) {
          const pendingIcon = document.createElement('span');
          pendingIcon.className = 'pending-emoji';
          pendingIcon.textContent = ' ⏱️';
          messageTextDiv.appendChild(pendingIcon);
        }

        messageDiv.appendChild(messageInfoDiv);
        messageDiv.appendChild(messageTextDiv);
        this.panel.appendChild(messageDiv);

        // Check if the message contains a mention of the current user
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

    // Only play mention sound if initial messages have already loaded
    if (this.initialLoadComplete && mentionDetected) {
      playMentionSound();
    }

    // Mark initial load as complete after the first call
    if (!this.initialLoadComplete) {
      this.initialLoadComplete = true;
    }

    // Update the message remover so it applies deletion state to new messages.
    if (this.chatRemover) {
      this.chatRemover.updateDeletedMessages();
      this.chatRemover.renderToggle();
    }
  }

  addDelegatedClickListeners() {
    // Attach the listener only once using a custom flag.
    if (!this.panel._delegatedClickAttached) {
      this.panel.addEventListener("click", (event) => {
        // --- Username click handling --- 
        const usernameEl = event.target.closest('.username');
        if (usernameEl && this.panel.contains(usernameEl)) {
          const usernameText = usernameEl.textContent.trim();
          let selectedUsername = usernameText;
          // Handle arrow formatting used in private messages.
          if (selectedUsername.includes('→')) {
            if (selectedUsername.startsWith('→')) {
              selectedUsername = selectedUsername.replace('→', '').trim();
            } else {
              selectedUsername = selectedUsername.split('→')[0].trim();
            }
          }
          const messageInput = document.getElementById('message-input');
          if (event.ctrlKey) {
            // Ctrl+Click: Prepare for a private message.
            messageInput.value = `/pm ${selectedUsername} `;
            handlePrivateMessageInput(messageInput);
          } else {
            // Normal click: Append username if not already present.
            const appendUsername = `${selectedUsername}, `;
            if (!messageInput.value.includes(appendUsername)) {
              messageInput.value += appendUsername;
            }
          }
          messageInput.focus();
        }

        // --- Time element click handling --- 
        const timeEl = event.target.closest('.time');
        if (timeEl && this.panel.contains(timeEl)) {
          // Extract the local time text (assumed format "HH:MM:SS")
          const localTime = timeEl.textContent.trim();
          // Calibrate the time using the provided function.
          const moscowTime = calibrateToMoscowTime(localTime);
          // Create today's date in the format "YYYY-MM-DD"
          const today = new Intl.DateTimeFormat('en-CA').format(new Date());
          // Build the URL to the chat logs with the calibrated time as the hash.
          const url = `https://klavogonki.ru/chatlogs/${today}.html#${moscowTime}`;

          // Open in a new tab.
          window.open(url, '_blank');
        }
      });
      // Use a unified flag to ensure the listener is attached only once.
      this.panel._delegatedClickAttached = true;
    }
  }

  getChatHistory() {
    return Array.from(this.chatHistory.values());
  }

  refreshMessages(connectionStatus = false) {
    // Generate a unique ID for each system message using a timestamp
    const systemMessageId = `system-connection-${Date.now()}`;
    const messageText = connectionStatus
      ? "Chat connection established. ✓"
      : "Chat connection lost. Reconnecting...";

    // Create a new system message object
    const systemMessage = {
      id: systemMessageId,
      from: "System",
      text: messageText,
      timestamp: new Date().toISOString(),
      isPrivate: false,
      recipient: null,
      isSystem: true,
      pending: false
    };

    // Add the new message to the messages array, chatHistory map, and processed IDs set
    this.messages.push(systemMessage);
    this.chatHistory.set(systemMessageId, systemMessage);
    this.processedMessageIds.add(systemMessageId);

    // Update the UI with the new message
    this.updatePanel();
  }
}
