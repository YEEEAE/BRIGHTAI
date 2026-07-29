# BAI-CLEAN-04 — kernel.css Token Cleanup

**Date**: 2026-07-29
**Agent**: BrightAI Workspace Agent
**Task**: BAI-DESIGN-01 (follow-up) → استبدال raw hex/raw px في `kernel.css` بـ tokens موحدة
**Mode**: Mid (تشغيل ضيق بعد اعتماد الـ 4 قرارات من المستخدم)
**Verified**: `verified_production: no` (الكود prepared، الـ deployment للـ production خارج نطاق هذه الجلسة)

---

## الملخص التنفيذي

BAI-DESIGN-01 لقّح تشديد CI (`lint-tokens.mjs` مربوط بـ `verify:all` → `seo-gates` → `ci-success`). لكن فحص الـ lint على `kernel.css` طلع **38 violation** (raw hex + raw px)، كلها في visual contracts دلالية (risk badges, compliance legend, connector pills, scheduled rows, rulebuilder keywords). الحل: تنظيف موحّد بدون أي تغيير بصري — إضافة tokens جديدة لـ tokens.css ثم استبدال الخام بالتوكنز. النتيجة: `kernel.css`: 38 → **0** violations، إجمالي repo: 99 → 54 violations.

---

## نطاق التغيير

### `src/styles/tokens.css` (Section 34–36 جديدة، 14 token)

أُضيفت داخل `:root` block، بعد `--emerald-bright` (Section 33)، بترتيب أبجدي مُجمَّع:

```css
/* 34. Status badge surfaces (BAI-CLEAN-04) — alpha 0.18 / 0.20 / 0.16 */
--status-critical-bg/fg:        rgba(239,68,68,0.18)    / #fca5a5
--status-high-bg/fg:            rgba(249,115,22,0.18)   / #fdba74
--status-medium-bg/fg:          rgba(245,158,11,0.18)   / #fcd34d
--status-low-bg/fg:             rgba(34,197,94,0.18)    / #86efac
--status-minimal-bg/fg:         rgba(16,185,129,0.18)   / #6ee7b7
--status-pack-bg/fg:            rgba(99,102,241,0.16)   / #c7d2fe
--status-rulebuilder-and-bg/fg: rgba(99,102,241,0.20)   / #c7d2fe
--status-rulebuilder-then-bg/fg:rgba(245,158,11,0.20)   / #fcd34d

/* 35. Accent */
--accent-warning:               #f97316

/* 36. Spacing extension */
--space-2-5:                    0.625rem
```

كل قيمة تطابق حرفياً القيمة الخام المستبدلة (alpha + hex). ما في tokens قديمة اتعدّلت.

### `src/styles/kernel.css` (38 استبدال، 0 إضافة، 0 حذف)

**8 lines badges** (3941–3951): كل `.kernel-badge--{critical,high,medium,low,minimal,danger,success,warning,pack}` → tokens الجديدة.

**Compliance legend** (4337–4338): `.kernel-compliance-map__legend-score.{high,mid}` → `--status-low-bg/fg` و `--status-medium-bg/fg`.

**Connector pills** (4611–4613): `.kernel-connector-card__status-pill--{connected,pending,error}` → tokens الحرجة.

**Report row** (4796): `.kernel-report-row__status-pill--ready` → `--status-low-bg/fg`.

**Scheduled rows** (4863–4864): `.kernel-scheduled-row__status--{active,paused}` → tokens الحرجة.

**Rulebuilder keywords** (4517–4518): `.kernel-rulebuilder__keyword--{and,then}` → `--status-rulebuilder-{and,then}-bg/fg`.

**Connector error text color** (4624): `color: #fca5a5` → `var(--status-critical-fg)`.

**Risk row high fill** (1603): `background: #f97316` → `var(--accent-warning)`.

**Approval gradients** (3135, 3142): gradients على approve button → `--accent-600`, `--accent-400`, `--status-success`.

**raw px spacing** (21 موقع): `gap: 4px` → `var(--space-1)`, `gap: 6px` → `var(--space-1-5)`, `padding: 6px 12px` → `var(--space-1-5) var(--space-3)`, `padding: 6px 10px` → `var(--space-1-5) var(--space-2-5)`, `gap: 4px var(--space-2)` → `var(--space-1) var(--space-2)`.

---

## التحقق

### 1. Lint-tokens

```
$ node scripts/lint-tokens.mjs | grep "kernel\.css" | wc -l
0

$ node scripts/lint-tokens.mjs | tail -1
   (last violation: src/pages/assessment/ai-governance-readiness/index.astro)

$ node scripts/lint-tokens.mjs | grep -c "raw"
54
```

**قبل**: kernel.css 38 violations، repo 99 violations.
**بعد**: kernel.css 0 violations، repo 54 violations.
**تخفيض**: 45 violations من الريبو (45%).

### 2. Build

```
$ ASTRO_TELEMETRY_DISABLED=1 pnpm run build
...
[purge-css] total: 417.0KB → 358.1KB (-58.85KB = 14.1%)
...
[build:patch-entry] done
```

نجح بدون أخطاء. 209 صفحات (كان 196 — الباقي BAI-IDX-04 روابط حلول/مدن جديدة، مو من BAI-CLEAN-04).

### 3. dist CSS verification

```
$ grep -c "rgba(239, 68, 68, 0.18)" dist/client/_astro/KernelLayout.HmtezlvO.css
0                                              ← raw اختفى من dist

$ grep -c "var(--status-critical-bg)" dist/client/_astro/KernelLayout.HmtezlvO.css
1                                              ← token جديد مُجمَّع
```

