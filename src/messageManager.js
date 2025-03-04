import { colorHelpers, parseUsername, parseMessageText } from './helpers.js';
import { saveChatHistory, loadChatHistory } from './storage.js';

export default class MessageManager {
  constructor(panelId = 'messages-panel', currentUsername = '') {
    this.panel = document.getElementById(panelId);
    this.messages = [];
    this.messageIdCounter = 0;
    this.currentUsername = currentUsername;
    this.sentMessageTexts = new Set(); // Track recently sent messages
    this.processedMessageIds = new Set(); // Track message IDs to prevent duplicates
  }

  // Process incoming XML response and extract message bodies
  processMessages(xmlResponse) {
    if (!xmlResponse || typeof xmlResponse !== 'string') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const messageElements = doc.getElementsByTagName("message");
    let newMessagesAdded = false;

    Array.from(messageElements).forEach(msg => {
      // Extract message ID to prevent duplicates
      const messageId = msg.getAttribute("id") || `msg_${this.messageIdCounter++}`;

      // Skip if we've already processed this message
      if (this.processedMessageIds.has(messageId)) {
        return;
      }

      const bodyNode = msg.getElementsByTagName("body")[0];
      if (bodyNode && bodyNode.textContent) {
        const text = bodyNode.textContent;
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

        // Skip if this is a message we just sent (to avoid duplicates)
        const isDuplicate = cleanFrom === this.currentUsername && this.sentMessageTexts.has(text);

        if (!isDuplicate) {
          this.messages.push({
            id: messageId,
            from: cleanFrom, // Use the cleaned username
            text,
            timestamp
          });

          // Mark this message ID as processed
          this.processedMessageIds.add(messageId);
          newMessagesAdded = true;
        }
      }
    });

    // Update the panel only if new messages were added
    if (newMessagesAdded) {
      this.updatePanel();
      // Optionally save to localStorage for persistence between page reloads
      saveChatHistory(this.messages);
    }
  }

  // Add a method to track sent messages
  addSentMessage(text) {
    this.sentMessageTexts.add(text);
    const messageId = `msg_${Date.now()}`;
    this.messages.push({
      id: messageId,
      from: this.currentUsername, // Already clean
      text,
      timestamp: new Date().toISOString()
    });
    this.processedMessageIds.add(messageId);
    this.updatePanel();

    // Optionally save to localStorage
    saveChatHistory(this.messages);

    // Clean up sentMessageTexts if it gets too large
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

    // Scroll to the bottom
    this.panel.scrollTop = this.panel.scrollHeight;
  }

  // New function to load recent messages from localStorage (runs once on page load)
  loadRecentMessages() {
    const savedMessages = loadChatHistory();
    if (savedMessages && savedMessages.length > 0) {
      savedMessages.forEach(msg => {
        msg.from = parseUsername(msg.from);
        // Only add if not already processed
        if (!this.processedMessageIds.has(msg.id)) {
          this.messages.push(msg);
          this.processedMessageIds.add(msg.id);
        }
      });
      this.updatePanel(); // Updates with sorted messages
    }
  }
}
