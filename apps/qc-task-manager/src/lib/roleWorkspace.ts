// Role home workspace: task lists + "needs attention" counters for the three
// role landing pages (/manager, /supervisor, /employee).
//
// This SQL previously lived inline in the page frontmatter — the manager and
// supervisor queries were copy-paste twins, and the employee scope was a raw
// SQL fragment. The queries live here so every operational definition (what
// counts as overdue, urgent, awaiting review, "mine") has exactly one
// implementation, fully parameterized like the rest of the data layer.

import { getDb } from './db';
import { isOverdue, localDateStr } from './format';
import { TASK_ROW_SCOPE_SQL, rowScopeParams } from './scope';

export interface WorkspaceTaskRow {
  id: number;
  title: string;
  status: string;
  priority: string;
  progress_percent: number;
  due_date: string | null;
  recurrence: string;
  assignee: string | null;
  delete_request_status: 'pending' | 'rejected' | string | null;
  delete_request_note: string | null;
  checklist_total: number;
  checklist_completed: number;
}

export type AttentionTone = 'danger' | 'warning' | 'info' | 'neutral';

export interface AttentionItem {
  label: string;
  n: number;
  href: string | null;
  tone: AttentionTone;
}

const WORKSPACE_TASK_SELECT = `
    SELECT t.id, t.title, t.status, t.priority, t.progress_percent, t.due_date, t.recurrence,
           (SELECT COUNT(*) FROM task_checklists c WHERE c.task_id = t.id) AS checklist_total,
           (SELECT COUNT(*) FROM task_checklists c WHERE c.task_id = t.id AND c.is_completed = 1) AS checklist_completed,
           u.full_name AS assignee,
           (SELECT r.status FROM task_delete_requests r
             WHERE r.task_id = t.id ORDER BY r.id DESC LIMIT 1) AS delete_request_status,
           (SELECT r.review_note FROM task_delete_requests r
             WHERE r.task_id = t.id ORDER BY r.id DESC LIMIT 1) AS delete_request_note
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to`;

/** Most recently touched tasks across the team (manager + supervisor homes). */
export function listTeamTasks(limit = 100): WorkspaceTaskRow[] {
  return getDb()
    .prepare(`${WORKSPACE_TASK_SELECT} ORDER BY t.updated_at DESC LIMIT ?`)
    .all(limit) as WorkspaceTaskRow[];
}

/** The employee's own tasks — assigned to them or created by them (scoped). */
export function listMyTasks(userId: number, limit = 50): WorkspaceTaskRow[] {
  return getDb()
    .prepare(`${WORKSPACE_TASK_SELECT} WHERE ${TASK_ROW_SCOPE_SQL} ORDER BY t.updated_at DESC LIMIT ?`)
    .all(...rowScopeParams(userId), limit) as WorkspaceTaskRow[];
}

function countOpen(where: string): number {
  return Number(
    (getDb().prepare(`SELECT COUNT(*) AS n FROM tasks WHERE ${where}`).get() as { n: number }).n,
  );
}

/** Manager strip: team-wide operational load (answer first, list below). */
export function managerAttention(): AttentionItem[] {
  const overdueOpen = countOpen("status IN ('not_started','in_progress') AND due_date IS NOT NULL AND due_date < date('now')");
  const urgentOpen = countOpen("status IN ('not_started','in_progress') AND priority = 'urgent'");
  const pendingDeleteRequests = Number(
    (getDb().prepare("SELECT COUNT(*) AS n FROM task_delete_requests WHERE status = 'pending'").get() as { n: number }).n,
  );
  const openFindings = Number(
    (getDb().prepare("SELECT COUNT(*) AS n FROM qc_findings WHERE status NOT IN ('CLOSED','CANCELLED')").get() as { n: number }).n,
  );
  return [
    { label: 'Overdue tasks', n: overdueOpen, href: '/dashboard/drilldown?kpi=overdue', tone: overdueOpen > 0 ? 'danger' : 'neutral' },
    { label: 'Urgent open tasks', n: urgentOpen, href: '/search?priority=urgent', tone: urgentOpen > 0 ? 'warning' : 'neutral' },
    { label: 'Pending delete requests', n: pendingDeleteRequests, href: '/manager/requests', tone: pendingDeleteRequests > 0 ? 'warning' : 'neutral' },
    { label: 'Open findings', n: openFindings, href: '/findings', tone: openFindings > 0 ? 'info' : 'neutral' },
  ];
}

