import { checkIsMobile } from "./helpers.js";

// Add this function to handle mobile/touch devices
export function handleMobileLayout(chatContainer, chatContent, messagesPanel, dragArea, inputContainer) {
  const isMobile = checkIsMobile();
  if (isMobile) {

    // Add styles for mobile view
    const globalMobileStyles = document.createElement('style');
    globalMobileStyles.classList.add('global-mobile-styles');
    globalMobileStyles.textContent = `
      html {
        padding-bottom: 100px !important;
      }
      #app-chat-container .emoji-panel {
        transform: translate(-50%, 0%) !important;
        height: 60vh !important;
        top: 1em !important;
        left: 50% !important;
        right: unset !important;
      }
      .help-panel,
      .ignored-users-panel,
      .chat-username-color-picker {
        top: 80px !important;
        transform: translate(-50%, 0%) !important;
      }
      
      .events-panel {
        left: 5% !important;
        transform: none !important;
        top: 80px !important;
        width: 90% !important;
      }

      #app-chat-container .user-list-container {
        top: 50px !important;
        height: fit-content !important;
        max-height: 70vh !important;
        border-top: 1px solid var(--border-color) !important;
        border-bottom: 1px solid var(--border-color) !important;
        border-radius: 0.5em 0 0 0.5em !important;
      }

      #app-chat-container .toggle-button {
        border: none !important;
        top: 0 !important;
        right: 0 !important;
        border-radius: 0.2em !important;
        margin: 1em !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1) !important;
      }
    `;
    document.head.appendChild(globalMobileStyles);

    // Use Visual Viewport API for keyboard detection and correct positioning
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        // Calculate the bottom offset taking into account the viewport offset when scrolling
        const bottomOffset = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
        // Update the chat container height to fit the available space when keyboard is open
        chatContainer.style.setProperty('height', `calc(100% - ${bottomOffset}px)`, 'important');

        // Get the current height of the chat container
        const hideElements = chatContainer.getBoundingClientRect().height < 100;

        // Hide or show elements based on the chat container height
        messagesPanel.style.display = hideElements ? 'none' : '';
        chatContent.style.margin = hideElements ? '0' : '';
        chatContent.style.marginTop = hideElements ? '0' : '';
        inputContainer.style.position = hideElements ? 'absolute' : '';
        inputContainer.style.bottom = hideElements ? '0' : '';
        dragArea.style.display = hideElements ? 'none' : '';
        const revealBtn = document.querySelector('.reveal-userlist-btn');
        if (revealBtn) revealBtn.style.display = hideElements ? 'none' : '';

        // Forse to scroll the messages panel to the bottom when keyboard is opened or closed
        messagesPanel.scrollTop = messagesPanel.scrollHeight;
      });
    }
  }
}