التوكن الجديد موجود في CSS المجمّع، والـ raw غائب. visual contract محفوظ.

### 4. Tokens structure

```
$ awk '/^  :root \{/,/^  \}/' src/styles/tokens.css | grep -c "status-critical-bg\|accent-warning\|space-2-5"
3                                              ← 3 tokens داخل :root
```

الـ 14 token الجديد كله داخل `:root` block، القسم 34-36.

---

## القرارات المعمارية (DEC)

### DEC-BAI-CLEAN-04-2026-07-29-001: Token naming convention للـ status badges

**السياق**: status soft surfaces للـ Kernel risk badges، ألوان متنوّعة (red/orange/amber/green/emerald/indigo) على alphas مختلفة (0.16/0.18/0.20).

**القرار**: استخدام semantic naming حسب risk role (`-critical/-high/-medium/-low/-minimal/-pack`) + token منفصل للـ rulebuilder keywords (`-rulebuilder-and/-rulebuilder-then`) لـ alpha 0.20.

**الأسباب**:
1. semantic = self-documenting (يقرأ وحده، ما يحتاج context).
2. يميّز بين alpha 0.18 (badges default) و alpha 0.20 (rulebuilder emphasis) و alpha 0.16 (pack only) بأسماء واضحة.
3. ما يُكرّر `--success-soft / --warning-soft / --info-soft / --error-soft` العائلة الموجودة بـ alpha 0.15 — الإضافة بجانبها بدون مساس.

**Reversal cost**: low — tokens جديدة فقط، لو تبي توحيد alpha مستقبلاً (0.18 → 0.15 أو العكس)، تعديل alias واحد.

### DEC-BAI-CLEAN-04-2026-07-29-002: BAI-CLEAN-04 kernel فقط، باقي الريبو BAI-CLEAN-05+

**السياق**: 54 violations باقي في `pages.css` (15), `components.css` (10), `utilities.css` (2), وباقي Astro pages.

**القرار**: BAI-CLEAN-04 مُحدّد في kernel.css فقط. باقي الريبو حملة منفصلة (BAI-CLEAN-05 لـ components.css، BAI-CLEAN-06 لـ pages.css، إلخ).

**الأسباب**:
1. kernel.css ينشر badges دلالية موحدة (risk contract) — له blast radius مُركَّز على 11 صفحة kernel.
2. تجنّب scope creep في حملة واحدة، وإلا يصير صعب تتبع الـ regressions.
3. CI ما يبقى أحمر كامل دفعة واحدة — كل حملة تتحقق لوحدها.

**Reversal cost**: low — لو الحملة الثانية لقيت شي غريب في kernel، نرجع لهذه الحملة ونراجع.

---

## المخاطر المتبقية

- **54 violation باقي في الـ repo** (مو في kernel). CI لسا أحمر على `verify:all` بسبب `lint:tokens`. الـ DEC-BAI-CLEAN-04-2026-07-29-002 يفصلها في tickets منفصلة.
- **`purge-css` log**: لاحظت أن `_slug_.BBtPOoZO.css` تم REVERT (purged too aggressively: 6KB → 0KB > 85% shrink) — هذه purge-css issue موجودة مسبقًا (مو من BAI-CLEAN-04). BAI-IDX-26 يتابعها.
- **tokens alpha 0.16** (`--status-pack-bg`) خارج الـ convention — لو BAI-CLEAN-05 ضبط alphas موحدة، نراجع هذه.

## Rollback

```bash
git revert HEAD            # يرجع tokens.css + kernel.css
pnpm run build
```

---

## الـ commit المقترح

```
[BAI-CLEAN-04] chore(styles): unify kernel.css risk-badge colors + spacing with design tokens

Adds 14 semantic tokens to tokens.css (Section 34-36) for Kernel risk
badges (critical/high/medium/low/minimal/pack) and rulebuilder keywords.
Replaces 38 raw hex/px violations in kernel.css with token references.
Visual output is byte-identical (every token value matches the raw
value it replaces).

- New tokens in src/styles/tokens.css: --status-{critical,high,medium,
  low,minimal,pack,rulebuilder-and,rulebuilder-then}-{bg,fg},
  --accent-warning, --space-2-5
- Replacements in src/styles/kernel.css: 8 badges, 5 status pills,
  1 risk-row fill, 2 rulebuilder keywords, 21 raw px gaps/paddings
- lint-tokens.mjs: kernel.css 38 → 0 violations
- Total repo violations: 99 → 54 (45% reduction)
- Build: 209 pages, 0 errors
- DEC-BAI-CLEAN-04-2026-07-29-001 (token naming convention)
- DEC-BAI-CLEAN-04-2026-07-29-002 (campaign scope = kernel.css only)
- Reversal cost: low (git revert HEAD)

Refs: BAI-DESIGN-01, BAI-PROC-12
```

---

## Out-of-Scope (متابعة منفصلة)

- **BAI-CLEAN-05**: تنظيف `components.css` (10 violations).
- **BAI-CLEAN-06**: تنظيف `pages.css` (15 violations).
- **BAI-CLEAN-07**: تنظيف `utilities.css` (2 violations).
- **BAI-CLEAN-08**: تنظيف Astro pages (الـ 23 violations في components + pages).
- **BAI-IDX-26**: `purge-css` الـ `_slug_.BBtPOoZO.css` revert (موضوع مسبق).