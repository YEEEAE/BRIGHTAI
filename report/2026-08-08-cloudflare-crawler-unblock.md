# تقرير: فك حظر الـ Crawlers من Cloudflare Edge

**التاريخ**: 2026-08-08
**النوع**: Incident response — production (edge config)
**التصنيف**: P0 (SEO / GEO / discovery)
**الحالة**: ✅ مُصلَح ومُتحقَّق منه على الإنتاج
**Zone**: `brightai.site` (b94b6d42e42609999ab36294e6728e21) — خطة **Free**

---

## 1) الملخص التنفيذي

الموقع كان محجوب بالكامل عن محركات البحث والـ AI crawlers من جهة Cloudflare edge.
السبب المؤكد: إعداد `ai_bots_protection: "block"` في Bot Management على الـ zone.
هذا الإعداد يحجب كل AI crawler تلقائيًا بـ HTTP 403 إلا لو كان "verified" عند
Cloudflare (على خطة Free، فقط Googlebot و Bingbot مصنّفين verified). النتيجة كانت إن
كل من GPTBot و OAI-SearchBot و PerplexityBot و ClaudeBot يحصلون على 403، و`/sitemap.xml`
كان يرجع 403 لأي bot غير verified — يعني Google ما يقدر يكتشف أي URL من الأساس.

الإصلاح: خليت `ai_bots_protection: "disabled"` عبر Bot Management API. كذا رجّعت
بوابة الـ AI crawlers لـ `public/robots.txt` (اللي هو سليم أصلاً ويسمح للكل بـ
`Allow: /`). Bot Fight Mode (`fight_mode`) طَفّيته على حاله — لسا يحمي من الـ scrapers
الخبيثة. ما لمست CSP ولا HSTS ولا أي application code.

النتيجة بعد الإصلاح: كل الـ 18 crawler (search + AI) رجعوا 200 على كل المسارات
الخمسة المختبرة، و`/sitemap.xml` يرجع 200 وفيه 251 `<loc>`.

---

## 2) الأدلّة المقاسة — قبل وبعد

### 2.1 قبل الإصلاح (القياس في بداية المهمة، 2026-08-08)

الـ task الأصلي ذكر إن **كل** الـ crawlers يحصلون على 403. لما أعدت القياس أول
المهمة، لقيت إن الوضع **تطوّر جزئيًا** (شي صار بين كتابة الـ task والقياس):

| UA | `/` | ملاحظة |
|---|---|---|
| Googlebot/2.1 | 200 | verified bot — يمر |
| bingbot/2.0 | 200 | verified bot — يمر |
| GPTBot/1.1 | **403** | غير verified — محجوب |
| OAI-SearchBot/1.0 | **403** | غير verified — محجوب |
| PerplexityBot/1.0 | **403** | غير verified — محجوب |
| ClaudeBot/1.0 | **403** | غير verified — محجوب |
| `/sitemap.xml` (googlebot) | 200 | (في القياس الأول للمهمة كان 403) |

الاستنتاج المبدئي: verified bots يمرون، غير verified يُحجَبون. هذا تطابق تامّ مع
`ai_bots_protection: "block"` + خطة Free.

### 2.2 بعد الإصلاح (القياس بعد `ai_bots_protection: "disabled"`)

كل الـ 18 crawler × 5 مسارات = 90 استدعاء، **كلها 200**:

| UA | `/` | `/en/` | `/pricing/` | `/blog/` | `/sitemap.xml` |
|---|---|---|---|---|---|
| Googlebot/2.1 | 200 | 200 | 200 | 200 | 200 |
| Googlebot-Image/1.0 | 200 | 200 | 200 | 200 | 200 |
| bingbot/2.0 | 200 | 200 | 200 | 200 | 200 |
| Applebot/0.1 | 200 | 200 | 200 | 200 | 200 |
| DuckDuckBot/1.1 | 200 | 200 | 200 | 200 | 200 |
| GPTBot/1.1 | 200 | 200 | 200 | 200 | 200 |
| OAI-SearchBot/1.0 | 200 | 200 | 200 | 200 | 200 |
| ChatGPT-User/1.0 | 200 | 200 | 200 | 200 | 200 |
| PerplexityBot/1.0 | 200 | 200 | 200 | 200 | 200 |
| Perplexity-ai/1.0 | 200 | 200 | 200 | 200 | 200 |
| ClaudeBot/1.0 | 200 | 200 | 200 | 200 | 200 |
| anthropic-ai/1.0 | 200 | 200 | 200 | 200 | 200 |
| CCBot/2.0 | 200 | 200 | 200 | 200 | 200 |
| Bytespider/1.0 | 200 | 200 | 200 | 200 | 200 |
| Meta-ExternalAgent/1.0 | 200 | 200 | 200 | 200 | 200 |
| Google-Extended/1.0 | 200 | 200 | 200 | 200 | 200 |
| Applebot-Extended/1.0 | 200 | 200 | 200 | 200 | 200 |
| Amazonbot/1.0 | 200 | 200 | 200 | 200 | 200 |

