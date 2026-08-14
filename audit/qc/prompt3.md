أكيد. وبما إنك تبي **Groq + `llama-3.3-70b-versatile`** مربوط فعليًا داخل النظام، بأعيد بناء الحزمة كاملة بحيث تكون الـAI Architecture من البداية مصممة لـGroq.

**تنبيه مهم جدًا:** المفتاح اللي أرسلته هنا صار مكشوفًا، لذلك أنصحك **تلغيه وتطلع API key جديد من Groq**. ما راح أعيد كتابة المفتاح داخل البرومبتات أو داخل الرد. الوكيل يقدر يأخذ المفتاح الذي ستضعه أنت في `.env` محليًا.

والتصميم اللي أبيه يكون:

```text
UI
 ↓
Server/API
 ↓
AI Service
 ↓
Groq API
 ↓
llama-3.3-70b-versatile
```

**ولا يصل `GROQ_API_KEY` نهائيًا للـbrowser.**

وبرضه بما أن مشروعك Astro SSR، نخلي استدعاء Groq **server-side فقط**.

---

# المجموعة الأولى — البنية الأساسية + الأمان + قاعدة البيانات

هذي البرومبتات من `00 → 06`. شغّلها بالترتيب.

# PROMPT 00 — MASTER BASELINE & IMPLEMENTATION AUDIT

أنت Senior Staff Engineer + Solution Architect + Security Engineer + QA Architect متخصص في:

Astro 6
Node.js SSR
TypeScript
SQLite
RBAC
QC Operations
Compliance Systems
AI Governance
Groq API

المشروع:
`YEEEAE/BRIGHTAI`

التطبيق المستهدف فقط:

`apps/qc-task-manager/`

---

## IMPORTANT

لا تعِد بناء أي شيء موجود.

لا تنشئ duplicate business logic.

لا تستبدل architecture الحالي بدون سبب.

اعتبر الكود الحالي Source of Truth.

استخدم الوثائق الحالية كمراجع فقط.

راجع:

* `audit/qc/`
* `apps/qc-task-manager/docs/`
* `docs/superpowers/`

---

# 1. FULL CODEBASE ANALYSIS

حلل:

* package.json
* src/
* db/
* migrations
* API routes
* Astro pages
* React components
* authentication
* authorization
* task-policy
* validation
* activity logging
* attachments
* notifications
* backup
* tests
* E2E
* deployment
* environment configuration

---

# 2. EXISTING FEATURES

اكتشف ما هو موجود فعليًا.

صنف كل feature:

IMPLEMENTED
PARTIAL
MISSING
BROKEN
NEEDS VERIFICATION

---

# 3. ARCHITECTURE

حدد:

* Frontend
* SSR
* API
* Database
* Authentication
* Authorization
* Domain Layer
* Services
* AI Layer إن وجدت
* File Storage
* Audit
* Notifications

---

# 4. DATABASE

حدد:

* tables
* indexes
* foreign keys
* constraints
* migrations
* schema version
* backup mechanisms

---

# 5. SECURITY

افحص:

* IDOR
* CSRF
* RBAC
* session security
* upload security
* secrets
* environment variables
* API authorization
* rate limiting
* sensitive logging

---

# 6. AI READINESS

حدد جميع الأماكن التي يمكن أن تستفيد من AI:

* Task analysis
* QC Finding analysis
* RCA assistance
* CAPA assistance
* Management summaries
* Evidence analysis

لكن لا تضف AI الآن.

---

# 7. OUTPUT

أنشئ:

`apps/qc-task-manager/docs/MASTER-BASELINE-AUDIT.md`

يتضمن:

Architecture
Features
Database
Security
Testing
AI readiness
Technical debt
Missing features
Recommended execution order

وأعط:

CORE COMPLETION %
SECURITY %
TESTING %
DATABASE %
AI READINESS %
PRODUCTION READINESS %
OVERALL %

لا تعدل الكود في هذه المرحلة.

