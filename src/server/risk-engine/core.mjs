import { KernelError } from '../kernel/core.mjs';
export const METHOD_VERSION = 'draft-likelihood-impact-v1';
export const METHOD_NAME = 'مسودة مصفوفة الاحتمال × الأثر 3×3';
export const treatmentStatuses = ['OPEN','IN_PROGRESS','MITIGATED','ACCEPTED'];
export const treatmentFields = ['asset_version','assessment_id','treatment_version','owner','status','control_description','review_on','rationale'];
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
 return {...evaluate(body.likelihood,body.impact),method_name:METHOD_NAME,likelihood:body.likelihood,impact:body.impact,likelihood_reason:text(body.likelihood_reason),impact_reason:text(body.impact_reason),controls_reason:text(body.controls_reason),evidence_references:body.evidence_references==null||body.evidence_references===''?'':text(body.evidence_references,1000),asset_version:version(body.asset_version)};
}
export function treatmentInput(body) {
 if(!uuid(body.assessment_id)||!Number.isSafeInteger(body.treatment_version)||body.treatment_version<0)throw new KernelError(400,'INVALID_TREATMENT_VERSION','مرجع التقييم أو نسخة المعالجة غير صالحة.');
 if(!treatmentStatuses.includes(body.status))throw new KernelError(400,'INVALID_TREATMENT_STATUS','اختر حالة المعالجة.');
 const review_on=body.review_on===undefined||body.review_on===null||body.review_on===''?null:body.review_on;
 if(review_on!==null&&(typeof review_on!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(review_on)||!Number.isFinite(Date.parse(review_on))||new Date(review_on).toISOString().slice(0,10)!==review_on))throw new KernelError(400,'INVALID_REVIEW_DATE','تاريخ المراجعة غير صالح.');
 return {asset_version:version(body.asset_version),assessment_id:body.assessment_id,treatment_version:body.treatment_version,owner:text(body.owner,120),status:body.status,control_description:text(body.control_description,500),review_on,rationale:text(body.rationale,500)};
}
