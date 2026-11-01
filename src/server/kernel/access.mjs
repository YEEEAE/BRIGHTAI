import { KernelError, requireRole, products } from './core.mjs';
// Shared by all five products. Active approval is separate from the product toggle.
export async function requireProductAccess(db, identity, tenantId, slug) {
  if (!products.some(p => p.slug === slug)) throw new KernelError(404, 'NOT_FOUND', 'المنتج غير موجود.');
  const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenantId, identity.userId])).rows[0];
  requireRole(member, ['OWNER', 'ADMIN', 'MEMBER']);
  let access;
  try { access = (await db.query(`SELECT a.status FROM public.aigas_product_access a JOIN public.aigas_product_grants g ON g.tenant_id=a.tenant_id AND g.product_slug=a.product_slug WHERE a.tenant_id=$1 AND a.product_slug=$2 AND a.status='ENABLED' AND g.revoked_at IS NULL AND g.expires_at>now() FOR SHARE OF a,g`, [tenantId, slug])).rows[0]; }
  catch (error) {
    if (error.code === '42P01') throw new KernelError(503, 'KERNEL_ADMIN_SETUP_REQUIRED', 'يلزم تطبيق ترحيل إدارة Kernel المعتمد قبل إتاحة المنتجات.');
    throw error;
  }
  if (!access) throw new KernelError(403, 'PRODUCT_NOT_ENABLED', 'المنتج غير مفعّل أو انتهى قرار الإتاحة الإداري؛ راجع مالك المؤسسة.');
  return member;
}
