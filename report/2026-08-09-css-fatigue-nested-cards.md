# CSS-FATIGUE-001 — تقليل الـ Nested Card Fatigue في لوحة الكيرنل + الامتثال

**Date**: 2026-08-09
**Agent**: BrightAI Workspace Agent
**Task**: Reduce box-inside-box visual fatigue — reserve cards for actionable boundaries; use dividers + spacing for secondary content.
**Mode**: Senior (مقاربة خفيفة موصى بها — وافق عليها المستخدم)

## الملخص التنفيذي

صفحات الكيرنل كانت تعاني من "إجهاد المربّعات المتداخلة" (box-inside-box): لوحة الامتثال كانت
`KernelCard` يلفّ `kernel-compliance-pack` (المربّعات نفسها)، فتصير "مربّع داخل مربّع داخل مربّع".
وليدجات اللوحة (الموافقات الأخيرة + آخر العمليات) كان كل عنصر منها `KernelActivityItem` مربّع بحدود
وسطح خاص، داخل `KernelCard` — وكل ما زاد عدد العناصر زادت "الصفوف المربّعة".

طبّقنا مبدأ: **الكروت للحدود التفاعلية فقط، والمحتوى الثانوي بالفواصل + التباعد**.

- في `compliance.astro`: أزلنا الـ `KernelCard` الخارجي اللي كان يلفّ شبكة الحزم الثمانية، وخريطة الامتثال،
  واستبدلناه بعنوان قسم (`k-section-title`) + intro مباشرة قبل الشبكة/الخريطة. الحزم نفسها تبقى كروت
  تفاعلية (هي الـ actionable content). الـ `KernelCard` في قسم "تحليل الفجوات" بقي — لأنه صندوق مفرد، مو تداخل.
- في `kernel.css`: حوّلنا `KernelActivityItem` من مربّع (`background` + `border-radius`) لصفّ بفواصل
  `border-block-end` بين العناصر (الأخير بلا فاصل) + تباعد `--space-3`. هذا يشيل "مربّع داخل مربّع"
  من ويدجات اللوحة.
- خفّفنا `box-shadow` لكروت KPI من `--shadow-md` لـ `--shadow-sm` عشان يقل الوزن البصري (الحدّ أقل
  بروزًا، فالمحتوى الثانوي يتنفّس). كروت KPI نفسها تبقى (هي مقاييس أساسية تفاعلية).

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/pages/kernel/compliance.astro` | Edited | إزالة `KernelCard` الخارجي للخريطة + شبكة الحزم؛ استبدال بعنوان قسم + intro؛ إصلاح أقواس الإغلاق؛ إزالة id المكرر من `h4` legend (صرّف class) |
| `src/styles/kernel.css` | Edited | `KernelActivityItem` → divider-based (`border-block-end` + padding، الأخير بلا فاصل، hover خفيف)؛ `KernelMetricCard` → `box-shadow: var(--shadow-sm)` |
| `scripts/playwright/card-fatigue-shot.mjs` | Created | سكربت لقطات محفوظ (لوحة + امتثال × desktop/mobile، 1440 + 390) |

## Verification Results

| Check | Result |
|---|---|
| `npm run build` | ✅ 275 صفحة، 0 أخطاء |
| KernelLayout CSS (purge) | ✅ 195.3KB → 151.1KB |
| dist HTML — شبكة الحزم | ✅ `<h2 class="k-section-title">` + `<p class="k-section-intro">` + `<div class="kernel-compliance-grid">` مباشرة (بدون `kernel-card__body` بينهم) |
| dist HTML — الخريطة | ✅ `h2#compliance-heatmap-title` + intro + `.kernel-compliance-map` مباشرة |
| 8 حزم الامتثال | ✅ كل الـ 8 حزم موجودة في الـ dist HTML |
| id فريد | ✅ `compliance-packs-title` + `compliance-heatmap-title` يظهران مرة واحدة (لا تكرار) |
| dist CSS — dividers | ✅ `border-block-end` موجود، والـ boxed background القديم `rgba(19,28,48,0.4)` اختفى من `.kernel-activity-item` |
| dist CSS — metric shadow | ✅ `box-shadow: var(--shadow-sm)` في `.kernel-metric-card` |
| `npm run verify:all` | ✅ exit 0 (SEO gate + hreflang + internal links: 0 أخطاء) |
| Playwright لقطات | ✅ `download/qa/cf-dashboard-{desktop,mobile}.png` + `cf-compliance-{desktop,mobile}.png` |

## Risks Remaining

- **مراجعة بصرية من المستخدم**: الـ model لا يقرأ الصور، فالتحقق من الشكل النهائي تم برمجيًا من الـ HTML/CSS المبنِي.
  اللقطات الأربع محفوظة في `download/qa/` لمراجعتها يدويًا.
- **منخفض**: `KernelCard` في قسم "تحليل الفجوات" بقي صندوقًا واحدًا. لو بدا التداخل يرجع، يتحوّل لنفس نمط
  `k-section-title` + intro. ما يلمس 8+ حزم في حينها.
- **لا شي**: إزالة `KernelCard` الخارجي لم تغيّر أي نص منشور ولا روابط ولا أقسام — فقط الهيكل البصري.

## Follow-up Suggestions

- إن استمرت مراجعة المستخدم أن ويدجات اللوحة تبي سطحًا أفتح، نقدر نضيف `background: transparent` صريح + نعتمد
  الفواصل فقط (التغيير موجود أصلًا من كونه divider-based).
- النظر في نفس المعاملة لصفحات الكيرنل الثانوية (إن ظهر نفس النمط box-inside-box في أي صفحة أخرى).

## Rollback Plan

```
git checkout -- src/styles/kernel.css src/pages/kernel/compliance.astro
npm run build
```
