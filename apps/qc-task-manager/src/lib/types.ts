// Shared domain types for QC Task Manager.
// Mirrors db/schema.sql exactly. Keep these in sync with the SQL definitions.

// Field-lock lists are defined canonically in src/lib/task-policy.ts; they are
// re-exported here so type consumers can keep importing from './types'.
export {
  EMPLOYEE_EDITABLE_FIELDS,
  EMPLOYEE_LOCKED_FIELDS,
} from './task-policy';

export type Role = 'admin' | 'manager' | 'supervisor' | 'employee';

// status values match the tasks.status CHECK constraint in db/schema.sql.
export type TaskStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
// priority values match the tasks.priority CHECK constraint in db/schema.sql.
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
// recurrence values match the tasks.recurrence CHECK constraint in db/schema.sql.
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export type DeleteRequestStatus = 'pending' | 'approved' | 'rejected';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type FindingClassification = 'conforming' | 'minor' | 'major' | 'critical' | 'observation';
export type FindingStatus = 'OPEN' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'VERIFICATION' | 'CLOSED' | 'REOPENED';
export type CapaStatus = 'DRAFT' | 'OPEN' | 'IMPLEMENTATION' | 'VERIFICATION' | 'EFFECTIVE' | 'CLOSED' | 'REOPENED';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: Role;
  department: string;
  can_create_tasks: boolean;
  is_active: boolean;
  created_at: string;
}


export interface Task {
  id: number;
  title: string;
  description: string | null;
  department: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress_percent: number;
  created_by: number;
  assigned_to: number | null;
  due_date: string | null;
  blocker_note: string | null;
  recurrence: TaskRecurrence;
  recurrence_end_date: string | null;
  parent_recurring_task_id: number | null;
  started_at: string | null;
  completed_at: string | null;
  completed_by: number | null;
  cancelled_at: string | null;
  cancelled_by: number | null;
  inspection_type: string | null;
  finding_classification: FindingClassification | null;
  risk_level: RiskLevel | null;
  corrective_action_required: number | null;
  reference_number: string | null;
  audit_batch_or_work_order: string | null;
  task_type: string | null;
  sla_policy_id: number | null;
  sla_started_at: string | null;
  sla_due_at: string | null;
  sla_paused_at: string | null;
  sla_elapsed_seconds: number;
  sla_remaining_seconds: number | null;
  sla_percent_used: number;
  sla_status: 'NORMAL' | 'AT_RISK' | 'CRITICAL' | 'BREACHED' | 'PAUSED';
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  /** 1 = the task's completion comment (completion wizard flow). */
  is_completion_comment: number;
  created_at: string;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  uploaded_by: number;
  file_name: string;
  mime_type: string | null;
  file_data: Buffer;
  file_size: number | null;
  /** SHA-256 hex digest of file_data (computed on upload, NULL for legacy rows). */
  file_hash: string | null;
  /** 1 = completion-evidence file (completion wizard), 0 = generic attachment. */
  is_evidence: number;
  uploaded_at: string;
}

/** One row of a task's checklist (task_checklists). */
export interface TaskChecklistItem {
  id: number;
  task_id: number;
  title: string;
  sort_order: number;
  is_completed: boolean;
  completed_by: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface ChecklistProgress {
  total: number;
  completed: number;
  percent: number;
  incomplete: number;
}

/** One row of a task's dependency edge (task_dependencies: task_id → depends_on_task_id). */
export interface TaskDependency {
  task_id: number;
  depends_on_task_id: number;
}

/** A dependency task joined with display fields (for the UI + blocking gate). */
export interface DependencyInfo {
  task_id: number;
  depends_on_task_id: number;
  title: string;
  status: string;
  progress_percent: number;
  due_date: string | null;
}

export interface ActivityLogEntry {
  id: number;
  task_id: number;
  user_id: number;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface DeleteRequest {
  id: number;
  task_id: number;
  requested_by: number;
  reason: string | null;
  /** Optional reviewer note attached at review time (rejection reason). */
  review_note: string | null;
  status: DeleteRequestStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
}

/**
 * Session payload. Only `userId` is authoritative (stored in sessions.user_id).
 * The other fields are convenience lookups derived from the user row, not
 * persisted alongside the session.
 */
export interface SessionData {
  userId: number;
  username: string;
  role: Role;
  fullName: string;
}
