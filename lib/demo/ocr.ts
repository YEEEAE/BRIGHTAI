import { z } from "zod";

export const SUPPORTED_OCR_FILE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const;

export const OcrInputSchema = z.object({
  documentKind: z.enum(["invoice", "contract", "receipt", "identity", "medical"]).default("invoice"),
  prompt: z.string().min(8).max(12000),
  fileName: z.string().max(180).optional(),
  fileMime: z.string().max(80).optional(),
  fileBase64: z.string().max(7_000_000).optional()
});

export const OcrFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.string()
});

export const OcrResultSchema = z.object({
  documentType: z.string(),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  extractedFields: z.array(OcrFieldSchema),
  missingFields: z.array(z.string()),
  validationRules: z.array(z.string()),
  erpPayload: z.record(z.string(), z.string()),
  riskFlags: z.array(z.string()),
  nextActions: z.array(z.string())
});

export type OcrInput = z.infer<typeof OcrInputSchema>;
export type OcrResult = z.infer<typeof OcrResultSchema>;

export const OCR_SAMPLE_INPUT = `فاتورة مشتريات رقم INV-2048 من شركة مدار التقنية إلى شركة برايت اي آي.
التاريخ 1447/08/18، الإجمالي قبل الضريبة 18,500 ريال، ضريبة القيمة المضافة 2,775 ريال، الإجمالي 21,275 ريال.
السداد خلال 30 يوم عبر تحويل بنكي. البنود: رخص منصة أتمتة وثائق، إعداد تكامل ERP، تدريب فريق المالية.`;

export const OCR_FALLBACK_RESULT: OcrResult = {
  documentType: "فاتورة مشتريات",
  summary:
    "تم تصنيف المستند كفاتورة مشتريات قابلة للربط مع نظام مالي. الحقول المالية الرئيسية واضحة، مع حاجة لمراجعة رقم السجل والرقم الضريبي قبل الاعتماد.",
  confidence: 0.91,
  extractedFields: [
    {
      key: "invoice_number",
      label: "رقم الفاتورة",
      value: "INV-2048",
      confidence: 0.96,
      source: "السطر الأول"
    },
    {
      key: "vendor_name",
      label: "المورّد",
      value: "شركة مدار التقنية",
      confidence: 0.9,
      source: "رأس المستند"
    },
    {
      key: "buyer_name",
      label: "العميل",
      value: "شركة برايت اي آي",
      confidence: 0.94,
      source: "رأس المستند"
    },
    {
      key: "subtotal",
      label: "الإجمالي قبل الضريبة",
      value: "18,500 ريال",
      confidence: 0.93,
      source: "ملخص الفاتورة"
    },
    {
      key: "tax_amount",
      label: "ضريبة القيمة المضافة",
      value: "2,775 ريال",
      confidence: 0.93,
      source: "ملخص الفاتورة"
    },
    {
      key: "total_amount",
      label: "الإجمالي",
      value: "21,275 ريال",
      confidence: 0.95,
      source: "ملخص الفاتورة"
    },
    {
      key: "payment_terms",
      label: "شروط السداد",
      value: "خلال 30 يوم عبر تحويل بنكي",
      confidence: 0.88,
      source: "قسم السداد"
    }
  ],
  missingFields: ["الرقم الضريبي للمورد", "السجل التجاري", "آيبان الحساب البنكي"],
  validationRules: [
    "مطابقة الإجمالي مع حاصل جمع الإجمالي قبل الضريبة والضريبة.",
    "التحقق من الرقم الضريبي قبل ترحيل الفاتورة.",
    "منع الاعتماد الآلي إذا انخفضت ثقة أي حقل مالي عن 85%."
  ],
  erpPayload: {
    document_type: "vendor_invoice",
    invoice_number: "INV-2048",
    vendor_name: "شركة مدار التقنية",
    buyer_name: "شركة برايت اي آي",
    subtotal_sar: "18500",
    vat_sar: "2775",
    total_sar: "21275",
    payment_terms_days: "30"
  },
  riskFlags: ["حقول امتثال ضريبي ناقصة", "يحتاج اعتماد بشري قبل الترحيل"],
  nextActions: [
    "إرسال الحقول الناقصة للمراجع المالي.",
    "ربط payload مع شاشة فواتير الموردين في ERP.",
    "حفظ سجل تدقيق بدون تخزين صورة المستند في الديمو العام."
  ]
};

export function buildOcrPrompt(input: OcrInput): string {
  return `حلل المستند التالي لصالح ديمو Bright AI لأتمتة الوثائق في السوق السعودي.
نوع المستند المتوقع: ${input.documentKind}
اسم الملف: ${input.fileName ?? "لا يوجد"}
نوع الملف: ${input.fileMime ?? "لا يوجد"}

المطلوب:
1. صنف نوع المستند.
2. استخرج الحقول المهمة مع مستوى الثقة ومصدر الحقل.
3. اذكر الحقول الناقصة وقواعد التحقق قبل الترحيل.
4. أعد JSON مطابقاً لهذا الشكل فقط: documentType, summary, confidence, extractedFields, missingFields, validationRules, erpPayload, riskFlags, nextActions.
5. لا تعط قراراً نهائياً ولا تخزن أي بيانات.

النص أو وصف المستند:
${input.prompt}`;
}
