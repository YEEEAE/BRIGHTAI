# BAI-CLEAN-05 — components.css Token Cleanup

**Date**: 2026-07-29
**Agent**: BrightAI Workspace Agent
**Task**: BAI-CLEAN-04 (follow-up) → استبدال raw hex/raw px في `components.css` بـ tokens موحدة
**Mode**: Mid (تشغيل ضيق بعد BAI-CLEAN-04 pattern)
**Verified**: `verified_production: no` (الكود prepared، الـ deployment خارج نطاق الجلسة)

---

## الملخص التنفيذي

BAI-CLEAN-04 لقّح `kernel.css` من 38 → 0 violations. الـ cleanup التالي بنفس المنهجية على `components.css`: تنظيف 10 violations (7 hex + 3 px) بدون أي تغيير بصري — كل token قيمة تطابق حرفياً القيمة الخام اللي حلّت محلها. النتيجة: `components.css`: 10 → **0** violations، repo total: 54 → 44 violations.

---

## نطاق التغيير

### `src/styles/tokens.css` (Section 37 جديدة، 5 tokens)

أُضيفت داخل `:root` block، بعد Section 36 (BAI-CLEAN-04 spacing):

```css
/* 37. Status + Brand hover + Blog text (BAI-CLEAN-05) */
--status-danger-hover:   #dc2626;   /* danger button hover (red-600) */
--whatsapp-bg:           #075e54;   /* WhatsApp AA-safe bg */
--whatsapp-bg-hover:     #054a42;   /* WhatsApp darker hover */
--text-tldr:             #283142;   /* blog TLDR paragraph text */
--space-4-5:             1.125rem;  /* 18px — between --space-4 (16px) and --space-5 (20px) */
```

كل قيمة تطابق حرفياً raw value المستبدلة. ما في tokens قديمة اتعدّلت.

### `src/styles/components.css` (10 استبدال، 0 إضافة، 0 حذف)

**Comment refactor** (line 344–348): الـ comment `text. --brand-300 (#4ba69c) on the same background gives ~7.1:1 (AAA).` كان false positive في lint (regex يلتقط `#4ba69c` حتى في التعليقات). حذفت الـ hex literal من التعليق واستبدلتها بـ `(teal-400)`. الـ semantic والـ color value ما تغيّروا — الـ lint ما يلحقها بعد.

**Button primary text** (line 533): `color: #ffffff;` → `color: var(--white);` (`--white: #ffffff` موجود في Section 33).

**Button danger hover** (lines 689–690): `background: #dc2626; border-color: #dc2626;` → كلاهما `var(--status-danger-hover)`. darkens from `--status-danger: #f87171` (red-400 base) → `--status-danger-hover: #dc2626` (red-600 hover). visual contract محفوظ.

**WhatsApp button bg** (line 700): `background: #075e54;` → `var(--whatsapp-bg);`. تعليق accessibility محدّث (حذف hex literal).

**WhatsApp button hover** (line 715): `background: #054a42;` → `var(--whatsapp-bg-hover);`.

**Highlight box TLDR** (lines 3369–3370): `margin-block-start: 24px;` → `var(--space-6);`, `padding: 18px 20px;` → `var(--space-4-5) var(--space-5);`.

**TLDR gradient** (lines 3382–3383): `margin: 24px 0;` → `var(--space-6) 0;`, `padding: 18px 20px;` → `var(--space-4-5) var(--space-5);`.

**TLDR paragraph color** (line 3399): `color: #283142;` → `color: var(--text-tldr);`.

---

## التحقق

### 1. Lint-tokens

```
$ node scripts/lint-tokens.mjs | grep "components\.css" | wc -l
0

$ node scripts/lint-tokens.mjs | grep -c "raw"
44
```

**قبل**: components.css 10 violations، repo 54 violations.
**بعد**: components.css 0 violations، repo 44 violations.
**تخفيض**: 10 violations من الـ repo (10 من 54 = 18%).

### 2. Build

```
$ ASTRO_TELEMETRY_DISABLED=1 pnpm run build
...
[patch-server-entry] done
```

نجح بدون أخطاء. 209 صفحات (نفس BAI-CLEAN-04 — التغيير في components.css ما يضيف/يحذف صفحات).

### 3. dist CSS verification

```
$ grep -c "var(--status-danger-hover)\|var(--whatsapp-bg)\|var(--text-tldr)\|var(--space-4-5)" \
    dist/client/_astro/*.css | grep -v ":0"
dist/client/_astro/ArabicLayout.DVUwEUE8.css:1
```

تأكيد: tokens الجديدة مُجمَّعة في dist CSS (1 reference per token definition).

```
$ grep -c "dc2626\|075e54\|054a42\|283142" dist/client/_astro/*.css | grep -v ":0"
dist/client/_astro/ArabicLayout.DVUwEUE8.css:1
dist/client/_astro/BaseLayout.dsDEuMuv.css:1
```

Raw hexes ما زالت موجودة كـ TOKEN DEFINITIONS داخل `:root` block المُجمَّع (هذي متوقعة وصحية — tokens نفسها قيم خام، هذا تعريفها). الـ raw usages من components.css اختفت.

