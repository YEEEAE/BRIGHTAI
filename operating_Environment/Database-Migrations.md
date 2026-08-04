# تحليل ملفات Database Migrations + Prompts التنفيذ لربط الـ Frontend بالـ Backend

## 1. تحليل ملفات الـ Database Migrations

### 📋 Migration 1: `20260803000000_evaluation_certificates`

يحتوي على **5 جداول** تشكل العمود الفقري لمنصة التقييم:

#### 1.1 `signing_keys` - سجل مفاتيح التوقيع الرقمي
```sql
CREATE TABLE "signing_keys" (
  "id" TEXT PRIMARY KEY,
  "publicKeyId" TEXT UNIQUE,      -- v1, v2, ...
  "algorithm" TEXT DEFAULT 'Ed25519',
  "publicKeyPem" TEXT,
  "signedBy" TEXT DEFAULT 'يزيد البديوي',
  "createdAt" TIMESTAMP,
  "revokedAt" TIMESTAMP           -- Key rotation support
);
```
**الدور**: يدعم **Key Rotation** - مفاتيح جديدة تُضاف والقديمة تُسحب دون كسر الشهادات القديمة.

#### 1.2 `evaluation_runs` - تشغيل التقييمات
```sql
CREATE TABLE "evaluation_runs" (
  "id" TEXT PRIMARY KEY,
  "evaluationId" TEXT UNIQUE,
  "parentEvaluationId" TEXT,       -- Replay lineage
  "status" "EvalRunStatus",        -- running/complete/failed
  "gate" "EvalGate",               -- passed/blocked/incomplete
  "environment" "EvalEnvironment", -- demo/live
  "provider" TEXT,                 -- groq/gemini/simulated
  -- Full setup provenance:
  "datasetId/Version/Hash" TEXT,
  "policyId/Version/Hash" TEXT,
  "modelId/Name/Version/Provider" TEXT,
  "promptId/Version" TEXT,
  -- Metrics:
  "totalCases/completedCases/failedCases/criticalCount",
  "costSar" DECIMAL(10,4),
  "p50Ms/p95Ms/p99Ms" INTEGER,
  -- Deterministic hashes:
  "inputHash/outputHash/runHash" TEXT,
  "immutable" BOOLEAN
);
```
**الدور**: سجل كامل للتقييم مع **provenance** (من أين جاء) و**partial saving** (حفظ جزئي عند الفشل).

#### 1.3 `evaluation_cases` - نتائج الحالات الفردية
```sql
CREATE TABLE "evaluation_cases" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT REFERENCES evaluation_runs ON DELETE CASCADE,
  "caseId" TEXT,
  "traceId" TEXT,
  "state/expected/actual/riskLevel" TEXT,
  "piiTypes" JSONB,
  "injectionDetected" BOOLEAN,
  "scorerResults" JSONB,
  "costSar/latencyMs",
  "inputHash/outputHash" TEXT,
  UNIQUE(runId, caseId)
);
```
**الدور**: نتائج كل حالة مع **scorer details** و **PII types**.

#### 1.4 `evaluation_certificates` - الشهادات الموقعة رقمياً
```sql
CREATE TABLE "evaluation_certificates" (
  "id" TEXT PRIMARY KEY,
  "certificateId" TEXT UNIQUE,      -- CERT-2026-00042
  "runId" TEXT REFERENCES evaluation_runs,
  "signedBy" TEXT DEFAULT 'يزيد البديوي',
  "environment" "EvalEnvironment",
  "gate" "EvalGate",
  "signedAt" TIMESTAMP,
  "signedByKeyId" TEXT DEFAULT 'v1',
  "signature" TEXT,                 -- Ed25519 signature
  "payloadDigest" TEXT,             -- SHA-256 of payload
  "verifyUrl" TEXT,                 -- Public verification URL
  "revokedAt/By/Reason"             -- Revoke-only, never delete
);
```
**الدور**: شهادات **Cryptographically signed** مع **revocation-only** (لا حذف أبداً).