**عدد الـ non-200: 0**

الـ sitemap يرجع 200 لـ Googlebot وفيه **251 `<loc>`** (المتوقع).

عينة على الـ response headers بعد الإصلاح (مع ClaudeBot، اللي كان 403 قبل):
```
HTTP/2 200
cf-cache-status: DYNAMIC
server: cloudflare
x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
cf-ray: a27fdf052b262a48-MRS
```

---

## 3) التشخيص — كيف حصرنا السبب بالضبط

### 3.1 الـ root cause المؤكد

من `GET /zones/{zone}/bot_management`:

```json
{
  "fight_mode": true,
  "ai_bots_protection": "block",      ← هذا هو المسبب
  "ai_search": "disabled",
  "ai_user": "disabled",
  "ai_training": "disabled",
  "enable_js": true,
  "is_robots_txt_managed": true
}
```

`ai_bots_protection: "block"` هو ميزة Bot Management اللي تصنّف طلبات الـ bots
تلقائيًا وتحجب الـ AI crawlers بـ 403. على خطة Free، Cloudflare يصنّف Googlebot و
Bingbot كـ "verified" فقط، فهم يمرون؛ باقي الـ AI crawlers (GPTBot، ClaudeBot، ...)
ما هم verified فيُحجَبون.

### 3.2 استبعدنا الأسباب الأخرى

| الاحتمال | النتيجة | الدليل |
|---|---|---|
| Super Bot Fight Mode | مستحيل | خطة Free — الميزة Pro+ فقط |
| Bot Fight Mode (`fight_mode`) | ليس السبب المباشر | مفعّل (`true`) بس ما يحجب verified/legit؛ الـ block على AI bots مصدره `ai_bots_protection` |
| WAF custom rule | غير موجود | `GET .../rulesets/phases/http_request_firewall/custom/entrypoint` → 404 (ما في ولا rule) |
| WAF managed ruleset (Free) | غير متورط | 31 rule، كلها Log4j / Wordpress / React CVEs، ولا rule يخص bots/AI |
| Security Level | سليم | `medium` (القيمة الافتراضية) |
| `robots.txt` | سليم 100% | كل AI crawlers مسموحين بـ `Allow: /`؛ الـ `Disallow` الوحيد `/api/` |
| Application layer | سليم | الـ 200 الناجح يحمل `x-robots-tag: index, follow, max-image-preview:large` — نية الفهرسة صح في التطبيق |

### 3.3 ملاحظة على التطوّر الجزئي للحالة

الـ task ذكر إن Googlebot و Bingbot يحصلون على 403 أيضًا. لما بدأت، لقيتهم 200.
الاحتمال الأقرب: في الفترة بين كتابة الـ task وبدء المهمة، صار تحديث لـ Cloudflare
bot verification database فصنّف Googlebot/Bingbot كـ verified (فهم يرجعون 200)، بينما
الـ AI crawlers لسا غير verified فضلّوا 403. هذا ما يغيّر الـ root cause — نفس
الإعداد (`ai_bots_protection: "block"`) هو المسؤول عن الحالتين.

---

## 4) الإصلاح — وين وكيف

### 4.1 التغيير الوحيد المطبّق على edge

```
PUT /zones/{zone}/bot_management
{"ai_bots_protection": "disabled"}
```

قبل: `ai_bots_protection: "block"`
بعد: `ai_bots_protection: "disabled"`

كل القيم الثانية في `bot_management` ما تغيّرت (`fight_mode` لسا `true`، `enable_js`
لسا `true`). لوحظ إن `ai_search` / `ai_user` / `ai_training` كلها `"disabled"` —
يبدو إنها sub-controls مكتوفة على خطة Free ولا تأثير مباشر لها هنا.

### 4.2 ليش `disabled` مو skip rule على WAF

