# ترتيب ومراحل تنفيذ برنامج العلاج — REMEDIATION EXECUTION ORDER

> **القاعدة الحاكمة:** التنفيذ الصارم حسب الترتيب التالي. لا يجوز البدء في أي برومبت قبل استيفاء اعتماداته واجتياز بوابة التكامل السابقة له.

---

## المرحلة 0: تأسيس خط الأساس وتجميد الواقع
1. **`PROMPT-00-REMEDIATION-BASELINE-FREEZE`**
   - **التبعية:** لا يوجد (نقطة البداية).
   - **التوازي:** غير مسموح (يجب أن يعمل منفرداً).
   - **يحجب:** كافة البرومبتات التالية.
   - **الدليل المطلوب:** ملف `PROMPT-00-EVIDENCE.md` يثبت HEAD وحالة المستودع.

---

## المرحلة 1: القضاء على العيوب القاتلة P0 وفك حجب الاختبارات
2. **`PROMPT-01-P0-CORRECTNESS-GATE-UNBLOCK`**
   - **التبعية:** `PROMPT-00`.
   - **التوازي:** غير مسموح (حرجة للغاية).
   - **يحجب:** بوابة التكامل A وكافة أعمال التطوير.
   - **الدليل المطلوب:** ملف `PROMPT-01-EVIDENCE.md` يثبت نجاح 74 سويت وحدة و 28 سويت E2E بالكامل.

🛑 **بوابة التكامل A (Gate A — Core Correctness Gate)**
- تشغيل السلسلة الكنسية التراكمية: `pnpm run test` + `node scripts/e2e-acceptance.mjs`.
- الشرط: **74/74 Unit Suites PASS + 28/28 E2E Suites PASS**.

---

## المرحلة 2: موثوقية النواة — البيانات، الأمان، وتدفقات الجودة
3. **`PROMPT-02-DATABASE-TRANSACTIONS-IDEMPOTENCY`**
   - **التبعية:** Gate A.
   - **التوازي:** يمكن العمل بالتوازي مع `PROMPT-03`.
   - **يحجب:** `PROMPT-04`.
   - **الدليل:** `PROMPT-02-EVIDENCE.md`.

4. **`PROMPT-03-SECURITY-IAM-SECRETS-HARDENING`**
   - **التبعية:** Gate A.
   - **التوازي:** يمكن العمل بالتوازي مع `PROMPT-02`.
   - **يحجب:** `PROMPT-04`.
   - **الدليل:** `PROMPT-03-EVIDENCE.md`.

5. **`PROMPT-04-QC-WORKFLOW-LAB-CHANGE-REQUESTS`**
   - **التبعية:** `PROMPT-02`, `PROMPT-03`.
   - **التوازي:** لا.
   - **يحجب:** `PROMPT-05` و Gate B.
   - **الدليل:** `PROMPT-04-EVIDENCE.md`.

6. **`PROMPT-05-REPORTING-PDF-ARABIC-ENGINE`**
   - **التبعية:** `PROMPT-04`.
   - **التوازي:** لا.
   - **يحجب:** Gate B.
   - **الدليل:** `PROMPT-05-EVIDENCE.md`.

🛑 **بوابة التكامل B (Gate B — Workflows & Data Gate)**
- تشغيل: `test:database-100`, `test:security-hygiene`, `scripts/test-report-pdf-arabic.mjs`.
- الشرط: خلو كامل من تعارض المعاملات وعمل محرك الخط العربي بنجاح.

---

## المرحلة 3: تجربة المستخدم، النماذج، والبيانات التفاعلية
7. **`PROMPT-06-ADVANCED-FORMS-AUTOSAVE-DRAFT`**
   - **التبعية:** Gate B.
   - **التوازي:** يمكن بالتوازي مع `PROMPT-07` و `PROMPT-08`.
   - **يحجب:** `PROMPT-09`.
   - **الدليل:** `PROMPT-06-EVIDENCE.md`.

8. **`PROMPT-07-DASHBOARD-DATA-VIZ-ANALYTICS`**
   - **التبعية:** Gate B.
   - **التوازي:** يمكن بالتوازي مع `PROMPT-06` و `PROMPT-08`.
   - **يحجب:** `PROMPT-10`.
   - **الدليل:** `PROMPT-07-EVIDENCE.md`.

9. **`PROMPT-08-TABLES-SEARCH-PAGINATION`**
   - **التبعية:** Gate B.
   - **التوازي:** يمكن بالتوازي مع `PROMPT-06` و `PROMPT-07`.
   - **يحجب:** `PROMPT-11`.
   - **الدليل:** `PROMPT-08-EVIDENCE.md`.

