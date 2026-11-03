import { KernelError, requireRole, products, isUuid } from './core.mjs';
import { setTenantScope } from './db.mjs';
// One read model for all five products; administrative access is not a commercial licence.
export async function productGrants(db, tenantId, slug = null) {
  if (!isUuid(tenantId)) throw new KernelError(400, 'INVALID_WORKSPACE', 'حدد مؤسسة صالحة.');
  const rows = (await db.query(`SELECT product_slug,access_kind,approved_at,expires_at,revoked_at,
    clock_timestamp() AS checked_at FROM public.aigas_product_grants
    WHERE tenant_id=$1 AND ($2::text IS NULL OR product_slug=$2) FOR SHARE`, [tenantId, slug])).rows;
  return rows.map(grant => ({ ...grant, grantState: productGrantState(grant) }));
}
export function productGrantState(grant) {
  if (!grant) return 'NOT_APPROVED';
  if (grant.revoked_at) return 'REVOKED';
  // No trial/subscription/perpetual/offline issuer exists. Unknown kinds fail closed.
  if (grant.access_kind !== 'ADMIN_NON_BILLED') return 'NOT_CONFIGURED';
  const approved = grant.approved_at == null ? NaN : new Date(grant.approved_at).getTime();
  const expires = grant.expires_at == null ? NaN : new Date(grant.expires_at).getTime();
  const checked = grant.checked_at == null ? NaN : new Date(grant.checked_at).getTime();
  if (![approved, expires, checked].every(Number.isFinite) || expires <= approved) return 'NOT_CONFIGURED';
  if (expires <= checked) return 'EXPIRED';
  return approved > checked ? 'PENDING' : 'ACTIVE';
}
// The only membership lookup products may trust. The tenant comes from server data, never
// from a request body; the user comes from the verified bearer token.
export async function assertTenantMembership(db, identity, tenantId) {
  if (!isUuid(tenantId) || typeof identity?.userId !== 'string' || !isUuid(identity.userId)) throw new KernelError(400, 'INVALID_WORKSPACE', 'حدد مؤسسة صالحة.');
  const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenantId, identity.userId])).rows[0];
  requireRole(member, ['OWNER', 'ADMIN', 'MEMBER']);
  return member;
}
// Stable, tenant-bound references used by client-supplied identifiers. The
// table/column pairs are server-owned literals; no identifier from a request is
// ever interpolated into SQL. A reference already used by another tenant is a
// conflict, never a replay of that tenant's operation.
const referenceScopes = Object.freeze({
  firewall_request: { table: 'public.aigas_fw_decisions', column: 'request_id' },
  secure_chat_request: { table: 'public.aigas_sc_requests', column: 'id' },
});

export async function assertReferenceTenant(db, tenantId, kind, value) {
  const scope = referenceScopes[kind];
  if (!scope || !isUuid(tenantId) || !isUuid(value)) return;
  let foreign;
  try {
    foreign = (await db.query(`SELECT 1 FROM ${scope.table} WHERE ${scope.column}=$1 AND tenant_id<>$2 LIMIT 1`, [value, tenantId])).rowCount > 0;
  } catch (error) {
    // The primary operation writes to this table next and will fail closed if
    // the schema or grant is absent. This secondary check never turns a missing
    // table into an allow.
    if (error?.code === '42P01' || error?.code === '42501') return;
    throw error;
  }
  if (foreign) throw new KernelError(409, 'REFERENCE_TENANT_CONFLICT', 'هذا المرجع مستخدم في مؤسسة أخرى؛ استخدم معرّفًا جديدًا. لم تُنفّذ العملية.');
}

// Shared by all five products. Active approval is separate from the product toggle.
export async function requireProductAccess(db, identity, tenantId, slug) {
  const product = products.find(item => item.slug === slug);
  if (!product) throw new KernelError(404, 'NOT_FOUND', 'المنتج غير موجود.');
  const member = await assertTenantMembership(db, identity, tenantId);
  // Scope the transaction only after the membership check so a future runtime role can rely
  // on RLS without ever trusting a client-supplied tenant.
  await setTenantScope(db, tenantId, identity.userId);
  let access;
  try {
    const setup = (await db.query("SELECT to_regclass('public.aigas_product_access') IS NOT NULL AND to_regclass('public.aigas_product_grants') IS NOT NULL AS ready")).rows[0];
    if (!setup?.ready) throw new KernelError(503, 'KERNEL_ADMIN_SETUP_REQUIRED', `إتاحة ${product.name} غير مهيأة لهذه المؤسسة؛ راجع إعدادات Kernel المعتمدة.`, 'not configured');
    access = (await db.query('SELECT status FROM public.aigas_product_access WHERE tenant_id=$1 AND product_slug=$2 FOR SHARE', [tenantId, slug])).rows[0] ?? null;
    if (access) {
      const grant = (await productGrants(db, tenantId, slug))[0] ?? null;
      access = { ...access, grantState: grant?.grantState ?? 'NOT_APPROVED' };
    }
  } catch (error) {
    if (error instanceof KernelError) throw error;
    if (error.code === '42P01') throw new KernelError(503, 'KERNEL_ADMIN_SETUP_REQUIRED', `إتاحة ${product.name} غير مهيأة لهذه المؤسسة؛ راجع إعدادات Kernel المعتمدة.`, 'not configured');
    if (error.code === '42501') throw new KernelError(503, 'DB_PRIVILEGE_UNAVAILABLE', `صلاحية اتصال النظام لا تسمح بالتحقق من إتاحة ${product.name}.`, 'access denied');
    throw error;
  }
  if (!access) throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `لم تُعتمد إتاحة ${product.name} لهذه المؤسسة.`, 'not configured');
  if (access.grantState === 'REVOKED') throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `إتاحة ${product.name} غير متاحة لهذه المؤسسة؛ راجع مالكها.`, 'access denied');
  if (access.grantState === 'EXPIRED' || access.status === 'EXPIRED') throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `انتهت صلاحية إتاحة ${product.name}؛ راجع مالك المؤسسة.`, 'expired');
  if (access.grantState === 'NOT_CONFIGURED') throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `نوع الإتاحة أو مدتها غير مهيأ لـ${product.name}؛ راجع المشغّل.`, 'not configured');
  if (access.grantState !== 'ACTIVE' || access.status !== 'ENABLED') throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `إتاحة ${product.name} غير متاحة لهذه المؤسسة؛ راجع مالكها.`, 'access denied');
  return member;
}
