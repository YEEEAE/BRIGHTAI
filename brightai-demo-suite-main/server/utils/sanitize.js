/**
 * Sanitizes user-supplied text before it enters the prompt.
 * Strips potential prompt injection patterns while preserving Arabic characters.
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Collapse excessive newlines (keep max 2)
    .replace(/\n{3,}/g, '\n\n')
    // Remove HTML/script tags
    .replace(/<[^>]*>/g, '')
    // Remove common prompt injection patterns
    .replace(/ignore\s+all\s+(previous|prior|above)\s+instructions?/gi, '[REDACTED]')
    .replace(/system\s*:\s*/gi, '')
    // Trim again after replacements
    .trim();
}
