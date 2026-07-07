/**
 * BrightAI Kernel - Reports Module
 * Handles report generation, filtering, scheduling and export
 */

(function (global) {
  'use strict';

  const KernelReports = {
    // Configuration
    config: {
      reportTypes: [
        { id: 'governance', label: 'تقرير حوكمة', icon: 'file-text', color: '#3B82F6' },
        { id: 'compliance', label: 'تقرير امتثال', icon: 'shield-check', color: '#10B981' },
        { id: 'audit', label: 'تقرير تدقيق', icon: 'clipboard-check', color: '#8B5CF6' },
        { id: 'risk', label: 'تقرير مخاطر', icon: 'alert-triangle', color: '#F97316' },
        { id: 'performance', label: 'تقرير أداء', icon: 'bar-chart', color: '#00D4FF' },
      ],
      periods: [
        { id: 'last7', label: 'آخر 7 أيام' },
        { id: 'last30', label: 'آخر 30 يوم' },
        { id: 'lastQuarter', label: 'الربع الأخير' },
        { id: 'lastYear', label: 'السنة الأخيرة' },
        { id: 'custom', label: 'فترة مخصصة' },
      ],
      formats: [
        { id: 'pdf', label: 'PDF', mime: 'application/pdf' },
        { id: 'excel', label: 'Excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { id: 'csv', label: 'CSV', mime: 'text/csv' },
        { id: 'json', label: 'JSON', mime: 'application/json' },
      ],
      frequencies: [
        { id: 'daily', label: 'يومي' },
        { id: 'weekly', label: 'أسبوعي' },
        { id: 'monthly', label: 'شهري' },
        { id: 'quarterly', label: 'ربع سنوي' },
      ],
    },

    // State
    state: {
      reports: [],
      scheduledReports: [],
      filters: {
        type: 'all',
        period: 'all',
        search: '',
      },
      isGenerating: false,
    },

    /**
     * Initialize reports module
     */
    init() {
      this.loadReports();
      this.bindEvents();
    },

    /**
     * Load reports from API
     */
    async loadReports() {
      try {
        const response = await fetch('/api/kernel/reports');
        if (!response.ok) {
          throw new Error(`Reports API returned ${response.status}`);
        }
        if (response.ok) {
          const data = await response.json();
          this.state.reports = data.reports || [];
          this.state.scheduledReports = data.scheduled || [];
        }
      } catch (error) {
        if (typeof global.kernelShouldUseDemoData === 'function' && global.kernelShouldUseDemoData()) {
          this.state.reports = this.generateDemoReports();
          this.state.scheduledReports = this.generateDemoScheduled();
        } else {
          console.warn('[BrightAI Kernel] Reports production API failed:', error);
          this.state.reports = [];
          this.state.scheduledReports = [];
        }
      }
      
      this.renderReports();
      this.renderScheduledReports();
    },

    /**
     * Generate demo reports
     * @returns {Array} Demo reports
     */
    generateDemoReports() {
      return [
        {
          id: 'rpt_001',
          type: 'governance',
          title: 'تقرير الحوكمة الشهري',
          description: 'ملخص شامل لنشاط الحوكمة خلال الشهر الماضي، يتضمن إحصائيات الموافقات والرفض.',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          period: 'monthly',
          status: 'ready',
        },
        {
          id: 'rpt_002',
          type: 'compliance',
          title: 'تقرير الامتثال - PDPL',
          description: 'تحليل مفصل لمستوى الامتثال مع نظام حماية البيانات الشخصية السعودي.',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          period: 'monthly',
          status: 'ready',
        },
        {
          id: 'rpt_003',
          type: 'audit',
          title: 'تقرير التدقيق الأسبوعي',
          description: 'سجل مفصل لجميع عمليات التدقيق والمراجعة خلال الأسبوع الماضي.',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          period: 'weekly',
          status: 'ready',
        },
        {
          id: 'rpt_004',
          type: 'risk',
          title: 'تقرير تقييم المخاطر',
          description: 'تحليل شامل للمخاطر المحتملة وتوصيات التخفيف والمعالجة.',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          period: 'quarterly',
          status: 'ready',
        },
        {
          id: 'rpt_005',
          type: 'performance',
          title: 'تقرير أداء النماذج',
          description: 'إحصائيات استخدام نماذج الذكاء الاصطناعي ومؤشرات الأداء الرئيسية.',
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          period: 'weekly',
          status: 'ready',
        },
        {
          id: 'rpt_006',
          type: 'compliance',
          title: 'تقرير الامتثال - GDPR',
          description: 'تحليل مستوى الامتثال مع اللائحة العامة لحماية البيانات الأوروبية.',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          period: 'monthly',
          status: 'ready',
        },
      ];
    },

    /**
     * Generate demo scheduled reports
     * @returns {Array} Demo scheduled reports
     */
    generateDemoScheduled() {
      return [
        {
          id: 'sch_001',
          name: 'تقرير الحوكمة الشهري',
          frequency: 'monthly',
          nextRun: '1 يوليو 2024',
          recipients: 3,
          status: 'active',
        },
        {
          id: 'sch_002',
          name: 'تقرير التدقيق الأسبوعي',
          frequency: 'weekly',
          nextRun: 'الأحد القادم',
          recipients: 5,
          status: 'active',
        },
        {
          id: 'sch_003',
          name: 'تقرير المخاطر الربع سنوي',
          frequency: 'quarterly',
          nextRun: '1 سبتمبر 2024',
          recipients: 2,
          status: 'paused',
        },
      ];
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
      // Type filter
      const typeFilter = document.getElementById('typeFilter');
      if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
          this.state.filters.type = e.target.value;
          this.renderReports();
        });
      }

      // Period filter
      const periodFilter = document.getElementById('periodFilter');
      if (periodFilter) {
        periodFilter.addEventListener('change', (e) => {
          this.state.filters.period = e.target.value;
          this.renderReports();
        });
      }

      // Search
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', KernelUtils?.debounce?.((e) => {
          this.state.filters.search = e.target.value.toLowerCase();
          this.renderReports();
        }, 300) || ((e) => {
          this.state.filters.search = e.target.value.toLowerCase();
          this.renderReports();
        }));
      }

      if (!this.state.delegatedEventsBound) {
        document.addEventListener('click', (event) => {
          const button = event.target.closest('[data-report-action]');
          if (!button) return;

          const reportId = button.dataset.reportId || '';
          const action = button.dataset.reportAction;
          if (action === 'preview') this.previewReport(reportId);
          if (action === 'download') this.downloadReport(reportId);
          if (action === 'edit-schedule') this.editScheduledReport(reportId);
        });
        this.state.delegatedEventsBound = true;
      }
    },

    /**
     * Render reports grid
     */
    renderReports() {
      const grid = document.getElementById('reportsGrid');
      if (!grid) return;

      const filtered = this.filterReports(this.state.reports);
      
      if (filtered.length === 0) {
        if (global.KernelEmptyStates) {
          KernelEmptyStates.render(grid);
        } else {
          grid.innerHTML = '';
        }
        return;
      }

      if (global.KernelEmptyStates) KernelEmptyStates.clear(grid);

      grid.innerHTML = KernelUtils.sanitizeHtml(filtered.map(report => this.renderReportCard(report)).join(''));
    },

    /**
     * Render scheduled reports table
     */
    renderScheduledReports() {
      const tbody = document.getElementById('scheduledReportsBody');
      if (!tbody) return;

      tbody.setAttribute('aria-busy', 'false');

      if (!this.state.scheduledReports.length) {
        tbody.innerHTML = KernelUtils.sanitizeHtml(`
          <tr>
            <td colspan="6">
              <div class="empty-state empty-state-inline">لا توجد تقارير مجدولة حالياً.</div>
            </td>
          </tr>
        `);
        return;
      }

      const frequencyLabels = this.config.frequencies.reduce((labels, item) => {
        labels[item.id] = item.label;
        return labels;
      }, {});
      const statusLabels = {
        active: 'نشط',
        paused: 'متوقف',
      };

      tbody.innerHTML = KernelUtils.sanitizeHtml(this.state.scheduledReports.map((report) => {
        const status = report.status || 'active';
        const recipients = Number(report.recipients || 0);
        return `
          <tr>
            <td>${this.escapeHtml(report.name || 'تقرير مجدول')}</td>
            <td>${this.escapeHtml(frequencyLabels[report.frequency] || report.frequency || '—')}</td>
            <td>${this.escapeHtml(report.nextRun || '—')}</td>
            <td>${recipients} ${recipients === 1 ? 'مستلم' : 'مستلمين'}</td>
            <td><span class="schedule-status ${this.escapeHtml(status)}">${this.escapeHtml(statusLabels[status] || status)}</span></td>
            <td><button class="report-btn secondary" type="button" data-report-action="edit-schedule" data-report-id="${this.escapeHtml(report.id || '')}">تعديل</button></td>
          </tr>
        `;
      }).join(''));
    },

    /**
     * Filter reports based on current filters
     * @param {Array} reports - Reports to filter
     * @returns {Array} Filtered reports
     */
    filterReports(reports) {
      return reports.filter(report => {
        // Type filter
        if (this.state.filters.type !== 'all' && report.type !== this.state.filters.type) {
          return false;
        }

        // Period filter
        if (this.state.filters.period !== 'all' && report.period !== this.state.filters.period) {
          return false;
        }

        // Search filter
        if (this.state.filters.search) {
          const searchText = `${report.title} ${report.description}`.toLowerCase();
          if (!searchText.includes(this.state.filters.search)) {
            return false;
          }
        }

        return true;
      });
    },

    /**
     * Render single report card
     * @param {Object} report - Report data
     * @returns {string} HTML string
     */
    renderReportCard(report) {
      const typeConfig = this.config.reportTypes.find(t => t.id === report.type) || {};
      const colorClass = this.getColorClass(report.type);
      const relativeTime = KernelUtils?.formatRelativeTime?.(report.createdAt) || 'منذ وقت';
      const reportId = this.escapeHtml(report.id || '');
      const reportType = this.escapeHtml(report.type || '');

      return `
        <div class="report-card" data-type="${reportType}" data-id="${reportId}">
          <div class="report-icon ${colorClass}">
            ${this.getReportIcon(report.type)}
          </div>
          <h3 class="report-title">${this.escapeHtml(report.title)}</h3>
          <p class="report-desc">${this.escapeHtml(report.description)}</p>
          <div class="report-meta">
            <span class="report-date">آخر تحديث: ${relativeTime}</span>
            <div class="report-actions">
              <button class="report-btn secondary" type="button" data-report-action="preview" data-report-id="${reportId}">معاينة</button>
              <button class="report-btn primary" type="button" data-report-action="download" data-report-id="${reportId}">تحميل</button>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Get color class for report type
     * @param {string} type - Report type
     * @returns {string} Color class
     */
    getColorClass(type) {
      const classes = {
        governance: 'blue',
        compliance: 'green',
        audit: 'purple',
        risk: 'orange',
        performance: 'cyan',
      };
      return classes[type] || 'blue';
    },

    /**
     * Get icon SVG for report type
     * @param {string} type - Report type
     * @returns {string} SVG HTML
     */
    getReportIcon(type) {
      const icons = {
        governance: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        compliance: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        audit: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>',
        risk: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        performance: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
      };
      return icons[type] || icons.governance;
    },

    /**
     * Generate a new report
     * @param {Object} options - Report options
     */
    async generateReport(options) {
      if (this.state.isGenerating) return;
      this.state.isGenerating = true;

      try {
        // Show loading state
        this.showToast('جاري إنشاء التقرير...', 'info');

        const response = await fetch('/api/kernel/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
        });

        if (response.ok) {
          const data = await response.json();
          this.showToast('تم إنشاء التقرير بنجاح', 'success');
          this.loadReports();
          return data;
        } else {
          throw new Error('Failed to generate report');
        }
      } catch (error) {
        this.showToast('فشل في إنشاء التقرير', 'error');
      } finally {
        this.state.isGenerating = false;
      }
    },

    /**
     * Preview a report
     * @param {string} reportId - Report ID
     */
    previewReport(reportId) {
      const report = this.state.reports.find(r => r.id === reportId);
      if (!report) return;

      // Show preview modal
      this.showToast(`معاينة: ${report.title}`, 'info');
    },

    /**
     * Download a report
     * @param {string} reportId - Report ID
     * @param {string} format - Export format
     */
    async downloadReport(reportId, format = 'pdf') {
      const report = this.state.reports.find(r => r.id === reportId);
      if (!report) return;

      try {
        this.showToast('جاري تحميل التقرير...', 'info');

        // In production, this would fetch the actual file
        const response = await fetch(`/api/kernel/reports/${reportId}/download?format=${format}`);
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${report.title}.${format}`;
          a.click();
          URL.revokeObjectURL(url);
          this.showToast('تم تحميل التقرير بنجاح', 'success');
        } else {
          throw new Error('Failed to download report');
        }
      } catch (error) {
        if (typeof global.kernelShouldUseDemoData === 'function' && global.kernelShouldUseDemoData()) {
          this.showToast('تم تحميل التقرير (وضع تجريبي)', 'success');
        } else {
          this.showToast('فشل في تحميل التقرير', 'error');
        }
      }
    },

    /**
     * Schedule a report
     * @param {Object} schedule - Schedule configuration
     */
    async scheduleReport(schedule) {
      try {
        const response = await fetch('/api/kernel/reports/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedule),
        });

        if (response.ok) {
          this.showToast('تم جدولة التقرير بنجاح', 'success');
          this.loadReports();
        }
      } catch (error) {
        this.showToast('فشل في جدولة التقرير', 'error');
      }
    },

    /**
     * Toggle a scheduled report status from the table.
     * @param {string} scheduleId - Scheduled report ID
     */
    editScheduledReport(scheduleId) {
      const report = this.state.scheduledReports.find((item) => item.id === scheduleId);
      if (!report) {
        this.showToast('لم يتم العثور على الجدولة', 'error');
        return;
      }

      const nextStatus = report.status === 'paused' ? 'active' : 'paused';
      report.status = nextStatus;
      this.renderScheduledReports();
      this.showToast(nextStatus === 'active' ? 'تم تفعيل الجدولة' : 'تم إيقاف الجدولة مؤقتاً', 'success');
    },

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      
      container.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
      if (!str) return '';
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return String(str).replace(/[&<>"']/g, m => map[m]);
    },
  };

  // Export to global scope
  global.KernelReports = KernelReports;

})(typeof window !== 'undefined' ? window : this);
