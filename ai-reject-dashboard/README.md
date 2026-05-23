# AI Reject Analytics & Management Dashboard

**Prototype for Focus ERP Reject & Destruction Procedures**

A professional, enterprise-grade management dashboard for rejected materials and destruction procedures at Mais for Medical Products. This prototype demonstrates how AI (Gemini) can support decision-making while keeping Focus ERP as the official source of truth.

---

## What This Prototype Does

The dashboard provides visibility into rejected materials and products across the factory. It uses AI to:

- Analyse reject patterns and identify root causes
- Calculate an advisory risk score for each reject case (0–100)
- Suggest corrective and preventive actions (CAPA)
- Identify high-value financial impact cases requiring finance review
- Highlight approval delays and destruction backlogs
- Generate executive summaries and management recommendations

**Important:** All AI output is advisory only. Formal approvals remain inside Focus ERP.

---

## Pages Overview

| Page | File | Primary Audience | Purpose |
|------|------|-----------------|---------|
| Main Dashboard | `index.html` | All users | Overview cards, risk table, root causes, CAPA, alerts, reject records |
| Executive View | `executive.html` | Top Management / Factory Director | Critical insights, board-level recommendations, required actions |
| Finance View | `finance.html` | Finance Department | Cost analysis, recovery options, financially sensitive cases |
| Quality & CAPA | `quality.html` | QC / QCM / QAM | Root causes, CAPA suggestions, GMP audit readiness, documentation |
| Technical View | `technical.html` | IT / Focus Vendor | Architecture, security model, API docs, UAT and go-live checklists |

---

## How to Use

### Mode 1 — Static Presentation (No Server Required)

Open `index.html` directly in any browser:

```bash
open index.html
```

This mode requires no server, no Gemini API key, no Excel file. It uses prepared demo data from `assets/data.js`. Perfect for initial management presentation.

### Mode 2 — Backend with Local Analysis

1. Install dependencies:

```bash
npm install
```

2. Create environment configuration:

```bash
cp .env.example .env
```

3. Edit `.env` with your settings (optional — works without changes using demo data and simulated AI).

4. Start the server:

```bash
npm start
```

5. Open `http://localhost:3000` in your browser.

In this mode:
- If the Excel file exists, data is read from it (with simulated reject records generated from item data).
- If the Excel file is missing, the server falls back to demo data.
- If Gemini API key is configured, real AI analysis is used.
- If Gemini API key is missing, a local simulated analysis runs instead.

---

## Excel File Configuration

The backend reads the Excel file from the path configured in `.env`:

```
EXCEL_FILE_PATH=/Users/yzydalshmry/Desktop/BRIGHTAI/reports/ALL_ITEMS_MAIS_with_life_years.xlsx
```

The Excel file contains item master data (stock analysis by batch). Since this is item inventory data rather than reject records, the backend:

- Reads the first sheet automatically
- Detects the header row by looking for "Item Code" and "Item Name" columns
- Generates realistic simulated reject records from the available item data
- Uses item names, codes, batch numbers, quantities, stock values, and life years
- Never crashes if a column is missing
- Returns clear warnings when data is estimated or simulated

**Normalised reject record fields:**

`doc_no`, `date`, `department`, `focus_view`, `item_code`, `item_name`, `lot_no`, `quantity`, `cost`, `reason`, `approval_status`, `days_pending`, `destruction_status`, `root_cause`, `risk_score`, `risk_level`, `capa_required`, `finance_review_required`

---

## Gemini AI Integration

Gemini AI provides advisory analysis only. It is used for:

- Executive summary generation
- Root cause grouping and pattern recognition
- Risk scoring support
- CAPA suggestion generation
- Finance alert identification
- Management action recommendations

**Gemini does NOT:**

- Approve or reject any case
- Authorise destruction or stock deduction
- Modify Focus ERP data
- Make any binding decisions

**Security requirements:**

- The Gemini API key is stored ONLY in `.env` on the server
- The API key is never in HTML, CSS, or browser-side JavaScript
- Only minimised, relevant data fields are sent to Gemini
- The backend makes all API calls — the frontend never calls Gemini directly
- If the API key is missing or the call fails, the system falls back to local simulated analysis

---

## Project Structure

