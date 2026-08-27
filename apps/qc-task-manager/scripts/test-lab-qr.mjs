// Offline decode verification for laboratory sample QR codes (PROMPT 48).
//
// Acceptance: "Generated SVGs decode (verify with an offline decoder in a
// test) to the exact identifier" — here the SVG emitted by labQrSvg is
// rasterized from its own module path and decoded with jsQR (pure-JS offline
// decoder, devDependency only). Also covers: payload shape, anchor
// derivation, CSP-safety of the SVG (no style attribute), and the /lab/search
// scan resolver against a temp database (exact match + employee scope).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import jsQR from 'jsqr';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-qr-'));
const dbPath = join(tempDir, 'lab-qr.db');

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
function eq(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

/** Rasterize the labQrSvg output (1 subpath per dark module) and decode it. */
function decodeSvg(svg) {
  const viewBox = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!viewBox) throw new Error('no viewBox in svg');
  const size = Number(viewBox[1]);
  const dark = new Set();
  for (const m of svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    dark.add(`${Number(m[1])},${Number(m[2])}`);
  }
  const scale = 8;
  const px = size * scale;
  const data = new Uint8ClampedArray(px * px * 4);
  for (let y = 0; y < px; y += 1) {
    for (let x = 0; x < px; x += 1) {
      const on = dark.has(`${Math.floor(x / scale)},${Math.floor(y / scale)}`);
      const i = (y * px + x) * 4;
      data[i] = on ? 0 : 255;
      data[i + 1] = on ? 0 : 255;
      data[i + 2] = on ? 0 : 255;
      data[i + 3] = 255;
    }
  }
  const res = jsQR(data, px, px);
  return res ? res.data : null;
}

