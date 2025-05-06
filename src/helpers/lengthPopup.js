// Instead of getting the elements immediately, we declare module-level variables.
let chatField = null;
let messagesContainer = null;
let lengthPopup = null;

/**
 * Create and append the length popup.
 * @param {HTMLElement} container - The container (messagesPanel) to which the popup should be appended.
 */
export function createLengthPopup(container) {
  messagesContainer = container;
  lengthPopup = document.createElement('div');
  lengthPopup.className = 'length-field-popup';
  messagesContainer.appendChild(lengthPopup);
}

// Create a canvas for text measurement.
const textMeasurementCanvas = document.createElement('canvas');
const textMeasurementContext = textMeasurementCanvas.getContext('2d');

let isPopupVisible = false;
let previousLength = 0;
let hidePopupTimeout;

function updateLengthPopupColor(length) {
  if (!lengthPopup) {
    console.error('lengthPopup is not defined');
    return;
  }

  let h, s = 100, l = 50;

  if (length === 0) {
    h = 200; s = 20; l = 50;
  } else if (length <= 90) {
    h = 120;
  } else if (length <= 100) {
    h = 120 - ((length - 90) / 10) * 60;
  } else if (length <= 190) {
    h = 60;
  } else if (length <= 200) {
    h = 60 - ((length - 190) / 10) * 20;
  } else if (length <= 250) {
    h = 40;
  } else if (length <= 300) {
    h = 40 - ((length - 250) / 50) * 40;
  } else {
    h = 0;
  }

  const textColor = `hsl(${h}, ${s}%, ${l}%)`;
  const backgroundColor = `hsl(${h}, ${s}%, ${Math.max(l - (length > 250 ? 35 : 30), 8)}%)`;
  const borderColor = `hsla(${h}, ${s}%, ${l}%, 0.1)`;

  lengthPopup.style.setProperty('color', textColor, 'important');
  lengthPopup.style.setProperty('background-color', backgroundColor, 'important');
  lengthPopup.style.setProperty('border', `1px solid ${borderColor}`, 'important');
  lengthPopup.style.setProperty('border-radius', '0.4em', 'important');
}

function updatePopupMetrics(text) {
  if (!chatField) {
    console.error('chatField is not set.');
    return;
  }
  // Get current font from input field.
  const computedStyle = getComputedStyle(chatField);
  textMeasurementContext.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
  // Measure text.
  const textWidth = textMeasurementContext.measureText(text).width;
  // Calculate position.
  const newLeft = chatField.offsetLeft + textWidth + 5;
  const maxLeft = chatField.offsetLeft + chatField.offsetWidth - lengthPopup.offsetWidth;
  lengthPopup.style.left = `${Math.min(newLeft, maxLeft)}px`;
}

const arrowRightBold = "➡"; // Heavy right arrow
const arrowLeftBold = "⬅"; // Heavy left arrow

function updateLengthPopup(length) {
  let displayText =
    length > previousLength ? `${length} ${arrowRightBold}` :
      length < previousLength ? `${arrowLeftBold} ${length}` :
        `${length}`;

  lengthPopup.textContent = displayText;
  updateLengthPopupColor(length);
  previousLength = length;
}

function togglePopup(show) {
  if (isPopupVisible === show) return;
  lengthPopup.classList.toggle('bounce-in', show);
  lengthPopup.classList.toggle('bounce-out', !show);
  isPopupVisible = show;
  if (!show) setTimeout(() => lengthPopup.classList.remove('bounce-out'), 500);
}

function resetPopup() {
  updateLengthPopup(0);
  Object.assign(lengthPopup.style, { left: '0px', color: 'hsl(200, 20%, 50%)' });
}

function handleInputEvent() {
  clearTimeout(hidePopupTimeout);
  updateLengthPopup(chatField.value.length);
  updatePopupMetrics(chatField.value);
  togglePopup(true);
  hidePopupTimeout = setTimeout(() => togglePopup(false), 1000);
}

function handleKeydownEvent(e) {
  if (e.key !== 'Enter') return;
  resetPopup();
  togglePopup(true);
  hidePopupTimeout = setTimeout(() => togglePopup(false), 1000);
}

/**
 * Initializes chat length popup events.
 * @param {HTMLElement} field - The chat input field.
 */
export function initChatLengthPopupEvents(field) {
  chatField = field;
  if (!chatField) {
    console.error('chatField is null');
    return;
  }
  // Only attach event listeners if the popup was created.
  if (!lengthPopup) return;
  chatField.addEventListener('input', handleInputEvent);
  chatField.addEventListener('keydown', handleKeydownEvent);
}