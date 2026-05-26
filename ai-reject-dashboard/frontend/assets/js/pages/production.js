/**
 * Documentation:
 * - docs/01-pages/production-page.md
 * - docs/04-api/rejects-api.md
 */
function productionApp() {
  return {
    sidebarCollapsed: false,
    darkMode: false,
    lang: 'ar',
    isLoading: true,
    error: null,
    insufficientLabel: 'بيانات غير كافية',

    kpis: {
      oee: null,
      availability: null,
      performance: null,
      quality: null,
      fpy: null
    },

    checklist: {
      calibration: false,
      moisture: false,
      handover: false,
      safety: false
    },

    machines: [],
    shifts: [],
    materialAlerts: [],

    init() {
      this.initThemeAndLang();
      this.loadProductionData();
      this.setupRealtimeListeners();
    },

    setupRealtimeListeners() {
      window.addEventListener('data:updated', () => this.loadProductionData());
    },

    initThemeAndLang() {
      this.darkMode = localStorage.getItem('darkMode') === 'true';
      this.lang = localStorage.getItem('lang') || 'ar';
      this.insufficientLabel = this.lang === 'ar' ? 'بيانات غير كافية' : 'Insufficient data';
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
      document.documentElement.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
      if (this.darkMode) document.body.classList.add('dark');
    },

    toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
    },

    toggleLanguage() {
      this.lang = this.lang === 'ar' ? 'en' : 'ar';
      this.insufficientLabel = this.lang === 'ar' ? 'بيانات غير كافية' : 'Insufficient data';
      localStorage.setItem('lang', this.lang);
      document.documentElement.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
    },

    async loadProductionData() {
      this.isLoading = true;
      this.error = null;
      try {
        const pageData = await BrightAPI.loadAllPageData('production');
        const rejects = Array.isArray(pageData.rejectPayload?.rejects) ? pageData.rejectPayload.rejects : [];
        const metrics = pageData.rejectPayload?.metrics || pageData.analysis?.analysis?.metrics || pageData.analysis?.metrics || {};
        this.applyProductionMetrics(rejects, metrics);
      } catch (e) {
        console.error('loadProductionData:', e);
        this.error = this.lang === 'ar' ? 'تعذر تحميل بيانات الإنتاج من API.' : 'Unable to load production API data.';
        this.applyProductionMetrics([], {});
      } finally {
        this.isLoading = false;
      }
    },

    applyProductionMetrics(rejects, metrics) {
      const machineRates = metrics.machine_defect_rates || this.buildMachineDefectRates(rejects);
      const machineEntries = Object.entries(machineRates).filter(([name]) => name && name !== 'Unknown' && name !== 'Not Available');
      const totalRecords = rejects.length;
      const rejectCount = rejects.filter((record) => {
        const pass = String(record.pass || record.pass_status || '').toLowerCase();
        return pass && pass !== 'pass' && pass !== 'ok'
          ? true
          : Number(record.risk_score) >= 70 || record.capa_required === true;
      }).length;
      const quality = totalRecords ? Math.max(0, Math.round(((totalRecords - rejectCount) / totalRecords) * 1000) / 10) : null;
      const avgDefect = machineEntries.length
        ? machineEntries.reduce((sum, [, stat]) => sum + (Number(stat.defect_rate) || 0), 0) / machineEntries.length
        : null;

      this.kpis.quality = quality;
      this.kpis.fpy = totalRecords ? quality : null;
      this.kpis.availability = machineEntries.length ? Math.round(Math.max(0, 100 - avgDefect) * 10) / 10 : null;
      this.kpis.performance = totalRecords ? Math.round(Math.max(0, 100 - (rejectCount / totalRecords) * 100) * 10) / 10 : null;
      this.kpis.oee = [this.kpis.availability, this.kpis.performance, this.kpis.quality].every(Number.isFinite)
        ? Math.round((this.kpis.availability * this.kpis.performance * this.kpis.quality) / 10000 * 10) / 10
        : null;

      this.machines = machineEntries.map(([name, stat], index) => {
        const machineRecords = rejects.filter((record) => (record.machine || 'Unknown') === name);
        const cost = machineRecords.reduce((sum, record) => sum + (Number(record.cost) || 0), 0);
        const rate = Number(stat.defect_rate) || 0;
        return {
          id: index + 1,
          name,
          status: rate >= 8 ? 'Maintenance' : 'Running',
          cost,
          rejectRate: `${rate}%`,
          nextMaintenance: this.insufficientLabel
        };
      });

      this.shifts = this.buildShiftStats(rejects);
      this.materialAlerts = this.buildMaterialAlerts(rejects);
    },

    buildMachineDefectRates(rejects) {
      return rejects.reduce((acc, record) => {
        const machine = record.machine || 'Unknown';
        if (!acc[machine]) acc[machine] = { total_records: 0, defect_records: 0, defect_rate: 0 };
        acc[machine].total_records += 1;
        if (record.reason && record.reason !== 'Not Available') acc[machine].defect_records += 1;
        acc[machine].defect_rate = Math.round((acc[machine].defect_records / acc[machine].total_records) * 1000) / 10;
        return acc;
      }, {});
    },

    buildShiftStats(rejects) {
      const shiftKey = (record) => record.Shift || record.shift || record.raw?.Shift || record.raw?.shift || '';
      const grouped = rejects.reduce((acc, record) => {
        const shift = String(shiftKey(record)).trim();
        if (!shift) return acc;
        if (!acc[shift]) acc[shift] = { name: shift, records: 0, rejects: 0, quantity: 0 };
        acc[shift].records += 1;
        acc[shift].rejects += Number(record.risk_score) >= 70 || record.capa_required === true ? 1 : 0;
        acc[shift].quantity += Number(record.quantity) || 0;
        return acc;
      }, {});

      return Object.values(grouped).map((shift) => ({
        ...shift,
        scrapRate: shift.records ? Math.round((shift.rejects / shift.records) * 1000) / 10 : null
      }));
    },

    buildMaterialAlerts(rejects) {
      return rejects
        .filter((record) => record.has_life_risk || record.shelf_life_status === 'Expired' || Number(record.remaining_percent) <= 20)
        .slice(0, 3)
        .map((record) => ({
          title: record.item_name || record.item_code || this.insufficientLabel,
          detail: record.shelf_life_status || record.reason || this.insufficientLabel,
          cost: Number(record.cost) || 0
        }));
    },

    metricText(value, suffix = '%') {
      return Number.isFinite(value) ? `${value}${suffix}` : this.insufficientLabel;
    },

    exportMESReport() {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'info',
          title: this.lang === 'ar' ? 'تصدير تقرير الإنتاج' : 'MES Report Export',
          message: this.lang === 'ar' ? 'جاري تجهيز تقرير الإنتاج من بيانات API الحالية.' : 'Generating MES report from current API data.'
        });
      }
    },

    formatCurrency(val) {
      if (!val && val !== 0) return 'SAR 0';
      return 'SAR ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
  };
}
