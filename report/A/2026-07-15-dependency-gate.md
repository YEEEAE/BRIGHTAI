# HIGH-08 — Dependency Security Gate (IP-09)

**Date**: 2026-07-15
**Agent**: BrightAI Workspace Agent
**Task ID**: HIGH-08 / IP-09 (DEPENDENCY-GATE-2026-07-15)
**Mode**: Senior
**Related**: CRITICAL-03 (CI Build Guard), follow-up security task
**Predecessor**: CI-BUILD-GUARD-2026-07-15 (8-job pipeline)

---

## الملخص التنفيذي

ما كان في أي gate يفحص الـ `pnpm-lock.yaml` على CVEs قبل الـ merge. أي تبع عرضة (transitive dependency) فيها ثغرة كانت ممكن تروح للـ production بدون ما يلاحظها أحد. الـ existing CI (CI-BUILD-GUARD-2026-07-15) يحمي من builds مكسورة بس ما يحمي من dependencies مكسورة.

أضفنا **Job 9 (`security-scan`)** للـ `ci-build-guard.yml`:

1. **anchore/scan-action@v3** — يفحص الـ lockfile كامل (كل الـ transitive deps) عبر Grype (OSV + NVD backed). يفشل على critical/high.
2. **actions/dependency-review-action@v4** — يفحص diff الـ PR بس (الـ added/updated/removed packages). يفشل على critical/high.
3. **Allowlist validator** — يفحص `.github/security-allowlist.yml` قبل ما يبدأ scan: YAML valid، ما في expired entries، ما في duplicates، كل الحقول المطلوبة موجودة.

الـ **`ci-success`** aggregator صار يعتمد على `security-scan`. أي CVE critical/high → CI يفشل → merge ممنوع.

**النتيجة**: HIGH-08/IP-09 مغلقة. الـ main branch محمي من CVEs العرضية.

---

## الـ Policy بالتفصيل

| Severity | Behavior | Rationale |
|---|---|---|
| **Critical** | ❌ CI يفشل (لا استثناءات) | ثغرات قابلة للاستغلال تؤثر على production. لازم تُصلح قبل الـ merge. |
| **High** | ❌ CI يفشل (لا استثناءات) | نفس المنطق — تأثير محتمل على production. |
| **Medium** | ⚠️ Warning فقط (annotations على الـ PR) | تأثير محدود، غالباً ما يستاهل block الـ merge. يفضل يُصلح لكن مو blocker. |
| **Low** | ⚠️ Warning فقط (annotations) | تأثير ضئيل. توثيق فقط. |
| **Unknown** | ⚠️ Warning فقط | ما عندنا بيانات كافية. يُراجع يدوياً. |

**استثناءات (allowlist)**: مسموحة فقط مع justification حقيقي + expiration date (≤90 يوم). الـ CI يفرض:
- `expires` date في المستقبل (CI يفشل لو expired)
- الـ YAML valid
- كل الحقول المطلوبة موجودة (`id`, `package`, `severity`, `justification`, `expires`)
- ما في duplicate CVE IDs
- `id` يطابق pattern: `CVE-YYYY-NNNN+` أو `GHSA-xxxx-xxxx-xxxx`

---

## الأدوات المختارة وليش

### 1. anchore/scan-action@v3 (الـ primary scanner)

**ليش anchore مو OSV-scanner**:
- **Mature**: anchore/scan-action موجود من 2020، مستقر، مستخدم بكثرة.
- **Grype backed**: يستخدم Grype (نفس الفريق) اللي يدعم OSV + NVD + GitHub Security Advisories.
- **pnpm support native**: يفهم `pnpm-lock.yaml` بدون conversion.
- **SARIF output**: يولّد SARIF report → نقدر نرفعه على GitHub Security tab → code-scanning alerts تظهر للـ team.
- **`fail-build` parameter**: متكامل مع الـ GitHub Actions workflow.

