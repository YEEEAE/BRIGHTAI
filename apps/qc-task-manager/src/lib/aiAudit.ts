import { getDb } from './db';

export function recordAiAudit(input: { userId: number; feature: string; model: string; requestReference: string; responseReference: string | null; success: boolean; failureReason?: string }): void {
  getDb().prepare(`INSERT INTO ai_audit_log (user_id, feature, model, request_reference, response_reference, success, failure_reason) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(input.userId, input.feature.slice(0, 100), input.model.slice(0, 150), input.requestReference, input.responseReference, input.success ? 1 : 0, input.failureReason?.slice(0, 100) ?? null);
}
