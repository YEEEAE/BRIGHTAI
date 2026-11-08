import { KernelError, requireRole, products, isUuid } from './core.mjs';
import { setActorScope, setTenantScope, requireRlsPosture } from './db.mjs';
import { trialProductAccess } from './trial.mjs';

// Administrative access is not a commercial licence. The grant table currently
// stores only ADMIN_NON_BILLED decisions; commercial sources are separate and
// are never read from this table or inferred from a product toggle.
export const ADMINISTRATIVE_GRANT_KIND = 'ADMIN_NON_BILLED';
export const COMMERCIAL_ACCESS_KINDS = Object.freeze({
  TRIAL: 'TRIAL_48H',
  SUBSCRIPTION: 'SUBSCRIPTION',
  PERPETUAL: 'PERPETUAL',
  ON_PREMISE: 'ON_PREMISE',
});

export function grantKindClass(kind) {
  if (kind === ADMINISTRATIVE_GRANT_KIND) return 'ADMINISTRATIVE';
  if (kind === COMMERCIAL_ACCESS_KINDS.TRIAL) return 'TRIAL';
  if (kind === COMMERCIAL_ACCESS_KINDS.SUBSCRIPTION) return 'SUBSCRIPTION';
  if (kind === COMMERCIAL_ACCESS_KINDS.PERPETUAL) return 'PERPETUAL';
  if (kind === COMMERCIAL_ACCESS_KINDS.ON_PREMISE) return 'ON_PREMISE';
  return 'NOT_CONFIGURED';
}

// One read model for all five products. Products are independent: a row for one
// product never implies another, and Kernel is not a row or a separately priced grant.
export async function productGrants(db, tenantId, slug = null) {
  if (!isUuid(tenantId)) throw new KernelError(400, 'INVALID_WORKSPACE', 'حدد مؤسسة صالحة.');
  const rows = (await db.query(`SELECT product_slug,access_kind,approval_reference,approved_at,expires_at,revoked_at,
    clock_timestamp() AS checked_at FROM public.aigas_product_grants
    WHERE tenant_id=$1 AND ($2::text IS NULL OR product_slug=$2) FOR SHARE`, [tenantId, slug])).rows;
  return rows.map(raw => {
    const { approval_reference, ...rest } = raw;
    const grant = {
      ...rest,
      // The operator approval reference is evidence, not display data. Only its
      // presence leaves the server so a reference value never reaches a browser.
      approvalReferencePresent: typeof approval_reference === 'string' && approval_reference.trim().length >= 2,
      grantKind: grantKindClass(raw.access_kind),
    };
    return { ...grant, grantState: productGrantState(grant) };
  });
}

// Only an explicit ADMIN_NON_BILLED window is an administrative access decision.
// Any commercial kind that appears here is unconfigured, not an active licence.
export function productGrantState(grant) {
  if (!grant) return 'NOT_APPROVED';
  if (grant.revoked_at) return 'REVOKED';
  if (grant.access_kind !== ADMINISTRATIVE_GRANT_KIND) return 'NOT_CONFIGURED';
  // Evidence-required: an administrative grant without its operator approval
  // reference is not an effective decision and grants nothing.
  if (grant.approvalReferencePresent === false) return 'NOT_CONFIGURED';
  const approved = grant.approved_at == null ? NaN : new Date(grant.approved_at).getTime();
  const expires = grant.expires_at == null ? NaN : new Date(grant.expires_at).getTime();
  const checked = grant.checked_at == null ? Date.now() : new Date(grant.checked_at).getTime();
  if (![approved, expires, checked].every(Number.isFinite) || expires <= approved) return 'NOT_CONFIGURED';
  if (expires <= checked) return 'EXPIRED';
  return approved > checked ? 'PENDING' : 'ACTIVE';
}

