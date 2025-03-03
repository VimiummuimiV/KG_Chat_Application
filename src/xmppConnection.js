export default class XMPPConnection {
  constructor({ username, password, bindUrl, delay = 1000 }) {
    this.username = username;
    this.password = password;
    this.bindUrl = bindUrl;
    this.delay = delay;
    this.sid = null;
    this.rid = Math.floor(Date.now() / 1000);
  }

  nextRid() {
    return ++this.rid;
  }

  async sendRequest(payload) {
    const response = await fetch(this.bindUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0'
      },
      body: payload
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  }

  async sendRequestWithRetry(payload, maxRetries = 5) {
    let lastError;
    let baseWaitTime = this.delay;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendRequest(payload);
      } catch (error) {
        lastError = error;
        if (error.message.includes('429')) {
          const waitTime = baseWaitTime * Math.pow(2, attempt);
          console.log(`⏱️ Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms...`);
          await this.sleep(waitTime);
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Max retries reached. Last error: ${lastError.message}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  base64Encode(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return btoa(String.fromCharCode(...data));
  }

  async connect() {
    console.log('🌐 Step 1: Connecting to XMPP server...');
    const initPayload = `<body xmlns='http://jabber.org/protocol/httpbind'
               rid='${this.nextRid()}'
               to='jabber.klavogonki.ru'
               xml:lang='en'
               wait='60'
               hold='1'
               ver='1.6'
               xmpp:version='1.0'
               xmlns:xmpp='urn:xmpp:xbosh'/>`;
    const initResponse = await this.sendRequestWithRetry(initPayload);
    this.sid = initResponse.match(/sid=['"]([^'"]+)['"]/)[1];
    console.log(`🔑 Step 2: Session ID received: ${this.sid}`);
    await this.sleep(this.delay / 8);
    console.log('🔐 Step 3: Authenticating...');
    const authString = this.base64Encode('\x00' + this.username + '\x00' + this.password);
    const authPayload = `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='PLAIN'>${authString}</auth>
        </body>`;
    const authResponse = await this.sendRequestWithRetry(authPayload);
    if (!authResponse.includes('<success')) {
      throw new Error('🚫 Authentication failed');
    }
    console.log('✅ Step 4: Authentication successful!');
    await this.sleep(this.delay / 8);
    console.log('🔄 Step 5: Restarting stream...');
    const restartPayload = `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'
               to='jabber.klavogonki.ru'
               xmpp:restart='true'
               xmlns:xmpp='urn:xmpp:xbosh'/>`;
    await this.sendRequestWithRetry(restartPayload);
    await this.sleep(this.delay / 8);
    console.log('📦 Step 6: Binding resource...');
    const bindPayload = `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <iq type='set' id='bind_1' xmlns='jabber:client'>
            <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'>
              <resource>web</resource>
            </bind>
          </iq>
        </body>`;
    await this.sendRequestWithRetry(bindPayload);
    await this.sleep(this.delay / 8);
    console.log('🔌 Step 7: Establishing session...');
    const sessionPayload = `<body rid='${this.nextRid()}' sid='${this.sid}'
               xmlns='http://jabber.org/protocol/httpbind'>
          <iq type='set' id='session_1' xmlns='jabber:client'>
            <session xmlns='urn:ietf:params:xml:ns:xmpp-session'/>
          </iq>
        </body>`;
    await this.sendRequestWithRetry(sessionPayload);
    await this.sleep(this.delay / 8);
    // Return session details for further use.
    return { sid: this.sid, rid: this.rid };
  }
}
