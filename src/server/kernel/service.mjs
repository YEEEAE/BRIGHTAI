import { recordProductEvent } from '../ledger/writer.mjs';
import { randomUUID } from 'node:crypto';
import { database, transaction } from './db.mjs';
import { env } from './env.mjs';
import { authConfig } from './auth.mjs';
import { KernelError, productStates, selectMembership, workspaceName, roleLabel, auditActionLabel, requireRole } from './core.mjs';
export async function memberships(userId, db = database()) {
  // Excludes anonymous tokens and deleted identities using the actual Auth directory.
  const user = await db.query('SELECT id FROM neon_auth."user" WHERE id = $1 AND banned IS NOT TRUE', [userId]);
  if (!user.rowCount) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم حساب مستخدم موثّق.');
  const result = await db.query('SELECT m.tenant_id, m.role, t.name, t.created_at FROM public.aigas_memberships m JOIN public.aigas_tenants t ON t.id = m.tenant_id WHERE m.user_id = $1 ORDER BY m.created_at, m.tenant_id', [userId]);
  return result.rows;
}
export async function tenantGuard(identity, requested, db = database()) {
  const rows = await memberships(identity.userId, db);
  return { memberships: rows, tenant: selectMembership(rows, requested) };
}
async function lockMember(db, identity, tenant) {
  const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenant.tenant_id, identity.userId])).rows[0];
  requireRole(member, ['OWNER','ADMIN','MEMBER']);
  return { ...tenant, role: member.role };
}
export async function dashboard(identity, requested) {
  return transaction(async db => {
    const scope = await tenantGuard(identity, requested, db);
    if (!scope.tenant) return { ...scope, products: productStates([]).map(p => ({ ...p, href: null, enabled: false })), connection: 'CONNECTED', summary: null, activity: [], canManageMembers: false, canManageProducts: false };
    scope.tenant = await lockMember(db, identity, scope.tenant);
    const tenantId = scope.tenant.tenant_id;
    const adminReady = (await db.query("SELECT to_regclass('public.aigas_product_grants') IS NOT NULL AS ready")).rows[0].ready;
    const access = (await db.query(adminReady ? 'SELECT product_slug,status,version FROM public.aigas_product_access WHERE tenant_id=$1' : 'SELECT product_slug,status FROM public.aigas_product_access WHERE tenant_id=$1', [tenantId])).rows;
    const grants = adminReady ? (await db.query('SELECT product_slug,access_kind,expires_at FROM public.aigas_product_grants WHERE tenant_id=$1 AND revoked_at IS NULL AND expires_at>now()', [tenantId])).rows : [];
    const relations = { firewall: ['aigas_fw_rules','aigas_fw_decisions'], ledger: ['aigas_ld_events'], 'human-gate': ['aigas_hg_requests','aigas_hg_decisions'], 'risk-engine': ['aigas_re_assets','aigas_re_assessments','aigas_re_asset_revisions'], 'secure-chat': [] };
    const states = [];
    for (const p of productStates(access)) {
      const grant = grants.find(g => g.product_slug === p.slug);
      const tables = relations[p.slug];
      const ready = tables.length ? (await db.query("SELECT bool_and(to_regclass('public.' || name) IS NOT NULL) AS ready FROM unnest($1::text[]) AS name", [tables])).rows[0].ready : false;
      const enabled = p.state === 'ENABLED' && !!grant;
      states.push({ ...p, enabled, href: enabled && ready ? `/app/${p.slug}/` : null, version: access.find(a => a.product_slug === p.slug)?.version ?? null,
        canEnable: !!grant, canManage: adminReady && scope.tenant.role === 'OWNER', readiness: ready ? 'CONFIGURED' : 'SETUP_REQUIRED',
        setupMessage: p.slug === 'secure-chat' ? 'لا يوجد نموذج أو مزود معتمد؛ الإرسال غير متاح.' : ready ? 'مخطط المنتج موجود؛ جاهزيته التشغيلية تحتاج اعتمادًا مستقلًا.' : 'يلزم تطبيق ترحيل المنتج على بيئة معتمدة.',
        accessKind: grant?.access_kind ?? null, expiresAt: grant?.expires_at ?? null, subscription: 'NOT_CONFIGURED', trial: 'NOT_CONFIGURED',
        label: p.state === 'ENABLED' && !grant ? 'الإتاحة معلّقة: لا قرار إداري ساري' : p.label });
    }
    const summary = (await db.query('SELECT (SELECT count(*)::int FROM public.aigas_memberships WHERE tenant_id=$1) AS members, (SELECT count(*)::int FROM public.aigas_audit_events WHERE tenant_id=$1) AS events', [tenantId])).rows[0];
    const activity = (await db.query('SELECT action,created_at FROM public.aigas_audit_events WHERE tenant_id=$1 ORDER BY created_at DESC,id DESC LIMIT 8', [tenantId])).rows.map(row => ({ ...row, label: auditActionLabel(row.action), actor: null }));
    return { ...scope, products: states, connection: 'CONNECTED', summary, activity, canManageMembers: ['OWNER','ADMIN'].includes(scope.tenant.role), canManageProducts: scope.tenant.role === 'OWNER' && adminReady };
  });
}
export async function tenantMembers(identity, requested) {
  return transaction(async db => {
    const scope = await tenantGuard(identity, requested, db);
    if (!scope.tenant) throw new KernelError(403, 'NO_WORKSPACE', 'أنشئ مساحة عمل من Kernel أولًا.');
    scope.tenant = await lockMember(db, identity, scope.tenant);
    const canManage = ['OWNER','ADMIN'].includes(scope.tenant.role);
    const rows = (await db.query(`SELECT m.role,m.created_at,u.name,u.email,u.banned FROM public.aigas_memberships m LEFT JOIN neon_auth."user" u ON u.id=m.user_id WHERE m.tenant_id=$1 ORDER BY CASE m.role WHEN 'OWNER' THEN 0 WHEN 'ADMIN' THEN 1 ELSE 2 END,m.created_at,m.user_id`, [scope.tenant.tenant_id])).rows;
    const { invitationState } = await import('./administration.mjs');
    return { ...scope, canManage, members: rows.map(row => ({ name: row.name || 'عضو', role: row.role, roleLabel: roleLabel(row.role), created_at: row.created_at, status: row.banned ? 'BANNED' : 'ACTIVE', email: canManage ? row.email ?? null : null })), invitation: await invitationState(db, identity, scope.tenant) };
  });
}
export async function audit(db, identity, tenantId, action) {
  // No request bodies, tokens, names, email addresses or AI content in this log.
  const auditId = randomUUID();
  const result = await db.query('INSERT INTO public.aigas_audit_events (id, tenant_id, actor_user_id, action) SELECT $1, m.tenant_id, m.user_id, $4 FROM public.aigas_memberships m WHERE m.tenant_id = $2 AND m.user_id = $3', [auditId, tenantId, identity.userId, action]);
  if (result.rowCount !== 1) throw new KernelError(503, 'AUDIT_UNAVAILABLE', 'تعذر حفظ سجل الإدارة؛ لم تكتمل العملية.');
  if (action === 'workspace.created' || action.startsWith('kernel.')) {
    await recordProductEvent(db, identity, tenantId, {source:'kernel',event_type:'kernel.audit.recorded',policy_version:'kernel-administration-v1',metadata_json:{synthetic:false,audit_ref:auditId,action},idempotency_key:`audit:${auditId}`});
  }
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
  const checks = { auth: authConfig() ? 'READY' : 'AUTH_SETUP_REQUIRED', database: 'DB_SETUP_REQUIRED', schema: 'NOT_CHECKED', administration: 'NOT_CHECKED' };
  if (!env('DATABASE_URL')) return { status: 'setup_required', checks };
  try {
    const result = await database().query("SELECT to_regclass('public.aigas_tenants') IS NOT NULL AND to_regclass('public.aigas_memberships') IS NOT NULL AND to_regclass('public.aigas_product_access') IS NOT NULL AND to_regclass('public.aigas_audit_events') IS NOT NULL AS ready");
    checks.database = 'READY';
    checks.schema = result.rows[0]?.ready ? 'READY' : 'SCHEMA_MISSING';
    const administration = (await database().query("SELECT to_regclass('public.aigas_product_grants') IS NOT NULL AND to_regclass('public.aigas_auth_organizations') IS NOT NULL AND to_regclass('public.aigas_member_invitations') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='aigas_product_access' AND column_name='version') AS ready")).rows[0]?.ready;
    checks.administration = administration ? 'READY' : 'KERNEL_ADMIN_SETUP_REQUIRED';
    return { status: checks.auth === 'READY' && checks.schema === 'READY' && administration ? 'operational' : 'degraded', checks };
  } catch {
    checks.database = 'DB_UNAVAILABLE';
    checks.schema = 'NOT_CHECKED';
    return { status: 'degraded', checks };
  }
}
