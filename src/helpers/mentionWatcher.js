import { extractUsername, logMessage } from "./helpers.js";

export const notification = 'https://github.com/VimiummuimiV/KG_Chat_Application/raw/refs/heads/main/src/sounds/notification-pluck-on.mp3';
export const banned = 'https://github.com/VimiummuimiV/KG_Chat_Application/raw/refs/heads/main/src/sounds/mario-game-over.mp3';

export function playAudio(url) {
  const audio = new Audio(url);
  audio.volume = 1;
  audio.play();
}

export function highlightMentionWords() {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  // Get username from auth data
  const authData = localStorage.getItem('klavoauth');
  let username = '';
  try {
    if (authData) {
      const parsedAuth = JSON.parse(authData);
      if (parsedAuth && parsedAuth.username) {
        username = extractUsername(parsedAuth.username);
      }
    }
  } catch (e) {
    logMessage({
      en: `Mention watcher: Error parsing auth data: ${e.message}`,
      ru: `Ошибка парсинга данных авторизации в отслеживателе упоминаний: ${e.message}`
    }, 'error');
  }

  // Don't proceed if no username to check
  if (!username) return;

  const highlightTerms = [username];
  const globalProcessed = new WeakSet();

  const messages = container.querySelectorAll(
    '.message:not(.system):not(.private) ' +
    '.message-text:not(.processed-for-mention)'
  );
  messages.forEach((message) => {
    const walker = document.createTreeWalker(
      message,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (globalProcessed.has(node)) return NodeFilter.FILTER_SKIP;
          const parent = node.parentElement;
          if (parent.closest('.mention, .time, .username')) {
            return NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) nodes.push(currentNode);

    if (nodes.length > 0) {
      nodes.forEach((node) => {
        if (!globalProcessed.has(node)) {
          processNode(node, highlightTerms);
          globalProcessed.add(node);
        }
      });

      message.classList.add('processed-for-mention');
    }
  });

  function processNode(node, keywords) {
    const regex = /(@?[\wа-яА-ЯёЁ'-]+)|[\s]+|[^@\s\wа-яА-ЯёЁ'-]+/gu;
    const tokens = node.textContent.match(regex) || [];
    const fragment = document.createDocumentFragment();

    tokens.forEach(token => {
      const isMatch = keywords.some(keyword =>
        keyword.localeCompare(token, undefined, { sensitivity: 'accent' }) === 0
      );

      if (isMatch) {
        const mentionSpan = document.createElement('span');
        mentionSpan.className = 'mention';
        mentionSpan.textContent = token;
        fragment.appendChild(mentionSpan);
      } else {
        fragment.appendChild(document.createTextNode(token));
      }
    });

    node.parentNode.replaceChild(fragment, node);
  }
}
