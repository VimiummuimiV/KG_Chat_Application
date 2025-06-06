import { adjustVisibility, logMessage } from "../helpers/helpers.js";
import { getExactUserIdByName } from "../helpers/helpers.js";
import { uiStrings, defaultLanguage } from "../data/definitions.js";
import { createCustomTooltip } from "../helpers/tooltip.js";
import { removeSVG } from "../data/icons.js";

// Storage keys for ignored users
const IGNORED_USERS_KEY = 'ignored';
const TEMP_IGNORED_USERS_KEY = 'tempIgnored';

// Centralized storage wrapper for ignored users.
export const storageWrapper = {
  get: (key, fallback) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      logMessage({
        en: `Error parsing ignored users data: ${e.message}`,
        ru: `Ошибка разбора данных игнорируемых пользователей: ${e.message}`
      }, 'error');
      return fallback;
    }
  },
  set: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      logMessage({
        en: `Error saving ignored users data: ${e.message}`,
        ru: `Ошибка сохранения данных игнорируемых пользователей: ${e.message}`
      }, 'error');
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

// Helper to get all ignored users (permanent and non-expired temporary)
export function getAllIgnoredUsers() {
  const forever = storageWrapper.get(IGNORED_USERS_KEY, []);
  const temp = storageWrapper.get(TEMP_IGNORED_USERS_KEY, {});
  const now = Date.now();
  const temporary = Object.entries(temp)
    .filter(([_, expiry]) => expiry > now)
    .map(([username]) => username);
  return { forever, temporary };
}

