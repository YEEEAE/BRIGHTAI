import { createHash } from 'node:crypto';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';

export type QcAuditRow = {
  id: number;
  entity_type: string;
  entity_id: number;
  task_id: number | null;
  actor_id: number;
  action: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
  previous_hash: string | null;
  event_hash: string | null;
};

export function canonicalQcAuditEvent(row: Pick<QcAuditRow, 'entity_type' | 'entity_id' | 'task_id' | 'actor_id' | 'action' | 'old_value' | 'new_value' | 'note' | 'created_at'>): string {
  return JSON.stringify({
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    task_id: row.task_id ?? null,
    actor_id: row.actor_id,
    action: row.action,
    old_value: row.old_value ?? null,
    new_value: row.new_value ?? null,
    note: row.note ?? null,
    created_at: row.created_at,
  });
}

export function createQcAuditEventHash(row: Pick<QcAuditRow, 'entity_type' | 'entity_id' | 'task_id' | 'actor_id' | 'action' | 'old_value' | 'new_value' | 'note' | 'created_at'>, previousHash: string | null): string {
  return createHash('sha256').update(canonicalQcAuditEvent(row) + (previousHash ?? ''), 'utf8').digest('hex');
}

/**
 * Backfill boundary: rows written before migration 030 are assigned one
 * explicit genesis at the first row. This proves continuity from that point,
 * not historical integrity before the migration.
 */
export function backfillQcAuditChain(db: BetterSqliteDatabase): void {
  const rows = db.prepare('SELECT * FROM qc_audit_log ORDER BY id ASC').all() as QcAuditRow[];
  if (!rows.some((row) => row.previous_hash == null || row.event_hash == null)) return;
  const update = db.prepare('UPDATE qc_audit_log SET previous_hash = ?, event_hash = ? WHERE id = ?');
  db.transaction(() => {
    let previous: string | null = null;
    for (const row of rows) {
      const hash = createQcAuditEventHash(row, previous);
      update.run(previous, hash, row.id);
      previous = hash;
    }
  })();
}

export function appendQcAudit(db: BetterSqliteDatabase, params: {
  entityType: string;
  entityId: number;
  taskId?: number | null;
  actorId: number;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
  createdAt?: string;
}): number {
  return db.transaction(() => {
    backfillQcAuditChain(db);
    const previous = db.prepare('SELECT event_hash FROM qc_audit_log ORDER BY id DESC LIMIT 1').get() as { event_hash: string | null } | undefined;
    const row = {
      entity_type: params.entityType,
      entity_id: params.entityId,
      task_id: params.taskId ?? null,
      actor_id: params.actorId,
      action: params.action,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      note: params.note ?? null,
      created_at: params.createdAt ?? new Date().toISOString(),
    };
    const eventHash = createQcAuditEventHash(row, previous?.event_hash ?? null);
    const info = db.prepare(`
      INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at, previous_hash, event_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(row.entity_type, row.entity_id, row.task_id, row.actor_id, row.action, row.old_value, row.new_value, row.note, row.created_at, previous?.event_hash ?? null, eventHash);
    return Number(info.lastInsertRowid);
  })();
}

export type QcAuditVerification =
  | { status: 'PASS' }
  | { status: 'FAIL'; first_invalid_event: number; expected_hash: string; actual_hash: string | null };

export function verifyQcAuditChain(db: BetterSqliteDatabase): QcAuditVerification {
  const rows = db.prepare('SELECT * FROM qc_audit_log ORDER BY id ASC').all() as QcAuditRow[];
  let previous: string | null = null;
  for (const row of rows) {
    const expected = createQcAuditEventHash(row, previous);
    if (row.previous_hash !== previous || row.event_hash !== expected) {
      return { status: 'FAIL', first_invalid_event: row.id, expected_hash: expected, actual_hash: row.event_hash };
    }
    previous = row.event_hash;
  }
  return { status: 'PASS' };
}