شغّل فقط أدوات القراءة والتحليل والاختبارات الموجودة.

# PROMPT 01 — PRODUCTION DATABASE MIGRATIONS

اعتمد على:

`docs/MASTER-BASELINE-AUDIT.md`

طوّر Database Migration Architecture حقيقية لتطبيق:

`apps/qc-task-manager/`

---

# GOAL

منع اختلاف:

Application Code
Database Schema
Existing SQLite Database

---

# IMPLEMENT

أنشئ:

`db/migrations/`

بنظام sequential migrations:

001_initial
002_xxx
003_xxx
...

أنشئ:

`schema_migrations`

ويحتوي:

version
name
checksum
applied_at

---

# RULES

1. لا تعمل migration مرتين.
2. لا تفقد البيانات.
3. migrations يجب أن تكون deterministic.
4. سجل failures.
5. تحقق من foreign keys.
6. تحقق من schema version عند startup.
7. امنع destructive migration غير المقصودة.
8. migration history يجب أن تكون واضحة.
9. Backup قبل migrations الخطرة.
10. لا تعتمد على schema.sql وحده لتتبع history.

---

# COMPATIBILITY

اختبر:

Fresh DB
Existing DB
Upgrade DB
Repeated migration
Failed migration
Recovery

---

# TESTS

أضف اختبارات:

Migration
Rollback/failure
Data preservation
FK integrity
Schema version

---

# DOCUMENTATION

حدّث:

`docs/DATABASE.md`

وأنشئ:

`docs/MIGRATIONS.md`

---

# VERIFICATION

شغّل فعليًا:

pnpm typecheck
pnpm test
pnpm build

لا تدّعي نجاح شيء لم يتم تشغيله.

# PROMPT 02 — COMPLETE SECURITY HARDENING

نفذ Security Hardening شامل.

لا تكسر Business Rules الحالية.

---

# AUTHENTICATION

راجع:

* Session fixation
* Session rotation
* Expiration
* Logout
* Password handling
* Login attempts
* Account lockout

---

# AUTHORIZATION

اختبر جميع الأدوار:

Admin
Manager
Supervisor
Employee

اختبر:

Horizontal privilege escalation
Vertical privilege escalation
IDOR

خصوصًا:

Task
Comment
Evidence
Finding
CAPA
Reports
Users
Audit logs

---

# FIELD LOCKING

يجب أن يكون server-side.

راجع:

title
description
department
assigned_to
due_date
priority
recurrence
checklist
dependencies

لا تثق بالـUI.

---

# API SECURITY

طبّق عند الحاجة:

CSRF
Rate limiting
Request validation
Body limits
Secure headers
Content-Type validation

---

# FILE SECURITY

تحقق من:

Extension
MIME
Magic bytes
File size
Filename normalization
Path traversal
Hash

لا تسمح executable files.

---

# SECRET SECURITY

ممنوع:

API keys داخل source code.

ممنوع:

API keys داخل frontend.

ممنوع:

API keys داخل logs.

ممنوع:

API keys داخل Git.

---

# GROQ SECURITY

أنشئ environment variable:

`GROQ_API_KEY`

والـmodel:

`llama-3.3-70b-versatile`

يجب أن يكون استدعاء Groq:

SERVER SIDE ONLY.

لا ترسل:

`GROQ_API_KEY`

إلى client bundle.

لا تضعه في:

React props
HTML
Astro page data
public/
localStorage
sessionStorage

---

# ENVIRONMENT

إذا كان `.env` موجودًا:

أضف المتغير له محليًا.

إذا كان `.env.example` موجودًا:

أضف:

`GROQ_API_KEY=`

بدون القيمة السرية.

إذا كان `.gitignore` لا يحمي `.env`:

أصلحه.

إذا اكتشفت secret committed سابقًا:

لا تكتفِ بحذفه من الملف الحالي؛ اعتبره compromised ووضح ذلك في التقرير.

---

# OUTPUT

أنشئ:

`docs/SECURITY-AUDIT.md`

