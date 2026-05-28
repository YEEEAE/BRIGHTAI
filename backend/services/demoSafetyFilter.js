const { createHttpError } = require('../utils/httpErrors');

const MEDICAL_BLOCK_PATTERNS = [
  /شخّ?ص|تشخيص|diagnos/i,
  /علاج|جرعة|دواء|وصفة|medication|dosage|treatment/i,
  /ألم صدر|نزيف|جلطة|سكتة|انتحار|طوارئ/i
];

const EDUCATION_REAL_STUDENT_PATTERNS = [
  /رقم الهوية|السجل المدني|هوية طالب|student id|national id/i,
  /\b\d{10}\b/,
  /اسم الطالب[:：]\s*\S+\s+\S+/i
];

const TENDER_WARNING_PATTERNS = [
  /التزام قانوني نهائي|رأي قانوني نهائي|اضمن الفوز|guarantee win/i
];

function joinInput(input) {
  return [
    input?.scenarioId,
    input?.message,
    JSON.stringify(input?.metadata || {})
  ].filter(Boolean).join('\n');
}

function assertSafeDemoInput(demoType, input) {
  const text = joinInput(input);

  if (demoType === 'smart-hospital-management' && MEDICAL_BLOCK_PATTERNS.some(pattern => pattern.test(text))) {
    throw createHttpError('MEDICAL_CONTENT_BLOCKED');
  }

  if (demoType === 'smart-education-platform' && EDUCATION_REAL_STUDENT_PATTERNS.some(pattern => pattern.test(text))) {
    throw createHttpError('UNSAFE_CONTENT_DETECTED', {
      userMessage: 'لا يمكن استخدام بيانات طلاب حقيقية في الديمو. استخدم بيانات افتراضية أو مجهولة فقط.'
    });
  }

  if (/<script|javascript:|onerror\s*=|eval\s*\(/i.test(text)) {
    throw createHttpError('UNSAFE_CONTENT_DETECTED');
  }

  return {
    legalNoticeRequired: demoType === 'tenders-analysis',
    tenderRiskFlag: demoType === 'tenders-analysis' && TENDER_WARNING_PATTERNS.some(pattern => pattern.test(text))
  };
}

function appendSafetyNotice(demoType, output) {
  if (!output || typeof output !== 'object') return output;
  const notices = Array.isArray(output.safetyNotices) ? [...output.safetyNotices] : [];
  if (demoType === 'tenders-analysis') {
    notices.push('تنبيه: هذا التحليل إرشادي ولا يغني عن مراجعة قانونية أو امتثال رسمي قبل التقديم.');
  }
  if (demoType === 'smart-hospital-management') {
    notices.push('تنبيه: المخرجات تشغيلية فقط ولا تمثل تشخيصاً أو توصية علاجية فردية.');
  }
  if (demoType === 'smart-medical-archive') {
    notices.push('تنبيه: هذه التجربة تستخرج وتنظم البيانات السريرية لأغراض الأرشفة فقط، ولا تقدم تشخيصاً أو توصية علاجية.');
  }
  if (demoType === 'smart-education-platform') {
    notices.push('تنبيه: استخدم بيانات طلاب مجهولة أو افتراضية فقط داخل الديمو.');
  }
  if (demoType === 'smart-hiring-system') {
    notices.push('تنبيه: تقييم التوظيف مساعد قرار فقط، ويجب تجاهل العوامل الشخصية ومراجعة النتيجة بشرياً قبل أي إجراء.');
  }
  if (demoType === 'customer-service-automation') {
    notices.push('تنبيه: تجربة خدمة العملاء تحاكي الأدوات ولا تنفذ استرجاعاً أو تصعيداً فعلياً بدون اعتماد بشري.');
  }
  return { ...output, safetyNotices: [...new Set(notices)] };
}

module.exports = {
  assertSafeDemoInput,
  appendSafetyNotice
};
