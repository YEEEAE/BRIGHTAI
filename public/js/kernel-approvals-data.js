/**
 * kernel-approvals-data.js — Deterministic approvals dataset, browser/Worker/Node mirror.
 *
 * Byte-for-byte algorithmic mirror of src/data/kernel-approvals.ts. Loaded as a
 * classic UMD script so it works in THREE runtimes without re-writing logic:
 *   - Browser main thread  → window.KernelApprovalsData
 *   - Web Worker           → self.KernelApprovalsData (via importScripts)
 *   - Node (verify script) → module.exports
 *
 * Contract (must never drift — verified by scripts/verify-approvals.mjs):
 *   - pending   = 7
 *   - critical  = 3
 *   - review    = 2
 *   - approved  = 142
 *   - rejected  = 8
 *   - total     = 162
 *
 * Determinism: mulberry32(APPROVAL_SEED) drives every choice. Exact status
 * counts are pre-built then Fisher–Yates-shuffled with the same RNG stream, so
 * the distribution is exact AND the order is reproducible across engines.
 * Timestamps are UTC-based and formatted manually (no locale, no toLocaleString).
 * SLA deadlines are derived from the fixed APPROVAL_NOW anchor — never the
 * client clock.
 *
 * The hash chain (FNV-1a) seals every decision-relevant field against tampering.
 * fnv1a is byte-identical to kernel-hash.js / kernel-audit-data.js / kernel-datasets.ts.
 *
 * CSP: classic script from /js/ ('self'), no unsafe-inline. No external fetch —
 * the dataset is regenerated deterministically in-process (Prompt 19 immutable rule).
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KernelApprovalsData = factory();
  }
})(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var APPROVAL_SEED = 0xa4c1e0f2;
  var APPROVAL_TOTAL = 162;
  var APPROVAL_PENDING = 7;
  var APPROVAL_CRITICAL = 3;
  var APPROVAL_REVIEW = 2;
  var APPROVAL_APPROVED = 142;
  var APPROVAL_REJECTED = 8;
  var APPROVAL_NOW = Date.UTC(2026, 6, 31, 12, 0, 0);

  var TS_START = Date.UTC(2026, 6, 1, 0, 0, 0);
  var TS_END = Date.UTC(2026, 6, 31, 23, 59, 59);

  var APPROVAL_USERS = [
    { id: 'm.alharbi', label: 'محمد الحربي', role: 'تسويق' },
    { id: 's.alfaisal', label: 'سارة الفيصل', role: 'مالية' },
    { id: 'a.alqahtani', label: 'أحمد القحطاني', role: 'عمليات' },
    { id: 'n.alshahrani', label: 'نورة الشهراني', role: 'قانونية' },
    { id: 'k.alghamdi', label: 'خالد الغامدي', role: 'تقنية' },
  ];

  var APPROVAL_REVIEWERS = [
    { id: 'y.alotaibi', label: 'يزيد العتيبي', role: 'مدير الحوكمة' },
    { id: 'r.alharbi', label: 'ريم الحربي', role: 'مسؤولة حماية البيانات' },
    { id: 'f.alshamrani', label: 'فهد الشمراني', role: 'مدير المخاطر' },
  ];

  var TEMPLATE_POOL = {
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

  var APPROVE_REASONS = [
    'الطلب متوافق مع سياسة PII والغرض مشروع',
    'ضمن حدود التفويض الممنوح للقسم',
    'بيانات مجمّعة بدون PII — الموافقة آمنة',
    'توافق مع ضوابط SDAIA للذكاء التوليدي',
  ];
  var REJECT_REASONS = [
    'يحتوي PII حساسًا بدون غرض واضح',
    'يتجاوز صلاحية القسم (وصول لبيانات محمية)',
    'الغرض من الطلب غير مشروع',
    'مخالفة لسياسة تصدير البيانات',
  ];

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fnv1a(str) {
    var s = String(str == null ? '' : str);
    var h = 2166136261;
    for (var i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return '0x' + (h >>> 0).toString(16).padStart(8, '0');
  }

  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatTsLabel(epochMs) {
    var d = new Date(epochMs);
    return (
      d.getUTCFullYear() + '/' + pad2(d.getUTCMonth() + 1) + '/' + pad2(d.getUTCDate()) +
      ' ' + pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes())
    );
  }

  function formatTsDate(epochMs) {
    var d = new Date(epochMs);
    return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  }

  function approvalCanonical(row) {
    return [
      String(row.ts),
      row.requesterId,
      row.requesterRole,
      row.title,
      String(row.risk),
      row.status,
      row.traceId,
      row.slaDeadline === null ? '' : String(row.slaDeadline),
      row.piiFindings.map(function (p) { return p.type + ':' + p.label; }).join('|'),
      row.triggeredPolicies.join('|'),
      row.whatIf.join('|'),
      row.decisionBy || '',
      row.decisionTs === null ? '' : String(row.decisionTs),
      row.decisionReason || '',
    ].join('|');
  }

  function slaHoursFor(status) {
    if (status === 'critical') return 4;
    if (status === 'pending' || status === 'review') return 24;
    return null;
  }

  function slaPctLeft(row) {
    if (row.slaDeadline === null || row.slaHours === null) return 0;
    var total = row.slaHours * 3600000;
    var remaining = row.slaDeadline - APPROVAL_NOW;
    var pct = remaining / total;
    if (pct < 0) return 0;
    if (pct > 1) return 1;
    return pct;
  }

  function findUserIndex(id) {
    for (var i = 0; i < APPROVAL_USERS.length; i += 1) {
      if (APPROVAL_USERS[i].id === id) return i;
    }
    return 0;
  }

  /** Rebuilds the FULL dataset deterministically. Pure function. */
  function buildApprovalRows() {
    var rand = mulberry32(APPROVAL_SEED);
    var total = APPROVAL_TOTAL;

    var statuses = [];
    for (var i = 0; i < APPROVAL_PENDING; i += 1) statuses.push('pending');
    for (var i = 0; i < APPROVAL_CRITICAL; i += 1) statuses.push('critical');
    for (var i = 0; i < APPROVAL_REVIEW; i += 1) statuses.push('review');
    for (var i = 0; i < APPROVAL_APPROVED; i += 1) statuses.push('approved');
    for (var i = 0; i < APPROVAL_REJECTED; i += 1) statuses.push('rejected');
    shuffle(statuses, rand);

    var raw = [];
    var span = TS_END - TS_START;
    for (var j = 0; j < total; j += 1) {
      var status = statuses[j];
      var uIdx = Math.floor(rand() * APPROVAL_USERS.length);
      var user = APPROVAL_USERS[uIdx];
      var pool = TEMPLATE_POOL[user.role];
      var tpl = pool[Math.floor(rand() * pool.length)];

      // Actionable rows (pending/critical/review) are RECENT relative to the
      // fixed APPROVAL_NOW anchor so the SLA countdown bar renders a visible
      // decreasing strip (and a few expired ones → red). Decided rows span the
      // full window. Exactly one rand() call regardless of branch — keeps the
      // RNG stream (and the byte-identical TS source) deterministic.
      var ts;
      if (status === 'critical') {
        // SLA 4h → created within the last ~4.75h → bar ~0–94%, a few red
        ts = APPROVAL_NOW - (15 * 60000 + Math.floor(rand() * 4.75 * 3600000));
      } else if (status === 'pending' || status === 'review') {
        // SLA 24h → created within the last ~21.5h → bar ~10–98%, none expired
        ts = APPROVAL_NOW - (30 * 60000 + Math.floor(rand() * 21 * 3600000));
      } else {
        ts = TS_START + Math.floor(rand() * span);
      }

      var risk;
      if (status === 'pending') risk = 40 + Math.floor(rand() * 46);
      else if (status === 'critical') risk = 86 + Math.floor(rand() * 14);
      else if (status === 'review') risk = 60 + Math.floor(rand() * 26);
      else if (status === 'approved') risk = 1 + Math.floor(rand() * 40);
      else risk = 60 + Math.floor(rand() * 40);

      var decisionBy = null;
      var decisionByRole = null;
      var decisionTs = null;
      var decisionReason = null;
      if (status === 'approved' || status === 'rejected') {
        var rev = APPROVAL_REVIEWERS[Math.floor(rand() * APPROVAL_REVIEWERS.length)];
        decisionBy = rev.id;
        decisionByRole = rev.role;
        decisionTs = ts + Math.floor(rand() * (APPROVAL_NOW - ts));
        var pool2 = status === 'approved' ? APPROVE_REASONS : REJECT_REASONS;
        decisionReason = pool2[Math.floor(rand() * pool2.length)];
      }

      raw.push({
        ts: ts,
        userId: user.id,
        role: user.role,
        title: tpl.title,
        context: tpl.context,
        risk: risk,
        status: status,
        pii: tpl.pii,
        policies: tpl.policies,
        whatIf: tpl.whatIf,
        decisionBy: decisionBy,
        decisionByRole: decisionByRole,
        decisionTs: decisionTs,
        decisionReason: decisionReason,
      });
    }

    raw.sort(function (a, b) { return a.ts - b.ts; });

    var rows = [];
    for (var k = 0; k < total; k += 1) {
      var r = raw[k];
      var slaH = slaHoursFor(r.status);
      var slaDl = slaH === null ? null : r.ts + slaH * 3600000;
      var userRec = APPROVAL_USERS[findUserIndex(r.userId)];
      rows.push({
        index: k,
        ts: r.ts,
        tsLabel: formatTsLabel(r.ts),
        tsDate: formatTsDate(r.ts),
        traceId: 'AI-2026-' + String(21500 + (total - 1 - k)),
        title: r.title,
        context: r.context,
        requesterId: r.userId,
        requesterLabel: userRec.label,
        requesterRole: r.role,
        risk: r.risk,
        status: r.status,
        slaDeadline: slaDl,
        slaHours: slaH,
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

    var prev = '0x00000000';
    for (var m = 0; m < total; m += 1) {
      var row = rows[m];
      row.prevHash = prev;
      row.hash = fnv1a(prev + '|' + approvalCanonical(row));
      prev = row.hash;
    }

    return rows;
  }

  function buildApprovalStats(rows) {
    var r = rows || buildApprovalRows();
    var pending = 0, critical = 0, review = 0, approved = 0, rejected = 0;
    for (var i = 0; i < r.length; i += 1) {
      var s = r[i].status;
      if (s === 'pending') pending += 1;
      else if (s === 'critical') critical += 1;
      else if (s === 'review') review += 1;
      else if (s === 'approved') approved += 1;
      else rejected += 1;
    }
    return { total: r.length, pending: pending, critical: critical, review: review, approved: approved, rejected: rejected };
  }

  return {
    APPROVAL_SEED: APPROVAL_SEED,
    APPROVAL_TOTAL: APPROVAL_TOTAL,
    APPROVAL_PENDING: APPROVAL_PENDING,
    APPROVAL_CRITICAL: APPROVAL_CRITICAL,
    APPROVAL_REVIEW: APPROVAL_REVIEW,
    APPROVAL_APPROVED: APPROVAL_APPROVED,
    APPROVAL_REJECTED: APPROVAL_REJECTED,
    APPROVAL_NOW: APPROVAL_NOW,
    APPROVAL_USERS: APPROVAL_USERS,
    APPROVAL_REVIEWERS: APPROVAL_REVIEWERS,
    mulberry32: mulberry32,
    fnv1a: fnv1a,
    formatTsLabel: formatTsLabel,
    formatTsDate: formatTsDate,
    approvalCanonical: approvalCanonical,
    slaHoursFor: slaHoursFor,
    slaPctLeft: slaPctLeft,
    buildApprovalRows: buildApprovalRows,
    buildApprovalStats: buildApprovalStats,
  };
});
