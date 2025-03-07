import { emojiData, emojiKeywords } from '../data/emojiData.js';

export class EmojiPanel {

  constructor(options = {}) {
    // DOM elements
    this.container = null;
    this.searchInput = null;
    this.emojiContainer = null;
    this.categoryNav = null;
    this.infoPanel = null;
    this.infoIcon = null;
    this.infoKeywords = null;
    this.languageSelect = null;

    // Configuration options
    this.options = {
      onEmojiSelect: options.onEmojiSelect || (() => { }),
      container: options.container || document.body,
      position: options.position || 'bottom'
    };

    // Category definitions with icons
    this.categories = {
      recent: { icon: '🕒' },
      smileys: { icon: '😊' },
      nature: { icon: '🦊' },
      food: { icon: '🍔' },
      activities: { icon: '⚽' },
      travel: { icon: '✈️' },
      objects: { icon: '💡' },
      symbols: { icon: '💕' },
      flags: { icon: '🎌' }
    };

    // Localized category names
    this.categoryLabels = {
      en: {
        recent: 'Recently Used',
        smileys: 'Smileys & People',
        nature: 'Animals & Nature',
        food: 'Food & Drink',
        activities: 'Activities',
        travel: 'Travel & Places',
        objects: 'Objects',
        symbols: 'Symbols',
        flags: 'Flags'
      },
      ru: {
        recent: 'Недавно использованные',
        smileys: 'Смайлы и люди',
        nature: 'Животные и природа',
        food: 'Еда и напитки',
        activities: 'Активности',
        travel: 'Путешествия и места',
        objects: 'Объекты',
        symbols: 'Символы',
        flags: 'Флаги'
      }
    };

    // UI Labels for static text elements
    this.uiLabels = {
      en: {
        searchResults: 'Search Results'
      },
      ru: {
        searchResults: 'Результаты поиска'
      }
    };

    // Emoji data and keywords
    this.emojiData = emojiData;
    this.emojiKeywords = emojiKeywords;

    // Recently used emojis (loaded from localStorage)
    this.recentEmojis = this.loadRecentEmojis();

    // Infinite scroll settings
    this.batchSize = 50;
    this.loadedIndices = {};
    this.categorySections = {};

    // Retrieve current language from localStorage (default to 'en')
    this.currentLanguage = localStorage.getItem('emojiPanelLanguage') || 'en';
  }

  /**
   * Initialize the emoji panel
   * @returns {EmojiPanel} The instance for chaining
   */
  init() {
    this.createPanel();
    this.bindEvents();
    this.loadAllEmojis();
    return this;
  }

  /**
   * Create the HTML structure of the emoji panel
   */
  createPanel() {
    this.container = document.createElement('div');
    this.container.className = 'emoji-panel';

    // Search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'emoji-search-container';
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'search';
    this.searchInput.className = 'emoji-search';
    searchContainer.appendChild(this.searchInput);

    // Category navigation
    this.categoryNav = document.createElement('div');
    this.categoryNav.className = 'emoji-categories';
    Object.entries(this.categories).forEach(([key, category]) => {
      const categoryBtn = document.createElement('button');
      categoryBtn.className = 'emoji-category-btn';
      categoryBtn.dataset.category = key;
      categoryBtn.innerHTML = category.icon;
      categoryBtn.title = this.getLocalizedCategoryName(key);
      this.categoryNav.appendChild(categoryBtn);
    });

    // Emoji grid container
    this.emojiContainer = document.createElement('div');
    this.emojiContainer.className = 'emoji-container';

    // Info panel
    this.infoPanel = document.createElement('div');
    this.infoPanel.className = 'emoji-info-panel';
    this.infoIcon = document.createElement('span');
    this.infoIcon.className = 'emoji-info-icon';
    this.infoKeywords = document.createElement('span');
    this.infoKeywords.className = 'emoji-info-keywords';
    this.infoPanel.appendChild(this.infoIcon);
    this.infoPanel.appendChild(this.infoKeywords);

    // Language selector
    this.languageSelect = document.createElement('select');
    this.languageSelect.className = 'emoji-language-select';
    this.languageSelect.innerHTML = `
      <option value="en">EN</option>
      <option value="ru">RU</option>
    `;
    this.languageSelect.value = this.currentLanguage;

    // Footer to hold info panel and language selector
    const footer = document.createElement('div');
    footer.className = 'emoji-footer';
    footer.appendChild(this.infoPanel);
    footer.appendChild(this.languageSelect);

    // Assemble the panel
    this.container.appendChild(searchContainer);
    this.container.appendChild(this.categoryNav);
    this.container.appendChild(this.emojiContainer);
    this.container.appendChild(footer);
    this.options.container.appendChild(this.container);
    this.searchInput.focus();
  }

