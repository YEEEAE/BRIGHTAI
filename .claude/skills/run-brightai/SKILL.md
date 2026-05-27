---
name: run-brightai
description: Build, run, test, and drive BRIGHTAI. Use when asked to start the BRIGHTAI server, run tests, build, verify endpoints, or interact with the running app.
---

BRIGHTAI is an Arabic-first AI company website (Next.js static HTML + Express backend). The Express server at `backend/server.js` serves both static pages and API endpoints (AI gateway, Gemini/Groq chat, search, medical analysis). Drive it by launching the backend in the background and hitting endpoints with `curl`. Smoke script at `.claude/skills/run-brightai/smoke.sh`.

All paths below are relative to the repo root.

## Prerequisites

Node >=22. No system-level packages beyond Node needed.

## Setup

```bash
npm install
```

No `.env` required for dev — the server reads keys from `backend/.env` if present, and falls back to `AI_GATEWAY_MOCK_MODE=1` for running without API keys.

## Build

Static HTML pages are pre-built. The `npm run build` script minifies SEO assets and generates sitemaps — not needed to run the server.

## Run (agent path)

Launch backend in background, wait for readiness, verify:

```bash
AI_GATEWAY_MOCK_MODE=1 node backend/server.js &> /tmp/brightai-server.log &
SERVER_PID=$!

for i in $(seq 1 30); do
  curl -sf http://127.0.0.1:3001/api/health > /dev/null && break
  sleep 1
done
```

Verify:

```bash
curl http://127.0.0.1:3001/api/health
# → {"status":"ok",...}
```

Or run the smoke script (launches, verifies, cleans up):

```bash
bash .claude/skills/run-brightai/smoke.sh
# → PASS: all endpoints healthy
```

Stop:

```bash
kill $SERVER_PID
# or: pkill -f "node backend/server.js"
```

### Environment

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | No | `3001` | Server port |
| `AI_GATEWAY_MOCK_MODE` | No | `0` | Set `1` to run without API keys |
| `GEMINI_API_KEY` | For live AI | — | Primary AI provider |
| `GROQ_API_KEY` | For live AI | — | Secondary AI provider |
| `NODE_ENV` | No | `development` | |

### Key endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check + provider status |
| `/api/ai/status` | GET | AI provider readiness |
| `/api/gateway-status` | GET | Gateway status + skills summary |
| `/api/gemini/chat` | POST | Gemini chat gateway |
| `/api/ai/chat` | POST | Chatbot conversations |
| `/api/ai/search` | POST | Smart search |
| `/` | GET | Main site (HTML) |
| `/about/` | GET | Static page |
| `/services/` | GET | Static page |
| `/blog/` | GET | Static page |

## Run (human path)

```bash
npm run dev:backend   # → starts on port 3001, Ctrl-C to stop
npm run dev:frontend  # → static file server on port 4173 (frontend/ workspace only)
```

## Test

```bash
npm test
# → 48 tests across 12 suites (backend vitest + frontend node:test)
```

## Gotchas

- **Port is 3001 not 3000.** The `.env` in backend sets `PORT=3001`. Without `.env`, defaults to `3000`.
- **Frontend dev server (`dev:frontend`) only serves `frontend/` workspace.** The main site HTML lives at repo root and is served by the backend server. The frontend workspace has CSS/JS assets only.
- **API keys not required for dev.** Set `AI_GATEWAY_MOCK_MODE=1` to bypass provider key validation. Without it, the server requires at least one of: `GEMINI_API_KEY`, `GROQ_API_KEY`, `NVIDIA_API_KEY`, `DEEPSEEK_API_KEY`.
- **`npm run dev` runs `next dev`.** This is the Next.js dev server for the `app/` directory (React pages). The main site is pre-built static HTML — use `npm run dev:backend` instead.

## Troubleshooting

- **"Configuration errors: At least one provider key is required"**: Set `AI_GATEWAY_MOCK_MODE=1` or provide at least one API key.
- **Port already in use**: `lsof -i :3001` to find the process, or override with `PORT=4000`.