مع:

PASS
FAIL
FIXED
RISK

ثم شغّل:

pnpm typecheck
pnpm test
pnpm build
pnpm e2e:acceptance

# PROMPT 03 — COMPLETE AUTOMATED TESTING

ارفع Testing Architecture إلى Production Grade.

---

# UNIT TESTS

اختبر:

task-policy
status transitions
field locking
permissions
validation
recurrence
dependencies
checklists
SLA
risk
findings
CAPA
workflow
AI validation

---

# DATABASE TESTS

اختبر:

constraints
foreign keys
indexes
migrations
transactions
concurrency
data integrity

---

# API TESTS

لكل endpoint اختبر:

Admin
Manager
Supervisor
Employee
Unauthenticated

---

# SECURITY TESTS

اختبر:

IDOR
role escalation
field tampering
unauthorized downloads
unauthorized reports
unauthorized audit access

---

# E2E

اختبر:

Login
Create Task
Assign
Update
Comment
Checklist
Evidence
Completion
Reopen
Delete Request
Approval
Notification
Dashboard
Reports

---

# QC E2E

أضف لاحقًا سيناريوهات:

Finding
CAPA
RCA
SLA
Escalation
Approval

---

# AI TESTS

لا تستخدم live Groq API في كل test.

أنشئ provider abstraction يسمح بـmock provider.

اختبر:

Valid AI response
Malformed response
Timeout
429
500
Network failure
Invalid JSON
Schema validation

---

# OUTPUT

أنشئ:

`docs/TEST-COVERAGE-REPORT.md`

استخدم أرقام حقيقية من الاختبارات.

لا تكتب PASS بدون تشغيل الاختبار.

# PROMPT 04 — BACKUP & DISASTER RECOVERY

طوّر Backup/Restore.

---

# BACKUP

احفظ:

SQLite DB
Schema version
Application version
Timestamp
Checksum

استخدم consistent SQLite snapshot.

---

# VERIFY

بعد إنشاء backup:

Create temporary DB
Restore
Run integrity_check
Run foreign_key_check
Check schema version
Compare important record counts

النتيجة:

PASS
FAIL

---

# RETENTION

أضف configurable retention.

---

# ADMIN

اعرض:

Last Backup
Backup Size
Backup Status
Last Verification
Manual Backup

---

# RESTORE SAFETY

لا تسمح باستبدال Production DB مباشرة بدون:

confirmation
backup
integrity verification

---

# TEST

اختبر:

Backup
Restore
Corrupt backup
Missing file
Wrong schema
Failed restore

---

# DOCUMENT

أنشئ:

`docs/DISASTER-RECOVERY.md`

# PROMPT 05 — ARCHITECTURE GUARD

أنشئ Architecture Guard.

---

# SINGLE SOURCE OF TRUTH

راجع الـdomain architecture الحالية.

Business rules يجب أن تكون مركزية.

خصوصًا:

RBAC
Task policy
Validation
Status transitions
Field locking

---

# TARGET STRUCTURE

إذا كانت متوافقة مع architecture الحالية:

`src/lib/task-policy.ts`

لـTask rules.

وأنشئ/استخدم طبقات واضحة:

`src/lib/sla/`
`src/lib/workflows/`
`src/lib/audit/`
`src/lib/ai/`
`src/lib/findings/`
`src/lib/capa/`

---

# RULE

UI لا يحتوي authorization authority.

API لا يثق بالـUI.

AI لا يملك business authority.

Database يحمي invariants المهمة.

Audit server-side.

---

# DUPLICATION

ابحث عن:

duplicate permission logic
duplicate status logic
duplicate validation
duplicate field locking
duplicate calculations

وحّدها.

---

# DOCUMENT

أنشئ:

`docs/SINGLE-SOURCE-OF-TRUTH.md`

وحدّث:

`docs/ARCHITECTURE.md`
`docs/SECURITY.md`

---

# المجموعة الثانية — QC Operations

