import { settings, defaultLanguage } from "../data/definitions.js";
import { checkIsMobile } from "./helpers.js";

let tooltipEl = null, tooltipHideTimer = null, tooltipShowTimer = null;
let tooltipIsVisible = false, tooltipCurrentTarget = null;

const positionTooltip = (clientX, clientY) => {
  if (!tooltipEl) return;
  let leftPos = clientX + 10;
  const tooltipWidth = tooltipEl.offsetWidth;
  const tooltipHeight = tooltipEl.offsetHeight;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Adjust position if overflowing horizontally
  leftPos = Math.min(Math.max(leftPos, 10), screenWidth - tooltipWidth - 10);

  // Use separate margins for top and bottom
  const topMargin = 18, bottomMargin = 0;
  let topPos = clientY + topMargin;

  // If tooltip would overflow at the bottom, try above the cursor
  if (topPos + tooltipHeight > screenHeight - bottomMargin) {
    const above = clientY - tooltipHeight - topMargin;
    if (above >= topMargin) {
      topPos = above;
    } else {
      // Clamp to bottom margin if above is not possible
      topPos = screenHeight - tooltipHeight - bottomMargin;
    }
  }

  // Clamp to always respect top margin
  topPos = Math.max(topMargin, topPos);

  tooltipEl.style.left = `${leftPos}px`;
  tooltipEl.style.top = `${topPos}px`;
};

const tooltipTrackMouse = e => tooltipEl && positionTooltip(e.clientX, e.clientY);

const hideTooltipElement = () => {
  tooltipIsVisible = false;
  tooltipCurrentTarget = null;
  clearTimeout(tooltipShowTimer);
  clearTimeout(tooltipHideTimer);

  tooltipHideTimer = setTimeout(() => {
    if (!tooltipEl) return;
    tooltipEl.style.opacity = '0';

    setTimeout(() => {
      if (!tooltipIsVisible && tooltipEl) {
        tooltipEl.style.display = 'none';
        document.removeEventListener('mousemove', tooltipTrackMouse);
        tooltipEl.textContent = '';
      }
    }, settings.tooltipVisibleTime / 2);
  }, settings.tooltipVisibleTime);
};

new MutationObserver(() => {
  if (tooltipCurrentTarget && !document.contains(tooltipCurrentTarget)) hideTooltipElement();
}).observe(document, { childList: true, subtree: true });

// Highlight [Action]Message pairs in the tooltip content
function highlightTooltipActions(str) {
  // Match [Action]Message pairs
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let result = '';
  let lastEnd = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    // Add any text before the first match (shouldn't happen in normal usage)
    if (match.index > lastEnd) result += str.slice(lastEnd, match.index);
    result += `
    <div class="tooltip-item">
      <span class="tooltip-action">${match[1]}</span>&nbsp;
      <span class="tooltip-message">${match[2].trim()}</span>
    </div>`;
    lastEnd = regex.lastIndex;
  }
  // Add any trailing text after the last match
  if (lastEnd < str.length) result += str.slice(lastEnd);
  return result;
}

export function createCustomTooltip(element, tooltipContent, lang = null) {
  if (checkIsMobile()) return; // Prevent tooltips on mobile
  if (tooltipContent == null) return; // Skip if content is null/undefined

  // Determine language: use param, else imported default, else 'en'
  lang = lang || defaultLanguage || 'en';

  // If tooltipContent is an object with language keys, pick the right one
  let content = tooltipContent;
  if (typeof tooltipContent === 'object' && (tooltipContent.en || tooltipContent.ru)) {
    content = tooltipContent[lang] || tooltipContent.en || tooltipContent.ru;
  }

  // Highlight [action] words
  content = highlightTooltipActions(content);

  // Always update the tooltip content stored on the element.
  element._tooltipContent = content;

  // If tooltip event listeners haven't been attached, attach them once.
  if (!element._tooltipInitialized) {
    element._tooltipInitialized = true;

    // Initialize tooltip element if it doesn't exist yet.
    tooltipEl ||= (() => {
      const tooltipDiv = document.createElement('div');
      tooltipDiv.classList.add("custom-tooltip-popup");
      // Optionally, set positioning styles here:
      tooltipDiv.style.position = 'absolute';
      tooltipDiv.style.display = 'none';
      tooltipDiv.style.opacity = '0';
      document.body.appendChild(tooltipDiv);
      return tooltipDiv;
    })();

    element.addEventListener('mouseenter', e => {
      tooltipIsVisible = true;
      tooltipCurrentTarget = element;
      clearTimeout(tooltipHideTimer);
      clearTimeout(tooltipShowTimer);

      // Use the latest stored tooltip content
      tooltipEl.innerHTML = element._tooltipContent;
      tooltipEl.style.display = 'flex';
      tooltipEl.style.opacity = '0';

      // Force layout recalculation to ensure transition works
      tooltipEl.offsetHeight;
      positionTooltip(e.clientX, e.clientY);
      document.addEventListener('mousemove', tooltipTrackMouse);

      tooltipShowTimer = setTimeout(() => {
        tooltipEl.style.opacity = '1';
      }, settings.tooltipLifeTime);
    });

    element.addEventListener('mouseleave', e => {
      hideTooltipElement();
      document.removeEventListener('mousemove', tooltipTrackMouse);
    });
  }
}
