/**
 * Finance Dashboard — API-driven, zero hardcoded numbers.
 */
function financeApp() {
  return {
    sidebarCollapsed: false,
    darkMode: false,
    lang: 'ar',
    loading: true,
    error: null,

    dataSource: 'unknown',
    lastExcelUpdate: null,

    kpis: {
      totalStockValue: 0,
      expiredValue: 0,
      nearExpiryValue: 0,
      avgItemValue: 0,
      totalRecords: 0
    },

    highestValueBatches: [],
    costByCategory: [],
    costByDepartment: [],
    pipeline: { identified: 0, underReview: 0, approved: 0, recovered: 0 },
    auditTrail: [],

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
        const data = await BrightAPI.loadAllPageData('finance');
        this.applyStatus(data.status);
        this.applyRejects(data.rejects);
        this.applySummary(data.summary);
        this.initFinanceCharts();
      } catch (e) {
        console.error('finance fetchData:', e);
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
        this.kpis = { totalStockValue: 0, expiredValue: 0, nearExpiryValue: 0, avgItemValue: 0, totalRecords: 0 };
        this.highestValueBatches = [];
        this.costByCategory = [];
        this.costByDepartment = [];
        return;
      }
      this.dataSource = BrightAPI.getDataSource();
      const totalStockValue = rejects.reduce((s, r) => s + (Number(r.cost) || 0), 0);
      const expired = rejects.filter(r => r.shelf_life_status === 'Expired');
      const nearExpiry = rejects.filter(r => Number(r.remaining_percent) <= 20 && r.shelf_life_status !== 'Expired');

      this.kpis = {
        totalStockValue,
        expiredValue: expired.reduce((s, r) => s + (Number(r.cost) || 0), 0),
        nearExpiryValue: nearExpiry.reduce((s, r) => s + (Number(r.cost) || 0), 0),
        avgItemValue: rejects.length ? totalStockValue / rejects.length : 0,
        totalRecords: rejects.length
      };

      this.highestValueBatches = [...rejects]
        .sort((a, b) => (Number(b.cost) || 0) - (Number(a.cost) || 0))
        .slice(0, 5)
        .map(r => ({ item: r.item_name || '—', cost: Number(r.cost) || 0, status: r.approval_status || '—' }));

      const catMap = {};
      rejects.forEach(r => {
        const cat = r.category || 'غير محدد';
        if (!catMap[cat]) catMap[cat] = { category: cat, count: 0, totalCost: 0 };
        catMap[cat].count += 1;
        catMap[cat].totalCost += Number(r.cost) || 0;
      });
      this.costByCategory = Object.values(catMap).sort((a, b) => b.totalCost - a.totalCost);

      const deptMap = {};
      rejects.forEach(r => {
        const dept = r.department || 'غير محدد';
        if (!deptMap[dept]) deptMap[dept] = { department: dept, count: 0, totalCost: 0 };
        deptMap[dept].count += 1;
        deptMap[dept].totalCost += Number(r.cost) || 0;
      });
      this.costByDepartment = Object.values(deptMap).sort((a, b) => b.totalCost - a.totalCost);

      const pending = rejects.filter(r => r.approval_status === 'Pending' || !r.approval_status);
      const review = rejects.filter(r => r.approval_status === 'Review');
      const approved = rejects.filter(r => r.approval_status === 'Approved');
      this.pipeline = {
        identified: totalStockValue,
        underReview: review.reduce((s, r) => s + (Number(r.cost) || 0), 0),
        approved: approved.reduce((s, r) => s + (Number(r.cost) || 0), 0),
        recovered: 0
      };

      this.auditTrail = rejects
        .filter(r => r.approval_status === 'Approved' || r.approval_status === 'Review')
        .slice(0, 5)
        .map((r, i) => ({
          id: i + 1,
          voucher: r.doc_no || `FIN-${i + 1}`,
          date: r.date || '—',
          desc: r.item_name || '—',
          chain: `${r.department || '—'} → ${r.approval_status}`,
          amount: Number(r.cost) || 0
        }));
    },

    applySummary(data) {
      // Financial insights from summary if available
    },

    exportReport(type) {
      if (type === 'print') { ReportActions.printCurrentPage(); return; }
      ReportActions.generatePagePdfReport('finance', 'financial');
    },

    refreshData() { this.fetchData(); },

    getDataSourceBadge() {
      const map = {
        excel_live: { label: this.lang === 'ar' ? '🟢 Excel مباشر' : '🟢 Excel Live', cls: 'success' },
        cache: { label: this.lang === 'ar' ? '🟡 بيانات مؤقتة' : '🟡 Cached', cls: 'warning' },
        demo_fallback: { label: this.lang === 'ar' ? '🔴 بيانات تجريبية' : '🔴 Demo Fallback', cls: 'danger' },
        error: { label: this.lang === 'ar' ? '⚫ خطأ' : '⚫ Error', cls: 'danger' },
        unknown: { label: this.lang === 'ar' ? '⏳ تحميل...' : '⏳ Loading...', cls: 'secondary' }
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

    initFinanceCharts() {
      Object.values(this.charts).forEach(c => { if (c && typeof c.destroy === 'function') c.destroy(); });
      this.charts = {};

      if (this.costByDepartment.length === 0) return;

      const budgetEl = document.querySelector('#chart-budget-actual');
      if (budgetEl) {
        this.charts.budgetVsActual = new ApexCharts(budgetEl, {
          series: [{ name: this.lang === 'ar' ? 'التكلفة (SAR)' : 'Cost (SAR)', type: 'bar', data: this.costByDepartment.map(d => d.totalCost) }],
          chart: { height: 300, type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
          colors: ['#E76F51'],
          xaxis: { categories: this.costByDepartment.map(d => d.department) },
          theme: { mode: this.darkMode ? 'dark' : 'light' }
        });
        this.charts.budgetVsActual.render();
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
