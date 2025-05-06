/**
 * Creates an HR-like separator with an emoji icon.
 * @returns {HTMLElement} The separator element.
 */
export function createNewMessagesSeparator() {
  const separator = document.createElement('div');
  separator.className = 'new-messages-separator';

  const hr = document.createElement('hr');
  hr.className = 'separator-line';

  // Use an emoji icon (feel free to change it)
  const iconContainer = document.createElement('div');
  iconContainer.className = 'separator-icon';
  iconContainer.textContent = '🔥';

  separator.appendChild(hr);
  separator.appendChild(iconContainer);

  return separator;
}

/**
 * Removes the separator if it exists from the provided container.
 * @param {HTMLElement} panel - The container element to check for the separator.
 */
export function removeNewMessagesSeparator(panel) {
  const separator = panel.querySelector('.new-messages-separator');
  if (separator) {
    separator.remove();
  }
}