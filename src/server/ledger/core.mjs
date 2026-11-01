import { createHash, timingSafeEqual } from 'node:crypto';
import { KernelError } from '../kernel/core.mjs';

export const profile = 'aigas-ledger-sha256-v1';
export const types = ['synthetic.test.created', 'synthetic.review.recorded'];
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function exactObject(value, allowed) {
  if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).some(k => !allowed.includes(k))) throw new KernelError(400, 'INVALID_BODY', 'حقول الطلب غير مسموحة.');
  return value;
}
export function metadata(value) {
  exactObject(value, ['synthetic', 'scenario', 'outcome', 'decision_ref']);
  if (value.synthetic !== true || !['integrity-check', 'access-check'].includes(value.scenario) || !['RECORDED', 'REVIEWED'].includes(value.outcome) || !uuid(value.decision_ref)) throw new KernelError(400, 'INVALID_METADATA', 'البيانات الوصفية محصورة في قيم الاختبار المعتمدة.');
  return { synthetic: true, scenario: value.scenario, outcome: value.outcome, decision_ref: value.decision_ref };
}
export const eventFields = ['event_id', 'source', 'event_type', 'policy_version', 'metadata_json', 'created_at', 'created_by'];
export function canonical(event) {
  if (!uuid(event.event_id) || !uuid(event.tenant_id) || !uuid(event.created_by) || event.source !== 'ledger.synthetic-lab' || !types.includes(event.event_type) || event.policy_version !== 'foundation-v1') throw new Error('Invalid event');
  const time = new Date(event.created_at);
  if (!Number.isFinite(time.getTime())) throw new Error('Invalid time');
  const m = metadata(event.metadata_json);
  // Explicit version, field order, UTC milliseconds and metadata order; UTF-8 JSON.
  return JSON.stringify([profile, event.tenant_id, event.event_id, event.source, event.event_type, event.policy_version, { synthetic: m.synthetic, scenario: m.scenario, outcome: m.outcome, decision_ref: m.decision_ref }, time.toISOString(), event.created_by]);
}
export const hashEvent = event => createHash('sha256').update(canonical(event), 'utf8').digest('hex');
export function verifyEvent(stored, candidate) {
  try {
    if (candidate !== undefined) {
      exactObject(candidate, eventFields);
      if (eventFields.some(k => !Object.hasOwn(candidate, k))) throw new Error('Incomplete candidate');
    }
    const computed = hashEvent(candidate === undefined ? stored : { ...candidate, tenant_id: stored.tenant_id });
    if (!/^[0-9a-f]{64}$/.test(stored.integrity_hash)) return 'INDETERMINATE';
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(stored.integrity_hash, 'hex')) ? 'MATCH' : 'MISMATCH';
  } catch { return 'INDETERMINATE'; }
}
export function filters(params) {
  const type = params.get('type') || '';
  const period = params.get('period') || 'all';
  const page = params.get('page') || '1';
  const search = (params.get('q') || '').trim();
  if ((type && !types.includes(type)) || !['all', '1', '7', '30'].includes(period) || !/^[1-9]\d{0,2}$/.test(page) || Number(page) > 100 || search.length > 80) throw new KernelError(400, 'INVALID_FILTER', 'التصفية أو رقم الصفحة غير صالح. الحد الأقصى 100 صفحة و80 حرفًا للبحث.');
  return { type, days: period === 'all' ? null : Number(period), page: Number(page), limit: 25, search };
}
