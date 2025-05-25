import { removeSVG } from "../data/icons.js";
import { adjustVisibility } from "../helpers/helpers.js";
import { createCustomTooltip } from "../helpers/tooltip.js";

export class HelpPanel {
  constructor(options = {}) {
    this.container = null;
    this.options = {
      container: options.container || document.body,
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

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-btn';
    closeButton.innerHTML = removeSVG;
    createCustomTooltip(closeButton, {
      en: 'Close panel',
      ru: 'Закрыть панель'
    });
    closeButton.addEventListener('click', () => {
      this.remove();
    });
    this.container.appendChild(closeButton);

    document.body.appendChild(this.container);
    // Fade in the panel
    adjustVisibility(this.container, 'show', '1');
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
              { key: "/me message", desc: "Send an action message" },
              { key: "/pm username", desc: "Activate private chat mode with the specified user" },
              { key: "/exit", desc: "Exit private chat mode" },
              { key: "/reset", desc: "Reset the chat data" },
              { key: "/colors", desc: "Show the username color panel" },
              { key: "/import colors", desc: "Import user colors from a json file" },
              { key: "/export colors", desc: "Export user colors to a json file" },
              { key: "/ignored", desc: "Show the ignored users panel" },
              { key: "/themes", desc: "Show the themes panel" },
              { key: "/events", desc: "Show the events panel" },
              { key: "/list normal", desc: "User list: Normal mode (sorted by role, not by race count)" },
              { key: "/list race", desc: "User list: Users in a race at the top (sorted by race count)" },
              { key: "/list chat", desc: "User list: General chat users at the top, others (sorted by race count)" }
            ]
          },
          {
            title: "Chat Hotkeys",
            items: [
              { key: "Ctrl + Space", desc: "Hide/Show the chat" },
              { key: "Shift + Ctrl + Space", desc: "Expand/Collapse the chat" },
              { key: "Ctrl + Click", desc: "Activate private chat mode with the clicked user" },
              { key: "Hold (LMB)", desc: "Activate private chat mode with the clicked user (Userlist)" },
              { key: "Double Click (LMB)", desc: "Replace selected users with one in the input field (Messages)" },
              { key: "Shift + Click", desc: "Open the user profile by nickname in the message" }
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
          },

          {
            heading: "Image Manipulations",
            subSections: [
              {
                title: "Open/Close",
                items: [
                  { key: "(LMB) Click", desc: "Open the image" },
                  { key: "Ctrl + (RMB)", desc: "Close the image and copy the link" },
                  { key: "Space or ESC", desc: "Close the image" }
                ]
              },
              {
                title: "Movement and Scaling",
                items: [
                  { key: "Hold (MMB)", desc: "Drag the expanded image" },
                  { key: "Scroll (MMB)", desc: "Zoom in/out the image" },
                  { key: "Ctrl + (MMB)", desc: "Scale the image. Move the cursor up or down." }
                ]
              },
              {
                title: "Navigation",
                items: [
                  { key: "Arrow keys (< >)", desc: "Switch between images" },
                  { key: "(LMB), (RMB)", desc: "Switch between images" }
                ]
              }
            ]
          },

          {
            heading: "Markdown Formatting",
            items: [
              { key: "# Heading", desc: "Headings: use # for h1, ## for h2, up to ###### for h6" },
              { key: "`code`", desc: "Inline code" },
              { key: "**text**", desc: "Bold text" },
              { key: "__text__", desc: "Italic text" },
              { key: "~~text~~", desc: "Strikethrough text" }
            ]
          },

          {
            heading: "Delete / Show / Restore Messages",
            subSections: [
              {
                title: "Deletion",
                items: [
                  { key: "(RMB) + Message", desc: "Delete message" },
                  { key: "(RMB) + Nickname", desc: "Delete user's messages" },
                  { key: "(RMB) + Time", desc: "Delete his messages from the selected time" },
                  { key: "Ctrl + (RMB) + Time", desc: "Delete all messages from the selected time" }
                ]
              },
              {
                title: "Show / Restore",
                items: [
                  { key: "(LMB) + Toggle", desc: "Show/Hide messages" },
                  { key: "Ctrl + (LMB) + Toggle", desc: "Restore hidden messages" }
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
              { key: "/me сообщение", desc: "Отправить сообщение действия" },
              { key: "/pm username", desc: "Активировать приватный чат для указанного пользователя" },
              { key: "/exit", desc: "Выйти из приватного чата" },
              { key: "/reset", desc: "Сбросить данные чата" },
              { key: "/colors", desc: "Показать панель цветов имен пользователей" },
              { key: "/import colors", desc: "Импортировать цвета пользователей из json файла" },
              { key: "/export colors", desc: "Экспортировать цвета пользователей в json файл" },
              { key: "/ignored", desc: "Показать панель игнорируемых пользователей" },
              { key: "/themes", desc: "Показать панель тем" },
              { key: "/events", desc: "Показать панель событий" },
              { key: "/list normal", desc: "Список пользователей: Обычный режим (сортировка по роли, без сортировки по колличеству заездов)" },
              { key: "/list race", desc: "Список пользователей: Пользователи в игре сверху (сортировка по колличеству заездов)" },
              { key: "/list chat", desc: "Список пользователей: Пользователи общего чата сверху, остальные (сортированные по колличеству заездов)" }
            ]
          },
          {
            title: "Горячие клавиши чата",
            items: [
              { key: "Ctrl + Space", desc: "Скрыть/Показать чат" },
              { key: "Shift + Ctrl + Space", desc: "Развернуть/Свернуть чат" },
              { key: "Ctrl + Click", desc: "Активировать приватный чат для выбранного пользователя" },
              { key: "Удерживание (ЛКМ)", desc: "Активировать приватный чат для выбранного пользователя (Пользователи)" },
              { key: "Двойной клик (ЛКМ)", desc: "Замена выбранных пользователей одним в поле ввода (Сообщения)" },
              { key: "Shift + Click", desc: "Открыть профиль пользователя по никнейму в сообщении" }
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
          },

          {
            heading: "Манипуляции с изображением",
            subSections: [
              {
                title: "Открытие/Закрытие",
                items: [
                  { key: "(ЛКМ) Клик", desc: "Открыть изображение" },
                  { key: "Ctrl + (ПКМ)", desc: "Закрыть изображение и скопировать ссылку" },
                  { key: "Space или ESC", desc: "Закрыть изображение" }
                ]
              },
              {
                title: "Перемещение и масштабирование",
                items: [
                  { key: "Зажатая (СКМ)", desc: "Перемещайте развернутое изображение" },
                  { key: "Прокрутка (СКМ)", desc: "Увеличивайте/уменьшайте изображение" },
                  { key: "Ctrl + (СКМ)", desc: "Масштабируйте изображение. Курсор вверх или вниз." }
                ]
              },
              {
                title: "Навигация",
                items: [
                  { key: "Стрелки (< >)", desc: "Переключение между изображениями" },
                  { key: "(ЛКМ), (ПКМ)", desc: "Переключение между изображениями" }
                ]
              }
            ]
          },

          {
            heading: "Форматирование Markdown",
            items: [
              { key: "# Заголовок", desc: "Заголовки: используйте # для h1, ## для h2, до ###### для h6" },
              { key: "`код`", desc: "Встроенный код" },
              { key: "**текст**", desc: "Жирный текст" },
              { key: "__текст__", desc: "Курсивный текст" },
              { key: "~~текст~~", desc: "Зачёркнутый текст" }
            ]
          },

          {
            heading: "Удаление / Показ / Восстановление сообщений",
            subSections: [
              {
                title: "Удаление",
                items: [
                  { key: "(ПКМ) + Сообщение", desc: "Удалить сообщение" },
                  { key: "(ПКМ) + Никнейм", desc: "Удалить сообщения пользователя" },
                  { key: "(ПКМ) + Время", desc: "Удалить его сообщения с выбранного времени" },
                  { key: "Ctrl + (ПКМ) + Время", desc: "Удалить все сообщения с выбранного времени" }
                ]
              },
              {
                title: "Показ / Восстановление",
                items: [
                  { key: "(ЛКМ) + Toggle", desc: "Показать/Скрыть сообщения" },
                  { key: "Ctrl + (ЛКМ) + Toggle", desc: "Восстановить скрытые сообщения" },
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
      if (this.options.helpButton &&
        (e.target === this.options.helpButton || this.options.helpButton.contains(e.target))) {
        return;
      }
      if (this.container && !this.container.contains(e.target)) {
        this.remove();
      }
    };
    document.addEventListener('click', this._clickOutsideHandler, true);

    this._escHandler = (e) => {
      if (e.key === 'Escape') {
        this.remove();
      }
    };
    document.addEventListener('keydown', this._escHandler, true);

    this._stopPropagationHandler = (e) => {
      e.stopPropagation();
    };
    this.container.addEventListener('click', this._stopPropagationHandler);
  }

  remove() {
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
    if (this.container) {
      // Fade out the panel; the helper will remove the element after transition.
      adjustVisibility(this.container, 'hide', '0');
      this.container = null;
    }
    if (typeof this.options.onDestroy === 'function') {
      this.options.onDestroy();
    }
    HelpPanel.instance = null;
  }

  show() {
    if (!this.container) {
      this.init();
    } else {
      this.updatePanelContent();
    }
    if (!document.body.contains(this.container)) {
      document.body.appendChild(this.container);
      adjustVisibility(this.container, 'show', '1');
    }
  }

  toggle() {
    if (this.container && document.body.contains(this.container)) {
      this.remove();
    } else {
      this.show();
    }
  }
}

// Static instance tracker
HelpPanel.instance = null;