هنا يبدأ تحويل التطبيق من Task Manager إلى **QC Operations Platform**.

# PROMPT 06 — SLA + ESCALATION ENGINE

اعتمد على baseline والـarchitecture الحالية.

أضف SLA Engine.

---

# SLA POLICY

أنشئ configurable policies:

SLA Policy
Priority
Department
Task Type
Target Duration
Warning %
Critical %

مثال:

URGENT
24h
Warning 70%
Critical 90%

---

# TASK SLA

أضف:

sla_policy_id
sla_started_at
sla_due_at
sla_paused_at
sla_elapsed_seconds
sla_remaining_seconds
sla_percent_used
sla_status

Statuses:

NORMAL
AT_RISK
CRITICAL
BREACHED
PAUSED

---

# IMPORTANT

لا تفترض أن On Hold يوقف SLA.

اجعل behavior configurable.

Server time هو مصدر الحقيقة.

---

# DASHBOARD

أضف:

SLA Compliance
At Risk
Critical
Breached
Average Resolution
Average SLA Consumption

---

# ESCALATION

أنشئ:

escalation_policies
escalation_events

مثال:

80%:
Employee

90%:
Employee + Supervisor

100%:
Supervisor + Manager

120%:
Manager + Admin

---

# IDEMPOTENCY

لا ترسل نفس escalation مرتين.

استخدم unique/idempotency key.

---

# NOTIFICATION

ابدأ بـIn-App.

صمم abstraction لاحقًا:

Email
Teams
WhatsApp

لا تربط الخدمات الخارجية الآن.

---

# AUDIT

سجل:

Trigger
Rule
Recipient
Timestamp
Delivery Status

---

# TESTS

Timezone
On Hold
Reopen
Complete
Overdue
Duplicate escalation
Retry
Failure
Recovery

# PROMPT 07 — QC FINDINGS + CAPA + RCA

حوّل النظام إلى QC Operations Platform.

لا تستبدل Task model.

---

# FINDINGS

أنشئ:

QC Finding

Fields:

finding_number
task_id
inspection_type
classification
severity
risk
description
requirement_reference
owner
due_date
status
closure_evidence
closed_by
closed_at

Classification:

Conforming
Observation
Minor
Major
Critical

Lifecycle:

OPEN
UNDER_REVIEW
ACTION_REQUIRED
VERIFICATION
CLOSED
REOPENED

---

# CRITICAL RULE

Critical Finding لا يمكن إغلاقه مباشرة.

يتطلب:

Corrective Action
Evidence
Verification
Approval

---

# CAPA

أنشئ CAPA مرتبطًا بالFinding.

Fields:

problem_statement
root_cause
corrective_action
preventive_action
owner
due_date
evidence
effectiveness_check
reviewer
approval

Lifecycle:

DRAFT
OPEN
IMPLEMENTATION
VERIFICATION
EFFECTIVE
CLOSED
REOPENED

---

# RCA

دعم:

5 Whys
Fishbone
Free-form

Fishbone:

People
Process
Equipment
Material
Environment
Measurement
Management

---

# CLOSURE

CAPA لا يغلق بدون:

Action complete
Evidence
Effectiveness review
Approval

---

# RBAC

Employee:
assigned actions

Supervisor:
review

Manager:
approval

Admin:
full control

---

# AUDIT

كل:

Create
Update
Status transition
Approval
Rejection
Closure
Reopen

يسجل.

---

# UI

أنشئ:

`/findings`
`/findings/[id]`

وأضف:

Finding Timeline
RCA
CAPA
Evidence
Approval
Audit

# PROMPT 08 — EVIDENCE GOVERNANCE + TASK TEMPLATES

طوّر Evidence architecture الحالية.

---

# EVIDENCE REQUIREMENTS

كل Task Type يمكن أن يحدد:

Required Evidence
Optional Evidence
Evidence Type

مثال:

Inspection:

Inspection Report REQUIRED
Photo REQUIRED
Measurement XLSX OPTIONAL

---

# COMPLETION GATE

