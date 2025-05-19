import { adjustVisibility, logMessage } from "../helpers/helpers.js";

// Define a variable to track the last focused textarea in the iframe
let lastFocusedIframeTextarea = null;

// Creates and manages an iframe modal for profile content
export const loadProfileIntoIframe = (url) => {
  let profileIframe = document.querySelector('.profile-iframe-container');

  if (!profileIframe) {
    profileIframe = document.createElement('iframe');
    profileIframe.classList.add('profile-iframe-container');
    document.body.appendChild(profileIframe);
  }

  profileIframe.src = url;
  adjustVisibility(profileIframe, 'show', 1);

  const removeIframe = () => {
    adjustVisibility(profileIframe, 'hide', 0);
    document.removeEventListener('keydown', handleEvents);
    document.removeEventListener('mousedown', handleEvents);
  };

  // Update the handleEvents function to include only the 'username' class
  const handleEvents = (event) => {
    if (event.type === 'keydown' && event.code === 'Space') {
      if (lastFocusedIframeTextarea) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      removeIframe();
    }

    if (event.type === 'mousedown') {
      const isClickOnUsername = event.target.classList.contains('username');
      if (!profileIframe.contains(event.target) && !isClickOnUsername) {
        removeIframe();
      }
    }
  };

  document.addEventListener('keydown', handleEvents);
  document.addEventListener('mousedown', handleEvents);

  profileIframe.onload = () => {
    try {
      const iframeWindow = profileIframe.contentWindow;
      const iframeDoc = iframeWindow.document;

      iframeDoc.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'TEXTAREA') {
          lastFocusedIframeTextarea = e.target;
        }
      });

      iframeDoc.addEventListener('focusout', () => {
        setTimeout(() => {
          if (!iframeDoc.activeElement || iframeDoc.activeElement.tagName !== 'TEXTAREA') {
            lastFocusedIframeTextarea = null;
          }
        }, 0);
      });

      iframeWindow.addEventListener('keydown', handleEvents);
      iframeWindow.addEventListener('dblclick', removeIframe);

      new MutationObserver((mutations, observer) => {
        if (mutations.some(m => [...m.removedNodes].some(n =>
          n.nodeType === 1 && (n.classList.contains('dimming-background') || n.classList.contains('cached-users-panel'))
        ))) {
          removeIframe();
          observer.disconnect();
        }
      }).observe(document.body, { childList: true, subtree: true });

    } catch (error) {
      logMessage({
        en: "Unable to access iframe contents. This may be due to cross-origin restrictions.",
        ru: "Невозможно получить доступ к содержимому iframe. Возможно, это связано с ограничениями кросс-домена."
      }, 'error');
    }
  };
};