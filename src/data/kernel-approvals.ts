/**
 * kernel-approvals.ts — Deterministic approvals dataset for /kernel/approvals/ (M19).
 *
 * M19 — REPLACES the hand-written REPORTS-15 sample rows with a FULL
 * deterministic generator producing 162 rows at BUILD time. No Math.random,
 * no Date.now: a single fixed seed (APPROVAL_SEED) drives a mulberry32 PRNG,
 * so every build yields byte-identical rows. The same algorithm is mirrored
 * byte-for-byte in public/js/kernel-approvals-data.js (browser + Web Worker +
 * Node) so the client can reconstruct the exact dataset deterministically
 * without shipping a JSON payload in the HTML (keeps the 30KB HTML budget).
 *
 * Exact count contract (must never drift — verified by scripts/verify-approvals.mjs):
 *   - pending   = 7    (بانتظار الموافقة — قابلة للقرار)
 *   - critical  = 3    (حرجة — مهلة 4 ساعات)
 *   - review    = 2    (قيد المراجعة)
 *   - approved  = 142  (موافقة — مع reviewer + سبب + وقت القرار)
 *   - rejected  = 8    (رفض — مع سبب إلزامي)
 *   - total     = 162
 *
 * Integrity: each row carries a FNV-1a hash chained from the previous row's
 * hash (genesis = 0x00000000). The chain seals every decision-relevant field
 * (ts, requester, role, title, risk, status, traceId, SLA, PII, policies,
 * what-if, decision metadata) — any tampered field breaks the link. fnv1a is
 * byte-identical to kernel-hash.js / kernel-audit.ts / kernel-datasets.ts.
 *
 * Determinism guarantee between TS (build) and JS (browser/worker):
 *   - mulberry32 is deterministic across JS engines (Math.imul, >>> 0).
 *   - RNG call order is fixed; the statuses array is pre-built with exact
 *     counts then Fisher–Yates-shuffled with the same RNG stream.
 *   - Timestamps are UTC-based (Date.UTC), formatted manually — no locale,
 *     no toLocaleString, so outputs match across environments.
 *   - SLA deadlines are derived from the fixed APPROVAL_NOW anchor; the red
 *     <20% state is computed from stored deadlines, not the client clock.
 *
 * Prompt 20 (immutable rule): every decision → creates an Audit event · links
 * to a Trace · shows in Evidence · reflects in Certificate. The initial
 * approved/rejected rows carry their decision metadata; live decisions are
 * appended to the client-side decision ledger in the engine (still immutable —
 * they are not recomputed into the hash chain, they are new audit events).
 */
export type KernelApprovalStatus = 'pending' | 'critical' | 'review' | 'approved' | 'rejected';

export interface PiiFinding {
  /** Machine key used by the engine to pick the colored highlight class. */
  type: 'name' | 'phone' | 'email' | 'id' | 'financial' | 'medical' | 'address' | 'none';
  /** Display label, Saudi dialect. */
  label: string;
}

export interface KernelApprovalRow {
  /** 0-based index in the time-ascending build order. */
  index: number;
  /** UTC epoch ms (deterministic). */
  ts: number;
  /** Display label, Latin digits, UTC — '2026/07/31 17:42'. */
  tsLabel: string;
  /** ISO date for date filters — '2026-07-31'. */
  tsDate: string;
  traceId: string;
  /** Request title (وصف الطلب، سطرين). */
  title: string;
  /** Full request context shown in the detail panel. */
  context: string;
  requesterId: string;
  requesterLabel: string;
  requesterRole: string;
  /** Risk score 0-100 (3px border + mini counter). */
  risk: number;
  status: KernelApprovalStatus;
  /** SLA deadline (epoch ms). For approved/rejected this is null (no bar). */
  slaDeadline: number | null;
  /** SLA window in hours (pending/review 24, critical 4, else null). */
  slaHours: number | null;
  /** PII scan result — engine colorizes by finding.type. */
  piiFindings: PiiFinding[];
  /** Triggered policies (السياسات المشتعلة). */
  triggeredPolicies: string[];
  /** "ماذا لو وافقت" impact — exactly 3 points. */
  whatIf: string[];
  /** Decision metadata — only for approved/rejected rows. */
  decisionBy: string | null;
  decisionByRole: string | null;
  decisionTs: number | null;
  decisionTsLabel: string;
  decisionReason: string | null;
  /** Previous row's hash in the chain (genesis = 0x00000000). */
  prevHash: string;
  /** FNV-1a(prevHash + '|' + canonical) — the integrity seal. */
  hash: string;
}