  /**
   * Load initial batch of emojis for all categories
   */
  loadAllEmojis() {
    this.emojiContainer.innerHTML = '';
    this.loadedIndices = {};
    this.categorySections = {};
    Object.keys(this.categories).forEach(category => {
      const section = document.createElement('div');
      section.className = 'emoji-category-section';
      section.id = `emoji-section-${category}`;

      const header = document.createElement('div');
      header.className = 'emoji-category-header';
      header.textContent = this.getLocalizedCategoryName(category);
      section.appendChild(header);

      const emojiList = document.createElement('div');
      emojiList.className = 'emoji-list';
      section.appendChild(emojiList);

      this.emojiContainer.appendChild(section);
      this.loadedIndices[category] = 0;
      this.categorySections[category] = { section, emojiList, header };
      this.loadMoreEmojisForCategory(category);
    });
  }

  /**
   * Load more emojis for a specific category (infinite scroll)
   * @param {string} category - The category key
   */
  loadMoreEmojisForCategory(category) {
    const data = category === 'recent' ? this.recentEmojis : (this.emojiData[category] || []);
    const start = this.loadedIndices[category];
    const batch = data.slice(start, start + this.batchSize);
    if (!batch.length) return;

    const container = this.categorySections[category].emojiList;
    batch.forEach(emoji => {
      const button = document.createElement('button');
      button.className = 'emoji-btn';
      button.textContent = emoji;
      button.addEventListener('mouseenter', () => this.updateInfoPanel(emoji));
      button.addEventListener('mouseleave', () => this.clearInfoPanel());

      button.addEventListener('click', (e) => {
        e.stopPropagation();

        if (e.shiftKey && category === 'recent') {
          e.preventDefault();
          this.removeFromRecent(emoji);
        } else {
          this.addToRecent(emoji);
          this.options.onEmojiSelect(emoji);

          // Only hide if Ctrl is not pressed
          if (e.ctrlKey) {
            this.show();
            this.searchInput.focus();
          } else {
            this.hide();
          }
        }
      });

      container.appendChild(button);
    });

    this.loadedIndices[category] += batch.length;
  }

