// Public API of the task mutation layer. Every task mutation funnels through
// one of these functions (see docs/ARCHITECTURE.md §Task mutations).

export {
  sanitizeFileName,
  validateUploadedFile,
  validateEvidenceFile,
  listBlockingDependencies,
  type UpdateResult,
  type CloseResult,
  type CancelResult,
  type ReopenResult,
  type UploadResult,
} from './shared';
export { applyTaskUpdate } from './update';
export { closeTask } from './closure';
export { cancelTask, reopenTask } from './lifecycle';
export { uploadAttachment, addTaskComment } from './attachments';

// Back-compat re-exports (constants moved to the canonical src/lib/task-policy.ts).
export {
  ALLOWED_EXTENSIONS_HINT,
  EXT_MIME,
  MAX_BLOCKER_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_NAME,
  MAX_UPLOAD_BYTES,
} from '../task-policy';
export { ACTIVE_TASK_STATUSES as STATUSES } from '../task-policy';

