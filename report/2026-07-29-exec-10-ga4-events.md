---
id: EXEC-10
title: GA4 events + server-side lead tracking
date: 2026-07-29
prompt: BAI-MEAS-01/02
status: verified_local
verified_production: no
files_changed:
  - src/lib/analytics.ts
  - src/lib/ga4-server.ts
  - src/pages/api/lead.ts
  - src/scripts/lead-form-handler.js
  - src/components/kernel/KernelAiAssistant.astro
  - src/pages/demo/index.astro
---

# EXEC-10 — GA4 events + server-side lead tracking

## الملخص التنفيذي

المشكلة الأصلية (حسب الـ prompt): ما فيه clear event tracking لـ lead/chat/demo،
و`api/lead.ts` ما يستدعي GA4 Measurement Protocol (لو فشل client fetch = event يُفقد).

الواقع اللي لقيته لمّا قرأت الكود: infra التحليلات **موحّدة وموجودة** في
`src/lib/analytics.ts` (647 سطر) مع `track()` موحّد + PII guard + consent + dedup.
الـ LeadForm يستخدم `leadTracker` (wrapper) ويطلق `form_submit_attempt/success` +
`generate_lead` (client-side) **موجودة جاهزة**. الـ chat حقيقي (Groq
`llama-3.3-70b-versatile` عبر `/api/ai/chat`).

**النقص الحقيقي الوحيد ذو قيمة**: GA4 Measurement Protocol **server-side** —
الـ API route نفسه يرسل event لـ GA4 مباشرة، فيغطّي سيناريو فقدان الـ client event
(adblocker، شبكة مقطوعة بعد submit، سكّر التبويب).

قرارات المستخدم:
1. أسماء الـ prompt الجديدة (`lead_started`, `lead_completed`, `chat_started`,
   `chat_completed`, `demo_opened`) تُضاف كـ **alias** بجانب الأسماء الموحّدة
   الموجودة (ما نحذف القديمة).
2. GA4 server-side مع **fallback آمن** (لو secrets فاضية = no-op + warning).
3. chat حقيقي → نطلق `chat_completed` على happy path حقيقي فقط (مو demo reply).

## وش سوينا

### 1) توسيع التاكسونومي (alias)
أضفنا 5 أحداث للـ `ANALYTICS_EVENTS` enum في `src/lib/analytics.ts`:
`LEAD_STARTED`, `LEAD_COMPLETED`, `CHAT_STARTED`, `CHAT_COMPLETED`, `DEMO_OPENED`.
الـ `track()` الموحّد يتعامل معها تلقائيًا (PII guard + consent + dedup موروثة).

### 2) GA4 Measurement Protocol server-side (الجزء الناقص فعلًا)
أنشأنا `src/lib/ga4-server.ts` يحوي `sendServerEvent({ events, clientId })`:
- يبني POST لـ `https://www.google-analytics.com/mp/collect`
- **best-effort**: أي throw يمسكه caller، ما يفشل الـ lead enqueue أبدًا
- **fallback آمن**: لو `GA4_API_SECRET` فاضي → no-op + warning (dev يشتغل بدون secrets)
- timeout 3s + `AbortController`
- `clientId`: من `_ga` cookie (ي Stitch مع session الـ client) أو fallback لـ
  `sha256(ip+userAgent).slice(0,16)` (ما يطلع PII برّه)
- PII guard: يحذف أي key ينتهي بـ `_email/_phone/_name/_message/_address`

### 3) ربط `api/lead.ts` بـ GA4 server-side
بعد الـ enqueue الناجح، وقبل الـ response، نطلق:
```ts
sendServerEvent({
  clientId: cookieClientId ?? fallbackClientId,
  events: [{ name: 'generate_lead', params: { source, page, mode } }],
});
```
`void` + `.catch()` عشان ما يبلكش الـ response (fire-and-forget best-effort).

### 4) Client-side events (alias)

**`lead-form-handler.js`** (3 نقاط حقن):
- `lead_started` عند الـ submit attempt الحقيقي (بجانب `form_submit_attempt`)
- `lead_completed { mode: 'shipped' }` عند نجاح AJAX (بجانب `form_submit_success`)
- `lead_completed { mode: 'queued' }` في honeypot path (يتسق مع النمط الموجود)

**`KernelAiAssistant.astro`** (2 نقطة حقن):
- `chat_started` داخل `send()` قبل fetch
- `chat_completed` داخل `finalize()` callback — **بس لما `isDemo === false`**
  (reply حقيقي فقط، مو demo/degraded reply)

**`demo/index.astro`**:
- `demo_opened` في `<script>` ينطلق عند page load (مرّة لكل تحميل)

## الجدول النهائي للـ events

| Event | المصدر | Trigger |
|---|---|---|
| `lead_started` | client | form submit attempt |
| `lead_completed` | client | form submit success (shipped/queued) |
| `chat_started` | client | chat send |
| `chat_completed` | client | real API reply received (not demo) |
| `demo_opened` | client | /demo/ page load |
| `generate_lead` | **server** | api/lead.ts post-enqueue (best-effort) |

