export class KernelError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export const products = [
  { slug: 'firewall', name: 'Firewall', wave: 1, benefit: 'تطبيق سياسات الحماية على حركة الذكاء الاصطناعي المتكاملة.' },
  { slug: 'ledger', name: 'Ledger', wave: 1, benefit: 'تنظيم الأدلة التشغيلية والتحقق منها.' },
  { slug: 'human-gate', name: 'Human Gate', wave: 1, benefit: 'إحالة القرارات الحساسة إلى موافقة بشرية.' },
  { slug: 'risk-engine', name: 'Risk Engine', wave: 2, benefit: 'تسجيل استخدامات الذكاء الاصطناعي وتقييم مخاطرها.' },
  { slug: 'secure-chat', name: 'Secure Chat', wave: 2, benefit: 'مساحة محادثة مؤسسية محكومة بالسياسات.' },
];
// Register only implemented, protected product routes after verification.
const implementedRoutes = new Set();
export function productStates(access) {
  return products.map(p => {
    const state = access.find(a => a.product_slug === p.slug)?.status ?? 'FOUNDATION';
    const available = implementedRoutes.has(p.slug) && state === 'ENABLED';
    return { ...p, state, label: !implementedRoutes.has(p.slug) ? 'قيد التأسيس' : state === 'ENABLED' ? 'متاح للمؤسسة' : 'غير متاح للمؤسسة', href: available ? `/app/${p.slug}/` : null };
  });
}
export function selectMembership(memberships, requested) {
  if (!memberships.length) return null;
  const member = requested ? memberships.find(m => m.tenant_id === requested) : memberships[0];
  if (!member) throw new KernelError(403, 'FORBIDDEN', 'ليس لديك عضوية في المؤسسة المحددة.');
  return member;
}
export function requireRole(member, roles) {
  if (!member || !roles.includes(member.role)) throw new KernelError(403, 'FORBIDDEN', 'صلاحياتك لا تسمح بهذه العملية.');
  return member;
}
export function workspaceName(value) {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) throw new KernelError(400, 'INVALID_NAME', 'اكتب اسم مساحة عمل من حرفين إلى 100 حرف.');
  return value.trim();
}
