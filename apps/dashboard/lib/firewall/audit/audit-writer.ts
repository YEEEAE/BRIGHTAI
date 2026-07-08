/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * High-level audit writer for firewall events. Wraps the
 * tamper-evident chain in a firewall-specific payload.
 *
 * Use this from the API routes. Use `appendAuditLog` directly only
 * when you need the lower-level row shape.
 */

import { appendAuditLog } from './hashchain';
import type { Detection, FirewallContext } from '../detectors/types';

export interface FirewallEventMetadata {
  /** Latency of the firewall pass in ms. */
  latencyMs: number;
  /** PII types detected (unique, sorted). */
  piiTypes: string[];
  /** Count of detections before dedupe. */
  detectionCount: number;
  /** Hash of the original (pre-redaction) text — for traceability, not reversibility. */
  originalTextSha256: string;
  /** Length of the original text in chars. */
  originalLength: number;
  /** The action that was applied (per-policy effective action). */
  effectiveAction: string;
  /** The LLM model used downstream (e.g. 'llama-3.1-8b-instant'). Null if no LLM call. */
  model?: string | null;
  /** Tokens used by the LLM call. Null if no LLM call. */
  tokensUsed?: number | null;
  /** Whether the request was blocked (any detection had action=block). */
  blocked: boolean;
  /** Latency of the LLM call in ms (if applicable). */
  llmLatencyMs?: number | null;
  /** Free-form notes (e.g. error messages). Never include raw PII. */
  notes?: string;
}

/**
 * Log a firewall pass to the tamper-evident audit chain. The
 * original text is NEVER included — only its SHA-256. This keeps
 * the audit log useful without re-introducing the PII we just
 * redacted.
 */
export async function logFirewallEvent(
  ctx: FirewallContext,
  metadata: FirewallEventMetadata,
): Promise<{ id: string; hash: string }> {
  const row = await appendAuditLog({
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    actorType: 'USER',
    action: 'REQUEST_CREATED',
    targetType: 'AIRequest',
    targetId: ctx.requestId,
    metadata: metadata as unknown as Record<string, unknown>,
  });
  return { id: row.id, hash: row.hash };
}

/**
 * Build a SHA-256 of the original text for the audit metadata.
 * Uses Node's built-in crypto (sync, fast).
 */
export function sha256Text(text: string): string {
  // Lazy import to keep cold start small.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHash } = require('node:crypto') as typeof import('node:crypto');
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Derive the set of unique PII types from a detection list. */
export function uniquePiiTypes(detections: Detection[]): string[] {
  return Array.from(new Set(detections.map((d) => d.type))).sort();
}