إذا Evidence Required ناقص:

لا تسمح بالـcompletion.

يجب أن يكون server-side.

---

# METADATA

Evidence يحتوي:

type
description
source
collected_at
collected_by
hash
size
mime
verification_status

---

# HASH

استخدم SHA-256.

---

# STATUS

UNVERIFIED
VALID
REJECTED
AI_REVIEWED
HUMAN_VERIFIED

---

# FILE SECURITY

تحقق:

MIME
Magic bytes
Size
Extension
Authorization

---

# TASK TEMPLATES

أنشئ Templates تحتوي:

Title
Description
Department
Priority
SLA
Checklist
Required Evidence
Recurrence
Finding Defaults
Assignment Rules

Lifecycle:

DRAFT
ACTIVE
ARCHIVED

---

# SNAPSHOT

عند إنشاء Task من Template:

انسخ configuration snapshot.

لا تجعل Task القديمة تتغير إذا تغير Template.

---

# EXAMPLES

Daily Inspection
Weekly QC Review
Monthly Audit
Material Inspection
Non-Conformance Review

---

# TESTS

Evidence:

wrong MIME
wrong signature
oversized
duplicate
unauthorized
replacement

Templates:

create
edit
archive
instantiate
snapshot

# PROMPT 09 — APPROVAL WORKFLOW + WORKLOAD MANAGEMENT

أضف Workflow Engine.

---

# RBAC VS WORKFLOW

RBAC:

WHO CAN DO WHAT

Workflow:

WHAT MUST HAPPEN BEFORE CLOSURE

---

# EXAMPLE

Normal Task:

Employee
→ Completed

Critical Finding:

Employee
→ Supervisor Review
→ Manager Approval
→ Closed

---

# TABLES

workflow_definitions
workflow_steps
workflow_instances
workflow_actions

كل Step:

role
order
required
approval_type
SLA

---

# REJECTION

عند rejection:

previous state
reason
actor
timestamp

يجب أن يكون واضحًا.

---

# SNAPSHOT

Workflow instance يجب أن يحتفظ بنسخة من definition وقت الإنشاء.

لا تجعل تعديل workflow يؤثر على التاريخ.

---

# WORKLOAD

لكل موظف احسب:

Active Tasks
Overdue
At Risk
Critical
On Hold
Completion Rate
Average Resolution
Workload Score

---

# SMART ASSIGNMENT

عند إنشاء Task:

اقترح أفضل 3 موظفين.

اعتمد على:

Current workload
Department
Skills إن كانت موجودة
Historical completion
SLA pressure

لا تعمل auto-assignment بدون approval.

---

# EXPLAINABILITY

اعرض:

Why recommended?

مثال:

Low workload
Same department
Strong completion history
No critical SLA

---

# PRIVACY

Employee لا يرى بيانات مقارنة الآخرين إلا بصلاحية.

---

# المجموعة الثالثة — Dashboard + AI + Audit + Production

وهنا أهم تعديل مقارنة بالنسخة السابقة: **Groq صار Provider حقيقي داخل architecture، مو مجرد فكرة.**

# PROMPT 10 — ADVANCED DASHBOARD + REPORTING

طوّر Dashboard الحالية ولا تحذف KPIs الموجودة.

---

# KPIs

Total Tasks
Completion Rate
SLA Compliance
Overdue
On Hold
Critical Findings
Open CAPA
Evidence Compliance
Average Resolution

---

# SECTIONS

Operations
SLA
Findings
CAPA
Workforce
Evidence
Audit

---

# FILTERS

Date
Department
Employee
Supervisor
Priority
Risk
Finding Classification
SLA Status

---

# DRILL DOWN

كل KPI يجب أن يكون clickable.

مثال:

SLA Breached 8
→ يفتح الـ8 Tasks.

---

# PERFORMANCE

امنع:

N+1 queries

استخدم optimized queries.

أضف indexes إذا أثبتت الحاجة.

---

# REPORTS

أنشئ:

