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
  MAX_QC_METADATA_LENGTH,
  FINDING_CLASSIFICATIONS,
  RISK_LEVELS,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  TASK_PRIORITIES,
  TASK_RECURRENCES,
} from './task-policy';
import { MAX_COMMENT_LENGTH } from './format';
import {
  LAB_CONNECTOR_TYPES,
  LAB_DOCUMENT_CHANGE_SUMMARY_MAX,
  LAB_DOCUMENT_CODE_MAX,
  LAB_DOCUMENT_CONTENT_MAX,
  LAB_DOCUMENT_DESCRIPTION_MAX,
  LAB_DOCUMENT_TITLE_MAX,
  LAB_MAINTENANCE_STATUSES,
  LAB_MEASUREMENT_MAX,
  LAB_PART_NAME_MAX,
  LAB_REMARKS_MAX,
  LAB_SAMPLE_COUNT_DEFAULT,
  LAB_SAMPLE_COUNT_MAX,
  LAB_SAMPLE_COUNT_MIN,
  LAB_SHORT_TEXT_MAX,
} from './lab/policy';
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

/** Route identifiers are untrusted input just like form fields. */
export const positiveIdSchema = z.coerce.number().int().positive();

export function parsePositiveId(value: string | undefined): number | null {
  const result = positiveIdSchema.safeParse(value);
  return result.success ? result.data : null;
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
const optionalMeta = (v: unknown): unknown => (v === '' || v == null ? null : v);

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
  inspection_type: z.preprocess(optionalMeta, z.string().trim().max(MAX_QC_METADATA_LENGTH).nullable()),
  finding_classification: z.preprocess(optionalMeta, z.enum(FINDING_CLASSIFICATIONS as [string, ...string[]]).nullable()),
  risk_level: z.preprocess(optionalMeta, z.enum(RISK_LEVELS as [string, ...string[]]).nullable()),
  corrective_action_required: z.preprocess((v) => (v === '' || v == null ? null : v === '1' || v === 1 ? 1 : v === '0' || v === 0 ? 0 : v), z.number().int().min(0).max(1).nullable()),
  reference_number: z.preprocess(optionalMeta, z.string().trim().max(MAX_QC_METADATA_LENGTH).nullable()),
  audit_batch_or_work_order: z.preprocess(optionalMeta, z.string().trim().max(MAX_QC_METADATA_LENGTH).nullable()),
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

/** Shared shape guards for task mutation forms; domain transition rules remain
 * in taskUpdates after this input boundary. Unknown fields are retained for
 * checklist/dependency controls and validated by their dedicated handlers. */
const optionalText = (max: number) => z.preprocess((v) => (v == null ? undefined : String(v)), z.string().trim().max(max).optional());
const optionalInt = z.preprocess((v) => (v == null || v === '' ? undefined : Number(v)), z.number().int().optional());
export const taskUpdateInputSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']).optional(),
  progress_percent: z.preprocess((v) => (v == null || v === '' ? undefined : Number(v)), z.number().min(0).max(100).optional()),
  blocker_note: optionalText(2000),
  title: optionalText(MAX_TITLE_LENGTH),
  description: optionalText(MAX_DESCRIPTION_LENGTH),
  assigned_to: optionalInt,
  due_date: z.preprocess((v) => (v == null || v === '' ? undefined : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  priority: z.enum(TASK_PRIORITIES as [TaskPriority, ...TaskPriority[]]).optional(),
}).passthrough();

export const closeTaskInputSchema = z.object({
  completion_comment: z.string().trim().min(1).max(MAX_COMMENT_LENGTH),
  skip_evidence: z.enum(['0', '1']).optional(),
}).passthrough();

export const cancelTaskInputSchema = z.object({
  reason: z.string().trim().min(1).max(MAX_REASON_LENGTH),
}).passthrough();

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

const qcText = (max = 5000) => z.string().trim().min(1).max(max);
export const findingCreateSchema = z.object({
  finding_number: qcText(80), task_id: z.coerce.number().int().positive(), inspection_type: qcText(200),
  classification: z.enum(['conforming','observation','minor','major','critical']),
  severity: z.enum(['low','medium','high','critical']), risk_description: qcText(),
  requirement_reference: z.string().trim().max(500).nullable().optional(), owner: z.coerce.number().int().positive(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});
export const findingUpdateSchema = findingCreateSchema.partial().omit({ finding_number: true, task_id: true });
export const findingActionSchema = z.object({ action: z.enum(['status','approve','reject','close','reopen']), status: z.string().optional(), note: z.string().trim().max(5000).optional(), closure_evidence: z.string().trim().max(5000).optional() });
export const rcaSchema = z.object({ method: z.enum(['5_WHYS','FISHBONE','FREE_FORM']), free_form: z.string().trim().max(5000).optional(), why_1: z.string().trim().max(1000).optional(), why_2: z.string().trim().max(1000).optional(), why_3: z.string().trim().max(1000).optional(), why_4: z.string().trim().max(1000).optional(), why_5: z.string().trim().max(1000).optional(), fishbone_json: z.string().max(5000).optional() });
export const capaSchema = z.object({ problem_statement: qcText(), root_cause: qcText(), corrective_action: qcText(), preventive_action: qcText(), owner: z.coerce.number().int().positive(), due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), evidence: z.string().trim().max(5000).optional(), effectiveness_check: z.string().trim().max(5000).optional() });
export const capaActionSchema = z.object({ status: z.enum(['OPEN','IMPLEMENTATION','VERIFICATION','EFFECTIVE','CLOSED','REOPENED']), decision: z.string().trim().max(5000).optional() });
export const evidenceSchema = z.object({ description: qcText(5000), reference: z.string().trim().max(1000).optional(), capa_id: z.coerce.number().int().positive().optional() });

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
 * POST /api/lab/tests/[id]/review — Review Center actions (PROMPT 07, page
 * reference §26). `reason` is required for reject and request_changes (a
 * reviewer must always say why — §22); it is optional and ignored for
 * start_review and approve. Action values are resolved server-side; the body
 * can never inject a state machine transition (only these four are allowed).
 */
export const labReviewActionSchema = z
  .object({
    action: z.enum(['start_review', 'request_changes', 'reject', 'approve'], {
      errorMap: () => ({ message: 'Invalid review action.' }),
    }),
    reason: z.preprocess(
      (v) => (v === '' || v == null ? null : v),
      z
        .string()
        .trim()
        .max(MAX_REASON_LENGTH, `Reason must be ${MAX_REASON_LENGTH} characters or fewer.`)
        .nullable(),
    ),
  })
  .superRefine((data, ctx) => {
    if ((data.action === 'reject' || data.action === 'request_changes') && !data.reason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A reason is required for this action.' });
    }
  });

/**
 * POST /lab/products/new + /lab/products/[id]/edit — Product Master form
 * (PROMPT 08). `equipment_ids` (the "Related Equipment" checkboxes) is NOT
 * part of this schema: FormData repeats that key per checkbox, so the handler
 * collects it from the raw form and the service re-validates existence.
 * The product id itself always comes from the matched path, never the body.
 */
export const labProductSchema = z.object({
  name: z.preprocess(
    (v) => (v == null ? '' : String(v).trim()),
    z
      .string()
      .min(1, 'Product Name is required.')
      .max(LAB_SHORT_TEXT_MAX, `Product Name must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`),
  ),
  code: z.preprocess(
    (v) => (v == null ? '' : String(v).trim()),
    z
      .string()
      .min(1, 'Product Code is required.')
      .max(60, 'Product Code must be 60 characters or fewer.')
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Product Code may only contain letters, numbers, _ . and -, and must start with a letter or number.'),
  ),
  description: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z.string().max(2000, 'Product Description must be 2000 characters or fewer.').nullable(),
  ),
  connector_type: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z
      .enum([...LAB_CONNECTOR_TYPES] as [string, ...string[]], {
        errorMap: () => ({ message: 'Invalid connector type.' }),
      })
      .nullable(),
  ),
  default_test_type: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.enum(['air', 'vacuum'], { errorMap: () => ({ message: 'Invalid default test type.' }) }).nullable(),
  ),
  default_template_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid test template.' }) })
      .int()
      .positive()
      .nullable(),
  ),
  applicable_sop_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid SOP document.' }) })
      .int()
      .positive()
      .nullable(),
  ),
  applicable_wi_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid WI document.' }) })
      .int()
      .positive()
      .nullable(),
  ),
  is_active: z.preprocess(checkboxBool, z.boolean()),
  notes: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z.string().max(LAB_REMARKS_MAX, `Notes must be ${LAB_REMARKS_MAX} characters or fewer.`).nullable(),
  ),
});

