# خطة: فصل المحاكاة الآمنة عن الهجوم الإنتاجي في `/kernel/redteam/`

## السياق والتشخيص

صفحة Red Team Arena محاكاة حتمية محلية بالكامل (vanilla JS، لا شبكة، Stage 5 خامل)، وهذا موثّق في الـ FAQ المنشور. لكن الـ UX الحالي ما يفصل بصريًا بين «محاكاة آمنة» و«هجوم إنتاجي»:

1. فوق الطية صفر سياق محاكاة (العنوان + الزر + الإطار الأحمر المتوهّج يصرخ "هجوم حقيقي").
2. بطاقة الحكم تقول «صُدّ!»/«اختراق!» بدون إطار مرجعي.
3. Rate-limited يُعرض كـ «صُدّ» أخضر = لبس قوي (هذا throttling مو دفاع أمني).
4. الـ Trace ID نص زخرفي بلا وجهة (الـ JS يسجّل trace حقيقي بس ما يربطه بشيء).
5. ما في زر reset واضح (rate limiter يضرب بعد 10 هجمات ولا طريقة للفرمت).
6. Empty input يرجع `null` بصمت، ما في رسالة استرداد.

## القرارات (مُعتمدة من المستخدم)

- **Authorization notice**: chip رمادي صغير جنب البادج «محاكاة آمنة · محلي بالكامل» + tooltip `i`.
- **Result taxonomy**: 4 نتائج بألوان/icons مختلفة (صُدّ أخضر / مقيّد كهرماني / اختراق محاكاة أحمر+شارة / منخفض الخطورة رمادي).
- **Reset**: زر ثابت صغير بالـ hero «↺ إعادة ضبط».
- **Trace ID**: زر «افتح الأثر ↗» يُطلق `CustomEvent('kerneltrace:open', { detail: { traceId } })` (نفس نمط `kernel-approvals.js`).

## القيود الصارمة المحترمة

- ✅ ما نلمس النصوص المنشورة (h1 «حاول تخترق Kernel»، subtitle، FAQ، seoBlocks، عناوين/أوصاف الـ 40 تقنية).
- ✅ كل النصوص الجديدة عامية سعودية، مو MSA.
- ✅ vanilla JS فقط، `const`/`let`، لا `console.log` إنتاجي، لا Tailwind، لا `<iconify-icon>`.
- ✅ احترام `prefers-reduced-motion`.
- ✅ كل `<img>`/`<button>` موجود بقواعد الوصول (aria-label/visible text).
- ✅ RTL: الجزر التقنية `dir="ltr"`، الخصائص المنطقية.

---

## التنفيذ (3 ملفات + سكربت اختبار)

### المرحلة 1 — `src/pages/kernel/redteam.astro` (markup)

**1.1 — Authorization chip جنب البادج** (fوق الطية، بعد `rt-hero__badge`):
```astro
<span class="rt-hero__badge">
  <span aria-hidden="true">⚔️</span>
  <span>ساحة الفريق الأحمر — Red Team Arena</span>
</span>
<span class="rt-hero__sim-chip" data-rt-sim-chip>
  <span aria-hidden="true">🧪</span>
  <span>محاكاة آمنة · محلي بالكامل</span>
</span>
```
- chip ثابت، رمادي/أزرق خافت، `font-xs`. ما يلمس h1 ولا subtitle.

**1.2 — زر Reset ثابت بالـ hero** (ضمن `rt-input-area__actions`، قبل `rt-input-area__hint`):
```astro
<button type="button" class="rt-input-area__reset" data-rt-reset aria-label="إعادة ضبط الجلسة">
  <svg ...↺.../><span>إعادة ضبط</span>
</button>
```

**1.3 — إعادة هيكلة بطاقة الحكم** (دعم taxonomy + trace link + states):
- يحوّل `rt-verdict__icon`/`title` لـ 4 حالات (`--blocked`/`--rate-limited`/`--breached`/`--low-risk`).
- يضيف `rt-verdict__sim-note` (شريط «🧪 نتيجة محاكاة — ما في اختراق فعلي») يظهر دائمًا داخل البطاقة.
- يحوّل `Trace ID` value لزر `data-rt-open-trace` يفتح الـ drawer.
- يضيف `rt-verdict__empty` (رسالة فارغة) + `rt-verdict__error` (رسالة خطأ) مخفيّة افتراضيًا.

**1.4 — جلسة الجلسة (session summary)** بلاك صغير أسفل الـ leaderboard:
```astro
<div class="rt-session" data-rt-session hidden aria-live="polite">
  <span>جلستك: <strong data-rt-session-count>0</strong> هجوم</span>
  <span>صُدّ: <strong data-rt-session-blocked>0</strong></span>
  <span>اختراق محاكاة: <strong data-rt-session-breached>0</strong></span>
</div>
```

### المرحلة 2 — `kernel/assets/css/pages/redteam.css` (taxonomy + states)

- `.rt-hero__sim-chip`: رمادي خافت، `font-xs`، flex inline، بقرب tooltip `i`.
- `.rt-input-area__reset`: زر ثانوي رمادي، 36px، hover طفيف.
- 4 حالات للـ verdict (ألوان + icons):
  - `--blocked`: أخضر `--rt-green` (موجود).
  - `--rate-limited`: كهرماني `#F59E0B` (جديد كـ `--rt-amber`).
  - `--breached`: أحمر `--rt-accent` (موجود) + شارة «محاكاة».
  - `--low-risk`: رمادي `--rt-text-muted`.
