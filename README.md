# BrightAI — Saudi AI Safety OS

**برايت آي — نظام أمان وحوكمة الذكاء الاصطناعي للشركات السعودية**

BrightAI Kernel is the safety layer for enterprise AI in Saudi Arabia. It lets organizations adopt AI without losing control over data, decisions, compliance, or audit readiness.

---

## Architecture

```
User Request → AI Firewall → Risk Scoring → Compliance Checks → (Human Approval?) → Gemini AI → Audit Trail → Response
```

Every AI request passes through 4 security layers before reaching the AI model and being logged in an immutable audit trail.

### Core Layers

1. **AI Firewall** — PII detection, masking, blocking, escalation based on configurable policy rules
2. **AI Audit Trail** — Immutable append-only log with blockchain-like chain hashing (SHA-256)
3. **Human Approval Layer** — Risk-based approval workflow (low→auto, medium→queue, high→manager, critical→admin)
4. **Compliance Packs** — PDPL, NCA ECC 2-2024, SFDA/ISO 13485, Procurement & Tenders, Healthcare

---

## Project Structure

```
BRIGHTAI/
├── index.html                    # Main landing page (brightai.site)
├── about/                        # About page
├── blog/                         # Blog pages
├── contact/                      # Contact page
├── demo/                         # Demo pages
├── docs/                         # API docs (OpenAPI/Swagger)
├── pricing/                      # Pricing page
├── privacy-cookies/              # Privacy policy
├── services/                     # Services pages
├── reports/                      # Reports pages
├── dashboard/                    # BrightAI Kernel Dashboard UI
│   ├── index.html                #   Main dashboard (stats + quick chat)
│   ├── audit.html                #   Audit trail viewer with filters
│   ├── approvals.html            #   Approval queue (approve/reject)
│   ├── compliance.html           #   Compliance status & packs
│   ├── evidence.html             #   Evidence file viewer/generator
│   └── stats.html                #   Statistics & analytics
├── backend/
│   ├── server.js                 # Main HTTP server (Node.js, no Express)
│   ├── config/index.js           # Configuration (Gemini, Groq, NVIDIA, DeepSeek, PG)
│   ├── package.json              # Dependencies: express, pg, ws, dotenv
│   ├── db/
│   │   ├── schema-pg.sql         # PostgreSQL schema (5 tables + indexes)
│   │   ├── schema.sql            # Legacy SQLite schema (reference)
│   │   └── init.js               # PG pool init, schema migration, seed policies
│   ├── kernel/
│   │   ├── index.js              # Main orchestrator (coordinates all layers + Gemini)
│   │   ├── pii-patterns.js       # Saudi PII regex patterns + sensitive keywords
│   │   ├── firewall.js           # AI Firewall: scan, mask, block, escalate
│   │   ├── risk-scorer.js        # Risk scoring engine (0-100, 4 levels)
│   │   ├── audit.js              # Immutable audit trail with chain hashing
│   │   ├── approval.js           # Human approval workflow (queue/approve/reject)
│   │   ├── compliance.js         # Compliance packs (6 packs, 23+ check types)
│   │   └── evidence.js           # Evidence file generation + compliance reports
│   ├── routes/
│   │   └── kernel.js             # API route handlers + dispatcher
│   ├── middleware/
│   │   └── rateLimiter.js        # Rate limiting middleware
│   ├── services/                 # AI gateway, static files, redirects, etc.
│   └── utils/                    # Shared utilities
├── robots.txt                    # Allows all AI crawlers
├── sitemap.xml                   # Full sitemap
├── llms-full.txt                 # AI-readable documentation for LLMs
├── render.yaml                   # Render.com deployment config
├── _headers                      # Netlify/Cloudflare headers
├── _redirects                    # URL redirects
└── manifest.webmanifest          # PWA manifest
```

---

## Database Schema (PostgreSQL)

5 tables, all async via `pg` Pool:

