// Daily scheduled reminder job (PROMPT 46) — persist read-time derivations as
// notifications in the EXISTING `notifications` table (one system, contract
// §5.2). Today, calibration due / document review due / acknowledgement
// pending states are computed at read time and users only discover them by
// opening the page. This job runs the exact same derivation logic —
// LATEST_DUE_SQL, deriveCalibrationState, deriveDocumentReviewState — once a
// day and writes one notification row per recipient/entity/bucket.
//
// Idempotency: every row carries a dedupe_key of
//   `sched:{userId}:{kind}:{entity}:{runDate}`
// enforced by the partial unique index uq_notifications_dedupe_key
// (migration 025) — that is the user+kind+entity+date key the spec asks for.
// Interactive notifications keep dedupe_key NULL and are unaffected.
//
// System actor decision: the notifications table has NO actor column and the
// task-activity log is only written for task-scoped rows (taskId != null).
// Scheduled rows are task-less (taskId NULL) and are written with NO actor —
// the job never impersonates a real user and no audit attribution is invented.
//
// Recipients (role-derived, matching the interactive writers):
//   - calibration due     → lab_equipment.created_by (equipment manager),
//                           non-archived equipment only
//   - document review due → COALESCE(lab_documents.owner_id, created_by),
//                           live statuses only (DRAFT/IN_REVIEW/APPROVED —
//                           same ACTIVE_DOCUMENT_STATUSES set as calendar.ts)
//   - acks pending        → the assigned acknowledger (a.user_id) of a PENDING
//                           row on a live document; bucketed by the parent
//                           document's review_due_date (the same anchor the
//                           calendar uses — the schema stores no ack deadline)
// Inactive users are skipped up front (same guard as createNotification).

import { getDb } from '../db';
import { LATEST_DUE_SQL, deriveCalibrationState } from './overview';
import {
  deriveDocumentReviewState,
  LAB_DOCUMENT_REVIEW_STATE_LABELS,
} from './documents';
import type { NotificationKind } from '../notifications';

/** Live document statuses — mirrors calendar.ts ACTIVE_DOCUMENT_STATUSES. */
const ACTIVE_DOCUMENT_STATUSES = `('DRAFT', 'IN_REVIEW', 'APPROVED')`;

/** Local ISO date offset from today by `days` (same as overview.ts). */
function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Whole days from `today` to `dueIso` (negative = overdue). */
function daysUntil(dueIso: string, today: string): number {
  return Math.round((Date.parse(dueIso) - Date.parse(today)) / 86_400_000);
}

export interface ScheduledNotificationSummary {
  /** Local ISO date the job ran for (dedupe scope). */
  runDate: string;
  calibration_due: number;
  calibration_overdue: number;
  document_review: number;
  acknowledgements: number;
  /** Rows skipped because the recipient is inactive. */
  skipped_inactive: number;
}

/** Insert one scheduled notification unless the dedupe key already exists. */
function insertScheduled(params: {
  userId: number;
  kind: NotificationKind;
  title: string;
  message: string;
  href: string;
  entity: string;
  runDate: string;
}): 'inserted' | 'duplicate' | 'inactive' {
  const db = getDb();
  const active = db
    .prepare('SELECT 1 AS one FROM users WHERE id = ? AND is_active = 1')
    .get(params.userId);
  if (!active) return 'inactive';
  const dedupeKey = `sched:${params.userId}:${params.kind}:${params.entity}:${params.runDate}`;
  const info = db
    .prepare(
      `INSERT OR IGNORE INTO notifications (user_id, task_id, type, title, message, entity_href, dedupe_key)
       VALUES (?, NULL, ?, ?, ?, ?, ?)`,
    )
    .run(params.userId, params.kind, params.title, params.message, params.href, dedupeKey);
  return info.changes === 1 ? 'inserted' : 'duplicate';
}

/**
 * Run the daily reminder job. Safe to re-run any number of times on the same
 * day — every insert is deduplicated by (user, kind, entity, run date).
 */
