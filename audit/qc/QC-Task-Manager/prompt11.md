حللت النسخة الحالية الموجودة على GitHub من `YEEEAE/BRIGHTAI` مع التركيز على `apps/qc-task-manager/`. الـHEAD اللي بنيت عليه التحليل هو:

`394be485cc2c32301cb4b5dea866520fe18e5a61`

وآخر تغيير عليه خاص بمطابقة الـPermissions مع الـUI.

فيه نقطة مهمة جدًا قبل البرومبتات: **النظام الحالي متقدم جدًا، لكن ما أعتبره جاهزًا للشركة 100% من tracked GitHub HEAD الحالي**. عندك بنية كبيرة فعلًا: Tasks، Findings/RCA/CAPA، Lab Tests، Samples، Products، Equipment، Calibration، Maintenance، Retests، Templates، Documents/WI/SOP، Acknowledgements، Change Requests، Audit، Notifications، Search، Reports engine، AI، Backups، System Health، UX telemetry وغيرها. شجرة الـbackend الحالية تثبت اتساع هذه الوحدات، ومنها reporting engine كامل وLab modules كثيرة.

## أهم نتيجة طلعت بها

المشكلة الأخطر حاليًا مو نقص Features، بل **Source-of-Truth / Verification Closure**.

صفحة `/reports` الحالية تعرض فعليًا أزرار CSV/XLSX/PDF وتوجّهها إلى:

`/api/reports/${selectedType}.csv`
`/api/reports/${selectedType}.xlsx`
`/api/reports/${selectedType}.pdf`

وتعرض رابط `/api/reports/audit`.

وفي نفس الوقت `route-manifest.mjs` يعتبر الأربع Routes هذه إلزامية، ويقول صراحة إن middleware لا يجوز استخدامه لإخفاء غياب File Route.

لكن قائمة `src/pages/api/` الحالية لا تحتوي أصلًا على مجلد `reports/`.

هذا بالنسبة لي **P0**؛ لأن الـUI والـreporting domain موجودين، لكن HTTP transport الموجود في عقد النظام غير موجود في tracked source.

والأهم: التقرير القديم بتاريخ 28 أغسطس قال إن Reporting = 96% وإن route manifest وE2E بالكامل نجحوا.  بينما المهمة الأحدث بتاريخ 4 سبتمبر تذكر صراحة أنها **لم تشغّل full `pnpm test` ولا production build ولا browser role sweep** بعد أحدث التعديلات.  لذلك البرومبتات الختامية أدناه تعتبر **CURRENT REALITY فقط** مصدر الحقيقة، ولا تثق بأي PASS قديم.

## وش موجود بالنظام حاليًا

الـTask Management نفسه غني: lifecycle صارم، completion wizard، evidence، comments، attachments، recurrence، dependencies، checklist، field locking، delete-request workflow، dashboard، notifications وexports.

الـRBAC كذلك ناضج. `permissions.ts` هو المرجع، والمصفوفة الحالية تغطي Employee/Supervisor/Manager/Admin، بما فيها ownership، Lab review/approval، no-self-review، documents، templates، MDM proposals، reports وmanagement surfaces. آخر تدقيق Permission↔UI أصلح كذلك Team Workload، Reports للموظف، Lab Search، Findings، Templates وPrint routes.

المصادقة قوية من ناحية التصميم: sessions server-side، opaque random token، 12-hour TTL، bcrypt، lockout، IP throttling، dummy hash ضد username enumeration، password lifecycle وlive-role resolution.  والـmiddleware عنده CSP صارم بدون `unsafe-inline` العام، Security Headers وRBAC walls.

قاعدة البيانات الآن عندها **40 migrations**، ومشكلة Migration 031 القديمة تم حلها بالشكل الصحيح؛ صارت `031_reserved.sql` مستوردة raw مثل بقية الـmigrations، مع تاريخ متسلسل حتى `040_dashboard_created_at_index.sql`.

الـattachments أقوى مما كان سابقًا: filename sanitization، extension/MIME، size، magic bytes، executable detection، active-content checks وSHA-256.

والـAI معماريًا advisory؛ الـAI audit لا يحفظ prompt/response bodies وإنما references/model/feature/outcome، وهذا اتجاه جيد للخصوصية.  كما أن له safe-launch procedure ويستطيع النظام العمل بدونه.

## مشاكل إضافية مثبتة

عندي ملاحظة حقيقية في الـE-signature: التعليق يقول إن empty/missing password يعامل كـ`invalid`، لكن مسار التنفيذ الحالي يرجع `rate_limited` عند غياب كلمة المرور. وفوق ذلك رأس الملف يذكر أن المحاولات الفاشلة تسجل في `qc_audit_log` بينما التنفيذ يسجلها في `login_attempts`. الفعل عالي السلطة نفسه قد يكون موثقًا لاحقًا بشكل صحيح، لكن هذا التناقض يستحق إصلاح واختبار مستقل.

عندك أيضًا Documentation Drift واضح. `README.md` ما زال يتكلم عن Lab كأنه “being enabled step by step” وعن schema قديمة مكوّنة من 12 tables، بينما النظام الحالي عنده Lab متكامل وعشرات الوحدات و40 migration.

`DEPLOYMENT.md` أيضًا يعرض مثال readiness بـ`schemaVersion: 38` بينما registry الحالي وصل 40.

والـ`.env.example` الحالي يحتوي فقط:

`GROQ_API_KEY=`

رغم أن عقد التشغيل يتكلم عن `QC_DATABASE_PATH`, `QC_BACKUP_DIR`, `ADMIN_DEFAULT_PASSWORD`, `NODE_VERSION`, `HOST` وغيرها.

`SECURITY.md` نفسه فيه آخر سطر يتكلم عن `SESSION_SECRET` و`JWT_SECRET` رغم أن وثيقة Deployment تقول إن `SESSION_SECRET` reserved وغير مستخدم حاليًا.

ومن ناحية UX، تقرير Design QA السابق نفسه يقول إن adoption للـDesign System ما زال جزئيًا ببعض detail/admin routes، وإن VoiceOver، 320px، 200% zoom، real devices و4G ما زالت بدون Human Evidence.

---

# التقييم المرجعي للـ100 مجال

**مهم:** عمود Target هو النسبة اللي أنت حددتها. أما Current فهو **تقدير Source-Based** مني من GitHub الحالي + الاختبارات والتقارير الموجودة، وليس ادعاء أني شغلت runtime الحالي بنفسي. لذلك البرومبت الأخير هو اللي لازم يعطي النسبة النهائية التنفيذية.

