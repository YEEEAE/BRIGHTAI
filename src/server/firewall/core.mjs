import { KernelError } from '../kernel/core.mjs';

// Starter templates are server-owned literals. A tenant may also add its own literal rules.
// `prohibited` uses the deny state (the approved spec calls the same concept BLOCK).
export const templates = Object.freeze({
  public: { name: 'بيانات عامة', match_type: 'CONTAINS', pattern: 'معلومة عامة', action: 'ALLOW', priority: 30 },
  identifier: { name: 'معرّف اصطناعي', match_type: 'CONTAINS', pattern: 'DEMO-ID-1234', action: 'REDACT', priority: 20 },
  prohibited: { name: 'محتوى محظور اصطناعي', match_type: 'CONTAINS', pattern: 'DEMO-BLOCK', action: 'DENY', priority: 10 },
});
// Five decision states. ESCALATE is the approved spec's REQUEST_APPROVAL; DENY is BLOCK.
export const actions = Object.freeze(['ALLOW', 'WARN', 'REDACT', 'ESCALATE', 'DENY']);
// Defense-first precedence. Priority only orders rules inside the winning action.
export const actionRank = Object.freeze({ DENY: 0, ESCALATE: 1, REDACT: 2, WARN: 3, ALLOW: 4 });
export const MAX_RULES = 25;
export const MAX_TEXT_LENGTH = 4000;
export const MAX_EVALUATIONS_PER_WINDOW = 60;
export const EVALUATION_WINDOW_SECONDS = 60;
const controlChars = /[\u0000-\u001F\u007F]/;

export function inputText(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_TEXT_LENGTH) throw new KernelError(400, 'INVALID_TEXT', `اكتب نصًا اصطناعيًا من 1 إلى ${MAX_TEXT_LENGTH} حرف.`);
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
  if (!actions.includes(value)) throw new KernelError(400, 'INVALID_RULE_ACTION', 'اختر إجراءً معتمدًا: ALLOW أو WARN أو REDACT أو ESCALATE أو DENY.');
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
  if (!active.length) return result('DENY', 'NO_ACTIVE_POLICY');
  // Fail closed if persisted policy is malformed, even when another rule would allow.
  if (active.some(rule => !structurallyValid(rule))) return result('DENY', 'INVALID_POLICY');
  const matching = action => active.filter(rule => rule.action === action && matches(text, rule.pattern));
  // A deny rule can never be softened by a lower state or by numeric priority.
  const deny = firstByPriority(matching('DENY'));
  if (deny) return result('DENY', 'RULE_DENY', deny);
  const escalate = firstByPriority(matching('ESCALATE'));
  if (escalate) return result('ESCALATE', 'RULE_ESCALATE', escalate);
  const redact = matching('REDACT');
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
  // WARN is not an unconditional allow: the guard path never forwards it automatically.
  const warn = firstByPriority(matching('WARN'));
  if (warn) return result('WARN', 'RULE_WARN', warn);
  const allow = firstByPriority(matching('ALLOW'));
  if (enforce && !allow) return result('DENY', 'NO_MATCH_ENFORCED');
  return result('ALLOW', allow ? 'RULE_ALLOW' : 'NO_MATCH_LAB_ONLY', allow, text);
}
export const reasons = Object.freeze({
  NO_ACTIVE_POLICY: 'حُجب الفحص لعدم وجود قاعدة مفعّلة.',
  INVALID_POLICY: 'حُجب الفحص لوجود قاعدة غير صالحة في السجل.',
  RULE_DENY: 'طابق النص قاعدة حجب.',
  RULE_ESCALATE: 'يتطلب النص موافقة بشرية؛ أوقف التنفيذ وتكامل Human Gate غير مهيأ.',
  RULE_REDACT: 'نُقّح النص وفق قاعدة تنقيح.',
  RULE_WARN: 'طابق النص قاعدة تحذير؛ التحذير لا يسمح بالتمرير التلقائي.',
  RULE_ALLOW: 'طابق النص قاعدة سماح؛ لا تتجاوز قواعد الحجب أو التصعيد أو التنقيح.',
  NO_MATCH_LAB_ONLY: 'لم يطابق أي قاعدة مفعّلة؛ هذا ليس إثبات سلامة المحتوى.',
  NO_MATCH_ENFORCED: 'حُجب التنفيذ لعدم مطابقة قاعدة سماح أو تنقيح مفعّلة.',
  KERNEL_POLICY_DENIED: 'منعت سياسة Kernel العليا التنفيذ؛ لا يخففها قرار قواعد المنتج.',
});
