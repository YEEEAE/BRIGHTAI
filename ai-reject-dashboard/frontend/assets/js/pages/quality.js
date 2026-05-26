/**
 * Documentation:
 * - docs/01-pages/quality-page.md
 * - docs/04-api/ai-api.md
 */
function qualityApp() {
  return {
    // UI Layout
    sidebarCollapsed: false,
    darkMode: false,
    lang: 'ar',
    
    // QMS metrics
    kpis: {
      qualityScore: 88.5,
      ncrRate: 2.4,
      isoScore: 92,
      auditReadiness: 75
    },

    // Checklist states
    checklist: {
      ncr: true,
      oos: false,
      calibration: true,
      sop: false
    },

    // CAPA Kanban Columns
    kanban: {
      open: [
        { id: 1, title: 'عزل رطوبة المستودع الثاني لـ Sponge Tape', owner: 'إبراهيم علوان', priority: 'Critical', age: 'منذ 3 أيام' },
        { id: 2, title: 'إرسال مطالبة مالية لمورد الكرتون Mais', owner: 'رائد الشهري', priority: 'High', age: 'منذ 5 أيام' }
      ],
      progress: [
        { id: 3, title: 'معايرة وإصلاح الملقب لـ Extruder-4', owner: 'محمد العتيبي', priority: 'High', age: 'قيد العمل' }
      ],
      verify: [
        { id: 4, title: 'فحص حبيبات الـ PVC الدوائية الملوثة', owner: 'أحمد القرني', priority: 'Medium', age: 'انتظار التحقق' }
      ],
      closed: [
        { id: 5, title: 'أرشفة وثائق إتلاف Lot C10 مع البلدية', owner: 'خالد السديري', priority: 'Low', age: 'تم الإغلاق' }
      ]
    },

    // Whys investigation steps
    whysSteps: [
      { id: 1, text: 'لماذا حدث تلف في شريط إسفنجي Lot 2026-98؟' },
      { id: 2, text: 'بسبب تدهور الصمغ والتصاق المواد ببعضها.' },
      { id: 3, text: 'لماذا تدهور الصمغ والتصق؟' },
      { id: 4, text: 'بسبب ارتفاع مستويات الرطوبة في المستودع الثاني لـ 68%.' }
    ],

    // Core Functions
    init() {
      this.initThemeAndLang();
      this.calculateReadiness();
      
      // Watch for checklist changes to dynamically recalculate audit score
      this.$watch('checklist', () => this.calculateReadiness());
      this.setupRealtimeListeners();
    },

    setupRealtimeListeners() {
      window.addEventListener('data:updated', () => {
        console.log('🔄 [BrightAI QMS] Realtime Excel update event processed.');
      });
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
    },

    toggleLanguage() {
      this.lang = this.lang === 'ar' ? 'en' : 'ar';
      localStorage.setItem('lang', this.lang);
      document.documentElement.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
      
      if (this.lang === 'ar') {
        this.whysSteps = [
          { id: 1, text: 'لماذا حدث تلف في شريط إسفنجي Lot 2026-98؟' },
          { id: 2, text: 'بسبب تدهور الصمغ والتصاق المواد ببعضها.' },
          { id: 3, text: 'لماذا تدهور الصمغ والتصق؟' },
          { id: 4, text: 'بسبب ارتفاع مستويات الرطوبة في المستودع الثاني لـ 68%.' }
        ];
      } else {
        this.whysSteps = [
          { id: 1, text: 'Why did Sponge Tape Lot 2026-98 fail?' },
          { id: 2, text: 'Because of adhesive degradation and fusion.' },
          { id: 3, text: 'Why did the adhesive degrade?' },
          { id: 4, text: 'Because humidity levels in Warehouse 2 exceeded 68%.' }
        ];
      }
    },

    calculateReadiness() {
      const totalChecks = Object.keys(this.checklist).length;
      const checkedCount = Object.values(this.checklist).filter(v => v === true).length;
      this.kpis.auditReadiness = Math.round((checkedCount / totalChecks) * 100);
    },

    // Kanban Card Mover (Simple reactive states)
    moveKanbanCard(cardId, nextStage) {
      let cardToMove = null;
      
      // Locate and isolate card
      Object.keys(this.kanban).forEach(col => {
        const found = this.kanban[col].find(c => c.id === cardId);
        if (found) {
          cardToMove = found;
          this.kanban[col] = this.kanban[col].filter(c => c.id !== cardId);
        }
      });

      if (cardToMove) {
        cardToMove.age = this.lang === 'ar' ? 'تم النقل الآن' : 'Just moved';
        this.kanban[nextStage].push(cardToMove);
        
        // Dispatch dynamic socket notifications or alerts
        if (window.BrightNotifications) {
          window.BrightNotifications.toast({
            type: 'success',
            title: this.lang === 'ar' ? 'تحديث كانبان' : 'Kanban Update',
            message: this.lang === 'ar' ? `تم نقل بطاقة CAPA بنجاح للحالة التالية: ${nextStage}` : `CAPA card dispatched to: ${nextStage}`
          });
        }
      }
    },

    triggerIshikawaInfo(category) {
      const info = {
        people: this.lang === 'ar' ? 'توصية الأفراد: إعادة تأهيل وتدريب فني لمشغلي ماكينات البثق لـ Extruder-4.' : 'People Recommendation: Implement formal mechanical training for extruder operators.',
        machinery: this.lang === 'ar' ? 'توصية الآلات: جدولة صيانة ومعايرة ميكانيكية عاجلة لمكبس التبريد رقم 2.' : 'Machinery Recommendation: Schedule urgent press calibration for mold press 2.',
        materials: this.lang === 'ar' ? 'توصية المواد: رفض شحنات PVC الملوثة ومطالبة المورد بالتعويض المالي.' : 'Materials Recommendation: Reject contaminated polymers and request supplier credit.',
        methods: this.lang === 'ar' ? 'توصية الأساليب: تفعيل مستشعرات الرطوبة والإنذارات الفورية في المستودعات.' : 'Methods Recommendation: Enforce digital tracking and humidity limits.',
        environment: this.lang === 'ar' ? 'توصية البيئة: عزل غرف المستودع لـ Sponge Tape لدرجة حرارة 20 ورطوبة < 45%.' : 'Environment Recommendation: Isolate Storage room 2 for sensitive tapes.',
        measurements: this.lang === 'ar' ? 'توصية القياسات: ربط مقاييس الجودة مخبرياً بنظام المعايرة الآلي الأسبوعي.' : 'Measurements Recommendation: Connect lab scales to automated calibration logs.'
      };

      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'info',
          title: this.lang === 'ar' ? 'توصية مخطط إيشيكاوا' : 'Ishikawa Suggestion',
          message: info[category] || ''
        });
      }
    },

    generateNextWhy() {
      if (this.whysSteps.length >= 5) {
        if (window.BrightNotifications) {
          window.BrightNotifications.toast({
            type: 'warning',
            title: this.lang === 'ar' ? 'تحقيق مكتمل' : 'Investigation Complete',
            message: this.lang === 'ar' ? 'تم اكتمال الخطوات الخمس الاستقصائية (5 Whys) للتحقيق بنجاح.' : 'Five Whys audit path is fully generated.'
          });
        }
        return;
      }

      if (this.whysSteps.length === 4) {
        const step5 = this.lang === 'ar' 
          ? { id: 5, text: 'بسبب عدم تفعيل مستشعر الرطوبة الذكي في المستودع لـ SOP (السبب الجذري النهائي).' }
          : { id: 5, text: 'Due to missing digital humidity alarms in storage according to SOP (Root Cause).' };
        
        this.whysSteps.push(step5);
        if (window.BrightNotifications) {
          window.BrightNotifications.toast({
            type: 'success',
            title: this.lang === 'ar' ? 'السبب الخامس' : 'Why #5 Generated',
            message: step5.text
          });
        }
      }
    },

    saveWhysInvestigation() {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'success',
          title: this.lang === 'ar' ? 'حفظ التحقيق' : 'Investigation Saved',
          message: this.lang === 'ar' ? 'تم حفظ وإرسال التحقيق الفني لـ QCM وإرفاقه بالوثيقة NCR بنجاح!' : 'Root cause 5 Whys investigation filed and dispatched to Quality Manager!'
        });
      }
    },

    exportQMSReport() {
      if (window.BrightNotifications) {
        window.BrightNotifications.toast({
          type: 'info',
          title: this.lang === 'ar' ? 'جاهزية SFDA' : 'SFDA Audit Export',
          message: this.lang === 'ar' ? 'جاري تصدير وثيقة الجودة والجاهزية لتدقيق الغذاء والدواء SFDA بصيغة PDF...' : 'Generating and downloading SFDA / ISO 13485 audit readiness document...'
        });
      }
    }
  };
}