/**
 * POST /lab/equipment/new + /lab/equipment/[id]/edit — Laboratory equipment
 * registry form (PROMPT 11).
 *
 * The equipment code is deliberately NOT pattern-restricted like product /
 * template codes: the canonical registry carries codes such as "-" and
 * "BSS-250N, 250N" that a strict regex would reject, and it is company data
 * (A2). serial_number is free text (accepts "-", "DOA-P104-AA",
 * "1-800-5556-3484"). status_raw is free text preserved verbatim — the
 * English display mapping is read-time only (equipmentStatus.ts).
 * `form_action` (save|archive|restore) is read from the raw form by the
 * handler, never validated here. The equipment id comes from the matched
 * path, never the body.
 */
export const labEquipmentSchema = z.object({
  name: z.preprocess(
    (v) => (v == null ? '' : String(v).trim()),
    z
      .string()
      .min(1, 'Equipment Name is required.')
      .max(LAB_SHORT_TEXT_MAX, `Equipment Name must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`),
  ),
  code: z.preprocess(
    (v) => (v == null ? '' : String(v).trim()),
    z
      .string()
      .min(1, 'Equipment Code is required.')
      .max(LAB_SHORT_TEXT_MAX, `Equipment Code must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`),
  ),
  location: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z.string().max(LAB_SHORT_TEXT_MAX, `Location must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`).nullable(),
  ),
  status_raw: z.preprocess(
    (v) => (v == null ? '' : String(v).trim()),
    z
      .string()
      .min(1, 'Status is required.')
      .max(LAB_SHORT_TEXT_MAX, `Status must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`),
  ),
  calibration_status_raw: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z
      .enum(['yes', 'no'], { errorMap: () => ({ message: 'Invalid calibration status.' }) })
      .nullable(),
  ),
  serial_number: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z.string().max(LAB_SHORT_TEXT_MAX, `Serial Number must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`).nullable(),
  ),
  notes: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z.string().max(LAB_REMARKS_MAX, `Notes must be ${LAB_REMARKS_MAX} characters or fewer.`).nullable(),
  ),
});

