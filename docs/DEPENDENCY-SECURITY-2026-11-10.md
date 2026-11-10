# سياسة أمن الاعتماديات وسجل الاستثناءات — 2026-11-10

> النطاق: `brightai-monorepo` (Astro 6 + `@astrojs/node` standalone) في هذا المستودع.
> المرجع: P16 / AR04 في `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md`.
> الدليل الكامل: `Audit/p16-dependency-security-2026-11-10/REPORT.md`.
> إعادة التحقق: `node scripts/verify-dependency-posture.mjs` و`node scripts/verify-node-runtime.mjs`.

## 1. الحالة الحالية

- `package-lock.json` هو المصدر الوحيد للتثبيت (lockfileVersion 3، 429 مدخلًا، 9 اعتماديات مباشرة).
- لا يوجد `pnpm-lock.yaml` ولا `yarn.lock`، و`render.yaml` يبني بـ`npm ci && npm run build`.
- أُزيل `packageManager: pnpm@10.19.0` و`engines.pnpm` من `package.json` لأنهما كانا يعلنان مدير حزم لا يوجد له lockfile، فينتج شجرة مختلفة عند `pnpm install`. لا يوجد CI أو سكربت يستخدم pnpm.
- `npm ci --dry-run --ignore-scripts` = exit 0 (الشجرة قابلة للتكرار من الـlockfile).
- لا `devDependencies` في المشروع: كل ما يُثبَّت في الإنتاج هو نفسه ما يُثبَّت في البناء، لذلك أدوات البناء (مثل `esbuild`) موجودة في شجرة الإنتاج رغم أنها لا تُشحن.

## 2. نتيجة فحص advisories (2026-11-10)

`npm audit` = 4 حزم متأثرة، 12 advisory (1 critical، 2 high، 6 moderate، 3 low — باحتساب أشد درجة لكل حزمة). نسخة اللقطة: `Audit/p16-dependency-security-2026-11-10/npm-audit-2026-11-10.json`.

| الحزمة | النسخة | المسار | النوع | أشد درجة |
|---|---|---|---|---|
| `astro` | 6.4.8 | مباشر (`dependencies`) | runtime (SSR) | critical |
| `@astrojs/node` | 10.1.4 | مباشر (`dependencies`) | runtime (خادم HTTP) | high |
| `sharp` | 0.34.5 | اختياري عبر `astro` (`optionalDependencies`) | لا يُحمَّل | high |
| `esbuild` | 0.27.7 | عبر `astro` و`vite` | build-only | low |

### 2.1 مسار الاستغلال الفعلي (وليس CVSS وحده)

