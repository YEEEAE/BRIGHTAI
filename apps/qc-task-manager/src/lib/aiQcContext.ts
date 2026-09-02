import { getDb } from './db';
import { canManageFinding, PERMISSIONS } from './permissions';
import { canViewTask, getAttachment, getTaskDetail, listActivity, listComments, listDependencies, listEvidenceFiles } from './taskDetails';
import { getFinding } from './qc-operations';
import { EVIDENCE_EXTENSIONS } from './task-policy';
import type { User } from './types';

type ContextResult = { ok: true; context: Record<string, unknown> } | { ok: false; status: 400 | 403 | 404; error: string };

export function taskAiContext(taskId: number, user: User): ContextResult {
  const task = getTaskDetail(taskId);
  if (!task) return { ok: false, status: 404, error: 'Task not found.' };
  if (!canViewTask({ id: user.id, role: user.role }, task)) return { ok: false, status: 404, error: 'Task not found.' };
  return { ok: true, context: {
    task: { id: task.id, title: task.title, description: task.description, department: task.department, status: task.status, priority: task.priority, progress_percent: task.progress_percent, due_date: task.due_date, blocker_note: task.blocker_note, sla_status: task.sla_status, sla_percent_used: task.sla_percent_used },
    dependencies: listDependencies(taskId).map(({ depends_on_task_id, title, status, progress_percent, due_date }) => ({ depends_on_task_id, title, status, progress_percent, due_date })),
    evidence: listEvidenceFiles(taskId).map(({ id, file_name, mime_type, file_size, evidence_type, verification_status, uploaded_at }) => ({ id, file_name, mime_type, file_size, evidence_type, verification_status, uploaded_at })),
    history: listActivity(taskId).slice(-30).map(({ action, old_value, new_value, created_at }) => ({ action, old_value, new_value, created_at })),
    comments: listComments(taskId).slice(-20).map(({ comment, created_at }) => ({ comment, created_at })),
  } };
}

export function findingAiContext(findingId: number, user: User): ContextResult {
  const finding = getFinding(findingId);
  if (!finding) return { ok: false, status: 404, error: 'Finding not found.' };
  if (!canManageFinding(user, finding)) return { ok: false, status: 404, error: 'Finding not found.' };
  return { ok: true, context: {
    finding: { id: finding.id, finding_number: finding.finding_number, task_id: finding.task_id, inspection_type: finding.inspection_type, classification: finding.classification, severity: finding.severity, risk_description: finding.risk_description, requirement_reference: finding.requirement_reference, status: finding.status, due_date: finding.due_date },
    existing_rca: finding.rca ? { method: finding.rca.method, free_form: finding.rca.free_form, why_1: finding.rca.why_1, why_2: finding.rca.why_2, why_3: finding.rca.why_3, why_4: finding.rca.why_4, why_5: finding.rca.why_5, fishbone_json: finding.rca.fishbone_json } : null,
    existing_capa: finding.capa ? { problem_statement: finding.capa.problem_statement, root_cause: finding.capa.root_cause, corrective_action: finding.capa.corrective_action, preventive_action: finding.capa.preventive_action, status: finding.capa.status, evidence: finding.capa.evidence, effectiveness_check: finding.capa.effectiveness_check } : null,
    evidence: finding.evidence.map((item) => ({ description: item.description, reference: item.reference })),
  } };
}

export function managementAiContext(user: User): ContextResult {
  if (!PERMISSIONS.canViewDashboard(user.role)) return { ok: false, status: 403, error: 'Management summary is not available for this role.' };
  const db = getDb();
  const scoped = user.role === 'supervisor';
  const scopeSql = scoped ? ' AND t.department = ?' : '';
  const params = scoped ? [user.department] : [];
  const taskRows = db.prepare(`SELECT t.id, t.title, t.status, t.priority, t.department, t.sla_status, t.sla_percent_used, t.due_date, t.blocker_note FROM tasks t WHERE t.status NOT IN ('completed','cancelled')${scopeSql} ORDER BY t.sla_percent_used DESC, t.due_date ASC LIMIT 50`).all(...params);
  const findingRows = db.prepare(`SELECT f.finding_number, f.classification, f.severity, f.status, f.risk_description, t.department FROM qc_findings f JOIN tasks t ON t.id=f.task_id WHERE f.status <> 'CLOSED' AND f.classification='critical'${scopeSql} ORDER BY f.created_at DESC LIMIT 30`).all(...params);
  const capaRows = db.prepare(`SELECT c.id, c.status, c.corrective_action, c.preventive_action, t.department FROM qc_capa c JOIN qc_findings f ON f.id=c.finding_id JOIN tasks t ON t.id=f.task_id WHERE c.status NOT IN ('CLOSED','EFFECTIVE')${scopeSql} ORDER BY c.updated_at DESC LIMIT 30`).all(...params);
  const evidenceGaps = db.prepare(`SELECT t.id, t.title, t.department, t.status FROM tasks t LEFT JOIN task_attachments a ON a.task_id=t.id AND a.is_evidence=1 AND a.verification_status <> 'REJECTED' WHERE t.status='completed' AND a.id IS NULL${scopeSql} ORDER BY t.updated_at DESC LIMIT 30`).all(...params);
  const workload = db.prepare(`SELECT u.full_name, u.department, COUNT(t.id) AS active_tasks, SUM(CASE WHEN t.due_date < date('now') THEN 1 ELSE 0 END) AS overdue FROM users u LEFT JOIN tasks t ON t.assigned_to=u.id AND t.status NOT IN ('completed','cancelled') WHERE u.is_active=1${scoped ? ' AND u.department = ?' : ''} GROUP BY u.id ORDER BY active_tasks DESC LIMIT 30`).all(...(scoped ? [user.department] : []));
  return { ok: true, context: { scope: scoped ? { department: user.department } : { organization: true }, active_tasks: taskRows, critical_findings: findingRows, open_capa: capaRows, evidence_gaps: evidenceGaps, workload } };
}

export function evidenceAiContext(taskId: number, attachmentId: number, user: User, allowAiProcessing: boolean): ContextResult {
  if (!allowAiProcessing) return { ok: false, status: 400, error: 'AI processing consent is required.' };
  const task = getTaskDetail(taskId);
  if (!task) return { ok: false, status: 404, error: 'Task not found.' };
  if (!canViewTask({ id: user.id, role: user.role }, task)) return { ok: false, status: 404, error: 'Task not found.' };
  const attachment = getAttachment(attachmentId, taskId);
  if (!attachment) return { ok: false, status: 404, error: 'Evidence not found.' };
  const extension = attachment.file_name.toLowerCase().split('.').pop() ?? '';
  if (!attachment.is_evidence || !EVIDENCE_EXTENSIONS.includes(extension)) return { ok: false, status: 400, error: 'This file type is not eligible for AI evidence review.' };
  return { ok: true, context: { task: { id: task.id, title: task.title, requirement: task.inspection_type }, evidence: { attachment_id: attachment.id, file_name: attachment.file_name, mime_type: attachment.mime_type, file_size: attachment.file_size, file_hash: attachment.file_hash, evidence_type: attachment.evidence_type, description: attachment.description, verification_status: attachment.verification_status } } };
}

export function setEvidenceAiStatus(taskId: number, attachmentId: number, status: 'UNVERIFIED' | 'AI_PENDING' | 'AI_REVIEWED'): void {
  getDb().prepare("UPDATE task_attachments SET verification_status = ? WHERE id = ? AND task_id = ? AND is_evidence = 1").run(status, attachmentId, taskId);
}