// Single access decision shared by the dashboard read model and the server-side
// product guard. Sources stay separate: an administrative grant is never a trial,
// a licence, or a renewal, and an expired source is reported as expired instead of
// being folded into another source. Absence of any active source is never access.
export function resolveProductAccess({ storedStatus, grant, trial }) {
  const administrativeActive = grant?.grantState === 'ACTIVE' && grant.approvalReferencePresent !== false;
  const administrative = {
    kind: ADMINISTRATIVE_GRANT_KIND,
    state: administrativeActive ? 'ACTIVE' : grant?.approvalReferencePresent === false ? 'NOT_CONFIGURED' : grant?.grantState ?? 'NOT_APPROVED',
    grantsProduct: administrativeActive,
    approvedAt: grant?.approved_at ?? null,
    expiresAt: grant?.expires_at ?? null,
    // Evidence is the operator approval reference recorded with the grant. The
    // value itself never leaves the server; only whether it exists.
    evidence: !grant ? 'NONE' : grant.approvalReferencePresent === true ? 'OPERATOR_APPROVAL_RECORD' : 'MISSING_APPROVAL_REFERENCE',
  };
  const trialAccess = {
    kind: COMMERCIAL_ACCESS_KINDS.TRIAL,
    state: trial?.state ?? 'NOT_CONFIGURED',
    grantsProduct: trial?.grantsProduct === true,
    reason: trial?.reason ?? null,
  };
  const license = {
    kind: 'LICENSE',
    state: 'NOT_CONFIGURED',
    grantsProduct: false,
    reason: 'NO_APPROVED_LICENSE_ISSUER',
  };
  const expired = {
    administrative: administrative.state === 'EXPIRED',
    trial: trialAccess.state === 'EXPIRED',
    license: false,
  };
  const storedState = !storedStatus || storedStatus === 'FOUNDATION' ? 'NOT_CONFIGURED' : storedStatus;
  const productEnabled = storedState === 'ENABLED';
  const grantsProduct = administrative.grantsProduct || trialAccess.grantsProduct;
  const state = storedState !== 'ENABLED'
    ? storedState
    : grantsProduct ? 'ENABLED'
      : administrative.state === 'REVOKED' ? 'REVOKED'
        : expired.administrative || expired.trial ? 'EXPIRED'
          : 'DISABLED';
  const source = administrative.grantsProduct ? ADMINISTRATIVE_GRANT_KIND
    : trialAccess.grantsProduct ? COMMERCIAL_ACCESS_KINDS.TRIAL
      : null;
  const reason = grantsProduct ? 'GRANTS_PRODUCT'
    : administrative.state === 'REVOKED' ? 'ADMIN_GRANT_REVOKED'
      : expired.administrative ? 'ADMIN_GRANT_EXPIRED'
        : expired.trial ? 'TRIAL_WINDOW_ENDED'
          : administrative.state === 'PENDING' || trialAccess.state === 'PENDING' || trialAccess.state === 'APPROVED' ? 'ACCESS_NOT_ACTIVE'
            : 'NO_ACTIVE_ACCESS_SOURCE';
  return {
    state, storedState, productEnabled, grantsProduct, source, reason, expired,
    administrative, trial: trialAccess, license,
    sources: { administrative, trial: trialAccess, license },
  };
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
  // Unknown kind, malformed tenant or malformed reference is a server/input error, not a
  // reason to skip the guard. Returning early here would silently allow the write.
  if (!scope) throw new KernelError(503, 'REFERENCE_GUARD_UNAVAILABLE', 'تعذر التحقق من مرجع العملية؛ لم تُنفّذ العملية.');
  if (!isUuid(tenantId) || !isUuid(value)) throw new KernelError(400, 'INVALID_REFERENCE', 'مرجع العملية غير صالح.');
  let foreign;
  try {
    foreign = (await db.query(`SELECT 1 FROM ${scope.table} WHERE ${scope.column}=$1 AND tenant_id<>$2 LIMIT 1`, [value, tenantId])).rowCount > 0;
  } catch {
    // A guard that cannot run must stop the operation. Under RLS this read cannot see a
    // foreign row; migrations/0025 adds a global unique index as the database backstop.
    throw new KernelError(503, 'REFERENCE_GUARD_UNAVAILABLE', 'تعذر التحقق من مرجع العملية؛ لم تُنفّذ العملية.');
  }
  if (foreign) throw new KernelError(409, 'REFERENCE_TENANT_CONFLICT', 'هذا المرجع مستخدم في مؤسسة أخرى؛ استخدم معرّفًا جديدًا. لم تُنفّذ العملية.');
}

