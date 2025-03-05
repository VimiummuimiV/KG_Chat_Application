import { toggleChatVisibility } from "./chatFeatures.js";
import { restoreChatState, getChatState, saveChatState, handleElementsBehavior } from "./helpers.js";
import { sendSVG, closeSVG, expandSVG, collapseSVG } from "./icons.js";

export function createChatUI() {
  const chatContainer = document.createElement('div');
  chatContainer.id = 'app-chat-container';

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

  // Maximize button for chat
  const maximizeButton = document.createElement('button');
  maximizeButton.className = 'filled-button header-button chat-maximize-button';
  maximizeButton.innerHTML = expandSVG;
  maximizeButton.addEventListener('click', toggleChatMaximize);
  chatContainer.appendChild(maximizeButton);

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

// Global variable to store the original chat state
let originalChatState = null;

export function toggleChatMaximize() {
  const chat = document.getElementById('app-chat-container');
  const maximizeButton = document.querySelector('.chat-maximize-button');

  if (!chat) return;

  if (!chat.classList.contains('maximized')) {
    originalChatState = getChatState();

    chat.style.width = '100vw';
    chat.style.height = '90vh';
    chat.style.left = '0';
    chat.style.bottom = '0';
    chat.style.top = 'auto';

    chat.classList.add('maximized');
    maximizeButton.classList.add('maximized');
    maximizeButton.innerHTML = collapseSVG;

    handleElementsBehavior();
  } else {
    // Check scroll position before minimizing
    const container = document.getElementById('messages-panel');
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const shouldScrollToBottom = distanceFromBottom <= 300; // Match scrollThreshold

    // Restore original state
    if (originalChatState) {
      chat.style.width = `${originalChatState.width}px`;
      chat.style.height = `${originalChatState.height}px`;
      chat.style.left = `${originalChatState.left}px`;

      if (originalChatState.floating) {
        chat.style.top = `${originalChatState.top}px`;
        chat.style.bottom = '';
      } else {
        chat.style.bottom = '0';
        chat.style.top = '';
      }

      saveChatState(originalChatState);
    }

    chat.classList.remove('maximized');
    maximizeButton.classList.remove('maximized');
    maximizeButton.innerHTML = expandSVG;

    requestAnimationFrame(() => {
      handleElementsBehavior();
      if (shouldScrollToBottom) {
        container.scrollTop = container.scrollHeight; // Force scroll to bottom
      }
    });
  }
}
