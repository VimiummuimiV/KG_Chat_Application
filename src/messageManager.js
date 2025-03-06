import { parseUsername, parseMessageText, scrollToBottom, highlightMentionWords, usernameColors, handlePrivateMessageInput } from './helpers.js';

export default class MessageManager {
  constructor(panelId = 'messages-panel', currentUsername = '') {
    this.panel = document.getElementById(panelId);
    this.messages = [];
    this.messageIdCounter = 0;
    this.currentUsername = currentUsername;
    this.sentMessageTexts = new Set(); // Track recently sent messages
    this.processedMessageIds = new Set(); // Track message IDs to prevent duplicates
    this.chatHistory = new Map(); // Local in-memory map for chat history
  }

  // Process incoming XML response and extract message bodies
  processMessages(xmlResponse) {
    if (!xmlResponse || typeof xmlResponse !== 'string') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const messageElements = doc.getElementsByTagName("message");
    let newMessagesAdded = false;

    Array.from(messageElements).forEach(msg => {
      // Generate a message ID if one isn't provided
      const messageId = msg.getAttribute("id") || `msg_${this.messageIdCounter++}`;

      // Skip if we've already processed this message
      if (this.processedMessageIds.has(messageId)) {
        return;
      }

      const bodyNode = msg.getElementsByTagName("body")[0];
      if (bodyNode && bodyNode.textContent) {
        const text = bodyNode.textContent;

        // Exclude the specific unwanted message text
        if (text.trim() === "This room is not anonymous") {
          return;
        }

        const fromAttr = msg.getAttribute("from");
        const toAttr = msg.getAttribute("to");
        const type = msg.getAttribute("type");

        // Determine if this is a private message
        const isPrivate = type === 'chat';

        // Extract username from Jabber ID format and clean it
        const from = fromAttr ? fromAttr.split('#')[1]?.split('@')[0] || "unknown" : "unknown";
        const cleanFrom = parseUsername(from);

        // Extract recipient for private messages
        let recipient = null;
        if (isPrivate && toAttr) {
          recipient = toAttr.split('#')[1]?.split('@')[0] || toAttr;
          recipient = parseUsername(recipient);
        }

        // Extract timestamp from delay elements if available
        let timestamp = new Date().toISOString();
        const delayNodes = msg.getElementsByTagName("delay");
        if (delayNodes.length > 0 && delayNodes[0].getAttribute("stamp")) {
          timestamp = delayNodes[0].getAttribute("stamp");
        }

        // Skip if this is a duplicate of a message we just sent (for group chat only)
        const isDuplicate = !isPrivate && cleanFrom === this.currentUsername && this.sentMessageTexts.has(text);

        if (!isDuplicate) {
          const messageObj = {
            id: messageId,
            from: cleanFrom,
            text,
            timestamp,
            isPrivate,
            recipient
          };

          this.messages.push(messageObj);
          this.chatHistory.set(messageId, messageObj); // Save in the local memory map
          this.processedMessageIds.add(messageId);
          newMessagesAdded = true;
        }
      }
    });

    // Update the panel only if new messages were added
    if (newMessagesAdded) {
      this.updatePanel();
    }
  }

  // Method to add a sent message
  addSentMessage(text, options = {}) {
    this.sentMessageTexts.add(text);
    const messageId = `msg_${Date.now()}`;
    const messageObj = {
      id: messageId,
      from: this.currentUsername,
      text,
      timestamp: new Date().toISOString(),
      isPrivate: options.isPrivate || false,
      recipient: options.recipient || null
    };
    this.messages.push(messageObj);
    this.chatHistory.set(messageId, messageObj); // Save in the local memory map
    this.processedMessageIds.add(messageId);
    this.updatePanel();

    // Keep the sent messages set from growing too large
    if (this.sentMessageTexts.size > 20) {
      const entries = Array.from(this.sentMessageTexts);
      for (let i = 0; i < entries.length - 20; i++) {
        this.sentMessageTexts.delete(entries[i]);
      }
    }
  }

