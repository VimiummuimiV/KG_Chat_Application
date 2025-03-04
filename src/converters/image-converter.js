// helpers
import {
  decodeURL,
  isEncodedURL,
  scrollMessagesToBottom,
  isTrustedDomain,
  addBigImageEventListeners,
  removeBigImageEventListeners,
  triggerDimmingElement,
  triggerTargetElement
} from "../helpers";

// definitions
import { state } from "../definitions";

// Image constants
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const emojis = { image: '📸', domain: '🖥️', untrusted: '💀️️' };
const zoomLimits = { min: 0.2, max: 10, factor: 0.1 };
const navigationDelay = 50;

// Image navigation state
let currentIndex = 0;
let isChangingImage = false;
let thumbnailLinks = [];

// Expanded image reference
let expandedImage = null;
const { bigImageEvents } = state;

/**
 * Extracts file extension from URL
 */
const getExtension = (url) => {
  try {
    return (url.match(/\.([^?#.]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() || '');
  } catch (error) {
    console.error("Error extracting extension:", error.message);
    return '';
  }
};

/**
 * Checks if URL has allowed image extension
 */
const isAllowedImageExtension = (url) => {
  const extension = getExtension(url);
  return { allowed: imageExtensions.includes(extension), extension };
};

/**
 * Creates expanded image view with interactive features
 */
const createExpandedView = (src, clickedThumbnailIndex) => {
  // Create and add expanded image to DOM
  const imageElement = document.createElement('img');
  imageElement.src = src;
  imageElement.classList.add('scaled-thumbnail');
  document.body.appendChild(imageElement);
  
  // Update current index based on clicked thumbnail
  currentIndex = clickedThumbnailIndex;

  // Zoom and movement variables
  let zoomScale = 1;
  let isMMBPressed = false; // Track if MMB is pressed regardless of mode
  let isDragging = false;
  let lastMouseX = 0, lastMouseY = 0;
  let translateX = -50, translateY = -50;
  const movementSpeed = 5;

  // Close expanded view and clean up
  const closeExpandedView = (img) => {
    triggerTargetElement(img, 'hide');
    if (!document.querySelector('.popup-panel')) triggerDimmingElement('hide');
    removeBigImageEventListeners();
  };

  // Event handlers
  bigImageEvents.unfocusedClick = (event) => {
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
    const direction = event.deltaY < 0 ? 1 : -1;
    zoomScale += direction * zoomLimits.factor * zoomScale;
    
    // Apply zoom limits
    zoomScale = Math.max(zoomLimits.min, Math.min(zoomScale, zoomLimits.max));
    
    imageElement.style.transform = `translate(${translateX}%, ${translateY}%) scale(${zoomScale})`;
  };

  bigImageEvents.mousemove = (event) => {
    if (isMMBPressed) {
      if (event.ctrlKey) {
        // Ctrl is held - perform zoom operation
        const deltaY = event.clientY - lastMouseY;
        
        // Adjust zoom based on vertical movement: up = zoom in, down = zoom out
        const zoomDirection = deltaY < 0 ? 1 : -1;
        const zoomAmount = Math.abs(deltaY) * zoomLimits.factor * 0.05; // Adjust sensitivity
        
        zoomScale += zoomDirection * zoomAmount * zoomScale;
        
        // Apply zoom limits
        zoomScale = Math.max(zoomLimits.min, Math.min(zoomScale, zoomLimits.max));
      } else {
        // Ctrl is not held - perform pan operation
        const deltaX = (event.clientX - lastMouseX) / zoomScale * movementSpeed;
        const deltaY = (event.clientY - lastMouseY) / zoomScale * movementSpeed;
        
        translateX += (deltaX / imageElement.clientWidth) * 100;
        translateY += (deltaY / imageElement.clientHeight) * 100;
      }
      
      // Update image transform with current zoom and pan values
      imageElement.style.transform = `translate(${translateX}%, ${translateY}%) scale(${zoomScale})`;
      
      // Update last mouse position for next move
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    }
  };

  bigImageEvents.mousedown = (event) => {
    const { button, clientX, clientY, target, ctrlKey } = event;
    if ((button === 0 || button === 2) && target !== imageElement) return;
    
    const src = target.src;

    if (button === 0) {
      // Left click - navigate to previous image
      navigateImages(-1);
    } else if (button === 2) {
      event.preventDefault();
      if (ctrlKey) {
        navigator.clipboard.writeText(src).catch(console.error);
        closeExpandedView(imageElement);
      } else {
        navigateImages(1);
      }
    } else if (button === 1) { // Middle mouse button
      // Always track MMB state and initial position
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
  
  // We don't need the keyup handler anymore since we're checking ctrlKey in real time
  
  bigImageEvents.contextmenu = (event) => event.preventDefault();

  addBigImageEventListeners();
  return imageElement;
};

/**
 * Navigate between available images
 */
const navigateImages = (direction) => {
  const newIndex = currentIndex + direction;
  
  if (newIndex >= 0 && newIndex < thumbnailLinks.length && !isChangingImage) {
    isChangingImage = true;
    
    if (expandedImage) expandedImage.src = thumbnailLinks[newIndex].imgSrc;
    
    setTimeout(() => isChangingImage = false, navigationDelay);
    currentIndex = newIndex;
  }
};

/**
 * Converts image links to thumbnails in specified container
 */
export function convertImageLinksToImage(containerType) {
  const containerSelectors = {
    generalMessages: ".messages-content div",
    chatlogsMessages: ".chat-logs-container",
    personalMessages: ".messages-container-wrapper"
  };

  const container = document.querySelector(containerSelectors[containerType]);
  if (!container) return;

  // Refresh thumbnailLinks scoped to the current container
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

  links.forEach(link => {
    if (!link.href || !link.href.startsWith("http")) return;

    const { allowed, extension } = isAllowedImageExtension(link.href);
    if (!allowed) return;

    link.classList.add("media");
    const { isTrusted, domain } = isTrustedDomain(link.href);
    link.title = isEncodedURL(link.href) ? decodeURL(link.href) : link.href;
    
    isTrusted ? handleTrustedLink(link, extension, domain) : handleUntrustedLink(link, extension, domain);
  });

  /**
   * Creates image thumbnail from link
   */
  function createThumbnail(link, isUntrusted) {
    const thumbnail = document.createElement("div");
    thumbnail.classList.add("clickable-thumbnail");
    // Save the original link href for later use
    thumbnail.dataset.sourceLink = link.href;

    const img = document.createElement("img");
    img.src = link.href;

    img.onload = () => {
      thumbnail.appendChild(img);
      link.parentNode.insertBefore(thumbnail, link.nextSibling);
      scrollMessagesToBottom(containerType);
    };

    img.onerror = () => {
      console.error("Failed to load image:", link.href);
      link.classList.add("skipped");
    };

    if (isUntrusted) {
      if (!link.querySelector(".clickable-thumbnail")) {
        link.addEventListener("click", e => {
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

    thumbnail.addEventListener("click", e => {
      e.stopPropagation();
      // Refresh thumbnail links in the current container
      refreshThumbnailLinks();
      // Find the index of the clicked thumbnail by comparing the saved source link or the img src
      const clickedIndex = thumbnailLinks.findIndex(item => 
        item.link === link.href || item.imgSrc === img.src
      );
      
      expandedImage = createExpandedView(img.src, clickedIndex >= 0 ? clickedIndex : 0);
      triggerTargetElement(expandedImage, "show");
      triggerDimmingElement("show");
    });
  }

  /**
   * Handle untrusted domain link
   */
  function handleUntrustedLink(link, extension, domain) {
    link.classList.add("skipped");
    link.textContent = `${emojis.image} Image (${extension.toUpperCase()}) ${emojis.domain} Hostname (${domain}) ${emojis.untrusted} Untrusted`;

    link.addEventListener("click", e => {
      if (!link.classList.contains("processed-image")) {
        e.preventDefault();
        link.classList.remove("skipped");
        link.classList.add("processed-image");
        createThumbnail(link, true);
      }
    });
  }

  /**
   * Handle trusted domain link
   */
  function handleTrustedLink(link, extension, domain) {
    link.textContent = `${emojis.image} Image (${extension.toUpperCase()}) ${emojis.domain} Hostname (${domain})`;
    link.classList.add("processed-image");
    createThumbnail(link, false);
  }
}