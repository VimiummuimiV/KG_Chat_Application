// Helper to extract only a valid hex color (e.g. #RRGGBB) from a string
export function extractHexColor(str) {
  if (typeof str !== 'string') return null;
  const match = str.match(/^#([0-9a-fA-F]{6})\b/);
  return match ? `#${match[1]}` : null;
}

// Function to convert Unix timestamp to YYYY-MM-DD format
export function formatRegisteredDate(registered) {
  if (!registered || !registered.sec) {
    return null;
  }
  const date = new Date(registered.sec * 1000);
  return date.toISOString().split('T')[0];
}

// Function to convert sec and usec to the 'updated' timestamp
export function convertToUpdatedTimestamp(sec, usec) {
  return sec != null && usec != null
    ? sec.toString() + Math.floor(usec / 1000).toString()
    : null;
}

// Helper to fetch JSON and validate response
export async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
}

// Helper function to get exact user ID by username via the search API
export async function getExactUserIdByName(userName) {
  try {
    const searchApiUrl = `https://klavogonki.ru/api/profile/search-users?query=${userName}`;
    const searchResults = await fetchJSON(searchApiUrl);

    if (!searchResults.all?.length) return null;

    const user = searchResults.all.find(user => user.login === userName);
    return user ? user.id : null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

// Helper function to get all user IDs by username via the search API
export async function getAllUserIDsByName(userName) {
  try {
    const searchApiUrl = `https://klavogonki.ru/api/profile/search-users?query=${userName}`;
    const searchResults = await fetchJSON(searchApiUrl);

    if (!searchResults.all?.length) return [];

    return searchResults.all.map(user => user.id);
  } catch (error) {
    console.error('Error getting user IDs:', error);
    return [];
  }
}

// Get user summary data by ID
async function getUserSummaryById(userId) {
  try {
    const profileApiUrl = `https://klavogonki.ru/api/profile/get-summary?id=${userId}`;
    const summary = await fetchJSON(profileApiUrl);
    return summary;
  } catch (error) {
    console.error('Error getting user summary:', error);
    throw error;
  }
}

// Get user index data by ID
async function getUserIndexDataById(userId) {
  try {
    const indexApiUrl = `https://klavogonki.ru/api/profile/get-index-data?userId=${userId}`;
    const indexData = await fetchJSON(indexApiUrl);
    return indexData;
  } catch (error) {
    console.error('Error getting user index data:', error);
    throw error;
  }
}

// Data types that require the index-data API
const INDEX_DATA_TYPES = new Set([
  'bio', 'bioText', 'bioOldText', 'bioEditedDate', 'stats', 'registered',
  'achievesCount', 'totalRaces', 'bestSpeed', 'ratingLevel', 'friendsCount',
  'vocsCount', 'carsCount', 'achieves', 'allIndexData'
]);

// Data types that require the summary API
const SUMMARY_DATA_TYPES = new Set([
  'usernamesHistory', 'currentLogin', 'userId', 'level', 'status', 'title',
  'car', 'carColor', 'isOnline', 'avatar', 'blocked', 'isFriend', 'publicPrefs', 'allUserData'
]);

// MAIN FUNCTION: Get specific data by username - automatically chooses correct API
export async function getDataByName(userName, dataType) {
  try {
    const userId = await getExactUserIdByName(userName);
    if (!userId) {
      throw new Error(`User with username "${userName}" not found`);
    }

    return await getDataById(userId, dataType);
  } catch (error) {
    console.error(`Error getting ${dataType} for user ${userName}:`, error);
    return null;
  }
}

// MAIN FUNCTION: Get specific data by user ID - automatically chooses correct API
export async function getDataById(userId, dataType) {
  try {
    if (INDEX_DATA_TYPES.has(dataType)) {
      const indexData = await getUserIndexDataById(userId);
      return extractData(indexData, dataType, 'index');
    } else if (SUMMARY_DATA_TYPES.has(dataType)) {
      const summary = await getUserSummaryById(userId);
      return extractData(summary, dataType, 'summary');
    } else {
      throw new Error(`Unknown data type: ${dataType}`);
    }
  } catch (error) {
    console.error(`Error getting ${dataType} for user ID ${userId}:`, error);
    return null;
  }
}

// Universal data extractor function - handles both API responses
function extractData(data, dataType, apiType) {
  if (!data) return null;

  if (apiType === 'summary') {
    const userData = { ...(data.user || {}), ...data };

    switch (dataType) {
      case 'usernamesHistory':
        return Array.isArray(userData.history)
          ? userData.history.map(item => item.login)
          : [];

      case 'currentLogin':
        return userData.login || null;
      case 'userId':
        return userData.id || null;
      case 'level':
        return userData.level || null;
      case 'status':
        return userData.status || null;
      case 'title': // Rank
        return userData.title || (userData.status?.title ?? null);
      case 'car': // Cars Count
        return userData.car || null;
      case 'carColor': {
        // Only return a valid hex color (e.g. #RRGGBB), ignore if contains anything else
        return userData.car ? extractHexColor(userData.car.color) : null;
      }
      case 'isOnline':
        return userData.is_online ?? false;
      case 'avatar': // sec and usec data
        return userData.avatar || null;
      case 'avatarTimestamp': {
        const avatar = userData.avatar;
        if (avatar && typeof avatar.sec === 'number' && typeof avatar.usec === 'number') {
          return convertToUpdatedTimestamp(avatar.sec, avatar.usec);
        }
        return null;
      }
      case 'blocked':
        return userData.blocked ?? null;
      case 'isFriend':
        return userData.is_friend ?? false;
      case 'publicPrefs':
        return userData.public_prefs || null;
      case 'allUserData':
        return userData;
      default:
        return null;
    }
  }

  if (apiType === 'index') {
    switch (dataType) {
      case 'bio':
        return data.bio || null;
      case 'bioText':
        return data.bio?.text || null;
      case 'bioOldText':
        return data.bio?.old_text || null;
      case 'bioEditedDate':
        return data.bio?.edited_date || null;
      case 'stats':
        return data.stats || null;
      case 'registered':
        return formatRegisteredDate(data.stats?.registered);
      case 'achievesCount':
        return data.stats?.achieves_cnt || null;
      case 'totalRaces':
        return data.stats?.total_num_races || null;
      case 'bestSpeed':
        return data.stats?.best_speed || null;
      case 'ratingLevel':
        return data.stats?.rating_level || null;
      case 'friendsCount':
        return data.stats?.friends_cnt || null;
      case 'vocsCount':
        return data.stats?.vocs_cnt || null;
      case 'carsCount':
        return data.stats?.cars_cnt || null;
      case 'achieves':
        return data.achieves || null;
      case 'allIndexData':
        return data;
      default:
        return null;
    }
  }
  return null;
}
