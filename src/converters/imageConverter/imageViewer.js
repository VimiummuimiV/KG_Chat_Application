import {
  adjustVisibility,
  checkIsMobile
} from "../../helpers/helpers.js";
import { getThumbnailLinks } from "./imageConverter.js";

// Image viewer state variables
let currentIndex = 0;
let isChangingImage = false;
let expandedImage = null;
let bigImageEvents = {}; // Object to store event handlers

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

// Close the expanded view
const closeExpandedView = (img) => {
  adjustVisibility(img, 'hide', '0');
  const dimmingElement = document.querySelector('.dimming-element');
  if (!document.querySelector('.popup-panel') && dimmingElement) {
    adjustVisibility(dimmingElement, 'hide', '0');
  }
  removeBigImageEventListeners();
};

// Navigate between images
const navigateImages = (direction) => {
  const thumbnailLinks = getThumbnailLinks();
  const newIndex = currentIndex + direction;

  if (newIndex >= 0 && newIndex < thumbnailLinks.length && !isChangingImage) {
    isChangingImage = true;
    if (expandedImage) expandedImage.src = thumbnailLinks[newIndex].imgSrc;
    setTimeout(() => (isChangingImage = false), navigationDelay);
    currentIndex = newIndex;
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
    // Mouse position relative to image center (account for scale)
    const mouseX = (event.clientX - rect.left) - rect.width / 2;
    const mouseY = (event.clientY - rect.top) - rect.height / 2;
    // Calculate new scale
    const direction = event.deltaY < 0 ? 1 : -1;
    const oldScale = zoomScale;
    zoomScale += direction * zoomLimits.factor * zoomScale;
    zoomScale = Math.max(zoomLimits.min, Math.min(zoomScale, zoomLimits.max));
    // Adjust translation so the point under the cursor stays fixed
    translateX -= (mouseX / oldScale) * (zoomScale - oldScale);
    translateY -= (mouseY / oldScale) * (zoomScale - oldScale);
    imageElement.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;
  };

  bigImageEvents.mousemove = (event) => {
    if (isMMBPressed) {
      if (event.ctrlKey) {
        const deltaY = event.clientY - lastMouseY;
        const zoomDirection = deltaY < 0 ? 1 : -1;
        const zoomAmount = Math.abs(deltaY) * zoomLimits.factor * 0.05;
        zoomScale += zoomDirection * zoomAmount * zoomScale;
        zoomScale = Math.max(zoomLimits.min, Math.min(zoomScale, zoomLimits.max));
      } else {
        const deltaX = (event.clientX - lastMouseX) / zoomScale * movementSpeed;
        const deltaY = (event.clientY - lastMouseY) / zoomScale * movementSpeed;
        translateX += deltaX;
        translateY += deltaY;
      }
      imageElement.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;
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
        // Apply zoom only if previous event also had 2 touches
        const zoomFactor = currentDistance / prevDistance;
        zoomScale *= zoomFactor;
        zoomScale = Math.max(zoomLimits.min, Math.min(zoomScale, zoomLimits.max));
        // Adjust translation so the pinch center stays fixed
        translateX -= (pinchX / oldScale) * (zoomScale - oldScale);
        translateY -= (pinchY / oldScale) * (zoomScale - oldScale);
        imageElement.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;
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