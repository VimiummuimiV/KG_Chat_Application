import { settings, uiStrings, defaultLanguage } from "../data/definitions.js";
import { checkIsMobile, isTextSelected, logMessage } from "../helpers/helpers.js";

const DELETED_MESSAGES_KEY = "deletedChatAppMessages";
const IGNORED_USERS_KEY = "ignored";
const TEMP_IGNORED_USERS_KEY = "tempIgnored";

export default class ChatMessagesRemover {
  constructor() {
    this.selected = new Set();
    this.isDragging = false;
    this.toggleBtn = null;
    this.longPressTimer = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isMobile = checkIsMobile();
    this.init();
  }

  // Initialize the class by attaching events and rendering UI elements
  init() {
    this.attachEvents();
    this.updateDeletedMessages();
    this.renderToggle();
    this.cleanupExpiredIgnores();
  }

  // Attach event listeners for desktop and mobile interactions
  attachEvents() {
    document.addEventListener("mousedown", (e) => {
      const msgEl = e.target.closest(".messages-panel .message");
      if (!msgEl) return;

      if (e.button === 2 && msgEl) {
        this.handleSelection(e.target, msgEl, e.ctrlKey);
      }
    });

    document.addEventListener("mouseup", () => (this.isDragging = false));

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;

      const msgEl = e.target.closest(".messages-panel .message");
      if (msgEl) {
        this.toggleSelect(msgEl, true, "message-mode");
      }
    });

    document.addEventListener("contextmenu", (e) => {
      const msg = e.target.closest(".messages-panel .message");
      if (msg) {
        if (!isTextSelected()) {
          e.preventDefault();
          this.showDeleteButton(e, msg);
        }
      }
    });

    if (this.isMobile) {
      document.addEventListener("touchstart", (e) => {
        const msgEl = e.target.closest(".messages-panel .message");
        if (!msgEl) return;

        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;

        this.longPressTimer = setTimeout(() => {
          this.handleSelection(e.target, msgEl, false);
          this.showDeleteButton({
            clientX: this.touchStartX,
            clientY: this.touchStartY,
            preventDefault: () => { }
          }, msgEl);
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, settings.longPressDuration);
      });

      document.addEventListener("touchmove", (e) => {
        if (this.isDragging) {
          e.preventDefault(); // Prevent scrolling during multi-selection drag
        }
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const moveX = Math.abs(touchX - this.touchStartX);
        const moveY = Math.abs(touchY - this.touchStartY);

        if (moveX > 10 || moveY > 10) {
          if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
          }
        }
      }, { passive: false });

      document.addEventListener("touchend", () => {
        if (this.longPressTimer) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      });
    }
  }

  // Handle selection logic based on target type (time, username, or message)
  handleSelection(target, msgEl, isCtrlKey) {
    // Prevent selection if text is already selected in the message
    if (isTextSelected()) return;

    const timeEl = target.closest(".time");
    const usernameEl = target.closest(".username");

    if (timeEl) {
      this.handleTimeSelection(msgEl, isCtrlKey);
    } else if (usernameEl) {
      this.handleUsernameSelection(usernameEl);
    } else {
      this.isDragging = true;
      this.toggleSelect(msgEl, true, "message-mode");
    }
  }

  // Select messages based on time criteria
  handleTimeSelection(msgEl, isCtrlKey) {
    const messages = Array.from(
      document.querySelectorAll(".messages-panel .message")
    );
    const startIndex = messages.indexOf(msgEl);

    if (startIndex === -1) return;

    if (isCtrlKey) {
      messages.slice(startIndex).forEach((m) => {
        this.toggleSelect(m, true, "time-mode");
        m.classList.add("time-mode");
      });
    } else {
      const usernameEl = msgEl.querySelector(".username");
      if (!usernameEl) return;

      const usernameText = usernameEl.textContent.trim();
      messages.slice(startIndex).forEach((m) => {
        const mUsernameEl = m.querySelector(".username");
        if (
          mUsernameEl &&
          mUsernameEl.textContent.trim() === usernameText
        ) {
          this.toggleSelect(m, true, "time-mode");
          m.classList.add("time-mode");
        }
      });
    }
  }

  // Select all messages from a specific user
  handleUsernameSelection(usernameEl) {
    const usernameText = usernameEl.textContent.trim();
    document.querySelectorAll(".messages-panel .message").forEach((msg) => {
      const msgUsernameEl = msg.querySelector(".username");
      if (
        msgUsernameEl &&
        msgUsernameEl.textContent.trim() === usernameText
      ) {
        this.toggleSelect(msg, true, "username-mode");
        msg.classList.add("username-mode");
      }
    });
  }

  // Toggle selection state of a message element
  toggleSelect(el, state, mode = "message-mode") {
    if (!el) return;

    el.classList.toggle("selected-message", state);

    if (!state) {
      el.classList.remove("username-mode", "time-mode", "message-mode");
    } else if (mode === "message-mode") {
      el.classList.add("message-mode");
    }

    const id = getMessageId(el);
    state ? this.selected.add(id) : this.selected.delete(id);
  }

  // Display delete and ignore buttons at the correct position
  showDeleteButton(e, msg) {
    // Prevent showing the delete button if text is already selected in the message
    if (isTextSelected()) return;

    const existingContainer = document.querySelector(".action-buttons-container");
    if (existingContainer) existingContainer.remove();

    const container = document.createElement("div");
    container.className = "action-buttons-container";

    let modeClass = "message-mode";
    if (msg.classList.contains("time-mode")) {
      modeClass = "time-mode";
    } else if (msg.classList.contains("username-mode")) {
      modeClass = "username-mode";
    }
    container.classList.add(modeClass);

    if (this.isMobile) {
      container.classList.add("mobile-container");
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = uiStrings.deleteButton[defaultLanguage];
    deleteBtn.onclick = () => this.deleteSelectedMessages(container);
    container.appendChild(deleteBtn);

    if (modeClass === "username-mode") {
      const usernameEl = msg.querySelector(".username");
      if (usernameEl) {
        const username = usernameEl.textContent.trim();
        if (username) {
          const ignoreBtn = document.createElement("button");
          ignoreBtn.className = "ignore-btn";
          ignoreBtn.textContent = uiStrings.ignoreButton[defaultLanguage];
          ignoreBtn.onclick = () => this.showIgnoreOptions(ignoreBtn, username);
          container.appendChild(ignoreBtn);
        }
      }
    }

    container.addEventListener("touchstart", (e) => {
      e.stopPropagation();
    });

    // Temporarily append to body to measure dimensions
    document.body.append(container);
    const { offsetWidth: w, offsetHeight: h } = container;
    container.remove();

    // Calculate position ensuring the container stays within viewport bounds
    const left = Math.max(0, Math.min(e.clientX - w / 2, window.innerWidth - w));
    const top = Math.max(0, Math.min(e.clientY - h / 2, window.innerHeight - h));

    Object.assign(container.style, {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
    });

    if (this.isMobile) {
      const handleOutsideTap = (event) => {
        if (!container.contains(event.target)) {
          this.clearSelection();
          container.remove();
          document.removeEventListener('touchstart', handleOutsideTap);
        }
      };
      document.addEventListener('touchstart', handleOutsideTap);
      container.outsideTapHandler = handleOutsideTap;
    }

    let timeoutId;
    container.addEventListener("mouseenter", () => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    container.addEventListener("mouseleave", () => {
      timeoutId = setTimeout(() => {
        container.remove();
        this.clearSelection();
      }, settings.clearSelectionDelay);
    });

    document.body.append(container);
  }

  // Show popup with ignore duration options
  showIgnoreOptions(ignoreBtn, username) {
    const popup = document.createElement("div");
    popup.className = "ignore-options-popup";

    // Custom minutes input button as the first option
    const options = [
      { custom: true },
      { text: uiStrings.ignore1Hour[defaultLanguage], duration: 60 * 60 * 1000 },
      { text: uiStrings.ignore1Day[defaultLanguage], duration: 24 * 60 * 60 * 1000 },
      { text: uiStrings.ignoreForever[defaultLanguage], duration: null }
    ];

    options.forEach(option => {
      if (option.custom) {
        const customBtn = document.createElement("button");
        customBtn.className = "ignore-option-btn custom-ignore-minutes";
        customBtn.textContent = uiStrings.ignoreCustomMinutes[defaultLanguage];
        customBtn.onclick = () => {
          let min;
          while (true) {
            min = prompt(uiStrings.ignoreCustomPrompt[defaultLanguage]);
            if (min === null) return; // Cancelled
            if (/^\d+$/.test(min) && parseInt(min, 10) > 0) break;
          }
          const minutes = parseInt(min, 10);
          this.ignoreUser(username, minutes * 60 * 1000);
          popup.remove();
          this.clearSelection();
          const existingContainer = document.querySelector(".action-buttons-container");
          if (existingContainer) existingContainer.remove();
        };
        popup.appendChild(customBtn);
      } else {
        const optionBtn = document.createElement("button");
        optionBtn.className = "ignore-option-btn";
        optionBtn.textContent = option.text;
        optionBtn.onclick = () => {
          this.ignoreUser(username, option.duration);
          popup.remove();
          this.clearSelection();
          const existingContainer = document.querySelector(".action-buttons-container");
          if (existingContainer) existingContainer.remove();
        };
        popup.appendChild(optionBtn);
      }
    });

    const rect = ignoreBtn.getBoundingClientRect();
    const popupWidth = 100; // Approximate width
    const left = Math.max(0, Math.min(rect.left, window.innerWidth - popupWidth));

    popup.style.top = `${rect.bottom + 5}px`;
    popup.style.left = `${left}px`;

    document.body.appendChild(popup);

    const handleOutsideClick = (event) => {
      if (!popup.contains(event.target) && !ignoreBtn.contains(event.target)) {
        popup.remove();
        document.removeEventListener('click', handleOutsideClick);
      }
    };
    document.addEventListener('click', handleOutsideClick);
  }

  // Ignore a user for a specified duration
  ignoreUser(username, duration) {
    if (duration === null) {
      // Forever - add to permanent ignore list
      const ignoredUsers = JSON.parse(localStorage.getItem(IGNORED_USERS_KEY) || "[]");
      if (!ignoredUsers.includes(username)) {
        ignoredUsers.push(username);
        localStorage.setItem(IGNORED_USERS_KEY, JSON.stringify(ignoredUsers));
      }
      logMessage({
        en: `Added "${username}" to the ignore list`,
        ru: `"${username}" добавлен(а) в список игнорируемых`
      }, 'info');
    } else {
      // Temporary ignore - add to temp ignore list with expiry time
      const tempIgnored = JSON.parse(localStorage.getItem(TEMP_IGNORED_USERS_KEY) || "{}");
      const expiryTime = Date.now() + duration;
      tempIgnored[username] = expiryTime;
      localStorage.setItem(TEMP_IGNORED_USERS_KEY, JSON.stringify(tempIgnored));
      const minutes = Math.round(duration / 60000);
      function getMinuteWordRu(n) {
        if (n % 10 === 1 && n % 100 !== 11) return 'минуту';
        if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'минуты';
        return 'минут';
      }
      logMessage({
        en: `Added "${username}" to the ignore list for ${minutes} minutes`,
        ru: `"${username}" добавлен(а) в список игнорируемых на ${minutes} ${getMinuteWordRu(minutes)}`
      }, 'info');
    }

    if (window.messageManager && typeof window.messageManager.removeIgnoredMessages === 'function') {
      window.messageManager.removeIgnoredMessages();
    }
  }

  // Clean up expired temporary ignores
  cleanupExpiredIgnores() {
    const tempIgnoredData = JSON.parse(localStorage.getItem(TEMP_IGNORED_USERS_KEY) || "{}");
    const now = Date.now();
    let hasChanges = false;
    let liberatedUsers = [];

    Object.keys(tempIgnoredData).forEach(username => {
      if (tempIgnoredData[username] <= now) {
        delete tempIgnoredData[username];
        hasChanges = true;
        liberatedUsers.push(username);
      }
    });

    if (hasChanges) {
      localStorage.setItem(TEMP_IGNORED_USERS_KEY, JSON.stringify(tempIgnoredData));
      liberatedUsers.forEach(username => {
        logMessage({
          en: `User "${username}" was removed from the ignore list`,
          ru: `Пользователь "${username}" удалён из игнора`
        }, 'info');
      });
    }
  }

  // Check if a user is currently ignored
  isUserIgnored(username) {
    const ignoredUsers = JSON.parse(localStorage.getItem(IGNORED_USERS_KEY) || "[]");
    if (ignoredUsers.includes(username)) {
      return true;
    }

    const tempIgnoredData = JSON.parse(localStorage.getItem(TEMP_IGNORED_USERS_KEY) || "{}");
    if (tempIgnoredData[username] && tempIgnoredData[username] > Date.now()) {
      return true;
    }

    return false;
  }

  // Delete selected messages and update UI
  deleteSelectedMessages(container) {
    document.querySelectorAll(".selected-message").forEach((msg) => {
      if (!msg) return;

      msg.classList.remove("selected-message", "username-mode", "time-mode", "message-mode");
      if (msg.classList.length === 0) msg.removeAttribute("class");
    });
    this.storeDeleted([...this.selected]);
    container.remove();
    if (this.isMobile && container.outsideTapHandler) {
      document.removeEventListener('touchstart', container.outsideTapHandler);
    }
    this.selected.clear();
    this.updateDeletedMessages();
    this.renderToggle();
  }

  // Clear all selected messages without deleting
  clearSelection() {
    document.querySelectorAll(".selected-message").forEach((msg) => {
      if (!msg) return;

      msg.classList.remove("selected-message", "username-mode", "time-mode", "message-mode");
      if (msg.classList.length === 0) {
        msg.removeAttribute("class");
      }
    });
    this.selected.clear();
  }

  // Store deleted message IDs in localStorage
  storeDeleted(ids) {
    const stored = new Set(
      JSON.parse(localStorage.getItem(DELETED_MESSAGES_KEY) || "[]")
    );
    ids.forEach((id) => stored.add(id));
    localStorage.setItem(DELETED_MESSAGES_KEY, JSON.stringify([...stored]));
  }

  // Update visibility of messages based on deleted status
  updateDeletedMessages() {
    const stored = new Set(
      JSON.parse(localStorage.getItem(DELETED_MESSAGES_KEY) || "[]")
    );

    const messages = document.querySelectorAll(".messages-panel .message");
    if (messages.length === 0) return;

    messages.forEach((msg) => {
      if (!msg) return;

      const id = getMessageId(msg);
      msg.classList.remove("shown-message");
      msg.classList.toggle("hidden-message", stored.has(id));
    });

    localStorage.setItem(DELETED_MESSAGES_KEY, JSON.stringify([...stored]));
  }

  // Render toggle button to show/hide deleted messages
  renderToggle() {
    const storedItems = JSON.parse(localStorage.getItem(DELETED_MESSAGES_KEY) || "[]");
    const hasDeleted = storedItems.length > 0;

    if (!hasDeleted) {
      if (this.toggleBtn) {
        this.toggleBtn.remove();
        this.toggleBtn = null;
      }
      return;
    }

    const messagesPanel = document.querySelector(".messages-panel");
    if (!messagesPanel) return;

    if (!this.toggleBtn) {
      this.toggleBtn = document.createElement("button");
      this.toggleBtn.className = "toggle-button toggle-hidden";
      this.toggleBtn.textContent = "Show";

      this.toggleBtn.onclick = (e) => {
        if (e.ctrlKey) {
          this.restoreAllMessages();
          return;
        }

        const shouldShow = this.toggleBtn.textContent === "Show";
        const storedIds = JSON.parse(
          localStorage.getItem(DELETED_MESSAGES_KEY) || "[]"
        );

        document.querySelectorAll(".messages-panel .message").forEach((msg) => {
          if (!msg) return;

          const id = getMessageId(msg);
          if (storedIds.includes(id)) {
            msg.classList.toggle("hidden-message", !shouldShow);
            msg.classList.toggle("shown-message", shouldShow);
          }
        });

        if (shouldShow) {
          this.toggleBtn.textContent = "Hide";
          this.toggleBtn.classList.remove("toggle-hidden");
          this.toggleBtn.classList.add("toggle-shown");
        } else {
          this.toggleBtn.textContent = "Show";
          this.toggleBtn.classList.remove("toggle-shown");
          this.toggleBtn.classList.add("toggle-hidden");
        }
      };

      if (this.isMobile) {
        let isLongPress = false;
        let longPressTimer;

        this.toggleBtn.addEventListener('touchstart', (e) => {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
          isLongPress = false;
          longPressTimer = setTimeout(() => {
            isLongPress = true;
            this.restoreAllMessages();
            if (navigator.vibrate) {
              navigator.vibrate(50);
            }
          }, settings.longPressDuration);
        });

        this.toggleBtn.addEventListener('touchmove', (e) => {
          const touchX = e.touches[0].clientX;
          const touchY = e.touches[0].clientY;
          const moveX = Math.abs(touchX - this.touchStartX);
          const moveY = Math.abs(touchY - this.touchStartY);
          if (moveX > 10 || moveY > 10) {
            clearTimeout(longPressTimer);
          }
        });

        this.toggleBtn.addEventListener('touchend', () => {
          clearTimeout(longPressTimer);
          if (isLongPress) {
            this.toggleBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
            }, { once: true });
          }
        });
      }

      messagesPanel.append(this.toggleBtn);
    }
  }

  // Restore all deleted messages
  restoreAllMessages() {
    document.querySelectorAll(".messages-panel .message").forEach((msg) => {
      if (!msg) return;

      msg.classList.remove("hidden-message", "shown-message");
    });
    localStorage.setItem(DELETED_MESSAGES_KEY, JSON.stringify([]));
    this.selected.clear();
    this.updateDeletedMessages();
    this.renderToggle();
  }
}

