const MAX_TEXT_LENGTH = 3000;
const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF]/g;
const BLOCKED_ELEMENT_PATTERN = /<(script|iframe|object)\b[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const WHITESPACE_PATTERN = /\s+/g;

function sanitizeText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(ZERO_WIDTH_PATTERN, '')
    .replace(BLOCKED_ELEMENT_PATTERN, '')
    .replace(HTML_TAG_PATTERN, '')
    .replace(WHITESPACE_PATTERN, ' ')
    .trim()
    .slice(0, maxLength);
}

function sanitizeObject(value, depth = 0) {
  if (depth > 4) return null;
  if (typeof value === 'string') return sanitizeText(value);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map(item => sanitizeObject(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 40)
        .map(([key, item]) => [sanitizeText(key, 80), sanitizeObject(item, depth + 1)])
        .filter(([key]) => key)
    );
  }
  return null;
}

module.exports = {
  sanitizeText,
  sanitizeObject,
  MAX_TEXT_LENGTH,
  ZERO_WIDTH_PATTERN
};
