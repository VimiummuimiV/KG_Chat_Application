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

      // Handle user leaving
      if (type === 'unavailable') {
        if (this.activeUsers.has(from)) {
          console.log(`🚪 User left: ${this.activeUsers.get(from).login || from}`);
          this.activeUsers.delete(from);
          changes = true;
        }
        continue;
      }

      // Find user data in the klavogonki:userdata namespace
      let xData = null;
      const xElements = presence.getElementsByTagName("x");
      for (let j = 0; j < xElements.length; j++) {
        if (xElements[j].namespaceURI === "klavogonki:userdata") {
          xData = xElements[j];
          break;
        }
      }

      if (!xData) {
        console.log(`⚠️ No klavogonki:userdata found for presence from: ${from}`);
        continue;
      }

      const userNode = xData.getElementsByTagName("user")[0];
      if (!userNode) {
        console.log(`⚠️ No user node found in klavogonki:userdata for presence from: ${from}`);
        continue;
      }

      // Extract user information
      const loginRaw = userNode.getElementsByTagName("login")[0]?.textContent || 'Anonymous';
      const login = parseUsername(loginRaw);
      const avatar = userNode.getElementsByTagName("avatar")[0]?.textContent;
      const background = userNode.getElementsByTagName("background")[0]?.textContent || '#777';

      // Extract game_id if available
      const gameId = xData.getElementsByTagName("game_id")[0]?.textContent || null;

      // Check for moderator status
      const moderatorNode = userNode.getElementsByTagName("moderator")[0];
      const isModerator = moderatorNode && moderatorNode.textContent === '1';

      // Determine role from XML (default to participant)
      const itemNode = presence.getElementsByTagName("item")[0];
      let role = itemNode?.getAttribute("role") || 'participant';
      if (isModerator) {
        role = 'moderator';
      }

      // Generate a consistent color for the username
      const usernameColor = usernameColors.getColor(login);

      // Create the user object including the dynamic game id
      const user = {
        jid: from,
        login,
        avatar,
        color: background,
        role,
        usernameColor,
        gameId
      };

      const existingUser = this.activeUsers.get(from);

      // Determine if the user is new or updated
      if (!existingUser) {
        console.log(`👤 User joined: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
        newUserJIDs.push(from);
      } else if (JSON.stringify(existingUser) !== JSON.stringify(user)) {
        console.log(`👤 User updated: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
        updatedUserJIDs.push(from);
      }
    }

    if (changes) {
      // console.log(`📋 Current active users: ${this.activeUsers.size}`);
      this.updateUI(newUserJIDs, updatedUserJIDs);
    }
  }

  updateUI(newUserJIDs = [], updatedUserJIDs = []) {
    // console.log(`🖥️ Updating UI with ${this.activeUsers.size} users`);

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
        let avatarHTML = '';

        if (user.avatar) {
          try {
            const avatarUrl = `${BASE_URL}${user.avatar.replace('.png', '_big.png')}`;
            avatarHTML = `<img class="user-avatar image-avatar" src="${avatarUrl}" alt="${cleanLogin}'s avatar" 
              onerror="this.onerror=null; this.classList.add('fallback-avatar'); this.innerHTML='${getRandomEmojiAvatar()}'">`;
          } catch (error) {
            console.error(`Error loading avatar for ${cleanLogin}:`, error);
            avatarHTML = `<span class="user-avatar svg-avatar">${getRandomEmojiAvatar()}</span>`;
          }
        } else {
          avatarHTML = `<span class="user-avatar svg-avatar">${getRandomEmojiAvatar()}</span>`;
        }

        // Create the static part of the user element (without the game indicator)
        userElement.innerHTML = `
          ${avatarHTML}
          <div class="user-info">
            <div class="username" style="color: ${user.usernameColor}">
              <span class="username-clickable" data-user-id="${user.jid}">${cleanLogin}</span>
              <span class="role ${user.role}">${roleIcon}</span>
            </div>
          </div>
        `;
      } else {
        // Remove from the map so that remaining elements are those to be removed later.
        existingElements.delete(user.jid);

        // Update role icon if the role has changed
        const roleElement = userElement.querySelector('.role');
        const newRoleIcon = this.roleIcons[user.role] || '👤';
        if (roleElement) {
          if (roleElement.textContent !== newRoleIcon) {
            roleElement.textContent = newRoleIcon;
          }
          // Also update the class if needed
          if (!roleElement.classList.contains(user.role)) {
            roleElement.className = `role ${user.role}`;
          }
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