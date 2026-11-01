import { randomUUID } from 'node:crypto';
import { database, transaction } from './db.mjs';
import { env } from './env.mjs';
import { authConfig } from './auth.mjs';
import { KernelError, productStates, selectMembership, workspaceName, roleLabel, auditActionLabel } from './core.mjs';
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
export async function dashboard(identity, requested) {
  const scope = await tenantGuard(identity, requested);
  const manage = ['OWNER', 'ADMIN'].includes(scope.tenant?.role);
  if (!scope.tenant) return { ...scope, products: productStates([]), connection: 'CONNECTED', summary: null, activity: [], canManageMembers: false };
  const db = database();
  const tenantId = scope.tenant.tenant_id;
  // Recheck membership within the data query to fail closed on concurrent revocation.
  const result = await db.query('SELECT a.product_slug, a.status FROM public.aigas_product_access a JOIN public.aigas_memberships m ON m.tenant_id = a.tenant_id WHERE a.tenant_id = $1 AND m.user_id = $2', [tenantId, identity.userId]);
  // Aggregate reads stay scoped to the server-verified tenant; no cross-tenant rows are reachable.
  const summary = (await db.query('SELECT (SELECT count(*)::int FROM public.aigas_memberships WHERE tenant_id = $1) AS members, (SELECT count(*)::int FROM public.aigas_audit_events WHERE tenant_id = $1) AS events', [tenantId])).rows[0];
  const activity = (await db.query('SELECT e.action, e.created_at, u.name AS actor FROM public.aigas_audit_events e LEFT JOIN neon_auth."user" u ON u.id = e.actor_user_id WHERE e.tenant_id = $1 ORDER BY e.created_at DESC, e.id DESC LIMIT 8', [tenantId])).rows
    .map(row => ({ action: row.action, label: auditActionLabel(row.action), actor: row.actor ?? null, created_at: row.created_at }));
  return { ...scope, products: productStates(result.rows), connection: 'CONNECTED', summary, activity, canManageMembers: manage };
}
export async function tenantMembers(identity, requested) {
  const scope = await tenantGuard(identity, requested);
  if (!scope.tenant) throw new KernelError(403, 'NO_WORKSPACE', 'أنشئ مساحة عمل من Kernel أولًا.');
  const canManage = ['OWNER', 'ADMIN'].includes(scope.tenant.role);
  const rows = (await database().query("SELECT m.role, m.created_at, u.name, u.email, u.banned FROM public.aigas_memberships m LEFT JOIN neon_auth.\"user\" u ON u.id = m.user_id WHERE m.tenant_id = $1 ORDER BY CASE m.role WHEN 'OWNER' THEN 0 WHEN 'ADMIN' THEN 1 ELSE 2 END, m.created_at, m.user_id", [scope.tenant.tenant_id])).rows;
  return {
    tenant: scope.tenant,
    memberships: scope.memberships,
    canManage,
    members: rows.map(row => ({
      name: row.name || 'عضو',
      role: row.role,
      roleLabel: roleLabel(row.role),
      created_at: row.created_at,
      status: row.banned ? 'BANNED' : 'ACTIVE',
      // Co-member email is only returned to roles that administer the tenant.
      email: canManage ? row.email ?? null : null,
    })),
    invitation: { available: false, reason: 'لا يوجد مسار دعوة موثّق في Kernel بعد؛ إنشاء الحساب يتم عبر Neon Auth ثم تُضاف العضوية بإجراء مشغّل معتمد.' },
  };
}
export async function audit(db, identity, tenantId, action) {
  // No request bodies, tokens, names, email addresses or AI content in this log.
  await db.query('INSERT INTO public.aigas_audit_events (id, tenant_id, actor_user_id, action) SELECT $1, m.tenant_id, m.user_id, $4 FROM public.aigas_memberships m WHERE m.tenant_id = $2 AND m.user_id = $3', [randomUUID(), tenantId, identity.userId, action]);
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
  const checks = { auth: authConfig() ? 'READY' : 'AUTH_SETUP_REQUIRED', database: 'DB_SETUP_REQUIRED', schema: 'NOT_CHECKED' };
  if (!env('DATABASE_URL')) return { status: 'setup_required', checks };
  try {
    const result = await database().query("SELECT to_regclass('public.aigas_tenants') IS NOT NULL AND to_regclass('public.aigas_memberships') IS NOT NULL AND to_regclass('public.aigas_product_access') IS NOT NULL AND to_regclass('public.aigas_audit_events') IS NOT NULL AS ready");
    checks.database = 'READY';
    checks.schema = result.rows[0]?.ready ? 'READY' : 'SCHEMA_MISSING';
    return { status: checks.auth === 'READY' && checks.schema === 'READY' ? 'operational' : 'degraded', checks };
  } catch {
    checks.database = 'DB_UNAVAILABLE';
    checks.schema = 'NOT_CHECKED';
    return { status: 'degraded', checks };
  }
}
