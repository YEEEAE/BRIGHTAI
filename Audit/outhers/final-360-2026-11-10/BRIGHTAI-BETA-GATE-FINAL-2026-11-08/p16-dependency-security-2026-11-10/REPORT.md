# P16 / AR04 — ثغرات الاعتماديات وتراخيصها

- **التاريخ (UTC):** 2026-11-10T21:50Z
- **HEAD المقيس:** `9628162872424bd071b9ca48149d899613bcb510` (branch `main`)
- **الحالة المرجعية في التدقيق:** `7b1f533f71c7b1f41884790366a4d5967c85a87b` — أقدم من HEAD؛ التقرير القديم استُخدم للسياق فقط، وكل نتيجة هنا مقيسة على HEAD.
- **البيئة:** macOS 26.7.3 / arm64، Node `v24.20.0`، npm `11.19.0` (pnpm مثبّت لكنه غير مستخدم في المستودع).
- **بيئة النشر المستهدفة:** Render web service، Node `22.22.2`، `npm ci && npm run build`، `npm start`.
- **حدود:** محلي فقط، بلا شبكة إنتاج وبلا أسرار؛ استعلام قاعدة advisories العام (`npm audit` / GitHub Advisory) فقط. لم يُنفّذ commit/push/deploy، ولم تُرقَّ أي حزمة.

## 1. جرد الاعتماديات

| العنصر | القيمة |
|---|---|
| Lockfile | `package-lock.json` وحده، lockfileVersion 3، 429 مدخلًا |
| اعتماديات مباشرة | 9 |
| devDependencies | 0 (كل شيء يُثبَّت في الإنتاج) |
| `npm ci --dry-run --ignore-scripts` | exit 0 — الشجرة قابلة للتكرار |
| شجرة الإنتاج `npm audit` | 428 حزمة (prod 333، optional 95، peer 1) |

انحراف جرد `Audit/final-360-2026-11-10/dependencies.txt` (المؤرخ على `7b1f533`) عن HEAD: **لا انحراف** — النسخ المثبتة مطابقة (`@astrojs/node@10.1.4`, `astro@6.4.8`, `jose@6.2.14`, `pg@8.23.1`, `sharp@0.34.5` اختياري عبر `astro`). لم تتغير `package.json` أو `package-lock.json` في هذا النطاق.

## 2. الأوامر والنتائج

| # | الأمر | النتيجة |
|---|---|---|
| 1 | `npm audit --json` | 4 حزم / 12 advisory: 1 critical، 2 high، 6 moderate، 3 low — corner: كلها قديمة، لا ترقيع داخل النطاق الحالي |
| 2 | `npm ci --dry-run --ignore-scripts` | PASS (exit 0)، بعد تعديل `package.json` أيضًا |
| 3 | `npm run build` | PASS — 56 صفحة عامة، `dist/server/version.json: 962816287242` |
| 4 | `node scripts/verify-routes.mjs http://127.0.0.1:4387` | PASS — pages 56، redirects 117 (234 فحص GET/HEAD)، references 2945، broken 0، orphan 0 |
| 5 | `node scripts/verify-node-runtime.mjs` | **16 PASS / 1 SKIP / 0 FAIL** (SKIP = C، لا `P04_READY_DATABASE_URL`) |
| 6 | `node scripts/verify-dependency-posture.mjs` | **7 PASS / 0 FAIL** (جديد — إعادة إثبات شروط الاستثناءات) |
| 7 | `node --test` على 12 ملفًا غير مرتبط بـDB (kernel/identity/ledger/risk/chat/trial/firewall/human-gate/observability/navigation/knowledge/harness) | **62 PASS / 0 FAIL** |
| 8 | فحص `Host` خام قبل/بعد الإصلاح | قبل: `500 Internal Server Error` + `TypeError: Invalid URL` على `/healthz/`, `/app/`, `/app/api/kernel/health/` — بعد: `400` على الأربعة، والخادم يبقى يخدم |
| 9 | فحص backslash قبل/بعد | قبل: `GET /\evil.example/app` ⇒ `301 Location: /\evil.example/app/` (يفسّره المتصفح `//evil.example/app/`) — بعد: `400`؛ `/%5Cevil.example/app` ⇒ `301 Location: /%5Cevil.example/app/` (same-origin) |

