import { adjustVisibility, debounce } from "../helpers/helpers";

// Storage operations helper functions.
const storageKey = 'usernameColors';
const getStorageData = (storage) => {
  try {
    const stored = storage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error(`Error parsing ${storage === sessionStorage ? 'sessionStorage' : 'localStorage'} data:`, e);
    return {};
  }
};

const setStorageData = (storage, data) => {
  try {
    storage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Error saving data to ${storage === sessionStorage ? 'sessionStorage' : 'localStorage'}:`, e);
    return false;
  }
};

const storageOps = {
  getColors: () => getStorageData(sessionStorage),
  saveColor: (username, color) => {
    const localColors = getStorageData(localStorage);
    localColors[username] = color;
    return setStorageData(localStorage, localColors);
  },
  removeColor: (username) => {
    const localColors = getStorageData(localStorage);
    if (username in localColors) {
      delete localColors[username];
      return setStorageData(localStorage, localColors);
    }
    return false;
  },
  isColorSaved: (username) => {
    const localColors = getStorageData(localStorage);
    return username in localColors;
  }
};

// Create DOM element helper.
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
  Object.assign(label.style, { color });
  Object.assign(colorBox.style, {
    backgroundColor: hexWithAlpha(color, 0.4),
    color
  });
  colorBox.textContent = color;
};

// Create or update the remove button.
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

// Validate hex color code (#FFFFFF format only)
const isValidHex = (hex) => /^#[0-9A-Fa-f]{6}$/.test(hex);

export const openUsernameColors = () => {
  const sessionColors = storageOps.getColors();
  let savedBlock = null;

  const container = createElement('div', 'chat-username-color-picker', { html: '<h2>Username Colors</h2>' });

  // Create saved colors block if needed.
  const createSavedBlock = () => {
    if (!savedBlock) {
      savedBlock = createElement('div', 'saved-username-colors', { html: '<h3>Saved Colors</h3>' });
      const header = container.querySelector('h2');
      header.nextSibling ? container.insertBefore(savedBlock, header.nextSibling) : container.appendChild(savedBlock);
    }
  };

  // Block for generated colors.
  const generatedBlock = createElement('div', 'generated-username-colors', { html: '<h3>Generated Colors</h3>' });

  const updateGeneratedBlockStatus = () => {
    generatedBlock.querySelectorAll('.username-entry').forEach(entry => {
      const username = entry.querySelector('.user-label').textContent;
      entry.classList.toggle('disabled-entry', storageOps.isColorSaved(username));
    });
  };

  // Create an entry element with long press functionality.
  const createEntry = (username, color, isSaved = false) => {
    const entry = createElement('div', 'username-entry');
    const label = createElement('div', 'user-label', { text: username });
    const colorBox = createElement('div', 'color-box');
    updateStyles(label, colorBox, color);
    const colorInput = createElement('input', null, { type: 'color', value: color });

    entry.append(label, colorBox, colorInput);

    let removeBtn = null;
    if (isSaved) {
      removeBtn = createOrUpdateRemoveButton(entry, username, color, () => {
        entry.remove();
        updateGeneratedBlockStatus();
        if (savedBlock && !savedBlock.querySelector('.username-entry')) {
          savedBlock.remove();
          savedBlock = null;
        }
      });
    }

    const debouncedUpdate = debounce(() => {
      const newColor = colorInput.value;
      updateStyles(label, colorBox, newColor);
      if (!isSaved) {
        sessionColors[username] = newColor;
        setStorageData(sessionStorage, sessionColors);
        storageOps.saveColor(username, newColor);
        createSavedBlock();
        renderSavedBlock();
        updateGeneratedBlockStatus();
      } else {
        storageOps.saveColor(username, newColor);
        if (!removeBtn || !entry.contains(removeBtn)) {
          removeBtn = createOrUpdateRemoveButton(entry, username, newColor, () => {
            entry.remove();
            updateGeneratedBlockStatus();
            if (savedBlock && !savedBlock.querySelector('.username-entry')) {
              savedBlock.remove();
              savedBlock = null;
            }
          });
        } else {
          Object.assign(removeBtn.style, {
            backgroundColor: hexWithAlpha(newColor, 0.4),
            color: newColor
          });
        }
      }
    }, 1000);

    colorInput.addEventListener('input', debouncedUpdate);

    // Long press detection variables
    let longPressTimer;
    let isLongPress = false;
    const longPressDuration = 500; // milliseconds

    const startLongPress = () => {
      longPressTimer = setTimeout(() => {
        isLongPress = true;
        showCustomInput();
      }, longPressDuration);
    };

    const cancelLongPress = () => {
      clearTimeout(longPressTimer);
      isLongPress = false;
    };

    const handleNormalClick = (e) => {
      if (!entry.classList.contains('disabled-entry') && (!removeBtn || !removeBtn.contains(e.target))) {
        colorInput.click();
      }
    };

    const showCustomInput = () => {
      if (entry.querySelector('.custom-color-input')) return; // Prevent multiple inputs

      const customInputContainer = createElement('div', 'custom-color-input');
      const hexInput = createElement('input', 'hex-input', { type: 'text', placeholder: 'Enter hex color' });
      const confirmBtn = createElement('button', 'confirm-btn', { text: 'Confirm' });
      customInputContainer.append(hexInput, confirmBtn);
      entry.appendChild(customInputContainer);
      hexInput.focus();

      const handleConfirm = () => {
        const hexValue = hexInput.value.trim();
        if (isValidHex(hexValue)) {
          const newColor = hexValue;
          colorInput.value = newColor;
          debouncedUpdate();
          entry.removeChild(customInputContainer);
        } else {
          alert('Invalid hex color');
        }
      };

      confirmBtn.addEventListener('click', handleConfirm);
      hexInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleConfirm();
        }
      });

      customInputContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    };

    // Mouse event handlers for long press
    entry.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !entry.classList.contains('disabled-entry') && (!removeBtn || !removeBtn.contains(e.target))) {
        startLongPress();
      }
    });

    entry.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        if (!isLongPress) {
          cancelLongPress();
          handleNormalClick(e);
        } else {
          isLongPress = false;
        }
      }
    });

    entry.addEventListener('mouseleave', cancelLongPress);

    // Touch event handlers for long press
    entry.addEventListener('touchstart', (e) => {
      if (!entry.classList.contains('disabled-entry') && (!removeBtn || !removeBtn.contains(e.target))) {
        startLongPress();
      }
    });

    entry.addEventListener('touchend', (e) => {
      if (!isLongPress) {
        cancelLongPress();
        handleNormalClick(e);
      } else {
        isLongPress = false;
      }
    });

    entry.addEventListener('touchcancel', cancelLongPress);

    return entry;
  };

  // Render saved block based on localStorage.
  const renderSavedBlock = () => {
    if (!savedBlock) return;
    const localColors = getStorageData(localStorage);
    savedBlock.innerHTML = '<h3>Saved Colors</h3>';
    Object.entries(localColors).forEach(([username, color]) => {
      const entry = createEntry(username, color, true);
      savedBlock.appendChild(entry);
    });
    if (!savedBlock.querySelector('.username-entry')) {
      savedBlock.remove();
      savedBlock = null;
    }
  };

  // Render generated colors.
  Object.entries(sessionColors).forEach(([username, color]) => {
    const entry = createEntry(username, color);
    generatedBlock.appendChild(entry);
  });
  createSavedBlock();
  renderSavedBlock();
  updateGeneratedBlockStatus();

  container.appendChild(generatedBlock);
  document.body.appendChild(container);

  // Smoothly fade in the container.
  adjustVisibility(container, 'show', 1);

  // Handle clicks outside the container to fade it out.
  const handleOutsideClick = (e) => {
    if (!container.contains(e.target)) {
      adjustVisibility(container, 'hide', 0);
      document.removeEventListener('click', handleOutsideClick, true);
    }
  };
  document.addEventListener('click', handleOutsideClick, true);
  return container;
};