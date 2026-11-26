# جاهزية الشراء والاستضافة الذاتية — BRIGHTAI / AIGAS

**التاريخ:** 2026-11-26 | **HEAD:** `f122aaf37b38ab2c2d7f4834d67479e0303428e9` | **الإصدار:** 2.0.0

> تقرير عربي للطباعة والمراجعة. ليس شهادة امتثال، ولا عرضًا تجاريًا، ولا إقرار جاهزية إنتاج. كل حالة مرتبطة بمصدر محلي قابل للمراجعة أو بحالة صريحة. النجاح محليًا يعني فحصًا مصدرًا فقط: `PASS ≠ RELEASED`.

## 1. الملخص التنفيذي

| البند | الحالة | الخلاصة |
|---|---|---|
| حزمة نشر قابلة للتكرار | PARTIAL | Blueprint لـRender بعقد Node 22.23.5/npm 10.9.7 و`npm ci && npm run build`؛ لا Dockerfile/Compose/Helm/مُثبّت on-prem. |
| سياسة الأسرار | PARTIAL | أسماء فقط في `.env.example`، وقيم تُحقن في Render؛ التدوير والإثبات من المالك. |
| سياسة egress | PARTIAL | فحص readiness يتصل بـJWKS خارجي عند تفعيله، وGroq مزود خارجي مقيّد بالميزانية والاعتماد. |
| on-prem / air-gap | BLOCKED | لا مزود محلي ولا منع egress ولا حزمة offline. |
| النسخ والاستعادة | NOT RUN | `NEON-BRANCH-PROTECTION-RUNBOOK.md` حالة PLAN ONLY — NOT EXECUTED. |
| SBOM والتحديثات | PARTIAL | `package-lock.json` مثبّت كمدخل؛ لا SBOM رسمي ولا توقيع. |
| مركز الثقة | PARTIAL | البطاقات مرتبطة بأدلة أو بحالة NOT_VERIFIED؛ لا شعارات اعتماد. |
| Developer Workbench | VERIFIED_SOURCE | نقاط حقيقية من `routes.mjs` و`request-schemas.mjs`؛ المسار الوهمي مستبعد. |
| القبول النهائي | NOT RUN | لا تثبيت معزول، لا استعادة، لا فحص تسريب، لا توقيع. |

## 2. المصادر وحدودها

- `render.yaml`, `package.json`, `package-lock.json`, `.env.example`, `astro.config.mjs`،
- `docs/DATA-PRIVACY-AND-SECURITY.md` — يميّز `SOURCE_PRESENT` عن `TARGET_REQUIREMENT` و`NOT_VERIFIED`،
- `docs/NEON-BRANCH-PROTECTION-RUNBOOK.md` — خطة حماية/نسخ/استعادة/تراجع، `PLAN ONLY — NOT EXECUTED`،
- `src/server/api/routes.mjs` و`src/server/api/request-schemas.mjs` — سطح API وعقود الطلبات،
- `Audit/magicpath-p10-2026-11-26/UI-ACTION-BINDING-REGISTER.md` — حالة Trust Center وDeveloper Workbench: `NOT_VERIFIED`،
- `.agents/mind/01-mind-latest.md` — سجل تحقق تاريخي (build محلي PASS، Render FAIL على Node 22.22.2، NO-GO، RLS 87/90)؛ لا يُعد حالة مُعاد فحصها هنا.

## 3. معمارية النشر

| المكوّن | الواقع المصدر | الأثر |
|---|---|---|
| التطبيق | Astro 7.4.13 + `@astrojs/node` 11.1.14، `npm start` → `scripts/server.mjs` | Node SSR مُدار؛ بلا صورة حاوية. |
| المنصة | Render service `brightai-site`، `autoDeployTrigger: off` | استضافة مُدارة؛ ليست on-prem. |
| الصحة | `/healthz` liveness، `/readyz/` readiness ويتصل بـJWKS عند `AIGAS_HEALTH_AUTH_PROBE=true` | خروج شبكي حتى في الفحص حين يُفعّل. |
| البوابة | `AIGAS_APP_ENABLED=false` حتى يسمح المالك | لا يُادّى تفعيل تلقائي. |
| البيانات | Neon Postgres بدور `aigas_runtime` و`AIGAS_REQUIRE_RLS=true` | يعتمد على مزود خارجي؛ RLS والأدوار تحتاج إعادة فحص. |
| الهوية | Neon Auth JWKS بعيد | اتصال خارجي؛ لا SSO مؤسسي مُثبت محليًا. |
| الذكاء | Groq بمفتاح/نموذج وميزانية وسجل ميزانية | مزود خارجي؛ لا يدخل air-gap. |

## 4. حزمة النشر القابلة للتكرار

```
npm ci
npm run build
npm start
GET /healthz/
GET /readyz/
```

- Node `22.23.5` وnpm `10.9.7` مثبّتان؛ القفل المُلتزم `package-lock.json` لا pnpm.
- Blueprint يشترط health check على `/readyz/`، ويحقن الرقم والاسم وSHA من Render عند التوفر.
- لا `Dockerfile` ولا `docker-compose.yml` ولا Helm chart ولا دليل تثبيت محلي.
- أي إضافة حاوية الآن أصل جديد غير مُختبر؛ لا يُقدَّم كـ"جاهز".

