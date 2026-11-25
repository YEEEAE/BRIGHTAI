# BRIGHT AI

> **تنبيه حالة (2026-11-08):** الوصف التشغيلي أدناه مؤرخ في 2026-07-18 وهو HISTORICAL، وليس جردًا للمصدر الحالي. أسماء Groq/Gemini و`/api/ai/chat/` وRedis/SSE لا تثبت مزودًا أو route أو إعدادًا عاملًا الآن؛ راجع `Audit/outhers/RELEASE-TRACEABILITY-BASELINE-2026-11-08.md` للتصنيف الحالي. المصدر الحالي يملك واجهات AIGAS تحت `/app/api/*`، لكن صفحات `/app/*` وHealth API أعادت 404 وقت الفحص، واعتمادات النماذج والمزودين فارغة.

AI Governance and Safety (AIGAS)

الأركان الرئيسية لحوكمة الذكاء الاصطناعي :

* **السلامة والموثوقية:** **منع الأنظمة من التسبب في أي ضرر للأفراد أو الممتلكات أو البيئة، وضمان عملها ضمن حدود واضحة ومدروسة.**
* **الشفافية والمساءلة:** **معرفة مصدر البيانات، وتتبع تاريخ النماذج (Model Lineage)، وتحديد الجهة المسؤولة عن القرارات التي تتخذها الخوارزميات.**
* **الخصوصية وحماية البيانات:** **حماية البيانات الشخصية ومنع تسريبها، وضمان أن تقنيات إخفاء الهوية لا تعيق اكتشاف الانحيازات في البيانات.**

- انا لدي نظام بسيط جاهز بيكون مستقل للتجربة من قبل العميل اللي هم الحكومات والشركات الخ :

> تحديث: 2026-07-18

## نظرة عامة

Kernel هي طبقة الحوكمة والأمان بين المستخدم ونماذج الذكاء الاصطناعي. توفر:

- كشف PII ومنع التسرب قبل وصول الطلب للنموذج
- تقييم المخاطر (0-100) وتطبيق سياسات الشركة
- إجبار موافقة بشرية على القرارات عالية المخاطر
- سجل تدقيق غير قابل للتعديل
- محادثة آمنة مع البث المباشر (SSE)

## المزودون (Providers)

| المزود                | الحالة | النموذج                                                              | API Key            |
| --------------------------- | ------------ | --------------------------------------------------------------------------- | ------------------ |
| **Groq** (primary)    | نشط       | `llama-3.3-70b-versatile` (قابل للتغيير عبر `GROQ_MODEL`) | `GROQ_API_KEY`   |
| **Gemini** (fallback) | نشط       | `gemini-2.5-flash` (قابل للتغيير عبر `GEMINI_MODEL`)      | `GEMINI_API_KEY` |

- **Auto mode**: يحاول Groq أولاً، يرجع لـ Gemini لو فشل.
- **Explicit mode**: العميل يحدد `provider: 'groq' | 'gemini'` في الطلب.
- **Circuit breaker**: K4 layer يغلق المزود تلقائياً لو فشل مرات متتالية.

## API

### `POST /api/ai/chat/`

**SSE path** (مفضل): أرسل `Accept: text/event-stream` → يستقبل `event: token` / `event: done` / `event: error`.

**JSON path** (fallback): أرسل `Accept: application/json` → يستقبل `{ reply, provider }`.

**الطلب**:

```json
{
  "message": "نص الاستعلام",
  "sessionId": "uuid-v4",
  "promptId": "compliance",
  "provider": "auto"
}
```

**الاستجابة (JSON)**:

```json
{
  "reply": "نص الرد",
  "provider": "groq",
  "sessionId": "uuid-v4"
}
```

## الأمان

- **API keys**: تُقرأ من `process.env` في وقت التشغيل (runtime) — مو في وقت البناء (build time).
- **Origin allowlist**: `https://brightai.live`, `localhost:4321`.
- **API key auth** (اختياري): `x-brightai-chat-key` header.
- **AI Firewall (K3)**: يكشف PII قبل وصول الطلب للنموذج. يمنع: SAUDI_ID, IQAMA, IBAN, CREDENTIAL, PATIENT_ID.
- **Rate limiting**: K4 quota layer (Redis-backed).
- **Prompt injection**: `promptId` allowlist فقط — ممنوع إرسال `systemPrompt` مباشرة.

## الجلسات (Sessions)

- **Redis**: تخزين سياق المحادثة (TTL 10 دقائق).
- **In-memory fallback**: لو Redis غير متاح، يخدم الطلب مع `X-Chat-Session: degraded`.
- **Session ID**: UUID v4 يُنشأ في المتصفح ويُحفظ في `sessionStorage`.

## البث المباشر (SSE)

- **Feature flag**: `CHAT_STREAMING_ENABLED` (default `true`).
- **الأحداث**: `token` (نص جزئي), `done` (اكتمال مع `provider`), `error`.
- **Timeout**: 25 ثانية لكل مزود.

