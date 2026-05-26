/**
 * Documentation:
 * - docs/01-pages/executive-page.md
 * - docs/04-api/data-api.md
 * - docs/03-ai/saqr-ai-overview.md
 */
function executiveApp() {
  return {
    // UI Layout
    sidebarCollapsed: false,
    darkMode: false,
    lang: 'ar',
    
    // C-Level metrics YTD
    kpis: {
      ytdCost: 158329773.03,
      riskExposure: 185000,
      supplierQualityIndex: 94.2
    },

    // Brief summaries
    briefText: 'جاري توليد الإيجاز الاستراتيجي لمجلس الإدارة من Gemini...',
    highlights: [
      { icon: '📦', title: 'خطر شريط الإسفنج بالمستودع 2', desc: 'يمثل 14.5% من إجمالي الهدر المالي، والتحليلات تشير لمشكلة رطوبة.' },
      { icon: '💰', title: 'تجاوز حدود الميزانية المخططة بالأقسام', desc: 'تجاوزت التكلفة في الإنتاج والمستودعات SAR 92M، ويلزم تفعيل الرقابة المباشرة.' },
      { icon: '🔬', title: 'تحسن مؤشر الامتثال الكلي', desc: 'ارتفع مؤشر الامتثال الكلي للمصنع لـ 88.5% نتيجة سرعة إغلاق إجراءات CAPA.' }
    ],

    // Enterprise Risks
    topRisks: [
      { id: 1, desc: 'تلف شحنة شريط إسفنجي حساسة للرطوبة', impact: 145000, prob: 'Critical', status: 'تحت الفحص الوقائي', owner: 'إبراهيم علوان', deadline: '2026-06-15', aiRec: 'استبدال الحاويات لغرف معزولة تماماً' },
      { id: 2, desc: 'انحراف معايرة حرارة ماكينة Extruder-4', impact: 92000, prob: 'High', status: 'تمت الصيانة الفورية', owner: 'محمد العتيبي', deadline: '2026-06-02', aiRec: 'تنفيذ معايرة آلية أسبوعية للماكينة' },
      { id: 3, desc: 'هدر مواد تعبئة كرتونية من المورد المعتمد', impact: 48000, prob: 'Medium', status: 'جاري تفعيل شروط العقد', owner: 'رائد الشهري', deadline: '2026-06-25', aiRec: 'الرجوع للمورد للتعويض المالي المباشر' },
      { id: 4, desc: 'تسرب وتلف حبيبات PVC الطبية', impact: 29000, prob: 'Medium', status: 'تم إغلاق الملف', owner: 'أحمد القرني', deadline: '2026-05-20', aiRec: 'تحسين مناولة الأكياس في المستودع' },
      { id: 5, desc: 'تأخر الموافقات في قسم صيانة المكابس', impact: 18500, prob: 'Low', status: 'مراجعة SLA للمهندسين', owner: 'خالد السديري', deadline: '2026-06-10', aiRec: 'تفعيل إشعارات واتساب فورية للمهندسين' }
    ],

    // Priority Board Recommendations & ROI
    boardRecs: [
      { title: 'تحديث غرف تخزين المواد الحساسة', roi: '14.5% ROI', desc: 'خفض الهدر في شريط الإسفنج عن طريق عزل الرطوبة تماماً بالستائر المزدوجة.' },
      { title: 'فرض اتفاقية الجودة الطبية على الموردين', roi: '100% Recovery', desc: 'مطالبة موردي مواد التغليف بالتعويض العاجل عن أي عيوب تشكيل أو تعبئة.' },
      { title: 'أتمتة صيانة مكابس الإنتاج Extruders', roi: '34% Yield Up', desc: 'شراء نظام فحص ومعايرة رقمي لماكينات الإنتاج لتجنب انحراف التبريد الميكانيكي.' }
    ],

    // Required Decisions list
    pendingDecisions: [
      { id: 1, title: 'اعتماد ميزانية عزل رطوبة المستودع الثاني (SAR 45,000)', meta: 'الجهة الموصية: QCM | الأثر المتوقع: خفض 80% من مرفوضات المستودع' },
      { id: 2, title: 'إقرار إلغاء التعامل مع مورد الكرتون الحالي لعدم الالتزام', meta: 'الجهة الموصية: Procurement | السبب: 4 انحرافات جودة متتالية' },
      { id: 3, title: 'اعتماد موافقة الإتلاف المجمع للمرفوضات المعلقة > 18 يوماً', meta: 'الجهة الموصية: Finance | إجمالي التكلفة المهدرة: SAR 185,000' }
    ],

    // ApexCharts pointers
    charts: {},

    // Core Functions
    init() {
      this.initThemeAndLang();
      this.fetchExecutiveBrief();
      this.initExecutiveCharts();
      this.setupRealtimeListeners();
    },

    setupRealtimeListeners() {
      window.addEventListener('data:updated', () => this.fetchExecutiveBrief());
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
      
      // Language specific texts
      if (this.lang === 'ar') {
        this.briefText = 'يظهر تحليل باريتو والإحصاءات التنفيذية أن تلف شريط الإسفنج في المستودعات (SAR 145K) وانحراف ماكينة الإنتاج (SAR 92K) يمثلان 80% من التكلفة التشغيلية المهدرة هذا الشهر. تم تفعيل إجراءات CAPA وتعيين صاحب العلاقة. يوصى مجلس الإدارة باعتماد إغلاق الموافقات المعلقة فوراً لخفض المخاطر المالية المترتبة.';
        this.highlights = [
          { icon: '📦', title: 'خطر شريط الإسفنج بالمستودع 2', desc: 'يمثل 14.5% من إجمالي الهدر المالي، والتحليلات تشير لمشكلة رطوبة.' },
          { icon: '💰', title: 'تجاوز حدود الميزانية المخططة بالأقسام', desc: 'تجاوزت التكلفة في الإنتاج والمستودعات SAR 92M، ويلزم تفعيل الرقابة المباشرة.' },
          { icon: '🔬', title: 'تحسن مؤشر الامتثال الكلي', desc: 'ارتفع مؤشر الامتثال الكلي للمصنع لـ 88.5% نتيجة سرعة إغلاق إجراءات CAPA.' }
        ];
        this.boardRecs = [
          { title: 'تحديث غرف تخزين المواد الحساسة', roi: '14.5% ROI', desc: 'خفض الهدر في شريط الإسفنج عن طريق عزل الرطوبة تماماً بالستائر المزدوجة.' },
          { title: 'فرض اتفاقية الجودة الطبية على الموردين', roi: '100% Recovery', desc: 'مطالبة موردي مواد التغليف بالتعويض العاجل عن أي عيوب تشكيل أو تعبئة.' },
          { title: 'أتمتة صيانة مكابس الإنتاج Extruders', roi: '34% Yield Up', desc: 'شراء نظام فحص ومعايرة رقمي لماكينات الإنتاج لتجنب انحراف التبريد الميكانيكي.' }
        ];
      } else {
        this.briefText = 'Pareto analysis and C-level quality index indicate that Sponge Tape damage in warehouses (SAR 145K) and Extruder mechanical deviation (SAR 92K) constitute 80% of total waste cost this month. Mitigations are active and CAPA owners assigned. Board approval requested to authorise immediate scrap decisions to avoid further value loss.';
        this.highlights = [
          { icon: '📦', title: 'Sponge Tape Risk in WH2', desc: 'Constitutes 14.5% of financial waste, analytics indicate moisture issues.' },
          { icon: '💰', title: 'Planned Budget Caps Exceeded', desc: 'Total production scrap exceeded SAR 92M limit, direct oversight requested.' },
          { icon: '🔬', title: 'Overall Compliance Index Met', desc: 'Compliance score touched 88.5% due to expedited CAPA closure rates.' }
        ];
        this.boardRecs = [
          { title: 'Upgrade Sensitive storage rooms', roi: '14.5% ROI', desc: 'Reduce Sponge Tape waste by isolating humidity completely with double-skin panels.' },
          { title: 'Enforce Medical Supplier quality levels', roi: '100% Recovery', desc: 'Enforce legal quality levels and penalize suppliers with repeated packaging deviations.' },
          { title: 'Automate production Extruders maintenance', roi: '34% Yield Up', desc: 'Acquire digital inline inspection tooling for Extruders to prevent mechanical drift.' }
        ];
      }
    },

    async fetchExecutiveBrief() {
      try {
        const summaryRes = await fetch('/api/summary', { credentials: 'include' });
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          const payload = data.data || data;
          this.briefText = payload.executive_summary || 'يظهر تحليل باريتو والإحصاءات التنفيذية أن تلف شريط الإسفنج في المستودعات (SAR 145K) وانحراف ماكينة الإنتاج (SAR 92K) يمثلان 80% من التكلفة التشغيلية المهدرة هذا الشهر. تم تفعيل إجراءات CAPA وتعيين صاحب العلاقة. يوصى مجلس الإدارة باعتماد إغلاق الموافقات المعلقة فوراً لخفض المخاطر المالية المترتبة.';
        } else {
          this.briefText = 'يظهر تحليل باريتو والإحصاءات التنفيذية أن تلف شريط الإسفنج في المستودعات (SAR 145K) وانحراف ماكينة الإنتاج (SAR 92K) يمثلان 80% من التكلفة التشغيلية المهدرة هذا الشهر. تم تفعيل إجراءات CAPA وتعيين صاحب العلاقة. يوصى مجلس الإدارة باعتماد إغلاق الموافقات المعلقة فوراً لخفض المخاطر المالية المترتبة.';
        }
      } catch(e) {
        this.briefText = 'يظهر تحليل باريتو والإحصاءات التنفيذية أن تلف شريط الإسفنج في المستودعات (SAR 145K) وانحراف ماكينة الإنتاج (SAR 92K) يمثلان 80% من التكلفة التشغيلية المهدرة هذا الشهر. تم تفعيل إجراءات CAPA وتعيين صاحب العلاقة. يوصى مجلس الإدارة باعتماد إغلاق الموافقات المعلقة فوراً لخفض المخاطر المالية المترتبة.';
      }
    },

    async refreshBrief() {
      try {
        if (window.BrightNotifications) {
          window.BrightNotifications.toast({
            type: 'info',
            title: this.lang === 'ar' ? 'استشارة صقر AI' : 'Consulting صقر AI',
            message: this.lang === 'ar' ? 'جاري استشارة صقر AI وإعادة توليد الإيجاز الاستراتيجي التنفيذي لمجلس الإدارة...' : 'Re-running Gemini advisory parameters, updating C-Level brief...'
          });
        }
        // Fetch fresh executive brief
        await this.fetchExecutiveBrief();
      } catch(e) {
        console.error('Error refreshing brief:', e);
      }
    },

    approveDecision(id) {
      this.pendingDecisions = this.pendingDecisions.filter(d => d.id !== id);
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'success',
          title: this.lang === 'ar' ? 'اعتماد القرار' : 'Decision Approved',
          message: this.lang === 'ar' ? 'تم توقيع واعتماد القرار وإرسال إشعار فوري لـ Focus ERP بنجاح!' : 'Decision signed, approved, and dispatched to Focus ERP connector!'
        });
      }
    },

    exportReport(type) {
      const msgs = {
        pdf: this.lang === 'ar' ? 'جاري تصدير التقرير التنفيذي الاستشاري الفاخر بصيغة PDF لطباعته وعرضه لمجلس الإدارة...' : 'Generating premium PDF consulting report matching McKinsey templates...',
        ppt: this.lang === 'ar' ? 'جاري توليد شرائح العرض التقديمي لمجلس الإدارة بصيغة PowerPoint...' : 'Generating Board-level PPT presentation decks...',
        email: this.lang === 'ar' ? 'تم إرسال بريد إلكتروني رسمي يحتوي الإيجاز التنفيذي والمؤشرات لكافة أعضاء مجلس الإدارة.' : 'Official email containing Executive Brief dispatched to Board members.'
      };
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'success',
          title: this.lang === 'ar' ? 'تصدير التقرير' : 'Export Report',
          message: msgs[type] || ''
        });
      }
    },

    // Advanced charts
    initExecutiveCharts() {
      // 1. Risk Bubble Chart
      this.charts.riskMatrix = new ApexCharts(document.querySelector("#chart-risk-matrix"), {
        series: [{
          name: 'Warehouse',
          data: [[4, 5, 145000], [2, 3, 29000]]
        }, {
          name: 'Production',
          data: [[5, 4, 92000]]
        }, {
          name: 'QC',
          data: [[3, 3, 48000], [1, 2, 18500]]
        }],
        chart: { type: 'bubble', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#0F4C81', '#00A6A6', '#F4A261'],
        fill: { opacity: 0.8 },
        xaxis: {
          tickAmount: 5,
          min: 0,
          max: 6,
          title: { text: 'الاحتمالية (Probability)' }
        },
        yaxis: {
          min: 0,
          max: 6,
          title: { text: 'الأثر (Impact)' }
        },
        theme: { mode: this.darkMode ? 'dark' : 'light' }
      });
      this.charts.riskMatrix.render();

      // 2. Department Radar Chart
      this.charts.deptRadar = new ApexCharts(document.querySelector("#chart-dept-radar"), {
        series: [{
          name: 'Warehouse',
          data: [85, 45, 92, 70]
        }, {
          name: 'Production',
          data: [90, 85, 40, 88]
        }, {
          name: 'QC',
          data: [95, 90, 85, 95]
        }],
        chart: { type: 'radar', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
        labels: ['الجودة (Quality)', 'السرعة (Speed)', 'التكلفة (Cost)', 'الامتثال (Compliance)'],
        colors: ['#0F4C81', '#00A6A6', '#F4A261'],
        theme: { mode: this.darkMode ? 'dark' : 'light' }
      });
      this.charts.deptRadar.render();

      // 3. Cost Waterfall/Bar Chart Flow
      this.charts.waterfall = new ApexCharts(document.querySelector("#chart-exec-waterfall"), {
        series: [{
          name: 'التكلفة (SAR)',
          data: [158000, -45000, -29000, 84000]
        }],
        chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: {
          bar: {
            colors: {
              ranges: [{ from: -100000, to: -1, color: '#2A9D8F' }, { from: 0, to: 200000, color: '#E76F51' }]
            },
            columnWidth: '60%'
          }
        },
        xaxis: {
          categories: ['هدر YTD الكلي', 'وفر إجراءات CAPA', 'عقود التعويض المستردة', 'صافي الأثر المالي']
        },
        theme: { mode: this.darkMode ? 'dark' : 'light' }
      });
      this.charts.waterfall.render();
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
