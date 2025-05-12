import { adjustVisibility, debounce } from "../helpers/helpers.js";
import { showChatAlert } from "../helpers/chatHeaderAlert.js";
import { longPressDuration, showAlertDuration } from "../data/definitions.js";
import { getExactUserIdByName } from "../helpers/helpers.js";

// Centralized storage wrapper.
const storageKey = 'usernameColors';
const storageWrapper = {
  get: (storage) => {
    try {
      const stored = storage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error(`Error parsing ${storage === sessionStorage ? 'sessionStorage' : 'localStorage'} data:`, e);
      return {};
    }
  },
  set: (storage, data) => {
    try {
      storage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error saving data to ${storage === sessionStorage ? 'sessionStorage' : 'localStorage'}:`, e);
      return false;
    }
  }
};

const storageOps = {
  getColors: () => storageWrapper.get(sessionStorage),
  saveColor: (username, color) => {
    const localColors = storageWrapper.get(localStorage);
    localColors[username] = color;
    return storageWrapper.set(localStorage, localColors);
  },
  removeColor: (username) => {
    const localColors = storageWrapper.get(localStorage);
    if (username in localColors) {
      delete localColors[username];
      return storageWrapper.set(localStorage, localColors);
    }
    return false;
  },
  isColorSaved: (username) => {
    const localColors = storageWrapper.get(localStorage);
    return username in localColors;
  },
  updateUsername: (oldUsername, newUsername, color) => {
    const localColors = storageWrapper.get(localStorage);
    if (oldUsername in localColors) {
      delete localColors[oldUsername];
      localColors[newUsername] = color;
      return storageWrapper.set(localStorage, localColors);
    }
    return false;
  }
};

// DOM element creation helper.
function createElement(tag, className, attributes = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'text') {
      element.textContent = value;
    } else if (key === 'html') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  return element;
};

// Helper: append alpha to hex.
function hexWithAlpha(hex, alpha) {
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex.length === 7 ? hex + alphaHex : hex.slice(0, 7) + alphaHex;
}

// Create remove (X) SVG icon.
const createRemoveSVG = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add("remove-icon");

  ['M18 6L6 18', 'M6 6L18 18'].forEach(d => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  });
  return svg;
};

// Create edit (pencil) SVG icon.
const createEditSVG = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add("edit-icon");

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7");
  svg.appendChild(path1);

  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute("d", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z");
  svg.appendChild(path2);

  return svg;
};

// Create an add SVG icon.
const createAddSVG = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add("add-icon");

  // plus sign
  ['M12 5v14', 'M5 12h14'].forEach(d => {
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  });
  return svg;
};

// Update styling for label and color box.
function updateStyles(label, colorBox, color) {
  label.style.color = color;
  Object.assign(colorBox.style, {
    backgroundColor: hexWithAlpha(color, 0.4),
    color
  });
  colorBox.textContent = color;
};

// Validate hex color (#FFFFFF format)
const isValidHex = (hex) => /^#[0-9A-Fa-f]{6}$/.test(hex);

// The main exported function.
export function openUsernameColors() {
  // Prevent duplicate container creation.
  const existingContainer = document.querySelector('.chat-username-color-picker');
  if (existingContainer) {
    return existingContainer;
  }

  const sessionColors = storageOps.getColors();
  let savedBlock = null;
  let longPressTimer = null;
  let currentEntry = null;

  // Create container and username-colors container.
  const container = createElement('div', 'chat-username-color-picker');
  const usernameColors = createElement('div', 'username-colors');
  container.appendChild(usernameColors);

  // Create h2 (main header) and append to usernameColors.
  const header = createElement('h2', null, { text: 'Username Colors' });
  usernameColors.appendChild(header);

  // Create container and blocks.
  const generatedBlock = createElement(
    'div',
    'generated-username-colors',
    { html: '<h3>Generated Colors <span class="counter">0</span></h3>' }
  );

  // Create saved colors block if needed.
  function createSavedBlock() {
    if (!savedBlock) {
      savedBlock = createElement(
        'div',
        'saved-username-colors',
        { html: '<h3>Saved Colors <span class="counter">0</span></h3>' }
      );
      const header = container.querySelector('h2');
      header.nextSibling ? container.insertBefore(savedBlock, header.nextSibling) : usernameColors.appendChild(savedBlock);
    }
  };

  // New helper to update header counters.
  function updateCounters() {
    if (generatedBlock) {
      const count = generatedBlock.querySelectorAll('.username-entry').length;
      const counterSpan = generatedBlock.querySelector('h3 .counter');
      if (counterSpan) { counterSpan.textContent = count; }
    }
    if (savedBlock) {
      const count = savedBlock.querySelectorAll('.username-entry').length;
      const counterSpan = savedBlock.querySelector('h3 .counter');
      if (counterSpan) { counterSpan.textContent = count; }
    }
  }

  function updateGeneratedBlockStatus() {
    generatedBlock.querySelectorAll('.username-entry').forEach(entry => {
      const username = entry.querySelector('.username').textContent;
      entry.classList.toggle('disabled-entry', storageOps.isColorSaved(username));
    });
    updateCounters();
  };

  // Create an entry element.
  function createEntry(username, color, isSaved = false) {
    const entry = createElement('div', 'username-entry');
    const label = createElement('div', 'username', { text: username });
    const colorBox = createElement('div', 'color-box', { title: 'Change hex' });
    updateStyles(label, colorBox, color);
    const colorInput = createElement('input', null, { type: 'color', value: color });

    // We keep a reference to the input element on the entry.
    entry._colorInput = colorInput;
    entry._username = username;
    entry._color = color;

    entry.append(label, colorBox, colorInput);

    if (isSaved) {
      // Create remove button on initialization.
      const removeBtn = createOrUpdateRemoveButton(entry, username, color, () => {
        entry.remove();
        updateGeneratedBlockStatus();
        if (savedBlock && !savedBlock.querySelector('.username-entry')) {
          savedBlock.remove();
          savedBlock = null;
        }
      });

      // Create edit button for usernames in saved entries
      const editBtn = createEditButton(entry, username, color);
      entry.appendChild(editBtn);

      // Save a reference for later update.
      entry._removeBtn = removeBtn;
      entry._editBtn = editBtn;
    }

    const debouncedUpdate = debounce(() => {
      const newColor = colorInput.value;
      updateStyles(label, colorBox, newColor);
      if (!isSaved) {
        sessionColors[username] = newColor;
        storageWrapper.set(sessionStorage, sessionColors);
        storageOps.saveColor(username, newColor);
        createSavedBlock();
        renderSavedBlock();
        updateGeneratedBlockStatus();
      } else {
        storageOps.saveColor(username, newColor);
        entry._color = newColor;

        // Update or recreate the buttons
        if (!entry._removeBtn || !entry.contains(entry._removeBtn)) {
          entry._removeBtn = createOrUpdateRemoveButton(entry, username, newColor, () => {
            entry.remove();
            updateGeneratedBlockStatus();
            if (savedBlock && !savedBlock.querySelector('.username-entry')) {
              savedBlock.remove();
              savedBlock = null;
            }
          });
        } else {
          Object.assign(entry._removeBtn.style, {
            backgroundColor: hexWithAlpha(newColor, 0.4),
            color: newColor
          });
        }

        if (!entry._editBtn || !entry.contains(entry._editBtn)) {
          entry._editBtn = createEditButton(entry, username, newColor);
        } else {
          Object.assign(entry._editBtn.style, {
            backgroundColor: hexWithAlpha(newColor, 0.4),
            color: newColor
          });
        }
      }
    }, 1000);

    colorInput.addEventListener('input', debouncedUpdate);
    return entry;
  };

  // Create edit button for username entries
  function createEditButton(entry, _username, color) {
    const editBtn = createElement('div', 'entry-btn edit-btn');
    editBtn.appendChild(createEditSVG());
    editBtn.title = "Edit username";
    Object.assign(editBtn.style, {
      backgroundColor: hexWithAlpha(color, 0.4),
      color
    });

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showConfirmation(entry, 'username');
    });

    entry.appendChild(editBtn);
    return editBtn;
  };

  // Render saved colors block.
  function renderSavedBlock() {
    if (!savedBlock) return;
    const localColors = storageWrapper.get(localStorage);
    savedBlock.innerHTML = '<h3>Saved Colors <span class="counter">0</span></h3>';
    // prepend add button as first entry
    savedBlock.appendChild(createAddUsernameButton());
    Object.entries(localColors).forEach(([username, color]) => {
      const entry = createEntry(username, color, true);
      savedBlock.appendChild(entry);
    });
    if (!savedBlock.querySelector('.username-entry')) {
      savedBlock.remove();
      savedBlock = null;
    }
    updateCounters();
  }

  // Render generated colors.
  Object.entries(sessionColors).forEach(([username, color]) => {
    const entry = createEntry(username, color);
    generatedBlock.appendChild(entry);
  });
  updateCounters();
  createSavedBlock();
  renderSavedBlock();
  updateGeneratedBlockStatus();

  usernameColors.appendChild(generatedBlock);
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

  // Delegate click events on the container.
  container.addEventListener('click', (e) => {
    // Handle remove button clicks.
    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn) {
      const entry = removeBtn.closest('.username-entry');
      if (!entry) return;
      const username = entry.querySelector('.username').textContent;
      storageOps.removeColor(username);
      entry.remove();
      updateGeneratedBlockStatus();
      if (savedBlock && !savedBlock.querySelector('.username-entry')) {
        savedBlock.remove();
        savedBlock = null;
      }
      return;
    }

    // Handle color box click.
    const colorBox = e.target.closest('.color-box');
    if (colorBox) {
      const entry = colorBox.closest('.username-entry');
      if (!entry || entry.classList.contains('disabled-entry') || entry._confirmation) return;

      // Always open native color picker on click
      if (entry._colorInput) {
        entry._colorInput.click();
      }
    }
  });

  // Delegate pointer events for long press on color boxes.
  container.addEventListener('pointerdown', (e) => {
    const colorBox = e.target.closest('.color-box');
    if (!colorBox) return;
    const entry = colorBox.closest('.username-entry');
    if (!entry || entry.classList.contains('disabled-entry')) return;
    // Start long press timer.
    longPressTimer = setTimeout(() => {
      entry._isLongPress = true;
      showConfirmation(entry, 'color');
    }, longPressDuration);
    // Save the current entry for pointerup/leave events.
    currentEntry = entry;
  });

  container.addEventListener('pointerup', clearLongPress);
  container.addEventListener('pointerleave', clearLongPress);
  container.addEventListener('pointercancel', clearLongPress);

  function clearLongPress() {
    clearTimeout(longPressTimer);
    if (currentEntry) {
      currentEntry._isLongPress = false;
      currentEntry = null;
    }
  }

  // Highlight field on error or no value
  function highlightFieldOnError(field) {
    field.classList.add('field-error');
    setTimeout(() => field.classList.remove('field-error'), 500);
  }

  // Create username button to add new user
  function createAddUsernameButton() {
    const entry = createElement('div', 'username-entry');
    const description = createElement('span', 'add-description', {text: "Add username"});
    const add = createElement('div', 'entry-btn add-btn');
    add.appendChild(createAddSVG());
    add.title = "Add username";
    add.addEventListener('click', e => {
      e.stopPropagation();
      // mark this as an "add" flow
      const dummy = { _confirmation: false, _add: true };
      showConfirmation(dummy, 'username');
    });
    entry.append(description, add);
    return entry;
  }

  // Unified confirm dialog for color-edit, username-edit, or remove-only flows.
  function showConfirmation(entry, mode = 'color') {
    const parent = document.querySelector('.chat-username-color-picker');

    // First, check if there's any existing confirmation dialog anywhere
    const existingConfirmation = parent.querySelector('.confirmation');
    if (existingConfirmation) {
      existingConfirmation.remove();
    }

    // Mark the entry as having a confirmation dialog
    entry._confirmation = true;

    // Create the new confirmation dialog
    const container = createElement('div', 'confirmation');
    const cancelBtn = createElement('button', 'field-btn cancel-btn', { text: 'Cancel' });
    const confirmBtn = createElement('button', 'field-btn confirm-btn', { text: 'Confirm' });

    // Only create an input field for color or username modes
    let inputField = null;
    if (mode === 'color' || mode === 'username') {
      inputField = createElement('input', 'input-field', {
        type: 'search',
        placeholder: mode === 'color'
          ? `H: ${entry._username}`
          : `U: ${entry._username || 'username'}`
      });
      container.append(cancelBtn, inputField, confirmBtn);
    } else {
      // Remove-only flow
      container.append(cancelBtn, confirmBtn);
    }

    // Append the container to the parent
    parent.appendChild(container);

    if (inputField) {
      inputField.focus();
      inputField.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          confirmBtn.click();
        }
      });
    }

    // Cleanup helper function
    function closeDialog() {
      container.remove();
      entry._confirmation = false;
    }

    confirmBtn.addEventListener('click', async e => {
      e.stopPropagation();

      if (mode === 'color') {
        const val = inputField.value.trim();
        if (!val) {
          showChatAlert('The field cannot be empty', { type: 'warning', duration: showAlertDuration });
          highlightFieldOnError(inputField);
          return;
        }
        if (!isValidHex(val)) {
          showChatAlert(`Invalid hex "${val}"`, { type: 'error', duration: showAlertDuration });
          highlightFieldOnError(inputField);
          return;
        }
        entry._colorInput.value = val.toLowerCase();
        entry._colorInput.dispatchEvent(new Event('input', { bubbles: true }));

      } else if (mode === 'username') {
        const val = inputField.value.trim();
        if (!val) {
          showChatAlert('The field cannot be empty', { type: 'warning', duration: showAlertDuration });
          highlightFieldOnError(inputField);
          return;
        }

        // First verify user exists
        const userId = await getExactUserIdByName(val);
        if (!userId) {
          showChatAlert(`Could not find user "${val}"`, { type: 'error', duration: showAlertDuration });
          highlightFieldOnError(inputField);
          return;
        }

        // If this was the "add" button dummy
        if (entry._add) {
          const username = val;
          const defaultColor = '#cdcdcd';
          storageOps.saveColor(username, defaultColor);
          createSavedBlock();
          renderSavedBlock();
          updateGeneratedBlockStatus();
          closeDialog();
          return;
        }

        // Otherwise it's the edit-existing flow
        if (val !== entry._username) {
          storageOps.updateUsername(entry._username, val, entry._color);
          entry.querySelector('.username').textContent = val;
          entry._username = val;
          updateGeneratedBlockStatus();
        }

      } else {
        // Remove-only flow
        storageOps.removeColor(entry._username);
        entry.remove();
        updateGeneratedBlockStatus();
      }

      closeDialog();
    });

    cancelBtn.addEventListener('click', e => {
      e.stopPropagation();
      closeDialog();
    });

    // Stop propagation of click events to prevent bubbling
    container.addEventListener('click', e => e.stopPropagation());
  }

  // Helper to create or update the remove button for an entry.
  function createOrUpdateRemoveButton(entry, username, color, updateCb) {
    // remove any old button
    let removeBtn = entry.querySelector('.remove-btn');
    if (removeBtn) entry.removeChild(removeBtn);

    // build new one
    removeBtn = createElement('div', 'entry-btn remove-btn');
    removeBtn.appendChild(createRemoveSVG());
    removeBtn.title = "Remove entry";
    Object.assign(removeBtn.style, {
      backgroundColor: hexWithAlpha(color, 0.4),
      color
    });

    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      // guard re-entry
      if (entry._confirmation) return;
      // launch confirm-only dialog; on confirm → actually remove
      showConfirmation(entry, 'remove', () => {
        storageOps.removeColor(username);
        entry.remove();
        if (typeof updateCb === 'function') updateCb();
      });
    });

    entry.appendChild(removeBtn);
    return removeBtn;
  };

  return container;
};

// Helper to export username colors to a JSON file.
export function exportUsernameColors() {
  const usernameColors = localStorage.getItem('usernameColors');
  if (!usernameColors) {
    showChatAlert('No username colors found to export', { type: 'error', duration: showAlertDuration });
    return;
  }
  // Parse and stringify with indentation
  const formattedJson = JSON.stringify(JSON.parse(usernameColors), null, 2);
  const blob = new Blob([formattedJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'usernameColors.json';
  a.click();
  URL.revokeObjectURL(url);
  showChatAlert('Username colors exported as JSON file', { type: 'info', duration: showAlertDuration });
}

// Helper to import username colors from a JSON file.
export function importUsernameColors() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      showChatAlert('No file selected', { type: 'error', duration: showAlertDuration });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        localStorage.setItem('usernameColors', JSON.stringify(jsonData));
        showChatAlert('Username colors imported successfully', { type: 'info', duration: showAlertDuration });
      } catch (err) {
        showChatAlert('Invalid JSON file', { type: 'error', duration: showAlertDuration });
      }
    };
    reader.readAsText(file);
  });
  input.click();
  document.body.removeChild(input);
}