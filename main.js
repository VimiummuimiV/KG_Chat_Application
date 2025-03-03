import {
  delay,
  username,
  password,
  emojiFaces,
  BASE_URL,
  GAME_URL,
  XMPP_BIND_URL
} from "./src/definitions"; // definitions

// Variable to store the last selected emoji
let lastEmojiAvatar = null;

// Helper function to get a random emoji avatar
function getRandomEmojiAvatar() {
  let newEmoji;
  do {
    newEmoji = emojiFaces[Math.floor(Math.random() * emojiFaces.length)];
  } while (newEmoji === lastEmojiAvatar);

  lastEmojiAvatar = newEmoji;
  return newEmoji;
}

// Helper function to get role priority for sorting
function getRolePriority(role) {
  switch (role.toLowerCase()) {
    case 'moderator': return 1;
    case 'participant': return 2;
    case 'visitor': return 3;
    default: return 4;
  }
}

// Function to create user list UI
function createUserListUI(users) {
  // Sort users by role priority
  const sortedUsers = [...users].sort((a, b) => {
    return getRolePriority(a.role) - getRolePriority(b.role);
  });

  return sortedUsers.map(user => {
    const avatarElement = user.avatar
      ? `<img class="user-avatar image-avatar" src="${BASE_URL}${user.avatar.replace('.png', '_big.png')}" alt="${user.login}'s avatar">`
      : `<span class="user-avatar svg-avatar">${getRandomEmojiAvatar()}</span>`;

    // Create game link if user is in a game
    const gameInfo = user.game ?
      ` | Game: <a href="${GAME_URL}${user.game}" class="game-link" target="_blank">${user.game} 🎮</a>` :
      '';

    // Get the appropriate CSS class for the role
    const roleClass = `role-${user.role.toLowerCase()}`;

    return `
      <div class="user-item">
        ${avatarElement}
        <div class="user-info">
          <div>${user.login}</div>
          <div class="user-meta">Role: <span class="${roleClass}">${user.role}</span>${gameInfo}</div>
        </div>
      </div>
    `;
  }).join('');
}

// USER MANAGER (with complete refresh approach)
class UserManager {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'user-list';
    document.body.appendChild(this.container);
    this.activeUsers = new Map(); // Store currently active users
  }

  updatePresence(xmlResponse) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResponse, "text/xml");
    const presences = doc.getElementsByTagName("presence");

    // Request a full roster if we received the initial room join
    if (xmlResponse.includes('<presence id="pres_1"')) {
      console.log("🔄 Initial room join detected, requesting full roster");
      this.requestFullRoster();
      return;
    }

    // Process presence stanzas to update our user list
    let changes = false;
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

      // Handle user joining or updating
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

      // Extract user data
      const login = userNode.getElementsByTagName("login")[0]?.textContent || 'Anonymous';
      const avatar = userNode.getElementsByTagName("avatar")[0]?.textContent;
      const background = userNode.getElementsByTagName("background")[0]?.textContent || '#777';
      const gameNode = xData.getElementsByTagName("game_id")[0];
      const game = gameNode ? gameNode.textContent : null;
      const role = presence.getElementsByTagName("item")[0]?.getAttribute("role") || 'participant';

      const user = {
        jid: from,
        login,
        avatar,
        color: background,
        role,
        game
      };

      const existingUser = this.activeUsers.get(from);
      if (!existingUser || JSON.stringify(existingUser) !== JSON.stringify(user)) {
        console.log(`👤 User ${existingUser ? 'updated' : 'joined'}: ${login}`);
        this.activeUsers.set(from, user);
        changes = true;
      }
    }

    // Update UI only if there were changes
    if (changes) {
      console.log(`📋 Current active users: ${this.activeUsers.size}`);
      this.updateUI();
    }
  }

  async requestFullRoster() {
    // This method would be implemented to request a full roster from the server
    // For now, we'll just use the users we know about
    console.log("📑 Would request full roster here (using existing data for now)");
    this.updateUI();
  }

  updateUI() {
    console.log(`🖥️ Updating UI with ${this.activeUsers.size} users`);
    // Use the separate function to create the user list UI
    this.container.innerHTML = createUserListUI(Array.from(this.activeUsers.values()));
  }
}