/** Supervisor strip: review queues first, then the task list. */
export function supervisorAttention(): AttentionItem[] {
  const overdueOpen = countOpen("status IN ('not_started','in_progress') AND due_date IS NOT NULL AND due_date < date('now')");
  const urgentOpen = countOpen("status IN ('not_started','in_progress') AND priority = 'urgent'");
  const testsAwaitingReview = Number(
    (getDb().prepare("SELECT COUNT(*) AS n FROM lab_test_records WHERE status IN ('SUBMITTED','UNDER_REVIEW')").get() as { n: number }).n,
  );
  const docsAwaitingReview = Number(
    (getDb().prepare("SELECT COUNT(*) AS n FROM lab_documents WHERE status = 'IN_REVIEW'").get() as { n: number }).n,
  );
  return [
    { label: 'Overdue tasks', n: overdueOpen, href: '/dashboard/drilldown?kpi=overdue', tone: overdueOpen > 0 ? 'danger' : 'neutral' },
    { label: 'Urgent open tasks', n: urgentOpen, href: '/search?priority=urgent', tone: urgentOpen > 0 ? 'warning' : 'neutral' },
    { label: 'Tests awaiting review', n: testsAwaitingReview, href: '/lab/tests/review', tone: testsAwaitingReview > 0 ? 'warning' : 'neutral' },
    { label: 'Documents in review', n: docsAwaitingReview, href: '/lab/documents?status=IN_REVIEW', tone: docsAwaitingReview > 0 ? 'info' : 'neutral' },
  ];
}

/** Employee strip: personal work signals derived from their own task list. */
export function employeeAttention(userId: number, tasks: WorkspaceTaskRow[]): AttentionItem[] {
  const openTasks = tasks.filter((t) => t.status === 'not_started' || t.status === 'in_progress');
  const overdueMine = openTasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const dueTodayMine = openTasks.filter((t) => t.due_date === localDateStr()).length;
  const db = getDb();
  const myDraftLabTests = Number(
    (db.prepare('SELECT COUNT(*) AS n FROM lab_test_records WHERE created_by = ? AND status = ?').get(userId, 'DRAFT') as { n: number }).n,
  );
  const myReturnedLabTests = Number(
    (db.prepare('SELECT COUNT(*) AS n FROM lab_test_records WHERE created_by = ? AND status = ?').get(userId, 'REJECTED') as { n: number }).n,
  );
  const myPendingChangeRequests = Number(
    (db.prepare('SELECT COUNT(*) AS n FROM lab_change_requests WHERE requested_by = ? AND status = ?').get(userId, 'PENDING') as { n: number }).n,
  );
  return [
    { label: 'Overdue', n: overdueMine, href: null, tone: overdueMine > 0 ? 'danger' : 'neutral' },
    { label: 'Due today', n: dueTodayMine, href: null, tone: 'neutral' },
    { label: 'Open tasks', n: openTasks.length, href: null, tone: 'neutral' },
    { label: 'My draft tests', n: myDraftLabTests, href: '/lab/tests?status=DRAFT', tone: myDraftLabTests > 0 ? 'info' : 'neutral' },
    { label: 'Returned for changes', n: myReturnedLabTests, href: '/lab/tests?status=REJECTED', tone: myReturnedLabTests > 0 ? 'warning' : 'neutral' },
    { label: 'Pending change requests', n: myPendingChangeRequests, href: '/lab/change-requests', tone: myPendingChangeRequests > 0 ? 'info' : 'neutral' },
  ];
}
