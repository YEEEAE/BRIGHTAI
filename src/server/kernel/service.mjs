import { listApprovedModels } from '../secure-chat/models.mjs';
import { providerReady } from '../secure-chat/adapter.mjs';
import { randomUUID } from 'node:crypto';
import { database, transaction, setActorScope, setTenantScope, connectionPrivilege } from './db.mjs';
import { env } from './env.mjs';
import { authConfig } from './auth.mjs';
import { productGrants } from './access.mjs';
import { KernelError, products, productStates, selectMembership, workspaceName, roleLabel, auditActionLabel, requireRole, isUuid } from './core.mjs';
export async function memberships(userId, db = database()) {
  if (!isUuid(userId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم حساب مستخدم موثّق.');
  // Actor scope comes from the verified token; it lets a least-privilege runtime role read
  // only this user's membership rows before a tenant is chosen.
  await setActorScope(db, userId);
  // Excludes anonymous tokens and deleted identities using the actual Auth directory.
  const user = await db.query('SELECT id FROM neon_auth."user" WHERE id = $1 AND banned IS NOT TRUE', [userId]);
  if (!user.rowCount) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم حساب مستخدم موثّق.');
  const result = await db.query('SELECT m.tenant_id, m.role, t.name, t.created_at FROM public.aigas_memberships m JOIN public.aigas_tenants t ON t.id = m.tenant_id WHERE m.user_id = $1 ORDER BY m.created_at, m.tenant_id', [userId]);
  return result.rows;
}
export async function tenantGuard(identity, requested, db = database()) {
  // Reject a malformed selector before reading any row; it is never echoed back.
  if (requested != null && !isUuid(requested)) throw new KernelError(400, 'INVALID_WORKSPACE', 'حدد مؤسسة صالحة قبل تنفيذ العملية.');
  const rows = await memberships(identity.userId, db);
  const tenant = selectMembership(rows, requested);
  // A workspace parameter is only a selector over the caller's own memberships. It never
  // grants scope and never becomes the tenant used by a query.
  if (tenant) await setTenantScope(db, tenant.tenant_id, identity.userId);
  return { memberships: rows, tenant };
}
async function lockMember(db, identity, tenant) {
  const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenant.tenant_id, identity.userId])).rows[0];
  requireRole(member, ['OWNER','ADMIN','MEMBER']);
  return { ...tenant, role: member.role };
}
export async function dashboard(identity, requested) {
  return transaction(async db => {
    const scope = await tenantGuard(identity, requested, db);
    const updatedAt = (await db.query('SELECT clock_timestamp() AS updated_at')).rows[0].updated_at;
    const system = { connection: 'CONNECTED', membership: scope.tenant ? 'VERIFIED' : 'NONE', updatedAt,
      // Authenticated view only: the current owner connection bypasses RLS, so isolation rests
      // on explicit tenant predicates until migrations/0019 is approved and applied.
      rls: await connectionPrivilege(db).then(posture => posture.rlsEnforced ? 'ENFORCED' : 'BYPASSED').catch(() => 'NOT_CHECKED') };
    if (!scope.tenant) return { ...scope, products: productStates([]).map(p => ({ ...p, href: null, enabled: false })), connection: 'CONNECTED', system, summary: null, activity: [], canManageMembers: false, canManageProducts: false, policyEngine:{state:'NOT_CONFIGURED',publishedPolicies:0,departments:0} };
    scope.tenant = await lockMember(db, identity, scope.tenant);
    const tenantId = scope.tenant.tenant_id;
    const policySchema = (await db.query("SELECT bool_and(to_regclass('public.' || name) IS NOT NULL) AS ready FROM unnest(ARRAY['aigas_departments','aigas_department_memberships','aigas_department_events','aigas_policy_delegations','aigas_policies','aigas_policy_versions','aigas_policy_approvals','aigas_kernel_policy_decisions']::text[]) AS t(name)")).rows[0].ready;
    const policyCounts = policySchema ? (await db.query("SELECT (SELECT count(*)::int FROM public.aigas_policy_versions v JOIN public.aigas_policies p ON p.tenant_id=v.tenant_id AND p.id=v.policy_id AND p.current_version=v.version WHERE p.tenant_id=$1 AND v.status='PUBLISHED' AND (v.effective_from IS NULL OR v.effective_from<=now()) AND (v.expires_at IS NULL OR v.expires_at>now())) AS published, (SELECT count(*)::int FROM public.aigas_departments WHERE tenant_id=$1 AND status='ACTIVE') AS departments",[tenantId])).rows[0] : {published:0,departments:0};
    const policyEngine = { state:!policySchema?'NOT_CONFIGURED':policyCounts.published?'CONFIGURED':'NO_PUBLISHED_POLICIES',publishedPolicies:policyCounts.published,departments:policyCounts.departments };
    const adminReady = (await db.query("SELECT to_regclass('public.aigas_product_grants') IS NOT NULL AS ready")).rows[0].ready;
    const access = (await db.query(adminReady ? 'SELECT product_slug,status,version FROM public.aigas_product_access WHERE tenant_id=$1' : 'SELECT product_slug,status FROM public.aigas_product_access WHERE tenant_id=$1', [tenantId])).rows;
    const grants = adminReady ? await productGrants(db, tenantId) : [];
    const relations = { firewall: ['aigas_fw_rules','aigas_fw_decisions'], ledger: ['aigas_ld_events'], 'human-gate': ['aigas_hg_requests','aigas_hg_decisions','aigas_hg_policies','aigas_hg_events'], 'risk-engine': ['aigas_re_assets','aigas_re_assessments','aigas_re_asset_revisions'], 'secure-chat': ['aigas_sc_requests','aigas_sc_cancellations'] };
    const states = [];
    for (const p of productStates(access)) {
      const grant = grants.find(g => g.product_slug === p.slug);
      const tables = relations[p.slug];
      const ready = tables.length ? (await db.query("SELECT bool_and(to_regclass('public.' || name) IS NOT NULL) AS ready FROM unnest($1::text[]) AS name", [tables])).rows[0].ready : false;
      const grantState = grant?.grantState ?? 'NOT_APPROVED';
      const grantValid = grantState === 'ACTIVE';
      const accessState = p.state;
      const state = accessState !== 'ENABLED' ? accessState : grantValid ? 'ENABLED' : grantState === 'REVOKED' ? 'REVOKED' : grantState === 'EXPIRED' ? 'EXPIRED' : 'DISABLED';
      const enabled = state === 'ENABLED';
      states.push({ ...p, state, configuredStatus: accessState, grantState, enabled, href: enabled && ready ? `/app/${p.slug}/` : null, version: access.find(a => a.product_slug === p.slug)?.version ?? null,
        canEnable: grantValid, canManage: adminReady && scope.tenant.role === 'OWNER', readiness: ready ? 'CONFIGURED' : 'SETUP_REQUIRED',
        setupMessage: p.slug === 'secure-chat' ? !ready ? 'يلزم ترحيل Secure Chat المعتمد قبل الإرسال.' : listApprovedModels(tenantId).some(providerReady) ? 'موصل معتمد مهيأ؛ التشغيل والنشر يحتاجان اعتمادًا مستقلًا.' : 'لا يوجد نموذج أو مزود معتمد ومهيأ؛ الإرسال غير متاح.' : ready ? 'مخطط المنتج موجود؛ جاهزيته التشغيلية تحتاج اعتمادًا مستقلًا.' : 'يلزم تطبيق ترحيل المنتج على بيئة معتمدة.',
        accessKind: grant?.access_kind ?? null, approvedAt: grant?.approved_at ?? null, expiresAt: grant?.expires_at ?? null,
        subscription: 'NOT_CONFIGURED', license: 'NOT_CONFIGURED', trial: 'NOT_CONFIGURED',
        // Administrative approval is never activated_at. There is no trial issuer/provisioner.
        trialDetails: { status: 'NOT_CONFIGURED', activated_at: null, expires_at: null, durationSeconds: 172800, selfServiceAvailable: false, automaticConversion: false, automaticCharge: false, automaticRenewal: false, dataEligibility: 'SYNTHETIC_ONLY' },
        label: state === 'EXPIRED' ? 'منتهٍ: انتهى قرار الإتاحة الإداري' : state === 'REVOKED' ? 'ملغى: سحب المشغّل قرار الإتاحة' : state === 'DISABLED' && accessState === 'ENABLED' ? 'معطّل: لا يوجد قرار إتاحة إداري ساري' : p.label });
    }
    const summary = (await db.query('SELECT (SELECT count(*)::int FROM public.aigas_memberships WHERE tenant_id=$1) AS members, count(*)::int AS events, min(created_at) AS firstEventAt, max(created_at) AS lastEventAt FROM public.aigas_audit_events WHERE tenant_id=$1', [tenantId])).rows[0];
    const activity = (await db.query('SELECT action,created_at FROM public.aigas_audit_events WHERE tenant_id=$1 ORDER BY created_at DESC,id DESC LIMIT 8', [tenantId])).rows.map(row => ({ ...row, label: auditActionLabel(row.action), actor: null }));
    summary.proofOfValue = { status: 'NOT_CONFIGURED', source: 'KERNEL_AUDIT', scope: 'ALL_RETAINED_TENANT_EVENTS', activated_at: null, expires_at: null, firstEventAt: summary.firsteventat, lastEventAt: summary.lasteventat };
    delete summary.firsteventat; delete summary.lasteventat;
    summary.coverage = access.length ? { enabled: states.filter(p => p.enabled).length, total: products.length } : null;
    return { ...scope, products: states, connection: 'CONNECTED', system, summary, activity, policyEngine, canManageMembers: ['OWNER','ADMIN'].includes(scope.tenant.role), canManageProducts: scope.tenant.role === 'OWNER' && adminReady };
  });
}
export async function tenantMembers(identity, requested) {
  return transaction(async db => {
    const scope = await tenantGuard(identity, requested, db);
    if (!scope.tenant) throw new KernelError(403, 'NO_WORKSPACE', 'أنشئ مساحة عمل من Kernel أولًا.');
    scope.tenant = await lockMember(db, identity, scope.tenant);
    const canManage = ['OWNER','ADMIN'].includes(scope.tenant.role);
    const rows = (await db.query(`SELECT m.user_id,m.role,m.created_at,u.name,u.email,u.banned FROM public.aigas_memberships m LEFT JOIN neon_auth."user" u ON u.id=m.user_id WHERE m.tenant_id=$1 ORDER BY CASE m.role WHEN 'OWNER' THEN 0 WHEN 'ADMIN' THEN 1 ELSE 2 END,m.created_at,m.user_id`, [scope.tenant.tenant_id])).rows;
    const { invitationState } = await import('./administration.mjs');
    return { ...scope, canManage, members: rows.map(row => ({ userId: canManage ? row.user_id : null, isSelf: row.user_id === identity.userId, name: row.name || 'عضو', role: row.role, roleLabel: roleLabel(row.role), created_at: row.created_at, status: row.banned ? 'BANNED' : 'ACTIVE', email: canManage ? row.email ?? null : null })), invitation: await invitationState(db, identity, scope.tenant) };
  });
}
export async function audit(db, identity, tenantId, action, context = {}) {
  // No request bodies, tokens, names, email addresses or AI content in this log.
  if (!isUuid(tenantId)) throw new KernelError(503, 'AUDIT_UNAVAILABLE', 'تعذر تحديد نطاق المؤسسة؛ لم تكتمل العملية.');
  const { correlationId = null, policyVersion = null, idempotencyKey = null } = context;
  const validVersion = policyVersion === null || (typeof policyVersion === 'string' && /^[a-zA-Z0-9_.:-]{1,120}$/.test(policyVersion));
  const validCorrelation = correlationId === null || (typeof correlationId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(correlationId));
  const validKey = idempotencyKey === null || (typeof idempotencyKey === 'string' && /^[a-zA-Z0-9_.:-]{1,180}$/.test(idempotencyKey));
  if (!validVersion || !validCorrelation || !validKey) throw new KernelError(400, 'INVALID_AUDIT_CONTEXT', 'مرجع سجل Kernel أو نسخة السياسة غير صالحة.');
  const auditId = randomUUID();
  const result = await db.query(`INSERT INTO public.aigas_audit_events
    (id,tenant_id,actor_user_id,action,correlation_id,policy_version,idempotency_key)
    SELECT $1,m.tenant_id,m.user_id,$4,$5,$6,$7 FROM public.aigas_memberships m
    WHERE m.tenant_id=$2 AND m.user_id=$3
    ON CONFLICT DO NOTHING RETURNING id`, [auditId, tenantId, identity.userId, action, correlationId, policyVersion, idempotencyKey]);
  if (result.rowCount === 1) return auditId;
  if (idempotencyKey) {
    const member = (await db.query('SELECT 1 FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenantId, identity.userId])).rows[0];
    if (!member) throw new KernelError(403, 'FORBIDDEN', 'صلاحياتك لا تسمح بهذه العملية.');
    const previous = (await db.query('SELECT id,actor_user_id,action,correlation_id,policy_version FROM public.aigas_audit_events WHERE tenant_id=$1 AND idempotency_key=$2 FOR SHARE', [tenantId, idempotencyKey])).rows[0];
    if (previous && previous.actor_user_id === identity.userId && previous.action === action && previous.correlation_id === correlationId && previous.policy_version === policyVersion) return previous.id;
    throw new KernelError(409, 'AUDIT_IDEMPOTENCY_CONFLICT', 'مفتاح سجل Kernel مرتبط بعملية مختلفة؛ لم تُكرر العملية.');
  }
  throw new KernelError(503, 'AUDIT_UNAVAILABLE', 'تعذر حفظ سجل الإدارة؛ لم تكتمل العملية.');
}
export async function createWorkspace(identity, name) {
  const validated = workspaceName(name);
  return transaction(async db => {
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [identity.userId]);
    if ((await memberships(identity.userId, db)).length) throw new KernelError(409, 'ALREADY_MEMBER', 'لديك عضوية قائمة؛ لا يمكن إنشاء مؤسسة أو منح دور جديد من هذا المسار.');
    const id = randomUUID();
    await db.query('INSERT INTO public.aigas_tenants (id, name) VALUES ($1, $2)', [id, validated]);
    await db.query("INSERT INTO public.aigas_memberships (tenant_id, user_id, role) VALUES ($1, $2, 'OWNER')", [id, identity.userId]);
    await db.query("INSERT INTO public.aigas_product_access (tenant_id, product_slug) SELECT $1, unnest($2::text[])", [id, ['firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat']]);
    await audit(db, identity, id, 'workspace.created');
    return id;
  });
}
// Setup-state codes only: no host names, credentials, versions or SQL error text are returned.
export async function operationalHealth() {
  const authReady = !!authConfig();
  const databaseConfigured = !!env('DATABASE_URL');
  const checks = { auth: authReady ? 'READY' : 'AUTH_SETUP_REQUIRED', database: 'DB_SETUP_REQUIRED', schema: 'NOT_CHECKED', administration: 'NOT_CHECKED', policyEngine:'NOT_CHECKED' };
  const configuration = { auth: authReady ? 'CONFIGURED' : 'UNCONFIGURED', database: databaseConfigured ? 'CONFIGURED' : 'UNCONFIGURED' };
  const updatedAt = new Date().toISOString();
  if (!databaseConfigured) return { status: 'setup_required', state: 'unconfigured', errorType: authReady ? 'DB_SETUP_REQUIRED' : 'KERNEL_SETUP_REQUIRED', updatedAt, configuration, checks };
  try {
    const result = await database().query("SELECT to_regclass('public.aigas_tenants') IS NOT NULL AND to_regclass('public.aigas_memberships') IS NOT NULL AND to_regclass('public.aigas_product_access') IS NOT NULL AND to_regclass('public.aigas_audit_events') IS NOT NULL AS ready, clock_timestamp() AS checked_at");
    const checkedAt = result.rows[0]?.checked_at ?? updatedAt;
    checks.database = 'READY';
    checks.schema = result.rows[0]?.ready ? 'READY' : 'SCHEMA_MISSING';
    const administration = (await database().query("SELECT to_regclass('public.aigas_product_grants') IS NOT NULL AND to_regclass('public.aigas_auth_organizations') IS NOT NULL AND to_regclass('public.aigas_member_invitations') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aigas_product_access' AND column_name='version') AS ready")).rows[0]?.ready;
    checks.administration = administration ? 'READY' : 'KERNEL_ADMIN_SETUP_REQUIRED';
    const policySchema = (await database().query("SELECT bool_and(to_regclass('public.' || name) IS NOT NULL) AS ready FROM unnest(ARRAY['aigas_departments','aigas_department_memberships','aigas_department_events','aigas_policy_delegations','aigas_policies','aigas_policy_versions','aigas_policy_approvals','aigas_kernel_policy_decisions']::text[]) AS t(name)")).rows[0]?.ready;
    checks.policyEngine = policySchema ? 'SCHEMA_READY' : 'NOT_CONFIGURED';
    const state = checks.schema !== 'READY' ? 'blocked' : !authReady ? 'unconfigured' : !administration ? 'degraded' : 'ready';
    const errorType = state === 'blocked' ? 'SCHEMA_MISSING' : !authReady ? 'AUTH_SETUP_REQUIRED' : !administration ? 'KERNEL_ADMIN_SETUP_REQUIRED' : null;
    return { status: state === 'ready' ? 'operational' : 'degraded', state, errorType, updatedAt: checkedAt, configuration: { ...configuration, schema: checks.schema, administration: administration ? 'CONFIGURED' : 'UNCONFIGURED', policyEngine: policySchema ? 'CONFIGURED' : 'UNCONFIGURED' }, checks };
  } catch (error) {
    const errorType = error?.code === '42P01' || error?.code === '42703' ? 'SCHEMA_MISSING' : error?.code === '42501' ? 'DB_PRIVILEGE_UNAVAILABLE' : 'DB_UNAVAILABLE';
    checks.database = errorType === 'SCHEMA_MISSING' ? 'READY' : errorType === 'DB_PRIVILEGE_UNAVAILABLE' ? 'DB_PRIVILEGE_UNAVAILABLE' : 'DB_UNAVAILABLE';
    checks.schema = errorType === 'SCHEMA_MISSING' ? 'SCHEMA_MISSING' : 'NOT_CHECKED';
    return { status: 'degraded', state: errorType === 'SCHEMA_MISSING' ? 'blocked' : 'degraded', errorType, updatedAt, configuration: { ...configuration, schema: errorType === 'SCHEMA_MISSING' ? 'UNCONFIGURED' : 'UNKNOWN', administration: 'UNKNOWN' }, checks };
  }
}