export interface KernelApprovalStats {
  total: number;
  pending: number;
  critical: number;
  review: number;
  approved: number;
  rejected: number;
}

/** Fixed seed — changing it changes the whole dataset. Do not change. */
export const APPROVAL_SEED = 0xa4c1e0f2;

export const APPROVAL_TOTAL = 162;
export const APPROVAL_PENDING = 7;
export const APPROVAL_CRITICAL = 3;
export const APPROVAL_REVIEW = 2;
export const APPROVAL_APPROVED = 142;
export const APPROVAL_REJECTED = 8;

/** Time window: 2026-07-01 00:00 → 2026-07-31 23:59 (UTC). */
const TS_START = Date.UTC(2026, 6, 1, 0, 0, 0);
const TS_END = Date.UTC(2026, 6, 31, 23, 59, 59);
/** Fixed "now" anchor used for SLA math — do not use the client clock. */
export const APPROVAL_NOW = Date.UTC(2026, 6, 31, 12, 0, 0);

export const APPROVAL_USERS = [
  { id: 'm.alharbi', label: 'محمد الحربي', role: 'تسويق' },
  { id: 's.alfaisal', label: 'سارة الفيصل', role: 'مالية' },
  { id: 'a.alqahtani', label: 'أحمد القحطاني', role: 'عمليات' },
  { id: 'n.alshahrani', label: 'نورة الشهراني', role: 'قانونية' },
  { id: 'k.alghamdi', label: 'خالد الغامدي', role: 'تقنية' },
] as const;

export const APPROVAL_REVIEWERS = [
  { id: 'y.alotaibi', label: 'يزيد العتيبي', role: 'مدير الحوكمة' },
  { id: 'r.alharbi', label: 'ريم الحربي', role: 'مسؤولة حماية البيانات' },
  { id: 'f.alshamrani', label: 'فهد الشمراني', role: 'مدير المخاطر' },
] as const;

/** Per-dept request templates. Each carries PII findings, policies, what-if. */
interface ApprovalTemplate {
  title: string;
  context: string;
  pii: PiiFinding[];
  policies: string[];
  whatIf: string[];
}