---

## المرحلة 4: إمكانية الوصول، نظام التصميم، والأداء
10. **`PROMPT-09-ACCESSIBILITY-KEYBOARD-SEMANTICS`**
    - **التبعية:** `PROMPT-06`.
    - **التوازي:** يمكن بالتوازي مع `PROMPT-10`.
    - **يحجب:** Gate C.
    - **الدليل:** `PROMPT-09-EVIDENCE.md`.

11. **`PROMPT-10-DESIGN-SYSTEM-UI-CONSISTENCY`**
    - **التبعية:** `PROMPT-07`.
    - **التوازي:** يمكن بالتوازي مع `PROMPT-09`.
    - **يحجب:** Gate C.
    - **الدليل:** `PROMPT-10-EVIDENCE.md`.

12. **`PROMPT-11-PERFORMANCE-OBSERVABILITY-SRE`**
    - **التبعية:** `PROMPT-08`.
    - **التوازي:** يمكن بالتوازي مع `PROMPT-12`.
    - **يحجب:** Gate C.
    - **الدليل:** `PROMPT-11-EVIDENCE.md`.

13. **`PROMPT-12-AI-GOVERNANCE-EVALS-HITL-UX`**
    - **التبعية:** Gate B.
    - **التوازي:** يمكن بالتوازي مع `PROMPT-11`.
    - **يحجب:** Gate C.
    - **الدليل:** `PROMPT-12-EVIDENCE.md`.

14. **`PROMPT-13-TECH-DEBT-HYGIENE-DOCS`**
    - **التبعية:** `PROMPT-09`, `PROMPT-10`, `PROMPT-11`, `PROMPT-12`.
    - **التوازي:** لا (تجميعي وتنظيف أخير).
    - **يحجب:** Gate C.
    - **الدليل:** `PROMPT-13-EVIDENCE.md`.

🛑 **بوابة التكامل C (Gate C — Release Candidate Local Gate)**
- تشغيل: `ASTRO_TELEMETRY_DISABLED=1 pnpm astro check` (0 أخطاء) + `pnpm build` + كامل سويتات الاختبارات الكنسية.
- الشرط: **Local Technical Readiness = 100%**.

---

## المرحلة 5: التحقق البشري الميداني والعمليات السحابية (مسارات متوازية)

### المسار البشري (Human Track):
15. **`PROMPT-H1-QC-STAFF-UAT`** (جلسات قبول المستخدمين الميدانية).
16. **`PROMPT-H2-ACCESSIBILITY-VOICEOVER-NVDA`** (فحص قارئات الشاشة للمكفوفين).
17. **`PROMPT-H3-FIELD-LAB-ERGONOMICS-WALK`** (بيئة المختبر والقفازات والباركود).
18. **`PROMPT-H4-PENETRATION-TESTING-SECURITY-AUDIT`** (فحص الاختراق الأمني الخارجي).
19. **`PROMPT-H5-QC-LEGAL-REGULATORY-SIGNOFF`** (الاعتماد التنظيمي 21 CFR Part 11 و PDPL).

### المسار السحابي الخارجي (External Cloud Track):
20. **`PROMPT-E1-STAGING-DEPLOYMENT-SMOKE-TEST`** (نشر Staging واختبارات الدخان).
21. **`PROMPT-E2-PRODUCTION-DISASTER-RECOVERY-DRILL`** (تمرين استعادة الكوارث السحابي).
22. **`PROMPT-E3-PRODUCTION-RUM-LOAD-BASELINE`** (قياس الأداء الحقيقي RUM واختبار الحمل).
23. **`PROMPT-E4-INCIDENT-RESPONSE-ROLLBACK-DRILL`** (محاكاة الأعطال والاستجابة للحوادث).

🛑 **بوابة التكامل D (Gate D — External Evidence Closure Gate)**
- اكتمال توقيع كافة محاضر الـ UAT، فحص VoiceOver، تقرير فحص الاختراق، وتمرين الاستعادة السحابي.

---

## المرحلة 6: التدقيق وإعادة القياس المستقل النهائي
24. **`PROMPT-FINAL-INDEPENDENT-100-REAUDIT`**
   - **التبعية:** Gate D (اجتياز جميع المراحل والبرومبتات السابقة بنجاح).
   - **التوازي:** غير مسموح إطلاقاً.
   - **المهمة:** إعادة تدقيق النظام بالكامل من الصفر عبر الـ 100 مجال وإصدار القرار النهائي: **GO / NO-GO**.
