import { closeSVG, openSVG, sendSVG } from "./src/icons"; // icons
import {
  delay,
  username,
  password,
  emojiFaces,
  BASE_URL,
  GAME_URL,
  XMPP_BIND_URL
} from "./src/definitions"; // definitions

// ------------------------- Helper Functions -------------------------

// Returns a random emoji avatar ensuring it's not the same as the last one used.
let lastEmojiAvatar = null;
function getRandomEmojiAvatar() {
  let newEmoji;
  do {
    newEmoji = emojiFaces[Math.floor(Math.random() * emojiFaces.length)];
  } while (newEmoji === lastEmojiAvatar);
  lastEmojiAvatar = newEmoji;
  return newEmoji;
}

// Returns a numeric priority for user roles.
function getRolePriority(role) {
  switch (role.toLowerCase()) {
    case 'moderator': return 1;
    case 'participant': return 2;
    case 'visitor': return 3;
    default: return 4;
  }
}

// Creates the HTML for the user list.
function createUserListUI(users) {
  const sortedUsers = [...users].sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role));
  return sortedUsers.map(user => {
    const avatarElement = user.avatar
      ? `<img class="user-avatar image-avatar" src="${BASE_URL}${user.avatar.replace('.png', '_big.png')}" alt="${user.login}'s avatar">`
      : `<span class="user-avatar svg-avatar">${getRandomEmojiAvatar()}</span>`;
    const gameInfo = user.game
      ? ` | Game: <a href="${GAME_URL}${user.game}" class="game-link" target="_blank">${user.game} 🎮</a>`
      : '';
    const roleClass = `role-${user.role.toLowerCase()}`;
    return `
      <div class="user-item">
        ${avatarElement}
        <div class="user-info">
          <div>${user.login}</div>
          <div class="user-meta">Role: <span class="${roleClass}">${user.role}</span>${gameInfo}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Compact function to wrap links and emoticons in a message.
const parseMessageText = text =>
  text
    .replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>')
    .replace(/:(\w+):/g, (m, e) => `<img src="https://klavogonki.ru/img/smilies/${e}.gif" alt="${e}" />`);

// Clamp a value between min and max.
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ------------------------- State Persistence -------------------------

function getChatState() {
  const savedState = localStorage.getItem('chatState');
  return savedState ? JSON.parse(savedState) : {
    height: 300,
    width: Math.min(window.innerWidth, 600),
    left: 0,
    floating: false,
    top: window.innerHeight - 300
  };
}

function saveChatState(state) {
  localStorage.setItem('chatState', JSON.stringify(state));
}

// ------------------------- Chat History Persistence -------------------------

const MESSAGE_HISTORY_LIMIT = 20;

function loadChatHistory() {
  const stored = localStorage.getItem("chatHistory");
  if (stored) {
    try {
      const data = JSON.parse(stored);
      const today = new Date().toISOString().slice(0, 10);
      if (data.date === today && Array.isArray(data.messages)) {
        return data.messages;
      } else {
        localStorage.removeItem("chatHistory");
      }
    } catch (err) {
      localStorage.removeItem("chatHistory");
    }
  }
  return [];
}

function saveChatHistory(messages) {
  const today = new Date().toISOString().slice(0, 10);
  const limitedMessages = messages.slice(-MESSAGE_HISTORY_LIMIT);
  localStorage.setItem("chatHistory", JSON.stringify({
    date: today,
    messages: limitedMessages
  }));
}

// ------------------------- Compact Helper -------------------------
function handleElementsBehavior() {
  const wrapper = document.querySelector('#chat-container .chat-wrapper');
  if (!wrapper) return;

  const isNarrow = wrapper.offsetWidth <= 750;
  
  const userList = document.querySelector('#chat-container .user-list-container');
  if (userList) userList.style.display = isNarrow ? 'none' : '';

  document.querySelectorAll('#chat-container .message').forEach(msg => {
    msg.style.flexDirection = isNarrow ? 'column' : 'row';
    msg.style.marginBottom = isNarrow ? '1em' : '0';
  });
}

function restoreChatState() {
  const chat = document.getElementById('chat-container');
  const state = getChatState();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const computedStyle = getComputedStyle(document.documentElement);
  const minWidth = parseInt(computedStyle.getPropertyValue('--min-chat-width')) || 250;
  const minHeight = parseInt(computedStyle.getPropertyValue('--min-chat-height')) || 200;

  chat.style.width = Math.min(viewportWidth, Math.max(minWidth, state.width)) + 'px';
  chat.style.height = Math.min(viewportHeight, Math.max(minHeight, state.height)) + 'px';
  chat.style.left = clamp(state.left, 0, viewportWidth - chat.offsetWidth) + 'px';

  if (state.floating) {
    chat.style.top = clamp(state.top, 0, viewportHeight - chat.offsetHeight) + 'px';
    chat.style.bottom = '';
    chat.classList.add("floating-chat");
  } else {
    chat.style.bottom = '0';
    chat.style.top = '';
    chat.classList.remove("floating-chat");
  }
  handleElementsBehavior();
}

// ------------------------- Chat UI Creation -------------------------

function createChatUI() {
  const chatContainer = document.createElement('div');
  chatContainer.id = 'chat-container';

  // Create resize handles for top, left, and right.
  ['top', 'left', 'right'].forEach(type => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${type}`;
    chatContainer.appendChild(handle);
  });

  // Create chat wrapper holding the two columns.
  const chatWrapper = document.createElement('div');
  chatWrapper.className = 'chat-wrapper';

  // Left side: messages container.
  const chatContent = document.createElement('div');
  chatContent.className = 'chat-content';

  const messagesPanel = document.createElement('div');
  messagesPanel.id = 'messages-panel';
  messagesPanel.className = 'messages-panel';

  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.id = 'message-input';
  messageInput.placeholder = 'Type your message...';
  const sendButton = document.createElement('button');
  sendButton.id = 'send-button';
  sendButton.className = 'filled-button send-button';
  sendButton.innerHTML = sendSVG;
  inputContainer.appendChild(messageInput);
  inputContainer.appendChild(sendButton);

  chatContent.appendChild(messagesPanel);
  chatContent.appendChild(inputContainer);

  // Right side: user list container.
  const userListContainer = document.createElement('div');
  userListContainer.className = 'user-list-container';
  const userList = document.createElement('div');
  userList.id = 'user-list';
  userListContainer.appendChild(userList);

  // Append columns to chat-wrapper.
  chatWrapper.appendChild(chatContent);
  chatWrapper.appendChild(userListContainer);
  chatContainer.appendChild(chatWrapper);

  // Toggle button for chat visibility.
  const toggleButton = document.createElement('button');
  toggleButton.className = 'filled-button header-button chat-toggle-button';
  toggleButton.innerHTML = closeSVG;
  toggleButton.addEventListener('click', toggleChatVisibility);
  chatContainer.appendChild(toggleButton);

  // Create a top drag area.
  const topArea = document.createElement('div');
  topArea.className = 'chat-drag-area';
  topArea.addEventListener('dblclick', toggleChatVisibility);
  chatContainer.appendChild(topArea);

  document.body.appendChild(chatContainer);
  restoreChatState();
}

