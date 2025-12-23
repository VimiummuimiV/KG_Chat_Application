import { getDataByName, getDataById } from "../helpers/apiData.js";
import { logMessage } from "../helpers/helpers.js";

const USERNAME_IDS_KEY = 'usernameValidationList';

export async function checkUsernameValidity() {
  try {
    // Load validation data
    const validationData = JSON.parse(localStorage.getItem(USERNAME_IDS_KEY) || '{"date": null, "usernames": {}}');
    
    // Check if we should run the check today
    const today = new Date().toDateString();
    
    if (validationData.date === today) {
      // Already checked today, skip
      return;
    }
    
    // Load all data from localStorage
    const usernameColors = JSON.parse(localStorage.getItem('usernameColors') || '{}');
    const ignored = JSON.parse(localStorage.getItem('ignored') || '[]');
    
    // Collect all current usernames from both colors and ignored
    const currentUsernames = new Set([...Object.keys(usernameColors), ...ignored]);
    
    // Skip validation if there are no users to check
    if (currentUsernames.size === 0 && Object.keys(validationData.usernames).length === 0) {
      // Update date to prevent checking again today
      validationData.date = today;
      localStorage.setItem(USERNAME_IDS_KEY, JSON.stringify(validationData));
      return;
    }
    
    logMessage({
      en: 'Starting daily username validation check',
      ru: 'Запуск ежедневной проверки имён пользователей'
    }, 'info');
    
    const validationList = validationData.usernames;
    
    // Process validation list: check renames and clean removed entries
    for (const [username, userId] of Object.entries(validationList)) {
      // Remove entries from validationList that are no longer in colors or ignored
      if (!currentUsernames.has(username)) {
        delete validationList[username];
        continue;
      }
      
      // Check if user was renamed by fetching current login via userId
      const currentLogin = await getDataById(userId, 'currentLogin');
      // Skip if we couldn't get the username OR if the username hasn't changed
      if (!currentLogin || currentLogin === username) continue;
      
      // User was renamed - determine where it exists
      const inColors = usernameColors.hasOwnProperty(username);
      const inIgnored = ignored.includes(username);
      
      // Log the change
      if (inColors && inIgnored) {
        logMessage({
          en: `User renamed in both colors and ignored panels: "${username}" → "${currentLogin}"`,
          ru: `Пользователь переименован в обеих панелях (цветов и игнорируемых): "${username}" → "${currentLogin}"`
        }, 'warning');
      } else if (inColors) {
        logMessage({
          en: `User renamed in colors panel: "${username}" → "${currentLogin}"`,
          ru: `Пользователь переименован в панели цветов: "${username}" → "${currentLogin}"`
        }, 'warning');
      } else if (inIgnored) {
        logMessage({
          en: `User renamed in ignored panel: "${username}" → "${currentLogin}"`,
          ru: `Пользователь переименован в панели игнорируемых: "${username}" → "${currentLogin}"`
        }, 'warning');
      }
      
      // Update localStorage in BOTH places regardless of where it exists
      // This ensures consistency if user exists in both
      if (inColors) {
        usernameColors[currentLogin] = usernameColors[username];
        delete usernameColors[username];
      }
      
      if (inIgnored) {
        ignored[ignored.indexOf(username)] = currentLogin;
      }
      
      // Save both if any changes were made
      if (inColors || inIgnored) {
        localStorage.setItem('usernameColors', JSON.stringify(usernameColors));
        localStorage.setItem('ignored', JSON.stringify(ignored));
      }
      
      // Update validation list with new username
      validationList[currentLogin] = userId;
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
            validationList[username] = userId;
          }
        } catch (error) {}
      }
    }
    
    // Update validation data with new date and usernames
    validationData.date = today;
    validationData.usernames = validationList;
    
    // Save updated validation data
    localStorage.setItem(USERNAME_IDS_KEY, JSON.stringify(validationData));
    
    logMessage({
      en: 'Username validation check completed',
      ru: 'Проверка имён пользователей завершена'
    }, 'info');
    
  } catch (error) {
    logMessage({
      en: `Error checking usernames: ${error.message}`,
      ru: `Ошибка проверки имён: ${error.message}`
    }, 'error');
  }
}