|   # | المجال                           | Target | Current |
| --: | -------------------------------- | -----: | ------: |
|   1 | Quality Engineering & V/V        |    100 |      91 |
|   2 | QC Compliance / QMS Integration  |    100 |      93 |
|   3 | Security / AppSec                |    100 |      95 |
|   4 | Data & Records Integrity         |    100 |      96 |
|   5 | Auditability & Traceability      |    100 |      95 |
|   6 | IAM / RBAC / Authorization       |    100 |      96 |
|   7 | Database Reliability             |    100 |      96 |
|   8 | Workflow & Business Rules        |    100 |      95 |
|   9 | Backup / Restore / DR            |    100 |      93 |
|  10 | Requirements / Business Analysis |     99 |      91 |
|  11 | Software Architecture            |     99 |      95 |
|  12 | Functional Workflow Correctness  |     99 |      92 |
|  13 | Testing Architecture             |     99 |      94 |
|  14 | Risk Management                  |     99 |      89 |
|  15 | Electronic Records / E-Signature |     99 |      90 |
|  16 | Document Control                 |     99 |      95 |
|  17 | Data Architecture / Governance   |     98 |      94 |
|  18 | State Machine / Lifecycle        |     98 |      95 |
|  19 | Error Architecture               |     98 |      93 |
|  20 | Reliability / Resilience         |     98 |      92 |
|  21 | Privacy Engineering              |     98 |      93 |
|  22 | Operational UX                   |     98 |      93 |
|  23 | QC Workflow UX                   |     98 |      94 |
|  24 | Role-Based / Permission UX       |     98 |      96 |
|  25 | Advanced Forms / Entry UX        |     98 |      94 |
|  26 | Accessibility                    |     98 |      93 |
|  27 | IA & Permissions                 |     97 |      97 |
|  28 | Human Factors / Ergonomics       |     97 |      82 |
|  29 | Performance Engineering          |     97 |      89 |
|  30 | Observability / Monitoring       |     97 |      91 |
|  31 | Deployment / Release             |     97 |      85 |
|  32 | Change / Config Management       |     97 |      91 |
|  33 | Maintainability                  |     97 |      93 |
|  34 | API Design / Governance          |     96 |      84 |
|  35 | Concurrency / Transactions       |     96 |      94 |
|  36 | File / Attachment Security       |     96 |      94 |
|  37 | Product Design / Strategy        |     96 |      93 |
|  38 | UX Design                        |     96 |      93 |
|  39 | Information Architecture         |     96 |      95 |
|  40 | Interaction Design               |     96 |      92 |
|  41 | Design System                    |     96 |      90 |
|  42 | Enterprise UX                    |     96 |      91 |
|  43 | Laboratory UX                    |     96 |      94 |
|  44 | Compliance UX                    |     96 |      92 |
|  45 | Dashboard Design                 |     95 |      93 |
|  46 | Data Visualization               |     95 |      93 |
|  47 | Data-Driven Design               |     95 |      91 |
|  48 | Advanced Tables / Density        |     95 |      92 |
|  49 | Search / Filter / Sorting        |     95 |      94 |
|  50 | Navigation / Wayfinding          |     95 |      96 |
|  51 | UI Design                        |     95 |      93 |
|  52 | Visual Design                    |     94 |      91 |
|  53 | Visual / Content Hierarchy       |     94 |      93 |
|  54 | Responsive / Adaptive            |     94 |      93 |
|  55 | Keyboard / Focus UX              |     94 |      92 |
|  56 | Screen Reader / Semantic UX      |     94 |      89 |
|  57 | Service Design                   |     94 |      89 |
|  58 | Handoff / Queue UX               |     94 |      93 |
|  59 | Notification Architecture / UX   |     94 |      93 |
|  60 | Audit Trail / Timeline UX        |     94 |      93 |
|  61 | UX Writing / Microcopy           |     93 |      92 |
|  62 | Error / Recovery UX              |     93 |      92 |
|  63 | Loading / Perceived Performance  |     93 |      90 |
|  64 | Draft / Unsaved / Autosave UX    |     93 |      92 |
|  65 | Destructive Action UX            |     93 |      93 |
|  66 | UX Research / Usability Testing  |     93 |      72 |
|  67 | Task Success / Time-on-Task      |     93 |      82 |
|  68 | Design QA / UX QA                |     93 |      91 |
|  69 | Design System Governance         |     93 |      90 |
|  70 | Security UX                      |     92 |      92 |
|  71 | Privacy UX                       |     92 |      91 |
|  72 | Authentication / Session UX      |     92 |      93 |
|  73 | Print / PDF / Export UX          |     92 |      84 |
|  74 | Reporting Architecture / UX      |     92 |  **72** |
|  75 | Master Data Management           |     92 |      94 |
|  76 | Data Quality Engineering         |     92 |      94 |
|  77 | Data Lineage                     |     92 |      92 |
|  78 | CI/CD                            |     92 |      91 |
|  79 | Secure SDLC / Supply Chain       |     92 |      88 |
|  80 | Environment Management           |     92 |      79 |
|  81 | Secrets Management               |     92 |      90 |
|  82 | Incident / Problem Management    |     91 |      80 |
|  83 | Business Continuity              |     91 |      87 |
|  84 | Capacity / Load Engineering      |     91 |      86 |
|  85 | Developer Experience             |     91 |      91 |
|  86 | Technical Debt                   |     91 |      88 |
|  87 | Dependency Management            |     91 |      89 |
|  88 | Content / Terminology Governance |     90 |      92 |
|  89 | Component Architecture           |     90 |      92 |
|  90 | Component States                 |     90 |      91 |
|  91 | Design Tokens                    |     90 |      91 |
|  92 | Typography / Spacing / Layout    |     90 |      92 |
|  93 | Semantic Color System            |     90 |      92 |
|  94 | Iconography                      |     89 |      88 |
|  95 | Microinteractions                |     89 |      89 |
|  96 | Motion Design                    |     88 |      88 |
|  97 | Motion & Digital Art             |     86 |      82 |
|  98 | AI Governance / AI Safety        |     95 |      92 |
|  99 | AI Evals / Model Risk            |     95 |      80 |
| 100 | Human-in-the-Loop AI UX          |     95 |      92 |

أضعف المناطق الفعلية مو الـcore QC. الأضعف هي **Reporting transport، current-release verification، Environment/Deployment evidence، Human UX evidence، AI Evals، incident/business continuity، وبعض design-system adoption**.

المتوسط الحسابي لتقديرات الـ100 مجال حوالي **90.9%**، لكن ما أستخدمه كـCompany Readiness لأن P0 واحد مثل report transport أهم من عشرين مجال بصري نتيجتها 95%.

---

# الحزمة الختامية النهائية

رتبتها بحيث كل برومبت يبني على اللي قبله، وما نعيد بناء النظام من الصفر.

## Prompt 00 — Closing Source-of-Truth Contract

