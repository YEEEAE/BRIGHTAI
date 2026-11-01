import { KernelError } from '../kernel/core.mjs';

// Starter templates are server-owned literals. A tenant may also add its own literal rules.
export const templates = Object.freeze({
  public: { name: 'بيانات عامة', match_type: 'CONTAINS', pattern: 'معلومة عامة', action: 'ALLOW', priority: 30 },
  identifier: { name: 'معرّف اصطناعي', match_type: 'CONTAINS', pattern: 'DEMO-ID-1234', action: 'REDACT', priority: 20 },
  prohibited: { name: 'محتوى محظور اصطناعي', match_type: 'CONTAINS', pattern: 'DEMO-BLOCK', action: 'BLOCK', priority: 10 },
});
export const actions = Object.freeze(['ALLOW', 'BLOCK', 'REDACT']);
// Defense-first precedence. Priority only orders rules inside the winning action.
export const actionRank = Object.freeze({ BLOCK: 0, REDACT: 1, ALLOW: 2 });
export const MAX_RULES = 25;
const controlChars = /[\u0000-\u001F\u007F]/;

export function inputText(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4000) throw new KernelError(400, 'INVALID_TEXT', 'اكتب نصًا اصطناعيًا من 1 إلى 4000 حرف.');
  return value;
}
// Names and patterns are plain literals: never compiled as client-supplied regular expressions.
export function ruleName(value) {
  if (typeof value !== 'string') throw new KernelError(400, 'INVALID_RULE_NAME', 'اكتب اسمًا للقاعدة.');
  const name = value.trim();
  if (name.length < 2 || name.length > 60 || controlChars.test(name)) throw new KernelError(400, 'INVALID_RULE_NAME', 'اسم القاعدة من 2 إلى 60 حرفًا دون رموز تحكم.');
  return name;
}
export function rulePattern(value) {
  if (typeof value !== 'string') throw new KernelError(400, 'INVALID_RULE_PATTERN', 'اكتب نمطًا حرفيًا.');
  const pattern = value.trim();
  if (!pattern.length || pattern.length > 80 || controlChars.test(pattern)) throw new KernelError(400, 'INVALID_RULE_PATTERN', 'النمط الحرفي من 1 إلى 80 حرفًا دون رموز تحكم.');
  return pattern;
}
export function ruleAction(value) {
  if (!actions.includes(value)) throw new KernelError(400, 'INVALID_RULE_ACTION', 'اختر إجراءً معتمدًا: ALLOW أو BLOCK أو REDACT.');
  return value;
}
export function rulePriority(value) {
  if (value === undefined || value === null) return 100;
  if (!Number.isInteger(value) || value < 1 || value > 999) throw new KernelError(400, 'INVALID_RULE_PRIORITY', 'الأولوية رقم صحيح من 1 إلى 999، والأقل يُعرض أولًا.');
  return value;
}
function structurallyValid(rule) {
  const template = rule?.template ? templates[rule.template] : null;
  if (rule?.template && (!template || ['name', 'match_type', 'pattern', 'action', 'priority'].some(key => rule[key] !== template[key]))) return false;
  return !!rule && typeof rule.name === 'string' && rule.name.trim().length >= 2 && rule.name.length <= 60 && !controlChars.test(rule.name)
    && rule.match_type === 'CONTAINS'
    && typeof rule.pattern === 'string' && rule.pattern.length >= 1 && rule.pattern.length <= 80 && !controlChars.test(rule.pattern)
    && actions.includes(rule.action)
    && Number.isInteger(rule.version) && rule.version >= 1
    && Number.isInteger(rule.priority) && rule.priority >= 1 && rule.priority <= 999;
}
const escapeLiteral = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matches = (text, pattern) => new RegExp(escapeLiteral(pattern), 'i').test(text);
function firstByPriority(list) {
  return [...list].sort((a, b) => (a.priority - b.priority)
    || String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))
    || String(a.id).localeCompare(String(b.id)))[0] ?? null;
}
export function evaluate(text, rules, { enforce = false } = {}) {
  inputText(text);
  const active = rules.filter(rule => rule.enabled);
  const result = (action, reason, rule = null, output = null) => ({
    action, reason,
    rule_id: rule?.id ?? null, rule_version: rule?.version ?? null, rule_name: rule?.name ?? null,
    output,
  });
  if (!active.length) return result('BLOCK', 'NO_ACTIVE_POLICY');
  // Fail closed if persisted policy is malformed, even when another rule would allow.
  if (active.some(rule => !structurallyValid(rule))) return result('BLOCK', 'INVALID_POLICY');
  const block = firstByPriority(active.filter(rule => matches(text, rule.pattern) && rule.action === 'BLOCK'));
  if (block) return result('BLOCK', 'RULE_BLOCK', block);
  const redact = active.filter(rule => matches(text, rule.pattern) && rule.action === 'REDACT');
  if (redact.length) {
    // Collect spans against the original input, then merge overlaps. Replacing one
    // literal first must never hide an overlapping match belonging to another rule.
    const spans = [];
    for (const rule of redact) {
      const matcher = new RegExp(escapeLiteral(rule.pattern), 'gi');
      let match;
      while ((match = matcher.exec(text))) { spans.push([match.index, match.index + match[0].length]); matcher.lastIndex = match.index + 1; }
    }
    spans.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const span of spans) {
      const last = merged[merged.length - 1];
      if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
      else merged.push([...span]);
    }
    let output = '', cursor = 0;
    for (const [start, end] of merged) { output += text.slice(cursor, start) + '[نص منقّح]'; cursor = end; }
    output += text.slice(cursor);
    return result('REDACT', 'RULE_REDACT', firstByPriority(redact), output);
  }
  const allow = firstByPriority(active.filter(rule => matches(text, rule.pattern) && rule.action === 'ALLOW'));
  if (enforce && !allow) return result('BLOCK', 'NO_MATCH_ENFORCED');
  return result('ALLOW', allow ? 'RULE_ALLOW' : 'NO_MATCH_LAB_ONLY', allow, text);
}
export const reasons = Object.freeze({
  NO_ACTIVE_POLICY: 'حُجب الفحص لعدم وجود قاعدة مفعّلة.',
  INVALID_POLICY: 'حُجب الفحص لوجود قاعدة غير صالحة في السجل.',
  RULE_BLOCK: 'طابق النص قاعدة حجب.',
  RULE_REDACT: 'نُقّح النص وفق قاعدة تنقيح.',
  RULE_ALLOW: 'طابق النص قاعدة سماح؛ لا تتجاوز قواعد الحجب أو التنقيح.',
  NO_MATCH_LAB_ONLY: 'لم يطابق أي قاعدة مفعّلة؛ هذا ليس إثبات سلامة المحتوى.',
  NO_MATCH_ENFORCED: 'حُجب التنفيذ لعدم مطابقة قاعدة سماح أو تنقيح مفعّلة.',
});
