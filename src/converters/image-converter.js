// helpers
import {
  addBigImageEventListeners,
  adjustVisibility,
  decodeURL,
  isEncodedURL,
  isTrustedDomain,
  removeBigImageEventListeners,
  checkIsMobile,
  scrollToBottom
} from "../helpers"; // helpers

// definitions
import { state } from "../data/definitions.js";

// Image constants
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const emojis = { image: '📷', domain: '🖥️', untrusted: '💀️️' };
const zoomLimits = { min: 0.2, max: 10, factor: 0.1 };
const navigationDelay = 50;

// Image navigation state
let currentIndex = 0;
let isChangingImage = false;
let thumbnailLinks = [];

// Expanded image reference
let expandedImage = null;

const getExtension = (url) => {
  try {
    return (url.match(/\.([^?#.]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() || '');
  } catch (error) {
    console.error("Error extracting extension:", error.message);
    return '';
  }
};

const isAllowedImageExtension = (url) => {
  const extension = getExtension(url);
  return { allowed: imageExtensions.includes(extension), extension };
};

const createExpandedView = (src, clickedThumbnailIndex) => {
  // Create and add expanded image to DOM
  const imageElement = document.createElement('img');
  imageElement.src = src;
  imageElement.classList.add('scaled-thumbnail');

  document.body.appendChild(imageElement);

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
    // Variables to track touch state
    let prevTouches = 0;
    let prevDistance = 0;
    let prevTouchX = 0;
    let prevTouchY = 0;

    const handleTouchStart = (event) => {
      event.preventDefault();
    };

    const handleTouchMove = (event) => {
      event.preventDefault(); // Prevent scrolling

      const currentTouches = event.touches.length;

      if (currentTouches === 2) {
        // Pinch zoom with two fingers
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );

        if (prevTouches === 2) {
          // Apply zoom only if previous event also had 2 touches
          const zoomFactor = currentDistance / prevDistance;
          zoomScale *= zoomFactor;
          zoomScale = Math.max(zoomLimits.min, Math.min(zoomScale, zoomLimits.max));
          imageElement.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;
        }
        prevDistance = currentDistance;
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

  // Define closeExpandedView function
  const closeExpandedView = (img) => {
    adjustVisibility(img, 'hide', '0');
    if (!document.querySelector('.popup-panel') && dimmingElement) {
      adjustVisibility(dimmingElement, 'hide', '0');
    }
    removeBigImageEventListeners();
  };

  // Define event listeners for the expanded image (desktop)
  state.bigImageEvents['click'] = (event) => {
    if (!imageElement.contains(event.target)) {
      imageElement.remove();
      removeBigImageEventListeners();
    }
  };

  state.bigImageEvents['keydown'] = (event) => {
    if (event.code === 'Escape' || event.code === 'Space') {
      event.preventDefault();
      closeExpandedView(imageElement);
    } else if (event.code === 'ArrowLeft') {
      navigateImages(-1);
    } else if (event.code === 'ArrowRight') {
      navigateImages(1);
    }
  };

  state.bigImageEvents['wheel'] = (event) => {
    const direction = event.deltaY < 0 ? 1 : -1;
    zoomScale += direction * zoomLimits.factor * zoomScale;
    zoomScale = Math.max(zoomLimits.min, Math.min(zoomScale, zoomLimits.max));
    imageElement.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;
  };

  state.bigImageEvents['mousemove'] = (event) => {
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

  state.bigImageEvents['mousedown'] = (event) => {
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

  state.bigImageEvents['mouseup'] = (event) => {
    if (event.button === 1) {
      isMMBPressed = false;
    }
  };

  state.bigImageEvents['contextmenu'] = (event) => event.preventDefault();

  // Add the event listeners using your helper function
  addBigImageEventListeners();

  // Show the dimming element using adjustVisibility
  adjustVisibility(dimmingElement, "show", "1");

  // When clicking the dimming background, hide the image and the dimming element
  dimmingElement.addEventListener('click', () => {
    closeExpandedView(imageElement);
  });

  return imageElement;
};

const navigateImages = (direction) => {
  const newIndex = currentIndex + direction;
  if (newIndex >= 0 && newIndex < thumbnailLinks.length && !isChangingImage) {
    isChangingImage = true;
    if (expandedImage) expandedImage.src = thumbnailLinks[newIndex].imgSrc;
    setTimeout(() => (isChangingImage = false), navigationDelay);
    currentIndex = newIndex;
  }
};

export function convertImageLinksToImage() {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  const refreshThumbnailLinks = () => {
    thumbnailLinks = [];
    container.querySelectorAll(".clickable-thumbnail").forEach((thumbnail, index) => {
      const img = thumbnail.querySelector("img");
      if (img && thumbnail.dataset.sourceLink) {
        thumbnailLinks.push({ link: thumbnail.dataset.sourceLink, imgSrc: img.src, index });
      }
    });
  };

  const links = container.querySelectorAll("a:not(.skipped):not(.processed-image)");
  if (!links.length) return;

  links.forEach((link) => {
    if (!link.href || !link.href.startsWith("http")) return;
    const { allowed, extension } = isAllowedImageExtension(link.href);
    if (!allowed) return;

    link.classList.add("media");
    const { isTrusted, domain } = isTrustedDomain(link.href);
    link.title = isEncodedURL(link.href) ? decodeURL(link.href) : link.href;

    isTrusted
      ? handleTrustedLink(link, extension, domain)
      : handleUntrustedLink(link, extension, domain);
  });

  function createThumbnail(link, isUntrusted) {
    const thumbnail = document.createElement("div");
    thumbnail.classList.add("clickable-thumbnail");
    thumbnail.dataset.sourceLink = link.href;

    const img = document.createElement("img");
    img.src = link.href;

    img.onload = () => {
      thumbnail.appendChild(img);
      link.parentNode.insertBefore(thumbnail, link.nextSibling);
      scrollToBottom(600);
    };

    img.onerror = () => {
      console.error("Failed to load image:", link.href);
      link.classList.add("skipped");
    };

    if (isUntrusted) {
      if (!link.querySelector(".clickable-thumbnail")) {
        link.addEventListener("click", () => {
          if (!link.querySelector(".clickable-thumbnail")) {
            thumbnail.appendChild(img);
            link.parentNode.insertBefore(thumbnail, link.nextSibling);
          }
        });
      }
    } else {
      thumbnail.appendChild(img);
      link.parentNode.insertBefore(thumbnail, link.nextSibling);
    }

    thumbnail.addEventListener("click", (e) => {
      e.stopPropagation();
      refreshThumbnailLinks();
      const clickedIndex = thumbnailLinks.findIndex(
        (item) => item.link === link.href || item.imgSrc === img.src
      );
      expandedImage = createExpandedView(
        img.src,
        clickedIndex >= 0 ? clickedIndex : 0
      );
      adjustVisibility(expandedImage, "show", "1");
      const dimmingElement = document.querySelector('.dimming-element');
      if (dimmingElement) {
        adjustVisibility(dimmingElement, "show", "1");
      }
    });
  }

  function handleUntrustedLink(link, extension, domain) {
    link.classList.add("skipped");
    link.textContent = `${emojis.image} Image (${extension.toUpperCase()}) ${emojis.domain} Hostname (${domain}) ${emojis.untrusted} Untrusted`;
    link.addEventListener("click", (e) => {
      if (!link.classList.contains("processed-image")) {
        e.preventDefault();
        link.classList.remove("skipped");
        link.classList.add("processed-image");
        createThumbnail(link, true);
      }
    });
  }

  function handleTrustedLink(link, extension, domain) {
    link.textContent = `${emojis.image} Image (${extension.toUpperCase()}) ${emojis.domain} Hostname (${domain})`;
    link.classList.add("processed-image");
    createThumbnail(link, false);
  }
}