const TEMPLATE_POOL: Record<string, ApprovalTemplate[]> = {
  'تسويق': [
    {
      title: 'تصدير قائمة عملاء لتحليل حملة — 2,400 سجل',
      context: 'طلب تصدير قاعدة عملاء (اسم + هاتف + بريد + عنوان) لأغراض تحليل حملة تسويقية قادمة. النظام رصد PII متعدد الحقول وأوقف التنفيذ بانتظار مراجعة بشرية.',
      pii: [
        { type: 'name', label: 'الاسم' },
        { type: 'phone', label: 'الهاتف' },
        { type: 'email', label: 'البريد' },
        { type: 'address', label: 'العنوان' },
      ],
      policies: ['PDPL §5', 'PDPL §7', 'PII-SCAN'],
      whatIf: [
        'يُصدَّر 2,400 سجل PII لمزود تحليل خارجي — كشف واسع للبيانات.',
        'بدون موافقة شفهية موثّقة: مخالفة PDPL §7 (الموافقة الواضحة).',
        'التأثير: غرامة + إلزام بالإبلاغ خلال 72 ساعة عن أي تسريب.',
      ],
    },
    {
      title: 'تشغيل نموذج توليدي على شرائح العملاء',
      context: 'رغبة بتوليد رسائل بريدية شخصية من سجلات العملاء باستخدام نموذج خارجي. يتطلب مراجعة سياسة معالجة PII قبل الإرسال.',
      pii: [{ type: 'name', label: 'الاسم' }, { type: 'email', label: 'البريد' }],
      policies: ['PDPL §6', 'AI-GOV-2'],
      whatIf: [
        'إرسال رسائل مولّدة لنماذج خارجية — بيانات العملاء تغادر الحدود.',
        'تخصيص الرسائل يعتمد على PII: يتطلب إخفاء قبل الإرسال.',
        'التأثير: تشغيل آمن لو فُعّل إخفاء PII في مسار المعالجة.',
      ],
    },
    {
      title: 'تحليل أداء حملة سابقة مع مزود خارجي',
      context: 'مشاركة أرقام الأداء المجمّعة (نسب نقر، تحويلات) مع مزود تحليلات. لا تحتوي PII — تصنيف أمني منخفض.',
      pii: [{ type: 'none', label: 'لا PII — بيانات مجمّعة' }],
      policies: ['PDPL §3'],
      whatIf: [
        'مشاركة أرقام مجمّعة بدون PII — خطر صفري على الأفراد.',
        'مطابقة لغرض المعالجة: تحسين الحملات، لا جمع إضافي.',
        'التأثير: موافقة سريعة آمنة ومبررة.',
      ],
    },
    {
      title: 'دمج بيانات حملة مع نظام CRM',
      context: 'مزامنة نتائج الحملة مع CRM المؤسسي. البيانات داخل الحدود، بدون مزود خارجي، مع تحكم في الوصول.',
      pii: [{ type: 'name', label: 'الاسم' }, { type: 'phone', label: 'الهاتف' }],
      policies: ['PDPL §6', 'NCA ECC 2.2'],
      whatIf: [
        'التكامل داخل الحدود — لا نقل دولي للبيانات.',
        'الوصول محكوم بأدوار: تقليل سطح الكشف.',
        'التأثير: موافقة معقولة مع اشتراط تدقيق الوصول دوريًا.',
      ],
    },
    {
      title: 'استعلام تلخيصي عن سياسة الإجازات',
      context: 'استعلام توليدي عادي بدون PII عن لوائح الإجازات الداخلية. مخاطر منخفضة جدًا.',
      pii: [{ type: 'none', label: 'لا PII — استعلام داخلي عام' }],
      policies: [],
      whatIf: [
        'لا بيانات شخصية — استعلام عن سياسة عامة.',
        'لا أثر خارجي — النموذج داخلي.',
        'التأثير: موافقة تلقائية آمنة.',
      ],
    },
  ],
  'مالية': [
    {
      title: 'توليد تقرير مالي حساس',
      context: 'تقرير مالي ربع سنوي يحتوي أرقامًا تشغيلية ومجاميع. النظام رصد مشاركة مع طرف خارجي وطلب مراجعة.',
      pii: [{ type: 'none', label: 'لا PII — بيانات تشغيلية' }],
      policies: ['SAMA 1.2', 'DATA-CLASSIFY'],
      whatIf: [
        'تقرير يغادر المؤسسة — تصنيفه «سري» يتطلب موافقة.',
        'مجاميع مالية بدون PII: الخطر على القطاع لا على الأفراد.',
        'التأثير: موافقة بشرية مطلوبة قبل التصدير.',
      ],
    },
    {
      title: 'استعلام عن بيانات بنكية لعملاء',
      context: 'محاولة استعلام توليدي يستهدف أرصدة عملاء. PII مالي حساس — محظور النظام التنفيذ.',
      pii: [{ type: 'financial', label: 'بيانات بنكية' }, { type: 'id', label: 'رقم الهوية' }],
      policies: ['SAMA 1.2', 'PDPL §5', 'PII-SCAN'],
      whatIf: [
        'كشف بيانات مالية لأفراد — انتهاك SAMA و PDPL.',
        'الوصول بدون غرض مشروع واضح.',
        'التأثير: يجب الرفض وفتح تحقيق في من صاغ الطلب.',
      ],
    },
    {
      title: 'مراجعة مدفوعات آلية',
      context: 'مراجعة مجموعة مدفوعات قبل التنفيذ الآلي. يشمل أسماء مستفيدين وأرقام حسابات — يتطلب موافقة مالية.',
      pii: [{ type: 'name', label: 'الاسم' }, { type: 'financial', label: 'رقم الحساب' }],
      policies: ['SAMA 3.4', 'PDPL §6'],
      whatIf: [
        'مدفوعات داخلية محدودة — مصادقة صريحة متاحة.',
        'حسابات مستفيدين PII: يحتاج إخفاء جزئي في السجل.',
        'التأثير: موافقة معقولة مع شرط مراجعة الاستثناءات.',
      ],
    },
    {
      title: 'تلخيص تقرير مصروفات ربع سنوي',
      context: 'توليد ملخص مصروفات من أرقام مجمّعة بدون تفاصيل موظفين. مخاطر منخفضة.',
      pii: [{ type: 'none', label: 'لا PII — مصروفات مجمّعة' }],
      policies: [],
      whatIf: [
        'أرقام مجمّعة فقط — لا يكشف أفرادًا.',
        'غرض داخلي واضح.',
        'التأثير: موافقة سريعة.',
      ],
    },
    {
      title: 'تشغيل نموذج توليدي على سجلات طبية',
      context: 'محاولة استخدام نموذج توليدي لتحليل 580 سجل طبي مع PII. النظام رصد PII متعدد الحقول وطلب مراجعة SFDA.',
      pii: [{ type: 'medical', label: 'سجل طبي' }, { type: 'id', label: 'رقم الهوية' }],
      policies: ['SFDA 2.1', 'PDPL §5', 'PII-SCAN'],
      whatIf: [
        'تحليل بيانات صحية — أعلى مستوى حساسية في PDPL.',
        'يتطلب موافقة إضافية + تصريح SFDA.',
        'التأثير: رفض افتراضي إلا بموافقة الطبيب المعالج.',
      ],
    },
  ],
  'عمليات': [
    {
      title: 'نقل بيانات موردين إلى مزود خارجي',
      context: 'نقل قاعدة موردين (عقود، جهات اتصال) إلى مزود إدارة موردين خارجي. تغيير خارجي يستدعي مراجعة.',
      pii: [{ type: 'name', label: 'الاسم' }, { type: 'phone', label: 'الهاتف' }],
      policies: ['PDPL §6', 'NCA ECC 2.2'],
      whatIf: [
        'بيانات جهات اتصال موردين — مغطاة بـ PDPL.',
        'نقل دولي محتمل: يتطلب ضوابط نقل.',
        'التأثير: موافقة مع شرط معالجة داخل الحدود.',
      ],
    },
    {
      title: 'تعديل قاعدة مورد عبر نموذج توليدي',
      context: 'استخدام نموذج لتعديل/إدخال بيانات مورد. النظام لم يجد PII لكن التغيير على بيانات تشغيلية حرجة.',
      pii: [{ type: 'none', label: 'لا PII — بيانات مورد تشغيلية' }],
      policies: ['NCA ECC 3.1'],
      whatIf: [
        'تعديل بيانات تشغيلية حرجة — خطأ واحد يوقف سلسلة التوريد.',
        'لا PII: الخطر تشغيلي لا خصوصية.',
        'التأثير: موافقة سريعة مع مراجعة الفرق.',
      ],
    },
    {
      title: 'اختبار سيناريو تلخيصي على بيانات إنتاج',
      context: 'تجربة ملخص ذكي لجدول إنتاج في بيئة اختبار معزولة. بدون إنتاج مباشر.',
      pii: [{ type: 'none', label: 'لا PII — بيئة اختبار' }],
      policies: [],
      whatIf: [
        'بيئة معزولة — لا أثر على الإنتاج.',
        'لا بيانات حقيقية.',
        'التأثير: موافقة تلقائية آمنة.',
      ],
    },
    {
      title: 'توليد ملخص تفاوض مع مورد',
      context: 'ملخص ذكي لبنود التفاوض من عقد مورّد. يتضمن أسماء طرف ثالث محتملة.',
      pii: [{ type: 'name', label: 'اسم جهة الاتصال' }],
      policies: ['PDPL §3', 'DATA-CLASSIFY'],
      whatIf: [
        'اسم جهة اتصال PII — إخفاؤه كافٍ.',
        'ملخص داخلي لغرض التفاوض.',
        'التأثير: موافقة مع إخفاء PII تلقائي.',
      ],
    },
    {
      title: 'مراجعة عقد قبل التوقيع',
      context: 'تحليل بنود عقد شراء قبل التوقيع. مستند داخلي حساس بلا PII أفراد.',
      pii: [{ type: 'none', label: 'لا PII — مستند تعاقدي' }],
      policies: ['NCA ECC 3.1'],
      whatIf: [
        'تحليل تعاقدي داخلي — لا كشف خارجي.',
        'النتيجة تُحفظ كدليل للمراجعة.',
        'التأثير: موافقة سريعة.',
      ],
    },
  ],
  'قانونية': [
    {
      title: 'تصدير ملف قضية حساس',
      context: 'تصدير ملف قضية يحتوي بيانات أفراد وأطراف ثالثة. النظام رصد PII حساسًا وأوقف التصدير.',
      pii: [{ type: 'id', label: 'رقم الهوية' }, { type: 'name', label: 'الاسم' }, { type: 'address', label: 'العنوان' }],
      policies: ['PDPL §5', 'DATA-CLASSIFY', 'PII-SCAN'],
      whatIf: [
        'ملف قضية حساس — تسريبه يُعرّض المؤسسة لمسؤولية قانونية.',
        'بيانات أطراف ثالثة: لا يصح إخراجها بدون أساس.',
        'التأثير: رفض افتراضي مع تصعيد للعميد.',
      ],
    },
    {
      title: 'توليد مسودة اتفاقية',
      context: 'توليد مسودة اتفاقية من قالب معياري. النموذج داخلي بدون PII.',
      pii: [{ type: 'none', label: 'لا PII — قالب معياري' }],
      policies: [],
      whatIf: [
        'مسودة من قالب داخلي — لا بيانات أفراد.',
        'غرض قانوني واضح.',
        'التأثير: موافقة سريعة.',
      ],
    },
    {
      title: 'مراجعة امتثال صفقة',
      context: 'مراجعة امتثال صفقة شراء لأطراف تنظيمية (NCA/PDPL). يشمل أسماء شركاء تجاريين.',
      pii: [{ type: 'name', label: 'اسم الشريك' }],
      policies: ['NCA ECC', 'PDPL §6'],
      whatIf: [
        'مراجعة امتثال داخلية — لا كشف.',
        'أسماء شركاء بلا بيانات أفراد.',
        'التأثير: موافقة معقولة.',
      ],
    },
    {
      title: 'استعلام عن معلومات طرف ثالث محمية',
      context: 'استعلام توليدي عن معلومات طرف ثالث محمية بسرية تعاقدية. النظام رصد بند حماية.',
      pii: [{ type: 'id', label: 'رقم الهوية' }, { type: 'financial', label: 'بيانات مالية' }],
      policies: ['PDPL §5', 'DATA-CLASSIFY'],
      whatIf: [
        'كشف معلومات طرف ثالث — انتهاك سرية تعاقدية.',
        'لا غرض قانوني مشروع مبرر.',
        'التأثير: رفض مع إشعار قانوني.',
      ],
    },
    {
      title: 'تلخيص وثيقة قانونية عامة',
      context: 'تلخيص وثيقة تنظيمية عامة منشورة (لوائح). لا PII.',
      pii: [{ type: 'none', label: 'لا PII — وثيقة منشورة' }],
      policies: [],
      whatIf: [
        'مصدر عام منشور — لا خصوصية.',
        'غرض تعليمي/مرجعي.',
        'التأثير: موافقة تلقائية.',
      ],
    },
  ],
  'تقنية': [
    {
      title: 'تغيير إعدادات حساسة على جدار الحماية',
      context: 'طلب تعديل قاعدة جدار حماية في بيئة الإنتاج. تغيير تشغيلي عالي الأثر يتطلب موافقة تقنية.',
      pii: [{ type: 'none', label: 'لا PII — إعدادات بنية' }],
      policies: ['NCA ECC 2.1', 'CHANGE-MGMT'],
      whatIf: [
        'تغيير قواعد الجدار — خطر انقطاع أو فتح ثغرة.',
        'لا PII: الخطر تشغيلي/أمني.',
        'التأثير: موافقة بشرية مع نافذة تنفيذ مراقبة.',
      ],
    },
    {
      title: 'تثبيت مكتبة من مصدر غير موثوق',
      context: 'محاولة تثبيت حزمة npm من مصدر غير مصرح به في بيئة تطوير. النظام رصد مخاطرة سلسلة توريد.',
      pii: [{ type: 'none', label: 'لا PII — حزمة برمجية' }],
      policies: ['NCA ECC 2.1', 'SUPPLY-CHAIN'],
      whatIf: [
        'حزمة غير موثوقة — خطر حقن كود خبيث.',
        'التأثير على بيئة التطوير فقط.',
        'التأثير: رفض افتراضي إلا بمصدر موثوق.',
      ],
    },
    {
      title: 'تحديث نموذج على بيئة الإنتاج',
      context: 'تحديث إصدار نموذج AI في الإنتاج. يتطلب مراجعة تأثير على مسارات الحوكمة.',
      pii: [{ type: 'none', label: 'لا PII — تحديث نموذج' }],
      policies: ['AI-GOV-2', 'CHANGE-MGMT'],
      whatIf: [
        'إصدار جديد — تقييم مخاطر جديد للقرارات الآلية.',
        'لا بيانات أفراد تلمسها الترقية.',
        'التأثير: موافقة مع اختبار انحدار إلزامي.',
      ],
    },
    {
      title: 'تصدير مفاتيح API',
      context: 'محاولة تصدير مفاتيح API لبيئة خارجية. النظام حظر التنفيذ فورًا.',
      pii: [{ type: 'none', label: 'لا PII — مفاتيح أمنية' }],
      policies: ['NCA ECC 2.1', 'SECRETS-MGMT'],
      whatIf: [
        'تسريب مفاتيح = وصول كامل للبنية.',
        'أعلى خطورة تصنيفًا في النظام.',
        'التأثير: رفض نهائي + إبلاغ أمن المعلومات.',
      ],
    },
    {
      title: 'دمج نموذج خارجي مع كشف PII',
      context: 'دمج مزود نموذج خارجي (Cohere) مع طبقة كشف PII. مطلوب مراجعة قبل التفعيل.',
      pii: [{ type: 'none', label: 'لا PII — تكامل نموذج' }],
      policies: ['AI-GOV-2', 'THIRD-PARTY'],
      whatIf: [
        'بيانات تمر عبر مزود خارجي — سياق نقل دولي.',
        'طبقة PII تخفف الكشف قبل الإرسال.',
        'التأثير: موافقة مع اشتراط إخفاء قبل أي إرسال.',
      ],
    },
  ],
};

