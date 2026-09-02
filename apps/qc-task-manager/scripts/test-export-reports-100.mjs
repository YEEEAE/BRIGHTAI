// PROMPT 05 acceptance checks for task PDF export remediation.
// Covers the shared Unicode writer, bilingual QC header, pagination, PDF
// accessibility metadata, RBAC/404 contracts, audit logging, direct route
// wiring, and the controlled browser print surface source contract.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-export-reports-100-'));
const dbPath = join(tempDir, 'export-reports.db');

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    console.log(`  ❌ ${label}`);
  }
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  process.env.QC_SEED_LAB_EQUIPMENT = '0';
  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });

  const { getDb } = await import('../src/lib/db.ts');
  const { Action, logActivity } = await import('../src/lib/activity.ts');
  const { canViewTask } = await import('../src/lib/taskDetails.ts');
  const { createTask } = await import('../src/lib/tasks.ts');
  const { buildTaskPdf } = await import('../src/lib/taskPdf.ts');
  const { rowsToPdf } = await import('../src/lib/reporting/writers/pdf.ts');
  const db = getDb();

  const manager = db.prepare("SELECT * FROM users WHERE username = 'manager'").get();
  const supervisor = db.prepare("SELECT * FROM users WHERE username = 'supervisor'").get();
  const employee = db.prepare("SELECT * FROM users WHERE username = 'employee'").get();
  assert(manager && supervisor && employee, 'seeded role fixtures exist');

  console.log('\n■ Unicode PDF writer and task report');
  const taskData = {
    id: 505,
    title: 'فحص جهاز قياس الضغط / Pressure gauge inspection',
    description: 'التحقق من المعايرة قبل الاستخدام.',
    department: 'QC',
    progress_percent: 100,
    status_label: 'Completed',
    priority_label: 'High',
    recurrence_label: 'None',
    assignee: 'المفتش خالد',
    creator: 'Team Supervisor',
    due_date: '2026-09-01',
    created_at: '2026-09-01 10:00:00',
    updated_at: '2026-09-02 10:00:00',
    started_at: '2026-09-01 10:05:00',
    completed: true,
    completed_at: '2026-09-02 10:00:00',
    completed_by: 'المفتش خالد',
    completion_comment: 'تم التحقق — النتائج مطابقة.',
    evidence_files: ['calibration-report.pdf'],
    evidence_skipped: false,
    cancelled: false,
    cancelled_at: null,
    cancelled_by: null,
    comments: [{ author: 'المفتش خالد', date: '2 Sep 2026', text: 'المعدة جاهزة للاستخدام.' }],
    activity: [{ user: 'المفتش خالد', date: '2 Sep 2026', text: 'marked the task completed.' }],
    generated_at: '2 Sep 2026, 12:00',
  };
  const taskPdf = await buildTaskPdf(taskData);
  const taskPdfText = taskPdf.toString('latin1');
  ok(taskPdfText.startsWith('%PDF-1.4'), 'task PDF has PDF header');
  ok(taskPdfText.trimEnd().endsWith('%%EOF'), 'task PDF has EOF marker');
  ok(taskPdfText.includes('/Lang (ar)'), 'task PDF declares Arabic document language');
  ok(taskPdfText.includes('/Direction /R2L'), 'task PDF declares RTL reading direction');
  ok(taskPdfText.includes('/FontFile2') && taskPdfText.includes('/ToUnicode'), 'task PDF embeds a searchable local Unicode font');
  ok(taskPdfText.includes('Pressure gauge inspection') && taskPdfText.includes('calibration-report.pdf'), 'task PDF keeps task/evidence metadata searchable');
  ok(taskPdfText.includes('Task ID: 505') && taskPdfText.includes('E-SIGNATURE BADGE: VERIFIED'), 'task PDF carries bilingual QC/CoA control header metadata');

  const arabicPdf = await rowsToPdf(['الحقل / Field'], [['مختبر الرياض'], ['جهاز قياس الضغط']], { language: 'ar', direction: 'R2L' });
  const arabicText = arabicPdf.toString('latin1');
  ok(arabicText.includes('/Lang (ar)') && arabicText.includes('beginbfchar'), 'Arabic cells use ToUnicode extraction mapping');

  const manyRows = Array.from({ length: 90 }, (_, i) => [`سجل ${i + 1}`, `نتيجة الفحص ${i + 1}`]);
  const pagedPdf = await rowsToPdf(['الاسم / Name', 'النتيجة / Result'], manyRows, { language: 'ar', direction: 'R2L' });
  ok((pagedPdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length >= 2, 'long report preserves multiple PDF pages');

  console.log('\n■ RBAC, 404, and audit event');
  const taskId = createTask({
    title: 'Export authorization fixture',
    description: 'Fixture for export authorization.',
    department: 'QC',
    assignedTo: employee.id,
    priority: 'high',
    dueDate: null,
    recurrence: 'none',
    recurrenceEndDate: null,
    checklist: [],
    dependencies: [],
    createdBy: supervisor.id,
    workflowEnabled: false,
  });
  const target = db.prepare('SELECT assigned_to, created_by FROM tasks WHERE id = ?').get(taskId);
  ok(canViewTask({ id: employee.id, role: 'employee' }, target), 'assigned Inspector can view/export own task');
  ok(canViewTask({ id: supervisor.id, role: 'supervisor' }, target), 'Supervisor can view/export task');
  ok(canViewTask({ id: manager.id, role: 'manager' }, target), 'Manager can view/export task');
  ok(!canViewTask({ id: employee.id + 10000, role: 'employee' }, target), 'unassigned Inspector receives non-discoverable authorization result');

  logActivity({ taskId, userId: employee.id, action: Action.REPORT_EXPORTED, newValue: `task-${taskId}.pdf`, note: 'PDF task report exported' });
  const exportEvent = db.prepare("SELECT action, new_value, note FROM task_activity_log WHERE task_id = ? AND action = 'report_exported'").get(taskId);
  ok(exportEvent?.action === 'report_exported' && exportEvent.new_value === `task-${taskId}.pdf` && exportEvent.note === 'PDF task report exported', 'successful export is recorded in task_activity_log');

  console.log('\n■ Route and print contracts');
  const route = readFileSync(join(appDir, 'src/pages/api/export/tasks/pdf/[id].ts'), 'utf8');
  const taskPdfSource = readFileSync(join(appDir, 'src/lib/taskPdf.ts'), 'utf8');
  const printLayout = readFileSync(join(appDir, 'src/layouts/PrintLayout.astro'), 'utf8');
  const globalCss = readFileSync(join(appDir, 'src/styles/global.css'), 'utf8');
  ok(route.includes('requireApiUser') && route.includes('canViewTask') && route.includes("apiJsonError('Task not found.', 404)"), 'export route keeps authentication, authorization, and generic 404');
  ok(route.includes("application/pdf; charset=utf-8") && route.includes('inline; filename='), 'export route returns UTF-8 PDF inline with filename');
  ok(route.includes('Action.REPORT_EXPORTED') && route.includes('logActivity'), 'export route writes audit event after PDF generation');
  ok(taskPdfSource.includes('Inspector Name') && taskPdfSource.includes('Status:') && taskPdfSource.includes('Priority:') && taskPdfSource.includes('E-SIGNATURE BADGE'), 'task builder defines required control header fields');
  ok(printLayout.includes('@font-face') && printLayout.includes('font-display: swap'), 'print view uses an offline local font with swap');
  ok(globalCss.includes('@media print') && globalCss.includes('action-dialog') && globalCss.includes('table-header-group') && globalCss.includes('break-inside: avoid'), 'global print CSS hides chrome and hardens pagination');

  console.log(`\nEXPORT-REPORTS-100: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed} passed, ${failed} failed)`);
  if (failed > 0) process.exitCode = 1;
} catch (error) {
  console.error(`EXPORT-REPORTS-100: CRASH — ${error.message}`);
  process.exitCode = 1;
} finally {
  try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
}