  /**
   * Search for emojis based on the search term
   * @param {string} searchTerm - The term to search for
   */
  searchEmojis(searchTerm) {
    this.emojiContainer.innerHTML = '';
    const section = document.createElement('div');
    section.className = 'emoji-category-section';
    const header = document.createElement('div');
    header.className = 'emoji-category-header';
    header.textContent = this.uiLabels[this.currentLanguage].searchResults;
    section.appendChild(header);

    const emojiList = document.createElement('div');
    emojiList.className = 'emoji-list';
    section.appendChild(emojiList);

    const results = [];
    Object.keys(this.emojiData).forEach(category => {
      const emojis = this.emojiData[category] || [];
      emojis.forEach(emoji => {
        const keywordsObj = this.emojiKeywords[emoji] || {};
        const allKeywords = Object.values(keywordsObj).flat();
        if (
          emoji.includes(searchTerm) ||
          allKeywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
        ) {
          results.push(emoji);
        }
      });
    });

    results.forEach(emoji => {
      const button = document.createElement('button');
      button.className = 'emoji-btn';
      button.textContent = emoji;
      button.addEventListener('mouseenter', () => this.updateInfoPanel(emoji));
      button.addEventListener('mouseleave', () => this.clearInfoPanel());

      button.addEventListener('click', (e) => {
        e.stopPropagation();

        this.addToRecent(emoji);
        this.options.onEmojiSelect(emoji);

        // Only hide if Ctrl is not pressed
        if (e.ctrlKey) {
          this.show();
          this.searchInput.focus();
        } else {
          this.hide();
        }
      });

      emojiList.appendChild(button);
    });

    this.emojiContainer.appendChild(section);
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Hide panel on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.container.classList.contains('visible')) {
        this.hide();
      }
    });

    // Open panel with Ctrl + Semicolon
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.code === 'Semicolon') {
        e.preventDefault();
        if (!this.container.classList.contains('visible')) {
          this.show();
        }
      }
    });

    // Search input with class management
    this.searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim().toLowerCase();
      if (searchTerm) {
        this.searchEmojis(searchTerm);
        this.emojiContainer.classList.add('search-active');
      } else {
        this.loadAllEmojis();
        this.emojiContainer.classList.remove('search-active');
      }
    });

    // Enter key to select first search result
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.emojiContainer.classList.contains('search-active')) {
          const firstEmojiBtn = this.emojiContainer.querySelector('.emoji-btn');
          if (firstEmojiBtn) {
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              ctrlKey: e.ctrlKey // Pass Ctrl key state
            });
            firstEmojiBtn.dispatchEvent(clickEvent);

            // Clear search input
            this.searchInput.value = '';
            this.loadAllEmojis();
            this.emojiContainer.classList.remove('search-active');

            // Only hide panel if Ctrl is not pressed
            if (e.ctrlKey) {
              this.show();
              this.searchInput.focus();
            } else {
              this.hide();
            }
          }
        }
      }
    });

    // Category navigation clicks
    this.categoryNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.emoji-category-btn');
      if (btn) {
        const category = btn.dataset.category;
        const section = document.getElementById(`emoji-section-${category}`);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    // Infinite scroll
    this.emojiContainer.addEventListener('scroll', () => this.handleScroll());

    // Language change
    this.languageSelect.addEventListener('change', (e) => {
      this.currentLanguage = e.target.value;
      localStorage.setItem('emojiPanelLanguage', this.currentLanguage);
      const currentEmoji = this.infoIcon.textContent;
      if (currentEmoji) {
        this.updateInfoPanel(currentEmoji);
      }
      this.updateCategoryLabels();
      if (this.searchInput.value.trim()) {
        this.searchEmojis(this.searchInput.value.trim().toLowerCase());
      }
    });

    // Prevent closing when clicking inside panel
    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Handle scroll events for infinite scrolling and category highlighting
   */
  handleScroll() {
    Object.keys(this.categorySections).forEach(category => {
      const { section } = this.categorySections[category];
      const sectionRect = section.getBoundingClientRect();
      const containerRect = this.emojiContainer.getBoundingClientRect();
      if (sectionRect.bottom < containerRect.bottom + 100) {
        this.loadMoreEmojisForCategory(category);
      }
    });

    let activeCategory = null;
    let minDistance = Infinity;
    Object.keys(this.categorySections).forEach(category => {
      const headerRect = this.categorySections[category].header.getBoundingClientRect();
      const containerRect = this.emojiContainer.getBoundingClientRect();
      const distance = Math.abs(headerRect.top - containerRect.top);
      if (headerRect.top <= containerRect.top + 10 && distance < minDistance) {
        minDistance = distance;
        activeCategory = category;
      }
    });

    if (activeCategory) {
      this.highlightCategory(activeCategory);
    }
  }

  /**
   * Update category labels based on current language
   */
  updateCategoryLabels() {
    Object.keys(this.categories).forEach(category => {
      const localizedName = this.getLocalizedCategoryName(category);
      const btn = this.categoryNav.querySelector(`[data-category="${category}"]`);
      if (btn) btn.title = localizedName;
      if (this.categorySections[category] && this.categorySections[category].header) {
        this.categorySections[category].header.textContent = localizedName;
      }
    });
  }

  /**
   * Update the info panel with emoji and keywords
   * @param {string} emoji - The emoji to display
   */
  updateInfoPanel(emoji) {
    this.infoIcon.textContent = emoji;
    const keywordsObj = this.emojiKeywords[emoji] || {};
    const keywords = keywordsObj[this.currentLanguage] || [];
    this.infoKeywords.textContent = keywords.join(', ');
  }

  /**
   * Clear the info panel
   */
  clearInfoPanel() {
    this.infoIcon.textContent = '';
    this.infoKeywords.textContent = '';
  }

  /**
   * Add an emoji to the recent list and refresh the recent section
   * @param {string} emoji - The emoji to add
   */
  addToRecent(emoji) {
    this.recentEmojis = [
      emoji,
      ...this.recentEmojis.filter(e => e !== emoji)
    ].slice(0, 25);
    this.saveRecentEmojis();
    if (this.categorySections['recent']) {
      const recentList = this.categorySections['recent'].emojiList;
      recentList.innerHTML = '';
      this.loadedIndices['recent'] = 0;
      this.loadMoreEmojisForCategory('recent');
    }
  }

  /**
   * Remove an emoji from the recent list and refresh the recent section
   * @param {string} emoji - The emoji to remove
   */
  removeFromRecent(emoji) {
    this.recentEmojis = this.recentEmojis.filter(e => e !== emoji);
    this.saveRecentEmojis();
    if (this.categorySections['recent']) {
      const recentList = this.categorySections['recent'].emojiList;
      recentList.innerHTML = '';
      this.loadedIndices['recent'] = 0;
      this.loadMoreEmojisForCategory('recent');
    }
  }

  /**
   * Load recent emojis from localStorage
   * @returns {string[]} Array of recent emojis
   */
  loadRecentEmojis() {
    try {
      return JSON.parse(localStorage.getItem('recentEmojis')) || [];
    } catch {
      return [];
    }
  }

  /**
   * Save recent emojis to localStorage
   */
  saveRecentEmojis() {
    try {
      localStorage.setItem('recentEmojis', JSON.stringify(this.recentEmojis));
    } catch (e) {
      console.error('Failed to save recent emojis:', e);
    }
  }

  /**
   * Highlight the active category in the navigation
   * @param {string} categoryId - The category to highlight
   */
  highlightCategory(categoryId) {
    const buttons = this.categoryNav.querySelectorAll('.emoji-category-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === categoryId);
    });
  }

  /**
   * Show the emoji panel
   */
  show() {
    this.container.classList.add('visible');
    this.searchInput.focus();
  }

  /**
   * Hide the emoji panel
   */
  hide() {
    this.container.classList.remove('visible');
  }

  /**
   * Toggle the visibility of the emoji panel
   */
  toggle() {
    this.container.classList.toggle('visible');
  }

  /**
   * Get the localized name for a category
   * @param {string} categoryKey - The category key
   * @returns {string} The localized name
   */
  getLocalizedCategoryName(categoryKey) {
    return this.categoryLabels[this.currentLanguage][categoryKey] || categoryKey;
  }
}