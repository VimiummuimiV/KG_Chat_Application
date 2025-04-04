import {
  exportUsernameColors,
  importUsernameColors,
  openUsernameColors
} from "../components/chatUsernameColorsPanel.js";

import { showChatAlert } from "./helpers.js";
import { removeChatParams } from "../auth.js";


// Define available commands with their handlers
const chatCommands = [
  {
    name: 'reset',
    pattern: /^\/reset\s*$/,
    handler: () => {
      removeChatParams();
      showChatAlert('Chat settings have been reset. Reloading...', { type: 'info', duration: 1000 });
      return true;
    }
  },
  {
    name: 'colors',
    pattern: /^\/colors\s*$/,
    handler: () => {
      openUsernameColors();
      showChatAlert('Username color picker has been opened', { type: 'info', duration: 1000 });
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