#### 1.5 `evaluation_audit_events` - سجل التدقيق بسلسلة هاش
```sql
CREATE TABLE "evaluation_audit_events" (
  "id" TEXT PRIMARY KEY,
  "evaluationId/certificateId" TEXT,
  "action/actor" TEXT,
  "metadata" JSONB,
  "prevHash" TEXT,                  -- Hash chain
  "hash" TEXT,                      -- Current hash
  "createdAt" TIMESTAMP
);
```
**الدور**: **Hash chain** لمنع التعديل (tamper-evidence).

---

### 📋 Migration 2: `20260803010000_evaluation_certificates_payload`

```sql
ALTER TABLE "evaluation_certificates" ADD COLUMN "payload" JSONB;
```
**الدور**: تخزين الـ **canonical payload** الكامل لإعادة بناء الـ bytes الموقعة بدقة (reproducibility).

---

### 📋 Migration 3: `20260804000000_evaluation_table_grants`

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  signing_keys, evaluation_runs, evaluation_cases,
  evaluation_certificates, evaluation_audit_events
TO brightai_app, brightai_service;
```
**الدور**: حل مشكلة "permission denied" في integration tests و API.

---

## 2. اكتشاف جوهري: الـ Backend موجود فعلاً!

❌ **تقريري السابق كان غير دقيق** عندما قلت "No Real Backend".
✅ **الحقيقة**: PostgreSQL database موجودة مع schema كامل ومحترف.

### الفجوة الحقيقية الآن:
**الـ Frontend (src/pages/kernel) لا يتصل بالـ Database** — يستخدم `localStorage` فقط.


---

### 🎯 **PROMPT 2: ربط صفحة Eval بالـ Database**

**الهدف**: تحديث `/kernel/eval/` ليستخدم الـ Database بدلاً من `localStorage`.

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI.

المهمة:
تحديث `src/pages/kernel/eval.astro` لتستخدم الـ API الجديد بدلاً من `kernel-eval-store.js`.

الملفات المطلوبة:

1. src/pages/kernel/eval.astro
   - استبدل `window.KernelEvalStore` بـ `fetch('/api/kernel/evaluations')`
   - استخدم React Query أو SWR للـ caching
   - Show loading states أثناء الـ fetch
   - Handle errors gracefully

2. src/client/eval-api.ts (new)
   - TypeScript client للـ API
   - Functions:
     - listEvaluations(filters)
     - getEvaluation(id)
     - createEvaluation(data)
     - updateEvaluation(id, data)
     - issueCertificate(runId)
   - Return typed responses
   - Handle 401/403/429 errors

3. src/pages/kernel/eval.astro
   - Add "Environment" toggle (demo/live)
   - Show "Immutable" badge للـ published runs
   - Show "Parent Run" link للـ replays
   - Show cost metrics من DB (costSar)
   - Show latency percentiles (p50/p95/p99)

القواعد:
- لا تحذف `kernel-eval-store.js` بعد (نحتاجه للـ fallback)
- استخدم `localStorage` كـ cache layer
- Show "Offline Mode" badge إذا فشل الـ API
- Sync local state مع DB عند النجاح
- Preserve all existing UI/UX
- RTL support كامل
- Accessibility: loading states announce للـ screen readers

معايير القبول:
✅ Evaluations تُحفظ في PostgreSQL
✅ Certificates تُوقّع وتُحفظ
✅ Audit events تُسجّل
✅ Offline mode يعمل (localStorage fallback)
✅ Loading states واضحة
✅ Error messages بالعربي
✅ TypeScript strict

الاختبارات:
```bash
pnpm test:eval:api
pnpm test:eval:ui
```

الأوامر:
```bash
pnpm dev
# افتح /kernel/eval/
# شغّل تقييم
# تحقق من PostgreSQL
```
```

---

### 🎯 **PROMPT 3: ربط صفحة Evidence بالـ Certificates**

**الهدف**: تحديث `/kernel/evidence/` لعرض الشهادات الحقيقية من DB.

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI.

المهمة:
تحديث `src/pages/kernel/evidence.astro` لعرض الشهادات من Database مع cryptographic verification.

الملفات المطلوبة:

1. src/pages/kernel/evidence.astro
   - استبدل mock data بـ `fetch('/api/kernel/certificates')`
   - Show certificate details: signedBy, signedAt, gate, environment
   - Add "Verify" button لكل certificate
   - Show revocation status (if revokedAt exists)
   - Show verifyUrl link

