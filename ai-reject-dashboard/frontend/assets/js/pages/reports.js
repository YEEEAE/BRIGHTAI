/**
 * Documentation:
 * - docs/01-pages/reports-page.md
 * - docs/04-api/reports-api.md
 */
function reportsApp() {
  return {
    // Theme & Language Settings
    theme: localStorage.getItem('theme') || 'light',
    lang: document.documentElement.lang || 'ar',
    userRole: 'Quality Manager (QAM)',
    conversationId: 'conv_' + Math.random().toString(36).substring(2, 11),
    
    // State
    activeTemplate: 'custom',
    dragOver: false,
    exportLoading: false,
    formatType: '',
    
    // Report builder configuration
    droppedSections: [],
    filters: {
      dateRange: 'last_month',
      fromDate: '',
      toDate: '',
      department: 'all'
    },
    security: {
      watermark: 'CONFIDENTIAL',
      expiryDate: ''
    },
    schedule: {
      frequency: 'weekly',
      email: '',
      template: 'executive'
    },
    
    // Mock lists and names
    historyList: [],
    reportStats: {
      loaded: false,
      source: 'unknown',
      record_count: 0,
      total_cost: 0,
      quality_efficiency: 0,
      average_cost: 0,
      pending_capa: 0,
      closed_capa: 0,
      overdue_capa: 0,
      top_departments: [],
      top_causes: [],
      file_modified_at: '',
      hash_short: ''
    },

    init() {
      // Sync theme
      document.documentElement.setAttribute('data-theme', this.theme);
      if (this.theme === 'dark') document.body.classList.add('dark-mode');
      
      this.loadHistory();
      this.loadReportStats();
      this.loadDefaultTemplate();
      this.setupRealtimeListeners();
    },

    setupRealtimeListeners() {
      window.addEventListener('data:updated', () => {
        this.loadHistory();
        this.loadReportStats();
      });
    },

    async loadReportStats() {
      try {
        const res = await fetch('/api/rejects');
        if (!res.ok) throw new Error('rejects fetch failed');
        const response = await res.json();
        const payload = response.data || {};
        const records = payload.rejects || [];
        const totalCost = records.reduce((sum, record) => sum + (Number(record.cost) || 0), 0);
        const approvedOrReviewed = records.filter((record) => ['Approved', 'Review'].includes(record.approval_status)).length;
        const groupByDepartment = {};
        const groupByCause = {};

        records.forEach((record) => {
          const dept = record.department || 'غير محدد';
          const cause = record.root_cause || record.reason || 'غير محدد';
          groupByDepartment[dept] = groupByDepartment[dept] || { label: dept, count: 0, total_cost: 0 };
          groupByDepartment[dept].count += 1;
          groupByDepartment[dept].total_cost += Number(record.cost) || 0;
          groupByCause[cause] = (groupByCause[cause] || 0) + 1;
        });

        const hash = response.hash || payload.hash || '';
        this.reportStats = {
          loaded: true,
          source: response.source || 'unknown',
          record_count: records.length,
          total_cost: Math.round(totalCost * 100) / 100,
          quality_efficiency: records.length ? Math.round((approvedOrReviewed / records.length) * 1000) / 10 : 0,
          average_cost: records.length ? Math.round((totalCost / records.length) * 100) / 100 : 0,
          pending_capa: records.filter((record) => record.capa_required && record.approval_status !== 'Approved').length,
          closed_capa: records.filter((record) => record.capa_required && record.approval_status === 'Approved').length,
          overdue_capa: records.filter((record) => record.capa_required && Number(record.days_pending) >= 15).length,
          top_departments: Object.values(groupByDepartment).sort((a, b) => b.total_cost - a.total_cost).slice(0, 3),
          top_causes: Object.keys(groupByCause).sort((a, b) => groupByCause[b] - groupByCause[a]).slice(0, 3).map((label) => ({ label, count: groupByCause[label] })),
          file_modified_at: payload.file_modified_at || '',
          hash_short: hash ? hash.substring(0, 12) : ''
        };
      } catch (e) {
        this.reportStats = { ...this.reportStats, loaded: false };
      }
    },

    money(value) {
      return 'SAR ' + (Number(value) || 0).toLocaleString(this.lang === 'ar' ? 'ar-SA' : 'en-US');
    },

    reportSummaryText() {
      if (!this.reportStats.loaded) {
        return this.lang === 'ar'
          ? 'المعاينة تنتظر بيانات API الحقيقية. سيتم توليد التقرير النهائي من سجلات النظام عند التصدير.'
          : 'Preview is waiting for live API data. Final exports are generated from system records.';
      }
      const topCause = this.reportStats.top_causes[0];
      const causeText = topCause
        ? (this.lang === 'ar' ? `أكثر سبب متكرر هو ${topCause.label} بعدد ${topCause.count} حالة.` : `Top cause is ${topCause.label} with ${topCause.count} cases.`)
        : (this.lang === 'ar' ? 'لا توجد أسباب جذرية متاحة في البيانات.' : 'No root causes are available in the data.');
      return this.lang === 'ar'
        ? `تم تحليل ${this.reportStats.record_count} سجل من API بإجمالي تكلفة ${this.money(this.reportStats.total_cost)}. ${causeText}`
        : `${this.reportStats.record_count} API records analyzed with total cost ${this.money(this.reportStats.total_cost)}. ${causeText}`;
    },
    
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', this.theme);
      document.documentElement.setAttribute('data-theme', this.theme);
      if (this.theme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    },

    toggleLanguage() {
      this.lang = this.lang === 'ar' ? 'en' : 'ar';
      document.documentElement.lang = this.lang;
      document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
      this.init();
    },

    loadDefaultTemplate() {
      this.droppedSections = ['cover', 'summary', 'kpis', 'signatures'];
    },

    selectTemplate(type) {
      this.activeTemplate = type;
      if (type === 'executive') {
        this.droppedSections = ['cover', 'summary', 'kpis', 'pareto', 'signatures'];
        this.security.watermark = 'CONFIDENTIAL';
      } else if (type === 'financial') {
        this.droppedSections = ['cover', 'kpis', 'financials', 'pareto', 'signatures'];
        this.security.watermark = 'NONE';
      } else if (type === 'quality') {
        this.droppedSections = ['cover', 'summary', 'kpis', 'capa', 'audit', 'signatures'];
        this.security.watermark = 'INTERNAL';
      } else if (type === 'production') {
        this.droppedSections = ['cover', 'kpis', 'pareto', 'audit', 'signatures'];
        this.security.watermark = 'NONE';
      } else if (type === 'custom') {
        this.droppedSections = [];
      }
    },

    // Drag & Drop Handlers
    dragStart(e, section) {
      e.dataTransfer.setData('text/plain', section);
    },

    handleDrop(e) {
      this.dragOver = false;
      const section = e.dataTransfer.getData('text/plain');
      if (section && !this.droppedSections.includes(section)) {
        this.droppedSections.push(section);
        this.activeTemplate = 'custom';
      }
    },

    removeDroppedSection(idx) {
      this.droppedSections.splice(idx, 1);
      this.activeTemplate = 'custom';
    },

    clearDroppedSections() {
      this.droppedSections = [];
      this.activeTemplate = 'custom';
    },

    getSectionTitle(sec) {
      const titles = {
        'cover': this.lang === 'ar' ? '📖 صفحة الغلاف والترويسة' : '📖 Cover Page',
        'summary': this.lang === 'ar' ? '🤖 إيجاز الذكاء الاصطناعي للمدير' : '🤖 AI Summary Brief',
        'kpis': this.lang === 'ar' ? '📈 بطاقات مؤشرات الأداء' : '📈 KPIs Summary Cards',
        'financials': this.lang === 'ar' ? '💵 مصفوفة الخسائر والتحليل المالي' : '💵 Loss & Finance Analysis',
        'pareto': this.lang === 'ar' ? '📊 عيوب المرفوضات (Pareto)' : '📊 Reject Defect Pareto',
        'capa': this.lang === 'ar' ? '🧪 جدول وإجراءات كانبان CAPA' : '🧪 CAPA Quality Board',
        'audit': this.lang === 'ar' ? '🏛️ سجل الموافقات وقائمة التدقيق' : '🏛️ Approvals & Checklist',
        'signatures': this.lang === 'ar' ? '✍️ توقيعات الاعتماد الرقمي' : '✍️ Digital Signatures'
      };
      return titles[sec] || sec;
    },

    // Trigger Report Generation
    async triggerExport(format) {
      this.exportLoading = true;
      this.formatType = format;
      
      try {
        const response = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: this.activeTemplate,
            format: format,
            sections: this.droppedSections,
            filters: this.filters,
            security: this.security,
            user: this.userRole
          })
        });

        if (!response.ok) throw new Error('Generation failed');
        
        const data = await response.json();
        const payload = data.data || data;
        
        // Proactively download file
        window.location.href = '/api/reports/download/' + payload.id;
        
        // Reload history
        this.loadHistory();
        
        if (window.BrightNotifications) {
          window.BrightNotifications.toast({
            type: 'success',
            title: this.lang === 'ar' ? 'توليد التقرير' : 'Report Generated',
            message: this.lang === 'ar' ? 'تم توليد التقرير وتنزيله بنجاح!' : 'Report generated and downloaded successfully!'
          });
        }
      } catch (err) {
        if (window.BrightNotifications) {
          window.BrightNotifications.toast({
            type: 'error',
            title: this.lang === 'ar' ? 'فشل التوليد' : 'Generation Failed',
            message: this.lang === 'ar' ? 'خطأ في توليد التقرير. تأكد من تشغيل خادم الواجهة الخلفية.' : 'Failed to generate report. Make sure backend is running.'
          });
        }
      } finally {
        this.exportLoading = false;
        this.formatType = '';
      }
    },

    // Load History list
    async loadHistory() {
      try {
        const res = await fetch('/api/reports/history');
        if (res.ok) {
          const data = await res.json();
          this.historyList = data.data || data;
        }
      } catch (e) {
        this.historyList = [];
      }
    },

    // Save Schedule
    async saveSchedule() {
      try {
        const response = await fetch('/api/reports/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.schedule)
        });
        if (response.ok) {
          if (window.BrightNotifications) {
            window.BrightNotifications.toast({
              type: 'success',
              title: this.lang === 'ar' ? 'حفظ الجدولة' : 'Schedule Saved',
              message: this.lang === 'ar' ? 'تم تفعيل جدولة التقرير الدوري بنجاح!' : 'Automated report schedule saved successfully!'
            });
          }
        } else {
          throw new Error('Schedule failed');
        }
      } catch (e) {
        if (window.BrightNotifications) {
          window.BrightNotifications.toast({
            type: 'success',
            title: this.lang === 'ar' ? 'جدولة تجريبية' : 'Simulated Schedule',
            message: this.lang === 'ar' ? 'تم محاكاة حفظ جدولة التقرير الدوري بنجاح!' : 'Simulated report schedule saved successfully!'
          });
        }
      }
    }
  };
}
