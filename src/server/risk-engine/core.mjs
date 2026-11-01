import { KernelError } from '../kernel/core.mjs';
export const METHOD_VERSION = 'draft-likelihood-impact-v1';
export const classifications = ['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED'];
export const assetFields = ['name','owner','purpose','data_classification'];
export const controls = {
 LOW:'وثّق نطاق الاستخدام وراجعه عند تغير البيانات أو الغرض.',
 MEDIUM:'قلّل البيانات والصلاحيات، واختبر المخرجات قبل الاعتماد البشري.',
 HIGH:'اطلب مراجعة مختص للخصوصية والأمن والسلامة وحدّد ضوابط قبل أي قرار تشغيل.',
};
export function exact(value, fields) {
 if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k=>!fields.includes(k))) throw new KernelError(400,'INVALID_BODY','حقول الطلب غير مسموحة.');
}
export function text(value, max=500) {
 if(typeof value!=='string'||value.trim().length<2||value.trim().length>max||/[\u0000-\u001f\u007f]/u.test(value.replace(/[\n\r\t]/g,'')))throw new KernelError(400,'INVALID_TEXT',`اكتب نصًا من حرفين إلى ${max} حرف دون رموز تحكم.`);
 return value.trim();
}
export function version(value) {
 if(!Number.isSafeInteger(value)||value<1)throw new KernelError(400,'INVALID_VERSION','نسخة حالة الاستخدام غير صالحة.');
 return value;
}
export function uuid(value) {return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);}
export function assetInput(body) {
 if(!classifications.includes(body.data_classification))throw new KernelError(400,'INVALID_CLASSIFICATION','اختر تصنيف البيانات.');
 return {name:text(body.name,120),owner:text(body.owner,120),purpose:text(body.purpose),data_classification:body.data_classification};
}
// Draft rule only: 1–2 LOW, 3–4 MEDIUM, 6–9 HIGH. No model or regulatory claim.
export function evaluate(likelihood, impact) {
 if(![1,2,3].includes(likelihood)||![1,2,3].includes(impact))throw new KernelError(400,'INVALID_MATRIX','الاحتمال والأثر عددان صحيحان من 1 إلى 3.');
 const score=likelihood*impact,risk_level=score<=2?'LOW':score<=4?'MEDIUM':'HIGH';
 return {score,risk_level,method_version:METHOD_VERSION,explanation:`الاحتمال ${likelihood} × الأثر ${impact} = ${score}؛ التصنيف ${risk_level} حسب مسودة المصفوفة.`,suggested_control:controls[risk_level]};
}
export function assessmentInput(body) {
 return {...evaluate(body.likelihood,body.impact),likelihood:body.likelihood,impact:body.impact,likelihood_reason:text(body.likelihood_reason),impact_reason:text(body.impact_reason),controls_reason:text(body.controls_reason),asset_version:version(body.asset_version)};
}