2. src/client/certificate-verifier.ts (new)
   - Function: verifyCertificate(certificateId)
   - Fetch certificate من API
   - Fetch public key من `signing_keys` table
   - Verify Ed25519 signature
   - Return { valid, signedBy, signedAt, revoked, reason }

3. src/pages/kernel/evidence.astro
   - Add verification modal
   - Show:
     - Certificate ID
     - Signed by
     - Signed at
     - Environment (demo/live)
     - Gate decision
     - Verification status (valid/invalid/revoked)
     - Hash chain validity
   - Add "Download PDF" button (generate from payload)
   - Add "Download JSON" button (raw payload)

القواعد:
- Never trust client-side verification (always verify server-side)
- Show clear "Revoked" badge للـ revoked certificates
- Show "Demo" badge للـ demo certificates
- Use Web Crypto API للـ verification (if available)
- Fallback إلى server-side verification
- RTL support
- Accessibility: verification status announce للـ screen readers

معايير القبول:
✅ Certificates تُعرض من DB
✅ Verification يعمل (client + server)
✅ Revoked certificates واضحة
✅ PDF generation يعمل
✅ JSON download يعمل
✅ Hash chain validity checked
✅ TypeScript strict

الاختبارات:
```bash
pnpm test:evidence:api
pnpm test:evidence:verification
pnpm test:evidence:ui
```

الأوامر:
```bash
pnpm dev
# افتح /kernel/evidence/
# اضغط "Verify" على certificate
# تحقق من النتيجة
```
```

---

### 🎯 **PROMPT 4: ربط صفحة Audit بالـ Hash Chain**

**الهدف**: تحديث `/kernel/audit/` لعرض audit events من DB مع hash chain verification.

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI.

المهمة:
تحديث `src/pages/kernel/audit.astro` لعرض audit events من Database مع tamper detection.

الملفات المطلوبة:

1. src/pages/kernel/audit.astro
   - استبدل mock data بـ `fetch('/api/kernel/audit')`
   - Show audit events: action, actor, metadata, timestamp
   - Add "Verify Hash Chain" button
   - Show prevHash/currentHash للـ events
   - Highlight broken chains

2. src/client/audit-verifier.ts (new)
   - Function: verifyHashChain(events)
   - Recompute hash لكل event:
     hash = SHA256(prevHash + action + actor + metadata + timestamp)
   - Compare مع stored hash
   - Return { valid, brokenAtIndex, reason }

3. src/pages/kernel/audit.astro
   - Add hash chain visualization (timeline)
   - Show "Tamper Detected" alert إذا broken
   - Add filters: action, actor, date range
   - Add export: CSV/JSON
   - Show event details modal

القواعد:
- Hash chain verification must be deterministic
- Show clear visual indicator للـ broken chains
- Use Web Crypto API للـ SHA-256
- Fallback إلى server-side verification
- Virtualize long lists (>1000 events)
- RTL support
- Accessibility: tamper detection announce للـ screen readers

معايير القبول:
✅ Audit events تُعرض من DB
✅ Hash chain verification يعمل
✅ Broken chains highlighted
✅ Filters تعمل
✅ Export يعمل (CSV/JSON)
✅ Virtualization للأداء
✅ TypeScript strict

الاختبارات:
```bash
pnpm test:audit:api
pnpm test:audit:hashchain
pnpm test:audit:ui
```

الأوامر:
```bash
pnpm dev
# افتح /kernel/audit/
# اضغط "Verify Hash Chain"
# تحقق من النتيجة
```
```

---

### 🎯 **PROMPT 5: ربط صفحة Stats بالـ Database Metrics**

**الهدف**: تحديث `/kernel/stats/` لعرض KPIs حقيقية من `evaluation_runs`.

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI.

المهمة:
تحديث `src/pages/kernel/stats.astro` لعرض KPIs من Database بدلاً من mock data.

الملفات المطلوبة:

1. src/pages/api/kernel/stats/index.ts (new)
   - GET: aggregate stats من `evaluation_runs`
   - Return:
     - totalRuns
     - totalCases
     - totalCostSar
     - avgLatencyMs (p50/p95/p99)
     - passRate (%)
     - blockedRate (%)
     - topModels (by usage)
     - topDatasets (by usage)
     - dailyRuns (last 30 days)

2. src/pages/kernel/stats.astro
   - استبدل mock KPIs بـ `fetch('/api/kernel/stats')`
   - Show real metrics من DB
   - Add "Environment" filter (demo/live)
   - Add "Date Range" filter
   - Show charts: daily runs, cost over time, gate distribution
   - Add "Top Models" table
   - Add "Top Datasets" table

3. src/client/stats-api.ts (new)
   - TypeScript client للـ stats API
   - Functions:
     - getStats(filters)
     - getDailyRuns(startDate, endDate)
     - getTopModels(limit)
   - Return typed responses

القواعد:
- Cache stats 5 دقائق (Redis)
- Use Chart.js للـ charts
- Show "Last Updated" timestamp
- Add "Refresh" button
- RTL support
- Accessibility: chart data available as table
- Mobile responsive charts

معايير القبول:
✅ KPIs تُعرض من DB
✅ Charts تعمل
✅ Filters تعمل
✅ Caching يعمل
✅ Refresh يعمل
✅ TypeScript strict
✅ Mobile responsive

الاختبارات:
```bash
pnpm test:stats:api
pnpm test:stats:ui
```

الأوامر:
```bash
pnpm dev
# افتح /kernel/stats/
# تحقق من KPIs
# جرب filters
```
```

---

### 🎯 **PROMPT 6: ربط صفحة Compliance بالـ Certificates**

**الهدف**: تحديث `/kernel/compliance/` لعرض حالة الامتثال بناءً على الشهادات الحقيقية.

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI.

المهمة:
تحديث `src/pages/kernel/compliance.astro` لحساب حالة الامتثال من الشهادات في DB.

الملفات المطلوبة:

1. src/pages/api/kernel/compliance/index.ts (new)
   - GET: calculate compliance status من `evaluation_certificates`
   - Logic:
     - For each framework (PDPL, NCA ECC, SDAIA, SFDA, SAMA, ISO 42001):
       - Count certificates with that framework in metadata
       - Count passed vs failed vs revoked
       - Calculate score (%)
   - Return:
     - frameworks: [{ name, score, passed, failed, revoked }]
     - overallScore
     - gaps: [{ framework, gap, impact, effort }]

2. src/pages/kernel/compliance.astro
   - استبدل mock compliance بـ `fetch('/api/kernel/compliance')`
   - Show real scores من DB
   - Add "Environment" filter (demo/live)
   - Show "Based on X certificates" note
   - Highlight gaps مع "Create Policy" CTA
   - Add "View Certificates" link لكل framework

3. src/client/compliance-api.ts (new)
   - TypeScript client للـ compliance API
   - Functions:
     - getCompliance(filters)
     - getFrameworkDetails(frameworkId)
   - Return typed responses

القواعد:
- Cache compliance 10 دقائق
- Show "Last Updated" timestamp
- Add disclaimer: "Estimates based on internal evaluations"
- RTL support
- Accessibility: scores announce للـ screen readers
- Mobile responsive

معايير القبول:
✅ Compliance scores تُحسب من DB
✅ Filters تعمل
✅ Gaps واضحة
✅ Links للشهادات تعمل
✅ Disclaimer موجود
✅ TypeScript strict

الاختبارات:
```bash
pnpm test:compliance:api
pnpm test:compliance:ui
```

الأوامر:
```bash
pnpm dev
# افتح /kernel/compliance/
# تحقق من scores
# جرب filters
```
```

---

### 🎯 **PROMPT 7: ربط صفحة Replay بالـ Parent Lineage**

**الهدف**: تحديث `/kernel/replay/` لعرض replay lineage من `parentEvaluationId`.

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI.

المهمة:
تحديث `src/pages/kernel/replay.astro` لعرض replay lineage من Database.

الملفات المطلوبة:

1. src/pages/kernel/replay.astro
   - استبدل mock data بـ `fetch('/api/kernel/evaluations?parentEvaluationId=X')`
   - Show replay timeline:
     - Parent run (original)
     - Replay 1 (with changes)
     - Replay 2 (with more changes)
   - Show diff between parent و replay
   - Show "Reproducibility" score
   - Add "Compare" button للـ side-by-side view

