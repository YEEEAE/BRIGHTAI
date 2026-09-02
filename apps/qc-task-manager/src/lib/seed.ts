// Startup seeder for QC Task Manager.
//
// Seeds ONE account per role when the `users` table is empty, so the role-based
// home router can be exercised end-to-end on a fresh database:
//   username     role        full name        can_create_tasks
//   admin        admin       Administrator    1
//   manager      manager     Department Manager   1
//   supervisor   supervisor  Team Supervisor  1
//   employee     employee    QC Employee      0
//
// Every account uses ADMIN_DEFAULT_PASSWORD. The local-only fallback is never
// accepted when NODE_ENV=production.
// bcrypt-hashed at runtime. The password is only used on the first boot (seed
// runs when the users table is empty).

import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from './auth';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import type { Role } from './types';

const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
const IS_DEFAULT_PASSWORD = DEFAULT_PASSWORD === 'admin123';

/**
 * Freshly seeded pilot accounts boot with a shared, operator-chosen password —
 * that is exactly the credential an outsider must not keep using, so seeded
 * accounts are flagged must_change_password = 1 and every first login is
 * forced through the password-change flow.
 *
 * The ONLY exception is the explicit E2E/fixture opt-out below: the acceptance
 * runner (and suites run against disposable fixture databases) set
 * QC_SEED_MUST_CHANGE_PASSWORD=0 so hundreds of existing scenarios can keep
 * signing in with the seeded fixtures. NEVER set it on a real deployment —
 * the enforced default (unset / any other value) is what production gets.
 */
function seedMustChangePassword(): number {
  return process.env.QC_SEED_MUST_CHANGE_PASSWORD === '0' ? 0 : 1;
}

function assertSafeSeedPassword(): void {
  if (process.env.NODE_ENV === 'production' && process.env.QC_SEED_MUST_CHANGE_PASSWORD === '0') {
    throw new Error('QC_SEED_MUST_CHANGE_PASSWORD=0 is forbidden in production.');
  }
  if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_DEFAULT_PASSWORD || IS_DEFAULT_PASSWORD)) {
    throw new Error(
      'ADMIN_DEFAULT_PASSWORD must be set before seeding a production database: ' +
        'the app refuses to create accounts with the default "admin123" password when NODE_ENV=production.',
    );
  }
}

/**
 * Production also refuses to KEEP accounts that still verify against the
 * default "admin123" password — e.g. a database seeded locally and then
 * promoted to production. Only enforced while ADMIN_DEFAULT_PASSWORD is unset
 * (an operator-supplied value is the allowed seed password).
 */
function assertNoDefaultPasswordAccounts(db: BetterSqliteDatabase): void {
  if (process.env.NODE_ENV !== 'production' || process.env.ADMIN_DEFAULT_PASSWORD) return;
  const rows = db.prepare('SELECT password_hash FROM users').all() as { password_hash: string }[];
  if (rows.some((row) => bcrypt.compareSync('admin123', row.password_hash))) {
    throw new Error(
      'ADMIN_DEFAULT_PASSWORD must be set before booting a production database: ' +
        'existing accounts still use the default "admin123" password. Set ADMIN_DEFAULT_PASSWORD ' +
        'to a strong value and reset those accounts (e.g. from /admin/users).',
    );
  }
}

interface SeedUser {
  username: string;
  full_name: string;
  role: Role;
  can_create_tasks: number;
}

const SEED_USERS: SeedUser[] = [
  { username: 'admin', full_name: 'Administrator', role: 'admin', can_create_tasks: 1 },
  { username: 'manager', full_name: 'Department Manager', role: 'manager', can_create_tasks: 1 },
  { username: 'supervisor', full_name: 'Team Supervisor', role: 'supervisor', can_create_tasks: 1 },
  // Employees create tasks ONLY when can_create_tasks = 1 (CORE BUSINESS RULE #1).
  { username: 'employee', full_name: 'QC Employee', role: 'employee', can_create_tasks: 0 },
];

/** True if the users table has zero rows (i.e. fresh database). */
function isUsersEmpty(db: BetterSqliteDatabase): boolean {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
  return n === 0;
}

/**
 * Seed one account per role if no users exist. Idempotent: no-op once any user
 * is present. Returns the number of rows actually inserted.
 */
