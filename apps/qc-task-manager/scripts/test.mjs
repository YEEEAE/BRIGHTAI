// `pnpm test` — fast, server-less checks for QC Task Manager.
//
// Two layers:
//   1. Structure compliance — every file/folder the spec requires exists.
//   2. Unit smoke — Zod validation behavior, task-policy rules, CSV escaping,
//      and a real backup round-trip on a temp database.
//
// Run via the loader so the TypeScript libs import cleanly:
//   node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test.mjs
//
// The heavy regression suites are the E2E scripts (e2e-dashboard.mjs,
// e2e-delete-request.mjs) which need a live server — see the README.

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import {
  BACKUP_FILE_PATTERN,
  backupTimestamp,
  createBackup,
  getBackupStatus,
  listBackups,
  verifyBackup,
  restoreBackup,
} from '../src/lib/backup.ts';
import {
  getNextScheduledBackupAt,
  getRiyadhDateKey,
  shouldRunBackupCatchup,
  startBackupScheduler,
  stopBackupScheduler,
} from '../src/lib/backup-scheduler.ts';
import {
  parseFormData,
  taskCreateInputSchema,
  commentSchema,
  userCreateSchema,
  loginInputSchema,
  deleteReviewSchema,
  savedFilterSchema,
} from '../src/lib/validation.ts';
import {
  isTaskReadOnly,
  canTransitionStatus,
  requiresBlockerNote,
  isEmployeeEditableField,
  isEmployeeLockedField,
  MAX_UPLOAD_BYTES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_RECURRENCES,
  isAllowedExtension,
  isEvidenceExtension,
  isRecurrence,
  EVIDENCE_EXTENSIONS,
  EVIDENCE_EXT_MIME,
  EVIDENCE_SIGNATURES,
  EVIDENCE_EXTENSIONS_HINT,
  isRiskLevel,
  isFindingClassification,
  normalizeOptionalMetadata,
} from '../src/lib/task-policy.ts';
import { nextDueDate, shouldCreateNextOccurrence } from '../src/lib/recurrence.ts';
import { isOverdue, localDateStr } from '../src/lib/format.ts';
import { dueSoonEnd, isDueSoon } from '../src/lib/sla/index.ts';
import { canTransitionStatus as workflowCanTransition } from '../src/lib/workflows/index.ts';
import { normalizeAiSuggestion } from '../src/lib/ai/index.ts';
import { normalizeFindingText, isFinding, isRisk } from '../src/lib/findings/index.ts';
import { normalizeCapaAction, requiresCorrectiveAction } from '../src/lib/capa/index.ts';
import {
  PERMISSIONS,
  canEditTask,
  canEditLockedField,
  isFieldEditableForRole,
} from '../src/lib/permissions.ts';
import {
  canViewLab,
  canCreateLabTest,
  canReviewLabTest,
  canApproveLabTest,
  canVoidLabTest,
  canCreateLabProduct,
  canEditLabProduct,
  canCreateLabTemplate,
  canApproveLabTemplate,
  canCreateLabEquipment,
  canRecordLabEquipmentMaintenance,
  canCreateLabCalibration,
  canCreateLabDocument,
  canReviewLabDocument,
  canApproveLabDocument,
  canArchiveLabDocument,
  canAcknowledgeLabDocument,
  canCreateLabRetest,
  canViewLabReports,
  canExportLabData,
  canViewLabDataQuality,
  canViewLabManagementDashboard,
  canUseLabAiAssist,
  canEditLabTestRecord,
  canSubmitLabTestRecord,
  canReviewLabTestRecord,
  canApproveLabTestRecord,
  canEditLabDocumentRecord,
  canReviewLabDocumentRecord,
  canApproveLabDocumentRecord,
} from '../src/lib/permissions.ts';
import { validateDependencies } from '../src/lib/tasks.ts';
import { validateEvidenceFile, validateUploadedFile } from '../src/lib/taskUpdates.ts';
import { csvField, tasksToCsv } from '../src/lib/export.ts';
import {
  parseTaskSearchFilters,
  filtersToQuery,
  hasSearchFilters,
  buildSearchWhere,
  escapeLike,
  savedFilterHref,
  NO_SEARCH_FILTERS,
} from '../src/lib/taskSearch.ts';
import { searchRowsToCsv } from '../src/lib/searchExport.ts';
import { buildTaskPdf } from '../src/lib/pdf.ts';
import { canEditChecklistStructure } from '../src/lib/permissions.ts';

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── tiny harness ──
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
function section(title) {
  console.log(`\n■ ${title}`);
}

// ── 1. Structure compliance (spec tree) ──
section('Structure compliance');
const requiredPaths = [
  'db/schema.sql',
  'db/seed.sql',
  'db/backups/.gitkeep',
  'docs',
  'public',
  'src/middleware.ts',
  'src/layouts',
  'src/components',
  'src/types',
  'src/pages/login.astro',
  'src/pages/index.astro',
  'src/pages/dashboard.astro',
  'src/pages/manager',
  'src/pages/supervisor',
  'src/pages/employee',
  'src/pages/admin',
  'src/pages/admin/settings/index.astro',
  'src/pages/api/admin/backup.ts',
  'scripts/e2e-backup.mjs',
  'src/pages/tasks',
  'src/pages/notifications.astro',
  'src/pages/api',
  'src/lib/db.ts',
  'src/lib/auth.ts',
  'src/lib/permissions.ts',
  'src/lib/activity.ts',
  'src/lib/notifications.ts',
  'src/lib/task-policy.ts',
  'src/lib/validation.ts',
  'src/lib/sla/index.ts',
  'src/lib/workflows/index.ts',
  'src/lib/audit/index.ts',
  'src/lib/ai/index.ts',
  'src/lib/findings/index.ts',
  'src/lib/capa/index.ts',
  'src/lib/backup.ts',
  'src/lib/export.ts',
  'astro.config.mjs',
  'package.json',
  'tsconfig.json',
  'README.md',
  'docs/RESTORE.md',
];
for (const p of requiredPaths) {
  ok(existsSync(resolve(APP_DIR, p)), `exists: ${p}`);
}

const architectureGuard = spawnSync(process.execPath, [resolve(APP_DIR, 'scripts/architecture-guard.mjs')], {
  cwd: APP_DIR,
  encoding: 'utf8',
});
ok(
  architectureGuard.status === 0,
  `architecture guard: passes${architectureGuard.status === 0 ? '' : `\n${architectureGuard.stdout}${architectureGuard.stderr}`}`,
);

// ── 2. Validation (Zod) ──
section('Validation (src/lib/validation.ts)');

// QC checklist + metadata policy
ok(isRiskLevel('critical') && !isRiskLevel('unknown'), 'qc metadata: risk levels are constrained');
ok(isFindingClassification('major') && !isFindingClassification('invalid'), 'qc metadata: finding classifications are constrained');
ok(normalizeOptionalMetadata('  WO-42  ') === 'WO-42', 'qc metadata: optional values trim');
ok(normalizeOptionalMetadata('   ') === null, 'qc metadata: blank values normalize to null');
ok(normalizeOptionalMetadata('x'.repeat(201)) === undefined, 'qc metadata: values over max length reject');
ok(canEditChecklistStructure({ id: 7, role: 'supervisor' }, { created_by: 7, assigned_to: 9 }), 'checklist structure: supervisor can edit owned task');
ok(!canEditChecklistStructure({ id: 7, role: 'supervisor' }, { created_by: 8, assigned_to: 9 }), 'checklist structure: supervisor cannot edit unrelated task');
ok(canEditChecklistStructure({ id: 7, role: 'manager' }, { created_by: 8, assigned_to: 9 }), 'checklist structure: manager can edit any task');

function form(entries) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) f.append(k, String(v));
  }
  return f;
}

// task create
let r = parseFormData(taskCreateInputSchema, form({ title: '  Calibrate gauges  ', priority: 'high', assigned_to: '', due_date: '' }));
ok(r.ok && r.data.title === 'Calibrate gauges', 'task create: trims title');
ok(r.ok && r.data.priority === 'high', 'task create: parses priority');
ok(r.ok && r.data.assigned_to === null && r.data.due_date === null, 'task create: empty optional → null');

r = parseFormData(taskCreateInputSchema, form({ title: '   ' }));
ok(!r.ok && r.error === 'Title is required.', `task create: empty title → "${r.error}"`);

r = parseFormData(taskCreateInputSchema, form({ title: 'x'.repeat(201) }));
ok(!r.ok && r.error === 'Title must be 200 characters or fewer.', 'task create: title max 200');