**Config**:
```yaml
uses: anchore/scan-action@v3
with:
  path: "."
  scan-type: "lockfile"
  target: "pnpm-lock.yaml"
  fail-build: true
  severity-cutoff: high
  output-format: "sarif"
```

### 2. actions/dependency-review-action@v4 (PR diff scanner)

**ليش نضيفه على جنب anchore**:
- **Diff-focused**: يفحص الـ **PR changes** بس (added/updated/removed packages). لو PR أضاف تبع جديد بثغرة → يفشل حتى لو الـ lockfile القديم ما عنده مشكلة.
- **PR-only**: يشتغل بس على `pull_request` events. ما يـ run على push (ما يهم، الـ lockfile كامل ما يتغير على push).
- **GitHub-native**: من GitHub نفسها، updates تلقائياً مع APIs الجديدة.

**Config**:
```yaml
if: github.event_name == 'pull_request'
uses: actions/dependency-review-action@v4
with:
  fail-on-severity: high
  show-openssf-scorecard: false
```

**التكامل**: anchore يضمن الـ main branch آمن. dependency-review-action يضمن ما نضيف CVE جديدة عبر PRs. الاثنين مع بعض = defense in depth.

### 3. github/codeql-action/upload-sarif@v3 (SARIF upload)

**ليش**: نريد الـ SARIF report من anchore يظهر في GitHub Security tab. هذا يعطي:
- **Code-scanning alerts** للـ team.
- **تاريخ** الـ CVEs المكتشفة (لو أحد أزال entry من allowlist، نقدر نرجع ونشوف ليش).
- **Integration** مع Dependabot alerts (لو مفعّل لاحقاً).

---

## الـ Allowlist Format

**المسار**: `.github/security-allowlist.yml`

**Schema**:
```yaml
exceptions:
  - id: CVE-2024-XXXXX              # required: CVE-YYYY-NNNN+ or GHSA-xxxx-xxxx-xxxx
    package: 'package-name'         # required: exact package name (case-sensitive)
    severity: high                  # required: critical | high | medium | low
    justification: '...'            # required: WHY we accept the risk (specific)
    expires: '2026-10-15'           # required: YYYY-MM-DD, must be future
    added_by: 'founder'             # optional: who approved
    added_date: '2026-07-15'        # optional: when added (for audit)
    tracking_issue: '#NNN'          # optional: link to PR/task tracking the patch
```

**Validation الـ CI يطبقها**:

1. **YAML syntax** valid (Python `yaml.safe_load`).
2. **Expires date** > today (ISO date comparison).
3. **Required fields** موجودة لكل entry.
4. **Severity** واحد من: `critical, high, medium, low`.
5. **ID format** يطابق regex: `CVE-\d{4}-\d{4,}` أو `GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}`.
6. **No duplicates**: ما في IDs مكررة.

**Current state**: allowlist فاضي (`exceptions: []`). ما عندنا استثناءات حالياً.

---

## How to add an exception (دليل للمطورين)

### الخطوة 1: تأكد إن الـ CVE حقيقية وتخصنا

```bash
# 1. افتح https://osv.dev أو https://nvd.nist.gov
# 2. دوّر على الـ CVE ID
# 3. تأكد إن الـ package affected هو نفسه المستخدم عندنا
grep -A2 "'package-name@" /Users/yzydalshmry/Desktop/BRIGHTAI/pnpm-lock.yaml
```

### الخطوة 2: تأكد إن ما في upstream patch

```bash
# شيك npm registry على أحدث إصدار
npm view package-name versions --json | tail -5

# لو في إصدار أحدث من اللي عندنا → حدّث بدل ما تضيف allowlist
pnpm update package-name
```

### الخطوة 3: وثّق الـ justification

**ممنوع**:
- "Low risk" (generic)
- "Will fix later" (بدون تاريخ)
- "Production safe" (بدون دليل)

**مسموح**:
- "Dev-only fixture in `tests/firewall/stub.ts`, no production runtime path. Patch tracked in #NNN."
- "Used in `astro.config.mjs` build pipeline only, never ships to client. Patch in #NNN (upstream PR upstream#XXX)."

