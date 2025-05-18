import { adjustVisibility, debounce } from "../helpers/helpers.js";
import { lightThemes } from "../data/themes/lightThemes.js";
import { darkThemes } from "../data/themes/darkThemes.js";
import { settings } from "../data/definitions.js";

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
  const themeSource = lightThemes['--background-color'][theme]
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
  darkThemesBlock.innerHTML = `<h3>Dark Themes <span class="counter">${Object.keys(darkThemes['--background-color']).length}</span></h3>`;
  lightThemesBlock.innerHTML = `<h3>Light Themes <span class="counter">${Object.keys(lightThemes['--background-color']).length}</span></h3>`;

  // Store original theme for preview restoration
  let originalTheme = localStorage.getItem('selectedTheme') || 'dark-soul';

  // Function to preview theme with debounce
  const previewTheme = debounce(theme => applyThemeStyles(theme), settings.themePreviewDelay);

  // Function to create theme buttons
  const createThemeButton = (themeName, themeKey) => {
    const button = createElement('button', 'theme-button', {
      text: themeName.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
    });
    button.dataset.theme = themeKey;

    // Mouse enter for preview
    button.addEventListener('mouseenter', () => {
      previewTheme(themeKey);
    });

    // Apply theme permanently on click
    button.addEventListener('click', () => {
      originalTheme = themeKey;
      localStorage.setItem('selectedTheme', themeKey);
      highlightActiveTheme();
      applyThemeStyles(themeKey);
    });

    return button;
  };

  // Add dark themes
  Object.keys(darkThemes['--background-color']).forEach(themeKey => {
    darkThemesBlock.appendChild(createThemeButton(themeKey, themeKey));
  });

  // Add light themes
  Object.keys(lightThemes['--background-color']).forEach(themeKey => {
    lightThemesBlock.appendChild(createThemeButton(themeKey, themeKey));
  });

  // Highlight the active theme button and scroll it into view
  const highlightActiveTheme = () => {
    const currentTheme = localStorage.getItem('selectedTheme') || 'dark-soul';
    originalTheme = currentTheme; // Update the original theme reference
    let activeButton = null;

    container.querySelectorAll('.theme-button').forEach(button => {
      const isActive = button.dataset.theme === currentTheme;
      button.classList.toggle('active-theme', isActive);
      if (isActive) {
        activeButton = button;
      }
    });

    // Scroll the active button into view with smooth behavior
    if (activeButton) {
      setTimeout(() => {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100); // Small delay to ensure panel is visible first
    }
  };

  // Add event to revert theme when mouse leaves the panel
  container.addEventListener('mouseleave', () => {
    // Cancel any pending preview
    previewTheme.cancel();
    // Restore original theme if not activated
    applyThemeStyles(originalTheme);
  });

  // Append blocks to container (dark themes first)
  container.appendChild(darkThemesBlock);
  container.appendChild(lightThemesBlock);

  document.body.appendChild(container);
  adjustVisibility(container, 'show', 1);

  // Call highlightActiveTheme after the panel is visible
  highlightActiveTheme();

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