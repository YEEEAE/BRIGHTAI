import { randomUUID } from 'node:crypto';
import { database, transaction } from './db.mjs';
import { KernelError, productStates, selectMembership, workspaceName } from './core.mjs';
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
  if (!scope.tenant) return { ...scope, products: productStates([]), connection: 'CONNECTED' };
  // Recheck membership within the data query to fail closed on concurrent revocation.
  const result = await database().query('SELECT a.product_slug, a.status FROM public.aigas_product_access a JOIN public.aigas_memberships m ON m.tenant_id = a.tenant_id WHERE a.tenant_id = $1 AND m.user_id = $2', [scope.tenant.tenant_id, identity.userId]);
  return { ...scope, products: productStates(result.rows), connection: 'CONNECTED' };
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
