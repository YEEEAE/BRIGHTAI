// Shared domain types for QC Task Manager.
// Mirrors db/schema.sql exactly. Keep these in sync with the SQL definitions.

// Field-lock lists are defined canonically in src/lib/task-policy.ts; they are
// re-exported here so type consumers can keep importing from './types'.
export {
  EMPLOYEE_EDITABLE_FIELDS,
  EMPLOYEE_LOCKED_FIELDS,
} from './task-policy';

export type Role = 'admin' | 'manager' | 'supervisor' | 'employee';
export type WorkflowAppliesTo = 'normal' | 'critical';
export type WorkflowInstanceStatus = 'ACTIVE' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
export type WorkflowApprovalType = 'none' | 'review' | 'approval' | 'closure';
export type WorkflowActionType = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CLOSED';

export interface WorkflowStep { id: number; step_key: string; label: string; role: Role; step_order: number; is_required: number; approval_type: WorkflowApprovalType; sla_seconds: number | null; }
export interface WorkflowDefinition { id: number; code: string; name: string; applies_to: WorkflowAppliesTo; version: number; is_active: number; steps: WorkflowStep[]; }
export interface WorkflowInstance { id: number; task_id: number; definition_code: string; definition_version: number; definition_snapshot: WorkflowDefinition; current_step_order: number; status: WorkflowInstanceStatus; created_by: number; created_at: string; updated_at: string; completed_at: string | null; }
export interface WorkflowAction { id: number; instance_id: number; step_order: number; action: WorkflowActionType; previous_state: string; next_state: string; reason: string | null; actor_id: number; acted_at: string; }
export interface WorkloadSummary { user_id: number; full_name: string; department: string; active_tasks: number; overdue: number; at_risk: number; critical: number; on_hold: number; completion_rate: number; average_resolution_seconds: number | null; workload_score: number; }
export interface AssignmentRecommendation { user_id: number; full_name: string; score: number; factors: Record<string, number>; whyRecommended: string[]; workload: WorkloadSummary; }

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
  /** Evidence architecture metadata; nullable for legacy generic attachments. */
  evidence_type: string | null;
  evidence_label: string | null;
  description: string | null;
  source: string;
  collected_by: number | null;
  collected_at: string | null;
  verification_status: 'UNVERIFIED' | 'AI_PENDING' | 'VALID' | 'REJECTED' | 'AI_REVIEWED' | 'HUMAN_VERIFIED';
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

// ─────────────────────── QC Laboratory (lab_* tables) ───────────────────────
// Mirrors db/migrations/011–014. equipment_id is the canonical equipment
// relationship; historical correctness comes from approval-time snapshots.

// test_type values match lab_test_records.test_type / lab_test_templates.test_type CHECKs.
export type LabTestType = 'air' | 'vacuum';
// status values match lab_test_records.status CHECK (migration 012).
export type LabTestStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REJECTED' | 'APPROVED' | 'VOID';
// final_result / sample result values match their CHECKs (migration 012).
export type LabFinalResult = 'PASS' | 'FAIL' | 'HOLD';
// reason values match lab_test_retests.reason CHECK (migration 012).
export type LabRetestReason = 'FAIL' | 'HOLD' | 'SAMPLE_ISSUE' | 'EQUIPMENT_ISSUE' | 'PROCEDURAL_ISSUE' | 'OTHER';
// status values match lab_test_templates.status CHECK (migration 011).
export type LabTemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
// type values match lab_documents.type CHECK (migration 013).
export type LabDocumentType = 'SOP' | 'WI';
// status values match lab_documents.status / lab_document_versions.status CHECKs (migration 013).
export type LabDocumentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SUPERSEDED' | 'ARCHIVED';
// entity_type values match lab_document_links.entity_type CHECK (migration 013).
export type LabDocumentLinkEntityType = 'EQUIPMENT' | 'PRODUCT' | 'TEMPLATE';
// status values match lab_document_acknowledgements.status CHECK (migration 013).
export type LabAcknowledgementStatus = 'PENDING' | 'ACKNOWLEDGED';