// The main exported function.
export const openIgnoredUsersPanel = () => {
  // Prevent duplicate container creation.
  const existingContainer = document.querySelector('.ignored-users-panel');
  if (existingContainer) {
    return existingContainer;
  }

  // Use the helper to get both lists
  const { forever, temporary } = getAllIgnoredUsers();

  // Retrieve tempIgnored ONCE for this panel render
  const tempIgnoredMap = storageWrapper.get(TEMP_IGNORED_USERS_KEY, {});

  // Create container and ignored-users container.
  const container = createElement('div', 'ignored-users-panel');
  const userList = createElement('div', 'ignored-users-list');
  container.appendChild(userList);

  // Create h2 (main header) and append to userList.
  const header = createElement('h2', null, { text: uiStrings.ignoredUsersHeader[defaultLanguage] });
  userList.appendChild(header);

  // Helper to create a section (forever or temporary)
  function createIgnoredSection({
    type,
    users,
    userList,
    uiStrings,
    defaultLanguage,
    createEntry,
    tempIgnoredMap // Pass tempIgnoredMap for temporary users
  }) {
    if (!users.length) return null;
    const header = document.createElement('h3');
    header.className = 'ignored-users-subheader';
    header.innerHTML = `${uiStrings[type === 'forever' ? 'ignoredUsersSubheaderForever' : 'ignoredUsersSubheaderTemporary'][defaultLanguage]} <span class="counter">${users.length}</span>`;
    const sectionClass = type === 'forever' ? 'ignored-users-forever-section' : 'ignored-users-temporary-section';
    const section = createElement('div', sectionClass);
    userList.append(header, section);
    users.forEach(username => {
      const entry = createEntry(username, type, tempIgnoredMap);
      section.appendChild(entry);
    });
    return section;
  }

  // Forever section
  createIgnoredSection({
    type: 'forever',
    users: forever,
    userList,
    uiStrings,
    defaultLanguage,
    createEntry
  });

  // Temporary section (fetch tempIgnored map once)
  createIgnoredSection({
    type: 'temporary',
    users: temporary,
    userList,
    uiStrings,
    defaultLanguage,
    createEntry,
    tempIgnoredMap
  });

  // Add input field and button for adding new ignored users
  const inputContainer = createElement('div', 'ignored-users-input-container');
  const inputField = createElement('input', 'ignored-users-input', { type: 'search', placeholder: uiStrings.ignoredUsersPlaceholder[defaultLanguage] });
  const addButton = createElement('button', 'ignored-users-add-btn', { text: uiStrings.ignoredBlockButton[defaultLanguage] });
  createCustomTooltip(addButton, {
    en: 'Add to ignored',
    ru: 'Добавить в игнорируемые'
  });

  const handleAddIgnoredUser = async () => {
    const username = inputField.value.trim();
    if (!username) return;

    // Check if already ignored
    if (forever.includes(username) || temporary.includes(username)) return;

    const userId = await getExactUserIdByName(username);
    if (!userId) {
      logMessage({
        en: `Could not find user "${username}"`,
        ru: `Не удалось найти пользователя "${username}"`
      }, 'error');
      inputField.value = '';
      inputField.classList.add('field-error');
      setTimeout(() => inputField.classList.remove('field-error'), 500);
      return;
    }

    // Always add as permanent ban (forever)
    forever.push(username);
    storageWrapper.set(IGNORED_USERS_KEY, forever);
    logMessage({
      en: `Added "${username}" to the ignore list`,
      ru: `"${username}" добавлен(а) в список игнорируемых`
    }, 'info');
    inputField.value = '';
    if (window.messageManager && typeof window.messageManager.removeIgnoredMessages === 'function') {
      window.messageManager.removeIgnoredMessages();
    }

    // If foreverSection doesn't exist yet, create it now
    let foreverSection = document.querySelector('.ignored-users-forever-section');
    if (!foreverSection) {
      foreverSection = createIgnoredSection({
        type: 'forever',
        users: [username],
        userList,
        uiStrings,
        defaultLanguage,
        createEntry
      });
    } else {
      foreverSection.appendChild(createEntry(username, 'forever'));
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
  function createEntry(username, type = 'forever', tempIgnoredMap = null) {
    const entry = createElement('div', 'ignored-user-entry');
    const label = createElement('div', 'username', { text: username });
    // Use tempIgnoredMap passed in for temporary users
    if (type === 'temporary') {
      label.classList.add('temporary-banned');
      // Tooltip for temporary ignored users
      const expiry = tempIgnoredMap ? tempIgnoredMap[username] : null;
      if (expiry) {
        const now = Date.now();
        const msLeft = expiry - now;
        // Try to infer duration (1h, 1d, etc) by checking common values
        let durationMs = null;
        if (msLeft > 0) {
          // Try to guess duration: check if close to 1h or 1d
          const diff1h = Math.abs((expiry - msLeft) - (expiry - 60 * 60 * 1000));
          const diff1d = Math.abs((expiry - msLeft) - (expiry - 24 * 60 * 60 * 1000));
          if (diff1h < 60000) durationMs = 60 * 60 * 1000;
          else if (diff1d < 60000) durationMs = 24 * 60 * 60 * 1000;
        }
        // Fallback: use expiry - msLeft as addedAt
        const addedAt = durationMs ? (expiry - durationMs) : (expiry - msLeft);
        // Format remaining time
        const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        // Tooltip text
        const addedDate = new Date(addedAt);
        // Compact 24-hour format: YYYY-MM-DD HH:mm:ss
        const pad = n => n.toString().padStart(2, '0');
        const addedStr = `${addedDate.getFullYear()}-${pad(addedDate.getMonth() + 1)}-${pad(addedDate.getDate())} ${pad(addedDate.getHours())}:${pad(addedDate.getMinutes())}:${pad(addedDate.getSeconds())}`;
        // Localized labels in brackets
        const addedLabel = defaultLanguage === 'ru' ? '[Добавлен]' : '[Added]';
        const timeLeftLabel = defaultLanguage === 'ru' ? '[Осталось]' : '[Time left]';
        const tooltipText =
          `${addedLabel}: ${addedStr}\n` +
          `${timeLeftLabel}: ${hours}h ${minutes}m ${seconds}s`;
        createCustomTooltip(label, { en: tooltipText, ru: tooltipText });
      }
    } else {
      label.classList.add('forever-banned');
    }
    const removeBtn = createElement('button', 'remove-btn');
    removeBtn.innerHTML = removeSVG;
    createCustomTooltip(removeBtn, {
      en: 'Remove from ignored',
      ru: 'Удалить из игнорируемых'
    });

    // Helper to remove entry and, if last, remove section (and header if present)
    function removeSectionIfEmpty(entry) {
      const section = entry.parentElement;
      entry.remove();
      if (section && section.children.length === 0) {
        // Remove the section and its previous sibling (header) if present
        const header = section.previousElementSibling;
        section.remove();
        if (header) header.remove();
      }
    }

    removeBtn.addEventListener('click', () => {
      if (type === 'temporary') {
        // Remove from temp ignored
        // Use tempIgnoredMap already defined above
        delete tempIgnoredMap[username];
        storageWrapper.set(TEMP_IGNORED_USERS_KEY, tempIgnoredMap);
        removeSectionIfEmpty(entry);
      } else {
        // Remove from permanent ignored
        const forever = storageWrapper.get(IGNORED_USERS_KEY, []);
        const updatedUsers = forever.filter(user => user !== username);
        storageWrapper.set(IGNORED_USERS_KEY, updatedUsers);
        removeSectionIfEmpty(entry);
      }
    });

    entry.append(label, removeBtn);
    return entry;
  }

  document.body.appendChild(container);

  adjustVisibility(container, 'show', 1);

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      adjustVisibility(container, 'hide', 0);
      document.removeEventListener('keydown', handleEscapeKey);
    }
  };

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