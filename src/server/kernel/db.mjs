import { env } from './env.mjs';
import pg from 'pg';
import { KernelError } from './core.mjs';
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