### الخطوة 4: أضف الـ entry

```yaml
exceptions:
  - id: CVE-2024-12345
    package: 'some-package'
    severity: high
    justification: 'Used in dev-only test fixture, no production runtime. Patch tracked in #NNN.'
    expires: '2026-10-15'  # max 90 days from creation
    added_by: 'founder'
    added_date: '2026-07-15'
    tracking_issue: '#NNN'
```

### الخطوة 5: افتح PR

الـ CI يطبق الـ validation **قبل** الـ scan. لو entry غير صالح (expired, duplicate, missing field) → CI يفشل فوراً.

---

## Failure Modes وكيف نتعامل معها

| Scenario | CI Behavior | Resolution |
|---|---|---|
| **CVE critical/high in lockfile** | ❌ FAIL (`security-scan` job fails) | حدّث الـ dependency (`pnpm update X`)، أو أضف entry للـ allowlist مع justification قوي + expires قريب. |
| **Allowlist YAML malformed** | ❌ FAIL (validation step قبل scan) | اصلح الـ YAML، شغّل `python3 -c "import yaml; yaml.safe_load(open('.github/security-allowlist.yml'))"` محلياً للتأكد. |
| **Allowlist entry expired** | ❌ FAIL (validation step) | إما جدّد الـ entry مع justification جديد + expires جديد، أو احذفها بعد ما تحدّث الـ dependency. |
| **Allowlist duplicate IDs** | ❌ FAIL (validation step) | ادمج الـ duplicate entries في entry واحد، أو احذف المكرر. |
| **Medium CVE** | ⚠️ Warning (annotations on PR) | ما يفشل CI. لكن يستاهل متابعة. أضف task لتتبع الـ fix. |
| **CVE في PR diff بس** | ❌ FAIL (dependency-review-action) | نفس الـ resolution مثل lockfile CVE — update أو allowlist. |
| **Scan timeout (>12 min)** | ❌ FAIL (timeout) | الـ lockfile كبير. شغل على push events بدل ما يـ run على كل PR. |

---

## Branch Protection Setup (User Action)

CI يشتغل لكن **ما يمنع merges فعلياً** بدون إعداد branch protection. الخطوات في GitHub UI:

1. **Settings** → **Branches** → **Branch protection rules** → **Add rule** لـ `main`.
2. ✅ **Require status checks to pass before merging**
3. ✅ **Require branches to be up to date before merging**
4. **Search for status checks** → اختار **`CI Build Guard`** (job name: `ci-success`).
5. ✅ **Do not allow bypassing the above settings**

**مهم**: الـ `ci-success` aggregator الآن يعتمد على `security-scan`. لو `security-scan` فشل، `ci-success` يفشل، merge ممنوع.

---

## الملفات المتأثرة

| File | Change Type | الوصف |
|---|---|---|
| `.github/workflows/ci-build-guard.yml` | **معدّل** | + Job 9 (`security-scan`)، تحديث الـ aggregator (`ci-success`)، تحديث الـ header comments. +85 سطر. |
| `.github/security-allowlist.yml` | **جديد** | 84 سطر. Schema + validation rules + example (commented out). Initial state: empty allowlist. |
| `.agents/brain.md` | **معدّل** | + entry في Change Ledger (newest first) + Section 3 (KI جديد) + Section 4 (decision جديد). |
| `report/2026-07-15-dependency-gate.md` | **جديد** | هذا الـ report. |

**ما تمس** (محمي/خارج النطاق):
- `astro.config.mjs` (protected)
- `render.yaml` (protected)
- `src/data/site.ts`، `src/data/navigation.ts`، `src/data/i18n-pairs.ts` (protected)
- `package.json` (ما في scripts جديدة — CI بس)
- `pnpm-lock.yaml` (ما يتغير — الـ scan يقرأه فقط)
- `.github/workflows/seo-guard.yml` (legacy، محفوظ)
- `.github/workflows/deploy.yml` (منفصل، ما يتأثر)

