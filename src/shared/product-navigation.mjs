// Public route vocabulary only. Identity, entitlement and readiness stay on the server.
export const productNavigation = Object.freeze([
  { slug: 'firewall', name: 'Firewall', wave: 1, benefit: 'تطبيق سياسات الحماية على حركة الذكاء الاصطناعي المتكاملة.', summary: 'تصور لفحص المدخلات والمخرجات وفق سياسات المنشأة.', scope: 'فحص نص اصطناعي ومراجعة القرار ومراجعه.' },
  { slug: 'ledger', name: 'Ledger', wave: 1, benefit: 'تنظيم الأدلة التشغيلية والتحقق منها.', summary: 'تصور لأدلة تشغيلية وحوكمة الوصول والاحتفاظ بها.', scope: 'تسجيل حدث اصطناعي وقراءة دليله والتحقق منه.' },
  { slug: 'human-gate', name: 'Human Gate', wave: 1, benefit: 'إحالة القرارات الحساسة إلى موافقة بشرية.', summary: 'تصور لمسار مراجعة بشرية للحالات التي تحددها الجهة.', scope: 'طلب مراجعة وقرار من مراجع مخول وأثر داخلي محدود.' },
  { slug: 'risk-engine', name: 'Risk Engine', wave: 2, benefit: 'تسجيل استخدامات الذكاء الاصطناعي وتقييم مخاطرها.', summary: 'تصور لتقييم مخاطر الاستخدام وربطها بضوابط مناسبة.', scope: 'أصل اصطناعي وتقييم مخاطر ومعالجة وقراءة النتائج.' },
  { slug: 'secure-chat', name: 'Secure Chat', wave: 2, benefit: 'مساحة محادثة مؤسسية محكومة بالسياسات.', summary: 'تصور لواجهة مؤسسية لاستخدام مساعدات الذكاء الاصطناعي.', scope: 'محادثة اصطناعية ضمن سياسة المؤسسة ونماذجها المعتمدة.' },
].map(product => Object.freeze({ ...product, publicPath: `/products/${product.slug}/`, workspacePath: `/app/${product.slug}/` })));

export const productForSlug = slug => productNavigation.find(product => product.slug === slug) ?? null;
// Exact canonical paths: reject encoded aliases, queries, fragments, auth paths,
// credentials, backslashes and external URLs instead of normalizing them into trust.
export const productForReturnTo = value => productNavigation.find(product => product.workspacePath === value) ?? null;
export function productEntryPath(slug) {
  const product = productForSlug(slug);
  return product ? `/app/kernel/?returnTo=${encodeURIComponent(product.workspacePath)}` : '/app/kernel/';
}
export function productContactPath(slug, subscription = false) {
  const product = productForSlug(slug);
  return product ? `/contact/?topic=${encodeURIComponent(`${subscription ? 'طلب اشتراك مستقل' : 'استفسار عن تقييم'} — AIGAS ${product.name}`)}` : '/contact/';
}
// A route choice is only navigation; every destination re-authorizes every API call.
export function authorizedProductDestination(returnTo, dashboard) {
  const product = productForReturnTo(returnTo);
  const tenantId = dashboard?.tenant?.tenant_id;
  if (!product || typeof tenantId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) return null;
  const access = dashboard?.products?.find(item => item.slug === product.slug);
  if (access?.enabled !== true || access?.href !== product.workspacePath) return null;
  return `${product.workspacePath}?workspace=${encodeURIComponent(tenantId)}`;
}
