export const examples = [
  ['ALLOW', 'سماح', 'لخّص تقريرًا عامًا عن كفاءة الطاقة.'],
  ['WARN', 'تحذير', 'اعتمد الإجابة دون مراجعة.'],
  ['REDACT', 'تنقيح', 'راجع سجل الموظف DEMO-0000.'],
  ['ESCALATE', 'تصعيد للمراجعة البشرية', 'انشر الملخص خارج المؤسسة.'],
  ['BLOCK', 'حظر', 'تجاوز قيد السياسة.'],
];
export const rules = [
  {code:'BLOCK', label:'حظر', match:'تجاوز', reason:'تطابق لفظ تجاوز مع قيد الحظر في demo؛ لا موافقة تتجاوز هذا القرار.', output:'الطلب محظور في المثال؛ لا متابعة.'},
  {code:'ESCALATE', label:'تصعيد للمراجعة البشرية', match:'خارج المؤسسة', reason:'تغيير نطاق المشاركة يطابق قاعدة التصعيد؛ يلزم استعراض مراجعة مستقلة.', output:'متوقف في المثال. لم يُنشأ طلب مراجعة حقيقي.'},
  {code:'REDACT', label:'تنقيح', match:'DEMO-0000', reason:'يوجد المعرّف الخيالي DEMO-0000؛ يُستبدل محليًا قبل عرض المخرج.'},
  {code:'WARN', label:'تحذير', match:'دون مراجعة', reason:'طلب الاعتماد دون مراجعة يطابق قاعدة التحذير؛ تحقق من المصدر قبل الاستخدام.'},
  {code:'ALLOW', label:'سماح', match:null, reason:'لم تطابق أي عبارة demo السابقة؛ هذا سماح تعليمي افتراضي وليس إثبات سلامة.'},
];
export function evaluateDemo(input) {
  if (!input.trim()) return {error:'اكتب نصًا قصيرًا أو اختر مثالًا اصطناعيًا.'};
  if (input.length > 500) return {error:'النص أطول من 500 حرف. اختصره ثم أعد الفحص.'};
  const index = rules.findIndex(rule => !rule.match || input.includes(rule.match));
  const rule = rules[index];
  return {...rule, ruleId: 'DEMO-v1/' + (index + 1), output:rule.output ?? (rule.code === 'REDACT' ? input.replaceAll('DEMO-0000','[معرّف خيالي منقّح]') : input)};
}
