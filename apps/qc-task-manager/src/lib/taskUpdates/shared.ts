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

import { createHash } from 'node:crypto';

import { getDb } from '../db';
import { recordTaskMutation } from '../audit';
import {
  ALLOWED_EXTENSIONS_HINT,
  EVIDENCE_EXTENSIONS_HINT,
  EVIDENCE_EXT_MIME,
  EVIDENCE_SIGNATURES,
  EXT_MIME,
  MAX_FILE_NAME,
  MAX_UPLOAD_BYTES,
} from '../task-policy';
import {
  effectiveExtensionsFor,
  isExtensionAllowedFor,
  type EvidenceRequirementSpec,
} from '../evidence';
import type { Task } from '../types';

// Keep the mutation implementation readable while forcing every task audit
// event through the server-side audit boundary.
export function logActivity(params: {
  taskId: number;
  userId: number;
  action: string;
  oldValue?: string | null | number | boolean;
  newValue?: string | null | number | boolean;
}): void {
  recordTaskMutation({
    taskId: params.taskId,
    actorId: params.userId,
    action: params.action,
    oldValue: params.oldValue,
    newValue: params.newValue,
  });
}

// ─────────────────────────── Result types ───────────────────────────

export type UpdateResult =
  | { ok: true; message: string; changed: string[] }
  | { ok: false; error: string };

export type CloseResult =
  | { ok: true; taskId: number; nextTaskId: number | null }
  | { ok: false; error: string };

export type UploadResult =
  | { ok: true; attachmentId: number; fileName: string }
  | { ok: false; error: string };

export type CancelResult = { ok: true; message: string } | { ok: false; error: string };

export type ReopenResult = { ok: true; message: string } | { ok: false; error: string };

// ─────────────────────── Shared helpers ───────────────────────

/** Strip path components + control characters from a file name. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  // eslint-disable-next-line no-control-regex
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  // Dot-only names and leading dots are not useful download names and can
  // cause platform-specific hidden-file behavior.
  const safe = clean.replace(/^\.+/, '');
  return safe.slice(0, MAX_FILE_NAME);
}

/** SHA-256 hex digest of a file's bytes (spec: "calculate SHA-256 hash"). */
export function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Validate an uploaded file against extension + MIME + size rules. */
export function validateUploadedFile(
  file: File,
  bytes?: Buffer,
): { ok: true; fileName: string; mimeType: string } | { ok: false; error: string } {
  const fileName = sanitizeFileName(file.name);
  if (!fileName) {
    return { ok: false, error: 'The file must have a name.' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'The file is empty.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `The file exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit.`,
    };
  }
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  const allowedTypes = EXT_MIME[ext];
  if (!allowedTypes) {
    return {
      ok: false,
      error: `File type ".${ext || 'unknown'}" is not allowed. Allowed: ${ALLOWED_EXTENSIONS_HINT}.`,
    };
  }
  const declared = (file.type || '').toLowerCase();
  if (!declared || !allowedTypes.includes(declared)) {
    return {
      ok: false,
      error: `The file's MIME type (${declared || 'unknown'}) does not match a ".${ext}" file.`,
    };
  }
  if (bytes) {
    const signature = GENERIC_SIGNATURES[ext];
    if (isExecutableBytes(bytes)) {
      return { ok: false, error: 'Executable files are not allowed.' };
    }
    if (signature && !matchesSignature(bytes, signature)) {
      return { ok: false, error: `The file's content does not match a ".${ext}" file.` };
    }
    if (TEXT_EXTENSIONS.has(ext) && bytes.includes(0)) {
      return { ok: false, error: 'Binary content is not allowed for text files.' };
    }
  }
  return { ok: true, fileName, mimeType: declared };
}

const TEXT_EXTENSIONS = new Set(['txt', 'md', 'csv', 'json', 'log', 'xml', 'sql']);
const GENERIC_SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46],
  zip: [0x50, 0x4b, 0x03, 0x04],
  xlsx: [0x50, 0x4b, 0x03, 0x04],
  docx: [0x50, 0x4b, 0x03, 0x04],
  pptx: [0x50, 0x4b, 0x03, 0x04],
  xls: [0xd0, 0xcf, 0x11, 0xe0],
  doc: [0xd0, 0xcf, 0x11, 0xe0],
  ppt: [0xd0, 0xcf, 0x11, 0xe0],
};

function isExecutableBytes(bytes: Buffer): boolean {
  // Windows PE, ELF, Mach-O (32/64-bit) and script shebangs.
  return (
    (bytes[0] === 0x4d && bytes[1] === 0x5a) ||
    (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) ||
    ([0xfe, 0xce, 0xcf, 0xca].includes(bytes[0]) && [0xed, 0xfa, 0xfe, 0xcf].includes(bytes[1])) ||
    (bytes[0] === 0x23 && bytes[1] === 0x21)
  );
}

