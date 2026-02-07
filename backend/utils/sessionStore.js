/**
 * Session Store for short-lived demo memory
 * Keeps recent history in-memory with TTL
 */

const SESSION_TTL_MS = 10 * 60 * 1000;
const MAX_HISTORY_ITEMS = 8;

const sessions = new Map();

function createSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getSession(sessionId) {
  if (!sessionId) return null;
  return sessions.get(sessionId) || null;
}

function getOrCreateSession(sessionId) {
  const id = sessionId || createSessionId();
  let session = sessions.get(id);
  if (!session) {
    session = {
      id,
      history: [],
      updatedAt: Date.now()
    };
    sessions.set(id, session);
  } else {
    session.updatedAt = Date.now();
  }
  return session;
}

function addToSession(sessionId, role, content) {
  const session = getOrCreateSession(sessionId);
  session.history.push({ role, content });
  if (session.history.length > MAX_HISTORY_ITEMS) {
    session.history = session.history.slice(-MAX_HISTORY_ITEMS);
  }
  session.updatedAt = Date.now();
  return session;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

const cleanupTimer = setInterval(cleanupSessions, 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

module.exports = {
  SESSION_TTL_MS,
  MAX_HISTORY_ITEMS,
  createSessionId,
  getSession,
  getOrCreateSession,
  addToSession,
  cleanupSessions
};
