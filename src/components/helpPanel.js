import { showChatAlert } from "../helpers.js";

class HelpPanel {
  constructor(options = {}) {
    this.container = null;
    this.options = {
      container: options.container || document.getElementById("messages-panel"),
    };
  }
  init() {
    this.createPanel();
    this.bindEvents();
    this.bindInputEvents(); // Existing binding (can be kept if desired)
    return this;
  }
  createPanel() {
    this.container = document.createElement('div');
    this.container.className = 'emoji-panel help-panel';

    // Create and save the content element for later updates.
    this.content = document.createElement('div');
    this.content.className = 'help-content';
    // Initialize content for the first time.
    this.updatePanelContent();
    this.container.appendChild(this.content);

    if (this.options.container) {
      this.options.container.appendChild(this.container);
    }
    this.hide();
  }
  updatePanelContent() {
    // Retrieve current language from localStorage
    const lang = localStorage.getItem('emojiPanelLanguage') || 'en';
    const helpTranslations = {
      en: {
        heading: "Chat Commands & Hotkeys",
        sections: [
          {
            title: "Chat Commands",
            items: [
              { key: "/help", desc: "Show this help panel" },
              { key: "/pm username", desc: "Activate private messaging mode with the specified user" },
              { key: "/exit", desc: "Exit private messaging mode" }
            ]
          },
          {
            title: "Chat Hotkeys",
            items: [
              { key: "Ctrl + Space", desc: "Hide/Show the chat" },
              { key: "Shift + Ctrl + Space", desc: "Expand/Collapse the chat" },
              { key: "Ctrl + Click on username", desc: "Activate private messaging mode with the clicked user (in chat messages)" }
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
                  { key: "Esc", desc: "Close the (emoji or help)" }
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
              { key: "/pm username", desc: "Активировать режим личных сообщений для указанного пользователя" },
              { key: "/exit", desc: "Выйти из режима личных сообщений" }
            ]
          },
          {
            title: "Горячие клавиши чата",
            items: [
              { key: "Ctrl + Space", desc: "Скрыть/Показать чат" },
              { key: "Shift + Ctrl + Space", desc: "Развернуть/Свернуть чат" },
              { key: "Ctrl + Click on username", desc: "Активировать режим личных сообщений для выбранного пользователя (в сообщениях чата)" }
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
    // Global click to close help panel
    this._globalClickHandler = () => { this.hide(); };
    document.addEventListener('click', this._globalClickHandler);

    // Prevent propagation inside panel
    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Global keydown to close help panel (on ESC key)
    this._globalKeydownHandler = (e) => {
      if (e.key === 'Escape' && this.container.classList.contains('visible')) {
        this.hide();
      }
    };
    document.addEventListener('keydown', this._globalKeydownHandler);
  }
  // Existing input binding (optional, can be removed if using the static version)
  bindInputEvents() {
    const input = document.getElementById('message-input');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (input.value.trim() === "/help" && e.code === 'Space') {
        e.preventDefault();
        this.activate();
        input.value = "";
      }
    });
  }
  show() {
    this.container.classList.add('visible');
    // Rebind global events if missing
    if (!this._globalClickHandler) {
      this._globalClickHandler = () => { this.hide(); };
      document.addEventListener('click', this._globalClickHandler);
    }
    if (!this._globalKeydownHandler) {
      this._globalKeydownHandler = (e) => {
        if (e.key === 'Escape' && this.container.classList.contains('visible')) {
          this.hide();
        }
      };
      document.addEventListener('keydown', this._globalKeydownHandler);
    }
  }
  hide() {
    // Remove global listeners and clear references
    document.removeEventListener('click', this._globalClickHandler);
    document.removeEventListener('keydown', this._globalKeydownHandler);
    this._globalClickHandler = null;
    this._globalKeydownHandler = null;
    this.container.classList.remove('visible');
  }
  // New method to activate the help panel with notification
  activate() {
    // Update the panel content based on the current language setting
    this.updatePanelContent();
    showChatAlert("Help panel is shown", { type: 'info', duration: 3000 });
    this.show();
  }
  // Static method to set up the /help command binding on the message input
  static setupHelpCommandEvents() {
    const helpPanelInstance = new HelpPanel({ container: document.getElementById("messages-panel") }).init();
    const input = document.getElementById('message-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        // If the input exactly equals "/help" (after trimming) and the key pressed is Space
        if (input.value.trim() === "/help" && e.code === 'Space') {
          e.preventDefault();
          helpPanelInstance.activate();
          input.value = "";
        }
      });
    }
    return helpPanelInstance;
  }
}
export { HelpPanel };
