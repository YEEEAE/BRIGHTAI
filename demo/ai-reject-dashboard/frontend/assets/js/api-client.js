/**
 * Documentation:
 * - docs/04-api/api-overview.md
 * - docs/04-api/data-api.md
 * - docs/04-api/ai-api.md
 */
/**
 * BrightAI — Centralized API Client
 * AR: عميل API مركزي لكافة اتصالات الواجهة الأمامية مع الخادم.
 * EN: Single-source API client for all frontend-to-backend communication.
 *
 * ⛔ لا يولّد أي بيانات وهمية — يُرجع null عند الفشل ويترك القرار للمستدعي.
 */
const BrightAPI = (() => {
  // ─── Private helpers ───────────────────────────────────────────────
  const _opts = { credentials: 'include' };

  async function _get(url) {
    const res = await fetch(url, _opts);
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? json; // backend wraps payload in { data: … }
  }

  async function _post(url, body) {
    const res = await fetch(url, {
      ..._opts,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? json;
  }

  // ─── Data Source Tracking ──────────────────────────────────────────
  let _dataSource = 'unknown'; // 'excel_live' | 'cache' | 'demo_fallback' | 'error'

  function _detectSource(payload) {
    if (!payload) { _dataSource = 'error'; return; }
    if (payload._source === 'demo') { _dataSource = 'demo_fallback'; return; }
    if (payload._cached) { _dataSource = 'cache'; return; }
    _dataSource = 'excel_live';
  }

  // ─── Public API ────────────────────────────────────────────────────
  return {
    /** Returns current detected data source label */
    getDataSource() { return _dataSource; },

    /**
     * GET /api/rejects
     * @param {Object} filters - { department, category, risk_level, status, source }
     * @returns {Promise<Array>} list of reject records
     */
    async getRejects(filters = {}) {
      const params = new URLSearchParams();
      if (filters.department) params.set('department', filters.department);
      if (filters.category) params.set('category', filters.category);
      if (filters.risk_level) params.set('risk_level', filters.risk_level);
      if (filters.status) params.set('status', filters.status);
      params.set('source', filters.source || 'excel');
      const qs = params.toString();
      const data = await _get(`/api/rejects${qs ? '?' + qs : ''}`);
      _detectSource(data);
      return data.rejects ?? data;
    },

    async getRejectsPayload(filters = {}) {
      const params = new URLSearchParams();
      if (filters.department) params.set('department', filters.department);
      if (filters.category) params.set('category', filters.category);
      if (filters.risk_level) params.set('risk_level', filters.risk_level);
      if (filters.status) params.set('status', filters.status);
      params.set('source', filters.source || 'excel');
      const qs = params.toString();
      const data = await _get(`/api/rejects${qs ? '?' + qs : ''}`);
      _detectSource(data);
      return data;
    },

    /**
     * GET /api/summary
     * @returns {Promise<Object>} executive_summary, kpis, …
     */
    async getSummary() {
      return _get('/api/summary');
    },

    /**
     * GET /api/root-causes
     * @returns {Promise<Object>} root cause analysis data
     */
    async getRootCauses() {
      return _get('/api/root-causes');
    },

    /**
     * GET /api/finance-alerts
     * @returns {Promise<Object>} financial alerts & thresholds
     */
    async getFinanceAlerts() {
      return _get('/api/finance-alerts');
    },

    /**
     * GET /api/ai/anomalies
     * @returns {Promise<Object>} anomaly detection results
     */
    async getAnomalies() {
      return _get('/api/ai/anomalies');
    },

    /**
     * GET /api/ai/enterprise-analysis
     * @returns {Promise<Object>} full enterprise AI analysis
     */
    async getEnterpriseAnalysis() {
      return _get('/api/ai/enterprise-analysis');
    },

    /**
     * GET /api/data/live-status
     * @returns {Promise<Object>} file_exists, record_count, hash, …
     */
    async getDataStatus() {
      return _get('/api/data/live-status');
    },

    /**
     * GET /api/data/schema
     * @returns {Promise<Object>} sheet names, columns, mapping confidence
     */
    async getDataSchema() {
      return _get('/api/data/schema');
    },

    /**
     * GET /api/ai-analysis
     * Includes records, analysis, and Excel-derived metrics when available.
     */
    async getAIAnalysis() {
      return _get('/api/ai-analysis');
    },

    /**
     * GET /api/data/refresh
     * @returns {Promise<Object>} triggers re-parse of Excel file
     */
    async refreshData() {
      return _get('/api/data/refresh');
    },

    /**
     * POST /api/ai/query
     * @param {string} question
     * @returns {Promise<Object>} { answer }
     */
    async askAI(question) {
      return _post('/api/ai/query', { question });
    },

    /**
     * POST /api/ai/generate-capa
     * @param {Object} rejectCase
     * @returns {Promise<Object>} generated CAPA recommendation
     */
    async generateCapa(rejectCase) {
      return _post('/api/ai/generate-capa', { reject_case: rejectCase });
    },

    /**
     * Load the API set needed by each page in parallel.
     * @param {'index'|'production'|'quality'} page
     */
    async loadAllPageData(page) {
      const loaders = {
        index: {
          status: () => this.getDataStatus(),
          rejects: () => this.getRejects({ source: 'excel' }),
          summary: () => this.getSummary(),
          rootCauses: () => this.getRootCauses()
        },
        production: {
          rejectPayload: () => this.getRejectsPayload({ source: 'excel' }),
          analysis: () => this.getAIAnalysis(),
          status: () => this.getDataStatus()
        },
        quality: {
          rejects: () => this.getRejects({ source: 'excel' }),
          summary: () => this.getSummary()
        },
        executive: {
          status: () => this.getDataStatus(),
          rejects: () => this.getRejects({ source: 'excel' }),
          summary: () => this.getSummary()
        },
        finance: {
          status: () => this.getDataStatus(),
          rejects: () => this.getRejects({ source: 'excel' }),
          summary: () => this.getSummary()
        },
        workflow: {
          status: () => this.getDataStatus(),
          rejects: () => this.getRejects({ source: 'excel' }),
          summary: () => this.getSummary()
        },
        technical: {
          status: () => this.getDataStatus(),
          schema: () => this.getDataSchema()
        },
        reports: {
          status: () => this.getDataStatus(),
          rejects: () => this.getRejects({ source: 'excel' }),
          summary: () => this.getSummary()
        },
        profile: {
          status: () => this.getDataStatus()
        },
        users: {
          status: () => this.getDataStatus()
        }
      };

      const pageLoaders = loaders[page];
      if (!pageLoaders) throw new Error(`Unknown page data profile: ${page}`);

      const entries = Object.entries(pageLoaders);
      const settled = await Promise.allSettled(entries.map(([, load]) => load()));
      return settled.reduce((acc, result, index) => {
        const key = entries[index][0];
        if (result.status === 'fulfilled') {
          acc[key] = result.value;
        } else {
          acc[key] = null;
          acc.errors[key] = result.reason;
        }
        return acc;
      }, { errors: {} });
    }
  };
})();

window.BrightAPI = BrightAPI;
