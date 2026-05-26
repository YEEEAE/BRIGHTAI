/**
 * Documentation:
 * - docs/01-pages/finance-page.md
 * - docs/04-api/rejects-api.md
 */
function financeApp() {
  return {
    // UI Layout
    sidebarCollapsed: false,
    darkMode: false,
    lang: 'ar',
    
    // CFO metrics YTD
    kpis: {
      ytdCost: 158329773.03,
      recoveryAchieved: 38200,
      roiOnCapa: 245
    },

    // Loss Recovery stages
    pipeline: {
      identified: 158300,
      underReview: 92000,
      approved: 48000,
      recovered: 38200
    },

    // Financial Tiers
    tiers: {
      t1: { count: 85, total: '24,500' },
      t2: { count: 42, total: '145,000', pending: 8 },
      t3: { count: 23, total: '290,000', critical: 4 }
    },

    // Supplier Recovery feasibility matrix
    recoveryMatrix: [
      { id: 1, item: 'Sponge Tape 20mm (Lot: 2026-98)', cost: 145000, rework: 'مستحيل لتلف الصمغ', supplier: 'ممكن لاستلام بضاعة رطبة', downgrade: 0, aiRec: 'الرجوع للمورد بالمطالبة المالية الفورية بقيمة SAR 145K' },
      { id: 2, item: 'PVC Granules Medical grade (Lot: 401)', cost: 92000, rework: 'ممكن عبر إعادة صهر معقدة', supplier: 'غير ممكن لانحراف الاستخدام', downgrade: 22000, aiRec: 'بيعها كبضاعة درجة ثانية لمنتجات بلاستيكية غير طبية بقيمة SAR 22K' },
      { id: 3, item: 'Packaging Carton Mais (Lot: C10)', cost: 48000, rework: 'غير ممكن لخطأ الطباعة المورد', supplier: 'ممكن لاستلام نموذج خاطئ', downgrade: 0, aiRec: 'تحميل التكلفة الإجمالية للمورد المعتمد' }
    ],

    // Interactive ROI sliders state
    roiCalculator: {
      investment: 45000,
      reduction: 40,
      savings: 180000,
      roi: 300
    },

    // Audit Trail data
    auditTrail: [
      { id: 1, voucher: 'FIN-VOU-2026-101', date: '2026-05-24', desc: 'اعتماد شطب شحنة إبر تالفة بعد فحص الجودة المرفق', chain: 'QC Inspector ➔ QC Director ➔ CFO Sign-off', amount: 14500 },
      { id: 2, voucher: 'FIN-VOU-2026-102', date: '2026-05-20', desc: 'إقرار المطالبة المالية لمورد البوليمرات الطبية', chain: 'Procurement ➔ Finance Auditor ➔ CFO Approved', amount: 92000 },
      { id: 3, voucher: 'FIN-VOU-2026-103', date: '2026-05-18', desc: 'إرسال فاتورة إتلاف بيئي معتمدة للبلدية', chain: 'HSE Officer ➔ Finance Auditor', amount: 4800 }
    ],

    // ApexCharts pointers
    charts: {},

    // Core Functions
    init() {
      this.initThemeAndLang();
      this.initFinanceCharts();
      this.calculateRoi();
    },

    initThemeAndLang() {
      this.darkMode = localStorage.getItem('darkMode') === 'true';
      this.lang = localStorage.getItem('lang') || 'ar';
      
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
      document.documentElement.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
      
      if (this.darkMode) {
        document.body.classList.add('dark');
      }
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

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

    approveRecovery(id) {
      this.recoveryMatrix = this.recoveryMatrix.filter(r => r.id !== id);
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'success',
          title: this.lang === 'ar' ? 'الاسترداد المالي' : 'Financial Recovery',
          message: this.lang === 'ar' ? 'تم اعتماد بديل الاسترداد المالي المالي وإرسال قيد المطالبة الفوري للمورد!' : 'Supplier claim approved, financial voucher posted to ERP!'
        });
      }
    },

    calculateRoi() {
      // Dynamic calculation based on current plant parameters (Total YTD Loss scrap base)
      const scrapBase = 450000; 
      const reductionFraction = Number(this.roiCalculator.reduction) / 100;
      const investment = Number(this.roiCalculator.investment);
      
      const savings = scrapBase * reductionFraction;
      const roi = Math.round(((savings - investment) / investment) * 100);

      this.roiCalculator.savings = savings;
      this.roiCalculator.roi = roi;
    },

    downloadAttachment(id) {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'info',
          title: this.lang === 'ar' ? 'تحميل المرفقات' : 'Downloading Attachment',
          message: this.lang === 'ar' ? `جاري تحميل السند المالي وملفات الجودة المرفقة للمعاملة رقم ${id}...` : `Downloading quality sheets and invoice for voucher: ${id}`
        });
      }
    },

    exportReport(type) {
      const msgs = {
        excel: this.lang === 'ar' ? 'جاري تصدير دفتر الأستاذ والمطالبات المالية بصيغة Excel الحقيقية...' : 'Exporting complete YTD financial ledger to Excel workbook...',
        pdf: this.lang === 'ar' ? 'جاري تصدير تقرير الربع المالي للـ CFO بصيغة PDF...' : 'Generating premium PDF CFO financial audit report...'
      };
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'success',
          title: this.lang === 'ar' ? 'تصدير البيانات المالية' : 'Export Financials',
          message: msgs[type] || ''
        });
      }
    },

    // Advanced charts
    initFinanceCharts() {
      // Budget vs Actual comparative Column/Line Chart
      this.charts.budgetVsActual = new ApexCharts(document.querySelector("#chart-budget-actual"), {
        series: [{
          name: 'التكلفة الفعلية للمرفوضات (SAR)',
          type: 'column',
          data: [120000, 145000, 110000, 165000, 158000]
        }, {
          name: 'الموازنة التقديرية المحددة (SAR)',
          type: 'line',
          data: [150000, 150000, 150000, 150000, 150000]
        }],
        chart: { height: 300, type: 'line', toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#E76F51', '#0F4C81'],
        stroke: { width: [0, 3] },
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        theme: { mode: this.darkMode ? 'dark' : 'light' }
      });
      this.charts.budgetVsActual.render();
    },

    updateChartThemes() {
      const mode = this.darkMode ? 'dark' : 'light';
      const opts = { theme: { mode: mode } };
      
      Object.values(this.charts).forEach(chart => {
        if (chart && typeof chart.updateOptions === 'function') {
          chart.updateOptions(opts);
        }
      });
    },

    // Formatting utilities
    formatCurrency(val) {
      if (!val && val !== 0) return 'SAR 0.00';
      return 'SAR ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };
}
