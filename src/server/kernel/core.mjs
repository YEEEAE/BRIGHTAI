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
// Register only routes whose page and API enforce Kernel identity and membership server-side.
// A separate DB access record still decides whether the product is enabled for the tenant.
const implementedRoutes = new Set(['firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat']);
const stateLabels = { ENABLED: 'مفعّل للمؤسسة', DISABLED: 'معطّل من المشغّل', FOUNDATION: 'قيد التأسيس' };
export const roleLabels = { OWNER: 'مالك', ADMIN: 'مدير', MEMBER: 'عضو' };
const auditLabels = {
  'workspace.created': 'إنشاء مساحة العمل',
  'firewall.rule.created': 'إضافة قاعدة جدار حماية',
  'firewall.rule.updated': 'تعديل قاعدة جدار حماية',
  'firewall.rule.toggled': 'تغيير حالة قاعدة جدار حماية',
  'ledger.event.created': 'تسجيل حدث دليل',
  'ledger.event.verified': 'فحص حدث دليل',
  'ledger.events.exported': 'تصدير سجل الأدلة',
  'human-gate.request.created': 'طلب مراجعة بشرية',
  'human-gate.request.decided': 'قرار مراجعة بشرية',
  'human-gate.request.executed': 'تنفيذ قرار مراجعة',
  'risk-engine.asset.created': 'تسجيل أصل مخاطر',
  'risk-engine.asset.updated': 'تحديث أصل مخاطر',
  'risk-engine.assessment.created': 'تقييم مخاطر',
  'secure-chat.message.rejected': 'رفض إرسال محادثة',
};
export const auditActionLabel = action => auditLabels[action] ?? 'حدث تشغيلي';
export function productStates(access) {
  return products.map(p => {
    const state = access.find(a => a.product_slug === p.slug)?.status ?? 'FOUNDATION';
    const routeReady = implementedRoutes.has(p.slug);
    const enabled = state === 'ENABLED';
    const label = !routeReady ? 'المسار غير متاح بعد' : stateLabels[state] ?? 'حالة غير معروفة';
    return { ...p, state, enabled, routeReady, label, href: routeReady && state !== 'DISABLED' ? `/app/${p.slug}/` : null };
  });
}
export function roleLabel(role) {
  return roleLabels[role] ?? 'دور غير معروف';
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
