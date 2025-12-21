import { logMessage, isInIframe } from "./helpers/helpers.js";

export function removeChatParams({ exclude = [] } = {}) {
  const keys = ['klavoauth', 'chatUsernameColor'];

  keys.forEach(key => {
    if (!exclude.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  setTimeout(() => {
    window.location.href = 'https://klavogonki.ru/gamelist/';
  }, 500);
}

export const klavoauth = {
  get username() {
    const data = localStorage.getItem('klavoauth');
    return data ? JSON.parse(data).username : '';
  },
  get password() {
    const data = localStorage.getItem('klavoauth');
    return data ? JSON.parse(data).password : '';
  }
};

export function checkAuth() {
  // First check if running in iframe
  if (isInIframe()) {
    logMessage("Application cannot run in an iframe", 'error');
    return false;
  }
  
  const params = new URLSearchParams(window.location.search);
  if (window.location.pathname === '/g/' && params.has('gmid')) {
    return false;
  }
  
  if (window.location.href.includes('/gamelist/')) {
    getAuthData();
    return false;
  }
  
  const authData = localStorage.getItem('klavoauth');
  const userDropdown = document.querySelector('.user-dropdown');
  
  // If user is authorized on the site (has .user-dropdown) but missing klavoauth
  if (userDropdown && !authData) {
    window.location.href = 'https://klavogonki.ru/gamelist/';
    return false;
  }
  
  // If user is logged out (no .user-dropdown) but has klavoauth, clean up
  if (!userDropdown && authData) {
    removeChatParams({ exclude: ['chatUsernameColor'] });
    return false;
  }
  
  if (!authData || !klavoauth.username || !klavoauth.password) {
    return false;
  }
  
  return true;
}

export function getAuthData() {
  // Only proceed if on the gamelist page
  if (!window.location.href.startsWith('https://klavogonki.ru/gamelist/')) return;

  try {
    // Find the script containing PageData
    const script = Array.from(document.scripts).find(s => s.text.includes('PageData'));
    if (!script) throw new Error('PageData script not found');

    // Extract and parse the JSON-like data inside the script
    const rawData = script.text.match(/\.constant\('PageData', ([\s\S]*?})\)/)[1];
    const parsedData = JSON.parse(
      rawData
        .replace(/(\w+):/g, '"$1":') // Fix object keys
        .replace(/'/g, '"') // Fix string quotes
    );

    // Check if user is logged in (chatParams should be an object, not an empty array)
    if (Array.isArray(parsedData.chatParams)) {
      // User is not logged in - just clean up without redirecting (already on gamelist)
      localStorage.removeItem('klavoauth');
      return;
    }

    const username = `${parsedData.chatParams.user.id}#${parsedData.chatParams.user.login}`;
    const password = parsedData.chatParams.pass;

    // Redirect only if it hasn't happened before
    if (!localStorage.getItem('klavoauth')) {
      // Always update klavoauth with the latest data
      localStorage.setItem('klavoauth', JSON.stringify({ username, password }));
      // Save separate key for chat color background value
      localStorage.setItem('chatUsernameColor', parsedData.chatParams.user.background);
      setTimeout(() => {
        window.location.href = 'https://klavogonki.ru';
      }, 500);
    }
  } catch (e) {
    logMessage({
      en: `Authentication error: ${e.message}`,
      ru: `Ошибка аутентификации: ${e.message}`
    }, 'error');
    removeChatParams();
  }
}