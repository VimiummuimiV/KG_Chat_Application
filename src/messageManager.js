export default class MessageManager {
  constructor(panelId = 'messages-panel', currentUsername = '') {
    this.panel = document.getElementById(panelId);
    this.messages = [];
    this.messageIdCounter = 0;
    this.currentUsername = currentUsername;
  }

  // Process incoming XML response and extract message bodies
  processMessages(xmlResponse) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const messageElements = doc.getElementsByTagName("message");

    // For each <message> tag, find its <body> content
    Array.from(messageElements).forEach(msg => {
      const bodyNode = msg.getElementsByTagName("body")[0];
      if (bodyNode) {
        const text = bodyNode.textContent;
        const fromAttr = msg.getAttribute("from");
        const from = fromAttr ? fromAttr.split('/')[1] : "unknown";
        if (text) {
          this.messages.push({
            id: `msg_${this.messageIdCounter++}`,
            from,
            text,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    this.updatePanel();
  }

  // Update the messages panel with the stored messages
  updatePanel() {
    this.panel.innerHTML = this.messages.map(msg => `
      <div class="message ${msg.from === this.currentUsername ? 'sent' : ''}">
        <div class="message-info">
          ${msg.from} • ${new Date(msg.timestamp).toLocaleTimeString()}
        </div>
        <div class="message-text">${this.parseMessageText(msg.text)}</div>
      </div>
    `).join('');
    this.panel.scrollTop = this.panel.scrollHeight;
  }

  parseMessageText(text) {
    // Basic text parsing – expand if needed
    return text;
  }
}
