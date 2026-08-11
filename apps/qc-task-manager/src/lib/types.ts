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
export type TaskStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed';
// priority values match the tasks.priority CHECK constraint in db/schema.sql.
export type TaskPriority = 'low' | 'medium' | 'high';
export type DeleteRequestStatus = 'pending' | 'approved' | 'rejected';

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
  status: TaskStatus;
  priority: TaskPriority;
  progress_percent: number;
  created_by: number;
  assigned_to: number | null;
  due_date: string | null;
  blocker_note: string | null;
  completed_at: string | null;
  completed_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
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
  uploaded_at: string;
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
