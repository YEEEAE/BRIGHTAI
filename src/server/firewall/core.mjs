import { actionRank, decideMatches, scanTyped } from '../../shared/firewall-policy.mjs';
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
export { actionRank };
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
function orderedRules(rules) {
  return [...rules].sort((a, b) => (a.priority - b.priority)
    || String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))
    || String(a.id).localeCompare(String(b.id)));
}

export function evaluate(text, rules, { enforce = false, requireTenantMatch = false } = {}) {
  inputText(text);
  const active = rules.filter(rule => rule.enabled);
  const result = (action, reason, rule = null, output = null, warnings = []) => ({
    action, reason,
    rule_id: rule?.tenantRule ? rule.id : null, rule_version: rule?.tenantRule ? rule.version : null,
    ...(rule && !rule.tenantRule ? { matcher_id: rule.id, matcher_version: rule.version } : {}),
    rule_name: rule?.name ?? null, output,
    ...(warnings.length ? { warning_held: true } : {}),
  });
  if (!active.length) return result('DENY', 'NO_ACTIVE_POLICY');
  if (active.some(rule => !structurallyValid(rule))) return result('DENY', 'INVALID_POLICY');

  const literals = orderedRules(active).flatMap(rule => {
    const matcher = new RegExp(escapeLiteral(rule.pattern), 'gi');
    const spans = [];
    let match;
    while ((match = matcher.exec(text))) {
      spans.push([match.index, match.index + match[0].length]);
      matcher.lastIndex = match.index + 1;
    }
    return spans.length ? [{ ...rule, tenantRule: true, spans }] : [];
  });
  if (requireTenantMatch && !literals.some(rule => ['ALLOW', 'REDACT'].includes(rule.action))) {
    return result('DENY', 'NO_MATCH_ENFORCED');
  }
  const decision = decideMatches(text, [...scanTyped(text), ...literals]);
  if (decision) {
    const { winner, output, warnings } = decision;
    return result(winner.action, `RULE_${winner.action}`, winner, output, warnings);
  }
  return enforce ? result('DENY', 'NO_MATCH_ENFORCED') : result('ALLOW', 'NO_MATCH_LAB_ONLY', null, text);
}

export const reasons = Object.freeze({
  NO_ACTIVE_POLICY: 'حُجب الفحص لعدم وجود قاعدة مفعّلة.',
  INVALID_POLICY: 'حُجب الفحص لوجود قاعدة غير صالحة في السجل.',
  RULE_DENY: 'طابق النص قاعدة حجب.',
  RULE_ESCALATE: 'يتطلب النص مراجعة بشرية قبل أي تنفيذ.',
  RULE_REDACT: 'نُقّح النص وفق قاعدة تنقيح.',
  RULE_WARN: 'طابق النص قاعدة تحذير؛ التحذير لا يسمح بالتمرير التلقائي.',
  RULE_ALLOW: 'طابق النص قاعدة سماح؛ لا تتجاوز قواعد الحجب أو التصعيد أو التنقيح.',
  NO_MATCH_LAB_ONLY: 'لم يطابق أي قاعدة مفعّلة؛ هذا ليس إثبات سلامة المحتوى.',
  NO_MATCH_ENFORCED: 'حُجب التنفيذ لعدم مطابقة قاعدة سماح أو تنقيح مفعّلة.',
  KERNEL_POLICY_DENIED: 'منعت سياسة Kernel العليا التنفيذ؛ لا يخففها قرار قواعد المنتج.',
});
