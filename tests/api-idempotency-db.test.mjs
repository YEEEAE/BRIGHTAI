import { randomUUID } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { installSchema, localDatabaseUrl } from './helpers/database.mjs';

const url = localDatabaseUrl('API_IDEMPOTENCY_TEST_DATABASE_URL');
test('workspace creation replay is atomic, payload-bound and isolated by actor', { skip: !url }, async () => {
  const pool = new pg.Pool({ connectionString: url });
  try {
    await installSchema(pool);
    process.env.DATABASE_URL = url;
    process.env.AIGAS_DB_RUNTIME_ROLE = 'aigas_runtime';
    process.env.AIGAS_REQUIRE_RLS = 'true';
    const { createWorkspace } = await import('../src/server/kernel/service.mjs');
    const actor = { userId: randomUUID() };
    const other = { userId: randomUUID() };
    const key = randomUUID();
    await pool.query('INSERT INTO neon_auth."user"(id) VALUES($1),($2)', [actor.userId, other.userId]);
    const [first, replay] = await Promise.all([
      createWorkspace(actor, 'Synthetic workspace', key),
      createWorkspace(actor, 'Synthetic workspace', key),
    ]);
    assert.equal(first, replay);
    assert.equal(await createWorkspace(actor, ' Synthetic workspace ', key), first);
    await assert.rejects(createWorkspace(actor, 'Different workspace', key), { status: 409, code: 'IDEMPOTENCY_CONFLICT' });
    await assert.rejects(createWorkspace(actor, 'Different workspace', 'bad key'), { status: 400 });
    assert.notEqual(await createWorkspace(other, 'Different workspace', key), first);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM public.aigas_tenants')).rows[0].n, 2);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM public.aigas_audit_events WHERE action='workspace.created'")).rows[0].n, 2);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL ROLE aigas_runtime');
      await client.query("SELECT set_config('aigas.user_id',$1,true)", [actor.userId]);
      const visible = (await client.query('SELECT actor_id, workspace_id FROM public.aigas_workspace_idempotency')).rows;
      assert.deepEqual(visible, [{ actor_id: actor.userId, workspace_id: first }]);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
});
