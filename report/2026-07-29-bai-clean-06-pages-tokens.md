# BAI-CLEAN-06 — pages.css Token Cleanup

**Date**: 2026-07-29
**Agent**: BrightAI Workspace Agent
**Task**: BAI-CLEAN-04/05 (follow-up) → استبدال raw hex/raw px في `pages.css` بـ tokens موحدة
**Mode**: Mid (نفس المنهجية)
**Verified**: `verified_production: no` (الكود prepared، الـ deployment خارج نطاق الجلسة)

---

## الملخص التنفيذي

BAI-CLEAN-04 لقّح `kernel.css` (38 → 0)، BAI-CLEAN-05 لقّح `components.css` (10 → 0). الـ cleanup التالي على `pages.css` (6543 سطر، أكبر ملف ستايل في الريبو): تنظيف 15 violation (14 hex + 1 px) بدون أي تغيير بصري — كل token قيمة تطابق حرفياً القيمة الخام اللي حلّت محلها. النتيجة: `pages.css`: 15 → **0** violations، repo total: 44 → 29 violations.

---

## نطاق التغيير

### `src/styles/tokens.css` (Section 38 جديدة، 6 tokens)

أُضيفت داخل `:root` block، بعد Section 37 (BAI-CLEAN-05 blog text):

```css
/* 38. Section depth + Saudi-themed + accent (BAI-CLEAN-06) */
--bg-depth-1:    #0a1020;   /* home-trust gradient first stop */
--bg-depth-2:    #070c19;   /* home-trust gradient second stop */
--bg-depth-3:    #050810;   /* article-content pre gradient second stop */
--bg-depth-4:    #02111f;   /* avatar-tile text (darkest navy) */
--saudi-green:   #00663d;   /* Saudi flag green (ksa-flag-badge) */
--accent-purple: #a78bfa;   /* avatar-tile gradient (purple-400) */
```

كل قيمة تطابق حرفياً raw value المستبدلة. ما في tokens قديمة اتعدّلت.

### `src/styles/pages.css` (15 استبدال، 0 إضافة، 0 حذف)

**Home-trust gradient** (line 75): `linear-gradient(180deg, #0a1020 0%, #070c19 100%)` → `var(--bg-depth-1) var(--bg-depth-2)`.

**Pricing features gap** (line 873): `gap: 12px;` → `gap: var(--space-3);` (12px = --space-3 = 0.75rem).

**Use-case label before** (line 2881): `color: #f87171;` → `color: var(--status-danger);` (exact match — `--status-danger: #f87171`).

**Article-content pre gradient** (line 3482): `linear-gradient(180deg, #0a0e1a 0%, #050810 100%)` → `var(--bg-base) var(--bg-depth-3)` (`#0a0e1a` = --bg-base exact match).

**Article-content pre code** (line 3496): `color: #e2e8f0;` → `color: var(--neutral-200);` (exact match — `--neutral-200: #e2e8f0`).

**KSA flag badge** (lines 5696–5697): `linear-gradient(180deg, #00663d 0%, #00663d 66.66%, #ffffff 66.66%, #ffffff 100%)` → `var(--saudi-green)` ×2 + `var(--white)` ×2، و`color: #00663d;` → `var(--saudi-green)`.

**Avatar tile** (lines 5732–5733): `color: #02111f;` → `var(--bg-depth-4);`، و`background: linear-gradient(135deg, #22d3ee, #a78bfa);` → `var(--cyan-bright), var(--accent-purple);` (`#22d3ee` = --cyan-bright exact match).

---

## التحقق

### 1. Lint-tokens

```
$ node scripts/lint-tokens.mjs | grep "pages\.css" | wc -l
0

$ node scripts/lint-tokens.mjs | grep -c "raw"
29
```

**قبل**: pages.css 15 violations، repo 44 violations.
**بعد**: pages.css 0 violations، repo 29 violations.
**تخفيض**: 15 violations من الـ repo (15 من 44 = 34%).

### 2. Build

```
$ ASTRO_TELEMETRY_DISABLED=1 pnpm run build
...
[patch-server-entry] done
```

نجح بدون أخطاء. 209 صفحات.

### 3. dist CSS verification

```
$ grep -c "var(--bg-depth-1)\|var(--saudi-green)\|var(--accent-purple)\|var(--neutral-200)" \
    dist/client/_astro/*.css | grep -v ":0"
dist/client/_astro/ArabicLayout.C-dOr-1S.css:1
```

