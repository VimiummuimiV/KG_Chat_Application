import {
  BASE_URL,
  FALLBACK_COLOR,
  settings
} from "../data/definitions.js";

import {
  getRandomEmojiAvatar,
  extractUsername,
  extractUserId,
  logMessage
} from "../helpers/helpers.js";

import { addShakeEffect } from "../data/animations.js";
import { usernameColors } from "../helpers/chatUsernameColors.js";
import { getAllIgnoredUsers } from "../components/ignoredUsersPanel.js";
import { loadProfileIntoIframe } from "../helpers/iframeProfileLoader.js";
import { handlePrivateMessageInput } from "../helpers/privateMessagesHandler.js";
import { createCustomTooltip } from "../helpers/tooltip.js";

// Utility function to generate a dynamic timestamp for the rand parameter
const generateRandomParam = () => `rand=${Date.now()}`;

export default class UserManager {
  constructor(containerId = 'user-list') {
    this.container = document.getElementById(containerId);
    this.activeUsers = new Map();
    this.isFirstLoad = true;
    this.avatarCache = this.loadAvatarCache();
    this.cacheDate = new Date().toDateString();
    this.changes = false; // For tracking changes
    this.pendingUserJIDs = new Set(); // For tracking new users
    this.updatedUserJIDs = new Set(); // For tracking updated users
    this.updateUITimeout = null; // For debouncing UI updates
    this.raceStats = new Map(); // Track race stats per userId: { count, lastGameId }

    // Role-based icons
    this.roleIcons = {
      'visitor': '🚫',
      'participant': '',
      'moderator': '⚔️️'
    };

    // Role priority for sorting
    this.rolePriority = {
      'moderator': 1,
      'participant': 2,
      'visitor': 3
    };

    // Attach event listeners
    this.setupEventListeners();
  }

  loadAvatarCache() {
    try {
      const cacheData = localStorage.getItem('userAvatarCache');
      if (cacheData) {
        const cache = JSON.parse(cacheData);
        if (cache.date === new Date().toDateString()) {
          console.log("🗃️ Loaded avatar cache from localStorage");
          return cache.avatars || {};
        } else {
          logMessage({
            en: "Avatar cache expired, creating fresh cache.",
            ru: "Кэш аватаров устарел, создаётся новый."
          }, 'info');
          return {};
        }
      }
    } catch (error) {
      logMessage({
        en: `Error loading avatar cache: ${error.message}`,
        ru: `Ошибка загрузки кэша аватаров: ${error.message}`
      }, 'error');
    }
    return {};
  }

  saveAvatarCache() {
    try {
      localStorage.setItem('userAvatarCache', JSON.stringify({
        date: this.cacheDate,
        avatars: this.avatarCache
      }));
    } catch (error) {
      logMessage({
        en: `Error saving avatar cache: ${error.message}`,
        ru: `Ошибка сохранения кэша аватаров: ${error.message}`
      }, 'error');
    }
  }

  /**
   * Updates the avatar cache for a specific user.
   * @param {string} userId - The unique identifier of the user.
   * @param {boolean} hasAvatar - Flag indicating if the user has an avatar url.
   * @param {string} avatarData - Either the avatar URL or emoji character, depending on hasAvatar.
   * @param {string} username - The display name of the user.
   * @returns {boolean} - Returns true if cache was updated, false if no update was needed.
   */
  updateAvatarCache(userId, hasAvatar, avatarData, username) {
    const cached = this.avatarCache[userId];
    // Only update if there's no previous cache or if hasAvatar status changed
    if (!cached || cached.hasAvatar !== hasAvatar) {
      this.avatarCache[userId] = {
        hasAvatar: hasAvatar,
        ...(hasAvatar ? { avatarUrl: avatarData } : { emoji: avatarData })
      };

      // Log the update
      const icon = hasAvatar ? '🖼️' : '😊';
      const type = hasAvatar ? 'avatar' : 'emoji';
      console.log(`${icon} Set ${type} for [${username}] (${userId}):`, avatarData);

      this.saveAvatarCache();
      return true; // Indicate cache was updated
    }
    return false; // Indicate no update needed
  }

