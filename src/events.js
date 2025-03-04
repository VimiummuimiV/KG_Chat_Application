import { clamp, getChatState, handleElementsBehavior, restoreChatState, saveChatState } from "./helpers.js";

// ------------------------- Drag Handlers (Floating) -------------------------
let isDragging = false, dragStartX, dragStartY, dragStartLeft, dragStartTop;

export function setupDragHandlers() {
  document.addEventListener('mousedown', (e) => {
    const dragArea = e.target.closest('.chat-drag-area');
    if (!dragArea) return;
    isDragging = true;
    const chat = document.getElementById('app-chat-container');
    let chatState = getChatState();
    if (!chatState.floating) {
      const newTop = window.innerHeight - chat.offsetHeight;
      chat.style.top = newTop + 'px';
      chat.style.bottom = '';
      chatState.top = newTop;
      chatState.floating = true;
      chat.classList.add("floating-chat");
      saveChatState(chatState);
    }
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartLeft = chat.offsetLeft;
    dragStartTop = parseInt(chat.style.top) || chat.getBoundingClientRect().top;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const chat = document.getElementById('app-chat-container');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    const newLeft = clamp(dragStartLeft + deltaX, 0, viewportWidth - chat.offsetWidth);
    const newTop = clamp(dragStartTop + deltaY, 0, viewportHeight - chat.offsetHeight);
    chat.style.left = newLeft + 'px';
    chat.style.top = newTop + 'px';
    const chatState = getChatState();
    chatState.left = newLeft;
    chatState.top = newTop;
    chatState.floating = true;
    saveChatState(chatState);
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    const chat = document.getElementById('app-chat-container');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const chatRect = chat.getBoundingClientRect();
    const SNAP_THRESHOLD = 50;
    const outOfBounds = chatRect.left < 0 || chatRect.top < 0 ||
      chatRect.right > viewportWidth || chatRect.bottom > viewportHeight;
    const nearBottom = (viewportHeight - chatRect.bottom) < SNAP_THRESHOLD;
    let chatState = getChatState();
    if (outOfBounds || nearBottom) {
      chat.style.top = '';
      chat.style.bottom = '0';
      chatState.floating = false;
      chat.classList.remove("floating-chat");
    } else {
      chatState.floating = true;
      chatState.top = chatRect.top;
      chat.classList.add("floating-chat");
    }
    saveChatState(chatState);
    document.body.style.userSelect = '';
  });
}

// ------------------------- Resize Handlers -------------------------
let isResizing = false, resizeType = null, startX, startY, startWidth, startHeight, startLeft, startTop;

export function setupResizeHandlers() {
  document.addEventListener('mousedown', (e) => {
    const handle = e.target.closest('.resize-handle');
    if (!handle) return;
    isResizing = true;
    resizeType = handle.classList[1];
    const chat = document.getElementById('app-chat-container');
    startX = e.clientX;
    startY = e.clientY;
    startWidth = chat.offsetWidth;
    startHeight = chat.offsetHeight;
    startLeft = chat.offsetLeft;
    let state = getChatState();
    if (state.floating) {
      startTop = parseInt(chat.style.top) || chat.getBoundingClientRect().top;
    }
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const chat = document.getElementById('app-chat-container');
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const computedStyle = getComputedStyle(document.documentElement);
    const minWidth = parseInt(computedStyle.getPropertyValue('--min-chat-width')) || 250;
    const minHeight = parseInt(computedStyle.getPropertyValue('--min-chat-height')) || 200;
    let chatState = getChatState();
    switch (resizeType) {
      case 'top': {
        const newHeight = Math.max(minHeight, startHeight - deltaY);
        if (chatState.floating) {
          let newTop = startTop + deltaY;
          newTop = clamp(newTop, 0, viewportHeight - newHeight);
          chat.style.top = newTop + 'px';
          chatState.top = newTop;
        } else {
          chat.style.top = '';
          chat.style.bottom = '0';
        }
        chat.style.height = newHeight + 'px';
        chatState.height = newHeight;
        break;
      }
      case 'left': {
        const newWidth = Math.max(minWidth, startWidth - deltaX);
        const newLeft = clamp(startLeft + deltaX, 0, viewportWidth - minWidth);
        chat.style.width = newWidth + 'px';
        chat.style.left = newLeft + 'px';
        chatState.width = newWidth;
        chatState.left = newLeft;
        break;
      }
      case 'right': {
        const maxWidth = viewportWidth - chat.getBoundingClientRect().left;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
        chat.style.width = newWidth + 'px';
        chatState.width = newWidth;
        break;
      }
    }
    saveChatState(chatState);
    handleElementsBehavior();
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.userSelect = '';
  });
}

export function setupWindowResizeHandler() {
  window.addEventListener('resize', () => {
    restoreChatState();
    handleElementsBehavior();
  });
}