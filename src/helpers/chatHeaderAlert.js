import { showAlertDuration } from "../data/definitions.js";

export function showChatAlert(message, options = {}) {
  const dragArea = document.querySelector('.chat-drag-area');
  if (!dragArea) return;

  const existingAlert = dragArea.querySelector('.chat-dynamic-alert');
  if (existingAlert && existingAlert.parentNode === dragArea) {
    dragArea.removeChild(existingAlert);
  }

  const defaultOptions = { type: 'info', duration: showAlertDuration };
  const settings = { ...defaultOptions, ...options };

  const colorMap = {
    info: '#2196F3',
    warning: '#FF9800',
    error: '#F44336',
    success: '#4CAF50'
  };

  const alertElement = document.createElement('div');
  alertElement.className = 'chat-dynamic-alert';
  alertElement.innerHTML = message;
  alertElement.style.cssText = `
    background-color: ${colorMap[settings.type] || colorMap.info};
  `;

  dragArea.appendChild(alertElement);

  function animateAlert() {
    requestAnimationFrame(() => {
      alertElement.style.transition = 'opacity 0.3s ease-in-out';
      alertElement.style.opacity = '1';

      setTimeout(() => {
        alertElement.style.transition = 'transform 0.05s ease-in-out';
        const shakeSequence = [
          { x: 5, delay: 0 },
          { x: -7, delay: 50 },
          { x: 9, delay: 100 },
          { x: -6, delay: 150 },
          { x: 4, delay: 200 },
          { x: -3, delay: 250 },
          { x: 0, delay: 300 }
        ];

        shakeSequence.forEach((move) => {
          setTimeout(() => {
            alertElement.style.transform = `translate(calc(-50% + ${move.x}px), 0)`;
          }, move.delay);
        });
      }, 300);

      setTimeout(() => {
        alertElement.style.transition = 'opacity 0.3s ease-in-out';
        alertElement.style.opacity = '0';

        setTimeout(() => {
          if (alertElement && alertElement.parentNode === dragArea) {
            dragArea.removeChild(alertElement);
          }
        }, 300);
      }, settings.duration);
    });
  }

  animateAlert();
}