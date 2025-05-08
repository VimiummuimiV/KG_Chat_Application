import {
  createLengthPopup,
  initChatLengthPopupEvents
} from "../helpers/lengthPopup.js";

import { handleMobileLayout } from "../helpers/mobileLayout.js";

import {
  restoreChatState,
  toggleChatVisibility,
  toggleChatMaximize
} from "./chatState.js";

import { createFontSizeControl, restoreFontSize } from "./chatFontSize.js";

import {
  sendSVG,
  helpSVG,
  magicWandSVG,
  smileSVG
} from "../data/icons.js";

import { HelpPanel } from "../components/helpPanel.js";
import { EmojiPanel } from "../components/emojiPanel.js";
import { openThemesPanel } from "../components/themesPanel.js";

// Apply the UI theme to the chat
export function applyUITheme() {
  let savedTheme = localStorage.getItem('selectedTheme');
  if (!savedTheme) {
    savedTheme = 'dark-soul'; // Default to dark theme if no theme is saved
    localStorage.setItem('selectedTheme', savedTheme);
  }
  document.body.className = savedTheme; // Apply the theme to the body for global panels
}

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

  // Draggable top area
  const dragArea = document.createElement('div');
  dragArea.className = 'chat-drag-area';
  dragArea.addEventListener('dblclick', toggleChatVisibility);
  chatWrapper.appendChild(dragArea);

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
  emojiButton.className = 'emoji-trigger button';
  // emojiButton.innerHTML = "🙂";
  emojiButton.innerHTML = smileSVG;
  emojiButton.classList.add('emoji-button');
  emojiButton.title = 'Open emoji picker';

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
  inputContainer.append(emojiButton, messageInput, sendButton);
  chatContent.append(messagesPanel, inputContainer);

  // Right side: user list
  const userListContainer = document.createElement('div');
  userListContainer.className = 'user-list-container';
  const userList = document.createElement('div');
  userList.id = 'user-list';
  userListContainer.appendChild(userList);
  chatWrapper.append(chatContent, userListContainer);
  chatContainer.appendChild(chatWrapper);

  // Header buttons
  const headerButtons = document.createElement('div');
  headerButtons.className = 'header-buttons';
  dragArea.appendChild(headerButtons);

  // Theme button
  const themeButton = document.createElement('button');
  themeButton.className = 'button header-button chat-theme-button';
  themeButton.innerHTML = magicWandSVG;
  themeButton.title = 'Change theme';
  themeButton.addEventListener("click", () => {
    openThemesPanel();
  });

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
    helpButton.title = 'Hide chat help';
  });


  // Maximize button
  const maximizeButton = document.createElement('button');
  maximizeButton.className = 'button header-button chat-maximize-button';
  maximizeButton.addEventListener('click', toggleChatMaximize);

  // Toggle visibility button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'button header-button chat-toggle-button';
  toggleButton.addEventListener('click', toggleChatVisibility);

  headerButtons.append(themeButton, helpButton, maximizeButton, toggleButton);
  document.body.appendChild(chatContainer);

  // Apply the saved theme to the chat container
  applyUITheme();

  // Restore chat state and settings
  restoreChatState();
  createFontSizeControl();
  restoreFontSize();

  // Initial setup after DOM is ready
  requestAnimationFrame(() => {
    if (messageInput) {
      messageInput.value = ''; // Clear input field on load
    }

    // Pass the input element and messages panel into the helper functions.
    createLengthPopup(messagesPanel);
    initChatLengthPopupEvents(messageInput);
    handleMobileLayout(chatContainer, chatContent, messagesPanel, dragArea, inputContainer);
  });
}