```
ai-reject-dashboard/
├── index.html                 # Main Dashboard
├── executive.html             # Executive Management View
├── finance.html               # Finance View
├── quality.html               # Quality & CAPA View
├── technical.html             # Technical Integration View
├── server.js                  # Backend server (Node.js + Express)
├── package.json               # Project dependencies
├── .env.example               # Environment configuration template
├── README.md                  # This file
├── AI_Reject_Analytics_Rewritten_Saudi.md  # Full concept document
└── assets/
    ├── style.css              # All styling (RTL, responsive, enterprise theme)
    ├── data.js                # Demo/mock data for static mode
    └── app.js                 # Frontend logic (auto-detects backend, falls back to static)
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status, data source, Gemini config, Excel status |
| GET | `/api/rejects` | Full list of reject records (optional `?source=excel` or `?source=demo`) |
| GET | `/api/summary` | AI or computed analysis summary with risk data |
| GET | `/api/root-causes` | Grouped root cause data with counts and percentages |
| GET | `/api/capa-suggestions` | CAPA suggestions from AI or local analysis |
| GET | `/api/finance-alerts` | High-value finance alerts requiring review |
| POST | `/api/run-analysis` | Triggers full AI analysis (Gemini or simulated), returns complete result |

All endpoints return standardised JSON:

```json
{
  "success": true,
  "source": "excel",
  "warnings": [],
  "data": { ... }
}
```

---

## Risk Scoring Model

Each reject record receives a score from 0–100 based on:

| Factor | Max Points | Description |
|--------|-----------|-------------|
| Cost impact | 30 | Higher cost = higher risk |
| Quantity | 10 | Larger batches = higher risk |
| Days pending | 20 | Longer delays = higher risk |
| Destruction pending | 10 | Unresolved destruction = higher risk |
| Expiry/life risk | 15 | Near-expiry items = higher risk |
| Repeated root cause | 10 | Recurring patterns = higher risk |
| Department risk | 5 | Warehouse/QC = higher baseline |
| Finance review flag | 5 | High-value items flagged |

**Risk levels:** 0–39 Low, 40–69 Medium, 70–84 High, 85–100 Critical

The score is advisory only and clearly labelled as such in the dashboard.

---

## Future Focus ERP Integration

Three integration options are available (see `technical.html` for details):

1. **Focus API (Recommended):** Direct REST or SOAP API connection for real-time data
2. **SQL View (Read-Only):** Expose reject data through a read-only database view
3. **Scheduled Export:** Export CSV/Excel from Focus ERP to a shared location on a schedule

The architecture supports any option with minimal changes to the backend data source layer.

---

## Security Warning

**Never place the Gemini API key in frontend code.**

The API key must only exist on the server (in `.env` or environment variables). This prototype follows this rule — the key is used only in `server.js` and never exposed to the browser.

---

## Presenting to Management

This prototype is designed for presentation to:

- **Top Management / Board:** Show the Executive View for strategic visibility and decision support
- **Factory Director:** Demonstrate real-time risk monitoring and operational oversight
- **QCM / QAM:** Highlight CAPA tracking, root cause analysis, and audit readiness
- **Finance Director:** Show financial impact analysis and loss recovery evaluation
- **IT / Focus Vendor:** Explain the integration architecture, security model, and API design

The UI is RTL-optimised for Arabic, uses professional enterprise colours (dark navy, teal), and works offline in static mode.

---

## Limitations

| Aspect | Current Status |
|--------|---------------|
| Data source | Excel file or static demo data (not live Focus ERP) |
| AI analysis | Local simulation or Gemini API (if configured) |
| Authentication | None — all pages are accessible |
| Role-based access | Not implemented — concept only |
| HTTPS | Not configured — HTTP only for local use |
| Audit logging | Basic server console logs |
| Real-time updates | Manual page refresh required |
| Write-back to ERP | Not supported — read-only by design |

---

## Next Steps for Production

1. Confirm Focus ERP integration method (API, SQL view, or export)
2. Deploy backend to secure server with HTTPS
3. Configure Gemini API key in server environment
4. Implement role-based access control
5. Complete UAT with real Focus ERP data
6. Train users and update SOPs
7. Go live as a read-only advisory tool

---

## License

Prototype for demonstration purposes only. Not licensed for production use without proper security review and Focus ERP integration validation.