/**
 * Validate a completion-evidence file — the RESTRICTED evidence allowlist
 * (pdf/png/jpg/jpeg/xlsx/docx, per spec) with extension + MIME + 10 MB + magic
 * bytes where the type has a signature. `bytes` is the file content already
 * read by the caller (needed for the signature check).
 *
 * `requirement`, when provided, NARROWS the allowlist to the requirement's
 * `allowedExtensions` (e.g. an XLSX-only measurement slot rejects a PDF even
 * though PDF is globally valid evidence).
 */
export function validateEvidenceFile(
  file: File,
  bytes: Buffer,
  requirement?: EvidenceRequirementSpec,
): { ok: true; fileName: string; mimeType: string } | { ok: false; error: string } {
  const fileName = sanitizeFileName(file.name);
  if (!fileName) {
    return { ok: false, error: 'The file must have a name.' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'The file is empty.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `The file exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit.`,
    };
  }
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  // Per-requirement narrowing takes precedence when declared.
  if (requirement && !isExtensionAllowedFor(requirement, ext)) {
    const allowed = effectiveExtensionsFor(requirement);
    return {
      ok: false,
      error: `File type ".${ext || 'unknown'}" is not allowed for "${requirement.label}". Allowed: ${allowed.join(', ')}.`,
    };
  }
  const allowedTypes = EVIDENCE_EXT_MIME[ext];
  if (!allowedTypes) {
    return {
      ok: false,
      error: `File type ".${ext || 'unknown'}" is not allowed for evidence. Allowed: ${EVIDENCE_EXTENSIONS_HINT}.`,
    };
  }
  const declared = (file.type || '').toLowerCase();
  if (!declared || !allowedTypes.includes(declared)) {
    return {
      ok: false,
      error: `The file's MIME type (${declared || 'unknown'}) does not match a ".${ext}" file.`,
    };
  }
  const sig = EVIDENCE_SIGNATURES[ext];
  if (sig && !matchesSignature(bytes, sig)) {
    return {
      ok: false,
      error: `The file's content does not match a ".${ext}" file — upload a valid file.`,
    };
  }
  return { ok: true, fileName, mimeType: declared };
}

/** True when the byte buffer starts with the given magic bytes. */
function matchesSignature(bytes: Buffer, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false;
  }
  return true;
}

/** Resolve a user's display name (for assignee activity entries). */
export function userName(id: number | null | undefined): string | null {
  if (id == null) return null;
  const row = getDb()
    .prepare('SELECT full_name FROM users WHERE id = ?')
    .get(id) as { full_name: string } | undefined;
  return row?.full_name ?? null;
}

/** Load the mutable task row (all editable columns). */
export function loadEditableTask(taskId: number) {
  return getDb()
    .prepare(
      `SELECT id, title, description, department, status, priority, progress_percent,
              created_by, assigned_to, due_date, blocker_note, recurrence,
              recurrence_end_date, started_at, completed_at, cancelled_at, cancelled_by,
              inspection_type, finding_classification, risk_level, corrective_action_required,
              reference_number, audit_batch_or_work_order
       FROM tasks WHERE id = ?`,
    )
    .get(taskId) as
    | (Pick<
        Task,
        | 'id'
        | 'title'
        | 'description'
        | 'department'
        | 'status'
        | 'priority'
        | 'progress_percent'
        | 'created_by'
        | 'assigned_to'
        | 'due_date'
        | 'blocker_note'
        | 'recurrence'
        | 'recurrence_end_date'
        | 'started_at'
        | 'completed_at'
        | 'cancelled_at'
        | 'cancelled_by'
        | 'inspection_type'
        | 'finding_classification'
        | 'risk_level'
        | 'corrective_action_required'
        | 'reference_number'
        | 'audit_batch_or_work_order'
      >)
    | undefined;
}

/**
 * Dependencies of `taskId` that are NOT completed/cancelled (they block moving
 * the task to In Progress). Returns task ids + titles for messages and the UI.
 * Interpretation: "incomplete" = not completed; a cancelled dependency is
 * terminal (nothing will ever finish it), so it does NOT block — the app layer
 * cannot produce 'cancelled' today, but the schema allows it.
 */
export function listBlockingDependencies(taskId: number): { task_id: number; title: string; status: string }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT d.depends_on_task_id AS task_id, t.title, t.status
       FROM task_dependencies d
       JOIN tasks t ON t.id = d.depends_on_task_id
       WHERE d.task_id = ? AND t.status NOT IN ('completed', 'cancelled')
       ORDER BY t.title ASC, t.id ASC`,
    )
    .all(taskId) as { task_id: number; title: string; status: string }[];
}