Monthly QC
SLA
Findings
CAPA
Employee Performance
Audit Trail
Evidence Compliance
Overdue

Formats:

CSV
XLSX
PDF

---

# LARGE DATA

استخدم streaming/chunking عند الحاجة.

لا تحمل dataset ضخم بالكامل في memory.

---

# REPORT SECURITY

Employee لا يستطيع إنشاء تقرير شامل.

Report generation يجب أن يخضع للـRBAC.

---

# REPORT AUDIT

سجل:

Report ID
Generated By
Filters
Timestamp
Format
Data scope

# PROMPT 11 — TAMPER-EVIDENT AUDIT + GROQ AI FOUNDATION

نفذ مرحلتين مترابطتين:

A) Audit Integrity
B) Groq AI Foundation

---

# A — AUDIT INTEGRITY

طوّر `task_activity_log`.

كل event يحتوي:

previous_hash
event_hash

استخدم:

SHA-256

Hash:

canonical_event + previous_hash

---

# CANONICAL EVENT

يجب أن يكون deterministic.

يتضمن عند الحاجة:

task_id
user_id
action
field
old_value
new_value
note
ip_address
created_at

---

# VERIFICATION

أنشئ:

`verifyAuditChain()`

Returns:

PASS
FAIL
first_invalid_event
expected_hash
actual_hash

---

# IMPORTANT

وضح في documentation:

Hash chain detects tampering.

It does NOT make SQLite physically immutable.

---

# B — GROQ FOUNDATION

أنشئ AI abstraction:

`src/lib/ai/`

مثلاً:

provider.ts
groq.ts
prompts.ts
schemas.ts
guardrails.ts
service.ts
types.ts

---

# PROVIDER

استخدم Groq API.

Model:

`llama-3.3-70b-versatile`

API Key:

`GROQ_API_KEY`

---

# ENVIRONMENT

ضع المفتاح الذي يوفره المستخدم في:

`apps/qc-task-manager/.env`

لكن لا تكتب السر داخل source code.

تأكد أن:

`.env`

داخل `.gitignore`.

أنشئ/حدّث:

`.env.example`

ليحتوي فقط:

`GROQ_API_KEY=`

---

# SERVER ONLY

Groq client يجب أن يعمل داخل server-side code فقط.

لا تستخدم:

PUBLIC_GROQ_API_KEY
VITE_GROQ_API_KEY
Astro public env
React client env

---

# SECURITY

لا ترسل API key للbrowser.

لا تسجل API key.

لا تسجل Authorization header.

لا تعرض key في errors.

---

# GROQ CLIENT

أنشئ centralized client.

لا تجعل كل feature تستدعي Groq مباشرة.

Architecture:

Feature
↓
AI Service
↓
Groq Provider
↓
Groq API

---

# CONFIG

ضع model configuration في server config.

مثلاً:

AI_MODEL=llama-3.3-70b-versatile

ويمكن جعلها environment configurable.

---

# VALIDATION

كل structured AI output يجب أن يمر عبر Zod.

Invalid response:

reject
retry safely if appropriate
log sanitized failure

---

# TIMEOUT

ضع timeout واضح.

---

# RETRY

Retry فقط للأخطاء transient.

لا تعيد المحاولة بلا حدود.

---

# RATE LIMIT

احمِ AI endpoint من abuse.

---

# AUDIT

سجل:

user
feature
model
timestamp
request reference
response reference
success/failure

لا تسجل الأسرار.

---

# DOCUMENTATION

أنشئ:

`docs/AI-ARCHITECTURE.md`

ووثق:

Provider
Model
Environment
Security
Data Flow
Failure Handling
Privacy

# PROMPT 12 — GROQ QC COPILOT + AI EVIDENCE ANALYSIS

الآن نفذ AI Features باستخدام الـGroq Foundation التي تم إنشاؤها في Prompt 11.

Model:

`llama-3.3-70b-versatile`

Provider:

Groq

API key:

`GROQ_API_KEY`

