import { env } from './env.mjs';
import pg from 'pg';
import { KernelError } from './core.mjs';
let pool;
export function database() {
  if (!env('DATABASE_URL')) throw new KernelError(503, 'DB_SETUP_REQUIRED', 'يلزم إعداد اتصال قاعدة البيانات.');
  pool ??= new pg.Pool({ connectionString: env('DATABASE_URL'), max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, statement_timeout: 8000 });
  return pool;
}
export async function transaction(work) {
  const client = await database().connect();
  try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
