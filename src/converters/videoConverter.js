import {
  decodeURL,
  isEncodedURL,
  isTrustedDomain,
  scrollToBottom,
  logMessage
} from "../helpers/helpers.js";
import { createCustomTooltip } from "../helpers/tooltip.js";

// Constants
const emojis = {
  channel: '📺',
  title: '📹',
  type: '🎬️',
  domain: '🖥️',
  untrusted: '💀️️'
};
const allowedVideoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];

// Utility Functions

/** Checks if a URL has an allowed video extension */
const isAllowedVideoExtension = url => {
  const ext = url.match(/\.([^?#.]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() || '';
  return { allowed: allowedVideoExtensions.includes(ext), extension: ext };
};

// Global Variables
let sharedYouTubePlayer = null; // Shared YouTube player instance
let activeYouTubePlaceholder = null; // Tracks the currently active YouTube preview

/** Returns or creates a shared YouTube iframe player */
function getSharedYouTubePlayer() {
  if (!sharedYouTubePlayer) {
    sharedYouTubePlayer = document.createElement('iframe');
    sharedYouTubePlayer.classList.add("video-container");
    sharedYouTubePlayer.allowFullscreen = true;
  }
  return sharedYouTubePlayer;
}

/** Fetches YouTube metadata using the oEmbed endpoint */
async function fetchYouTubeMetadata(videoId) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const response = await fetch(oembedUrl);
    const data = await response.json();
    const title = data.title || 'Title not found';
    const channel = data.author_name || 'Channel not found';
    return { title, channel };
  } catch (error) {
    logMessage("Error fetching YouTube metadata.", 'error');
    return { title: 'Error', channel: 'Error' };
  }
}

/** Renders a YouTube preview with metadata and thumbnail */
async function renderYouTubePreview(infoContainer, placeholder, videoId, videoType) {
  infoContainer.hidden = true;
  placeholder.hidden = true;

  const metadata = await fetchYouTubeMetadata(videoId);

  const channel = document.createElement('span');
  channel.classList.add("channel-name");
  channel.textContent = `${emojis.channel} ${metadata.channel}`;

  const title = document.createElement('span');
  title.classList.add("video-title");
  title.textContent = `${emojis.title} ${metadata.title}`;

  const thumb = new Image();
  thumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  thumb.alt = videoType;
  thumb.classList.add("youtube-thumb");

  thumb.addEventListener('load', () => {
    infoContainer.replaceChildren(channel, title);
    placeholder.replaceChildren(thumb);
    infoContainer.hidden = false;
    placeholder.hidden = false;
    scrollToBottom(600);
  });

  thumb.addEventListener('error', () => {
    logMessage(`Error loading Youtube thumbnail image for ${videoId}.`, 'error');
  });
}

/** Extracts video information from a URL */
function getVideoInfo(url) {
  const youtubeMatch = url.match(/(?:shorts\/|live\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    const videoType = url.includes('shorts/') ? 'Shorts' :
      url.includes('live/') ? 'Live' :
        url.includes('watch?v=') ? 'Watch' :
          url.includes('youtu.be/') ? 'Share' : 'YouTube';
    return { youtubeMatch: true, videoId, videoType };
  }

  const extension = url.split('.').pop().toLowerCase();
  if (allowedVideoExtensions.includes(extension)) {
    return { youtubeMatch: false, videoType: `Video (${extension.toUpperCase()})` };
  }
  return false;
}

/** Main function to convert video links to players or previews */
export function convertVideoLinksToPlayer() {
  const container = document.getElementById('messages-panel');
  if (!container) return;

  const links = container.querySelectorAll("a:not(.skipped):not(.processed-video)");
  if (!links.length) return;

  links.forEach(link => {
    const url = link.href;
    if (!url) return;

    const videoInfo = getVideoInfo(url);
    if (!videoInfo) return;

    link.classList.add("media");
    const { isTrusted, domain } = isTrustedDomain(url);

    if (!isTrusted) {
      link.classList.add("skipped");
      link.textContent = `${emojis.type} ${videoInfo.videoType} ${emojis.domain} ${domain} ${emojis.untrusted} Untrusted`;
      link.addEventListener("click", e => {
        if (!link.classList.contains("processed-video")) {
          e.preventDefault();
          link.classList.remove("skipped");
          processVideoLink(link, url, domain, videoInfo);
        }
      });
      return;
    }

    processVideoLink(link, url, domain, videoInfo);
  });

  /** Processes a single video link */
  async function processVideoLink(link, url, domain, videoInfo) {
    const { youtubeMatch, videoType, videoId } = videoInfo;
    const videoCheck = isAllowedVideoExtension(url);
    if (!youtubeMatch && !videoCheck.allowed) return;

    link.classList.add("processed-video");

    const wrapper = document.createElement('div');
    wrapper.classList.add("video-wrapper");

    link.textContent = `${emojis.type} ${videoType} ${emojis.domain} ${domain}`;
    createCustomTooltip(link, isEncodedURL(url) ? decodeURL(url) : url);
    link.style.display = 'inline-flex';

    if (youtubeMatch) {
      const infoContainer = document.createElement('div');
      infoContainer.classList.add("youtube-info");

      const placeholder = document.createElement('div');
      placeholder.classList.add("youtube-placeholder");
      placeholder.dataset.videoId = videoId;
      placeholder.dataset.videoType = videoType;

      link.parentNode.insertBefore(wrapper, link);
      wrapper.append(link, infoContainer, placeholder);

      await renderYouTubePreview(infoContainer, placeholder, videoId, videoType);

      placeholder.addEventListener("click", () => {
        if (activeYouTubePlaceholder && activeYouTubePlaceholder !== placeholder) {
          const prevVideoId = activeYouTubePlaceholder.dataset.videoId;
          const prevVideoType = activeYouTubePlaceholder.dataset.videoType;
          renderYouTubePreview(
            activeYouTubePlaceholder.previousElementSibling,
            activeYouTubePlaceholder,
            prevVideoId,
            prevVideoType
          );
        }
        activeYouTubePlaceholder = placeholder;

        const player = getSharedYouTubePlayer();
        player.hidden = true;
        player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        placeholder.replaceChildren(player);
        player.addEventListener('load', () => {
          player.hidden = false;
        });
      });
    } else {
      const embed = document.createElement('video');
      embed.classList.add("video-container");
      embed.src = url;
      embed.controls = true;
      embed.hidden = true;

      embed.addEventListener('loadeddata', () => {
        embed.hidden = false;
        scrollToBottom(600);
      });

      embed.addEventListener('error', () => {
        logMessage(`Error loading video source: ${url}`, 'error');
        wrapper.replaceChildren(link);
      });

      link.parentNode.insertBefore(wrapper, link);
      wrapper.append(link, embed);
    }
  }
}