r = parseFormData(taskCreateInputSchema, form({ title: 't', priority: 'urgent' }));
ok(r.ok && r.data.priority === 'urgent', 'task create: urgent priority accepted');
r = parseFormData(taskCreateInputSchema, form({ title: 't', priority: 'critical' }));
ok(!r.ok && r.error === 'Invalid priority value.', 'task create: bad priority');

// department / recurrence / recurrence end date
r = parseFormData(taskCreateInputSchema, form({ title: 't' }));
ok(r.ok && r.data.department === 'QC', 'task create: missing department defaults to QC');
ok(r.ok && r.data.recurrence === 'none', 'task create: missing recurrence defaults to none');
ok(r.ok && r.data.recurrence_end_date === null, 'task create: missing recurrence end date → null');

r = parseFormData(taskCreateInputSchema, form({ title: 't', department: '  Lab  ', recurrence: 'weekly', recurrence_end_date: '2026-12-31' }));
ok(r.ok && r.data.department === 'Lab', 'task create: trims department');
ok(r.ok && r.data.recurrence === 'weekly', 'task create: weekly recurrence accepted');
ok(r.ok && r.data.recurrence_end_date === '2026-12-31', 'task create: recurrence end date accepted');

r = parseFormData(taskCreateInputSchema, form({ title: 't', recurrence: 'yearly' }));
ok(!r.ok && r.error === 'Invalid recurrence value.', 'task create: bad recurrence rejected');

r = parseFormData(taskCreateInputSchema, form({ title: 't', recurrence_end_date: '31/12/2026' }));
ok(!r.ok && r.error === 'Recurrence end date must be a valid date (YYYY-MM-DD).', 'task create: bad recurrence end date');

r = parseFormData(taskCreateInputSchema, form({ title: 't', department: 'X'.repeat(51) }));
ok(!r.ok && r.error === 'Department must be 50 characters or fewer.', 'task create: department max 50');

// checklist + dependencies (repeated form keys → arrays)
const multiForm = new FormData();
multiForm.append('title', 't');
multiForm.append('checklist', ' Prep sample  ');
multiForm.append('checklist', '  Run analysis');
multiForm.append('checklist', '   ');
multiForm.append('dependencies', '7');
multiForm.append('dependencies', '9');
r = parseFormData(taskCreateInputSchema, multiForm);
ok(r.ok && r.data.checklist.length === 2, 'task create: checklist trims + drops empty rows');
ok(r.ok && r.data.checklist[0] === 'Prep sample' && r.data.checklist[1] === 'Run analysis', 'task create: checklist order kept');
ok(r.ok && r.data.dependencies.length === 2 && r.data.dependencies[0] === 7, 'task create: dependencies parsed to numbers');

const tooManyForm = new FormData();
tooManyForm.append('title', 't');
for (let i = 0; i < 31; i += 1) tooManyForm.append('checklist', `item ${i}`);
r = parseFormData(taskCreateInputSchema, tooManyForm);
ok(!r.ok && /at most 30 checklist items/.test(r.error), 'task create: checklist capped at 30');

// Regression: a SINGLE checklist/dependency item must stay an array (a scalar
// would be dropped by the preprocess and the item would silently vanish).
const singleItemForm = new FormData();
singleItemForm.append('title', 't');
singleItemForm.append('checklist', 'Only item');
singleItemForm.append('dependencies', '5');
r = parseFormData(taskCreateInputSchema, singleItemForm);
ok(
  r.ok && r.data.checklist.length === 1 && r.data.checklist[0] === 'Only item',
  'task create: single checklist item stays an array',
);
ok(r.ok && r.data.dependencies.length === 1 && r.data.dependencies[0] === 5, 'task create: single dependency stays an array');

r = parseFormData(taskCreateInputSchema, form({ title: 't', due_date: '11/08/2026' }));
ok(!r.ok && r.error === 'Due date must be a valid date (YYYY-MM-DD).', 'task create: bad due date');

r = parseFormData(taskCreateInputSchema, form({ title: 't', assigned_to: 'not-a-number' }));
ok(!r.ok && r.error === 'Invalid assignee.', `task create: non-numeric assignee (got "${r.error}")`);

// default priority is medium
r = parseFormData(taskCreateInputSchema, form({ title: 't' }));
ok(r.ok && r.data.priority === 'medium', 'task create: missing priority defaults to medium');

// comment
r = parseFormData(commentSchema, form({ comment: '  Looks good  ' }));
ok(r.ok && r.data.comment === 'Looks good', 'comment: trims');
r = parseFormData(commentSchema, form({ comment: '' }));
ok(!r.ok && r.error === 'Comment cannot be empty.', 'comment: empty rejected');
r = parseFormData(commentSchema, form({ comment: 'x'.repeat(2001) }));
ok(!r.ok && r.error === 'Comment must be 2000 characters or fewer.', 'comment: max 2000');

// user create
r = userCreateSchema.safeParse({
  username: 'bad username!',
  fullName: 'Sara',
  password: 'longenough1',
  role: 'employee',
  canCreateTasks: true,
});
ok(!r.success && r.error.issues[0].message === 'Username may only contain letters, numbers, _ . and -.', 'user create: username charset');
r = userCreateSchema.safeParse({
  username: 'sara',
  fullName: 'Sara',
  password: 'short',
  role: 'employee',
  canCreateTasks: false,
});
ok(!r.success && r.error.issues[0].message === 'Password must be at least 8 characters.', 'user create: password min 8');
r = userCreateSchema.safeParse({
  username: 'sara',
  fullName: 'Sara',
  password: 'longenough1',
  role: 'employee',
  canCreateTasks: false,
});
ok(r.success, 'user create: valid input passes');

// login
r = parseFormData(loginInputSchema, form({ username: '', password: '' }));
ok(!r.ok && r.error === 'Username is required.', 'login: empty username');

// delete review (approve/reject + optional rejection reason)
r = parseFormData(deleteReviewSchema, form({ action: 'reject', request_id: '12', review_note: '  Duplicate task  ' }));
ok(r.ok && r.data.action === 'reject' && r.data.request_id === 12 && r.data.review_note === 'Duplicate task', 'delete review: parses action/request + trims review note');
r = parseFormData(deleteReviewSchema, form({ action: 'approve', request_id: '3' }));
ok(r.ok && r.data.action === 'approve' && r.data.request_id === 3 && r.data.review_note === null, 'delete review: approve without a note');
r = parseFormData(deleteReviewSchema, form({ action: 'approve', request_id: 'abc' }));
ok(!r.ok && r.error === 'Invalid request.', 'delete review: non-numeric request id rejected');
r = parseFormData(deleteReviewSchema, form({ action: 'bogus', request_id: '1' }));
ok(!r.ok && r.error === 'Invalid action.', 'delete review: bogus action rejected');
r = parseFormData(deleteReviewSchema, form({ action: 'reject', request_id: '1', review_note: 'x'.repeat(1001) }));
ok(!r.ok && /Review note must be/.test(r.error), 'delete review: review note capped');

// ── 3. Task policy ──
section('Task policy (src/lib/task-policy.ts)');
ok(isTaskReadOnly('completed') === true, 'completed is read-only');
ok(isTaskReadOnly('cancelled') === true, 'cancelled is read-only (terminal)');
ok(isTaskReadOnly('in_progress') === false, 'in_progress is not read-only');

// Status transitions (spec):
//   not_started → in_progress / on_hold(with blocker) / in_progress ↔ on_hold
ok(canTransitionStatus('not_started', 'in_progress') === true, 'not_started → in_progress allowed');
ok(canTransitionStatus('not_started', 'on_hold') === true, 'not_started → on_hold allowed (blocker required)');
ok(canTransitionStatus('in_progress', 'on_hold') === true, 'in_progress → on_hold allowed (blocker required)');
ok(canTransitionStatus('on_hold', 'in_progress') === true, 'on_hold → in_progress allowed (work resumes)');
ok(canTransitionStatus('in_progress', 'not_started') === false, 'in_progress → not_started rejected (no going back)');
ok(canTransitionStatus('on_hold', 'not_started') === false, 'on_hold → not_started rejected (no going back)');
ok(canTransitionStatus('completed', 'in_progress') === false, 'completed → active rejected (reopen is admin/manager-only)');
ok(canTransitionStatus('cancelled', 'in_progress') === false, 'cancelled → active rejected');
ok(canTransitionStatus('not_started', 'completed') === false, 'completed only via closure flow');
ok(canTransitionStatus('in_progress', 'cancelled') === false, 'cancelled only via the manager/admin cancel flow');
ok(canTransitionStatus('on_hold', 'on_hold') === true, 'same-status no-op allowed');