hostinger domain

https://brightai.live

# Cloudflare

  ربطنا `brightai.live` على Cloudflare كـ DNS/CDN وحماية قدّام Render، بدل الاعتماد على Hostinger للـ DNS.
فعّلنا Client-side Security، وضبطنا الكاش بحيث `/api/*` بدون كاش وملفات `/_astro/*` و`/assets/*` بكاش طويل.
وضبطنا Rate Limiting على `/api/ai/chat` لحماية استهلاك الـ AI من السبام والطلبات الزايدة.

## اختبار المصادقة محليًا

يتطلب اختبار المتصفح Node 22 وChrome وPlaywright وOpenSSL وقاعدة PostgreSQL 18 محلية فارغة ومخصصة للاختبار. يثبت الاختبار الترحيلات في قاعدة الاختبار ويشغّل خادم BRIGHTAI مع مزود Neon Auth اصطناعي عبر HTTPS. يستخدم قبول الدعوة واجهة Kernel الفعلية ودور `aigas_runtime`.

```sh
npm run build
KERNEL_AUTH_E2E_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/brightai_auth_e2e npm run test:auth:e2e
```

إذا كان Playwright خارج المشروع، مرّر مسار وحدته عبر `BRIGHTAI_PLAYWRIGHT_MODULE`. يعمل الاختبار ببيانات اصطناعية وباتصال محلي فقط.

## تجربة الاستكشاف لمدة 48 ساعة

تتطلب `/app/trial/` بوابة مفعّلة، ومصادقة Neon Auth، ودور اتصال `aigas_runtime` مع RLS، وترحيل `0040` قبل نشر نسخة التطبيق التي تعتمد عليه. يتحقق التفعيل من جاهزية مخططات وصلاحيات القراءة للمنتجات الخمسة قبل إنشاء المساحة.

تُنشئ التجربة مساحة بيانات اصطناعية لكل حساب موثّق وتسمح بالتصفح المحدود. يحفظ PostgreSQL بداية النافذة ونهايتها بتوقيت الخادم. يعيد طلب البدء المكرر مرجع المساحة نفسها، وتبقى صلاحيات المنتجات منتهية عند حد الـ48 ساعة. يسجّل أول طلب لحالة التجربة بعد الحد الانتقال إلى الحالة المنتهية في سجل التدقيق.


## فحص تشغيل Node بعد النشر على Render

يضبط `render.yaml` خدمة Node على الإصدار `22.22.2` والمنفذ `10000` مع الاستماع على `0.0.0.0`. تستخدم الخدمة `npm ci && npm run build` للبناء و`npm start` للتشغيل. يختبر Render المسار `/readyz/`. تجاوز كاش الحافة لكلا الفحصين بصيغتيهما.

| المسار | النتيجة المتوقعة |
|---|---|
| `/healthz` و`/healthz/` | `200` وJSON يتضمن `status: "ok"` و`version` و`commit`. يظل الفحص ناجحًا عند تعطل قاعدة البيانات. |
| `/readyz` و`/readyz/` | `200` عند نجاح فحوص PostgreSQL وتهيئة Auth. تعيد الإعدادات الناقصة والاعتماديات المتعطلة `503` بعقد الخطأ المشترك. تُقرأ هوية البناء من `/healthz/`. |

تجيب الصيغ الأربع مباشرة عند التشغيل بـ`npm start`. يعيد `HEAD` الترويسات ورمز الحالة بجسم فارغ. تعتمد الجاهزية على `DATABASE_URL` وإعدادات Neon Auth. يفعّل الـBlueprint فحص JWKS الشبكي. اضبط القيم في إعدادات Runtime في Render.

```sh
npm run build
npm run test:healthz

# مرّر عنوان المنشأ الفعلي لخدمة Node وSHA الظاهر في نشر Render.
npm run smoke:healthz -- "$RENDER_ORIGIN_URL" --require-ready --expect-commit="$EXPECTED_COMMIT"
# بعد ربط النطاق، أعد الفحص على النطاق العام.
npm run smoke:healthz -- https://brightai.live --require-ready --expect-commit="$EXPECTED_COMMIT"
```

يتحقق الـsmoke من `GET` و`HEAD`، وهوية البناء، وJSON، و`no-store`، ويرفض التحويلات. لتشغيل اختبار الجاهزية الإيجابي محليًا، مرّر `HEALTHZ_READY_DATABASE_URL` لقاعدة PostgreSQL مؤقتة على loopback تحتوي على `public.aigas_tenants`. تفاصيل العقد في [دليل فحوص التشغيل](docs/HEALTHZ-READINESS.md).

[عقد HTTP API](docs/API-CONTRACT.md) و[خطة ترحيله](docs/API-CONTRACT-MIGRATION.md).