ملاحظة: الأسماء الموحّدة القديمة (`form_submit_*`, `generate_lead` client-side)
تبقى شغّالة بجانب الأسماء الجديدة (alias policy من قرار المستخدم).

## ليش عدّلنا عن حرفية الـ prompt

| الـ prompt طلب | الواقع | قرارنا |
|---|---|---|
| أنشئ `src/lib/ga4-measurement.ts` | `src/lib/analytics.ts` موجود (647 سطر) كـ single source | سمّينا الملف `ga4-server.ts` عشان يوضّح إنه server-only وما يتعارض بصريًا |
| GA4 snippet (gtag.js) | موجود في `public/js/gtag-init.js` وشغّال بـ `G-8LLESL207Q` | ما أضفناه (مكرر) |
| `analytics.track()` للـ LeadForm | `leadTracker` wrapper موجود | استخدمنا `track` re-export من lead-tracker.ts |
| أسماء جديدة كأساس | taxonomy موحّدة موجودة | أضفناها كـ alias (قرار المستخدم) |

## التحقيق (verification)

```bash
# Build
npm run build → Complete! + 211 صفحة HTML في dist/client ✅

# Grep verifications — كل نقاط الحقن موجودة
grep -nE "LEAD_STARTED|LEAD_COMPLETED|CHAT_STARTED|CHAT_COMPLETED|DEMO_OPENED" src/lib/analytics.ts  # 5 نتائج ✅
grep -nE "track\('lead_started'|track\('lead_completed'" src/scripts/lead-form-handler.js              # 3 نتائج ✅
grep -nE "track\('chat_started'|track\('chat_completed'" src/components/kernel/KernelAiAssistant.astro # 2 نتائج ✅
grep -n "demo_opened" src/pages/demo/index.astro                                                        # 1 نتيجة ✅
grep -nE "sendServerEvent|generate_lead" src/pages/api/lead.ts                                          # import + call ✅

# Build output verifications
grep -rl "chat_started\|chat_completed" dist/client/kernel/   # في صفحات الكيرنل ✅
grep -rl "lead_started\|lead_completed" dist/client/          # في LeadForm JS bundle ✅
grep -rl "sendServerEvent\|generate_lead" dist/server/        # في lead server chunk ✅
grep -c "demo_opened" dist/client/demo/index.html             # 1 ✅
```

**GA4 DebugView (manual، يتطلب deploy + إضافة secrets)**:
1. افتح `/contact/`، املأ النموذج، submit → `lead_started` + `lead_completed` + `generate_lead` (server)
2. افتح أي صفحة `/kernel/*/`، أرسل message → `chat_started` + `chat_completed`
3. افتح `/demo/` → `demo_opened`

## المخاطر المتبقية

1. **`GA4_API_SECRET` + `GA4_MEASUREMENT_SECRET` ما أُضيفت لـ Render بعد** →
   الـ server-side `generate_lead` راح يكون no-op (الكود جاهز، fallback آمن شغّال).
   لازم تضيفهم في Render → Environment. طريقة الحصول على الـ API secret:
   GA4 → Admin → Data Streams → اختر الـ stream → Measurement Protocol API secrets → Create.
   الـ Measurement ID = `G-8LLESL207Q` (موجود افتراضيًا في الكود).

2. **حجم الـ events في GA4 راح يزيد** (alias policy): كل form submit يطلق
   5 أحداث متوازية (`form_submit_attempt` + `lead_started` + `form_submit_success`
   + `lead_completed` + `generate_lead` client + `generate_lead` server). هذا مقصود
   من قرار "alias" — يحافظ على backward-compat مع الـ reports القديمة.

3. **`chat_completed` يطلع بس على happy path حقيقي** — لو المستخدم يأخذ demo reply
   أو خطأ، ما يطلع. هذا متعمّد (الـ event يعدّ reply فعلي موكتّب).

4. **خطأ type pre-existing على HEAD** (`api/lead.ts:271` — `page: lead.page ?? null`
   يصرّف لـ `string | undefined`): تأكدت إنه موجود على الـ HEAD النظيف قبل تعديلي
   (عبر `git stash`). **ما من تعديلي ولا أصلحته** (يحتاج مهمة منفصلة، ما يتعلق بـ EXEC-10).

## Rollback

```bash
git revert HEAD
# + احذف GA4_API_SECRET / GA4_MEASUREMENT_SECRET من Render (لما تضاف)
```

## Definition of Done

- ✅ 5 events client-side في الكود + build output (`lead_started`, `lead_completed`,
  `chat_started`, `chat_completed`, `demo_opened`)
- ✅ server-side `generate_lead` في `api/lead.ts` (best-effort، fallback آمن)
- ✅ build ناجح (211 صفحة، 0 أخطاء جديدة)
- ⏳ GA4 DebugView verification: **يحتاج deploy + إضافة secrets** (manual، للمستخدم)
