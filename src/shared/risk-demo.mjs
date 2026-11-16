// Synthetic teaching rules only; these do not measure control effectiveness.
export const riskAssets = {
 privacy: { name: 'مساعد خدمة عملاء خيالي', risk: 'تسريب بيانات عميل من محادثة مولّدة', likelihood: 3, impact: 3, owner: 'ليان · مالكة افتراضية', reason: 'تكرار المحادثات يرفع فرص الكشف، والبيانات الشخصية تزيد شدة الضرر.' },
 content: { name: 'مساعد مسودات تسويقية خيالي', risk: 'نشر معلومة غير دقيقة عن منتج افتراضي', likelihood: 2, impact: 1, owner: 'سامي · مالك افتراضي', reason: 'قد تظهر معلومات غير دقيقة، لكن المسودة قابلة للتصحيح قبل النشر.' },
};
export const riskLevel = score => score <= 2 ? 'منخفض' : score <= 4 ? 'متوسط' : 'مرتفع';
export function riskDemo(input) {
 const asset = riskAssets[input.asset];
 if (!asset || !['sandbox','public'].includes(input.context) || !['reduce','review','avoid'].includes(input.treatment) || !['none','human','redact'].includes(input.control) || ![1,2,3].includes(input.likelihood) || ![1,2,3].includes(input.impact)) throw new Error('مدخلات المثال غير صالحة.');
 const l = input.context === 'public' ? Math.max(2,input.likelihood) : input.likelihood;
 const i = input.impact;
 let rl = l, ri = i;
 let reason = 'لم يُحتسب تخفيض؛ اختيار ضابط وحده لا يثبت فاعليته.';
 if (input.treatment === 'reduce' && input.control === 'human') { rl = Math.max(1,l-1); reason = 'افتراض demo: المراجعة قبل الإرسال تخفض الاحتمال درجة واحدة، ولا تغيّر شدة الأثر.'; }
 if (input.treatment === 'reduce' && input.control === 'redact') {
  if(input.asset === 'privacy') { ri = Math.max(1,i-1); reason = 'افتراض demo: تقليل البيانات المكشوفة يخفض الأثر درجة واحدة، ولا يغيّر الاحتمال.'; }
  else reason = 'إخفاء البيانات لا يعالج دقة المحتوى؛ لذلك لا يتغير التقدير.';
 }
 if(input.treatment === 'avoid') reason = 'التجنب يعلّق حالة الاستخدام في المثال؛ لا يعني أن الخطر أصبح صفرًا. لم يُحتسب تخفيض.';
 if(input.treatment === 'review') reason = 'الإحالة للمراجعة لا تخفض الخطر حسابيًا؛ ينتظر المثال قرار المراجع الافتراضي.';
 const initial = { likelihood:l, impact:i, score:l*i, level:riskLevel(l*i) };
 const residual = { likelihood:rl, impact:ri, score:rl*ri, level:riskLevel(rl*ri) };
 return { marking:'Synthetic', method:'synthetic-risk-demo-v1', asset:asset.name, risk:asset.risk, owner:asset.owner, input:{...input}, initial, residual, initialReason:`${asset.reason} ${input.context === 'public' ? 'سياق الجمهور يضع حدًا أدنى للاحتمال عند 2 كافتراض تعليمي.' : 'السياق بيئة اختبار مغلقة.'} الاحتمال ${l} × الأثر ${i} = ${l*i}.`, residualReason:reason, operationalAcceptance:false };
}
