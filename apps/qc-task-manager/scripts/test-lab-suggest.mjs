// Unit + database-backed checks for the /lab/search suggestion feature.
//
//   1. Debouncer: rapid calls within one pause window collapse into a single
//      invocation (the combobox never fires more than one request per pause),
//      plus flush/cancel semantics.
//   2. Prefix matching: buildLabSearchQueries emits an anchored q% pattern on
//      identifier columns (test number, sample identifier, document/product/
//      equipment code, retest number) — parameterized, escapeLike-escaped.
//   3. Service RBAC: suggestLabSearch reuses the full-search employee record
//      scope — foreign records are never suggested (404-style non-discovery),
//      LIMIT 5 per entity, minimum query length enforced.
//   4. Endpoint: GET /api/lab/search-suggest returns 401 JSON for anonymous
//      callers, an empty group list for too-short queries, and respects the
//      employee record scope for authenticated ones.
//
// Runs in its own process with a throwaway temp database (pattern of
// test-lab-security.mjs) — nothing in the repo is ever touched.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-suggest-'));
const dbPath = join(tempDir, 'lab-suggest.db');

// The DB singleton path is captured when src/lib/db.ts is first imported, so
// the env must point at the throwaway database BEFORE any src import below.
process.env.QC_DATABASE_PATH = dbPath;
process.env.QC_DB_PATH = '';
process.env.QC_SEED_LAB_EQUIPMENT = '0';

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // ── 1. Debouncer ──
  console.log('\n■ Debouncer — one request per pause window');
  {
    // The exact module shipped to the browser (public/scripts/…) — the unit
    // suite tests the shipped debounce implementation, not a copy.
    const { createDebouncer, LAB_SUGGEST_DEBOUNCE_MS } = await import('../public/scripts/lab-search-suggest.js');
    ok(LAB_SUGGEST_DEBOUNCE_MS >= 150, `debounce window is >= 150ms (${LAB_SUGGEST_DEBOUNCE_MS}ms)`);

    let calls = 0;
    let lastArg = '';
    const d = createDebouncer((q) => {
      calls += 1;
      lastArg = q;
    }, 40);

    // Rapid typing: 5 keystrokes inside one window → 1 invocation, latest arg.
    d.call('LA');
    await sleep(10);
    d.call('LAB');
    await sleep(10);
    d.call('LAB-');
    await sleep(10);
    d.call('LAB-T');
    await sleep(10);
    d.call('LAB-TE');
    ok(calls === 0, 'no invocation fires while typing continues');
    await sleep(60);
    ok(calls === 1, `exactly one invocation per pause window (got ${calls})`);
    ok(lastArg === 'LAB-TE', 'invocation carries the most recent argument');

    // A later pause fires again — but only once per window.
    d.call('LAB-TES');
    d.call('LAB-TEST');
    await sleep(60);
    ok(calls === 2, `second pause window fires exactly once more (got ${calls})`);

    // flush fires immediately with the pending args.
    d.call('LAB-TEST-9');
    d.flush();
    ok(calls === 3 && lastArg === 'LAB-TEST-9', 'flush fires the pending invocation immediately');

    // cancel drops the pending invocation.
    d.call('LAB-TEST-99');
    d.cancel();
    await sleep(60);
    ok(calls === 3, 'cancel drops the pending invocation');
  }

  // ── 2. Prefix patterns in the query builder ──
  console.log('\n■ Prefix matching — anchored q% on identifier columns');
  {
    const search = await import('../src/lib/lab/search.ts');
    const built = search.buildLabSearchQueries(
      { q: 'LAB-9', entity: 'all', page: 1, per_page: 25 },
      { role: 'supervisor', userId: 1 },
    );
    ok(built.combinedParams.includes('LAB-9%'), 'prefix pattern q% is a bound parameter');
    ok(!built.combinedSql.includes("'LAB-9"), 'no user text is spliced into SQL');
    ok(built.subqueries.tests.sql.includes('t.test_number LIKE'), 'tests subquery matches the test_number identifier');
    for (const [entity, col] of [
      ['tests', 't.test_number'],
      ['samples', 's.sample_identifier'],
      ['products', 'p.code'],
      ['equipment', 'e.code'],
      ['sops', 'd.code'],
      ['wis', 'd.code'],
      ['retests', 'r.retest_number'],
    ]) {
      ok(built.subqueries[entity].sql.includes(col), `${entity} subquery still filters on ${col}`);
    }
    // Wildcard injection stays escaped in both patterns.
    const evil = await import('../src/lib/lab/search.ts').then((s) =>
      s.buildLabSearchQueries({ q: "%_'\\", entity: 'tests', page: 1, per_page: 25 }, { role: 'employee', userId: 1 }),
    );
    ok(evil.combinedParams.includes("%\\%\\_'\\\\%"), 'escapeLike escapes wildcards in the contains pattern');
    ok(evil.combinedParams.includes("\\%\\_'\\\\%"), 'escapeLike escapes wildcards in the prefix pattern too');
  }

  // ── 3. + 4. Database-backed service & endpoint checks ──
  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '', QC_SEED_LAB_EQUIPMENT: '0' },
    stdio: 'ignore',
  });

  const { getDb } = await import('../src/lib/db.ts');
  const { searchLab, suggestLabSearch } = await import('../src/lib/lab/search.ts');
  const endpoint = await import('../src/pages/api/lab/search-suggest.ts');
  const { createSession, COOKIE_NAME } = await import('../src/lib/auth.ts');

  const db = getDb();
  const employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);
  const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);

  // Deterministic records: own (employee) + foreign (supervisor).
  const insertTest = db.prepare(`
    INSERT INTO lab_test_records (test_number, test_type, sample_count, status, tested_by, created_by)
    VALUES (?, 'air', 1, 'DRAFT', ?, ?)
  `);
  insertTest.run('ZZQ-OWN-0001', employeeId, employeeId);
  insertTest.run('ZZQ-OWN-0002', employeeId, employeeId);
  insertTest.run('ZZQ-FOREIGN-0001', supervisorId, supervisorId);
  insertTest.run('ZZQ-FOREIGN-0002', supervisorId, supervisorId);
  db.prepare(`INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier) VALUES (?, 1, 'ZZQ-SMP-OWN-1')`)
    .run(Number(db.prepare("SELECT id FROM lab_test_records WHERE test_number = 'ZZQ-OWN-0001'").get().id));
  db.prepare(`INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier) VALUES (?, 1, 'ZZQ-SMP-FOREIGN-1')`)
    .run(Number(db.prepare("SELECT id FROM lab_test_records WHERE test_number = 'ZZQ-FOREIGN-0001'").get().id));
  db.prepare(`
    INSERT INTO lab_documents (code, title, type, status, created_by)
    VALUES ('ZZQ-SOP-01', 'ZZ Prefix SOP', 'SOP', 'APPROVED', ?)
  `).run(supervisorId);

  console.log('\n■ searchLab — prefix matching on identifiers');
  {
    const res = searchLab({ q: 'ZZQ-OWN', entity: 'all', page: 1, per_page: 25 }, { role: 'employee', userId: employeeId });
    ok(res.items.some((i) => i.identifier === 'ZZQ-OWN-0001'), 'prefix query ZZQ-OWN finds the own test by test_number');
    const doc = searchLab({ q: 'ZZQ-SOP', entity: 'sops', page: 1, per_page: 25 }, { role: 'employee', userId: employeeId });
    ok(doc.items.some((i) => i.identifier === 'ZZQ-SOP-01'), 'prefix query finds the document by code');
  }

  console.log('\n■ suggestLabSearch — RBAC scope + limits');
  {
    const own = suggestLabSearch('ZZQ', { role: 'employee', userId: employeeId });
    const ids = own.flatMap((g) => g.items.map((i) => i.identifier));
    ok(ids.includes('ZZQ-OWN-0001') && ids.includes('ZZQ-OWN-0002'), 'employee suggestions include their own tests');
    ok(!ids.includes('ZZQ-FOREIGN-0001') && !ids.includes('ZZQ-FOREIGN-0002'), 'foreign tests are never suggested (non-discovery)');
    ok(!ids.includes('ZZQ-SMP-FOREIGN-1'), 'foreign samples are never suggested');
    ok(ids.includes('ZZQ-SMP-OWN-1'), 'own sample is suggested via the sample identifier');

    const sup = suggestLabSearch('ZZQ-FOREIGN', { role: 'supervisor', userId: supervisorId });
    const supIds = sup.flatMap((g) => g.items.map((i) => i.identifier));
    ok(supIds.some((i) => i.startsWith('ZZQ-FOREIGN')), 'supervisor (broad scope) sees the foreign records');

    ok(suggestLabSearch('Z', { role: 'employee', userId: employeeId }).length === 0, 'below-minimum query returns no groups');
    ok(suggestLabSearch('   ', { role: 'employee', userId: employeeId }).length === 0, 'blank query returns no groups');

    // LIMIT 5 per entity: seed 7 own tests sharing a prefix.
    for (let i = 3; i <= 9; i++) insertTest.run(`ZZQ-OWN-000${i}`, employeeId, employeeId);
    const capped = suggestLabSearch('ZZQ-OWN', { role: 'employee', userId: employeeId });
    const testsGroup = capped.find((g) => g.entity === 'tests');
    ok(testsGroup !== undefined && testsGroup.items.length === 5, `tests group capped at 5 suggestions (got ${testsGroup?.items.length})`);
  }

  console.log('\n■ GET /api/lab/search-suggest — endpoint contract');
  {
    const fakeContext = (token, q) => ({
      url: new URL(`https://qc.local/api/lab/search-suggest?q=${encodeURIComponent(q)}`),
      request: new Request(`https://qc.local/api/lab/search-suggest?q=${encodeURIComponent(q)}`, {
        headers: token ? { cookie: `${COOKIE_NAME}=${token}` } : {},
      }),
      cookies: { get: (name) => (token && name === COOKIE_NAME ? { value: token } : undefined) },
    });

    const anon = await endpoint.GET(fakeContext(null, 'ZZQ'));
    ok(anon instanceof Response && anon.status === 401, 'anonymous caller gets 401 JSON');
    ok(anon.headers.get('content-type').includes('application/json'), '401 body is JSON');

    const employeeUser = db.prepare('SELECT * FROM users WHERE id = ?').get(employeeId);
    const token = createSession(employeeUser);
    const ownRes = await endpoint.GET(fakeContext(token, 'ZZQ'));
    ok(ownRes.status === 200, 'authenticated employee gets 200');
    const payload = await ownRes.json();
    ok(payload.ok === true && Array.isArray(payload.groups), 'response shape { ok, groups }');
    const ids = payload.groups.flatMap((g) => g.items.map((i) => i.identifier));
    ok(!ids.some((i) => i.startsWith('ZZQ-FOREIGN')), 'endpoint never suggests records outside the employee scope');
    ok(ids.some((i) => i.startsWith('ZZQ-OWN')), 'endpoint suggests in-scope records');
    ok(ownRes.headers.get('cache-control') === 'no-store', 'suggestions are not cached');

    const short = await endpoint.GET(fakeContext(token, 'Z'));
    const shortPayload = await short.json();
    ok(short.status === 200 && shortPayload.groups.length === 0, 'too-short query returns 200 with empty groups');
  }

  console.log(`\n✅ ${passed} passed, ${failed} failed (lab suggest)`);
  if (failed > 0) {
    console.error('\nFailures:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ lab suggest test crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    /* temp cleanup is best-effort */
  }
}
