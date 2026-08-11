// Canonical task lifecycle boundary. Policy owns the rule data/predicates;
// this module gives mutation code one workflow-facing import surface.

export {
  ACTIVE_TASK_STATUSES,
  TASK_STATUSES,
  canTransitionStatus,
  isActiveStatus,
  isTaskReadOnly,
  requiresBlockerNote,
} from '../task-policy';

export type WorkflowTransition = {
  from: string;
  to: string;
};