/**
 * POST /api/lab/equipment/[id]/maintenance — add an append-only maintenance
 * event (page reference §36). `maintenance_date`, `issue`, `maintenance_type`
 * and `technician_vendor` are required; `description` and `notes` are free
 * text; `status` is the controlled enum from lab/policy.ts; `completed_date`
 * is required when the event is COMPLETED (that completion is what the
 * equipment timeline reports as "returned to service") and must not precede
 * the maintenance date. The equipment id always comes from the matched path,
 * never the body. Maintenance events are never edited or deleted — every
 * event is audited once at creation.
 */
export const labMaintenanceSchema = z
  .object({
    maintenance_date: z.preprocess(
      (v) => (v == null ? '' : String(v).trim()),
      z
        .string()
        .min(1, 'Maintenance Date is required.')
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Maintenance Date must be a valid date (YYYY-MM-DD).'),
    ),
    issue: z.preprocess(
      (v) => (v == null ? '' : String(v).trim()),
      z
        .string()
        .min(1, 'Issue is required.')
        .max(LAB_SHORT_TEXT_MAX, `Issue must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`),
    ),
    maintenance_type: z.preprocess(
      (v) => (v == null ? '' : String(v).trim()),
      z
        .string()
        .min(1, 'Maintenance Type is required.')
        .max(LAB_SHORT_TEXT_MAX, `Maintenance Type must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`),
    ),
    description: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z.string().max(LAB_REMARKS_MAX, `Description must be ${LAB_REMARKS_MAX} characters or fewer.`).nullable(),
    ),
    technician_vendor: z.preprocess(
      (v) => (v == null ? '' : String(v).trim()),
      z
        .string()
        .min(1, 'Technician / Vendor is required.')
        .max(LAB_SHORT_TEXT_MAX, `Technician / Vendor must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`),
    ),
    status: z.preprocess(
      (v) => (v == null ? '' : String(v).trim()),
      z.enum([...LAB_MAINTENANCE_STATUSES] as [string, ...string[]], {
        errorMap: () => ({ message: 'Invalid maintenance status.' }),
      }),
    ),
    completed_date: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Completed Date must be a valid date (YYYY-MM-DD).')
        .nullable(),
    ),
    notes: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z.string().max(LAB_REMARKS_MAX, `Notes must be ${LAB_REMARKS_MAX} characters or fewer.`).nullable(),
    ),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === 'COMPLETED' && !data.completed_date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Completed Date is required when the maintenance is completed.' });
    }
    if (data.completed_date && data.completed_date < data.maintenance_date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Completed Date cannot be before the Maintenance Date.' });
    }
  });

