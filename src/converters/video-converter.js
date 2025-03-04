import {
  decodeURL,
  isEncodedURL,
  scrollMessagesToBottom,
  isTrustedDomain
} from "../helpers";

const emojis = { image: '🎥', domain: '🖥️', untrusted: '💀️️' };
const allowedVideoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];

const isAllowedVideoExtension = url => {
  const ext = url.match(/\.([^?#.]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() || '';
  return { allowed: allowedVideoExtensions.includes(ext), extension: ext };
};

export function convertVideoLinksToPlayer(containerType) {
  const selectors = {
    generalMessages: '.messages-content div',
    chatlogsMessages: '.chat-logs-container',
    personalMessages: '.messages-container-wrapper'
  };
  const container = document.querySelector(selectors[containerType]);
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
      link.textContent = `${emojis.image} ${videoInfo.videoType} ${emojis.domain} Hostname (${domain}) ${emojis.untrusted} Untrusted`;
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
  
  function processVideoLink(link, url, domain, videoInfo) {
    const { youtubeMatch, videoType, videoId } = videoInfo;
    const videoCheck = isAllowedVideoExtension(url);
    if (!youtubeMatch && !videoCheck.allowed) return;
    
    link.classList.add("processed-video");
    const wrapper = document.createElement('div');
    wrapper.classList.add("video-wrapper");
    
    const embed = document.createElement(youtubeMatch ? 'iframe' : 'video');
    embed.classList.add("video-container");
    
    link.textContent = `${emojis.image} ${videoType} ${emojis.domain} Hostname (${domain})`;
    
    if (youtubeMatch) {
      embed.src = `https://www.youtube.com/embed/${videoId}`;
      embed.allowFullscreen = true;
    } else {
      embed.src = url;
      embed.controls = true;
    }
    
    link.title = isEncodedURL(url) ? decodeURL(url) : url;
    link.style.display = 'inline-flex';
    
    link.parentNode.insertBefore(wrapper, link);
    wrapper.append(link, embed);
    
    scrollMessagesToBottom(containerType);
  }
  
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
}