```text
@Superpowers @GitHub

TASK:
QC ULTIMATE CLOSURE — SOURCE OF TRUTH BASELINE

REPOSITORY:
YEEEAE/BRIGHTAI

APPLICATION:
apps/qc-task-manager/

THIS IS THE FIRST TASK OF THE FINAL CLOSURE PROGRAM.

Before making ANY application change:

Read completely:

AGENTS.md
.agents/AGENTS.md
CLAUDE.md
.agents/mind/01-mind-latest.md
apps/qc-task-manager/README.md
apps/qc-task-manager/SECURITY.md
apps/qc-task-manager/package.json

Inspect:

.agents/skills/
skills-lock.json

Discover all available repository skills.

For every domain touched by this task or subsequent closing work,
read the relevant SKILL.md before implementation.

Use Superpowers process rigor:

systematic-debugging for defects
TDD for fixes/features
verification-before-completion before PASS
code-review skills where applicable

FREEZE CURRENT REALITY:

git rev-parse HEAD
git branch --show-current
git status --short
git diff --stat
git diff
node --version
pnpm --version

IMPORTANT:

Current working tree is authoritative if it contains uncommitted work.
Do not discard it.
Do not reset it.
Do not checkout over it.

Do not trust:

old reports
old percentages
old PASS claims
old implementation summaries
the project mind as implementation evidence

CURRENT SOURCE + CURRENT DB + CURRENT RUNTIME are authoritative.

PROJECT INVARIANTS:

- Astro SSR remains.
- SQLite remains.
- Single writable instance remains.
- src/lib/permissions.ts remains the authorization authority.
- Do not duplicate authorization rules.
- qc_audit_log remains the canonical QC/Lab audit trail.
- Do not create another QC audit system.
- One notifications table.
- Approved/void/final controlled records remain immutable.
- Preserve immutable approval snapshots.
- Prevent self-review/self-approval according to current policy.
- Sequential migrations only.
- Never modify an already-applied migration to make a test green.
- All unsafe writes require canonical request security/CSRF.
- Do not weaken CSP.
- No unsafe-inline / unsafe-eval.
- Never invent scientific/test/regulatory values.
- Never invent missing controlled WI pages.
- UI remains English.
- Final communication to user in Saudi Arabic.
- No heavy UI framework.
- No PostgreSQL/Redis/microservices unless a verified requirement proves need.
- No commit.
- No push.
- No deploy.

Create:

apps/qc-task-manager/docs/FINAL-CLOSURE-CONTRACT.md

Also create:

apps/qc-task-manager/docs/FINAL-100-DOMAIN-COVERAGE.md

The coverage file must list ALL 100 target domains supplied for final closure,
their target percentage,
relevant implementation areas,
applicable skills,
tests,
evidence,
current gap,
and final status.

Do NOT assign PASS yet.

Status each domain:

UNVERIFIED
SOURCE_VERIFIED
TEST_VERIFIED
RUNTIME_VERIFIED
HUMAN_VALIDATION_REQUIRED
BLOCKED

This baseline task must NOT repair unrelated findings.

Update .agents/mind/01-mind-latest.md according to project rules.

Final response:
Saudi Arabic,
current HEAD,
working-tree state,
skills selected,
baseline risks,
and whether the closure program may safely continue.
```

---

# Prompt 01 — P0 Reporting + Route Reality

هذا أول إصلاح فعلي، لأنه أكثر تناقض حالي واضح.

```text
@Superpowers @GitHub

Read first:

apps/qc-task-manager/docs/FINAL-CLOSURE-CONTRACT.md

If it does not exist, STOP.

MISSION:

Independently verify and completely close the current reporting transport
and route-contract problem.

CURRENT TRACKED SOURCE EVIDENCE TO RE-VERIFY:

- /reports UI links to:
  /api/reports/${reportType}.csv
  /api/reports/${reportType}.xlsx
  /api/reports/${reportType}.pdf
  /api/reports/audit

- scripts/route-manifest.mjs requires these as FILE ROUTES.

- Current tracked src/pages/api listing appears to contain no reports/ directory.

DO NOT blindly trust this statement.
Reproduce it from CURRENT working tree first.

Inspect completely:

src/pages/reports.astro
src/pages/lab/reports.astro
src/lib/reporting/**
src/lib/lab/labReports.ts
src/pages/api/**
scripts/route-manifest.mjs
scripts/e2e-reports.mjs
all reporting tests
permissions.ts
api-security.ts
audit implementation

If transport is genuinely missing:

restore/implement the canonical HTTP adapter.

Required behavior:

GET /api/reports/[reportType].csv
GET /api/reports/[reportType].xlsx
GET /api/reports/[reportType].pdf
GET /api/reports/audit

Do NOT build a second reporting engine.

Reuse:

report catalog
filters
authorization
scope resolution
queries
CSV writer
XLSX writer
PDF writer
report audit

Security requirements:

authentication required
server-authoritative scope
no IDOR
forged scope denied
employee own scope only
supervisor authorized department scope
manager/admin organization scope only when allowed
validate report type
validate format
validate filters
safe content-type
safe content-disposition
no path construction from user input
no secret/error leakage

Verify actual generated files.

For CSV:
parse it.

For XLSX:
open it programmatically and verify workbook/sheets/headers/data.

For PDF:
verify valid PDF bytes and meaningful expected content.

Test:

anonymous
each role
forged employee
forged department
forged organization
invalid type
invalid format
date filtering
empty dataset
large dataset
audit creation
audit visibility
download filename
content type

Strengthen route-manifest tests so tracked-source absence can NEVER
coexist with a historical PASS again.

Run all relevant tests.

Then:

pnpm typecheck
pnpm test:route-manifest
pnpm test
NODE_ENV=production pnpm build
pnpm e2e:acceptance

Do not claim complete until all applicable gates exit 0.

Update FINAL-100-DOMAIN-COVERAGE.md for:

Quality V&V
Functional Correctness
Testing Architecture
API Governance
Print/Export UX
Reporting Architecture/UX

Update mind.

No commit.
No push.
No deploy.
```

---

# Prompt 02 — V&V + Requirements Traceability + Release Truth

يغطي بشكل مباشر 1، 10، 12، 13، 14.

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Principal Quality Engineer + Verification/Validation Architect.

MISSION:

Build a defensible verification system proving what QC Task Manager actually does.

Do not improve code first.

Reconstruct requirements from:

current business rules
permissions.ts
task-policy.ts
workflow engines
validation
Lab policy
controlled source data
project instructions
documented approved decisions

Do not convert stale docs into requirements.

Create:

docs/REQUIREMENTS-TRACEABILITY-MATRIX.md

For every requirement:

Requirement ID
Source
Business purpose
Risk
Affected roles
Routes
Backend modules
DB constraints
Audit requirement
Test type
Test file
E2E flow
Runtime evidence
Status

Cover every subsystem.

Detect:

requirements with no tests
tests with no requirement
UI-only requirements
business rules duplicated in multiple places
contradictory requirements
unverifiable claims
tests that inspect strings instead of behavior
mock-heavy false positives

Create explicit verification layers:

UNIT
INTEGRATION
CONTRACT
SECURITY
DB
E2E
A11Y
RESPONSIVE
PERFORMANCE
RESTORE
HUMAN UAT

Ensure high-risk requirements have independent behavioral verification.

Run FULL current test stack after any required test corrections.

Produce a machine-readable verification result.

No 100% claim is allowed unless:
every applicable requirement has evidence,
all high-risk paths have behavioral tests,
full E2E exits 0,
build exits 0,
DB integrity passes.

Update 100-domain coverage.

