# CHAMPION-05 — Conversion + Telemetry Pack

**Date**: 2026-07-30
**Task**: تحويل kernel لمنتج قابل للقياس (quota dashboard + GA4 server events + Sentry visibility + conversion funnel).
**Mode**: Senior
**Status**: uncommitted (الكود مكتمل ومُتحقَّق محليًا؛ الـ deploy + env vars يخصّان المالك)

## الملخص التنفيذي

CHAMPION-05 مكتوب على فرضية إن أكثر الملفات «NEW» — بس التحقق أثبت العكس. الـ repo فعلاً فيه `output:'static'` + `@astrojs/node` adapter (hybrid فعليًا) فيه SSR API routes، والـ backend انتقل داخل Astro (ما فيه `frontend/` بعد). نصف CHAMPION-05 كان منفّذ أصلاً:

- `src/lib/analytics.ts` (27KB) — موجود.
- `src/lib/ga4-server.ts` — GA4 Measurement Protocol موجود.
- `src/lib/observability/sentry.ts` — مُفعّل أصلاً (`initSentry()` يُستدعى في `middleware.ts:66`، idempotent، no-op لما `SENTRY_DSN` فاضي بالتصميم).
- `src/pages/api/lead.ts` — يطلق `generate_lead` server-side فعلاً (line 297).

تنفيذ الـ prompt حرفيًا = استبدال كود شغّال = تدمير (يخالف قاعدة 2.1). سوينا **الباقي الفعلي فقط**.

## الملفات

| File | Change | Description |
|---|---|---|
| `src/pages/api/kernel/quota-stats.ts` | NEW | Admin-only GET. Auth عبر `x-brightai-admin-key` (timingSafeEqual). يقرأ circuit عبر `isProviderOpen` + SCAN/sum لمفاتيح `quota:day:*` (read-only Redis منفصل، ما يلمس quota.ts). 503 لو env مو مضبوط، 401 لو المفتاح غلط. |
| `src/pages/kernel/admin/quota.astro` | NEW | لوحة admin. client-side gate (المفتاح → localStorage → header). يعرض usage/cost/circuit + refresh. `noindex,nofollow`. |
| `src/pages/api/ai/chat.ts` | Edited | استيراد `sendServerEvent` + إطلاق `chat_completed` best-effort عند success (يُكمل قمع التحويل). |

## ما لم يُلمَس (محمي / موجود)

- `src/lib/analytics.ts`, `src/lib/ga4-server.ts`, `src/lib/observability/sentry.ts`, `src/pages/api/lead.ts` — كلها موجودة وشغّالة.
- `src/lib/quota.ts` — منطق الإنفاذ مو لموس نهائيًا (قراءة فقط من خارج).
- النص العربي، الـ redirects، الـ canonical/hreflang — ما تغيّرت.

## التحقق

| Check | النتيجة |
|---|---|
| `npm run build` | ✅ EXIT 0 (5.16s، 0 أخطاء) |
| quota-stats route في server chunk | ✅ (بنمط health) |
| `chat_completed` في chat chunk | ✅ |
| Endpoint auth matrix (local preview) | ✅ لا key→401، غلط→401، صح→200 + JSON صحيح |
| Dashboard HTML صحيح في dist | ✅ `dist/client/kernel/admin/quota/index.html` |
| Admin page في sitemap | ✅ مُستثناة (0 مرات) |
| `npm run verify:all` | ⚠️ EXIT 1 — **لكن pre-existing 100%**: فشل `seo:schema` على صفحات `/answer/*` (`speakable must be attached to a WebPage node`). أثبت عبر `git stash` على شجرة نظيفة (نفس EXIT 1). موثق أصلاً في KI-CHAMPION03-SPEAKABLE. ما يخص هذا التغيير. |

**قيود preview محلية**: كل `/kernel/*` ترجع 404 على `astro preview` بسبب deny-list (`^/kernel(/|$)`) — وهذا يشمل كل صفحات kernel العامة المنشورة. في الإنتاج، static files تُخدم قبل الـ handler فتششتغل. التحقق الحقيقي للـ dashboard = acceptance curl على الإنتاج بعد الديبوي.

## قمع التحويل (Conversion Funnel)

القمع الواقعي القابل للقياس:
`page_view → chat_started → chat_completed → generate_lead`

- `page_view` / `chat_started` / `chat_completed` / `generate_lead` كلها معرّفة في `analytics.ts`.
- `chat_started` يُطلق client-side من `KernelAiAssistant.astro`.
- `chat_completed` الحين يُطلق **server-side** (هذا التغيير) — مستقل عن تسليم gtag في المتصفح.
- `generate_lead` يُطلق server-side من `lead.ts` (موجود مسبقًا).

`kernel_land` / `lead_form_view` في الـ prompt الأصلي **مو معرّفة** كأحداث منفصلة — `page_view` بـ `page_type=kernel` تغطيها. ما اخترعنا أحداث جديدة خارج النطاق.

## بنود deploy-only (خارج الكود — تخص المالك)

1. **`BRIGHTAI_ADMIN_KEY`** — لازم يُضاف لـ Render env. بدونه الـ endpoint يرجع 503 (والـ dashboard ما يفتح).
2. **`SENTRY_DSN`** — موجود الكود (`sentry.ts`)، بس يحتاج قيمة في Render env عشان يلتقط errors فعلاً.
3. **`GA4_API_SECRET`** + `GA4_MEASUREMENT_SECRET` — بدونها الـ server events (chat_completed, generate_lead) تكون no-op (ga4-server يرجع بدون خطأ).
4. **`REDIS_URL`** — لازم في الإنتاج عشان aggregate الـ usage/cost يكون حقيقي (بدونه الـ dashboard تُظهر `degraded:true` وأصفار).

## Residue (مُعلَّم — ما حذفت بدون موافقة)

- `src/lib/quota 2.ts` — نسخة مكررة من `quota.ts` (24805 bytes). مرشّحة للحذف.
- `src/lib/.DS_Store` — macOS residue.

## Rollback

```
git revert <commit>
# + إزالة env vars لو أضيفت (BRIGHTAI_ADMIN_KEY، إلخ)
```

## الخطوة التالية

- ينتظر commit من المالك (per brain line 18).
- بعد الديبوي: تشغيل acceptance curls (مع `$ADMIN_KEY`) + التحقق البصري في GA4 Realtime + Sentry dashboard.
