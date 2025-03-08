import { showChatAlert } from "../helpers.js";
export class HelpPanel {
  constructor(options = {}) {
    this.container = null;
    this.options = {
      container: options.container || document.getElementById("messages-panel"),
      helpButton: options.helpButton,
      onDestroy: options.onDestroy
    };
    // Set the class instance to this
    HelpPanel.instance = this;
  }
  init() {
    this.createPanel();
    this.bindEvents();
    return this;
  }
  createPanel() {
    this.container = document.createElement('div');
    this.container.className = 'help-panel';
    this.content = document.createElement('div');
    this.content.className = 'help-content';
    this.updatePanelContent();
    this.container.appendChild(this.content);
    document.body.appendChild(this.container);
  }
  updatePanelContent() {
    const lang = localStorage.getItem('emojiPanelLanguage') || 'en';
    const helpTranslations = {
      en: {
        heading: "Chat Commands & Hotkeys",
        sections: [
          {
            title: "Chat Commands",
            items: [
              { key: "/help", desc: "Show this help panel" },
              { key: "/pm username", desc: "Activate private chat mode with the specified user" },
              { key: "/exit", desc: "Exit private chat mode" }
            ]
          },
          {
            title: "Chat Hotkeys",
            items: [
              { key: "Ctrl + Space", desc: "Hide/Show the chat" },
              { key: "Shift + Ctrl + Space", desc: "Expand/Collapse the chat" },
              { key: "Ctrl + Click", desc: "Activate private chat mode with the clicked user" }
            ]
          },
          {
            heading: "Emoji Panel Actions & Hotkeys",
            subSections: [
              {
                title: "Emoji Panel Actions",
                items: [
                  { key: "Click an emoji", desc: "Insert the emoji" },
                  { key: "Click outside panel", desc: "Closes the panel (emoji or help)" }
                ]
              },
              {
                title: "Emoji Panel Hotkeys",
                items: [
                  { key: "Ctrl + ;", desc: "Open the Emoji Panel" },
                  { key: "Enter", desc: "Insert the emoji" },
                  { key: "Ctrl + Enter", desc: "Insert the emoji keeping the panel open" },
                  { key: "Ctrl + Click", desc: "Insert the emoji keeping the panel open" },
                  { key: "Shift + Click", desc: "Remove emoji from recent list (in recent category)" },
                  { key: "q", desc: "Hide the Emoji Panel (single press when search is not focused)" },
                  { key: "qq", desc: "Hide the Emoji Panel (double press 'q' when search is focused)" },
                  { key: "Esc", desc: "Close the panel (emoji or help)" }
                ]
              }
            ]
          }
        ]
      },
      ru: {
        heading: "Команды чата и горячие клавиши",
        sections: [
          {
            title: "Команды чата",
            items: [
              { key: "/help", desc: "Показать панель помощи" },
              { key: "/pm username", desc: "Активировать приватный чат для указанного пользователя" },
              { key: "/exit", desc: "Выйти из приватного чата" }
            ]
          },
          {
            title: "Горячие клавиши чата",
            items: [
              { key: "Ctrl + Space", desc: "Скрыть/Показать чат" },
              { key: "Shift + Ctrl + Space", desc: "Развернуть/Свернуть чат" },
              { key: "Ctrl + Click", desc: "Активировать приватный чат для выбранного пользователя" }
            ]
          },
          {
            heading: "Действия и горячие клавиши панели эмодзи",
            subSections: [
              {
                title: "Действия панели эмодзи",
                items: [
                  { key: "Click an emoji", desc: "Вставить эмодзи" },
                  { key: "Click outside panel", desc: "Закрыть панель (эмодзи или помощь)" }
                ]
              },
              {
                title: "Горячие клавиши панели эмодзи",
                items: [
                  { key: "Ctrl + ;", desc: "Открыть панель эмодзи" },
                  { key: "Enter", desc: "Вставить эмодзи" },
                  { key: "Ctrl + Enter", desc: "Вставить эмодзи, оставив панель открытой" },
                  { key: "Ctrl + Click", desc: "Вставить эмодзи, оставив панель открытой" },
                  { key: "Shift + Click", desc: "Удалить эмодзи из списка \"Недавно использованные\"" },
                  { key: "q", desc: "Скрыть панель эмодзи (одиночный нажим, когда поиск не в фокусе)" },
                  { key: "qq", desc: "Скрыть панель эмодзи (дважды нажмите 'q', когда поиск в фокусе)" },
                  { key: "Esc", desc: "Закрыть (эмодзи или помощь)" }
                ]
              }
            ]
          }
        ]
      }
    };
    const t = helpTranslations[lang];
    let html = `<h5 class="help-section-header">${t.heading}</h5>`;
    t.sections.forEach(section => {
      if (section.title) {
        html += `<h6 class="help-section-subheader">${section.title}</h6>`;
      } else if (section.heading) {
        html += `<h5 class="help-section-header">${section.heading}</h5>`;
      }
      if (section.items) {
        html += `<ul class="help-list">`;
        section.items.forEach(item => {
          html += `<li class="help-list-item"><strong class="help-hotkey">${item.key}</strong> ${item.desc}</li>`;
        });
        html += `</ul>`;
      }
      if (section.subSections) {
        section.subSections.forEach(sub => {
          html += `<h6 class="help-section-subheader">${sub.title}</h6>`;
          html += `<ul class="help-list">`;
          sub.items.forEach(item => {
            html += `<li class="help-list-item"><strong class="help-hotkey">${item.key}</strong> ${item.desc}</li>`;
          });
          html += `</ul>`;
        });
      }
    });
    this.content.innerHTML = html;
  }
  bindEvents() {
    this._clickOutsideHandler = (e) => {
      // If the click is on (or within) the help button, do nothing.
      if (this.options.helpButton &&
        (e.target === this.options.helpButton || this.options.helpButton.contains(e.target))) {
        return;
      }
      // Otherwise, if the click occurred outside the help panel, remove it.
      if (this.container && !this.container.contains(e.target)) {
        this.remove();
      }
    };
    // Use capture phase so this handler runs before bubble-phase events.
    document.addEventListener('click', this._clickOutsideHandler, true);

    this._escHandler = (e) => {
      if (e.key === 'Escape') {
        this.remove();
      }
    };
    document.addEventListener('keydown', this._escHandler, true);

    // Prevent clicks inside the help panel from bubbling.
    this._stopPropagationHandler = (e) => {
      e.stopPropagation();
    };
    this.container.addEventListener('click', this._stopPropagationHandler);
  }
  remove() {
    // Remove all event listeners
    if (this._clickOutsideHandler) {
      document.removeEventListener('click', this._clickOutsideHandler, true);
      this._clickOutsideHandler = null;
    }
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler, true);
      this._escHandler = null;
    }
    if (this.container) {
      this.container.removeEventListener('click', this._stopPropagationHandler);
      this._stopPropagationHandler = null;
    }
    // Remove from DOM
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
    // Call destroy callback
    if (typeof this.options.onDestroy === 'function') {
      this.options.onDestroy();
    }
    // Reset static instance
    HelpPanel.instance = null;
  }
  show() {
    if (!this.container) {
      this.init();
    }
    this.updatePanelContent();
    if (!document.body.contains(this.container)) {
      document.body.appendChild(this.container);
      showChatAlert("Help panel is now visible."); // Only show alert when panel is actually added
    }
  }
  toggle() {
    if (this.container && document.body.contains(this.container)) {
      this.remove();
    } else {
      this.show();
    }
  }
  static setupHelpCommandEvents() {
    const input = document.getElementById('message-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (input.value.trim() === "/help" && e.code === 'Space') {
          e.preventDefault();
          if (!HelpPanel.instance) {
            const helpPanelInstance = new HelpPanel({
              onDestroy: () => {
                // This callback can be used if needed to update external state.
              }
            });
            helpPanelInstance.init();
            helpPanelInstance.show();
            showChatAlert("Help panel is now visible."); // Add alert when opening via command
          } else {
            HelpPanel.instance.remove();
          }
          input.value = "";
        }
      });
    }
    return HelpPanel.instance;
  }
}
// Static instance tracker
HelpPanel.instance = null;