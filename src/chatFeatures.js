import { closeSVG, openSVG } from "./icons.js";
import { saveChatState } from "./helpers.js";

export function toggleChatVisibility() {
  const chatContainer = document.getElementById('app-chat-container');
  const toggleButton = document.querySelector('.chat-toggle-button');
  if (!chatContainer) return;

  const chatState = JSON.parse(localStorage.getItem('chatState')) || {};
  const isFloating = chatState.floating || false;

  if (isFloating) {
    // For floating chat, toggle opacity and display
    chatContainer.style.opacity = chatContainer.style.opacity === '0' ? '1' : '0';
    setTimeout(() => {
      chatContainer.style.display = chatContainer.style.opacity === '0' ? 'none' : 'flex';
      toggleButton.innerHTML = chatContainer.style.display === 'none' ? openSVG : closeSVG;

      // Update the chat state in localStorage
      saveChatState({
        ...chatState,
        isVisible: chatContainer.style.display !== 'none'
      });
    }, 300);
  } else {
    // For non-floating chat, toggle visibility classes
    const isCurrentlyVisible = chatContainer.classList.contains('visible-chat');

    chatContainer.classList.remove('visible-chat', 'hidden-chat');
    chatContainer.classList.add(isCurrentlyVisible ? 'hidden-chat' : 'visible-chat');

    toggleButton.innerHTML = isCurrentlyVisible ? openSVG : closeSVG;

    // Update the chat state in localStorage
    saveChatState({
      ...chatState,
      isVisible: !isCurrentlyVisible
    });
  }
}

export function addChatToggleFeature() {
  const chatContainer = document.getElementById('app-chat-container');
  const closeButton = document.getElementById('chat-close-btn');
  const draggableHeader = document.getElementById('chat-header');
  if (!chatContainer) return;

  // Restore initial visibility based on saved state
  const chatState = JSON.parse(localStorage.getItem('chatState')) || {};
  const isFloating = chatState.floating || false;
  const isVisible = chatState.isVisible !== false; // default to true if not explicitly set to false

  if (isFloating) {
    chatContainer.style.display = isVisible ? 'flex' : 'none';
    chatContainer.style.opacity = isVisible ? '1' : '0';
  } else {
    chatContainer.classList.remove('visible-chat', 'hidden-chat');
    chatContainer.classList.add(isVisible ? 'visible-chat' : 'hidden-chat');
  }

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
