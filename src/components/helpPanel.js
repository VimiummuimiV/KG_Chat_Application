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
    // Build help content with specific header and subheader classes
    const content = document.createElement('div');
    content.className = 'help-content';
    content.innerHTML = `
      <h5 class="help-section-header">Chat Commands & Hotkeys</h5>

      <h6 class="help-section-subheader">Chat Commands</h6>
      <ul class="help-list">
      <li class="help-list-item"><strong class="help-hotkey">/help</strong> Show this help panel</li>
      <li class="help-list-item"><strong class="help-hotkey">/pm username</strong> Activate private messaging mode with the specified user</li>
      <li class="help-list-item"><strong class="help-hotkey">/exit</strong> Exit private messaging mode</li>
      </ul>

      <h6 class="help-section-subheader">Chat Hotkeys</h6>
      <ul class="help-list">
      <li class="help-list-item"><strong class="help-hotkey">Ctrl + Space</strong> Hide the chat</li>
      <li class="help-list-item"><strong class="help-hotkey">Shift + Ctrl + Space</strong> Expand/Collapse the chat</li>
      <li class="help-list-item"><strong class="help-hotkey">Ctrl + Click on username</strong> Activate private messaging mode with the clicked user (in chat messages)</li>
      </ul>


      <h5 class="help-section-header">Emoji Panel Actions & Hotkeys</h5> 

      <h6 class="help-section-subheader">Emoji Panel Actions</h6>
      <ul class="help-list">
      <li class="help-list-item"><strong class="help-hotkey">Click an emoji</strong> Selects the emoji</li>
      <li class="help-list-item"><strong class="help-hotkey">Click outside panel</strong> Closes the panel (emoji or help)</li>
      </ul>

      <h6 class="help-section-subheader">Emoji Panel Hotkeys</h6>
      <ul class="help-list">
      <li class="help-list-item"><strong class="help-hotkey">Ctrl + ;</strong> Open the Emoji Panel</li>
      <li class="help-list-item"><strong class="help-hotkey">Enter</strong> Insert the emoji</li>
      <li class="help-list-item"><strong class="help-hotkey">Ctrl + Enter</strong> Insert the emoji keeping the panel open</li>
      <li class="help-list-item"><strong class="help-hotkey">Ctrl + Click</strong> Insert the emoji keeping the panel open</li>
      <li class="help-list-item"><strong class="help-hotkey">Shift + Click</strong> Remove emoji from recent list (in recent category)</li>
      <li class="help-list-item"><strong class="help-hotkey">q</strong> Hide the Emoji Panel (single press when search is not focused)</li>
      <li class="help-list-item"><strong class="help-hotkey">qq</strong> Hide the Emoji Panel (double press within 500ms when search is focused)</li>
      <li class="help-list-item"><strong class="help-hotkey">Esc</strong> Close the (emoji or help)</li>
      </ul>
    `;
    this.container.appendChild(content);
    // Append the help panel inside the messages-panel container
    if (this.options.container) {
      this.options.container.appendChild(this.container);
    }
    // Initially hidden
    this.hide();
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