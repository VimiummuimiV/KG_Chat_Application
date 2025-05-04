import { adjustVisibility } from "../helpers/helpers.js";
import { lightThemes } from "../data/themes/lightThemes.js";
import { darkThemes } from "../data/themes/darkThemes.js";

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

// Function to get theme variables
function getThemes(theme) {
  const variables = {};
  // Check if the theme exists in lightThemes or darkThemes
  const themeSource = lightThemes['--main-background-color'][theme]
    ? lightThemes
    : darkThemes;

  for (const [key, value] of Object.entries(themeSource)) {
    if (value[theme]) {
      variables[key] = value[theme];
    }
  }
  return variables;
}

// Function to apply theme styles dynamically
function applyThemeStyles(themeClassName) {
  const root = document.documentElement;
  const variables = getThemes(themeClassName);

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}

// Apply the default theme on page load
const defaultTheme = localStorage.getItem('selectedTheme') || 'dark-soul';
applyThemeStyles(defaultTheme);

// The main exported function.
export const openThemesPanel = () => {
  // Prevent duplicate container creation.
  const existingContainer = document.querySelector('.themes-panel');
  if (existingContainer) {
    return existingContainer;
  }

  // Create container with main header
  const container = createElement('div', 'themes-panel', { html: '<h2>Themes</h2>' });

  // Create blocks for both theme types
  const darkThemesBlock = createElement('div', 'dark-themes');
  const lightThemesBlock = createElement('div', 'light-themes');

  // Add headers with counters
  darkThemesBlock.innerHTML = `<h3>Dark Themes <span class="counter">${Object.keys(darkThemes['--main-background-color']).length}</span></h3>`;
  lightThemesBlock.innerHTML = `<h3>Light Themes <span class="counter">${Object.keys(lightThemes['--main-background-color']).length}</span></h3>`;

  // Function to create theme buttons
  const createThemeButton = (themeName, themeKey) => {
    const button = createElement('button', 'theme-button', {
      text: themeName.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
    });
    button.dataset.theme = themeKey;
    button.addEventListener('click', () => {
      localStorage.setItem('selectedTheme', themeKey);
      highlightActiveTheme();
      applyThemeStyles(themeKey);
    });
    return button;
  };

  // Add dark themes
  Object.keys(darkThemes['--main-background-color']).forEach(themeKey => {
    darkThemesBlock.appendChild(createThemeButton(themeKey, themeKey));
  });

  // Add light themes
  Object.keys(lightThemes['--main-background-color']).forEach(themeKey => {
    lightThemesBlock.appendChild(createThemeButton(themeKey, themeKey));
  });

  // Highlight the active theme button
  const highlightActiveTheme = () => {
    const currentTheme = localStorage.getItem('selectedTheme') || 'dark-soul';
    container.querySelectorAll('.theme-button').forEach(button => {
      button.classList.toggle('active-theme', button.dataset.theme === currentTheme);
    });
  };

  // Append blocks to container (dark themes first)
  container.appendChild(darkThemesBlock);
  container.appendChild(lightThemesBlock);

  highlightActiveTheme();
  document.body.appendChild(container);
  adjustVisibility(container, 'show', 1);

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      adjustVisibility(container, 'hide', 0);
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('click', handleOutsideClick, true);
    }
  };
  document.addEventListener('keydown', handleEscapeKey);

  // Hide container on outside click
  const handleOutsideClick = (e) => {
    if (!container.contains(e.target)) {
      adjustVisibility(container, 'hide', 0);
      document.removeEventListener('click', handleOutsideClick, true);
      document.removeEventListener('keydown', handleEscapeKey);
    }
  };
  document.addEventListener('click', handleOutsideClick, true);

  return container;
};