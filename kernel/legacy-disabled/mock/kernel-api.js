/**
 * BrightAI Kernel - API Client
 * Handles production API calls and shared response normalization.
 */

(function (global) {
  'use strict';

  const STATUS_KEYS = ['blocked', 'pending', 'approved', 'executed', 'completed', 'rejected'];
  const RISK_KEYS = ['critical', 'high', 'medium', 'low', 'minimal'];
  const DEFAULT_RUNTIME_CONFIG = {
    baseURL: '/api/kernel',
    mode: 'auto',
    demoStorageKey: 'brightai_kernel_demo_mode',
    timeout: 30000,
    retryAttempts: 3,
    retryDelays: [500, 1000, 2000],
    retryMethods: ['GET', 'HEAD', 'OPTIONS'],
  };

  function readRuntimeConfig() {
    return {
      ...DEFAULT_RUNTIME_CONFIG,
      ...(global.BrightAIKernelConfig || {}),
    };
  }

  function isFileProtocol() {
    return global.location?.protocol === 'file:';
  }

  function isDemoModeSelected() {
    const config = readRuntimeConfig();
    try {
      return global.localStorage?.getItem(config.demoStorageKey) === 'true';
    } catch (_error) {
      return false;
    }
  }

  function shouldUseDemoData() {
    const config = readRuntimeConfig();
    const mode = String(config.mode || 'auto').toLowerCase();
    if (isFileProtocol()) return true;
    if (['demo', 'mock'].includes(mode)) return true;
    if (['live', 'production'].includes(mode)) return false;
    return isDemoModeSelected();
  }

  function toNumber(value, fallback = 0) {
    if (value === null || value === undefined || value === '') return fallback;
    const normalized = typeof value === 'string' ? value.replace('%', '').replace(/,/g, '').trim() : value;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
  }

  function toPercent(value, fallback = 0) {
    const percent = toNumber(value, fallback);
    return Math.max(0, Math.min(100, Math.round(percent * 10) / 10));
  }

  function normalizeRiskLevels(raw = {}) {
    const riskLevels = RISK_KEYS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    const source = raw.riskLevels || raw.riskDistribution || {};
    if (Array.isArray(raw.byRiskLevel)) {
      raw.byRiskLevel.forEach((row) => {
        const key = row.risk_level || row.riskLevel || row.level || row.key;
        if (RISK_KEYS.includes(key)) riskLevels[key] = toNumber(row.count || row.value);
      });
      return riskLevels;
    }

    Object.entries(source).forEach(([key, value]) => {
      if (RISK_KEYS.includes(key)) riskLevels[key] = toNumber(value);
    });

    return riskLevels;
  }

  function calculateAverageRisk(riskLevels) {
    const weights = { critical: 100, high: 75, medium: 50, low: 25, minimal: 10 };
    let total = 0;
    let weighted = 0;

    Object.entries(riskLevels || {}).forEach(([level, count]) => {
      const value = toNumber(count);
      total += value;
      weighted += value * (weights[level] || 0);
    });

    return total > 0 ? Math.round(weighted / total) : 0;
  }

  function normalizeTrace(trace = {}) {
    const traceId = trace.traceId || trace.trace_id || trace.kernel?.traceId || trace.metadata?.traceId || trace.summary?.traceId || '';
    const interactionId = trace.interactionId || trace.interaction_id || trace.id || trace.requestId || trace.request_id || '';
    return {
      ...trace,
      traceId: /^AI-\d{4}-\d{5,}$/.test(String(traceId)) ? String(traceId) : '',
      interactionId,
      requestId: interactionId,
    };
  }

  function normalizeRiskByDepartment(raw = {}) {
    const source = raw.riskByDepartment || raw.risk_by_department || {};
    const departments = Array.isArray(source.departments)
      ? source.departments
      : Array.isArray(raw.departments)
        ? raw.departments
        : [];

    return {
      departments: departments.map((department) => {
        const piiTypes = department.piiTypes || department.pii_types || department.topPiiTypes || department.top_pii_types || [];
        return {
          name: String(department.name || department.department || 'غير محدد'),
          low: toNumber(department.low),
          medium: toNumber(department.medium),
          high: toNumber(department.high),
          critical: toNumber(department.critical),
          piiTypes: Array.isArray(piiTypes) ? piiTypes.map(String).filter(Boolean) : [],
          piiTypesByRisk: department.piiTypesByRisk || department.pii_types_by_risk || {},
        };
      }).filter((department) => department.name)
    };
  }

  function normalizeStats(raw = {}) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const statusSource = source.statusDistribution || {};
    const requests = source.requests || statusSource;
    const statistics = source.statistics || {};

    const blocked = toNumber(source.blocked ?? requests.blocked ?? statusSource.blocked);
    const pending = toNumber(source.pendingApproval ?? source.pending ?? requests.pending ?? statusSource.pending ?? statistics.pendingRequests);
    const approved = toNumber(source.approved ?? requests.approved ?? statusSource.approved);
    const executed = toNumber(source.executed ?? requests.executed ?? statusSource.executed);
    const completed = toNumber(source.completed ?? source.autoApproved ?? requests.completed ?? requests.autoApproved ?? statusSource.completed);
    const rejected = toNumber(source.rejected ?? requests.rejected ?? statusSource.rejected);

    const statusDistribution = STATUS_KEYS.reduce((acc, key) => {
      acc[key] = { blocked, pending, approved, executed, completed, rejected }[key] || 0;
      return acc;
    }, {});

    const derivedTotal = STATUS_KEYS.reduce((sum, key) => sum + statusDistribution[key], 0);
    const totalRequests = toNumber(
      source.totalRequests ?? source.total ?? requests.total ?? statistics.totalRequests,
      derivedTotal
    ) || derivedTotal;

    const riskLevels = normalizeRiskLevels(source);
    const avgRisk = toPercent(
      source.avgRisk ?? source.avgRiskScore ?? statistics.averageRiskScore,
      calculateAverageRisk(riskLevels)
    );

    const piiDetected = toNumber(source.piiDetected ?? source.pii_detected);
    const piiDetectionRate = toPercent(
      source.piiDetectionRate ?? source.pii_detection_rate,
      totalRequests > 0 ? (piiDetected / totalRequests) * 100 : 0
    );

    const complianceFallback = totalRequests > 0
      ? ((approved + executed + completed) / totalRequests) * 100
      : 0;
    const chainSource = source.chainIntegrity ?? source.chain_integrity ?? source.chainStatus ?? source.chain?.integrity ?? source.chain?.valid;

    return {
      totalRequests,
      pendingApproval: pending,
      avgRisk,
      piiDetectionRate,
      statusDistribution,
      riskLevels,
      complianceRate: toPercent(source.complianceRate ?? source.compliance_rate, complianceFallback),
      chainIntegrity: chainSource === undefined ? 'unknown' : chainSource,
      lastUpdated: source.lastUpdated || source.updatedAt || source.generatedAt || source.timestamp || new Date().toISOString(),
      latestTraces: Array.isArray(source.latestTraces) ? source.latestTraces.map(normalizeTrace) : [],
      riskByDepartment: normalizeRiskByDepartment(source),
    };
  }


  class KernelAPI {
    constructor() {
      const config = readRuntimeConfig();
      this.baseURL = config.baseURL;
      this.timeout = config.timeout;
      this.retryAttempts = config.retryAttempts;
      this.retryDelays = config.retryDelays;
    }

    async request(endpoint, options = {}) {
      const config = readRuntimeConfig();
      const url = `${options.baseURL || config.baseURL || this.baseURL}${endpoint}`;
      const timeout = options.timeout || this.timeout;
      const method = String(options.method || 'GET').toUpperCase();
      const attempts = Number.isFinite(Number(options.retryAttempts))
        ? Number(options.retryAttempts)
        : Number(config.retryAttempts ?? this.retryAttempts);
      const retryMethods = Array.isArray(config.retryMethods) ? config.retryMethods.map((item) => String(item).toUpperCase()) : [];
      const retryable = options.retry === true || (options.retry !== false && retryMethods.includes(method));
      let lastError = null;

      for (let attempt = 0; attempt <= (retryable ? attempts : 0); attempt += 1) {
        try {
          return await this.fetchOnce(url, { ...options, method, timeout });
        } catch (error) {
          lastError = error;
          if (!retryable || attempt >= attempts || !this.shouldRetry(error)) break;
          await this.delayForAttempt(attempt, config.retryDelays || this.retryDelays);
        }
      }

      throw lastError;
    }

    async fetchOnce(url, options = {}) {
      const timeout = options.timeout || this.timeout;
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : null;
      const headers = {
        'Content-Type': 'application/json',
        'x-kernel-user-id': KernelUtils?.getUserId() || 'anonymous',
        'x-kernel-user-name': KernelUtils?.getUserName() || 'مستخدم',
        ...(options.headers || {}),
      };

      // Always calls window.fetch which will be intercepted smoothly
      try {
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller ? controller.signal : undefined,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new APIError(data.error || `HTTP ${response.status}`, response.status, data);
        }

        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new APIError('انتهت مهلة الطلب', 408, { errorCode: 'REQUEST_TIMEOUT' });
        }
        throw error;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }

    shouldRetry(error) {
      if (!error) return false;
      if (error.status === 408 || error.status === 429) return true;
      if (error.status >= 500) return true;
      return error.name !== 'APIError';
    }

    delayForAttempt(attempt, delays = []) {
      const delay = toNumber(delays[attempt], toNumber(delays[delays.length - 1], 0));
      return new Promise((resolve) => setTimeout(resolve, delay));
    }

    async health() {
      return this.request('/health');
    }

    async getProviderStatus() {
      try {
        const providerData = await this.request('/providers');
        const active = providerData.activeProvider || providerData.provider || {};
        return {
          status: providerData.demoMode ? 'degraded' : 'ok',
          provider: active.name || 'local',
          model: active.model || 'Demo Mode',
          configured: Boolean(active.configured),
          mode: active.mode || (active.configured ? 'production' : 'demo'),
          region: active.region || '',
          dataResidency: active.dataResidency || '',
          supportsArabic: active.supportsArabic !== false,
          activeProvider: active,
          providers: providerData.providers || {},
        };
      } catch (error) {
        const demoDataActive = Boolean(global.kernelShouldUseDemoData?.());
        return {
          status: 'error',
          provider: demoDataActive ? 'local' : 'production-api',
          model: demoDataActive ? 'Demo Mode' : 'Unavailable',
          configured: false,
          mode: demoDataActive ? 'demo' : 'production',
          region: demoDataActive ? 'local' : '',
          dataResidency: demoDataActive ? 'Demo mode' : 'Production API unavailable',
          supportsArabic: true,
          providers: {},
        };
      }
    }

    async getNvidiaStatus() {
      return this.request('/nvidia/status', { timeout: 10000 });
    }

    async nvidiaChat(message, options = {}) {
      return this.request('/nvidia/chat', {
        method: 'POST',
        timeout: options.timeout || this.timeout,
        body: {
          message,
          messages: options.messages,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        },
      });
    }

    async chat(query, context = '', compliancePackage = 'general') {
      return this.request('/chat', {
        method: 'POST',
        body: {
          message: query,
          compliancePack: compliancePackage,
          metadata: { context },
        },
      }).then((data) => this.normalizeKernelRecord(data));
    }

    async getStats() {
      return this.request('/stats').then((data) => normalizeStats(data));
    }

    async getAuditLog(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      return this.request(`/audit${queryString ? '?' + queryString : ''}`).then((data) => {
        if (Array.isArray(data.rows)) data.rows = data.rows.map((row) => this.normalizeKernelRecord(row));
        if (Array.isArray(data.entries)) data.entries = data.entries.map((row) => this.normalizeKernelRecord(row));
        return data;
      });
    }

    async getChain() {
      return this.request('/chain').then((data) => {
        if (Array.isArray(data.entries)) data.entries = data.entries.map((row) => this.normalizeKernelRecord(row));
        return data;
      });
    }

    async getAuditChain() {
      return this.getChain();
    }

    async verifyChain() {
      return this.request('/chain/verify', { method: 'POST' });
    }

    async getPendingApprovals() {
      return this.request('/approvals').then((data) => {
        if (Array.isArray(data.pending)) data.pending = data.pending.map((row) => this.normalizeKernelRecord(row));
        if (Array.isArray(data.recent)) data.recent = data.recent.map((row) => this.normalizeKernelRecord(row));
        return data;
      });
    }

    async getPendingCount() {
      try {
        const data = await this.getPendingApprovals();
        return data.summary?.totalPending || 0;
      } catch (error) {
        return 0;
      }
    }

    async approveRequest(requestId, approver) {
      return this.request(`/approvals/${encodeURIComponent(requestId)}/approve`, {
        method: 'POST',
        body: { approver },
      }).then((data) => this.normalizeKernelRecord(data));
    }

    async rejectRequest(requestId, approver, reason = '') {
      return this.request(`/approvals/${encodeURIComponent(requestId)}/reject`, {
        method: 'POST',
        body: { approver, reason },
      }).then((data) => this.normalizeKernelRecord(data));
    }

    async bulkAction(requestIds, action, approver = '') {
      return this.request('/approvals/bulk', {
        method: 'POST',
        body: { requestIds, action, approver },
      });
    }

    async executeApproved(requestId) {
      return this.request(`/approvals/${encodeURIComponent(requestId)}/execute`, {
        method: 'POST',
      }).then((data) => this.normalizeKernelRecord(data));
    }

    async sendChat(message, options = {}) {
      return this.request('/chat', {
        method: 'POST',
        body: {
          ...options,
          message,
          compliancePack: options.compliancePack || undefined,
          scenario: options.scenario || undefined,
        },
      });
    }

    async getCompliance() {
      return this.request('/compliance');
    }

    async getPolicies(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      return this.request(`/policies${queryString ? '?' + queryString : ''}`);
    }

    async createPolicy(policyData) {
      return this.request('/policies', {
        method: 'POST',
        body: policyData,
      });
    }

    async updatePolicy(policyId, updates) {
      return this.request(`/policies/${encodeURIComponent(policyId)}`, {
        method: 'PATCH',
        body: updates,
      });
    }

    async deletePolicy(policyId) {
      return this.request(`/policies/${encodeURIComponent(policyId)}`, {
        method: 'DELETE',
      });
    }

    async getEvidence(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      return this.request(`/evidence${queryString ? '?' + queryString : ''}`).then((data) => {
        if (Array.isArray(data.evidence)) data.evidence = data.evidence.map((row) => this.normalizeKernelRecord(row));
        if (Array.isArray(data.rows)) data.rows = data.rows.map((row) => this.normalizeKernelRecord(row));
        return data;
      });
    }

    async getEvidenceById(requestId) {
      return this.request(`/evidence/${encodeURIComponent(requestId)}`).then((data) => this.normalizeKernelRecord(data));
    }

    async exportEvidence(requestId) {
      return this.request(`/evidence/${encodeURIComponent(requestId)}/export`).then((data) => this.normalizeKernelRecord(data));
    }

    extractTraceId(record = {}) {
      const value = record.traceId || record.trace_id || record.kernel?.traceId || record.metadata?.traceId || record.summary?.traceId;
      return /^AI-\d{4}-\d{5,}$/.test(String(value || '')) ? String(value) : null;
    }

    normalizeKernelRecord(record = {}) {
      if (!record || typeof record !== 'object') return record;
      const interactionId = record.interactionId || record.interaction_id || record.id || record.requestId || record.request_id || null;
      const traceId = this.extractTraceId(record);
      return {
        ...record,
        interactionId,
        traceId,
        trace_id: traceId,
        requestId: interactionId,
      };
    }

    traceLink(traceId, page = 'evidence') {
      const safeTrace = encodeURIComponent(traceId || '');
      const target = page.endsWith('.html') ? page : `${page}.html`;
      return `/kernel/${target}?trace_id=${safeTrace}`;
    }
  }

  class APIError extends Error {
    constructor(message, status, data = {}) {
      super(message);
      this.name = 'APIError';
      this.status = status;
      this.data = data;
    }
  }

  const kernelAPI = new KernelAPI();

  global.KernelAPI = KernelAPI;
  global.kernelAPI = kernelAPI;
  global.APIError = APIError;
  global.KernelRuntimeConfig = {
    defaults: DEFAULT_RUNTIME_CONFIG,
    get: readRuntimeConfig,
    shouldUseDemoData,
    isDemoModeSelected,
    isFileProtocol,
  };
  global.KernelApiHelpers = {
    STATUS_KEYS,
    RISK_KEYS,
    toNumber,
    toPercent,
    normalizeRiskLevels,
    calculateAverageRisk,
    normalizeTrace,
    normalizeRiskByDepartment,
    normalizeStats,
    shouldUseDemoData,
    isDemoModeSelected,
    isFileProtocol,
  };
  global.normalizeStats = normalizeStats;

})(typeof window !== 'undefined' ? window : this);