// Generate a unique ID for a message element
function getMessageId(el) {
  if (!el) return '';
  if (el.dataset.messageId) return el.dataset.messageId;

  let id = Array.from(el.childNodes)
    .map((n) => {
      if (!n) return '';
      if (n.nodeType === Node.TEXT_NODE) return n.textContent.trim();
      if (n.classList?.contains("username")) return n.textContent.trim();
      if (n.tagName === "A") return n.href;
      if (n.tagName === "IMG") return n.title.trim();
      if (n.tagName === "IFRAME") return n.src.trim();
      return "";
    })
    .join("");

  if (!id) {
    id = 'msg-' + Math.random().toString(36).substring(2, 7);
  }
  el.dataset.messageId = id;
  return id;
}

// Prune deleted message IDs that no longer exist in the DOM
export function pruneDeletedMessages() {
  const messages = document.querySelectorAll(".messages-panel .message");
  if (messages.length === 0) return;

  const currentIds = new Set(
    Array.from(messages).map((msg) => getMessageId(msg))
  );

  const storedItems = JSON.parse(localStorage.getItem(DELETED_MESSAGES_KEY) || "[]");
  const filteredItems = storedItems.filter((id) => currentIds.has(id));

  localStorage.setItem(DELETED_MESSAGES_KEY, JSON.stringify(filteredItems));

  // Remove the toggle button if no items remain
  if (filteredItems.length === 0) {
    const toggleBtn = document.querySelector(".toggle-button");
    if (toggleBtn) {
      toggleBtn.remove();
    }
  }
}
