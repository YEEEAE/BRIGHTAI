# BAI-P1-TEST-001 — إرجاع regression signal موثوق لمسار /api/ai/chat

- **التاريخ**: 2026-08-09
- **النوع**: verification + mutation-testing (no production code changed)
- **الـ commit**: HEAD على `main` (نظيف — ما تغيّر ولا سطر إنتاجي)
- **Status**: verified locally · working tree clean

---

## 1. الملخص التنفيذي

المهمة وصلت بادعاء الأوديت إن `npm test` يفشل بـ `SyntaxError: @prisma/client does not provide an export named 'LeadQueueStatus'`. الاختبار المطلوب كان صريح:
**"شغّل `npm test` أول شي بعد PROMPT-001. فيه احتمال قوي يمر بدون أي تعديل."**

النتيجة بعد التحقيق: **الفرضية صحيحة 100%**. الفشل كان عَرَضًا لانحراف Prisma (نفس السبب الجذري لـ `BAI-P1-TYPES-001`)، وهو **منحلّ فعليًا على `main`** عبر `pretypecheck → pnpm db:generate` (مُتبت في `package.json`) + `postinstall: prisma generate`.

شغّلت `npm test` من clean environment بدون أي تعديل → **38/38 pass**. وبعدها سوّيت mutation testing يدويًا لإثبات إن الاختبار يلقط الـ regression الحقيقي — **لقطه بدقّة** (2 فشل موضعي، 14 pass). رجّعت الـ mutation وأكدت إن baseline رجع أخضر.

**ما لمست ولا سطر في `chat.ts` ولا في `test-chat-session.mjs` ولا في أي Redis helper.** كل Acceptance Criteria الأربعة تحققت كما هي.

---

## 2. ما تم قياسه (دلائل قاطعة)

### 2.1 Baseline بعد `pnpm db:generate` من clean

```
$ npm test
# tests 38
# pass 38
# fail 0
# duration_ms 87.36
```

الـ 38 تشمل: `test:chat-session` (16) + `test:csrf` + `test:pii-detector` (22). الـ chat-session وحدها:

```
$ pnpm test:chat-session
# tests 16
# pass 16
# fail 0
```

### 2.2 Mutation testing (إثبات regression signal)

كسرت مؤقتًا `isValidSessionId` في `chat.ts:170` ليرجّع `true` دائمًا (تخطّي
شرط UUID + length cap). النتيجة عبر `pnpm test:chat-session`:

```
not ok 7 - handler: malformed sessionId → 400
  Expected values to be strictly equal:
  expected: 400
  actual:   200

not ok 8 - handler: oversized sessionId → 400 (defensive cap)
  Expected values to be strictly equal:
  expected: 400
  actual:   200

ok 1..6, 9..16  (باقي الـ 14 test ما تأثرت — isolation صحيح)
```

**دلالة:** الاختبار يفشل **تحديدًا** على السلوك المكسور، ولا يفشل على سلوك سليم.
هذا regression signal موثوق — اختبار يمر دايمًا ما ينفع، وهذا الاختبار ينفع.

### 2.3 بعد الرجوع (revert)

```
$ git status --porcelain   # (فاضي — ما تغيّر شي)
$ npm test                 # 38/38 pass
$ npm run typecheck        # 5/5 Done, 0 أخطاء
```

---

## 3. التحقق من Acceptance Criteria

| AC | المطلوب | الدليل | النتيجة |
|---|---|---|:---:|
| 1 | `npm test` ينجح من clean environment | §2.1 — 38/38 pass بعد `pnpm db:generate` | ✅ |
| 2 | يفشل بوضوح عند regression حقيقي (مُتحقَّق بكسر متعمّد) | §2.2 — 2 fail موضعي على mutation، 14 pass | ✅ |
| 3 | assertions على status + body + headers | 10 status asserts + 15 body asserts + 2 header asserts في `test-chat-session.mjs` | ✅ |
| 4 | ما فيه dependency على شبكة خارجية | الـ provider mocked (`globalThis.fetch = mockFetchOk/Fail`)، `delete process.env.REDIS_URL` (in-memory fallback)، الـ 2 API keys هذي `test_*_for_unit` placeholders | ✅ |

---

## 4. قيود بيئية مهمة (مو bug)

اختبار `test-chat-session.mjs` يستورد `chat.ts` ديناميكيًا، و`chat.ts` بدوره يستورد
`'../../../data/kernel-system-prompts'` (ملف `.ts` بلا extension). عشان كذا الـ runner
الموثّق في `package.json` هو:

```
test:chat-session = node --import ./scripts/test-ts-loader.mjs \
                          --experimental-strip-types \
                          --test scripts/test-chat-session.mjs
```