### 2.1 حالات سلبية مقيسة

- `Host: example.com:65536`, `Host: example.com:8080:8080`, `Host: [::1]:abc`, `Host: ''` ⇒ **400** ولا نص `Invalid URL` في الجسم.
- `Host` سليم على `/healthz/` ⇒ **503** (السلوك المقصود بلا DB/Auth)، وبعده الخادم يبقى حيًّا.
- `/\evil.example/app` ⇒ 400؛ مسار عادي `/terms` ⇒ 301 `/terms/`؛ `/knowledge` ⇒ 301 `/docs/`؛ `/` ⇒ 200.
- استعلام يحتوي `\` (`/search/?q=a\b`) غير مرفوض بحراسة المسار (الحراسة على المسار فقط).

## 3. ربط كل advisory بمسار التبعية والأثر

الجدول الكامل والتحليل في `docs/DEPENDENCY-SECURITY-2026-11-10.md` §2. المسارات الفعلية:

| الحزمة | المسار | النوع | الأثر |
|---|---|---|---|
| `astro@6.4.8` | `<root> → astro` | runtime SSR | 6 advisories؛ واحد فقط حرج (AVIF) وغير قابل للوصول |
| `@astrojs/node@10.1.4` | `<root> → @astrojs/node` | runtime HTTP | 2 advisories؛ **كلاهما أُعيد إنتاجهما محليًا** وأُغلقا عند المدخل |
| `sharp@0.34.5` | `astro → (optional) sharp` + 24 ثنائية `@img/sharp-*` | لا يُحمَّل | 3 advisories عالية؛ `sharp` بلا أي مرجع في `dist/` |
| `esbuild@0.27.7` | `astro → esbuild`, `vite → esbuild` | build-only | advisory واحد منخفض (Windows dev server)؛ لا وجود له في `dist/` إلا داخل نص رسالة خطأ |

## 4. ما تغيّر (diff محدود)

```
 .github/security-allowlist.yml  | 113 ++++++++++++++++++++++++++++++--
 package.json                    |   4 +-
 scripts/server.mjs              |  46 +++++++++++--
 scripts/verify-node-runtime.mjs |  45 ++++++++++++
 4 files changed, 197 insertions(+), 11 deletions(-)
 + scripts/verify-dependency-posture.mjs (جديد، 7 فحوص)
 + docs/DEPENDENCY-SECURITY-2026-11-10.md
 + Audit/p16-dependency-security-2026-11-10/ (تقرير + لقطة audit + مسارات + تراخيص)
