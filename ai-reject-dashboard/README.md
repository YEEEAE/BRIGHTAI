# AI Reject Analytics & Management Dashboard

**Prototype for Focus ERP Reject & Destruction Procedures — Mais for Medical Products**

A complete, production-ready prototype for rejected material analytics and destruction workflow management. The dashboard integrates with Focus ERP through a secure backend, uses Gemini API for AI-powered analysis, and provides role-specific views for Executive, Finance, Quality, Production, and IT teams.

**Core Principle:** Focus ERP is the official source of truth. AI analysis is advisory only. All formal approvals remain inside Focus ERP with mandatory human sign-off.

---

## Quick Start

```bash
cd ai-reject-dashboard
npm install
cp .env.example .env    # Edit .env with your settings
npm start               # Opens at http://localhost:3000
```

**Two modes:**
- **Static** (no server): Open `index.html` directly in browser. Uses prepared demo data from `assets/data.js`.
- **Backend** (full features): Run `npm start`. Reads Excel data, optionally calls Gemini API, enables auth.

---

## Pages (7 Views)

| Page | File | Audience | Key Features |
|------|------|----------|--------------|
| **Main Dashboard** | `index.html` | All users | KPI cards, risk overview, root causes, CAPA, anomalies, predictive cost, alerts, reject table, filters |
| **Executive View** | `executive.html` | Factory Director / Board | Strategic summary, high-risk alerts, board recommendations, cost trends, anomaly detection |
| **Finance View** | `finance.html` | Finance Department | Cost by department, recovery options, financially sensitive cases, 3-tier financial gate logic |
| **Quality & CAPA** | `quality.html` | QC / QCM / QAM | Root cause clustering, CAPA suggestions, CAPA status tracking, GMP audit readiness checklist, documentation gaps |
| **Production / Ops** | `production.html` | Production Managers / Supervisors | Machine quality indicators, raw material efficiency, pending input alerts, Focus ERP reject views reference |
| **Workflow & Governance** | `workflow.html` | All roles | 7-step approval chain, 3-tier financial gates, witness committee composition, inventory hold logic, governance rules, SOP flowchart |
| **Technical View** | `technical.html` | IT / Focus Vendor | Architecture diagrams, security model, 3 integration options, 11 API endpoints documentation, UAT checklist, go-live checklist |

**Additional:** `login.html` (token-based authentication), `index-ar.html` (Arabic language dashboard)

---

## Backend API (12 Endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status, data source, Gemini config, Excel status |
| POST | `/api/login` | Validate dashboard access token |
| GET | `/api/rejects` | Reject records with filtering (`?department=`, `?risk_level=`, `?status=`, `?from_date=`, `?to_date=`, `?search=`) |
| GET | `/api/summary` | AI or computed analysis with risk data, costs, anomalies |
| GET | `/api/root-causes` | Grouped root cause data with counts and percentages |
| GET | `/api/capa-suggestions` | CAPA suggestions from AI or local analysis |
| GET | `/api/finance-alerts` | High-value finance alerts requiring review |
| GET | `/api/anomalies` | Anomaly detection — items with unusually high cost |
| GET | `/api/ai-analysis` | Full AI analysis with records + analysis (cached 5 min) |
| POST | `/api/run-analysis` | Triggers AI analysis, returns complete result |
| GET | `/api/audit-log` | Last 100 audit log entries (timestamp, IP, action) |

All endpoints return standardised JSON: `{ success, source, warnings, data }`

---

## Risk Scoring Model (0–100)

| Factor | Max | Description |
|--------|-----|-------------|
| Cost impact | 30 | Higher cost = higher risk |
| Quantity | 10 | Larger batches = higher risk |
| Days pending | 20 | Longer delays = higher risk |
| Destruction pending | 10 | Unresolved destruction |
| Expiry/life risk | 15 | Near-expiry items |
| Repeated root cause | 10 | Recurring patterns |
| Department risk | 5 | Warehouse/QC baseline |
| Finance review flag | 5 | High-value flagged items |

**Levels:** 0–39 Low, 40–69 Medium, 70–84 High, 85–100 Critical

---

## Data Sources (Priority Order)

1. **Focus ERP API** — Real-time if `FOCUS_API_URL` and `FOCUS_API_TOKEN` are configured
2. **Excel File** — Reads `ALL_ITEMS_MAIS_with_life_years.xlsx` (25,691 items), generates 25 realistic reject records
3. **Demo Data** — Falls back to 15 prepared records in `assets/data.js`

