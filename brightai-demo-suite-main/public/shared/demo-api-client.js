/**
 * BrightAI Demo — API Client
 * Handles all communication with /api/demo/:demoId
 */

const API_BASE = '/api';

/**
 * Sends a demo request to the backend.
 * @param {Object} params
 * @param {string} params.demoId    - The demo identifier (e.g. 'ai-agent')
 * @param {string} params.userInput - The user's input text
 * @param {Object} [params.context] - Optional key-value context fields
 * @param {string} [params.language] - 'ar' | 'en' (default: 'ar')
 * @returns {Promise<{success: boolean, response?: string, error?: string}>}
 */
export async function sendDemoRequest({ demoId, userInput, context = {}, language = 'ar' }) {
  const resp = await fetch(`${API_BASE}/demo/${encodeURIComponent(demoId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput, context, language }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new DemoAPIError(data.error || 'حدث خطأ غير متوقع.', resp.status);
  }

  return data;
}

/**
 * Fetches the JSON schema for a demo (for FAQ, context fields, etc.)
 * @param {string} demoId
 * @returns {Promise<Object>}
 */
export async function fetchDemoSchema(demoId) {
  const resp = await fetch(`${API_BASE}/demo/${encodeURIComponent(demoId)}/schema`);
  if (!resp.ok) throw new Error(`Failed to load schema for ${demoId}`);
  return resp.json();
}

/**
 * Custom error class for Demo API errors.
 */
export class DemoAPIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'DemoAPIError';
    this.statusCode = statusCode;
  }
}
