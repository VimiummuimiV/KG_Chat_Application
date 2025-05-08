import { adjustVisibility } from "../helpers/helpers.js";
import { showChatAlert } from "../helpers/chatHeaderAlert.js";
import { getExactUserIdByName } from "../helpers/helpers.js";

// Centralized storage wrapper for ignored users.
export const storageWrapper = {
  get: () => {
    try {
      const stored = localStorage.getItem('ignored');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error(`Error parsing ignored users data:`, e);
      return [];
    }
  },
  set: (data) => {
    try {
      localStorage.setItem('ignored', JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error saving ignored users data:`, e);
      return false;
    }
  }
};

// DOM element creation helper.
const createElement = (tag, className, attributes = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'text') {
      element.textContent = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  return element;
};

// Helper function to remove a user from both the chat messages and the user list
const purgeUserFromChat = (username) => {
  // Early validation with more robust check
  if (!username || typeof username !== 'string') {
    console.warn('Invalid username provided to purgeUserFromChat');
    return;
  }

  // Cache DOM elements once
  const messagesPanel = document.querySelector(".messages-panel");
  const userList = document.getElementById("user-list");

  // Remove user messages
  if (messagesPanel) {
    const messages = messagesPanel.querySelectorAll(".message");
    messages.forEach(msg => {
      const messageUsername = msg.querySelector(".username")?.textContent;
      if (messageUsername === username) {
        msg.remove();
      }
    });
  }

  // Remove from user list
  if (userList) {
    const userItems = userList.querySelectorAll(".user-item");
    userItems.forEach(item => {
      const itemUsername = item.querySelector(".username")?.textContent;
      if (itemUsername === username) {
        item.remove();
      }
    });
  }
};

// The main exported function.
export const openIgnoredUsersPanel = () => {
  // Prevent duplicate container creation.
  const existingContainer = document.querySelector('.ignored-users-panel');
  if (existingContainer) {
    return existingContainer;
  }

  const ignoredUsers = storageWrapper.get();

  // Create container and blocks.
  const container = createElement('div', 'ignored-users-panel', { html: '<h2>Ignored Users</h2>' });
  const userList = createElement('div', 'ignored-users-list');

  // Append userList to the container before inserting inputContainer
  container.appendChild(userList);

  // Add input field and button for adding new ignored users
  const inputContainer = createElement('div', 'ignored-users-input-container');
  const inputField = createElement('input', 'ignored-users-input', { type: 'search', placeholder: 'Enter username to ignore' });
  const addButton = createElement('button', 'ignored-users-add-btn', { text: 'Add' });

  const handleAddIgnoredUser = async () => {
    const username = inputField.value.trim();
    if (username && !ignoredUsers.includes(username)) {
      const userId = await getExactUserIdByName(username);
      if (!userId) {
        showChatAlert(`Could not find user "${username}"`, { type: 'error', duration: 2000 });
        inputField.classList.add('input-error');
        setTimeout(() => inputField.classList.remove('input-error'), 500);
        return;
      }
      ignoredUsers.push(username);
      storageWrapper.set(ignoredUsers);
      showChatAlert(`Added "${username}" to the ignore list`, { type: 'success', duration: 2000 });
      if (!userList.querySelector(`.username[text="${username}"]`)) {
        const entry = createEntry(username);
        userList.appendChild(entry);
      }
      inputField.value = '';

      // Remove messages and user from the user list
      purgeUserFromChat(username);
    }
  };

  addButton.addEventListener('click', handleAddIgnoredUser);
  inputField.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleAddIgnoredUser();
    }
  });

  inputContainer.append(inputField, addButton);
  container.insertBefore(inputContainer, userList);

  // Create an entry element.
  const createEntry = (username) => {
    const entry = createElement('div', 'ignored-user-entry');
    const label = createElement('div', 'username', { text: username });
    const removeBtn = createElement('button', 'remove-btn');

    // Add SVG cross icon to the remove button
    const removeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    removeIcon.setAttribute("viewBox", "0 0 24 24");
    removeIcon.setAttribute("width", "12");
    removeIcon.setAttribute("height", "12");
    removeIcon.setAttribute("fill", "none");
    removeIcon.setAttribute("stroke", "currentColor");
    removeIcon.setAttribute("stroke-width", "2");
    removeIcon.setAttribute("stroke-linecap", "round");
    removeIcon.setAttribute("stroke-linejoin", "round");
    removeIcon.classList.add("remove-icon");

    ['M18 6L6 18', 'M6 6L18 18'].forEach(d => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      removeIcon.appendChild(path);
    });

    removeBtn.appendChild(removeIcon);

    removeBtn.addEventListener('click', () => {
      const updatedUsers = ignoredUsers.filter(user => user !== username);
      storageWrapper.set(updatedUsers);
      ignoredUsers.splice(ignoredUsers.indexOf(username), 1); // Ensure the in-memory array is updated
      entry.remove();
    });

    entry.append(label, removeBtn);
    return entry;
  };

  // Render ignored users.
  ignoredUsers.forEach(username => {
    const entry = createEntry(username);
    userList.appendChild(entry);
  });

  document.body.appendChild(container);

  adjustVisibility(container, 'show', 1);

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      adjustVisibility(container, 'hide', 0);
      document.removeEventListener('keydown', handleEscapeKey);
    }
  };

  inputField.focus(); // Focus the input field on panel creation

  document.addEventListener('keydown', handleEscapeKey);

  // Hide container on outside click.
  const handleOutsideClick = (e) => {
    if (!container.contains(e.target)) {
      adjustVisibility(container, 'hide', 0);
      document.removeEventListener('click', handleOutsideClick, true);
      document.removeEventListener('keydown', handleEscapeKey); // Remove ESC key listener
    }
  };
  document.addEventListener('click', handleOutsideClick, true);

  return container;
};