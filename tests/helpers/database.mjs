import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

// Only fresh, dedicated localhost databases. Never load dotenv or infer a DSN.
export function localDatabaseUrl(name) {
  const value = process.env[name];
  if (!value) {
    if (process.env.AIGAS_REQUIRE_DB_TESTS === 'true') throw new Error(`Required local fixture missing: ${name}`);
    return undefined;
  }
  const url = new URL(value);
  assert(['postgres:', 'postgresql:'].includes(url.protocol));
  assert(['localhost', '127.0.0.1'].includes(url.hostname), 'Disposable localhost DB required');
  assert(!url.search, 'Connection overrides are forbidden in test DSNs');
  return value;
}
export async function installSchema(db) {
  assert.equal((await db.query('SHOW server_version_num')).rows[0].server_version_num.slice(0,2), '18');
  assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname IN ('public','neon_auth')")).rows[0].n, 0, 'Fresh database required');
  // Local stand-in for the managed Auth catalog, not an Auth runtime simulation.
  await db.query(`CREATE SCHEMA neon_auth;
    CREATE TABLE neon_auth."user" (id uuid PRIMARY KEY, name text NOT NULL DEFAULT 'Synthetic User', email text NOT NULL DEFAULT 'synthetic@example.test', banned boolean, role text, "emailVerified" boolean);
    CREATE TABLE neon_auth.organization (id uuid PRIMARY KEY, name text);
    CREATE TABLE neon_auth.invitation (id uuid PRIMARY KEY, email text, status text, "expiresAt" timestamptz, "organizationId" uuid, "inviterId" uuid, role text);
    CREATE TABLE neon_auth.member (id uuid PRIMARY KEY, "organizationId" uuid, "userId" uuid, role text);`);
  const directory = new URL('../../migrations/', import.meta.url);
  // Current 0002/0003 replace legacy upgrades 0011–0013; 0025 supersedes 0019; order 0018 before 0025 is mandatory.
  for (const file of (await readdir(directory)).filter(f => f.endsWith('.sql') && !['0011','0012','0013','0019'].includes(f.slice(0,4))).sort()) {
    await db.query(await readFile(new URL(file, directory), 'utf8'));
  }
}
export async function grantProduct(db, tenant, slug) {
  await db.query(`INSERT INTO aigas_product_access(tenant_id,product_slug,status) VALUES($1,$2,'ENABLED')
    ON CONFLICT(tenant_id,product_slug) DO UPDATE SET status='ENABLED'`, [tenant, slug]);
  await db.query(`INSERT INTO aigas_product_grants(tenant_id,product_slug,approval_reference,expires_at)
    VALUES($1,$2,'LOCAL_SYNTHETIC_FIXTURE',now()+interval '1 day')`, [tenant, slug]);
}
export async function runtime(db) {
  await db.query('SET LOCAL ROLE aigas_runtime');
  const row=(await db.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];
  assert.equal(row.rolsuper,false); assert.equal(row.rolbypassrls,false);
}