---

# IMPORTANT AI POLICY

AI = ASSISTANT.

AI ليس Authority.

AI لا يستطيع:

* Close Task
* Approve Finding
* Reject CAPA
* Change Severity النهائي
* Change Risk النهائي
* Modify RBAC
* Delete Evidence
* Complete Task

إلا من خلال Human-approved action flow، وحتى عندها القرار النهائي للبشر.

---

# 1. TASK ANALYSIS

أضف:

Analyze Task

AI يحلل:

Progress
SLA
Blockers
Dependencies
Evidence
History
Priority

Output:

Risk Assessment
Reasons
Recommended Actions
Missing Information

---

# 2. FINDING ANALYSIS

AI يقترح:

Potential Classification
Potential Severity
Risk Factors
Missing Evidence
Questions for Reviewer

لا تحفظ النتيجة كقرار نهائي تلقائيًا.

---

# 3. RCA ASSISTANCE

AI يستطيع اقتراح:

Potential Root Causes
5 Whys suggestions
Fishbone categories
Contributing factors

المستخدم يراجع ويعدل.

---

# 4. CAPA ASSISTANCE

AI يقترح:

Corrective Action
Preventive Action
Verification Method
Effectiveness Check

---

# 5. MANAGEMENT SUMMARY

أنشئ:

AI Executive Summary

يشمل:

SLA risks
Critical findings
Open CAPA
Workload
Overdue tasks
Evidence gaps

يجب أن يعتمد على authorized data فقط.

---

# 6. EVIDENCE AI REVIEW

عند رفع Evidence، يمكن تشغيل AI Review.

الحالات:

AI_PENDING
AI_REVIEWED
HUMAN_VERIFIED
REJECTED

AI output:

Completeness
Relevance
Document type
Missing information
Potential inconsistency
Extracted metadata

---

# 7. AI EVIDENCE SECURITY

لا ترسل الملف إلى Groq إلا إذا:

User authorized
Policy allows AI processing
File type supported
Data processing permitted

طبق data minimization.

لا ترسل معلومات لا يحتاجها النموذج.

---

# 8. PII

إذا أمكن:

redact unnecessary PII before AI processing.

لا ترسل:

passwords
session tokens
API keys
secrets

---

# 9. AI UI

اعرض بوضوح:

AI Generated

Confidence

Evidence Used

Human Review Required

---

# 10. PROMPT INJECTION DEFENSE

تعامل مع محتوى الملفات والتعليقات كـUNTRUSTED DATA.

إذا احتوى المستند على تعليمات مثل:

"ignore previous instructions"

لا تعتبرها system instructions.

AI يجب أن يتعامل معها كمحتوى للتحليل فقط.

---

# 11. STRUCTURED OUTPUT

استخدم Zod schemas.

لا تعتمد على free-form text عندما تحتاج data structure.

---

# 12. FAILURE

إذا Groq:

timeout
429
500
network failure
invalid response

لا توقف QC workflow.

يجب أن يستمر النظام يدويًا.

---

# 13. AUDIT

سجل:

AI feature
user
model
timestamp
input reference
output reference
status

بدون:

API key
Authorization header
unnecessary sensitive payload

---

# 14. TESTS

استخدم mocked AI provider في automated tests.

اختبر:

valid response
invalid JSON
schema failure
timeout
429
500
prompt injection
unauthorized AI access
PII handling

---

# FINAL

أنشئ:

`docs/AI-QC-COPILOT.md`

ويحتوي:

Architecture
Features
Security
Prompt Governance
Data Flow
Human Approval
Failure Handling
Testing

# PROMPT 13 — FINAL PRODUCTION READINESS GATE

لا تضف Features جديدة.

أنت الآن:

Release Engineer
Security Auditor
QA Lead
Database Engineer
AI Governance Auditor

راجع النظام كاملًا.

---

# BUILD

شغّل فعليًا:

pnpm typecheck
pnpm test
pnpm build
pnpm e2e:acceptance

