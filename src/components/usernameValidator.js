import { getDataByName, getDataById } from "../helpers/apiData.js";
import { logMessage } from "../helpers/helpers.js";

const USERNAME_IDS_KEY = 'usernameValidationList';

export async function checkUsernameValidity() {
  try {
    // Load all data from localStorage
    const usernameColors = JSON.parse(localStorage.getItem('usernameColors') || '{}');
    const ignored = JSON.parse(localStorage.getItem('ignored') || '[]');
    const validationList = JSON.parse(localStorage.getItem(USERNAME_IDS_KEY) || '{}');
    
    // Collect all current usernames from both colors and ignored
    const currentUsernames = new Set([...Object.keys(usernameColors), ...ignored]);
    
    // Process validation list: check renames and clean removed entries
    for (const [username, data] of Object.entries(validationList)) {
      // Remove entries from validationList that are no longer in colors or ignored
      if (!currentUsernames.has(username)) {
        delete validationList[username];
        continue;
      }
      
      // Check if user was renamed by fetching current login via userId
      const { userId, source } = data;
      const currentLogin = await getDataById(userId, 'currentLogin');
      // Skip if we couldn't get the username OR if the username hasn't changed
      if (!currentLogin || currentLogin === username) continue;
      
      // User was renamed - log the change
      const isColors = source === 'usernameColors';
      logMessage({
        en: `User renamed in ${isColors ? 'colors' : 'ignored'} panel: "${username}" → "${currentLogin}"`,
        ru: `Пользователь переименован в ${isColors ? 'панели цветов' : 'панели игнорируемых'}: "${username}" → "${currentLogin}"`
      }, 'warning');
      
      // Update localStorage with new username
      if (isColors) {
        usernameColors[currentLogin] = usernameColors[username];
        delete usernameColors[username];
        localStorage.setItem('usernameColors', JSON.stringify(usernameColors));
      } else {
        ignored[ignored.indexOf(username)] = currentLogin;
        localStorage.setItem('ignored', JSON.stringify(ignored));
      }
      
      // Update validation list with new username
      validationList[currentLogin] = { userId, source };
      delete validationList[username];
      currentUsernames.delete(username);
      currentUsernames.add(currentLogin);
    }
    
    // Add new users that appeared in colors or ignored
    for (const username of currentUsernames) {
      if (!validationList[username]) {
        try {
          const userId = await getDataByName(username, 'userId');
          if (userId) {
            validationList[username] = { 
              userId, 
              source: usernameColors[username] ? 'usernameColors' : 'ignored' 
            };
          }
        } catch (error) {}
      }
    }
    
    // Save updated validation list
    localStorage.setItem(USERNAME_IDS_KEY, JSON.stringify(validationList));
    
  } catch (error) {
    logMessage({
      en: `Error checking usernames: ${error.message}`,
      ru: `Ошибка проверки имён: ${error.message}`
    }, 'error');
  }
}