/**
 * POST /lab/calibration/new + /lab/calibration/[id]/edit — Calibration Register
 * (page reference §37). Only `equipment_id` is required; every other field is
 * nullable on purpose (missing data stays missing — never auto-filled). Dates
 * are YYYY-MM-DD, free text is bounded, and `.strict()` rejects unknown keys
 * (mass-assignment guard). The calibration record id always comes from the
 * matched path, never the body. `next_due_at` must not precede
 * `calibration_due_at` when both are present.
 */
export const labCalibrationSchema = z
  .object({
    equipment_id: z.preprocess(
      (v) => (v === '' || v == null ? null : Number(v)),
      z
        .number({ errorMap: () => ({ message: 'Equipment is required.' }) })
        .int()
        .positive('Equipment is required.'),
    ),
    last_calibrated_at: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Last Calibration Date must be a valid date (YYYY-MM-DD).')
        .nullable(),
    ),
    calibration_due_at: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Calibration Due Date must be a valid date (YYYY-MM-DD).')
        .nullable(),
    ),
    provider: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z.string().max(LAB_SHORT_TEXT_MAX, `Calibration Provider must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`).nullable(),
    ),
    certificate_reference: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z.string().max(LAB_SHORT_TEXT_MAX, `Certificate Reference must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`).nullable(),
    ),
    result: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z.string().max(LAB_SHORT_TEXT_MAX, `Calibration Result must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`).nullable(),
    ),
    next_due_at: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Next Due Date must be a valid date (YYYY-MM-DD).')
        .nullable(),
    ),
    notes: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z.string().max(LAB_REMARKS_MAX, `Notes must be ${LAB_REMARKS_MAX} characters or fewer.`).nullable(),
    ),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.calibration_due_at && data.next_due_at && data.next_due_at < data.calibration_due_at) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Next Due Date cannot be before the Calibration Due Date.' });
    }
  });

/**
 * POST /lab/documents/new + /lab/documents/[id]/edit — SOP/WI Document Editor
 * (page reference §40). Identity fields (type/code/title/description/product/
 * owner/dates) live on lab_documents; the content + change summary live on the
 * current lab_document_versions row (or a NEW version when editing an APPROVED
 * document). `equipment_ids` (the "Related Equipment" checkboxes) is NOT part
 * of this schema: FormData repeats that key per checkbox, so the handler
 * collects it from the raw form and the service re-validates existence. Like
 * labProductSchema, unknown keys are stripped (the parsed `data` only ever
 * carries schema fields), and the document id always comes from the matched
 * path, never the body.
 */
