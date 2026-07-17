# خارطة طريق 90 يوم

## الأيام 0–7 — P0
- رقّ Next.js وClerk للإصدارات patched، وشغّل `pnpm audit --prod` لين تختفي critical/high production findings.
- أصلح Prisma client generation وtypes، وبعدها خل `pnpm typecheck` و`pnpm test:chat-session` ينجحون من clean checkout.
- أصلح ESLint plugin/config بدون تعطيل lint.
- Owner مقترح: Platform/Security. دليل الإغلاق: command logs + lockfile diff + auth regression tests.

## الأيام 8–30 — P1
- وحّد build-root إلى `dist/client` في SEO/redirect/performance/verify scripts وأضف fixture tests.
- أصلح serious axe findings في `/blog/` و`/docs/` واختبر dark/light و390/1440.
- أضف headers الأمنية في deployment layer واختبرها بـ `curl -I` بعد deploy.
- اربط categories الخمس من blog hub بروابط سياقية.
- استبعد `/404/` من sitemap.
- Owner مقترح: Web Platform + Design System + SEO.

## الأيام 31–60 — P2
- وسّع browser matrix لكل template على 360/390/768/1024/1440 مع keyboard وzoom/reflow وreduced-motion.
- شغّل Lighthouse mobile/desktop بعد إصلاح performance harness، وحدد budgets على `dist/client`.
- افحص 207 redirects على production وسجل chain/final status/canonical parity.
- راجع 74 edge خام بعد normalization عشان تفرق broken routes عن assets/variants.

## الأيام 61–90 — P3 وقياس خارجي
- اربط GSC وCrUX أو RUM للحصول على index coverage وField LCP/INP/CLS.
- شغّل benchmark العشرين سؤال على ChatGPT/Perplexity شهريًا وسجل citations بدون manual cherry-picking.
- اجمع backlinks/brand mentions وراجع author/entity authority.
- أعد التدقيق بنفس rubric؛ لا تغيّر الأوزان أثناء المقارنة.

## بوابة الخروج
ما نعتبر البرنامج مكتمل إلا إذا P0 صفر، كل CI gates exit 0، serious axe صفر، sitemap والredirect checks صحيحة، وUnknowns الخارجية مو معروضة كـ pass.