| Table | Purpose |
|-------|---------|
| `kernel_interactions` | Every AI request/response — the core audit trail with chain hashes |
| `kernel_approval_queue` | Pending approvals (subset of interactions requiring human review) |
| `kernel_compliance_checks` | Per-interaction compliance check results |
| `kernel_policy_rules` | Configurable firewall rules (seeded with 12 defaults for PDPL/NCA/SFDA) |
| `kernel_users` | User registry (id, role, department, compliance_packs) |

### Connection

Set `DATABASE_URL` or `POSTGRES_URL` environment variable. Default: `postgresql://brightai:brightai@localhost:5432/brightai`

---

## API Endpoints

### BrightAI Kernel (`/api/kernel/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/kernel/chat` | Main: message → firewall → risk → compliance → (approval?) → Gemini → audit → response |
| `GET` | `/api/kernel/audit` | Query audit trail (filters: userId, riskLevel, pack, dates, search) |
| `GET` | `/api/kernel/audit/:id` | Single audit entry |
| `POST` | `/api/kernel/approve/:id` | Approve pending request |
| `POST` | `/api/kernel/reject/:id` | Reject pending request |
| `GET` | `/api/kernel/pending` | List pending approvals |
| `GET` | `/api/kernel/stats` | Dashboard statistics |
| `POST` | `/api/kernel/evidence/:id` | Generate Evidence File |
| `GET` | `/api/kernel/compliance/check` | Compliance status |

### AI Gateway (`/api/ai/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat` | Unified chat (Gemini/Groq/NVIDIA/DeepSeek) |
| `POST` | `/api/ai/chat/stream` | Streaming chat (SSE) |
| `POST` | `/api/ai/openai-chat` | OpenAI-compatible endpoint |
| `POST` | `/api/ai/search` | Smart search |
| `POST` | `/api/ai/medical` | Medical image analysis |
| `POST` | `/api/ai/summary` | Text summarization |
| `POST` | `/api/ai/ocr` | OCR JSON extraction |
| `POST` | `/api/ai/transcribe` | Audio to text |
| `GET` | `/api/ai/models` | Model catalog |
| `GET` | `/api/health` | Health check |

### Dashboard UI

| URL | Description |
|-----|-------------|
| `/dashboard/` | Main dashboard (stats + quick chat) |
| `/dashboard/audit.html` | Audit trail viewer |
| `/dashboard/approvals.html` | Approval queue |
| `/dashboard/compliance.html` | Compliance status |
| `/dashboard/evidence.html` | Evidence file viewer |
| `/dashboard/stats.html` | Statistics & analytics |

---

## Request Flow (POST /api/kernel/chat)

```
1. Receive {message, userId, compliancePack, metadata}
2. FIREWALL: scan(message) → PII detection, masking, block/allow/escalate
3. If blocked → return {status: 'blocked', reason}
4. COMPLIANCE: runComplianceChecks(pack, context) → pass/warning/fail
5. RISK: computeRiskScore({firewall, compliance, metadata}) → 0-100 + level
6. If risk.requiresApproval:
   - Log interaction as 'pending'
   - Queue for approval
   - Return {status: 'pending_approval', interactionId}
7. AUTO-APPROVE: callGemini(maskedMessage) → AI response
8. AUDIT: logInteraction(all data + chain hash)
9. Return {status: 'completed', interactionId, response, kernel metadata}
```

---

## Saudi PII Detection

| Type | Pattern | Example |
|------|---------|---------|
| Saudi National ID | 10 digits starting with 1 or 2 | `1234567890` |
| Saudi Phone | +966/05 variants | `+966538229013` |
| Saudi IBAN | SA + 22 chars | `SA0380000000608010167519` |
| Email | Standard email regex | `user@example.com` |
| Patient ID | MED- prefix + digits | `MED-123456` |
| Credit Card | Luhn-valid card numbers | `4111111111111111` |
| Passport | Letter + 8+ digits | `A12345678` |
| IP Address | IPv4 | `192.168.1.1` |

Sensitive keyword categories: `financial` (Arabic+English), `medical`, `corporate`

---

## Risk Scoring

Base 0, additive from 13 signals:

