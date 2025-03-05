import { BASE_URL } from "./definitions";
import { usernameColors, getRandomEmojiAvatar, parseUsername } from "./helpers";

export default class UserManager {
  constructor(containerId = 'user-list') {
    this.container = document.getElementById(containerId);
    this.activeUsers = new Map();

    // Define role-based icons/emojis for each user role:
    this.roleIcons = {
      'visitor': '🐥', // Baby chick icon representing a visitor role
      'participant': '🗿', // Generic person icon representing a participant role
      'moderator': '⚔️️' // Crossed swords icon representing a moderator role
    };

    // Define role priority for sorting
    this.rolePriority = {
      'moderator': 1,
      'participant': 2,
      'visitor': 3
    };
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

      // Find user data
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

      // Check for moderator status
      const moderatorNode = userNode.getElementsByTagName("moderator")[0];
      const isModerator = moderatorNode && moderatorNode.textContent === '1';

      // Determine role from XML
      const itemNode = presence.getElementsByTagName("item")[0];
      let role = itemNode?.getAttribute("role") || 'participant';

      // Override role if moderator flag is set
      if (isModerator) {
        role = 'moderator';
      }

      // Generate a consistent color for this username
      const usernameColor = usernameColors.getColor(login);

      const user = {
        jid: from,
        login,
        avatar,
        color: background,
        role,
        usernameColor
      };

      const existingUser = this.activeUsers.get(from);

      // Check if user is new or updated
      if (!existingUser) {
        console.log(`👤 User joined: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
        newUserJIDs.push(from);
      } else if (JSON.stringify(existingUser) !== JSON.stringify(user)) {
        console.log(`👤 User updated: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
      }
    }

    if (changes) {
      console.log(`📋 Current active users: ${this.activeUsers.size}`);
      this.updateUI(newUserJIDs);
    }
  }

  updateUI(newUserJIDs = []) {
    console.log(`🖥️ Updating UI with ${this.activeUsers.size} users`);
    
    // Sort users with moderators at the top and visitors at the bottom
    const sortedUsers = Array.from(this.activeUsers.values()).sort((a, b) => {
      // First, sort by role priority
      const priorityDiff = this.rolePriority[a.role] - this.rolePriority[b.role];
      if (priorityDiff !== 0) return priorityDiff;
      
      // For users with the same role, sort alphabetically by username
      return a.login.localeCompare(b.login);
    });

    this.container.innerHTML = sortedUsers
      .map(user => {
        const cleanLogin = parseUsername(user.login);

        // Determine icon based on role
        const roleIcon = this.roleIcons[user.role] || '👤';

        // Handle avatar
        let avatarHTML;
        if (user.avatar) {
          try {
            const avatarUrl = `${BASE_URL}${user.avatar.replace('.png', '_big.png')}`;
            avatarHTML = `<img class="user-avatar image-avatar" src="${avatarUrl}" alt="${cleanLogin}'s avatar" onerror="this.onerror=null; this.classList.add('fallback-avatar'); this.innerHTML='${getRandomEmojiAvatar()}'">`;
          } catch (error) {
            console.error(`Error loading avatar for ${cleanLogin}:`, error);
            avatarHTML = `<span class="user-avatar svg-avatar">${getRandomEmojiAvatar()}</span>`;
          }
        } else {
          avatarHTML = `<span class="user-avatar svg-avatar">${getRandomEmojiAvatar()}</span>`;
        }

        return `
          <div class="user-item" data-jid="${user.jid}" style="color: ${user.color}">
            ${avatarHTML}
            <div class="user-info">
              <div class="username" style="color: ${user.usernameColor}">
                ${cleanLogin} ${roleIcon}
              </div>
            </div>
          </div>
        `;
      }).join('');
  }

  async requestFullRoster() {
    console.log("📑 Would request full roster here (using existing data for now)");
    this.updateUI();
  }
}