export function seedUsersIfEmpty(db: BetterSqliteDatabase): number {
  if (!isUsersEmpty(db)) {
    // Accounts already exist — never touch them, but production refuses to
    // keep booting while any of them still uses the default password.
    assertNoDefaultPasswordAccounts(db);
    return 0;
  }

  assertSafeSeedPassword();

  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
  const mustChange = seedMustChangePassword();
  const insert = db.prepare(
    `INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active, must_change_password)
     VALUES (@username, @password_hash, @full_name, @role, @department, @can_create_tasks, @is_active, @must_change_password)`,
  );
  const insertAll = db.transaction(() => {
    for (const u of SEED_USERS) {
      insert.run({
        username: u.username,
        password_hash: hash,
        full_name: u.full_name,
        role: u.role,
        department: 'QC',
        can_create_tasks: u.can_create_tasks,
        is_active: 1,
        must_change_password: mustChange,
      });
    }
  });
  insertAll();

  console.warn(`[seed] seeded ${SEED_USERS.length} accounts (admin, manager, supervisor, employee).`);
  if (mustChange) {
    console.warn('[seed] every seeded account is flagged must_change_password — first login is forced through the password-change flow.');
  } else {
    console.warn('[seed] ⚠️  QC_SEED_MUST_CHANGE_PASSWORD=0 — seeded accounts are NOT flagged (E2E fixture mode only).');
  }
  if (IS_DEFAULT_PASSWORD) {
    console.warn(
      '[seed] ⚠️  ADMIN_DEFAULT_PASSWORD is not set — every seeded account uses the default "admin123".',
    );
    console.warn('[seed] ⚠️  Set ADMIN_DEFAULT_PASSWORD before exposing the app beyond localhost.');
  } else {
    console.warn('[seed] seeded accounts use ADMIN_DEFAULT_PASSWORD.');
  }
  return SEED_USERS.length;
}

// ─────────────────────────────── Demo data ───────────────────────────────
// SEED_DEMO=1 populates a FRESH database with a demo team + 12 tasks in mixed
// statuses so the whole app (lists, details, closure flow, dashboard) can be
// demoed immediately. Runs only when the tasks table is empty — an existing
// database is never touched.
//
// Demo team: admin + manager + supervisor (base seed) + 3 employees
// (employee, emp_sara, emp_omar). Dates are computed relative to today so the
// dashboard always shows live data (overdue tasks, last-8-weeks completions).

/** Local date YYYY-MM-DD offset by `days` from today. */
function iso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Demo rows for seedDemoData. Completed tasks carry a created_at modifier too. */
interface DemoTask {
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  createdBy: string;
  assignedTo: string | null;
  due: number | null; // days from today (negative = past/overdue)
  blocker: string | null;
  createdOffset: string | null; // SQLite datetime modifier, e.g. '-10 days'
  completedOffset: string | null;
  completedBy: string | null;
}

