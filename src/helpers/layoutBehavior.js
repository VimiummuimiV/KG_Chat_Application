import { checkIsMobile } from "./helpers.js";

export function handleLayoutBehavior() {
  const wrapper = document.querySelector('#app-chat-container .chat-wrapper');
  if (!wrapper) return;
  const chatContainer = document.querySelector('#app-chat-container');
  const isNarrow = wrapper.offsetWidth <= 780;
  const isVeryNarrow = wrapper.offsetWidth <= 380;
  const userList = document.querySelector('#app-chat-container .user-list-container');
  const systemMessages = document.querySelectorAll('#app-chat-container .message.system');
  let isUserListOpen = false;
  const isMobile = checkIsMobile();

  // Handle user list for narrow screens
  if (userList) {
    // Check if the screen (chat) is narrow on PC or mobile devices
    if (isNarrow || isMobile) {
      userList.style.position = 'absolute';
      userList.style.height = '100%';
      userList.style.top = '0';
      userList.style.right = '0';
      userList.style.transition = 'transform 0.3s ease';
      userList.style.zIndex = '1001';
      userList.style.transform = 'translateX(100%)';

      // Apply alignment to all system messages if they exist
      if (systemMessages && systemMessages.length > 0) {
        systemMessages.forEach(message => {
          message.style.setProperty('align-items', 'start', 'important');
        });
      }

      let revealButton = document.querySelector('#app-chat-container .reveal-userlist-btn');
      if (!revealButton) {
        revealButton = document.createElement('button');
        revealButton.className = 'reveal-userlist-btn hidden-userlist';
        revealButton.textContent = '📋';
        chatContainer.appendChild(revealButton);
        function closeUserList(event) {
          if (!userList.contains(event.target) && event.target !== revealButton) {
            userList.style.transform = 'translateX(100%)';
            revealButton.classList.remove('shown-userlist');
            revealButton.classList.add('hidden-userlist');
            isUserListOpen = false;
            document.removeEventListener('click', closeUserList, true);
          }
        }
        revealButton.addEventListener('click', (event) => {
          event.stopPropagation();
          if (!isUserListOpen) {
            userList.style.transform = 'translateX(0)';
            revealButton.classList.remove('hidden-userlist');
            revealButton.classList.add('shown-userlist');
            isUserListOpen = true;
            setTimeout(() => {
              document.addEventListener('click', closeUserList, true);
            }, 10);
          }
        });
      }
    } else {
      userList.style.position = '';
      userList.style.height = '';
      userList.style.top = '';
      userList.style.right = '';
      userList.style.transform = '';
      userList.style.zIndex = '';

      // Remove alignment property from all system messages if they exist
      if (systemMessages && systemMessages.length > 0) {
        systemMessages.forEach(message => {
          message.style.removeProperty('align-items');
        });
      }

      const revealButton = document.querySelector('#app-chat-container .reveal-userlist-btn');
      if (revealButton) {
        revealButton.remove();
      }
    }
  }

  // Adjust message layout for narrow screens
  document.querySelectorAll('#app-chat-container .message').forEach(msg => {
    const msgText = msg.querySelector('.message-text');

    msg.style.flexDirection = (isNarrow) ? 'column' : 'row';
    msg.style.marginBottom = (isNarrow) ? '0.8em' : '0';
    msgText.style.marginTop = (isNarrow) ? '0.2em' : '0';
  });

  // Apply scaling to video containers and YouTube thumbnails
  const mediaElements = document.querySelectorAll('#app-chat-container .video-container, #app-chat-container .youtube-thumb');
  mediaElements.forEach(element => element.style.maxWidth = isVeryNarrow ? '100%' : '');
}