على خطة Free، الـ AI-bot block يطلع من محرّك Bot Management، مو من WAF managed/custom
rule. WAF custom rule بـ `action=skip` ما يقدر يتخطى Bot Management على الـ Free plan.
المفتاح الوحيد هو `bot_management.ai_bots_protection`. وإلا فالتحكّم الأنسب للـ AI
crawlers أصلاً هو `robots.txt` (الإشارة اللي يحترمها الـ crawler نفسه) — وهذا بالضبط
اللي رجّعنا الاعتماد عليه.

### 4.3 ما لمسناه (guardrails)

- ❌ ما لمسنا `fight_mode` — لسا ON، يحمي من الـ scrapers الخبيثة.
- ❌ ما لمسنا أي WAF rule (ما في أصلًا).
- ❌ ما لمسنا CSP ولا HSTS ولا أي application code.
- ❌ ما لمسنا `robots.txt` (سليم أصلاً + ملف محمي بقاعدة 2.1).
- ❌ ما لمسنا `public/_headers`.

---

## 5) الأدلّة الداعمة — auth scheme

خلال التشخيص اكتشفت إن `PATCH /bot_management` يرجع خطأ Cloudflare
`10405 "Method not allowed for this authentication scheme"` لما يستخدم Bearer token.
هذا سلوك معروف: الـ endpoint يدعم **PUT** مع Bearer. جرّبت PUT ونجح. هذا مُوثّق في
header السكربت الجديد `setup-cloudflare-ai-crawler-allowlist.mjs`.

---

## 6) الأدوات الجديدة (دائمة في الـ repo)

### 6.1 `scripts/setup-cloudflare-ai-crawler-allowlist.mjs` + `cloudflare:crawler-allowlist`

سكربت idempotent يعيد تطبيق `ai_bots_protection: "disabled"`. لو الـ setting drifted
لـ `"block"` مرة ثانية (مثلاً أحد فعّله من الـ dashboard بالغلط)، شغّل:

```bash
CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ZONE_ID=yyy \
  pnpm run cloudflare:crawler-allowlist
```

يدعم `DRY_RUN=1` و `JSON_OUT=path`. يتتبع نفس pattern سكربتات Cloudflare الحالية
(HSTS، redirects، purge).

### 6.2 `scripts/verify-crawler-access.mjs` + `verify:crawler-access`

مونيتور synthetic: يطلب `brightai.site` بـ 17 UA (search + AI crawlers) + يفحص
`/sitemap.xml` كـ Googlebot ويعدّ الـ `<loc>` (floor = 200). يخرج exit 1 لو أي طلب
رجع غير 200 أو الـ sitemap count نزل تحت الـ floor. هذا بالضبط الفجوة اللي ذكرها
الـ task: "local dist/ checks were all green while production was fully blocked" —
هذي الفحوصات المحلية ما تمرّ عبر Cloudflare، فما كانت تكتشف المشكلة.

```bash
pnpm run verify:crawler-access
```

### 6.3 ربط المونيتور بـ post-deploy gate

أضفت probe سابع لـ `scripts/verify-post-deploy.mjs` يصير يحوّل على
`verify-crawler-access.mjs`. كذا كل `pnpm verify:post-deploy` يفحص وصول الـ crawlers
كجزء من الـ production contract. فيه flag `--skip-crawler` لمن يبي يتخطّاه (مثلاً
ضد staging بلا Cloudflare).

---

## 7) المخاطر المتبقية

1. **`ai_bots_protection` ممكن يرجع `"block"`**: ممكن أحد يفعّله من الـ dashboard
   يدويًا، أو Cloudflare يغيّر الـ default في تحديث مستقبلي. الـ monitor (probe 7)
   يلتقط هذا أول طلب بعدها. السكربت `cloudflare:crawler-allowlist` يعيد الضغط بضغطة
   وحدة.
2. **بعض الـ AI crawlers الجداد مو في القائمة**: لو ظهر AI crawler جديد ومو مذكور
   في `robots.txt` ولا في قائمة الـ monitor، Cloudflare ممكن يحجبه. لازم نحدّث
   `public/robots.txt` + قائمة `CRAWLERS` في `verify-crawler-access.mjs` معًا لما
   يطلع crawler جديد نبي نسمح له.
3. **Bot Fight Mode (`fight_mode`) على Free ما يفرّق دايم بنسبة 100%**: ممكن يحجب
   bot شرعي نادرًا لو سلوكه اشتُبه منه. لو صار، الـ monitor يبلّغ ونعالج بقاعدة
   WAF skip مخصّصة أو بترقية الخطة. هذا خطر نظري، ما شفناة عمليًا.
