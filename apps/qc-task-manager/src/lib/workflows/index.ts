// Server-authoritative workflow boundary. RBAC decides who may act; this
// module decides whether the task may advance or close.
export { createWorkflowInstance, getWorkflowInstance, getCurrentWorkflowStep, approveWorkflowStep, rejectWorkflowStep, canCloseTaskWithWorkflow, closeWorkflowInstance, workflowForTask } from './engine';
export type { WorkflowTransitionRequest } from './engine';

export {
  ACTIVE_TASK_STATUSES,
  TASK_STATUSES,
  canTransitionStatus,
  isActiveStatus,
  isTaskReadOnly,
  requiresBlockerNote,
} from '../task-policy';

export type WorkflowTransition = { from: string; to: string };