export const labDocumentSchema = z
  .object({
    type: z.preprocess(
      (v) => (v == null ? '' : String(v).trim()),
      z.enum(['SOP', 'WI'], { errorMap: () => ({ message: 'Invalid document type.' }) }),
    ),
    code: z.preprocess(
      (v) => (v == null ? '' : String(v).trim()),
      z
        .string()
        .min(1, 'Document Code is required.')
        .max(LAB_DOCUMENT_CODE_MAX, `Document Code must be ${LAB_DOCUMENT_CODE_MAX} characters or fewer.`)
        .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Document Code may only contain letters, numbers, _ . and -, and must start with a letter or number.'),
    ),
    title: z.preprocess(
      (v) => (v == null ? '' : String(v).trim()),
      z
        .string()
        .min(1, 'Document Title is required.')
        .max(LAB_DOCUMENT_TITLE_MAX, `Document Title must be ${LAB_DOCUMENT_TITLE_MAX} characters or fewer.`),
    ),
    description: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z.string().max(LAB_DOCUMENT_DESCRIPTION_MAX, `Description must be ${LAB_DOCUMENT_DESCRIPTION_MAX} characters or fewer.`).nullable(),
    ),
    product_id: z.preprocess(
      (v) => (v === '' || v == null ? null : Number(v)),
      z
        .number({ errorMap: () => ({ message: 'Invalid product reference.' }) })
        .int()
        .positive()
        .nullable(),
    ),
    owner_id: z.preprocess(
      (v) => (v === '' || v == null ? null : Number(v)),
      z
        .number({ errorMap: () => ({ message: 'Invalid owner.' }) })
        .int()
        .positive()
        .nullable(),
    ),
    effective_date: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective Date must be a valid date (YYYY-MM-DD).')
        .nullable(),
    ),
    review_due_date: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Review Due Date must be a valid date (YYYY-MM-DD).')
        .nullable(),
    ),
    change_summary: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z.string().max(LAB_DOCUMENT_CHANGE_SUMMARY_MAX, `Change Summary must be ${LAB_DOCUMENT_CHANGE_SUMMARY_MAX} characters or fewer.`).nullable(),
    ),
    content: z.preprocess(
      (v) => (v === '' || v == null ? '' : String(v)),
      z
        .string()
        .max(LAB_DOCUMENT_CONTENT_MAX, `Document content must be ${LAB_DOCUMENT_CONTENT_MAX} characters or fewer.`),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.content.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Document content is required.' });
    }
    if (data.effective_date && data.review_due_date && data.review_due_date < data.effective_date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Review Due Date cannot be before the Effective Date.' });
    }
  });

/**
 * POST /lab/templates/new + /lab/templates/[id]/edit — Test Template form
 * (PROMPT 10). `equipment_ids` (the "Equipment Compatibility" checkboxes)
 * and `connector_choices` (repeated key per printed connector option) are NOT
 * part of this schema: FormData repeats those keys, so the handler collects
 * them from the raw form and the service re-validates existence/membership.
 * The template id always comes from the matched path, never the body.
 * Reference parameter strings are free-form display text (max 200 chars) —
 * the printed defaults come from lab/policy.ts, but a template may carry the
 * company-approved variant verbatim (never invented).
 */
