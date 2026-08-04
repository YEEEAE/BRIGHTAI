/**
 * eval-api.ts — TypeScript client for the /api/kernel/evaluations API.
 *
 * Replaces the localStorage-only KernelEvalStore with real API calls,
 * falling back to localStorage cache when offline.
 *
 * Functions:
 *   listEvaluations(filters) — GET /api/kernel/evaluations
 *   getEvaluation(id)        — GET /api/kernel/evaluations/:id
 *   createEvaluation(data)    — POST /api/kernel/evaluations
 *   updateEvaluation(id, data)— PATCH /api/kernel/evaluations/:id
 *   issueCertificate(runId)   — POST /api/kernel/certificates/issue
 *
 * Error handling: 401/403/429 return typed errors with Arabic messages.
 * Caching: localStorage with 5-minute TTL.
 * Offline: detects network failure and falls back to cache.
 */
/* ── Cache layer ───────────────────────────────────────────────────── */
const CACHE_PREFIX = 'brightai-eval-api-';
const CACHE_TTL_MS = 5 * 60 * 1000;
function cacheGet(key) {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw)
            return null;
        const entry = JSON.parse(raw);
        if (Date.now() - entry.ts > CACHE_TTL_MS) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return entry.data;
    }
    catch {
        return null;
    }
}
function cacheSet(key, data) {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
    }
    catch {
        /* quota exceeded — ignore silently */
    }
}
function cacheClear(key) {
    try {
        if (key) {
            localStorage.removeItem(CACHE_PREFIX + key);
        }
        else {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(CACHE_PREFIX))
                    keys.push(k);
            }
            keys.forEach((k) => localStorage.removeItem(k));
        }
    }
    catch {
        /* ignore */
    }
}
/* ── Admin key ─────────────────────────────────────────────────────── */
function getAdminKey() {
    try {
        return localStorage.getItem('brightai-admin-key');
    }
    catch {
        return null;
    }
}
/* ── Core request helper ───────────────────────────────────────────── */
async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const headers = new Headers(options.headers);
        headers.set('Content-Type', 'application/json');
        const adminKey = getAdminKey();
        if (adminKey) {
            headers.set('x-brightai-admin-key', adminKey);
        }
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.status === 401) {
            return {
                ok: false,
                error: 'unauthorized',
                code: '401',
                status: 401,
                arabicMessage: 'الرجاء تسجيل الدخول للوصول إلى هذه الخدمة.',
            };
        }
        if (response.status === 403) {
            return {
                ok: false,
                error: 'forbidden',
                code: '403',
                status: 403,
                arabicMessage: 'ليس لديك صلاحية تنفيذ هذه العملية.',
            };
        }
        if (response.status === 429) {
            return {
                ok: false,
                error: 'rate_limited',
                code: '429',
                status: 429,
                arabicMessage: 'تم تجاوز حدّ الطلبات. حاول مجددًا بعد لحظات.',
            };
        }
        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.json();
            }
            catch {
                errorBody = null;
            }
            const errorMsg = errorBody?.error ||
                response.statusText ||
                'unknown_error';
            return {
                ok: false,
                error: String(errorMsg),
                code: String(response.status),
                status: response.status,
                arabicMessage: `حدث خطأ في الخادم (${response.status}). حاول مجددًا لاحقًا.`,
            };
        }
        const body = (await response.json());
        if (body.ok === false || body.error) {
            return {
                ok: false,
                error: String(body.error || 'unknown'),
                code: String(body.code || response.status),
                status: response.status,
                arabicMessage: body.arabicMessage ||
                    'حدث خطأ غير متوقع. حاول مجددًا.',
            };
        }
        return { ok: true, data: body };
    }
    catch (err) {
        clearTimeout(timeout);
        if (err instanceof DOMException && err.name === 'AbortError') {
            return {
                ok: false,
                error: 'timeout',
                code: 'TIMEOUT',
                status: 0,
                arabicMessage: 'انتهت مهلة الاتصال بالخادم. تحقق من اتصال الإنترنت.',
            };
        }
        return {
            ok: false,
            error: 'network_error',
            code: 'NETWORK',
            status: 0,
            arabicMessage: 'لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت أو تفعّل الوضع غير المتصل.',
        };
    }
}
/* ── Public API ────────────────────────────────────────────────────── */
const BASE = '/api/kernel/evaluations';
export async function listEvaluations(filters = {}) {
    const params = new URLSearchParams();
    if (filters.environment)
        params.set('environment', filters.environment);
    if (filters.status)
        params.set('status', filters.status);
    if (filters.search)
        params.set('search', filters.search);
    if (filters.limit)
        params.set('limit', String(filters.limit));
    if (filters.offset)
        params.set('offset', String(filters.offset));
    const cacheKey = `list-${params.toString()}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
        return { ok: true, data: cached };
    }
    const res = await request(`${BASE}?${params.toString()}`);
    if (!res.ok)
        return res;
    const runs = res.data.runs;
    cacheSet(cacheKey, runs);
    return { ok: true, data: runs };
}
export async function getEvaluation(id) {
    const cacheKey = `get-${id}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
        return { ok: true, data: cached };
    }
    const res = await request(`${BASE}/${encodeURIComponent(id)}`);
    if (!res.ok)
        return res;
    const run = res.data.run;
    cacheSet(cacheKey, run);
    return { ok: true, data: run };
}
export async function createEvaluation(data) {
    const res = await request(BASE, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!res.ok)
        return res;
    const run = res.data.run;
    cacheClear();
    return { ok: true, data: run };
}
export async function updateEvaluation(id, data) {
    const res = await request(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (!res.ok)
        return res;
    const run = res.data.run;
    cacheClear();
    return { ok: true, data: run };
}
export async function issueCertificate(runId) {
    const res = await request('/api/kernel/certificates/issue', {
        method: 'POST',
        body: JSON.stringify({ evaluationId: runId }),
    });
    if (!res.ok)
        return res;
    const cert = res.data.cert;
    cacheClear();
    return { ok: true, data: cert };
}
/* ── Offline mode detection ────────────────────────────────────────── */
export function isOffline() {
    return typeof navigator !== 'undefined' && !navigator.onLine;
}
export function getCacheStats() {
    let hits = 0;
    let misses = 0;
    let size = 0;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                size++;
                const raw = localStorage.getItem(key);
                if (raw) {
                    const entry = JSON.parse(raw);
                    if (Date.now() - entry.ts < CACHE_TTL_MS) {
                        hits++;
                    }
                    else {
                        misses++;
                    }
                }
            }
        }
    }
    catch {
        /* ignore */
    }
    return { hits, misses, size };
}
/* ── Sync local state with DB ──────────────────────────────────────── */
export async function syncLocalWithDb() {
    try {
        const localRuns = cacheGet('local-backup');
        if (!localRuns || localRuns.length === 0) {
            return { ok: true, data: [] };
        }
        const results = [];
        for (const run of localRuns) {
            const res = await createEvaluation({
                name: run.name,
                setup: run.setup,
                status: run.status,
                environment: run.setup?.environment || 'demo',
                provider: run.setup?.provider || 'simulated',
            });
            if (res.ok && res.data) {
                results.push(res.data);
            }
        }
        cacheClear('local-backup');
        return { ok: true, data: results };
    }
    catch (err) {
        return {
            ok: false,
            error: String(err),
            code: 'SYNC_ERROR',
            status: 0,
            arabicMessage: 'فشل المزامنة مع قاعدة البيانات.',
        };
    }
}
