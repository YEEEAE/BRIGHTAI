# BrightAI — Prompts التنفيذ

> كل prompt مستقل وقابل للتسليم لوكيل ثاني. لا تشتغل عليها بالتوازي — الترتيب مقصود.

---

## ترتيب التنفيذ

```
PROMPT-001 (Prisma)  ─┬─→  PROMPT-002 (Tests)  ─┐
                      │                          ├─→  PROMPT-004 (CSP)  ─→  PROMPT-FINAL
PROMPT-003 (Demo)  ───┘                          │
```

**ليش Prisma أول؟** لأن `BAI-P1-TEST-001` عَرَض من `BAI-P1-TYPES-001` — نفس السبب الجذري (`@prisma/client` ما يصدّر `LeadQueueStatus`). إصلاح واحد يقفل اثنين. البدء بالـ demo fix أول يعني إنك تشتغل على codebase الـ typecheck فيه مكسور.

`PROMPT-003` مستقل تقنيًا عن 001/002، فيصير بالتوازي **لو** فيه وكيلين. لو وكيل واحد: 001 → 002 → 003 → 004.

---

## PROMPT-001: إصلاح عقد أنواع Prisma

**Fixes:** `BAI-P1-TYPES-001`
**Priority:** P1 · **Depends on:** لا شيء · **Complexity:** M · **Risk:** Med

**Blast radius:** `packages/db/prisma/schema.prisma` · migrations · generated client · `packages/db/src/types.ts`

### الهدف
إرجاع `npm run typecheck` إلى green **بدون** أي cast يخفي الانحراف.

### الوضع الحالي (مقاس)
- `npm run typecheck` → exit 1، **42 خطأ**: 40× `TS2305` + 2× `TS7006`.
- `@prisma/client` ما يصدّر: `OnboardingProgress`, `DataExportRequest`, `LeadQueue`, `Subscription`، وenums منها `Role`, `Industry`, `CompanySize`, `LeadQueueStatus`.

### التنفيذ
1. اطبع القائمة الكاملة: `npm run typecheck 2>&1 | grep TS2305` — لا تصلح واحد واحد قبل ما تشوف الصورة كلها.
2. قارن الثلاثة على **نفس** الـ commit:
   - imports في `packages/db/src/types.ts`
   - models/enums في `packages/db/prisma/schema.prisma`
   - الـ exports الفعلية من generated `@prisma/client`
3. جاوب سؤال واحد بوضوح: **الـ schema ناقصة، ولا `types.ts` متأخرة؟** لا تخمّن — الجواب يحدد الاتجاه.
4. أصلح الاتجاه الصح:
   - schema ناقصة → أضف models/enums + migration.
   - `types.ts` متأخرة → نظّف الـ imports أو عرّف domain types صريحة.
5. `npm run db:generate` وأعد الفحص.
6. أضف CI check يمنع تكرار الانحراف بين schema والـ generated client.

### القيود
- **ممنوع** `as any` أو `@ts-ignore` أو أي cast لإسكات TS2305 — يخفي انحراف بيانات حقيقي.
- لا تغيّر database semantics بدون migration واضحة موثّقة.
- لا تخلط إصلاح الـ DB مع أي UI refactor.
- الـ 2× TS7006 أصلحها بأنواع صريحة، لا بـ `any`.

### Acceptance Criteria
- [ ] `npm run typecheck` ينجح من clean install — **صفر** أخطاء.
- [ ] كل import في `types.ts` موجود في generated client أو معرّف كـ domain type.
- [ ] ما فيه ولا cast جديد يخفي TS2305.
- [ ] عملية generation موثّقة.

### Validation
```bash
pnpm install --frozen-lockfile
npm run db:generate
npm run typecheck   # لازم صفر أخطاء
npm run build
```

### Rollback
أرجع `types.ts` و schema/migrations فقط. ما فيه UI surface متأثر.

---

## PROMPT-002: تثبيت اختبار chat session

**Fixes:** `BAI-P1-TEST-001`
**Priority:** P1 · **Depends on:** **PROMPT-001** · **Complexity:** S · **Risk:** Low

**Blast radius:** `scripts/test-chat-session.mjs` · `src/pages/api/ai/chat.ts` · Redis/session helpers

### الهدف
إرجاع regression signal موثوق لمسار `/api/ai/chat`.