export function runScheduledNotifications(today = isoOffset(0)): ScheduledNotificationSummary {
  const db = getDb();
  const summary: ScheduledNotificationSummary = {
    runDate: today,
    calibration_due: 0,
    calibration_overdue: 0,
    document_review: 0,
    acknowledgements: 0,
    skipped_inactive: 0,
  };
  const track = (
    outcome: 'inserted' | 'duplicate' | 'inactive',
    counter: 'calibration_due' | 'calibration_overdue' | 'document_review' | 'acknowledgements',
  ) => {
    if (outcome === 'inserted') summary[counter] += 1;
    else if (outcome === 'inactive') summary.skipped_inactive += 1; // duplicates (idempotent re-run) are not skips
  };

  // 1. Calibration due (equipment managers, non-archived devices) — the same
  //    LATEST_DUE_SQL + deriveCalibrationState the command center uses.
  const calibrationRows = db
    .prepare(
      `SELECT e.id, e.code, e.name, e.created_by AS recipient_id,
              ${LATEST_DUE_SQL} AS due_date
       FROM lab_equipment e
       WHERE e.is_archived = 0
         AND ${LATEST_DUE_SQL} IS NOT NULL
         AND date(${LATEST_DUE_SQL}) <= date(?)`,
    )
    .all(isoOffset(30)) as Array<{
    id: number;
    code: string;
    name: string;
    recipient_id: number;
    due_date: string;
  }>;
  for (const row of calibrationRows) {
    const state = deriveCalibrationState(row.due_date, today);
    if (state !== 'OVERDUE' && state !== 'DUE_TODAY' && state !== 'DUE_SOON') continue;
    const days = daysUntil(row.due_date, today);
    const overdue = state === 'OVERDUE';
    track(
      insertScheduled({
        userId: row.recipient_id,
        kind: overdue ? 'lab_calibration_overdue' : 'lab_calibration_due',
        title: `Calibration ${overdue ? 'overdue' : days === 0 ? 'due today' : `due in ${days} days`}: ${row.code}`,
        message: `${row.name} (${row.code}) calibration is ${
          overdue ? `overdue (was due ${row.due_date})` : days === 0 ? `due today (${row.due_date})` : `due in ${days} days (${row.due_date})`
        }.`,
        href: `/lab/equipment/${row.id}`,
        entity: `equipment:${row.id}`,
        runDate: today,
      }),
      overdue ? 'calibration_overdue' : 'calibration_due',
    );
  }

  // 2. Document review due (owner/reviewer fallback, live statuses) — the same
  //    deriveDocumentReviewState windows the register shows (30/15/7/today).
  const documentRows = db
    .prepare(
      `SELECT d.id, d.code, COALESCE(d.owner_id, d.created_by) AS recipient_id, d.review_due_date
       FROM lab_documents d
       WHERE d.status IN ${ACTIVE_DOCUMENT_STATUSES}
         AND d.review_due_date IS NOT NULL`,
    )
    .all() as Array<{ id: number; code: string; recipient_id: number; review_due_date: string }>;
  for (const row of documentRows) {
    const state = deriveDocumentReviewState(row.review_due_date, today);
    if (!state || state === 'OK') continue; // reminder buckets only (PROMPT 46)
    track(
      insertScheduled({
        userId: row.recipient_id,
        kind: 'lab_document_review_due',
        title: `Document review ${state === 'OVERDUE' ? 'overdue' : 'due'}: ${row.code}`,
        message: `${row.code} — ${LAB_DOCUMENT_REVIEW_STATE_LABELS[state].toLowerCase()} (review due ${row.review_due_date}).`,
        href: `/lab/documents/${row.id}/edit`,
        entity: `document:${row.id}`,
        runDate: today,
      }),
      'document_review',
    );
  }

  // 3. Pending acknowledgements (the assigned acknowledger) — anchored to the
  //    parent document's review_due_date (calendar convention: the schema
  //    stores no separate acknowledgement deadline).
  const ackRows = db
    .prepare(
      `SELECT a.id AS ack_id, a.user_id AS recipient_id, d.id AS document_id,
              d.code, d.review_due_date, v.version, v.id AS version_id
       FROM lab_document_acknowledgements a
       JOIN lab_document_versions v ON v.id = a.document_version_id
       JOIN lab_documents d ON d.id = v.document_id
       WHERE a.status = 'PENDING'
         AND d.status IN ${ACTIVE_DOCUMENT_STATUSES}
         AND d.review_due_date IS NOT NULL`,
    )
    .all() as Array<{
    ack_id: number;
    recipient_id: number;
    document_id: number;
    code: string;
    review_due_date: string;
    version: number;
    version_id: number;
  }>;
  for (const row of ackRows) {
    const state = deriveDocumentReviewState(row.review_due_date, today);
    if (!state || state === 'OK') continue; // reminder buckets only (PROMPT 46)
    track(
      insertScheduled({
        userId: row.recipient_id,
        kind: 'lab_document_acknowledgement',
        title: `Acknowledgement required: ${row.code} v${row.version}`,
        message: `${row.code} v${row.version} acknowledgement is still pending (review due ${row.review_due_date}).`,
        href: `/lab/acknowledgements?version=${row.version_id}`,
        entity: `ack:${row.ack_id}`,
        runDate: today,
      }),
      'acknowledgements',
    );
  }

  return summary;
}
