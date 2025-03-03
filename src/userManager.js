import { BASE_URL } from "./definitions";
import { colorHelpers, getRandomEmojiAvatar, parseUsername } from "./helpers";

export default class UserManager {
  constructor(containerId = 'user-list') {
    this.container = document.getElementById(containerId);
    this.activeUsers = new Map();
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
    // Array to keep track of newly created users (their unique IDs)
    const newUserJIDs = [];

    for (let i = 0; i < presences.length; i++) {
      const presence = presences[i];
      const from = presence.getAttribute('from');
      const type = presence.getAttribute('type');
      if (type === 'unavailable') {
        if (this.activeUsers.has(from)) {
          console.log(`🚪 User left: ${this.activeUsers.get(from).login || from}`);
          this.activeUsers.delete(from);
          changes = true;
        }
        continue;
      }
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
      const loginRaw = userNode.getElementsByTagName("login")[0]?.textContent || 'Anonymous';
      const login = parseUsername(loginRaw);
      const avatar = userNode.getElementsByTagName("avatar")[0]?.textContent;
      const background = userNode.getElementsByTagName("background")[0]?.textContent || '#777';
      const gameNode = xData.getElementsByTagName("game_id")[0];
      const game = gameNode ? gameNode.textContent : null;
      const role = presence.getElementsByTagName("item")[0]?.getAttribute("role") || 'participant';

      // Generate a consistent color for this username
      const usernameColor = colorHelpers.getUsernameColor(login);

      const user = { jid: from, login, avatar, color: background, role, game, usernameColor };
      const existingUser = this.activeUsers.get(from);
      // Only treat it as a "join" if the user was not already present
      if (!existingUser) {
        console.log(`👤 User joined: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
        newUserJIDs.push(from);
      } else if (JSON.stringify(existingUser) !== JSON.stringify(user)) {
        console.log(`👤 User updated: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
        // For updates we aren’t adding the shake effect
      }
    }
    if (changes) {
      console.log(`📋 Current active users: ${this.activeUsers.size}`);
      this.updateUI(newUserJIDs);
    }
  }

  async requestFullRoster() {
    console.log("📑 Would request full roster here (using existing data for now)");
    this.updateUI();
  }

  // Accept an optional parameter (array of new user JIDs) so we only shake those items
  updateUI(newUserJIDs = []) {
    console.log(`🖥️ Updating UI with ${this.activeUsers.size} users`);
    this.container.innerHTML = Array.from(this.activeUsers.values())
      .map(user => {
        const cleanLogin = parseUsername(user.login);
        const avatarHTML = user.avatar
          ? `<img class="user-avatar image-avatar" src="${BASE_URL}${user.avatar.replace('.png', '_big.png')}" alt="${cleanLogin}'s avatar">`
          : `<span class="user-avatar svg-avatar">${getRandomEmojiAvatar()}</span>`;
        // Add a data attribute for identifying the user item later
        return `
          <div class="user-item" data-jid="${user.jid}" style="color: ${user.color}">
            ${avatarHTML}
            <div class="user-info">
              <div class="username" style="color: ${user.usernameColor}">${cleanLogin}</div>
            </div>
          </div>
        `;
      }).join('');
  }
}