/** Decision reason pools — deterministic picks for generated decisions. */
const APPROVE_REASONS = [
  'الطلب متوافق مع سياسة PII والغرض مشروع',
  'ضمن حدود التفويض الممنوح للقسم',
  'بيانات مجمّعة بدون PII — الموافقة آمنة',
  'توافق مع ضوابط SDAIA للذكاء التوليدي',
];
const REJECT_REASONS = [
  'يحتوي PII حساسًا بدون غرض واضح',
  'يتجاوز صلاحية القسم (وصول لبيانات محمية)',
  'الغرض من الطلب غير مشروع',
  'مخالفة لسياسة تصدير البيانات',
];

/**
 * mulberry32 — deterministic 32-bit PRNG. Identical across TS/JS engines.
 * Byte-identical to kernel-audit.ts mulberry32().
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a 32-bit → '0x' + 8 hex. Byte-identical to kernel-hash.js fnv1a().
 */
export function fnv1a(str: string): string {
  const s = String(str == null ? '' : str);
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return '0x' + (h >>> 0).toString(16).padStart(8, '0');
}

/** Deterministic Fisher–Yates shuffle (in-place) using the given RNG. */
function shuffle<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** UTC display label 'YYYY/MM/DD HH:MM' (Latin digits, environment-stable). */
export function formatTsLabel(epochMs: number): string {
  const d = new Date(epochMs);
  return (
    d.getUTCFullYear() + '/' + pad2(d.getUTCMonth() + 1) + '/' + pad2(d.getUTCDate()) +
    ' ' + pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes())
  );
}

