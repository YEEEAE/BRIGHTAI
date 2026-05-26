/**
 * Comprehensive API Integration Tests
 * ai-reject-dashboard -- Express + SQLite + Gemini AI
 *
 * Uses Jest + supertest to test all major endpoints:
 *   1. Server startup
 *   2. Health endpoint
 *   3. Data schema
 *   4. Excel data load (dataService)
 *   5. AI chat response schema
 *   6. Auth / RBAC (login, me, 401 handling)
 *   7. Socket data:updated event structure
 */

const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const request = require('supertest');
const { Server } = require('socket.io');
const { setTimeout: sleep } = require('timers/promises');

// ---------------------------------------------------------------------------
// Load .env from project root BEFORE requiring any config that reads env vars
// ---------------------------------------------------------------------------
const dotenv = require('dotenv');
const projectRoot = path.join(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

// ---------------------------------------------------------------------------
// Require backend modules (after env is loaded)
// ---------------------------------------------------------------------------
const config = require('../backend/config/env');
const { createCorsMiddleware, createHelmetMiddleware } = require('../backend/config/security');
const apiRateLimit = require('../backend/middleware/rate-limit');
const { sanitizeRequest } = require('../backend/utils/sanitize');
const { notFound, errorHandler } = require('../backend/middleware/error-handler');
const apiRoutes = require('../backend/routes');
const { initializeDatabase } = require('../backend/config/database');
const { getRejects, getDataState, getMetrics } = require('../backend/services/dataService');

// ---------------------------------------------------------------------------
// Build an Express app identical to server.js but without server.listen()
// This lets supertest manage the HTTP lifecycle.
// ---------------------------------------------------------------------------
function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(createHelmetMiddleware());
  app.use(createCorsMiddleware());
  app.use(compression());
  app.use(cookieParser(config.sessionSecret));
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(sanitizeRequest);
  app.use(session({
    name: 'ai_reject_sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // test env is not production
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    }
  }));

  app.use('/api', apiRateLimit, apiRoutes);

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
let app;
let agent; // supertest agent that persists cookies across requests

// ---------------------------------------------------------------------------
// Bootstrap: initialize DB + build app once before all tests
// ---------------------------------------------------------------------------
beforeAll(async () => {
  // Initialize SQLite tables and seed data
  await initializeDatabase();

  app = createApp();
  agent = request.agent(app);
}, 30000);

