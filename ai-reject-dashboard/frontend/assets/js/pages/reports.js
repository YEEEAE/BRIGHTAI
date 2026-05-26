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

    init() {
      // Sync theme
      document.documentElement.setAttribute('data-theme', this.theme);
      if (this.theme === 'dark') document.body.classList.add('dark-mode');
      
      this.loadHistory();
      this.loadDefaultTemplate();
      this.setupRealtimeListeners();
    },

    setupRealtimeListeners() {
      window.addEventListener('data:updated', () => this.loadHistory());
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
        // Mock history if backend is offline
        this.historyList = [
          { id: 'rep-mock-01', name: 'Q1 Quality Audit Brief', format: 'pdf', createdBy: 'Quality Manager', createdAt: new Date() - 36000000 },
          { id: 'rep-mock-02', name: 'Financial Quality Loss Analysis', format: 'excel', createdBy: 'CFO', createdAt: new Date() - 86400000 }
        ];
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
