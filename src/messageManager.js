import { colorHelpers, parseUsername, parseMessageText, scrollToBottom } from './helpers.js';

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
      // Generate a message ID if one isn’t provided
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

        // Extract username from Jabber ID format and clean it
        const from = fromAttr ? fromAttr.split('/')[1] || "unknown" : "unknown";
        const cleanFrom = parseUsername(from);

        // Extract timestamp from delay elements if available
        let timestamp = new Date().toISOString();
        const delayNodes = msg.getElementsByTagName("delay");
        if (delayNodes.length > 0 && delayNodes[0].getAttribute("stamp")) {
          timestamp = delayNodes[0].getAttribute("stamp");
        }

        // Skip if this is a duplicate of a message we just sent
        const isDuplicate = cleanFrom === this.currentUsername && this.sentMessageTexts.has(text);

        if (!isDuplicate) {
          const messageObj = {
            id: messageId,
            from: cleanFrom,
            text,
            timestamp
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
  addSentMessage(text) {
    this.sentMessageTexts.add(text);
    const messageId = `msg_${Date.now()}`;
    const messageObj = {
      id: messageId,
      from: this.currentUsername,
      text,
      timestamp: new Date().toISOString()
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

  // Update the messages panel with the stored messages
  updatePanel() {
    if (!this.panel) return;

    // Sort messages by timestamp to ensure chronological order
    this.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    this.panel.innerHTML = this.messages.map(msg => {
      const date = new Date(msg.timestamp);
      const formattedTime = date.toLocaleTimeString('en-GB', { hour12: false });
      const usernameColor = colorHelpers.getUsernameColor(msg.from);

      return `
      <div class="message ${msg.from === this.currentUsername ? 'sent' : ''}">
        <div class="message-info">
          <span class="time">${formattedTime}</span>
          <span class="username" style="color: ${usernameColor}">${msg.from}</span>
        </div>
        <div class="message-text">${parseMessageText(msg.text)}</div>
      </div>
    `;
    }).join('');

    scrollToBottom();
  }

  // Optional: Retrieve the in-memory chat history as an array
  getChatHistory() {
    return Array.from(this.chatHistory.values());
  }
}
