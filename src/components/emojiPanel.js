import { emojiData, emojiKeywords } from '../data/emojiData.js';

export class EmojiPanel {
  constructor(options = {}) {
    this.container = null;
    this.searchInput = null;
    this.emojiContainer = null;
    this.categoryNav = null;
    this.options = {
      onEmojiSelect: options.onEmojiSelect || (() => {}),
      container: options.container || document.body,
      position: options.position || 'bottom'
    };

    this.categories = {
      recent: { name: 'Recently Used', icon: '🕒' },
      smileys: { name: 'Smileys & People', icon: '😊' },
      nature: { name: 'Animals & Nature', icon: '🦊' },
      food: { name: 'Food & Drink', icon: '🍔' },
      activities: { name: 'Activities', icon: '⚽' },
      travel: { name: 'Travel & Places', icon: '✈️' },
      objects: { name: 'Objects', icon: '💡' },
      symbols: { name: 'Symbols', icon: '💕' },
      flags: { name: 'Flags', icon: '🎌' }
    };

    // Add emojiData and emojiKeywords as class properties
    this.emojiData = emojiData;
    this.emojiKeywords = emojiKeywords;

    // Initialize storage for recently used emojis
    this.recentEmojis = this.loadRecentEmojis();

    // For infinite scroll – batch size and tracking per category
    this.batchSize = 50;
    this.loadedIndices = {}; // e.g. { smileys: 0, nature: 0, ... }
    this.categorySections = {}; // store section elements per category
  }

  init() {
    this.createPanel();
    this.bindEvents();
    // Load all categories (each will load its first batch)
    this.loadAllEmojis();
    return this;
  }

  createPanel() {
    this.container = document.createElement('div');
    this.container.className = 'emoji-panel';

    // Create search section
    const searchContainer = document.createElement('div');
    searchContainer.className = 'emoji-search-container';
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'search';
    this.searchInput.className = 'emoji-search';
    searchContainer.appendChild(this.searchInput);

    // Create category navigation (the buttons now scroll to sections)
    this.categoryNav = document.createElement('div');
    this.categoryNav.className = 'emoji-categories';
    Object.entries(this.categories).forEach(([key, category]) => {
      const categoryBtn = document.createElement('button');
      categoryBtn.className = 'emoji-category-btn';
      categoryBtn.dataset.category = key;
      categoryBtn.innerHTML = category.icon;
      categoryBtn.title = category.name;
      this.categoryNav.appendChild(categoryBtn);
    });

    // Create emoji container (will hold all category sections)
    this.emojiContainer = document.createElement('div');
    this.emojiContainer.className = 'emoji-container';

    // Create the info panel at the bottom (fixed at 50px height)
    this.infoPanel = document.createElement('div');
    this.infoPanel.className = 'emoji-info-panel';
    this.infoIcon = document.createElement('span');
    this.infoIcon.className = 'emoji-info-icon';
    this.infoKeywords = document.createElement('span');
    this.infoKeywords.className = 'emoji-info-keywords';
    this.infoPanel.appendChild(this.infoIcon);
    this.infoPanel.appendChild(this.infoKeywords);

    // Assemble panel
    this.container.appendChild(searchContainer);
    this.container.appendChild(this.categoryNav);
    this.container.appendChild(this.emojiContainer);
    this.container.appendChild(this.infoPanel);

    // Add to specified container
    this.options.container.appendChild(this.container);
  }

  loadAllEmojis() {
    // Clear previous content and reset indices
    this.emojiContainer.innerHTML = '';
    this.loadedIndices = {};
    this.categorySections = {};

    // Iterate over categories (all will be shown)
    Object.keys(this.categories).forEach(category => {
      // Create section for the category with sticky header
      const section = document.createElement('div');
      section.className = 'emoji-category-section';
      section.id = 'emoji-section-' + category;

      const header = document.createElement('div');
      header.className = 'emoji-category-header';
      header.textContent = this.categories[category].name;
      section.appendChild(header);

      // Create container for emoji buttons in this category
      const emojiList = document.createElement('div');
      emojiList.className = 'emoji-list';
      section.appendChild(emojiList);

      this.emojiContainer.appendChild(section);
      this.loadedIndices[category] = 0;
      this.categorySections[category] = { section, emojiList, header };

      // Load the initial batch for this category
      this.loadMoreEmojisForCategory(category);
    });
  }

