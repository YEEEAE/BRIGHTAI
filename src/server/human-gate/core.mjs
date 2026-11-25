import { createHash } from 'node:crypto';
import { KernelError } from '../kernel/core.mjs';

// APPROVED is not executable by itself: the server consumes a bound grant once.
export const statuses = ['PENDING','APPROVED','REJECTED','EXPIRED','CANCELLED','EXECUTED'];
export const riskReviewOperation = 'RISK_ASSESSMENT_REVIEW';
export const operations = ['KERNEL_WORKSPACE_RENAME','INTERNAL_DEMO_NOTE','FIREWALL_ESCALATION_REVIEW',riskReviewOperation];
export const requiresIndependence = (type, policy) => policy?.separation_of_duties !== false ||
 ['KERNEL_WORKSPACE_RENAME','FIREWALL_ESCALATION_REVIEW',riskReviewOperation].includes(type);
export const reviewLevels = ['ADMIN','OWNER'];
export const terminalReasons = ['TIMEOUT','POLICY_CHANGED','TARGET_CHANGED','AUTHORITY_CHANGED','LEGACY_UNBOUND','BINDING_UPGRADED','CANCELLED_BY_REQUESTER','CANCELLED_BY_REVIEWER'];
// Only these transitions are accepted by the server; the database guard repeats them.
export const transitions = Object.freeze({
 PENDING: ['APPROVED','REJECTED','EXPIRED','CANCELLED'],
 APPROVED: ['EXECUTED','EXPIRED','CANCELLED'],
 REJECTED: [],
 EXPIRED: [],
 CANCELLED: [],
 EXECUTED: [],
});
export const roleRank = Object.freeze({ MEMBER: 1, ADMIN: 2, OWNER: 3 });
export const bindingVersion = 'human-gate-binding-v3';
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const admin = member => ['OWNER','ADMIN'].includes(member?.role);
export const meetsLevel = (role, level) => (roleRank[role] ?? 0) >= (roleRank[level] ?? Number.POSITIVE_INFINITY);
export const canTransition = (from, to) => (transitions[from] ?? []).includes(to);
export const providerFor = type => type === 'INTERNAL_DEMO_NOTE' ? 'aigas-internal' : 'aigas-kernel';
export function exact(body, keys) {
 if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !keys.includes(k))) throw new KernelError(400,'INVALID_BODY','حقول الطلب غير مسموحة.');
}
export function text(value,max=500) {
 if(typeof value !== 'string' || value.trim().length < 2 || value.trim().length > max || /[\u0000-\u001f\u007f]/u.test(value)) throw new KernelError(400,'INVALID_TEXT',`اكتب نصًا غير حساس من حرفين إلى ${max} حرفًا دون محارف تحكم.`);
 return value.trim();
}
export function minutes(value) {
 // Technical bounds, not a license duration or an approved universal SLA.
 if(!Number.isInteger(value) || value < 1 || value > 1440) throw new KernelError(400,'INVALID_DURATION','اختر مهلة صحيحة من دقيقة إلى 1440 دقيقة ضمن الحد التقني.');
 return value;
}
export function binding(request) {
 const payload=request.payload;
 let fields;
 if(request.operation_type === 'KERNEL_WORKSPACE_RENAME') {
  exact(payload,['expected_name','expected_version','new_name']);
  fields=[payload.expected_name,String(payload.expected_version),payload.new_name];
 }
 else if(request.operation_type === 'INTERNAL_DEMO_NOTE') {
  exact(payload,['note']);
  fields=[payload.note];
 }
 else if(request.operation_type === 'FIREWALL_ESCALATION_REVIEW') {
  exact(payload,['decision_id','rule_id','rule_version','request_fingerprint']);
  if(!uuid(payload.decision_id)||(!uuid(payload.rule_id) && !(typeof payload.rule_id==='string' && /^[a-z][a-z0-9-]{1,63}$/.test(payload.rule_id)))||!Number.isInteger(payload.rule_version)||payload.rule_version<1||!/^[0-9a-f]{64}$/.test(payload.request_fingerprint)) throw new KernelError(409,'INVALID_BINDING','Invalid Firewall metadata');
  fields=[payload.decision_id,payload.rule_id,payload.rule_version,payload.request_fingerprint];
 }
 else if(request.operation_type === riskReviewOperation) {
  exact(payload,['asset_id','asset_version','method_version']);
  if(!uuid(payload.asset_id)||!Number.isInteger(payload.asset_version)||payload.asset_version<1||typeof payload.method_version!=='string'||!/^[a-zA-Z0-9_.:-]{1,120}$/.test(payload.method_version)) throw new KernelError(409,'INVALID_BINDING','Invalid risk assessment metadata');
  fields=[payload.asset_id,payload.asset_version,payload.method_version];
 }
 else throw new KernelError(409,'OPERATION_MISMATCH','نوع العملية غير معتمد في هذا المسار.');
 return createHash('sha256').update(JSON.stringify([
  bindingVersion,request.tenant_id,request.requester_id,request.operation_type,
  request.provider_ref ?? providerFor(request.operation_type),
  request.subject_ref,request.policy_version,
  fields
 ])).digest('hex');
}
export function decisionAllowed(request,userId,policy,authority) {
 if(request.status !== 'PENDING' || !authority?.allowed) return false;
 // Separation of duties is a policy switch, defaulting to required.
 if(requiresIndependence(request.operation_type, policy) && request.requester_id === userId) return false;
 return true;
}
export function cancelAllowed(request,member,userId) {
 if(!['PENDING','APPROVED'].includes(request.status)) return false;
 return request.requester_id === userId || admin(member);
}
