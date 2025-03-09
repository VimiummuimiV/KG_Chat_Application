import { BASE_URL } from "./definitions";
import { usernameColors, getRandomEmojiAvatar, parseUsername } from "./helpers";
import { addShakeEffect } from "./animations";

export default class UserManager {
  constructor(containerId = 'user-list') {
    this.container = document.getElementById(containerId);
    this.activeUsers = new Map();
    this.isFirstLoad = true;  // Flag to track first page load

    // Define role-based icons/emojis for each user role:
    this.roleIcons = {
      'visitor': '🐥',       // Visitor role icon
      'participant': '🗿',   // Participant role icon
      'moderator': '⚔️️'     // Moderator role icon
    };

    // Define role priority for sorting:
    // Moderators (1) at the top, participants (2) in the middle, visitors (3) at the bottom.
    this.rolePriority = {
      'moderator': 1,
      'participant': 2,
      'visitor': 3
    };

    // Attach event listeners using delegation - only once in constructor
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Use event delegation for both username and game indicator clicks
    this.container.addEventListener('click', (event) => {
      // Handle username clicks
      if (event.target.classList.contains('username-clickable')) {
        const userId = event.target.getAttribute('data-user-id');
        if (userId) {
          const userIdWithoutDomain = userId.split('/')[1].split('#')[0];
          window.location.href = `https://klavogonki.ru/u/#/${userIdWithoutDomain}/`;
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

  updatePresence(xmlResponse) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const presences = doc.getElementsByTagName("presence");

    if (xmlResponse.includes('<presence id="pres_1"')) {
      console.log("🔄 Initial room join detected, requesting full roster");
      this.requestFullRoster();
      return;
    }

    let changes = false;
    const newUserJIDs = [];
    const updatedUserJIDs = [];

    for (let i = 0; i < presences.length; i++) {
      const presence = presences[i];
      const from = presence.getAttribute('from');
      const type = presence.getAttribute('type');

      // Skip if not from the conference room
      if (!from || !from.includes('general@conference.jabber.klavogonki.ru/')) {
        continue;
      }

      // Extract username from JID (everything after the last slash)
      const usernameFromJid = from.split('/').pop();
      if (!usernameFromJid) continue;

      // Skip processing for Клавобот/клавобот
      if (usernameFromJid === 'Клавобот' || usernameFromJid === 'клавобот' ||
        from.includes('#Клавобот') || from.includes('#клавобот')) {
        continue;
      }

      // Handle user leaving
      if (type === 'unavailable') {
        if (this.activeUsers.has(from)) {
          if (this.isFirstLoad) {
            console.log(`🚪 User left: ${this.activeUsers.get(from).login || from}`);
          }
          this.activeUsers.delete(from);
          changes = true;
        }
        continue;
      }

      const existingUser = this.activeUsers.get(from) || {};

      // Initialize userData (with color properties) without setting the avatar here
      let userData = {
        jid: from,
        login: usernameFromJid,
        color: '#777',
        usernameColor: usernameColors.getColor(usernameFromJid),
        role: 'participant',
        gameId: null,
        avatar: null
      };

      // Process all x elements to find relevant data
      const xElements = presence.getElementsByTagName("x");
      let foundAvatar = false; // Flag to track if we found an avatar in this update

      for (let j = 0; j < xElements.length; j++) {
        const xmlns = xElements[j].getAttribute("xmlns");
        if (xmlns === "klavogonki:userdata") {
          const userNode = xElements[j].getElementsByTagName("user")[0];
          if (userNode) {
            const loginElement = userNode.getElementsByTagName("login")[0];
            if (loginElement && loginElement.textContent) {
              const loginText = loginElement.textContent;

              // Additional check to skip Клавобот/клавобот
              if (loginText === 'Клавобот' || loginText === 'клавобот') {
                console.log(`🚫 Skipping Клавобот from login element: ${loginText}`);
                continue;
              }

              userData.login = parseUsername(loginText);
              userData.usernameColor = usernameColors.getColor(userData.login);
            }

            // Check for avatar in the current presence update
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

          const gameIdElement = xElements[j].getElementsByTagName("game_id")[0];
          if (gameIdElement && gameIdElement.textContent) {
            userData.gameId = gameIdElement.textContent;
          }
        }

        if (xmlns === "http://jabber.org/protocol/muc#user") {
          const itemNode = xElements[j].getElementsByTagName("item")[0];
          if (itemNode) {
            const role = itemNode.getAttribute("role");
            // Only override role if not already marked as moderator
            if (role && userData.role !== 'moderator') {
              userData.role = role;
            }
          }
        }
      }

      // If we didn't find an avatar in this update but have one stored, keep the existing one
      if (!foundAvatar && existingUser && existingUser.avatar) {
        userData.avatar = existingUser.avatar;
      }

      // Special handling for users with Cyrillic names like "Душа_Чата"
      if (userData.login.match(/[А-Яа-я]/) && !userData.avatar) {
        // Extract user ID from JID for avatar path construction
        const userId = from.split('/')[1].split('#')[0];
        userData.avatar = `/storage/avatars/${userId}.png`;
      }

      // Determine if the user is new or updated
      if (!this.activeUsers.has(from)) {
        if (!this.isFirstLoad) {
          console.log(`👤 User joined: ${userData.login}`);
        }
        this.activeUsers.set(from, userData);
        changes = true;
        newUserJIDs.push(from);
      } else if (JSON.stringify(existingUser) !== JSON.stringify(userData)) {
        this.activeUsers.set(from, userData);
        changes = true;
        updatedUserJIDs.push(from);
      }
    }

    if (changes) {
      this.updateUI(newUserJIDs, updatedUserJIDs);
    }
  }

  updateUI(newUserJIDs = [], updatedUserJIDs = []) {
    // Build a map of existing DOM elements by user JID
    const existingElements = new Map();
    this.container.querySelectorAll('.user-item').forEach(el => {
      existingElements.set(el.getAttribute('data-jid'), el);
    });

    // Sort users by role priority (moderators first, then participants, then visitors)
    // and alphabetically by username within each role.
    const sortedUsers = Array.from(this.activeUsers.values()).sort((a, b) => {
      const priorityDiff = this.rolePriority[a.role] - this.rolePriority[b.role];
      if (priorityDiff !== 0) return priorityDiff;
      return a.login.localeCompare(b.login);
    });

    // Use a document fragment to build the updated list
    const fragment = document.createDocumentFragment();
    sortedUsers.forEach(user => {
      let userElement = existingElements.get(user.jid);
      // If the element doesn't exist, create it
      if (!userElement) {
        userElement = document.createElement('div');
        userElement.classList.add('user-item');
        userElement.setAttribute('data-jid', user.jid);
        const cleanLogin = parseUsername(user.login);
        const roleIcon = this.roleIcons[user.role] || '👤';

        // Create avatar container element (assigned once at creation)
        const avatarContainer = document.createElement('span');
        avatarContainer.className = 'avatar-container';

        // Check if user has an avatar path defined
        if (user.avatar) {
          try {
            // Determine the avatar URL, handling Cyrillic usernames
            const isCyrillic = !!cleanLogin.match(/[А-Яа-я]/);
            let avatarUrl;
            if (isCyrillic) {
              const userId = user.jid.split('/')[1].split('#')[0];
              avatarUrl = `${BASE_URL}/storage/avatars/${userId}_big.png`;
            } else {
              avatarUrl = `${BASE_URL}${user.avatar.replace('.png', '_big.png')}`;
            }

            // Create the image element for the avatar
            const avatarImg = document.createElement('img');
            avatarImg.className = 'user-avatar image-avatar';
            avatarImg.src = avatarUrl;
            avatarImg.alt = `${cleanLogin}'s avatar`;

            // Add error handling: if the image fails to load, replace it with a fallback emoji
            avatarImg.addEventListener('error', function () {
              const fallbackEmoji = getRandomEmojiAvatar();
              avatarContainer.innerHTML = '';
              const fallbackSpan = document.createElement('span');
              fallbackSpan.className = 'user-avatar svg-avatar';
              fallbackSpan.textContent = fallbackEmoji;
              avatarContainer.appendChild(fallbackSpan);
            });

            // Append the image to the avatar container
            avatarContainer.appendChild(avatarImg);
          } catch (error) {
            console.error(`Error loading avatar for ${cleanLogin}:`, error);
            // On error, fallback to a span with the fallback emoji
            const fallbackEmoji = getRandomEmojiAvatar();
            const fallbackSpan = document.createElement('span');
            fallbackSpan.className = 'user-avatar svg-avatar';
            fallbackSpan.textContent = fallbackEmoji;
            avatarContainer.appendChild(fallbackSpan);
          }
        } else {
          // No avatar provided or avatar element not found – fallback to a span with a random emoji
          const fallbackEmoji = getRandomEmojiAvatar();
          const fallbackSpan = document.createElement('span');
          fallbackSpan.className = 'user-avatar svg-avatar';
          fallbackSpan.textContent = fallbackEmoji;
          avatarContainer.appendChild(fallbackSpan);
        }

        // Create the user info container with the color applied
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
          <div class="username" style="color: ${user.usernameColor}">
            <span class="username-clickable" data-user-id="${user.jid}">${cleanLogin}</span>
            <span class="role ${user.role}">${roleIcon}</span>
          </div>
        `;

        // Append avatar and user info to the user element
        userElement.appendChild(avatarContainer);
        userElement.appendChild(userInfo);
      } else {
        // For existing elements, do not update the avatar (it should be assigned only once)
        // But if for some reason the avatar container is missing, add it.
        if (!userElement.querySelector('.avatar-container')) {
          const cleanLogin = parseUsername(user.login);
          const avatarContainer = document.createElement('span');
          avatarContainer.className = 'avatar-container';

          if (user.avatar) {
            try {
              const isCyrillic = !!cleanLogin.match(/[А-Яа-я]/);
              let avatarUrl;
              if (isCyrillic) {
                const userId = user.jid.split('/')[1].split('#')[0];
                avatarUrl = `${BASE_URL}/storage/avatars/${userId}_big.png`;
              } else {
                avatarUrl = `${BASE_URL}${user.avatar.replace('.png', '_big.png')}`;
              }
              console.log(`(Existing) Adding missing avatar for ${cleanLogin}: ${avatarUrl}`);

              const avatarImg = document.createElement('img');
              avatarImg.className = 'user-avatar image-avatar';
              avatarImg.src = avatarUrl;
              avatarImg.alt = `${cleanLogin}'s avatar`;
              avatarImg.addEventListener('error', function () {
                console.log(`🚫 Missing avatar failed to load for ${cleanLogin}, using emoji fallback`);
                const fallbackEmoji = getRandomEmojiAvatar();
                avatarContainer.innerHTML = '';
                const fallbackSpan = document.createElement('span');
                fallbackSpan.className = 'user-avatar svg-avatar';
                fallbackSpan.textContent = fallbackEmoji;
                avatarContainer.appendChild(fallbackSpan);
              });
              avatarContainer.appendChild(avatarImg);
            } catch (error) {
              console.error(`Error adding missing avatar for ${cleanLogin}:`, error);
              // Use emoji fallback on error
              const fallbackEmoji = getRandomEmojiAvatar();
              const fallbackSpan = document.createElement('span');
              fallbackSpan.className = 'user-avatar svg-avatar';
              fallbackSpan.textContent = fallbackEmoji;
              avatarContainer.appendChild(fallbackSpan);
            }
          } else {
            // No avatar, use emoji
            console.log(`🎭 Using emoji avatar for existing ${cleanLogin} (no avatar path)`);
            const fallbackEmoji = getRandomEmojiAvatar();
            const fallbackSpan = document.createElement('span');
            fallbackSpan.className = 'user-avatar svg-avatar';
            fallbackSpan.textContent = fallbackEmoji;
            avatarContainer.appendChild(fallbackSpan);
          }

          // Prepend the avatar container if missing
          userElement.insertBefore(avatarContainer, userElement.firstChild);
        }

        // Remove from the map so that remaining elements are those to be removed later.
        existingElements.delete(user.jid);
        // Update role icon if the role has changed
        const roleElement = userElement.querySelector('.role');
        const newRoleIcon = this.roleIcons[user.role] || '👤';
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

      // Handle the game indicator update:
      // If the user is in a game (has a gameId), update or add the indicator.
      // Otherwise, remove the game indicator if it exists.
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
      } else if (gameIndicatorElement) {
        gameIndicatorElement.remove();
      }

      // Append or move the user element to the fragment
      fragment.appendChild(userElement);
    });

    // Clear the container and append the sorted fragment
    this.container.innerHTML = '';
    this.container.appendChild(fragment);

    // Remove DOM elements for users that are no longer active.
    existingElements.forEach((el, jid) => {
      el.remove();
    });

    // For new users, apply a shake effect on the whole user-item.
    if (!this.isFirstLoad) {
      newUserJIDs.forEach(jid => {
        const userElement = this.container.querySelector(`.user-item[data-jid="${jid}"]`);
        if (userElement) {
          addShakeEffect(userElement);
        }
      });
    }

    if (this.isFirstLoad) {
      this.isFirstLoad = false;
    }
  }

  async requestFullRoster() {
    console.log("📑 Would request full roster here (using existing data for now)");
    this.updateUI();
  }
}