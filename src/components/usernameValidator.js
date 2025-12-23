import { getDataByName, getDataById } from "../helpers/apiData.js";
import { logMessage } from "../helpers/helpers.js";

const USERNAME_IDS_KEY = 'usernameValidationList';

export async function checkUsernameValidity() {
  try {
    const usernameColors = JSON.parse(localStorage.getItem('usernameColors') || '{}');
    const ignored = JSON.parse(localStorage.getItem('ignored') || '[]');
    const validationList = JSON.parse(localStorage.getItem(USERNAME_IDS_KEY) || '{}');
    
    // Collect current usernames from both sources
    const currentUsernames = new Set([
      ...Object.keys(usernameColors),
      ...ignored
    ]);
    
    // Clean validation list - remove entries not in colors or ignored
    for (const username in validationList) {
      if (!currentUsernames.has(username)) {
        delete validationList[username];
      }
    }
    
    // Add new users to validation list
    for (const username of currentUsernames) {
      if (!validationList[username]) {
        try {
          const userId = await getDataByName(username, 'userId');
          if (userId) {
            const source = usernameColors[username] ? 'usernameColors' : 'ignored';
            validationList[username] = { userId, source };
          }
        } catch (error) {
          // Skip users that can't be found
        }
      }
    }
    
    // Check each user for rename
    for (const [oldUsername, { userId, source }] of Object.entries(validationList)) {
      const currentLogin = await getDataById(userId, 'currentLogin');
      if (!currentLogin || currentLogin === oldUsername) continue;
      
      const isColors = source === 'usernameColors';
      const inStorage = isColors ? usernameColors[oldUsername] : ignored.includes(oldUsername);
      
      if (inStorage) {
        logMessage({
          en: `User renamed in ${isColors ? 'colors' : 'ignored'} panel: "${oldUsername}" → "${currentLogin}"`,
          ru: `Пользователь переименован в ${isColors ? 'панели цветов' : 'панели игнорируемых'}: "${oldUsername}" → "${currentLogin}"`
        }, 'warning');
        
        if (isColors) {
          usernameColors[currentLogin] = usernameColors[oldUsername];
          delete usernameColors[oldUsername];
          localStorage.setItem('usernameColors', JSON.stringify(usernameColors));
        } else {
          ignored[ignored.indexOf(oldUsername)] = currentLogin;
          localStorage.setItem('ignored', JSON.stringify(ignored));
        }
        
        validationList[currentLogin] = { userId, source };
        delete validationList[oldUsername];
      }
    }
    
    localStorage.setItem(USERNAME_IDS_KEY, JSON.stringify(validationList));
    
  } catch (error) {
    logMessage({
      en: `Error checking usernames: ${error.message}`,
      ru: `Ошибка проверки имён: ${error.message}`
    }, 'error');
  }
}