  loadMoreEmojisForCategory(category) {
    // Use recently used emojis if category is "recent"
    const data =
      category === 'recent'
        ? this.recentEmojis
        : this.emojiData[category] || [];
    const start = this.loadedIndices[category];
    const batch = data.slice(start, start + this.batchSize);
    if (!batch.length) return; // no more emojis to load

    const container = this.categorySections[category].emojiList;
    batch.forEach(emoji => {
      const button = document.createElement('button');
      button.className = 'emoji-btn';
      button.textContent = emoji;
      // Update info panel on hover
      button.addEventListener('mouseenter', () => {
        this.updateInfoPanel(emoji);
      });
      button.addEventListener('mouseleave', () => {
        this.clearInfoPanel();
      });
      // Selection: add to recent and call callback
      button.addEventListener('click', () => {
        this.addToRecent(emoji);
        this.options.onEmojiSelect(emoji);
      });
      container.appendChild(button);
    });
    this.loadedIndices[category] += batch.length;
  }

  searchEmojis(searchTerm) {
    // Clear the emoji container and show a single "Search Results" section
    this.emojiContainer.innerHTML = '';
    const section = document.createElement('div');
    section.className = 'emoji-category-section';
    
    const header = document.createElement('div');
    header.className = 'emoji-category-header';
    header.textContent = 'Search Results';
    section.appendChild(header);
    
    const emojiList = document.createElement('div');
    emojiList.className = 'emoji-list';
    section.appendChild(emojiList);

    // Collect matching emojis from all categories in emojiData
    const results = [];
    Object.keys(this.emojiData).forEach(category => {
      const emojis = this.emojiData[category] || [];
      emojis.forEach(emoji => {
        const keywords = this.emojiKeywords[emoji] || [];
        if (
          emoji.includes(searchTerm) ||
          keywords.some(keyword => keyword.includes(searchTerm))
        ) {
          results.push(emoji);
        }
      });
    });
    // Optionally, you can also include recent emojis if desired.

    // Render search results
    results.forEach(emoji => {
      const button = document.createElement('button');
      button.className = 'emoji-btn';
      button.textContent = emoji;
      button.addEventListener('mouseenter', () => {
        this.updateInfoPanel(emoji);
      });
      button.addEventListener('mouseleave', () => {
        this.clearInfoPanel();
      });
      button.addEventListener('click', () => {
        this.addToRecent(emoji);
        this.options.onEmojiSelect(emoji);
      });
      emojiList.appendChild(button);
    });

    this.emojiContainer.appendChild(section);
  }

  bindEvents() {
    // ESC key handler to hide panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.container.classList.contains('visible')) {
        this.hide();
      }
    });

    // Search input listener
    this.searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim().toLowerCase();
      if (searchTerm) {
        this.searchEmojis(searchTerm);
      } else {
        // Reload full view when search input is cleared
        this.loadAllEmojis();
      }
    });

    // Category nav click: scroll smoothly to the category section
    this.categoryNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.emoji-category-btn');
      if (btn) {
        const category = btn.dataset.category;
        const section = document.getElementById('emoji-section-' + category);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    // Listen to scrolling to load more emojis and update active category
    this.emojiContainer.addEventListener('scroll', () => {
      this.handleScroll();
    });
  }

  handleScroll() {
    // For each category, if the bottom of its section is near the container’s bottom, load next batch
    Object.keys(this.categorySections).forEach(category => {
      const { section } = this.categorySections[category];
      const sectionRect = section.getBoundingClientRect();
      const containerRect = this.emojiContainer.getBoundingClientRect();
      if (sectionRect.bottom < containerRect.bottom + 100) {
        this.loadMoreEmojisForCategory(category);
      }
    });

    // Determine which category header is closest to the top of the emoji container
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

  updateInfoPanel(emoji) {
    this.infoIcon.textContent = emoji;
    const keywords = this.emojiKeywords[emoji] || [];
    this.infoKeywords.textContent = keywords.join(', ');
  }

  clearInfoPanel() {
    this.infoIcon.textContent = '';
    this.infoKeywords.textContent = '';
  }

  addToRecent(emoji) {
    this.recentEmojis = [
      emoji,
      ...this.recentEmojis.filter(e => e !== emoji)
    ].slice(0, 25); // keep only 25 most recent
    this.saveRecentEmojis();
  }

  loadRecentEmojis() {
    try {
      return JSON.parse(localStorage.getItem('recentEmojis')) || [];
    } catch {
      return [];
    }
  }

  saveRecentEmojis() {
    try {
      localStorage.setItem('recentEmojis', JSON.stringify(this.recentEmojis));
    } catch (e) {
      console.error('Failed to save recent emojis:', e);
    }
  }

  highlightCategory(categoryId) {
    const buttons = this.categoryNav.querySelectorAll('.emoji-category-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === categoryId);
    });
  }

  show() {
    this.container.classList.add('visible');
  }

  hide() {
    this.container.classList.remove('visible');
  }

  toggle() {
    this.container.classList.toggle('visible');
  }
}
