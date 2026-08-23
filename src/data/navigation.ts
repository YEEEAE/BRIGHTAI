/**
 * BrightAI — Navigation configuration
 * Single source of truth for all navigation menus.
 * All paths use trailing slash convention.
 * Routes sourced from ROUTE-INVENTORY.md + actual file system audit.
 */

export interface NavItem {
  label: string;
  labelAr: string;
  href: string;
  children?: NavItem[];
  /** Group heading inside dropdown (e.g., "Products" vs "Sectors") */
  group?: string;
  groupAr?: string;
}

export interface NavGroup {
  label: string;
  labelAr: string;
  items: NavItem[];
}

export const NAV: NavItem[] = [
  {
    label: 'Solutions',
    labelAr: 'الحلول',
    href: '/solutions/',
    children: [
      // Products
      { label: 'AI Governance Platform', labelAr: 'منصة حوكمة الذكاء الاصطناعي', href: '/solutions/ai-governance-platform/', group: 'Products', groupAr: 'المنتجات' },
      { label: 'AI Firewall', labelAr: 'جدار حماية الذكاء الاصطناعي', href: '/solutions/ai-firewall/', group: 'Products', groupAr: 'المنتجات' },
      { label: 'AI Audit Trail', labelAr: 'مسار تدقيق الذكاء الاصطناعي', href: '/solutions/ai-audit-trail/', group: 'Products', groupAr: 'المنتجات' },
      { label: 'AI Evidence File', labelAr: 'ملف أدلة الذكاء الاصطناعي', href: '/solutions/ai-evidence-file/', group: 'Products', groupAr: 'المنتجات' },
      { label: 'Human Approval Layer', labelAr: 'طبقة الموافقة البشرية', href: '/solutions/human-approval-layer/', group: 'Products', groupAr: 'المنتجات' },
      { label: 'Continuous AI Governance', labelAr: 'الحوكمة المستمرة للذكاء الاصطناعي', href: '/solutions/continuous-ai-governance/', group: 'Products', groupAr: 'المنتجات' },
      { label: 'AI Risk Classification', labelAr: 'تصنيف مخاطر الذكاء الاصطناعي', href: '/solutions/ai-risk-classification/', group: 'Products', groupAr: 'المنتجات' },
      { label: 'AI Use Case Discovery', labelAr: 'اكتشاف حالات استخدام الذكاء الاصطناعي', href: '/solutions/ai-use-case-discovery/', group: 'Products', groupAr: 'المنتجات' },
      { label: 'Policy-to-Control Mapping', labelAr: 'ربط السياسات بالضوابط', href: '/solutions/policy-to-control-mapping/', group: 'Products', groupAr: 'المنتجات' },
      // Sectors
      { label: 'Banking', labelAr: 'القطاع المصرفي', href: '/solutions/banking-ai-governance/', group: 'Sectors', groupAr: 'القطاعات' },
      { label: 'Government', labelAr: 'القطاع الحكومي', href: '/solutions/government-ai-governance/', group: 'Sectors', groupAr: 'القطاعات' },
      { label: 'Healthcare', labelAr: 'القطاع الصحي', href: '/solutions/healthcare-ai-governance/', group: 'Sectors', groupAr: 'القطاعات' },
      { label: 'Manufacturing', labelAr: 'القطاع الصناعي', href: '/solutions/manufacturing-ai-governance/', group: 'Sectors', groupAr: 'القطاعات' },
    ],
  },
  {
    label: 'Kernel',
    labelAr: 'كيرنل',
    href: '/kernel/',
    children: [
      { label: 'Dashboard', labelAr: 'لوحة التحكم', href: '/kernel/' },
      { label: 'Chat', labelAr: 'المحادثة', href: '/kernel/chat/' },
      { label: 'Audit', labelAr: 'التدقيق', href: '/kernel/audit/' },
      { label: 'Approvals', labelAr: 'الموافقات', href: '/kernel/approvals/' },
      { label: 'Stats', labelAr: 'الإحصائيات', href: '/kernel/stats/' },
      { label: 'Connectors', labelAr: 'الموصّلات', href: '/kernel/connectors/' },
      { label: 'Scenarios', labelAr: 'السيناريوهات', href: '/kernel/scenarios/' },
      { label: 'Policies', labelAr: 'السياسات', href: '/kernel/policies/' },
      { label: 'Evidence', labelAr: 'الأدلة', href: '/kernel/evidence/' },
      { label: 'Compliance', labelAr: 'الامتثال', href: '/kernel/compliance/' },
      { label: 'Reports', labelAr: 'التقارير', href: '/kernel/reports/' },
    ],
  },
  {
    label: 'Resources',
    labelAr: 'الموارد',
    href: '/docs/',
    children: [
      { label: 'Documentation', labelAr: 'التوثيق', href: '/docs/' },
      { label: 'Blog', labelAr: 'المدونة', href: '/blog/' },
      { label: 'Hub', labelAr: 'المركز', href: '/hub/' },
      { label: 'Trust Center', labelAr: 'مركز الثقة', href: '/trust/' },
      { label: 'AI Governance Readiness Assessment', labelAr: 'تقييم جاهزية حوكمة الذكاء الاصطناعي', href: '/assessment/ai-governance-readiness/' },
    ],
  },
  {
    label: 'Pricing',
    labelAr: 'الأسعار',
    href: '/pricing/',
  },
];