Do not commit/push/deploy.
```

---

# Prompt 03 — QMS / Compliance / Risk Engineering

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
QC Compliance Engineer + QMS Integration Architect + Risk Engineer.

MISSION:

Audit and close the engineering gaps between the QC application's
implemented workflows and the company's controlled quality processes.

IMPORTANT:

Do NOT invent ISO/FDA/SFDA/QMS requirements.

Separate every conclusion into:

CONTROLLED COMPANY REQUIREMENT
CURRENT APPLICATION RULE
ENGINEERING RECOMMENDATION
SOURCE REQUIRED

Audit:

tasks
findings
RCA
CAPA
laboratory testing
FAIL/HOLD handling
retests
equipment
calibration
maintenance
documents
WI
SOP
acknowledgements
change requests
approvals
audit
reports
records
retention

Build:

docs/QMS-SYSTEM-MAPPING.md
docs/OPERATIONAL-RISK-REGISTER.md

For each process:

source requirement
digital implementation
role
state
approval
evidence
record generated
audit trail
risk
gap
verification

Identify:

missing digital controls
unnecessary controls
ambiguous workflow
manual steps not represented
source-blocked functionality
policy encoded without source
hidden compliance assumptions

Preserve controlled-source data exactly.

Do not invent WI pages 2/3 or 3/3.

All engineering-only recommendations must be explicitly labeled.

Add tests only for verified application rules.

Update 100-domain coverage for:

QC Compliance
Requirements Engineering
Risk Management
Document Control
Compliance UX
Service Design
Change Management

No commit/push/deploy.
```

---

# Prompt 04 — Data Integrity + Audit + E-Signature Closure

هذا من أهم البرومبتات.

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Records Integrity Architect + Auditability Engineer + E-Signature Engineer.

MISSION:

Make record integrity and high-authority approvals defensible end-to-end.

Audit every major entity for:

creation identity
actor identity
timestamps
ownership
state history
before/after values
approval snapshots
immutability
deletion semantics
restore behavior
audit linkage
record lineage

Re-run audit-chain verification.

Attempt to mutate:

approved Lab test
VOID Lab test
approved document version
superseded document
approved template
terminal task
historical approval metadata

They must behave exactly according to canonical policy.

SPECIFIC E-SIGNATURE ISSUE TO REPRODUCE:

Inspect src/lib/lab/esignature.ts.

Current source appears to say empty/missing password is an invalid attempt
but its branch may return rate_limited.

Also verify whether comments claiming failed e-signature attempts use
qc_audit_log match actual implementation, which appears to write login_attempts.

Determine the correct architecture first.

Do NOT create another audit log.

Separate:

authentication/security-attempt audit

from:

business record approval audit.

A successful approval/void must have durable business evidence containing:

actor
record
action
signature meaning
timestamp
approval snapshot/version
reason where required

Never store password.

Never store password hash.

Test:

empty password
wrong password
rate-limited password
correct password
self-approval attempt
role bypass
stale record
double approval
replay
approved-record mutation
failed audit write behavior
post-backup restore integrity
audit-chain verification

Review record retention and deletion semantics.

Create:

docs/ELECTRONIC-RECORDS-INTEGRITY.md

Update domains:

Data Integrity
Records Integrity
Auditability
Traceability
E-Signature
Data Lineage
State Machine

No commit/push/deploy.
```

---

# Prompt 05 — Security / IAM / Privacy / File Security

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Senior AppSec + IAM + Privacy Engineer.

MISSION:

Perform adversarial closure of application security.

Audit:

authentication
session creation
session expiry
logout
password lifecycle
lockout
IP throttling
must-change-password
admin reset
role changes
inactive users

Build complete:

role × resource × action × ownership

authorization attack matrix.

Attack:

anonymous routes
direct URLs
direct APIs
forged IDs
cross-user IDs
cross-role IDs
foreign tasks
foreign findings
foreign Lab records
foreign documents
foreign reports
foreign attachments

Audit:

CSRF
Sec-Fetch-Site
Origin
CSP
XSS
SQL injection
IDOR
path traversal
open redirects
uploads
downloads
MIME
content disposition
rate limiting
request limits
error leakage
logs
secrets
dependency exposure

File lifecycle:

upload
hash
storage
download
permission
replacement
terminal record behavior
deletion
backup/restore

Check ZIP/Office polyglot and active-content assumptions where applicable.

Do not add malware SaaS.

Review privacy:

what personal data exists
where it is displayed
who can view it
logs
UX telemetry
AI inputs
exports
backups

Create:

docs/SECURITY-PRIVACY-THREAT-MODEL.md

No permission may move out of permissions.ts.

Run all adversarial/security suites plus full regression.

Update:

Security
Privacy
IAM
RBAC
File Security
Secrets
Secure SDLC
Security UX
Privacy UX
Authentication UX

No commit/push/deploy.
```

---

# Prompt 06 — Database / Transactions / Concurrency / Reliability

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
SQLite Reliability Engineer + Transaction Architect.

MISSION:

Prove database correctness under upgrade, rollback prevention,
concurrent-like operations and failure.

Inspect all migrations 001 → latest.

Validate:

disk vs embedded parity
sequential numbering
names
SHA-256
fresh DB
upgrade DB
second migration run
checksum drift
failed migration logging
pre-migration backup
foreign keys
integrity
indexes

Never edit old applied migration SQL.

Audit every multi-record business mutation for atomicity.

Examples:

task completion
evidence + completion comment
approval
review
change request approval
document versioning
notifications
audit
retest creation
backup metadata

Test:

duplicate submits
double-click
repeated POST
stale browser
optimistic concurrency
two reviewers
two approvers
replayed idempotency key
transaction rollback after induced failure

Review WAL and busy_timeout assumptions.

Do not add distributed locking.

Do not add Redis.

Use SQLite's actual single-writer architecture.

Use EXPLAIN QUERY PLAN for evidence-based index changes only.

Any new schema fix = new sequential migration.

Create:

docs/DATABASE-RELIABILITY-EVIDENCE.md

Update:

Database Engineering
Concurrency
Transaction Design
Reliability
State Machine
Data Integrity

No commit/push/deploy.
```

---

# Prompt 07 — Complete Business Workflow Closure

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Workflow Architect + QC Business Rules Engineer.

MISSION:

Trace and verify every important workflow from UI → server → DB → audit → notification.

TASKS:

create
assign
edit
start
hold
blocker
comment
attachment
dependency
checklist
recurrence
completion
delete request
approval/rejection
cancel
reopen

QUALITY:

Finding
RCA
CAPA
evidence
review
reject
approve
effective
close

LAB:

draft
samples
environment readings
references
submit
review
return/reject
rework
approve
e-sign
FAIL
PASS
HOLD
VOID
retest
search
print

MASTER DATA:

products
equipment
calibration
maintenance

CONTROLLED DOCUMENTS:

catalog
content
draft
submit
review
approve
acknowledge
new revision
supersede/archive

CHANGE REQUESTS:

submit
withdraw
review
approve
reject
optimistic concurrency
canonical application

For every state machine:

enumerate states
allowed transitions
forbidden transitions
role
ownership
preconditions
side effects
notifications
audit
immutability

Create machine-readable lifecycle specifications.

Add tests for every forbidden transition that matters.

Do not invent policy.

Update:

Workflow Engineering
Functional Correctness
State Machine
QC Workflow UX
Handoff/Queue UX

No commit/push/deploy.
```

---

# Prompt 08 — Documents / MDM / Governance / Lineage

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Data Governance + MDM + Document Control Architect.

MISSION:

Close governance of controlled master data and documents.

Audit:

