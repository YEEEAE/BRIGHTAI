/**
 * Converts an arbitrary context object (from the frontend) into
 * a clean, readable string for injection into the prompt.
 */
export function buildContext(context) {
  if (!context || typeof context !== 'object') return 'لا يوجد سياق إضافي.';

  const lines = Object.entries(context)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);

  return lines.length > 0 ? lines.join('\n') : 'لا يوجد سياق إضافي.';
}
