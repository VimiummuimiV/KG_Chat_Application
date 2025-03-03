import { closeSVG, openSVG } from "./icons";

export function toggleChatVisibility() {
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

export function addChatToggleFeature() {
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