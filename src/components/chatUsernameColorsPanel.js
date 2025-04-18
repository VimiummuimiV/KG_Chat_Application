import { adjustVisibility, debounce, showChatAlert } from "../helpers/helpers";

// Centralized storage wrapper.
const storageKey = 'usernameColors';
const storageWrapper = {
  get: (storage) => {
    try {
      const stored = storage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error(
        `Error parsing ${storage === sessionStorage ? 'sessionStorage' : 'localStorage'} data:`,
        e
      );
      return {};
    }
  },
  set: (storage, data) => {
    try {
      storage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(
        `Error saving data to ${storage === sessionStorage ? 'sessionStorage' : 'localStorage'}:`,
        e
      );
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
  }
};

// DOM element creation helper.
const createElement = (tag, className, attributes = {}) => {
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

// Update styling for label and color box.
const updateStyles = (label, colorBox, color) => {
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
export const openUsernameColors = () => {
  // Prevent duplicate container creation.
  const existingContainer = document.querySelector('.chat-username-color-picker');
  if (existingContainer) {
    return existingContainer;
  }

  const sessionColors = storageOps.getColors();
  let savedBlock = null;
  let longPressTimer = null;
  let currentEntry = null;
  const longPressDuration = 500;

  // Create container and blocks.
  const container = createElement('div', 'chat-username-color-picker', { html: '<h2>Username Colors</h2>' });
  const generatedBlock = createElement(
    'div',
    'generated-username-colors',
    { html: '<h3>Generated Colors <span class="counter">0</span></h3>' }
  );

  // Create saved colors block if needed.
  const createSavedBlock = () => {
    if (!savedBlock) {
      savedBlock = createElement(
        'div',
        'saved-username-colors',
        { html: '<h3>Saved Colors <span class="counter">0</span></h3>' }
      );
      const header = container.querySelector('h2');
      header.nextSibling ? container.insertBefore(savedBlock, header.nextSibling) : container.appendChild(savedBlock);
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

  const updateGeneratedBlockStatus = () => {
    generatedBlock.querySelectorAll('.username-entry').forEach(entry => {
      const username = entry.querySelector('.user-label').textContent;
      entry.classList.toggle('disabled-entry', storageOps.isColorSaved(username));
    });
    updateCounters();
  };

  // Create an entry element.
  const createEntry = (username, color, isSaved = false) => {
    const entry = createElement('div', 'username-entry');
    const label = createElement('div', 'user-label', { text: username });
    const colorBox = createElement('div', 'color-box');
    updateStyles(label, colorBox, color);
    const colorInput = createElement('input', null, { type: 'color', value: color });

    // We keep a reference to the input element on the entry.
    entry._colorInput = colorInput;

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
      // Save a reference for later update.
      entry._removeBtn = removeBtn;
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
        // Update or recreate the remove button.
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
      }
    }, 1000);

    colorInput.addEventListener('input', debouncedUpdate);
    return entry;
  };

  // Render saved colors block.
  const renderSavedBlock = () => {
    if (!savedBlock) return;
    const localColors = storageWrapper.get(localStorage);
    savedBlock.innerHTML = '<h3>Saved Colors <span class="counter">0</span></h3>';
    Object.entries(localColors).forEach(([username, color]) => {
      const entry = createEntry(username, color, true);
      savedBlock.appendChild(entry);
    });
    if (!savedBlock.querySelector('.username-entry')) {
      savedBlock.remove();
      savedBlock = null;
    }
    updateCounters();
  };

  // Render generated colors.
  Object.entries(sessionColors).forEach(([username, color]) => {
    const entry = createEntry(username, color);
    generatedBlock.appendChild(entry);
  });
  updateCounters();
  createSavedBlock();
  renderSavedBlock();
  updateGeneratedBlockStatus();

  container.appendChild(generatedBlock);
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
      const username = entry.querySelector('.user-label').textContent;
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
      if (!entry || entry.classList.contains('disabled-entry') || entry._customInputActive) return;
      // Trigger the color input.
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
      showCustomInput(entry);
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

  // Delegated function to show custom input.
  function showCustomInput(entry) {
    if (entry.querySelector('.custom-color-input')) return;
    entry._customInputActive = true;
    const customInputContainer = createElement('div', 'custom-color-input');
    const hexInput = createElement('input', 'hex-input', { type: 'text', placeholder: 'Enter hex color' });
    const confirmBtn = createElement('button', 'confirm-btn', { text: 'Confirm' });
    customInputContainer.append(hexInput, confirmBtn);
    entry.appendChild(customInputContainer);
    hexInput.focus();
    const handleConfirm = () => {
      const hexValue = hexInput.value.trim();
      if (isValidHex(hexValue)) {
        if (entry._colorInput) {
          entry._colorInput.value = hexValue;
          entry._colorInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        entry.removeChild(customInputContainer);
        entry._customInputActive = false;
      } else {
        alert('Invalid hex color');
      }
    };
    confirmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleConfirm();
    });
    hexInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        handleConfirm();
      }
    });
    customInputContainer.addEventListener('click', (e) => e.stopPropagation());
  }

  return container;
};

// Helper to create or update the remove button for an entry.
const createOrUpdateRemoveButton = (entry, username, color, updateCb) => {
  let removeBtn = entry.querySelector('.remove-btn');
  if (removeBtn) entry.removeChild(removeBtn);
  removeBtn = createElement('div', 'remove-btn');
  removeBtn.appendChild(createRemoveSVG());
  removeBtn.title = "Remove saved color";
  Object.assign(removeBtn.style, {
    backgroundColor: hexWithAlpha(color, 0.4),
    color
  });
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    storageOps.removeColor(username);
    entry.removeChild(removeBtn);
    if (typeof updateCb === 'function') updateCb();
  });
  entry.appendChild(removeBtn);
  return removeBtn;
};

// Helper to export username colors to a JSON file.
export function exportUsernameColors() {
  const usernameColors = localStorage.getItem('usernameColors');
  if (!usernameColors) {
    showChatAlert('No username colors found to export', { type: 'error', duration: 2000 });
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
  showChatAlert('Username colors exported as JSON file', { type: 'info', duration: 2000 });
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
      showChatAlert('No file selected', { type: 'error', duration: 2000 });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        localStorage.setItem('usernameColors', JSON.stringify(jsonData));
        showChatAlert('Username colors imported successfully', { type: 'info', duration: 2000 });
      } catch (err) {
        showChatAlert('Invalid JSON file', { type: 'error', duration: 2000 });
      }
    };
    reader.readAsText(file);
  });
  input.click();
  document.body.removeChild(input);
}