  // Handles private message input for a specific user
  handlePrivateMode(username) {
    const messageInput = document.getElementById('message-input');
    messageInput.value = `/pm ${username} `;
    handlePrivateMessageInput(messageInput);
    messageInput.focus();
  }

  // Sets up long press event for the user list container user elements
  setupLongPressEvent(container, callback) {
    let timer;
    let longPressTriggered = false;

    const handlePressStart = (event, eventType) => {
      if (event.target.classList.contains('username')) {
        longPressTriggered = false;

        const startLongPress = () => {
          longPressTriggered = true;
          callback(event.target);
        };

        const clearLongPress = () => {
          clearTimeout(timer);
        };

        timer = setTimeout(startLongPress, settings.longPressDuration);

        const endEvents = eventType === 'mouse'
          ? ['mouseup', 'mouseleave']
          : ['touchend', 'touchmove'];

        endEvents.forEach(eventName => {
          event.target.addEventListener(eventName, clearLongPress, { once: true });
        });
      }
    };

    container.addEventListener('mousedown', e => handlePressStart(e, 'mouse'));
    container.addEventListener('touchstart', e => handlePressStart(e, 'touch'));

    return () => longPressTriggered; // Return a boolean indicating if long press was triggered
  }

  // Sets up event listeners for user interactions
  setupEventListeners() {
    // Double-click on the user list container toggles user list mode
    this.container.addEventListener('dblclick', (event) => {
      // Only if double-clicked directly on the container (not on a user)
      if (event.currentTarget === event.target) {
        UserManager.toggleUserListMode(event.currentTarget);
      }
    });

    const wasLongPress = this.setupLongPressEvent(this.container, (target) => {
      const username = target.textContent.trim();
      this.handlePrivateMode(username);
    });

    this.container.addEventListener('click', (event) => {
      // Handle username clicks
      if (event.target.classList.contains('username')) {
        const dataUserId = event.target.getAttribute('data-user-id');
        if (dataUserId) {
          const username = event.target.textContent.trim();

          if (event.ctrlKey) {
            this.handlePrivateMode(username);
          } else if (!wasLongPress()) {
            // Normal click: Navigate to profile
            const userIdValue = dataUserId.split('/')[1].split('#')[0];
            const profileUrl = `https://klavogonki.ru/u/#/${userIdValue}/`;
            loadProfileIntoIframe(profileUrl);
          }
        }
        return;
      }

      // Handle game indicator clicks
      if (event.target.closest('.game-indicator')) {
        const gameIndicator = event.target.closest('.game-indicator');
        const gameId = gameIndicator.getAttribute('data-game-id');
        if (gameId) {
          event.stopPropagation();
          window.location.href = `https://klavogonki.ru/g/?gmid=${gameId}`;
        }
        return;
      }
    });
  }

  async updatePresence(xmlResponse) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const presences = doc.getElementsByTagName("presence");

    if (xmlResponse.includes('<presence id="initialChatLoad"')) {
      console.log("🔄 Initial room join detected, requesting full roster");
      this.requestFullRoster();
      return;
    }

    // Reset change tracking variables for this update cycle
    this.changes = false;
    this.updatedUserJIDs.clear();