| Signal | Score |
|--------|-------|
| PII detected | +15 |
| Saudi ID | +15 |
| IBAN | +20 |
| Patient ID | +25 |
| Financial keywords | +10 |
| Medical keywords | +10 |
| Corporate secrets | +15 |
| Block action | +40 |
| Escalate action | +20 |
| SFDA/Healthcare pack | +10 |
| Unknown user | +10 |
| Long message (>5000 chars) | +5 |
| After-hours (22:00-06:00) | +5 |

**Levels:**
- Low (0-25): auto-approve
- Medium (26-50): queue for approval
- High (51-75): require manager
- Critical (76-100): require admin

---

## Compliance Packs

| Pack | Checks | Regulatory Framework |
|------|--------|---------------------|
| **PDPL** | PII scan, consent verify, data sharing log, cross-border flag | PDPL Articles 13, 17, 29 |
| **NCA ECC** | Access control, data classification, encryption, audit, incident detection | NCA ECC 2-2024 Sections 4, 5 |
| **SFDA/ISO 13485** | Patient data, medical integrity, CAPA relevance, regulatory audit | ISO 13485 §8.3, §8.5.2, SFDA QMS-GL |
| **Procurement** | Tender analysis, contract risk, penalty detection, vendor confidentiality | Etimad Tender Regulations |
| **Healthcare** | Patient protection, approval workflow, drug safety, clinical decision | PDPL Art 17, NCA Section 6 |
| **General** | Basic PII, audit logging | Baseline |

---

## Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Optional AI Providers
GROQ_API_KEY=
NVIDIA_API_KEY=
DEEPSEEK_API_KEY=

# Server
PORT=3000
NODE_ENV=development

# Gemini
GEMINI_MODEL=gemini-2.5-flash
```

---

## Setup & Run

```bash
# Backend
cd backend
npm install
cp ../.env.example .env  # Set your API keys and DATABASE_URL
npm run dev               # Starts on port 3000

# Ensure PostgreSQL is running and DATABASE_URL is set
# Schema auto-creates on first start
# 12 default policy rules are seeded automatically
```

---

## Deployment (Render.com)

Configured via `render.yaml`:
- Static site for frontend (brightai.site)
- Backend API service for `/api/*` routes
- PostgreSQL database via `DATABASE_URL` env var

---

## Tech Stack

- **Backend**: Node.js, CommonJS, custom HTTP server (no Express framework)
- **Database**: PostgreSQL via `pg` (async pool)
- **AI**: Google Gemini 2.5 Flash (primary), Groq, NVIDIA NIM, DeepSeek
- **Frontend**: Static HTML site (no framework), Tailwind CSS, vanilla JavaScript
- **Deployment**: Render.com (static site + API service), Cloudflare DNS/CDN
- **Domain**: brightai.site

**Note**: This is a static HTML website. The `app/` directory is empty and Next.js is not used.

---

## Key Files for AI Agents

| File | What it does |
|------|-------------|
| `backend/kernel/index.js` | Orchestrator — coordinates all 4 layers + Gemini API call |
| `backend/kernel/firewall.js` | PII scanning, policy lookup, masking/blocking |
| `backend/kernel/audit.js` | Immutable audit trail with SHA-256 chain hashing |
| `backend/kernel/approval.js` | Human approval queue (approve/reject workflow) |
| `backend/kernel/compliance.js` | 6 compliance packs with 23+ automated check types |
| `backend/kernel/risk-scorer.js` | Risk scoring engine (0-100, 4 levels) |
| `backend/kernel/evidence.js` | Evidence file generation with regulatory references |
| `backend/kernel/pii-patterns.js` | Saudi-specific PII regex patterns |
| `backend/db/init.js` | PostgreSQL connection, schema init, policy seeding |
| `backend/db/schema-pg.sql` | PostgreSQL DDL (5 tables + 8 indexes) |
| `backend/routes/kernel.js` | API route dispatcher for all `/api/kernel/*` endpoints |
| `backend/server.js` | Main server — routing, context, WebSocket, DB init |
| `backend/config/index.js` | All configuration (AI providers, server, rate limits) |

---

## WhatsApp Contact

All pages include floating WhatsApp button: https://wa.me/966538229013
