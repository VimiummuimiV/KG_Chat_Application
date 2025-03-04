import { colorHelpers, parseUsername, parseMessageText } from './helpers.js';
import { saveChatHistory } from './storage.js';

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
        
        // Extract username from Jabber ID format
        // Format: general@conference.jabber.klavogonki.ru/748754#Душа_Чата
        const from = fromAttr ? fromAttr.split('/')[1] || "unknown" : "unknown";
        
        // Extract timestamp from delay elements if available
        let timestamp = new Date().toISOString();
        const delayNodes = msg.getElementsByTagName("delay");
        if (delayNodes.length > 0 && delayNodes[0].getAttribute("stamp")) {
          timestamp = delayNodes[0].getAttribute("stamp");
        }
        
        // Skip if this is a message we just sent (to avoid duplicates)
        const isDuplicate = from === this.currentUsername && this.sentMessageTexts.has(text);
        
        if (!isDuplicate) {
          this.messages.push({
            id: messageId,
            from,
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
      from: this.currentUsername,
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
    
    this.panel.innerHTML = this.messages.map(msg => {
      // Format time as HH:MM:SS in 24-hour format
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
          <div class="message-text">${parseMessageText(msg.text)}</div>
        </div>
      `;
    }).join('');
    
    // Scroll to the bottom to show the latest messages
    this.panel.scrollTop = this.panel.scrollHeight;
  }
}