Products
Equipment
Calibration
Templates
WI
SOP
Documents
Acknowledgements
Change Requests

For each master record establish:

business identifier
canonical owner
source
provenance
revision/version
status
creator
reviewer
approver
effective state
superseded state
audit linkage
downstream references

No direct uncontrolled mutation for contributor roles.

Verify proposal/review model.

Detect:

duplicate codes
case/whitespace identity collisions
orphan relationships
historical records pointing at mutable values
missing snapshots
ambiguous source provenance

WI:

preserve exactly supplied source.

No invented pages.

Catalog-only record remains distinguishable from authored controlled content.

Documents:

approved version immutable
new revision preserves historical version
acknowledgements point to correct version

Create:

docs/DATA-GOVERNANCE-LINEAGE.md

Update:

Document Control
Data Architecture
Data Governance
MDM
Data Quality
Data Lineage
Change/Configuration Management

No commit/push/deploy.
```

---

# Prompt 09 — Backup / DR / Business Continuity / Incident Management

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Reliability + Disaster Recovery Engineer.

MISSION:

Turn backup implementation into an operationally provable recovery capability.

On DISPOSABLE database only:

create realistic data
backup
verify checksum
verify metadata
corrupt a copy
confirm refusal
modify data
restore
reopen DB
verify important records
verify schema
verify integrity_check
verify foreign_key_check
verify audit chains
verify attachments
verify approvals

Test:

interrupted backup
concurrent backup request
missing backup
bad metadata
bad checksum
wrong restore confirmation
no disk space simulation where safe
startup catch-up behavior
retention

Build:

RPO/RTO engineering recommendations,
but do not invent company commitments.

Create:

docs/DISASTER-RECOVERY-VALIDATION.md
docs/INCIDENT-PROBLEM-RUNBOOK.md
docs/BUSINESS-CONTINUITY-RUNBOOK.md

Cover incidents:

DB corruption
disk full
backup failure
login outage
migration failure
AI outage
report failure
lost admin access
suspicious account activity

Define:

detect
contain
recover
verify
record
escalate

No external monitoring dependency required.

Update:

Backup
Restore
DR
Reliability
Operational Risk
Incident Management
Business Continuity

No commit/push/deploy.
```

---

# Prompt 10 — API Governance + Export/Search Contract

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
API Governance Architect.

MISSION:

Inventory and normalize every API and middleware request contract.

Build:

docs/API-CONTRACT-MATRIX.md

For every endpoint/controller:

method
path
purpose
auth
permission
ownership
CSRF
content type
body/query schema
success response
validation response
not found
forbidden
conflict
rate limit
audit
idempotency
caller
tests

Ensure consistent semantics.

Do not expose raw DB exceptions.

Verify IDs always come from trusted path/query semantics,
not forged body fields where that matters.

Audit:

Tasks APIs
Findings
Lab
Notifications
Admin
AI
UX telemetry
Exports
Reports
Health/readiness

SEARCH:

special characters
empty queries
pagination
large result set
RBAC leakage
sorting
filters
saved views
exports

Export security must match screen visibility.

Add contract tests for meaningful inconsistencies.

Update:

API Governance
Search/Filter/Sort UX
Reporting
File Export
Security

No commit/push/deploy.
```

---

# Prompt 11 — Error Architecture + Observability + Monitoring

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Reliability Observability Engineer.

MISSION:

Make failures diagnosable by company operators without leaking sensitive data.

Audit:

request IDs
structured logs
safe error codes
safe messages
health
readiness
system-health
backup status
audit-chain status
migration status
disk status
AI status

Test failure cases:

validation
forbidden
not found
conflict
stale update
DB lock
report failure
upload failure
AI failure
backup failure
expired session

Every server error must have:

safe user message
stable code where useful
request ID
safe structured log
correct HTTP behavior

Never log:

password
hash
session token
raw file
provider key
sensitive evidence body

Add operational alert concepts using existing infrastructure where practical:

backup stale
migration failure
audit-chain fail
disk threshold
readiness fail
calibration attention
critical workflow queues

Do not introduce expensive SaaS.

Create:

docs/OBSERVABILITY-OPERATIONS.md

Update:

Error Architecture
Reliability
Observability
Monitoring
Alerting
Error UX

No commit/push/deploy.
```

---

# Prompt 12 — Deployment / CI / Environments / Supply Chain

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Release + Platform + Secure SDLC Engineer.

MISSION:

Make the application reproducibly releasable.

Audit:

package scripts
Node version
pnpm version
lockfile
Astro build
CI workflows
QC release gate
path filters
required checks
deployment docs
environment contract
secret contract
production build flags

CRITICAL CURRENT GAP TO RE-VERIFY:

apps/qc-task-manager/.env.example currently appears to contain only GROQ_API_KEY=,
while deployment uses multiple operational variables.

Create a SAFE, value-free environment template covering supported variables.

No real secrets.

Clearly label:

required production
optional
test-only
reserved/not implemented

Validate:

NODE_ENV=production
Secure cookie behavior
one SQLite instance
persistent DB
persistent backup dir
health/readiness separation

Review QC GitHub workflow behavior for:

PR
main
nightly
manual
path-filter/required-check deadlock risk

Run dependency/security audit tooling where appropriate.

Do not blindly upgrade every dependency.

Classify upgrades:

SECURITY REQUIRED
COMPATIBILITY REQUIRED
OPTIONAL

Create:

docs/RELEASE-ENVIRONMENT-CONTRACT.md

Update:

Deployment
Release
CI/CD
Environment Management
Secrets
Supply Chain
Dependency Management

No commit/push/deploy.
```

---

# Prompt 13 — Performance + Capacity

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Performance Engineer.

MISSION:

Measure real application performance with realistic disposable QC data.

Do not optimize from intuition.

Create configurable fixture profiles.

Representative large profile should exercise:

tasks
comments
attachments metadata
audit
notifications
findings
Lab tests
samples
products
equipment
calibration
maintenance
documents
change requests
UX events

Benchmark:

dashboard
employee home
supervisor home
manager home
task list
task detail
search
Lab command center
Lab test register
Lab search
documents
equipment
audit
reports

Measure:

p50
p95
max
query count
server timing
report generation
client JS
React hydration
bundle weight

Use EXPLAIN QUERY PLAN.

Only add indexes if measurements justify them.

Any index migration must be sequential.

Check perceived loading UX too.

Create:

docs/PERFORMANCE-CAPACITY-EVIDENCE.md

Do not invent SLA thresholds.

Update:

Performance
Capacity Planning
Load Engineering
Perceived Performance
Data-Driven Design

No commit/push/deploy.
```

---

# Prompt 14 — Product / Enterprise / QC / Role UX

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Enterprise Product Designer + QC UX Architect.

Use relevant repository UX/design skills.

MISSION:

Audit the product as an actual daily QC workplace tool.

Do not perform decorative redesign.

Test independently as:

Employee
Supervisor
Manager
Admin

For each role answer:

What requires attention now?
What should they do next?
Can they find it quickly?
Can they understand status?
Can they recover from errors?
Are unavailable actions explained correctly?
Are high-authority actions clear?

Audit:

global IA
Navbar
role homes
Tasks
Findings
Lab
Reports
Documents
Admin
System Health