  updatePanel() {
    if (!this.panel) return;

    // Ensure messages are in chronological order.
    this.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Build a set of IDs already rendered in the panel.
    const renderedIds = new Set(
      Array.from(this.panel.querySelectorAll('.message')).map(el => el.getAttribute('data-message-id'))
    );

    // Append only messages that have not been rendered.
    this.messages.forEach(msg => {
      if (!renderedIds.has(msg.id)) {
        const date = new Date(msg.timestamp);
        const formattedTime = date.toLocaleTimeString('en-GB', { hour12: false });
        const usernameColor = usernameColors.getColor(msg.from);

        // Create the container for the message.
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        // Add private message class if applicable
        if (msg.isPrivate) {
          messageDiv.classList.add('private-message');
          messageDiv.classList.add(msg.from === this.currentUsername ? 'sent' : 'received');

          // Add recipient info for display
          if (msg.recipient) {
            messageDiv.setAttribute('data-recipient', msg.recipient);
          }
        }

        // Handle system messages (/me)
        if (msg.text.startsWith('/me ')) {
          messageDiv.classList.add('system');
          msg.text = `${msg.from} ${msg.text.substring(msg.text.indexOf(' ') + 1)}`;
        }

        messageDiv.setAttribute('data-message-id', msg.id);

        // Create the message info block.
        const messageInfoDiv = document.createElement('div');
        messageInfoDiv.className = 'message-info';

        // Create the username display, adding private indicator if needed
        let usernameDisplay = msg.from;
        if (msg.isPrivate) {
          if (msg.from === this.currentUsername && msg.recipient) {
            usernameDisplay = `→ ${msg.recipient}`;
          } else {
            usernameDisplay = `${msg.from} →`;
          }
        }

        messageInfoDiv.innerHTML = `
          <span class="time">${formattedTime}</span>
          <span class="username" style="color: ${usernameColor}">${usernameDisplay}</span>
        `;

        // Create the message text block.
        const messageTextDiv = document.createElement('div');
        messageTextDiv.className = 'message-text';
        messageTextDiv.innerHTML = parseMessageText(msg.text);

        // Append info and text to the message container.
        messageDiv.appendChild(messageInfoDiv);
        messageDiv.appendChild(messageTextDiv);

        // Append the new message to the messages panel.
        this.panel.appendChild(messageDiv);
      }
    });

    // Attach click listeners for username elements.
    this.addUsernameClickListeners();

    highlightMentionWords([this.currentUsername]);

    // Scroll to the bottom of the messages panel.
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }

  addUsernameClickListeners() {
    const usernames = this.panel.querySelectorAll('.username');
    const messageInput = document.getElementById('message-input');

    usernames.forEach(username => {
      username.addEventListener('click', (event) => {
        const usernameText = username.textContent.trim();
        let selectedUsername = usernameText;

        // Extract proper username if it contains arrows (for private messages)
        if (selectedUsername.includes('→')) {
          if (selectedUsername.startsWith('→')) {
            selectedUsername = selectedUsername.replace('→', '').trim();
          } else {
            selectedUsername = selectedUsername.split('→')[0].trim();
          }
        }

        if (event.ctrlKey) {
          // Ctrl+Click: Start private chat with user
          messageInput.value = `/pm ${selectedUsername} `;
          handlePrivateMessageInput(messageInput);
        } else {
          // Normal Click: Append username if not already present
          const appendUsername = `${selectedUsername}, `;
          if (!messageInput.value.includes(appendUsername)) {
            messageInput.value += appendUsername;
          }
        }

        // Focus the input after setting the value
        messageInput.focus();
      });
    });
  }

  // Optional: Retrieve the in-memory chat history as an array
  getChatHistory() {
    return Array.from(this.chatHistory.values());
  }
}