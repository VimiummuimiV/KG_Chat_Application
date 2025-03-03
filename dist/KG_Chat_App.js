// ==UserScript==
// @name         KG_Chat_Application
// @namespace    klavogonki
// @version      1.0.0
// @description  Enhance the chat abilities
// @author       Patcher
// @match        *://klavogonki.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./main.js":
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _src_definitions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./src/definitions */ \"./src/definitions.js\");\n // definitions\r\n\r\n// Variable to store the last selected emoji\r\nlet lastEmojiAvatar = null;\r\n\r\n// Helper function to get a random emoji avatar\r\nfunction getRandomEmojiAvatar() {\r\n  let newEmoji;\r\n  do {\r\n    newEmoji = _src_definitions__WEBPACK_IMPORTED_MODULE_0__.emojiFaces[Math.floor(Math.random() * _src_definitions__WEBPACK_IMPORTED_MODULE_0__.emojiFaces.length)];\r\n  } while (newEmoji === lastEmojiAvatar);\r\n\r\n  lastEmojiAvatar = newEmoji;\r\n  return newEmoji;\r\n}\r\n\r\n// Helper function to get role priority for sorting\r\nfunction getRolePriority(role) {\r\n  switch (role.toLowerCase()) {\r\n    case 'moderator': return 1;\r\n    case 'participant': return 2;\r\n    case 'visitor': return 3;\r\n    default: return 4;\r\n  }\r\n}\r\n\r\n// Function to create user list UI\r\nfunction createUserListUI(users) {\r\n  // Sort users by role priority\r\n  const sortedUsers = [...users].sort((a, b) => {\r\n    return getRolePriority(a.role) - getRolePriority(b.role);\r\n  });\r\n\r\n  return sortedUsers.map(user => {\r\n    const avatarElement = user.avatar\r\n      ? `<img class=\"user-avatar image-avatar\" src=\"${_src_definitions__WEBPACK_IMPORTED_MODULE_0__.BASE_URL}${user.avatar.replace('.png', '_big.png')}\" alt=\"${user.login}'s avatar\">`\r\n      : `<span class=\"user-avatar svg-avatar\">${getRandomEmojiAvatar()}</span>`;\r\n\r\n    // Create game link if user is in a game\r\n    const gameInfo = user.game ?\r\n      ` | Game: <a href=\"${_src_definitions__WEBPACK_IMPORTED_MODULE_0__.GAME_URL}${user.game}\" class=\"game-link\" target=\"_blank\">${user.game} 🎮</a>` :\r\n      '';\r\n\r\n    // Get the appropriate CSS class for the role\r\n    const roleClass = `role-${user.role.toLowerCase()}`;\r\n\r\n    return `\r\n      <div class=\"user-item\">\r\n        ${avatarElement}\r\n        <div class=\"user-info\">\r\n          <div>${user.login}</div>\r\n          <div class=\"user-meta\">Role: <span class=\"${roleClass}\">${user.role}</span>${gameInfo}</div>\r\n        </div>\r\n      </div>\r\n    `;\r\n  }).join('');\r\n}\r\n\r\n// USER MANAGER (with complete refresh approach)\r\nclass UserManager {\r\n  constructor() {\r\n    this.container = document.createElement('div');\r\n    this.container.id = 'user-list';\r\n    document.body.appendChild(this.container);\r\n    this.activeUsers = new Map(); // Store currently active users\r\n  }\r\n\r\n  updatePresence(xmlResponse) {\r\n    const parser = new DOMParser();\r\n    const doc = parser.parseFromString(xmlResponse, \"text/xml\");\r\n    const presences = doc.getElementsByTagName(\"presence\");\r\n\r\n    // Request a full roster if we received the initial room join\r\n    if (xmlResponse.includes('<presence id=\"pres_1\"')) {\r\n      console.log(\"🔄 Initial room join detected, requesting full roster\");\r\n      this.requestFullRoster();\r\n      return;\r\n    }\r\n\r\n    // Process presence stanzas to update our user list\r\n    let changes = false;\r\n    for (let i = 0; i < presences.length; i++) {\r\n      const presence = presences[i];\r\n      const from = presence.getAttribute('from');\r\n      const type = presence.getAttribute('type');\r\n\r\n      // Handle user leaving\r\n      if (type === 'unavailable') {\r\n        if (this.activeUsers.has(from)) {\r\n          console.log(`🚪 User left: ${this.activeUsers.get(from).login || from}`);\r\n          this.activeUsers.delete(from);\r\n          changes = true;\r\n        }\r\n        continue;\r\n      }\r\n\r\n      // Handle user joining or updating\r\n      let xData = null;\r\n      const xElements = presence.getElementsByTagName(\"x\");\r\n      for (let j = 0; j < xElements.length; j++) {\r\n        if (xElements[j].namespaceURI === \"klavogonki:userdata\") {\r\n          xData = xElements[j];\r\n          break;\r\n        }\r\n      }\r\n\r\n      if (!xData) {\r\n        console.log(`⚠️ No klavogonki:userdata found for presence from: ${from}`);\r\n        continue;\r\n      }\r\n\r\n      const userNode = xData.getElementsByTagName(\"user\")[0];\r\n      if (!userNode) {\r\n        console.log(`⚠️ No user node found in klavogonki:userdata for presence from: ${from}`);\r\n        continue;\r\n      }\r\n\r\n      // Extract user data\r\n      const login = userNode.getElementsByTagName(\"login\")[0]?.textContent || 'Anonymous';\r\n      const avatar = userNode.getElementsByTagName(\"avatar\")[0]?.textContent;\r\n      const background = userNode.getElementsByTagName(\"background\")[0]?.textContent || '#777';\r\n      const gameNode = xData.getElementsByTagName(\"game_id\")[0];\r\n      const game = gameNode ? gameNode.textContent : null;\r\n      const role = presence.getElementsByTagName(\"item\")[0]?.getAttribute(\"role\") || 'participant';\r\n\r\n      const user = {\r\n        jid: from,\r\n        login,\r\n        avatar,\r\n        color: background,\r\n        role,\r\n        game\r\n      };\r\n\r\n      const existingUser = this.activeUsers.get(from);\r\n      if (!existingUser || JSON.stringify(existingUser) !== JSON.stringify(user)) {\r\n        console.log(`👤 User ${existingUser ? 'updated' : 'joined'}: ${login}`);\r\n        this.activeUsers.set(from, user);\r\n        changes = true;\r\n      }\r\n    }\r\n\r\n    // Update UI only if there were changes\r\n    if (changes) {\r\n      console.log(`📋 Current active users: ${this.activeUsers.size}`);\r\n      this.updateUI();\r\n    }\r\n  }\r\n\r\n  async requestFullRoster() {\r\n    // This method would be implemented to request a full roster from the server\r\n    // For now, we'll just use the users we know about\r\n    console.log(\"📑 Would request full roster here (using existing data for now)\");\r\n    this.updateUI();\r\n  }\r\n\r\n  updateUI() {\r\n    console.log(`🖥️ Updating UI with ${this.activeUsers.size} users`);\r\n    // Use the separate function to create the user list UI\r\n    this.container.innerHTML = createUserListUI(Array.from(this.activeUsers.values()));\r\n  }\r\n}\r\n\r\n// MAIN CLIENT\r\nconst xmppClient = {\r\n  userManager: new UserManager(),\r\n  sid: null,\r\n  rid: Math.floor(Date.now() / 1000),\r\n\r\n  async connect() {\r\n    try {\r\n      // Step 1: Initial connection\r\n      console.log('🌐 Step 1: Connecting to XMPP server...');\r\n      const initResponse = await this.sendRequestWithRetry(\r\n        `<body xmlns='http://jabber.org/protocol/httpbind'\r\n               rid='${this.nextRid()}'\r\n               to='jabber.klavogonki.ru'\r\n               xml:lang='en'\r\n               wait='60'\r\n               hold='1'\r\n               ver='1.6'\r\n               xmpp:version='1.0'\r\n               xmlns:xmpp='urn:xmpp:xbosh'/>`\r\n      );\r\n      this.sid = initResponse.match(/sid='(.*?)'/)[1];\r\n      console.log(`🔑 Step 2: Session ID received: ${this.sid}`);\r\n      await this.sleep(_src_definitions__WEBPACK_IMPORTED_MODULE_0__.delay / 3);\r\n\r\n      // Step 2: Authentication\r\n      console.log('🔐 Step 3: Authenticating...');\r\n      const authString = this.base64Encode('\\x00' + _src_definitions__WEBPACK_IMPORTED_MODULE_0__.username + '\\x00' + _src_definitions__WEBPACK_IMPORTED_MODULE_0__.password);\r\n      const authResponse = await this.sendRequestWithRetry(\r\n        `<body rid='${this.nextRid()}' sid='${this.sid}'\r\n               xmlns='http://jabber.org/protocol/httpbind'>\r\n          <auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='PLAIN'>${authString}</auth>\r\n        </body>`\r\n      );\r\n      if (!authResponse.includes('<success')) {\r\n        throw new Error('🚫 Authentication failed');\r\n      }\r\n      console.log('✅ Step 4: Authentication successful!');\r\n      await this.sleep(_src_definitions__WEBPACK_IMPORTED_MODULE_0__.delay / 3);\r\n\r\n      // Step 3: Restart stream\r\n      console.log('🔄 Step 5: Restarting stream...');\r\n      await this.sendRequestWithRetry(\r\n        `<body rid='${this.nextRid()}' sid='${this.sid}'\r\n               xmlns='http://jabber.org/protocol/httpbind'\r\n               to='jabber.klavogonki.ru'\r\n               xmpp:restart='true'\r\n               xmlns:xmpp='urn:xmpp:xbosh'/>`\r\n      );\r\n      await this.sleep(_src_definitions__WEBPACK_IMPORTED_MODULE_0__.delay / 3);\r\n\r\n      // Step 4: Resource binding\r\n      console.log('📦 Step 6: Binding resource...');\r\n      await this.sendRequestWithRetry(\r\n        `<body rid='${this.nextRid()}' sid='${this.sid}'\r\n               xmlns='http://jabber.org/protocol/httpbind'>\r\n          <iq type='set' id='bind_1' xmlns='jabber:client'>\r\n            <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'>\r\n              <resource>web</resource>\r\n            </bind>\r\n          </iq>\r\n        </body>`\r\n      );\r\n      await this.sleep(_src_definitions__WEBPACK_IMPORTED_MODULE_0__.delay / 3);\r\n\r\n      // Step 5: Initialize session\r\n      console.log('🔌 Step 7: Establishing session...');\r\n      await this.sendRequestWithRetry(\r\n        `<body rid='${this.nextRid()}' sid='${this.sid}'\r\n               xmlns='http://jabber.org/protocol/httpbind'>\r\n          <iq type='set' id='session_1' xmlns='jabber:client'>\r\n            <session xmlns='urn:ietf:params:xml:ns:xmpp-session'/>\r\n          </iq>\r\n        </body>`\r\n      );\r\n      await this.sleep(_src_definitions__WEBPACK_IMPORTED_MODULE_0__.delay / 3);\r\n\r\n      // Step 6: Join chat room with correct room and nickname\r\n      console.log('💬 Step 8: Joining chat room...');\r\n      const joinResponse = await this.sendRequestWithRetry(\r\n        `<body rid='${this.nextRid()}' sid='${this.sid}'\r\n               xmlns='http://jabber.org/protocol/httpbind'>\r\n          <presence id='pres_1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru/${_src_definitions__WEBPACK_IMPORTED_MODULE_0__.username}'>\r\n            <x xmlns='http://jabber.org/protocol/muc'/>\r\n          </presence>\r\n        </body>`\r\n      );\r\n      console.log('📥 Join response:', joinResponse);\r\n      this.userManager.updatePresence(joinResponse);\r\n      await this.sleep(_src_definitions__WEBPACK_IMPORTED_MODULE_0__.delay / 3);\r\n\r\n      // Step 7: Request room information \r\n      console.log('📋 Step 9: Requesting room information...');\r\n      await this.sendRequestWithRetry(\r\n        `<body rid='${this.nextRid()}' sid='${this.sid}'\r\n               xmlns='http://jabber.org/protocol/httpbind'>\r\n          <iq type='get' id='info1' xmlns='jabber:client' to='general@conference.jabber.klavogonki.ru'>\r\n            <query xmlns='http://jabber.org/protocol/disco#info'/>\r\n          </iq>\r\n        </body>`\r\n      );\r\n      await this.sleep(_src_definitions__WEBPACK_IMPORTED_MODULE_0__.delay);\r\n\r\n      // Start presence polling\r\n      this.startPresencePolling();\r\n      console.log('🚀 Step 10: Connected! Starting presence updates...');\r\n    } catch (error) {\r\n      console.error(`💥 Error: ${error.message}`);\r\n    }\r\n  },\r\n\r\n  base64Encode(str) {\r\n    const encoder = new TextEncoder();\r\n    const data = encoder.encode(str);\r\n    return btoa(String.fromCharCode(...data));\r\n  },\r\n\r\n  nextRid() {\r\n    this.rid++;\r\n    return this.rid;\r\n  },\r\n\r\n  async sendRequest(payload) {\r\n    const response = await fetch(_src_definitions__WEBPACK_IMPORTED_MODULE_0__.XMPP_BIND_URL, {\r\n      method: 'POST',\r\n      headers: {\r\n        'Content-Type': 'text/xml; charset=UTF-8',\r\n        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'\r\n      },\r\n      body: payload\r\n    });\r\n    if (!response.ok) {\r\n      throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);\r\n    }\r\n    return await response.text();\r\n  },\r\n\r\n  async sendRequestWithRetry(payload, maxRetries = 5) {\r\n    let lastError;\r\n    let baseWaitTime = _src_definitions__WEBPACK_IMPORTED_MODULE_0__.delay;\r\n\r\n    for (let attempt = 1; attempt <= maxRetries; attempt++) {\r\n      try {\r\n        return await this.sendRequest(payload);\r\n      } catch (error) {\r\n        lastError = error;\r\n\r\n        // If we hit a rate limit\r\n        if (error.message.includes('429')) {\r\n          const waitTime = baseWaitTime * Math.pow(2, attempt); // Exponential backoff\r\n          console.log(`⏱️ Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms before retry...`);\r\n          await this.sleep(waitTime);\r\n        } else {\r\n          // If it's not a rate limit error, rethrow immediately\r\n          throw error;\r\n        }\r\n      }\r\n    }\r\n    throw new Error(`Max retries reached. Last error: ${lastError.message}`);\r\n  },\r\n\r\n  startPresencePolling() {\r\n    setInterval(async () => {\r\n      const xmlResponse = await this.sendRequestWithRetry(\r\n        `<body rid='${this.nextRid()}' sid='${this.sid}' xmlns='http://jabber.org/protocol/httpbind'/>\r\n        `\r\n      );\r\n      this.userManager.updatePresence(xmlResponse);\r\n    }, 2000); // Poll every 2 seconds\r\n  },\r\n\r\n  async sleep(ms) {\r\n    return new Promise(resolve => setTimeout(resolve, ms));\r\n  },\r\n};\r\n\r\nxmppClient.connect(); // Start the connection process\r\n\n\n//# sourceURL=webpack://tampermonkey-script/./main.js?");

