/**
 * BrightAI Conversation Memory Service (conversationMemoryService.js)
 * ─────────────────────────────────────────────────────────────
 * - Uses in-memory Map for lightning-fast session tracking.
 * - Stores a maximum of 20 messages per conversation session.
 * - Enforces automatic TTL of 30 minutes for inactive sessions.
 * - DOES NOT USE SQLite or any persistent database (strictly memory-only).
 */
const { logger } = require('../utils/logger');

// In-memory Map to store conversation histories
// Structure: sessionKey -> { messages: [...], lastActiveAt: number }
const sessions = new Map();

// Session expiry configuration (30 minutes)
const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_MESSAGES_PER_SESSION = 20;

// Periodically clean expired sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [conversationId, session] of sessions.entries()) {
    if (now - session.lastActiveAt > SESSION_TTL_MS) {
      sessions.delete(conversationId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.info('conversation_memory_sessions_cleaned', { count: cleanedCount, remaining: sessions.size });
  }
}, 10 * 60 * 1000);

/**
 * Get message history for a conversation
 * @param {string} conversationId 
 * @returns {Array} List of messages
 */
function getHistory(conversationId) {
  if (!conversationId) return [];
  
  const session = sessions.get(conversationId);
  if (!session) return [];
  
  // Update last active timestamp
  session.lastActiveAt = Date.now();
  return session.messages;
}

/**
 * Append a new message to conversation history
 * @param {string} conversationId 
 * @param {string} sender 'user' | 'assistant'
 * @param {string} text 
 */
function appendMessage(conversationId, sender, text) {
  if (!conversationId) return;
  
  let session = sessions.get(conversationId);
  if (!session) {
    session = {
      messages: [],
      lastActiveAt: Date.now()
    };
    sessions.set(conversationId, session);
  }
  
  session.lastActiveAt = Date.now();
  session.messages.push({ sender, text, timestamp: new Date().toISOString() });
  
  // Enforce the 20 messages limit strictly (sliding window)
  if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
    session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
  }
}

/**
 * Clear message history for a conversation
 * @param {string} conversationId 
 */
function clearSession(conversationId) {
  if (!conversationId) return false;
  
  const deleted = sessions.delete(conversationId);
  if (deleted) {
    logger.info('conversation_memory_session_cleared', { conversationId });
  }
  return deleted;
}

module.exports = {
  getHistory,
  appendMessage,
  clearSession,
  sessions
};
