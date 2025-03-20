import {
  clamp,
  getChatState,
  handleElementsBehavior,
  restoreChatState,
  saveChatState
} from "../helpers.js";

// ------------------------- Drag Handlers (Floating) -------------------------
let isDragging = false,
    dragStartX,
    dragStartY,
    dragStartLeft,
    dragStartTop;

export function setupDragHandlers() {
  document.addEventListener('mousedown', (e) => {
    const dragArea = e.target.closest('.chat-drag-area');
    if (!dragArea) return;

    const chat = document.getElementById('app-chat-container');
    let chatState = getChatState();

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartLeft = chat.offsetLeft;
    // Use the computed top if no inline style exists
    dragStartTop = parseInt(chat.style.top) || chat.getBoundingClientRect().top;
    
    // If the chat isn’t already floating, convert it now
    if (!chatState.floating) {
      const newTop = window.innerHeight - chat.offsetHeight;
      chat.style.top = newTop + 'px';
      chat.style.bottom = '';
      chatState.top = newTop;
      chatState.floating = true;
      chat.classList.add("floating-chat");
      saveChatState(chatState);
    }

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
    // Ensure the chat does not go above the viewport (>= 0) or below viewport bottom
    const newTop = clamp(dragStartTop + deltaY, 0, viewportHeight - chat.offsetHeight);
    
    chat.style.left = newLeft + 'px';
    chat.style.top = newTop + 'px';
    
    let chatState = getChatState();
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
      // Snap to bottom when out of bounds
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
let isResizing = false,
    resizeType = null,
    startX,
    startY,
    startWidth,
    startHeight,
    startLeft,
    startTop,
    offsetY = 0;  // used to keep the cursor's relative position on the edge

export function setupResizeHandlers() {
  document.addEventListener('mousedown', (e) => {
    const handle = e.target.closest('.resize-handle');
    if (!handle) return;
    isResizing = true;
    resizeType = handle.classList[1]; // e.g., 'top', 'left', 'right'
    const chat = document.getElementById('app-chat-container');
    startX = e.clientX;
    startY = e.clientY;
    startWidth = chat.offsetWidth;
    startHeight = chat.offsetHeight;
    startLeft = chat.offsetLeft;
    // Use inline style top if available, otherwise the computed top
    startTop = parseInt(chat.style.top) || chat.getBoundingClientRect().top;
    offsetY = e.clientY - startTop;  // capture the cursor offset relative to chat's top edge
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const chat = document.getElementById('app-chat-container');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const computedStyle = getComputedStyle(document.documentElement);
    const minWidth = parseInt(computedStyle.getPropertyValue('--min-chat-width')) || 250;
    const minHeight = parseInt(computedStyle.getPropertyValue('--min-chat-height')) || 200;
    let chatState = getChatState();

    // Horizontal resizing (applies for left and right handles)
    if (resizeType === 'left') {
      const newWidth = Math.max(minWidth, startWidth - (e.clientX - startX));
      const newLeft = clamp(startLeft + (e.clientX - startX), 0, viewportWidth - newWidth);
      chat.style.width = newWidth + 'px';
      chat.style.left = newLeft + 'px';
      chatState.width = newWidth;
      chatState.left = newLeft;
    } else if (resizeType === 'right') {
      const maxWidth = viewportWidth - chat.getBoundingClientRect().left;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + (e.clientX - startX)));
      chat.style.width = newWidth + 'px';
      chatState.width = newWidth;
    }

    // Vertical resizing for the three handles will use the cursor’s Y position.
    // Calculate the desired new top edge based on the original offset.
    const newTopCandidate = e.clientY - offsetY;

    // For the top handle, the chat’s top edge should follow the cursor.
    if (resizeType === 'top') {
      if (chatState.floating === false) {
        // Docked: bottom remains anchored at viewport bottom.
        // When docked, the computed startTop equals (viewportHeight - startHeight)
        let newTop = clamp(newTopCandidate, 0, viewportHeight - minHeight);
        let newHeight = viewportHeight - newTop; // bottom is fixed at viewport bottom
        chat.style.top = newTop + 'px';
        chat.style.height = newHeight + 'px';
        chatState.top = newTop;
        chatState.height = newHeight;
      } else {
        // Floating: simply follow the cursor for the top edge,
        // ensuring we don’t shrink below minHeight.
        let newTop = clamp(newTopCandidate, 0, startTop + startHeight - minHeight);
        let newHeight = startHeight - (newTop - startTop);
        // Also do not allow height to exceed viewport height
        newHeight = Math.min(newHeight, viewportHeight);
        chat.style.top = newTop + 'px';
        chat.style.height = newHeight + 'px';
        chatState.top = newTop;
        chatState.height = newHeight;
      }
    }
    
    // For left/right handles, we also want vertical resizing.
    if (resizeType === 'left' || resizeType === 'right') {
      if (chatState.floating === false) {
        // Docked: bottom is fixed
        let newTop = clamp(newTopCandidate, 0, viewportHeight - minHeight);
        let newHeight = viewportHeight - newTop;
        chat.style.top = newTop + 'px';
        chat.style.height = newHeight + 'px';
        chatState.top = newTop;
        chatState.height = newHeight;
      } else {
        // Floating: follow the cursor while keeping at least minHeight.
        let newTop = clamp(newTopCandidate, 0, startTop + startHeight - minHeight);
        let newHeight = startHeight - (newTop - startTop);
        newHeight = Math.min(newHeight, viewportHeight - newTop);
        chat.style.top = newTop + 'px';
        chat.style.height = newHeight + 'px';
        chatState.top = newTop;
        chatState.height = newHeight;
      }
    }

    // Ensure height never exceeds the viewport height
    if (chat.offsetHeight > viewportHeight) {
      chat.style.height = viewportHeight + 'px';
      if (chatState.floating === false) {
        chat.style.top = '0px';  // if docked, force top to 0 so height = viewport height
        chatState.top = 0;
      }
      chatState.height = viewportHeight;
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
