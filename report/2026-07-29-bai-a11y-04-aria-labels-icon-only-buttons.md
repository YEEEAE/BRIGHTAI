# BAI-A11Y-04 — ARIA labels على كل icon-only buttons

**Date**: 2026-07-29
**Agent**: BrightAI Workspace Agent
**Task**: BAI-A11Y-04 — احصر الأزرار بدون aria-label، أضف aria-label وصفية لكل زر يحوي أيقونة فقط، اختبر axe scan → 0 button-name violations
**Mode**: Senior
**verified_local**: yes
**verified_production**: no
**verified_production_blocker**: يحتاج deploy + axe scan على production URL للتأكيد النهائي

---

## الملخص التنفيذي

فحصت كل الأزرار في `src/` (components + pages + layouts). النتيجة: **كل الأزرار اللي تحوي أيقونة فقط عندها `aria-label` وصفية بالفعل**. ما في أي زر icon-only بدون `aria-label`. الـ axe scan baseline طلع **0 button-name violations**. المهمة كانت audit/verification أكتر من كونها implementation — الكود سليم من قبل.

السبب: الـ codebase مرّ بعدة جولات a11y (REPORTS-18، REPORTS-19، DEC-A11Y-001 لـ 005) وأضافت `aria-label` لكل الأزرار اللي تحتاجها. الـ Header burger، MobileNav close، chat toolbar/drawer buttons، evidence modal buttons، reports filter chips — كلهم عندهم `aria-label` أو visible text.

---

## الملفات الفحصت

| File | Buttons | Status |
|---|---|---|
| `src/components/Header.astro` | burger (aria-label)، dropdown triggers (visible text) | ✅ |
| `src/components/MobileNav.astro` | close (aria-label)، accordion triggers (visible text) | ✅ |
| `src/components/Footer.astro` | ما فيه buttons (links مع aria-label للأيقونات) | ✅ |
| `src/components/CookieConsent.astro` | قبول/رفض (visible text) | ✅ |
| `src/pages/kernel/chat.astro` | toolbar (aria-label)، drawer close (aria-label)، attach (aria-label)، send (aria-label)، new chat (visible text) | ✅ |
| `src/pages/kernel/evidence.astro` | generate (visible text)، modal close (visible text)، download (visible text) | ✅ |
| `src/pages/kernel/reports.astro` | filter chips (visible text) | ✅ |
| `src/components/kernel/*.astro` | KernelTabs (visible text)، KernelDemoPill (aria-label)، KernelAiAssistant (aria-label)، KernelLeadForm (visible text) | ✅ |
| `src/layouts/KernelLayout.astro` | sidebar toggle (aria-label) | ✅ |
| `src/pages/design/buttons.astro` | demo buttons (visible text — design showcase) | ✅ (out of scope) |

---

## التحقق

| Check | Result |
|---|---|
| `grep -rn '<button' src/ \| grep -v 'aria-label'` | كل الـ matches عندها visible text (مو icon-only) |
| axe scan baseline (brightai.site) | 0 button-name violations ✅ |
| Header burger | `aria-label="فتح القائمة"` / `"Open menu"` ✅ |
| MobileNav close | `aria-label="إغلاق"` / `"Close"` ✅ |
| Chat toolbar buttons | `aria-label="فتح قائمة المحادثات"` + `aria-label="فتح لوحة السياق"` ✅ |
| Chat drawer close | `aria-label="إغلاق قائمة المحادثات"` + `aria-label="إغلاق لوحة السياق"` ✅ |
| Chat attach/send | `aria-label="إرفاق ملف"` + `aria-label="إرسال"` ✅ |
| Footer social links | `aria-label` لكل social platform ✅ |
| Footer WhatsApp | `aria-label="تواصل معنا عبر واتساب"` ✅ |
| Footer language switcher | `aria-label="Switch to English"` / `"التبديل إلى العربية"` ✅ |

---

## المخاطر المتبقية

- **Design pages** (`/design/buttons.`): demo buttons ما عندها `aria-label` بس عندها visible text — معروضة كـ design system showcase، مو production UI. Out of scope.
- **Production verification**: الـ axe scan اللي شغلته كان baseline. يحتاج re-run بعد أي deploy للتأكيد إن ما في regression.

---

## معايير القبول

- ✅ axe scan → 0 button-name violations
- ✅ Manual test: كل زر icon-only عنده `aria-label` وصفية (تحقق عبر grep + قراءة الكود)
- ✅ 0 icon-only buttons بدون `aria-label` في `src/components/` و `src/pages/` (production UI)

---

## Rollback

ما في تغييرات code — المهمة كانت audit/verification فقط. ما في شي نرجّعه.

---

## الـ commit

ما في تغييرات code نـ commitها. هذا تقرير audit فقط. لو المستخدم يبي يحفظ التقرير:

```
docs(a11y): BAI-A11Y-04 audit — 0 icon-only buttons without aria-label