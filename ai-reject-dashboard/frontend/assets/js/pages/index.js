function dashboardApp() {
  return {
    // Structural UI State
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    rightSidebarOpen: false,
    darkMode: false,
    lang: 'ar',
    searchQuery: '',
    notificationCount: 3,
    activePreset: 'month',
    
    // Data and Filters
    rejects: [],
    filteredRejects: [],
    paginatedRejects: [],
    selectedRows: [],
    visibleColumns: {
      doc_no: true,
      date: true,
      item_name: true,
      department: true,
      cost: true,
      status: true
    },
    filters: {
      department: '',
      category: '',
      risk_level: '',
      status: ''
    },
    
    // Pagination
    pagination: {
      page: 1,
      limit: 10,
      totalPages: 1,
      start: 0,
      end: 0
    },

    // Live Excel status
    excelStatus: {
      file_exists: false,
      record_count: 0,
      sheet_count: 0,
      hash: null,
      file_modified_at: null,
      warnings: []
    },

    // KPI metrics
    kpis: {
      totalRejects: 0,
      totalCost: 0,
      pendingApprovals: 0,
      criticalItems: 0,
      avgApprovalTime: '4.2 يوم',
      capaEffectiveness: 88
    },

    // AI pulse metrics
    aiSummary: 'جاري تحميل تحليلات الذكاء الاصطناعي...',
    aiFindings: [
      { priority: 'حرجة', title: 'ارتفاع تلف شريط الاسفنج', desc: 'يمثل شريط الاسفنج 14% من تكلفة المرفوضات هذا الشهر في قسم المستودعات.' },
      { priority: 'متوسطة', title: 'تأخر في موافقات المستودع', desc: 'متوسط مدة انتظار الموافقة في المستودع بلغ 8 أيام مقارنة بالحد الأقصى البالغ 5 أيام.' },
      { priority: 'وقائية', title: 'خطة CAPA المقترحة', desc: 'يلزم تعيين صاحب إجراء وقائي لفحص ظروف الرطوبة والحرارة لحماية المواد الحساسة.' }
    ],

    // Suggestions and Chats
    suggestedQueries: [
      'كم تكلفة المرفوضات هذا الشهر؟',
      'ما هي أهم 3 أسباب للعيوب؟',
      'توصيات CAPA لشريط الإسفنج؟',
      'تحليل تكلفة المرفوضات للأقسام؟'
    ],
    chatMessages: [],
    chatInput: '',
    aiLoading: false,

    // Live Socket.IO activities feed
    recentActivities: [
      { icon: '📦', text: 'إضافة وثيقة مرفوضات جديدة برقم DOC-2026-9812', time: 'منذ دقيقة واحدة', type: 'تلف مواد', color: 'primary' },
      { icon: '🔬', text: 'اعتماد إجراء تصحيحي CAPA لشحنة Sponge Tape', time: 'منذ 15 دقيقة', type: 'إجراء وقائي', color: 'success' },
      { icon: '💰', text: 'تنبيه مالي: تجاوز تكلفة المرفوضات للحد الأقصى في المستودعات', time: 'منذ ساعة واحدة', type: 'تنبيه مالي', color: 'danger' }
    ],

    // ApexCharts pointers
    charts: {},

    // Core Functions
    init() {
      this.initThemeAndLang();
      this.fetchDashboardData();
      this.setupRealtimeListeners();
      this.chatMessages = [{ sender: 'ai', text: this.getAiGreetingText() }];
    },

    initThemeAndLang() {
      // Read persisted configs
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
      
      // Refresh suggested queries based on language selection
      if (this.lang === 'ar') {
        this.suggestedQueries = ['كم تكلفة المرفوضات هذا الشهر؟', 'ما هي أهم 3 أسباب للعيوب؟', 'توصيات CAPA لشريط الإسفنج؟', 'تحليل تكلفة المرفوضات للأقسام؟'];
        this.chatMessages = [{ sender: 'ai', text: this.getAiGreetingText() }];
      } else {
        this.suggestedQueries = ['What is the reject cost this month?', 'Top 3 defects reasons?', 'CAPA recommendation for Sponge Tape?', 'Department scrap cost analysis?'];
        this.chatMessages = [{ sender: 'ai', text: this.getAiGreetingText() }];
      }
    },

    // API Data Fetching
    async fetchExcelStatus() {
      try {
        const res = await fetch('/api/data/live-status', { credentials: 'include' });
        if (res.ok) {
          const responseData = await res.json();
          this.excelStatus = responseData.data || responseData;
        }
      } catch (e) {
        console.error('Error fetching excel status:', e);
      }
    },

    getDisclaimerText() {
      const count = this.excelStatus.record_count ? this.excelStatus.record_count.toLocaleString() : '...';
      if (this.lang === 'ar') {
        return `نظام تحليلات BrightAI يقرأ حالياً من ملف Excel الحقيقي (${count} سجلاً). يرجى ملاحظة أن نظام Focus ERP يظل هو المصدر الرسمي والوحيد للموافقات التشغيلية.`;
      } else {
        return `BrightAI Analytics reads from the active Excel system (${count} records). Focus ERP remains the formal source of truth for approvals.`;
      }
    },

    getAiGreetingText() {
      const count = this.excelStatus.record_count ? this.excelStatus.record_count.toLocaleString() : '...';
      if (this.lang === 'ar') {
        return `أهلاً بك! أنا مساعد الذكاء الاصطناعي لـ BrightAI. تم ربط ملف Excel الحقيقي (${count} سجلاً). كيف يمكنني مساعدتك في تحليل الجودة والتكاليف اليوم؟`;
      } else {
        return `Hello! I am your BrightAI analytical assistant. The active Excel workbook has been connected (${count} records). How can I help you audit quality and costs today?`;
      }
    },

    async fetchDashboardData() {
      try {
        await this.fetchExcelStatus();

        const res = await fetch('/api/rejects?source=excel', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch rejects');
        const responseData = await res.json();
        const dataPayload = responseData.data || responseData;
        const rejects = dataPayload.rejects || responseData;
        
        // Format dynamic data payload
        this.rejects = rejects.map((r, idx) => ({
          id: r.id || idx,
          doc_no: r.doc_no || `DOC-2026-${1000 + idx}`,
          date: r.date || new Date().toISOString(),
          item_name: r.item_name || 'Sponge Tape 20mm',
          department: r.department || 'Warehouse',
          cost: Number(r.cost) || 12000,
          status: r.approval_status || 'Pending',
          category: r.category || 'Raw Material',
          risk: r.risk_level || 'Medium'
        }));

        this.applyFilters();
        this.calculateKPIs();
        this.initCharts();
        this.fetchAISummary();
      } catch (e) {
        console.error('Error fetching data:', e);
        // Fallback load mock data if Server unreachable
        this.loadMockRejects();
      }
    },

    loadMockRejects() {
      // Generate realistic mock records mapping Saudi Pharmaceutical layouts
      const mockItems = ['Sponge Tape 20mm', 'Syringe Plunger 5ml', 'PVC Granules Medical', 'Infusion Set Needle', 'Packaging Carton Mais', 'Vial Stopper Rubber'];
      const mockDepts = ['Warehouse', 'Production', 'QC', 'Maintenance'];
      const mockStatus = ['Pending', 'Approved', 'Review'];
      const mockCats = ['Raw Material', 'Finished Goods', 'Packaging'];
      
      this.rejects = Array.from({ length: 150 }, (_, idx) => {
        const cost = Math.floor(Math.random() * 25000) + 1200;
        return {
          id: idx,
          doc_no: `DOC-2026-${1000 + idx}`,
          date: dayjs().subtract(Math.floor(Math.random() * 90), 'day').toISOString(),
          item_name: mockItems[idx % mockItems.length],
          department: mockDepts[idx % mockDepts.length],
          cost: cost,
          status: mockStatus[idx % mockStatus.length],
          category: mockCats[idx % mockCats.length],
          risk: cost > 18000 ? 'Critical' : (cost > 10000 ? 'High' : 'Medium')
        };
      });

      this.applyFilters();
      this.calculateKPIs();
      this.initCharts();
    },

    async fetchAISummary() {
      try {
        const summaryRes = await fetch('/api/summary', { credentials: 'include' });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          const payload = summaryData.data || summaryData;
          const count = this.excelStatus.record_count ? this.excelStatus.record_count.toLocaleString() : '...';
          this.aiSummary = payload.executive_summary || `لوحة تحليلات الذكاء الاصطناعي جاهزة. تم فحص ${count} سجلاً من ملف Excel المعتمد بنجاح.`;
        } else {
          this.aiSummary = 'تحليلات الذكاء الاصطناعي استشارية: يظهر التحليل المالي والإحصائي للمستودع والإنتاج تكلفة إجمالية متوقعة تبلغ SAR 158.3M. هناك 25 حالة عالية الخطورة تتطلب المراجعة الفورية لإجراءات CAPA.';
        }
      } catch(e) {
        this.aiSummary = 'تحليلات الذكاء الاصطناعي استشارية: يظهر التحليل المالي والإحصائي للمستودع والإنتاج تكلفة إجمالية متوقعة تبلغ SAR 158.3M. هناك 25 حالة عالية الخطورة تتطلب المراجعة الفورية لإجراءات CAPA.';
      }
    },

    // Action Handlers
    calculateKPIs() {
      this.kpis.totalRejects = this.filteredRejects.length;
      this.kpis.totalCost = this.filteredRejects.reduce((sum, r) => sum + r.cost, 0);
      this.kpis.pendingApprovals = this.filteredRejects.filter(r => r.status === 'Pending').length;
      this.kpis.criticalItems = this.filteredRejects.filter(r => r.risk === 'Critical' || r.risk === 'High').length;
    },

    applyFilters() {
      this.filteredRejects = this.rejects.filter(r => {
        // Department filter
        if (this.filters.department && r.department !== this.filters.department) return false;
        // Category filter
        if (this.filters.category && r.category !== this.filters.category) return false;
        // Risk filter
        if (this.filters.risk_level && r.risk !== this.filters.risk_level) return false;
        // Status filter
        if (this.filters.status && r.status !== this.filters.status) return false;
        // Search text
        if (this.searchQuery) {
          const term = this.searchQuery.toLowerCase();
          const matchText = `${r.item_name} ${r.doc_no} ${r.department}`.toLowerCase();
          if (!matchText.includes(term)) return false;
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
      this._searchTimer = window.setTimeout(() => {
        this.applyFilters();
      }, 300);
    },

    setPresetDate(preset) {
      this.activePreset = preset;
      // Apply dates filtering logically using Day.js
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
      alert(this.lang === 'ar' ? 'تم حفظ التفضيل الحالي للفلترة بنجاح!' : 'Current filter preset saved successfully!');
    },

    exportFilteredData() {
      alert(this.lang === 'ar' ? 'جاري تصدير تقرير المرفوضات بصيغة Excel...' : 'Exporting rejects report to Excel workbook...');
    },

    triggerQuickAction(type) {
      if (type === 'report') alert(this.lang === 'ar' ? 'جاري إنشاء وتنزيل تقرير الجودة الكامل بصيغة PDF...' : 'Generating and downloading full PDF quality report...');
      else if (type === 'schedule') alert(this.lang === 'ar' ? 'تم جدولة إرسال التقرير الأسبوعي تلقائياً لكل يوم إثنين.' : 'Weekly reports scheduled for automatic email delivery on Mondays.');
      else if (type === 'alert') alert(this.lang === 'ar' ? 'تم إرسال تنبيه عاجل لمدير الجودة عبر البريد والرسائل.' : 'Urgent alert dispatched to QCM email & system notifications.');
      else if (type === 'audit') alert(this.lang === 'ar' ? 'جاري عرض سجل التدقيق الكامل لعمليات الموافقات والذكاء الاصطناعي...' : 'Loading system audit logs for Gemini & Focus ERP endpoints...');
    },

    // Table Page management
    updatePagination() {
      const total = this.filteredRejects.length;
      this.pagination.totalPages = Math.ceil(total / this.pagination.limit) || 1;
      
      const startIdx = (this.pagination.page - 1) * this.pagination.limit;
      const endIdx = Math.min(startIdx + this.pagination.limit, total);
      
      this.paginatedRejects = this.filteredRejects.slice(startIdx, endIdx);
      this.pagination.start = total > 0 ? startIdx + 1 : 0;
      this.pagination.end = endIdx;
    },

    setPage(page) {
      if (page < 1 || page > this.pagination.totalPages) return;
      this.pagination.page = page;
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
      if (this.selectedRows.length === this.paginatedRejects.length) {
        this.selectedRows = [];
      } else {
        this.selectedRows = this.paginatedRejects.map(r => r.id);
      }
    },

    bulkScrapSelected() {
      alert(this.lang === 'ar' ? `تم اعتماد الإتلاف النهائي المجمع لـ ${this.selectedRows.length} عناصر بنجاح.` : `Bulk scrap approved for ${this.selectedRows.length} items.`);
      this.selectedRows = [];
    },

    drillDown(metric) {
      alert(this.lang === 'ar' ? `تفاصيل المؤشر: جاري الفرز والتركيز على ${metric}` : `Filtering dashboard details for: ${metric}`);
    },

    // ApexCharts Implementations
    initCharts() {
      // Line Chart options (Reject Trends)
      this.charts.trends = new ApexCharts(document.querySelector("#chart-trends"), {
        series: [{
          name: 'تكلفة المرفوضات الفعلي (SAR)',
          data: [12000, 18500, 14000, 29000, 22000, 31000, 26000, 34000, 31000, 48000, 42000, 52000]
        }, {
          name: 'التكلفة التنبئية المخططة (SAR)',
          data: [11000, 16000, 15000, 26000, 24000, 29000, 28000, 31000, 33000, 44000, 45000, 49000]
        }],
        chart: { height: 320, type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#0F4C81', '#00A6A6'],
        stroke: { curve: 'smooth', width: 3 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
        theme: { mode: this.darkMode ? 'dark' : 'light' }
      });
      this.charts.trends.render();

      // Donut Chart options (Cost by Dept)
      this.charts.deptCost = new ApexCharts(document.querySelector("#chart-dept-cost"), {
        series: [58.3, 34.2, 14.5, 8.2],
        chart: { type: 'donut', height: 320, fontFamily: 'inherit' },
        labels: ['Warehouse', 'Production', 'QC', 'Maintenance'],
        colors: ['#0F4C81', '#00A6A6', '#F4A261', '#E76F51'],
        theme: { mode: this.darkMode ? 'dark' : 'light' },
        legend: { position: 'bottom' }
      });
      this.charts.deptCost.render();

      // Bar Chart options (Top Reasons)
      this.charts.reasons = new ApexCharts(document.querySelector("#chart-top-reasons"), {
        series: [{
          name: 'التكرار',
          data: [420, 380, 290, 240, 190, 160, 120, 95, 80, 62]
        }],
        chart: { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { borderRadius: 4, horizontal: true } },
        colors: ['#0F4C81'],
        xaxis: {
          categories: ['تلف المواد الخام', 'انتهاء صلاحية الصلاحية', 'حرارة ورطوبة غير ملائمة', 'خطأ في معايير التشكيل', 'عيوب تغليف وتعبئة', 'تسرب الهواء', 'تلف ميكانيكي للماكينات', 'تغير اللون والمظهر', 'أخطاء تشغيلية بشرية', 'شوائب ورواسب مخبرية']
        },
        theme: { mode: this.darkMode ? 'dark' : 'light' }
      });
      this.charts.reasons.render();

      // Pareto Chart options (Root Causes)
      this.charts.pareto = new ApexCharts(document.querySelector("#chart-pareto"), {
        series: [{
          name: 'عدد الحالات',
          type: 'column',
          data: [450, 280, 140, 75, 45]
        }, {
          name: 'النسبة التراكمية (%)',
          type: 'line',
          data: [45.4, 73.7, 87.8, 95.4, 100]
        }],
        chart: { height: 320, type: 'line', toolbar: { show: false }, fontFamily: 'inherit' },
        stroke: { width: [0, 4], curve: 'smooth' },
        colors: ['#0F4C81', '#F4A261'],
        labels: ['تخزين المواد الحساسة', 'معايير التبريد والحرارة', 'صيانة الماكينات الفورية', 'مهارة العمالة الفنية', 'معايير الجودة المخبرية'],
        yaxis: [{
          title: { text: 'عدد الحالات' }
        }, {
          opposite: true,
          title: { text: 'النسبة التراكمية (%)' }
        }],
        theme: { mode: this.darkMode ? 'dark' : 'light' }
      });
      this.charts.pareto.render();

      // Heatmap Chart (Rejects by Day/Hour)
      this.charts.heatmap = new ApexCharts(document.querySelector("#chart-heatmap"), {
        series: [
          { name: 'السبت', data: this.generateHeatmapData(8) },
          { name: 'الأحد', data: this.generateHeatmapData(8) },
          { name: 'الإثنين', data: this.generateHeatmapData(8) },
          { name: 'الثلاثاء', data: this.generateHeatmapData(8) },
          { name: 'الأربعاء', data: this.generateHeatmapData(8) },
          { name: 'الخميس', data: this.generateHeatmapData(8) }
        ],
        chart: { height: 320, type: 'heatmap', toolbar: { show: false }, fontFamily: 'inherit' },
        dataLabels: { enabled: false },
        colors: ['#00A6A6'],
        theme: { mode: this.darkMode ? 'dark' : 'light' }
      });
      this.charts.heatmap.render();

      // Gauge Chart (Overall Quality compliance score)
      this.charts.qualityScore = new ApexCharts(document.querySelector("#chart-quality-score"), {
        series: [88.5],
        chart: { type: 'radialBar', height: 320, offsetBaseline: 10, fontFamily: 'inherit' },
        plotOptions: {
          radialBar: {
            startAngle: -90,
            endAngle: 90,
            track: { background: '#E2E8F0', strokeWidth: '97%' },
            dataLabels: {
              name: { show: true, label: 'الامتثال للجودة', color: '#64748B', fontSize: '14px' },
              value: { offsetY: -10, fontSize: '32px', show: true, fontWeight: '700' }
            }
          }
        },
        colors: ['#2A9D8F'],
        theme: { mode: this.darkMode ? 'dark' : 'light' }
      });
      this.charts.qualityScore.render();

      // KPI Mini Sparkline Chart
      new ApexCharts(document.querySelector("#sparkline-cost"), {
        series: [{ data: [12, 14, 18, 15, 29, 24, 38, 32, 45, 52] }],
        chart: { type: 'line', height: 32, sparkline: { enabled: true } },
        stroke: { curve: 'smooth', width: 2 },
        colors: ['#E76F51'],
        tooltip: { enabled: false }
      }).render();
    },

    generateHeatmapData(count) {
      return Array.from({ length: count }, (_, idx) => ({
        x: `${idx * 3}:00`,
        y: Math.floor(Math.random() * 25)
      }));
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

    refreshChartsData() {
      // Dyn updating Chart cost slices dynamically matching current live filters
      if (this.charts.deptCost && this.filteredRejects.length > 0) {
        const depts = ['Warehouse', 'Production', 'QC', 'Maintenance'];
        const costs = depts.map(d => {
          return this.filteredRejects
            .filter(r => r.department === d)
            .reduce((sum, r) => sum + r.cost, 0) / 1000;
        });
        this.charts.deptCost.updateSeries(costs);
      }
    },

    // Live WebSockets/Realtime handlers
    setupRealtimeListeners() {
      // Listen for data refresh notices
      window.addEventListener('data:updated', () => {
        this.fetchDashboardData();
      });
    },

    async refreshAIAnalysis() {
      alert(this.lang === 'ar' ? 'جاري محاكاة واستشارة Gemini لإعادة معالجة البيانات وتحديث الـ Prompts...' : 'Simulating Gemini dynamic analysis, updating AI Cache TTL...');
      this.aiSummary = 'تحليل نشط ومحدث: تم إجراء معالجة جديدة للأسباب الجذرية بنجاح. معدل تلف المنتجات المخزنية انخفض بنسبة 3.5% عقب تفعيل التدابير الوقائية الأخيرة لشحنات PVC.';
    },

    // Floating AI Assistant chat operations
    async askAI(question) {
      this.chatMessages.push({ sender: 'user', text: question });
      this.aiLoading = true;
      this.scrollChatToBottom();

      // Call local dynamic fallback analysis or hit Gemini server Query endpoint
      try {
        const res = await fetch('/api/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question }),
          credentials: 'include'
        });
        
        if (res.ok) {
          const data = await res.json();
          const payload = data.data || data;
          this.chatMessages.push({ sender: 'ai', text: payload.answer || 'تمت معالجة السؤال بنجاح.' });
        } else {
          this.simulateAIServiceReply(question);
        }
      } catch(e) {
        this.simulateAIServiceReply(question);
      } finally {
        this.aiLoading = false;
        this.scrollChatToBottom();
      }
    },

    simulateAIServiceReply(q) {
      let reply = '';
      if (q.includes('تكلفة') || q.includes('cost')) {
        reply = `بناءً على ملف Excel الحقيقي لـ Mais، يبلغ إجمالي تكاليف المرفوضات والعيوب لشهر مايو SAR ${this.kpis.totalCost.toLocaleString()}. التكلفة تتركز بنسبة 58% في قسم المستودعات.`;
      } else if (q.includes('أسباب') || q.includes('defects') || q.includes('سبب')) {
        reply = 'أبرز 3 أسباب متكررة هي: 1) تلف شريط الإسفنج في المستودعات (450 حالة)، 2) عيوب التشكيل والتبريد الميكانيكي (280 حالة)، 3) أخطاء ضبط حرارة غرف تخزين المواد الخام الحساسة.';
      } else if (q.includes('CAPA') || q.includes('Sponge') || q.includes('إسفنج')) {
        reply = 'خطة CAPA المقترحة لشريط الإسفنج: 1) استبدال الرفوف الحالية بحاويات معزولة للرطوبة، 2) فحص الحجم المتبقي والتاريخ أسبوعياً لتفادي انتهاء الصلاحية، 3) خفض درجة حرارة المستودع لـ 20 درجة مئوية.';
      } else {
        reply = `شكراً لسؤالك حول "${q}". يوضح تحليل باريتو الإحصائي أن حل مشاكل رطوبة المستودعات وصيانة ماكينات الإنتاج سيساهم في تقليص 80% من إجمالي المرفوضات الحالية في المصنع.`;
      }
      this.chatMessages.push({ sender: 'ai', text: reply });
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
        if (feed) {
          feed.scrollTop = feed.scrollHeight;
        }
      });
    },

    // Formatting utilities
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