4. **خطة Free محدودة**: ما في Super Bot Fight Mode ولا analytics متقدمة على
   `firewallEventsAdaptive`. الـ diagnostics الكاملة للـ rule ID بالضبط ما كانت
   ممكنة عبر API على هذي الخطة — بس الـ root cause اتحدّد بثقة من قراءة
   `bot_management` مباشرة، وهو كافي.

---

## 8) خطوات ما بعد الإصلاح (مطلوبة، مو اختيارية)

### 8.1 Google Search Console

- **URL Inspection → Live Test** على `https://brightai.site/` — تأكد "URL is
  available to Google".
- **Sitemaps** → أعد رفع `https://brightai.site/sitemap.xml`.

هذي خطوات يدوية على GSC ما تقدر تُؤتمتت من هنا — لازم تسوّيها إنت من
`search.google.com/search-console`.

### 8.2 Bing Webmaster Tools

- أعد رفع الـ sitemap من Bing Webmaster Tools. (هذا أيضًا يدوي.)

### 8.3 المونيتور المتكرّر

السكربت `verify:crawler-access` جاهز يركب على cron / GitHub Actions / Render cron
job. اقتراح: شغّله كل ساعة + نبّه على أي non-200. لو في CI موجود للـ post-deploy
already، الـ probe الجديد في `verify-post-deploy.mjs` كافي يغطي كل deploy.

---

## 9) كيف نُعيد إنتاج التشخيص (للمستقبل)

```bash
# 1. تأكد إن AI crawlers محجوبين (symptom)
for ua in "GPTBot/1.1" "ClaudeBot/1.0"; do
  curl -sS -o /dev/null -w "$ua -> %{http_code}\n" \
    -A "Mozilla/5.0 (compatible; $ua)" https://brightai.site/
done

# 2. اقرا bot_management (root cause)
curl -sS "https://api.cloudflare.com/client/v4/zones/$CF_ZONE/bot_management" \
  -H "Authorization: Bearer $CF_TOKEN" | python3 -m json.tool

# 3. لو ai_bots_protection != "disabled"، أعد الضغط
CLOUDFLARE_API_TOKEN=$CF_TOKEN CLOUDFLARE_ZONE_ID=$CF_ZONE \
  pnpm run cloudflare:crawler-allowlist

# 4. تحقق من الشفاء
pnpm run verify:crawler-access
```

---

## 10) الملفات اللي تغيّرت / أُضيفت

| الملف | التغيير |
|---|---|
| `scripts/setup-cloudflare-ai-crawler-allowlist.mjs` | **جديد** — سكربت idempotent لإعادة تطبيق `ai_bots_protection: "disabled"` |
| `scripts/verify-crawler-access.mjs` | **جديد** — مونيتور synthetic لـ 17 crawler + sitemap |
| `scripts/verify-post-deploy.mjs` | **تعديل** — أضيف probe 7 (crawler access) + flag `--skip-crawler` |
| `package.json` | **تعديل** — أضيف `cloudflare:crawler-allowlist` + `verify:crawler-access` scripts |
| Cloudflare Bot Management (`ai_bots_protection`) | **block → disabled** (عبر API، مو في الـ repo) |
| `public/robots.txt` | ما تغيّر — سليم أصلاً ✅ |
| `public/_headers` | ما تغيّر — خارج النطاق ✅ |

---

## 11) التحقق النهائي

```
[verify-crawler-access] host: https://brightai.site
✓ 17 crawlers on / all return 200
  sitemap.xml (Googlebot) -> 200
  sitemap <loc> count -> 251 (expected >= 200)
✓ PASS — 17 crawlers + sitemap all reachable.
```

`cloudflare:crawler-allowlist` (re-run): no-op، `ai_bots_protection` لسا `disabled` ✅.

---

**الخلاصة**: الحظر كان من إعداد واحد في Cloudflare (`ai_bots_protection: "block"`)
على خطة Free، وكان يحجب كل AI crawler غير verified. الإصلاح إعداد واحد (`disabled`)
يعتمد على `robots.txt` كبوابة موثّقة. أضفنا سكربت لإعادة الضغط + مونيتور للكشف
المبكر + ربطناه بـ post-deploy gate عشان ما يصير الحظر صامتًا مرة ثانية.
