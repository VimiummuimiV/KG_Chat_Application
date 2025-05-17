import { eventsColorMap } from "../data/definitions.js";
import { adjustVisibility } from "../helpers/helpers.js";

const EVENTS_STORAGE_KEY = 'chatEvents';
const LAST_VIEWED_KEY = 'lastViewedEventTime';

// Retrieve events from localStorage for the current day
export function getSavedEvents() {
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!stored) return [];

    const eventsData = JSON.parse(stored);
    const today = new Date().toDateString();

    // Check if the stored events are from today
    if (eventsData.date === today) {
      return eventsData.events || [];
    } else {
      // If events are from a different day, clear them and start fresh
      console.log("🗃️ Events cache expired (new day), creating fresh cache");
      localStorage.removeItem(EVENTS_STORAGE_KEY);
      return [];
    }
  } catch (error) {
    console.error("Error loading events:", error);
    return [];
  }
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
  const events = getSavedEvents();
  events.push({ ...event, date: new Date().toISOString() });

  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify({
      date: new Date().toDateString(),
      events: events
    }));
    toggleEventsNotification(true); // Highlight the button if new events are added
  } catch (error) {
    console.error("Error saving events:", error);
  }
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
    header.textContent = 'Events Panel';
    this.panel.appendChild(header);
    this.panel.appendChild(this.eventsList);

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

    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTimestamp(event.date);

    const message = document.createElement('span');
    message.className = 'message';
    message.textContent = event.message;

    listItem.style.backgroundColor = eventsColorMap[event.type] || eventsColorMap.info;
    listItem.append(timestamp, message);
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
    this.renderEvent({ message, type, date: new Date().toISOString() }, true);
    saveEvent({ message, type });
    this.scrollToBottom();
  }
}

export function createEventsPanel() {
  return new EventsPanel();
}
