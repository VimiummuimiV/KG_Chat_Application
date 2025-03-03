// ------------------------- XMPP Client & User Manager -------------------------

class UserManager {
  constructor() {
    this.container = document.getElementById('user-list');
    this.activeUsers = new Map();
  }
  updatePresence(xmlResponse) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const presences = doc.getElementsByTagName("presence");
    if (xmlResponse.includes('<presence id="pres_1"')) {
      console.log("🔄 Initial room join detected, requesting full roster");
      this.requestFullRoster();
      return;
    }
    let changes = false;
    for (let i = 0; i < presences.length; i++) {
      const presence = presences[i];
      const from = presence.getAttribute('from');
      const type = presence.getAttribute('type');
      if (type === 'unavailable') {
        if (this.activeUsers.has(from)) {
          console.log(`🚪 User left: ${this.activeUsers.get(from).login || from}`);
          this.activeUsers.delete(from);
          changes = true;
        }
        continue;
      }
      let xData = null;
      const xElements = presence.getElementsByTagName("x");
      for (let j = 0; j < xElements.length; j++) {
        if (xElements[j].namespaceURI === "klavogonki:userdata") {
          xData = xElements[j];
          break;
        }
      }
      if (!xData) {
        console.log(`⚠️ No klavogonki:userdata found for presence from: ${from}`);
        continue;
      }
      const userNode = xData.getElementsByTagName("user")[0];
      if (!userNode) {
        console.log(`⚠️ No user node found in klavogonki:userdata for presence from: ${from}`);
        continue;
      }
      const login = userNode.getElementsByTagName("login")[0]?.textContent || 'Anonymous';
      const avatar = userNode.getElementsByTagName("avatar")[0]?.textContent;
      const background = userNode.getElementsByTagName("background")[0]?.textContent || '#777';
      const gameNode = xData.getElementsByTagName("game_id")[0];
      const game = gameNode ? gameNode.textContent : null;
      const role = presence.getElementsByTagName("item")[0]?.getAttribute("role") || 'participant';
      const user = { jid: from, login, avatar, color: background, role, game };
      const existingUser = this.activeUsers.get(from);
      if (!existingUser || JSON.stringify(existingUser) !== JSON.stringify(user)) {
        console.log(`👤 User ${existingUser ? 'updated' : 'joined'}: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
      }
    }
    if (changes) {
      console.log(`📋 Current active users: ${this.activeUsers.size}`);
      this.updateUI();
    }
  }
  async requestFullRoster() {
    console.log("📑 Would request full roster here (using existing data for now)");
    this.updateUI();
  }
  updateUI() {
    console.log(`🖥️ Updating UI with ${this.activeUsers.size} users`);
    this.container.innerHTML = createUserListUI(Array.from(this.activeUsers.values()));
  }
}

const xmppClient = {
  userManager: null,
  messages: loadChatHistory(), // Load persisted messages (if any) from today's session.
  messageIdCounter: 0,
  sid: null,
  rid: Math.floor(Date.now() / 1000),
  async connect() {
    try {
      console.log('🌐 Step 1: Connecting to XMPP server...');
      const initResponse = await this.sendRequestWithRetry(
        `<body xmlns='http://jabber.org/protocol/httpbind'
               rid='${this.nextRid()}'
               to='jabber.klavogonki.ru'
               xml:lang='en'
               wait='60'
               hold='1'
               ver='1.6'
               xmpp:version='1.0'
               xmlns:xmpp='urn:xmpp:xbosh'/>`
      );
      this.sid = initResponse.match(/sid='(.*?)'/)[1];
      console.log(`🔑 Step 2: Session ID received: ${this.sid}`);
      await this.sleep(delay / 8);
      console.log('🔐 Step 3: Authenticating...');
      const authString = this.base64Encode('\x00' + username + '\x00' + password);
      const authResponse = await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='PLAIN'>${authString}</auth>
        </body>`
      );
      if (!authResponse.includes('<success')) {
        throw new Error('🚫 Authentication failed');
      }
      console.log('✅ Step 4: Authentication successful!');
      await this.sleep(delay / 8);
      console.log('🔄 Step 5: Restarting stream...');
      await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'
               to='jabber.klavogonki.ru'
               xmpp:restart='true'
               xmlns:xmpp='urn:xmpp:xbosh'/>`
      );
      await this.sleep(delay / 8);
      console.log('📦 Step 6: Binding resource...');
      await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <iq type='set' id='bind_1' xmlns='jabber:client'>
            <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'>
              <resource>web</resource>
            </bind>
          </iq>
        </body>`
      );
      await this.sleep(delay / 8);
      console.log('🔌 Step 7: Establishing session...');
      await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <iq type='set' id='session_1' xmlns='jabber:client'>
            <session xmlns='urn:ietf:params:xml:ns:xmpp-session'/>
          </iq>
        </body>`
      );
      await this.sleep(delay / 8);
      console.log('💬 Step 8: Joining chat room...');
      const joinResponse = await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <presence id='pres_1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru/${username}'>
            <x xmlns='http://jabber.org/protocol/muc'/>
          </presence>
        </body>`
      );
      console.log('📥 Join response:', joinResponse);
      this.userManager.updatePresence(joinResponse);
      await this.sleep(delay / 8);
      console.log('📋 Step 9: Requesting room information...');
      await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <iq type='get' id='info1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru'>
            <query xmlns='http://jabber.org/protocol/disco#info'/>
          </iq>
        </body>`
      );
      await this.sleep(delay);
      this.startPresencePolling();
      console.log('🚀 Step 10: Connected! Starting presence updates...');
    } catch (error) {
      console.error(`💥 Error: ${error.message}`);
    }
  },
  sendMessage(text) {
    const messageId = `msg_${Date.now()}`;
    const messageStanza = `
      <body rid='${this.nextRid()}' sid='${this.sid}' xmlns='http://jabber.org/protocol/httpbind'>
        <message to='general@conference.jabber.klavogonki.ru'
                 type='groupchat'
                 id='${messageId}'
                 xmlns='jabber:client'>
          <body>${text}</body>
        </message>
      </body>
    `;
    this.sendRequestWithRetry(messageStanza)
      .then(response => this.handleIncomingMessages(response))
      .catch(console.error);
  },
  handleIncomingMessages(xmlResponse) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const presences = doc.getElementsByTagName("presence");
    if (presences.length > 0) {
      this.userManager.updatePresence(xmlResponse);
    }
    const messages = doc.getElementsByTagName("message");
    for (const msg of messages) {
      const body = msg.getElementsByTagName("body")[0]?.textContent;
      const from = msg.getAttribute('from')?.split('/')[1];
      if (body && from && from !== username) {
        this.messages.push({
          id: `msg_${this.messageIdCounter++}`,
          from,
          text: body,
          timestamp: new Date().toISOString()
        });
        this.updateChatUI();
      }
    }
  },
  updateChatUI() {
    const panel = document.getElementById('messages-panel');
    panel.innerHTML = this.messages.map(msg => `
      <div class="message ${msg.from === username ? 'sent' : ''}">
        <div class="message-info">
          ${msg.from} • ${new Date(msg.timestamp).toLocaleTimeString()}
        </div>
        <div class="message-text">${parseMessageText(msg.text)}</div>
      </div>
    `).join('');
    panel.scrollTop = panel.scrollHeight;
    // Save the latest messages to localStorage.
    saveChatHistory(this.messages);
  },
  base64Encode(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return btoa(String.fromCharCode(...data));
  },
  nextRid() {
    this.rid++;
    return this.rid;
  },
  async sendRequest(payload) {
    const response = await fetch(XMPP_BIND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0'
      },
      body: payload
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  },
  async sendRequestWithRetry(payload, maxRetries = 5) {
    let lastError;
    let baseWaitTime = delay;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendRequest(payload);
      } catch (error) {
        lastError = error;
        if (error.message.includes('429')) {
          const waitTime = baseWaitTime * Math.pow(2, attempt);
          console.log(`⏱️ Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms...`);
          await this.sleep(waitTime);
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Max retries reached. Last error: ${lastError.message}`);
  },
  startPresencePolling() {
    setInterval(async () => {
      const xmlResponse = await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}' xmlns='http://jabber.org/protocol/httpbind'/>`
      );
      this.handleIncomingMessages(xmlResponse);
    }, userListDelay);
  },
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// ------------------------- Chat Toggle & Initialization -------------------------