Measure navigation decisions and obvious primary actions.

Optimize:

Needs Attention
primary action
secondary actions
progressive disclosure
data density
role relevance

Preserve every permission boundary.

No UX decision may weaken business rules.

Create:

docs/ROLE-BASED-PRODUCT-UX.md

Update:

Product Design
UX Design
Operational UX
QC Workflow UX
Role UX
IA
Interaction Design
Enterprise UX
Lab UX
Compliance UX
Service Design
Navigation

No commit/push/deploy.
```

---

# Prompt 15 — Forms + Accessibility + Human Factors

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Human Factors + Accessibility + Forms Engineer.

MISSION:

Make data entry safe, fast and accessible.

Audit every major form.

Especially:

New Task
Task Update
Completion
Finding
RCA
CAPA
Lab Test
12-sample entry
Product
Equipment
Calibration
Maintenance
Template
Document
Change Request
Admin User
Password Change

Verify:

label
required state
help
units
field order
validation
error location
validation summary
first-invalid focus
keyboard order
save draft
submit
loading
double submit
unsaved changes
paste
bulk entry
mobile behavior

Never infer test results.

Never calculate PASS/FAIL unless canonical approved logic already does it.

Accessibility:

keyboard only
focus-visible
dialog focus trap
Escape
screen reader names
landmarks
headings
tables
ARIA
error announcement
status text
touch targets
reduced motion
200% zoom
320px
360px
390px
768px
1024px
1440px

Automated target:

Critical Axe = 0
Serious Axe = 0

Do not disable rules.

Create:

docs/FORM-A11Y-HUMAN-FACTORS-QA.md

Clearly separate automated evidence from HUMAN testing.

Update domains 25,26,28,54,55,56,64.

No commit/push/deploy.
```

---

# Prompt 16 — Design System + Visual System

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Design Systems Architect.

Use repository design/UI/layout/typography/color/accessibility skills.

MISSION:

Finish design-system adoption without redesigning working workflows.

Audit:

AppButton
Status badges
PageHeader
Banners
EmptyState
OperationalState
Forms
Cards
Tables
Dialogs
Navigation
Charts

Find raw legacy styles on:

detail pages
admin surfaces
Lab details
Finding details
other route-specific controls

Consolidate only when it reduces actual drift.

Define/verify:

tokens
spacing
type scale
layout widths
radius
borders
shadows
semantic colors
status colors
danger
focus
icons
component states

Status must never depend on color alone.

Icon-only controls require accessible name.

Motion:

purposeful only
no transition:all
no operational hover movement
reduced motion
no parallax/marketing animation

Motion & Digital Art must remain subordinate to an internal QC application's
clarity and performance.

Create:

docs/DESIGN-SYSTEM-CLOSURE.md

Update:

Design System
UI
Visual Design
Visual Hierarchy
Component Architecture
Component States
Design Tokens
Typography
Spacing
Color
Iconography
Microinteractions
Motion
Motion/Digital Art

No commit/push/deploy.
```

---

# Prompt 17 — Dashboard + Data Visualization + Tables

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Dashboard + Data Visualization Designer.

MISSION:

Make operational data decision-oriented, not decorative.

Audit all:

dashboard KPIs
Lab dashboards
management dashboard
charts
tables
registers
audit tables
reports preview
data quality

For every visualization establish:

business question
metric definition
data source
filter
scope
role
empty state
accessible alternative

No misleading chart.

No duplicate KPI with conflicting query logic.

Verify native/table alternative where needed.

TABLES:

column priority
sorting
filters
pagination
density
sticky headers where justified
row actions
status
dates
mobile horizontal strategy
empty state
record count

Do not convert comparison tables to cards just for mobile aesthetics.

Create:

docs/DASHBOARD-DATA-VIS-QA.md

Update:

Dashboard
Data Visualization
Data-Driven Design
Advanced Tables
Data Density
Search/Filter

No commit/push/deploy.
```

---

# Prompt 18 — Notifications / Queue / Handoff / Audit UX

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Workflow Communication Architect.

MISSION:

Close human handoffs between contributors, reviewers and approvers.

Audit notification creation for every workflow.

Verify:

recipient
dedupe
entity
link
read state
inactive-user handling
transaction boundary
stale link
duplicate alert

Cover:

task assignment
task completion
delete request
Finding
RCA/CAPA
Lab submit
Lab reject/return
Lab approval
retest
document review
document approval
acknowledgement
change request
calibration/equipment warnings

Queue UX must show:

what needs action
why
age
priority/risk
record
actor
next action

Audit Timeline UX must be readable without weakening immutable raw history.

Create:

docs/HANDOFF-NOTIFICATION-AUDIT-UX.md

Update:

Handoff
Escalation
Queue UX
Notifications
Audit Timeline UX

No commit/push/deploy.
```

---

# Prompt 19 — Microcopy / Recovery / Draft / Destructive UX

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
UX Writing + Error Recovery Designer.

MISSION:

Normalize system language and recovery behavior.

Create terminology glossary.

Audit:

page titles
buttons
statuses
field labels
helper text
validation
alerts
empty states
success messages
errors
confirmations

Same operation = same term everywhere.

Avoid vague buttons:

Submit
Process
Confirm
Action

when a precise action is available.

Prefer:

Submit for Review
Approve Test
Return for Changes
Void Test
Archive Document
Save Draft

Review:

loading
unknown save state
stale record
session expiry
permission denial
not found
empty result
offline/network interruption
unsaved changes
draft recovery
destructive confirmation

For destructive actions include consequence.

Security/privacy-related messages must not reveal sensitive implementation details.

Create:

docs/CONTENT-RECOVERY-GOVERNANCE.md

Update:

UX Writing
Error UX
Loading UX
Draft UX
Destructive UX
Security UX
Privacy UX
Authentication UX

No commit/push/deploy.
```

---

# Prompt 20 — UX Research + UAT + Task Success Metrics

هذا الجزء ما يقدر الـAgent يزوّر نتيجته.

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
UX Research Lead.

MISSION:

Prepare objective company-user validation.

Do not fabricate participants.
Do not fabricate UAT results.
Do not call automated tests human research.

Use existing ux_events architecture where appropriate.

Audit existing telemetry for privacy and usefulness.

Define role-based scenarios.

EMPLOYEE:
task work
finding
Lab test
12 sample entry
WI
search

SUPERVISOR:
team work
review
return changes
documents
queues

MANAGER:
approvals
change requests
reports
calibration risk
audit

ADMIN:
users
password reset
system health
backup

For every scenario capture:

success
time
clicks
errors
backtracking
assistance
abandonment
confusion
comments

Create:

docs/FINAL-UX-RESEARCH-PROTOCOL.md
docs/FINAL-UAT-RESULTS-TEMPLATE.md

Define baseline queries over ux_events without identifying individual employees.

After REAL user data is supplied:

analyze it,
identify high-friction paths,
fix only verified issues,
rerun validation.

Until real sessions happen, mark:

HUMAN VALIDATION REQUIRED.

Update:

UX Research
Usability Testing
Task Success
Time-on-Task
Design QA
Design System Governance
Human Factors

