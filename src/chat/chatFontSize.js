import { getChatState, saveChatState } from "./chatState.js";

export function applyFontSize(multiplier) {
  const chatContainer = document.getElementById('app-chat-container');
  const messageInput = document.getElementById('message-input');
  if (!chatContainer) return;

  // Apply font size to the main container
  chatContainer.style.fontSize = `${multiplier}em`;

  // Apply base font size to message input without multiplier
  // since it inherits the multiplier from the container
  if (messageInput) {
    messageInput.style.fontSize = '1em';
  }

  // Save the current multiplier in the chat state
  const chatState = getChatState();
  saveChatState({
    ...chatState,
    fontSizeMultiplier: multiplier
  });
}

export function restoreFontSize() {
  const chatState = getChatState();
  applyFontSize(chatState.fontSizeMultiplier);
}

export function createFontSizeControl() {
  const chatContainer = document.getElementById('app-chat-container');
  if (!chatContainer) return;

  const chatState = getChatState();

  // Create font size control container
  const fontSizeControl = document.createElement('div');
  fontSizeControl.className = 'font-size-control';

  // Create the slider
  const fontSlider = document.createElement('input');
  fontSlider.type = 'range';
  fontSlider.min = '0.8';
  fontSlider.max = '1.5';
  fontSlider.step = '0.1';
  fontSlider.value = chatState.fontSizeMultiplier;
  fontSlider.className = 'font-size-slider';

  // Prevent dragging the chat when interacting with the slider
  fontSlider.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  // Update font size on input change
  fontSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    applyFontSize(value);
  });

  // Append the slider to the control container
  fontSizeControl.appendChild(fontSlider);

  // Add the control container to the chat drag area
  const dragArea = document.querySelector('.chat-drag-area');
  if (dragArea) {
    dragArea.appendChild(fontSizeControl);
  }
}

// Function to initialize font size controls
export function initFontSizeControls() {
  createFontSizeControl();
  restoreFontSize();
  
  // Add event listener for when the chat container is resized or repositioned
  const chatContainer = document.getElementById('app-chat-container');
  if (chatContainer) {
    const observer = new MutationObserver(() => {
      // Make sure font size is preserved when chat state changes
      const chatState = getChatState();
      applyFontSize(chatState.fontSizeMultiplier);
    });
    
    observer.observe(chatContainer, { 
      attributes: true, 
      attributeFilter: ['style', 'class'] 
    });
  }
}

// This function will apply the font size to all necessary elements
export function updateElementFontSizes(multiplier) {
  const elements = {
    messagePanel: document.getElementById('messages-panel'),
    userList: document.getElementById('user-list'),
    messageInput: document.getElementById('message-input')
  };
  
  // For any element that needs special handling beyond the container's em scaling
  if (elements.messageInput) {
    elements.messageInput.style.fontSize = `${multiplier}em`;
  }
  
  // Ensure time elements maintain their relative size (0.9em)
  document.querySelectorAll('.time').forEach(el => {
    el.style.fontSize = '0.9em';
  });
  
  // Ensure username elements maintain their size (1em)
  document.querySelectorAll('.username').forEach(el => {
    el.style.fontSize = '1em';
  });
}