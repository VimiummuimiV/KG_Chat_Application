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

// Variable to store the last selected emoji
let lastEmojiAvatar = null;

// Helper function to get a random emoji avatar
function getRandomEmojiAvatar() {
  let newEmoji;
  do {
    newEmoji = emojiFaces[Math.floor(Math.random() * emojiFaces.length)];
  } while (newEmoji === lastEmojiAvatar);

  lastEmojiAvatar = newEmoji;
  return newEmoji;
}

// Helper function to get role priority for sorting
function getRolePriority(role) {
  switch (role.toLowerCase()) {
    case 'moderator': return 1;
    case 'participant': return 2;
    case 'visitor': return 3;
    default: return 4;
  }
}

// Function to create user list UI
function createUserListUI(users) {
  // Sort users by role priority
  const sortedUsers = [...users].sort((a, b) => {
    return getRolePriority(a.role) - getRolePriority(b.role);
  });

  return sortedUsers.map(user => {
    const avatarElement = user.avatar
      ? `<img class="user-avatar image-avatar" src="${BASE_URL}${user.avatar.replace('.png', '_big.png')}" alt="${user.login}'s avatar">`
      : `<span class="user-avatar svg-avatar">${getRandomEmojiAvatar()}</span>`;

    // Create game link if user is in a game
    const gameInfo = user.game ?
      ` | Game: <a href="${GAME_URL}${user.game}" class="game-link" target="_blank">${user.game} 🎮</a>` :
      '';

    // Get the appropriate CSS class for the role
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

// USER MANAGER class
class UserManager {
  constructor() {
    this.container = document.getElementById('user-list');
    this.activeUsers = new Map(); // Store currently active users
  }

  updatePresence(xmlResponse) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const presences = doc.getElementsByTagName("presence");

    // Request a full roster if we received the initial room join
    if (xmlResponse.includes('<presence id="pres_1"')) {
      console.log("🔄 Initial room join detected, requesting full roster");
      this.requestFullRoster();
      return;
    }

    // Process presence stanzas to update our user list
    let changes = false;
    for (let i = 0; i < presences.length; i++) {
      const presence = presences[i];
      const from = presence.getAttribute('from');
      const type = presence.getAttribute('type');

      // Handle user leaving
      if (type === 'unavailable') {
        if (this.activeUsers.has(from)) {
          console.log(`🚪 User left: ${this.activeUsers.get(from).login || from}`);
          this.activeUsers.delete(from);
          changes = true;
        }
        continue;
      }

      // Handle user joining or updating
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

      // Extract user data
      const login = userNode.getElementsByTagName("login")[0]?.textContent || 'Anonymous';
      const avatar = userNode.getElementsByTagName("avatar")[0]?.textContent;
      const background = userNode.getElementsByTagName("background")[0]?.textContent || '#777';
      const gameNode = xData.getElementsByTagName("game_id")[0];
      const game = gameNode ? gameNode.textContent : null;
      const role = presence.getElementsByTagName("item")[0]?.getAttribute("role") || 'participant';

      const user = {
        jid: from,
        login,
        avatar,
        color: background,
        role,
        game
      };

      const existingUser = this.activeUsers.get(from);
      if (!existingUser || JSON.stringify(existingUser) !== JSON.stringify(user)) {
        console.log(`👤 User ${existingUser ? 'updated' : 'joined'}: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
      }
    }

    // Update UI only if there were changes
    if (changes) {
      console.log(`📋 Current active users: ${this.activeUsers.size}`);
      this.updateUI();
    }
  }

  async requestFullRoster() {
    // This method would be implemented to request a full roster from the server
    // For now, we'll just use the users we know about
    console.log("📑 Would request full roster here (using existing data for now)");
    this.updateUI();
  }

  updateUI() {
    console.log(`🖥️ Updating UI with ${this.activeUsers.size} users`);
    // Use the separate function to create the user list UI
    this.container.innerHTML = createUserListUI(Array.from(this.activeUsers.values()));
  }
}

// ======================== Chat UI Creation ========================
// Function to add smooth close/open functionality to the chat
function addChatToggleFeature() {
  const chatContainer = document.getElementById('chat-container');

  // Set the initial chat state as visible and display the close icon.
  chatContainer.classList.add('visible-chat');

  // Create the toggle button and set its initial icon to closeSVG.
  const toggleButton = document.createElement('button');
  toggleButton.className = 'filled-button header-button chat-toggle-button';
  toggleButton.innerHTML = closeSVG;

  // Function to toggle chat visibility and update the button icon accordingly.
  function toggleChatVisibility() {
    if (chatContainer.classList.contains('visible-chat')) {
      chatContainer.classList.remove('visible-chat');
      chatContainer.classList.add('hidden-chat');
      toggleButton.innerHTML = openSVG; // Show openSVG when chat is hidden.
      console.log('💬 Chat hidden');
    } else {
      chatContainer.classList.remove('hidden-chat');
      chatContainer.classList.add('visible-chat');
      toggleButton.innerHTML = closeSVG; // Show closeSVG when chat is visible.
      console.log('💬 Chat visible');
    }
  }

  // Attach a keyboard shortcut (Ctrl+Space) for toggling chat visibility.
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      toggleChatVisibility();
    }
  });

  // Add the toggle button click event to change chat visibility.
  toggleButton.addEventListener('click', toggleChatVisibility);
  chatContainer.appendChild(toggleButton);

  // Create and add a top area that also toggles the chat on double-click.
  const topArea = document.createElement('div');
  topArea.className = 'chat-drag-area';
  topArea.addEventListener('dblclick', toggleChatVisibility);
  chatContainer.appendChild(topArea);

  console.log('🔗 Chat toggle feature added. Use Ctrl+Space to toggle visibility.');
}

function createChatUI() {
  const chatContainer = document.createElement('div');
  chatContainer.id = 'chat-container';

  // Create resize handles
  ['top', 'left', 'right'].forEach(type => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${type}`;
    chatContainer.appendChild(handle);
  });

  // Main chat areas
  const chatMain = document.createElement('div');
  chatMain.className = 'chat-main';

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

  chatMain.appendChild(messagesPanel);
  chatMain.appendChild(inputContainer);

  // User list container
  const userListContainer = document.createElement('div');
  userListContainer.className = 'user-list-container';
  const userList = document.createElement('div');
  userList.id = 'user-list';
  userListContainer.appendChild(userList);

  chatContainer.appendChild(chatMain);
  chatContainer.appendChild(userListContainer);
  document.body.appendChild(chatContainer);
}

// MAIN XMPP CLIENT
const xmppClient = {
  userManager: null,
  messages: [],
  messageIdCounter: 0,
  sid: null,
  rid: Math.floor(Date.now() / 1000),

  async connect() {
    try {
      // Step 1: Initial connection
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

      // Step 2: Authentication
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

      // Step 3: Restart stream
      console.log('🔄 Step 5: Restarting stream...');
      await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'
               to='jabber.klavogonki.ru'
               xmpp:restart='true'
               xmlns:xmpp='urn:xmpp:xbosh'/>`
      );
      await this.sleep(delay / 8);

      // Step 4: Resource binding
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

      // Step 5: Initialize session
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

      // Step 6: Join chat room with correct room and nickname
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

      // Step 7: Request room information 
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

      // Start presence polling
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

    // Handle presence updates
    const presences = doc.getElementsByTagName("presence");
    if (presences.length > 0) {
      this.userManager.updatePresence(xmlResponse);
    }

    // Handle messages
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
        <div class="message-text">${msg.text}</div>
      </div>
    `).join('');
    panel.scrollTop = panel.scrollHeight;
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      },
      body: payload
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
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

        // If we hit a rate limit
        if (error.message.includes('429')) {
          const waitTime = baseWaitTime * Math.pow(2, attempt); // Exponential backoff
          console.log(`⏱️ Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms before retry...`);
          await this.sleep(waitTime);
        } else {
          // If it's not a rate limit error, rethrow immediately
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
    }, 5000); // Poll
  },

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

// ======================== Event Listeners ========================
function initializeApp() {
  // Create the chat UI
  createChatUI();

  // Add toggle functionality
  addChatToggleFeature();

  // Initialize the user manager after the UI is created
  xmppClient.userManager = new UserManager();

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

  // Start the client
  xmppClient.connect();
}

// For Tampermonkey, we should call this function directly
// This will run when the script is injected rather than waiting for an event
initializeApp();

// ======================== Resize Handlers ========================
let isResizing = false;
let resizeType = null;
let startX, startY, startWidth, startHeight, startLeft;

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

  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;

  const chat = document.getElementById('chat-container');
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  // Get browser viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Get current chat state
  let chatState = getChatState();

  switch (resizeType) {
    case 'top':
      const newHeight = Math.max(200, startHeight - deltaY);
      // Ensure chat doesn't exceed viewport height
      if (newHeight <= viewportHeight) {
        chat.style.height = newHeight + 'px';
        chatState.height = newHeight;
      }
      break;

    case 'left': {
      const newWidth = Math.max(750, startWidth - deltaX);
      const newLeft = startLeft + deltaX;

      // Ensure chat doesn't go beyond left edge and stays within viewport
      if (newLeft >= 0 && newLeft + newWidth <= viewportWidth) {
        chat.style.width = newWidth + 'px';
        chat.style.left = newLeft + 'px';

        chatState.left = newLeft;
      }
      break;
    }

    case 'right': {
      const newWidth = Math.max(750, startWidth + deltaX);

      // Ensure chat doesn't exceed viewport width
      const rightEdge = chat.getBoundingClientRect().left + newWidth;
      if (rightEdge <= viewportWidth) {
        chat.style.width = newWidth + 'px';
        chatState.right = viewportWidth - rightEdge;
      }
      break;
    }
  }

  // Save the updated state
  saveChatState(chatState);
});

// Function to get chat state from localStorage
function getChatState() {
  const savedState = localStorage.getItem('chatState');
  return savedState ? JSON.parse(savedState) : {
    height: 400,
    left: 0,
    right: 0
  };
}

// Function to save chat state to localStorage
function saveChatState(state) {
  localStorage.setItem('chatState', JSON.stringify(state));
}

// Function to restore chat size/position on page load
function restoreChatState() {
  const chat = document.getElementById('chat-container');
  const state = getChatState();
  const viewportWidth = window.innerWidth;

  // Apply saved values
  if (state.height) chat.style.height = state.height + 'px';
  if (state.left) chat.style.left = state.left + 'px';

  // For right property, calculate width based on right distance
  if (state.right !== undefined) {
    const calculatedWidth = viewportWidth - state.right - chat.getBoundingClientRect().left;
    if (calculatedWidth >= 750) {
      chat.style.width = calculatedWidth + 'px';
    }
  }
}

// Call restore function when document is loaded
restoreChatState();

// Handle window resize to maintain right positioning
window.addEventListener('resize', () => {
  const chat = document.getElementById('chat-container');
  const state = getChatState();

  if (state.right !== undefined) {
    const viewportWidth = window.innerWidth;
    const calculatedWidth = viewportWidth - state.right - chat.getBoundingClientRect().left;
    if (calculatedWidth >= 750) {
      chat.style.width = calculatedWidth + 'px';
    }
  }
});

document.addEventListener('mouseup', () => {
  isResizing = false;
  document.body.style.userSelect = '';
});