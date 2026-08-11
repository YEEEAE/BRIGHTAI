import type { z } from 'zod';

const buckets = new Map<string, { startedAt: number; count: number }>();

export function parseStructuredResponse<T>(raw: string, schema: z.ZodType<T>): T {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('invalid_structured_output'); }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new Error('invalid_structured_output');
  return result.data;
}

export function consumeAiRateLimit(userId: string | number, feature: string, options: { limit: number; windowMs: number } = { limit: 10, windowMs: 60_000 }): boolean {
  const key = `${String(userId)}:${feature}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= options.windowMs) {
    buckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= options.limit) return false;
  current.count += 1;
  return true;
}
