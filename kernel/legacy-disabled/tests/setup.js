import { afterEach, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export const kernelFixtures = {
  stats: {
    total: 3,
    requests: {
      total: 3,
      pending: 1,
      approved: 1,
      executed: 1,
      completed: 1,
      rejected: 0,
      blocked: 1,
    },
    riskDistribution: {
      critical: 1,
      high: 1,
      medium: 0,
      low: 1,
      minimal: 0,
    },
    piiDetected: 1,
    avgRiskScore: 55,
    complianceRate: '90%',
  },
  audit: {
    total: 2,
    rows: [
      {
        id: 'trace-001',
        traceId: 'AI-2026-10001',
        interactionId: 'trace-001',
        approvalStatus: 'blocked',
        riskLevel: 'critical',
        recordHash: 'previous-hash-001',
        query: 'طلب يحتوي على رقم هوية 1099999999',
      },
      {
        id: 'trace-002',
        traceId: 'AI-2026-10002',
        interactionId: 'trace-002',
        approvalStatus: 'completed',
        riskLevel: 'low',
        recordHash: 'previous-hash-002',
        query: 'طلب مشتريات اعتيادي',
      },
    ],
  },
  approvals: {
    pending: [
      {
        id: 'trace-003',
        traceId: 'AI-2026-10003',
        interactionId: 'trace-003',
        status: 'pending',
        riskLevel: 'high',
      },
    ],
    recent: [
      {
        id: 'trace-002',
        traceId: 'AI-2026-10002',
        interactionId: 'trace-002',
        status: 'completed',
        riskLevel: 'low',
      },
    ],
    summary: {
      totalPending: 1,
      criticalCount: 0,
      highCount: 1,
      completedToday: 1,
    },
  },
  evidence: {
    total: 1,
    evidence: [
      {
        id: 'trace-001',
        traceId: 'AI-2026-10001',
        interactionId: 'trace-001',
        status: 'blocked',
      },
    ],
    rows: [],
    details: {},
  },
  compliance: {
    state: {
      pdpl: {
        score: 97,
        status: 'compliant',
        lastAudit: '2026-06-01T00:00:00.000Z',
        requirementScores: {
          consent: 100,
          access: 95,
          breach: 95,
          retention: 100,
          transfer: 95,
        },
      },
    },
  },
  policies: [
    {
      id: 'policy-1',
      name: 'حماية الهوية الوطنية',
      pii_type: 'saudi_id',
      compliance_pack: 'pdpl',
      action: 'block',
    },
  ],
  connectors: [
    {
      id: 'hris',
      name: 'HRIS',
      status: 'connected',
      category: 'hr',
    },
  ],
  scenarios: [
    {
      id: 'pdpl-export',
      title: 'PDPL export review',
      compliancePack: 'pdpl',
      prompt: 'راجع تصدير بيانات موظفين',
    },
  ],
};

const fixtureByFile = {
  'stats.json': kernelFixtures.stats,
  'audit.json': kernelFixtures.audit,
  'approvals.json': kernelFixtures.approvals,
  'evidence.json': kernelFixtures.evidence,
  'compliance.json': kernelFixtures.compliance,
  'policies.json': kernelFixtures.policies,
  'connectors.json': kernelFixtures.connectors,
  'scenarios.json': kernelFixtures.scenarios,
};

function createStorageMock() {
  const storage = new Map();
  return {
    get length() {
      return storage.size;
    },
    key(index) {
      return Array.from(storage.keys())[index] || null;
    },
    getItem(key) {
      return storage.has(String(key)) ? storage.get(String(key)) : null;
    },
    setItem(key, value) {
      storage.set(String(key), String(value));
    },
    removeItem(key) {
      storage.delete(String(key));
    },
    clear() {
      storage.clear();
    },
  };
}

function createIndexedDBMock() {
  const databases = new Map();
  const requestSuccess = (request, result) => {
    queueMicrotask(() => {
      request.result = result;
      request.onsuccess?.({ target: request });
    });
  };

  return {
    open: vi.fn((name) => {
      const request = { result: null, error: null, onsuccess: null, onerror: null, onupgradeneeded: null };
      const database = databases.get(name) || {
        name,
        objectStoreNames: [],
        createObjectStore: vi.fn((storeName) => {
          database.objectStoreNames.push(storeName);
          return { createIndex: vi.fn() };
        }),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => ({ onsuccess: null, onerror: null })),
            put: vi.fn(() => ({ onsuccess: null, onerror: null })),
            delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
            clear: vi.fn(() => ({ onsuccess: null, onerror: null })),
          })),
        })),
        close: vi.fn(),
      };
      databases.set(name, database);
      queueMicrotask(() => request.onupgradeneeded?.({ target: { result: database } }));
      requestSuccess(request, database);
      return request;
    }),
    deleteDatabase: vi.fn((name) => {
      const request = { onsuccess: null, onerror: null };
      databases.delete(name);
      requestSuccess(request, undefined);
      return request;
    }),
  };
}

