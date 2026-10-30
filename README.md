# BRIGHT AI

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
