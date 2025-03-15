import { toggleChatVisibility } from "./chatFeatures.js";

import {
  restoreChatState,
  getChatState,
  saveChatState,
  handleElementsBehavior,
  focusTextInput,
  createFontSizeControl,
  restoreFontSize,
  showChatAlert,
  setupRandomEmojiAttention,
  getRandomInterval,
  initChatLengthPopupEvents,
  createLengthPopup
} from "./helpers.js";

import { sendSVG, closeSVG, expandSVG, collapseSVG, helpSVG } from "./icons.js";
import { HelpPanel } from "./components/helpPanel.js";
import { EmojiPanel } from "./components/emojiPanel.js";

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

  // Add this function to handle mobile/touch devices
  function handleMobileLayout() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window);

    if (isMobile) {
      // Make input container floating for mobile at the top
      inputContainer.style.position = 'absolute';
      inputContainer.style.top = '0';
      inputContainer.style.left = '0';
      inputContainer.style.right = '0';
      inputContainer.style.borderBottom = '1px solid #333';
      inputContainer.style.zIndex = '100'; // Ensure it's above content

      // Add margin top to messages panel
      messagesPanel.style.marginTop = `${inputContainer.offsetHeight}px`;
    }
  }

  // Call once
  requestAnimationFrame(() => {
    handleMobileLayout();
  });

  // Create emoji button
  const emojiButton = document.createElement('button');
  emojiButton.className = 'emoji-trigger filled-button';
  emojiButton.innerHTML = "🙂";
  emojiButton.classList.add('emoji-button');
  emojiButton.title = 'Open emoji picker';

  // Add these event listeners to change the emoji on hover
  emojiButton.addEventListener('mouseover', () => {
    emojiButton.innerHTML = "🙃";
  });

  emojiButton.addEventListener('mouseout', () => {
    emojiButton.innerHTML = "🙂";
  });

  // Setup random emoji appearance with range (10min - 30min)
  setupRandomEmojiAttention(emojiButton, getRandomInterval(600000, 1800000));

  // Setup emoji panel toggle functionality
  let emojiPanelInstance = null;
  emojiButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!emojiPanelInstance || !document.querySelector('.emoji-panel')) {
      emojiPanelInstance = new EmojiPanel({
        container: messagesPanel,
        position: 'bottom',
        emojiButton: emojiButton,
        onEmojiSelect: (emoji) => {
          const messageInput = document.getElementById('message-input');
          if (messageInput) {
            const cursorPos = messageInput.selectionStart;
            const textBefore = messageInput.value.substring(0, cursorPos);
            const textAfter = messageInput.value.substring(messageInput.selectionEnd);
            messageInput.value = textBefore + emoji + textAfter;
            const newCursorPos = cursorPos + emoji.length;
            messageInput.setSelectionRange(newCursorPos, newCursorPos);
            messageInput.focus();
          }
        },
        onDestroy: () => {
          emojiButton.title = 'Open emoji picker';
          emojiPanelInstance = null;
        }
      });
      emojiPanelInstance.init();
      emojiButton.title = 'Close emoji picker';
    } else {
      emojiPanelInstance.destroy();
    }
  });
  // Create message input
  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.id = 'message-input';
  messageInput.maxLength = 300;
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
  // Help button next to maximize button
  const helpButton = document.createElement('button');
  helpButton.className = 'filled-button header-button chat-help-button';
  helpButton.innerHTML = helpSVG; // Replace with desired icon if available
  helpButton.title = 'Show chat help';
  // Declare a variable to track the help panel instance.
  let helpPanelInstance = null;

  helpButton.addEventListener('click', (e) => {
    console.log("Help button clicked.");
    e.stopPropagation();

    // If a help panel exists, remove it and exit.
    if (helpPanelInstance && document.querySelector('.help-panel')) {
      helpPanelInstance.remove();
      helpButton.title = 'Show chat help';
      helpPanelInstance = null;
      showChatAlert('Help panel has been closed.', {
        type: 'warning',
        duration: 2000
      });
      return;
    }

    // Otherwise, create a new help panel.
    console.log("Help panel does not exist. Creating help panel...");
    helpPanelInstance = new HelpPanel({
      helpButton: helpButton,
      onDestroy: () => {
        helpButton.title = 'Show chat help';
        helpPanelInstance = null;
      }
    });
    helpPanelInstance.init();
    helpPanelInstance.show();
    showChatAlert('Help panel has been opened. Press "?" or "ESC" key, or click outside to close.', {
      type: 'success',
      duration: 2000
    });
    helpButton.title = 'Hide chat help';
  });

  chatContainer.appendChild(helpButton);
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
  createFontSizeControl();
  restoreFontSize();
  // Force scroll to bottom once after chat creation
  requestAnimationFrame(() => {
    const messagesPanel = document.getElementById('messages-panel');
    const messageInput = document.getElementById('message-input');
    if (messagesPanel && messageInput) {
      messagesPanel.scrollTop = messagesPanel.scrollHeight;
      // Pass the input element and messages panel into the helper functions.
      createLengthPopup(messagesPanel);
      initChatLengthPopupEvents(messageInput);
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
      max-width: 100vw !important;
      min-width: 100vw !important;
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
    focusTextInput();
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
      const currentState = getChatState();
      const newState = {
        ...currentState,
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
      focusTextInput();
      restoreFontSize();
    });
  }
}