// Blocker-note requirement for on_hold (spec).
ok(requiresBlockerNote('not_started', 'on_hold') === true, 'not_started → on_hold requires a blocker note');
ok(requiresBlockerNote('in_progress', 'on_hold') === true, 'in_progress → on_hold requires a blocker note');
ok(requiresBlockerNote('on_hold', 'in_progress') === false, 'on_hold → in_progress does not require a blocker note');
ok(requiresBlockerNote('not_started', 'in_progress') === false, 'not_started → in_progress does not require a blocker note');
ok(requiresBlockerNote('on_hold', 'on_hold') === false, 'same-status on_hold no-op needs no blocker');

ok(isEmployeeEditableField('status') && isEmployeeEditableField('progress_percent') && isEmployeeEditableField('blocker_note'), 'employee editable fields');
ok(isEmployeeLockedField('title') && isEmployeeLockedField('assigned_to'), 'locked fields');
ok(!isEmployeeEditableField('title'), 'title is not employee-editable');
ok(MAX_UPLOAD_BYTES === 10 * 1024 * 1024, 'upload limit 10 MB');
ok(TASK_STATUSES.length === 5 && TASK_STATUSES.includes('cancelled'), 'five statuses incl. cancelled');
ok(TASK_PRIORITIES.includes('urgent'), 'urgent is a valid priority');
ok(TASK_RECURRENCES.length === 4 && isRecurrence('daily') && isRecurrence('monthly') && !isRecurrence('yearly'), 'recurrence enum');
ok(isAllowedExtension('pdf') && !isAllowedExtension('exe'), 'extension allowlist');

section('Architecture domain boundaries');
ok(workflowCanTransition('not_started', 'in_progress'), 'workflow delegates status transitions to task policy');
ok(isDueSoon('2026-08-14', 'in_progress', '2026-08-11'), 'sla: due-soon window is canonical');
ok(!isDueSoon('2026-08-15', 'in_progress', '2026-08-11'), 'sla: dates after the window are not due-soon');
ok(dueSoonEnd('2026-08-11') === '2026-08-14', 'sla: due-soon end is deterministic');
ok(normalizeAiSuggestion({ kind: 'summary', text: '  advisory  ' })?.text === 'advisory', 'ai: suggestions are normalized only');
ok(normalizeAiSuggestion({ kind: 'summary', text: '' }) === null, 'ai: blank suggestions are rejected');
ok(isFinding('major') && !isFinding('invalid') && isRisk('critical'), 'findings: canonical classification and risk policy');
ok(normalizeFindingText('  deviation  ') === 'deviation', 'findings: text is normalized');
ok(normalizeCapaAction('  retrain operator  ') === 'retrain operator', 'capa: action is normalized');
ok(requiresCorrectiveAction('critical') && !requiresCorrectiveAction('observation'), 'capa: critical findings require corrective action');