### الوضع الحالي (مقاس)
```
npm test → ℹ fail 1 → exit 1
SyntaxError: The requested module '@prisma/client'
does not provide an export named 'LeadQueueStatus'
```

### التنفيذ
1. **شغّل `npm test` أول شي بعد PROMPT-001.** فيه احتمال قوي يمر بدون أي تعديل — لأن الفشل كان عَرَضًا لانحراف Prisma. لا تعدّل ولا سطر قبل هذي الخطوة.
2. لو مرّ: تحقق إنه يفشل فعلًا عند regression حقيقي (اكسر شي مؤقتًا وتأكد إنه يلقطه). اختبار يمر دايمًا = اختبار ما ينفع.
3. لو ما مرّ: احفظ أول failure **كامل** بدون تعديل behavior عشوائي، وبعدها اشتغل عليه.
4. افصل الاختبار عن provider/network بـ mocks أو fixtures موجودة في المشروع.
5. وسّع التغطية: success · provider fallback (Groq→Gemini) · rate limit · invalid session id · degraded store.
6. تأكد إن SSE و non-streaming contracts متطابقة مع الـ client consumers.

### القيود
- **ممنوع** تسريب provider keys في الـ logs.
- **ممنوع** الاعتماد على Groq/Gemini live في unit test — يخلي الاختبار flaky.
- حافظ على session limits و PII redaction الموجودة.
- لا تخفّض assertions لتمرير الاختبار.

### Acceptance Criteria
- [ ] `npm test` ينجح من clean environment.
- [ ] الاختبار يفشل بوضوح عند regression حقيقي (مُتحقَّق بكسر متعمّد).
- [ ] assertions على status + body + headers.
- [ ] ما فيه dependency على شبكة خارجية.

### Validation
```bash
npm test
npm run typecheck
node scripts/test-chat-session.mjs   # مستقل
# + مراجعة أمنية سريعة على الـ logs
```

---

## PROMPT-003: توحيد Demo disclosure وجعله صادقًا

**Fixes:** `BAI-P0-TRUTH-001` · `BAI-P2-DISCLOSURE-002`
**Priority:** **P0** · **Depends on:** لا شيء (يصير بالتوازي مع 001) · **Complexity:** M · **Risk:** Med

**Blast radius:** `src/layouts/KernelLayout.astro` · `public/js/kernel-shell.js` · `src/components/kernel/KernelDemoPill.astro` · `public/js/kernel-demo-pill.js` · `public/js/kernel-reports.js` · `public/js/kernel-approvals.js` · `public/js/audit.js` · `src/client/audit.ts` · `src/pages/kernel/evidence.astro`

### الهدف
إيقاف أي انطباع إن أرقام static/demo هي live، وتوحيد نظامَي الـ demo control المتوازيَين.

### الوضع الحالي (مقاس)

**العلّة الأولى — control ميت:**
`kernel-shell.js:229-230` يكتب `document.body.setAttribute('data-demo', ...)`. الـ `grep` على `data-demo` في كل `src/styles` و`src/layouts` و`public/js` رجّع **مستهلك صفر** — ولا CSS rule، ولا JS reader. الوحيد اللي يذكرها: السطر اللي يكتبها + تعليق في `kernel-shell.js:10`.
النتيجة: المستخدم يضغط، الـ label يتحوّل «بياناتي»، والأرقام **نفسها حرفيًا**.

**العلّة الثانية — نظامان متوازيان:**

| النظام | التعريف | القرّاء |
|---|---|---|
| `[data-kernel-demo-toggle]` | `KernelLayout.astro:157` | `kernel-shell.js:151,214` |
| `[data-kernel-demo-pill]` | `KernelDemoPill.astro:21` | `kernel-demo-pill.js:20` · `kernel-reports.js:36` · `kernel-approvals.js:313` · `audit.js:326` · `src/client/audit.ts:334` · `evidence.astro:1832` |

نظامان يدّعيان نفس المعنى، ما يتزامنان، ولا واحد يبدّل مصدر بيانات حقيقي.

