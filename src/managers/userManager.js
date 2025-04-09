import { BASE_URL, FALLBACK_COLOR } from "../data/definitions.js";

import {
  getRandomEmojiAvatar,
  extractUsername,
  extractUserId,
  handlePrivateMessageInput
} from "../helpers/helpers.js";

import { addShakeEffect } from "../data/animations.js";
import { usernameColors } from "../helpers/chatUsernameColors.js";

// Utility function to generate a dynamic timestamp for the rand parameter
const generateRandomParam = () => `rand=${Date.now()}`;

export default class UserManager {
  constructor(containerId = 'user-list') {
    this.container = document.getElementById(containerId);
    this.activeUsers = new Map();
    this.isFirstLoad = true;
    this.avatarCache = this.loadAvatarCache();
    this.cacheDate = new Date().toDateString();
    this.changes = false;
    this.newUserJIDs = [];
    this.updatedUserJIDs = [];

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
          console.log("🗃️ Avatar cache expired (new day), creating fresh cache");
          return {};
        }
      }
    } catch (error) {
      console.error("Error loading avatar cache:", error);
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
      console.error("Error saving avatar cache:", error);
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

  setupEventListeners() {
    this.container.addEventListener('click', (event) => {
      // Handle username clicks
      if (event.target.classList.contains('username-clickable')) {
        const dataUserId = event.target.getAttribute('data-user-id');
        if (dataUserId) {
          if (event.ctrlKey) {
            // Ctrl+Click: Start private chat with user
            const username = event.target.textContent.trim();
            const messageInput = document.getElementById('message-input');
            messageInput.value = `/pm ${username} `;
            handlePrivateMessageInput(messageInput);
            messageInput.focus();
          } else {
            // Normal click: Navigate to profile
            const userIdValue = dataUserId.split('/')[1].split('#')[0];
            const navigateToProfileUrl = `https://klavogonki.ru/u/#/${userIdValue}/`;
            window.location.href = navigateToProfileUrl;
          }
        }
      }

      // Handle game indicator clicks
      if (event.target.closest('.game-indicator')) {
        const gameIndicator = event.target.closest('.game-indicator');
        const gameId = gameIndicator.getAttribute('data-game-id');
        if (gameId) {
          event.stopPropagation();
          window.location.href = `https://klavogonki.ru/g/?gmid=${gameId}`;
        }
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
    this.newUserJIDs = [];
    this.updatedUserJIDs = [];

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

      // Determine if user is new or updated
      if (!this.activeUsers.has(from)) {
        if (!this.isFirstLoad) {
          // console.log(`👤 User joined: ${cleanLogin} ID: (${userId})`);
        }
        this.activeUsers.set(from, userData);
        this.changes = true;
        this.newUserJIDs.push(from);
      } else if (JSON.stringify(existingUser) !== JSON.stringify(userData)) {
        this.activeUsers.set(from, userData);
        this.changes = true;
        this.updatedUserJIDs.push(from);
      }
    }

    if (this.changes) {
      this.updateUI();
    }
  }

  updateUI() {
    // Build map of existing DOM elements
    const existingElements = new Map();
    this.container.querySelectorAll('.user-item').forEach(el => {
      existingElements.set(el.getAttribute('data-jid'), el);
    });

    // Sort users by role and username
    const sortedUsers = Array.from(this.activeUsers.values()).sort((a, b) => {
      const priorityDiff = this.rolePriority[a.role] - this.rolePriority[b.role];
      return priorityDiff !== 0 ? priorityDiff :
        extractUsername(a.login).localeCompare(extractUsername(b.login));
    });

    // Build the updated list
    const fragment = document.createDocumentFragment();
    sortedUsers.forEach(user => {
      let userElement = existingElements.get(user.jid);
      const userId = extractUserId(user.jid);
      const cleanLogin = extractUsername(user.login);

      // If element doesn't exist, create it
      if (!userElement) {
        userElement = document.createElement('div');
        userElement.classList.add('user-item');
        userElement.setAttribute('data-jid', user.jid);
        const roleIcon = this.roleIcons[user.role];

        const avatarContainer = document.createElement('span');
        avatarContainer.className = 'avatar-container';
        this.setUserAvatar(avatarContainer, user, userId, cleanLogin);

        // Create user info container
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
          <div class="username" style="color: ${user.usernameColor}">
            <span class="username-clickable" data-user-id="${user.jid}">${cleanLogin}</span>
            <span class="role ${user.role}">${roleIcon}</span>
          </div>
        `;

        // Append avatar and user info
        userElement.appendChild(avatarContainer);
        userElement.appendChild(userInfo);
      } else {
        // Update existing element if needed
        if (!userElement.querySelector('.avatar-container')) {
          const avatarContainer = document.createElement('span');
          avatarContainer.className = 'avatar-container';
          this.setUserAvatar(avatarContainer, user, userId, cleanLogin);
          userElement.insertBefore(avatarContainer, userElement.firstChild);
        }

        // Remove from map so remaining elements are those to be removed
        existingElements.delete(user.jid);

        // Update role icon if changed
        const roleElement = userElement.querySelector('.role');
        const newRoleIcon = this.roleIcons[user.role];
        if (roleElement && roleElement.textContent !== newRoleIcon) {
          roleElement.textContent = newRoleIcon;
          if (!roleElement.classList.contains(user.role)) {
            roleElement.className = `role ${user.role}`;
          }
        }

        // Update username color if needed
        const usernameElement = userElement.querySelector('.username');
        if (usernameElement && usernameElement.style.color !== user.usernameColor) {
          usernameElement.style.color = user.usernameColor;
        }
      }

      // Handle game indicator
      this.updateGameIndicator(userElement, user);

      // Append to fragment
      fragment.appendChild(userElement);
    });

    // Clear container and append fragment
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
      this.newUserJIDs.forEach(jid => {
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
    let gameIndicatorElement = userElement.querySelector('.game-indicator');

    if (user.gameId) {
      if (!gameIndicatorElement || gameIndicatorElement.getAttribute('data-game-id') !== user.gameId) {
        const newIndicatorHTML = `<span class="game-indicator" title="${user.gameId}" data-game-id="${user.gameId}">
                                    <span class="traffic-icon">🚦</span>
                                  </span>`;
        if (gameIndicatorElement) {
          gameIndicatorElement.outerHTML = newIndicatorHTML;
        } else {
          const usernameContainer = userElement.querySelector('.username');
          usernameContainer.insertAdjacentHTML('beforeend', newIndicatorHTML);
        }
      }
    } else if (gameIndicatorElement && gameIndicatorElement.parentNode) {
      gameIndicatorElement.remove();
    }
  }

  async requestFullRoster() {
    console.log("📑 Would request full roster here (using existing data for now)");
    this.updateUI();
  }
}