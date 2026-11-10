import { env } from './env.mjs';
import pg from 'pg';
import { KernelError, isUuid } from './core.mjs';
let pool;
export function database() {
  if (!env('DATABASE_URL')) throw new KernelError(503, 'DB_SETUP_REQUIRED', 'يلزم إعداد اتصال قاعدة البيانات.', 'not configured');
  if (!pool) {
    pool = new pg.Pool({
      connectionString: env('DATABASE_URL'),
      application_name: 'brightai-aigas',
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      statement_timeout: 8000,
      query_timeout: 8000,
    });
    // Idle clients can emit connection errors outside a request. Without a listener the
    // process would exit; never log the connection string or driver error details here.
    pool.on('error', () => {});
  }
  return pool;
}
// Short-lived readiness probe. It deliberately does not reuse the request pool:
// while the database is down a platform health checker would otherwise open a
// new pooled connection on every attempt and starve real requests.
// Returns a state only; never a role name, host or driver message.
export async function probeDatabase(timeoutMs = 2000) {
  if (!env('DATABASE_URL')) return { state: 'UNCONFIGURED' };
  const client = new pg.Client({
    connectionString: env('DATABASE_URL'),
    application_name: 'brightai-readiness',
    connectionTimeoutMillis: timeoutMs,
    statement_timeout: timeoutMs,
    query_timeout: timeoutMs,
  });
  try {
    await client.connect();
    const row = (await client.query("SELECT to_regclass('public.aigas_tenants') IS NOT NULL AS kernel_schema")).rows[0] ?? {};
    return { state: row.kernel_schema === true ? 'READY' : 'SCHEMA_MISSING' };
  } catch (error) {
    return { state: error?.code === '42501' ? 'PRIVILEGE_DENIED' : 'UNAVAILABLE' };
  } finally {
    try { await client.end(); } catch {}
  }
}

export async function transaction(work) {
  const client = await database().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    // A broken connection must not replace the original error and turn it into a false 500.
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}
// `set_config(..., true)` is transaction-local. Outside an explicit transaction it is
// discarded with the implicit transaction, so the next query would run unscoped while the
// caller believes it is scoped. SAVEPOINT is only valid inside a transaction block, which
// makes that mistake fail closed instead of silently dropping the tenant predicate.
async function requireTransactionBlock(db) {
  try {
    await db.query('SAVEPOINT aigas_scope_guard');
    await db.query('RELEASE SAVEPOINT aigas_scope_guard');
  } catch {
    throw new KernelError(503, 'TENANT_SCOPE_UNAVAILABLE', 'تعذر تأكيد نطاق المؤسسة داخل معاملة؛ لم تُنفذ العملية.');
  }
}
// Transaction-local tenant context for RLS policies on a least-privilege runtime role.
// Callers must have verified membership in this exact tenant first. The set values are
// read back so a pooler or driver that ignores set_config cannot produce a false scope.
export async function setTenantScope(db, tenantId, userId) {
  if (!isUuid(tenantId) || !isUuid(userId)) throw new KernelError(503, 'TENANT_SCOPE_UNAVAILABLE', 'تعذر تأكيد نطاق المؤسسة؛ لم تُنفذ العملية.');
  await requireTransactionBlock(db);
  const row = (await db.query(
    "SELECT set_config('aigas.tenant_id',$1,true) AS tenant_id,set_config('aigas.user_id',$2,true) AS user_id",
    [tenantId, userId],
  )).rows[0] ?? {};
  if (row.tenant_id !== tenantId || row.user_id !== userId) throw new KernelError(503, 'TENANT_SCOPE_UNAVAILABLE', 'تعذر تأكيد نطاق المؤسسة؛ لم تُنفذ العملية.');
}
// Actor-only scope, used before a tenant is selected (membership discovery). It still comes
// from the verified bearer token, never from a request body. The tenant GUC is explicitly
// cleared so an actor-scope query cannot inherit a previous tenant inside the same session.
export async function setActorScope(db, userId) {
  if (!isUuid(userId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم حساب مستخدم موثّق.');
  await requireTransactionBlock(db);
  const row = (await db.query(
    "SELECT set_config('aigas.tenant_id','',true) AS tenant_id,set_config('aigas.user_id',$1,true) AS user_id",
    [userId],
  )).rows[0] ?? {};
  if (row.tenant_id !== '' || row.user_id !== userId) throw new KernelError(503, 'TENANT_SCOPE_UNAVAILABLE', 'تعذر تأكيد نطاق المؤسسة؛ لم تُنفذ العملية.');
}
// Opt-in runtime guard for staging and post-cutover verification. When
// AIGAS_REQUIRE_RLS=true, product endpoints refuse to run on a connection that
// bypasses RLS instead of silently relying on explicit predicates alone.
export async function requireRlsPosture(db = database()) {
  if (env('AIGAS_REQUIRE_RLS') !== 'true') return;
  const posture = await connectionPrivilege(db);
  if (!posture.rlsEnforced) throw new KernelError(503, 'RLS_NOT_ENFORCED', 'اتصال قاعدة البيانات يتجاوز RLS؛ لم تُنفذ العملية.');
}
let privilege;
// Read-only posture of the connection role. It is never returned as a role name or a DSN.
// With the current owner connection RLS is bypassed, so every query must carry an explicit
// tenant predicate; the NOBYPASSRLS role in migrations/0025 makes RLS a second layer.
export async function connectionPrivilege(db = database()) {
  if (!privilege) {
    const pending = db.query(`SELECT r.rolsuper,r.rolbypassrls FROM pg_roles r WHERE r.rolname=current_user`)
      .then(result => {
        const row = result.rows[0] ?? {};
        const bypass = row.rolsuper === true || row.rolbypassrls === true;
        return Object.freeze({ rlsEnforced: !bypass });
      });
    privilege = pending.catch(error => { privilege = undefined; throw error; });
  }
  return privilege;
}