export const labTemplateSchema = z.object({
  name: z.preprocess(
    (v) => (v == null ? '' : String(v).trim()),
    z
      .string()
      .min(1, 'Template Name is required.')
      .max(LAB_SHORT_TEXT_MAX, `Template Name must be ${LAB_SHORT_TEXT_MAX} characters or fewer.`),
  ),
  code: z.preprocess(
    (v) => (v == null ? '' : String(v).trim()),
    z
      .string()
      .min(1, 'Template Code is required.')
      .max(60, 'Template Code must be 60 characters or fewer.')
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Template Code may only contain letters, numbers, _ . and -, and must start with a letter or number.'),
  ),
  test_type: z.preprocess(
    (v) => (v == null || v === '' ? 'air' : v),
    z.enum(['air', 'vacuum'], { errorMap: () => ({ message: 'Invalid test type.' }) }),
  ),
  default_sample_count: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Default sample count must be a number.' }) })
      .int('Default sample count must be a whole number.')
      .min(LAB_SAMPLE_COUNT_MIN, `Default sample count must be at least ${LAB_SAMPLE_COUNT_MIN}.`)
      .max(LAB_SAMPLE_COUNT_MAX, `Default sample count must be at most ${LAB_SAMPLE_COUNT_MAX}.`)
      .nullable(),
  ),
  standard_parameter: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z.string().max(200, 'Standard Parameter must be 200 characters or fewer.').nullable(),
  ),
  acceptance_criteria: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z.string().max(200, 'Acceptance Criteria must be 200 characters or fewer.').nullable(),
  ),
  holding_time: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z.string().max(200, 'Holding Time must be 200 characters or fewer.').nullable(),
  ),
  actual_pressure_reference: z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z.string().max(200, 'Actual Pressure reference must be 200 characters or fewer.').nullable(),
  ),
  applicable_product_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid applicable product.' }) })
      .int()
      .positive()
      .nullable(),
  ),
  applicable_equipment_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid primary equipment.' }) })
      .int()
      .positive()
      .nullable(),
  ),
  sop_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid SOP document.' }) })
      .int()
      .positive()
      .nullable(),
  ),
  wi_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z
      .number({ errorMap: () => ({ message: 'Invalid WI document.' }) })
      .int()
      .positive()
      .nullable(),
  ),
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

// ─────────────────────────── Task Templates ───────────────────────────
// The structured JSON columns (checklist/evidence_requirements/finding_defaults/
// assignment_rules) arrive from the admin form as JSON strings produced by the
// editor islands. The Zod layer validates the scalar fields + JSON shape; the
// deep domain validation (duplicates, extension allowlists, enum membership)
// runs in templatesStore.validateTemplateConfig where richer errors live.

/** Parse a JSON string field into an object/array, tolerating empty input. */
function jsonField<T>(fallback: T) {
  return z.preprocess((v) => {
    if (v === '' || v == null) return fallback;
    if (typeof v !== 'string') return v;
    try {
      return JSON.parse(v);
    } catch {
      return fallback;
    }
  }, z.unknown());
}

/** Scalar fields shared by create + edit. Code is omitted on edit (immutable). */
const templateScalarFields = {
  title: z.preprocess(
    (v) => (v === '' || v == null ? '' : String(v).trim()),
    z.string().min(1, 'Template title is required.').max(200, 'Title must be 200 characters or fewer.'),
  ),
  description: z.preprocess(
    (v) => (v === '' || v == null ? '' : String(v).trim()),
    z.string().max(5000, 'Description must be 5000 characters or fewer.').optional(),
  ),
  department: z.preprocess(departmentValue, z.string().trim().min(1, 'Department is required.').max(50)),
  priority: z.preprocess(
    (v) => (v === '' || v == null ? 'medium' : v),
    z.enum(TASK_PRIORITIES as [TaskPriority, ...TaskPriority[]], {
      errorMap: () => ({ message: 'Invalid priority value.' }),
    }),
  ),
  task_type: z.preprocess(optionalMeta, z.string().trim().max(200).nullable()),
  recurrence: z.preprocess(recurrenceValue, z.enum(TASK_RECURRENCES as [TaskRecurrence, ...TaskRecurrence[]], {
    errorMap: () => ({ message: 'Invalid recurrence value.' }),
  })),
  sla_policy_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().int().positive().nullable(),
  ),
  checklist_json: jsonField([]),
  evidence_requirements_json: jsonField([]),
  finding_defaults_json: jsonField({}),
  assignment_rules_json: jsonField({}),
};

/** Template creation. `code` is required and must be a kebab-case slug. */
export const templateCreateSchema = z
  .object({
    code: z
      .preprocess((v) => (v == null ? '' : String(v).trim().toLowerCase()), z.string())
      .refine((c) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c) && c.length <= 60, {
        message: 'Code must be lowercase kebab-case (letters, digits, hyphens).',
      }),
    ...templateScalarFields,
  })
  .passthrough();