| Advisory | الدرجة | ما يلزم لاستغلاله | الحكم على هذا التطبيق |
|---|---|---|---|
| `GHSA-qh8j-hqjv-7m4x` / CVE-2026-102984 (`@astrojs/node`) | high 8.2 | `Host` بمنفذ مشوّه يصل إلى الأصل | **قابل للاستغلال محليًا وأُغلق عند المدخل** |
| `GHSA-r557-wffq-wvrc` (`@astrojs/node`) | low (CWE-601) | مسار يبدأ بـ`\` يمرّ عبر redirect الشرطة المائلة | **قابل للاستغلال محليًا وأُغلق عند المدخل** |
| `GHSA-26w7-cxv4-gfx2` (`astro`) | critical 9.8 | خدمة صور Astro تعالج AVIF غير موثوق | غير قابل للوصول (لا خدمة صور) — **بدون تنازل** |
| `GHSA-f48w-9m4c-m7f5` (`astro`) | moderate | `renderHTMLElement` مع renderer إطار عمل | غير قابل للوصول (لا renderer) |
| `GHSA-7pw4-f3q4-r2p2` (`astro`) | low | `transition:*` على جزيرة مُهدرَجة | غير قابل للوصول (لا `client:*`) |
| `GHSA-4g3v-8h47-v7g6` (`astro`) | moderate | خصائص View Transition | غير قابل للوصول (لا `ClientRouter`/`ViewTransitions`) |
| `GHSA-376h-93r7-7g6f` (`astro`) | moderate | تجاوز صلاحيات عند حذف `base` المهيّأ | غير قابل للوصول (لا `base`) |
| `GHSA-98hj-9722-w3j8` (`astro`) | moderate | `<script>`/`<style>` غير مُهرَّب في JSX/MDX | غير قابل للوصول (لا JSX/MDX) |
| `GHSA-f88m-g3jw-g9cj` (`sharp`) | high | فك ترميز صورة غير موثوقة بـlibvips | غير قابل للوصول (`sharp` غير محمّل) |
| `GHSA-rgj7-g3m4-5g8c` (`sharp`) | high | HEIF/AVIF غير موثوق عبر خدمة الصور | غير قابل للوصول |
| `GHSA-wq5f-xc86-pv6w` (`sharp`) | high | SVG عبر librsvg في خدمة الصور | غير قابل للوصول |
| `GHSA-g7r4-m6w7-qqqr` (`esbuild`) | low | خادم تطوير esbuild على Windows | غير قابل للوصول (بناء فقط، والهدف Linux/darwin) |

ملاحظات قياس:
- `/` و`/terms/` وغيرها صفحات prerendered تُخدَم من القرص قبل بناء الطلب، ولهذا لم يظهر عيب `Host` عليها؛ العيب يظهر على المسارات الخادمية `/healthz/` و`/app/` و`/app/api/*`.
- `sharp` اختياري في الـlockfile، ولا يوجد أي أثر له في `dist/` (0 مراجع). `esbuild` لا يظهر في `dist/` إلا داخل نص رسالة خطأ من المحوّل.
- `esbuild` في شجرة الإنتاج لأن المشروع لا يعلن `devDependencies`؛ هذا اختيار بنيوي قائم ولم يُغيَّر هنا.

## 3. المعالجة المطبقة (أقل فرق)

في `scripts/server.mjs` (مدخل الإنتاج `npm start`)، قبل أن يصل الطلب إلى المحوّل:

1. رفض `Host` غير صالح: ليس `hostname[:port]` واحدًا أو منفذ > 65535 ⇒ `400 Bad request`. هذا يسدّ `CVE-2026-102984` في هذا النشر.
2. رفض `\` خام في مسار الطلب ⇒ `400`. هذا يسدّ `GHSA-r557-wffq-wvrc` (كان `301 Location: /\evil.example/app/` وهو ما يفسّره المتصفح كـ`//evil.example/app/`). الاستعلام يبقى مسموحًا لأن الفحص على المسار فقط.
3. التقاط رفض المعالجة (`handler(...).catch`) فلا يصبح `unhandledRejection` يُسقط العملية، مع `X-Content-Type-Options: nosniff` على ردود الخطأ.

لم تُرقَّ أي حزمة: كل إصلاح جذري متاح هو ترقية **رئيسية** (astro 6→7 و@astrojs/node 10→11) وتحتاج نطاقًا مصرحًا، إضافة إلى Node ≥ 22.23.4 بينما `render.yaml` يثبّت `22.22.2`.

## 4. الترقية الجذرية المطلوبة (بانتظار تفويض)

| الحزمة | الحالي | المطلوب | ملاحظة |
|---|---|---|---|
| `astro` | 6.4.8 | ≥ 7.3.2 | 7.2.8 يسدّ AVIF؛ 7.3.2 يسدّ آخر XSS |
| `@astrojs/node` | 10.1.4 | ≥ 11.1.3 | `peerDependencies: astro ^7.2.1` |
| Node runtime | 22.22.2 (Render) | ≥ 22.23.4 | مطلوب من `engines` في astro 7.4.x |
| `sharp` | 0.34.5 | يُحدَّث تلقائيًا مع astro ≥ 7.2.8 | اختياري |

عند الترقية يجب: `npm install astro@^7 @astrojs/node@^11` ثم تحديث `package-lock.json` وحده، ورفع `NODE_VERSION` في blueprint بتفويض منفصل، ثم إعادة تشغيل `npm run build` و`scripts/verify-node-runtime.mjs` و`scripts/verify-routes.mjs` و`scripts/verify-dependency-posture.mjs`. تبقى حراسة `Host` و`\` صالحة بعد الترقية (لا تعارض)، ويمكن إبقاؤها.

## 5. سجل الاستثناءات

المصدر الملزم: `.github/security-allowlist.yml` (11 مدخلًا، مالك `P16 Dependency Security Engineer`، تاريخ انتهاء `2027-02-08`، متتبع `P16-AR04`). الشرط الذي يسقط أي استثناء: `node scripts/verify-dependency-posture.mjs` (D2–D6) يعيد إثبات أن مسار الاستغلال غير موجود.

**غير مُتنازَل عنه:** `GHSA-26w7-cxv4-gfx2` (critical). إدخال critical في الـallowlist يتطلب موافقة المؤسس صراحةً، لذلك بقي خارج الملف. إدخاله مع مالكه وتاريخه ينتظر تلك الموافقة أو الترقية في القسم 4.

قاعدة تشغيلية: إدخال `astro:assets`/`<Image/>`/`getImage` أو صور بعيدة أو `avif` قبل الترقية يُبطل استثناءات `sharp` والاستثناء الحرج معًا، ولا يجوز قبل تحديث هذا الملف.

## 6. الترخيص

توزيع التراخيص على 429 مدخلًا في الـlockfile (`Audit/p16-dependency-security-2026-11-10/licenses-2026-11-10.txt`): MIT 359، Apache-2.0 20، ISC 16، BSD-2-Clause 9، BSD-3-Clause 3، BlueOak-1.0.0 3، CC0-1.0 2، 0BSD 1، Python-2.0 1، وLGPL-3.0-or-later 14.

- لا GPL/AGPL/SSPL ولا حزمة بلا ترخيص في أي مدخل.
- LGPL-3.0-or-later كلها ثنائيات `@img/sharp-libvips-*` و`@img/sharp-*` الاختيارية (libvips). الربط ديناميكي والاستخدام خدمة مُستضافة، فلا نشأة التزام نسخ للكود؛ إن نُشرت الثنائيات (صورة/حزمة) فيلزم إرفاق نص LGPL وإتاحة إعادة الربط. البديل الأنظف هو عدم شحن `sharp` إطلاقًا بعد إزالة حاجة الصور — انظر القسم 7.

## 7. ملاحظات مفتوحة

- `.github/security-allowlist.yml` يشير إلى `.github/workflows/ci-build-guard.yml` وهو غير موجود، فلا يوجد تطبيق آلي للـallowlist. لم يُنشأ workflow (خارج التفويض).
- `react-useanimations` و`@neon/config` و`@neon/env` معلنة كاعتماديات مباشرة ولا يستوردها أي ملف في `src/` أو `scripts/` (فحص نصي). إزالتها تقلّل سطح التوريد لكنها تغيير خارج نطاق AR04 ولم تُنفّذ.
- خطة التراجع: `git checkout -- scripts/server.mjs scripts/verify-node-runtime.mjs package.json .github/security-allowlist.yml` وحذف `scripts/verify-dependency-posture.mjs`؛ لا تغيير على `package-lock.json` أصلًا في هذا العمل.
