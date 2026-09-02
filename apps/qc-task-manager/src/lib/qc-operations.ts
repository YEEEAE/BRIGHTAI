import { transaction, getDb } from './db';
import { canCloseCapa, hasCapaClosureGates, canTransitionCapa } from './capa';
import { canTransitionFinding } from './findings';
import { appendQcAudit } from './audit/qcChain';

/**
 * A QC policy rejection (invalid transition, unmet closure gate, missing
 * required field). Its message is user-facing policy text, so endpoints may
 * surface it verbatim with a 400 — unlike an unexpected fault, which stays a
 * generic 500. Keeps "expected rejection" and "server error" distinguishable.
 */
export class DomainRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainRuleError';
  }
}

export type EntityType = 'FINDING' | 'RCA' | 'CAPA' | 'EVIDENCE';
export type AuditAction = 'CREATE' | 'UPDATE' | 'STATUS_TRANSITION' | 'APPROVAL' | 'REJECTION' | 'CLOSURE' | 'REOPEN';

export type FindingRow = Record<string, unknown> & { id: number; task_id: number; owner: number; status: string; classification: string };
export type CapaRow = Record<string, unknown> & { id: number; finding_id: number; owner: number; status: string };

function audit(entityType: EntityType, entityId: number, taskId: number | null, actorId: number, action: AuditAction, oldValue: unknown = null, newValue: unknown = null, note: string | null = null): void {
  appendQcAudit(getDb(), { entityType, entityId, taskId, actorId, action, oldValue: oldValue == null ? null : JSON.stringify(oldValue), newValue: newValue == null ? null : JSON.stringify(newValue), note });
}

/** Dropdown options for the new-finding form (task picker + active owners).
 *  Read model for /findings; previously inlined as SQL in the page frontmatter. */
export function listFindingFormOptions(): { tasks: { id: number; title: string }[]; owners: { id: number; full_name: string }[] } {
  const db = getDb();
  return {
    tasks: db.prepare('SELECT id, title FROM tasks ORDER BY id DESC LIMIT 200').all() as { id: number; title: string }[],
    owners: db.prepare('SELECT id, full_name FROM users WHERE is_active=1 ORDER BY full_name').all() as { id: number; full_name: string }[],
  };
}

export function listFindings(filters: { status?: string; classification?: string; owner?: number } = {}): FindingRow[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.status) { where.push('f.status = ?'); params.push(filters.status); }
  if (filters.classification) { where.push('f.classification = ?'); params.push(filters.classification); }
  if (filters.owner) { where.push('f.owner = ?'); params.push(filters.owner); }
  return getDb().prepare(`SELECT f.*, t.title AS task_title, u.full_name AS owner_name FROM qc_findings f JOIN tasks t ON t.id=f.task_id JOIN users u ON u.id=f.owner ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY f.created_at DESC`).all(...params) as FindingRow[];
}

export function getFinding(id: number): (FindingRow & { rca: Record<string, unknown> | undefined; capa: CapaRow | undefined; evidence: Record<string, unknown>[]; audit: Record<string, unknown>[] }) | undefined {
  const db = getDb();
  const finding = db.prepare(`SELECT f.*, t.title AS task_title, u.full_name AS owner_name FROM qc_findings f JOIN tasks t ON t.id=f.task_id JOIN users u ON u.id=f.owner WHERE f.id=?`).get(id) as FindingRow | undefined;
  if (!finding) return undefined;
  return {
    ...finding,
    rca: db.prepare('SELECT * FROM qc_rca WHERE finding_id=?').get(id) as Record<string, unknown> | undefined,
    capa: db.prepare('SELECT c.*, u.full_name AS owner_name, r.full_name AS reviewer_name FROM qc_capa c JOIN users u ON u.id=c.owner LEFT JOIN users r ON r.id=c.reviewer WHERE c.finding_id=?').get(id) as CapaRow | undefined,
    evidence: db.prepare(`SELECT e.*, u.full_name AS created_by_name FROM qc_evidence e JOIN users u ON u.id=e.created_by WHERE e.finding_id=? ORDER BY e.created_at DESC`).all(id) as Record<string, unknown>[],
    audit: db.prepare(`SELECT a.*, u.full_name AS actor_name FROM qc_audit_log a JOIN users u ON u.id=a.actor_id WHERE (a.entity_type='FINDING' AND a.entity_id=?) OR (a.entity_type='RCA' AND a.entity_id IN (SELECT id FROM qc_rca WHERE finding_id=?)) OR (a.entity_type='CAPA' AND a.entity_id IN (SELECT id FROM qc_capa WHERE finding_id=?)) OR (a.entity_type='EVIDENCE' AND a.entity_id IN (SELECT id FROM qc_evidence WHERE finding_id=? OR capa_id IN (SELECT id FROM qc_capa WHERE finding_id=?))) ORDER BY a.created_at DESC`).all(id, id, id, id, id) as Record<string, unknown>[],
  };
}

