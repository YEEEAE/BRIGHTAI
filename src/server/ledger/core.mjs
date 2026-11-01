import { createHash, timingSafeEqual } from 'node:crypto';
import { KernelError } from '../kernel/core.mjs';

export const legacyProfile = 'aigas-ledger-sha256-v1';
export const profile = 'aigas-ledger-sha256-chain-v2';
export const syntheticTypes = ['synthetic.test.created', 'synthetic.review.recorded'];
export const sourceTypes = {
  'ledger.synthetic-lab': syntheticTypes,
  firewall: ['firewall.decision.recorded'],
  'human-gate': ['human_gate.request.created', 'human_gate.decision.recorded', 'human_gate.demo_note.completed'],
  'risk-engine': ['risk_engine.asset.created', 'risk_engine.asset.updated', 'risk_engine.assessment.created'],
  kernel: ['kernel.audit.recorded'],
};
export const types = Object.values(sourceTypes).flat();
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const digest = value => createHash('sha256').update(value, 'utf8').digest('hex');
export const sortedMetadata = value => Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]]));
export function exactObject(value, allowed) {
  if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).some(k => !allowed.includes(k))) throw new KernelError(400, 'INVALID_BODY', 'حقول الطلب غير مسموحة.');
  return value;
}
export function metadata(value, source = 'ledger.synthetic-lab', eventType) {
  const keys = {
    'ledger.synthetic-lab': ['synthetic', 'scenario', 'outcome', 'decision_ref'],
    firewall: ['synthetic', 'decision_ref', 'action', 'mode', 'rule_ref', 'rule_version'],
    'human-gate': ['synthetic', 'request_ref', 'decision_ref', 'decision', 'operation_scope'],
    'risk-engine': ['synthetic', 'asset_ref', 'asset_version', 'assessment_ref', 'risk_level'],
    kernel: ['synthetic', 'audit_ref', 'action'],
  }[source];
  if (!keys) throw new Error('Unknown source');
  exactObject(value, [...keys,'evidence_policy_version']);
  if (value.evidence_policy_version !== undefined && (typeof value.evidence_policy_version !== 'string' || !/^[a-zA-Z0-9_.:-]{1,120}$/.test(value.evidence_policy_version))) throw new Error('Invalid evidence policy');
  if (typeof value.synthetic !== 'boolean') throw new Error('Missing classification');
  for (const [key, val] of Object.entries(value)) {
    if (key.endsWith('_ref') && val !== null && !uuid(val)) throw new Error('Invalid reference');
    if (['asset_version','rule_version'].includes(key) && val !== null && (!Number.isSafeInteger(val) || val < 1)) throw new Error('Invalid version');
  }
  if (source === 'ledger.synthetic-lab' && (value.synthetic !== true || !['integrity-check','access-check'].includes(value.scenario) || !['RECORDED','REVIEWED'].includes(value.outcome) || !uuid(value.decision_ref))) throw new Error('Invalid synthetic metadata');
  if (source === 'firewall' && (value.synthetic !== true || !uuid(value.decision_ref) || !['ALLOW','BLOCK','REDACT'].includes(value.action) || !['LAB','GUARD'].includes(value.mode) || !(value.rule_ref === null || uuid(value.rule_ref)) || !(value.rule_version === null || Number.isSafeInteger(value.rule_version)))) throw new Error('Invalid firewall metadata');
  if (source === 'human-gate' && (value.synthetic !== true || !uuid(value.request_ref) || value.operation_scope !== 'INTERNAL_DEMO_NOTE' || (eventType === 'human_gate.decision.recorded' && (!uuid(value.decision_ref) || !['APPROVE','REJECT'].includes(value.decision))))) throw new Error('Invalid approval metadata');
  if (source === 'risk-engine' && (value.synthetic !== false || !uuid(value.asset_ref) || !Number.isSafeInteger(value.asset_version) || (eventType === 'risk_engine.assessment.created' && (!uuid(value.assessment_ref) || !['LOW','MEDIUM','HIGH'].includes(value.risk_level))))) throw new Error('Invalid risk metadata');
  if (source === 'kernel' && (value.synthetic !== false || !uuid(value.audit_ref) || typeof value.action !== 'string' || !/^(workspace\.created|kernel\.[a-z_.-]+)$/.test(value.action) || value.action.length > 100)) throw new Error('Invalid kernel metadata');
  return sortedMetadata(value);
}
export const eventFields = ['event_id','source','event_type','policy_version','metadata_json','created_at','created_by','hash_profile','sequence_no','previous_hash','idempotency_key'];
export function canonical(event) {
  if (!uuid(event.event_id) || !uuid(event.tenant_id) || !uuid(event.created_by) || !sourceTypes[event.source]?.includes(event.event_type) || typeof event.policy_version !== 'string' || !/^[a-zA-Z0-9_.:-]{1,120}$/.test(event.policy_version)) throw new Error('Invalid event');
  const time = new Date(event.created_at);
  if (!Number.isFinite(time.getTime())) throw new Error('Invalid time');
  const m = metadata(event.metadata_json, event.source, event.event_type);
  if (event.hash_profile === legacyProfile) {
    if (event.source !== 'ledger.synthetic-lab' || event.policy_version !== 'foundation-v1' || Object.hasOwn(m,'evidence_policy_version')) throw new Error('Invalid legacy event');
    return JSON.stringify([legacyProfile,event.tenant_id,event.event_id,event.source,event.event_type,event.policy_version,{synthetic:m.synthetic,scenario:m.scenario,outcome:m.outcome,decision_ref:m.decision_ref},time.toISOString(),event.created_by]);
  }
  if (event.hash_profile !== profile || !/^[1-9]\d*$/.test(String(event.sequence_no)) || !(event.previous_hash === null || /^[0-9a-f]{64}$/.test(event.previous_hash)) || !/^[a-zA-Z0-9_.:-]{1,180}$/.test(event.idempotency_key)) throw new Error('Invalid chain');
  return JSON.stringify([profile,event.tenant_id,event.event_id,event.source,event.event_type,event.policy_version,m,time.toISOString(),event.created_by,String(event.sequence_no),event.previous_hash,event.idempotency_key]);
}
export const hashEvent = event => digest(canonical(event));
export function verifyEvent(stored, candidate) {
  try {
    if (candidate !== undefined) {
      exactObject(candidate, eventFields);
      if (eventFields.some(k => !Object.hasOwn(candidate, k))) throw new Error('Incomplete candidate');
    }
    const computed = hashEvent(candidate === undefined ? stored : {...candidate,tenant_id:stored.tenant_id});
    if (!/^[0-9a-f]{64}$/.test(stored.integrity_hash)) return 'INDETERMINATE';
    return timingSafeEqual(Buffer.from(computed,'hex'),Buffer.from(stored.integrity_hash,'hex')) ? 'MATCH' : 'MISMATCH';
  } catch { return 'INDETERMINATE'; }
}
export function filters(params) {
  const type = params.get('type') || '', source = params.get('source') || '', classification = params.get('classification') || '';
  const period = params.get('period') || 'all', page = params.get('page') || '1', search = (params.get('q') || '').trim();
  if ((type && !types.includes(type)) || (source && !Object.hasOwn(sourceTypes,source)) || (classification && !['synthetic','operational'].includes(classification)) || !['all','1','7','30'].includes(period) || !/^[1-9]\d{0,2}$/.test(page) || Number(page)>100 || search.length>80 || /[\u0000-\u001f\u007f]/.test(search)) throw new KernelError(400,'INVALID_FILTER','التصفية غير صالحة؛ حد البحث 80 حرفًا وحد العرض 100 صفحة.');
  return {type,source,classification,days:period==='all'?null:Number(period),page:Number(page),limit:25,search};
}
