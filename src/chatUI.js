import { toggleChatVisibility } from "./chatFeatures.js";
import { restoreChatState, getChatState, saveChatState, handleElementsBehavior, focusTextInput, createFontSizeControl, restoreFontSize } from "./helpers.js";
import { sendSVG, closeSVG, expandSVG, collapseSVG } from "./icons.js";

// Then update the createChatUI function to include font size initialization
export function createChatUI() {
  const chatContainer = document.createElement('div');
  chatContainer.id = 'app-chat-container';

  // Add resize handles
  ['top', 'left', 'right'].forEach(type => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${type}`;
    chatContainer.appendChild(handle);
  });

  // Chat wrapper for content and user list
  const chatWrapper = document.createElement('div');
  chatWrapper.className = 'chat-wrapper';

  // Left side: messages panel and input
  const chatContent = document.createElement('div');
  chatContent.className = 'chat-content';

  const messagesPanel = document.createElement('div');
  messagesPanel.id = 'messages-panel';
  messagesPanel.className = 'messages-panel';

  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';

  // Create emoji button
  const emojiButton = document.createElement('button');
  emojiButton.className = 'emoji-trigger filled-button';
  emojiButton.innerHTML = null;
  emojiButton.classList.add('emoji-button');
  emojiButton.title = 'Open emoji picker';

  // Create message input
  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.id = 'message-input';

  // Create send button
  const sendButton = document.createElement('button');
  sendButton.id = 'send-button';
  sendButton.className = 'filled-button send-button';
  sendButton.innerHTML = sendSVG;

  // Append elements in order
  inputContainer.appendChild(emojiButton);
  inputContainer.appendChild(messageInput);
  inputContainer.appendChild(sendButton);

  chatContent.appendChild(messagesPanel);
  chatContent.appendChild(inputContainer);

  // Right side: user list
  const userListContainer = document.createElement('div');
  userListContainer.className = 'user-list-container';
  const userList = document.createElement('div');
  userList.id = 'user-list';
  userListContainer.appendChild(userList);

  chatWrapper.appendChild(chatContent);
  chatWrapper.appendChild(userListContainer);
  chatContainer.appendChild(chatWrapper);

  // Maximize button
  const maximizeButton = document.createElement('button');
  maximizeButton.className = 'filled-button header-button chat-maximize-button';
  maximizeButton.innerHTML = expandSVG;
  maximizeButton.addEventListener('click', toggleChatMaximize);
  chatContainer.appendChild(maximizeButton);

  // Toggle visibility button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'filled-button header-button chat-toggle-button';
  toggleButton.innerHTML = closeSVG;
  toggleButton.addEventListener('click', toggleChatVisibility);
  chatContainer.appendChild(toggleButton);

  // Draggable top area
  const topArea = document.createElement('div');
  topArea.className = 'chat-drag-area';
  topArea.addEventListener('dblclick', toggleChatVisibility);
  chatContainer.appendChild(topArea);

  document.body.appendChild(chatContainer);

  // Restore chat state and settings
  restoreChatState();

  // Add the font size control and restore font size
  createFontSizeControl();
  restoreFontSize();

  // Force scroll to bottom once after chat creation, before further initialization
  requestAnimationFrame(() => {
    const messagesPanel = document.getElementById('messages-panel');
    if (messagesPanel) {
      messagesPanel.scrollTop = messagesPanel.scrollHeight;
    }
  });
}

let originalChatState = null;

export function toggleChatMaximize() {
  const chat = document.getElementById('app-chat-container');
  const maximizeButton = document.querySelector('.chat-maximize-button');
  if (!chat) return;

  if (!chat.classList.contains('maximized')) {
    const hasVisibilityClass = !chat.classList.contains('visible-chat') && !chat.classList.contains('hidden-chat');
    originalChatState = getChatState();

    const calculateHeight = () => `${Math.floor(window.innerHeight * 0.9)}px`;

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

    if (hasVisibilityClass) {
      chat.classList.remove('visible-chat', 'hidden-chat');
    }

    chat.classList.add('maximized');
    maximizeButton.classList.add('maximized');
    maximizeButton.innerHTML = collapseSVG;

    const resizeHandler = () => {
      chat.style.height = calculateHeight();
      chat.style.bottom = '0';
      chat.style.top = 'auto';
    };
    window.addEventListener('resize', resizeHandler);
    chat.maximizeResizeHandler = resizeHandler;

    handleElementsBehavior();
    focusTextInput(); // Focus after maximizing

    // Reapply the font size to enforce the minimum multiplier if needed
    restoreFontSize();
  } else {
    const container = document.getElementById('messages-panel');
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const shouldScrollToBottom = distanceFromBottom <= 300;

    if (chat.maximizeResizeHandler) {
      window.removeEventListener('resize', chat.maximizeResizeHandler);
      delete chat.maximizeResizeHandler;
    }

    if (originalChatState) {
      // Restore geometry properties from the original saved state
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

      if (originalChatState.floating) {
        const viewportHeight = window.innerHeight;
        const proposedTop = originalChatState.top;
        if (proposedTop + originalChatState.height <= viewportHeight) {
          chat.style.top = `${proposedTop}px`;
        } else {
          chat.style.bottom = '0';
          chat.style.top = 'auto';
        }
      } else {
        chat.style.bottom = '0';
        chat.style.top = '';
      }

      // Instead of overwriting the font size multiplier with the original value,
      // merge the geometry from originalChatState with the current (updated) fontSizeMultiplier.
      const currentState = getChatState(); // This should have the latest fontSizeMultiplier.
      const newState = {
        ...currentState, // Keeps the updated fontSizeMultiplier and other properties
        width: originalChatState.width,
        height: originalChatState.height,
        left: originalChatState.left,
        top: originalChatState.top,
        floating: originalChatState.floating,
        isVisible: originalChatState.isVisible,
      };
      saveChatState(newState);
    }

    chat.classList.remove('maximized');
    maximizeButton.classList.remove('maximized');
    maximizeButton.innerHTML = expandSVG;

    requestAnimationFrame(() => {
      handleElementsBehavior();
      if (shouldScrollToBottom) {
        container.scrollTop = container.scrollHeight;
      }
      focusTextInput(); // Focus after minimizing

      // Reapply the font size from localStorage – this now uses the updated multiplier.
      restoreFontSize();
    });
  }
}
