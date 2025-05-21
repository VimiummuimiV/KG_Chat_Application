import {
  adjustVisibility,
  decodeURL,
  isEncodedURL,
  isTrustedDomain,
  scrollToBottom,
  logMessage
} from "../../helpers/helpers.js";
import { createCustomTooltip } from "../../helpers/tooltip.js";
import { createExpandedView } from "./imageViewer.js";

// Image constants
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const emojis = { image: '📷', domain: '🖥️', untrusted: '💀️️' };

// Thumbnail links array to be exported
let thumbnailLinks = [];

const getExtension = (url) => {
  try {
    return (url.match(/\.([^?#.]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() || '');
  } catch (error) {
    logMessage(`Error extracting image extension: ${error.message}`, 'error');
    return '';
  }
};

const isAllowedImageExtension = (url) => {
  const extension = getExtension(url);
  return { allowed: imageExtensions.includes(extension), extension };
};

// Function to refresh the thumbnail links array
export const refreshThumbnailLinks = () => {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  thumbnailLinks = [];
  container.querySelectorAll(".clickable-thumbnail").forEach((thumbnail, index) => {
    const img = thumbnail.querySelector("img");
    if (img && thumbnail.dataset.sourceLink) {
      thumbnailLinks.push({ link: thumbnail.dataset.sourceLink, imgSrc: img.src, index });
    }
  });

  return thumbnailLinks;
};

// Get the current thumbnail links
export const getThumbnailLinks = () => thumbnailLinks;

function createThumbnail(link, isUntrusted) {
  // Ensure the link is wrapped in an image-container.
  let container = link.parentElement;
  if (!container.classList.contains('image-container')) {
    container = document.createElement('div');
    container.classList.add('image-container');
    // Insert the container before the link and then move the link into it.
    link.parentNode.insertBefore(container, link);
    container.appendChild(link);
  }

  // Create the thumbnail element.
  const thumbnail = document.createElement("div");
  thumbnail.classList.add("clickable-thumbnail");
  thumbnail.dataset.sourceLink = link.href;

  const img = document.createElement("img");
  img.src = link.href;

  img.onload = () => {
    thumbnail.appendChild(img);
    // Append the thumbnail to the container instead of next to the link.
    container.appendChild(thumbnail);
    scrollToBottom(600);
  };

  img.onerror = () => {
    logMessage(`Failed to load image: ${link.href}`, 'error');
    link.classList.add("skipped");
  };

  if (isUntrusted) {
    if (!link.querySelector(".clickable-thumbnail")) {
      link.addEventListener("click", () => {
        if (!link.querySelector(".clickable-thumbnail")) {
          thumbnail.appendChild(img);
          container.appendChild(thumbnail);
        }
      });
    }
  } else {
    thumbnail.appendChild(img);
    container.appendChild(thumbnail);
  }

  thumbnail.addEventListener("click", (e) => {
    e.stopPropagation();
    const updatedLinks = refreshThumbnailLinks();
    const clickedIndex = updatedLinks.findIndex(
      (item) => item.link === link.href || item.imgSrc === img.src
    );

    const expandedImage = createExpandedView(
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
  link.textContent = `${emojis.image} ${extension.toUpperCase()} ${emojis.domain} ${domain} ${emojis.untrusted} Untrusted`;
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
  link.textContent = `${emojis.image} ${extension.toUpperCase()} ${emojis.domain} ${domain}`;
  link.classList.add("processed-image");
  createThumbnail(link, false);
}

export function convertImageLinksToImage() {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  const links = container.querySelectorAll("a:not(.skipped):not(.processed-image)");
  if (!links.length) return;

  links.forEach((link) => {
    if (!link.href || !link.href.startsWith("http")) return;
    const { allowed, extension } = isAllowedImageExtension(link.href);
    if (!allowed) return;

    link.classList.add("media");
    const { isTrusted, domain } = isTrustedDomain(link.href);
    createCustomTooltip(link, isEncodedURL(link.href) ? decodeURL(link.href) : link.href);

    isTrusted
      ? handleTrustedLink(link, extension, domain)
      : handleUntrustedLink(link, extension, domain);
  });
}