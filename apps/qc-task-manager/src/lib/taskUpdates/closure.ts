// Split from the former 1,556-line taskUpdates.ts (QC-100-ARCHITECTURE-002).
// Seams follow the file's own section markers; the public API is unchanged —
// everything is re-exported from taskUpdates/index.ts.

// Task update, closure, and attachment-upload layer.
//
// Single source of truth for MUTATING a task after creation:
//   applyTaskUpdate  → status / progress / blocker (+ locked fields for
//                      supervisor/manager/admin, per CORE BUSINESS RULE #2)
//   closeTask        → the COMPLETION WIZARD flow (CORE BUSINESS RULE #3),
//                      atomic: status=Completed → evidence BLOBs (restricted
//                      allowlist + magic bytes, or recorded skip) → completion
//                      comment (is_completion_comment=1) → completed_at/by →
//                      notifications for creator + managers + supervisors
//   cancelTask       → manager/admin-only cancellation (reason required)
//   reopenTask       → admin/manager-only reopen of a completed task
//   uploadAttachment → generic attachment upload with extension + MIME + 10 MB
//                      validation (CORE BUSINESS RULE #5: BLOBs in SQLite)
//
// Every mutation re-checks the actor against the CURRENT task row and is fully
// parameterized. Completed tasks are read-only for everyone (#2/#3) — enforced
// here, so no endpoint can bypass it.


import { getDb } from '../db';
import { Action } from '../audit';
import { canEditTask, hasRankAtLeast } from '../permissions';
import { createNotification } from '../notifications';
import {
  MAX_COMMENT_LENGTH,
} from '../format';
import {
  MAX_UPLOAD_BYTES,
  isTaskReadOnly,
  isValidOverrideReason,
} from '../task-policy';
import { nextDueDate, shouldCreateNextOccurrence } from '../recurrence';
import { checkpointTaskSla } from '../sla/engine';
import { canCloseTaskWithWorkflow, closeWorkflowInstance } from '../workflows/engine';
import {
  computeMissingEvidence,
  findRequirement,
  normalizeEvidenceRequirements,
  type EvidenceRequirementSpec,
} from '../evidence';
import { parseSnapshot, type TemplateSnapshot } from '../templates';
import type { Role } from '../types';

import {
  type CloseResult,
  logActivity,
  loadEditableTask,
  sha256Hex,
  validateEvidenceFile,
} from './shared';

// ─────────────────────────── Closure flow ───────────────────────────

/**
 * CORE BUSINESS RULE #3 — the closure flow, executed atomically:
 *   1. status = 'completed'
 *   2. evidence step: the uploaded file is stored + logged as
 *      evidence_uploaded; otherwise the skip is RECORDED as evidence_skipped.
 *   3. completion comment (MANDATORY) → stored in task_comments + logged.
 *   4. completed_at + completed_by are auto-filled by the system.
 * After this, the task is read-only for everyone.
 */