export const FOOTER_NAV = {
  solutions: {
    label: 'Solutions',
    labelAr: 'الحلول',
    items: [
      { label: 'AI Governance Platform', labelAr: 'منصة حوكمة الذكاء الاصطناعي', href: '/solutions/ai-governance-platform/' },
      { label: 'AI Firewall', labelAr: 'جدار حماية الذكاء الاصطناعي', href: '/solutions/ai-firewall/' },
      { label: 'AI Audit Trail', labelAr: 'مسار التدقيق', href: '/solutions/ai-audit-trail/' },
      { label: 'AI Evidence File', labelAr: 'ملف الأدلة', href: '/solutions/ai-evidence-file/' },
      { label: 'Human Approval Layer', labelAr: 'طبقة الموافقة البشرية', href: '/solutions/human-approval-layer/' },
      { label: 'Continuous AI Governance', labelAr: 'الحوكمة المستمرة', href: '/solutions/continuous-ai-governance/' },
      { label: 'AI Risk Classification', labelAr: 'تصنيف المخاطر', href: '/solutions/ai-risk-classification/' },
      { label: 'AI Use Case Discovery', labelAr: 'اكتشاف حالات الاستخدام', href: '/solutions/ai-use-case-discovery/' },
      { label: 'Policy-to-Control Mapping', labelAr: 'ربط السياسات بالضوابط', href: '/solutions/policy-to-control-mapping/' },
    ],
  },
  // IDX-ARCH-001 (2026-08-23): link straight to the canonical, indexable
  // sector-city pages. `/solutions/cities/<slug>/` remains only as a legacy
  // redirect surface and must never receive internal navigation links.
  cities: {
    label: 'Cities',
    labelAr: 'المدن',
    items: [
      { label: 'Riyadh', labelAr: 'الرياض', href: '/solutions/banking-ai-governance/riyadh/' },
      { label: 'Jeddah', labelAr: 'جدة', href: '/solutions/healthcare-ai-governance/jeddah/' },
      { label: 'Dammam', labelAr: 'الدمام', href: '/solutions/government-ai-governance/dammam/' },
      { label: 'Khobar', labelAr: 'الخبر', href: '/solutions/banking-ai-governance/khobar/' },
      { label: 'Mecca', labelAr: 'مكة', href: '/solutions/healthcare-ai-governance/mecca/' },
      { label: 'Madinah', labelAr: 'المدينة', href: '/solutions/government-ai-governance/madinah/' },
    ],
  },
  kernel: {
    label: 'Kernel',
    labelAr: 'كيرنل',
    items: [
      { label: 'Dashboard', labelAr: 'لوحة التحكم', href: '/kernel/' },
      { label: 'Chat', labelAr: 'المحادثة', href: '/kernel/chat/' },
      { label: 'Audit', labelAr: 'التدقيق', href: '/kernel/audit/' },
      { label: 'Approvals', labelAr: 'الموافقات', href: '/kernel/approvals/' },
      { label: 'Compliance', labelAr: 'الامتثال', href: '/kernel/compliance/' },
      { label: 'Reports', labelAr: 'التقارير', href: '/kernel/reports/' },
      { label: 'Offline', labelAr: 'بدون اتصال', href: '/kernel/offline/' },
    ],
  },
  design: {
    label: 'Design',
    labelAr: 'التصميم',
    items: [
      { label: 'Buttons', labelAr: 'الأزرار', href: '/design/buttons/' },
      { label: 'Cards', labelAr: 'البطاقات', href: '/design/cards/' },
      { label: 'Colors', labelAr: 'الألوان', href: '/design/colors/' },
      { label: 'Forms', labelAr: 'النماذج', href: '/design/forms/' },
      { label: 'Typography', labelAr: 'الطباعة', href: '/design/typography/' },
    ],
  },
  resources: {
    label: 'Resources',
    labelAr: 'الموارد',
    items: [
      { label: 'Documentation', labelAr: 'التوثيق', href: '/docs/' },
      { label: 'Blog', labelAr: 'المدونة', href: '/blog/' },
      { label: 'Hub', labelAr: 'المركز', href: '/hub/' },
      { label: 'Trust Center', labelAr: 'مركز الثقة', href: '/trust/' },
      { label: 'Assessment', labelAr: 'التقييم', href: '/assessment/ai-governance-readiness/' },
      { label: 'Pricing', labelAr: 'الأسعار', href: '/pricing/' },
      { label: 'Thank You', labelAr: 'شكراً', href: '/thank-you/' },
      { label: 'Offline', labelAr: 'بدون اتصال', href: '/offline/' },
      { label: 'English', labelAr: 'الإنجليزية', href: '/en/' },
      { label: 'Sitemap', labelAr: 'خريطة الموقع', href: '/sitemap/' },
      { label: '404', labelAr: '404', href: '/404/' },
      { label: '500', labelAr: '500', href: '/500/' },
    ],
  },
  // BAI-IDX-22 (2026-07-25): Team section ensures /authors/<slug>/ pages
  // have ≥ 2 incoming internal links (previously each had only 1 — from a
  // single blog post or the /blog/ index). The 3 author pages are now linked
  // from the Footer on every page, satisfying the BAI-IDX-22 acceptance
  // criterion (every sitemap page has ≥ 2 incoming internal links).
  team: {
    label: 'Team',
    labelAr: 'الفريق',
    items: [
      { label: 'Yazeed Albadawy', labelAr: 'يزيد البديوي', href: '/authors/yazeed-alshareef/' },
      { label: 'Compliance Officer', labelAr: 'موظف الامتثال', href: '/authors/compliance-officer/' },
      { label: 'BrightAI Team', labelAr: 'فريق BrightAI', href: '/authors/brightai-team/' },
    ],
  },
  legal: {
    label: 'Legal',
    labelAr: 'قانوني',
    items: [
      { label: 'Privacy Policy', labelAr: 'سياسة الخصوصية', href: '/privacy-policy/' },
      { label: 'Privacy & Cookies', labelAr: 'الخصوصية والكوكيز', href: '/privacy-cookies/' },
      { label: 'Cookie Policy', labelAr: 'سياسة الكوكيز', href: '/cookie-policy/' },
      { label: 'Terms of Service', labelAr: 'شروط الخدمة', href: '/terms/' },
      { label: 'PDPL Statement', labelAr: 'بيان حماية البيانات الشخصية', href: '/pdpl-statement/' },
      { label: 'Data Processing Agreement', labelAr: 'اتفاقية معالجة البيانات', href: '/data-processing-agreement/' },
    ],
  },
} as const;

export const CTA_NAV: NavItem[] = [
  {
    label: 'Book Demo',
    labelAr: 'احجز ديمو',
    href: '/contact/',
  },
];
