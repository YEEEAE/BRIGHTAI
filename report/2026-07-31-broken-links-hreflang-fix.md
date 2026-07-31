# إصلاح 20 خطأ روابط مكسورة + 44 خطأ hreflang مخفية

**Date**: 2026-07-31
**Agent**: BrightAI Workspace Agent
**Task**: إصلاح أخطاء verify:all (20 خطأ) + أخطاء hreflang المخفية (44 خطأ)
**Mode**: Senior

## الملخص التنفيذي

verify:all كان يفشل على الـ seo:gate بـ 20 خطأ: 4 صفحات `authors/*` بلا فهرس،
3 صفحات `events/*` بلا فهرس، رابطا مدونة يشيران لحلول غير موجودة
(`agile-ai-governance`, `big-data-analytics`)، 4 مستندات kernel docs ناقصة،
خطأ `blogPath` للـ playground، خطأا CSS في redteam/replay، و canonical ناقص
لصفحة quota.

بعد إصلاح الـ 20 خطأ وصار الـ seo:gate ينجح، ظهرت طبقة جديدة من الأخطاء كانت
مخفيّة طول الوقت: 44 خطأ hreflang على 22 صفحة مفهرسة من `/answer/*` و `/lp/*`
اللي ما كانت تصدّر أي hreflang tags (لا ar-SA self ولا x-default). هذي كانت
موجودة سابقاً، بس ما كنا نشوفها لأن الـ seo:gate كان يفشل أول.

سوّينا:
- صفحتان فهرس جديدتان: `/authors/` و `/events/` (مع CollectionPage JSON-LD)
- ربطتا مدونة → حلول موجودة بدل اللي محذوفة
- 4 مستندات kernel docs جديدة (playground, replay, redteam, models)
- إصلاح blogPath + استيراد CSS + canonical لـ quota
- hreflang (ar-SA self + x-default) لصفحات /answer/ و /lp/ عبر
  `getHreflangLinks()` من `src/data/hreflang-pairs.ts`

النتيجة: `verify:all` → exit 0، `seo:gate` → 0 أخطاء، `seo:hreflang` → 0 أخطاء.

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/pages/authors/index.astro` | Created | فهرس المؤلفين (4 authors) + CollectionPage schema |
| `src/pages/events/index.astro` | Created | فهرس الفعاليات (3 events) + CollectionPage schema |
| `src/content/docs/kernel-playground.md` | Created | مستند kernel playground |
| `src/content/docs/kernel-replay.md` | Created | مستند kernel replay |
| `src/content/docs/kernel-redteam.md` | Created | مستند kernel redteam |
| `src/content/docs/kernel-models.md` | Created | مستند kernel models |
| `src/content/blog/ai-implementation-cost-saudi.md` | Edited | رابط → `/solutions/ai-governance-platform/` |
| `src/content/blog/big-data-analytics-saudi-companies.md` | Edited | رابط → `/solutions/ai-use-case-discovery/` |
| `src/data/kernel.ts` | Edited | إصلاح blogPath للـ playground |
| `src/pages/kernel/redteam.astro` | Edited | استيراد CSS بدل `<link>` |
| `src/pages/kernel/replay.astro` | Edited | استيراد CSS بدل `<link>` |
| `src/pages/kernel/admin/quota.astro` | Edited | إضافة canonical |
| `src/pages/answer/[slug].astro` | Edited | إضافة hreflang (ar-SA self + x-default) |
| `src/pages/lp/[slug].astro` | Edited | إضافة hreflang (ar-SA self + x-default) |
| `src/styles/pages.css` | Unchanged | كان فيه author-shell بس ناقص author-post-card — أضفناه scoped في الصفحة |

## Verification Results

| Check | Result |
|---|---|
| `npm run build` | ✅ بنجاح |
| `npm run seo:gate` | ✅ 0 أخطاء، Broken links: 0 |
| `npm run seo:hreflang` | ✅ 0 أخطاء (253 sets) |
| `npm run verify:all` | ✅ exit 0 (pass 16, fail 0) |

## Risks Remaining

- صفحات `/authors/` و `/events/` الجديدة ما لها أي صفحات فرعية تانية غير الفهرس؛
  الروابط القديمة اللي كانت تقود لـ `authors/*` و `events/*` صارت كلها على الفهرس.
- الصفحات الأربعة الجديدة في kernel docs مبنية من بيانات seoBlocks في kernel.ts؛
  لو أحد غيّر الـ seoBlocks لازم يتأكد إن المستندات تفضل متزامنة.
- أخطاء DATABASE_URL في verify:all متوقعة محلياً (بيئة بلا DB) — ما تؤثر على النتيجة.

## Follow-up Suggestions

- تشغيل `npm run sitemap:generate` + `npm run indexnow:trigger` بعد الـ deploy
  عشان الصفحات الجديدة تنفهرس.
- متابعة إضافة hreflang لأي صفحة مفهرسة جديدة فور إنشائها (answer/lp النمط
  المتّبع الحين).
- ممكن مستقبلاً نحذف الـ `<style>` في `authors/index.astro` لو أضفنا
  author-post-card بشكل عام في pages.css.

## Rollback Plan

```
git revert <commit-sha>
npm run build
npm run verify:all
```
