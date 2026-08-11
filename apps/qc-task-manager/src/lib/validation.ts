// Server-side input validation — the ONLY place where Zod schemas live.
//
// Every endpoint that accepts user input parses it through one of the schemas
// below (via parseFormData for raw form bodies, or schema.safeParse for
// already-shaped objects). Error messages deliberately match the app's
// existing copy so behavior never changes when validation moves here.
//
// Schema inputs mirror FormData conventions: a missing field is an empty
// string, and empty strings normalize to null for optional values. Business
// limits (lengths, statuses, priorities) come from src/lib/task-policy.ts so
// there is a single source of truth.

import { z } from 'zod';
import {
  MAX_CHECKLIST_ITEMS,
  MAX_CHECKLIST_TITLE_LENGTH,
  MAX_DEPENDENCIES,
  MAX_DEPARTMENT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_REASON_LENGTH,
  MAX_SAVED_FILTER_JSON,
  MAX_SAVED_FILTER_NAME,
  MAX_TITLE_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  TASK_PRIORITIES,
  TASK_RECURRENCES,
} from './task-policy';
import { MAX_COMMENT_LENGTH } from './format';
import type { TaskPriority, TaskRecurrence } from './types';

// ─────────────────────────── Small helpers ───────────────────────────

/** Map a FormData body to a plain record (files pass through untouched). */
function formToRecord(form: FormData): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  const seen = new Set<string>();
  for (const key of form.keys()) {
    if (seen.has(key)) continue;
    seen.add(key);
    // Repeated keys (checklist[], dependencies[]) become arrays so the Zod
    // array schemas below can validate them; single values stay scalars —
    // except ARRAY_FIELDS, which stay arrays even with one entry (an item
    // count of one must not be mistaken for a scalar and dropped).
    const all = form.getAll(key);
    if (ARRAY_FIELDS.has(key)) {
      record[key] = all;
    } else {
      record[key] = all.length > 1 ? all : (all[0] ?? null);
    }
  }
  return record;
}

/** Form fields that are ALWAYS arrays (a single value is still an array of one). */
const ARRAY_FIELDS = new Set(['checklist', 'dependencies']);

/**
 * Parse a raw FormData body against a schema. Returns the first Zod issue
 * message on failure (they are already user-facing English strings).
 */
export function parseFormData<T extends z.ZodTypeAny>(
  schema: T,
  form: FormData,
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  const result = schema.safeParse(formToRecord(form));
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid input.' };
  }
  return { ok: true, data: result.data };
}

// ───────────────────────────── Schemas ─────────────────────────────

/** POST /login — username + password presence/shape. */
export const loginInputSchema = z.object({
  username: z
    .string({ required_error: 'Username is required.' })
    .trim()
    .min(1, 'Username is required.')
    .max(100),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.')
    .max(200),
});

/** Normalize an empty/missing department to the 'QC' default (per spec). */
const departmentValue = (v: unknown): unknown => (v === '' || v == null ? 'QC' : v);

/** Normalize empty/missing recurrence to 'none'. */
const recurrenceValue = (v: unknown): unknown => (v === '' || v == null ? 'none' : v);

/** Normalize empty/missing recurrence end date to null. */
const endDateValue = (v: unknown): unknown => (v === '' || v == null ? null : v);

/** Task creation (/manager/new, /supervisor/new, /employee/new). */
export const taskCreateInputSchema = z.object({
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(1, 'Title is required.')
    .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`),
  description: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z
      .string()
      .trim()
      .max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`)
      .nullable(),
  ),
  department: z.preprocess(
    departmentValue,
    z
      .string()
      .trim()
      .min(1, 'Department is required.')
      .max(MAX_DEPARTMENT_LENGTH, `Department must be ${MAX_DEPARTMENT_LENGTH} characters or fewer.`),
  ),
  priority: z.preprocess(
    (v) => (v === '' || v == null ? 'medium' : v),
    z.enum(TASK_PRIORITIES as [TaskPriority, ...TaskPriority[]], {
      errorMap: () => ({ message: 'Invalid priority value.' }),
    }),
  ),
  assigned_to: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid assignee.' }) })
      .int()
      .positive()
      .nullable(),
  ),
  due_date: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be a valid date (YYYY-MM-DD).')
      .nullable(),
  ),
  recurrence: z.preprocess(
    recurrenceValue,
    z.enum(TASK_RECURRENCES as [TaskRecurrence, ...TaskRecurrence[]], {
      errorMap: () => ({ message: 'Invalid recurrence value.' }),
    }),
  ),
  recurrence_end_date: z.preprocess(
    endDateValue,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Recurrence end date must be a valid date (YYYY-MM-DD).')
      .nullable(),
  ),
  checklist: z.preprocess(
    (v) =>
      Array.isArray(v)
        ? v.map((s) => String(s).trim()).filter((s) => s.length > 0)
        : [],
    z
      .array(
        z
          .string({ errorMap: () => ({ message: 'Checklist items must be text.' }) })
          .max(
            MAX_CHECKLIST_TITLE_LENGTH,
            `Checklist items must be ${MAX_CHECKLIST_TITLE_LENGTH} characters or fewer.`,
          ),
      )
      .max(MAX_CHECKLIST_ITEMS, `A task can have at most ${MAX_CHECKLIST_ITEMS} checklist items.`),
  ),
  dependencies: z.preprocess(
    (v) => (Array.isArray(v) ? v.map((x) => Number(x)) : []),
    z
      .array(
        z
          .number({ errorMap: () => ({ message: 'Invalid dependency task id.' }) })
          .int()
          .positive(),
      )
      .max(MAX_DEPENDENCIES, `A task can depend on at most ${MAX_DEPENDENCIES} tasks.`),
  ),
});

