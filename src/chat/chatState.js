import {
  openSVG,
  closeSVG,
  expandSVG,
  collapseSVG
} from "../data/icons.js";

import {
  clamp,
  focusTextInput
} from "../helpers/helpers.js";

import { handleLayoutBehavior } from "../helpers/layoutBehavior.js";
import { createCustomTooltip } from "../helpers/tooltip.js";

function updateToggleButton(toggleButton, isVisible) {
  toggleButton.innerHTML = isVisible ? closeSVG : openSVG;
  createCustomTooltip(toggleButton, {
    en: isVisible ? 'Hide chat' : 'Show chat',
    ru: isVisible ? 'Скрыть чат' : 'Показать чат'
  });
}

function updateMaximizeButton(maximizeButton, isMaximized) {
  maximizeButton.innerHTML = isMaximized ? collapseSVG : expandSVG;
  createCustomTooltip(maximizeButton, {
    en: isMaximized ? 'Collapse chat' : 'Expand chat',
    ru: isMaximized ? 'Свернуть чат' : 'Развернуть чат'
  });
}

export function restoreChatState() {
  const chat = document.getElementById('app-chat-container');
  const toggleButton = document.querySelector('.chat-toggle-button');
  const maximizeButton = document.querySelector('.chat-maximize-button');
  if (!chat || !toggleButton || !maximizeButton) return;

  const state = getChatState();

  // Handle maximized state
  chat.classList.toggle('maximized', state.isMaximized);
  updateMaximizeButton(maximizeButton, state.isMaximized);

  // Handle visibility state
  if (state.floating) {
    chat.style.display = state.isVisible ? 'flex' : 'none';
    chat.style.opacity = state.isVisible ? '1' : '0';
    // Remove visibility classes for floating chat
    chat.classList.remove('visible-chat', 'hidden-chat');
  } else {
    chat.classList.toggle('visible-chat', state.isVisible);
    chat.classList.toggle('hidden-chat', !state.isVisible);
  }

  // Update toggle button
  updateToggleButton(toggleButton, state.isVisible);

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

  handleLayoutBehavior();
}

export function getChatState() {
  const savedState = localStorage.getItem('chatState');
  const defaultState = {
    height: 300,
    width: Math.min(window.innerWidth, 600),
    left: 0,
    floating: false,
    top: window.innerHeight - 300,
    isVisible: true,
    fontSizeMultiplier: 1.0,
    isMaximized: false
  };

  return savedState ? { ...defaultState, ...JSON.parse(savedState) } : defaultState;
}

export function saveChatState(state) {
  localStorage.setItem('chatState', JSON.stringify(state));
}

export function toggleChatVisibility() {
  const chatContainer = document.getElementById('app-chat-container');
  const toggleButton = document.querySelector('.chat-toggle-button');
  if (!chatContainer) return;

  const chatState = getChatState();
  const isFloating = chatState.floating || false;
  const isVisible = !chatState.isVisible;

  if (isFloating) {
    chatContainer.style.opacity = isVisible ? '1' : '0';
    setTimeout(() => {
      chatContainer.style.display = isVisible ? 'flex' : 'none';
      updateToggleButton(toggleButton, isVisible);
      saveChatState({ ...chatState, isVisible });
      if (isVisible) focusTextInput();
    }, 300);
  } else {
    chatContainer.classList.toggle('visible-chat', isVisible);
    chatContainer.classList.toggle('hidden-chat', !isVisible);
    updateToggleButton(toggleButton, isVisible);
    saveChatState({ ...chatState, isVisible });
    if (isVisible) focusTextInput();
  }
}

export function addChatToggleFeature() {
  const chatContainer = document.getElementById('app-chat-container');
  const closeButton = document.getElementById('chat-close-btn');
  const draggableHeader = document.getElementById('chat-header');
  if (!chatContainer) return;

  // Restore initial visibility from saved state
  const chatState = JSON.parse(localStorage.getItem('chatState')) || {};
  const isFloating = chatState.floating || false;
  const isVisible = chatState.isVisible !== false;

  if (isFloating) {
    chatContainer.style.display = isVisible ? 'flex' : 'none';
    chatContainer.style.opacity = isVisible ? '1' : '0';
  } else {
    chatContainer.classList.remove('visible-chat', 'hidden-chat');
    chatContainer.classList.add(isVisible ? 'visible-chat' : 'hidden-chat');
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      toggleChatMaximize();
    } else if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      toggleChatVisibility();
    }
  });

  if (closeButton) {
    closeButton.addEventListener('click', toggleChatVisibility);
  }

  if (draggableHeader) {
    draggableHeader.addEventListener('dblclick', toggleChatVisibility);
  }
}

// ==================================================================================================

export function toggleChatMaximize() {
  const chat = document.getElementById('app-chat-container');
  const maximizeButton = document.querySelector('.chat-maximize-button');
  if (!chat || !maximizeButton) return;

  const state = getChatState();
  const isMaximized = !state.isMaximized;

  chat.classList.toggle('maximized', isMaximized);
  updateMaximizeButton(maximizeButton, isMaximized);

  saveChatState({ ...state, isMaximized });

  requestAnimationFrame(() => {
    handleLayoutBehavior();

    const container = document.getElementById('messages-panel');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }

    focusTextInput();
  });
}
