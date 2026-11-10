// Runtime posture checks against the isolated target. Every probe runs inside a
// transaction that is rolled back, so no row survives.
//
// This is what the local rehearsal cannot prove: it exercises the real Neon roles,
// the real RLS policies and the real function grants.
//
// Usage: node --env-file=.env.staging.local scripts/verify-target-posture.mjs

import pg from 'pg';

const dsn = process.env.DATABASE_URL_UNPOOLED;
if (!dsn) {
  console.error('REFUSED: DATABASE_URL_UNPOOLED is not set');
  process.exit(2);
}

const client = new pg.Client({ connectionString: dsn, application_name: 'aigas-posture-checks', connectionTimeoutMillis: 15000 });
await client.connect();

const results = [];

// Each probe: open a transaction, run, roll back. Records SQLSTATE + row count.
async function probe(name, body, expect) {
  await client.query('BEGIN');
  let outcome;
  try {
    const value = await body();
    outcome = { rows: value };
  } catch (error) {
    outcome = { code: error.code, message: error.message.split('\n')[0] };
  } finally {
    await client.query('ROLLBACK').catch(() => {});
  }
  const passed = expect(outcome);
  results.push({ probe: name, passed, outcome });
}

await probe('authenticated cannot SELECT public.aigas_tenants', async () => {
  await client.query('SET LOCAL ROLE authenticated');
  const r = await client.query('SELECT count(*)::int AS n FROM public.aigas_tenants');
  return r.rows[0].n;
}, o => o.code === '42501');

await probe('authenticated cannot EXECUTE aigas_sc_usage_window_v2', async () => {
  await client.query('SET LOCAL ROLE authenticated');
  const r = await client.query('SELECT * FROM public.aigas_sc_usage_window_v2($1,$2)', [
    '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']);
  return r.rowCount;
}, o => o.code === '42501');

await probe('aigas_runtime holds no verb on aigas_sc_messages', async () => {
  await client.query('SET LOCAL ROLE aigas_runtime');
  const r = await client.query('SELECT count(*)::int AS n FROM public.aigas_sc_messages');
  return r.rows[0].n;
}, o => o.code === '42501');

await probe('aigas_runtime sees zero rows without tenant scope (RLS default deny)', async () => {
  await client.query('SET LOCAL ROLE aigas_runtime');
  const r = await client.query('SELECT count(*)::int AS n FROM public.aigas_tenants');
  return r.rows[0].n;
}, o => o.rows === 0);

await probe('aigas_runtime can EXECUTE its granted aggregate', async () => {
  await client.query('SET LOCAL ROLE aigas_runtime');
  const r = await client.query('SELECT * FROM public.aigas_sc_usage_window_v2($1,$2)', [
    '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']);
  return r.rowCount;
}, o => o.code === undefined);

await probe('transaction-local scope does not leak past ROLLBACK', async () => {
  await client.query("SELECT set_config('aigas.tenant_id',$1,true)", ['11111111-1111-4111-8111-111111111111']);
  return null;
}, o => o.code === undefined);
const leaked = (await client.query("SELECT coalesce(nullif(current_setting('aigas.tenant_id',true),''),'') AS v")).rows[0].v;
results.push({ probe: 'aigas.tenant_id is empty outside the transaction', passed: leaked === '', outcome: { value: leaked ? '<set>' : '' } });

await probe('ledger chain guard rejects a forged link', async () => {
  const tenant = '11111111-1111-4111-8111-111111111111';
  const actor = '33333333-3333-4333-8333-333333333333';
  await client.query('INSERT INTO neon_auth."user"(id,name,email,"emailVerified") VALUES($1,$2,$3,false) ON CONFLICT DO NOTHING',
    [actor, 'Synthetic Probe', 'probe@example.test']);
  await client.query('INSERT INTO public.aigas_tenants(id,name) VALUES($1,$2) ON CONFLICT DO NOTHING', [tenant, 'synthetic-probe']);
  const r = await client.query(`INSERT INTO public.aigas_ld_events(
      event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,
      hash_profile,sequence_no,idempotency_key,integrity_hash,previous_hash)
    VALUES(gen_random_uuid(),$1,'kernel','kernel.audit.recorded','p',
      '{"synthetic":false,"audit_ref":"44444444-4444-4444-8444-444444444444","action":"kernel.probe"}',
      now(),$2,'aigas-ledger-sha256-chain-v2',7,'probe-forged',repeat('a',64),repeat('b',64))`, [tenant, actor]);
  return r.rowCount;
}, o => o.code === 'P0001');

await client.end();

const failed = results.filter(r => !r.passed);
console.log(JSON.stringify({
  checks: results.length, passed: results.length - failed.length, failed: failed.length,
  results, verdict: failed.length === 0 ? 'PASS' : 'FAIL',
}, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