تأكيد: tokens الجديدة مُجمَّعة في dist.

```
$ grep -E "0a1020|070c19|050810|02111f|00663d|a78bfa" dist/client/_astro/BaseLayout.BGCpL5yM.css
... 6 matches (1 each) — all in :root token definitions
```

Token definitions موجودة مرة واحدة في `:root` المُجمَّع — المتوقع والصحي.

---

## القرارات المعمارية (DEC)

### DEC-BAI-CLEAN-06-2026-07-29-001: Depth tokens للـ dark gradients

**السياق**: 4 hex navy shades (`#0a1020`, `#070c19`, `#050810`, `#02111f`) مستخدمة في decorative gradients (home-trust، article-content pre، avatar-tile text). ما لها تطابق حرفي مع `--bg-base: #0a0e1a`.

**القرار**: إضافة 4 tokens باسم `--bg-depth-1` إلى `--bg-depth-4` (lightest → darkest).

**الأسباب**:
1. semantic naming يوضّح "depth scale" تحت `--bg-base`.
2. visual preservation (لا تغيير بصري في hero gradients و article pre).
3. `--bg-depth-N` naming يفرّق عن `--bg-surface` (lighter) و `--bg-elevated` (even lighter) — tokens الـ "depth" كلها أغمق من base.
4. `depth-1` إلى `depth-4` بسيط، ما يحتاج hyphenated scale names.

**Reversal cost**: low — tokens إضافية، لو تبي توحيد في scale واحد، تعديل alias.

### DEC-BAI-CLEAN-06-2026-07-29-002: Saudi-themed tokens (`--saudi-green`)

**السياق**: `#00663d` السعودية flag green مستخدم في `.ksa-flag-badge` (شريط العلم في الـ homepage).

**القرار**: إضافة token semantic `--saudi-green: #00663d;` بدل استخدام `--accent-X` أو `--status-X`.

**الأسباب**:
1. semantic للـ cultural context (Saudi flag badge).
2. سهل التعرف من المطورين (اسم واضح يشرح الغرض).
3. القيمة `#00663d` قريبة من السعودي الرسمي `#006C35` (flag green) — يستخدم shade مختلف لتقليل حدة اللون.

**Reversal cost**: low — token واحد، يمكن إعادة تسميته لو لزم.

---

## المخاطر المتبقية

- **29 violation باقي في الـ repo**: utilities.css (2)، Astro pages ~27. CI لسا أحمر.
- **`--bg-depth-*` numbering**: اخترت `--bg-depth-1` كأفتح و `--bg-depth-4` كأغمق. لو أحد المطورين استخدم الـ order الخطأ، visual consistency ينكسر. التوصية: documentation comment في tokens.css يوضّح الترتيب (لاحقًا في BAI-CLEAN-09 توحيد naming convention).

## Rollback

```bash
git revert HEAD
pnpm run build
```

---

## الـ commit المقترح

```
[BAI-CLEAN-06] chore(styles): unify pages.css hero gradients + brand colors with design tokens

Adds 6 semantic tokens (Section 38) for dark gradient depth scale
(--bg-depth-1..4), Saudi-themed green (--saudi-green), and accent
purple (--accent-purple). Replaces 15 raw hex/px violations in
pages.css with token references.

- New tokens in src/styles/tokens.css: --bg-depth-{1,2,3,4},
  --saudi-green, --accent-purple
- Replacements in src/styles/pages.css: home-trust gradient,
  pricing features gap, use-case label danger color, article
  pre gradient, pre code text color, KSA flag badge background
  + color, avatar tile text + gradient
- lint-tokens.mjs: pages.css 15 → 0 violations
- Total repo violations: 44 → 29 (34% reduction)
- Build: 209 pages, 0 errors
- DEC-BAI-CLEAN-06-2026-07-29-001 (depth tokens naming)
- DEC-BAI-CLEAN-06-2026-07-29-002 (--saudi-green semantic)
- Reversal cost: low

Refs: BAI-CLEAN-04, BAI-CLEAN-05, BAI-DESIGN-01, BAI-PROC-12
```

---

## Out-of-Scope (متابعة منفصلة)

- **BAI-CLEAN-07**: تنظيف `utilities.css` (2 violations).
- **BAI-CLEAN-08**: تنظيف Astro pages (~27 violations عبر 13 ملف).
- **BAI-CLEAN-09**: توحيد naming convention + documentation comments للـ depth tokens.
- **BAI-IDX-26**: `purge-css` revert issue (مسبق).