/** POST /api/tasks/[id]/comment. */
export const commentSchema = z.object({
  comment: z
    .string({ required_error: 'Comment cannot be empty.' })
    .trim()
    .min(1, 'Comment cannot be empty.')
    .max(MAX_COMMENT_LENGTH, `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`),
});

/** POST /api/tasks/[id]/delete-request — optional reason (max length only). */
export const deleteRequestSchema = z.object({
  reason: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z
      .string()
      .trim()
      .max(MAX_REASON_LENGTH, `Reason must be ${MAX_REASON_LENGTH} characters or fewer.`)
      .nullable(),
  ),
});

/**
 * POST /manager/requests/api — approve/reject a delete request. The reviewer
 * note is optional ("rejection may include a reason") and normalized to null
 * when empty; it is persisted on the request row, logged, and notified.
 */
export const deleteReviewSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Invalid action.' }),
  }),
  request_id: z.preprocess(
    (v) => (v === '' || v == null ? NaN : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid request.' }) })
      .int()
      .positive(),
  ),
  review_note: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z
      .string()
      .trim()
      .max(MAX_REASON_LENGTH, `Review note must be ${MAX_REASON_LENGTH} characters or fewer.`)
      .nullable(),
  ),
});

// Max length for the free-text department field — canonical value lives in
// task-policy.ts; re-exported here for back-compat with existing importers.
export { MAX_DEPARTMENT_LENGTH } from './task-policy';

/**
 * Normalize an unchecked checkbox / missing FormData value into a boolean.
 * FormData omits unchecked checkboxes entirely, so missing/'' becomes false.
 */
const checkboxBool = (v: unknown): boolean => v === '1' || v === true || v === 1;

/** Admin user creation (validates the already-shaped CreateUserInput object). */
export const userCreateSchema = z.object({
  username: z
    .string({ required_error: 'Username is required.' })
    .trim()
    .min(1, 'Username is required.')
    .max(MAX_USERNAME_LENGTH, `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Username may only contain letters, numbers, _ . and -.',
    ),
  fullName: z.string({ required_error: 'Full name is required.' }).trim().min(1, 'Full name is required.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
  role: z.enum(['admin', 'manager', 'supervisor', 'employee'], {
    errorMap: () => ({ message: 'Invalid role.' }),
  }),
  department: z.preprocess(
    departmentValue,
    z
      .string()
      .trim()
      .min(1, 'Department is required.')
      .max(MAX_DEPARTMENT_LENGTH, `Department must be ${MAX_DEPARTMENT_LENGTH} characters or fewer.`),
  ),
  canCreateTasks: z.boolean(),
});

/**
 * Admin user edit (full name, role, department, can_create_tasks, is_active).
 * Username is deliberately absent — it is immutable after creation. Checkbox
 * fields follow FormData semantics (unchecked → absent → false).
 */
export const userEditSchema = z.object({
  fullName: z.string({ required_error: 'Full name is required.' }).trim().min(1, 'Full name is required.'),
  role: z.enum(['admin', 'manager', 'supervisor', 'employee'], {
    errorMap: () => ({ message: 'Invalid role.' }),
  }),
  department: z.preprocess(
    departmentValue,
    z
      .string()
      .trim()
      .min(1, 'Department is required.')
      .max(MAX_DEPARTMENT_LENGTH, `Department must be ${MAX_DEPARTMENT_LENGTH} characters or fewer.`),
  ),
  canCreateTasks: z.preprocess(checkboxBool, z.boolean()),
  isActive: z.preprocess(checkboxBool, z.boolean()),
});

/** Admin password reset. */
export const passwordResetSchema = z.object({
  newPassword: z
    .string({ required_error: 'Password is required.' })
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
});

/**
 * POST /api/filters — save or delete a per-user saved search filter.
 * `name` (save) and `filter_id` (delete) are optional per action; the schema
 * accepts both shapes and the handler validates per action. `next` is the
 * same-origin redirect target after the POST (validated at the handler).
 */
export const savedFilterSchema = z.object({
  action: z.enum(['save', 'delete'], {
    errorMap: () => ({ message: 'Invalid action.' }),
  }),
  name: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z
      .string()
      .trim()
      .max(MAX_SAVED_FILTER_NAME, `Saved filter name must be ${MAX_SAVED_FILTER_NAME} characters or fewer.`)
      .nullable(),
  ),
  filter_json: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.string().max(MAX_SAVED_FILTER_JSON, 'Saved filter payload is too large.').nullable(),
  ),
  filter_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid saved filter.' }) })
      .int()
      .positive()
      .nullable(),
  ),
  next: z.preprocess(
    (v) => (v === '' || v == null ? '/' : v),
    z.string().max(500, 'Redirect target is too long.').nullable(),
  ),
});
