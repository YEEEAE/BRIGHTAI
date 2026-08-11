/** Remove unnecessary direct identifiers and secret-shaped content before prompts are built. */
export function redactUnnecessaryPii(value: string): string {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/(?:\+?966|0)5\d{8}/g, '[REDACTED_PHONE]')
    .replace(/(?:password|passwd|session|token|api[_-]?key|authorization)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED_SECRET]');
}

export function redactContext<T>(context: T): T {
  if (typeof context === 'string') return redactUnnecessaryPii(context) as T;
  if (Array.isArray(context)) return context.map((item) => redactContext(item)) as T;
  if (context && typeof context === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context as Record<string, unknown>)) {
      if (/password|secret|token|api.?key|authorization|file_data|blob/i.test(key)) continue;
      output[key] = redactContext(value);
    }
    return output as T;
  }
  return context;
}
