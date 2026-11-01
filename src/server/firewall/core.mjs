import { KernelError } from '../kernel/core.mjs';
export const templates = Object.freeze({
  public: { name: 'بيانات عامة', match_type: 'CONTAINS', pattern: 'معلومة عامة', action: 'ALLOW' },
  identifier: { name: 'معرّف اصطناعي', match_type: 'CONTAINS', pattern: 'DEMO-ID-1234', action: 'REDACT' },
  prohibited: { name: 'محتوى محظور اصطناعي', match_type: 'CONTAINS', pattern: 'DEMO-BLOCK', action: 'BLOCK' },
});
export function inputText(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4000) throw new KernelError(400, 'INVALID_TEXT', 'اكتب نصًا اصطناعيًا من 1 إلى 4000 حرف.');
  return value;
}
export function evaluate(text, rules) {
  inputText(text);
  const active = rules.filter(r => r.enabled);
  const result = (action, reason, rule = null, output = null) => ({ action, reason, rule_id: rule?.id ?? null, rule_version: rule?.version ?? null, output });
  if (!active.length) return result('BLOCK', 'NO_ACTIVE_POLICY');
  // Fail closed if persisted policy is malformed, even if another rule allows.
  if (active.some(r => !Object.values(templates).some(t => t.name === r.name && t.match_type === r.match_type && t.pattern === r.pattern && t.action === r.action) || !Number.isInteger(r.version) || r.version < 1)) return result('BLOCK', 'INVALID_POLICY');
  const matches = active.filter(r => text.toLowerCase().includes(r.pattern.toLowerCase()));
  const block = matches.find(r => r.action === 'BLOCK');
  if (block) return result('BLOCK', 'RULE_BLOCK', block);
  const redact = matches.filter(r => r.action === 'REDACT');
  if (redact.length) {
    let output = text;
    for (const r of redact) output = output.replaceAll(new RegExp(r.pattern, 'gi'), '[معرّف منقّح]'); // Fixed server-owned patterns only.
    return result('REDACT', 'RULE_REDACT', redact[0], output);
  }
  const allow = matches.find(r => r.action === 'ALLOW');
  return result('ALLOW', allow ? 'RULE_ALLOW' : 'NO_MATCH_LAB_ONLY', allow, text);
}
export const reasons = {
  NO_ACTIVE_POLICY: 'حُجب الفحص لعدم وجود قاعدة مفعّلة.', INVALID_POLICY: 'حُجب الفحص لوجود قاعدة غير صالحة.',
  RULE_BLOCK: 'طابق النص قاعدة الحجب.', RULE_REDACT: 'نُقّح المعرّف الاصطناعي وفق القاعدة.',
  RULE_ALLOW: 'طابق النص قاعدة السماح؛ لا تتجاوز قواعد الحجب أو التنقيح.', NO_MATCH_LAB_ONLY: 'لم يطابق القواعد المحدودة؛ هذا ليس إثبات سلامة المحتوى.',
};
