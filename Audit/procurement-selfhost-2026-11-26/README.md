# Procurement & self-hosted readiness — فهرس الحزمة

**التاريخ:** 2026-11-26 | **المشروع:** BRIGHTAI / AIGAS | **HEAD:** `f122aaf37b38ab2c2d7f4834d67479e0303428e9`

حزمة أدلة محلية للمراجعة فقط. لا نشر، لا شراء، لا توقيع، لا ترحيل، لا استعادة إنتاج. كل بطاقة في مركز الثقة تقابل دليلًا قابلًا للمراجعة أو حالة صريحة، لا شعارًا تسويقيًا.

| الملف | الغرض | الحالة |
|---|---|---|
| `README.md` | الفهرس ومفتاح الحالات | DONE |
| `SELF-HOST-READINESS-REPORT.ar.md` | التقرير العربي للطباعة | DONE |
| `deployment-package.manifest.json` | manifest مع تجزئات وحدود توقيع | DONE / NOT_SIGNED |
| `SHA256SUMS.txt` | تجزئات محلية للتحقق | DONE |
| `TRUST-CENTER-CARDS.json` | ربط بطاقات مركز الثقة بالأدلة | DONE |
| `DEVELOPER-WORKBENCH-ENDPOINTS.md` | نقاط النهاية الحقيقية فقط | VERIFIED_SOURCE |
| `PROCUREMENT-EVIDENCE-INDEX.md` | أدلة المشتريات والفجوات | DONE |
| `DPA-RETENTION-DRAFT.md` | مسودة DPA/احتفاظ لمراجعة مختصة | DRAFT |
| `ACCEPTANCE-AND-RESTORE-RUNBOOK.md` | خطة القبول والاستعادة المعزولة | NOT RUN |
| `AIR-GAP-BOUNDARY.md` | حدود on-prem/air-gap | BLOCKED |
| `EXECUTION-LOG.md` | سجل التنفيذ والتصحيح | DONE |

## مفتاح الحالات

- `SOURCE_PRESENT` / `VERIFIED_SOURCE`: موجود في المصدر؛ لا يعني تشغيلًا أو إنتاجًا.
- `PARTIAL`: أساس مصدر موجود لكنه غير مكتمل أو غير مُشغّل.
- `NOT_VERIFIED`: لا دليل مستقل كافٍ.
- `BLOCKED`: يحتاج قرار مالك أو بيئة معزولة أو مزودًا محليًا.
- `NOT_RUN` / `DRAFT`: خطة أو مسودة لم تُنفّذ أو تُعتمد.

## قواعد حاكمة

1. `PASS ≠ RELEASED`؛ نجاح build أو اختبار محلي لا يعني جاهزية إنتاج.
2. لا ادعاء on-prem/air-gap من وجود Blueprint أو من استخدام Groq.
3. لا أسرار في الحزمة؛ أسماء المتغيرات فقط.
4. لا نشر ولا شراء ولا توقيع ولا دفع git دون تفويض صريح منفصل.
5. MagicPath MCP غير متاح (حصة 50/50 مستنفدة)؛ النموذج لم يُعدَّل، والربط قدّم كملف `TRUST-CENTER-CARDS.json`.