/** One row of lab_test_templates — test template identity (versioned content in LabTestTemplateVersion). */
export interface LabTestTemplate {
  id: number;
  name: string;
  code: string;
  test_type: LabTestType;
  status: LabTemplateStatus;
  current_version_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** One immutable-numbered version of a lab test template (lab_test_template_versions). */
export interface LabTestTemplateVersion {
  id: number;
  template_id: number;
  version: number;
  default_sample_count: number | null;
  parameters_json: string;
  connector_choices_json: string | null;
  applicable_product_id: number | null;
  applicable_equipment_id: number | null;
  sop_id: number | null;
  wi_id: number | null;
  created_by: number;
  approved_by: number | null;
  created_at: string;
  updated_at: string;
}

/** One row of the equipment registry (lab_equipment). status_raw is the verbatim business value. */
export interface LabEquipment {
  id: number;
  name: string;
  code: string;
  location: string | null;
  status_raw: string;
  calibration_status_raw: string | null;
  serial_number: string | null;
  notes: string | null;
  is_archived: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** One append-only maintenance event (lab_equipment_maintenance). */
export interface LabEquipmentMaintenance {
  id: number;
  equipment_id: number;
  maintenance_date: string | null;
  issue: string | null;
  maintenance_type: string | null;
  description: string | null;
  technician_vendor: string | null;
  status: string | null;
  completed_date: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

/** One calibration record (lab_equipment_calibration). UI state is derived from dates, never stored. */
export interface LabEquipmentCalibration {
  id: number;
  equipment_id: number;
  last_calibrated_at: string | null;
  calibration_due_at: string | null;
  provider: string | null;
  certificate_reference: string | null;
  result: string | null;
  next_due_at: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

/** One row of the Product Master (lab_products). */
export interface LabProduct {
  id: number;
  name: string;
  code: string;
  description: string | null;
  connector_type: string | null;
  default_test_type: LabTestType | null;
  default_template_id: number | null;
  applicable_sop_id: number | null;
  applicable_wi_id: number | null;
  is_active: number;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** One "Related Equipment" link on a Product Master row (lab_product_equipment). */
export interface LabProductEquipment {
  product_id: number;
  equipment_id: number;
  created_at: string;
}

/** One "Equipment compatibility" link on a test template (lab_template_equipment). */
export interface LabTemplateEquipment {
  template_id: number;
  equipment_id: number;
  created_at: string;
}

/** One AIR/VACUUM test record (lab_test_records). */
export interface LabTestRecord {
  id: number;
  test_number: string;
  test_type: LabTestType;
  product_id: number | null;
  equipment_id: number | null;
  lot_number: string | null;
  sampling_area: string | null;
  medium_used: string | null;
  connector_type: string | null;
  sample_count: number;
  actual_pressure: string | null;
  torque_in_lb: string | null;
  time_sec: string | null;
  angle: string | null;
  temperature_measured: string | null;
  remarks: string | null;
  final_result: LabFinalResult | null;
  status: LabTestStatus;
  template_id: number | null;
  template_version_id: number | null;
  sop_version_id: number | null;
  wi_version_id: number | null;
  tested_by: number | null;
  reviewed_by: number | null;
  approved_by: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  void_reason: string | null;
  product_snapshot_json: string | null;
  template_snapshot_json: string | null;
  parameters_snapshot_json: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** Per-sample lifecycle (lab_test_samples.status, migration 020). */
export type LabSampleStatus = 'PENDING' | 'TESTED' | 'APPROVED' | 'VOID';

/** One sample row of a test (lab_test_samples); sample_identifier is immutable. */
export interface LabTestSample {
  id: number;
  test_id: number;
  sample_no: number;
  sample_identifier: string | null;
  part_name: string | null;
  set_pressure: string | null;
  actual_pressure: string | null;
  volume_sec: string | null;
  pressure_difference: string | null;
  holding_time_sec: string | null;
  leakage_rate: string | null;
  result: LabFinalResult | null;
  status: LabSampleStatus;
  created_at: string;
  updated_at: string;
}

/** One controlled retest (lab_test_retests). Originals are never overwritten. */
export interface LabTestRetest {
  id: number;
  retest_number: string;
  original_test_id: number;
  new_test_id: number | null;
  reason: LabRetestReason;
  reason_note: string | null;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** Equipment identity frozen at approval (lab_test_equipment_snapshots). Written once, never updated. */
export interface LabTestEquipmentSnapshot {
  test_id: number;
  equipment_id: number | null;
  equipment_name: string | null;
  equipment_code: string | null;
  serial_number: string | null;
  location: string | null;
  calibration_state: string | null;
  calibration_reference: string | null;
  captured_at: string;
}

/** Controlled-document reference frozen at approval (lab_test_document_snapshots), one row per role. */
export interface LabTestDocumentSnapshot {
  id: number;
  test_id: number;
  role: 'SOP' | 'WI';
  document_id: number | null;
  document_code: string | null;
  document_type: string | null;
  version_number: number | null;
  title: string | null;
  captured_at: string;
}

/** One SOP/WI document identity (lab_documents). */
export interface LabDocument {
  id: number;
  code: string;
  title: string;
  type: LabDocumentType;
  description: string | null;
  product_id: number | null;
  owner_id: number | null;
  reviewer_id: number | null;
  approver_id: number | null;
  current_version_id: number | null;
  status: LabDocumentStatus;
  effective_date: string | null;
  review_due_date: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** One immutable-numbered document version (lab_document_versions). Approved versions never mutate. */
export interface LabDocumentVersion {
  id: number;
  document_id: number;
  version: number;
  content_md: string;
  content_html_sanitized: string | null;
  change_summary: string | null;
  author_id: number;
  reviewed_by: number | null;
  reviewed_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  status: LabDocumentStatus;
  created_at: string;
}

/** One typed document ↔ equipment/product/template link (lab_document_links). */
export interface LabDocumentLink {
  id: number;
  document_id: number;
  entity_type: LabDocumentLinkEntityType;
  entity_id: number;
  created_by: number;
  created_at: string;
}

/** One version-specific acknowledgement (lab_document_acknowledgements). */
export interface LabDocumentAcknowledgement {
  id: number;
  document_version_id: number;
  user_id: number;
  assigned_at: string;
  acknowledged_at: string | null;
  status: LabAcknowledgementStatus;
}

/** One user-scoped saved lab view (lab_saved_views) — same shape as saved_filters. */
export interface LabSavedView {
  id: number;
  user_id: number;
  name: string;
  filter_json: string;
  created_at: string;
}
