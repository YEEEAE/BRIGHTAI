// Shared domain types for QC Task Manager.

export type Role = 'admin' | 'manager' | 'supervisor' | 'employee';

export type TaskStatus = 'Open' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type DeleteRequestStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  role: Role;
  can_create_tasks: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Fields an employee is allowed to edit after creation (CORE BUSINESS RULE #2). */
export const EMPLOYEE_EDITABLE_FIELDS = [
  'status',
  'progress_percent',
  'blocker_note',
] as const;

/** Fields locked for employees after creation. */
export const EMPLOYEE_LOCKED_FIELDS = [
  'title',
  'description',
  'assigned_to',
  'due_date',
  'priority',
] as const;

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress_percent: number;
  assigned_to: number | null;
  created_by: number;
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
  body: string;
  is_closure: boolean;
  created_at: string;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  uploaded_by: number;
  filename: string;
  mime_type: string;
  size_bytes: number;
  content: Buffer;
  created_at: string;
}

export interface ActivityLogEntry {
  id: number;
  task_id: number;
  user_id: number | null;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface DeleteRequest {
  id: number;
  task_id: number;
  requested_by: number;
  reason: string;
  status: DeleteRequestStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
}

/** Session payload stored in the `sessions` table and signed into the cookie. */
export interface SessionData {
  userId: number;
  username: string;
  role: Role;
  fullName: string;
}
