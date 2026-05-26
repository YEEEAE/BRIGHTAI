# AI Reject Analytics Dashboard

Secure full-stack dashboard for reject analytics, Excel-backed data loading, local/Gemini analysis, JWT cookie authentication, and live Excel change notifications.

## Structure

```text
ai-reject-dashboard/
  backend/
    config/        # AR/EN: environment and security settings
    middleware/    # AR/EN: auth, rate limit, validation, errors
    routes/        # AR/EN: API endpoints
    services/      # AR/EN: business logic
    utils/         # AR/EN: helpers
    watchers/      # AR/EN: Excel file watcher
    server.js
  frontend/
    assets/css/
    assets/js/
    assets/images/
    pages/
    components/
  data/
  logs/
```

## Setup

```bash
cp .env.example .env
npm install
npm start
```

Open:

```text
http://localhost:3000/pages/index.html
```

## Security

- Helmet with a strict same-origin CSP for scripts.
- Locked CORS with `ALLOWED_ORIGINS`.
- Rate limiting: `100` requests per `15` minutes by default.
- JWT access and refresh tokens stored in `HttpOnly` cookies.
- Joi validation for API input.
- Request sanitization blocks dangerous NoSQL operator keys.
- Basic output sanitization for Excel/demo string fields.
- Google Analytics removed from the login page and external scripts blocked by CSP.

## Auth

Preferred production credential:

```bash
node -e "require('bcrypt').hash('your-password', 12).then(console.log)"
```

Put the result in:

```text
DASHBOARD_PASSWORD_HASH=...
```

`DASHBOARD_TOKEN` remains available for local/dev compatibility.

## API

- `POST /api/login`
- `POST /api/refresh`
- `POST /api/logout`
- `GET /api/health`
- `GET /api/rejects`
- `GET /api/summary`
- `GET /api/root-causes`
- `GET /api/capa-suggestions`
- `GET /api/finance-alerts`
- `GET /api/anomalies`
- `GET /api/ai-analysis`
- `POST /api/run-analysis`
- `GET /api/audit-log`
- `GET /api/data/refresh`
- `GET /api/data/status`
- `GET /api/data/changes`

## Excel Data Shape

The Excel reader is dynamic. It reads every sheet, chooses the strongest header row per sheet, keeps all original columns under `raw`, then maps recognizable fields when available.

Example parsed record:

```json
{
  "__sheet": "Stock_analysis_by_Batch",
  "__row_number": 7,
  "doc_no": "RJT-2026-0001",
  "item_code": "G-011-1919",
  "item_name": "Detected item name or row label",
  "department": "Warehouse",
  "category": "Raw Material",
  "quantity": 120,
  "cost": 4500,
  "total_cost": 4500,
  "approval_status": "Pending",
  "date": "2026-05-01",
  "machine": "Line 1",
  "defect_type": "Material expired before use",
  "raw": {
    "Any Excel Column": "Original cell value"
  }
}
```

Computed metrics include:

```json
{
  "total_cost": 158329773.03,
  "cost_by_department": {
    "Warehouse": { "count": 120, "total_cost": 500000 }
  },
  "cost_by_category": {},
  "pending_approvals_count": 42,
  "critical_items": [],
  "machine_defect_rates": {},
  "monthly_trends": {},
  "year_over_year_comparison": []
}
```
