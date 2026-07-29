# BAI-CLEAN-07 — utilities.css Token Cleanup (Dead Code Removal)

**Date**: 2026-07-29
**Agent**: BrightAI Workspace Agent
**Task**: BAI-CLEAN-04/05/06 (follow-up) → استبدال raw hex في `utilities.css`
**Mode**: Mid (نفس المنهجية + تعديل: dead code removal بدل raw value replacement)
**Verified**: `verified_production: no`

---

## الملخص التنفيذي

BAI-CLEAN-04/05/06 لقّحت `kernel.css`/`components.css`/`pages.css`. الـ cleanup التالي على `utilities.css`: 2 violations (raw hex في Tailwind-compat gradient utility classes). الفحص كشف إن الـ classes هذه **dead code** — ما لها استخدام في أي ملف Astro/HTML في الريبو. القرار: حذف الـ classes بدل استبدال قيمها (لأن الـ selectors نفسها فيها hex literal كجزء من Tailwind arbitrary value syntax — الـ lint يلحقها حتى لو بدّلت القيم). النتيجة: `utilities.css`: 2 → **0** violations، repo total: 29 → 27 violations.

---

## نطاق التغيير

### `src/styles/utilities.css` (2 dead classes deleted، 0 additions)

**الـ classes المُحذوفة**:
```css
.from-\[\#0a1020\] { --tw-gradient-from: #0a1020; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(10,16,32,0)); }
.to-\[\#070c19\] { --tw-gradient-to: #070c19; }
```

**التعويض**: comment documentation يوضّح الإزالة + يوجّه للـ tokens البديلة (`--bg-depth-1`/`--bg-depth-2`).

### `src/styles/tokens.css` (لا تغيير)

ما في tokens جديدة. الـ cleanup الكامل من BAI-CLEAN-06 (الـ `--bg-depth-1` و `--bg-depth-2` tokens) موجودين بالفعل ويستخدمهم `.home-trust` gradient في `pages.css`.

---

## التحقق

### 1. Lint-tokens

```
$ node scripts/lint-tokens.mjs | grep "utilities\.css" | wc -l
0

$ node scripts/lint-tokens.mjs | grep -c "raw"
27
```

**قبل**: utilities.css 2 violations، repo 29 violations.
**بعد**: utilities.css 0 violations، repo 27 violations.
**تخفيض**: 2 violations من الـ repo.

### 2. Build

```
$ ASTRO_TELEMETRY_DISABLED=1 pnpm run build
...
[patch-server-entry] done
```

نجح بدون أخطاء. 209 صفحات.

### 3. Dead code confirmation

```
$ grep -rn "from-\[#0a1020\]\|to-\[#070c19\]" src/
(no matches)

$ grep -rn "0a1020\|070c19" src/ --include="*.astro"
(no matches)
```

تأكيد: الـ classes ما لها أي استخدام في Astro files. الحذف آمن بدون regressions.

### 4. Comment placement verification

الـ comment `/* BAI-CLEAN-07 ... */` فيه `#0a1020` و `#070c19` كمرجع للـ classes المحذوفة. لكن الـ lint script:
```js
if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("//")) return;
```
يخطّي أي سطر يبدأ بـ `/*`. الـ comment آمن من الـ lint.

---

## القرارات المعمارية (DEC)

### DEC-BAI-CLEAN-07-2026-07-29-001: Dead code removal بدل raw value replacement

**السياق**: 2 violations في `utilities.css` على شكل Tailwind-compat classes (`.from-\[\#0a1020\]`, `.to-\[\#070c19\]`). الـ selectors فيها hex literal كجزء من Tailwind arbitrary value syntax. حتى لو بدّلت القيم (`#0a1020` → `var(--bg-depth-1)`)، الـ selector نفسه يبقى فيه hex literal — والـ lint يلحقه.

**القرار**: حذف الـ classes بدل استبدال القيم. الـ classes تأكد أنها dead code (grep صفر استخدام).

**الأسباب**:
1. الـ regex `#[0-9a-fA-F]{6}\b` في الـ lint يلحق hex حتى في CSS selectors.
2. الـ classes ما لها استخدام في الريبو (تأكيد عبر grep).
3. Tailwind-compat utilities للـ gradients صار عندها بدائل أقوى (`--bg-depth-*` tokens مع `--tw-gradient-stops` بدائيات).

**Reversal cost**: low — استعادة class بسيطة، القيم الأصلية محفوظة في git history.

---

## المخاطر المتبقية

- **27 violation باقي في الـ repo** (كلها في Astro pages/components):
  - `pages/assessment/ai-governance-readiness/index.astro` (5)
  - `pages/customers/index.astro` (3)
  - `pages/en/{terms,privacy-policy,pdpl-statement,data-processing-agreement,cookie-policy}/index.astro` (2 each = 10)
  - 9 ملفات أخرى (1 each = 9)
- **BAI-CLEAN-08** يتعامل مع كل هذه.

## Rollback

```bash
git revert HEAD
pnpm run build
```

---

## الـ commit المقترح

```
[BAI-CLEAN-07] chore(styles): remove dead Tailwind-compat gradient classes from utilities.css

The classes `.from-\[\#0a1020\]` and `.to-\[\#070c19\]` were Tailwind-compat
gradient utilities added for legacy HTML. Confirmed via grep that no
Astro/HTML file references them. Removed as dead code. The lint regex
matches hex even in CSS selectors, so value-only replacement wouldn't
clear the lint warning. Users should reference the new --bg-depth-1
and --bg-depth-2 tokens (BAI-CLEAN-06) directly via component rules.

- Removed 2 dead classes in src/styles/utilities.css
- Added documentation comment redirecting to --bg-depth-1/--bg-depth-2
- lint-tokens.mjs: utilities.css 2 → 0 violations
- Total repo violations: 29 → 27
- Build: 209 pages, 0 errors
- DEC-BAI-CLEAN-07-2026-07-29-001 (dead code removal rationale)
- Reversal cost: low

Refs: BAI-CLEAN-06 (--bg-depth tokens), BAI-DESIGN-01, BAI-PROC-12
```

---

## Out-of-Scope (متابعة منفصلة)

- **BAI-CLEAN-08**: تنظيف 27 violation في Astro pages + components (الحملة الأخيرة، الأكبر).
- **BAI-CLEAN-09**: توحيد naming convention + documentation comments للـ depth tokens.
- **BAI-IDX-26**: `purge-css` revert issue (مسبق).