    for (let i = 0; i < presences.length; i++) {
      const presence = presences[i];
      const from = presence.getAttribute('from');
      const type = presence.getAttribute('type');

      // Skip if not from the conference room
      if (!from || !from.includes('general@conference.jabber.klavogonki.ru/')) {
        continue;
      }

      // Extract username from JID
      const usernameFromJid = from.split('/').pop();
      if (!usernameFromJid) continue;

      // Skip Клавобот (unified check)
      if (usernameFromJid.toLowerCase() === 'клавобот' || from.toLowerCase().includes('#клавобот')) {
        continue;
      }

      // Handle user leaving
      if (type === 'unavailable') {
        if (this.activeUsers.has(from)) {
          const departingUser = this.activeUsers.get(from);
          const userId = extractUserId(from);
          const cleanLogin = extractUsername(departingUser.login);

          if (!this.isFirstLoad) {
            // console.log(`🚪 User left: ${cleanLogin} ID: (${userId})`);
          }
          this.activeUsers.delete(from);
          this.changes = true;
        }
        continue;
      }

      const existingUser = this.activeUsers.get(from) || {};
      const userId = extractUserId(from);
      const cachedAvatarInfo = this.avatarCache[userId];

      // Initialize userData
      let userData = {
        jid: from,
        login: usernameFromJid,
        color: FALLBACK_COLOR,
        // Normalize the username before calling getColor:
        usernameColor: usernameColors.getColor(extractUsername(usernameFromJid)),
        role: 'participant',
        gameId: null,
        avatar: null
      };

      // Process x elements
      const xElements = presence.getElementsByTagName("x");
      let foundAvatar = false;

      Array.from(xElements).forEach(element => {
        const xmlns = element.getAttribute("xmlns");

        if (xmlns === "klavogonki:userdata") {
          const userNode = element.getElementsByTagName("user")[0];

          if (userNode) {
            const loginElement = userNode.getElementsByTagName("login")[0];
            if (loginElement && loginElement.textContent) {
              userData.login = loginElement.textContent;
              userData.usernameColor = usernameColors.getColor(extractUsername(userData.login));
            }

            const avatarElement = userNode.getElementsByTagName("avatar")[0];
            if (avatarElement && avatarElement.textContent) {
              userData.avatar = avatarElement.textContent;
              foundAvatar = true;
            }

            const moderatorNode = userNode.getElementsByTagName("moderator")[0];
            if (moderatorNode && moderatorNode.textContent === '1') {
              userData.role = 'moderator';
            }
          }

          const gameIdElement = element.getElementsByTagName("game_id")[0];
          if (gameIdElement && gameIdElement.textContent) {
            userData.gameId = gameIdElement.textContent;
          }
        }

        if (xmlns === "http://jabber.org/protocol/muc#user") {
          const itemNode = element.getElementsByTagName("item")[0];
          if (itemNode) {
            const role = itemNode.getAttribute("role");
            if (role && userData.role !== 'moderator') {
              userData.role = role;
            }
          }
        }
      });

      // If no avatar in update but exists in user data, keep it
      if (!foundAvatar && existingUser && existingUser.avatar) {
        userData.avatar = existingUser.avatar;
      }

      // Handle avatar (use cache or set default)
      if (!userData.avatar && cachedAvatarInfo) {
        if (cachedAvatarInfo.hasAvatar) {
          userData.avatar = cachedAvatarInfo.avatarUrl;
        }
      }

      const cleanLogin = extractUsername(userData.login);

      // Update race stats
      let stats = this.raceStats.get(userId);
      if (!stats) {
        stats = { count: 0, lastGameId: null };
        this.raceStats.set(userId, stats);
      }
      if (userData.gameId) {
        if (stats.lastGameId !== userData.gameId) {
          stats.count += 1;
          stats.lastGameId = userData.gameId;
        }
      } else {
        stats.count = 0;
        stats.lastGameId = null;
      }

      // Determine if user is new or updated
      if (!this.activeUsers.has(from)) {
        if (!this.isFirstLoad) {
          // console.log(`👤 User joined: ${cleanLogin} ID: (${userId})`);
        }
        this.activeUsers.set(from, userData);
        this.changes = true;
        this.pendingUserJIDs.add(from);
      } else if (JSON.stringify(existingUser) !== JSON.stringify(userData)) {
        this.activeUsers.set(from, userData);
        this.changes = true;
        this.updatedUserJIDs.add(from);
      }
    }