// ------------------------- Drag Handlers (Floating) -------------------------

let isDragging = false, dragStartX, dragStartY, dragStartLeft, dragStartTop;

document.addEventListener('mousedown', (e) => {
  const dragArea = e.target.closest('.chat-drag-area');
  if (!dragArea) return;
  isDragging = true;
  const chat = document.getElementById('chat-container');
  let chatState = getChatState();
  if (!chatState.floating) {
    const newTop = window.innerHeight - chat.offsetHeight;
    chat.style.top = newTop + 'px';
    chat.style.bottom = '';
    chatState.top = newTop;
    chatState.floating = true;
    chat.classList.add("floating-chat");
    saveChatState(chatState);
  }
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartLeft = chat.offsetLeft;
  dragStartTop = parseInt(chat.style.top) || chat.getBoundingClientRect().top;
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const chat = document.getElementById('chat-container');
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;
  const newLeft = clamp(dragStartLeft + deltaX, 0, viewportWidth - chat.offsetWidth);
  const newTop = clamp(dragStartTop + deltaY, 0, viewportHeight - chat.offsetHeight);
  chat.style.left = newLeft + 'px';
  chat.style.top = newTop + 'px';
  const chatState = getChatState();
  chatState.left = newLeft;
  chatState.top = newTop;
  chatState.floating = true;
  saveChatState(chatState);
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  const chat = document.getElementById('chat-container');
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const chatRect = chat.getBoundingClientRect();
  const SNAP_THRESHOLD = 50;
  const outOfBounds = chatRect.left < 0 || chatRect.top < 0 ||
    chatRect.right > viewportWidth || chatRect.bottom > viewportHeight;
  const nearBottom = (viewportHeight - chatRect.bottom) < SNAP_THRESHOLD;
  let chatState = getChatState();
  if (outOfBounds || nearBottom) {
    chat.style.top = '';
    chat.style.bottom = '0';
    chatState.floating = false;
    chat.classList.remove("floating-chat");
  } else {
    chatState.floating = true;
    chatState.top = chatRect.top;
    chat.classList.add("floating-chat");
  }
  saveChatState(chatState);
  document.body.style.userSelect = '';
});

