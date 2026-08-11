import { createHash } from 'node:crypto';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';

export type AuditRow = {
  id: number;
  task_id: number;
  user_id: number;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  ip_address: string | null;
  created_at: string;
  previous_hash: string | null;
  event_hash: string | null;
};

/** Fixed key order + JSON encoding makes the event representation deterministic. */
export function canonicalEvent(row: Pick<AuditRow, 'task_id' | 'user_id' | 'action' | 'field' | 'old_value' | 'new_value' | 'note' | 'ip_address' | 'created_at'>): string {
  return JSON.stringify({
    task_id: row.task_id,
    user_id: row.user_id,
    action: row.action,
    field: row.field ?? null,
    old_value: row.old_value ?? null,
    new_value: row.new_value ?? null,
    note: row.note ?? null,
    ip_address: row.ip_address ?? null,
    created_at: row.created_at,
  });
}

export function createAuditEventHash(row: Pick<AuditRow, 'task_id' | 'user_id' | 'action' | 'field' | 'old_value' | 'new_value' | 'note' | 'ip_address' | 'created_at'>, previousHash: string | null): string {
  return createHash('sha256').update(canonicalEvent(row) + (previousHash ?? ''), 'utf8').digest('hex');
}

/** Backfill legacy rows once after migration; this is integrity metadata, not immutability. */
export function backfillAuditChain(db: BetterSqliteDatabase): void {
  const rows = db.prepare('SELECT * FROM task_activity_log ORDER BY id ASC').all() as AuditRow[];
  const update = db.prepare('UPDATE task_activity_log SET previous_hash = ?, event_hash = ? WHERE id = ?');
  const tx = db.transaction(() => {
    let previous: string | null = null;
    for (const row of rows) {
      if (row.previous_hash == null || row.event_hash == null) {
        const hash = createAuditEventHash(row, previous);
        update.run(previous, hash, row.id);
        previous = hash;
      } else {
        previous = row.event_hash;
      }
    }
  });
  tx();
}

export type AuditVerification =
  | { status: 'PASS' }
  | { status: 'FAIL'; first_invalid_event: number; expected_hash: string; actual_hash: string | null };

export function verifyAuditChain(db: BetterSqliteDatabase): AuditVerification {
  const rows = db.prepare('SELECT * FROM task_activity_log ORDER BY id ASC').all() as AuditRow[];
  let previous: string | null = null;
  for (const row of rows) {
    const expected = createAuditEventHash(row, previous);
    if (row.previous_hash !== previous || row.event_hash !== expected) {
      return { status: 'FAIL', first_invalid_event: row.id, expected_hash: expected, actual_hash: row.event_hash };
    }
    previous = row.event_hash;
  }
  return { status: 'PASS' };
}
