/**
 * Loads chat history from local storage
 * Only returns messages from today
 * @returns {Array} Array of message objects
 */
export function loadChatHistory() {
  const stored = localStorage.getItem("chatHistory");
  if (stored) {
    try {
      const data = JSON.parse(stored);
      const today = new Date().toISOString().slice(0, 10);
      // Only return messages if the date matches today's date
      if (data.date === today && Array.isArray(data.messages)) {
        return data.messages;
      }
    } catch (err) {
      console.error("Error parsing chat history:", err);
      // In case of JSON parse error, return empty array
    }
  }
  // Return empty array if no valid data found
  return [];
}

/**
 * Saves chat history to local storage
 * @param {Array} messages - Array of message objects to save
 */
export function saveChatHistory(messages) {
  const today = new Date().toISOString().slice(0, 10);
  const data = {
    date: today,
    messages: messages
  };
  localStorage.setItem("chatHistory", JSON.stringify(data));
}