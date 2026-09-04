// E-signature re-authentication step for the highest-authority laboratory
// actions (test APPROVE / VOID, document APPROVE).
//
// This implements the MECHANISM ONLY (a password re-verification step before
// the action proceeds). It deliberately makes no regulatory-compliance claim.
//
// Guarantees:
// - The current user's password is verified server-side through
//   verifyPasswordForUser (constant-time bcrypt comparison via the existing
//   authentication layer).
// - The session is NOT reissued and no new session machinery exists.
// - The password itself is never stored, logged, or audited — only a boolean
//   outcome is recorded.
// - Failed verifications are rate-limited per user (same in-memory bucket
//   pattern as requireAiRateLimit) and recorded as security attempts in the
//   existing login_attempts table. Business approval evidence stays in
//   qc_audit_log and lab_test_approvals.

import { verifyPasswordForUser } from '../auth';
import { getDb } from '../db';

/** Max failed e-signature verifications per user per rolling minute. */
const MAX_ESIGN_FAILURES_PER_MINUTE = 5;

const esignFailureBuckets = new Map<number, { startedAt: number; count: number }>();

export const ESIGN_FIELD_NAME = 'esignature_password';

export const ESIGN_FAILURE_MESSAGE_AR =
  'تعذّر التحقق من كلمة المرور. تأكد من إدخال كلمة مرورك الحالية بشكل صحيح ثم أعد المحاولة.';

export const ESIGN_RATE_LIMITED_MESSAGE_AR =
  'تم تجاوز الحد المسموح لمحاولات التحقق. انتظر قليلاً ثم أعد المحاولة.';

export type EsignatureResult = 'ok' | 'invalid' | 'rate_limited';

function isRateLimited(userId: number): boolean {
  const now = Date.now();
  const bucket = esignFailureBuckets.get(userId);
  if (!bucket || now - bucket.startedAt >= 60_000) {
    esignFailureBuckets.set(userId, { startedAt: now, count: 0 });
    return false;
  }
  return bucket.count >= MAX_ESIGN_FAILURES_PER_MINUTE;
}

/**
 * Verify the actor's current password for a high-authority action.
 * Returns 'ok' on success (and clears the failure counter), 'invalid' on a
 * wrong password (audited + counted), or 'rate_limited' when too many recent
 * failures exist (refused WITHOUT running bcrypt — no oracle, no counting).
 * Empty/missing passwords are invalid attempts and count toward the limit;
 * they are rate-limited only when the actor was already locked out.
 */
export function requireEsignature(userId: number, password: string | null | undefined): EsignatureResult {
  if (isRateLimited(userId)) {
    auditEsignAttempt(userId, 'rate_limited');
    return 'rate_limited';
  }

  if (typeof password !== 'string' || password.length === 0) {
    const bucket = esignFailureBuckets.get(userId) ?? { startedAt: Date.now(), count: 0 };
    bucket.count += 1;
    esignFailureBuckets.set(userId, bucket);
    auditEsignAttempt(userId, 'failed');
    return 'invalid';
  }

  const ok = verifyPasswordForUser(userId, password);
  if (ok) {
    esignFailureBuckets.delete(userId);
    return 'ok';
  }
  const bucket = esignFailureBuckets.get(userId) ?? { startedAt: Date.now(), count: 0 };
  bucket.count += 1;
  esignFailureBuckets.set(userId, bucket);
  auditEsignAttempt(userId, 'failed');
  return 'invalid';
}

/**
 * Audit an e-signature verification attempt that did NOT succeed. Reuses the
 * existing login_attempts audit trail (the table already exists for password
 * verification attempts) with a constant 'e-signature' marker in ip_address —
 * qc_audit_log's entity_type CHECK has no user/esignature entity, and no
 * schema change is warranted. The attempted password is NEVER recorded.
 */
export function auditEsignAttempt(
  userId: number,
  outcome: 'failed' | 'rate_limited',
): void {
  try {
    const db = getDb();
    const usernameRow = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as
      | { username?: unknown }
      | undefined;
    if (!usernameRow || typeof usernameRow.username !== 'string') return;
    db.prepare(
      'INSERT INTO login_attempts (username, ip_address, succeeded) VALUES (?, ?, 0)',
    ).run(usernameRow.username, `e-signature:${outcome}`);
  } catch {
    // Audit write must never block the rejection response path; the caller
    // already refuses the action regardless of this outcome.
  }
}

/** Suffix appended to the action's audit note — no secret material. */
export const ESIGN_AUDIT_NOTE = 'approved with e-signature';

/** Compose an audit note: original reason + the e-signature marker. */
export function esignAuditNote(reason: string | null | undefined): string {
  return reason && reason.trim().length > 0
    ? `${reason.trim()}; ${ESIGN_AUDIT_NOTE}`
    : ESIGN_AUDIT_NOTE;
}