---

## AI Integration (Gemini API)

- Uses **Structured Outputs** with JSON Schema for deterministic responses
- Data minimisation: Only relevant reject fields sent — no PII, no employee names
- API key stored in `.env` on server only — **never in frontend code**
- 5-minute result cache to reduce API calls
- Automatic fallback to local simulated analysis if API key is missing or call fails

---

## Architecture

```
Focus ERP  →  Read-only API/SQL View  →  Backend (server.js)  →  Gemini API  →  Dashboard
                                                                     or
Excel File  →  Backend (server.js)  →  Simulated AI (local)  →  Dashboard
```

The frontend **never** directly accesses Focus ERP or Gemini. All API keys are server-side only.

---

## Project Files

```
ai-reject-dashboard/
├── index.html              # Main Dashboard
├── executive.html          # Executive Management View
├── finance.html            # Finance View
├── quality.html            # Quality & CAPA View
├── production.html         # Production / Operations View
├── workflow.html           # Workflow & Governance
├── technical.html          # Technical Integration View
├── login.html              # Token-based login page
├── index-ar.html           # Arabic language dashboard
├── server.js               # Backend (Node.js + Express, 888 lines)
├── package.json            # Dependencies (express, cors, dotenv, xlsx)
├── .env                    # Environment configuration
├── .env.example            # Configuration template
├── README.md               # This file
├── audit.log               # Server audit trail
├── AI_Reject_Analytics_Rewritten_Saudi.md
└── assets/
    ├── style.css           # 963 lines — RTL, responsive, enterprise theme
    ├── data.js             # 15 demo records with full analysis data
    └── app.js              # 674 lines — frontend logic, auto-detection, rendering
```

---

## Supporting Reports (in `../reports/`)

| File | Content |
|------|---------|
| `final_master_report.md` | Consolidated 14-section boardroom-ready proposal (English) |
| `reject_destruction_upgrade_proposal.md` | 16-section executive proposal (Arabic) |
| `ai_reject_analytics_dashboard_concept.md` | AI dashboard technical concept (Arabic) |
| `AI Reject Analytics & Management Dashboard.md` | Original concept (Arabic/English) |
| `secure_backend_architecture_design.md` | Cybersecurity and middleware spec (Arabic) |
| `focus_vendor_technical_specification.md` | Focus ERP vendor specification (Arabic) |
| `sop_rejected_material_handling_destruction.md` | GMP-compliant SOP (Arabic) |
| `raci_sla_matrix_process_governance.md` | RACI and SLA matrices (Arabic) |
| `ai_governance_statement.md` | AI governance policy (English) |
| `implementation_roadmap.md` | 15-phase digital transformation plan (English) |
| `reject_risk_score_model.md` | 12-factor risk model specification (English) |
| `executive_summary.md` | One-page executive summary (English) |
| `final_recommendation.md` | Boardroom final recommendation (English) |
| `auditor_qa_document.md` | GMP/ISO audit readiness Q&A (English) |
| `presentation_script.md` | Board presentation script (English) |

---

## Security

- Token-based authentication (configurable via `DASHBOARD_TOKEN` in `.env`)
- Full audit logging of all API requests (timestamp, IP, action)
- No API keys in frontend code — server-side only
- Read-only by design — no write capability to data sources
- PII is stripped before sending to Gemini API
- RTL support for Arabic language users

---

## Presenting to Management

Start with **Main Dashboard** (`index.html`) for the full overview, then open role-specific views:

- **Board / Factory Director:** `executive.html` + `workflow.html`
- **Finance Director:** `finance.html` + `workflow.html` (financial gates section)
- **QCM / QAM:** `quality.html` + `workflow.html` (governance rules)
- **Production Manager:** `production.html` + `workflow.html`
- **IT / Focus Vendor:** `technical.html` + `workflow.html`

---

## Next Steps for Production

1. Confirm Focus ERP integration method (API, SQL view, or scheduled export)
2. Deploy backend to secure server with HTTPS
3. Configure Gemini API key in server environment
4. Implement full role-based access control (RBAC)
5. Complete UAT with real Focus ERP data
6. Train all user roles and update SOPs
7. Go live as a read-only advisory tool

---

*Prototype for Mais for Medical Products — May 2026*