/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/style.css":
/*!*************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/style.css ***!
  \*************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/noSourceMaps.js */ \"./node_modules/css-loader/dist/runtime/noSourceMaps.js\");\n/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ \"./node_modules/css-loader/dist/runtime/api.js\");\n/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);\n// Imports\n\n\nvar ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));\n// Module\n___CSS_LOADER_EXPORT___.push([module.id, `:root {\r\n  --border-radius: 0.2em;\r\n}\r\n\r\n#user-list {\r\n  position: absolute;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 0.4em;\r\n  left: 50%;\r\n  top: 50%;\r\n  transform: translate(-50%, -50%);\r\n  background: #1e1e1e;\r\n  padding: 1em;\r\n  border-radius: var(--border-radius) !important;\r\n  min-width: 250px;\r\n  color: #e0e0e0;\r\n  font-family: sans-serif;\r\n  z-index: 1000;\r\n}\r\n\r\n.user-item {\r\n  display: flex;\r\n  align-items: center;\r\n  padding: 0.2em;\r\n  border-radius: var(--border-radius) !important;\r\n}\r\n\r\n.user-avatar {\r\n  display: flex;\r\n  justify-content: center;\r\n  align-items: center;\r\n  width: 24px;\r\n  height: 24px;\r\n  font-size: 18px;\r\n  border-radius: 0.1em !important;\r\n  margin-right: 1em;\r\n  text-align: center;\r\n  line-height: 24px;\r\n}\r\n\r\n.user-avatar.image-avatar {\r\n  cursor: pointer;\r\n  transform-origin: left;\r\n  transition: transform 0.15s ease-out;\r\n}\r\n\r\n.user-avatar.image-avatar:hover {\r\n  transform: scale(2);\r\n}\r\n\r\n.user-avatar.svg-avatar {\r\n  filter: grayscale(0.5);\r\n}\r\n\r\n/* Additional user info */\r\n.user-info {\r\n  flex: 1;\r\n}\r\n\r\n.user-meta {\r\n  font-size: 0.8em;\r\n  color: #b0b0b0;\r\n}\r\n\r\n/* Game link styling */\r\n.game-link {\r\n  color: burlywood !important;\r\n  text-decoration: none !important;\r\n  transition: color 0.15s !important;\r\n}\r\n\r\n.game-link:hover {\r\n  color: bisque !important;\r\n}\r\n\r\n/* Role colors */\r\n.role-moderator {\r\n  color: #ff7e7e;\r\n}\r\n\r\n.role-participant {\r\n  color: #7ed4ff;\r\n}\r\n\r\n.role-visitor {\r\n  color: #b0b0b0;\r\n}`, \"\"]);\n// Exports\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);\n\n\n//# sourceURL=webpack://tampermonkey-script/./src/style.css?./node_modules/css-loader/dist/cjs.js");

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/***/ ((module) => {

eval("\n\n/*\n  MIT License http://www.opensource.org/licenses/mit-license.php\n  Author Tobias Koppers @sokra\n*/\nmodule.exports = function (cssWithMappingToString) {\n  var list = [];\n\n  // return the list of modules as css string\n  list.toString = function toString() {\n    return this.map(function (item) {\n      var content = \"\";\n      var needLayer = typeof item[5] !== \"undefined\";\n      if (item[4]) {\n        content += \"@supports (\".concat(item[4], \") {\");\n      }\n      if (item[2]) {\n        content += \"@media \".concat(item[2], \" {\");\n      }\n      if (needLayer) {\n        content += \"@layer\".concat(item[5].length > 0 ? \" \".concat(item[5]) : \"\", \" {\");\n      }\n      content += cssWithMappingToString(item);\n      if (needLayer) {\n        content += \"}\";\n      }\n      if (item[2]) {\n        content += \"}\";\n      }\n      if (item[4]) {\n        content += \"}\";\n      }\n      return content;\n    }).join(\"\");\n  };\n\n  // import a list of modules into the list\n  list.i = function i(modules, media, dedupe, supports, layer) {\n    if (typeof modules === \"string\") {\n      modules = [[null, modules, undefined]];\n    }\n    var alreadyImportedModules = {};\n    if (dedupe) {\n      for (var k = 0; k < this.length; k++) {\n        var id = this[k][0];\n        if (id != null) {\n          alreadyImportedModules[id] = true;\n        }\n      }\n    }\n    for (var _k = 0; _k < modules.length; _k++) {\n      var item = [].concat(modules[_k]);\n      if (dedupe && alreadyImportedModules[item[0]]) {\n        continue;\n      }\n      if (typeof layer !== \"undefined\") {\n        if (typeof item[5] === \"undefined\") {\n          item[5] = layer;\n        } else {\n          item[1] = \"@layer\".concat(item[5].length > 0 ? \" \".concat(item[5]) : \"\", \" {\").concat(item[1], \"}\");\n          item[5] = layer;\n        }\n      }\n      if (media) {\n        if (!item[2]) {\n          item[2] = media;\n        } else {\n          item[1] = \"@media \".concat(item[2], \" {\").concat(item[1], \"}\");\n          item[2] = media;\n        }\n      }\n      if (supports) {\n        if (!item[4]) {\n          item[4] = \"\".concat(supports);\n        } else {\n          item[1] = \"@supports (\".concat(item[4], \") {\").concat(item[1], \"}\");\n          item[4] = supports;\n        }\n      }\n      list.push(item);\n    }\n  };\n  return list;\n};\n\n//# sourceURL=webpack://tampermonkey-script/./node_modules/css-loader/dist/runtime/api.js?");

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/noSourceMaps.js":
/*!**************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/noSourceMaps.js ***!
  \**************************************************************/
/***/ ((module) => {

eval("\n\nmodule.exports = function (i) {\n  return i[1];\n};\n\n//# sourceURL=webpack://tampermonkey-script/./node_modules/css-loader/dist/runtime/noSourceMaps.js?");

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/***/ ((module) => {

eval("\n\nvar stylesInDOM = [];\nfunction getIndexByIdentifier(identifier) {\n  var result = -1;\n  for (var i = 0; i < stylesInDOM.length; i++) {\n    if (stylesInDOM[i].identifier === identifier) {\n      result = i;\n      break;\n    }\n  }\n  return result;\n}\nfunction modulesToDom(list, options) {\n  var idCountMap = {};\n  var identifiers = [];\n  for (var i = 0; i < list.length; i++) {\n    var item = list[i];\n    var id = options.base ? item[0] + options.base : item[0];\n    var count = idCountMap[id] || 0;\n    var identifier = \"\".concat(id, \" \").concat(count);\n    idCountMap[id] = count + 1;\n    var indexByIdentifier = getIndexByIdentifier(identifier);\n    var obj = {\n      css: item[1],\n      media: item[2],\n      sourceMap: item[3],\n      supports: item[4],\n      layer: item[5]\n    };\n    if (indexByIdentifier !== -1) {\n      stylesInDOM[indexByIdentifier].references++;\n      stylesInDOM[indexByIdentifier].updater(obj);\n    } else {\n      var updater = addElementStyle(obj, options);\n      options.byIndex = i;\n      stylesInDOM.splice(i, 0, {\n        identifier: identifier,\n        updater: updater,\n        references: 1\n      });\n    }\n    identifiers.push(identifier);\n  }\n  return identifiers;\n}\nfunction addElementStyle(obj, options) {\n  var api = options.domAPI(options);\n  api.update(obj);\n  var updater = function updater(newObj) {\n    if (newObj) {\n      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {\n        return;\n      }\n      api.update(obj = newObj);\n    } else {\n      api.remove();\n    }\n  };\n  return updater;\n}\nmodule.exports = function (list, options) {\n  options = options || {};\n  list = list || [];\n  var lastIdentifiers = modulesToDom(list, options);\n  return function update(newList) {\n    newList = newList || [];\n    for (var i = 0; i < lastIdentifiers.length; i++) {\n      var identifier = lastIdentifiers[i];\n      var index = getIndexByIdentifier(identifier);\n      stylesInDOM[index].references--;\n    }\n    var newLastIdentifiers = modulesToDom(newList, options);\n    for (var _i = 0; _i < lastIdentifiers.length; _i++) {\n      var _identifier = lastIdentifiers[_i];\n      var _index = getIndexByIdentifier(_identifier);\n      if (stylesInDOM[_index].references === 0) {\n        stylesInDOM[_index].updater();\n        stylesInDOM.splice(_index, 1);\n      }\n    }\n    lastIdentifiers = newLastIdentifiers;\n  };\n};\n\n//# sourceURL=webpack://tampermonkey-script/./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js?");

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js":
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
/***/ ((module) => {

eval("\n\nvar memo = {};\n\n/* istanbul ignore next  */\nfunction getTarget(target) {\n  if (typeof memo[target] === \"undefined\") {\n    var styleTarget = document.querySelector(target);\n\n    // Special case to return head of iframe instead of iframe itself\n    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {\n      try {\n        // This will throw an exception if access to iframe is blocked\n        // due to cross-origin restrictions\n        styleTarget = styleTarget.contentDocument.head;\n      } catch (e) {\n        // istanbul ignore next\n        styleTarget = null;\n      }\n    }\n    memo[target] = styleTarget;\n  }\n  return memo[target];\n}\n\n/* istanbul ignore next  */\nfunction insertBySelector(insert, style) {\n  var target = getTarget(insert);\n  if (!target) {\n    throw new Error(\"Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.\");\n  }\n  target.appendChild(style);\n}\nmodule.exports = insertBySelector;\n\n//# sourceURL=webpack://tampermonkey-script/./node_modules/style-loader/dist/runtime/insertBySelector.js?");

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js":
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
/***/ ((module) => {

eval("\n\n/* istanbul ignore next  */\nfunction insertStyleElement(options) {\n  var element = document.createElement(\"style\");\n  options.setAttributes(element, options.attributes);\n  options.insert(element, options.options);\n  return element;\n}\nmodule.exports = insertStyleElement;\n\n//# sourceURL=webpack://tampermonkey-script/./node_modules/style-loader/dist/runtime/insertStyleElement.js?");

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\n/* istanbul ignore next  */\nfunction setAttributesWithoutAttributes(styleElement) {\n  var nonce =  true ? __webpack_require__.nc : 0;\n  if (nonce) {\n    styleElement.setAttribute(\"nonce\", nonce);\n  }\n}\nmodule.exports = setAttributesWithoutAttributes;\n\n//# sourceURL=webpack://tampermonkey-script/./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js?");

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js":
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
/***/ ((module) => {

eval("\n\n/* istanbul ignore next  */\nfunction apply(styleElement, options, obj) {\n  var css = \"\";\n  if (obj.supports) {\n    css += \"@supports (\".concat(obj.supports, \") {\");\n  }\n  if (obj.media) {\n    css += \"@media \".concat(obj.media, \" {\");\n  }\n  var needLayer = typeof obj.layer !== \"undefined\";\n  if (needLayer) {\n    css += \"@layer\".concat(obj.layer.length > 0 ? \" \".concat(obj.layer) : \"\", \" {\");\n  }\n  css += obj.css;\n  if (needLayer) {\n    css += \"}\";\n  }\n  if (obj.media) {\n    css += \"}\";\n  }\n  if (obj.supports) {\n    css += \"}\";\n  }\n  var sourceMap = obj.sourceMap;\n  if (sourceMap && typeof btoa !== \"undefined\") {\n    css += \"\\n/*# sourceMappingURL=data:application/json;base64,\".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), \" */\");\n  }\n\n  // For old IE\n  /* istanbul ignore if  */\n  options.styleTagTransform(css, styleElement, options.options);\n}\nfunction removeStyleElement(styleElement) {\n  // istanbul ignore if\n  if (styleElement.parentNode === null) {\n    return false;\n  }\n  styleElement.parentNode.removeChild(styleElement);\n}\n\n/* istanbul ignore next  */\nfunction domAPI(options) {\n  if (typeof document === \"undefined\") {\n    return {\n      update: function update() {},\n      remove: function remove() {}\n    };\n  }\n  var styleElement = options.insertStyleElement(options);\n  return {\n    update: function update(obj) {\n      apply(styleElement, options, obj);\n    },\n    remove: function remove() {\n      removeStyleElement(styleElement);\n    }\n  };\n}\nmodule.exports = domAPI;\n\n//# sourceURL=webpack://tampermonkey-script/./node_modules/style-loader/dist/runtime/styleDomAPI.js?");

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js":
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
/***/ ((module) => {

eval("\n\n/* istanbul ignore next  */\nfunction styleTagTransform(css, styleElement) {\n  if (styleElement.styleSheet) {\n    styleElement.styleSheet.cssText = css;\n  } else {\n    while (styleElement.firstChild) {\n      styleElement.removeChild(styleElement.firstChild);\n    }\n    styleElement.appendChild(document.createTextNode(css));\n  }\n}\nmodule.exports = styleTagTransform;\n\n//# sourceURL=webpack://tampermonkey-script/./node_modules/style-loader/dist/runtime/styleTagTransform.js?");

/***/ }),

/***/ "./src/definitions.js":
/*!****************************!*\
  !*** ./src/definitions.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   BASE_URL: () => (/* binding */ BASE_URL),\n/* harmony export */   GAME_URL: () => (/* binding */ GAME_URL),\n/* harmony export */   XMPP_BIND_URL: () => (/* binding */ XMPP_BIND_URL),\n/* harmony export */   delay: () => (/* binding */ delay),\n/* harmony export */   emojiFaces: () => (/* binding */ emojiFaces),\n/* harmony export */   password: () => (/* binding */ password),\n/* harmony export */   username: () => (/* binding */ username)\n/* harmony export */ });\n/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style.css */ \"./src/style.css\");\n // styles\r\n\r\n// URL constants\r\nconst BASE_URL = 'https://klavogonki.ru';\r\nconst GAME_URL = `${BASE_URL}/g/?gmid=`;\r\nconst XMPP_BIND_URL = `${BASE_URL}/xmpp-httpbind/`;\r\n\r\n// Sleep time (ms)\r\nconst delay = 500;\r\n\r\n// Configuration\r\nconst username = '773950#Солнцеликий';\r\nconst password = '05cc94fc3e9587964545c6c52d7276bf';\r\n\r\nconst emojiFaces = [\r\n  // People Emojis (Facial expressions)\r\n  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆',\r\n  '😉', '😊', '😋', '😎', '😏', '😐', '😑', '😒',\r\n  '😓', '😔', '😕', '😖', '😗', '😘', '😙', '😚',\r\n  '😜', '😝', '😛', '🤑', '🤗', '🤔', '🤐', '🤨',\r\n  '😣', '😥', '😮', '🤯', '😳', '😱', '😨', '😰',\r\n  '😢', '🤪', '😵', '😲', '🤤', '😷', '🤒', '🤕',\r\n  '🤢', '🤧', '😇', '🥳', '🥺', '😬', '😴', '😌',\r\n  '🤥', '🥴', '🥵', '🥶', '🤧', '🤭', '🤫', '😠',\r\n  '😡', '😳', '😞', '😟', '😕',\r\n\r\n  // Cat Emojis (Expressive faces of cats)\r\n  '🐱', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',\r\n\r\n  // Other Animal Emojis (Various animals' faces)\r\n  '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',\r\n  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',\r\n  '🙈', '🙉', '🙊', '🐔', '🦄'\r\n];\n\n//# sourceURL=webpack://tampermonkey-script/./src/definitions.js?");

/***/ }),

/***/ "./src/style.css":
/*!***********************!*\
  !*** ./src/style.css ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ \"./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ \"./node_modules/style-loader/dist/runtime/styleDomAPI.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ \"./node_modules/style-loader/dist/runtime/insertBySelector.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ \"./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ \"./node_modules/style-loader/dist/runtime/insertStyleElement.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ \"./node_modules/style-loader/dist/runtime/styleTagTransform.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./style.css */ \"./node_modules/css-loader/dist/cjs.js!./src/style.css\");\n\n      \n      \n      \n      \n      \n      \n      \n      \n      \n\nvar options = {};\n\noptions.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());\noptions.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());\n\n      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, \"head\");\n    \noptions.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());\noptions.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());\n\nvar update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__[\"default\"], options);\n\n\n\n\n       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__[\"default\"] && _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__[\"default\"].locals ? _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__[\"default\"].locals : undefined);\n\n\n//# sourceURL=webpack://tampermonkey-script/./src/style.css?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./main.js");
/******/ 	
/******/ })()
;