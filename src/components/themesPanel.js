import { adjustVisibility } from "../helpers/helpers";
import { themeVariables } from "../data/definitions";

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

// Function to get merged theme variables
function getThemeVariables(theme) {
  const variables = {};
  for (const [key, value] of Object.entries(themeVariables)) {
    variables[key] = value[theme];
  }
  return variables;
};

// Function to apply theme styles dynamically
function applyThemeStyles(themeClassName) {
  const root = document.documentElement;
  const variables = getThemeVariables(themeClassName);

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}

// Apply the saved theme on first load
const savedTheme = localStorage.getItem('selectedTheme') || 'dark-theme';
applyThemeStyles(savedTheme);

// The main exported function.
export const openThemesPanel = () => {
  // Prevent duplicate container creation.
  const existingContainer = document.querySelector('.themes-panel');
  if (existingContainer) {
    return existingContainer;
  }

  // Create container and blocks.
  const container = createElement('div', 'themes-panel', { html: '<h2>Themes</h2>' });
  const themesList = createElement('div', 'themes-list');

  // Append themesList to the container before inserting inputContainer
  container.appendChild(themesList);

  // Add buttons for each theme with emoji icons
  const themes = [
    { name: '🙉 Dark', className: 'dark-theme' },
    { name: '🙊 Light Gray', className: 'light-gray-theme' },
    { name: '🙈 Light', className: 'light-theme' }
  ];

  // Highlight the active theme button
  const highlightActiveTheme = () => {
    const currentTheme = localStorage.getItem('selectedTheme') || 'dark-theme';
    themesList.querySelectorAll('.theme-button').forEach(button => {
      if (button.dataset.theme === currentTheme) {
        button.classList.add('active-theme');
      } else {
        button.classList.remove('active-theme');
      }
    });
  };

  themes.forEach(theme => {
    const button = createElement('button', 'theme-button', { text: theme.name });
    button.dataset.theme = theme.className;
    button.addEventListener('click', () => {
      localStorage.setItem('selectedTheme', theme.className);
      highlightActiveTheme();

      // Apply the theme styles dynamically
      applyThemeStyles(theme.className);
    });
    themesList.appendChild(button);
  });

  highlightActiveTheme();

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