/** UTC ISO date 'YYYY-MM-DD'. */
export function formatTsDate(epochMs: number): string {
  const d = new Date(epochMs);
  return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
}

/**
 * Canonical string that the hash chain seals. MUST match the JS mirror.
 * Includes every decision-relevant field so any tampering breaks the chain.
 */
export function approvalCanonical(row: Omit<KernelApprovalRow, 'prevHash' | 'hash' | 'tsLabel' | 'tsDate' | 'decisionTsLabel'>): string {
  return [
    String(row.ts),
    row.requesterId,
    row.requesterRole,
    row.title,
    String(row.risk),
    row.status,
    row.traceId,
    row.slaDeadline === null ? '' : String(row.slaDeadline),
    row.piiFindings.map((p) => p.type + ':' + p.label).join('|'),
    row.triggeredPolicies.join('|'),
    row.whatIf.join('|'),
    row.decisionBy || '',
    row.decisionTs === null ? '' : String(row.decisionTs),
    row.decisionReason || '',
  ].join('|');
}

/** SLA hours per actionable status. approved/rejected have no bar. */
export function slaHoursFor(status: KernelApprovalStatus): number | null {
  if (status === 'critical') return 4;
  if (status === 'pending' || status === 'review') return 24;
  return null;
}

/** SLA remaining % at the fixed APPROVAL_NOW anchor (1 = full, 0 = expired). */
export function slaPctLeft(row: Pick<KernelApprovalRow, 'slaDeadline' | 'slaHours' | 'ts'>): number {
  if (row.slaDeadline === null || row.slaHours === null) return 0;
  const total = row.slaHours * 3600000;
  const remaining = row.slaDeadline - APPROVAL_NOW;
  const pct = remaining / total;
  if (pct < 0) return 0;
  if (pct > 1) return 1;
  return pct;
}

