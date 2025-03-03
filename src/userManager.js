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
      const login = userNode.getElementsByTagName("login")[0]?.textContent || 'Anonymous';
      const avatar = userNode.getElementsByTagName("avatar")[0]?.textContent;
      const background = userNode.getElementsByTagName("background")[0]?.textContent || '#777';
      const gameNode = xData.getElementsByTagName("game_id")[0];
      const game = gameNode ? gameNode.textContent : null;
      const role = presence.getElementsByTagName("item")[0]?.getAttribute("role") || 'participant';
      const user = { jid: from, login, avatar, color: background, role, game };
      const existingUser = this.activeUsers.get(from);
      if (!existingUser || JSON.stringify(existingUser) !== JSON.stringify(user)) {
        console.log(`👤 User ${existingUser ? 'updated' : 'joined'}: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
      }
    }
    if (changes) {
      console.log(`📋 Current active users: ${this.activeUsers.size}`);
      this.updateUI();
    }
  }

  async requestFullRoster() {
    console.log("📑 Would request full roster here (using existing data for now)");
    this.updateUI();
  }

  updateUI() {
    console.log(`🖥️ Updating UI with ${this.activeUsers.size} users`);
    // Example: Simply list the user logins.
    this.container.innerHTML = Array.from(this.activeUsers.values())
      .map(user => `<div class="user" style="color: ${user.color}">${user.login}</div>`)
      .join('');
  }
}