let db;

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });

  const { labQrPayload, labQrSvg, labSampleAnchor } = await import('../src/lib/lab/qrcodes.ts');
  const { resolveLabScan, normalizeScannedIdentifier } = await import('../src/lib/lab/scan.ts');

  // ── 1. Offline decode: exact round-trip of identifier + URL payloads ──
  console.log('\n■ QR offline decode (jsQR)');
  const identifiers = [
    'LAB-TEST-00081-S03',
    'LAB-TEST-00081-S01',
    'LAB-TEST-00123-S20',
    'LAB-TEST-00081',
  ];
  const origin = 'https://qc.example-brightai.live';
  for (const identifier of identifiers) {
    const anchor = /-S\d+$/.test(identifier) ? `#${labSampleAnchor(identifier, 3)}` : '';
    const payload = labQrPayload(identifier, `${origin}/lab/tests/81${anchor}`);
    const svg = labQrSvg(payload, `QR: ${identifier}`);
    eq(decodeSvg(svg), payload, `decode round-trip ${identifier}`);
    ok(!svg.includes('style='), `${identifier}: svg has no inline style attribute (CSP-safe)`);
    ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), `${identifier}: svg is self-contained inline XML`);
    ok(!svg.includes('<image') && !svg.includes('xlink:href'), `${identifier}: no external asset references (self-drawn path only)`);
  }
  // Longest realistic payload: identifier + longest URL variant.
  const longPayload = labQrPayload('LAB-TEST-99999-S20', `${origin}/lab/tests/99999#sample-S20`);
  eq(decodeSvg(labQrSvg(longPayload, 'QR: long')), longPayload, 'decode round-trip longest payload');

  // ── 2. Payload + anchor helpers ──
  console.log('\n■ payload + anchor helpers');
  eq(labQrPayload('A', 'https://x/y'), 'A\nhttps://x/y', 'payload = identifier + newline + URL');
  eq(labSampleAnchor('LAB-TEST-00081-S03', 1), 'sample-S03', 'anchor from identifier suffix');
  eq(labSampleAnchor(null, 3), 'sample-S03', 'anchor falls back to padded sample_no');
  eq(labSampleAnchor('LAB-TEST-00081-S7', 1), 'sample-S07', 'anchor zero-pads single digits');
  eq(labSampleAnchor(undefined, 12), 'sample-S12', 'anchor pads to two digits from sample_no');

  // ── 3. Scan resolver (temp DB, employee record-scope) ──
  console.log('\n■ scan resolver');
  const { getDb } = await import('../src/lib/db.ts');
  db = getDb();
  const employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);
  const outsiderId = Number(
    db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (\'qr-outsider\', ?, ?, \'employee\')').run('x', 'QR Outsider').lastInsertRowid,
  );
  const testId = Number(
    db.prepare(
      `INSERT INTO lab_test_records (test_number, test_type, sample_count, status, tested_by, created_by)
       VALUES ('LAB-TEST-00081', 'air', 3, 'SUBMITTED', ?, ?)`,
    ).run(employeeId, employeeId).lastInsertRowid,
  );
  db.prepare(
    'INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier) VALUES (?, 3, ?)',
  ).run(testId, 'LAB-TEST-00081-S03');

  eq(normalizeScannedIdentifier('LAB-TEST-00081-S03'), 'LAB-TEST-00081-S03', 'normalize: bare identifier');
  eq(
    normalizeScannedIdentifier(`LAB-TEST-00081-S03\n${origin}/lab/tests/81#sample-S03`),
    'LAB-TEST-00081-S03',
    'normalize: full QR payload extracts identifier',
  );
  eq(
    normalizeScannedIdentifier(`${origin}/lab/tests/81#sample-S03 LAB-TEST-00081-S03`),
    'LAB-TEST-00081-S03',
    'normalize: URL-first scan extracts identifier',
  );
  eq(normalizeScannedIdentifier('  lab-test-00081 '), 'LAB-TEST-00081', 'normalize: trims + uppercases');
  eq(normalizeScannedIdentifier(''), '', 'normalize: empty stays empty');

  const hit = resolveLabScan('LAB-TEST-00081-S03', { role: 'employee', userId: employeeId });
  ok(hit !== null, 'resolver: own sample resolves');
  eq(hit?.href, `/lab/tests/${testId}#sample-S03`, 'resolver: sample href points at anchored row');

  const testHit = resolveLabScan('LAB-TEST-00081', { role: 'employee', userId: employeeId });
  eq(testHit?.href, `/lab/tests/${testId}`, 'resolver: bare test number resolves to test');

  const payloadHit = resolveLabScan(
    `LAB-TEST-00081-S03\n${origin}/lab/tests/${testId}#sample-S03`,
    { role: 'employee', userId: employeeId },
  );
  eq(payloadHit?.href, `/lab/tests/${testId}#sample-S03`, 'resolver: full QR payload resolves');

  eq(
    resolveLabScan('LAB-TEST-00081-S03', { role: 'employee', userId: outsiderId }),
    null,
    'resolver: employee outside scope gets null (non-discovery)',
  );
  eq(
    resolveLabScan('LAB-TEST-99998-S03', { role: 'manager', userId: outsiderId }),
    null,
    'resolver: unknown identifier resolves to null',
  );
  ok(
    resolveLabScan('LAB-TEST-00081-S03', { role: 'manager', userId: outsiderId }) !== null,
    'resolver: supervisor+ roles resolve any record (lab-wide read scope)',
  );
  eq(resolveLabScan('', { role: 'manager', userId: employeeId }), null, 'resolver: empty input null');
  eq(resolveScansNothing('LAB-TEST-99999-S01', employeeId), null, 'resolver: nonexistent sample null');

  function resolveScansNothing(v, uid) {
    return resolveLabScan(v, { role: 'employee', userId: uid });
  }
} catch (err) {
  failed += 1;
  failures.push(`suite crashed: ${err?.stack ?? err}`);
  console.error(err);
} finally {
  try {
    if (db) db.close();
  } catch {}
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`\n◉ lab-qr: ${passed} passed / ${failed} failed`);
if (failed > 0) {
  console.error(failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
