// Evidence-only benchmark for one SQLite QC instance. It never opens the
// configured application database: every run migrates and destroys a fresh
// database beneath the operating-system temporary directory.
import Database from 'better-sqlite3';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { runMigrations } from '../src/lib/migrations.ts';

const appDir = resolve(new URL('..', import.meta.url).pathname);
const profileArg = process.argv.find((arg) => arg.startsWith('--profile='))?.split('=')[1] ?? 'large';
const runsArg = Number(process.argv.find((arg) => arg.startsWith('--runs='))?.split('=')[1] ?? 9);
const outputDir = process.env.QC_PERF_OUTPUT_DIR ?? resolve(appDir, '../../download/qa');
const profiles = {
  ci: { name: 'ci', tasks: 250, tests: 125, samplesPerTest: 12, equipment: 32, documents: 48, auditEvents: 500, changeRequests: 120 },
  large: { name: 'large', tasks: 10_000, tests: 5_000, samplesPerTest: 12, equipment: 250, documents: 500, auditEvents: 10_000, changeRequests: 2_000 },
};
const profile = profiles[profileArg];
if (!profile) throw new Error(`Unknown profile "${profileArg}". Use ci or large.`);
if (!Number.isInteger(runsArg) || runsArg < 3 || runsArg > 99) throw new Error('--runs must be an integer from 3 to 99.');

