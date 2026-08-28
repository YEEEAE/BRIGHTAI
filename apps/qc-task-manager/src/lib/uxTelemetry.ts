import { z } from 'zod';
import { getDb } from './db';
import type { Role } from './types';

export const UX_EVENT_NAMES = [
  'page_view',
  'dashboard_first_action',
  'dashboard_urgent_discovery',
  'dashboard_drilldown',
  'lab_form_submit_attempt',
  'lab_form_submit_success',
  'lab_form_submit_error',
  'search_submit',
  'search_zero_results',
  'search_reformulation',
  'search_result_open',
  'review_decision_attempt',
  'review_decision_success',
  'review_decision_error',
  'review_rework',
] as const;

export type UxEventName = (typeof UX_EVENT_NAMES)[number];
export type UxOutcome = 'success' | 'error' | 'abandoned' | 'neutral';

const metadataKey = z.enum([
  'surface', 'action', 'result', 'section', 'target', 'reason_code',
  'filter_count', 'result_count', 'query_length', 'form_type', 'status',
]);
const metadataValue = z.union([z.string().trim().max(80), z.number().int().min(0).max(1000000)]);
const eventSchema = z.object({
  event_name: z.enum(UX_EVENT_NAMES),
  route: z.string().regex(/^\/[A-Za-z0-9_./-]{0,180}$/),
  outcome: z.enum(['success', 'error', 'abandoned', 'neutral']),
  duration_ms: z.number().int().min(0).max(86400000).nullable().optional(),
  flow_id: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).nullable().optional(),
  metadata: z.record(metadataKey, metadataValue).default({}),
});

export type UxEventInput = z.input<typeof eventSchema>;

export function parseUxEvent(input: unknown) {
  return eventSchema.safeParse(input);
}

export function recordUxEvent(input: UxEventInput, actorRole: Role): void {
  const parsed = eventSchema.parse(input);
  const metadata = JSON.stringify(parsed.metadata);
  getDb().prepare(
    `INSERT INTO ux_events (event_name, route, actor_role, outcome, duration_ms, flow_id, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    parsed.event_name,
    parsed.route,
    actorRole,
    parsed.outcome,
    parsed.duration_ms ?? null,
    parsed.flow_id ?? null,
    metadata,
  );
}

export function cleanupUxEvents(now = Date.now()): number {
  const cutoff = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
  return getDb().prepare('DELETE FROM ux_events WHERE created_at < ?').run(cutoff).changes;
}
