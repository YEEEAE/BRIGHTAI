// Read-only administrator view of USER events in the one shared qc_audit_log.
// This intentionally derives nothing and writes nothing: the durable event,
// timestamp, actor, before/after payload, reason, and hash stay in their
// canonical audit row.

import { getDb } from '../db';

export const USER_AUDIT_ACTIONS = [
  'USER_CREATE',
  'USER_UPDATE',
  'USER_ROLE_CHANGE',
  'USER_ACTIVATE',
  'USER_DEACTIVATE',
  'USER_PASSWORD_RESET',
] as const;

export type UserAuditAction = (typeof USER_AUDIT_ACTIONS)[number];

export const USER_AUDIT_ACTION_LABELS: Record<UserAuditAction, string> = {
  USER_CREATE: 'Created user',
  USER_UPDATE: 'Updated user',
  USER_ROLE_CHANGE: 'Changed role',
  USER_ACTIVATE: 'Activated user',
  USER_DEACTIVATE: 'Deactivated user',
  USER_PASSWORD_RESET: 'Reset password',
};

export type UserAuditFilters = {
  action: UserAuditAction | null;
  actor: number | null;
  target: number | null;
  from: string | null;
  to: string | null;
};

export function parseUserAuditFilters(params: URLSearchParams): UserAuditFilters {
  const actionRaw = params.get('action');
  const action = (USER_AUDIT_ACTIONS as readonly string[]).includes(actionRaw ?? '')
    ? actionRaw as UserAuditAction
    : null;
  const asId = (value: string | null): number | null => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  };
  const asDate = (value: string | null): string | null => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? value : null;
  return { action, actor: asId(params.get('actor')), target: asId(params.get('target')), from: asDate(params.get('from')), to: asDate(params.get('to')) };
}

export function userAuditFiltersToQuery(filters: UserAuditFilters): string {
  const params = new URLSearchParams();
  if (filters.action) params.set('action', filters.action);
  if (filters.actor) params.set('actor', String(filters.actor));
  if (filters.target) params.set('target', String(filters.target));
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function listUserAuditActors(): Array<{ id: number; full_name: string }> {
  return getDb().prepare(`
    SELECT DISTINCT u.id, u.full_name
    FROM qc_audit_log a JOIN users u ON u.id = a.actor_id
    WHERE a.entity_type = 'USER'
    ORDER BY u.full_name COLLATE NOCASE, u.id
  `).all() as Array<{ id: number; full_name: string }>;
}

export function listUserAuditTargets(): Array<{ id: number; full_name: string; username: string }> {
  return getDb().prepare(`
    SELECT DISTINCT u.id, u.full_name, u.username
    FROM qc_audit_log a JOIN users u ON u.id = a.entity_id
    WHERE a.entity_type = 'USER'
    ORDER BY u.full_name COLLATE NOCASE, u.id
  `).all() as Array<{ id: number; full_name: string; username: string }>;
}

export type UserAuditTimelineEntry = {
  id: number;
  created_at: string;
  action: UserAuditAction;
  actor_name: string;
  actor_username: string;
  target_name: string;
  target_username: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  previous_hash: string | null;
  event_hash: string | null;
};

export function searchUserAuditTimeline(filters: UserAuditFilters): UserAuditTimelineEntry[] {
  const clauses = ["a.entity_type = 'USER'"];
  const values: unknown[] = [];
  if (filters.action) { clauses.push('a.action = ?'); values.push(filters.action); }
  if (filters.actor) { clauses.push('a.actor_id = ?'); values.push(filters.actor); }
  if (filters.target) { clauses.push('a.entity_id = ?'); values.push(filters.target); }
  if (filters.from) { clauses.push('date(a.created_at) >= date(?)'); values.push(filters.from); }
  if (filters.to) { clauses.push('date(a.created_at) <= date(?)'); values.push(filters.to); }
  return getDb().prepare(`
    SELECT a.id, a.created_at, a.action, a.old_value, a.new_value, a.note, a.previous_hash, a.event_hash,
           actor.full_name AS actor_name, actor.username AS actor_username,
           target.full_name AS target_name, target.username AS target_username
    FROM qc_audit_log a
    JOIN users actor ON actor.id = a.actor_id
    JOIN users target ON target.id = a.entity_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY a.created_at DESC, a.id DESC
  `).all(...values) as UserAuditTimelineEntry[];
}