## 5. الأسرار

- التشغيل: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`, `GROQ_API_KEY`, `GROQ_MODEL` بـ`sync: false`.
- المشغّل فقط: `DATABASE_URL_UNPOOLED`, `NEON_PROJECT_ID`, `NEON_BRANCH`, `AIGAS_SC_GROQ_API_KEY`, ومسار سجل الميزانية.
- لا قيم أسرار في المستودع أو الحزمة أو التقارير أو الـmanifest.
- الحالة: PARTIAL — التسمية والفصل مصدريان؛ التدوير الفعلي وإثبات الحماية من المالك.

## 6. egress وحدود air-gap

- readiness يتصل بمضيف JWKS خارجي (مهلة 2 ثانية، كاش 15 ثانية) عند تفعيل `AIGAS_HEALTH_AUTH_PROBE`.
- Groq مزود خارجي مع قيود ميزانية وتزامن واعتماد؛ هذه ضوابط استخدام لا ادعاء عزلة.
- لا حزمة تمنع egress، ولا مزود نموذج محلي، ولا تهيئة endpoint داخلي.

**شروط air-gap غير المحققة:** مزود محلي أو تعطيل كامل للذكاء الاصطناعي؛ منع egress مع دليل فحص؛ Postgres وobjects محليان؛ حزمة offline موقّعة؛ قرار مالك بتصنيف البيانات.

## 7. النسخ والاستعادة

- `docs/NEON-BRANCH-PROTECTION-RUNBOOK.md`: `PLAN ONLY — NOT EXECUTED`؛ لا فرع أنشئ ولا حماية غيّرت ولا ترحيل طُبّق.
- لقطة قراءة فقط مؤرخة 2026-11-09: لا snapshots ولا جدول نسخ، والاحتفاظ 21600 ثانية، وحماية الفرع `false`؛ يجب إعادة الجرد قبل أي قرار.
- لا تدريب استعادة معزول ولا مراجع مستقل؛ لا يُقبل اعتبار تجزئة أو لقطة دليل استعادة.

## 8. SBOM والتحديث

- `package-lock.json` مثبّت (تجزئته في الـmanifest)، لكنه ليس SPDX/CycloneDX.
- لا أداة أو أمر SBOM معتمد في `package.json`، ولم يُولَّد SBOM هنا.
- التحديث عبر `npm ci` يمنع الانحراف؛ أي ترقية تعيد البناء والتحقق وتدوين SHA جديد.
- لا توقيع على أي أرشيف أو SBOM: `NOT_SIGNED`.

## 9. سيادة البيانات

- `docs/DATA-PRIVACY-AND-SECURITY.md` يصنّف الضوابط إلى `SOURCE_PRESENT` و`TARGET_REQUIREMENT` و`BLOCKED` و`NOT_VERIFIED`؛ لا يُقرأ كشهادة.
- عزل المؤسسات وRLS له وثيقة مستقلة وحالة تحقق جزئية (RLS 87/90 في سجل قديم).
- الإقليم وشرعية النقل عبر الحدود غير محققين؛ لا تُفترض من إعدادات مزود.

## 10. التثبيت والترقية والتراجع

1. التثبيت: checkout على SHA مثبّت → أسرار في مدير أسرار الخادم → `npm ci` → build → start → `/readyz/`. لم يُنفّذ هنا.
2. الترقية: مراجعة الترحيلات والأدوار أولًا؛ أي تغيير على production يحتاج خطة تراجع ونسخة قابلة للاستعادة.
3. التراجع: عبر إجراء مشغّل مُخول على Render؛ لا يعني تراجع قاعدة البيانات تلقائيًا.
4. الإثبات: رقم التغيير + SHA + معرّف Deploy + هوية المنفّذ + نتيجة فحص مستقلة.

## 11. ربط MagicPath

- MagicPath MCP غير متاح (حصة 50/50 مستنفدة)؛ النموذج لم يُعدَّل، ولا يُدّعى تعديله.
- `TRUST-CENTER-CARDS.json` يربط كل بطاقة بدليل أو حالة صريحة؛ لا تحويل "قيد المراجعة" إلى شعار.
- Developer Workbench يعرض مسارات `routes.mjs` الحقيقية فقط؛ `/api/governance/evaluate` غير موجود ويُستبعد.

## 12. معايير القبول

| المعيار | الحالة |
|---|---|
| تثبيت من SHA في بيئة معزولة | NOT RUN |
| تحقق التجزئات | PARTIAL (محسوبة محليًا فقط) |
| استعادة معزولة بنتيجة مستقلة | NOT RUN |
| فحص عدم تسريب وegress | NOT RUN |
| توقيع قابل للتحقق | BLOCKED |
| traceability كامل | PARTIAL |

## 13. ادعاءات ممنوعة

on-prem أو air-gap؛ SOC 2/ISO 27001/HIPAA/GDPR؛ إقامة بيانات سعودية؛ استعادة مؤكدة أو RPO/RTO؛ SBOM موقّع؛ "جاهز للإنتاج" أو "معتمد أمنيًا" أو SLA. لا تستخدم صيغة 100% دون نطاق دليل.