// Completion-evidence allowlist (spec: PDF, PNG, JPG, JPEG, XLSX, DOCX only).
section('Evidence policy (completion wizard allowlist)');
ok(
  JSON.stringify(EVIDENCE_EXTENSIONS) === JSON.stringify(['pdf', 'png', 'jpg', 'jpeg', 'xlsx', 'docx']),
  'evidence: exactly pdf/png/jpg/jpeg/xlsx/docx',
);
ok(EVIDENCE_EXTENSIONS_HINT === 'pdf, png, jpg, jpeg, xlsx, docx', 'evidence: hint lists the six types');
ok(
  EVIDENCE_EXTENSIONS.every((e) => isEvidenceExtension(e)) && !isEvidenceExtension('txt') && !isEvidenceExtension('exe'),
  'evidence: isEvidenceExtension matches the allowlist',
);
ok(
  EVIDENCE_EXT_MIME.pdf.join() === 'application/pdf' &&
    EVIDENCE_EXT_MIME.png.join() === 'image/png' &&
    EVIDENCE_EXT_MIME.jpg.join() === 'image/jpeg' &&
    EVIDENCE_EXT_MIME.jpeg.join() === 'image/jpeg' &&
    EVIDENCE_EXT_MIME.xlsx.join() === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
    EVIDENCE_EXT_MIME.docx.join() === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'evidence: MIME map matches the six types',
);
ok(
  JSON.stringify(EVIDENCE_SIGNATURES.pdf) === JSON.stringify([0x25, 0x50, 0x44, 0x46, 0x2d]) &&
    JSON.stringify(EVIDENCE_SIGNATURES.png) === JSON.stringify([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) &&
    JSON.stringify(EVIDENCE_SIGNATURES.jpg) === JSON.stringify([0xff, 0xd8, 0xff]) &&
    JSON.stringify(EVIDENCE_SIGNATURES.jpeg) === JSON.stringify([0xff, 0xd8, 0xff]),
  'evidence: magic bytes for pdf/png/jpg/jpeg',
);
ok(
  JSON.stringify(EVIDENCE_SIGNATURES.xlsx) === JSON.stringify([0x50, 0x4b, 0x03, 0x04]) &&
    JSON.stringify(EVIDENCE_SIGNATURES.docx) === JSON.stringify([0x50, 0x4b, 0x03, 0x04]),
  'evidence: xlsx/docx are ZIP containers (PK.. magic)',
);

// ── 4b. Recurrence scheduling (pure) ──
section('Recurrence (src/lib/recurrence.ts)');
ok(nextDueDate('none', '2026-08-11') === null, 'recurrence: none → no next date');
ok(nextDueDate('daily', '2026-08-11') === '2026-08-12', 'recurrence: daily +1 day');
ok(nextDueDate('weekly', '2026-08-11') === '2026-08-18', 'recurrence: weekly +7 days');
ok(nextDueDate('monthly', '2026-08-11') === '2026-09-11', 'recurrence: monthly +1 month');
ok(nextDueDate('monthly', '2026-01-31') === '2026-02-28', 'recurrence: monthly clamps Jan 31 → Feb 28');
ok(nextDueDate('monthly', '2024-01-31') === '2024-02-29', 'recurrence: monthly leap year Feb 29');
ok(nextDueDate('monthly', '2026-12-31') === '2027-01-31', 'recurrence: monthly year rollover');
ok(nextDueDate('weekly', null) === null, 'recurrence: missing due date → null');
ok(nextDueDate('weekly', 'not-a-date') === null, 'recurrence: invalid due date → null');

ok(shouldCreateNextOccurrence({ recurrence: 'none', dueDate: '2026-08-11', recurrenceEndDate: null }) === false, 'recurrence: none never creates next');
ok(shouldCreateNextOccurrence({ recurrence: 'weekly', dueDate: '2026-08-11', recurrenceEndDate: null }) === true, 'recurrence: open-ended series allowed');
ok(shouldCreateNextOccurrence({ recurrence: 'weekly', dueDate: '2026-08-11', recurrenceEndDate: '2026-08-18' }) === true, 'recurrence: next date within end date');
ok(shouldCreateNextOccurrence({ recurrence: 'weekly', dueDate: '2026-08-11', recurrenceEndDate: '2026-08-17' }) === false, 'recurrence: next date past end date → stop');
ok(shouldCreateNextOccurrence({ recurrence: 'weekly', dueDate: '2026-08-11', recurrenceEndDate: '2026-08-18' }) === true, 'recurrence: end date is inclusive');

// ── 4c. Explicit acceptance-unit coverage ──
section('Acceptance unit coverage');

// Permission checks and employee field whitelist.
ok(PERMISSIONS.canViewDashboard('employee') === false, 'permissions: employee dashboard denied');
ok(PERMISSIONS.canViewDashboard('manager') === true, 'permissions: manager dashboard allowed');
ok(PERMISSIONS.canManageUsers('admin') === true && PERMISSIONS.canManageUsers('manager') === false, 'permissions: user management is admin-only');
ok(canEditLockedField('supervisor') && !canEditLockedField('employee'), 'permissions: supervisor can edit locked fields, employee cannot');
ok(isFieldEditableForRole('employee', 'status') && !isFieldEditableForRole('employee', 'title'), 'permissions: employee field whitelist is enforced');
ok(canEditTask({ id: 7, role: 'employee' }, { status: 'in_progress', created_by: 1, assigned_to: 7 }), 'permissions: employee can edit assigned active task');
ok(!canEditTask({ id: 7, role: 'employee' }, { status: 'in_progress', created_by: 1, assigned_to: 8 }), 'permissions: employee cannot edit unrelated task');
ok(!canEditTask({ id: 7, role: 'employee' }, { status: 'completed', created_by: 1, assigned_to: 7 }), 'permissions: completed task is read-only');

// Overdue calculation is strict (before today) and excludes terminal states.
const today = new Date();
const todayKey = localDateStr(today);
const yesterdayKey = localDateStr(new Date(today.getTime() - 86_400_000));
const tomorrowKey = localDateStr(new Date(today.getTime() + 86_400_000));
ok(isOverdue(yesterdayKey, 'in_progress') === true, 'overdue: active task due yesterday is overdue');
ok(isOverdue(todayKey, 'in_progress') === false && isOverdue(tomorrowKey, 'in_progress') === false, 'overdue: today and future are not overdue');
ok(isOverdue(yesterdayKey, 'completed') === false && isOverdue(yesterdayKey, 'cancelled') === false, 'overdue: terminal tasks are never overdue');

// Dependency validation covers self/cap guards without needing a live server.
ok(validateDependencies([], null).ok === true, 'dependencies: empty list is valid');
ok(validateDependencies(Array.from({ length: 21 }, (_, i) => i + 1), null).ok === false, 'dependencies: maximum count enforced');
ok(validateDependencies([9], 9).ok === false, 'dependencies: self-dependency rejected');

// Upload validation checks extension, MIME, size, and evidence magic bytes.
const validPdf = new File([Buffer.from('%PDF-1.7\n')], 'evidence.pdf', { type: 'application/pdf' });
const validUpload = validateUploadedFile(validPdf);
ok(validUpload.ok && validUpload.fileName === 'evidence.pdf', 'uploads: valid PDF passes extension + MIME validation');
ok(!validateUploadedFile(new File([Buffer.from('MZ')], 'malware.exe', { type: 'application/octet-stream' })).ok, 'uploads: executable extension rejected');
ok(!validateUploadedFile(new File([Buffer.from('text')], 'report.pdf', { type: 'text/plain' })).ok, 'uploads: mismatched MIME rejected');
ok(validateEvidenceFile(validPdf, Buffer.from('%PDF-1.7\n')).ok, 'uploads: evidence PDF magic bytes accepted');
ok(!validateEvidenceFile(validPdf, Buffer.from('not a PDF')).ok, 'uploads: fake PDF magic bytes rejected');
ok(!validateUploadedFile(new File([Buffer.from('MZ\x90\x00')], 'renamed.pdf', { type: 'application/pdf' }), Buffer.from('MZ\x90\x00')).ok, 'uploads: executable magic bytes rejected even with safe extension');
ok(!validateUploadedFile(new File([Buffer.from('not a PDF')], 'fake.pdf', { type: 'application/pdf' }), Buffer.from('not a PDF')).ok, 'uploads: generic attachment magic bytes enforced');

// ── 4. CSV export (pure) ──
section('CSV export (src/lib/export.ts)');
ok(csvField('plain') === 'plain', 'csv: plain value unquoted');
ok(csvField('a,b') === '"a,b"', 'csv: comma quoted');
ok(csvField('say "hi"') === '"say ""hi"""', 'csv: quotes doubled');
ok(csvField(null) === '', 'csv: null → empty');
ok(csvField(42) === '42', 'csv: number');

const csv = tasksToCsv([
  { id: 1, title: 'Calibrate, gauges', description: null, status: 'in_progress', priority: 'high', progress_percent: 40, assignee: 'Sara', created_by_name: 'Manager', due_date: null, created_at: '2026-08-01 10:00:00', completed_at: null, blocker_note: null },
]);
ok(csv.startsWith('\uFEFF'), 'csv: UTF-8 BOM');
ok(csv.includes('ID,Title,Description,Status,Priority,Progress (%),Assignee,Created by,Due date,Created at,Completed at,Blocker note'), 'csv: headers');
ok(csv.includes('"Calibrate, gauges"'), 'csv: title escaped');
ok(csv.endsWith('\r\n'), 'csv: CRLF line ending');

// ── 4b. Advanced search (src/lib/taskSearch.ts) ──
section('Advanced search (src/lib/taskSearch.ts)');
const noopJar = { cookies: { set: () => undefined } };

// Full valid query string → typed filters.
const fullUrl = new URL(
  'http://localhost/search?q=zinc%20test&status=completed&priority=urgent&department=Lab' +
    '&assigned=7&creator=3&due_from=2026-08-01&due_to=2026-08-31&created_from=2026-07-01' +
    '&created_to=2026-07-31&completed_from=2026-08-01&completed_to=2026-08-15' +
    '&overdue=1&has_evidence=1&evidence_skipped=1&recurrence=weekly&deletion=1' +
    '&sort=due_date&dir=asc&page=3&per=50',
);
let f = parseTaskSearchFilters(fullUrl, noopJar);
ok(f.q === 'zinc test', 'search parse: free text trimmed');
ok(f.status === 'completed' && f.priority === 'urgent' && f.department === 'Lab', 'search parse: status/priority/department');
ok(f.assigned_to === 7 && f.created_by === 3, 'search parse: assigned + creator');
ok(f.due_from === '2026-08-01' && f.due_to === '2026-08-31', 'search parse: due range');
ok(f.created_from === '2026-07-01' && f.created_to === '2026-07-31', 'search parse: created range');
ok(f.completed_from === '2026-08-01' && f.completed_to === '2026-08-15', 'search parse: completed range');
ok(f.overdue_only && f.has_evidence && f.evidence_skipped && f.deletion_requested, 'search parse: boolean toggles');
ok(f.recurrence === 'weekly', 'search parse: recurrence');
ok(f.sort === 'due_date' && f.dir === 'asc' && f.page === 3 && f.per_page === 50, 'search parse: sort/dir/page/per');

// Invalid values are dropped + a flash is set (never thrown).
const flashed = [];
const spyJar = { cookies: { set: () => flashed.push('x') } };
const bad = parseTaskSearchFilters(
  new URL('http://localhost/search?status=bogus&priority=nah&due_from=11/08/2026&page=abc&per=999&sort=evil'),
  spyJar,
);
ok(bad.status === null && bad.priority === null && bad.due_from === null, 'search parse: invalid values dropped');
ok(bad.page === 1 && bad.per_page === 25 && bad.sort === 'updated_at' && bad.dir === 'desc', 'search parse: invalid page/per/sort fall back to defaults');
ok(flashed.length >= 2, 'search parse: invalid params flash an error');

// filtersToQuery round-trips through the parser (URL state preservation).
const shaped = { ...NO_SEARCH_FILTERS, q: 'hello world', status: 'in_progress', per_page: 50, sort: 'due_date', dir: 'asc' };
const qs = filtersToQuery(shaped);
ok(qs.includes('status=in_progress') && qs.includes('q=hello+world'), 'filtersToQuery: encodes filters');
const re = parseTaskSearchFilters(new URL(`http://localhost/search${qs}`), noopJar);
ok(re.status === 'in_progress' && re.q === 'hello world' && re.per_page === 50 && re.sort === 'due_date' && re.dir === 'asc', 'filtersToQuery: round-trips through the parser');
ok(parseTaskSearchFilters(new URL('http://localhost/search'), noopJar).page === 1, 'search parse: no page param defaults to 1');

ok(!hasSearchFilters(NO_SEARCH_FILTERS), 'hasSearchFilters: empty state is false');
ok(hasSearchFilters({ ...NO_SEARCH_FILTERS, overdue_only: true }), 'hasSearchFilters: overdue counts');

// LIKE escaping + the parameterized WHERE builder.
ok(escapeLike('50%_done') === '50\\%\\_done', 'escapeLike: escapes wildcards');
const w = buildSearchWhere({ ...NO_SEARCH_FILTERS, q: 'abc', status: 'on_hold', priority: 'high', due_from: '2026-08-01', overdue_only: true, has_evidence: true });
ok(w.sql.includes('t.status = ?') && w.sql.includes('t.priority = ?'), 'buildSearchWhere: conditions present');
ok(w.sql.includes("EXISTS (SELECT 1 FROM task_attachments"), 'buildSearchWhere: has_evidence subquery');
ok(w.params.length >= 6, 'buildSearchWhere: params bound for every condition');
// Injection proof: hostile text lands in PARAMS, never in the SQL text.
const evil = buildSearchWhere({ ...NO_SEARCH_FILTERS, q: "'; DROP TABLE tasks; --", department: 'x\" OR 1=1 --' });
ok(!evil.sql.includes('DROP') && !evil.sql.includes('OR 1=1'), 'buildSearchWhere: user input never interpolated into SQL');
ok(evil.params.includes("%'; DROP TABLE tasks; --%"), 'buildSearchWhere: hostile text bound as a param');

// Saved-filter URL builder.
ok(savedFilterHref('{"status":"completed","priority":"urgent"}') === '/search?status=completed&priority=urgent', 'savedFilterHref: rebuilds the search URL');
ok(savedFilterHref('not-json') === '/search', 'savedFilterHref: malformed JSON falls back safely');

// Saved-filter POST schema.
r = parseFormData(savedFilterSchema, form({ action: 'save', name: '  High priority  ', filter_json: '{"priority":"high"}', next: '/search?priority=high' }));
ok(r.ok && r.data.action === 'save' && r.data.name === 'High priority' && r.data.filter_json === '{"priority":"high"}', 'saved filter: save action trims the name');
r = parseFormData(savedFilterSchema, form({ action: 'delete', filter_id: '5' }));
ok(r.ok && r.data.filter_id === 5 && r.data.name === null, 'saved filter: delete parses the id');
r = parseFormData(savedFilterSchema, form({ action: 'bogus' }));
ok(!r.ok && r.error === 'Invalid action.', 'saved filter: bogus action rejected');
r = parseFormData(savedFilterSchema, form({ action: 'save', name: 'x'.repeat(101) }));
ok(!r.ok && /Saved filter name must be/.test(r.error), 'saved filter: name capped');

// ── 4c. Search exports (CSV row mapping — never BLOBs) ──
section('Search export CSV (src/lib/searchExport.ts)');
const searchRows = [
  {
    id: 1,
    title: 'Calibrate, gauges',
    description: 'fix, "quoted"',
    blocker_note: 'waiting on parts',
    status: 'in_progress',
    priority: 'high',
    progress_percent: 40,
    department: 'Lab',
    recurrence: 'none',
    due_date: '2026-08-01',
    created_at: '2026-08-01 10:00:00',
    completed_at: null,
    updated_at: '2026-08-02 10:00:00',
    assignee: 'Sara',
    creator: 'Manager',
    comments_count: 2,
    evidence_count: 1,
    delete_pending: 0,
    evidence_files: 'report.pdf; shot.png',
    evidence_skipped: 0,
  },
];
const scsv = searchRowsToCsv(searchRows);
ok(scsv.startsWith('\uFEFF'), 'search csv: UTF-8 BOM');
ok(scsv.includes('ID,Title,Description,Status,Priority'), 'search csv: headers');
ok(scsv.includes('"Calibrate, gauges"'), 'search csv: title escaped');
ok(scsv.includes('"fix, ""quoted"""'), 'search csv: description quotes doubled');
ok(scsv.includes('report.pdf; shot.png'), 'search csv: evidence file NAMES only (no BLOB content)');
ok(!scsv.includes('file_data'), 'search csv: never references the BLOB column');
ok(scsv.endsWith('\r\n'), 'search csv: CRLF line ending');

// ── 4d. Task PDF report (pure builder) ──
section('Task PDF report (src/lib/pdf.ts)');
const pdfData = {
  id: 42,
  title: 'Calibrate the gauges',
  description: 'Check calibration equipment',
  department: 'Lab',
  progress_percent: 100,
  status_label: 'Completed',
  priority_label: 'High',
  recurrence_label: 'Weekly',
  assignee: 'Sara',
  creator: 'Manager',
  due_date: '2026-08-01',
  created_at: '2026-08-01 10:00:00',
  updated_at: null,
  started_at: '2026-08-01 10:05:00',
  completed: true,
  completed_at: '2026-08-02 10:00:00',
  completed_by: 'Sara',
  completion_comment: 'All good',
  evidence_files: ['report.pdf'],
  evidence_skipped: false,
  cancelled: false,
  cancelled_at: null,
  cancelled_by: null,
  comments: [{ author: 'Manager', date: '1 Aug 2026', text: 'Please verify' }],
  activity: [{ user: 'Sara', date: '2 Aug 2026', text: 'marked the task completed.' }],
  generated_at: '11 Aug 2026, 12:00',
};
const pdfStr = buildTaskPdf(pdfData).toString('latin1');
ok(pdfStr.startsWith('%PDF-1.4'), 'pdf: header');
ok(pdfStr.includes('Calibrate the gauges'), 'pdf: task title present');
ok(pdfStr.includes('COMPLETION DETAILS') && pdfStr.includes('All good'), 'pdf: completion details + comment');
ok(pdfStr.includes('report.pdf'), 'pdf: evidence file name present');
ok(pdfStr.includes('Please verify'), 'pdf: comments present');
ok(pdfStr.includes('marked the task completed.'), 'pdf: activity history present');
ok(pdfStr.includes('Generated: 11 Aug 2026'), 'pdf: generated date present');
ok((pdfStr.match(/\/Type \/Page\b/g) ?? []).length >= 1, 'pdf: at least one page object');
ok(pdfStr.trimEnd().endsWith('%%EOF'), 'pdf: EOF marker');

// ── 5. Backup round-trip (real files) ──
section('Backup (src/lib/backup.ts)');
ok(backupTimestamp(new Date('2026-08-11T09:34:56.000Z')) === '2026-08-11-123456', 'backup: timestamp uses Riyadh YYYY-MM-DD-HHmmss format');
ok(BACKUP_FILE_PATTERN.test('qc_tasks-2026-08-11-123456.db'), 'backup: filename pattern accepts the required format');
ok(!BACKUP_FILE_PATTERN.test('qc_tasks-20260811-123456789.db'), 'backup: filename pattern rejects legacy compact names');
const tmpDir = mkdtempSync(join(tmpdir(), 'qc-backup-'));
try {
  const srcDb = join(tmpDir, 'source.db');
  const db = new Database(srcDb);
  db.exec("CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name TEXT, checksum TEXT, applied_at TEXT); INSERT INTO schema_migrations VALUES (2, 'test', 'checksum', datetime('now')); CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT); CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT); CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)");
  db.prepare('INSERT INTO users (username) VALUES (?)').run('admin');
  db.prepare('INSERT INTO tasks (title) VALUES (?)').run('task');
  db.prepare('INSERT INTO t (v) VALUES (?)').run('hello');
  db.close();

  const backupDir = join(tmpDir, 'backups');
  const first = await createBackup({ dbPath: srcDb, backupDir, keep: 1, trigger: 'test' });
  ok(existsSync(first.file) && statSync(first.file).size > 0, 'backup: file created with data');
  ok(BACKUP_FILE_PATTERN.test(first.name), 'backup: created file has the required name');
  ok(first.metadata.schemaVersion === 2 && first.metadata.applicationVersion, 'backup: metadata stores schema and application versions');
  ok(first.metadata.checksum.length === 64 && first.metadata.timestamp, 'backup: metadata stores checksum and timestamp');

  const check = new Database(first.file, { readonly: true });
  const row = check.prepare('SELECT v FROM t WHERE id = 1').get();
  check.close();
  ok(row.v === 'hello', 'backup: content intact');
  const verification = await verifyBackup({ file: first.file, metadataFile: first.metadataFile });
  ok(verification.result === 'PASS' && verification.integrityCheck === 'ok' && verification.foreignKeyCheck === 'PASS', 'backup: valid snapshot verifies PASS');

  const restoredDb = join(tmpDir, 'restored.db');
  const restore = await restoreBackup({ productionDbPath: restoredDb, backupFile: first.file, metadataFile: first.metadataFile, confirmation: 'RESTORE QC DATABASE' });
  ok(restore.verification.result === 'PASS' && new Database(restoredDb, { readonly: true }).prepare('SELECT v FROM t').get().v === 'hello', 'backup: verified snapshot restores data');

  const corrupt = join(tmpDir, 'corrupt.db');
  writeFileSync(corrupt, 'not sqlite');
  const corruptResult = await verifyBackup({ file: corrupt });
  ok(corruptResult.result === 'FAIL', 'backup: corrupt snapshot verifies FAIL');
  const missingResult = await verifyBackup({ file: join(tmpDir, 'missing.db') });
  ok(missingResult.result === 'FAIL', 'backup: missing snapshot verifies FAIL');

  const wrongSchema = new Database(first.file);
  wrongSchema.prepare('UPDATE schema_migrations SET version = 99').run();
  wrongSchema.close();
  const wrongSchemaResult = await verifyBackup({ file: first.file, metadataFile: first.metadataFile });
  ok(wrongSchemaResult.result === 'FAIL', 'backup: wrong schema verifies FAIL');
  const productionBeforeFailedRestore = new Database(restoredDb, { readonly: true }).prepare('SELECT v FROM t').get().v;
  let failedRestore = false;
  try { await restoreBackup({ productionDbPath: restoredDb, backupFile: corrupt, confirmation: 'RESTORE QC DATABASE' }); } catch { failedRestore = true; }
  ok(failedRestore && new Database(restoredDb, { readonly: true }).prepare('SELECT v FROM t').get().v === productionBeforeFailedRestore, 'backup: failed restore preserves production database');

  const second = await createBackup({ dbPath: srcDb, backupDir, keep: 1 });
  const remaining = readdirSync(backupDir).filter((f) => f.endsWith('.db'));
  ok(remaining.length === 1, 'backup: retention keeps only the newest');
  ok(second.pruned === 1, `backup: pruned 1 old backup (got ${second.pruned})`);
  ok(statSync(second.file).size > 0, 'backup: second backup valid');
  ok(listBackups(backupDir).length === 1, 'backup: listBackups only returns retained backup files');
  ok(getBackupStatus(backupDir).lastSuccessAt !== null, 'backup: success status is persisted');

  const missingDb = join(tmpDir, 'missing.db');
  let failedBackup = false;
  try {
    await createBackup({ dbPath: missingDb, backupDir, trigger: 'test' });
  } catch {
    failedBackup = true;
  }
  ok(failedBackup, 'backup: missing source fails');
  ok(getBackupStatus(backupDir).lastFailureAt !== null, 'backup: failure status is persisted');

  const retainedDir = join(tmpDir, 'retained-14');
  for (let index = 0; index < 15; index += 1) {
    await createBackup({ dbPath: srcDb, backupDir: retainedDir, keep: 14, trigger: 'test' });
  }
  ok(listBackups(retainedDir).length === 14, 'backup: retention keeps the latest 14 backups');
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

// WAL data must be captured by SQLite's backup API; copying only the main file
// would lose this row while the writer connection is still open.
const walDir = mkdtempSync(join(tmpdir(), 'qc-backup-wal-'));
try {
  const walDbPath = join(walDir, 'source.db');
  const walDb = new Database(walDbPath);
  walDb.pragma('journal_mode = WAL');
  walDb.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)');
  walDb.prepare('INSERT INTO t (v) VALUES (?)').run('wal-value');
  const walBackup = await createBackup({ dbPath: walDbPath, backupDir: join(walDir, 'backups'), trigger: 'test' });
  const walCheck = new Database(walBackup.file, { readonly: true });
  const walRow = walCheck.prepare('SELECT v FROM t WHERE id = 1').get();
  walCheck.close();
  walDb.close();
  ok(walRow.v === 'wal-value', 'backup: WAL-resident data is included');
  ok(!existsSync(`${walBackup.file}-wal`) && !existsSync(`${walBackup.file}-shm`), 'backup: no backup WAL/SHM sidecars are required');
} finally {
  rmSync(walDir, { recursive: true, force: true });
}

section('Backup scheduler');
ok(getRiyadhDateKey(new Date('2026-08-11T09:34:56.000Z')) === '2026-08-11', 'scheduler: Riyadh date key is stable');
ok(getNextScheduledBackupAt(new Date('2026-08-10T22:30:00.000Z')).toISOString() === '2026-08-10T23:00:00.000Z', 'scheduler: next run is 02:00 Riyadh');
ok(shouldRunBackupCatchup({ lastSuccessAt: null }, new Date('2026-08-11T09:34:56.000Z')), 'scheduler: catch-up runs when no success exists');
ok(!shouldRunBackupCatchup({ lastSuccessAt: '2026-08-11T09:00:00.000Z' }, new Date('2026-08-11T09:34:56.000Z')), 'scheduler: catch-up skips after today success');

// A scheduled/catch-up backup must SKIP — not fail — when the database file
// is absent (temp test databases are removed between suites, and a fresh disk
// may boot before the first write). The skip must log a quiet debug line, must
// not record a failure status, and must never surface SQLITE_CANTOPEN noise.
{
  const skipDir = mkdtempSync(join(tmpdir(), 'qc-backup-skip-'));
  try {
    const missingDbPath = join(skipDir, 'missing.db');
    const backupDir = join(skipDir, 'backups');
    // The scheduler is a module singleton; reset it so this check always
    // exercises the catch-up path regardless of prior tests in this process.
    stopBackupScheduler();
    const originalInfo = console.info;
    const infoLines = [];
    console.info = (...args) => infoLines.push(args.map(String).join(' '));
    let stop = null;
    try {
      stop = startBackupScheduler({ dbPath: missingDbPath, backupDir });
    } finally {
      console.info = originalInfo;
    }
    stop?.();
    const info = infoLines.join('\n');
    ok(/skipped \(trigger=scheduled\)/.test(info) && /database file missing/.test(info), 'scheduler: missing DB file logs a skip debug line');
    ok(!/failed/.test(info) && !/unable to open database file/.test(info) && !/SQLITE_CANTOPEN/.test(info), 'scheduler: missing DB file logs no failure and no CANTOPEN');
    const status = getBackupStatus(backupDir);
    ok(status.state === 'never' && status.lastFailureAt === null && status.lastAttemptAt === null && status.lastError === null, 'scheduler: missing DB file records no failure status');
  } finally {
    rmSync(skipDir, { recursive: true, force: true });
  }
}

// ── 6. init-db migrates a legacy (pre-spec) database ──
// Regression for the "SQLITE_ERROR: no such column: recurrence" bug: a
// database created by an OLD schema keeps its old table shapes (schema.sql's
// CREATE TABLE IF NOT EXISTS never touches them), so `pnpm db:init` must run
// the same column migrations as the app boot BEFORE applying schema.sql.
// This runs the REAL CLI as a subprocess against a legacy-shaped DB.
section('init-db migration (legacy DB → spec shape)');
const migDir = mkdtempSync(join(tmpdir(), 'qc-mig-'));
try {
  const legacyPath = join(migDir, 'legacy.db');
  const legacy = new Database(legacyPath);
  legacy.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'QC',
      can_create_tasks INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'not_started',
      priority TEXT NOT NULL DEFAULT 'medium',
      progress_percent INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER NOT NULL,
      assigned_to INTEGER,
      due_date TEXT,
      blocker_note TEXT,
      completed_at TEXT,
      completed_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE task_delete_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      task_title TEXT NOT NULL,
      requested_by INTEGER NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
      VALUES ('admin', 'legacy-hash', 'Legacy Admin', 'admin', 'QC', 1, 1);
    INSERT INTO tasks (title, status, created_by, due_date)
      VALUES ('Legacy task', 'in_progress', 1, '2026-08-01');
    INSERT INTO task_delete_requests (task_id, task_title, requested_by, status)
      VALUES (1, 'Legacy task', 1, 'pending');
  `);
  legacy.close();

  const run = spawnSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: APP_DIR,
    env: { ...process.env, QC_DATABASE_PATH: legacyPath },
    encoding: 'utf8',
  });
  ok(run.status === 0, 'init-db: exits successfully');
  // Migration warnings go to stderr (console.warn); logs to stdout.
  const combined = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  ok(/migrated .* column\(s\)/.test(combined), 'init-db: reports migrated columns');
  ok(/rebuilt legacy task_delete_requests/.test(combined), 'init-db: rebuilds legacy task_delete_requests');
  ok(/users table already has 1 row/.test(combined), 'init-db: keeps existing rows (seed skipped)');

  const check = new Database(legacyPath, { readonly: true });
  const tasksCols = check.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  for (const col of ['recurrence', 'recurrence_end_date', 'parent_recurring_task_id', 'department']) {
    ok(tasksCols.includes(col), `init-db: tasks gains '${col}'`);
  }
  const delReqCols = check.prepare('PRAGMA table_info(task_delete_requests)').all().map((c) => c.name);
  ok(!delReqCols.includes('task_title'), 'init-db: task_delete_requests loses legacy task_title');
  const pending = check.prepare("SELECT task_id, status FROM task_delete_requests WHERE status = 'pending'").get();
  ok(pending && pending.task_id === 1, 'init-db: pending delete request survives the rebuild');
  const idx = check.prepare("SELECT 1 AS one FROM sqlite_master WHERE type = 'index' AND name = 'idx_tasks_recurrence'").get();
  ok(!!idx, 'init-db: idx_tasks_recurrence index created');
  const users = check.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  ok(users === 1, 'init-db: user data preserved (1 row)');
  const tables = check.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((r) => r.name);
  ok(tables.length === 47, `init-db: application + migration metadata tables applied (got ${tables.length})`);
  const migrationVersion = check.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version;
  ok(migrationVersion === 18, 'init-db: schema version recorded as 18');
  const fk = check.prepare('PRAGMA foreign_key_check').all();
  ok(fk.length === 0, 'init-db: no foreign-key violations after migration');
  check.close();

  // Idempotency: a second run must be a no-op (columns already exist).
  const run2 = spawnSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: APP_DIR,
    env: { ...process.env, QC_DATABASE_PATH: legacyPath },
    encoding: 'utf8',
  });
  const combined2 = `${run2.stdout ?? ''}${run2.stderr ?? ''}`;
  ok(run2.status === 0, 'init-db: second run exits successfully');
  ok(!/migrated .* column\(s\)/.test(combined2), 'init-db: second run is a no-op (idempotent)');
} finally {
  rmSync(migDir, { recursive: true, force: true });
}

// ── 7. Seed password policy (production refuses the default password) ──
// The seed path reads ADMIN_DEFAULT_PASSWORD / NODE_ENV at module load
// (DEFAULT_PASSWORD) and at call time (the guards), so these checks run in
// fresh subprocesses with a controlled environment — same pattern as the
// init-db migration checks above. The probes import the REAL runtime entry
// (getDb → migrations → seedUsersIfEmpty) so a production boot is reproduced
// end to end on a temp database. The backup-scheduler timer is unref'ed, so
// the probe processes exit on their own.
section('Seed password policy');
const seedPolicyDir = mkdtempSync(join(tmpdir(), 'qc-seed-policy-'));
const probeFlags = ['--import', '../../scripts/test-ts-loader.mjs', '--experimental-strip-types', '--input-type=module', '-e'];
const probeThrow = `
import { getDb } from './src/lib/db.ts';
try {
  getDb();
  console.log('NO_THROW');
  process.exit(2);
} catch (err) {
  console.log('THREW');
  console.log(err instanceof Error ? err.message : String(err));
  process.exit(0);
}
`;
try {
  // Env profiles: no ADMIN_DEFAULT_PASSWORD, with it, and plain dev (unset
  // NODE_ENV) — each built from the parent env so nothing leaks across probes.
  const envNoPass = { ...process.env, NODE_ENV: 'production' };
  delete envNoPass.ADMIN_DEFAULT_PASSWORD;
  delete envNoPass.SEED_DEMO;
  const envStrong = { ...process.env, NODE_ENV: 'production', ADMIN_DEFAULT_PASSWORD: 'unit-test-strong-password-2026' };
  delete envStrong.SEED_DEMO;
  const envDev = { ...process.env };
  delete envDev.NODE_ENV;
  delete envDev.ADMIN_DEFAULT_PASSWORD;
  delete envDev.SEED_DEMO;

  // (a) Production + no ADMIN_DEFAULT_PASSWORD + fresh DB → boot fails fast.
  const throwRun = spawnSync(process.execPath, [...probeFlags, probeThrow], {
    cwd: APP_DIR,
    env: { ...envNoPass, QC_DATABASE_PATH: join(seedPolicyDir, 'prod-fail.db') },
    encoding: 'utf8',
  });
  const throwOut = `${throwRun.stdout ?? ''}${throwRun.stderr ?? ''}`;
  ok(throwRun.status === 0 && /THREW/.test(throwOut), 'seed: production boot without ADMIN_DEFAULT_PASSWORD fails fast');
  ok(/ADMIN_DEFAULT_PASSWORD/.test(throwOut), 'seed: refusal message names ADMIN_DEFAULT_PASSWORD');

  // (b) Production + ADMIN_DEFAULT_PASSWORD set → fresh DB seeds the
  //     configured password, never the default 'admin123'.
  const probeExpectSeed = `
import { getDb } from './src/lib/db.ts';
import bcrypt from 'bcryptjs';
const db = getDb();
const admin = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('admin');
if (!admin) { console.log('NO_ADMIN'); process.exit(2); }
const configured = process.env.ADMIN_DEFAULT_PASSWORD || '';
const okConfigured = bcrypt.compareSync(configured, admin.password_hash);
const notDefault = !bcrypt.compareSync('admin123', admin.password_hash);
console.log(okConfigured && notDefault ? 'SEEDED_CONFIGURED' : 'WRONG_HASH');
process.exit(okConfigured && notDefault ? 0 : 1);
`;
  const seedRun = spawnSync(process.execPath, [...probeFlags, probeExpectSeed], {
    cwd: APP_DIR,
    env: { ...envStrong, QC_DATABASE_PATH: join(seedPolicyDir, 'prod-seed.db') },
    encoding: 'utf8',
  });
  const seedOut = `${seedRun.stdout ?? ''}${seedRun.stderr ?? ''}`;
  ok(seedRun.status === 0 && /SEEDED_CONFIGURED/.test(seedOut), 'seed: production with ADMIN_DEFAULT_PASSWORD seeds the configured password');

  // (c) Same policy through the db:init CLI on a fresh temp database.
  const cliFail = spawnSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: APP_DIR,
    env: { ...envNoPass, QC_DATABASE_PATH: join(seedPolicyDir, 'cli-fail.db') },
    encoding: 'utf8',
  });
  const cliFailOut = `${cliFail.stdout ?? ''}${cliFail.stderr ?? ''}`;
  ok(cliFail.status !== 0, 'init-db: production without ADMIN_DEFAULT_PASSWORD refuses (non-zero exit)');
  ok(/ADMIN_DEFAULT_PASSWORD/.test(cliFailOut), 'init-db: refusal message names ADMIN_DEFAULT_PASSWORD');

  const cliSeedPath = join(seedPolicyDir, 'cli-seed.db');
  const cliSeed = spawnSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: APP_DIR,
    env: { ...envStrong, QC_DATABASE_PATH: cliSeedPath },
    encoding: 'utf8',
  });
  ok(cliSeed.status === 0, 'init-db: production with ADMIN_DEFAULT_PASSWORD seeds successfully');
  if (cliSeed.status === 0 && existsSync(cliSeedPath)) {
    const cliCheck = new Database(cliSeedPath, { readonly: true });
    const admin = cliCheck.prepare('SELECT password_hash FROM users WHERE username = ?').get('admin');
    ok(!!admin && bcrypt.compareSync('unit-test-strong-password-2026', admin.password_hash), 'init-db: seeded admin uses the configured password');
    ok(!!admin && !bcrypt.compareSync('admin123', admin.password_hash), 'init-db: seeded admin does NOT use admin123');
    cliCheck.close();
  } else {
    ok(false, 'init-db: seeded admin hash is verifiable');
  }

  // (d) A dev-seeded database (admin123) promoted to production is refused:
  //     accounts already exist, so the seed is skipped, but the keep-guard
  //     still blocks boot until ADMIN_DEFAULT_PASSWORD is set and accounts
  //     are reset.
  const promotedPath = join(seedPolicyDir, 'promoted.db');
  const devSeed = spawnSync(process.execPath, [...probeFlags, `
import { getDb } from './src/lib/db.ts';
getDb();
console.log('DEV_SEEDED');
process.exit(0);
`], {
    cwd: APP_DIR,
    env: { ...envDev, QC_DATABASE_PATH: promotedPath },
    encoding: 'utf8',
  });
  ok(devSeed.status === 0 && /DEV_SEEDED/.test(`${devSeed.stdout ?? ''}${devSeed.stderr ?? ''}`), 'seed: dev-mode boot seeds accounts (warning path unchanged)');
  const promotedRun = spawnSync(process.execPath, [...probeFlags, probeThrow], {
    cwd: APP_DIR,
    env: { ...envNoPass, QC_DATABASE_PATH: promotedPath },
    encoding: 'utf8',
  });
  const promotedOut = `${promotedRun.stdout ?? ''}${promotedRun.stderr ?? ''}`;
  ok(promotedRun.status === 0 && /THREW/.test(promotedOut), 'seed: production boot refuses a dev-seeded database (keeps-guard)');
  ok(/ADMIN_DEFAULT_PASSWORD/.test(promotedOut), 'seed: keeps-guard message names ADMIN_DEFAULT_PASSWORD');
} finally {
  rmSync(seedPolicyDir, { recursive: true, force: true });
}

// ── 8. Laboratory RBAC (PROMPT 03 — contract §6.2 matrix) ──
section('Laboratory RBAC');

const LAB_ROLES = ['admin', 'manager', 'supervisor', 'employee'];

// LAB_VIEW and *_VIEW permissions: every role.
ok(LAB_ROLES.every((role) => canViewLab(role)), 'lab: every role can enter the laboratory');
// Test creation: every role (core lab work).
ok(LAB_ROLES.every((role) => canCreateLabTest(role)), 'lab: every role can create tests');
// Review: supervisor+ (entity-level self-review exclusion tested below).
ok(!canReviewLabTest('employee') && canReviewLabTest('supervisor') && canReviewLabTest('manager') && canReviewLabTest('admin'), 'lab: review is supervisor+');
// Approval: manager+ — supervisor denied by default (D-4).
ok(!canApproveLabTest('employee') && !canApproveLabTest('supervisor') && canApproveLabTest('manager') && canApproveLabTest('admin'), 'lab: test approval is manager+ (D-4 supervisor denied)');
// Void: manager+ only.
ok(!canVoidLabTest('supervisor') && canVoidLabTest('manager') && canVoidLabTest('admin'), 'lab: voiding tests is manager+');
// Products / templates / equipment editing: manager+.
ok(LAB_ROLES.filter((role) => canCreateLabProduct(role)).join() === 'admin,manager', 'lab: product create is manager+');
ok(LAB_ROLES.filter((role) => canEditLabProduct(role)).join() === 'admin,manager', 'lab: product edit is manager+');
ok(LAB_ROLES.filter((role) => canCreateLabTemplate(role)).join() === 'admin,manager', 'lab: template create is manager+');
ok(LAB_ROLES.filter((role) => canApproveLabTemplate(role)).join() === 'admin,manager', 'lab: template approval is manager+');
ok(LAB_ROLES.filter((role) => canCreateLabEquipment(role)).join() === 'admin,manager', 'lab: equipment create is manager+');
ok(LAB_ROLES.filter((role) => canCreateLabCalibration(role)).join() === 'admin,manager', 'lab: calibration create is manager+');
// Maintenance: supervisor+.
ok(!canRecordLabEquipmentMaintenance('employee') && canRecordLabEquipmentMaintenance('supervisor'), 'lab: maintenance recording is supervisor+');
// Documents: create/edit/review supervisor+, approve/archive manager+, acknowledge everyone.
ok(!canCreateLabDocument('employee') && canCreateLabDocument('supervisor'), 'lab: document create is supervisor+');
ok(!canReviewLabDocument('employee') && canReviewLabDocument('supervisor'), 'lab: document review is supervisor+');
ok(LAB_ROLES.filter((role) => canApproveLabDocument(role)).join() === 'admin,manager', 'lab: document approval is manager+');
ok(LAB_ROLES.filter((role) => canArchiveLabDocument(role)).join() === 'admin,manager', 'lab: document archive is manager+');
ok(LAB_ROLES.every((role) => canAcknowledgeLabDocument(role)), 'lab: every role can acknowledge documents');
// Retests: D-5 — supervisor+ create, everyone views.
ok(!canCreateLabRetest('employee') && canCreateLabRetest('supervisor'), 'lab: retest creation is supervisor+ (D-5)');
// Reports / exports / dashboards / data quality: supervisor+.
ok(!canViewLabReports('employee') && canViewLabReports('supervisor'), 'lab: reports are supervisor+');
ok(!canExportLabData('employee') && canExportLabData('supervisor'), 'lab: exports are supervisor+');
ok(!canViewLabDataQuality('employee') && canViewLabDataQuality('supervisor'), 'lab: data quality is supervisor+');
ok(!canViewLabManagementDashboard('employee') && canViewLabManagementDashboard('supervisor'), 'lab: management dashboard is supervisor+');
// AI assist: advisory-only, every role.
ok(LAB_ROLES.every((role) => canUseLabAiAssist(role)), 'lab: AI assist is available to every role (advisory only)');

// Entity-context hard invariants.
const ownTest = { status: 'SUBMITTED', tested_by: 7, reviewed_by: null, created_by: 7 };
const foreignTest = { status: 'SUBMITTED', tested_by: 8, reviewed_by: null, created_by: 8 };
const actor = { id: 7, role: 'admin' };
// #1 — a tester can NEVER review or approve their own test, even as admin.
ok(!canReviewLabTestRecord(actor, ownTest), 'lab: tester cannot review own test (even admin)');
ok(!canApproveLabTestRecord(actor, ownTest), 'lab: tester cannot approve own test (even admin)');
// The reviewer cannot approve what they reviewed.
ok(!canApproveLabTestRecord({ id: 9, role: 'manager' }, { status: 'UNDER_REVIEW', tested_by: 8, reviewed_by: 9, created_by: 8 }), 'lab: reviewer cannot approve own review');
// Legitimate foreign review/approval passes.
ok(canReviewLabTestRecord({ id: 9, role: 'manager' }, foreignTest), 'lab: manager can review a foreign submitted test');
ok(canApproveLabTestRecord({ id: 10, role: 'manager' }, { status: 'UNDER_REVIEW', tested_by: 8, reviewed_by: 9, created_by: 8 }), 'lab: manager can approve a reviewed foreign test');
// D-4: supervisor cannot approve regardless of ownership.
ok(!canApproveLabTestRecord({ id: 11, role: 'supervisor' }, foreignTest), 'lab: supervisor cannot approve tests (D-4)');
// Editing: employee/supervisor limited to own DRAFT/REJECTED; terminal immutable.
ok(canEditLabTestRecord({ id: 7, role: 'employee' }, { status: 'DRAFT', tested_by: 7, reviewed_by: null, created_by: 7 }), 'lab: tester can edit own DRAFT');
ok(!canEditLabTestRecord({ id: 7, role: 'employee' }, { status: 'DRAFT', tested_by: 8, reviewed_by: null, created_by: 8 }), 'lab: cannot edit someone else\'s DRAFT');
ok(!canEditLabTestRecord({ id: 7, role: 'employee' }, { status: 'SUBMITTED', tested_by: 7, reviewed_by: null, created_by: 7 }), 'lab: cannot edit own SUBMITTED test');
ok(canEditLabTestRecord({ id: 7, role: 'employee' }, { status: 'REJECTED', tested_by: 7, reviewed_by: 9, created_by: 7 }), 'lab: tester can rework own REJECTED test');
ok(!canEditLabTestRecord({ id: 1, role: 'admin' }, { status: 'APPROVED', tested_by: 8, reviewed_by: 9, created_by: 8 }), 'lab: APPROVED tests are immutable (even admin)');
ok(!canEditLabTestRecord({ id: 1, role: 'admin' }, { status: 'VOID', tested_by: 8, reviewed_by: 9, created_by: 8 }), 'lab: VOID tests are immutable');
// Submission: own DRAFT/REJECTED only.
ok(canSubmitLabTestRecord({ id: 7, role: 'employee' }, { status: 'DRAFT', tested_by: 7, reviewed_by: null, created_by: 7 }), 'lab: tester can submit own DRAFT');
ok(!canSubmitLabTestRecord({ id: 7, role: 'manager' }, { status: 'DRAFT', tested_by: 8, reviewed_by: null, created_by: 8 }), 'lab: manager cannot submit someone else\'s DRAFT (authority is tested_by, not input)');
// Documents: author cannot review or approve their own version (hard invariant #2).
const ownDoc = { status: 'IN_REVIEW', owner_id: 7, created_by: 7 };
ok(!canReviewLabDocumentRecord({ id: 7, role: 'manager' }, ownDoc), 'lab: author cannot review own document');
ok(!canApproveLabDocumentRecord({ id: 7, role: 'manager' }, ownDoc), 'lab: author cannot approve own document (even manager)');
ok(!canApproveLabDocumentRecord({ id: 7, role: 'admin' }, ownDoc), 'lab: author cannot approve own document (even admin)');
ok(canApproveLabDocumentRecord({ id: 9, role: 'manager' }, { status: 'IN_REVIEW', owner_id: 7, created_by: 7 }), 'lab: manager can approve a foreign reviewed document');
ok(!canApproveLabDocumentRecord({ id: 9, role: 'manager' }, { status: 'DRAFT', owner_id: 7, created_by: 7 }), 'lab: cannot approve a DRAFT document');
ok(canEditLabDocumentRecord({ id: 7, role: 'supervisor' }, { status: 'DRAFT', owner_id: 7, created_by: 7 }), 'lab: supervisor can edit own draft document');
ok(!canEditLabDocumentRecord({ id: 7, role: 'supervisor' }, { status: 'DRAFT', owner_id: 8, created_by: 8 }), 'lab: supervisor cannot edit someone else\'s draft document');
ok(!canEditLabDocumentRecord({ id: 7, role: 'employee' }, { status: 'DRAFT', owner_id: 7, created_by: 7 }), 'lab: employee cannot edit documents');
ok(!canEditLabDocumentRecord({ id: 1, role: 'admin' }, { status: 'ARCHIVED', owner_id: 7, created_by: 7 }), 'lab: ARCHIVED documents are immutable');
ok(!canEditLabDocumentRecord({ id: 1, role: 'admin' }, { status: 'SUPERSEDED', owner_id: 7, created_by: 7 }), 'lab: SUPERSEDED documents are immutable');

// ── summary ──
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
