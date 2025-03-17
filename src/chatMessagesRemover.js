import { checkIsMobile } from './helpers.js';

export default class ChatMessagesRemover {
  constructor() {
    this.selected = new Set();
    this.isDragging = false;
    this.toggleBtn = null;
    this.longPressTimer = null;
    this.longPressDuration = 500; // milliseconds for long press detection
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
    // Desktop right-click and selection
    document.addEventListener("mousedown", (e) => {
      const msgEl = e.target.closest(".messages-panel .message");
      if (!msgEl) return;

      if (e.button === 2 && msgEl) {
        // Handle selection based on where the right-click occurred
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
        e.preventDefault();
        this.showDeleteButton(e, msg);
      }
    });

    // Mobile long press
    if (this.isMobile) {
      document.addEventListener("touchstart", (e) => {
        const msgEl = e.target.closest(".messages-panel .message");
        if (!msgEl) return;
        
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        
        this.longPressTimer = setTimeout(() => {
          // Handle selection using the same logic as desktop
          this.handleSelection(e.target, msgEl, false);
          
          // Show delete button
          this.showDeleteButton({
            clientX: this.touchStartX,
            clientY: this.touchStartY,
            preventDefault: () => {}
          }, msgEl);
          
          // Provide vibration feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, this.longPressDuration);
      });

      document.addEventListener("touchmove", (e) => {
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
      });

      document.addEventListener("touchend", () => {
        if (this.longPressTimer) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      });
    }
  }

  // Unified selection handler for both desktop and mobile
  handleSelection(target, msgEl, isCtrlKey) {
    const timeEl = target.closest(".time");
    const usernameEl = target.closest(".username");
    
    if (timeEl) {
      this.handleTimeSelection(msgEl, isCtrlKey);
    } else if (usernameEl) {
      this.handleUsernameSelection(usernameEl);
    } else {
      // Default single-message selection
      this.isDragging = true;
      this.toggleSelect(msgEl, true, "message-mode");
    }
  }

  // Handle time-based selection
  handleTimeSelection(msgEl, isCtrlKey) {
    const messages = Array.from(
      document.querySelectorAll(".messages-panel .message")
    );
    const startIndex = messages.indexOf(msgEl);

    if (startIndex === -1) return;

    if (isCtrlKey) {
      // Select all messages from current downward (ignoring username)
      messages.slice(startIndex).forEach((m) => {
        this.toggleSelect(m, true, "time-mode");
        m.classList.add("time-mode");
      });
    } else {
      // Select only messages by the same user from current downward
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

  // Handle username-based selection
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

  // Handles selection with appropriate modes
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
    const existingBtn = document.querySelector(".delete-btn");
    if (existingBtn) existingBtn.remove();

    const btn = document.createElement("button");
    btn.className = "delete-btn";
    
    // Make button bigger on mobile for easier tapping
    if (this.isMobile) {
      btn.classList.add("mobile-delete-btn");
    }
    
    btn.textContent = "Delete";

    document.body.append(btn);
    const { offsetWidth: w, offsetHeight: h } = btn;
    btn.remove();

    Object.assign(btn.style, {
      position: "fixed",
      top: `${e.clientY - h / 2}px`,
      left: `${e.clientX - w / 2}px`,
    });

    btn.onclick = () => this.deleteSelectedMessages(btn);

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
          document.querySelectorAll(".messages-panel .message").forEach((msg) => {
            if (!msg) return;
            
            msg.classList.remove("hidden-message", "shown-message");
          });
          localStorage.setItem("deletedChatMessagesContent", JSON.stringify([]));
          this.selected.clear();
          this.updateDeletedMessages();
          this.renderToggle();
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

      messagesPanel.append(this.toggleBtn);
    }
  }
}

function getMessageId(el) {
  if (!el) return '';
  // If a unique ID has already been assigned, return it.
  if (el.dataset.messageId) return el.dataset.messageId;

  // Attempt to build an ID based on the element's children.
  let id = Array.from(el.childNodes)
    .map((n) => {
      if (!n) return ''; // Guard clause
      if (n.nodeType === Node.TEXT_NODE) return n.textContent.trim();
      if (n.classList?.contains("username")) return n.textContent.trim();
      if (n.tagName === "A") return n.href;
      if (n.tagName === "IMG") return n.title.trim();
      if (n.tagName === "IFRAME") return n.src.trim();
      return "";
    })
    .join("");

  // If no ID could be built, generate a compact unique fallback ID.
  if (!id) {
    id = 'msg-' + Math.random().toString(36).substring(2, 7);
  }
  // Save the unique ID on the element so it remains consistent.
  el.dataset.messageId = id;
  return id;
}

// Cleanup deleted messages list
export function pruneDeletedMessages() {
  const messages = document.querySelectorAll(".messages-panel .message");
  if (messages.length === 0) return; // Skip if no messages found
  
  const currentIds = new Set(
    Array.from(messages).map((msg) => getMessageId(msg))
  );
  
  const stored = new Set(
    JSON.parse(localStorage.getItem("deletedChatMessagesContent") || "[]")
  );
  
  localStorage.setItem(
    "deletedChatMessagesContent", 
    JSON.stringify([...stored].filter((id) => currentIds.has(id)))
  );
}