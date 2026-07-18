# Kernel — BrightAI AI Safety OS

> آخر تحديث: 2026-07-18

## نظرة عامة

Kernel هي طبقة الحوكمة والأمان بين المستخدم ونماذج الذكاء الاصطناعي. توفر:
- كشف PII ومنع التسرب قبل وصول الطلب للنموذج
- تقييم المخاطر (0-100) وتطبيق سياسات الشركة
- إجبار موافقة بشرية على القرارات عالية المخاطر
- سجل تدقيق غير قابل للتعديل
- محادثة آمنة مع البث المباشر (SSE)

## المزودون (Providers)

| المزود | الحالة | النموذج | API Key |
|---|---|---|---|
| **Groq** (primary) | نشط | `llama-3.3-70b-versatile` (قابل للتغيير عبر `GROQ_MODEL`) | `GROQ_API_KEY` |
| **Gemini** (fallback) | نشط | `gemini-2.5-flash` (قابل للتغيير عبر `GEMINI_MODEL`) | `GEMINI_API_KEY` |

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
- **Origin allowlist**: `https://brightai.site`, `localhost:4321`.
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

## الملفات المعنية

| الملف | الوصف |
|---|---|
| `src/pages/api/ai/chat.ts` | API endpoint (SSR, prerender=false) |
| `src/pages/kernel/chat.astro` | واجهة المحادثة (3-pane layout) |
| `src/lib/redis.ts` | Redis session store |
| `src/lib/quota.ts` | K4 quota + circuit breaker |
| `src/lib/usagetracker.ts` | تتبع استخدام التوكنز |
| `src/lib/ip.ts` | استخراج IP العميل |
| `src/data/kernel-system-prompts.ts` | نظام البرومبتات المسموحة |
| `@brightai/firewall-detectors` | كشف PII (package) |
| `@brightai/config` | إعدادات الجلسات |

## المتغيرات البيئية

```
GROQ_API_KEY=...
GEMINI_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_MODEL=gemini-2.5-flash
CHAT_STREAMING_ENABLED=true
BRIGHTAI_CHAT_KEY=...
TRUSTED_PROXY_COUNT=1
```

## الاختبارات

```bash
pnpm test:chat-session   # اختبار جلسة المحادثة
pnpm build               # بناء الموقع بالكامل
```
