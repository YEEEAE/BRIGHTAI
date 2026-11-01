// Dedicated disposable local Postgres only. No .env or remote targets are read.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createFirewallService } from '../src/server/firewall/service.mjs';

const url = process.env.FIREWALL_TEST_DATABASE_URL;
if (url && !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Local isolated database required');
test('Postgres: policy CRUD, priority, tenant isolation, permissions, metadata privacy and fail-closed log', { skip: !url }, async () => {
  const db = new pg.Client({ connectionString: url }); await db.connect();
  try {
    await db.query('CREATE SCHEMA neon_auth; CREATE TABLE neon_auth."user" (id uuid PRIMARY KEY,banned boolean)');
    await db.query(await readFile(new URL('../migrations/0001_aigas_kernel.sql', import.meta.url), 'utf8'));
    await db.query(await readFile(new URL('../migrations/0002_aigas_firewall.sql', import.meta.url), 'utf8'));
    const owner = { userId: randomUUID() }, member = { userId: randomUUID() }, outsider = { userId: randomUUID() };
    const tenant = randomUUID(), other = randomUUID();
    for (const identity of [owner, member, outsider]) await db.query('INSERT INTO neon_auth."user" (id) VALUES ($1)', [identity.userId]);
    await db.query("INSERT INTO aigas_tenants (id,name) VALUES ($1,'Synthetic A'),($2,'Synthetic B')", [tenant, other]);
    for (const [user, scope, role] of [[owner, tenant, 'OWNER'], [member, tenant, 'MEMBER'], [outsider, other, 'OWNER']]) await db.query('INSERT INTO aigas_memberships (tenant_id,user_id,role) VALUES ($1,$2,$3)', [scope, user.userId, role]);
    const operate = createFirewallService(async work => { await db.query('BEGIN'); try { const result = await work(db); await db.query('COMMIT'); return result; } catch (error) { await db.query('ROLLBACK'); throw error; } });

    assert.equal((await operate(owner, tenant, 'evaluate', { text: 'معلومة عامة' })).reason, 'NO_ACTIVE_POLICY');
    for (const template of ['public', 'identifier', 'prohibited']) await operate(owner, tenant, 'create', { template });
    let dashboard = await operate(owner, tenant, 'dashboard');
    assert.equal(dashboard.rules.length, 3);
    assert.deepEqual(dashboard.rules.map(item => item.action), ['BLOCK', 'REDACT', 'ALLOW']);
    assert.equal((await operate(member, tenant, 'evaluate', { text: 'معلومة عامة' })).action, 'ALLOW');
    assert.equal((await operate(member, tenant, 'evaluate', { text: 'secret synthetic DEMO-ID-1234' })).action, 'REDACT');
    assert.equal((await operate(owner, tenant, 'evaluate', { text: 'DEMO-BLOCK' })).action, 'BLOCK');

    // Custom literal rules are saved, priority-ordered and cited by the decision.
    await operate(owner, tenant, 'create', { name: 'حجب مخصص', pattern: 'DEMO-CUSTOM', action: 'BLOCK', priority: 5 });
    dashboard = await operate(owner, tenant, 'dashboard');
    assert.equal(dashboard.rules[0].name, 'حجب مخصص');
    assert.equal(dashboard.rules[0].template, null);
    const custom = dashboard.rules[0];
    const blocked = await operate(member, tenant, 'evaluate', { text: 'نص اصطناعي DEMO-CUSTOM' });
    assert.equal(blocked.action, 'BLOCK');
    assert.equal(blocked.rule_name, 'حجب مخصص');
    assert.equal(blocked.rule_version, 1);
    assert.equal(blocked.output, null);

    await operate(owner, tenant, 'update', { id: custom.id, version: 1, name: 'حجب مخصص 2', pattern: 'DEMO-CUSTOM-2' });
    assert.equal((await operate(member, tenant, 'evaluate', { text: 'DEMO-CUSTOM' })).action, 'ALLOW');
    assert.equal((await operate(member, tenant, 'evaluate', { text: 'DEMO-CUSTOM-2' })).rule_name, 'حجب مخصص 2');
    const edited = (await operate(owner, tenant, 'dashboard')).rules.find(item => item.id === custom.id);
    assert.equal(edited.version, 2);
    assert.equal(edited.pattern, 'DEMO-CUSTOM-2');
    await assert.rejects(operate(owner, tenant, 'create', { name: 'حجب مخصص 2', pattern: 'DEMO-OTHER', action: 'ALLOW' }), error => error.code === 'RULE_EXISTS');
    await assert.rejects(operate(owner, tenant, 'create', { name: 'x', pattern: 'DEMO', action: 'ALLOW' }), error => error.status === 400);
    await assert.rejects(operate(owner, tenant, 'create', { name: 'اسم صالح', pattern: '', action: 'ALLOW' }), error => error.status === 400);
    await assert.rejects(operate(owner, tenant, 'create', { name: 'اسم صالح', pattern: 'DEMO', action: 'DROP' }), error => error.status === 400);
    await assert.rejects(operate(owner, tenant, 'create', { template: 'public', name: 'مختلط' }), error => error.status === 400);
    await assert.rejects(operate(owner, tenant, 'update', { id: custom.id, version: 1, enabled: false }), error => error.code === 'RULE_CHANGED');

    // Server templates are toggle-only; tenant-defined rules carry editing.
    const prohibited = dashboard.rules.find(item => item.template === 'prohibited');
    await assert.rejects(operate(owner, tenant, 'update', { id: prohibited.id, version: 1, pattern: 'DEMO-BLOCK-2' }), error => error.code === 'TEMPLATE_IMMUTABLE');
    assert.equal((await operate(owner, tenant, 'evaluate', { text: 'DEMO-BLOCK' })).action, 'BLOCK');
    await operate(owner, tenant, 'update', { id: prohibited.id, version: 1, enabled: false });
    assert.equal((await operate(owner, tenant, 'evaluate', { text: 'DEMO-BLOCK' })).action, 'ALLOW');
    assert.equal((await operate(owner, tenant, 'dashboard')).rules.find(item => item.id === prohibited.id).version, 2);

    // Permissions and tenant isolation stay server-side.
    await assert.rejects(operate(member, tenant, 'create', { template: 'public' }), error => error.status === 403);
    await assert.rejects(operate(member, tenant, 'update', { id: prohibited.id, version: 2, enabled: true }), error => error.status === 403);
    await assert.rejects(operate(outsider, tenant, 'dashboard'), error => error.status === 403);
    await assert.rejects(operate(outsider, other, 'update', { id: prohibited.id, version: 2, enabled: true }), error => error.code === 'RULE_CHANGED');
    assert.equal((await operate(outsider, other, 'dashboard')).decisions.length, 0);

    // Filters and the bounded recent list.
    for (let index = 0; index < 14; index++) await operate(owner, tenant, 'evaluate', { text: 'معلومة عامة' });
    dashboard = await operate(owner, tenant, 'dashboard');
    assert.equal(dashboard.decisions.length, 12);
    const blockedOnly = await operate(owner, tenant, 'dashboard', {}, { action: 'BLOCK' });
    assert.ok(blockedOnly.decisions.length > 0 && blockedOnly.decisions.every(item => item.action === 'BLOCK'));
    assert.ok(blockedOnly.decisions.some(item => item.rule_name));
    const unmatched = await operate(owner, tenant, 'dashboard', {}, { reason: 'NO_MATCH_LAB_ONLY' });
    assert.ok(unmatched.decisions.every(item => item.reason === 'NO_MATCH_LAB_ONLY'));
    await assert.rejects(operate(owner, tenant, 'dashboard', {}, { action: 'DROP' }), error => error.status === 400);

    const persisted = JSON.stringify((await db.query('SELECT * FROM aigas_fw_decisions')).rows);
    assert.doesNotMatch(persisted, /secret synthetic|DEMO-ID|DEMO-CUSTOM|معلومة عامة/);
    const columns = (await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='aigas_fw_decisions'")).rows.map(column => column.column_name);
    assert.ok(!columns.some(column => /text|prompt|output|content/.test(column)));

    const beforeFailure = (await db.query('SELECT count(*)::int AS count FROM aigas_fw_decisions')).rows[0].count;
    await db.query('ALTER TABLE aigas_fw_decisions ADD CONSTRAINT synthetic_failure CHECK (false) NOT VALID');
    await assert.rejects(operate(owner, tenant, 'evaluate', { text: 'معلومة عامة' }));
    assert.equal((await db.query('SELECT count(*)::int AS count FROM aigas_fw_decisions')).rows[0].count, beforeFailure);
  } finally { await db.end(); }
});