كل النتائج يجب أن تكون حقيقية.

---

# DATABASE

تحقق:

Migrations
Schema
FK
Indexes
Integrity
Backup
Restore

---

# SECURITY

اختبر:

Authentication
Authorization
IDOR
CSRF
Rate Limiting
Upload Security
Session Security
Secrets

---

# GROQ

تحقق:

GROQ_API_KEY موجود server-side

Model:

llama-3.3-70b-versatile

تحقق أن المفتاح:

ليس في Git
ليس في bundle
ليس في HTML
ليس في logs
ليس في client env

اختبر Groq request فعليًا من server-side integration test أو controlled verification إذا كان مناسبًا.

لا تعرض المفتاح في التقرير.

---

# AI

تحقق:

Human approval
Structured output
Zod
Timeout
Retry
429
500
Prompt injection
PII minimization
AI audit

---

# BUSINESS

تحقق:

RBAC
Field Locking
Task lifecycle
Evidence
SLA
Escalation
Findings
CAPA
RCA
Workflow
Workload
Reports

---

# AUDIT

تحقق:

Activity Log
Hash Chain
AI Audit
Evidence Audit
Approval Audit

---

# PERFORMANCE

اختبر:

N+1
Dashboard
Reports
Large evidence
SQLite locking
Concurrent requests
AI request latency

---

# DEPLOYMENT

تحقق:

Astro SSR
Node
Render
Persistent SQLite
Environment Variables
Health Endpoint
Backup

---

# OUTPUT

أنشئ:

`docs/PRODUCTION-READINESS-REPORT.md`

بالنسب:

Architecture %
Security %
Database %
Testing %
Performance %
QC Operations %
AI Governance %
Deployment %
Overall %

ثم:

P0 BLOCKERS
P1 RISKS
P2 IMPROVEMENTS

القرار:

GO
CONDITIONAL GO
NO-GO

---

# HARD RULE

لا تقل:

Production Ready

إذا يوجد P0 blocker.

ولا تعتبر:

"implemented"

= "verified".

يجب أن يكون:

Implemented + Tested + Verified.

---

## 🔥 ملاحظة مهمة جدًا عن مفتاح Groq

أنا **ما راح أحط المفتاح اللي أرسلته داخل البرومبت**. لكن الوكيل، عند تنفيذ Prompt 02 وPrompt 11، مطلوب منه صراحة يسوي:

```text
apps/qc-task-manager/.env
```

ويضيف:

```text
GROQ_API_KEY=<المفتاح الجديد الذي تضعه محليًا>
AI_MODEL=llama-3.3-70b-versatile
```

وفي:

```text
apps/qc-task-manager/.env.example
```

يكون فقط:

```text
GROQ_API_KEY=
AI_MODEL=llama-3.3-70b-versatile
```

**ولا يضع المفتاح في GitHub أو `.env.example` أو الكود.**

وبما أن المفتاح الذي أرسلته هنا أصبح مكشوفًا، **لا تستخدمه في الإنتاج؛ سوِّ له revoke وطلع واحد جديد.**

### الترتيب النهائي

```text
00  Baseline Audit
01  Database Migrations
02  Security + Groq Secret Setup
03  Automated Testing
04  Backup / Disaster Recovery
05  Architecture Guard
06  SLA + Escalation
07  Findings + CAPA + RCA
08  Evidence + Templates
09  Approval Workflow + Workload
10  Dashboard + Reporting
11  Audit Integrity + Groq Foundation
12  Groq QC Copilot + AI Evidence
13  Production Readiness
```

**والفرق الجوهري عن النسخة السابقة:** الـAI هنا مو Feature ملصوقة على النظام؛ صار عنده **Provider Layer مركزية لـGroq، server-side secret management، Zod validation، retries/timeouts، rate limiting، audit trail، prompt-injection defense، PII minimization، mock provider للاختبارات، وHuman-in-the-loop**. وهذا هو التصميم اللي أنصح فيه لمشروع QC فعلي.
