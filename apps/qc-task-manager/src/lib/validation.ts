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
  MAX_DESCRIPTION_LENGTH,
  MAX_REASON_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  TASK_PRIORITIES,
} from './task-policy';
import { MAX_COMMENT_LENGTH } from './format';
import type { TaskPriority } from './types';

// ─────────────────────────── Small helpers ───────────────────────────

/** Map a FormData body to a plain record (files pass through untouched). */
function formToRecord(form: FormData): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const key of form.keys()) {
    const value = form.get(key);
    if (value !== null) record[key] = value;
  }
  return record;
}

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

/** Max length for the free-text department field. */
export const MAX_DEPARTMENT_LENGTH = 50;

/**
 * Normalize an unchecked checkbox / missing FormData value into a boolean.
 * FormData omits unchecked checkboxes entirely, so missing/'' becomes false.
 */
const checkboxBool = (v: unknown): boolean => v === '1' || v === true || v === 1;

/** Normalize an empty/missing department to the 'QC' default (per spec). */
const departmentValue = (v: unknown): unknown => (v === '' || v == null ? 'QC' : v);

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
