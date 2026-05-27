'use strict';

const piiPatterns = [
  {
    type: 'saudi_id',
    label: 'Saudi National ID / Iqama',
    pattern: /\b(1|2)\d{9}\b/g,
    maskChar: '*',
    maskPreserve: 4,
    riskModifier: 15
  },
  {
    type: 'phone',
    label: 'Saudi Phone Number',
    pattern: /(\+966|966|05|5)([\s-]?\d){7,9}\d\b/g,
    maskChar: '*',
    maskPreserve: 3,
    riskModifier: 5
  },
  {
    type: 'iban',
    label: 'Saudi IBAN',
    pattern: /\bSA\d{2}\s?\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{0,4}\b/gi,
    maskChar: '*',
    maskPreserve: 4,
    riskModifier: 25
  },
  {
    type: 'email',
    label: 'Email Address',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    maskChar: '*',
    maskPreserve: 0,
    riskModifier: 5
  },
  {
    type: 'patient_id',
    label: 'Patient/Medical ID',
    pattern: /\b(?:patient|pt|mrn|medical\.record)[.\s#:]*([A-Z0-9]{4,20})\b/gi,
    maskChar: '*',
    maskPreserve: 2,
    riskModifier: 30
  },
  {
    type: 'credit_card',
    label: 'Credit/Debit Card',
    pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    maskChar: '*',
    maskPreserve: 4,
    riskModifier: 20
  },
  {
    type: 'passport',
    label: 'Passport Number',
    pattern: /\b[A-Z]{1,2}\d{6,9}\b/g,
    maskChar: '*',
    maskPreserve: 0,
    riskModifier: 15
  },
  {
    type: 'ip_address',
    label: 'IP Address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    maskChar: '*',
    maskPreserve: 0,
    riskModifier: 3
  }
];

const sensitiveKeywords = {
  financial: ['salary', 'revenue', 'profit', 'loss', 'budget', 'cost', 'price', 'investment', 'مرتب', 'ربح', 'خسارة', 'ميزانية', 'سعر', 'تكلفة', 'إيرادات', 'استثمار', 'مصروف'],
  medical: ['diagnosis', 'treatment', 'prescription', 'patient', 'dosage', 'surgery', 'lab result', 'تشخيص', 'علاج', 'وصفة', 'مريض', 'جرعة', 'تحليل طبي', 'عملية', 'نتيجة مختبر'],
  corporate: ['confidential', 'secret', 'internal only', 'classified', 'proprietary', 'سري', 'داخلي فقط', 'خاص بالشركة', 'استراتيجي', 'مقيد', 'ملكية فكرية']
};

module.exports = { piiPatterns, sensitiveKeywords };
