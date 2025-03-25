import {
  restoreChatState,
  createFontSizeControl,
  restoreFontSize,
  showChatAlert,
  setupRandomEmojiAttention,
  getRandomInterval,
  initChatLengthPopupEvents,
  createLengthPopup,
  checkIsMobile,
  toggleChatVisibility,
  toggleChatMaximize,
  handleMobileLayout
} from "../helpers.js";

import {
  sendSVG,
  closeSVG,
  expandSVG,
  helpSVG
} from "../data/icons.js";

import { HelpPanel } from "../components/helpPanel.js";
import { EmojiPanel } from "../components/emojiPanel.js";

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

  // Initial setup after DOM is ready
  requestAnimationFrame(() => {
    handleMobileLayout(messagesPanel, inputContainer);
  });

  // Create emoji button
  const emojiButton = document.createElement('button');
  emojiButton.className = 'emoji-trigger button';
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

  // Setup random emoji appearance with range (5min - 10min)
  setupRandomEmojiAttention(emojiButton, getRandomInterval(300000, 600000));

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
  messageInput.autocomplete = 'off';
  // Create send button
  const sendButton = document.createElement('button');
  sendButton.id = 'send-button';
  sendButton.className = 'button send-button';
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
  maximizeButton.className = 'button header-button chat-maximize-button';
  maximizeButton.innerHTML = expandSVG;
  maximizeButton.addEventListener('click', toggleChatMaximize);
  chatContainer.appendChild(maximizeButton);
  // Help button next to maximize button
  const helpButton = document.createElement('button');
  helpButton.className = 'button header-button chat-help-button';
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
  toggleButton.className = 'button header-button chat-toggle-button';
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
  requestAnimationFrame(() => {
    const messagesPanel = document.getElementById('messages-panel');
    const messageInput = document.getElementById('message-input');
    if (messagesPanel && messageInput) {
      const isMobile = checkIsMobile();
      if (!isMobile) {
        messagesPanel.scrollTop = messagesPanel.scrollHeight;
      } else {
        setTimeout(() => {
          messagesPanel.scrollTop = messagesPanel.scrollHeight;
        }, 2000);
      }
      messageInput.value = ''; // Clear input field on load
      // Pass the input element and messages panel into the helper functions.
      createLengthPopup(messagesPanel);
      initChatLengthPopupEvents(messageInput);
    }
  });
}
