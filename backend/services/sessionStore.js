/**
 * In-memory Gemini conversation history store.
 * Keeps the last 20 Gemini messages per conversation for multi-turn chat.
 */

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_MESSAGES = 20;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
const MAX_MESSAGE_CHARS = 4000;

const sessions = new Map();

function normalizeConversationId(conversationId) {
  return String(conversationId || '').trim().slice(0, 160);
}

function normalizeText(value) {
  return String(value || '').trim().slice(0, MAX_MESSAGE_CHARS);
}

function touchSession(conversationId) {
  const id = normalizeConversationId(conversationId);
  if (!id) return null;

  let session = sessions.get(id);
  if (!session) {
    session = {
      history: [],
      lastUsedAt: Date.now()
    };
    sessions.set(id, session);
  } else {
    session.lastUsedAt = Date.now();
  }

  return session;
}

function getSessionHistory(conversationId) {
  const session = touchSession(conversationId);
  if (!session) return [];
  return session.history.slice();
}

function addToHistory(conversationId, userMsg, aiReply) {
  const session = touchSession(conversationId);
  if (!session) return [];

  const userText = normalizeText(userMsg);
  const aiText = normalizeText(aiReply);

  if (userText) {
    session.history.push({
      role: 'user',
      parts: [{ text: userText }]
    });
  }

  if (aiText) {
    session.history.push({
      role: 'model',
      parts: [{ text: aiText }]
    });
  }

  if (session.history.length > MAX_MESSAGES) {
    session.history = session.history.slice(-MAX_MESSAGES);
  }

  session.lastUsedAt = Date.now();
  return session.history.slice();
}

function clearSession(conversationId) {
  const id = normalizeConversationId(conversationId);
  if (!id) return false;
  return sessions.delete(id);
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [conversationId, session] of sessions.entries()) {
    if (now - session.lastUsedAt > SESSION_TTL_MS) {
      sessions.delete(conversationId);
    }
  }
}

const cleanupTimer = setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

module.exports = {
  SESSION_TTL_MS,
  MAX_MESSAGES,
  getSessionHistory,
  addToHistory,
  clearSession,
  cleanupExpiredSessions
};