const DEMO_TASKS: DemoTask[] = [
  { title: 'Calibrate temperature gauges – Line A', description: 'Annual calibration of the 12 gauges on packaging Line A. Certificates must be filed in the QC archive.', status: 'in_progress', priority: 'high', progress: 45, createdBy: 'manager', assignedTo: 'emp_sara', due: 3, blocker: null, createdOffset: '-6 days', completedOffset: null, completedBy: null },
  { title: 'Inspect incoming batch #8841', description: 'Raw material inspection per SOP-QC-14. Record results in the batch log.', status: 'not_started', priority: 'medium', progress: 0, createdBy: 'supervisor', assignedTo: 'employee', due: -2, blocker: null, createdOffset: '-4 days', completedOffset: null, completedBy: null },
  { title: 'Update QC checklist template', description: 'Refresh the pre-shipment checklist with the new packaging requirements.', status: 'completed', priority: 'medium', progress: 100, createdBy: 'supervisor', assignedTo: 'emp_omar', due: -5, blocker: null, createdOffset: '-14 days', completedOffset: '-6 days', completedBy: 'emp_omar' },
  { title: 'Audit calibration certificates', description: 'Quarterly audit of all calibration certificates for accuracy and expiry dates.', status: 'on_hold', priority: 'high', progress: 60, createdBy: 'manager', assignedTo: 'emp_sara', due: 5, blocker: 'Awaiting the vendor calibration certificate for the torque wrench.', createdOffset: '-9 days', completedOffset: null, completedBy: null },
  { title: 'Review supplier audit report', description: 'Review the audit findings from the packaging supplier visit and file the report.', status: 'in_progress', priority: 'high', progress: 80, createdBy: 'supervisor', assignedTo: 'emp_omar', due: -1, blocker: null, createdOffset: '-10 days', completedOffset: null, completedBy: null },
  { title: 'Verify batch #8839 results', description: 'Cross-check the released batch results against the retention samples.', status: 'completed', priority: 'low', progress: 100, createdBy: 'supervisor', assignedTo: 'employee', due: -12, blocker: null, createdOffset: '-20 days', completedOffset: '-14 days', completedBy: 'employee' },
  { title: 'Draft SOP for new packaging line', description: 'Write the draft SOP for the upcoming packaging line B commissioning.', status: 'not_started', priority: 'low', progress: 0, createdBy: 'manager', assignedTo: 'employee', due: 10, blocker: null, createdOffset: '-2 days', completedOffset: null, completedBy: null },
  { title: 'First-article inspection – connector #332', description: 'First-article inspection of connector #332 per customer drawing REV-C.', status: 'in_progress', priority: 'medium', progress: 25, createdBy: 'supervisor', assignedTo: null, due: 2, blocker: null, createdOffset: '-3 days', completedOffset: null, completedBy: null },
  { title: 'Monthly QC metrics report', description: 'Compile the monthly defect-rate and OOS metrics for the management review.', status: 'completed', priority: 'medium', progress: 100, createdBy: 'manager', assignedTo: 'emp_sara', due: -30, blocker: null, createdOffset: '-35 days', completedOffset: '-28 days', completedBy: 'emp_sara' },
  { title: 'Environmental monitoring – cleanroom', description: 'Run the quarterly cleanroom particle + settle-plate monitoring campaign.', status: 'not_started', priority: 'high', progress: 0, createdBy: 'manager', assignedTo: null, due: -3, blocker: null, createdOffset: '-5 days', completedOffset: null, completedBy: null },
  { title: 'Supplier onboarding – new vendor', description: 'Complete the quality agreement and onboarding checklist for the new label vendor.', status: 'on_hold', priority: 'low', progress: 15, createdBy: 'manager', assignedTo: 'emp_omar', due: 14, blocker: 'Legal review of the quality agreement is pending.', createdOffset: '-7 days', completedOffset: null, completedBy: null },
  { title: 'Retest failed batch #8827', description: 'Retest the failed batch #8827 samples per the deviation investigation plan.', status: 'in_progress', priority: 'high', progress: 60, createdBy: 'supervisor', assignedTo: 'employee', due: -4, blocker: null, createdOffset: '-8 days', completedOffset: null, completedBy: null },
];

/**
 * Seed demo team + tasks when SEED_DEMO=1 and the tasks table is empty.
 * Returns the number of demo tasks created (0 when the flag is off or the
 * database already has tasks).
 */
