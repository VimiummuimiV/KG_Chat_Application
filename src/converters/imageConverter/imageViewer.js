import {
  adjustVisibility,
  checkIsMobile,
  calibrateToMoscowTime
} from "../../helpers/helpers.js";
import { getThumbnailLinks } from "./imageConverter.js";

// Image viewer state variables
let currentIndex = 0;
let isChangingImage = false;
let expandedImage = null;
let bigImageEvents = {}; // Object to store event handlers
let imageInfoContainer = null; // Container for image info

// Constants for image viewer
const zoomLimits = { min: 0.2, max: 10, factor: 0.1 };
const navigationDelay = 50;

function addBigImageEventListeners() {
  Object.entries(bigImageEvents).forEach(([event, handler]) => {
    document.addEventListener(event, handler);
  });
}

function removeBigImageEventListeners() {
  Object.entries(bigImageEvents).forEach(([event, handler]) => {
    document.removeEventListener(event, handler);
  });
}

function getImageInfo(index) {
  const thumbnails = document.querySelectorAll('.clickable-thumbnail');
  const thumbnail = Array.from(thumbnails)[index];
  if (!thumbnail) return null;

  // Find the message container that contains this thumbnail
  let messageContainer = thumbnail.closest('.message');
  if (!messageContainer) return null;

  // Get the message info elements
  const messageInfo = messageContainer.querySelector('.message-info');
  if (!messageInfo) return null;

  const time = messageInfo.querySelector('.time')?.textContent || '';
  const username = messageInfo.querySelector('.username')?.textContent || '';

  return { time, username };
}

function createImageInfo() {
  const container = document.createElement('div');
  container.className = 'image-info-container';
  return container;
}

function updateImageInfo(index) {
  if (!imageInfoContainer) return;
  const info = getImageInfo(index);
  if (!info) return;

  imageInfoContainer.innerHTML = `
    <div class="image-info image-info-time">${info.time}</div>
    <div class="image-info image-info-username">${info.username}</div>
  `;

  // Add click event to time element
  const timeEl = imageInfoContainer.querySelector('.image-info-time');
  if (timeEl) {
    timeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const localTime = timeEl.textContent.trim();
      const moscowTime = calibrateToMoscowTime(localTime);
      const today = new Intl.DateTimeFormat('en-CA').format(new Date());
      const url = `https://klavogonki.ru/chatlogs/${today}.html#${moscowTime}`;
      window.open(url, '_blank');
    });
  }
}

function removeImageInfo() {
  if (imageInfoContainer && imageInfoContainer.parentNode) {
    imageInfoContainer.parentNode.removeChild(imageInfoContainer);
    imageInfoContainer = null;
  }
}

// Close the expanded view
const closeExpandedView = (img) => {
  adjustVisibility(img, 'hide', '0');
  const dimmingElement = document.querySelector('.dimming-element');
  if (!document.querySelector('.popup-panel') && dimmingElement) {
    adjustVisibility(dimmingElement, 'hide', '0');
  }
  removeBigImageEventListeners();
  removeImageInfo();
};

// Navigate between images
const navigateImages = (direction) => {
  const thumbnailLinks = getThumbnailLinks();
  const newIndex = currentIndex + direction;

  if (newIndex >= 0 && newIndex < thumbnailLinks.length && !isChangingImage) {
    isChangingImage = true;
    if (expandedImage) expandedImage.src = thumbnailLinks[newIndex].imgSrc;
    setTimeout(() => {
      isChangingImage = false;
      currentIndex = newIndex;
      updateImageInfo(currentIndex); // Ensure info updates on navigation
    }, navigationDelay);
  }
};

