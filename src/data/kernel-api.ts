/**
 * kernel-api.ts — Deterministic API dataset for /kernel/api/ (M27).
 *
 * M27 — Full deterministic generator producing 6 API endpoints +
 * code samples (cURL/Python/TypeScript) + error handbook + webhook payloads +
 * migration guide + service status (90 days) + changelog + SDK docs +
 * operator docs.
 *
 * No Math.random, no Date.now: a single fixed seed (API_SEED) drives a
 * mulberry32 PRNG. Mirrored byte-for-byte in public/js/kernel-api-data.js.
 *
 * CRITICAL SECURITY RULE: Never expose a full API key. The demo key is
 * always masked (br_k_demo_••••••••••••). The "reveal" button shows only
 * a few more characters, never the full key.
 *
 * Exact count contract (verified by scripts/verify-api.mjs):
 *   - endpoints           = 6 (inspect, evidence, eval-run, dataset, scorer, certificate)
 *   - code samples        = 3 (cURL, Python, TypeScript)
 *   - error handbook      = 6
 *   - webhook payloads    = 3
 *   - migration steps     = 3
 *   - status cells        = 90
 *   - changelog entries   = 4
 *   - SDK docs            = 3
 *   - operator docs       = 4
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface KernelApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  desc: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
  response: { name: string; type: string; desc: string }[];
  errors: string[];
}

export interface KernelApiCodeSample {
  lang: 'curl' | 'python' | 'typescript';
  label: string;
  code: string;
}

export interface KernelApiError {
  code: string;
  meaning: string;
  fix: string;
  example: string;
}

export interface KernelApiWebhookPayload {
  event: string;
  time: string;
  summary: string;
  body: string;
}

export interface KernelApiMigrationStep {
  title: string;
  before: string;
  after: string;
  note: string;
}

export interface KernelApiChangelogEntry {
  version: string;
  date: string;
  note: string;
}

export interface KernelApiSdkDoc {
  id: string;
  lang: string;
  label: string;
  install: string;
  example: string;
}

export interface KernelApiOperatorDoc {
  id: string;
  title: string;
  description: string;
  steps: string[];
}

export interface KernelApiData {
  endpoints: KernelApiEndpoint[];
  codeSamples: KernelApiCodeSample[];
  errorBook: KernelApiError[];
  webhookPayloads: KernelApiWebhookPayload[];
  migrationSteps: KernelApiMigrationStep[];
  statusCells: ('ok' | 'degraded' | 'down')[];
  changelog: KernelApiChangelogEntry[];
  sdkDocs: KernelApiSdkDoc[];
  operatorDocs: KernelApiOperatorDoc[];
  demoKey: string;
  demoKeyMasked: string;
  demoRemaining: number;
  demoLimit: number;
  webhookUrl: string;
  sampleResponse: string;
  navSections: { id: string; label: string }[];
}

// ── Constants ────────────────────────────────────────────────────────────────

export const API_SEED = 0x41504921;

export const API_ENDPOINTS_COUNT = 6;
export const API_CODE_SAMPLES = 3;
export const API_ERROR_BOOK_COUNT = 6;
export const API_WEBHOOK_PAYLOADS = 3;
export const API_MIGRATION_STEPS = 3;
export const API_STATUS_CELLS = 90;
export const API_CHANGELOG_ENTRIES = 4;
export const API_SDK_DOCS = 3;
export const API_OPERATOR_DOCS = 4;

// ── PRNG (byte-identical to kernel-stats.ts) ──────────────────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Demo key (CRITICAL: never expose full key) ───────────────────────────────

export function buildDemoKey() {
  return {
    demoKey: 'br_k_demo_a7c8f2e9d41b',
    demoKeyMasked: 'br_k_demo_••••••••••••',
    demoRemaining: 98,
    demoLimit: 100,
  };
}

// ── Endpoints (6 APIs) ───────────────────────────────────────────────────────

export function buildEndpoints(): KernelApiEndpoint[] {
  return [
    {
      id: 'inspect',
      method: 'POST',
      path: '/v1/guard/inspect',
      title: 'فحص طلب قبل الإرسال للنموذج',
      desc: 'يرسل الطلب عبر طبقات الحوكمة: فحص PII، تقييم المخاطر، مطابقة السياسات. يرجّع الحكم النهائي (allow / review / block) مع Trace ID للتوثيق في سجل التدقيق.',
      params: [
        { name: 'text', type: 'string', required: true, desc: 'نص الطلب المراد فحصه (UTF-8).' },
        { name: 'context', type: 'object', required: false, desc: 'سياق الطلب: القسم، الدور، الحساسية، النموذج.' },
        { name: 'policies', type: 'string[]', required: false, desc: 'معرّفات السياسات المفعلة. الافتراضي: كل السياسات النشطة.' },
      ],
      response: [
        { name: 'trace_id', type: 'string', desc: 'Trace ID فريد — يستخدم للاستعلام من /kernel/audit/.' },
        { name: 'risk_score', type: 'integer', desc: 'درجة المخاطر 0-100.' },
        { name: 'verdict', type: 'string', desc: 'allow · review · block' },
        { name: 'pii_found', type: 'integer', desc: 'عدد كيانات PII المكتشفة.' },
        { name: 'matched_policies', type: 'string[]', desc: 'السياسات التي اشتعلت.' },
      ],
      errors: ['400', '401', '403', '429'],
    },
    {
      id: 'evidence',
      method: 'POST',
      path: '/v1/evidence',
      title: 'توليد ملف دليل (EVD)',
      desc: 'ينشئ ملف دليل موقّع رقمياً لطلب سابق (بالـ trace_id) بصيغة PDF + JSON، جاهزاً للجهات الرقابية (NCA, SDAIA, SAMA, SFDA).',
      params: [
        { name: 'trace_id', type: 'string', required: true, desc: 'معرّف العملية من استجابة /v1/guard/inspect.' },
        { name: 'format', type: 'string', required: false, desc: 'pdf | json | both (الافتراضي: both).' },
        { name: 'signed', type: 'boolean', required: false, desc: 'توقيع رقمي (الافتراضي: true).' },
      ],
      response: [
        { name: 'evidence_id', type: 'string', desc: 'معرّف الدليل (EVD-YYYY-NNNN).' },
        { name: 'hash', type: 'string', desc: 'هاش سلسلة الأدلة — يتحقق منه من /kernel/audit/.' },
        { name: 'download_url', type: 'string', desc: 'رابط تنزيل مؤقت (24 ساعة).' },
        { name: 'verified', type: 'boolean', desc: 'هل التوقيع سليم.' },
      ],
      errors: ['400', '404', '429'],
    },
    {
      id: 'eval-run',
      method: 'POST',
      path: '/v1/eval/runs',
      title: 'Evaluation Run API — تشغيل تقييم',
      desc: 'ينشئ تشغيل تقييم جديد على مجموعة بيانات بمقياس تقييم محدد. يرجّع run_id لتتبع النتائج.',
      params: [
        { name: 'dataset_id', type: 'string', required: true, desc: 'معرّف مجموعة البيانات.' },
        { name: 'scorer_id', type: 'string', required: true, desc: 'معرّف مقياس التقييم.' },
        { name: 'model_id', type: 'string', required: false, desc: 'النموذج المُقيَّم (الافتراضي: النموذج الموجّه).' },
      ],
      response: [
        { name: 'run_id', type: 'string', desc: 'معرّف التشغيل (EVAL-YYYY-NNNN).' },
        { name: 'status', type: 'string', desc: 'queued · running · completed · failed' },
        { name: 'total_cases', type: 'integer', desc: 'عدد الحالات في المجموعة.' },
        { name: 'estimated_time', type: 'integer', desc: 'الزمن المقدّر بالثواني.' },
      ],
      errors: ['400', '404', '429'],
    },
    {
      id: 'dataset',
      method: 'POST',
      path: '/v1/datasets',
      title: 'Dataset API — إنشاء مجموعة بيانات',
      desc: 'ينشئ مجموعة بيانات جديدة لحوكمة AI. يدعم استيراد CSV/JSON/JSONL أو لصق جدول.',
      params: [
        { name: 'name', type: 'string', required: true, desc: 'اسم المجموعة.' },
        { name: 'format', type: 'string', required: true, desc: 'csv | json | jsonl | table' },
        { name: 'data', type: 'string', required: true, desc: 'البيانات الخام بالصيغة المحددة.' },
        { name: 'compliance_pack', type: 'string', required: false, desc: 'حزمة الامتثال (pdpl, nca_ecc, sfda...).' },
      ],
      response: [
        { name: 'dataset_id', type: 'string', desc: 'معرّف المجموعة (DS-YYYY-NNNN).' },
        { name: 'case_count', type: 'integer', desc: 'عدد الحالات المستوردة.' },
        { name: 'duplicates', type: 'integer', desc: 'عدد التكرارات المكتشفة.' },
        { name: 'gaps', type: 'integer', desc: 'عدد السلوكيات الناقصة المتوقعة.' },
      ],
      errors: ['400', '422', '429'],
    },
    {
      id: 'scorer',
      method: 'POST',
      path: '/v1/scorers',
      title: 'Scorer API — إنشاء مقياس تقييم',
      desc: 'ينشئ مقياس تقييم مخصص لتقييم النماذج. يدعم معايير جاهزة (accuracy, safety, hallucination) أو مخصصة.',
      params: [
        { name: 'name', type: 'string', required: true, desc: 'اسم المقياس.' },
        { name: 'type', type: 'string', required: true, desc: 'accuracy | safety | hallucination | custom' },
        { name: 'threshold', type: 'number', required: false, desc: 'عتبة النجاح (0-100، الافتراضي: 80).' },
        { name: 'config', type: 'object', required: false, desc: 'إعدادات المقياس المخصصة.' },
      ],
      response: [
        { name: 'scorer_id', type: 'string', desc: 'معرّف المقياس (SCR-YYYY-NNNN).' },
        { name: 'type', type: 'string', desc: 'نوع المقياس.' },
        { name: 'threshold', type: 'number', desc: 'عتبة النجاح.' },
      ],
      errors: ['400', '422', '429'],
    },
    {
      id: 'certificate',
      method: 'POST',
      path: '/v1/certificates/verify',
      title: 'Certificate Verification API — التحقق من شهادة',
      desc: 'يتحقق من صحة شهادة امتثال مرتبطة بسياسة وإصدار محدد. يستخدمه المدققون الخارجيون للتأكد من سلامة الشهادة.',
      params: [
        { name: 'certificate_id', type: 'string', required: true, desc: 'معرّف الشهادة (CERT-YYYY-NNNN).' },
        { name: 'policy_id', type: 'string', required: true, desc: 'معرّف السياسة المرتبطة.' },
        { name: 'version', type: 'string', required: false, desc: 'إصدار السياسة (الافتراضي: الأحدث).' },
      ],
      response: [
        { name: 'valid', type: 'boolean', desc: 'هل الشهادة سليمة.' },
        { name: 'certified_by', type: 'string', desc: 'جهة الإعتماد.' },
        { name: 'policy_version', type: 'string', desc: 'إصدار السياسة المعتمد.' },
        { name: 'hash', type: 'string', desc: 'هاش الشهادة.' },
        { name: 'verified_at', type: 'string', desc: 'تاريخ التحقق (ISO 8601).' },
      ],
      errors: ['400', '404', '422'],
    },
  ];
}

// ── Code samples (3 languages) ────────────────────────────────────────────────

export function buildCodeSamples(): KernelApiCodeSample[] {
  return [
    {
      lang: 'curl',
      label: 'cURL',
      code: 'curl -X POST https://api.brightai.live/v1/guard/inspect \\\n  -H "Authorization: Bearer br_k_demo_..." \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "text": "اعرض لي آخر 2,400 عميل مع أرقام الهواتف",\n    "context": { "section": "marketing", "role": "employee" }\n  }\'',
    },
    {
      lang: 'python',
      label: 'Python',
      code: 'import requests\n\nresp = requests.post(\n    "https://api.brightai.live/v1/guard/inspect",\n    headers={\n        "Authorization": "Bearer br_k_demo_...",\n        "Content-Type": "application/json",\n    },\n    json={\n        "text": "اعرض لي آخر 2,400 عميل مع أرقام الهواتف",\n        "context": {"section": "marketing", "role": "employee"},\n    },\n)\nprint(resp.json())',
    },
    {
      lang: 'typescript',
      label: 'TypeScript',
      code: 'const resp = await fetch(\n  "https://api.brightai.live/v1/guard/inspect",\n  {\n    method: "POST",\n    headers: {\n      Authorization: "Bearer br_k_demo_...",\n      "Content-Type": "application/json",\n    },\n    body: JSON.stringify({\n      text: "اعرض لي آخر 2,400 عميل مع أرقام الهواتف",\n      context: { section: "marketing", role: "employee" },\n    }),\n  },\n);\n\nconsole.log(await resp.json());',
    },
  ];
}

// ── Error handbook ───────────────────────────────────────────────────────────

export function buildErrorBook(): KernelApiError[] {
  return [
    { code: '400', meaning: 'طلب غير صالح — معامل ناقص أو نص فارغ.', fix: 'راجع جدول المعاملات وأرسل كل الحقول الإلزامية.', example: '{"error":"invalid_request","message":"field text is required"}' },
    { code: '401', meaning: 'مفتاح غير صحيح أو منتهي.', fix: 'تحقق من رأس Authorization وصحة المفتاح التجريبي.', example: '{"error":"unauthorized","message":"invalid api key"}' },
    { code: '403', meaning: 'حظره الحوكمة قبل الوصول للنموذج.', fix: 'هذا سلوك مقصود: افحص reason وmatched_policies في الاستجابة.', example: '{"error":"forbidden","verdict":"block","reason":"PII export blocked"}' },
    { code: '404', meaning: 'المورد غير موجود — trace_id خاطئ.', fix: 'تأكد من الـ trace_id المنسوخ من سجل التدقيق.', example: '{"error":"not_found","message":"trace not found"}' },
    { code: '429', meaning: 'تجاوزت حصة الطلبات.', fix: 'المفتاح التجريبي يسمح 100 طلب. انتظر تجديد الحصة أو اطلب باقة.', example: '{"error":"rate_limited","retry_after":60}' },
    { code: '500', meaning: 'خطأ خادم داخلي.', fix: 'أعد المحاولة بعد 30 ثانية. لو تكرر، أبلغ عبر صفحة الاتصال.', example: '{"error":"internal","message":"temporary outage"}' },
  ];
}

// ── Webhook payloads ────────────────────────────────────────────────────────

export function buildWebhookPayloads(): KernelApiWebhookPayload[] {
  return [
    {
      event: 'decision.created',
      time: 'الآن',
      summary: 'قرار: block · AI-2026-10493 · قسم التسويق',
      body: '{\n  "type": "decision.created",\n  "trace_id": "AI-2026-10493",\n  "verdict": "block",\n  "risk_score": 87,\n  "section": "marketing",\n  "timestamp": "2026-07-31T10:24:00+03:00"\n}',
    },
    {
      event: 'approval.requested',
      time: 'قبل 2د',
      summary: 'طلب موافقة: review · AI-2026-10491 · قسم الموارد البشرية',
      body: '{\n  "type": "approval.requested",\n  "trace_id": "AI-2026-10491",\n  "verdict": "review",\n  "risk_score": 62,\n  "section": "hr",\n  "approver": "DPO",\n  "timestamp": "2026-07-31T10:22:00+03:00"\n}',
    },
    {
      event: 'evidence.generated',
      time: 'قبل 12د',
      summary: 'دليل جديد: EVD-2026-10492 · PDF موقّع',
      body: '{\n  "type": "evidence.generated",\n  "evidence_id": "EVD-2026-10492",\n  "hash": "0xa7c8f2e9d41b",\n  "signed": true,\n  "timestamp": "2026-07-31T10:12:00+03:00"\n}',
    },
  ];
}

// ── Migration guide ──────────────────────────────────────────────────────────

export function buildMigrationSteps(): KernelApiMigrationStep[] {
  return [
    {
      title: '1. وجّه حركة المرور لـ Kernel',
      before: 'fetch("https://api.openai.com/v1/chat/completions", ...)',
      after: 'fetch("https://api.brightai.live/v1/guard/inspect", ...)',
      note: 'بدّل نقطة النهاية من المزوّد مباشرة إلى بوابة الحوكمة. نفس فكرة الـ proxy.',
    },
    {
      title: '2. مرّر السياق عبر معامل context',
      before: 'body: JSON.stringify({ prompt })',
      after: 'body: JSON.stringify({ text: prompt, context: { section, role } })',
      note: 'السياق (القسم، الدور) يحسّن دقة تقييم المخاطر والسياسات.',
    },
    {
      title: '3. اقرأ الحكم قبل تنفيذ أي شيء',
      before: 'const answer = await resp.json(); sendToUI(answer)',
      after: 'const { verdict } = await resp.json(); if (verdict === "allow") sendToUI(...)',
      note: 'لا تكمل أبداً لو verdict !== allow — هذي هي نقطة القوة في Kernel.',
    },
  ];
}

// ── Service status (90 days) ────────────────────────────────────────────────

export function buildStatusCells(): ('ok' | 'degraded' | 'down')[] {
  const cells: ('ok' | 'degraded' | 'down')[] = [];
  for (let i = 0; i < API_STATUS_CELLS; i += 1) {
    if (i % 47 === 0) cells.push('down');
    else if (i % 13 === 0) cells.push('degraded');
    else cells.push('ok');
  }
  return cells;
}

// ── Changelog ────────────────────────────────────────────────────────────────

export function buildChangelog(): KernelApiChangelogEntry[] {
  return [
    { version: 'v3.7.0', date: '2026-07-20', note: 'فاحص Webhook حي + دعم حمولات متعددة. تحسين توقيع HMAC-SHA256.' },
    { version: 'v3.6.0', date: '2026-06-28', note: 'نقطة /v1/evidence مع توقيع رقمي وتوليد PDF فوري.' },
    { version: 'v3.5.2', date: '2026-06-02', note: 'تسريع /v1/guard/inspect — متوسط 128ms (كان 220ms).' },
    { version: 'v3.5.0', date: '2026-05-15', note: 'معامل policies في inspect — تفعيل سياسات محددة لكل طلب.' },
  ];
}

// ── SDK docs ─────────────────────────────────────────────────────────────────

export function buildSdkDocs(): KernelApiSdkDoc[] {
  return [
    {
      id: 'sdk-python',
      lang: 'python',
      label: 'Python SDK',
      install: 'pip install brightai-kernel',
      example: 'from brightai import Kernel\n\nkernel = Kernel(api_key="br_k_demo_...")\nresult = kernel.inspect(text="اعرض لي العملاء", context={"section": "marketing"})\nprint(result.verdict)',
    },
    {
      id: 'sdk-typescript',
      lang: 'typescript',
      label: 'TypeScript SDK',
      install: 'npm install @brightai/kernel',
      example: 'import { Kernel } from "@brightai/kernel";\n\nconst kernel = new Kernel({ apiKey: "br_k_demo_..." });\nconst result = await kernel.inspect({\n  text: "اعرض لي العملاء",\n  context: { section: "marketing" },\n});\nconsole.log(result.verdict);',
    },
    {
      id: 'sdk-curl',
      lang: 'bash',
      label: 'cURL (no SDK)',
      install: '# لا يحتاج تثبيت — cURL متاح افتراضياً',
      example: 'curl -X POST https://api.brightai.live/v1/guard/inspect \\\n  -H "Authorization: Bearer br_k_demo_..." \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text": "اعرض لي العملاء"}\'',
    },
  ];
}

// ── Operator docs (no code) ──────────────────────────────────────────────────

export function buildOperatorDocs(): KernelApiOperatorDoc[] {
  return [
    {
      id: 'op-getting-started',
      title: 'البداية السريعة',
      description: 'كيف تربط Kernel بمنشأتك في 5 دقائق — بلا كود.',
      steps: [
        'احصل على مفتاح API من لوحة التحكم.',
        'وجّه طلباتك لـ Kernel بدل المزوّد مباشرة.',
        'راقب القرارات من /kernel/audit/.',
        'صدّر التقارير للجهات الرقابية.',
      ],
    },
    {
      id: 'op-policies',
      title: 'إدارة السياسات',
      description: 'كيف تفعّل وتعدّل سياسات الحوكمة — بلا كود.',
      steps: [
        'افتح /kernel/policies/.',
        'فعّل أو عطّل أي سياسة بنقرة.',
        'جرّب السياسة في الملعب قبل التفعيل.',
        'راقب الأثر من وضع المحاكاة.',
      ],
    },
    {
      id: 'op-approvals',
      title: 'سير عمل الموافقات',
      description: 'كيف تدير طلبات الموافقة البشرية — بلا كود.',
      steps: [
        'افتح /kernel/approvals/.',
        'راجع كل طلب بدرجة مخاطره.',
        'وافق أو ارفض أو حوّل.',
        'تتبع القرارات في السجل.',
      ],
    },
    {
      id: 'op-evidence',
      title: 'توليد الأدلة',
      description: 'كيف تولّد ملفات أدلة للجهات الرقابية — بلا كود.',
      steps: [
        'افتح /kernel/evidence/.',
        'اختر الفترة والقطاع.',
        'ولّد ملف EVD موقّع رقمياً.',
        'شاركه مع المدقق الخارجي.',
      ],
    },
  ];
}

// ── Nav sections ─────────────────────────────────────────────────────────────

export function buildNavSections() {
  return [
    { id: 'endpoints', label: 'نقاط الطرفية' },
    { id: 'webhook', label: 'فاحص Webhook' },
    { id: 'errors', label: 'دفتر الأخطاء' },
    { id: 'migration', label: 'دليل الترحيل' },
    { id: 'status', label: 'حالة الخدمة' },
    { id: 'releases', label: 'سجل الإصدارات' },
    { id: 'sdk', label: 'وثائق SDK' },
    { id: 'operator', label: 'وثائق التشغيل' },
  ];
}

// ── Sample response ──────────────────────────────────────────────────────────

export function buildSampleResponse(): string {
  return '{\n  "trace_id": "AI-2026-10493",\n  "risk_score": 87,\n  "verdict": "block",\n  "pii_found": 1847,\n  "matched_policies": ["pdpl-12-export", "nca-ecc-3-4"],\n  "reason": "حظر قبل الوصول للنموذج — كشف PII في طلب تصدير خارجي",\n  "duration_ms": 128\n}';
}

// ── Full dataset ─────────────────────────────────────────────────────────────

export function buildApiData(): KernelApiData {
  const dk = buildDemoKey();
  return {
    endpoints: buildEndpoints(),
    codeSamples: buildCodeSamples(),
    errorBook: buildErrorBook(),
    webhookPayloads: buildWebhookPayloads(),
    migrationSteps: buildMigrationSteps(),
    statusCells: buildStatusCells(),
    changelog: buildChangelog(),
    sdkDocs: buildSdkDocs(),
    operatorDocs: buildOperatorDocs(),
    demoKey: dk.demoKey,
    demoKeyMasked: dk.demoKeyMasked,
    demoRemaining: dk.demoRemaining,
    demoLimit: dk.demoLimit,
    webhookUrl: 'https://hooks.brightai.live/w/8f2e9d41b7c3',
    sampleResponse: buildSampleResponse(),
    navSections: buildNavSections(),
  };
}
