import { decideMatches, matcherNotes, policyVersion, scanTyped } from './firewall-policy.mjs';

export const examples = [
  ['ALLOW', 'سماح', 'لخّص تقريرًا عامًا عن كفاءة الطاقة.'],
  ['WARN', 'تحذير', 'اعتمد الإجابة دون مراجعة.'],
  ['REDACT', 'تنقيح', 'راجع سجل الموظف DEMO-0000.'],
  ['ESCALATE', 'تصعيد للمراجعة البشرية', 'انشر الملخص خارج المؤسسة.'],
  ['DENY', 'حظر', 'تجاوز قيد السياسة.'],
];
export { matcherNotes as rules, policyVersion };

export function evaluateDemo(input, maxLength = 500) {
  if (typeof input !== 'string' || !input.trim()) return {error:'اكتب نصًا قصيرًا أو اختر مثالًا اصطناعيًا.'};
  if (input.length > maxLength) return {error:`النص أطول من ${maxLength} حرف. اختصره ثم أعد الفحص.`};
  const result = decideMatches(input, scanTyped(input));
  const rule = result?.winner;
  const code = rule?.action ?? 'ALLOW';
  const label = examples.find(example => example[0] === code)?.[1];
  return {
    code, label, ruleId: rule?.id ?? 'public-no-match', ruleVersion: rule?.version ?? 1, policyVersion,
    reason: rule?.name ?? 'لم يطابق النص قواعد الفحص المحددة.',
    output: result ? result.output : input,
    held: Boolean(result?.warnings.length) || ['DENY', 'ESCALATE'].includes(code),
  };
}
