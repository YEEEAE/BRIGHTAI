/**
 * Documentation:
 * - docs/01-pages/quality-page.md
 * - docs/04-api/ai-api.md
 */
function qualityApp() {
  return {
    sidebarCollapsed: false,
    darkMode: false,
    lang: 'ar',
    isLoading: true,
    error: null,
    capaLoading: false,
    capaModalOpen: false,
    capaMarkdown: '',

    dataSource: 'unknown',
    lastExcelUpdate: null,

    kpis: {
      qualityScore: null,
      ncrRate: null,
      isoScore: null,
      auditReadiness: 0
    },

    checklist: {
      ncr: false,
      oos: false,
      calibration: false,
      sop: false
    },

    kanban: { open: [], progress: [], verify: [], closed: [] },
    whysSteps: [],

    init() {
      this.initThemeAndLang();
      this.loadQualityData();
      this.$watch('checklist', () => this.calculateReadiness());
      this.setupRealtimeListeners();
    },

    setupRealtimeListeners() {
      window.addEventListener('data:updated', () => this.loadQualityData());
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
    },

    toggleLanguage() {
      this.lang = this.lang === 'ar' ? 'en' : 'ar';
      localStorage.setItem('lang', this.lang);
      document.documentElement.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
      this.setWhysFromRecord(this.kanban.open[0]);
    },

    async loadQualityData() {
      this.isLoading = true;
      this.error = null;
      try {
        const pageData = await BrightAPI.loadAllPageData('quality');
        if (pageData.status) {
          this.lastExcelUpdate = pageData.status.file_modified_at || pageData.status.last_load || null;
          this.dataSource = pageData.status.file_exists ? 'excel_live' : (pageData.status.warnings?.some(w => w.includes('Demo')) ? 'demo_fallback' : 'cache');
        }
        const rejects = Array.isArray(pageData.rejects) ? pageData.rejects : [];
        this.dataSource = BrightAPI.getDataSource();
        this.applyQualityData(rejects);
      } catch (e) {
        console.error('loadQualityData:', e);
        this.error = this.lang === 'ar' ? 'تعذر تحميل بيانات الجودة من API.' : 'Unable to load quality API data.';
        this.applyQualityData([]);
      } finally {
        this.isLoading = false;
      }
    },

    applyQualityData(rejects) {
      const records = rejects.map((record, index) => ({ ...record, id: record.id ?? record.doc_no ?? index }));
      const riskRecords = records.filter((record) => Number(record.risk_score) >= 70);
      const approved = records.filter((record) => ['Approved', 'Review'].includes(record.approval_status || record.status)).length;
      this.kpis.qualityScore = records.length ? Math.round((approved / records.length) * 1000) / 10 : null;
      this.kpis.ncrRate = records.length ? Math.round((riskRecords.length / records.length) * 1000) / 10 : null;
      this.kpis.isoScore = records.length ? Math.max(0, Math.round((100 - this.kpis.ncrRate) * 10) / 10) : null;

      this.kanban = {
        open: riskRecords.filter((record) => !['Approved', 'Closed'].includes(record.approval_status || record.status)).map((record) => this.toCapaCard(record)),
        progress: [],
        verify: riskRecords.filter((record) => (record.approval_status || record.status) === 'Review').map((record) => this.toCapaCard(record)),
        closed: riskRecords.filter((record) => (record.approval_status || record.status) === 'Approved').map((record) => this.toCapaCard(record))
      };
      this.checklist.ncr = riskRecords.length > 0;
      this.checklist.sop = this.kanban.open.length === 0 && riskRecords.length > 0;
      this.calculateReadiness();
      this.setWhysFromRecord(this.kanban.open[0] || this.kanban.verify[0] || this.kanban.closed[0]);
    },

    toCapaCard(record) {
      return {
        id: record.id,
        title: record.root_cause || record.reason || record.item_name || 'CAPA',
        owner: record.department || 'QCM',
        priority: record.risk_level || (Number(record.risk_score) >= 85 ? 'Critical' : 'High'),
        age: Number(record.days_pending) ? `${record.days_pending} يوم` : (this.lang === 'ar' ? 'من بيانات API' : 'From API'),
        record
      };
    },

    calculateReadiness() {
      const totalChecks = Object.keys(this.checklist).length;
      const checkedCount = Object.values(this.checklist).filter(Boolean).length;
      this.kpis.auditReadiness = totalChecks ? Math.round((checkedCount / totalChecks) * 100) : 0;
    },

    moveKanbanCard(cardId, nextStage) {
      let cardToMove = null;
      Object.keys(this.kanban).forEach(col => {
        const found = this.kanban[col].find(c => c.id === cardId);
        if (found) {
          cardToMove = found;
          this.kanban[col] = this.kanban[col].filter(c => c.id !== cardId);
        }
      });
      if (!cardToMove) return;
      cardToMove.age = this.lang === 'ar' ? 'تم النقل الآن' : 'Just moved';
      this.kanban[nextStage].push(cardToMove);
    },

    async generateCapa(card) {
      if (!card?.record) return;
      this.capaLoading = true;
      this.capaModalOpen = true;
      this.capaMarkdown = this.lang === 'ar' ? 'جاري توليد CAPA من الخادم...' : 'Generating CAPA from API...';
      try {
        const result = await BrightAPI.generateCapa(card.record);
        this.capaMarkdown = this.formatCapaMarkdown(result);
      } catch (e) {
        console.error('generateCapa:', e);
        this.capaMarkdown = this.lang === 'ar' ? 'تعذر توليد CAPA من API.' : 'Unable to generate CAPA from API.';
      } finally {
        this.capaLoading = false;
      }
    },

    formatCapaMarkdown(result) {
      if (typeof result === 'string') return result;
      const capa = result?.capa || result || {};
      return [
        `### ${capa.title || 'CAPA Recommendation'}`,
        '',
        `**Root cause:** ${capa.root_cause || capa.rootCause || '-'}`,
        `**Corrective action:** ${capa.corrective_action || capa.correctiveAction || '-'}`,
        `**Preventive action:** ${capa.preventive_action || capa.preventiveAction || '-'}`,
        `**Owner:** ${capa.owner_suggestion || capa.owner || '-'}`,
        `**Due date:** ${capa.due_date || capa.dueDate || '-'}`
      ].join('\n');
    },

    renderMarkdown(markdown) {
      return String(markdown || '')
        .replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    },

    metricText(value, suffix = '%') {
      return Number.isFinite(value) ? `${value}${suffix}` : (this.lang === 'ar' ? 'بيانات غير كافية' : 'Insufficient data');
    },

    setWhysFromRecord(card) {
      if (!card) {
        this.whysSteps = [{ id: 1, text: this.lang === 'ar' ? 'لا توجد حالة عالية الخطورة كافية للتحقيق.' : 'No high-risk case is available for investigation.' }];
        return;
      }
      const item = card.record.item_name || card.title;
      const reason = card.record.reason || card.record.root_cause || card.title;
      this.whysSteps = this.lang === 'ar'
        ? [
          { id: 1, text: `لماذا ظهرت حالة رفض في ${item}؟` },
          { id: 2, text: reason },
          { id: 3, text: 'لماذا لم يتم اكتشاف الانحراف قبل تسجيل الرفض؟' }
        ]
        : [
          { id: 1, text: `Why did ${item} reach reject status?` },
          { id: 2, text: reason },
          { id: 3, text: 'Why was the deviation not detected earlier?' }
        ];
    },

    generateNextWhy() {
      const nextId = this.whysSteps.length + 1;
      if (nextId > 5) return;
      this.whysSteps.push({
        id: nextId,
        text: this.lang === 'ar'
          ? 'يتطلب استكمال التحقيق مراجعة سجلات العملية والوردية من API.'
          : 'Completing the investigation requires reviewing process and shift records from the API.'
      });
    },

    triggerIshikawaInfo(category) {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'info',
          title: this.lang === 'ar' ? 'تحليل سبب جذري' : 'Root Cause Signal',
          message: category
        });
      }
    },

    saveWhysInvestigation() {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'success',
          title: this.lang === 'ar' ? 'حفظ التحقيق' : 'Investigation Saved',
          message: this.lang === 'ar' ? 'تم حفظ التحقيق محلياً في حالة الواجهة.' : 'Investigation saved in the current UI state.'
        });
      }
    },

    exportQMSReport() {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'info',
          title: this.lang === 'ar' ? 'تقرير الجودة' : 'QMS Report',
          message: this.lang === 'ar' ? 'جاري تجهيز تقرير الجودة من بيانات API الحالية.' : 'Generating QMS report from current API data.'
        });
      }
    }
  };
}