No commit/push/deploy.
```

---

# Prompt 21 — AI Governance + Evals + HITL

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
AI Governance + AI Evaluation Engineer.

MISSION:

Make advisory AI measurable, safe and replaceable without making it authoritative.

Inventory every AI feature.

For each:

feature
user
purpose
prompt
context
data sent
provider
model
schema
output
fallback
audit
rate limit
human decision point

Non-negotiable:

AI never determines PASS/FAIL.
AI never approves.
AI never changes workflow state.
AI never bypasses permissions.
Core application works with no provider.

Review whether rate limiting exists in more than one independent implementation
and consolidate only if current architecture risks drift.

Create deterministic evaluation corpus using SYNTHETIC/non-sensitive QC cases.

Evaluate:

schema validity
hallucination
unsupported claims
unsafe procedural recommendations
prompt injection
data leakage
wrong confidence
provider errors
timeouts
malformed output

Do not put real controlled test values into synthetic data unless already approved
for that exact purpose.

Version:

prompt contract
model
evaluation dataset
expected guardrail behavior

Create:

docs/AI-GOVERNANCE.md
docs/AI-EVALS.md

HITL UI must explicitly show:

Advisory
Review required
No automatic quality decision

Update:

AI Governance
AI Safety
AI Evals
Model Risk
Human-in-the-Loop UX

No commit/push/deploy.
```

---

# Prompt 22 — Maintainability / DevEx / Tech Debt

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Principal Software Engineer.

MISSION:

Reduce maintainability risk without architecture churn.

Run architecture/dependency analysis.

Find:

dead code
dead route
unused component
unused export
duplicate validation
duplicate status mapping
duplicate permission logic
duplicate SQL
large modules
fragile coupling
TODO/FIXME/HACK
source-string tests
deprecated compatibility paths

Pay particular attention to:

large Lab modules
validation.ts
dashboard.ts
large React/Astro components

Do not split files solely based on line count.

Refactor only when cohesion improves.

Preserve public internal APIs where practical.

Add characterization tests before risky refactors.

Audit dependencies:

unused
wrong dependency type
duplicate capability
known vulnerability
unnecessary client weight

Improve developer commands/docs where they reduce operator errors.

Create:

docs/TECH-DEBT-REGISTER.md
docs/DEVEX-GUIDE.md

Update:

Maintainability
Code Quality
DevEx
Technical Debt
Dependency Management
Software Architecture
Component Architecture

No commit/push/deploy.
```

---

# Prompt 23 — Documentation + Configuration Source-of-Truth

هذا مهم جدًا بالنظام الحالي.

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Configuration + Technical Documentation Engineer.

MISSION:

Make documentation accurately describe CURRENT source.

Do not implement functionality based only on stale docs.

Audit every QC documentation file against source.

KNOWN DRIFT TO RE-VERIFY:

README may still describe Lab as staged/PROMPT 03 and an old 12-table schema.

DEPLOYMENT.md may show readiness schemaVersion 38 even though current migration
registry may be later.

SECURITY.md may describe SESSION_SECRET/JWT_SECRET inconsistently with runtime.

.env.example may list only GROQ_API_KEY while deployment requires other variables.

Fix documentation only AFTER confirming actual current implementation.

Generate documentation automatically from source where practical for:

latest migration
route count
test suite count

Do not hardcode counts likely to drift if they can be derived.

Synchronize:

README
SECURITY
DEPLOYMENT
DATABASE
RESTORE
TESTING
ROLES/PERMISSIONS
AI
UAT
environment template

Mark external/manual steps clearly.

Create:

docs/DOCUMENTATION-SOURCE-TRUTH-AUDIT.md

Add a documentation drift test only for facts that can be reliably machine-checked.

Update:

Configuration Management
Environment Management
DevEx
Operational Readiness
Content Governance

No commit/push/deploy.
```

---

# Prompt 24 — Real Deployment + Company Operational Validation

هذا برومبت خاص بالمرحلة اللي بعدها، ولا يسمح له يقول نجح إذا ما عنده وصول حقيقي.

```text
@Superpowers @GitHub

Read FINAL-CLOSURE-CONTRACT.md.

ROLE:
Company Pilot Operations Verifier.

MISSION:

Verify the ACTUAL deployed QC service.

Do not simulate live verification.

If the real service/environment is unavailable:

produce exact operator commands/checklist
and mark each item NOT VERIFIED.

Do not fabricate PASS.

Validate:

one writable instance
persistent disk
QC_DATABASE_PATH
QC_BACKUP_DIR
HTTPS
health
readiness
current commit/version
latest migration
integrity_check
foreign_key_check
audit chain
disk
backup
scheduled backup
restore drill on maintenance copy
restart persistence
admin password rotation
AI safe mode
secret configuration

Run actual role logins:

employee
supervisor
manager
admin

Run actual smoke workflows.

Then perform real-device:

desktop
tablet
phone

and assistive technology where available.

Do not expose production data in logs/screenshots.

Create:

docs/LIVE-COMPANY-PILOT-EVIDENCE.md

Every check must be:

VERIFIED
FAILED
NOT VERIFIED
NOT APPLICABLE

Never infer.

No push.
No automatic production mutation.
No destructive live restore.
```

---

# Prompt 25 — Ultimate 100-Domain Final Gate

هذا **آخر برومبت فقط** بعد تنفيذ الباقي.