2. src/client/replay-api.ts (new)
   - TypeScript client للـ replay API
   - Functions:
     - getReplayLineage(evaluationId)
     - compareEvaluations(id1, id2)
   - Return typed responses

3. src/pages/kernel/replay.astro
   - Add timeline visualization
   - Show setup changes (highlighted)
   - Show case results diff
   - Show cost/latency diff
   - Add "Create New Replay" button

القواعد:
- Use deterministic diff (no Math.random)
- Show clear visual diff (added/removed/changed)
- RTL support
- Accessibility: diff announce للـ screen readers
- Mobile responsive timeline

معايير القبول:
✅ Replay lineage تُعرض من DB
✅ Timeline visualization تعمل
✅ Diff واضح
✅ Compare يعمل
✅ TypeScript strict

الاختبارات:
```bash
pnpm test:replay:api
pnpm test:replay:ui
```

الأوامر:
```bash
pnpm dev
# افتح /kernel/replay/
# اختر run
# تحقق من lineage
```
```

---

### 🎯 **PROMPT 8: بناء Public Certificate Verification Page**

**الهدف**: بناء صفحة عامة للتحقق من الشهادات بدون authentication.

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI.

المهمة:
بناء صفحة `/verify/[certificateId]` للتحقق العام من الشهادات.

الملفات المطلوبة:

1. src/pages/verify/[certificateId].astro (new)
   - Public page (no auth required)
   - Fetch certificate من API
   - Verify Ed25519 signature
   - Show:
     - Certificate ID
     - Signed by
     - Signed at
     - Environment
     - Gate decision
     - Verification status (VALID/INVALID/REVOKED)
     - Run details (anonymized)
   - Add "Download Certificate" button
   - Add "View Run Details" link

2. src/pages/api/verify/[certificateId].ts (new)
   - GET: public endpoint للـ certificate verification
   - No auth required
   - Return certificate + verification result
   - Rate limit: 10 requests/minute/IP

3. src/client/public-verifier.ts (new)
   - Function: verifyPublicCertificate(certificateId)
   - Fetch من public API
   - Verify signature
   - Return typed result

القواعد:
- Never expose private data (anonymize run details)
- Show clear VALID/INVALID/REVOKED status
- Use Web Crypto API
- RTL support
- Accessibility: verification status announce
- SEO: meta tags للـ certificate
- Mobile responsive

معايير القبول:
✅ Public page تعمل بدون auth
✅ Verification يعمل
✅ Anonymization يعمل
✅ SEO optimized
✅ TypeScript strict

الاختبارات:
```bash
pnpm test:verify:api
pnpm test:verify:ui
```

الأوامر:
```bash
pnpm dev
# افتح /verify/CERT-2026-00042
# تحقق من النتيجة
```
```

---

### 🎯 **PROMPT 9: بناء Admin Dashboard للـ Certificates**

**الهدف**: بناء صفحة admin لإدارة الشهادات (revoke, view, audit).

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI.

المهمة:
بناء صفحة `/kernel/admin/certificates` لإدارة الشهادات.

الملفات المطلوبة:

1. src/pages/kernel/admin/certificates/index.astro (new)
   - List all certificates (admin only)
   - Show: ID, runId, signedBy, signedAt, gate, environment, revoked
   - Add filters: gate, environment, revoked, date range
   - Add search: certificateId, runId
   - Add "Revoke" button (with reason)
   - Add "View Details" button
   - Add "Export CSV" button

2. src/pages/api/kernel/admin/certificates/[id]/revoke.ts (new)
   - POST: revoke certificate
   - Input: { reason }
   - Update: revokedAt, revokedBy, revocationReason
   - Log إلى `evaluation_audit_events`
   - Return: { success, certificate }

3. src/pages/kernel/admin/certificates/[id].astro (new)
   - Show certificate details
   - Show run details
   - Show audit events
   - Show payload
   - Add "Revoke" button
   - Add "Download PDF" button