---

## نتائج التحقق

| Check | Result | Notes |
|---|---|---|
| YAML valid | ✅ | `python3 yaml.safe_load()` → 0 syntax errors على الـ workflow + allowlist. |
| Job graph valid | ✅ | 9 jobs، 14 edges، 0 orphans (besides root `install` و terminal `ci-success`). |
| Allowlist YAML parses | ✅ | Empty `exceptions: []` صحيح. |
| Allowlist validation runs (empty case) | ✅ | Validator يمر بدون errors لما الـ allowlist فاضي. |
| `ci-success` aggregator updated | ✅ | يجمع 7 jobs الآن: typecheck, lint, test, build-astro, build-dashboard, seo-gates, **security-scan**. |
| Permissions explicit | ✅ | `security-scan` عنده: `contents: read`, `pull-requests: read`, `security-events: write`. |
| Concurrency unchanged | ✅ | `cancel-in-progress: true` يبقى — security-scan ما يحتاج تغيير. |

**ملاحظة مهمة**: ما قدرت أشغّل CI فعلياً (يحتاج GitHub runner، local ما فيه). التحقق المعمول:
- YAML syntax ✅ (Python yaml.safe_load)
- Job graph topology ✅ (كل `needs:` يـ resolve)
- Allowlist validation logic ✅ (tested locally على empty + sample cases)
- Edge cases handled:
  - Empty allowlist → validation passes
  - Expired entry → validation fails with clear error
  - Malformed YAML → validation fails before scan (saves 1-2 min)
  - Duplicate IDs → validation fails

**ما يحتاج GitHub runner للتأكد**:
- anchore/scan-action@v3 فعلاً يفحص `pnpm-lock.yaml` بدون errors.
- dependency-review-action@v4 يقرأ الـ PR diff بشكل صحيح.
- SARIF upload يظهر في GitHub Security tab.

التوصية: أول PR تجريبي بعد الـ deploy يفتح — لو `security-scan` يمر أو يفشل كما متوقع، نعرف الـ integration صحيح.

---

## Risks المتبقية

### 1. False negatives في الـ scan
- **Risk**: anchore يستخدم قاعدة بيانات CVEs. لو قاعدة البيانات تأخرت يوماً في إضافة CVE جديدة، ما نلاحظها.
- **Mitigation**: GitHub Dependabot (لو مفعّل لاحقاً) يعطينا طبقة ثانية. كمان، `actions/dependency-review-action` يستخدم GitHub Advisory Database (مستقل عن Grype) → defense in depth.

### 2. Allowlist drift
- **Risk**: لو أحد أضاف entry وما حدّثها قبل الـ expiration، الـ CI يفشل بعد 90 يوم.
- **Mitigation**: هذا **feature** مو bug. الـ CI يفرض re-justification دوري. الـ founder يقدر يمدد لو الـ patch فعلياً في upstream.

### 3. Lockfile parsing edge cases
- **Risk**: anchore ممكن ما يفهم بعض الـ edge cases في `pnpm-lock.yaml` (مثل pnpm overrides، resolutions).
- **Mitigation**: لو طلع مشكلة، نقدر نستخدم `osv-scanner-action` بدل anchore — هو OSV.dev native، يفهم lockfile formats كثيرة. أو نضيف `pnpm audit` كـ backup.

### 4. SARIF upload size
- **Risk**: لو الـ lockfile فيه thousands of vulnerabilities (unlikely)، الـ SARIF ممكن يكون كبير.
- **Mitigation**: `anchore-reports/sarif-result.sarif` حجمه عادة < 100KB. GitHub يقبل حتى 10MB SARIF. negligible.

### 5. No Dependabot (لم يُطلب)
- **Risk**: Dependabot يفتح PRs تلقائياً للـ outdated deps. ما عندنا.
- **Mitigation**: خارج النطاق. لو تبي Dependabot، job منفصل في PR مستقبلي.

---

## Follow-up Suggestions