```text
@Superpowers @GitHub

TASK:
QC ULTIMATE 100-DOMAIN SYSTEM CLOSURE GATE

ROLE:
Independent Principal System Verifier.

REPOSITORY:
YEEEAE/BRIGHTAI

APPLICATION:
apps/qc-task-manager/

MISSION:

Re-audit the entire application independently AFTER all previous final-closing
tasks have been executed.

DO NOT trust their completion messages.

DO NOT trust their percentages.

DO NOT trust their reports without re-verification.

Read:

AGENTS.md
.agents/AGENTS.md
CLAUDE.md
entire .agents/mind/01-mind-latest.md
FINAL-CLOSURE-CONTRACT.md
FINAL-100-DOMAIN-COVERAGE.md

Freeze:

HEAD
branch
git status
diff
Node
pnpm
environment class

Audit EVERY relevant source file.

Audit every route.

Audit every middleware controller.

Audit every migration.

Audit every business workflow.

Run:

typecheck
test manifest
route manifest
embedded migration parity
migration tests
architecture
security
RBAC
privacy
database
audit
e-signature
documents
Lab
reports
backup
performance
a11y
responsive
UI/design contracts
full canonical test suite
production build
full E2E acceptance

On disposable database run:

fresh migration
upgrade
integrity_check
foreign_key_check
audit chains
backup
verification
restore
restart persistence

Verify real workflows:

Task
Finding
RCA
CAPA
Lab test
12 samples
review
return
rework
approval
e-sign
VOID
Retest
Products
Equipment
Calibration
Maintenance
Documents
WI/SOP
Acknowledgements
Change Requests
Search
Notifications
Reports CSV/XLSX/PDF
Admin users
Password reset
System Health

Re-check EVERY previous finding.

Status:

CLOSED
PARTIAL
OPEN
REGRESSED
EXTERNAL
SOURCE-BLOCKED
HUMAN-VALIDATION-REQUIRED

Then score all 100 requested domains independently.

For EACH domain provide:

Target %
Achieved %
Confidence %
Source Evidence
Test Evidence
Runtime Evidence
Human Evidence
Remaining Gap
P0
P1
P2
What prevents target

The 100 domains are:

1 Quality Engineering & Verification / Validation
2 QC Compliance Engineering / QMS Integration
3 Security Engineering / AppSec
4 Data Integrity & Records Integrity
5 Auditability & Traceability Engineering
6 Authentication / IAM / RBAC / Authorization
7 Database Engineering & Reliability
8 Workflow & Business Rules Engineering
9 Backup / Restore / Disaster Recovery
10 Requirements Engineering & Business Analysis
11 Software Architecture
12 Functional Workflow Correctness
13 Testing Architecture
14 Risk Management
15 Electronic Records / Approval / E-Signature Integrity
16 Document Control
17 Data Architecture & Governance
18 State Machine / Lifecycle
19 Error Architecture
20 Reliability / Resilience
21 Privacy Engineering
22 Operational UX
23 QC Workflow UX
24 Role-Based UX
25 Advanced Form Design
26 Accessibility
27 Information Architecture & Permissions
28 Human Factors / Ergonomics
29 Performance
30 Observability / Monitoring / Alerting
31 Deployment / Release
32 Change / Configuration Management
33 Maintainability
34 API Design / Governance
35 Concurrency / Transaction Design
36 File / Attachment Security
37 Product Design / Strategy
38 UX Design
39 Information Architecture
40 Interaction Design
41 Design System
42 Enterprise UX
43 Laboratory UX
44 Compliance UX
45 Dashboard Design
46 Data Visualization
47 Data-Driven Design
48 Advanced Table / Data Density
49 Search / Filter / Sorting UX
50 Navigation / Wayfinding
51 UI Design
52 Visual Design
53 Visual / Content Hierarchy
54 Responsive / Adaptive
55 Keyboard / Focus
56 Screen Reader / Semantic UX
57 Service Design
58 Handoff / Escalation / Queue UX
59 Notification Architecture / UX
60 Audit Trail / Timeline UX
61 UX Writing / Microcopy
62 Error / Recovery UX
63 Loading / Latency UX
64 Unsaved Changes / Draft / Autosave
65 Destructive Action UX
66 UX Research / Usability Testing
67 Task Success / Time-on-Task
68 Design QA / UX QA
69 Design System Governance
70 Security UX
71 Privacy UX
72 Authentication / Session UX
73 Print / PDF / Export UX
74 Reporting Architecture / UX
75 Master Data Management
76 Data Quality Engineering
77 Data Lineage
78 CI/CD
79 Secure SDLC / Supply Chain
80 Environment Management
81 Secrets Management
82 Incident / Problem Management
83 Business Continuity
84 Capacity / Load Engineering
85 Developer Experience
86 Technical Debt
87 Dependency Management
88 Content / Terminology Governance
89 Component Architecture
90 Component States
91 Design Tokens
92 Typography / Spacing / Layout
93 Semantic Color
94 Iconography
95 Microinteractions
96 Motion Design
97 Motion & Digital Art
98 AI Governance / Safety
99 AI Evals / Model Risk
100 Human-in-the-Loop AI UX

TARGET SCORES:

Respect the target percentages defined by the user.

But NEVER fake a target score.

100% requires sufficient evidence.

If Human UAT is required and absent:
do not claim human-tested 100%.

Produce:

docs/ULTIMATE-100-DOMAIN-FINAL-REPORT.md
docs/ULTIMATE-100-DOMAIN-FINDINGS.json
docs/ULTIMATE-RELEASE-EVIDENCE.md

Calculate separately:

Implementation Completeness %
Engineering Quality %
Security Readiness %
QC/QMS Readiness %
UX Technical Readiness %
Human UX Validation %
Operational Readiness %
Production Readiness %

Do not use simple average for final production readiness.

Weight critical domains heavily:

security
data integrity
audit
RBAC
database
workflows
backup
release verification

FINAL CLASSIFICATION exactly one:

GO
CONDITIONAL GO
NO-GO

GO is forbidden if:

any P0 remains
full tests fail
route manifest fails
build fails
E2E fails
DB integrity fails
FK fails
audit chain fails
report generation fails
backup/restore proof fails
known production secret remains
critical authorization issue remains

If human testing has not happened:

state separately:

RUNTIME USER UAT REQUIRED

Do NOT make that disappear by inflating automated scores.

Final response in Saudi Arabic with:

current HEAD
commands + exit codes
total routes
total migrations
total canonical tests
total E2E suites
all P0/P1/P2
100-domain table
before/after comparison
remaining external actions
final readiness percentages
GO / CONDITIONAL GO / NO-GO

No commit.
No push.
No deploy.
```

## خريطة التغطية

الحزمة فوق ما هي Features إضافية عشوائية. توزيعها كالتالي:

| البرومبت | يغطي بشكل رئيسي                     |
| -------- | ----------------------------------- |
| 00       | كل الـ100 + Source Truth            |
| 01       | 1, 12, 13, 34, 73, 74               |
| 02       | 1, 10, 12, 13, 14                   |
| 03       | 2, 10, 14, 16, 32, 44, 57           |
| 04       | 4, 5, 15, 17, 18, 60, 77            |
| 05       | 3, 6, 21, 36, 70, 71, 72, 79, 81    |
| 06       | 4, 7, 18, 20, 35                    |
| 07       | 8, 12, 18, 23, 43, 58               |
| 08       | 16, 17, 32, 75, 76, 77              |
| 09       | 9, 14, 20, 82, 83                   |
| 10       | 34, 36, 49, 73, 74                  |
| 11       | 19, 20, 30, 62                      |
| 12       | 31, 32, 78, 79, 80, 81, 87          |
| 13       | 29, 47, 63, 84                      |
| 14       | 22,23,24,37,38,39,40,42,43,44,50,57 |
| 15       | 25,26,28,54,55,56,64                |
| 16       | 41,51,52,53,69,89–97                |
| 17       | 45–49                               |
| 18       | 58,59,60                            |
| 19       | 61–65,70–72,88                      |
| 20       | 28,66,67,68,69                      |
| 21       | 98,99,100                           |
| 22       | 11,33,85,86,87,89                   |
| 23       | 32,80,85,88                         |
| 24       | 9,20,28–31,66,78,82–84              |
| 25       | **كل الـ100 من جديد**               |

### ترتيب التنفيذ

نفّذها بهذا الترتيب كما هي:

`00 → 01 → 02 → 03 → ... → 24 → 25`

ولا أشوف مناسب تجمعها كلها في جلسة GLM واحدة. كل برومبت لازم ينتهي بالتحقق الخاص فيه قبل اللي بعده، خصوصًا **01 و02 و04 و05 و06 و09 و12**.

النقطة الأهم: بعد هذه الحزمة، **Prompt 25 ما يسمح للنظام يوصل 100% بالكلام**. إما فيه source + test + runtime evidence، أو تبقى النسبة أقل. وهذا بالضبط اللي نحتاجه عشان آخر تقرير يكون مرجعي فعلاً، مو مجرد “كل شيء PASS”.
