import { colorHelpers, parseUsername } from './helpers';

export default class MessageManager {
  constructor(panelId = 'messages-panel', currentUsername = '') {
    this.panel = document.getElementById(panelId);
    this.messages = [];
    this.messageIdCounter = 0;
    this.currentUsername = currentUsername;
    this.sentMessageTexts = new Set(); // Track recently sent messages
  }

  // Process incoming XML response and extract message bodies.
  processMessages(xmlResponse) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const messageElements = doc.getElementsByTagName("message");
    
    Array.from(messageElements).forEach(msg => {
      const bodyNode = msg.getElementsByTagName("body")[0];
      if (bodyNode) {
        const text = bodyNode.textContent;
        const fromAttr = msg.getAttribute("from");
        // Get the portion after the '/' (or fallback to "unknown")
        const from = fromAttr ? fromAttr.split('/')[1] : "unknown";
        
        if (text) {
          // Skip if this is a message we just sent (to avoid duplicates)
          const isDuplicate = from === this.currentUsername && this.sentMessageTexts.has(text);
          
          if (!isDuplicate) {
            this.messages.push({
              id: `msg_${this.messageIdCounter++}`,
              from,
              text,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });
    
    // Clean up old entries from sentMessageTexts (optional)
    if (this.sentMessageTexts.size > 20) {
      const entries = Array.from(this.sentMessageTexts);
      for (let i = 0; i < entries.length - 20; i++) {
        this.sentMessageTexts.delete(entries[i]);
      }
    }
    
    this.updatePanel();
  }

  // Add a method to track sent messages
  addSentMessage(text) {
    this.sentMessageTexts.add(text);
    this.messages.push({
      id: `msg_${this.messageIdCounter++}`,
      from: this.currentUsername,
      text,
      timestamp: new Date().toISOString()
    });
    this.updatePanel();
  }

  // Update the messages panel with the stored messages.
  updatePanel() {
    this.panel.innerHTML = this.messages.map(msg => {
      // Format time as HH:MM:SS in 24-hour format.
      const date = new Date(msg.timestamp);
      const formattedTime = date.toLocaleTimeString('en-GB', { hour12: false });
      // Parse the username to remove any leading numeric id and '#'
      const cleanLogin = parseUsername(msg.from);
      // Generate consistent username color
      const usernameColor = colorHelpers.getUsernameColor(cleanLogin);
      
      return `
        <div class="message ${msg.from === this.currentUsername ? 'sent' : ''}">
          <div class="message-info">
            <span class="time">${formattedTime}</span>
            <span class="username" style="color: ${usernameColor}">${cleanLogin}</span>
          </div>
          <div class="message-text">${this.parseMessageText(msg.text)}</div>
        </div>
      `;
    }).join('');
    this.panel.scrollTop = this.panel.scrollHeight;
  }

  parseMessageText(text) {
    // Basic text parsing – you can expand this if needed.
    return text;
  }
}