function toggleChatVisibility() {
  const chatContainer = document.getElementById('chat-container');
  const toggleButton = document.querySelector('.chat-toggle-button');
  if (!chatContainer) return;
  const chatState = JSON.parse(localStorage.getItem('chatState')) || {};
  const isFloating = chatState.floating || false;
  if (isFloating) {
    chatContainer.style.opacity = chatContainer.style.opacity === '0' ? '1' : '0';
    setTimeout(() => {
      chatContainer.style.display = chatContainer.style.opacity === '0' ? 'none' : 'flex';
      toggleButton.innerHTML = chatContainer.style.display === 'none' ? openSVG : closeSVG;
    }, 300);
  } else {
    chatContainer.classList.toggle('visible-chat');
    chatContainer.classList.toggle('hidden-chat');
    const isChatVisible = chatContainer.classList.contains('visible-chat');
    toggleButton.innerHTML = isChatVisible ? closeSVG : openSVG;
  }
}

function addChatToggleFeature() {
  const chatContainer = document.getElementById('chat-container');
  const closeButton = document.getElementById('chat-close-btn');
  const draggableHeader = document.getElementById('chat-header');
  if (!chatContainer) return;
  chatContainer.classList.add('visible-chat');
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'Space') toggleChatVisibility();
  });
  closeButton?.addEventListener('click', toggleChatVisibility);
  draggableHeader?.addEventListener('dblclick', toggleChatVisibility);
}

function initializeApp() {
  createChatUI();
  addChatToggleFeature();
  xmppClient.userManager = new UserManager();
  // Render persisted messages from localStorage
  xmppClient.updateChatUI();
  const input = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  sendButton.addEventListener('click', () => {
    const text = input.value.trim();
    if (text) {
      xmppClient.messages.push({
        id: `msg_${xmppClient.messageIdCounter++}`,
        from: username,
        text,
        timestamp: new Date().toISOString()
      });
      xmppClient.updateChatUI();
      xmppClient.sendMessage(text);
      input.value = '';
    }
  });
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });
  xmppClient.connect();
}

initializeApp();