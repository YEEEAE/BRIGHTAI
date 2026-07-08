/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Apply the 4 actions (redact, mask, tokenize, block) to a text
 * given a set of PII detections and a per-org policy.
 *
 * Algorithm:
 *   1. Sort detections by start DESC so we splice from the end of
 *      the string toward the start — no offset drift.
 *   2. For each detection, look up the action in the policy.
 *      If unspecified, fall back to the global default.
 *   3. If any detection has action=block, mark the result as
 *      `blocked=true` (caller decides whether to short-circuit).
 *   4. For `tokenize` action, the optional `tokenVault` callback
 *      is called to produce a reversible token (Phase 1c). If the
 *      callback is not provided, an opaque nanoid placeholder is
 *      generated (for unit tests + Phase 1a behavior).
 *
 * Important: This module is the only place that produces redacted
 * text. Anything else that wants to mask PII must go through here
 * so that audit logs and wire contracts stay consistent.
 */

import { nanoid } from 'nanoid';
import type {
  Action,
  Detection,
  PolicyConfig,
  RedactionResult,
  PIIType,
} from '../detectors/types';

const DEFAULT_ACTION: Action = 'mask';

function actionFor(type: PIIType, policy: PolicyConfig): Action {
  return policy.actions[type] ?? DEFAULT_ACTION;
}

/**
 * Async vault callback used by the `tokenize` action. Receives the
 * original PII value + type, returns a reversible token.
 * (Phase 1c: implemented in `vault/token-vault.ts`.)
 */
export type TokenVaultCallback = (
  value: string,
  type: PIIType,
) => Promise<string>;

function buildReplacement(
  action: Action,
  type: PIIType,
  value: string,
  tokens: Record<string, string>,
): string {
  switch (action) {
    case 'redact':
      return `[REDACTED:${type}]`;

    case 'mask': {
      // Show first and last char (if length > 2), else full mask.
      if (value.length <= 2) return '*'.repeat(value.length);
      const head = value.charAt(0);
      const tail = value.charAt(value.length - 1);
      const middle = '*'.repeat(Math.max(2, value.length - 2));
      return `${head}${middle}${tail}`;
    }

    case 'tokenize': {
      // 12-char base64url token. The mapping to the original value
      // is added to `tokens` for the caller to forward to the vault.
      const token = `TKN_${nanoid(16)}`;
      tokens[token] = value;
      return token;
    }

    case 'block':
      // Caller short-circuits on block. We still return a placeholder
      // so the result.text is well-formed for logging.
      return `[BLOCKED:${type}]`;

    default: {
      const _exhaustive: never = action;
      return '[REDACTED]';
    }
  }
}

export interface ApplyOptions {
  /** When true, treat any block action as a hard short-circuit. */
  blockOnCritical?: boolean;
  /**
   * Async callback for `tokenize` action. If provided, the engine
   * awaits it to produce reversible tokens (Phase 1c). If not
   * provided, the engine uses nanoid placeholders (Phase 1a).
   */
  tokenVault?: TokenVaultCallback;
}

/**
 * Apply the configured action for each detection and return the
 * redacted text plus structured metadata. Detections are expected
 * to be non-overlapping (caller's responsibility — use mergeDetections
 * from piidetector.ts to dedupe first).
 *
 * Synchronous: the `tokenize` action uses an opaque nanoid
 * placeholder. For reversible tokens via the vault, use
 * `applyActionsWithVault` (Phase 1c).
 */
export function applyActions(
  text: string,
  detections: Detection[],
  policy: PolicyConfig,
  opts: Omit<ApplyOptions, 'tokenVault'> = {},
): RedactionResult {
  const t0 = Date.now();
  const tokens: Record<string, string> = {};
  const blocked = detections.some(
    (d) => actionFor(d.type, policy) === 'block',
  ) && (opts.blockOnCritical ?? policy.blockOnCritical);

  // Sort DESC by start so we splice from the end first.
  const sorted = [...detections].sort((a, b) => b.start - a.start);

  let redactedText = text;
  for (const det of sorted) {
    const action = actionFor(det.type, policy);
    const replacement = buildReplacement(action, det.type, det.value, tokens);
    redactedText =
      redactedText.slice(0, det.start) + replacement + redactedText.slice(det.end);
  }

  return {
    redactedText,
    detections,
    tokens,
    blocked,
    latencyMs: Date.now() - t0,
  };
}

/**
 * Async variant: uses the provided vault callback to produce
 * reversible tokens. Used by the API routes in production.
 */
export async function applyActionsWithVault(
  text: string,
  detections: Detection[],
  policy: PolicyConfig,
  tokenVault: TokenVaultCallback,
  opts: Omit<ApplyOptions, 'tokenVault'> = {},
): Promise<RedactionResult> {
  const t0 = Date.now();
  const tokens: Record<string, string> = {};
  const blocked = detections.some(
    (d) => actionFor(d.type, policy) === 'block',
  ) && (opts.blockOnCritical ?? policy.blockOnCritical);

  const sorted = [...detections].sort((a, b) => b.start - a.start);
  let redactedText = text;
  for (const det of sorted) {
    const action = actionFor(det.type, policy);
    let replacement: string;
    if (action === 'tokenize') {
      replacement = await tokenVault(det.value, det.type);
      tokens[replacement] = det.value;
    } else {
      replacement = buildReplacement(action, det.type, det.value, tokens);
    }
    redactedText =
      redactedText.slice(0, det.start) + replacement + redactedText.slice(det.end);
  }

  return { redactedText, detections, tokens, blocked, latencyMs: Date.now() - t0 };
}

/**
 * Idempotency check: redact(redact(x)) === redact(x). Used in tests.
 */
export function isIdempotent(
  text: string,
  detections: Detection[],
  policy: PolicyConfig,
): boolean {
  const first = applyActions(text, detections, policy);
  return first.redactedText === applyActions(first.redactedText, [], policy).redactedText;
}
