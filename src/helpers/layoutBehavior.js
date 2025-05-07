import { revealUserListDelay } from "../data/definitions.js";
import { checkIsMobile } from "./helpers.js";

export function handleLayoutBehavior() {
  const chatContainer = document.querySelector('#app-chat-container');
  const wrapper = chatContainer.querySelector('.chat-wrapper');
  const isNarrow = wrapper.offsetWidth <= 780;
  const isVeryNarrow = wrapper.offsetWidth <= 380;
  const userList = chatContainer.querySelector('.user-list-container');
  const isMobile = checkIsMobile();

  // Handle user list visibility and styling
  if (userList) {
    const systemMessages = chatContainer.querySelectorAll('.message.system');
    const isCollapsed = isNarrow || isMobile;

    if (isCollapsed) {
      // Set mobile/narrow styles
      Object.assign(userList.style, {
        position: 'absolute',
        height: '100%',
        top: '0',
        right: '0',
        transition: `transform ${revealUserListDelay}ms ease-in-out, opacity ${revealUserListDelay}ms ease-in-out`,
        zIndex: '1001'
      });

      systemMessages.forEach(msg => msg.style.setProperty('align-items', 'start', 'important'));

      // Create or update toggle button
      let revealButton = chatContainer.querySelector('.reveal-userlist-btn');
      const isOpen = userList.classList.contains('shown-userlist');

      if (!revealButton) {
        revealButton = document.createElement('button');
        revealButton.className = 'reveal-userlist-btn';
        revealButton.textContent = '📋';
        chatContainer.appendChild(revealButton);

        // Handle outside clicks
        const outsideClick = evt => {
          if (!userList.contains(evt.target) && evt.target !== revealButton) {
            toggleUserList(userList, false);
            setTimeout(() => document.removeEventListener('click', outsideClick, true), revealUserListDelay);
          }
        };

        // Toggle on button click
        revealButton.addEventListener('click', ev => {
          ev.stopPropagation();
          const isVisible = userList.classList.contains('shown-userlist');
          const nowOpen = toggleUserList(userList, !isVisible);
          nowOpen ? document.addEventListener('click', outsideClick, true)
            : document.removeEventListener('click', outsideClick, true);
        });
      }

      // Set initial state if not already configured
      if (!isOpen) {
        userList.style.transform = 'translateX(100%)';
        userList.style.opacity = '0';
        userList.style.display = 'none';
      }
    } else {
      // Reset to desktop styles
      Object.assign(userList.style, {
        position: '', height: '', top: '', right: '', transform: '',
        opacity: '', display: '', transition: '', zIndex: ''
      });
      userList.classList.remove('shown-userlist');

      systemMessages.forEach(msg => msg.style.removeProperty('align-items'));

      const existingButton = chatContainer.querySelector('.reveal-userlist-btn');
      existingButton?.remove();
    }
  }

  // Adjust message layout
  chatContainer.querySelectorAll('.message').forEach(msg => {
    const txt = msg.querySelector('.message-text');
    if (txt) {
      msg.style.flexDirection = isNarrow ? 'column' : 'row';
      msg.style.marginBottom = isNarrow ? '0.8em' : '0';
      txt.style.marginTop = isNarrow ? '0.2em' : '0';
    }
  });

  // Scale media for small screens or narrow chat
  chatContainer.querySelectorAll('.video-container, .youtube-thumb')
    .forEach(el => el.style.maxWidth = isVeryNarrow ? '100%' : '');
}

// Helper to toggle user list visibility
function toggleUserList(list, makeVisible) {
  // Only proceed if state is changing
  if (list.classList.contains('shown-userlist') !== makeVisible) {
    list.classList.toggle('shown-userlist', makeVisible);

    if (makeVisible) {
      list.style.display = 'flex';
      void list.offsetWidth; // Force reflow
      list.style.transform = 'translateX(0)';
      list.style.opacity = '1';
    } else {
      list.style.transform = 'translateX(100%)';
      list.style.opacity = '0';
      setTimeout(() => {
        if (!list.classList.contains('shown-userlist')) {
          list.style.display = 'none';
        }
      }, revealUserListDelay);
    }
  }
  return makeVisible;
}