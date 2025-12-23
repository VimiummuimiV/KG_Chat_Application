import { getDataByName, getDataById } from "../helpers/apiData.js";
import { logMessage } from "../helpers/helpers.js";

const USERNAME_IDS_KEY = 'usernameValidationList';

// Initialize username-to-ID mappings with source tracking
async function initializeUsernameMappings() {
  const colorsRaw = localStorage.getItem('usernameColors');
  const ignoredRaw = localStorage.getItem('ignored');
  const existingMap = JSON.parse(localStorage.getItem(USERNAME_IDS_KEY) || '{}');
  
  const usernamesWithSource = new Map();
  
  if (colorsRaw) {
    Object.keys(JSON.parse(colorsRaw)).forEach(u => {
      usernamesWithSource.set(u, 'usernameColors');
    });
  }
  if (ignoredRaw) {
    JSON.parse(ignoredRaw).forEach(u => {
      usernamesWithSource.set(u, 'ignored');
    });
  }
  
  for (const [username, source] of usernamesWithSource) {
    if (!existingMap[username]) {
      const userId = await getDataByName(username, 'userId');
      if (userId) {
        existingMap[username] = { userId, source };
      }
    } else if (!existingMap[username].source) {
      // Update old format to new format with source
      existingMap[username] = { 
        userId: existingMap[username], 
        source 
      };
    }
  }
  
  localStorage.setItem(USERNAME_IDS_KEY, JSON.stringify(existingMap));
  return existingMap;
}

export async function checkUsernameValidity() {
  try {
    const usernameValidationList = await initializeUsernameMappings();
    
    for (const [storedUsername, data] of Object.entries(usernameValidationList)) {
      const { userId, source } = data;
      const currentLogin = await getDataById(userId, 'currentLogin');
      
      if (currentLogin && currentLogin !== storedUsername) {
        const sourceTextEn = source === 'usernameColors' ? 'colors panel' : 'ignored panel';
        const sourceTextRu = source === 'usernameColors' ? 'панели цветов' : 'панели игнорируемых';
        logMessage({
          en: `User renamed in ${sourceTextEn}: "${storedUsername}" → "${currentLogin}"`,
          ru: `Пользователь переименован в ${sourceTextRu}: "${storedUsername}" → "${currentLogin}"`
        }, 'warning');
      }
    }
  } catch (error) {
    logMessage({
      en: `Error checking usernames: ${error.message}`,
      ru: `Ошибка проверки имён: ${error.message}`
    }, 'error');
  }
}