import { env } from './env.mjs';
import pg from 'pg';
import { KernelError, isUuid } from './core.mjs';
let pool;
export function database() {
  if (!env('DATABASE_URL')) throw new KernelError(503, 'DB_SETUP_REQUIRED', 'يلزم إعداد اتصال قاعدة البيانات.');
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
// Transaction-local tenant context for RLS policies on a least-privilege runtime role.
// Callers must have verified membership in this exact tenant first. `set_config(..., true)`
// is discarded at COMMIT/ROLLBACK, so a pooled or pooler connection can never keep a sticky
// tenant context between requests.
export async function setTenantScope(db, tenantId, userId) {
  if (!isUuid(tenantId) || !isUuid(userId)) throw new KernelError(503, 'TENANT_SCOPE_UNAVAILABLE', 'تعذر تأكيد نطاق المؤسسة؛ لم تُنفذ العملية.');
  await db.query("SELECT set_config('aigas.tenant_id',$1,true),set_config('aigas.user_id',$2,true)", [tenantId, userId]);
}
// Actor-only scope, used before a tenant is selected (membership discovery). It still comes
// from the verified bearer token, never from a request body.
export async function setActorScope(db, userId) {
  if (!isUuid(userId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم حساب مستخدم موثّق.');
  await db.query("SELECT set_config('aigas.user_id',$1,true)", [userId]);
}
let privilege;
// Read-only posture of the connection role. It is never returned as a role name or a DSN.
// With the current owner connection RLS is bypassed, so every query must carry an explicit
// tenant predicate; the least-privilege role in migrations/0019 makes RLS a second layer.
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
