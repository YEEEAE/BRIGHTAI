/**
 * src/lib/usagetracker.ts — USAGE-001 (2026-07-15)
 *
 * Token usage tracking for AI chat. يكتب entries في ai_usage_entries
 * table بعد كل provider call. يستخدم لـ:
 *   - usage-based billing
 *   - cost anomaly alerts (>2x daily average)
 *   - product analytics (prompt → model → cost)
 *
 * WHY:
 *   - chat.ts في marketing site (anon) — organizationId = null في كل entries.
 *   - apps/dashboard chat (authenticated) — يمر عبر Clerk → يقدر يحمل organizationId.
 *   - الـ cost يُحسب عند الـ insert (pricing يقدر يتغير لاحقاً، بس entries
 *     تحتفظ بـ cost وقت الـ call — audit trail).
 *
 * COST TABLE (2026 rates):
 *   - llama-3.3-70b-versatile: input $0.59/M, output $0.79/M
 *   - gemini-2.5-flash: input $0.30/M, output $1.20/M
 *
 * NON-NEGOTIABLES:
 *   - DB write failures لا تفشل الـ user request — نـ log ونكمل.
 *   - الـ cost يُحسب محلياً (لا API calls للـ pricing lookup).
 *   - organizationId nullable (marketing site anon).
 */

import { db } from '@brightai/db';
import type { Prisma } from '@brightai/db';

// ─────────────────────────────────────────────────────────────────────────
// Cost table (per 1K tokens, USD)
// ─────────────────────────────────────────────────────────────────────────

interface CostRates {
  input: number;
  output: number;
}

const COST_PER_1K_TOKENS: Record<string, CostRates> = {
  'llama-3.3-70b-versatile': { input: 0.00059, output: 0.00079 },
  'gemini-2.5-flash':        { input: 0.00030, output: 0.00120 },
  // Groq Llama 3.1 8B (fallback if env overrides)
  'llama-3.1-8b-instant':    { input: 0.00005, output: 0.00008 },
};

/**
 * Calculate cost in USD for a usage entry.
 * Returns 0 for unknown models (logged as warning).
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string,
): number {
  const rates = COST_PER_1K_TOKENS[model];
  if (!rates) {
    // eslint-disable-next-line no-console
    console.warn(`[usagetracker] unknown model for cost calc: ${model}`);
    return 0;
  }
  const inputCost = (promptTokens / 1000) * rates.input;
  const outputCost = (completionTokens / 1000) * rates.output;
  // Round to 6 decimal places (matches Decimal(10,6) in schema).
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

// ─────────────────────────────────────────────────────────────────────────
// Usage entry shape
// ─────────────────────────────────────────────────────────────────────────

export interface UsageInput {
  provider: 'groq' | 'gemini';
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  promptId?: string;
  organizationId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
}

/**
 * Record a usage entry. Failures are logged but never thrown —
 * the user request has already succeeded, we don't want to surface
 * a tracking error as a 500.
 *
 * Returns the created entry id on success, null on failure.
 */
export async function recordUsage(input: UsageInput): Promise<string | null> {
  const totalTokens = input.promptTokens + input.completionTokens;
  const cost = calculateCost(input.promptTokens, input.completionTokens, input.model);

  try {
    const entry = await db.aiUsageEntry.create({
      data: {
        organizationId: input.organizationId ?? null,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        provider: input.provider,
        model: input.model,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        totalTokens,
        latencyMs: input.latencyMs,
        promptId: input.promptId ?? null,
        cost,
      },
      select: { id: true },
    });
    return entry.id;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[usagetracker] failed to record usage: ` +
      `provider=${input.provider} model=${input.model} ` +
      `tokens=${totalTokens} cost=${cost} error=${(err as Error).message}`,
    );
    return null;
  }
}

/**
 * Fire-and-forget wrapper. استدعي من handler بعد success.
 * ما ينتظر الـ DB write — يحرر الـ response فوراً.
 */
export function recordUsageAsync(input: UsageInput): void {
  // نتعمد عدم await — الـ response يخرج قبل ما يكتمل الـ DB write.
  // الـ error logging داخل recordUsage يلتقط أي فشل.
  void recordUsage(input);
}

// Re-export Prisma types للاستخدام في dashboard
export type { Prisma };