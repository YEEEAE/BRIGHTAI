// Fixed public fixtures only: never an identity, entitlement or authorization input.
export const assets = { summary: 'مساعد تلخيص افتراضي', publication: 'مساعد نشر افتراضي' };
export const policies = { redact: 'تنقيح المعرّف الخيالي', review: 'مراجعة النشر', deny: 'منع المشاركة الخارجية' };
export function scenarioId(asset = 'summary', policy = 'redact') {
  return `demo-v1-${Object.hasOwn(assets, asset) ? asset : 'summary'}-${Object.hasOwn(policies, policy) ? policy : 'redact'}`;
}
export function parseScenario(value) {
  for (const asset of Object.keys(assets)) for (const policy of Object.keys(policies)) {
    if (value === scenarioId(asset, policy)) return { asset, policy, id: value };
  }
  return { asset: 'summary', policy: 'redact', id: scenarioId() };
}
export function scenarioEvidence(id, review = 'pending') {
  const scenario = parseScenario(id);
  const decision = scenario.policy === 'deny' ? 'BLOCK' : scenario.policy === 'review' ? 'REQUEST_APPROVAL' : 'REDACT';
  const outcome = decision === 'BLOCK' ? 'توقف الطلب؛ الموافقة البشرية لا ترفع المنع.' : decision === 'REDACT' ? 'استُبدل [معرّف خيالي] بـ[محجوب] في المثال.' : review === 'approved' ? 'موافقة محاكاة محددة؛ لا تنفيذ فعلي ولا صلاحية تشغيل.' : review === 'rejected' ? 'رفض المراجع الافتراضي؛ توقف الطلب.' : 'بانتظار مراجع مستقل؛ لا تنفيذ قبل قرار صالح.';
  return { ...scenario, assetName: assets[scenario.asset], policyName: policies[scenario.policy], policyVersion: 'demo-v1', decision, outcome, synthetic: true, execution: false };
}
