import { decodeURL, isEncodedURL } from "./helpers/helpers.js";

export const parseMessageText = text => {
  // First, apply markdown transformations
  text = parseMarkdown(text);

  let i = 0, urls = [];
  // Extract URLs and replace them with placeholders
  text = text.replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~|!:,.;()_]*[-A-Z0-9+&@#\/%=~|()_])/ig, m => {
    urls.push(m);
    return `___URL${i++}___`;
  });

  // Replace smilies and adjust emoji presentation
  text = text
    .replace(/:(\w+):/g, (_, e) => `<img src="https://klavogonki.ru/img/smilies/${e}.gif" alt="${e}" />`)
    .replace(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu, '<span class="emoji-adjuster">$&</span>');

  // Replace placeholders with anchor tags after markdown processing
  urls.forEach((url, idx) => {
    if (isEncodedURL(url)) {
      const decodedURL = decodeURL(url);
      text = text.replace(
        `___URL${idx}___`,
        `<a class="processed-link decoded-link" href="${url}" target="_blank">${decodedURL}</a>`
      );
    } else {
      text = text.replace(
        `___URL${idx}___`,
        `<a class="processed-link" href="${url}" target="_blank">${url}</a>`
      );
    }
  });

  return text;
}

// Basic markdown support function with additional CSS classes
export const parseMarkdown = text => {
  // Convert markdown headings to HTML headings with extra class names
  text = text.replace(/^######\s+(.*)$/gim, '<h6 class="md-heading md-h6">$1</h6>');
  text = text.replace(/^#####\s+(.*)$/gim, '<h5 class="md-heading md-h5">$1</h5>');
  text = text.replace(/^####\s+(.*)$/gim, '<h4 class="md-heading md-h4">$1</h4>');
  text = text.replace(/^###\s+(.*)$/gim, '<h3 class="md-heading md-h3">$1</h3>');
  text = text.replace(/^##\s+(.*)$/gim, '<h2 class="md-heading md-h2">$1</h2>');
  text = text.replace(/^#\s+(.*)$/gim, '<h1 class="md-heading md-h1">$1</h1>');

  // Convert inline code enclosed in backticks
  text = text.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');

  // Convert bold text (using ** only)
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="md-bold">$1</strong>');

  // Convert italic text (using __ only)
  text = text.replace(/__(.+?)__/g, '<em class="md-italic">$1</em>');

  // Convert markdown strikethrough using ~~text~~
  text = text.replace(/~~(.+?)~~/g, '<del class="md-strikethrough">$1</del>');

  return text;
};