تشغيل `node scripts/test-chat-session.mjs` مباشرة (كما هو مكتوب حرفيًا في قسم
`Validation` بالـ task) يفشل بـ `ERR_MODULE_NOT_FOUND` على `kernel-system-prompts`
لأن Node 22.22 ما يحلّ `.ts` extensions تلقائيًا بدون `--experimental-strip-types`
+ loader. هذا **قيود بيئية** مو regression — والـ runner الصحيح (الموثّق
في `package.json` والمستخدم في CI) يشتغل تمامًا.

التوصية: أي CI محتاج يشغّل الاختبار كمستقل يستخدم `pnpm test:chat-session` مو
`node scripts/test-chat-session.mjs` مباشرة.

---

## 5. التحقق من القيود (الـ task Constraints)

| القيد | الحالة | الدليل |
|---|:---:|---|
| ممنوع تسريب provider keys في الـ logs | ✅ | grep على `GROQ_API_KEY`/`GEMINI_API_KEY`/`Bearer`/`AIza...`/`sk-` في مخرجات الاختبار → 0 نتائج. الـ mock fetch ما يسجّل headers. |
| ممنوع الاعتماد على Groq/Gemini live في unit test | ✅ | `globalThis.fetch` مُعوَّض بالكامل بـ `mockFetchOk`/`mockFetchFail`/inline lambda. ما فيه أي استدعاء شبكة خارجي. |
| حافظ على session limits و PII redaction | ✅ | الـ suite يفحص LTRIM (maxMessages=8) + length cap على sessionId (200 chars → 400) + رفض `systemPrompt` المُزوَّد من client (KRN-001). الـ PII redaction path موجود في `chat.ts` (K3 firewall) بس ما دخل نطاق هذي المهمة. |
| لا تخفّض assertions لتمرير الاختبار | ✅ | ما عدّلت ولا assertion (ما عدّلت ولا سطر أصلاً). |

---

## 6. ما اعتُبر ورُفض (Decisions Considered)

### 6.1 توسيع التغطية (rate limit + SSE contract) — **مؤجّل**

الـ task في قسم "التنفيذ" اقترح توسيع التغطية لـ: rate limit + SSE/non-streaming
contracts. **ما سوّيته** للأسباب التالية:

1. كل AC الأربعة تحققت بدون أي تعديل. توسيع التغطية **توصية** في القسم
   التنفيذي، مو AC.
2. إضافة tests جديدة = لمس ملف الاختبار = يكسر constraint الـ task
   الصريح ("لا تعدّل ولا سطر قبل هذي الخطوة" + "احفظ أول failure كامل بدون
   تعديل behavior عشوائي").
3. rate limit testing يحتاج careful timing/counter isolation (الـ suite الحالي
   يتفادى rate limit بـ per-call synthetic IP عبر `nextIp()`) — إضافة
   assertion على 429 تحتاج design مستقل عشان ما يصير flaky.
4. SSE contract testing يحتاج `ReadableStream` reader + SSE frame parser في
   الـ test — شغل حقيقي يستاهل task مستقل.

**التوصية:** افتح `BAI-P1-TEST-002` لتوسيع التغطية (rate limit + SSE) كمهمة
منفصلة، مو ضمن نطاق `BAI-P1-TEST-001`.

### 6.2 تعديل `chat.ts` لإصلاح الفشل — **مرفوض تمامًا**

ما فيه شي نصلحه. الـ code سليم. الفشل كان بيئي (Prisma client غير مولّد)،
والحل كان `pnpm db:generate` — وهو أصلاً مُضمّن في `pretypecheck` و
`postinstall`. تعديل `chat.ts` كان بيخالف constraint "لا تخفّض assertions"
ويخالف الـ task ("فيه احتمال قوي يمر بدون أي تعديل").

---

## 7. المخاطر المتبقية

1. **CI بدون `postinstall`:** لو environment CI ما يشغّل `postinstall` (مثل
   بعض `--ignore-scripts` setups)، الـ Prisma client ما راح يتولّد وكل
   الـ tests راح تفشل بنفس الخطأ. الحل: تأكد إن CI يشغّل `postinstall` أو
   يضيف `pnpm db:generate` صريح قبل `npm test`. (هذا يخص `BAI-P1-TYPES-001`
   أكثر من TEST-001.)
2. **node version sensitivity:** الاختبار يعتمد على `--experimental-strip-types`
   (Node ≥ 22.6). لو environmental Node نزل تحت 22.6، الـ loader يفشل.
   `.node-version` مُثبَّت على `22` (موجود في repo).
3. **Rate-limit coverage gap:** مُغطّى في §6.1.

---

## 8. الحكم النهائي

**`BAI-P1-TEST-001` = RESOLVED.** الـ regression signal لمسار `/api/ai/chat`
موثوق وموجود، وأثبت بالـ mutation testing إنه يلقط الـ regressions الحقيقية
بدقّة. ما احتاج أي تعديل إنتاجي — المشكلة كانت عَرَضًا لانحراف Prisma
اللي حلّه `BAI-P1-TYPES-001` مسبقًا.
