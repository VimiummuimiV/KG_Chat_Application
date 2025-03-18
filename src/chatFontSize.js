import { getChatState, applyFontSize, createFontSizeControl, restoreFontSize } from "./helpers.js";

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