import { eventsColorMap } from "../data/definitions.js";
import { adjustVisibility, logMessage } from "../helpers/helpers.js";
import { addShakeEffect } from "../data/animations.js";
import { infoSVG, warningSVG, errorSVG, successSVG, clearSVG, removeSVG } from "../data/icons.js";

const EVENTS_STORAGE_KEY = 'chatEvents';
const LAST_VIEWED_KEY = 'lastViewedEventTime';

// Events cache refresh system (like avatar refresh)
function loadEventsCache() {
  try {
    const cacheData = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (cacheData) {
      const cache = JSON.parse(cacheData);
      if (cache.date === new Date().toDateString()) {
        return cache.events || [];
      } else {
        // Set localSorage to empty array if the date doesn't match
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify({
          date: new Date().toDateString(),
          events: []
        }));
        logMessage({
          en: "Events cache expired, creating fresh cache.",
          ru: "Кэш событий устарел, создается новый."
        }, 'info');
      }
    }
  } catch (error) {
    logMessage({
      en: "Error loading events cache, creating fresh cache.",
      ru: "Ошибка загрузки кэша событий, создается новый."
    }, 'error');
  }
  return [];
}

function saveEventsCache(events) {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify({
      date: new Date().toDateString(),
      events: events
    }));
  } catch (error) {
    logMessage({
      en: "Error saving events cache.",
      ru: "Ошибка сохранения кэша событий."
    }, 'error');
  }
}

// Retrieve events from localStorage for the current day
export function getSavedEvents() {
  return loadEventsCache();
}

// Handle events notification state
function toggleEventsNotification(highlight = true) {
  const eventsButton = document.querySelector('.chat-events-button');
  if (eventsButton) {
    eventsButton.classList.toggle('new-events', highlight);
  }
}

// Save an event to localStorage
export function saveEvent(event) {
  const events = loadEventsCache();
  events.push({ ...event, date: new Date().toISOString() });
  saveEventsCache(events);
  toggleEventsNotification(true); // Highlight the button if new events are added
}

// Format timestamp
function formatTimestamp(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export class EventsPanel {
  static instance = null;

  constructor() {
    if (EventsPanel.instance) {
      // If there's an existing instance but it's not in the DOM, recreate it
      if (!EventsPanel.instance.panel.parentNode) {
        EventsPanel.instance = null;
      } else {
        return EventsPanel.instance;
      }
    }

    EventsPanel.instance = this;

    this.panel = document.createElement('div');
    this.panel.className = 'events-panel';

    this.eventsList = document.createElement('div');
    this.eventsList.className = 'events-list';

    this.init();
    this.show();
  }

  init() {
    const header = document.createElement('h2');
    header.textContent = 'Events';
    this.panel.appendChild(header);
    this.panel.appendChild(this.eventsList);

    // Create clear button
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-btn';
    clearButton.innerHTML = clearSVG;
    clearButton.title = 'Clear all events';
    clearButton.addEventListener('click', () => {
      const events = getSavedEvents();
      if (events.length === 0) return; // Do nothing if no events exist

      localStorage.removeItem(EVENTS_STORAGE_KEY);
      this.hide(); // Close the panel
    });
    this.panel.appendChild(clearButton);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-btn';
    closeButton.innerHTML = removeSVG;
    closeButton.title = 'Close panel';
    closeButton.addEventListener('click', () => {
      this.hide();
    });
    this.panel.appendChild(closeButton);

    // Load saved events for the current day
    const events = getSavedEvents();
    const lastViewed = localStorage.getItem(LAST_VIEWED_KEY) || '0';

    if (events && events.length > 0) {
      events.forEach(event => {
        const isNew = new Date(event.date).getTime() > parseInt(lastViewed);
        this.renderEvent(event, isNew);
      });
    }

    // Scroll to bottom after rendering events
    this.scrollToBottom();

    // Setup event handlers
    this.setupEventListeners();
  }

  renderEvent(event, isNew = false) {
    const listItem = document.createElement('div');
    listItem.className = `list-item ${isNew ? 'new-event' : 'old-event'}`;

    const iconWrapper = document.createElement('span');
    iconWrapper.className = "event-icon icon-wrapper";
    let iconSVG;
    switch (event.type) {
      case 'warning':
        iconSVG = warningSVG;
        break;
      case 'error':
        iconSVG = errorSVG;
        break;
      case 'success':
        iconSVG = successSVG;
        break;
      case 'info':
      default:
        iconSVG = infoSVG;
        break;
    }

    // Apply stroke color from eventsColorMap
    const typeColor = eventsColorMap[event.type] || eventsColorMap.info;
    iconWrapper.innerHTML = iconSVG.replace('stroke="currentColor"', `stroke="${typeColor}"`);

    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTimestamp(event.date);
    timestamp.style.color = typeColor;

    const message = document.createElement('span');
    message.className = 'message';
    message.textContent = event.message;

    listItem.style.backgroundColor = eventsColorMap[event.type] || eventsColorMap.info;
    listItem.append(iconWrapper, timestamp, message);
    this.eventsList.appendChild(listItem);
  }

  setupEventListeners() {
    // Handle ESC key
    this.handleEscape = (event) => {
      if (event.key === 'Escape') {
        this.hide();
      }
    };

    // Handle click outside
    this.handleClickOutside = (event) => {
      if (!this.panel.contains(event.target)) {
        this.hide();
      }
    };

    // Delegate click events on list-item elements
    this.eventsList.addEventListener('click', (event) => {
      const listItem = event.target.closest('.list-item');
      if (listItem) {
        const messageElement = listItem.querySelector('.message');
        if (messageElement) {
          navigator.clipboard.writeText(messageElement.textContent).then(() => {
            addShakeEffect(listItem);
          }).catch((error) => {
            logMessage(`Failed to copy event message: ${error.message}`, 'error');
          });
        }
      }
    });

    document.addEventListener('keydown', this.handleEscape);
    document.addEventListener('click', this.handleClickOutside, true);
  }

  // Helper method to scroll to bottom
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.eventsList.scrollTop = this.eventsList.scrollHeight;
    });
  }

  show() {
    const events = getSavedEvents();
    if (!events || events.length === 0) return; // Do nothing if no events exist

    document.body.appendChild(this.panel);
    adjustVisibility(this.panel, 'show', 1);
    toggleEventsNotification(false); // Remove highlight when panel is shown
    localStorage.setItem(LAST_VIEWED_KEY, new Date().getTime().toString());
    this.scrollToBottom();
  }

  hide() {
    adjustVisibility(this.panel, 'hide', 0);
    document.removeEventListener('keydown', this.handleEscape);
    document.removeEventListener('click', this.handleClickOutside, true);

    setTimeout(() => {
      if (this.panel.parentNode) {
        this.panel.parentNode.removeChild(this.panel);
      }
    }, 300);
  }

  addEvent(message, type = 'info') {
    const newEvent = { message, type, date: new Date().toISOString() };
    this.renderEvent(newEvent, true);
    saveEvent(newEvent);
    this.scrollToBottom();
  }
}

export function createEventsPanel() {
  return new EventsPanel();
}