export function seedDemoData(db: BetterSqliteDatabase): number {
  if (process.env.SEED_DEMO !== '1') return 0;
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM tasks').get() as { n: number };
  if (n > 0) {
    console.warn('[seed] SEED_DEMO=1 but tasks already exist — skipping demo data.');
    return 0;
  }

  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
  const mustChange = seedMustChangePassword();
  const insUser = db.prepare(
    `INSERT OR IGNORE INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active, must_change_password)
     VALUES (?, ?, ?, 'employee', 'QC', ?, 1, ?)`,
  );
  insUser.run('emp_sara', hash, 'Sara Alharbi', 1, mustChange);
  insUser.run('emp_omar', hash, 'Omar Alqahtani', 0, mustChange);

  const userId = (username: string): number => {
    const row = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as
      | { id: number }
      | undefined;
    if (!row) throw new Error(`[seed] demo user "${username}" missing`);
    return row.id;
  };

  const insertTask = db.prepare(
    `INSERT INTO tasks (title, description, status, priority, progress_percent, created_by, assigned_to, due_date, blocker_note, completed_at, completed_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? IS NULL THEN NULL ELSE datetime('now', ?) END, ?, datetime('now', ?))`,
  );
  const insertComment = db.prepare(
    `INSERT INTO task_comments (task_id, user_id, comment, created_at)
     VALUES (?, ?, ?, datetime('now', ?))`,
  );
  const insertActivity = db.prepare(
    `INSERT INTO task_activity_log (task_id, user_id, action, old_value, new_value, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now', ?))`,
  );
  // Tiny placeholder BLOBs so demo evidence files actually download.
  const insertAttachment = db.prepare(
    `INSERT INTO task_attachments (task_id, uploaded_by, file_name, mime_type, file_data, file_size, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))`,
  );
  const pdfBytes = Buffer.from('%PDF-1.4\n% QC demo evidence (placeholder)\n%%EOF\n', 'utf8');
  const xlsxBytes = Buffer.from('PK\x03\x04 QC demo evidence (placeholder)', 'utf8');

  const taskIds: number[] = [];
  const tx = db.transaction(() => {
    for (const t of DEMO_TASKS) {
      const info = insertTask.run(
        t.title,
        t.description,
        t.status,
        t.priority,
        t.progress,
        userId(t.createdBy),
        t.assignedTo ? userId(t.assignedTo) : null,
        t.due !== null ? iso(t.due) : null,
        t.blocker,
        t.completedOffset,
        t.completedOffset,
        t.completedBy ? userId(t.completedBy) : null,
        t.createdOffset ?? 'now',
      );
      const taskId = Number(info.lastInsertRowid);
      taskIds.push(taskId);
      const creatorId = userId(t.createdBy);

      insertActivity.run(taskId, creatorId, 'task_created', null, t.title, t.createdOffset ?? 'now');

      if (t.status === 'in_progress' || t.status === 'on_hold') {
        const workerId = t.assignedTo ? userId(t.assignedTo) : creatorId;
        insertActivity.run(taskId, workerId, 'status_changed', 'Not started', 'In progress', t.createdOffset ?? 'now');
        if (t.progress > 0) {
          insertActivity.run(taskId, workerId, 'progress_changed', '0', String(t.progress), t.createdOffset ?? 'now');
        }
      }
      if (t.status === 'on_hold' && t.blocker) {
        insertActivity.run(taskId, t.assignedTo ? userId(t.assignedTo) : creatorId, 'blocker_set', null, t.blocker, '-1 days');
      }

      if (t.status === 'completed' && t.completedBy && t.completedOffset) {
        const completerId = userId(t.completedBy);
        const comment =
          t.title.includes('metrics')
            ? 'Report compiled and submitted to management review.'
            : t.title.includes('checklist')
              ? 'Checklist updated and versioned — ready for training.'
              : 'Batch results verified against retention samples — all within specification.';
        insertComment.run(taskId, completerId, comment, t.completedOffset);
        insertActivity.run(taskId, completerId, 'task_completed', null, null, t.completedOffset);
        insertActivity.run(taskId, completerId, 'closure_comment_added', null, comment, t.completedOffset);
        if (t.title.includes('metrics')) {
          insertActivity.run(taskId, completerId, 'evidence_uploaded', null, 'qc_metrics_Q2.xlsx', t.completedOffset);
          insertAttachment.run(taskId, completerId, 'qc_metrics_Q2.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsxBytes, xlsxBytes.length, t.completedOffset);
        } else if (t.title.includes('checklist')) {
          insertActivity.run(taskId, completerId, 'evidence_uploaded', null, 'checklist_rev4.pdf', t.completedOffset);
          insertAttachment.run(taskId, completerId, 'checklist_rev4.pdf', 'application/pdf', pdfBytes, pdfBytes.length, t.completedOffset);
        } else {
          insertActivity.run(taskId, completerId, 'evidence_skipped', null, null, t.completedOffset);
        }
      }
    }

    // A couple of working comments so the thread view feels alive.
    if (taskIds.length >= 12) {
      insertComment.run(taskIds[0], userId('emp_sara'), 'Started the Line A calibration — 5 of 12 gauges done.', '-3 days');
      insertComment.run(taskIds[11], userId('employee'), 'Retest running — first 6 samples are within spec.', '-2 days');
    }
  });
  tx();

  console.warn(`[seed] SEED_DEMO=1 → seeded demo team (emp_sara, emp_omar) + ${DEMO_TASKS.length} tasks.`);
  return DEMO_TASKS.length;
}
