// main.js
import { closeSVG, openSVG, sendSVG } from "./src/icons"; // icons
import {
  delay,
  username,
  password,
  emojiFaces,
  BASE_URL,
  GAME_URL,
  XMPP_BIND_URL,
  userListDelay
} from "./src/definitions"; // definitions

import XMPPConnection from './src/xmppConnection';
import UserManager from './src/userManager';
import MessageManager from './src/messageManager';

// ------------------------- Helper Functions -------------------------

let lastEmojiAvatar = null;
function getRandomEmojiAvatar() {
  let newEmoji;
  do {
    newEmoji = emojiFaces[Math.floor(Math.random() * emojiFaces.length)];
  } while (newEmoji === lastEmojiAvatar);
  lastEmojiAvatar = newEmoji;
  return newEmoji;
}

function getRolePriority(role) {
  switch (role.toLowerCase()) {
    case 'moderator': return 1;
    case 'participant': return 2;
    case 'visitor': return 3;
    default: return 4;
  }
}

function createUserListUI(users) {
  const sortedUsers = [...users].sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role));
  return sortedUsers.map(user => {
    const avatarElement = user.avatar
      ? `<img class="user-avatar image-avatar" src="${BASE_URL}${user.avatar.replace('.png', '_big.png')}" alt="${user.login}'s avatar">`
      : `<span class="user-avatar svg-avatar">${getRandomEmojiAvatar()}</span>`;
    const gameInfo = user.game
      ? ` | 🎮 <a href="${GAME_URL}${user.game}" class="game-link" title="Game" target="_blank">${user.game}</a>`
      : '';
    const roleClass = `role-${user.role.toLowerCase()}`;
    return `
      <div class="user-item">
        ${avatarElement}
        <div class="user-info">
          <div>${user.login}</div>
          <div class="user-meta">🏷️: <span class="${roleClass}" title="Status">${user.role}</span>${gameInfo}</div>
        </div>
      </div>
    `;
  }).join('');
}

const parseMessageText = text =>
  text
    .replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>')
    .replace(/:(\w+):/g, (m, e) => `<img src="https://klavogonki.ru/img/smilies/${e}.gif" alt="${e}" />`);

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

// ------------------------- Toggle & Chat Features -------------------------

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
  if (closeButton) {
    closeButton.addEventListener('click', toggleChatVisibility);
  }
  if (draggableHeader) {
    draggableHeader.addEventListener('dblclick', toggleChatVisibility);
  }
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

// ------------------------- XMPP Client & Message Handling -------------------------

function initializeApp() {
  createChatUI();
  addChatToggleFeature();
  
  // Instantiate managers now that the chat UI is in the DOM.
  const userManager = new UserManager('user-list');
  const messageManager = new MessageManager('messages-panel', username);
  
  // Create an instance of our XMPP connection.
  const xmppConnection = new XMPPConnection({
    username,
    password,
    bindUrl: XMPP_BIND_URL,
    delay
  });
  
  // Our overall XMPP client object.
  const xmppClient = {
    userManager,
    messageManager,
    async connect() {
      try {
        const session = await xmppConnection.connect();
        
        console.log('💬 Step 8: Joining chat room...');
        const joinPayload = `<body rid='${xmppConnection.nextRid()}' sid='${session.sid}'
                 xmlns='http://jabber.org/protocol/httpbind'>
            <presence id='pres_1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru/${username}'>
              <x xmlns='http://jabber.org/protocol/muc'/>
            </presence>
          </body>`;
        const joinResponse = await xmppConnection.sendRequestWithRetry(joinPayload);
        console.log('📥 Join response:', joinResponse);
        userManager.updatePresence(joinResponse);
  
        const infoPayload = `<body rid='${xmppConnection.nextRid()}' sid='${session.sid}'
                 xmlns='http://jabber.org/protocol/httpbind'>
            <iq type='get' id='info1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru'>
              <query xmlns='http://jabber.org/protocol/disco#info'/>
            </iq>
          </body>`;
        await xmppConnection.sendRequestWithRetry(infoPayload);
        
        // Start polling for presence and messages.
        setInterval(async () => {
          const xmlResponse = await xmppConnection.sendRequestWithRetry(
            `<body rid='${xmppConnection.nextRid()}' sid='${session.sid}' xmlns='http://jabber.org/protocol/httpbind'/>`
          );
          userManager.updatePresence(xmlResponse);
          messageManager.processMessages(xmlResponse);
        }, userListDelay);
        
        console.log('🚀 Step 10: Connected! Starting presence updates...');
      } catch (error) {
        console.error(`💥 Error: ${error.message}`);
      }
    },
    sendMessage(text) {
      const messageId = `msg_${Date.now()}`;
      const messageStanza = `
        <body rid='${xmppConnection.nextRid()}' sid='${xmppConnection.sid}' xmlns='http://jabber.org/protocol/httpbind'>
          <message to='general@conference.jabber.klavogonki.ru'
                   type='groupchat'
                   id='${messageId}'
                   xmlns='jabber:client'>
            <body>${text}</body>
          </message>
        </body>
      `;
      xmppConnection.sendRequestWithRetry(messageStanza)
        .then(response => {
          messageManager.processMessages(response);
        })
        .catch(console.error);
    }
  };
  
  // Load persisted messages and update the messages panel.
  const persistedMessages = loadChatHistory();
  messageManager.messages = persistedMessages;
  messageManager.updatePanel();
  
  // Set up the send form events.
  const input = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  sendButton.addEventListener('click', () => {
    const text = input.value.trim();
    if (text) {
      messageManager.messages.push({
        id: `msg_${Date.now()}`,
        from: username,
        text,
        timestamp: new Date().toISOString()
      });
      messageManager.updatePanel();
      xmppClient.sendMessage(text);
      input.value = '';
    }
  });
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });
  
  // Start the XMPP connection.
  xmppClient.connect();
  
  // Optionally, expose xmppClient for debugging.
  window.xmppClient = xmppClient;
}

initializeApp();
window.addEventListener('resize', () => {
  restoreChatState();
  handleElementsBehavior();
});