1. **أولوية #1 — User**: ادخل GitHub Settings → Branches → main → Require status checks → اختار `CI Build Guard` (ci-success). بدون هذا، security-scan يمر/يفشل بس ما يمنع merge.
2. **أولوية #2 — أول PR تجريبي**: افتح PR تجريبي، تأكد إن `security-scan` يظهر في checks، يفحص الـ lockfile بدون errors. لو في CVE (متوقع — أي مشروع node عنده)، يتوقع يفشل CI. هذا يثبت إن الـ gate شغّال.
3. **أولوية #3 — Dependabot integration**: أضف `.github/dependabot.yml` يفعّل weekly updates للـ npm ecosystem. Dependabot PRs تروح من خلال نفس CI → نفس security-scan يفحصها.
4. **أولوية #4 — Pre-commit hook**: أضف `lefthook.yml` أو `husky` يـ run `pnpm audit` محلياً قبل كل commit. يكشف CVEs قبل ما يوصل للـ PR.
5. **أولوية #5 — Weekly CVE digest**: cron job يـ run `anchore/scan-action` مرة في الأسبوع → ينشر CVE report في Slack أو email. يساعد نتابع medium-severity CVEs اللي ما يفشل CI.

---

## خطة الـ Rollback

```bash
# Remove security-scan job (revert to 8-job pipeline)
git revert <commit-sha>

# في GitHub UI: لو ربطت `CI Build Guard` في branch protection، يبقى شغّال
# (security-scan اختياري للـ ci-success — لو فشل، الـ ci-success يفشل).

# Delete the allowlist file (لو تبي)
git rm .github/security-allowlist.yml
git commit -m "chore(security): remove allowlist (no exceptions to manage)"
```

**Rollback safety**: الـ security-scan job معزول، ما يأثر على أي code أو build artifacts. الـ 8 jobs الموجودة تبقى شغّالة. لو rollback، نخسر فقط الـ CVE detection — ما نخسر functionality.

---

## الـ commit message المقترح

```
chore(ci): add HIGH-08 dependency security gate (CVEs block merges)

Closes HIGH-08 / IP-09 — prevents CVEs reaching production.

Adds security-scan job to CI Build Guard (8 → 9 jobs):
  - anchore/scan-action@v3 scans pnpm-lock.yaml via Grype/OSV
  - actions/dependency-review-action@v4 scans PR diff (PR-only)
  - Custom validator checks .github/security-allowlist.yml
  - Both scanners fail on critical/high; medium/low warn

Severity policy:
  - Critical/High → CI fails (no exceptions, no warnings)
  - Medium/Low   → CI warns (annotations on PR)
  - Allowlist exceptions require: real justification + expires ≤90d

ci-success aggregator now waits for security-scan. CVE in lockfile
→ security-scan fails → ci-success fails → merge blocked.

SARIF reports uploaded to GitHub Security tab for code-scanning alerts.

User action required: link `CI Build Guard` in GitHub branch protection.

Refs: #HIGH-08, #IP-09
```

---

## الخلاصة

- ✅ **HIGH-08 / IP-09 — resolved** (dependency security gate مطبَّق).
- ✅ **CI Build Guard** — 9 jobs الآن (كان 8)، security-scan مضاف قبل الـ ci-success aggregator.
- ✅ **Allowlist file** — جديد، فاضي حالياً، schema واضح + validation صارم.
- ⚠️ **User action required**: ربط `CI Build Guard` في GitHub branch protection (دقيقة وحدة، manual UI).
- 🎯 **التوصية**: أول PR تجريبي يفتح — نتأكد إن `security-scan` يمر بدون CVE (أو يفشل بشكل متوقع لو في CVE).

CI صار يحمي main من:
- ❌ CRITICAL-01 (build failures) — via typecheck + build jobs
- ❌ CRITICAL-02 (schema drift) — via install + prisma generate
- ❌ CRITICAL-03 (no CI) — via ci-success aggregator
- ❌ HIGH-08 (CVEs) — via security-scan ← **جديد**