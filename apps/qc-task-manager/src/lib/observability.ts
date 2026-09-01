import { randomUUID } from 'node:crypto';

export const ERROR_CODES = {
  AUTH: 'AUTH', FORBIDDEN: 'FORBIDDEN', VALIDATION: 'VALIDATION', NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT', STALE_CHANGE: 'STALE_CHANGE', DB: 'DB', REPORT: 'REPORT', UPLOAD: 'UPLOAD', AI: 'AI',
} as const;
export type SafeErrorCode = keyof typeof ERROR_CODES;
const REQUEST_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export function createRequestId(candidate?: string | null): string {
  return candidate && REQUEST_ID_RE.test(candidate) ? candidate : randomUUID();
}
export function getSafeErrorCode(error: unknown): SafeErrorCode {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/unique|constraint/i.test(message)) return 'CONFLICT';
  if (/stale|version|changed since/i.test(message)) return 'STALE_CHANGE';
  if (/upload|file|multipart/i.test(message)) return 'UPLOAD';
  if (/report|export|pdf|csv|xlsx/i.test(message)) return 'REPORT';
  if (/not found|missing/i.test(message)) return 'NOT_FOUND';
  if (/forbidden|permission|unauthori/i.test(message)) return 'FORBIDDEN';
  if (/valid|required|invalid/i.test(message)) return 'VALIDATION';
  return 'DB';
}
export function safeErrorMessage(_error: unknown): string { return 'Something went wrong. Please try again.'; }
export interface RequestLogInput { requestId: string; method: string; route: string; actorId?: number | null; role?: string | null; status: number; durationMs: number; errorCode?: SafeErrorCode | null; timestamp?: string; }
export function createRequestLog(input: RequestLogInput): Record<string, unknown> {
  const entry: Record<string, unknown> = { timestamp: input.timestamp ?? new Date().toISOString(), request_id: input.requestId, method: input.method, route: input.route };
  if (input.actorId != null) entry.actor_id = input.actorId;
  if (input.role) entry.role = input.role;
  entry.status = input.status; entry.duration_ms = Math.max(0, Math.round(input.durationMs));
  if (input.errorCode) entry.error_code = input.errorCode;
  return entry;
}
export function logRequest(entry: Record<string, unknown>, emit: (line: string) => void = console.info): void { emit(JSON.stringify(entry)); }
