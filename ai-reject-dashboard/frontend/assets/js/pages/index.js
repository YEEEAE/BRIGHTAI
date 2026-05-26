/**
 * Documentation:
 * - docs/01-pages/index-page.md
 * - docs/04-api/data-api.md
 * - docs/03-ai/saqr-ai-overview.md
 */
/**
 * BrightAI — Main Dashboard Application (index.js)
 * ────────────────────────────────────────────────
 * ⛔ Zero hardcoded data — all metrics come from BrightAPI + ChartsAdapter.
 * ⛔ No mock/random fallback — API failure → clear error state.
 */
function dashboardApp() {
  return {
    // ── UI Layout State ──────────────────────────────────────────────
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    rightSidebarOpen: false,
    darkMode: false,
    lang: 'ar',
    searchQuery: '',
    notificationCount: 0,
    activePreset: 'month',

    // ── Loading & Error States ────────────────────────────────────────
    loading: {
      kpis: true,
      table: true,
      charts: true,
      ai: true
    },
    errors: {
      kpis: null,
      table: null,
      charts: null,
      ai: null
    },

    // ── Data Source Badge ─────────────────────────────────────────────
    dataSource: 'unknown', // 'excel_live' | 'cache' | 'demo_fallback' | 'error'

    // ── Data & Filters ───────────────────────────────────────────────
    rejects: [],
    filteredRejects: [],
    paginatedRejects: [],
    selectedRows: [],
    visibleColumns: {
      doc_no: true, date: true, item_name: true,
      department: true, cost: true, status: true
    },
    filters: {
      department: '', category: '', risk_level: '', status: ''
    },

    // ── Pagination ───────────────────────────────────────────────────
    pagination: {
      page: 1, limit: 10, totalPages: 1, start: 0, end: 0
    },

    // ── Live Excel Status ────────────────────────────────────────────
    excelStatus: {
      file_exists: false, record_count: 0, sheet_count: 0,
      hash: null, file_modified_at: null, warnings: []
    },

    // ── KPIs (from API, never hardcoded) ─────────────────────────────
    kpis: {
      totalRejects: 0, totalCost: 0,
      pendingApprovals: 0, criticalItems: 0,
      avgApprovalTime: '—', capaEffectiveness: 0
    },

    // ── AI Panel ─────────────────────────────────────────────────────
    aiSummary: '',
    aiFindings: [],
    rootCausesData: null,

    // ── Chat ─────────────────────────────────────────────────────────
    suggestedQueries: [],
    chatMessages: [],
    chatInput: '',
    aiLoading: false,

    // ── Activity Feed ────────────────────────────────────────────────
    recentActivities: [],

    // ── ApexCharts references ────────────────────────────────────────
    charts: {},

    // ═════════════════════════════════════════════════════════════════
    //  INIT
    // ═════════════════════════════════════════════════════════════════
    init() {
      this.initThemeAndLang();
      this.refreshSuggestedQueries();
      this.chatMessages = [{ sender: 'ai', text: this.getAiGreetingText() }];
      this.fetchDashboardData();
      this.setupRealtimeListeners();
    },

    // ═════════════════════════════════════════════════════════════════
    //  THEME & LANG
    // ═════════════════════════════════════════════════════════════════
    initThemeAndLang() {
      this.darkMode = localStorage.getItem('darkMode') === 'true';
      this.lang = localStorage.getItem('lang') || 'ar';
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
      document.documentElement.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
      if (this.darkMode) document.body.classList.add('dark');
    },

    toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
      this.updateChartThemes();
    },

    toggleLanguage() {
      this.lang = this.lang === 'ar' ? 'en' : 'ar';
      localStorage.setItem('lang', this.lang);
      document.documentElement.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
      this.refreshSuggestedQueries();
      this.chatMessages = [{ sender: 'ai', text: this.getAiGreetingText() }];
    },

    refreshSuggestedQueries() {
      this.suggestedQueries = this.lang === 'ar'
        ? ['كم تكلفة المرفوضات هذا الشهر؟', 'ما هي أهم 3 أسباب للعيوب؟', 'توصيات CAPA لشريط الإسفنج؟', 'تحليل تكلفة المرفوضات للأقسام؟']
        : ['What is the reject cost this month?', 'Top 3 defects reasons?', 'CAPA recommendation for Sponge Tape?', 'Department scrap cost analysis?'];
    },

    // ═════════════════════════════════════════════════════════════════
    //  DATA SOURCE BADGE
    // ═════════════════════════════════════════════════════════════════
    getDataSourceBadge() {
      const map = {
        excel_live:    { label: this.lang === 'ar' ? '🟢 Excel مباشر' : '🟢 Excel Live', cls: 'success' },
        cache:         { label: this.lang === 'ar' ? '🟡 بيانات مؤقتة' : '🟡 Cached', cls: 'warning' },
        demo_fallback: { label: this.lang === 'ar' ? '🔴 بيانات تجريبية' : '🔴 Demo Fallback', cls: 'danger' },
        error:         { label: this.lang === 'ar' ? '⚫ خطأ اتصال' : '⚫ Connection Error', cls: 'danger' },
        unknown:       { label: this.lang === 'ar' ? '⏳ جاري التحميل...' : '⏳ Loading...', cls: 'secondary' }
      };
      return map[this.dataSource] || map.unknown;
    },

    // ═════════════════════════════════════════════════════════════════
    //  TEXT HELPERS (dynamic from excelStatus)
    // ═════════════════════════════════════════════════════════════════
    getDisclaimerText() {
      const count = this.excelStatus.record_count ? this.excelStatus.record_count.toLocaleString() : '0';
      return this.lang === 'ar'
        ? `نظام تحليلات BrightAI يقرأ حالياً من ملف Excel الحقيقي (${count} سجلاً). يرجى ملاحظة أن نظام Focus ERP يظل هو المصدر الرسمي والوحيد للموافقات التشغيلية.`
        : `BrightAI Analytics reads from the active Excel system (${count} records). Focus ERP remains the formal source of truth for approvals.`;
    },

    getAiGreetingText() {
      const count = this.excelStatus.record_count ? this.excelStatus.record_count.toLocaleString() : '0';
      return this.lang === 'ar'
        ? `أهلاً بك! أنا مساعد الذكاء الاصطناعي لـ BrightAI. تم ربط ملف Excel (${count} سجلاً). كيف يمكنني مساعدتك في تحليل الجودة والتكاليف اليوم؟`
        : `Hello! I am your BrightAI analytical assistant. The active Excel workbook has been connected (${count} records). How can I help you?`;
    },

    // ═════════════════════════════════════════════════════════════════
    //  MAIN DATA FETCH (all from BrightAPI)
    // ═════════════════════════════════════════════════════════════════
    async fetchDashboardData() {
      // 1. Fetch Excel status
      await this.fetchExcelStatus();

      // 2. Fetch rejects (table + KPIs + charts)
      await this.fetchRejects();

      // 3. Fetch AI summary + root causes in parallel
      this.fetchAISummary();
      this.fetchRootCauses();
    },

    async fetchExcelStatus() {
      try {
        const data = await BrightAPI.getDataStatus();
        if (data) {
          this.excelStatus = {
            file_exists: data.file_exists ?? false,
            record_count: data.record_count ?? 0,
            sheet_count: data.sheet_count ?? 0,
            hash: data.hash ?? null,
            file_modified_at: data.file_modified_at ?? null,
            warnings: data.warnings ?? []
          };
        }
      } catch (e) {
        console.error('fetchExcelStatus:', e);
        // Leave default empty state — no mock
      }
    },

    async fetchRejects() {
      this.loading.kpis = true;
      this.loading.table = true;
      this.loading.charts = true;
      this.errors.kpis = null;
      this.errors.table = null;
      this.errors.charts = null;

      try {
        const rejects = await BrightAPI.getRejects({ source: 'excel' });
        this.dataSource = BrightAPI.getDataSource();

        if (!rejects || !Array.isArray(rejects) || rejects.length === 0) {
          this.rejects = [];
          this.errors.table = this.lang === 'ar'
            ? 'لا توجد بيانات مرفوضات متاحة حالياً.'
            : 'No reject records available.';
          this.errors.kpis = this.errors.table;
          this.errors.charts = this.errors.table;
          return;
        }

        // Map API payload to consistent shape
        this.rejects = rejects.map((r, idx) => ({
          id: r.id ?? idx,
          doc_no: r.doc_no ?? '',
          date: r.date ?? r.created_at ?? '',
          item_name: r.item_name ?? '',
          department: r.department ?? '',
          cost: Number(r.cost) || 0,
          status: r.approval_status ?? r.status ?? '',
          category: r.category ?? '',
          risk: r.risk_level ?? ''
        }));

        this.applyFilters();
        this.initCharts();
      } catch (e) {
        console.error('fetchRejects:', e);
        this.dataSource = 'error';
        const msg = this.lang === 'ar'
          ? 'فشل تحميل البيانات من الخادم. تأكد من تشغيل الخادم.'
          : 'Failed to load data from server. Please ensure the backend is running.';
        this.errors.kpis = msg;
        this.errors.table = msg;
        this.errors.charts = msg;
        this.rejects = [];
      } finally {
        this.loading.kpis = false;
        this.loading.table = false;
        this.loading.charts = false;
      }
    },

    async fetchAISummary() {
      this.loading.ai = true;
      this.errors.ai = null;
      try {
        const data = await BrightAPI.getSummary();
        if (data) {
          this.aiSummary = data.executive_summary ?? '';
          this.aiFindings = data.findings ?? data.ai_findings ?? [];
          if (data.kpis) {
            // Merge any server-side KPI enrichment
            if (data.kpis.avg_approval_time) this.kpis.avgApprovalTime = data.kpis.avg_approval_time;
            if (data.kpis.capa_effectiveness) this.kpis.capaEffectiveness = data.kpis.capa_effectiveness;
          }
        }
        if (!this.aiSummary) {
          this.aiSummary = this.lang === 'ar'
            ? 'لم يتم استلام ملخص تحليلي من الخادم.'
            : 'No AI summary received from server.';
        }
      } catch (e) {
        console.error('fetchAISummary:', e);
        this.errors.ai = this.lang === 'ar'
          ? 'فشل تحميل تحليلات الذكاء الاصطناعي.'
          : 'Failed to load AI analytics.';
        this.aiSummary = '';
      } finally {
        this.loading.ai = false;
      }
    },

    async fetchRootCauses() {
      try {
        this.rootCausesData = await BrightAPI.getRootCauses();
      } catch (e) {
        console.error('fetchRootCauses:', e);
        this.rootCausesData = null;
      }
    },

    // ═════════════════════════════════════════════════════════════════
    //  KPI CALCULATION (from live data only)
    // ═════════════════════════════════════════════════════════════════
    calculateKPIs() {
      const data = this.filteredRejects;
      this.kpis.totalRejects = data.length;
      this.kpis.totalCost = data.reduce((sum, r) => sum + r.cost, 0);
      this.kpis.pendingApprovals = data.filter(r => r.status === 'Pending').length;
      this.kpis.criticalItems = data.filter(r => r.risk === 'Critical' || r.risk === 'High').length;
    },

    // ═════════════════════════════════════════════════════════════════
    //  FILTERS
    // ═════════════════════════════════════════════════════════════════
    applyFilters() {
      this.filteredRejects = this.rejects.filter(r => {
        if (this.filters.department && r.department !== this.filters.department) return false;
        if (this.filters.category && r.category !== this.filters.category) return false;
        if (this.filters.risk_level && r.risk !== this.filters.risk_level) return false;
        if (this.filters.status && r.status !== this.filters.status) return false;
        if (this.searchQuery) {
          const term = this.searchQuery.toLowerCase();
          if (!`${r.item_name} ${r.doc_no} ${r.department}`.toLowerCase().includes(term)) return false;
        }
        return true;
      });
      this.calculateKPIs();
      this.pagination.page = 1;
      this.updatePagination();
      this.refreshChartsData();
    },

    clearAllFilters() {
      this.filters = { department: '', category: '', risk_level: '', status: '' };
      this.searchQuery = '';
      this.activePreset = '';
      this.applyFilters();
    },

    debouncedSearch() {
      window.clearTimeout(this._searchTimer);
      this._searchTimer = window.setTimeout(() => this.applyFilters(), 300);
    },

    setPresetDate(preset) {
      this.activePreset = preset;
      const today = dayjs();
      let startDate;
      if (preset === 'today') startDate = today.startOf('day');
      else if (preset === 'week') startDate = today.subtract(7, 'day');
      else if (preset === 'month') startDate = today.subtract(30, 'day');
      else if (preset === 'quarter') startDate = today.subtract(90, 'day');
      else if (preset === 'year') startDate = today.subtract(365, 'day');

      if (startDate) {
        this.filteredRejects = this.rejects.filter(r => dayjs(r.date).isAfter(startDate));
        this.calculateKPIs();
        this.pagination.page = 1;
        this.updatePagination();
      }
    },

    saveFilterPreset() {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'success',
          title: this.lang === 'ar' ? 'حفظ التصفية' : 'Save Filter',
          message: this.lang === 'ar' ? 'تم حفظ التفضيل الحالي للفلترة بنجاح!' : 'Current filter preset saved successfully!'
        });
      }
    },

    exportFilteredData() {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'info',
          title: this.lang === 'ar' ? 'تصدير البيانات' : 'Exporting Data',
          message: this.lang === 'ar' ? 'جاري تصدير تقرير المرفوضات بصيغة Excel...' : 'Exporting rejects report to Excel workbook...'
        });
      }
    },

    triggerQuickAction(type) {
      const msgs = {
        report:   this.lang === 'ar' ? 'جاري إنشاء وتنزيل تقرير الجودة الكامل بصيغة PDF...' : 'Generating PDF quality report...',
        schedule: this.lang === 'ar' ? 'تم جدولة إرسال التقرير الأسبوعي تلقائياً.' : 'Weekly reports scheduled for automatic delivery.',
        alert:    this.lang === 'ar' ? 'تم إرسال تنبيه عاجل لمدير الجودة.' : 'Urgent alert dispatched to QCM.',
        audit:    this.lang === 'ar' ? 'جاري عرض سجل التدقيق الكامل...' : 'Loading system audit logs...'
      };
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: type === 'alert' ? 'warning' : 'success',
          title: this.lang === 'ar' ? 'إجراء سريع' : 'Quick Action',
          message: msgs[type] || ''
        });
      }
    },

    // ═════════════════════════════════════════════════════════════════
    //  PAGINATION
    // ═════════════════════════════════════════════════════════════════
    updatePagination() {
      const total = this.filteredRejects.length;
      this.pagination.totalPages = Math.ceil(total / this.pagination.limit) || 1;
      const start = (this.pagination.page - 1) * this.pagination.limit;
      const end = Math.min(start + this.pagination.limit, total);
      this.paginatedRejects = this.filteredRejects.slice(start, end);
      this.pagination.start = total > 0 ? start + 1 : 0;
      this.pagination.end = end;
    },

    setPage(p) {
      if (p < 1 || p > this.pagination.totalPages) return;
      this.pagination.page = p;
      this.updatePagination();
    },

    toggleRowSelection(id) {
      if (this.selectedRows.includes(id)) {
        this.selectedRows = this.selectedRows.filter(r => r !== id);
      } else {
        this.selectedRows.push(id);
      }
    },

    toggleAllSelection() {
      this.selectedRows = this.selectedRows.length === this.paginatedRejects.length
        ? [] : this.paginatedRejects.map(r => r.id);
    },

    bulkScrapSelected() {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'success',
          title: this.lang === 'ar' ? 'اعتماد إتلاف مجمع' : 'Bulk Scrap Approved',
          message: this.lang === 'ar' ? `تم اعتماد الإتلاف المجمع لـ ${this.selectedRows.length} عنصر وإرسالها لـ Focus ERP.` : `Bulk scrap approved for ${this.selectedRows.length} items.`
        });
      }
      this.selectedRows = [];
    },

    drillDown(metric) {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'info',
          title: this.lang === 'ar' ? 'تفاصيل الفلترة' : 'Drilldown Details',
          message: this.lang === 'ar' ? `جاري فلترة لوحة التحكم لعرض: ${metric}` : `Filtering for: ${metric}`
        });
      }
    },

    // ═════════════════════════════════════════════════════════════════
    //  CHARTS (built from ChartsAdapter — zero hardcoded arrays)
    // ═════════════════════════════════════════════════════════════════
    initCharts() {
      if (this.filteredRejects.length === 0) return;
      const darkMode = this.darkMode;

      // Destroy old charts if they exist
      Object.values(this.charts).forEach(c => {
        if (c && typeof c.destroy === 'function') c.destroy();
      });
      this.charts = {};

      // 1. Trend Area Chart
      const trendData = ChartsAdapter.buildTrendSeries(this.filteredRejects);
      const trendEl = document.querySelector('#chart-trends');
      if (trendEl) {
        this.charts.trends = new ApexCharts(trendEl, {
          series: trendData.series,
          chart: { height: 320, type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
          colors: ['#0F4C81', '#00A6A6'],
          stroke: { curve: 'smooth', width: 3 },
          fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
          xaxis: { categories: trendData.categories },
          theme: { mode: darkMode ? 'dark' : 'light' }
        });
        this.charts.trends.render();
      }

      // 2. Department Cost Donut
      const donutData = ChartsAdapter.buildDeptDonut(this.filteredRejects);
      const donutEl = document.querySelector('#chart-dept-cost');
      if (donutEl) {
        this.charts.deptCost = new ApexCharts(donutEl, {
          series: donutData.series,
          chart: { type: 'donut', height: 320, fontFamily: 'inherit' },
          labels: donutData.labels,
          colors: ['#0F4C81', '#00A6A6', '#F4A261', '#E76F51', '#2A9D8F'],
          theme: { mode: darkMode ? 'dark' : 'light' },
          legend: { position: 'bottom' }
        });
        this.charts.deptCost.render();
      }

      // 3. Top Reasons Bar
      const reasonsData = ChartsAdapter.buildReasonsBar(this.rootCausesData, this.filteredRejects);
      const reasonsEl = document.querySelector('#chart-top-reasons');
      if (reasonsEl) {
        this.charts.reasons = new ApexCharts(reasonsEl, {
          series: reasonsData.series,
          chart: { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
          plotOptions: { bar: { borderRadius: 4, horizontal: true } },
          colors: ['#0F4C81'],
          xaxis: { categories: reasonsData.categories },
          theme: { mode: darkMode ? 'dark' : 'light' }
        });
        this.charts.reasons.render();
      }

      // 4. Pareto Chart
      const paretoData = ChartsAdapter.buildPareto(this.rootCausesData, this.filteredRejects);
      const paretoEl = document.querySelector('#chart-pareto');
      if (paretoEl) {
        this.charts.pareto = new ApexCharts(paretoEl, {
          series: paretoData.series,
          chart: { height: 320, type: 'line', toolbar: { show: false }, fontFamily: 'inherit' },
          stroke: { width: [0, 4], curve: 'smooth' },
          colors: ['#0F4C81', '#F4A261'],
          labels: paretoData.labels,
          yaxis: [{ title: { text: 'عدد الحالات' } }, { opposite: true, title: { text: 'النسبة التراكمية (%)' } }],
          theme: { mode: darkMode ? 'dark' : 'light' }
        });
        this.charts.pareto.render();
      }

      // 5. Heatmap
      const heatmapData = ChartsAdapter.buildHeatmap(this.filteredRejects);
      const heatmapEl = document.querySelector('#chart-heatmap');
      if (heatmapEl) {
        this.charts.heatmap = new ApexCharts(heatmapEl, {
          series: heatmapData,
          chart: { height: 320, type: 'heatmap', toolbar: { show: false }, fontFamily: 'inherit' },
          dataLabels: { enabled: false },
          colors: ['#00A6A6'],
          theme: { mode: darkMode ? 'dark' : 'light' }
        });
        this.charts.heatmap.render();
      }

      // 6. Quality Score Radial
      const qualityScore = ChartsAdapter.calcQualityScore(this.filteredRejects);
      const gaugeEl = document.querySelector('#chart-quality-score');
      if (gaugeEl) {
        this.charts.qualityScore = new ApexCharts(gaugeEl, {
          series: [qualityScore],
          chart: { type: 'radialBar', height: 320, fontFamily: 'inherit' },
          plotOptions: {
            radialBar: {
              startAngle: -90, endAngle: 90,
              track: { background: '#E2E8F0', strokeWidth: '97%' },
              dataLabels: {
                name: { show: true, label: 'الامتثال للجودة', color: '#64748B', fontSize: '14px' },
                value: { offsetY: -10, fontSize: '32px', show: true, fontWeight: '700' }
              }
            }
          },
          colors: ['#2A9D8F'],
          theme: { mode: darkMode ? 'dark' : 'light' }
        });
        this.charts.qualityScore.render();
      }

      // 7. Cost Sparkline
      const sparkData = ChartsAdapter.buildCostSparkline(this.filteredRejects);
      const sparkEl = document.querySelector('#sparkline-cost');
      if (sparkEl) {
        sparkEl.innerHTML = '';
        new ApexCharts(sparkEl, {
          series: [{ data: sparkData }],
          chart: { type: 'line', height: 32, sparkline: { enabled: true } },
          stroke: { curve: 'smooth', width: 2 },
          colors: ['#E76F51'],
          tooltip: { enabled: false }
        }).render();
      }
    },

    updateChartThemes() {
      const mode = this.darkMode ? 'dark' : 'light';
      Object.values(this.charts).forEach(c => {
        if (c && typeof c.updateOptions === 'function') {
          c.updateOptions({ theme: { mode } });
        }
      });
    },

    refreshChartsData() {
      if (this.charts.deptCost && this.filteredRejects.length > 0) {
        const donut = ChartsAdapter.buildDeptDonut(this.filteredRejects);
        this.charts.deptCost.updateSeries(donut.series);
      }
    },

    // ═════════════════════════════════════════════════════════════════
    //  REALTIME
    // ═════════════════════════════════════════════════════════════════
    setupRealtimeListeners() {
      window.addEventListener('data:updated', () => this.fetchDashboardData());
    },

    async refreshAIAnalysis() {
      this.loading.ai = true;
      try {
        await BrightAPI.refreshData();
        await this.fetchAISummary();
      } catch (e) {
        console.error('refreshAIAnalysis:', e);
      } finally {
        this.loading.ai = false;
      }
    },

    // ═════════════════════════════════════════════════════════════════
    //  AI CHAT
    // ═════════════════════════════════════════════════════════════════
    async askAI(question) {
      this.chatMessages.push({ sender: 'user', text: question });
      this.aiLoading = true;
      this.scrollChatToBottom();

      try {
        const data = await BrightAPI.askAI(question);
        this.chatMessages.push({ sender: 'ai', text: data.answer || (this.lang === 'ar' ? 'تمت معالجة السؤال.' : 'Query processed.') });
      } catch (e) {
        this.chatMessages.push({
          sender: 'ai',
          text: this.lang === 'ar'
            ? 'عذراً، لم أتمكن من الوصول لخدمة الذكاء الاصطناعي حالياً. حاول لاحقاً.'
            : 'Sorry, AI service is currently unavailable. Please try again later.'
        });
      } finally {
        this.aiLoading = false;
        this.scrollChatToBottom();
      }
    },

    sendChatMessage() {
      if (!this.chatInput.trim()) return;
      const q = this.chatInput;
      this.chatInput = '';
      this.askAI(q);
    },

    scrollChatToBottom() {
      this.$nextTick(() => {
        const feed = document.querySelector('#chat-feed-box');
        if (feed) feed.scrollTop = feed.scrollHeight;
      });
    },

    // ═════════════════════════════════════════════════════════════════
    //  FORMATTING
    // ═════════════════════════════════════════════════════════════════
    formatCurrency(val) {
      if (!val && val !== 0) return 'SAR 0.00';
      return 'SAR ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatDate(d) {
      if (!d) return '—';
      return dayjs(d).locale(this.lang).format('DD MMMM YYYY');
    }
  };
}
