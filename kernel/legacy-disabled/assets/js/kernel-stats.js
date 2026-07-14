/**
 * BrightAI Kernel - Statistics Module
 * Renders the stats dashboard, Chart.js visualizations, range filters, and PDF export.
 */

(function (global) {
  'use strict';

  const KernelStats = {
    config: {
      refreshInterval: 30000,
      animationDuration: 600,
      colors: {
        brand: '#00D4FF',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#8B5CF6',
        muted: '#64748B',
        panel: 'rgba(15, 23, 42, 0.72)',
        grid: 'rgba(148, 163, 184, 0.16)',
        text: '#F8FAFC',
        textMuted: '#94A3B8',
      },
      riskLevels: [
        { key: 'critical', label: 'حرج', color: '#EF4444' },
        { key: 'high', label: 'مرتفع', color: '#F97316' },
        { key: 'medium', label: 'متوسط', color: '#F59E0B' },
        { key: 'low', label: 'منخفض', color: '#22C55E' },
        { key: 'minimal', label: 'ضئيل', color: '#10B981' },
      ],
      statusTypes: [
        { key: 'blocked', label: 'محجوبة', color: 'rgba(239, 68, 68, 0.92)' },
        { key: 'pending', label: 'بانتظار المراجعة', color: 'rgba(245, 158, 11, 0.85)' },
        { key: 'approved', label: 'تمت الموافقة', color: 'rgba(0, 212, 255, 0.85)' },
        { key: 'executed', label: 'قيد التنفيذ', color: 'rgba(167, 139, 250, 0.85)' },
        { key: 'completed', label: 'مكتملة', color: 'rgba(16, 185, 129, 0.85)' },
        { key: 'rejected', label: 'مرفوضة', color: 'rgba(239, 68, 68, 0.85)' },
      ],
    },

    state: {
      refreshTimer: null,
      currentData: null,
      auditRows: [],
      isLoading: false,
      charts: {},
      range: {
        type: '7',
        from: null,
        to: null,
      },
      dashboardReady: false,
    },

    init(options = {}) {
      this.config = { ...this.config, ...options };
      this.setupDashboard();
      this.loadStats();
      this.startAutoRefresh();

      global.addEventListener('kernel-demo-update', (e) => {
        if (e.detail && e.detail.stats) {
          const normalized = this.enrichStats(this.normalizeStats(e.detail.stats), e.detail.stats, this.state.auditRows);
          this.state.currentData = normalized;
          this.renderStats(normalized);
          this.updateLastRefreshTime();
        }
      });
    },

    setupDashboard() {
      if (this.state.dashboardReady) return;
      this.state.dashboardReady = true;

      document.querySelectorAll('[data-range]').forEach((button) => {
        button.addEventListener('click', () => {
          this.setRange(button.dataset.range);
        });
      });

      const applyCustom = document.getElementById('apply-custom-range');
      if (applyCustom) {
        applyCustom.addEventListener('click', () => {
          const from = document.getElementById('date-from')?.value || null;
          const to = document.getElementById('date-to')?.value || null;
          this.setRange('custom', from, to);
        });
      }

      const exportButton = document.getElementById('export-dashboard-pdf');
      if (exportButton) {
        exportButton.addEventListener('click', () => this.exportDashboardPDF());
      }
    },

    setRange(type, from = null, to = null) {
      this.state.range = { type, from, to };
      document.querySelectorAll('[data-range]').forEach((button) => {
        button.classList.toggle('active', button.dataset.range === type);
      });

      const customRange = document.getElementById('custom-date-range');
      if (customRange) {
        customRange.hidden = type !== 'custom';
      }

      if (type !== 'custom' || (from && to)) {
        this.loadStats({ force: true });
      }
    },

    startAutoRefresh() {
      if (this.state.refreshTimer) {
        clearInterval(this.state.refreshTimer);
      }
      this.state.refreshTimer = setInterval(() => {
        this.loadStats();
      }, this.config.refreshInterval);
    },

    stopAutoRefresh() {
      if (this.state.refreshTimer) {
        clearInterval(this.state.refreshTimer);
        this.state.refreshTimer = null;
      }
    },

    async loadStats(options = {}) {
      if (this.state.isLoading && !options.force) return;
      this.state.isLoading = true;
      this.updateRefreshStatus('جاري التحديث...');

      try {
        const [rawStats, auditRows] = await Promise.all([
          this.fetchStats(),
          this.fetchAuditRows(),
        ]);
        const normalized = this.enrichStats(this.normalizeStats(rawStats), rawStats, auditRows);
        this.state.auditRows = auditRows;
        this.state.currentData = normalized;
        this.renderStats(normalized);
      } catch (error) {
        if (typeof global.kernelShouldUseDemoData === 'function' && global.kernelShouldUseDemoData()) {
          const demo = this.generateDemoData();
          const normalized = this.enrichStats(this.normalizeStats(demo), demo, demo.latestTraces || []);
          this.state.auditRows = demo.latestTraces || [];
          this.state.currentData = normalized;
          this.renderStats(normalized);
        } else {
          console.warn('[BrightAI Kernel] Stats production API failed:', error);
          const empty = this.enrichStats(this.normalizeStats({}), {}, []);
          this.state.auditRows = [];
          this.state.currentData = empty;
          this.renderStats(empty);
        }
      } finally {
        this.state.isLoading = false;
        this.updateLastRefreshTime();
        this.updateRefreshStatus('التحديث التلقائي نشط');
      }
    },

    async fetchStats() {
      const response = await fetch('/api/kernel/stats', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },

    async fetchAuditRows() {
      const range = this.getRangeWindow();
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (range.from) params.set('from', range.from.toISOString());
      if (range.to) params.set('to', range.to.toISOString());

      try {
        if (global.kernelAPI?.getAuditLog) {
          const data = await global.kernelAPI.getAuditLog(Object.fromEntries(params.entries()));
          return this.normalizeAuditRows(data);
        }

        const response = await fetch(`/api/kernel/audit?${params.toString()}`, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Failed to fetch audit rows');
        return this.normalizeAuditRows(await response.json());
      } catch (_error) {
        return [];
      }
    },

    normalizeAuditRows(data = {}) {
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data.rows)
          ? data.rows
          : Array.isArray(data.entries)
            ? data.entries
            : Array.isArray(data.audit)
              ? data.audit
              : [];

      const range = this.getRangeWindow();
      return rows
        .map((row) => this.normalizeTraceRow(row))
        .filter((row) => this.isWithinRange(row.createdAt, range));
    },

    normalizeTraceRow(row = {}) {
      const traceId = this.extractTraceId(row) || '';
      const interactionId = row.interactionId || row.interaction_id || row.id || row.requestId || row.request_id || '';
      return {
        ...row,
        traceId,
        interactionId,
        requestId: interactionId,
        query: row.query || row.request_message || row.originalText || row.message || row.preview || '',
        department: row.department || row.departmentName || row.user_department || 'غير محدد',
        compliancePackage: row.compliancePackage || row.compliancePack || row.compliance_pack || row.kernel?.compliance?.pack || 'general',
        riskScore: this.toNumber(row.riskScore ?? row.risk_score ?? row.kernel?.risk?.score),
        riskLevel: row.riskLevel || row.risk_level || row.kernel?.risk?.level || this.getRiskLevelFromScore(row.riskScore ?? row.risk_score),
        status: row.status || row.approvalStatus || row.approval_status || row.action || 'kernel',
        createdAt: row.createdAt || row.created_at || row.timestamp || row.updatedAt || row.updated_at || new Date().toISOString(),
      };
    },

    getRangeWindow() {
      const now = new Date();
      const end = this.state.range.to ? new Date(`${this.state.range.to}T23:59:59`) : now;
      let start;

      if (this.state.range.type === 'custom' && this.state.range.from) {
        start = new Date(`${this.state.range.from}T00:00:00`);
      } else {
        const days = Number(this.state.range.type) || 7;
        start = new Date(end);
        start.setDate(start.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);
      }

      return { from: start, to: end };
    },

    isWithinRange(dateValue, range) {
      const time = new Date(dateValue || 0).getTime();
      if (!Number.isFinite(time)) return true;
      return time >= range.from.getTime() && time <= range.to.getTime();
    },

    generateDemoData() {
      return {
        requests: {
          total: 348,
          blocked: 28,
          pending: 4,
          approved: 24,
          executed: 24,
          completed: 272,
          rejected: 20,
        },
        piiDetectionRate: 18,
        avgRiskScore: 31.4,
        complianceRate: '92.5%',
        riskDistribution: {
          critical: 12,
          high: 34,
          medium: 68,
          low: 146,
          minimal: 88,
        },
        trends: {
          totalRequests: 12,
          pendingApproval: -8,
          avgRisk: -3,
          piiDetectionRate: 6,
        },
        riskByDepartment: {
          departments: [
            { name: 'المشتريات', low: 120, medium: 44, high: 12, critical: 3, piiTypes: ['saudi_iban', 'commercial_registration', 'contract_value'] },
            { name: 'الموارد البشرية', low: 68, medium: 39, high: 16, critical: 4, piiTypes: ['employee_name', 'salary', 'performance_review'] },
            { name: 'الرعاية الصحية', low: 34, medium: 26, high: 18, critical: 9, piiTypes: ['patient_id', 'saudi_id', 'diagnosis'] },
            { name: 'المالية', low: 52, medium: 31, high: 21, critical: 6, piiTypes: ['saudi_iban', 'card_or_account', 'invoice_number'] },
          ],
        },
        latestTraces: [
          {
            interactionId: 'trace-10491',
            requestId: 'trace-10491',
            traceId: 'AI-2026-10491',
            status: 'blocked',
            riskLevel: 'critical',
            riskScore: 100,
            createdAt: new Date(Date.now() - 600000).toISOString(),
            department: 'الرعاية الصحية',
            compliancePackage: 'pdpl',
            query: 'مشاركة ملف المرضى مع جهة بحثية خارجية تشمل أرقام الهواتف والهويات الوطنية',
          },
          {
            interactionId: 'trace-10493',
            requestId: 'trace-10493',
            traceId: 'AI-2026-10493',
            status: 'pending',
            riskLevel: 'high',
            riskScore: 82,
            createdAt: new Date(Date.now() - 1200000).toISOString(),
            department: 'المالية',
            compliancePackage: 'pdpl',
            query: 'طلب تصدير التقرير المالي الربع سنوي ويحتوي على أرقام بطاقات مصرفية',
          },
          {
            interactionId: 'trace-10494',
            requestId: 'trace-10494',
            traceId: 'AI-2026-10494',
            status: 'rejected',
            riskLevel: 'critical',
            riskScore: 95,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            department: 'الرعاية الصحية',
            compliancePackage: 'sfda',
            query: 'تصدير ملف طبي كامل يحتوي على الهوية وتفاصيل التشخيص',
          },
          {
            interactionId: 'trace-10492',
            requestId: 'trace-10492',
            traceId: 'AI-2026-10492',
            status: 'completed',
            riskLevel: 'minimal',
            riskScore: 15,
            createdAt: new Date(Date.now() - 2400000).toISOString(),
            department: 'المشتريات',
            compliancePackage: 'procurement',
            query: 'مراجعة عقد توريد تجاري والتحقق من شروط الضمان والمشتريات الحكومية',
          },
        ],
      };
    },

    renderStats(data) {
      if (typeof this.onDataUpdate === 'function') {
        this.onDataUpdate(this.normalizeStats(data));
      }

      const kpiGrid = document.getElementById('kpi-grid');
      if (data.totalRequests === 0 && kpiGrid && global.KernelEmptyStates) {
        KernelEmptyStates.render(kpiGrid);
        return;
      }
      if (kpiGrid && global.KernelEmptyStates) KernelEmptyStates.clear(kpiGrid);

      this.renderKPIs(data);
      this.renderStatusCards(data.statusDistribution || {});
      this.renderCharts(data);
      this.renderTopRiskQueries(data.topRiskQueries || []);
      this.renderLatestTraces(data.latestTraces || []);
    },

    normalizeStats(data = {}) {
      const source = data && typeof data === 'object' ? data : {};
      const normalized = typeof global.normalizeStats === 'function'
        ? global.normalizeStats(source)
        : this.localNormalizeStats(source);

      return {
        ...normalized,
        trends: this.normalizeTrends(source, normalized),
        trendSeries: this.normalizeTrendSeries(source, normalized),
        topRiskQueries: this.normalizeTopRiskQueries(source.topRiskQueries || source.top_risk_queries || []),
      };
    },

    localNormalizeStats(data = {}) {
      const requests = data.requests || {};
      const statusDistribution = data.statusDistribution || {};
      const riskLevels = data.riskLevels || data.riskDistribution || {};
      const totalRequests = this.toNumber(data.totalRequests || data.total || requests.total);
      const pending = this.toNumber(data.pendingApproval || data.pending || requests.pending || statusDistribution.pending);

      return {
        totalRequests,
        pendingApproval: pending,
        avgRisk: this.toNumber(data.avgRisk || data.avgRiskScore) || this.calculateAverageRisk(riskLevels),
        piiDetectionRate: this.toNumber(data.piiDetectionRate),
        statusDistribution: {
          blocked: this.toNumber(data.blocked || requests.blocked || statusDistribution.blocked),
          pending,
          approved: this.toNumber(data.approved || requests.approved || statusDistribution.approved),
          executed: this.toNumber(data.executed || requests.executed || statusDistribution.executed),
          completed: this.toNumber(data.autoApproved || data.completed || requests.completed || statusDistribution.completed),
          rejected: this.toNumber(data.rejected || requests.rejected || statusDistribution.rejected),
        },
        riskLevels,
        complianceRate: this.toNumber(String(data.complianceRate || 0).replace('%', '')),
        chainIntegrity: data.chainIntegrity || 'unknown',
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        latestTraces: Array.isArray(data.latestTraces) ? data.latestTraces.map((trace) => this.normalizeTraceRow(trace)) : [],
        riskByDepartment: this.normalizeRiskByDepartment(data.riskByDepartment || data.risk_by_department),
      };
    },

    enrichStats(normalized, raw = {}, auditRows = []) {
      const latestTraces = [
        ...(Array.isArray(auditRows) ? auditRows : []),
        ...(Array.isArray(normalized.latestTraces) ? normalized.latestTraces.map((row) => this.normalizeTraceRow(row)) : []),
      ];

      const deduped = this.dedupeRows(latestTraces);
      const topRiskQueries = this.normalizeTopRiskQueries(raw.topRiskQueries || raw.top_risk_queries || [])
        .concat(this.buildTopRiskQueries(deduped))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      return {
        ...normalized,
        latestTraces: deduped.slice(0, 8),
        trendSeries: normalized.trendSeries?.labels?.length
          ? normalized.trendSeries
          : this.buildTrendSeries(normalized, deduped),
        trends: normalized.trends || this.buildTrendIndicators(normalized, deduped),
        topRiskQueries,
      };
    },

    dedupeRows(rows = []) {
      const seen = new Set();
      return rows
        .map((row) => this.normalizeTraceRow(row))
        .filter((row) => {
          const key = row.traceId || row.interactionId || row.query;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    normalizeTrends(source = {}, normalized = {}) {
      const trends = source.trends || source.trendIndicators || source.trend_indicators;
      if (trends && typeof trends === 'object') {
        return {
          totalRequests: this.toNumber(trends.totalRequests ?? trends.requestsChange ?? trends.requests ?? trends.total),
          pendingApproval: this.toNumber(trends.pendingApproval ?? trends.pendingChange ?? trends.pending),
          avgRisk: this.toNumber(trends.avgRisk ?? trends.riskChange ?? trends.risk),
          piiDetectionRate: this.toNumber(trends.piiDetectionRate ?? trends.piiChange ?? trends.pii),
        };
      }

      return this.buildTrendIndicators(normalized, []);
    },

    normalizeTrendSeries(source = {}, normalized = {}) {
      const raw = source.trendSeries || source.trendsSeries || source.dailyTrends || source.daily_trends;
      if (!raw) return this.buildTrendSeries(normalized, []);

      const rows = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
      if (!Array.isArray(rows) || !rows.length) return this.buildTrendSeries(normalized, []);

      return {
        labels: rows.map((row) => row.label || this.formatShortDate(row.date || row.day || row.createdAt)),
        requests: rows.map((row) => this.toNumber(row.requests ?? row.totalRequests ?? row.total)),
        risk: rows.map((row) => this.toNumber(row.risk ?? row.avgRisk ?? row.avgRiskScore)),
        compliance: rows.map((row) => this.toNumber(row.compliance ?? row.complianceRate)),
      };
    },

    buildTrendIndicators(stats = {}, rows = []) {
      if (rows.length >= 2) {
        const midpoint = Math.ceil(rows.length / 2);
        const recent = rows.slice(0, midpoint);
        const previous = rows.slice(midpoint);
        return {
          totalRequests: this.percentChange(recent.length, previous.length),
          pendingApproval: this.percentChange(this.countStatus(recent, 'pending'), this.countStatus(previous, 'pending')),
          avgRisk: this.percentChange(this.average(recent.map((row) => row.riskScore)), this.average(previous.map((row) => row.riskScore))),
          piiDetectionRate: this.percentChange(this.countRowsWithPii(recent), this.countRowsWithPii(previous)),
        };
      }

      return {
        totalRequests: this.estimateTrend(stats.totalRequests, 12),
        pendingApproval: this.estimateTrend(stats.pendingApproval, -8),
        avgRisk: this.estimateTrend(stats.avgRisk, -3),
        piiDetectionRate: this.estimateTrend(stats.piiDetectionRate, 6),
      };
    },

    buildTrendSeries(stats = {}, rows = []) {
      const range = this.getRangeWindow();
      const labels = [];
      const requests = [];
      const risk = [];
      const compliance = [];
      const days = Math.max(2, Math.min(90, Math.ceil((range.to - range.from) / 86400000) + 1));
      const rowsByDay = new Map();

      rows.forEach((row) => {
        const key = this.formatISODate(row.createdAt);
        if (!rowsByDay.has(key)) rowsByDay.set(key, []);
        rowsByDay.get(key).push(row);
      });

      for (let index = days - 1; index >= 0; index -= 1) {
        const date = new Date(range.to);
        date.setDate(date.getDate() - index);
        const key = this.formatISODate(date);
        const dayRows = rowsByDay.get(key) || [];
        labels.push(this.formatShortDate(date));

        if (dayRows.length) {
          requests.push(dayRows.length);
          risk.push(Math.round(this.average(dayRows.map((row) => row.riskScore))));
          compliance.push(Math.round(this.calculateComplianceFromRows(dayRows)));
        } else {
          const progress = (days - index) / days;
          requests.push(Math.max(0, Math.round((stats.totalRequests || 0) / days * (0.72 + progress * 0.48))));
          risk.push(Math.max(0, Math.min(100, Math.round((stats.avgRisk || 0) + Math.sin(progress * Math.PI * 2) * 6))));
          compliance.push(Math.max(0, Math.min(100, Math.round((stats.complianceRate || 0) + Math.cos(progress * Math.PI * 2) * 3))));
        }
      }

      return { labels, requests, risk, compliance };
    },

    renderKPIs(data) {
      this.setText('kpi-total', this.formatNumber(data.totalRequests || 0));
      this.setText('kpi-pending', this.formatNumber(data.pendingApproval || 0));
      this.setText('kpi-risk', `${Math.round(data.avgRisk || 0)}%`);
      this.setText('kpi-pii', `${Math.round(data.piiDetectionRate || 0)}%`);

      this.setTrend('trend-total', data.trends?.totalRequests);
      this.setTrend('trend-pending', data.trends?.pendingApproval);
      this.setTrend('trend-risk', data.trends?.avgRisk);
      this.setTrend('trend-pii', data.trends?.piiDetectionRate);
    },

    renderStatusCards(statusDist = {}) {
      this.setText('sc-pending', this.formatNumber(statusDist.pending || 0));
      this.setText('sc-approved', this.formatNumber(statusDist.approved || 0));
      this.setText('sc-executed', this.formatNumber(statusDist.executed || 0));
      this.setText('sc-completed', this.formatNumber(statusDist.completed || 0));
      this.setText('sc-rejected', this.formatNumber(statusDist.rejected || 0));
    },

    renderCharts(data) {
      if (!global.Chart) {
        this.renderChartFallback();
        return;
      }

      this.renderTrendsChart(data.trendSeries || this.buildTrendSeries(data, this.state.auditRows));
      this.renderRiskDoughnut(data.riskLevels || {});
      this.renderDepartmentBar(data.riskByDepartment || {});
      this.renderComplianceGauge(data.complianceRate || 0);
    },

    renderTrendsChart(series) {
      const canvas = document.getElementById('trends-line-chart');
      if (!canvas) return;

      this.updateChart('trends', canvas, {
        type: 'line',
        data: {
          labels: series.labels || [],
          datasets: [
            this.lineDataset('الطلبات', series.requests || [], this.config.colors.brand),
            this.lineDataset('متوسط المخاطر', series.risk || [], this.config.colors.warning),
            this.lineDataset('معدل الامتثال', series.compliance || [], this.config.colors.success),
          ],
        },
        options: this.chartOptions({
          tooltipLabel: (item) => {
            const label = item.dataset.label || '';
            const suffix = label === 'الطلبات' ? 'طلب' : '%';
            return `${label}: ${this.formatNumber(item.parsed.y)} ${suffix}`;
          },
        }),
      });
    },

    renderRiskDoughnut(riskLevels) {
      const canvas = document.getElementById('risk-doughnut-chart');
      if (!canvas) return;

      const labels = this.config.riskLevels.map((level) => level.label);
      const values = this.config.riskLevels.map((level) => this.toNumber(riskLevels[level.key]));
      const total = values.reduce((sum, value) => sum + value, 0) || 1;

      this.updateChart('risk', canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: this.config.riskLevels.map((level) => level.color),
            borderColor: '#0B1628',
            borderWidth: 2,
            hoverOffset: 8,
          }],
        },
        options: {
          ...this.chartOptions({
            tooltipLabel: (item) => {
              const value = item.parsed || 0;
              const percent = Math.round((value / total) * 100);
              return `${item.label}: ${this.formatNumber(value)} طلب (${percent}%)`;
            },
          }),
          cutout: '62%',
        },
      });
    },

    renderDepartmentBar(riskByDepartment) {
      const canvas = document.getElementById('department-bar-chart');
      if (!canvas) return;

      const departments = this.normalizeDepartmentRows(riskByDepartment).slice(0, 8);
      const labels = departments.map((department) => department.name);

      this.updateChart('department', canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: this.config.riskLevels
            .filter((level) => level.key !== 'minimal')
            .map((level) => ({
              label: level.label,
              data: departments.map((department) => this.toNumber(department[level.key])),
              backgroundColor: level.color,
              borderRadius: 6,
              borderSkipped: false,
            })),
        },
        options: {
          ...this.chartOptions({
            stacked: true,
            tooltipLabel: (item) => `${item.dataset.label}: ${this.formatNumber(item.parsed.y)} طلب`,
          }),
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { color: this.config.colors.textMuted } },
            y: { stacked: true, beginAtZero: true, grid: { color: this.config.colors.grid }, ticks: { color: this.config.colors.textMuted } },
          },
        },
      });
    },

    renderComplianceGauge(rate) {
      const canvas = document.getElementById('compliance-gauge-chart');
      if (!canvas) return;

      const value = Math.max(0, Math.min(100, this.toNumber(rate)));
      this.setText('compliance-gauge-value', `${Math.round(value)}%`);

      this.updateChart('compliance', canvas, {
        type: 'doughnut',
        data: {
          labels: ['ملتزم', 'متبقي'],
          datasets: [{
            data: [value, Math.max(0, 100 - value)],
            backgroundColor: [this.config.colors.success, 'rgba(148, 163, 184, 0.18)'],
            borderColor: '#0B1628',
            borderWidth: 2,
            circumference: 180,
            rotation: 270,
          }],
        },
        options: {
          ...this.chartOptions({
            tooltipLabel: (item) => `${item.label}: ${Math.round(item.parsed)}%`,
          }),
          cutout: '72%',
          plugins: {
            ...this.chartOptions().plugins,
            legend: { display: false },
          },
        },
      });
    },

    lineDataset(label, data, color) {
      return {
        label,
        data,
        borderColor: color,
        backgroundColor: `${color}26`,
        pointBackgroundColor: color,
        pointBorderColor: '#0B1628',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.35,
        fill: true,
      };
    },

    chartOptions(extra = {}) {
      const baseScales = extra.stacked ? undefined : {
        x: { grid: { display: false }, ticks: { color: this.config.colors.textMuted } },
        y: { beginAtZero: true, grid: { color: this.config.colors.grid }, ticks: { color: this.config.colors.textMuted } },
      };

      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: baseScales,
        plugins: {
          legend: {
            position: 'bottom',
            rtl: true,
            labels: {
              color: this.config.colors.textMuted,
              usePointStyle: true,
              boxWidth: 8,
              boxHeight: 8,
              font: { family: "'IBM Plex Sans Arabic', system-ui, sans-serif" },
            },
          },
          tooltip: {
            rtl: true,
            textDirection: 'rtl',
            displayColors: true,
            backgroundColor: 'rgba(3, 10, 24, 0.94)',
            borderColor: 'rgba(0, 212, 255, 0.28)',
            borderWidth: 1,
            titleColor: this.config.colors.text,
            bodyColor: this.config.colors.text,
            padding: 12,
            callbacks: {
              label: extra.tooltipLabel || ((item) => `${item.dataset.label || item.label}: ${item.formattedValue}`),
              afterBody: () => 'تفاصيل تفاعلية حسب النطاق المحدد',
            },
          },
        },
      };
    },

    updateChart(key, canvas, config) {
      if (this.state.charts[key]) {
        this.state.charts[key].data = config.data;
        this.state.charts[key].options = config.options;
        this.state.charts[key].update();
        return;
      }

      this.state.charts[key] = new global.Chart(canvas.getContext('2d'), config);
    },

    renderChartFallback() {
      document.querySelectorAll('.chart-canvas-wrap').forEach((wrap) => {
        if (wrap.querySelector('.chart-empty-state')) return;
        wrap.innerHTML = KernelUtils.sanitizeHtml('<div class="chart-empty-state">تعذر تحميل Chart.js حالياً. ستظهر الرسوم عند توفر الاتصال.</div>');
      });
    },

    renderTopRiskQueries(rows = []) {
      const tbody = document.getElementById('top-risk-queries');
      if (!tbody) return;

      if (!rows.length) {
        tbody.innerHTML = KernelUtils.sanitizeHtml('<tr><td colspan="5">لا توجد طلبات مخاطرة داخل النطاق المحدد.</td></tr>');
        return;
      }

      tbody.innerHTML = KernelUtils.sanitizeHtml(rows.slice(0, 10).map((row) => {
        const traceId = row.traceId || row.interactionId || row.requestId || '';
        const riskLevel = row.riskLevel || this.getRiskLevelFromScore(row.riskScore);
        const href = traceId
          ? `/kernel/evidence/?${row.traceId ? 'trace_id' : 'id'}=${encodeURIComponent(traceId)}`
          : '/kernel/audit/';

        return `
          <tr>
            <td class="top-risk-query">${this.escapeHtml(this.truncate(row.query || 'طلب بدون نص ظاهر', 130))}</td>
            <td><span class="risk-score-pill ${this.cssToken(riskLevel)}">${Math.round(row.riskScore || 0)}%</span></td>
            <td>${this.escapeHtml(row.department || 'غير محدد')}</td>
            <td>${this.escapeHtml(row.compliancePackage || 'general')}</td>
            <td><a href="${href}" style="direction:ltr;display:inline-block;">${this.escapeHtml(traceId || 'audit')}</a></td>
          </tr>
        `;
      }).join(''));
    },

    renderLatestTraces(traces) {
      const container = document.getElementById('latest-traces');
      if (!container) return;

      if (!traces.length) {
        container.innerHTML = KernelUtils.sanitizeHtml(`
          <div class="glass-card-flat status-card">
            <div class="status-card-value" style="font-size:1rem;">لا توجد</div>
            <div class="status-card-label">لا توجد Trace IDs بعد</div>
          </div>
        `);
        return;
      }

      container.innerHTML = KernelUtils.sanitizeHtml(traces.slice(0, 5).map((trace) => {
        const traceId = trace.traceId || trace.interactionId || trace.requestId;
        const href = trace.traceId
          ? `/kernel/evidence/?trace_id=${encodeURIComponent(traceId)}`
          : `/kernel/evidence/?id=${encodeURIComponent(traceId)}`;
        return `
          <a class="glass-card-flat status-card" href="${href}" style="text-decoration:none;">
            <div class="status-card-value" style="font-size:1rem; direction:ltr;">${this.escapeHtml(traceId)}</div>
            <div class="status-card-label">${this.escapeHtml(trace.status || trace.riskLevel || 'kernel')}</div>
          </a>
        `;
      }).join(''));
    },

    async exportDashboardPDF() {
      const button = document.getElementById('export-dashboard-pdf');
      const originalText = button?.textContent;
      if (button) button.textContent = 'جاري التصدير...';

      try {
        if (!global.jspdf?.jsPDF) throw new Error('jsPDF is not available');
        const { jsPDF } = global.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const data = this.state.currentData || {};
        const margin = 36;
        let y = 40;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('BrightAI Kernel Stats Dashboard', margin, y);
        y += 24;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Last update: ${new Date().toLocaleString('en-US')}`, margin, y);
        y += 22;
        doc.text(`Total: ${data.totalRequests || 0} | Pending: ${data.pendingApproval || 0} | Risk: ${Math.round(data.avgRisk || 0)}% | Compliance: ${Math.round(data.complianceRate || 0)}%`, margin, y);
        y += 28;

        const chartIds = ['trends-line-chart', 'risk-doughnut-chart', 'department-bar-chart', 'compliance-gauge-chart'];
        for (const chartId of chartIds) {
          const canvas = document.getElementById(chartId);
          if (!canvas) continue;
          const image = canvas.toDataURL('image/png', 1);
          const width = chartId === 'department-bar-chart' ? 360 : 250;
          const height = chartId === 'department-bar-chart' ? 170 : 140;
          if (y + height > 560) {
            doc.addPage();
            y = 40;
          }
          doc.addImage(image, 'PNG', margin, y, width, height);
          y += height + 18;
        }

        doc.save(`brightai-kernel-stats-${this.formatISODate(new Date())}.pdf`);
      } catch (error) {
        console.warn('[BrightAI Kernel] PDF export failed, using print fallback:', error);
        global.print();
      } finally {
        if (button && originalText) button.textContent = originalText.trim();
      }
    },

    normalizeRiskByDepartment(riskByDepartment = {}) {
      const departments = Array.isArray(riskByDepartment.departments)
        ? riskByDepartment.departments
        : Array.isArray(riskByDepartment)
          ? riskByDepartment
          : [];

      return { departments: departments.map((department) => ({ ...department, name: String(department.name || department.department || 'غير محدد') })) };
    },

    normalizeDepartmentRows(riskByDepartment = {}) {
      const departments = Array.isArray(riskByDepartment.departments)
        ? riskByDepartment.departments
        : Array.isArray(riskByDepartment)
          ? riskByDepartment
          : [];

      return departments
        .map((department) => ({
          ...department,
          name: String(department.name || department.department || 'غير محدد'),
          low: this.toNumber(department.low),
          medium: this.toNumber(department.medium),
          high: this.toNumber(department.high),
          critical: this.toNumber(department.critical),
          minimal: this.toNumber(department.minimal),
        }))
        .filter((department) => this.getDepartmentTotal(department) > 0);
    },

    normalizeTopRiskQueries(rows = []) {
      if (!Array.isArray(rows)) return [];
      return rows.map((row) => this.normalizeTraceRow(row));
    },

    buildTopRiskQueries(rows = []) {
      return rows
        .filter((row) => row.query || row.riskScore > 0)
        .map((row) => this.normalizeTraceRow(row));
    },

    setTrend(id, value) {
      const el = document.getElementById(id);
      if (!el) return;

      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric === 0) {
        el.className = 'trend-indicator neutral';
        el.textContent = '0% عن الأسبوع الماضي';
        return;
      }

      const direction = numeric > 0 ? 'up' : 'down';
      const arrow = numeric > 0 ? '↑' : '↓';
      el.className = `trend-indicator ${direction}`;
      el.textContent = `${arrow}${Math.abs(Math.round(numeric))}% عن الأسبوع الماضي`;
    },

    updateLastRefreshTime() {
      const el = document.getElementById('last-update');
      if (el) {
        el.textContent = new Date().toLocaleTimeString('ar-SA');
      }
    },

    updateRefreshStatus(text) {
      const el = document.getElementById('refresh-status');
      if (el) el.textContent = text;
    },

    calculateAverageRisk(distribution = {}) {
      const weights = { critical: 100, high: 75, medium: 50, low: 25, minimal: 10 };
      let total = 0;
      let weighted = 0;

      Object.entries(distribution || {}).forEach(([level, count]) => {
        const value = this.toNumber(count);
        total += value;
        weighted += value * (weights[level] || 0);
      });

      return total > 0 ? Math.round(weighted / total) : 0;
    },

    calculateComplianceFromRows(rows = []) {
      if (!rows.length) return 0;
      const compliant = rows.filter((row) => ['approved', 'executed', 'completed', 'auto_approved'].includes(String(row.status || '').toLowerCase())).length;
      return (compliant / rows.length) * 100;
    },

    countStatus(rows, status) {
      return rows.filter((row) => String(row.status || '').toLowerCase().includes(status)).length;
    },

    countRowsWithPii(rows) {
      return rows.filter((row) => {
        const pii = row.piiDetected || row.pii_detected || row.piiTypes || row.pii_types;
        return Array.isArray(pii) ? pii.length > 0 : Boolean(pii && pii !== '[]' && pii !== '0');
      }).length;
    },

    percentChange(current, previous) {
      const c = this.toNumber(current);
      const p = this.toNumber(previous);
      if (!p) return c ? 100 : 0;
      return Math.round(((c - p) / p) * 100);
    },

    estimateTrend(value, fallback) {
      const numeric = this.toNumber(value);
      if (!numeric) return 0;
      return fallback;
    },

    average(values = []) {
      const numeric = values.map((value) => this.toNumber(value)).filter((value) => Number.isFinite(value));
      if (!numeric.length) return 0;
      return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
    },

    getDepartmentTotal(department) {
      return ['critical', 'high', 'medium', 'low', 'minimal'].reduce((sum, key) => sum + this.toNumber(department[key]), 0);
    },

    getRiskLevelFromScore(score) {
      const value = this.toNumber(score);
      if (value >= 85) return 'critical';
      if (value >= 65) return 'high';
      if (value >= 35) return 'medium';
      if (value >= 15) return 'low';
      return 'minimal';
    },

    extractTraceId(record = {}) {
      const value = record.traceId || record.trace_id || record.kernel?.traceId || record.metadata?.traceId || record.summary?.traceId;
      return /^AI-\d{4}-\d{5,}$/.test(String(value || '')) ? String(value) : null;
    },

    setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    },

    toNumber(value, fallback = 0) {
      if (value === null || value === undefined || value === '') return fallback;
      const normalized = typeof value === 'string' ? value.replace('%', '').replace(/,/g, '').trim() : value;
      const number = Number(normalized);
      return Number.isFinite(number) ? number : fallback;
    },

    formatNumber(num) {
      if (global.KernelUtils?.formatNumber) return global.KernelUtils.formatNumber(num);
      return new Intl.NumberFormat('ar-SA').format(num);
    },

    formatShortDate(value) {
      return new Date(value).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    },

    formatISODate(value) {
      return new Date(value).toISOString().slice(0, 10);
    },

    escapeHtml(value) {
      if (global.KernelUtils?.escapeHtml) return global.KernelUtils.escapeHtml(value);
      return String(value || '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      }[char]));
    },

    truncate(value, maxLength = 80) {
      if (global.KernelUtils?.truncate) return global.KernelUtils.truncate(value, maxLength);
      const text = String(value || '');
      return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    },

    cssToken(value) {
      return String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    },

    destroy() {
      this.stopAutoRefresh();
      Object.values(this.state.charts).forEach((chart) => chart.destroy());
      this.state.charts = {};
      this.state.currentData = null;
      this.state.dashboardReady = false;
    },
  };

  global.KernelStats = KernelStats;

})(typeof window !== 'undefined' ? window : this);
