import { checkIsMobile } from "./helpers.js";

export function handleLayoutBehavior() {
  const chatContainer = document.querySelector('#app-chat-container');
  const wrapper = chatContainer.querySelector('.chat-wrapper');
  const isNarrow = wrapper.offsetWidth <= 780;
  const isVeryNarrow = wrapper.offsetWidth <= 380;
  const userList = chatContainer.querySelector('.user-list-container');
  const systemMessages = chatContainer.querySelectorAll('.message.system');
  const isMobile = checkIsMobile();

  // Helper to toggle visibility compactly
  function toggleUserList(button, list, shouldShow) {
    const toggles = [
      [list,   'shown-userlist',       shouldShow],
      [list,   'hidden-userlist',      !shouldShow],
      [button, 'hidden-reveal-button', shouldShow],
      [button, 'shown-reveal-button',  !shouldShow],
    ];

    if (shouldShow) {
      toggles.forEach(([el, cls, flag]) => el.classList.toggle(cls, flag));
      // kick off slide-in
      void list.offsetWidth;
      list.style.transform = 'translateX(0)';
    } else {
      list.style.transform = 'translateX(100%)';
      const onEnd = (e) => {
        if (e.propertyName === 'transform') {
          toggles.forEach(([el, cls, flag]) => el.classList.toggle(cls, flag));
          list.removeEventListener('transitionend', onEnd);
        }
      };
      list.addEventListener('transitionend', onEnd, { once: true });
    }
    return shouldShow;
  }

  if (userList) {
    if (isNarrow || isMobile) {
      Object.assign(userList.style, {
        position: 'absolute',
        height: '100%',
        top: '0',
        right: '0',
        transition: 'transform 0.3s ease',
        zIndex: '1001'
      });

      systemMessages.forEach(msg => msg.style.setProperty('align-items', 'start', 'important'));

      let revealButton = chatContainer.querySelector('.reveal-userlist-btn');
      let isOpen = false;

      if (!revealButton) {
        revealButton = document.createElement('button');
        revealButton.className = 'reveal-userlist-btn shown-reveal-button';
        revealButton.textContent = '📋';
        chatContainer.appendChild(revealButton);
        revealButton.addEventListener('click', (ev) => {
          ev.stopPropagation();
          isOpen = toggleUserList(revealButton, userList, !isOpen);
          if (isOpen) {
            document.addEventListener('click', outsideClick, true);
          }
        });

        const outsideClick = (evt) => {
          if (!userList.contains(evt.target) && evt.target !== revealButton) {
            isOpen = toggleUserList(revealButton, userList, false);
            document.removeEventListener('click', outsideClick, true);
          }
        };
      }

      // Initial hide without transitionend
      userList.classList.add('hidden-userlist');
      userList.style.transform = 'translateX(100%)';
      revealButton.classList.add('shown-reveal-button');

    } else {
      Object.assign(userList.style, {
        position: '',
        height: '',
        top: '',
        right: '',
        transform: '',
        zIndex: ''
      });

      userList.classList.remove('hidden-userlist', 'shown-userlist');
      systemMessages.forEach(msg => msg.style.removeProperty('align-items'));
      chatContainer.querySelector('.reveal-userlist-btn')?.remove();
    }
  }

  // Message layout adjustments
  chatContainer.querySelectorAll('.message').forEach(msg => {
    const txt = msg.querySelector('.message-text');
    msg.style.flexDirection = isNarrow ? 'column' : 'row';
    msg.style.marginBottom = isNarrow ? '0.8em' : '0';
    txt.style.marginTop = isNarrow ? '0.2em' : '0';
  });

  // Media scaling
  chatContainer.querySelectorAll('.video-container, .youtube-thumb')
    .forEach(el => el.style.maxWidth = isVeryNarrow ? '100%' : '');
}