/** Template edit — `code` is immutable, all other fields are optional. */
export const templateEditSchema = z.object({ ...templateScalarFields }).passthrough();

/** Template lifecycle action. */
export const templateLifecycleSchema = z.object({
  action: z.enum(['activate', 'archive', 'unarchive'], {
    errorMap: () => ({ message: 'Invalid lifecycle action.' }),
  }),
  template_id: z.preprocess(
    (v) => (v === '' || v == null ? NaN : Number(v)),
    z.number({ errorMap: () => ({ message: 'Invalid template.' }) }).int().positive(),
  ),
});

// ─────────────────────────── QC Laboratory test form ───────────────────────────
// Shared AIR/VACUUM test form (PROMPT 05; page reference §§11–19). One schema
// serves both routes: `form_action` distinguishes draft / continue / submit.
// Drafts accept sparse input; submits enforce the printed form's required
// fields plus a complete, bounded sample grid. The sample grid arrives as a
// JSON string (`samples_json`) serialized by the LabTestForm island — the
// server re-parses and re-validates it (never trust the client's shape).

/** Optional measurement cell: empty/missing → null; trimmed, length-bounded. */
function optLabText(max: number, label: string) {
  return z.preprocess(
    (v) => (v === '' || v == null ? null : String(v).trim()),
    z
      .string()
      .max(max, `${label} must be ${max} characters or fewer.`)
      .nullable(),
  );
}

/** One sample row (§16 columns). Measurement cells stay TEXT (D-2) — no units invented. */
export const labTestSampleRowSchema = z.object({
  sample_no: z.coerce.number().int().min(1, 'Sample numbers must be positive.').max(20, 'Sample numbers must be 20 or fewer.'),
  part_name: optLabText(LAB_PART_NAME_MAX, 'Part name'),
  set_pressure: optLabText(LAB_MEASUREMENT_MAX, 'Set Pressure'),
  actual_pressure: optLabText(LAB_MEASUREMENT_MAX, 'Actual Pressure'),
  volume_sec: optLabText(LAB_MEASUREMENT_MAX, 'Volume'),
  pressure_difference: optLabText(LAB_MEASUREMENT_MAX, 'Pressure Difference'),
  holding_time_sec: optLabText(LAB_MEASUREMENT_MAX, 'Holding Time'),
  leakage_rate: optLabText(LAB_MEASUREMENT_MAX, 'Leakage Rate'),
  result: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z
      .enum(['PASS', 'FAIL', 'HOLD'], {
        errorMap: () => ({ message: 'Invalid sample result.' }),
      })
      .nullable(),
  ),
});

/**
 * Parse the island's samples_json string into an array (max 20 rows — the DB
 * CHECK bounds sample_count the same way; no arbitrary grid growth).
 */