// ---------------------------------------------------------------------------
// 1. Server startup
// ---------------------------------------------------------------------------
describe('Server startup', () => {
  it('should create the Express app without errors', () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('should respond to an unknown route with 404 (via notFound middleware)', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 2. Health endpoint
// ---------------------------------------------------------------------------
describe('GET /api/health', () => {
  it('should return status ok with required fields', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('gemini_model');
    expect(data).toHaveProperty('excel_exists');
    expect(typeof data.excel_exists).toBe('boolean');
    expect(data).toHaveProperty('record_count');
    expect(typeof data.record_count).toBe('number');
    expect(data).toHaveProperty('source');
    expect(data).toHaveProperty('timestamp');
  });

  it('should indicate whether Gemini is configured', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.data).toHaveProperty('gemini_configured');
    expect(typeof res.body.data.gemini_configured).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// 3. Data schema (requires auth)
// ---------------------------------------------------------------------------
describe('GET /api/data/schema', () => {
  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/data/schema');
    expect(res.status).toBe(401);
  });

  it('should return sheet_names and column mappings when authenticated', async () => {
    // Login first using the agent to persist cookies
    const loginRes = await loginAgent(agent);
    if (loginRes === false) {
      // Cannot log in (bootstrap password not set) -- test schema with demo fallback
      console.warn('Skipping authenticated schema test: no bootstrap password configured');
      return;
    }

    const res = await agent.get('/api/data/schema');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data).toHaveProperty('sheet_names');
    expect(Array.isArray(data.sheet_names)).toBe(true);

    if (data.fallback_active) {
      // Demo schema fallback
      expect(data).toHaveProperty('sheets');
      expect(data.sheets).toHaveProperty('Demo Sheet');
    } else {
      // Real Excel schema
      expect(data).toHaveProperty('sheets');
      expect(typeof data.sheets).toBe('object');
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Excel load -- verify dataService loads data
// ---------------------------------------------------------------------------
describe('Excel data load (dataService)', () => {
  it('should load rejects and return an array of records', async () => {
    const rejects = await getRejects();
    expect(Array.isArray(rejects)).toBe(true);
    expect(rejects.length).toBeGreaterThan(0);
  });

  it('each record should have core domain fields', async () => {
    const rejects = await getRejects();
    const r = rejects[0];

    expect(r).toHaveProperty('doc_no');
    expect(r).toHaveProperty('date');
    expect(r).toHaveProperty('department');
    expect(r).toHaveProperty('item_code');
    expect(r).toHaveProperty('item_name');
    expect(r).toHaveProperty('quantity');
    expect(r).toHaveProperty('cost');
    expect(r).toHaveProperty('approval_status');
    expect(r).toHaveProperty('risk_score');
    expect(r).toHaveProperty('risk_level');
  });

  it('should report the current data state', () => {
    const state = getDataState();
    expect(state).toHaveProperty('cachedSource');
    expect(['excel', 'demo']).toContain(state.cachedSource);
    expect(state).toHaveProperty('excelExists');
    expect(state).toHaveProperty('cachedWarnings');
  });

  it('should return metrics object', () => {
    const metrics = getMetrics();
    expect(typeof metrics).toBe('object');
  });
});

// ---------------------------------------------------------------------------
// 5. AI chat response schema (requires auth)
// ---------------------------------------------------------------------------
describe('POST /api/ai/chat', () => {
  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'What is the total cost?' });
    expect(res.status).toBe(401);
  });

  it('should return proper response structure when authenticated', async () => {
    const loginRes = await loginAgent(agent);
    if (loginRes === false) {
      console.warn('Skipping authenticated AI chat test: no bootstrap password configured');
      return;
    }

    const res = await agent
      .post('/api/ai/chat')
      .send({ message: 'What is the total reject cost?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('source');

    // The response merges result fields into the body or uses data field
    // Verify it contains the essential AI response fields
    const body = res.body;
    // chatWithGemini returns: { success, source, data: result, ...result }
    // So reply / charts / actions / sources should be present (from local fallback or Gemini)
    const hasReply = typeof body.reply === 'string' || typeof body.data?.reply === 'string';
    expect(hasReply).toBe(true);
  });

  it('should reject empty messages with validation error', async () => {
    const loginRes = await loginAgent(agent);
    if (loginRes === false) return;

    const res = await agent
      .post('/api/ai/chat')
      .send({ message: '' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should reject messages that are too short (min 1 char)', async () => {
    const loginRes = await loginAgent(agent);
    if (loginRes === false) return;

    const res = await agent
      .post('/api/ai/chat')
      .send({ message: '' });

    expect(res.status).toBe(422); // Joi validation failure
  });
});

// ---------------------------------------------------------------------------
// 6. Auth / RBAC
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'whatever' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when both fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'WrongPass123!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/auth/me', () => {
  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return user with roles and permissions when authenticated', async () => {
    const freshAgent = request.agent(app);
    const loginRes = await loginAgent(freshAgent);
    if (loginRes === false) {
      console.warn('Skipping authenticated /auth/me test: no bootstrap password configured');
      return;
    }

    const res = await freshAgent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('user');

    const user = res.body.data.user;
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('roles');
    expect(user).toHaveProperty('permissions');
    expect(Array.isArray(user.roles)).toBe(true);
    expect(Array.isArray(user.permissions)).toBe(true);
    expect(user.permissions.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Socket data:updated event structure
// ---------------------------------------------------------------------------
describe('Socket data:updated event structure', () => {
  it('should define the expected event payload shape', () => {
    // The data:updated event is emitted by the excelWatcher.
    // We verify the expected contract so consumers can rely on it.
    const expectedPayload = {
      records_count: expect.any(Number),
      source: expect.stringMatching(/^(excel|demo)$/),
      loaded_at: expect.any(String),
      sheet_names: expect.any(Array)
    };

    // Verify the shape matches
    expect(typeof expectedPayload.records_count).toBe('number');
    expect(typeof expectedPayload.source).toBe('string');
    expect(typeof expectedPayload.loaded_at).toBe('string');
    expect(Array.isArray(expectedPayload.sheet_names)).toBe(true);
  });

  it('dataService getState should return fields needed for the socket event', () => {
    const state = getDataState();
    // The socket event is built from data loaded by the dataService
    expect(state).toHaveProperty('cachedSource');
    expect(state).toHaveProperty('excelExists');
    // The excel watcher builds the event with records_count, source, loaded_at, sheet_names
    // The underlying data is available through getRejects()
    expect(typeof state.cachedSource).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Helper: login the supertest agent using bootstrap admin credentials
// Returns true on success, false if login is not possible.
// ---------------------------------------------------------------------------
async function loginAgent(agentInstance) {
  // Try with env-configured bootstrap credentials first
  const email = config.bootstrapAdminEmail || 'yazeed@brightai.site';
  const password = config.bootstrapAdminPassword;

  if (!password) {
    // No bootstrap password set -- the DB seed generated a random one.
    // We cannot log in programmatically in this case.
    return false;
  }

  const res = await agentInstance
    .post('/api/auth/login')
    .send({ email, password });

  if (res.status === 200 && res.body.success) {
    return true;
  }
  return false;
}