### التنفيذ
1. اجرد كل رقم معروض في `src/pages/kernel/*.astro` وسجّل مصدره من `src/data/**` (66 ملف). بدون هذا الجرد ما تعرف وش تصنّف.
2. **اتخذ القرار المعماري صريحًا — واحد من اثنين:**
   - **(أ) Disclosure ثابت** — الأنظف والأصدق والأسرع. احذف سلوك الـ toggle، خلّه badge غير تفاعلي «بيانات تجريبية». مناسب لو ما فيه live source جاهز.
   - **(ب) Toggle حقيقي** — يبدّل المصدر فعليًا في كل surface، والأرقام تتغيّر أو تُخفى. لا تختارها إلا لو فيه live source فعلًا.

   **ممنوع** الخيار الثالث: زر يغيّر label و CSS بس.
3. وحّد النظامين في attribute **واحد**. اختر اللي عنده قرّاء أكثر (`data-kernel-demo-pill`، عنده 6 قرّاء) وحدّث `KernelLayout.astro:157` و`kernel-shell.js:151,214` عليه — أو العكس، بس بشكل كامل ومتّسق.
4. أضف provenance label ثابت لكل surface فيه أرقام: `بيانات تجريبية` أو `بيانات مباشرة` + timestamp/source عند الـ live.
5. لو اخترت (أ): احذف `body[data-demo]` والكود الميت المرتبط. لو اخترت (ب): خلّها مستهلَكة فعليًا.
6. أضف اختبار يثبت الأمر: إن الضغط يغيّر **كل** اللي يدّعي تغييره، أو إن الـ control غير تفاعلي أصلًا.

### القيود
- لا تكسر SSR ولا Astro view transitions ولا أي route حالي.
- لا تغيّر URLs، ولا تضف dependency جديدة.
- حافظ على Arabic/RTL و keyboard semantics.
- `aria-pressed` يبقى **فقط** لو بقي فعلًا toggle — على badge ثابت يُحذف.
- لا تلمس ملفات `src/data/**` في هذا الـ prompt (نطاق `BAI-P2-DISCLOSURE-002` لاحقًا).

### Acceptance Criteria
- [ ] ما فيه ولا KPI في Kernel بدون classification مرئي.
- [ ] نظام demo control **واحد** فقط، attribute واحد، قرّاء متّسقون.
- [ ] لو بقي toggle: DOM + data source يتغيّران فعليًا (اختبار before/after يثبت).
- [ ] `grep -rn "data-demo" src public` → إما مستهلك حقيقي، أو صفر مطلقًا.
- [ ] keyboard focus و ARIA يعكسان حالة حقيقية.

### Validation
```bash
npm run build
npm run typecheck
# smoke على: /kernel/ · /kernel/stats/ · /kernel/chat/ · /kernel/reports/ · /kernel/evidence/
grep -rn "data-demo\|demo-pill\|demo-toggle" src public   # لازم يطلع نظام واحد
```
+ فحص بصري RTL على 375px و 1280px.

### Rollback
أرجع المكوّن والـ scripts فقط. ما تلمس أي data file غير متعلق.

---

## PROMPT-004: نقل CSP إلى response headers

**Fixes:** `BAI-P1-SEC-001`
**Priority:** P1 · **Depends on:** PROMPT-001, PROMPT-003 · **Complexity:** M · **Risk:** **High**

**Blast radius:** `astro.config.mjs` · adapter/deployment layer · server entry · `verify:csp-drift` · `verify:live:headers`

### الهدف
تسليم CSP كـ response header حقيقي، من **مكان واحد**.

### الوضع الحالي (مقاس)
`astro.config.mjs:156` يبني `<meta http-equiv="Content-Security-Policy" content="...">` لكل ملف مع style hashes. القيود:
- `Content-Security-Policy-Report-Only` ما ينفع أصلًا عبر meta.
- directives مثل `frame-ancestors` تُتجاهل في meta.
- الـ requests قبل parse الـ meta ما تُغطّى.

### التنفيذ
1. انقل توليد CSP إلى response headers في adapter/deployment layer أو server entry، مع الحفاظ على منطق style hashes الحالي.
2. **ابدأ بـ `Content-Security-Policy-Report-Only`** — CSP مشدود يكسر الموقع الحي بصمت.
3. راقب التقارير، شدّ الـ policy، بعدها بس حوّلها إلى الـ header المُلزِم.
4. تأكد إن `connect-src` يعدّ **كل** origin يتصل به التطبيق — خصوصًا Groq و Gemini و Redis endpoints. إغفالها يكسر الـ AI chat.
5. أضف الـ baseline headers الآمنة: `X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` · `Strict-Transport-Security`.
6. **احذف** meta CSP بعد تأكيد الـ header يعمل — لا تخلّي الاثنين.

