import { KernelError } from '../kernel/core.mjs';
export const statuses = ['PENDING','APPROVED','REJECTED'];
export const uuid = value => typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function exact(body, keys) {
 if (!body || typeof body!=='object' || Array.isArray(body) || Object.keys(body).some(k=>!keys.includes(k))) throw new KernelError(400,'INVALID_BODY','حقول الطلب غير مسموحة.');
}
export function text(value,max=500) {
 if(typeof value!=='string'||value.trim().length<2||value.trim().length>max||/[\u0000-\u001f\u007f]/u.test(value))throw new KernelError(400,'INVALID_TEXT',`اكتب نصًا غير حساس من حرفين إلى ${max} حرفًا دون محارف تحكم.`);
 return value.trim();
}
export function decisionAllowed(member,request,userId) {
 return ['OWNER','ADMIN'].includes(member.role) && request.requester_id!==userId && request.status==='PENDING';
}
