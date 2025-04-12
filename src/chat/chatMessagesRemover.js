import { checkIsMobile, isTextSelected } from "../helpers/helpers.js";

export default class ChatMessagesRemover {
  constructor() {
    this.selected = new Set();
    this.isDragging = false;
    this.toggleBtn = null;
    this.longPressTimer = null;
    this.longPressDuration = 500;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isMobile = checkIsMobile();
    this.init();
  }

  init() {
    this.attachEvents();
    this.updateDeletedMessages();
    this.renderToggle();
  }

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
        }, this.longPressDuration);
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

  showDeleteButton(e, msg) {
    // Prevent showing the delete button if text is already selected in the message
    if (isTextSelected()) return;

    const existingBtn = document.querySelector(".delete-btn");
    if (existingBtn) existingBtn.remove();

    const btn = document.createElement("button");
    btn.className = "delete-btn";

    if (this.isMobile) {
      btn.classList.add("mobile-delete-btn");
    }

    btn.textContent = "Delete";

    // Prevent touch events on the button from bubbling up to any global "outside tap" handlers.
    btn.addEventListener("touchstart", (e) => {
      e.stopPropagation();
    });

    document.body.append(btn);
    const { offsetWidth: w, offsetHeight: h } = btn;
    btn.remove();

    Object.assign(btn.style, {
      position: "fixed",
      top: `${e.clientY - h / 2}px`,
      left: `${e.clientX - w / 2}px`,
    });

    btn.onclick = () => this.deleteSelectedMessages(btn);

    if (this.isMobile) {
      const handleOutsideTap = (event) => {
        if (!btn.contains(event.target)) {
          this.clearSelection();
          btn.remove();
          document.removeEventListener('touchstart', handleOutsideTap);
        }
      };
      document.addEventListener('touchstart', handleOutsideTap);
      btn.outsideTapHandler = handleOutsideTap;
    }

    let timeoutId;
    btn.addEventListener("mouseenter", () => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    btn.addEventListener("mouseleave", () => {
      timeoutId = setTimeout(() => {
        btn.remove();
        this.clearSelection();
      }, 1000);
    });

    document.body.append(btn);
  }

  deleteSelectedMessages(btn) {
    document.querySelectorAll(".selected-message").forEach((msg) => {
      if (!msg) return;

      msg.classList.remove("selected-message", "username-mode", "time-mode", "message-mode");
      if (msg.classList.length === 0) msg.removeAttribute("class");
    });
    this.storeDeleted([...this.selected]);
    btn.remove();
    if (this.isMobile && btn.outsideTapHandler) {
      document.removeEventListener('touchstart', btn.outsideTapHandler);
    }
    this.selected.clear();
    this.updateDeletedMessages();
    this.renderToggle();
  }

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

  storeDeleted(ids) {
    const stored = new Set(
      JSON.parse(localStorage.getItem("deletedChatMessagesContent") || "[]")
    );
    ids.forEach((id) => stored.add(id));
    localStorage.setItem("deletedChatMessagesContent", JSON.stringify([...stored]));
  }

  updateDeletedMessages() {
    const stored = new Set(
      JSON.parse(localStorage.getItem("deletedChatMessagesContent") || "[]")
    );

    const messages = document.querySelectorAll(".messages-panel .message");
    if (messages.length === 0) return;

    messages.forEach((msg) => {
      if (!msg) return;

      const id = getMessageId(msg);
      msg.classList.remove("shown-message");
      msg.classList.toggle("hidden-message", stored.has(id));
    });

    localStorage.setItem("deletedChatMessagesContent", JSON.stringify([...stored]));
  }

  renderToggle() {
    const storedItems = JSON.parse(localStorage.getItem("deletedChatMessagesContent") || "[]");
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
          localStorage.getItem("deletedChatMessagesContent") || "[]"
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
          }, this.longPressDuration);
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

  restoreAllMessages() {
    document.querySelectorAll(".messages-panel .message").forEach((msg) => {
      if (!msg) return;

      msg.classList.remove("hidden-message", "shown-message");
    });
    localStorage.setItem("deletedChatMessagesContent", JSON.stringify([]));
    this.selected.clear();
    this.updateDeletedMessages();
    this.renderToggle();
  }
}

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

export function pruneDeletedMessages() {
  const messages = document.querySelectorAll(".messages-panel .message");
  if (messages.length === 0) return;

  const currentIds = new Set(
    Array.from(messages).map((msg) => getMessageId(msg))
  );

  const storedItems = JSON.parse(localStorage.getItem("deletedChatMessagesContent") || "[]");
  const filteredItems = storedItems.filter((id) => currentIds.has(id));

  localStorage.setItem("deletedChatMessagesContent", JSON.stringify(filteredItems));

  // Remove the toggle button if no items remain
  if (filteredItems.length === 0) {
    const toggleBtn = document.querySelector(".toggle-button");
    if (toggleBtn) {
      toggleBtn.remove();
    }
  }
}