function createMockResponse(data, init = {}) {
  const status = init.status || 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    headers: new Map(Object.entries(init.headers || {})),
    json: vi.fn(async () => data),
    text: vi.fn(async () => JSON.stringify(data)),
  };
}

export function mockJsonFetch(routes = {}) {
  const mergedRoutes = { ...fixtureByFile, ...routes };
  const fetchMock = vi.fn(async (input, options = {}) => {
    const url = String(input);
    const routeKey = Object.keys(mergedRoutes).find((key) => url === key || url.endsWith(key) || url.includes(key));
    if (!routeKey) {
      return createMockResponse({ error: 'Not found', url, method: options.method || 'GET' }, { status: 404, ok: false });
    }
    const value = typeof mergedRoutes[routeKey] === 'function'
      ? await mergedRoutes[routeKey](input, options)
      : mergedRoutes[routeKey];
    if (value && typeof value === 'object' && 'ok' in value && 'json' in value) return value;
    return createMockResponse(value);
  });

  globalThis.fetch = fetchMock;
  window.fetch = fetchMock;
  return fetchMock;
}

export function resetKernelTestEnvironment() {
  const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body><main id="app"></main></body></html>', {
    url: 'https://brightai.test/kernel/index.html',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.Event = dom.window.Event;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.location = dom.window.location;
  globalThis.AbortController = dom.window.AbortController;
  globalThis.TextEncoder = globalThis.TextEncoder || dom.window.TextEncoder;
  globalThis.TextDecoder = globalThis.TextDecoder || dom.window.TextDecoder;
  dom.window.TextEncoder = globalThis.TextEncoder;
  dom.window.TextDecoder = globalThis.TextDecoder;
  globalThis.IntersectionObserver = vi.fn(function IntersectionObserver(callback) {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
    this.takeRecords = vi.fn(() => []);
    this.callback = callback;
  });
  globalThis.requestAnimationFrame = vi.fn((callback) => setTimeout(() => callback(Date.now()), 0));
  globalThis.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

  const localStorage = createStorageMock();
  const sessionStorage = createStorageMock();
  Object.defineProperty(dom.window, 'localStorage', { value: localStorage, configurable: true });
  Object.defineProperty(dom.window, 'sessionStorage', { value: sessionStorage, configurable: true });
  globalThis.localStorage = localStorage;
  globalThis.sessionStorage = sessionStorage;

  Object.defineProperty(globalThis, 'navigator', {
    value: {
      clipboard: { writeText: vi.fn(async () => undefined) },
      userAgent: 'Vitest BrightAI Kernel',
    },
    configurable: true,
  });
  Object.defineProperty(dom.window, 'navigator', { value: globalThis.navigator, configurable: true });

  const subtle = {
    digest: vi.fn((algorithm, data) => webcrypto.subtle.digest(algorithm, data)),
  };
  const cryptoMock = { subtle, getRandomValues: webcrypto.getRandomValues.bind(webcrypto) };
  Object.defineProperty(dom.window, 'crypto', { value: cryptoMock, configurable: true });
  Object.defineProperty(globalThis, 'crypto', { value: cryptoMock, configurable: true });

  const indexedDB = createIndexedDBMock();
  dom.window.indexedDB = indexedDB;
  globalThis.indexedDB = indexedDB;

  dom.window.matchMedia = vi.fn(() => ({
    matches: false,
    media: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  dom.window.alert = vi.fn();
  dom.window.scrollTo = vi.fn();

  mockJsonFetch();
}

export function loadKernelScript(relativePath) {
  const source = readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
  const scriptUrl = new URL(relativePath, 'https://brightai.test/');
  const previousCurrentScript = Object.getOwnPropertyDescriptor(document, 'currentScript');

  Object.defineProperty(document, 'currentScript', {
    configurable: true,
    get: () => ({ src: scriptUrl.href }),
  });

  try {
    window.eval(`${source}\n//# sourceURL=${scriptUrl.href}`);
  } finally {
    if (previousCurrentScript) {
      Object.defineProperty(document, 'currentScript', previousCurrentScript);
    } else {
      delete document.currentScript;
    }
  }
}

beforeEach(() => {
  resetKernelTestEnvironment();
});

afterEach(() => {
  vi.restoreAllMocks();
});
