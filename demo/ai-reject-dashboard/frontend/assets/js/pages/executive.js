/**
 * Executive Dashboard — API-driven, zero hardcoded numbers.
 */
function executiveApp() {
  return {
    sidebarCollapsed: false,
    darkMode: false,
    lang: 'ar',
    loading: true,
    error: null,

    dataSource: 'unknown',
    lastExcelUpdate: null,

    kpis: {
      totalCost: 0,
      riskExposure: 0,
      highRiskCount: 0,
      expiredValue: 0,
      nearExpiryValue: 0
    },

    briefText: '',
    highlights: [],
    topRisks: [],
    boardRecs: [],
    pendingDecisions: [],
    deptExposure: [],

    charts: {},

    init() {
      this.initThemeAndLang();
      this.fetchData();
      this.setupRealtimeListeners();
    },

    setupRealtimeListeners() {
      window.addEventListener('data:updated', () => this.fetchData());
    },

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
    },

    async fetchData() {
      this.loading = true;
      this.error = null;
      try {
        const data = await BrightAPI.loadAllPageData('executive');
        this.applyStatus(data.status);
        this.applyRejects(data.rejects);
        this.applySummary(data.summary);
        this.initCharts();
      } catch (e) {
        console.error('executive fetchData:', e);
        this.error = this.lang === 'ar' ? 'فشل تحميل البيانات.' : 'Failed to load data.';
      } finally {
        this.loading = false;
      }
    },

    applyStatus(status) {
      if (!status) return;
      this.lastExcelUpdate = status.file_modified_at || status.last_load || null;
      if (status.file_exists) {
        this.dataSource = 'excel_live';
      } else if (status.warnings && status.warnings.length > 0) {
        this.dataSource = status.warnings.some(w => w.includes('Demo')) ? 'demo_fallback' : 'cache';
      }
    },

    applyRejects(rejects) {
      if (!rejects || !Array.isArray(rejects)) {
        this.kpis = { totalCost: 0, riskExposure: 0, highRiskCount: 0, expiredValue: 0, nearExpiryValue: 0 };
        this.topRisks = [];
        this.deptExposure = [];
        return;
      }
      this.dataSource = BrightAPI.getDataSource();

      const totalCost = rejects.reduce((s, r) => s + (Number(r.cost) || 0), 0);
      const highRisk = rejects.filter(r => Number(r.risk_score) >= 70);
      const expired = rejects.filter(r => r.shelf_life_status === 'Expired');
      const nearExpiry = rejects.filter(r => Number(r.remaining_percent) <= 20 && r.shelf_life_status !== 'Expired');

      this.kpis = {
        totalCost,
        riskExposure: highRisk.reduce((s, r) => s + (Number(r.cost) || 0), 0),
        highRiskCount: highRisk.length,
        expiredValue: expired.reduce((s, r) => s + (Number(r.cost) || 0), 0),
        nearExpiryValue: nearExpiry.reduce((s, r) => s + (Number(r.cost) || 0), 0)
      };

      this.topRisks = highRisk
        .sort((a, b) => (Number(b.cost) || 0) - (Number(a.cost) || 0))
        .slice(0, 5)
        .map((r, i) => ({
          id: i + 1,
          desc: r.item_name || r.reason || '—',
          impact: Number(r.cost) || 0,
          prob: Number(r.risk_score) >= 85 ? 'Critical' : Number(r.risk_score) >= 70 ? 'High' : 'Medium',
          status: r.approval_status || '—',
          owner: r.department || '—',
          deadline: r.date || '—',
          aiRec: r.reason || '—'
        }));

      const deptMap = {};
      rejects.forEach(r => {
        const dept = r.department || 'غير محدد';
        if (!deptMap[dept]) deptMap[dept] = { department: dept, count: 0, totalCost: 0 };
        deptMap[dept].count += 1;
        deptMap[dept].totalCost += Number(r.cost) || 0;
      });
      this.deptExposure = Object.values(deptMap).sort((a, b) => b.totalCost - a.totalCost).slice(0, 5);

      if (this.topRisks.length === 0) {
        this.highlights = [{ icon: '📊', title: this.lang === 'ar' ? 'لا توجد مخاطر عالية حالياً' : 'No high risks detected', desc: this.lang === 'ar' ? 'لم يتم العثور على سجلات بمخاطر عالية من البيانات الحالية.' : 'No high-risk records found in current data.' }];
      } else {
        this.highlights = this.topRisks.slice(0, 3).map(r => ({
          icon: '⚠️',
          title: r.desc,
          desc: this.lang === 'ar' ? `تأثير مالي: ${this.formatCurrency(r.impact)} — ${r.prob}` : `Financial impact: ${this.formatCurrency(r.impact)} — ${r.prob}`
        }));
      }

      this.pendingDecisions = this.topRisks.slice(0, 3).map((r, i) => ({
        id: i + 1,
        title: this.lang === 'ar' ? `مراجعة حالة: ${r.desc} (${this.formatCurrency(r.impact)})` : `Review case: ${r.desc} (${this.formatCurrency(r.impact)})`,
        meta: `${r.owner} | ${r.status}`
      }));
    },

    applySummary(data) {
      const summary = data?.analysis || data || {};
      this.briefText = summary.executive_summary || '';
      if (!this.briefText) {
        this.briefText = this.lang === 'ar' ? 'غير متوفر من البيانات الحالية' : 'Unavailable from current data';
      }
      this.boardRecs = (summary.recommendations || []).slice(0, 3).map(rec => ({
        title: rec.title || rec,
        roi: rec.roi || '—',
        desc: rec.description || rec.desc || ''
      }));
      if (this.boardRecs.length === 0) {
        this.boardRecs = [{ title: this.lang === 'ar' ? 'غير متوفر من البيانات الحالية' : 'Unavailable from current data', roi: '—', desc: '' }];
      }
    },

    approveDecision(id) {
      this.pendingDecisions = this.pendingDecisions.filter(d => d.id !== id);
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({ type: 'success', title: this.lang === 'ar' ? 'اعتماد القرار' : 'Decision Approved', message: this.lang === 'ar' ? 'تم اعتماد القرار.' : 'Decision approved.' });
      }
    },

    async refreshBrief() {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({ type: 'info', title: this.lang === 'ar' ? 'استشارة صقر AI' : 'Consulting صقر AI', message: this.lang === 'ar' ? 'جاري استشارة صقر AI...' : 'Consulting صقر AI...' });
      }
      await this.fetchData();
    },

    exportReport(type) {
      if (type === 'print') { ReportActions.printCurrentPage(); return; }
      ReportActions.generatePagePdfReport('executive', 'executive');
    },

    refreshData() { this.fetchData(); },

    getDataSourceBadge() {
      const map = {
        excel_live: { label: this.lang === 'ar' ? '🟢 Excel مباشر' : '🟢 Excel Live', cls: 'success' },
        cache: { label: this.lang === 'ar' ? '🟡 بيانات مؤقتة' : '🟡 Cached', cls: 'warning' },
        demo_fallback: { label: this.lang === 'ar' ? '🔴 بيانات تجريبية' : '🔴 Demo Fallback', cls: 'danger' },
        error: { label: this.lang === 'ar' ? '⚫ خطأ اتصال' : '⚫ Error', cls: 'danger' },
        unknown: { label: this.lang === 'ar' ? '⏳ جاري التحميل...' : '⏳ Loading...', cls: 'secondary' }
      };
      return map[this.dataSource] || map.unknown;
    },

    formatLastUpdate() {
      if (!this.lastExcelUpdate) return this.lang === 'ar' ? 'غير متوفر' : 'Unavailable';
      try {
        const diff = Date.now() - new Date(this.lastExcelUpdate).getTime();
        if (diff < 60000) return this.lang === 'ar' ? 'الآن' : 'now';
        const min = Math.floor(diff / 60000);
        if (min < 60) return this.lang === 'ar' ? `${min} دقيقة` : `${min} min`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return this.lang === 'ar' ? `${hr} ساعة` : `${hr} hr`;
        return this.lang === 'ar' ? `${Math.floor(hr / 24)} يوم` : `${Math.floor(hr / 24)} d`;
      } catch { return '—'; }
    },

    initCharts() {
      if (this.deptExposure.length === 0) return;
      Object.values(this.charts).forEach(c => { if (c && typeof c.destroy === 'function') c.destroy(); });
      this.charts = {};

      const deptEl = document.querySelector('#chart-dept-radar');
      if (deptEl && this.deptExposure.length > 0) {
        this.charts.deptRadar = new ApexCharts(deptEl, {
          series: [{ name: this.lang === 'ar' ? 'التكلفة' : 'Cost', data: this.deptExposure.map(d => d.totalCost) }],
          chart: { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
          colors: ['#0F4C81'],
          xaxis: { categories: this.deptExposure.map(d => d.department) },
          theme: { mode: this.darkMode ? 'dark' : 'light' }
        });
        this.charts.deptRadar.render();
      }

      const waterfallEl = document.querySelector('#chart-exec-waterfall');
      if (waterfallEl && this.topRisks.length > 0) {
        this.charts.waterfall = new ApexCharts(waterfallEl, {
          series: [{ name: 'SAR', data: this.topRisks.map(r => r.impact) }],
          chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'inherit' },
          colors: ['#E76F51'],
          xaxis: { categories: this.topRisks.map(r => r.desc.substring(0, 20)) },
          theme: { mode: this.darkMode ? 'dark' : 'light' }
        });
        this.charts.waterfall.render();
      }
    },

    updateChartThemes() {
      const mode = this.darkMode ? 'dark' : 'light';
      Object.values(this.charts).forEach(c => { if (c && typeof c.updateOptions === 'function') c.updateOptions({ theme: { mode } }); });
    },

    formatCurrency(val) {
      if (!val && val !== 0) return this.lang === 'ar' ? 'غير متوفر من البيانات الحالية' : 'Unavailable from current data';
      return 'SAR ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };
}
