import { brand } from './brand';
// Owner naming baseline: docs/MASTER-PROJECT-BLUEPRINT.md §00.
// This is a public identity, not proof of incorporation, address or certification.
export const organization = {
  '@type': 'Organization',
  '@id': 'https://brightai.live/#organization',
  name: 'مؤسسة مُشرقة BRIGHT AI',
  alternateName: ['BRIGHT AI', 'BRIGHTAI'],
  description: 'هوية متخصصة في حوكمة وأمان الذكاء الاصطناعي، ومنظومة AIGAS للمنتجات الموجهة للجهات الحكومية والقطاع الخاص السعودي.',
  url: 'https://brightai.live/',
  logo: new URL(brand.logo, 'https://brightai.live').href,
};
export const identityLimit = 'الاسم المتداول وفق مرجع المالك؛ الصيغة القانونية ورقم السجل والعنوان والشهادات والروابط الخارجية للكيان غير مثبتة هنا.';