const tempRoot = mkdtempSync(join(tmpdir(), 'brightai-qc-performance-'));
const dbPath = join(tempRoot, 'benchmark.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

function percentile(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
}

function measure(fn) {
  const started = process.hrtime.bigint();
  fn();
  return Number(process.hrtime.bigint() - started) / 1e6;
}

function isoDay(offset) {
  const date = new Date(2026, 7, 28 + offset);
  return date.toISOString().slice(0, 10);
}

function isoTime(offset) {
  return `${isoDay(offset)}T12:00:00.000Z`;
}

function seed() {
  runMigrations(db, { migrationsDir: join(appDir, 'db/migrations'), backup: false });
  const users = db.prepare('INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks) VALUES (?, ?, ?, ?, ?, ?)');
  users.run('perf-admin', 'fixture', 'Performance Admin', 'admin', 'QC', 1);
  users.run('perf-manager', 'fixture', 'Performance Manager', 'manager', 'QC', 1);
  users.run('perf-employee', 'fixture', 'Performance Employee', 'employee', 'QC', 0);
  const adminId = 1;
  const managerId = 2;
  const employeeId = 3;

  const insertTask = db.prepare(`INSERT INTO tasks (title, description, department, status, priority, progress_percent, created_by, assigned_to, due_date, started_at, completed_at, risk_level, finding_classification, created_at, updated_at, sla_status, sla_started_at, sla_due_at)
    VALUES (?, ?, 'QC', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertActivity = db.prepare('INSERT INTO task_activity_log (task_id, user_id, action, note, created_at) VALUES (?, ?, ?, ?, ?)');
  db.transaction(() => {
    for (let i = 1; i <= profile.tasks; i += 1) {
      const status = i % 5 === 0 ? 'completed' : i % 7 === 0 ? 'on_hold' : i % 2 === 0 ? 'in_progress' : 'not_started';
      const created = isoTime(-(i % 365));
      insertTask.run(`Performance task ${i} batch-${i % 97}`, 'Disposable benchmark fixture', status, ['low', 'medium', 'high', 'urgent'][i % 4], status === 'completed' ? 100 : i % 100, managerId, i % 3 ? employeeId : managerId, isoDay((i % 60) - 30), created, status === 'completed' ? isoTime(-(i % 180)) : null, ['low', 'medium', 'high', 'critical'][i % 4], ['minor', 'major', 'critical'][i % 3], created, created, i % 9 === 0 ? 'BREACHED' : 'NORMAL', created, isoTime((i % 60) - 30));
      if (i <= profile.auditEvents) insertActivity.run(i, i % 2 ? employeeId : managerId, 'updated', 'Performance audit event', created);
    }
  })();

  const product = db.prepare('INSERT INTO lab_products (name, code, description, connector_type, created_by) VALUES (?, ?, ?, ?, ?)');
  const equipment = db.prepare('INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, calibration_status_raw, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const calibration = db.prepare('INSERT INTO lab_equipment_calibration (equipment_id, last_calibrated_at, calibration_due_at, provider, certificate_reference, result, next_due_at, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const maintenance = db.prepare('INSERT INTO lab_equipment_maintenance (equipment_id, maintenance_date, issue, maintenance_type, technician_vendor, status, completed_date, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  db.transaction(() => {
    for (let i = 1; i <= profile.equipment; i += 1) {
      equipment.run(`Performance equipment ${i}`, `PERF-EQ-${String(i).padStart(4, '0')}`, `Zone ${i % 8}`, 'ACTIVE', `SN-${i}`, 'YES', managerId, isoTime(-i), isoTime(-i));
      calibration.run(i, isoDay(-180), isoDay((i % 90) - 30), 'Fixture Lab', `CAL-${i}`, 'PASS', isoDay((i % 90) - 30), managerId, isoTime(-i));
      maintenance.run(i, isoDay(-90), 'Routine fixture maintenance', 'Preventive', 'Fixture Vendor', i % 4 ? 'COMPLETED' : 'OPEN', i % 4 ? isoDay(-89) : null, managerId, isoTime(-i));
    }
    for (let i = 1; i <= 100; i += 1) product.run(`Performance product ${i}`, `PERF-P-${i}`, 'Disposable benchmark product', 'Threaded', managerId);
  })();

  const document = db.prepare('INSERT INTO lab_documents (code, title, type, status, owner_id, created_by, effective_date, review_due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const version = db.prepare('INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  db.transaction(() => {
    for (let i = 1; i <= profile.documents; i += 1) {
      document.run(`PERF-${i}`, `Performance ${i % 2 ? 'SOP' : 'WI'} ${i}`, i % 2 ? 'SOP' : 'WI', 'APPROVED', managerId, managerId, isoDay(-180), isoDay((i % 90) - 20), isoTime(-i), isoTime(-i));
      version.run(i, 1, '# Disposable benchmark document', 'Initial fixture', managerId, 'APPROVED', isoTime(-i));
      version.run(i, 2, '# Disposable benchmark document revision', 'Revision fixture', managerId, 'APPROVED', isoTime(-i + 1));
      db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(i * 2, i);
    }
  })();

  const test = db.prepare(`INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number, sampling_area, sample_count, final_result, status, tested_by, reviewed_by, approved_by, submitted_at, reviewed_at, approved_at, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const sample = db.prepare('INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, part_name, result, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const labAudit = db.prepare('INSERT INTO qc_audit_log (entity_type, entity_id, actor_id, action, note, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  db.transaction(() => {
    for (let i = 1; i <= profile.tests; i += 1) {
      const created = isoTime(-(i % 365));
      test.run(`PERF-TEST-${String(i).padStart(6, '0')}`, i % 2 ? 'air' : 'vacuum', ((i - 1) % 100) + 1, ((i - 1) % profile.equipment) + 1, `LOT-${i % 250}`, `AREA-${i % 12}`, profile.samplesPerTest, ['PASS', 'FAIL', 'HOLD'][i % 3], 'APPROVED', employeeId, managerId, managerId, created, created, created, employeeId, created, created);
      for (let s = 1; s <= profile.samplesPerTest; s += 1) sample.run(i, s, `PERF-${i}-S${s}`, `Part ${s}`, ['PASS', 'FAIL', 'HOLD'][(i + s) % 3], created, created);
      labAudit.run('LAB_TEST', i, i % 2 ? employeeId : managerId, 'APPROVAL', 'Performance audit event', created);
    }
  })();

  const change = db.prepare('INSERT INTO lab_change_requests (entity_type, operation, entity_id, proposed_snapshot_json, status, requested_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  db.transaction(() => {
    for (let i = 1; i <= profile.changeRequests; i += 1) change.run('EQUIPMENT', 'UPDATE', ((i - 1) % profile.equipment) + 1, '{"fixture":true}', i % 3 ? 'PENDING' : 'APPROVED', employeeId, isoTime(-i));
  })();
}

const statements = {
  dashboard: [
    `SELECT COUNT(*) FROM tasks`,
    `SELECT status, COUNT(*) FROM tasks GROUP BY status`,
    `SELECT t.id, t.title FROM tasks t WHERE t.due_date < date('now') AND t.status NOT IN ('completed','cancelled') ORDER BY t.due_date LIMIT 10`,
  ],
  'employee-tasks': [`SELECT id, title, status, priority, due_date FROM tasks WHERE assigned_to = 3 ORDER BY updated_at DESC, id DESC LIMIT 50`],
  'task-search': [`SELECT id, title, status, priority FROM tasks WHERE title LIKE ? ESCAPE '\\' OR reference_number LIKE ? ESCAPE '\\' ORDER BY updated_at DESC LIMIT 50`, `SELECT COUNT(*) FROM tasks WHERE title LIKE ? ESCAPE '\\' OR reference_number LIKE ? ESCAPE '\\'`],
  'lab-home': [`SELECT status, COUNT(*) FROM lab_test_records GROUP BY status`, `SELECT e.id, e.code FROM lab_equipment e WHERE e.is_archived = 0 ORDER BY e.updated_at DESC LIMIT 25`, `SELECT id, code, title FROM lab_documents WHERE status = 'APPROVED' ORDER BY updated_at DESC LIMIT 20`],
  'lab-search': [`SELECT test_number, lot_number FROM lab_test_records WHERE test_number LIKE ? ESCAPE '\\' OR lot_number LIKE ? ESCAPE '\\' ORDER BY updated_at DESC LIMIT 50`, `SELECT COUNT(*) FROM lab_test_records WHERE test_number LIKE ? ESCAPE '\\' OR lot_number LIKE ? ESCAPE '\\'`],
  'tests-register': [`SELECT t.id, t.test_number, t.status, t.final_result, p.name, e.code FROM lab_test_records t LEFT JOIN lab_products p ON p.id=t.product_id LEFT JOIN lab_equipment e ON e.id=t.equipment_id ORDER BY t.created_at DESC, t.id DESC LIMIT 50`, `SELECT COUNT(*) FROM lab_test_records`],
  equipment: [`SELECT e.id, e.code, e.name, MAX(c.calibration_due_at) AS due FROM lab_equipment e LEFT JOIN lab_equipment_calibration c ON c.equipment_id=e.id WHERE e.is_archived=0 GROUP BY e.id ORDER BY e.updated_at DESC LIMIT 50`],
  documents: [`SELECT d.id, d.code, d.title, d.status, v.version FROM lab_documents d LEFT JOIN lab_document_versions v ON v.id=d.current_version_id WHERE d.type IN ('SOP','WI') ORDER BY d.updated_at DESC, d.id DESC LIMIT 50`, `SELECT COUNT(*) FROM lab_documents WHERE type IN ('SOP','WI')`],
  'change-requests': [`SELECT id, entity_type, status, created_at FROM lab_change_requests WHERE status = 'PENDING' ORDER BY created_at ASC, id ASC LIMIT 50`],
  audit: [`SELECT entity_type, entity_id, actor_id, action, created_at FROM qc_audit_log WHERE entity_type LIKE 'LAB_%' ORDER BY created_at DESC, id DESC LIMIT 100`, `SELECT COUNT(*) FROM qc_audit_log WHERE entity_type LIKE 'LAB_%'`],
  reports: [`SELECT t.test_number, t.status, t.final_result, p.code, e.code FROM lab_test_records t LEFT JOIN lab_products p ON p.id=t.product_id LEFT JOIN lab_equipment e ON e.id=t.equipment_id WHERE t.created_at >= ? ORDER BY t.created_at DESC`],
};

function paramsFor(id, sql) {
  if (!sql.includes('?')) return [];
  if (id === 'task-search') return ['%batch-42%', '%batch-42%'];
  if (id === 'lab-search') return ['%PERF-TEST-0001%', '%PERF-TEST-0001%'];
  if (id === 'reports') return [isoTime(-365)];
  return [];
}

function executeScenario(id) {
  for (const sql of statements[id]) db.prepare(sql).all(...paramsFor(id, sql));
}

try {
  seed();
  const scenarios = Object.keys(statements).map((id) => {
    executeScenario(id); // warm SQLite page cache; warmup is intentionally excluded from statistics.
    const durations = Array.from({ length: runsArg }, () => measure(() => executeScenario(id))).sort((a, b) => a - b);
    return { id, runs: runsArg, duration_ms: { p50: Number(percentile(durations, 0.5).toFixed(3)), p95: Number(percentile(durations, 0.95).toFixed(3)), max: Number(durations.at(-1).toFixed(3)) }, query_count: statements[id].length };
  });
  const slowest = [...scenarios].sort((a, b) => b.duration_ms.p95 - a.duration_ms.p95).slice(0, 3);
  const explain_query_plan = slowest.flatMap((scenario) => statements[scenario.id].map((sql) => ({ scenario: scenario.id, sql, plan: db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...paramsFor(scenario.id, sql)).map((row) => row.detail) })));
  const integrity = { integrity_check: db.pragma('integrity_check', { simple: true }), foreign_key_violations: db.pragma('foreign_key_check').length };
  const result = { generated_at: new Date().toISOString(), database: { kind: 'disposable-single-instance-sqlite', path: 'redacted-temporary' }, profile: { ...profile, samples: profile.tests * profile.samplesPerTest }, runs: runsArg, scenarios, explain_query_plan, integrity, indexes_added: [] };
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'qc-performance.json'), `${JSON.stringify(result, null, 2)}\n`);
  const table = scenarios.map((s) => `| ${s.id} | ${s.duration_ms.p50} | ${s.duration_ms.p95} | ${s.duration_ms.max} | ${s.query_count} |`).join('\n');
  writeFileSync(join(outputDir, 'qc-performance.md'), `# QC SQLite performance benchmark\n\nProfile: \`${profile.name}\` · disposable single-instance SQLite · ${runsArg} measured runs after warmup.\n\n| Scenario | p50 ms | p95 ms | max ms | queries |\n| --- | ---: | ---: | ---: | ---: |\n${table}\n\nNo regulatory or arbitrary pass/fail threshold is applied. Query plans below are captured for the three highest p95 scenarios to support evidence-led follow-up.\n\n${explain_query_plan.map((item) => `## ${item.scenario}\n\n\`\`\`sql\n${item.sql}\n\`\`\`\n\n${item.plan.map((line) => `- ${line}`).join('\n')}`).join('\n\n')}\n\nIntegrity check: \`${integrity.integrity_check}\`; foreign-key violations: ${integrity.foreign_key_violations}.\n`);
  console.log(`QC performance benchmark written to ${outputDir}`);
} finally {
  db.close();
  rmSync(tempRoot, { recursive: true, force: true });
}
