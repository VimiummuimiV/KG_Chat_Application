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
    // Preserve existing visibility classes
    const hasVisibilityClass = 
      !chat.classList.contains('visible-chat') && 
      !chat.classList.contains('hidden-chat');

    // Store the original state
    originalChatState = getChatState();

    // Calculate 90% of the viewport height, accounting for potential browser console
    const calculateHeight = () => {
      // Use window.innerHeight to get the actual visible viewport
      return `${Math.floor(window.innerHeight * 0.9)}px`;
    };

    // Use CSS to ensure consistent sizing and bottom positioning
    chat.style.cssText = `
      width: 100vw !important;
      height: ${calculateHeight()} !important;
      max-width: 95vw !important;
      min-width: 95vw !important;
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      top: auto !important;
      margin: 0 !important;
      transform: none !important;
    `;

    // Preserve the original visibility class condition
    if (hasVisibilityClass) {
      chat.classList.remove('visible-chat', 'hidden-chat');
    }

    chat.classList.add('maximized');
    maximizeButton.classList.add('maximized');
    maximizeButton.innerHTML = collapseSVG;

    // Add resize listener to maintain 90vh and bottom positioning
    const resizeHandler = () => {
      chat.style.height = calculateHeight();
      chat.style.bottom = '0';
      chat.style.top = 'auto';
    };
    window.addEventListener('resize', resizeHandler);

    // Store the resize handler on the chat element for later removal
    chat.maximizeResizeHandler = resizeHandler;

    handleElementsBehavior();
  } else {
    // Check scroll position before minimizing
    const container = document.getElementById('messages-panel');
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const shouldScrollToBottom = distanceFromBottom <= 300; // Match scrollThreshold

    // Remove the resize listener
    if (chat.maximizeResizeHandler) {
      window.removeEventListener('resize', chat.maximizeResizeHandler);
      delete chat.maximizeResizeHandler;
    }

    // Restore original state
    if (originalChatState) {
      chat.style.width = `${originalChatState.width}px`;
      chat.style.height = `${originalChatState.height}px`;
      chat.style.left = `${originalChatState.left}px`;
      chat.style.maxWidth = '';
      chat.style.minWidth = '';
      chat.style.position = 'fixed';
      chat.style.right = '';
      chat.style.margin = '';
      chat.style.transform = '';
      chat.style.top = 'auto';

      // Preserve the original visibility class condition
      const hasVisibilityClass = 
        !chat.classList.contains('visible-chat') && 
        !chat.classList.contains('hidden-chat');

      if (hasVisibilityClass) {
        chat.classList.remove('visible-chat', 'hidden-chat');
      }

      if (originalChatState.floating) {
        // For floating state, only set top if it's within viewport
        const viewportHeight = window.innerHeight;
        const proposedTop = originalChatState.top;
        
        if (proposedTop + originalChatState.height <= viewportHeight) {
          chat.style.top = `${proposedTop}px`;
        } else {
          // If the proposed top would push the chat out of view, default to bottom
          chat.style.bottom = '0';
          chat.style.top = 'auto';
        }
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
