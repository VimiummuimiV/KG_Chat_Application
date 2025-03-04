/**
 * Save chat history to localStorage
 * @param {Array} messages - Array of message objects
 */
export function saveChatHistory(messages) {
  try {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

/**
 * Load chat history from localStorage
 * @returns {Array} Array of message objects or empty array if none found
 */
export function loadChatHistory() {
  try {
    const data = localStorage.getItem('chatMessages');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
}