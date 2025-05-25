import {
  exportUsernameColors,
  importUsernameColors,
  openUsernameColors
} from "../components/chatUsernameColorsPanel.js";
import { openThemesPanel } from "../components/themesPanel.js";
import { createEventsPanel } from "../components/eventsPanel.js";
import { logMessage, removeChatTraces } from "./helpers.js";
import { removeChatParams } from "../auth.js";
import { HelpPanel } from "../components/helpPanel.js";
import { openIgnoredUsersPanel } from "../components/ignoredUsersPanel.js";

// Define available commands with their handlers
const chatCommands = [
  {
    name: 'reset',
    pattern: /^\/reset\s*$/,
    handler: () => {
      removeChatParams();
      removeChatTraces();
      logMessage({
        en: 'Chat settings have been reset. Reloading...',
        ru: 'Настройки чата сброшены. Перезагрузка...'
      }, 'info');
      return true;
    }
  },
  {
    name: 'colors',
    pattern: /^\/colors\s*$/,
    handler: () => {
      openUsernameColors();
      return true;
    }
  },
  {
    name: 'export colors',
    pattern: /^\/export\s+colors\s*$/,
    handler: () => {
      exportUsernameColors();
      return true;
    }
  },
  {
    name: 'import colors',
    pattern: /^\/import\s+colors\s*$/,
    handler: () => {
      importUsernameColors();
      return true;
    }
  },
  {
    name: 'themes',
    pattern: /^\/themes\s*$/,
    handler: () => {
      openThemesPanel();
      return true;
    }
  },
  {
    name: 'help',
    pattern: /^\/help\s*$/,
    handler: () => {
      if (!HelpPanel.instance) {
        const hp = new HelpPanel({ onDestroy: () => { } });
        hp.init();
        hp.show();
      } else {
        HelpPanel.instance.remove();
      }
      return true;
    }
  },
  {
    name: 'ignored',
    pattern: /^\/ignored\s*$/,
    handler: () => {
      openIgnoredUsersPanel();
      return true;
    }
  },
  {
    name: 'events',
    pattern: /^\/events\s*$/,
    handler: () => {
      createEventsPanel();
      return true;
    }
  },
  {
    name: 'list normal',
    pattern: /^\/list\s+normal\s*$/,
    handler: () => {
      localStorage.setItem('userlistMode', 'normal');
      updateUserListUI(); 
      logMessage({
        en: 'User list mode set to normal',
        ru: 'Список пользователей: обычный режим'
      }, 'info');
      return true;
    }
  },
  {
    name: 'list race',
    pattern: /^\/list\s+race\s*$/,
    handler: () => {
      localStorage.setItem('userlistMode', 'race');
      updateUserListUI();
      logMessage({
        en: 'User list mode set to race',
        ru: 'Список пользователей: заезды сверху'
      }, 'info');
      return true;
    }
  },
  {
    name: 'list chat',
    pattern: /^\/list\s+chat\s*$/,
    handler: () => {
      localStorage.setItem('userlistMode', 'chat');
      updateUserListUI();
      logMessage({
        en: 'User list mode set to general chat',
        ru: 'Список пользователей: общий чат сверху'
      }, 'info');
      return true;
    }
  }
];

// Setup event handlers for commands
export function setupCommandEvents(inputElement) {
  if (!inputElement) return;

  // Add input event handler for all commands
  inputElement.addEventListener('input', () => {
    handleCommands(inputElement);
  });
}

// Handle any command entered in the input field
function handleCommands(inputElement) {
  if (!inputElement) return false;
  const input = inputElement.value;

  // Check each command to see if it matches
  for (const command of chatCommands) {
    if (command.pattern.test(input)) {
      // Execute the command's handler
      const result = command.handler();

      // Clear the input field if command was successfully handled
      if (result) {
        inputElement.value = '';
      }

      return result;
    }
  }

  return false; // Return false if no command matched
}

function updateUserListUI() {
  const userManager = window.userManager;
  if (userManager) {
    userManager.updateUI();
  } else {
    console.warn('UserManager is not initialized');
  }
}