// ------------------------- Resize Handlers -------------------------

let isResizing = false, resizeType = null, startX, startY, startWidth, startHeight, startLeft, startTop;

document.addEventListener('mousedown', (e) => {
  const handle = e.target.closest('.resize-handle');
  if (!handle) return;
  isResizing = true;
  resizeType = handle.classList[1];
  const chat = document.getElementById('chat-container');
  startX = e.clientX;
  startY = e.clientY;
  startWidth = chat.offsetWidth;
  startHeight = chat.offsetHeight;
  startLeft = chat.offsetLeft;
  let state = getChatState();
  if (state.floating) {
    startTop = parseInt(chat.style.top) || chat.getBoundingClientRect().top;
  }
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const chat = document.getElementById('chat-container');
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const computedStyle = getComputedStyle(document.documentElement);
  const minWidth = parseInt(computedStyle.getPropertyValue('--min-chat-width')) || 250;
  const minHeight = parseInt(computedStyle.getPropertyValue('--min-chat-height')) || 200;
  let chatState = getChatState();
  switch (resizeType) {
    case 'top': {
      const newHeight = Math.max(minHeight, startHeight - deltaY);
      if (chatState.floating) {
        let newTop = startTop + deltaY;
        newTop = clamp(newTop, 0, viewportHeight - newHeight);
        chat.style.top = newTop + 'px';
        chatState.top = newTop;
      } else {
        chat.style.top = '';
        chat.style.bottom = '0';
      }
      chat.style.height = newHeight + 'px';
      chatState.height = newHeight;
      break;
    }
    case 'left': {
      const newWidth = Math.max(minWidth, startWidth - deltaX);
      const newLeft = clamp(startLeft + deltaX, 0, viewportWidth - minWidth);
      chat.style.width = newWidth + 'px';
      chat.style.left = newLeft + 'px';
      chatState.width = newWidth;
      chatState.left = newLeft;
      break;
    }
    case 'right': {
      const maxWidth = viewportWidth - chat.getBoundingClientRect().left;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
      chat.style.width = newWidth + 'px';
      chatState.width = newWidth;
      break;
    }
  }
  saveChatState(chatState);
  handleElementsBehavior();
});

document.addEventListener('mouseup', () => {
  isResizing = false;
  document.body.style.userSelect = '';
});

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
    }, 5000);
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
window.addEventListener('resize', () => {
  restoreChatState();
  handleElementsBehavior();
});
