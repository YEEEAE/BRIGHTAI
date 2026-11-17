import { newGuides } from './knowledge-guides';

// Editorial relationships answer a next question; array order is not relevance.
const related: Record<string, string[]> = {
  'ai-governance-saudi': ['ai-inventory-register', 'ai-governance-committee-raci', 'choose-ai-governance-platform'],
  'protect-company-data-chatgpt': ['data-classification-for-ai', 'pdpl-and-ai', 'ai-use-policy-employees'],
  'ai-risk-assessment': ['ai-impact-assessment', 'ai-bias-fairness', 'ai-governance-committee-raci'],
  'prompt-injection': ['ai-cybersecurity-nca', 'ai-vendor-assessment', 'ai-audit-trail'],
  'ai-use-policy-employees': ['data-classification-for-ai', 'shadow-ai-detection', 'ai-employee-training'],
  'sdaia-ai-adoption-framework': ['ai-inventory-register', 'ai-governance-committee-raci', 'ai-risk-assessment'],
  'saudi-ai-ethics-principles': ['ai-impact-assessment', 'ai-bias-fairness', 'sdaia-ai-ethics-self-assessment'],
  'sdaia-generative-ai-guidelines': ['ai-use-policy-employees', 'protect-company-data-chatgpt', 'ai-hallucinations-controls'],
  'pdpl-and-ai': ['data-classification-for-ai', 'ai-data-residency-saudi', 'ai-contract-clauses'],
  'saudi-ai-law-binding-vs-guidance': ['saudi-ai-regulators-map', 'pdpl-and-ai', 'iso-42001-saudi'],
  'sdaia-ai-ethics-self-assessment': ['ai-inventory-register', 'ai-risk-assessment', 'ai-audit-trail'],
  'iso-42001-saudi': ['ai-governance-committee-raci', 'ai-inventory-register', 'choose-ai-governance-platform'],
};
export function relatedSlugs(path: string): string[] {
  const slug = path.split('/')[2];
  const selected = related[slug] ?? newGuides.find(g => g.slug === slug)?.related;
  if (!selected) throw new Error(`Missing editorial relationships: ${path}`);
  return [...new Set(selected)].filter(id => id !== slug);
}

type Link = { href: string; label: string; stage: string; reason: string };
const profiles = {
  policy: { resource: 'ai-use-policy', resourceName: 'قالب سياسة استخدام الذكاء الاصطناعي', product: 'secure-chat', productName: 'Secure Chat', reason: 'جرّب تمييز الطلب المسموح من الطلب الذي يحتاج مراجعة.' },
  risk: { resource: 'ai-risk-register', resourceName: 'قالب سجل مخاطر الذكاء الاصطناعي', product: 'risk-engine', productName: 'Risk Engine', reason: 'جرّب توثيق الخطر والضابط وحدود قرار القبول ببيانات افتراضية.' },
  responsibility: { resource: 'responsibility-evidence-matrix', resourceName: 'مصفوفة المسؤوليات والأدلة', product: 'human-gate', productName: 'Human Gate', reason: 'جرّب فصل إعداد الطلب عن مراجعته واعتماده.' },
  evidence: { resource: 'responsibility-evidence-matrix', resourceName: 'مصفوفة المسؤوليات والأدلة', product: 'ledger', productName: 'Ledger', reason: 'افحص مثالًا تعليميًا يربط القرار بمرجع دليله.' },
  protection: { resource: 'ai-use-policy', resourceName: 'قالب سياسة استخدام الذكاء الاصطناعي', product: 'firewall', productName: 'Firewall', reason: 'جرّب فحص نص اصطناعي وحدود السماح والتنقيح والمنع.' },
};
const assignments: Record<string, keyof typeof profiles> = {};
for (const [profile, slugs] of Object.entries({
  policy: ['ai-use-policy-employees', 'ai-employee-training', 'sdaia-generative-ai-guidelines', 'shadow-ai-detection'],
  protection: ['protect-company-data-chatgpt', 'pdpl-and-ai', 'prompt-injection', 'data-classification-for-ai', 'ai-cybersecurity-nca', 'data-breach-72-hours-ai'],
  risk: ['ai-risk-assessment', 'ai-impact-assessment', 'ai-bias-fairness', 'sdaia-ai-ethics-self-assessment', 'ai-vendor-assessment', 'ai-data-residency-saudi', 'ai-governance-financial-sector', 'ai-governance-healthcare'],
  evidence: ['ai-audit-trail', 'iso-42001-saudi', 'ai-contract-clauses'],
  responsibility: ['ai-governance-saudi', 'ai-governance-committee-raci', 'ai-inventory-register', 'sdaia-ai-adoption-framework', 'saudi-ai-ethics-principles', 'saudi-ai-law-binding-vs-guidance', 'saudi-ai-regulators-map', 'choose-ai-governance-platform', 'data-governance-vs-ai-governance', 'deepfake-policy-organizations', 'ai-hallucinations-controls'],
})) for (const slug of slugs) assignments[slug] = profile as keyof typeof profiles;

export function journeyFor(path: string, title: string): Link[] {
  const slug = path.split('/')[2];
  const profile = profiles[assignments[slug]];
  if (!profile) throw new Error(`Missing practical journey: ${path}`);
  const links: Link[] = [
    { href: `/resources/${profile.resource}/`, label: profile.resourceName, stage: 'اتخاذ قرار · أصل قابل للتعديل', reason: 'حوّل أسئلة الدليل إلى حقول ومسؤوليات في نسخة عمل محلية.' },
    { href: `/products/${profile.product}/#lab`, label: `تجربة ${profile.productName} التعليمية وحدودها`, stage: 'تجربة تعليمية', reason: profile.reason },
  ];
  const sector = slug === 'ai-governance-financial-sector' ? ['finance', 'القطاع المالي'] : slug === 'ai-governance-healthcare' ? ['healthcare', 'الرعاية الصحية'] : slug === 'sdaia-generative-ai-guidelines' || slug === 'sdaia-ai-adoption-framework' ? ['government', 'الجهات الحكومية'] : ['ai-use-policy-employees', 'shadow-ai-detection', 'ai-employee-training'].includes(slug) ? ['enterprise', 'الشركات'] : null;
  if (sector) links.splice(1, 0, { href: `/solutions/${sector[0]}/`, label: `أسئلة حوكمة الذكاء الاصطناعي في ${sector[1]}`, stage: 'سياق القطاع', reason: 'راجع أسئلة القطاع قبل تخصيص السياسة أو اختيار الأداة.' });
  links.push({ href: `/contact/?topic=${encodeURIComponent('مناقشة: ' + title)}`, label: 'تواصل لمناقشة نطاق الاستخدام والمراجعة', stage: 'تواصل', reason: 'حدّد الغرض والقطاع والقرار المطلوب قبل أي تفعيل.' });
  return links;
}
