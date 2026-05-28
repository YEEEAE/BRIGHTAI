/**
 * Session Store for short-lived demo memory
 * Keeps recent history in-memory with TTL
 * Privacy posture:
 * - In-memory only (no disk persistence)
 * - Redacts common sensitive patterns before storing
 * - Truncates long entries to reduce exposure
 */

const SESSION_TTL_MS = parseInt(process.env.CHAT_SESSION_TTL_MS, 10) || 10 * 60 * 1000;
const MAX_HISTORY_ITEMS = parseInt(process.env.CHAT_SESSION_MAX_ITEMS, 10) || 8;
const MAX_CONTENT_CHARS = parseInt(process.env.CHAT_SESSION_MAX_CHARS, 10) || 600;

const sessions = new Map();

const SENSITIVE_PATTERNS = [
  // Emails
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email-hidden]'],
  // Saudi mobile and landline formats
  [/\b(?:\+?966|0)?5\d{8}\b/g, '[phone-hidden]'],
  [/\b(?:\+?966|0)?1\d{8}\b/g, '[phone-hidden]'],
  // IBAN-like values
  [/\bSA\d{22}\b/gi, '[iban-hidden]'],
  // Generic long numeric IDs
  [/\b\d{10,16}\b/g, '[id-hidden]']
];

function createSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function redactSensitiveText(content) {
  if (typeof content !== 'string') return '';

  let safe = content;
  for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
    safe = safe.replace(pattern, replacement);
  }

  return safe.trim().slice(0, MAX_CONTENT_CHARS);
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
  const sanitizedContent = redactSensitiveText(content);
  if (!sanitizedContent) return session;

  session.history.push({
    role,
    content: sanitizedContent
  });

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
  redactSensitiveText,
  getSession,
  getOrCreateSession,
  addToSession,
  cleanupSessions
};
