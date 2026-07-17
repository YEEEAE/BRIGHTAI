# سجل الأوامر والأدلة

## Baseline
- Commit: `d58398b75ce37e82f69b5dc269c7aefadc986ff5`
- Branch: `brightai-audit-report`
- Runtime الفعلي: Node `v24.14.1`، بينما المشروع يطلب `22.x`; pnpm `10.19.0`; Astro `6.4.8`.
- النطاق: 190 ملف HTML مبني، 189 URL في sitemap، 207 redirect، و23,655 edge داخلي.

## النتائج القابلة لإعادة التشغيل
| الأمر | النتيجة | الدليل المختصر |
|---|---:|---|
| `uv run --with fonttools --with brotli pnpm build` | PASS | build اكتمل؛ 190 HTML. طلع 10 تحذيرات تعارض routes ديناميكية مع routes صريحة. |
| `pnpm typecheck` | FAIL | أخطاء Prisma exports وimplicit `any` في `packages/db`. |
| `pnpm lint` | FAIL | ESLint ما لقى plugin `@typescript-eslint` في dashboard config. |
| `pnpm verify:all` | FAIL | `test:chat-session` فشل بسبب `LeadQueueStatus` غير موجود من `@prisma/client`. |
| `pnpm seo:all` | FAIL | السكربت فحص source root بدل build واعتبر sitemap صفر URL؛ هذا خلل في harness، مو إثبات إن sitemap المبني فاضي. |
| `pnpm redirects:check` | FAIL | أبلغ عن destinations مفقودة رغم وجودها تحت `dist/client`; لازم توحيد build-root. |
| `pnpm performance:budget` | FAIL | يتوقع `dist/index.html` و`dist/_astro` بينما Astro SSR output موجود تحت `dist/client`. |
| `pnpm audit --prod` | FAIL | advisories حرجة وعالية في Next.js/Clerk، ومتوسطة في esbuild وغيرها. |
| `A11Y_BASE_URL=http://localhost:4321 node ../../scripts/axe-scan.mjs` | PASS مع findings | 13 صفحة؛ 0 critical و2 serious. |
| `node audit/evidence/static-audit.mjs` | PASS | 190 صفحة، 207 redirects، 23,655 links، 7 static findings. |
| `curl -sSIL https://brightai.site/...` | PASS جزئي | الصفحات الممثلة 200، لكن headers الأمنية المتوقعة مو ظاهرة غير `X-Content-Type-Options`. |

## أدلة المتصفح
- `audit/evidence/home-598x621.png`
- `audit/evidence/home-390x844.png`
- `audit/evidence/pricing-390x844.png`
- `audit/evidence/blog-390x844.png`
- `audit/evidence/a11y-report.json`
- قياس `agent-browser vitals` أعطى homepage lab TTFB حوالي `2256.6ms` وCLS `0.01`، بس FCP/LCP/INP كانت null؛ لذلك ما اعتبرناها Field CWV ولا نجاح أداء.

## حدود الإثبات
ما عندنا CrUX أو GSC أو analytics أو أدوات رصد اقتباسات فعلية. عشان كذا ما حسبنا rankings، Field CWV، ولا الظهور في ChatGPT/Perplexity كنجاح.