// Shared by all five products. Active approval is separate from the product toggle.
// An active trial entitlement is a separate commercial source; it is accepted only
// with an activated request, an ACTIVE row, and the exact 48-hour window.
export async function requireProductAccess(db, identity, tenantId, slug) {
  const product = products.find(item => item.slug === slug);
  if (!product) throw new KernelError(404, 'NOT_FOUND', 'المنتج غير موجود.');
  // A caller may arrive here without a prior tenantGuard (for example a product
  // request after a separate membership-discovery transaction). Set actor scope
  // first so the self-membership policy can see the row; then set tenant scope
  // only after the membership check. A NOBYPASSRLS role therefore never needs a
  // tenant predicate to be trusted from the request.
  await setActorScope(db, identity.userId);
  const member = await assertTenantMembership(db, identity, tenantId);
  await setTenantScope(db, tenantId, identity.userId);
  await requireRlsPosture(db);
  let access;
  let trial;
  let grant = null;
  try {
    const setup = (await db.query("SELECT to_regclass('public.aigas_product_access') IS NOT NULL AND to_regclass('public.aigas_product_grants') IS NOT NULL AS ready")).rows[0];
    if (!setup?.ready) throw new KernelError(503, 'KERNEL_ADMIN_SETUP_REQUIRED', `إتاحة ${product.name} غير مهيأة لهذه المؤسسة؛ راجع إعدادات Kernel المعتمدة.`, 'not configured');
    access = (await db.query('SELECT status FROM public.aigas_product_access WHERE tenant_id=$1 AND product_slug=$2 FOR SHARE', [tenantId, slug])).rows[0] ?? null;
    if (access) {
      grant = (await productGrants(db, tenantId, slug))[0] ?? null;
      trial = await trialProductAccess(db, tenantId, slug);
    }
  } catch (error) {
    if (error instanceof KernelError) throw error;
    if (error.code === '42P01' || error.code === '42703') throw new KernelError(503, 'KERNEL_ADMIN_SETUP_REQUIRED', `إتاحة ${product.name} غير مهيأة لهذه المؤسسة؛ راجع إعدادات Kernel المعتمدة.`, 'not configured');
    if (error.code === '42501') throw new KernelError(503, 'DB_PRIVILEGE_UNAVAILABLE', `صلاحية اتصال النظام لا تسمح بالتحقق من إتاحة ${product.name}.`, 'access denied');
    throw error;
  }
  if (!access) throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `لم تُعتمد إتاحة ${product.name} لهذه المؤسسة.`, 'not configured');
  // The dashboard read model and this guard share one decision, so a product the
  // UI reports as available is exactly the product the server permits.
  const decision = resolveProductAccess({ storedStatus: access.status, grant, trial });
  if (decision.grantsProduct && decision.productEnabled) return member;
  if (decision.reason === 'ADMIN_GRANT_EXPIRED' || decision.reason === 'TRIAL_WINDOW_ENDED' || access.status === 'EXPIRED') {
    throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `انتهت صلاحية إتاحة ${product.name}؛ راجع مالك المؤسسة.`, 'expired');
  }
  if (decision.reason === 'ADMIN_GRANT_REVOKED') {
    throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `إتاحة ${product.name} غير متاحة لهذه المؤسسة؛ راجع مالكها.`, 'access denied');
  }
  if (decision.reason === 'ACCESS_NOT_ACTIVE') {
    throw new KernelError(403, 'PRODUCT_NOT_ENABLED', 'لا يوجد قرار إتاحة ساري بعد؛ طلب التجربة أو الموافقة لا يفعّل المنتج.', 'access denied');
  }
  const status = decision.administrative.state === 'NOT_CONFIGURED' && decision.trial.state === 'NOT_CONFIGURED' ? 'not configured' : 'access denied';
  throw new KernelError(403, 'PRODUCT_NOT_ENABLED', `إتاحة ${product.name} غير متاحة لهذه المؤسسة؛ راجع مالكها.`, status);
}