    if (this.changes) {
      if (!this.isFirstLoad) {
        // Debounce UI updates to avoid excessive DOM manipulation
        if (this.updateUITimeout) {
          clearTimeout(this.updateUITimeout);
        }
        this.updateUITimeout = setTimeout(() => {
          this.updateUI();
          this.updateUITimeout = null; // Reset timeout reference
          this.pendingUserJIDs.clear(); // Clear after UI update
        }, settings.pendingUserDelay); // Use pendingUserDelay for UI update debounce
      } else {
        // Initial load, update UI immediately
        this.updateUI();
        this.pendingUserJIDs.clear(); // Clear after UI update
      }
    }
  }

  updateRoleTooltip(roleElement, role) {
    if (role === 'moderator') {
      createCustomTooltip(roleElement, {
        en: 'Chat Moderator',
        ru: 'Модератор чата'
      });
    } else if (role === 'visitor') {
      createCustomTooltip(roleElement, {
        en: 'Banned User',
        ru: 'Забаненный пользователь'
      });
    }
  }

  /**
   * Cycles the user list mode between
   * 'normal', 'race', and 'chat',
   * updates localStorage, and refreshes the UI.
   */
  static toggleUserListMode() {
    const modes = ['normal', 'race', 'chat'];
    const userListModeMessages = {
      normal: {
        en: 'User list mode set to normal',
        ru: 'Список пользователей: обычный режим'
      },
      race: {
        en: 'User list mode set to race',
        ru: 'Список пользователей: заезды сверху'
      },
      chat: {
        en: 'User list mode set to general chat',
        ru: 'Список пользователей: общий чат сверху'
      }
    };
    const current = localStorage.getItem('userlistMode') || 'normal';
    const idx = modes.indexOf(current);
    const next = modes[(idx + 1) % modes.length];
    localStorage.setItem('userlistMode', next);
    if (window.userManager) {
      window.userManager.updateUI();
    }
    // Log the change
    logMessage(userListModeMessages[next], 'info');
    return next;
  }

  sortByRoleAndName(users) {
    return users.sort((a, b) => {
      const priorityDiff = this.rolePriority[a.role] - this.rolePriority[b.role];
      return priorityDiff !== 0 ? priorityDiff : extractUsername(a.login).localeCompare(extractUsername(b.login));
    });
  }

  sortByRaceCount(users) {
    return users.sort((a, b) => {
      const ac = this.raceStats.get(extractUserId(a.jid))?.count || 0;
      const bc = this.raceStats.get(extractUserId(b.jid))?.count || 0;
      return bc - ac;
    });
  }

  updateUI() {
    // Use centralized helper for ignored users
    const { forever, temporary } = getAllIgnoredUsers();
    const ignoredUsers = [...forever, ...temporary];

    // Build map of existing DOM elements
    const existingElements = new Map();
    this.container.querySelectorAll('.user-item').forEach(el => {
      existingElements.set(el.getAttribute('data-jid'), el);
    });

    // --- Userlist mode logic ---
    const userlistMode = localStorage.getItem('userlistMode') || 'normal';
    let sortedUsers = Array.from(this.activeUsers.values()).filter(user => {
      const cleanLogin = extractUsername(user.login);

      // Ignore users in the ignored list to avoid displaying them in the user list
      return !ignoredUsers.includes(cleanLogin);
    });

    // Separate users into those in a game and those not in a game
    const usersInRace = sortedUsers.filter(u => u.gameId);
    const usersNotInRace = sortedUsers.filter(u => !u.gameId);

    // Sort users based on the mode
    if (userlistMode === 'race') {
      sortedUsers = [
        ...this.sortByRaceCount(usersInRace),
        ...this.sortByRoleAndName(usersNotInRace)
      ];
    } else if (userlistMode === 'chat') {
      sortedUsers = [
        ...this.sortByRoleAndName(usersNotInRace),
        ...this.sortByRaceCount(usersInRace)
      ];
    } else {
      sortedUsers = this.sortByRoleAndName(sortedUsers);
    }

    // Calculate the index where the "separation" class should be added
    let separationIndex = -1;
    if (userlistMode === 'race' && usersInRace.length > 0) {
      // In "race" mode, add "separation" to the last user in usersInRace
      separationIndex = usersInRace.length - 1;
    } else if (userlistMode === 'chat' && usersNotInRace.length > 0) {
      // In "chat" mode, add "separation" to the last user in usersNotInRace
      separationIndex = usersNotInRace.length - 1;
    }
    // For "normal" mode, separationIndex remains -1, so no class is added

    // Build the updated user list
    const fragment = document.createDocumentFragment();

    sortedUsers.forEach((user, index) => {
      let userElement = existingElements.get(user.jid);
      const userId = extractUserId(user.jid);
      const cleanLogin = extractUsername(user.login);

      // Create new user element if it doesn’t exist
      if (!userElement) {
        userElement = document.createElement('div');
        userElement.classList.add('user-item');
        userElement.setAttribute('data-jid', user.jid);
        const roleIcon = this.roleIcons[user.role];

        const avatarContainer = document.createElement('span');
        avatarContainer.className = 'avatar-container';
        this.setUserAvatar(avatarContainer, user, userId, cleanLogin);

        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
        <span class="username" style="color: ${user.usernameColor}" data-user-id="${user.jid}">${cleanLogin}</span>
        <span class="role ${user.role}">${roleIcon}</span>
      `;

        const roleEl = userInfo.querySelector('.role');
        this.updateRoleTooltip(roleEl, user.role);

        userElement.appendChild(avatarContainer);
        userElement.appendChild(userInfo);
      } else {
        // Update existing element if necessary
        if (!userElement.querySelector('.avatar-container')) {
          const avatarContainer = document.createElement('span');
          avatarContainer.className = 'avatar-container';
          this.setUserAvatar(avatarContainer, user, userId, cleanLogin);
          userElement.insertBefore(avatarContainer, userElement.firstChild);
        }

        existingElements.delete(user.jid);

        const roleElement = userElement.querySelector('.role');
        const newRoleIcon = this.roleIcons[user.role];
        if (roleElement && roleElement.textContent !== newRoleIcon) {
          roleElement.textContent = newRoleIcon;
          if (!roleElement.classList.contains(user.role)) {
            roleElement.className = `role ${user.role}`;
            this.updateRoleTooltip(roleElement, user.role);
          }
        }

        const usernameElement = userElement.querySelector('.username');
        if (usernameElement && usernameElement.style.color !== user.usernameColor) {
          usernameElement.style.color = user.usernameColor;
        }
      }

      // Update game indicator
      this.updateGameIndicator(userElement, user);

      // Add or remove the "separation" class based on the index
      userElement.classList.toggle('separation', index === separationIndex);

      // Append the user element to the fragment
      fragment.appendChild(userElement);
    });

    // Clear the container and append the new fragment
    this.container.innerHTML = '';
    this.container.appendChild(fragment);

    // Remove elements for users no longer active
    existingElements.forEach((el) => {
      if (el && el.parentNode) {
        el.remove();
      }
    });

    // Apply shake effect for new users
    if (!this.isFirstLoad) {
      this.pendingUserJIDs.forEach(jid => {
        const userElement = this.container.querySelector(`.user-item[data-jid="${jid}"]`);
        if (userElement && userElement.parentNode) {
          addShakeEffect(userElement);
        }
      });
    }

    if (this.isFirstLoad) {
      this.isFirstLoad = false;
    }
  }

  setUserAvatar(avatarContainer, user, userId, cleanLogin) {
    const cachedAvatarInfo = this.avatarCache[userId];

    // Display avatar based on available information
    if (user.avatar) {
      const avatarUrl = cachedAvatarInfo?.avatarUrl || `${BASE_URL}/storage/avatars/${userId}_big.png?${generateRandomParam()}`;
      const avatarImg = document.createElement('img');
      avatarImg.className = 'user-avatar image-avatar';
      avatarImg.src = avatarUrl;
      avatarImg.alt = `${cleanLogin}'s avatar`;

      // Handle error by replacing with emoji
      avatarImg.addEventListener('error', () => {
        const fallbackEmoji = cachedAvatarInfo?.emoji || getRandomEmojiAvatar();
        avatarContainer.innerHTML = '';
        const fallbackSpan = document.createElement('span');
        fallbackSpan.className = 'user-avatar svg-avatar';
        fallbackSpan.textContent = fallbackEmoji;
        avatarContainer.appendChild(fallbackSpan);

        // Update cache using helper
        this.updateAvatarCache(userId, false, fallbackEmoji, cleanLogin);
      });

      // On successful load, update cache only if not already set
      avatarImg.addEventListener('load', () => {
        this.updateAvatarCache(userId, true, avatarUrl, cleanLogin);
      });

      avatarContainer.appendChild(avatarImg);

    } else if (cachedAvatarInfo) {
      // Use cached information
      if (cachedAvatarInfo.hasAvatar) {
        const avatarImg = document.createElement('img');
        avatarImg.className = 'user-avatar image-avatar';
        avatarImg.src = cachedAvatarInfo.avatarUrl;
        avatarImg.alt = `${cleanLogin}'s avatar`;

        // Handle error if cache is incorrect
        avatarImg.addEventListener('error', () => {
          const fallbackEmoji = getRandomEmojiAvatar();
          avatarContainer.innerHTML = '';
          const fallbackSpan = document.createElement('span');
          fallbackSpan.className = 'user-avatar svg-avatar';
          fallbackSpan.textContent = fallbackEmoji;
          avatarContainer.appendChild(fallbackSpan);

          // Update cache using helper
          this.updateAvatarCache(userId, false, fallbackEmoji, cleanLogin);
        });

        avatarContainer.appendChild(avatarImg);
      } else {
        // Use cached emoji
        const fallbackSpan = document.createElement('span');
        fallbackSpan.className = 'user-avatar svg-avatar';
        fallbackSpan.textContent = cachedAvatarInfo.emoji;
        avatarContainer.appendChild(fallbackSpan);
      }
    } else {
      // No cached info - try to fetch avatar
      const avatarUrl = `${BASE_URL}/storage/avatars/${userId}_big.png?${generateRandomParam()}`;
      const avatarImg = document.createElement('img');
      avatarImg.className = 'user-avatar image-avatar';
      avatarImg.src = avatarUrl;
      avatarImg.alt = `${cleanLogin}'s avatar`;

      // Handle error
      avatarImg.addEventListener('error', () => {
        const fallbackEmoji = getRandomEmojiAvatar();
        avatarContainer.innerHTML = '';
        const fallbackSpan = document.createElement('span');
        fallbackSpan.className = 'user-avatar svg-avatar';
        fallbackSpan.textContent = fallbackEmoji;
        avatarContainer.appendChild(fallbackSpan);

        // Update cache using helper
        this.updateAvatarCache(userId, false, fallbackEmoji, cleanLogin);
      });

      // On successful load, cache positive result
      avatarImg.addEventListener('load', () => {
        this.updateAvatarCache(userId, true, avatarUrl, cleanLogin);
      });

      avatarContainer.appendChild(avatarImg);
    }
  }

  updateGameIndicator(userElement, user) {
    const userInfoContainer = userElement.querySelector('.user-info');
    let gameIndicator = userElement.querySelector('.game-indicator');
    const userId = extractUserId(user.jid || user.login || '');

    // Get current stats
    const stats = this.raceStats.get(userId) || { count: 0, lastGameId: null };

    function setAttributes(indicator, gameId, raceCount) {
      indicator.setAttribute('data-game-id', gameId);
      createCustomTooltip(indicator, {
        en: `[Game ID] ${gameId} [Races] ${raceCount}`,
        ru: `[Игра] ${gameId} [Заездов] ${raceCount}`
      });
    }

    if (user.gameId) { // Only show indicator if gameId received by presence 
      if (!gameIndicator) { // Create if it doesn't exist
        gameIndicator = document.createElement('span');
        gameIndicator.className = 'game-indicator';
        const trafficIcon = document.createElement('span');
        trafficIcon.className = 'traffic-icon';
        trafficIcon.textContent = '🚦';
        const gamesCount = document.createElement('span');
        gamesCount.className = 'games-count';
        gamesCount.textContent = stats.count;
        gameIndicator.append(trafficIcon, gamesCount);
        userInfoContainer.appendChild(gameIndicator);
      } else { // Update existing indicator
        const gamesCountSpan = gameIndicator.querySelector('.games-count');
        if (gamesCountSpan) {
          gamesCountSpan.textContent = stats.count;
        }
      }
      setAttributes(gameIndicator, user.gameId, stats.count);
    } else if (gameIndicator) { // Remove indicator if no gameId received by presence
      gameIndicator.remove();
    }
  }

  async requestFullRoster() {
    console.log("📑 Would request full roster here (using existing data for now)");
    this.updateUI();
  }
}