### القيود
- **ممنوع** meta + header معًا — policy مكرر يسبب سلوك متضارب وصعب التشخيص.
- لا تفعّل CSP مُلزِم قبل مرحلة report-only.
- لا تستخدم `'unsafe-inline'` في `script-src` كحل سريع — يلغي معظم قيمة CSP.
- تحقق إن الـ AI chat و forms تشتغل بعد كل تغيير.

### Acceptance Criteria
- [ ] الـ deployed response فيه الـ headers المتوقعة (متحقَّق بـ `curl -I`).
- [ ] `verify:csp-drift` و `verify:live:headers` ينجحان.
- [ ] ما فيه policy مكرر أو متضارب.
- [ ] AI chat و lead forms تشتغل تحت الـ policy.

---

## PROMPT-FINAL: إعادة التدقيق Before/After

**Fixes (تحقّق):** `BAI-P0-TRUTH-001` · `BAI-P1-TYPES-001` · `BAI-P1-TEST-001` · `BAI-P1-SEC-001` · `BAI-P2-COVERAGE-001` · `BAI-P2-A11Y-001` · `BAI-P2-MOBILE-001` · `BAI-P2-PERF-001` · `BAI-P2-DISCLOSURE-002` · `BAI-P3-CSS-001`
**Priority:** P0 · **Depends on:** 001 · 002 · 003 · 004

### التنفيذ
1. حمّل `reports/brightai-audit-baseline.json` كـ **Before**.
2. شغّل **نفس** الـ audit بنفس الـ rubric والأوزان.
3. لكل issue سجّل حالة واحدة: `fixed` · `partial` · `open` · `regressed`.
4. شغّل: `build` · `typecheck` · `tests` · axe/a11y · production Playwright · viewport matrix (320→1920) · CWV · SEO checks · visual checks.
5. **ارفع التغطية فوق 60%** — بدونها كل الدرجات تبقى PRELIMINARY وما تنفع كـ baseline.
6. أنشئ `reports/brightai-audit-after.json` + جدول Before/After بـ evidence فعلي.

### القيد الصلب
**لا تكتب After score لأي بُعد ما قدرت تقيسه.** اكتب `AFTER: UNSCORED` حرفيًا.
الأبعاد الأربعة اللي كانت `UNSCORED` في الـ Before (Accessibility · Mobile · Performance · Arabic/RTL) تحتاج قياس **فعلي** — لا تُملأ بتقدير. رقم مخترع أسوأ من لا رقم.

### Acceptance Criteria
- [ ] `reports/brightai-audit-after.json` موجود وvalid JSON.
- [ ] كل issue له حالة صريحة.
- [ ] كل After score وراه أمر منفّذ فعليًا.
- [ ] الأبعاد غير المقاسة مكتوبة `UNSCORED` مو مقدَّرة.
- [ ] Overall رقمي **فقط** لو الأبعاد الأربعة عندها قياس حقيقي.

---

## Quick Wins

مرتّبة بنسبة القيمة إلى الجهد.

| # | Quick Win | Issue IDs | الأثر المتوقع | Time | Risk |
|:--:|---|---|---|:--:|:--:|
| 1 | شغّل `npm test` بعد إصلاح Prisma قبل أي تعديل عليه | `BAI-P1-TEST-001` | يحتمل يقفل P1 كامل بصفر جهد | S | Low |
| 2 | حوّل الـ pill إلى disclosure ثابت لو ما فيه live source | `BAI-P0-TRUTH-001` | يشيل claim مضلل فورًا | S | Low |
| 3 | وحّد `data-kernel-demo-*` في attribute واحد | `BAI-P0-TRUTH-001` | يصلح تشتّت 8 ملفات | S | Low |
| 4 | احذف `body[data-demo]` الميت | `BAI-P0-TRUTH-001` | يشيل كود ميت مضلل | S | Low |
| 5 | أضف `typecheck` كـ CI gate بعد `db:generate` | `BAI-P1-TYPES-001` | يمنع regression صامت | S | Low |
| 6 | أضف baseline security headers (nosniff, Referrer-Policy) | `BAI-P1-SEC-001` | مكسب أمني بدون خطر CSP | S | Low |
| 7 | أضف Playwright smoke لـ Kernel routes | `BAI-P2-COVERAGE-001` | يرفع evidence coverage | M | Low |
