import { createHash } from 'node:crypto';
import { KernelError } from '../kernel/core.mjs';
export const statuses = ['PENDING','APPROVED','REJECTED','EXPIRED','EXECUTED'];
export const operations = ['KERNEL_WORKSPACE_RENAME','INTERNAL_DEMO_NOTE'];
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const admin = member => ['OWNER','ADMIN'].includes(member?.role);
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
 if(request.operation_type === 'KERNEL_WORKSPACE_RENAME') exact(payload,['expected_name','expected_version','new_name']);
 else if(request.operation_type === 'INTERNAL_DEMO_NOTE') exact(payload,['note']);
 else throw new KernelError(409,'OPERATION_MISMATCH','نوع العملية غير معتمد في هذا المسار.');
 return createHash('sha256').update(JSON.stringify([
  'human-gate-binding-v2',request.tenant_id,request.requester_id,request.operation_type,
  request.subject_ref,request.policy_version,
  request.operation_type === 'KERNEL_WORKSPACE_RENAME' ? [payload.expected_name,String(payload.expected_version),payload.new_name] : [payload.note]
 ])).digest('hex');
}
export function decisionAllowed(member,request,userId) {
 return admin(member) && request.requester_id !== userId && request.status === 'PENDING';
}