export function createFinding(input: Record<string, unknown>, actorId: number): number {
  return transaction(() => {
    const db = getDb();
    const result = db.prepare(`INSERT INTO qc_findings (finding_number, task_id, inspection_type, classification, severity, risk_description, requirement_reference, owner, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.finding_number, input.task_id, input.inspection_type, input.classification, input.severity, input.risk_description, input.requirement_reference ?? null, input.owner, input.due_date ?? null, actorId);
    const id = Number(result.lastInsertRowid);
    audit('FINDING', id, Number(input.task_id), actorId, 'CREATE', null, input);
    return id;
  });
}

export function updateFinding(id: number, input: Record<string, unknown>, actorId: number): void {
  const finding = getFinding(id);
  if (!finding) throw new DomainRuleError('Finding not found.');
  const allowed = ['inspection_type','classification','severity','risk_description','requirement_reference','owner','due_date','closure_evidence'];
  const entries = Object.entries(input).filter(([key, value]) => allowed.includes(key) && value !== undefined);
  if (!entries.length) return;
  const sets = entries.map(([key]) => `${key}=?`).join(', ');
  transaction(() => {
    getDb().prepare(`UPDATE qc_findings SET ${sets}, updated_at=datetime('now') WHERE id=?`).run(...entries.map(([, value]) => value), id);
    audit('FINDING', id, Number(finding.task_id), actorId, 'UPDATE', Object.fromEntries(entries.map(([key]) => [key, finding[key]])), Object.fromEntries(entries));
  });
}

export function transitionFinding(id: number, status: string, actorId: number, note?: string): void {
  const finding = getFinding(id);
  if (!finding || !canTransitionFinding(String(finding.status), status)) throw new DomainRuleError('Invalid Finding status transition.');
  if (status === 'CLOSED') {
    const capa = finding.capa;
    if (finding.classification === 'critical' && (!capa || !hasCapaClosureGates(capa as { corrective_action?: string; evidence?: string; effectiveness_check?: string; approval?: string }) || !['EFFECTIVE','CLOSED'].includes(String(capa.status)))) throw new DomainRuleError('Critical Findings require corrective action, evidence, verification, and approval before closure.');
    if (!String(finding.closure_evidence ?? '').trim()) throw new DomainRuleError('Closure evidence is required.');
  }
  transaction(() => {
    getDb().prepare(`UPDATE qc_findings SET status=?, closed_by=CASE WHEN ?='CLOSED' THEN ? ELSE NULL END, closed_at=CASE WHEN ?='CLOSED' THEN datetime('now') ELSE NULL END, updated_at=datetime('now') WHERE id=?`).run(status, status, actorId, status, id);
    audit('FINDING', id, Number(finding.task_id), actorId, status === 'CLOSED' ? 'CLOSURE' : status === 'REOPENED' ? 'REOPEN' : 'STATUS_TRANSITION', finding.status, status, note ?? null);
  });
}

export function upsertRca(findingId: number, input: Record<string, unknown>, actorId: number): void {
  const finding = getFinding(findingId); if (!finding) throw new DomainRuleError('Finding not found.');
  transaction(() => {
    getDb().prepare(`INSERT INTO qc_rca (finding_id, method, free_form, why_1, why_2, why_3, why_4, why_5, fishbone_json, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(finding_id) DO UPDATE SET method=excluded.method, free_form=excluded.free_form, why_1=excluded.why_1, why_2=excluded.why_2, why_3=excluded.why_3, why_4=excluded.why_4, why_5=excluded.why_5, fishbone_json=excluded.fishbone_json, updated_by=excluded.updated_by, updated_at=datetime('now')`).run(findingId, input.method, input.free_form ?? null, input.why_1 ?? null, input.why_2 ?? null, input.why_3 ?? null, input.why_4 ?? null, input.why_5 ?? null, input.fishbone_json ?? null, actorId);
    const rca = getDb().prepare('SELECT id FROM qc_rca WHERE finding_id=?').get(findingId) as { id: number };
    audit('RCA', rca.id, Number(finding.task_id), actorId, finding.rca ? 'UPDATE' : 'CREATE', null, input);
  });
}

export function upsertCapa(findingId: number, input: Record<string, unknown>, actorId: number): number {
  const finding = getFinding(findingId); if (!finding) throw new DomainRuleError('Finding not found.');
  return transaction(() => {
    const db = getDb();
    // `evidence` and `effectiveness_check` are part of capaSchema and the CAPA
    // form; persisting them here is what feeds the critical-finding closure
    // gate (hasCapaClosureGates requires corrective_action + evidence +
    // effectiveness_check + approval) — dropping them made critical Findings
    // impossible to close through the UI/API.
    db.prepare(`INSERT INTO qc_capa (finding_id, problem_statement, root_cause, corrective_action, preventive_action, owner, due_date, evidence, effectiveness_check, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(finding_id) DO UPDATE SET problem_statement=excluded.problem_statement, root_cause=excluded.root_cause, corrective_action=excluded.corrective_action, preventive_action=excluded.preventive_action, owner=excluded.owner, due_date=excluded.due_date, evidence=excluded.evidence, effectiveness_check=excluded.effectiveness_check, updated_at=datetime('now')`).run(findingId, input.problem_statement, input.root_cause, input.corrective_action, input.preventive_action, input.owner, input.due_date ?? null, input.evidence ?? null, input.effectiveness_check ?? null, actorId);
    const capa = db.prepare('SELECT id FROM qc_capa WHERE finding_id=?').get(findingId) as { id: number };
    audit('CAPA', capa.id, Number(finding.task_id), actorId, finding.capa ? 'UPDATE' : 'CREATE', null, input);
    return capa.id;
  });
}

export function updateCapa(id: number, input: Record<string, unknown>, actorId: number): void {
  const capa = getDb().prepare('SELECT * FROM qc_capa WHERE id=?').get(id) as CapaRow | undefined; if (!capa) throw new DomainRuleError('CAPA not found.');
  const fields = ['problem_statement','root_cause','corrective_action','preventive_action','owner','due_date','evidence','effectiveness_check'];
  const entries = Object.entries(input).filter(([key, value]) => fields.includes(key) && value !== undefined); if (!entries.length) return;
  transaction(() => { getDb().prepare(`UPDATE qc_capa SET ${entries.map(([key]) => `${key}=?`).join(', ')}, updated_at=datetime('now') WHERE id=?`).run(...entries.map(([, value]) => value), id); audit('CAPA', id, null, actorId, 'UPDATE', null, input); });
}

export function transitionCapa(id: number, status: string, actorId: number, decision?: string): void {
  const capa = getDb().prepare('SELECT * FROM qc_capa WHERE id=?').get(id) as CapaRow | undefined; if (!capa || !canTransitionCapa(String(capa.status), status)) throw new DomainRuleError('Invalid CAPA status transition.');
  if (status === 'CLOSED' && !canCloseCapa(capa as { corrective_action?: string; evidence?: string; effectiveness_check?: string; approval?: string })) throw new DomainRuleError('CAPA requires completed action, evidence, effectiveness review, and approval before closure.');
  transaction(() => {
    if (status === 'VERIFICATION' && decision) getDb().prepare(`UPDATE qc_capa SET reviewer=?, effectiveness_check=?, updated_at=datetime('now') WHERE id=?`).run(actorId, decision, id);
    if (status === 'EFFECTIVE' || status === 'CLOSED') getDb().prepare(`UPDATE qc_capa SET approval=?, reviewer=?, updated_at=datetime('now') WHERE id=?`).run(decision ?? 'Approved', actorId, id);
    getDb().prepare(`UPDATE qc_capa SET status=?, updated_at=datetime('now') WHERE id=?`).run(status, id);
    audit('CAPA', id, null, actorId, status === 'CLOSED' ? 'CLOSURE' : status === 'REOPENED' ? 'REOPEN' : status === 'EFFECTIVE' ? 'APPROVAL' : decision?.toLowerCase().includes('reject') ? 'REJECTION' : 'STATUS_TRANSITION', capa.status, status, decision ?? null);
  });
}

export function addEvidence(input: { findingId?: number; capaId?: number; description: string; reference?: string | null }, actorId: number): number {
  if (!input.findingId && !input.capaId) throw new DomainRuleError('Evidence must be linked to a Finding or CAPA.');
  const db = getDb();
  let findingId: number;
  if (input.capaId) {
    const capa = db.prepare('SELECT finding_id FROM qc_capa WHERE id=?').get(input.capaId) as { finding_id: number } | undefined;
    // The parent route is the authorization boundary. A caller must not use a
    // valid CAPA id from another Finding to smuggle evidence across entities.
    if (!capa || (input.findingId != null && capa.finding_id !== input.findingId)) {
      throw new DomainRuleError('Evidence target not found.');
    }
    findingId = capa.finding_id;
  } else {
    findingId = input.findingId!;
    if (!db.prepare('SELECT 1 FROM qc_findings WHERE id=?').get(findingId)) {
      throw new DomainRuleError('Evidence target not found.');
    }
  }
  return transaction(() => {
    const result = db.prepare('INSERT INTO qc_evidence (finding_id, capa_id, description, reference, created_by) VALUES (?, ?, ?, ?, ?)').run(input.capaId ? null : findingId, input.capaId ?? null, input.description, input.reference ?? null, actorId);
    const id = Number(result.lastInsertRowid);
    audit('EVIDENCE', id, Number((db.prepare('SELECT task_id FROM qc_findings WHERE id=?').get(findingId) as { task_id: number }).task_id), actorId, 'CREATE', null, input);
    return id;
  });
}

export { audit as recordQcAudit };