// Create the expanded view of an image
export const createExpandedView = (src, clickedThumbnailIndex) => {
  // Create and add expanded image to DOM
  const imageElement = document.createElement('img');
  imageElement.src = src;
  imageElement.classList.add('scaled-thumbnail');

  document.body.appendChild(imageElement);
  expandedImage = imageElement;

  currentIndex = clickedThumbnailIndex;

  // Create and add info container
  imageInfoContainer = createImageInfo();
  document.body.appendChild(imageInfoContainer);
  updateImageInfo(currentIndex);

  // Zoom and movement variables
  let zoomScale = 1;
  let isMMBPressed = false;
  let lastMouseX = 0,
    lastMouseY = 0;
  let translateX = 0,
    translateY = 0;
  const movementSpeed = 5;

  // Get or create the dimming element
  let dimmingElement = document.querySelector('.dimming-element');
  if (!dimmingElement) {
    dimmingElement = document.createElement('div');
    dimmingElement.classList.add('dimming-element');
    document.body.appendChild(dimmingElement);
  }

  // Add mobile touch support
  if (checkIsMobile()) {
    setupMobileTouchHandlers(imageElement, zoomScale, translateX, translateY);
  }

  // Define event listeners for the expanded image (desktop)
  bigImageEvents.click = (event) => {
    if (!imageElement.contains(event.target)) {
      imageElement.remove();
      removeBigImageEventListeners();
    }
  };

  bigImageEvents.keydown = (event) => {
    if (event.code === 'Escape' || event.code === 'Space') {
      event.preventDefault();
      closeExpandedView(imageElement);
    } else if (event.code === 'ArrowLeft') {
      navigateImages(-1);
    } else if (event.code === 'ArrowRight') {
      navigateImages(1);
    }
  };

  bigImageEvents.wheel = (event) => {
    event.preventDefault();
    const rect = imageElement.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) - rect.width / 2;
    const mouseY = (event.clientY - rect.top) - rect.height / 2;
    const direction = event.deltaY < 0 ? 1 : -1;
    const oldScale = zoomScale;
    let newScale = zoomScale + direction * zoomLimits.factor * zoomScale;
    newScale = Math.max(zoomLimits.min, Math.min(newScale, zoomLimits.max));

    ({ translateX, translateY } = zoomAtPoint({
      imageElement,
      anchorX: mouseX,
      anchorY: mouseY,
      oldScale,
      newScale,
      translateX,
      translateY
    }));

    zoomScale = newScale;
  };

  bigImageEvents.mousemove = (event) => {
    if (isMMBPressed) {
      if (event.ctrlKey) {
        const rect = imageElement.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left) - rect.width / 2;
        const mouseY = (event.clientY - rect.top) - rect.height / 2;
        const deltaY = event.clientY - lastMouseY;
        const zoomDirection = deltaY < 0 ? 1 : -1;
        const zoomAmount = Math.abs(deltaY) * zoomLimits.factor * 0.05;
        const oldScale = zoomScale;
        let newScale = zoomScale + zoomDirection * zoomAmount * zoomScale;
        newScale = Math.max(zoomLimits.min, Math.min(newScale, zoomLimits.max));

        ({ translateX, translateY } = zoomAtPoint({
          imageElement,
          anchorX: mouseX,
          anchorY: mouseY,
          oldScale,
          newScale,
          translateX,
          translateY
        }));

        zoomScale = newScale;
      } else {
        const deltaX = (event.clientX - lastMouseX) / zoomScale * movementSpeed;
        const deltaY = (event.clientY - lastMouseY) / zoomScale * movementSpeed;
        translateX += deltaX;
        translateY += deltaY;
        imageElement.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;
      }
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    }
  };

  bigImageEvents.mousedown = (event) => {
    const { button, clientX, clientY, target, ctrlKey } = event;
    if ((button === 0 || button === 2) && target !== imageElement) return;
    if (button === 0) {
      navigateImages(-1);
    } else if (button === 2) {
      event.preventDefault();
      if (ctrlKey) {
        navigator.clipboard.writeText(target.src).catch(console.error);
        closeExpandedView(imageElement);
      } else {
        navigateImages(1);
      }
    } else if (button === 1) {
      isMMBPressed = true;
      lastMouseX = clientX;
      lastMouseY = clientY;
      event.preventDefault();
    }
  };

  bigImageEvents.mouseup = (event) => {
    if (event.button === 1) {
      isMMBPressed = false;
    }
  };

  bigImageEvents.contextmenu = (event) => event.preventDefault();

  // Add the event listeners
  addBigImageEventListeners();

  // Show the dimming element
  adjustVisibility(dimmingElement, "show", "1");

  // When clicking the dimming background, hide the image and the dimming element
  dimmingElement.addEventListener('click', () => {
    closeExpandedView(imageElement);
  });

  return imageElement;
};

function zoomAtPoint({
  imageElement,
  anchorX,
  anchorY,
  oldScale,
  newScale,
  translateX,
  translateY
}) {
  // anchorX, anchorY are relative to image center (in px, not scaled)
  const deltaScale = newScale - oldScale;
  translateX -= (anchorX / oldScale) * deltaScale;
  translateY -= (anchorY / oldScale) * deltaScale;
  imageElement.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${newScale})`;
  return { translateX, translateY };
}

// Setup mobile touch handlers
function setupMobileTouchHandlers(imageElement, zoomScale, translateX, translateY) {
  // Variables to track touch state
  let prevTouches = 0;
  let prevDistance = 0;
  let prevTouchX = 0;
  let prevTouchY = 0;
  let prevPinchCenter = { x: 0, y: 0 };

  const handleTouchStart = (event) => {
    event.preventDefault();
    if (event.touches.length === 2) {
      // Store initial pinch center
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      prevPinchCenter.x = (touch1.clientX + touch2.clientX) / 2;
      prevPinchCenter.y = (touch1.clientY + touch2.clientY) / 2;
    }
  };

  const handleTouchMove = (event) => {
    event.preventDefault(); // Prevent scrolling

    const currentTouches = event.touches.length;

    if (currentTouches === 2) {
      // Pinch zoom with two fingers
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      const currentDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      if (prevTouches === 2) {
        const rect = imageElement.getBoundingClientRect();
        const pinchX = (centerX - rect.left) - rect.width / 2;
        const pinchY = (centerY - rect.top) - rect.height / 2;
        const oldScale = zoomScale;
        const zoomFactor = currentDistance / prevDistance;
        let newScale = zoomScale * zoomFactor;
        newScale = Math.max(zoomLimits.min, Math.min(newScale, zoomLimits.max));

        ({ translateX, translateY } = zoomAtPoint({
          imageElement,
          anchorX: pinchX,
          anchorY: pinchY,
          oldScale,
          newScale,
          translateX,
          translateY
        }));

        zoomScale = newScale;
      }
      prevDistance = currentDistance;
      prevPinchCenter.x = centerX;
      prevPinchCenter.y = centerY;
    } else if (currentTouches === 1) {
      // Pan with one finger
      const touch = event.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;

      if (prevTouches === 1) {
        // Apply pan only if previous event also had 1 touch
        const deltaX = currentX - prevTouchX;
        const deltaY = currentY - prevTouchY;
        translateX += deltaX;
        translateY += deltaY;
        imageElement.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;
      }
      prevTouchX = currentX;
      prevTouchY = currentY;
    }

    prevTouches = currentTouches; // Update previous touch count
  };

  const handleTouchEnd = (event) => {
    if (event.touches.length === 0) {
      prevTouches = 0; // Reset when all fingers are lifted
    }
  };

  // Add touch event listeners with passive: false to allow preventDefault
  imageElement.addEventListener('touchstart', handleTouchStart, { passive: false });
  imageElement.addEventListener('touchmove', handleTouchMove, { passive: false });
  imageElement.addEventListener('touchend', handleTouchEnd);
}