// MAIN CLIENT
const xmppClient = {
  userManager: new UserManager(),
  sid: null,
  rid: Math.floor(Date.now() / 1000),

  async connect() {
    try {
      // Step 1: Initial connection
      console.log('🌐 Step 1: Connecting to XMPP server...');
      const initResponse = await this.sendRequestWithRetry(
        `<body xmlns='http://jabber.org/protocol/httpbind'
               rid='${this.nextRid()}'
               to='jabber.klavogonki.ru'
               xml:lang='en'
               wait='60'
               hold='1'
               ver='1.6'
               xmpp:version='1.0'
               xmlns:xmpp='urn:xmpp:xbosh'/>`
      );
      this.sid = initResponse.match(/sid='(.*?)'/)[1];
      console.log(`🔑 Step 2: Session ID received: ${this.sid}`);
      await this.sleep(delay / 3);

      // Step 2: Authentication
      console.log('🔐 Step 3: Authenticating...');
      const authString = this.base64Encode('\x00' + username + '\x00' + password);
      const authResponse = await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='PLAIN'>${authString}</auth>
        </body>`
      );
      if (!authResponse.includes('<success')) {
        throw new Error('🚫 Authentication failed');
      }
      console.log('✅ Step 4: Authentication successful!');
      await this.sleep(delay / 3);

      // Step 3: Restart stream
      console.log('🔄 Step 5: Restarting stream...');
      await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'
               to='jabber.klavogonki.ru'
               xmpp:restart='true'
               xmlns:xmpp='urn:xmpp:xbosh'/>`
      );
      await this.sleep(delay / 3);

      // Step 4: Resource binding
      console.log('📦 Step 6: Binding resource...');
      await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <iq type='set' id='bind_1' xmlns='jabber:client'>
            <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'>
              <resource>web</resource>
            </bind>
          </iq>
        </body>`
      );
      await this.sleep(delay / 3);

      // Step 5: Initialize session
      console.log('🔌 Step 7: Establishing session...');
      await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <iq type='set' id='session_1' xmlns='jabber:client'>
            <session xmlns='urn:ietf:params:xml:ns:xmpp-session'/>
          </iq>
        </body>`
      );
      await this.sleep(delay / 3);

      // Step 6: Join chat room with correct room and nickname
      console.log('💬 Step 8: Joining chat room...');
      const joinResponse = await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <presence id='pres_1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru/${username}'>
            <x xmlns='http://jabber.org/protocol/muc'/>
          </presence>
        </body>`
      );
      console.log('📥 Join response:', joinResponse);
      this.userManager.updatePresence(joinResponse);
      await this.sleep(delay / 3);

      // Step 7: Request room information 
      console.log('📋 Step 9: Requesting room information...');
      await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <iq type='get' id='info1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru'>
            <query xmlns='http://jabber.org/protocol/disco#info'/>
          </iq>
        </body>`
      );
      await this.sleep(delay);

      // Start presence polling
      this.startPresencePolling();
      console.log('🚀 Step 10: Connected! Starting presence updates...');
    } catch (error) {
      console.error(`💥 Error: ${error.message}`);
    }
  },

  base64Encode(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return btoa(String.fromCharCode(...data));
  },

  nextRid() {
    this.rid++;
    return this.rid;
  },

  async sendRequest(payload) {
    const response = await fetch(XMPP_BIND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      },
      body: payload
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
    }
    return await response.text();
  },

  async sendRequestWithRetry(payload, maxRetries = 5) {
    let lastError;
    let baseWaitTime = delay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendRequest(payload);
      } catch (error) {
        lastError = error;

        // If we hit a rate limit
        if (error.message.includes('429')) {
          const waitTime = baseWaitTime * Math.pow(2, attempt); // Exponential backoff
          console.log(`⏱️ Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms before retry...`);
          await this.sleep(waitTime);
        } else {
          // If it's not a rate limit error, rethrow immediately
          throw error;
        }
      }
    }
    throw new Error(`Max retries reached. Last error: ${lastError.message}`);
  },

  startPresencePolling() {
    setInterval(async () => {
      const xmlResponse = await this.sendRequestWithRetry(
        `<body rid='${this.nextRid()}' sid='${this.sid}' xmlns='http://jabber.org/protocol/httpbind'/>
        `
      );
      this.userManager.updatePresence(xmlResponse);
    }, 2000); // Poll every 2 seconds
  },

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

xmppClient.connect(); // Start the connection process
