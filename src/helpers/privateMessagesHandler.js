import { getExactUserIdByName, logMessage } from "./helpers.js";
import { createCustomTooltip } from "./tooltip.js";

// State management for private messaging
export const privateMessageState = {
  isPrivateMode: false,
  targetUsername: null,
  targetId: null,
  fullJid: null,

  async setPrivateTarget(username) {
    if (!username) {
      this.exitPrivateMode();
      return false;
    }

    try {
      const userId = await getExactUserIdByName(username);
      if (!userId) return false;

      this.isPrivateMode = true;
      this.targetUsername = username;
      this.targetId = userId;
      this.fullJid = `${userId}#${username}@jabber.klavogonki.ru/web`;

      return true;
    } catch (error) {
      logMessage({
        en: `Error setting private target: ${error.message}`,
        ru: `Ошибка установки приватной цели: ${error.message}`
      }, 'error');
      return false;
    }
  },

  exitPrivateMode() {
    this.isPrivateMode = false;
    this.targetUsername = null;
    this.targetId = null;
    this.fullJid = null;
  }
};

// Global reference for ESC key handler
let escKeyHandler = null;

// Function to handle ESC key press
function handleEscKeyPress(event) {
  if (event.key === 'Escape' && privateMessageState.isPrivateMode) {
    exitPrivateMode();
  }
}

// Toggle private message mode based on input value
export async function handlePrivateMessageInput(inputElement) {
  if (!inputElement) return;
  const input = inputElement.value;
  // Updated regex to include hyphens and other common username special characters
  const privateModeRegex = /^\/pm\s+([\wа-яА-ЯёЁ\-\.\_\+]+)\s/;
  const exitPrivateModeRegex = /^\/exit\s*$/;
  const match = input.match(privateModeRegex);
  if (match) {
    const username = match[1];
    const success = await privateMessageState.setPrivateTarget(username);
    if (success) {
      enterPrivateMode(username);
      inputElement.value = input.replace(privateModeRegex, ''); // Remove the /pm username part
    } else {
      logMessage({
        en: `Could not find user "${username}"`,
        ru: `Не удалось найти пользователя "${username}"`
      }, 'error');
      exitPrivateMode();
    }
  } else if (exitPrivateModeRegex.test(input)) {
    exitPrivateMode();
    inputElement.value = ''; // Clear the input
  }
}

function enterPrivateMode(username) {
  const messageInput = document.getElementById('message-input');
  if (privateMessageState.isPrivateMode && privateMessageState.targetUsername !== username) {
    exitPrivateMode();
  }

  if (!messageInput.classList.contains('private-mode') || privateMessageState.targetUsername !== username) {
    messageInput.classList.add('private-mode');
    messageInput.placeholder = `PM to ➡ ${username}`;

    // Create or update exit button
    let exitButton = document.querySelector('.private-mode-exit');
    if (!exitButton) {
      exitButton = document.createElement('span');
      exitButton.className = 'button private-mode-exit';

      // Add click event to exit private mode
      exitButton.addEventListener('click', () => {
        exitPrivateMode();
        messageInput.focus();
      });

      // Add the exit button to the UI near the input
      const inputContainer = messageInput.parentElement;
      inputContainer.insertBefore(exitButton, messageInput.nextSibling);
    }

    // Set default closed lock emoji and custom tooltip
    exitButton.innerHTML = "🔒";
    createCustomTooltip(exitButton, {
      en: "Exit private mode",
      ru: "Выйти из приватного режима"
    });

    // Change emoji on hover: open lock on mouseenter, closed lock on mouseleave
    exitButton.addEventListener('mouseenter', () => {
      exitButton.innerHTML = "🔓";
    });

    exitButton.addEventListener('mouseleave', () => {
      exitButton.innerHTML = "🔒";
    });

    logMessage({
      en: `Entered private chat with ${username}`,
      ru: `Вошли в приватный чат с ${username}`
    }, 'warning');
    privateMessageState.isPrivateMode = true;
    privateMessageState.targetUsername = username;

    // Add ESC key event listener when entering private mode
    if (!escKeyHandler) {
      escKeyHandler = handleEscKeyPress;
      document.addEventListener('keydown', escKeyHandler);
    }
  } else if (privateMessageState.targetUsername === username) {
    messageInput.placeholder = `️PM to ➡ ${username}`;
    logMessage({
      en: `Entered private chat with ${username}`,
      ru: `Вошли в приватный чат с ${username}`
    }, 'warning');
  }
}

function exitPrivateMode() {
  const messageInput = document.getElementById('message-input');
  if (messageInput.classList.contains('private-mode')) {
    messageInput.classList.remove('private-mode');
    messageInput.placeholder = ''; // Reset placeholder

    // Remove the exit button
    const exitButton = document.querySelector('.private-mode-exit');
    if (exitButton) exitButton.remove();

    const username = privateMessageState.targetUsername; // Get username before clearing state
    
    // Use the global messageManager reference to remove private messages
    if (window.messageManager) {
      window.messageManager.removePrivateMessages();
    }
    
    privateMessageState.exitPrivateMode(); // Only call once
    logMessage({
      en: `Exited private chat with ${username}`,
      ru: `Вышли из приватного чата с ${username}`
    }, 'success');

    // Remove ESC key event listener when exiting private mode
    if (escKeyHandler) {
      document.removeEventListener('keydown', escKeyHandler);
      escKeyHandler = null;
    }
  }
}

// Handle ESC key to exit private mode
export function setupPrivateMessageEvents(inputElement) {
  if (!inputElement) return;

  // Check for private message mode on input changes
  inputElement.addEventListener('input', () => {
    handlePrivateMessageInput(inputElement);
  });
}