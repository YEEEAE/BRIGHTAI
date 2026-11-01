import { KernelError } from '../kernel/core.mjs';
import { env } from '../kernel/env.mjs';

// Baseline protection is independent of a paid Firewall entitlement. These
// patterns are deliberately limited; they do not establish comprehensive DLP.
export const INPUT_POLICY = Object.freeze({
  version: 'sc-baseline-v1',
  block: Object.freeze([
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/iu,
    /\b(?:bearer\s+[\w.+/=-]{12,}|(?:api[_ -]?key|password|secret|كلمة\s*المرور)\s*[:=]\s*\S{4,})/iu,
    /\b(?:sk|ghp|github_pat)[-_][a-z0-9_-]{16,}\b/iu,
  ]),
  redact: Object.freeze([
    /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/giu,
    /\bSA\s*\d{2}(?:\s*\d){20}\b/giu,
    /(?<!\d)(?:\+?966[\s-]?5|05)(?:[\s-]?\d){8}(?!\d)/gu,
    /(?<!\d)[12]\d{9}(?!\d)/gu,
  ]),
});

export function protectText(text) {
  // Normalize Arabic/Persian digits before classification, including output.
  let safe = text.normalize('NFKC').replace(/[\u0660-\u0669\u06f0-\u06f9]/gu, digit => String(digit.charCodeAt(0) % 16));
  if (INPUT_POLICY.block.some(pattern => pattern.test(safe))) {
    throw new KernelError(422, 'SENSITIVE_CONTENT_BLOCKED', 'حُجب محتوى يشبه سرًا أو مفتاح وصول. احذف البيانات الحساسة قبل المحاولة.');
  }
  for (const pattern of INPUT_POLICY.redact) safe = safe.replace(pattern, '[بيانات منقحة]');
  return { text: safe, redacted: safe !== text };
}

function positive(name) {
  const raw = env(name);
  if (!raw) return null;
  if (!/^\d{1,9}$/.test(raw) || Number(raw) < 1) throw new KernelError(503, 'USAGE_POLICY_INVALID', 'إعداد حدود الاستخدام غير صالح؛ الإرسال موقوف.');
  return Number(raw);
}

export function usagePolicy() {
  // Unapproved values have no effect. Never interpret a key as model approval.
  if (!env('AIGAS_SC_LIMITS_APPROVAL_REF')?.trim()) return null;
  const policy = {
    userMinute: positive('AIGAS_SC_USER_REQUESTS_PER_MINUTE'),
    tenantMinute: positive('AIGAS_SC_TENANT_REQUESTS_PER_MINUTE'),
    userDay: positive('AIGAS_SC_USER_REQUESTS_PER_DAY'),
    tenantDay: positive('AIGAS_SC_TENANT_REQUESTS_PER_DAY'),
    tenantTokensDay: positive('AIGAS_SC_TENANT_TOKENS_PER_DAY'),
  };
  if (!Object.values(policy).some(Boolean)) throw new KernelError(503, 'USAGE_POLICY_INVALID', 'مرجع اعتماد الحصص موجود دون حدود؛ راجع إعداد المشغّل.');
  return policy;
}