export async function closeTask(params: {
  taskId: number;
  actor: { id: number; role: Role };
  form: FormData;
}): Promise<CloseResult> {
  const db = getDb();
  const task = loadEditableTask(params.taskId);
  if (!task) return { ok: false, error: 'Task not found.' };

  if (isTaskReadOnly(task.status)) {
    return {
      ok: false,
      error:
        task.status === 'completed'
          ? 'This task is already completed.'
          : 'This task is cancelled and cannot be completed.',
    };
  }
  if (!canEditTask(params.actor, task)) {
    return { ok: false, error: 'You do not have permission to edit this task.' };
  }
  if (!canCloseTaskWithWorkflow(task.id, params.actor, db)) {
    return { ok: false, error: 'Workflow approvals are incomplete. Complete the required review steps before closing this task.' };
  }

  const checklistState = db.prepare(
    'SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END), 0) AS completed FROM task_checklists WHERE task_id = ?',
  ).get(task.id) as { total: number; completed: number };
  const incompleteChecklist = Number(checklistState.total) - Number(checklistState.completed);
  let checklistOverrideReason: string | null = null;
  if (incompleteChecklist > 0) {
    const rawOverride = String(params.form.get('checklist_override_reason') ?? '').trim();
    if (!hasRankAtLeast(params.actor.role, 'manager')) {
      return { ok: false, error: `Complete all ${incompleteChecklist} remaining checklist item(s) before completing this task.` };
    }
    if (!isValidOverrideReason(rawOverride)) {
      return { ok: false, error: `Complete all ${incompleteChecklist} remaining checklist item(s), or provide a manager/admin override reason.` };
    }
    checklistOverrideReason = rawOverride;
  }

  const completionComment = String(params.form.get('completion_comment') ?? '').trim();
  if (!completionComment) {
    return { ok: false, error: 'A completion comment is required to complete the task.' };
  }
  if (completionComment.length > MAX_COMMENT_LENGTH) {
    return {
      ok: false,
      error: `Completion comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`,
    };
  }

  // Evidence requirements come from the task's frozen template snapshot (set
  // at instantiation time). Tasks without a template have no requirements — the
  // gate is inert for them and the legacy evidence-optional behavior is kept.
  const snapshotRow = db.prepare('SELECT template_snapshot FROM tasks WHERE id = ?').get(task.id) as
    | { template_snapshot: string | null }
    | undefined;
  const snapshot: TemplateSnapshot | null = parseSnapshot(snapshotRow?.template_snapshot ?? null);
  const evidenceRequirements: EvidenceRequirementSpec[] = snapshot
    ? normalizeEvidenceRequirements(snapshot.evidenceRequirements)
    : [];

  // Evidence step: zero or more uploaded files — each validated against the
  // RESTRICTED evidence allowlist (pdf/png/jpg/jpeg/xlsx/docx) + MIME + size +
  // magic bytes — or a recorded skip. The bytes are read BEFORE the transaction
  // (transaction callbacks are synchronous), so this function is async. Each
  // file may carry an `evidence_type` parallel field that ties it to one of the
  // task's evidence requirements; when present, the requirement's narrowed
  // extension allowlist is applied in addition to the global one.
  const rawFiles = params.form.getAll('evidence');
  const files = rawFiles.filter(
    (f): f is File => typeof f === 'object' && f !== null && 'size' in f && f.size > 0,
  );
  const rawEvidenceTypes = params.form.getAll('evidence_type');

  interface PreparedEvidence {
    fileName: string;
    mimeType: string;
    bytes: Buffer;
    hash: string;
    evidenceType: string | null;
    evidenceLabel: string | null;
    description: string | null;
  }
  const evidenceFiles: PreparedEvidence[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const f = files[i];
    // Reject over-limit input before allocating a Buffer from FormData. This
    // is the last guard before any BLOB-sized allocation or database insert.
    if (f.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: `The file exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit.` };
    }
    const rawType = i < rawEvidenceTypes.length ? String(rawEvidenceTypes[i] ?? '').trim().toLowerCase() : '';
    const requirement = rawType ? findRequirement(evidenceRequirements, rawType) : undefined;
    if (rawType && !requirement) {
      return { ok: false, error: `Evidence type "${rawType}" is not declared on this task.` };
    }
    const bytes = Buffer.from(await f.arrayBuffer());
    const validated = validateEvidenceFile(f, bytes, requirement);
    if (!validated.ok) return { ok: false, error: validated.error };
    const hash = sha256Hex(bytes);
    // Duplicate-hash guard: the same content must not be recorded twice on one
    // task. This is a read-then-write check (acceptable on single-writer SQLite
    // — same pattern as the dependency gate).
    const dup = db
      .prepare('SELECT id FROM task_attachments WHERE task_id = ? AND file_hash = ?')
      .get(task.id, hash);
    if (dup) {
      return { ok: false, error: 'This file was already uploaded as evidence for this task.' };
    }
    evidenceFiles.push({
      fileName: validated.fileName,
      mimeType: validated.mimeType,
      bytes,
      hash,
      evidenceType: requirement ? requirement.type : (rawType || null),
      evidenceLabel: requirement ? requirement.label : null,
      description: requirement?.description ?? null,
    });
  }

  // Per-requirement maxFiles: at most N files may satisfy one slot.
  if (evidenceRequirements.length > 0 && evidenceFiles.length > 0) {
    const counts = new Map<string, number>();
    for (const ev of evidenceFiles) {
      if (!ev.evidenceType) continue;
      counts.set(ev.evidenceType, (counts.get(ev.evidenceType) ?? 0) + 1);
    }
    for (const req of evidenceRequirements) {
      const cap = req.maxFiles ?? 1;
      const used = counts.get(req.type) ?? 0;
      if (used > cap) {
        return {
          ok: false,
          error: `"${req.label}" accepts at most ${cap} file(s); ${used} were uploaded.`,
        };
      }
    }
  }

  // ── COMPLETION GATE: required-evidence enforcement (server-side) ──
  // Missing required evidence blocks completion — whether or not evidence was
  // skipped. Skipping only affects the activity log (evidence_skipped); it does
  // NOT waive declared REQUIRED requirements. Managers/admins may override with
  // an explicit reason (mirrors the checklist-override pattern); everyone else
  // is blocked.
  let evidenceOverrideReason: string | null = null;
  if (evidenceRequirements.length > 0) {
    const existingEvidence = db
      .prepare(
        `SELECT DISTINCT evidence_type
         FROM task_attachments
         WHERE task_id = ?
           AND is_evidence = 1
           AND evidence_type IS NOT NULL
           AND verification_status != 'REJECTED'`,
      )
      .all(task.id) as { evidence_type: string }[];
    const uploadedTypes = [
      ...existingEvidence.map((ev) => ev.evidence_type),
      ...evidenceFiles
      .map((ev) => ev.evidenceType)
      .filter((t): t is string => t !== null),
    ];
    const missing = computeMissingEvidence(evidenceRequirements, uploadedTypes);
    if (missing.length > 0) {
      const labels = missing.map((m) => m.label).join(', ');
      const rawOverride = String(params.form.get('evidence_override_reason') ?? '').trim();
      if (!hasRankAtLeast(params.actor.role, 'manager')) {
        return {
          ok: false,
          error: `Required evidence is missing: ${labels}. Upload the required evidence before completing this task.`,
        };
      }
      if (!isValidOverrideReason(rawOverride)) {
        return {
          ok: false,
          error: `Required evidence is missing: ${labels}. Provide a manager/admin override reason, or upload the missing evidence.`,
        };
      }
      evidenceOverrideReason = rawOverride;
    }
  }

  let nextTaskId: number | null = null;

  const tx = db.transaction(() => {
    // Conditional update (status != 'completed') makes the transition atomic:
    // a concurrent second close hits changes === 0 and the whole tx rolls back
    // instead of clobbering completed_at/completed_by.
    const info = db
      .prepare(
        `UPDATE tasks
         SET status = 'completed', progress_percent = 100,
             completed_at = datetime('now'), completed_by = ?,
             updated_at = datetime('now')
         WHERE id = ? AND status != 'completed'`,
      )
      .run(params.actor.id, task.id);
    if (info.changes !== 1) {
      throw new Error('already completed');
    }

    // Evidence BLOBs — each stored with is_evidence = 1 and logged individually.
    // When a file targets an evidence_type that already has a record on this
    // task, the previous record is REPLACED (deleted) so a re-upload supersedes
    // the earlier evidence rather than accumulating duplicates.
    for (const ev of evidenceFiles) {
      if (ev.evidenceType) {
        const prior = db
          .prepare('SELECT id, file_name FROM task_attachments WHERE task_id = ? AND is_evidence = 1 AND evidence_type = ?')
          .get(task.id, ev.evidenceType) as { id: number; file_name: string } | undefined;
        if (prior) {
          db.prepare('DELETE FROM task_attachments WHERE id = ?').run(prior.id);
          logActivity({
            taskId: task.id,
            userId: params.actor.id,
            action: Action.EVIDENCE_REPLACED,
            oldValue: prior.file_name,
            newValue: ev.fileName,
          });
        }
      }
      db.prepare(
        `INSERT INTO task_attachments
          (task_id, uploaded_by, file_name, mime_type, file_data, file_size, file_hash, is_evidence,
           evidence_type, evidence_label, description, source, collected_by, collected_at, verification_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'manual_upload', ?, datetime('now'), 'UNVERIFIED')`,
      ).run(
        task.id,
        params.actor.id,
        ev.fileName,
        ev.mimeType,
        ev.bytes,
        ev.bytes.length,
        ev.hash,
        ev.evidenceType,
        ev.evidenceLabel,
        ev.description,
        params.actor.id,
      );
      logActivity({
        taskId: task.id,
        userId: params.actor.id,
        action: Action.EVIDENCE_UPLOADED,
        newValue: ev.evidenceType ? `${ev.evidenceType}:${ev.fileName}` : ev.fileName,
      });
    }
    if (evidenceFiles.length === 0) {
      // Skipping must still be recorded in the activity log (CORE BUSINESS RULE #3).
      logActivity({ taskId: task.id, userId: params.actor.id, action: Action.EVIDENCE_SKIPPED });
    }
    if (evidenceOverrideReason) {
      logActivity({
        taskId: task.id,
        userId: params.actor.id,
        action: Action.EVIDENCE_GATE_OVERRIDE,
        newValue: evidenceOverrideReason,
      });
    }

    // Completion comment stored with is_completion_comment = 1 and linked on
    // the task row (spec) so it stays unambiguous even after a reopen unflags
    // it back into the regular thread.
    const commentInfo = db
      .prepare(
        `INSERT INTO task_comments (task_id, user_id, comment, is_completion_comment)
         VALUES (?, ?, ?, 1)`,
      )
      .run(task.id, params.actor.id, completionComment);
    db.prepare('UPDATE tasks SET completion_comment_id = ? WHERE id = ?').run(
      Number(commentInfo.lastInsertRowid),
      task.id,
    );

    logActivity({ taskId: task.id, userId: params.actor.id, action: Action.TASK_COMPLETED });
    if (checklistOverrideReason) {
      logActivity({ taskId: task.id, userId: params.actor.id, action: Action.CHECKLIST_OVERRIDE, newValue: checklistOverrideReason });
    }
    logActivity({
      taskId: task.id,
      userId: params.actor.id,
      action: Action.CLOSURE_COMMENT_ADDED,
      newValue: completionComment,
    });

    // Completion notifications (spec): the task creator, plus every active
    // manager and supervisor — deduped and excluding the completer.
    const notifyIds = new Set<number>();
    if (task.created_by !== params.actor.id) notifyIds.add(task.created_by);
    const leaders = db
      .prepare("SELECT id FROM users WHERE is_active = 1 AND role IN ('manager', 'supervisor')")
      .all() as { id: number }[];
    for (const row of leaders) {
      if (row.id !== params.actor.id) notifyIds.add(row.id);
    }
    const completerName =
      (db.prepare('SELECT full_name FROM users WHERE id = ?').get(params.actor.id) as
        | { full_name: string }
        | undefined)?.full_name ?? 'a team member';
    for (const userId of notifyIds) {
      createNotification({
        userId,
        taskId: task.id,
        type: 'task_completed',
        title: 'Task completed',
        message: `"${task.title}" was completed by ${completerName}.`,
        actorId: params.actor.id,
      });
    }

    // ── Recurring series: spawn the NEXT occurrence, but ONLY here (on
    // completion), never up front — no endless tasks. The next task is linked
    // via parent_recurring_task_id and copies the checklist TEMPLATE (titles
    // + order, all unchecked) plus the business fields, but NOT comments,
    // evidence, activity logs, or completion metadata.
    if (
      shouldCreateNextOccurrence({
        recurrence: task.recurrence,
        dueDate: task.due_date,
        recurrenceEndDate: task.recurrence_end_date,
      })
    ) {
      const nextDue = nextDueDate(task.recurrence, task.due_date);
      if (nextDue) {
        // Inherit the template linkage + frozen snapshot so the recurring
        // occurrence enforces the same evidence requirements as the original.
        const templateLink = db
          .prepare('SELECT template_id, template_snapshot FROM tasks WHERE id = ?')
          .get(task.id) as { template_id: number | null; template_snapshot: string | null } | undefined;
        const ins = db
          .prepare(
            `INSERT INTO tasks (title, description, department, status, priority, progress_percent,
                                created_by, assigned_to, due_date, recurrence, recurrence_end_date,
                                parent_recurring_task_id, template_id, template_snapshot)
             VALUES (?, ?, ?, 'not_started', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            task.title,
            task.description,
            task.department,
            task.priority,
            task.created_by,
            task.assigned_to,
            nextDue,
            task.recurrence,
            task.recurrence_end_date,
            task.id,
            templateLink?.template_id ?? null,
            templateLink?.template_snapshot ?? null,
          );
        nextTaskId = Number(ins.lastInsertRowid);

        const template = db
          .prepare(
            'SELECT title, sort_order FROM task_checklists WHERE task_id = ? ORDER BY sort_order ASC, id ASC',
          )
          .all(task.id) as { title: string; sort_order: number }[];
        for (const it of template) {
          db.prepare(
            'INSERT INTO task_checklists (task_id, title, sort_order, is_completed) VALUES (?, ?, ?, 0)',
          ).run(nextTaskId, it.title, it.sort_order);
        }

        // Recurring creation is recorded in the activity log on BOTH sides of
        // the series (spec: record recurring task creation).
        logActivity({
          taskId: task.id,
          userId: params.actor.id,
          action: Action.RECURRING_TASK_CREATED,
          newValue: `next occurrence created (#${nextTaskId})`,
        });
        logActivity({
          taskId: nextTaskId,
          userId: task.created_by,
          action: Action.TASK_CREATED,
          newValue: task.title,
        });
        logActivity({
          taskId: nextTaskId,
          userId: task.created_by,
          action: Action.RECURRING_TASK_CREATED,
          newValue: `next occurrence of recurring task #${task.id}`,
        });

        if (task.assigned_to != null) {
          createNotification({
            userId: task.assigned_to,
            taskId: nextTaskId,
            type: 'recurring_created',
            title: 'Next recurring task created',
            message: `The next occurrence of "${task.title}" is scheduled for ${nextDue}.`,
            actorId: params.actor.id,
          });
        }
      }
    }
  });
  try {
    tx();
  } catch (err) {
    // Rolled back — the task was completed between our check and the update.
    if (err instanceof Error && err.message === 'already completed') {
      return { ok: false, error: 'This task is already completed.' };
    }
    throw err;
  }

  checkpointTaskSla(task.id, task.status, 'completed', db);
  if (db.prepare('SELECT id FROM workflow_instances WHERE task_id = ?').get(task.id)) {
    closeWorkflowInstance(task.id, params.actor, db);
  }

  return { ok: true, taskId: task.id, nextTaskId };
}