```

1. `scripts/server.mjs` — رفض `Host` غير صالح (400)، رفض `\` خام في المسار (400)، والتقاط رفض المعالجة بدل `unhandledRejection`. يسدّ `CVE-2026-102984` و`GHSA-r557-wffq-wvrc` في هذا النشر.
2. `package.json` — إزالة `packageManager: pnpm@10.19.0` و`engines.pnpm`: كانا يعلنان مدير حزم بلا lockfile مقابل `package-lock.json` المستخدم فعليًا في `render.yaml`.
3. `.github/security-allowlist.yml` — 11 استثناءً موقعًا (مالك + `2027-02-08` + `P16-AR04`) لكل advisory غير قابل للوصول أو مُعالَج عند المدخل؛ والحرج **لم يُدرج** لأنه يتطلب موافقة المؤسس.
4. `scripts/verify-node-runtime.mjs` — حالتان جديدتان: A10 (`Host` مشوّه) وA11 (backslash/protocol-relative).
5. `scripts/verify-dependency-posture.mjs` — يعيد إثبات شروط الاستثناءات من الكود والبناء بلا شبكة.

لم تُعدَّل أي حزمة ولم يُمسّ `package-lock.json`؛ ملفات المستخدم القائمة (`src/components/ProductCatalog.astro`, `Audit/EXECUTION-PROMPTS.md`) لم تُمَس.

## 5. التراخيص

429 مدخلًا: MIT 359، Apache-2.0 20، ISC 16، BSD-2 9، BSD-3 3، BlueOak 3، CC0 2، 0BSD 1، Python-2.0 1، LGPL-3.0-or-later 14 (كلها ثنائيات `@img/sharp-*` الاختيارية).

- لا GPL/AGPL/SSPL، ولا مدخل بلا ترخيص.
- LGPL لـlibvips: ربط ديناميكي واستخدام كخدمة ⇒ لا التزام نسخ للكود؛ يلزم إرفاق النص وإتاحة إعادة الربط فقط إن شُحنت الثنائيات.
- التفصيل: `licenses-2026-11-10.txt`.

## 6. المخاطر المتبقية

1. **`GHSA-26w7-cxv4-gfx2` (critical، astro):** غير قابل للاستغلال اليوم (لا `astro:assets`، لا `getImage`، لا `<Image/>`، لا `avif`، لا `image:` في الإعداد، ولا `/_image` في `dist/`؛ D2 PASS). لكنه **غير مُتنازَل عنه**: إدخال critical في الـallowlist يحتاج موافقة المؤسس صريحة، وهذا خارج تفويض هذا الدور.
2. **الإصلاح الجذري يحتاج ترقية رئيسية:** `astro ≥ 7.3.2` + `@astrojs/node ≥ 11.1.3` + Node `≥ 22.23.4` (المثبّت في `render.yaml` هو `22.22.2`). الحراسة الحالية تُغلق المسارين القابلين للاستغلال، لكن الحزم نفسها تبقى قديمة.
3. **لا يوجد تطبيق آلي للـallowlist:** `.github/workflows/ci-build-guard.yml` مُشار إليه في الملف وغير موجود. لم يُنشأ (خارج التفويض).
4. **التحقق الحي غير ممكن:** لا push، لذا سلوك حراسة `Host` على Render (هل يمرّر الـedge مضيفًا مشوّهًا؟) غير مقيس. القياس محلي على نفس مدخل الإنتاج `scripts/server.mjs`.
5. **اعتماديات مباشرة غير مستخدمة** (`react-useanimations`, `@neon/config`, `@neon/env`) — سطح توريد إضافي، خارج نطاق AR04 ولم يُحذف.

## 7. معيار القبول

| الشرط | الحالة |
|---|---|
| لا مخاطر عالية قابلة للاستغلال بلا معالجة أو استثناء موقع | **PASS** — العاليتان القابلتان للاستغلال (`@astrojs/node`) أُغلقتا عند المدخل ومُوثّقتان؛ العاليات الثلاث في `sharp` غير قابلة للوصول ومُوثّقة؛ الحرج غير القابل للوصول بلا تنازل صريح |
| lockfile قابل للتكرار | **PASS** — lockfile واحد v3، `npm ci` exit 0، وأُزيل تعارض pnpm |
| تقرير يربط كل advisory بمسار التبعية والأثر | **PASS** — §3 + `dependency-paths.txt` + `docs/DEPENDENCY-SECURITY-2026-11-10.md` |

## 8. الحالة

- **AR04: DONE LOCAL** — الفحص والتقييم والتقرير والاستثناءات الموقّعة موجودة، والحراستان مقيسة قبل/بعد.
- **P16: PARTIAL** — يتبقى: (أ) موافقة المؤسس على استثناء critical واحد، (ب) الترقية الرئيسية المصرّح بها مع رفع Node، (ج) تحقق حي بعد push، (د) تطبيق آلي للـallowlist.

`PASS ≠ RELEASED` — لا استنتاج عن جاهزية Beta/Commercial من هذه النتائج.

## 9. خطة التراجع

```bash
git checkout -- scripts/server.mjs scripts/verify-node-runtime.mjs package.json .github/security-allowlist.yml
rm scripts/verify-dependency-posture.mjs
```

لا rollback لـ`package-lock.json` لأنه لم يتغير في هذا العمل. إعادة بناء بعد التراجع: `npm run build`.
