'use strict';

/**
 * Session-based conversation memory with TTL using a Map (no database).
 *
 * - TTL of 2 hours per conversation (auto-expire)
 * - Max 50 messages per conversation
 * - Max 1000 concurrent conversations
 * - Auto-cleanup of expired conversations every 10 minutes
 */

const { logger } = require('../utils/logger');

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_MESSAGES_PER_CONVERSATION = 50;
const MAX_CONCURRENT_CONVERSATIONS = 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const sessions = new Map();

/**
 * Retrieve the message history for a given conversation ID.
 * Returns an empty array if the conversation does not exist or has expired.
 *
 * @param {string} conversationId
 * @returns {Array<{role: string, content: string, ts: string}>}
 */
function getHistory(conversationId) {
  if (!conversationId) return [];

  const entry = sessions.get(conversationId);
  if (!entry) return [];

  if (Date.now() > entry.expiresAt) {
    sessions.delete(conversationId);
    return [];
  }

  return entry.messages;
}

/**
 * Append a message to a conversation's history.
 * Creates the conversation entry if it does not exist (or has expired).
 * Enforces the max-messages limit by trimming from the head.
 * Enforces the max-conversations limit by evicting the oldest entry.
 *
 * @param {string} conversationId
 * @param {'user'|'assistant'|'system'} role
 * @param {string} content
 */
function appendMessage(conversationId, role, content) {
  if (!conversationId) return;

  let entry = sessions.get(conversationId);

  // If expired or missing, create a fresh entry
  if (!entry || Date.now() > entry.expiresAt) {
    // Enforce max concurrent conversations before adding a new one
    if (!entry && sessions.size >= MAX_CONCURRENT_CONVERSATIONS) {
      evictOldest();
    }

    entry = {
      messages: [],
      expiresAt: Date.now() + SESSION_TTL_MS,
      createdAt: Date.now()
    };
    sessions.set(conversationId, entry);
  }

  // Reset TTL on every new message
  entry.expiresAt = Date.now() + SESSION_TTL_MS;

  entry.messages.push({
    role,
    content,
    ts: new Date().toISOString()
  });

  // Trim to max messages (keep the most recent)
  if (entry.messages.length > MAX_MESSAGES_PER_CONVERSATION) {
    entry.messages = entry.messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
  }
}

/**
 * Remove all messages for a conversation.
 *
 * @param {string} conversationId
 */
function clearConversation(conversationId) {
  if (!conversationId) return;
  sessions.delete(conversationId);
}

/**
 * Return the current number of active (non-expired) conversations.
 *
 * @returns {number}
 */
function activeCount() {
  cleanupExpired();
  return sessions.size;
}

/**
 * Evict the oldest conversation entry (by createdAt) to make room.
 */
function evictOldest() {
  let oldestKey = null;
  let oldestTime = Infinity;

  for (const [key, entry] of sessions) {
    if (entry.createdAt < oldestTime) {
      oldestTime = entry.createdAt;
      oldestKey = key;
    }
  }

  if (oldestKey !== null) {
    sessions.delete(oldestKey);
    logger.info('session_memory_evicted', { conversationId: oldestKey, reason: 'max_capacity' });
  }
}

/**
 * Iterate through all sessions and remove expired ones.
 */
function cleanupExpired() {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of sessions) {
    if (now > entry.expiresAt) {
      sessions.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    logger.info('session_memory_cleanup', { removed, remaining: sessions.size });
  }
}

// Periodic auto-cleanup
const cleanupTimer = setInterval(cleanupExpired, CLEANUP_INTERVAL_MS);
// Allow the process to exit even if the timer is still running
if (cleanupTimer.unref) cleanupTimer.unref();

module.exports = {
  getHistory,
  appendMessage,
  clearConversation,
  activeCount,
  cleanupExpired,
  SESSION_TTL_MS,
  MAX_MESSAGES_PER_CONVERSATION,
  MAX_CONCURRENT_CONVERSATIONS,
  sessions
};
