import { KernelError, requireRole, products } from './core.mjs';
// Shared by all five products. Active approval is separate from the product toggle.
export async function requireProductAccess(db, identity, tenantId, slug) {
  const product = products.find(item => item.slug === slug);
  if (!product) throw new KernelError(404, 'NOT_FOUND', 'المنتج غير موجود.');
  const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenantId, identity.userId])).rows[0];
  requireRole(member, ['OWNER', 'ADMIN', 'MEMBER']);
  let access;
  try {
    const setup = (await db.query("SELECT to_regclass('public.aigas_product_access') IS NOT NULL AND to_regclass('public.aigas_product_grants') IS NOT NULL AS ready")).rows[0];
    if (!setup?.ready) throw new KernelError(503, 'KERNEL_ADMIN_SETUP_REQUIRED', `إتاحة ${product.name} غير مهيأة لهذه المؤسسة؛ راجع إعدادات Kernel المعتمدة.`, 'not configured');
    access = (await db.query('SELECT status FROM public.aigas_product_access WHERE tenant_id=$1 AND product_slug=$2 FOR SHARE', [tenantId, slug])).rows[0] ?? null;
    if (access) {
      const grant = (await db.query('SELECT revoked_at,expires_at,expires_at<=clock_timestamp() AS expired FROM public.aigas_product_grants WHERE tenant_id=$1 AND product_slug=$2 FOR SHARE', [tenantId, slug])).rows[0] ?? null;
      access = { ...access, ...grant };
    }
  } catch (error) {
    if (error instanceof KernelError) throw error;
    if (error.code === '42P01') throw new KernelError(503, 'KERNEL_ADMIN_SETUP_REQUIRED', `إتاحة ${product.name} غير مهيأة لهذه المؤسسة؛ راجع إعدادات Kernel المعتمدة.`, 'not configured');
    throw error;
  }
  if (!access) throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `لم تُعتمد إتاحة ${product.name} لهذه المؤسسة.`, 'not configured');
  if (access.revoked_at) throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `إتاحة ${product.name} غير متاحة لهذه المؤسسة؛ راجع مالكها.`, 'access denied');
  if (access.expired === true || access.status === 'EXPIRED') throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `انتهت صلاحية إتاحة ${product.name}؛ راجع مالك المؤسسة.`, 'expired');
  if (!access.expires_at || access.status !== 'ENABLED') throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `إتاحة ${product.name} غير متاحة لهذه المؤسسة؛ راجع مالكها.`, 'access denied');
  return member;
}
