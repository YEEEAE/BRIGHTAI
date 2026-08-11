// Server-side audit boundary. Callers receive no client-controlled actor path.

import { Action, logActivity } from '../activity';

export { Action };

export type AuditMutation = {
  taskId: number;
  actorId: number;
  action: string;
  oldValue?: string | number | boolean | null;
  newValue?: string | number | boolean | null;
};

/** Persist an audit event using the actor resolved by the server session. */
export function recordTaskMutation(event: AuditMutation): void {
  logActivity({
    taskId: event.taskId,
    userId: event.actorId,
    action: event.action,
    oldValue: event.oldValue,
    newValue: event.newValue,
  });
}