/**
 * Builds the full deterministic dataset. Pure — same output on every call.
 * Order after this function: time-ASCENDING; the UI renders it reversed
 * (newest first). The hash chain is computed in time-ascending order.
 */
export function buildApprovalRows(): KernelApprovalRow[] {
  const rand = mulberry32(APPROVAL_SEED);
  const total = APPROVAL_TOTAL;

  // 1) Exact status distribution, then deterministic shuffle.
  const statuses: KernelApprovalStatus[] = [];
  for (let i = 0; i < APPROVAL_PENDING; i += 1) statuses.push('pending');
  for (let i = 0; i < APPROVAL_CRITICAL; i += 1) statuses.push('critical');
  for (let i = 0; i < APPROVAL_REVIEW; i += 1) statuses.push('review');
  for (let i = 0; i < APPROVAL_APPROVED; i += 1) statuses.push('approved');
  for (let i = 0; i < APPROVAL_REJECTED; i += 1) statuses.push('rejected');
  shuffle(statuses, rand);

  // 2) Raw rows in generation order.
  const raw: Array<{
    ts: number;
    userId: string;
    role: string;
    title: string;
    context: string;
    risk: number;
    status: KernelApprovalStatus;
    pii: PiiFinding[];
    policies: string[];
    whatIf: string[];
    decisionBy: string | null;
    decisionByRole: string | null;
    decisionTs: number | null;
    decisionReason: string | null;
  }> = [];
  const span = TS_END - TS_START;
  for (let i = 0; i < total; i += 1) {
    const status = statuses[i];
    const uIdx = Math.floor(rand() * APPROVAL_USERS.length);
    const user = APPROVAL_USERS[uIdx];
    const pool = TEMPLATE_POOL[user.role];
    const tpl = pool[Math.floor(rand() * pool.length)];

    // Actionable rows (pending/critical/review) are RECENT relative to the
    // fixed APPROVAL_NOW anchor so the SLA countdown bar renders a visible
    // decreasing strip (and a few expired ones → red). Decided rows span the
    // full window. Exactly one rand() call regardless of branch — keeps the
    // RNG stream (and the byte-identical JS mirror) deterministic.
    let ts: number;
    if (status === 'critical') {
      // SLA 4h → created within the last ~4.75h → bar ~0–94%, a few red
      ts = APPROVAL_NOW - (15 * 60000 + Math.floor(rand() * 4.75 * 3600000));
    } else if (status === 'pending' || status === 'review') {
      // SLA 24h → created within the last ~21.5h → bar ~10–98%, none expired
      ts = APPROVAL_NOW - (30 * 60000 + Math.floor(rand() * 21 * 3600000));
    } else {
      ts = TS_START + Math.floor(rand() * span);
    }

    // Risk bands per status (keeps the risk gauge meaningful).
    let risk: number;
    if (status === 'pending') risk = 40 + Math.floor(rand() * 46);
    else if (status === 'critical') risk = 86 + Math.floor(rand() * 14);
    else if (status === 'review') risk = 60 + Math.floor(rand() * 26);
    else if (status === 'approved') risk = 1 + Math.floor(rand() * 40);
    else risk = 60 + Math.floor(rand() * 40);

    // Decision metadata only for decided rows (approved/rejected).
    let decisionBy: string | null = null;
    let decisionByRole: string | null = null;
    let decisionTs: number | null = null;
    let decisionReason: string | null = null;
    if (status === 'approved' || status === 'rejected') {
      const rev = APPROVAL_REVIEWERS[Math.floor(rand() * APPROVAL_REVIEWERS.length)];
      decisionBy = rev.id;
      decisionByRole = rev.role;
      decisionTs = ts + Math.floor(rand() * (APPROVAL_NOW - ts));
      const pool2 = status === 'approved' ? APPROVE_REASONS : REJECT_REASONS;
      decisionReason = pool2[Math.floor(rand() * pool2.length)];
    }

    raw.push({
      ts,
      userId: user.id,
      role: user.role,
      title: tpl.title,
      context: tpl.context,
      risk,
      status,
      pii: tpl.pii,
      policies: tpl.policies,
      whatIf: tpl.whatIf,
      decisionBy,
      decisionByRole,
      decisionTs,
      decisionReason,
    });
  }

  // 3) Sort time-ascending, assign index + traceId + SLA + labels.
  raw.sort((a, b) => a.ts - b.ts);

  const rows: KernelApprovalRow[] = [];
  for (let i = 0; i < total; i += 1) {
    const r = raw[i];
    const slaHours = slaHoursFor(r.status);
    const slaDeadline = slaHours === null ? null : r.ts + slaHours * 3600000;
    rows.push({
      index: i,
      ts: r.ts,
      tsLabel: formatTsLabel(r.ts),
      tsDate: formatTsDate(r.ts),
      traceId: 'AI-2026-' + String(21500 + (total - 1 - i)),
      title: r.title,
      context: r.context,
      requesterId: r.userId,
      requesterLabel: APPROVAL_USERS.find((u) => u.id === r.userId)!.label,
      requesterRole: r.role,
      risk: r.risk,
      status: r.status,
      slaDeadline,
      slaHours,
      piiFindings: r.pii,
      triggeredPolicies: r.policies,
      whatIf: r.whatIf,
      decisionBy: r.decisionBy,
      decisionByRole: r.decisionByRole,
      decisionTs: r.decisionTs,
      decisionTsLabel: r.decisionTs === null ? '' : formatTsLabel(r.decisionTs),
      decisionReason: r.decisionReason,
      prevHash: '0x00000000',
      hash: '0x00000000',
    });
  }

  // 4) Hash chain (time-ascending). prevHash of row i = hash of row i-1.
  let prev = '0x00000000';
  for (let i = 0; i < total; i += 1) {
    const row = rows[i];
    row.prevHash = prev;
    row.hash = fnv1a(prev + '|' + approvalCanonical(row));
    prev = row.hash;
  }

  return rows;
}

/** Deterministic stats — recomputed from the generated rows each build. */
export function buildApprovalStats(): KernelApprovalStats {
  const rows = buildApprovalRows();
  let pending = 0;
  let critical = 0;
  let review = 0;
  let approved = 0;
  let rejected = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const s = rows[i].status;
    if (s === 'pending') pending += 1;
    else if (s === 'critical') critical += 1;
    else if (s === 'review') review += 1;
    else if (s === 'approved') approved += 1;
    else rejected += 1;
  }
  return { total: rows.length, pending, critical, review, approved, rejected };
}
