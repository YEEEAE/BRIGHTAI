# برومبتات إصلاح minimax code m3

## قواعد ثابتة لكل دفعة
انسخ هالمقدمة قبل كل برومبت:

> اشتغل محليًا على branch مستقل فقط. اقرأ `audit/FULL-AUDIT-ar.md`, `audit/ISSUES.csv`, و`audit/SCORES.json`. خذ baseline بـ `git status`, `pnpm typecheck`, `pnpm lint`, `pnpm verify:all`, `pnpm seo:all`, و`pnpm performance:budget`. ممنوع النشر أو تشغيل أي deploy أو push أو إنشاء PR، وممنوع استخدام Vercel CLI/API أو تعديل ربط مشروع Vercel أو إعداداته أو متغيراته أو domains أو deployment configuration أو أي ملف خاص بـ Vercel؛ اترك كل ما له علاقة بـ Vercel على وضعه الحالي تمامًا. لا تعدّل ملفات audit لإخفاء failures، ولا توسّع النطاق، ولا تغيّر المحتوى السعودي أو canonicals أو URLs بدون دليل. طبّق أقل تغيير آمن محلي، أضف regression test، وأرفق before/after output محلي فقط. لا تدّعي 100% إلا إذا كل الاختبارات المحلية القابلة للتحقق نجحت وUnknown بقي Unknown.

## Prompt 1 — P0 dependency security
رقّ Next.js و`@clerk/nextjs` والتبعيات التابعة للإصدارات patched المتوافقة. ابدأ من advisories في `pnpm audit --prod`. لا تستخدم `--force`. Acceptance: `pnpm audit --prod` ما يطلع critical/high في production graph، dashboard build/typecheck ينجح، وauth middleware tests تغطي unauthorized/organization routes. إذا الترقية تحتاج migration، وثّقها ووقف قبل breaking schema change.

## Prompt 2 — P0 Prisma and verification
شخّص ليه `@prisma/client` ما يصدّر models و`LeadQueueStatus` وليه `packages/db/src/client.ts` عنده implicit any. تأكد إن generation مبني من schema الصحيح ومضاف كخطوة reproducible قبل typecheck/tests. Acceptance: `pnpm typecheck`, `pnpm test:chat-session`, و`pnpm verify:all` exit 0 على clean checkout، بدون hand-written stubs للـ Prisma types.

## Prompt 3 — P0/P1 lint configuration
أصلح dashboard ESLint config اللي يشير إلى `@typescript-eslint/no-unused-vars` بدون plugin متاح. اتبع flat-config pattern الموجود وإصدار ESLint الحالي. Acceptance: `pnpm lint` exit 0، وما يصير تعطيل شامل للقاعدة أو lint.

## Prompt 4 — P1 build-root contract
وحّد `scripts/seo-health-check.mjs`, `scripts/verify-all.mjs`, `scripts/check-redirect-destinations.mjs`, و`scripts/check-performance-budget.js` على Astro SSR output `dist/client`. عرّف helper واحد يحدد client build root، واكتب tests على fixture فيه `dist/client/index.html`. Acceptance: `pnpm seo:all`, `pnpm redirects:check`, `pnpm performance:budget`, و`pnpm verify:all` تقرأ 190 HTML/189 sitemap URLs بدل 0، وما تكتب sitemap صفر URL.

## Prompt 5 — P1 accessibility
أصلح `A11Y-BLOG-LINK` في `.breadcrumbs__link` بحيث الرابط يبان بدون الاعتماد على اللون، وأصلح `A11Y-DOCS-CONTRAST` في `.docs-recent__date` و`.docs-recent__cat` إلى WCAG AA. لا تغيّر palette العامة. Acceptance: axe على `/blog/` و`/docs/` يعطي 0 serious/critical في dark وlight وعرض 390 و1440، مع screenshots.

## Prompt 6 — P1 internal links
أضف روابط سياقية ظاهرة لصفحات categories الخمس المذكورة في `INTERNAL-LINK-RECOMMENDATIONS.csv` من `/blog/` أو hub مناسب. استخدم anchors عربية وصفية، ولا تضف footer spam. Acceptance: collector يعطي inlinks أكبر من صفر لكل target، ما فيه broken links، و`pnpm seo:link-graph` ينجح.

## Prompt 7 — P1 headers and blank target
أضف CSP/HSTS/Referrer-Policy/Permissions-Policy/X-Frame-Options أو `frame-ancestors` في طبقة Render/Cloudflare الموجودة فقط، من دون إنشاء أو تعديل أي إعداد أو ملف أو تكامل يخص Vercel. أضف `rel="noopener noreferrer"` للرابط المحدد في `/blog/pdpl-and-ai-saudi/`. ممنوع النشر؛ Acceptance محلي فقط: اختبارات configuration تثبت قيم headers، و`curl -I` على خادم preview محلي يثبتها إن كانت طبقة التشغيل المحلية تدعم ذلك، واختبارات forms/assets ما تنكسر. أي تحقق لا يمكن إثباته دون production يبقى `Unknown` ولا يبرر deploy.

## Prompt 8 — P2 sitemap hygiene
استبعد `/404/` من sitemap وثبّت إن عدد sitemap يساوي الصفحات indexable فقط. راجع hreflang reciprocal pairs بدون اختلاق English alternates. Acceptance: XML valid، 0 error routes، 0 noindex URLs، وكل loc يرجع 200 وcanonical self-reference.

## Prompt 9 — Independent re-audit
ابدأ من clean checkout بعد دمج الإصلاحات. شغّل نفس الأوامر والcollector وaxe وقياسات browser. حدّث الأدلة والدرجات بالمعادلة نفسها فقط. أي فحص متعذر يبقى Unknown وخارج المقام. ممنوع تحويل partial/fail إلى pass بدون command output أو HTML/browser evidence. أخرج diff يربط كل issue ID بدليل الإغلاق.