const samplesField = z.preprocess(
  (v) => {
    if (v === '' || v == null) return [];
    if (typeof v !== 'string') return v;
    try {
      const parsed: unknown = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  z
    .array(labTestSampleRowSchema)
    .max(LAB_SAMPLE_COUNT_MAX, `A test can have at most ${LAB_SAMPLE_COUNT_MAX} samples.`)
    .nullable()
    .refine((rows) => rows !== null, 'Samples payload is invalid.'),
);

/** Submit-level presence check (fields the printed form marks Required, §11). */
function labRequired(v: unknown): boolean {
  return v != null && String(v).trim() !== '';
}

/**
 * POST /lab/tests/new — the shared form body. `test_type` is deliberately NOT
 * here: it is resolved from the query parameter only (hidden-field
 * manipulation cannot change the test type, page reference §66).
 */
export const labTestFormSchema = z
  .object({
    form_action: z.enum(['draft', 'continue', 'submit'], {
      errorMap: () => ({ message: 'Invalid form action.' }),
    }),
    product_description: optLabText(LAB_SHORT_TEXT_MAX, 'Product Description'),
    connector_type: z.preprocess(
      (v) => (v === '' || v == null ? null : String(v).trim()),
      z
        .enum([...LAB_CONNECTOR_TYPES] as [string, ...string[]], {
          errorMap: () => ({ message: 'Invalid connector type.' }),
        })
        .nullable(),
    ),
    sample_count: z.preprocess(
      (v) => (v === '' || v == null ? LAB_SAMPLE_COUNT_DEFAULT : v),
      z.coerce
        .number({ errorMap: () => ({ message: 'No. of Samples Tested must be a number.' }) })
        .int()
        .min(LAB_SAMPLE_COUNT_MIN, `No. of Samples Tested must be between ${LAB_SAMPLE_COUNT_MIN} and ${LAB_SAMPLE_COUNT_MAX}.`)
        .max(LAB_SAMPLE_COUNT_MAX, `No. of Samples Tested must be between ${LAB_SAMPLE_COUNT_MIN} and ${LAB_SAMPLE_COUNT_MAX}.`),
    ),
    lot_number: optLabText(LAB_SHORT_TEXT_MAX, 'Lot Number'),
    sampling_area: optLabText(LAB_SHORT_TEXT_MAX, 'Sampling Area'),
    equipment_id: z.preprocess(
      (v) => (v === '' || v == null ? null : Number(v)),
      z
        .number({ errorMap: () => ({ message: 'Invalid machine.' }) })
        .int()
        .positive()
        .nullable(),
    ),
    medium_used: optLabText(LAB_SHORT_TEXT_MAX, 'Medium Used'),
    actual_pressure: optLabText(LAB_MEASUREMENT_MAX, 'Actual Pressure'),
    torque_in_lb: optLabText(LAB_MEASUREMENT_MAX, 'Torque'),
    time_sec: optLabText(LAB_MEASUREMENT_MAX, 'Time'),
    angle: optLabText(LAB_SHORT_TEXT_MAX, 'Angle'),
    temperature_measured: optLabText(LAB_MEASUREMENT_MAX, 'Temperature'),
    samples_json: samplesField,
    remarks: optLabText(LAB_REMARKS_MAX, 'Remarks'),
    final_result: z.preprocess(
      (v) => (v === '' || v == null ? null : v),
      z
        .enum(['PASS', 'FAIL', 'HOLD'], {
          errorMap: () => ({ message: 'Invalid final result.' }),
        })
        .nullable(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.form_action !== 'submit') return;
    const need = (value: unknown, label: string) => {
      if (!labRequired(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} is required.` });
      }
    };
    need(data.product_description, 'Product Description');
    need(data.connector_type, 'Connector Type');
    need(data.lot_number, 'Lot Number');
    need(data.sampling_area, 'Sampling Area');
    need(data.equipment_id, 'Machine Name');
    need(data.final_result, 'Final Result');

    // Complete, bounded sample grid: rows 1..sample_count, every row judged
    // by a human (no AI-determined results — page reference §76).
    const rows = data.samples_json ?? [];
    const present = new Set(rows.map((r) => r.sample_no));
    const expected = data.sample_count;
    if (rows.length !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The number of sample rows (${rows.length}) must match No. of Samples Tested (${expected}).`,
      });
    }
    for (let n = LAB_SAMPLE_COUNT_MIN; n <= expected; n += 1) {
      if (!present.has(n)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Sample ${n} result is required.` });
      }
    }
    for (const row of rows) {
      if (row.result == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Sample ${row.sample_no} result is required.` });
      }
    }
  });

/** Instantiate a template into a task. */
export const templateInstantiateSchema = z.object({
  template_id: z.preprocess(
    (v) => (v === '' || v == null ? NaN : Number(v)),
    z.number({ errorMap: () => ({ message: 'Invalid template.' }) }).int().positive(),
  ),
  title: z.preprocess((v) => (v === '' || v == null ? undefined : String(v).trim()), z.string().min(1).max(200).optional()),
  description: z.preprocess((v) => (v === '' || v == null ? undefined : String(v).trim()), z.string().max(5000).optional()),
  assigned_to: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().positive().nullable().optional(),
  ),
  due_date: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be a valid date (YYYY-MM-DD).').nullable().optional(),
  ),
});