القواعد:
- Require admin role (check JWT)
- Log all actions إلى audit events
- Show confirmation modal للـ revoke
- Add reason للـ revoke (required)
- RTL support
- Accessibility
- Mobile responsive

معايير القبول:
✅ Admin page تعمل
✅ Revoke يعمل
✅ Audit events تُسجّل
✅ Details page تعمل
✅ TypeScript strict

الاختبارات:
```bash
pnpm test:admin:certificates
```

الأوامر:
```bash
pnpm dev
# افتح /kernel/admin/certificates
# جرب revoke
```
```

---

### 🎯 **PROMPT 10: بناء Key Rotation Admin Page**

**الهدف**: بناء صفحة admin لإدارة مفاتيح التوقيع (add, revoke, rotate).

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI.

المهمة:
بناء صفحة `/kernel/admin/signing-keys` لإدارة مفاتيح التوقيع.

الملفات المطلوبة:

1. src/pages/kernel/admin/signing-keys/index.astro (new)
   - List all signing keys
   - Show: publicKeyId, algorithm, signedBy, createdAt, revokedAt
   - Add "Generate New Key" button
   - Add "Revoke Key" button (with reason)
   - Add "View Public Key" button

2. src/pages/api/kernel/admin/signing-keys/generate.ts (new)
   - POST: generate new Ed25519 key pair
   - Store private key في secure vault (env var)
   - Store public key في `signing_keys` table
   - Return: { publicKeyId, publicKeyPem }

3. src/pages/api/kernel/admin/signing-keys/[id]/revoke.ts (new)
   - POST: revoke key
   - Input: { reason }
   - Update: revokedAt
   - Log إلى audit events
   - Return: { success, key }

القواعد:
- Require admin role
- Never expose private keys
- Store private keys في env vars (not DB)
- Log all actions
- Show confirmation modal
- RTL support
- Accessibility

معايير القبول:
✅ Admin page تعمل
✅ Key generation يعمل
✅ Key revocation يعمل
✅ Audit events تُسجّل
✅ Private keys secure
✅ TypeScript strict

الاختبارات:
```bash
pnpm test:admin:signing-keys
```

الأوامر:
```bash
pnpm dev
# افتح /kernel/admin/signing-keys
# جرب generate
# جرب revoke
```
```

---

## 4. تحديث التقييم النهائي

### ✅ التقييم الجديد: **8.5 / 10** (كان 7.5)

**الأسباب**:
- ✅ Backend قوي ومحترف موجود
- ✅ Cryptographic signatures (Ed25519)
- ✅ Immutable audit trail (hash chain)
- ✅ Key rotation support
- ✅ Environment separation (demo/live)
- ✅ Replay lineage tracking
- ⚠️ **الفجوة**: Frontend لا يتصل بالـ Backend بعد

### الفرص الكبيرة:
1. **Real Evidence**: شهادات حقيقية موقعة رقمياً
2. **Cryptographic Verification**: يمكن التحقق منها خارجياً
3. **Tamper-Evidence**: Hash chain يمنع التعديل
4. **Audit Compliance**: جاهز للجهات الرقابية (NCA, SDAIA)

### خطة التنفيذ المقترحة:

**الأسبوع 1**: Prompts 1-2 (API Layer + Eval Page)
**الأسبوع 2**: Prompts 3-4 (Evidence + Audit)
**الأسبوع 3**: Prompts 5-6 (Stats + Compliance)
**الأسبوع 4**: Prompts 7-8 (Replay + Public Verify)
**الأسبوع 5**: Prompts 9-10 (Admin Pages)

### النتيجة المتوقعة:
بعد تنفيذ الـ 10 prompts:
- ✅ Frontend متصل بالكامل بالـ Backend
- ✅ Certificates حقيقية وموقعة
- ✅ Audit trail tamper-evident
- ✅ Public verification page
- ✅ Admin dashboard كامل
- ✅ **التقييم النهائي: 9.5 / 10** 🎯

---

## 5. الخلاصة

**المنتج الآن**: Pre-sales-ready مع Backend قوي.
**بعد التنفيذ**: Production-ready مع cryptographic evidence.

**التوصية**: البدء فوراً بـ Prompt 1 (API Layer) لأنه الأساس لكل شيء آخر.