- `.rt-verdict__sim-note`: شريط مخطط خفيف، أيقونة 🧪، كل النتائج.
- `.rt-verdict__empty`/`.rt-verdict__error`: أصفر/أحمر خفيف، `role="alert"`.
- `.rt-open-trace`: زر link-like (code style + hover).
- `.rt-session`: بلاك ملخص، tabular-nums، RTL-aware.
- `prefers-reduced-motion`: كل الانتقالات الجديدة تُعطّل.

### المرحلة 3 — `public/js/kernel-redteam.js` (logic + states)

**3.1 — تصنيف Rate-limited كـ verdict منفصل**:
- يضيف `rateLimited` → verdict `'rate_limited'` (مو `'blocked'`) في `classifyInput` + `recordAttack` + `snapshot`.
- يفصل `state.rateLimitedCount` عن `blockedCount` (موجود بالفعل، يحتاج ربط بالـ UI).

**3.2 — 4 أنواع حكم في `showVerdict`**:
- `blocked`/`breached`/`rate_limited`/`low_risk` → 4 classes + 4 icons + 4 titles.
- Rate-limited: icon ⏳ + title «مقيّد» + لون كهرماني + reason موجود.
- Low-risk (path 5 الحالي): icon ○ + title «عولج بسلام» + لون رمادي.

**3.3 — معالجة empty input**:
- `launchAttack('')` يعرض رسالة استرداد `rt-verdict__empty` («اكتب هجومك الأول عشان نشوف كيف يصدّه Kernel») بدل الصمت. ما يعدّ هجوم.

**3.4 — Trace ID كزر «افتح الأثر»**:
- `showVerdict` يخلي `data-rt-v-trace` زر `data-rt-open-trace`.
- bind: `click` → `document.dispatchEvent(new CustomEvent('kerneltrace:open', { detail: { traceId } }))`. نفس نمط `kernel-approvals.js:445`.

**3.5 — زر Reset**:
- bind `data-rt-reset` → `reset()` (موجود) + يخفي `rt-verdict__empty/error` + يُعلن عبر `aria-live` «تمت إعادة ضبط الجلسة».

**3.6 — Session summary live**:
- `emit()` يحدّث `data-rt-session-*` + يُظهر `.rt-session` بعد أول هجوم.

### المرحلة 4 — اختبار (5 حالات القبول)

سكربت Playwright محفوظ جديد: `scripts/playwright/verify-redteam-sim-ux.mjs`. يبني + يخدم `dist/` على `localhost:8788` ثم يختبر الـ 5 حالات:

| الحالة | الإجراء | المتوقع |
|---|---|---|
| **permission** (authorization) | فتح `/kernel/redteam/` | chip «محاكاة آمنة · محلي بالكامل» ظاهر + h1 مو ملموس + axe 0 critical |
| **empty** | click «اهجم» بصندوق فاضي | رسالة استرداد تظهر (role=alert) + `aria-invalid` على الـ input + ما زاد `attackCount` |
| **error** (rate-limited) | شغّل 11 هجوم متتالي بـ `instant:true` | الهجوم 11 = بطاقة كهرمانية «مقيّد» (مو خضراء) + reason فيه «Rate Limiter» |
| **completion** (breach) | شغّل هجوم `ioh-02` (مخترق) | بطاقة حمراء + شارة «🏆 مخترق» + **شريط «🧪 نتيجة محاكاة»** ظاهر + Trace ID زر clickable |
| **trace link** | بعد أي هجوم، click زر «افتح الأثر» | `kerneltrace:open` event dispatched + drawer يفتح بـ traceId مطابق |
| **reset** | بعد 3 هجمات، click «إعادة ضبط» | counts صفر + rateHits فاضي + aria-live announce |

كمان asserts: chip ظاهر دائمًا، `.rt-verdict__sim-note` في كل نتيجة، `prefers-reduced-motion` يعطّل كل الأنيميشن.

---

## التحقق الكامل

```bash
npm run build          # ≥ 275 صفحة (لا regression)، 0 أخطاء
npm run verify:all     # exit 0 (SEO + hreflang)
node scripts/playwright/verify-redteam-sim-ux.mjs   # 6/6 pass
```

## المخرجات

- تعديل: `src/pages/kernel/redteam.astro`, `kernel/assets/css/pages/redteam.css`, `public/js/kernel-redteam.js`.
- جديد: `scripts/playwright/verify-redteam-sim-ux.mjs`.
- تقرير: `report/2026-08-09-redteam-sim-ux-clarity.md` (عامية سعودية).
- worklog + brain entry (per protocol 0.6).
- **ما أنشئ commit ولا branch** (per brain rule — المستخدم يلتزم).

## المخاطر المتبقية

- **توتر تسويقي**: chip + sim-note يخففان الـ "punch" قليلًا. هذا مقصود (القبول: «users cannot confuse simulation with live exploitation» يسبق الـ punch). لو حسّيت إنه أثقل بعد التنفيذ، نقدر نصغّر chip أكثر.
- **drawer على redteam**: الـ drawer يعتمد على `KernelEvalStore` موجود بالفعل + `kernel-redteam.js` يسجّل traces فعليًا، فالربط مباشر. لو فشل الـ store، الـ event يُطلق بدون خطأ (graceful).
- **rate-limited verdict جديد**: تغيير `state.lastVerdict` value من `'blocked'` لـ `'rate_limited'`. لو فيه كود خارجي يقرأ snapshot (tests قديمة)، يحتاج تحديث — سأgrep قبل التنفيذ.