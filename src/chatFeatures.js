import { closeSVG, openSVG } from "./icons.js";
import { focusTextInput, saveChatState, showChatAlert } from "./helpers.js";
import { toggleChatMaximize } from "./chatUI.js";

export function toggleChatVisibility() {
  const chatContainer = document.getElementById('app-chat-container');
  const toggleButton = document.querySelector('.chat-toggle-button');
  if (!chatContainer) return;

  // Prevent toggling visibility if chat is maximized
  if (chatContainer.classList.contains('maximized')) {
    showChatAlert('Chat is currently maximized', {
      type: 'warning',
      duration: 1000
    });
    return;
  }

  const chatState = JSON.parse(localStorage.getItem('chatState')) || {};
  const isFloating = chatState.floating || false;

  if (isFloating) {
    const isBecomingVisible = chatContainer.style.opacity === '0';
    chatContainer.style.opacity = isBecomingVisible ? '1' : '0';
    setTimeout(() => {
      chatContainer.style.display = isBecomingVisible ? 'flex' : 'none';
      toggleButton.innerHTML = isBecomingVisible ? closeSVG : openSVG;
      saveChatState({
        ...chatState,
        isVisible: isBecomingVisible
      });
      if (isBecomingVisible) {
        focusTextInput(); // Focus input after chat becomes visible
      }
    }, 300);
  } else {
    const isCurrentlyVisible = chatContainer.classList.contains('visible-chat');
    const isBecomingVisible = !isCurrentlyVisible;
    chatContainer.classList.remove('visible-chat', 'hidden-chat');
    chatContainer.classList.add(isBecomingVisible ? 'visible-chat' : 'hidden-chat');
    toggleButton.innerHTML = isBecomingVisible ? closeSVG : openSVG;
    saveChatState({
      ...chatState,
      isVisible: isBecomingVisible
    });
    if (isBecomingVisible) {
      focusTextInput(); // Focus input immediately when shown
    }
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