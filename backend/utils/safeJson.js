function safeJsonParse(value, fallback = null) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function extractJsonObject(value) {
  const parsed = safeJsonParse(value);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  if (typeof value !== 'string') return null;
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  return safeJsonParse(value.slice(start, end + 1));
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return '{}';
  }
}

module.exports = {
  safeJsonParse,
  extractJsonObject,
  safeStringify
};
