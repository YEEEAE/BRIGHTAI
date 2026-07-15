# Fonts — BrightAI

> توثيق الـ font strategy: subsetting، الأداء، والـ fallback.

---

## وش الخطوط اللي عندنا؟

| الخط | المصدر | الحجم | الدور |
|---|---|---|---|
| **TheYearofTheCamel** (Medium) | `public/assets/fonts/` (local) | **9.9 KB subset** (was 58.2 KB) | Brand font — Latin only، لـ `.gradient-text`, `.chip`, `.badge`, `.font-bold`, `.font-black`, headings |
| **IBM Plex Sans Arabic** (400, 600) | Google Fonts CDN | subsetted تلقائياً بـ unicode-range | Body Arabic |
| **Inter** (400, 600) | Google Fonts CDN | subsetted تلقائياً بـ unicode-range | Body Latin (EN pages + الأرقام اللاتينية) |

### ليش ما نعمل self-host لـ IBM Plex Sans Arabic؟

Google Fonts CDN يرسل **4 subsets منفصلة** للـ IBM Plex Sans Arabic:
- Arabic (الـ subset الرئيسي — ~30KB)
- Cyrillic-ext
- Latin-ext
- Latin

الـ browser يحمّل الـ subset المطلوب فقط بناءً على unicode-range (مع `font-display: swap`). يعني الحجم الفعلي اللي ينزل على مستخدم سعودي = ~30KB لـ Arabic subset فقط.

لو self-host + subset يدوي:
- ❌ نخسر Google CDN caching (متصفح الزائر ما يشارك الـ cache مع مواقع ثانية).
- ❌ CI/CD setup أعقد.
- ❌ كل إضافة Arabic glyph تحتاج rebuild.
- ✅ ممكن نكسب ~10KB إضافي.

الـ ROI مو كافي. **الخطة: نخلي Google Fonts للعربي، ونعمل subsetting للـ brand font فقط** (اللي عندنا local).

---

## Brand Font Subsetting

### المشكلة

`TheYearofTheCamel-Medium.woff2` (58.2 KB) — line-heavy display font بـ full Latin + Extended Latin + Symbols + Ligatures. لكن الموقع يستخدم ~30-40 حرف فقط في headings (BrightAI, Kernel, QNX, ...).

### الحل

`scripts/subset-fonts.mjs` يستخدم `pyftsubset` (fonttools) لاستخراج الـ glyphs المستخدمة فعلياً فقط.

**النتيجة الفعلية**: **58.2 KB → 9.9 KB (-83%)**.

### الحروف المشمولة

`scripts/subset-fonts.mjs` يعرف القائمة في `TEXT_USED`:
- Brand + modules: `BrightAI`, `Kernel`, `QNX`, `Firewall`, `Audit`, `Approval`, `Evidence`, `OS`, `AI`, `Saudi`
- أرقام: `0-9`
- Punctuation: ` .,+-/&·()[]{}!?`
- Trademarks: `™®©`

### unicode-range

في `src/styles/critical.css`:

```css
unicode-range: U+0020-007F, U+00A0-00FF, U+2000-206F, U+2122, U+00A9, U+00AE, U+2120;
```

الـ browser يستخدم الـ subset للعربي؟ **لا** — الـ unicode-range محدود Latin، فالـ browser يحمّل الـ subset للعربي (يحتاج IBM Plex Sans Arabic من Google Fonts).

### Rollback

لو ظهرت glyphs مفقودة (tofu boxes):

```bash
# 1. ارجع للـ original
cp public/assets/fonts/original/TheYearofTheCamel-Medium.original.woff2 \
   public/assets/fonts/TheYearofTheCamel-Medium.woff2

# 2. شيل الـ subset من الـ CSS
# في src/styles/critical.css، غيّر:
# src: url('/assets/fonts/TheYearofTheCamel-Medium.subset.woff2')
# إلى:
# src: url('/assets/fonts/TheYearofTheCamel-Medium.woff2')

# 3. شيل الـ preload من BaseLayout
# في src/layouts/BaseLayout.astro:
# href="/assets/fonts/TheYearofTheCamel-Medium.subset.woff2"
# إلى:
# href="/assets/fonts/TheYearofTheCamel-Medium.woff2"
```

---

## كيف تشغّل subsetting؟

```bash
# تشغيل مرة واحدة
pnpm fonts:subset

# أو ضمن prebuild (يشتغل تلقائي قبل build)
pnpm build  # ← يشغّل fonts:subset تلقائياً
```

### Prerequisite

```bash
pip3 install fonttools brotli
```

`pyftsubset` يجي مع `fonttools`. `brotli` للـ WOFF2 compression.

---

## Layout Features المفعّلة

`scripts/subset-fonts.mjs` يحتفظ بـ:

```
liga, clig, calt, kern, case, frac, numr, dnom, ordn, zero, sups, subs, smcp, caps
```

- `liga` — Standard ligatures (fi, fl)
- `clig` — Contextual ligatures
- `calt` — Contextual alternates
- `kern` — Kerning
- `case` — Case-sensitive forms
- `frac`/`numr`/`dnom` — Fractions
- `ordn` — Ordinals (1st, 2nd)
- `zero` — Slashed zero
- `smcp`/`caps` — Small caps

ما نحتاج `arab` أو `init` لأن الـ brand font Latin-only.

---

## القيود المعروفة (Known Limits)

1. **Arabic glyphs في headings**: لو أضفنا heading عربي يستخدم brand font (مثل "برايت AI")، الـ subset ما يدعم العربي. الـ fallback لـ IBM Plex Sans Arabic يعمل تلقائياً (font-family stack في critical.css).
2. **Adding new brand words**: لو أضفنا كلمة جديدة في headings بـ BrightAI Official (مثل "Compliance" أو "Trustworthy"), نحتاج نضيفها لـ `TEXT_USED` في `scripts/subset-fonts.mjs` ثم نعيد التشغيل.
3. **woff2 only**: ما يولد ttf/woff variants. الـ browsers الحديثة كلها تدعم woff2.

---

## الـ Acceptance Criteria

| المقياس | الـ target | النتيجة |
|---|---|---|
| Brand font size (subset) | < 40 KB | **9.9 KB** ✅ (-83%) |
| Total font payload (homepage) | < 120 KB | ~70-90 KB (depends on Arabic subset from Google Fonts) |
| LCP improvement (mobile Slow 4G) | -200 إلى -400ms | يحتاج قياس فعلي بعد deploy |
| CLS | 0 (font-display: swap مع نفس metrics) | ✅ ثابت |

---

## المرجعيات

- `pyftsubset` docs: https://fonttools.readthedocs.io/en/latest/subset/
- Google Fonts unicode-range: https://developers.google.com/fonts/docs/css2
- font-display: swap vs optional: https://web.dev/articles/optimize-web-fonts

---

**صاحب الملف:** BrightAI Workspace Agent
**آخر تحديث:** 2026-07-15
**الإصدار:** 1.0