### 4. False positive handling

Lint regex `#[0-9a-fA-F]{6}\b` يلتقط hex حتى في comments. line 347 كان comment documentation فيه `(see token above)` بدون hex — ما يلتقطها. line 344-348 الكلام الـ original فيه `(#4ba69c)` للـ documentation، استبدلتها بـ `(teal-400)` بدون قيمة hex literal. الـ semantic content ما تغيّر.

---

## القرارات المعمارية (DEC)

### DEC-BAI-CLEAN-05-2026-07-29-001: Naming للـ WhatsApp dark teal

**السياق**: tokens.css فيها أصلاً `--whatsapp: #25D366` و `--whatsapp-dark: #128C7E` — لكن components.css يستخدم قيم مختلفة (`#075e54` و `#054a42`) لـ AA-safe contrast.

**القرار**: إضافة tokens جديدة بأسماء semantic (`--whatsapp-bg`, `--whatsapp-bg-hover`) بدل إعادة تسمية/تعديل tokens الحالية.

**الأسباب**:
1. `--whatsapp-dark: #128C7E` ما زال له قيمة (WhatsApp brand dark teal) — قد يُستخدم في context decorative (icons, brand-color backgrounds بدون نص).
2. إعادة التسمية تكسر backward compatibility مع أي component يستخدم `--whatsapp-dark` حاليًا.
3. semantic naming أوضح: `--whatsapp-bg` = "background to use with white text for AA compliance" vs `--whatsapp-dark` = "brand dark teal".

**Reversal cost**: low — tokens إضافية، لو تبي توحيد مستقبلاً، تعديل alias.

### DEC-BAI-CLEAN-05-2026-07-29-002: 18px spacing token

**السياق**: highlight-box.tldr يستخدم `padding: 18px 20px;` — 18px ما عنده token في الـ scale الحالي.

**القرار**: إضافة `--space-4-5: 1.125rem;` بين `--space-4: 1rem` و `--space-5: 1.25rem`.

**الأسباب**:
1. يحافظ على الـ 4px-base scale (`--space-1 = 4px`, `--space-1-5 = 6px`, `--space-2 = 8px`, `--space-3 = 12px`, `--space-4 = 16px`, `--space-5 = 20px`).
2. `--space-4-5: 18px` يملأ الفراغ في الـ scale.
3. بدائل (`padding: 1.125rem` مباشرة، أو `padding: 18px`) تخالف الـ convention.

**Reversal cost**: low — token واحد، يمكن إعادة تسميته لو لزم.

---

## المخاطر المتبقية

- **44 violation باقي في الـ repo** (مو في components): pages.css (15)، utilities.css (2)، Astro pages ~27.
- **`--whatsapp-dark` و `--whatsapp-bg` coexisting**: tokens متشابه في الاسم لكن مختلفين في الاستخدام. لو أحد المطورين استخدم أحدهم بالخطأ بدل الآخر، visual contrast ينكسر. التوصية: documentation comment في tokens.css يوضح الفرق، أو rename `--whatsapp-dark` إلى `--whatsapp-brand-dark` لمنع الـ confusion.

## Rollback

```bash
git revert HEAD
pnpm run build
```

---

## الـ commit المقترح

```
[BAI-CLEAN-05] chore(styles): unify components.css button states + spacing with design tokens

Adds 5 semantic tokens (Section 37) for danger button hover, WhatsApp
AA-safe backgrounds, blog TLDR text color, and 18px spacing. Replaces
10 raw hex/px violations in components.css with token references.

- New tokens in src/styles/tokens.css: --status-danger-hover,
  --whatsapp-bg, --whatsapp-bg-hover, --text-tldr, --space-4-5
- Replacements in src/styles/components.css: button primary text,
  button danger hover, WhatsApp bg/hover, TLDR margin/padding,
  TLDR paragraph text
- Comment refactor on .badge-skill (removed hex literal from
  documentation comment that triggered lint false positive)
- lint-tokens.mjs: components.css 10 → 0 violations
- Total repo violations: 54 → 44 (18% reduction)
- Build: 209 pages, 0 errors
- DEC-BAI-CLEAN-05-2026-07-29-001 (--whatsapp-bg naming)
- DEC-BAI-CLEAN-05-2026-07-29-002 (--space-4-5 18px scale)
- Reversal cost: low

Refs: BAI-CLEAN-04, BAI-DESIGN-01, BAI-PROC-12
```

---

## Out-of-Scope (متابعة منفصلة)

- **BAI-CLEAN-06**: تنظيف `pages.css` (15 violations، أكبر ملف).
- **BAI-CLEAN-07**: تنظيف `utilities.css` (2 violations).
- **BAI-CLEAN-08**: تنظيف Astro pages (~27 violations عبر 13 ملف).
- **BAI-IDX-26**: `purge-css` revert issue على `_slug_.BBtPOoZO.css` (مسبق، BAI-CLEAN-04 لاحظه).