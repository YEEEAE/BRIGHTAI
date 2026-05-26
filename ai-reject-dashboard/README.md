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
