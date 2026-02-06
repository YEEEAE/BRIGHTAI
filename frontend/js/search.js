/**
 * Bright AI - Premium Search System
 * Full-Text Search with Fuzzy Matching & Highlighting
 */

class BrightSearch {
    constructor() {
        this.modal = null;
        this.input = null;
        this.resultsContainer = null;
        this.isOpen = false;
        this.selectedIndex = -1;
        this.searchData = [];
        this.debounceTimer = null;

        this.init();
    }

    // ========================================
    // Search Index - All Searchable Content
    // ========================================
    getSearchIndex() {
        return [
            // ==================
            // الخدمات الرئيسية
            // ==================
            {
                id: 'smart-automation',
                type: 'service',
                title: 'الأتمتة الذكية',
                description: 'تحسين كفاءة العمليات التشغيلية من خلال أتمتة المهام المتكررة باستخدام الذكاء الاصطناعي',
                keywords: ['أتمتة', 'عمليات', 'كفاءة', 'RPA', 'روبوت', 'تشغيل', 'إنتاجية'],
                url: 'frontend/pages/smart-automation.html',
                category: 'الخدمات'
            },
            {
                id: 'ai-agent',
                type: 'service',
                title: 'AI (AIaaS) للمنشآت',
                description: 'حلول الذكاء الاصطناعي كخدمة مرنة تناسب جميع أحجام الشركات',
                keywords: ['AIaaS', 'خدمة', 'مرنة', 'شركات', 'مؤسسات', 'وكيل ذكي', 'agent'],
                url: 'frontend/pages/ai-agent.html',
                category: 'الخدمات'
            },
            {
                id: 'data-analysis',
                type: 'service',
                title: 'تحليل البيانات',
                description: 'رؤى دقيقة لاتخاذ القرارات الاستراتيجية من خلال تحليل البيانات الضخمة',
                keywords: ['بيانات', 'تحليل', 'أعمال', 'تقارير', 'BI', 'ذكاء أعمال', 'إحصائيات', 'big data'],
                url: 'frontend/pages/data-analysis.html',
                category: 'الخدمات'
            },
            {
                id: 'consultation',
                type: 'service',
                title: 'استشارات تقنية',
                description: 'خبراء في استراتيجيات الذكاء الاصطناعي والتحول الرقمي',
                keywords: ['استشارة', 'خبراء', 'استراتيجية', 'تحول رقمي', 'مشورة', 'تخطيط'],
                url: 'frontend/pages/consultation.html',
                category: 'الخدمات'
            },

            // ==================
            // الحلول والمنتجات
            // ==================
            {
                id: 'data-intelligence',
                type: 'solution',
                title: 'ذكاء البيانات',
                description: 'منصة متكاملة لمعالجة وتحليل البيانات باستخدام تقنيات الذكاء الاصطناعي المتقدمة',
                keywords: ['بيانات', 'ذكاء', 'منصة', 'معالجة', 'تحليل متقدم'],
                url: 'frontend/pages/try.html',
                category: 'الحلول'
            },
            {
                id: 'free-tools',
                type: 'solution',
                title: 'أدوات مجانية',
                description: 'جرب تقنياتنا المتقدمة مجاناً - أدوات ذكاء اصطناعي متنوعة',
                keywords: ['مجاني', 'أدوات', 'تجربة', 'تجريبي', 'free', 'tools'],
                url: 'frontend/pages/tools.html',
                category: 'الحلول'
            },
            {
                id: 'smart-medical-archive',
                type: 'solution',
                title: 'الأرشيف الطبي الذكي',
                description: 'نظام متكامل للقطاع الصحي والمستشفيات لإدارة السجلات الطبية بذكاء',
                keywords: ['طبي', 'صحي', 'مستشفى', 'سجلات', 'أرشيف', 'مرضى', 'صحة', 'healthcare'],
                url: 'frontend/pages/smart-medical-archive/',
                category: 'الحلول'
            },
            {
                id: 'smart-recruitment',
                type: 'solution',
                title: 'التوظيف الذكي',
                description: 'أتمتة عمليات الموارد البشرية والتوظيف باستخدام الذكاء الاصطناعي',
                keywords: ['توظيف', 'موارد بشرية', 'HR', 'مقابلات', 'تعيين', 'وظائف', 'recruitment'],
                url: 'frontend/pages/interview/',
                category: 'الحلول'
            },
            {
                id: 'nlp',
                type: 'solution',
                title: 'معالجة اللغة الطبيعية',
                description: 'تقنيات NLP متقدمة لفهم ومعالجة النصوص العربية والإنجليزية',
                keywords: ['NLP', 'لغة طبيعية', 'نصوص', 'معالجة', 'فهم', 'عربي'],
                url: 'frontend/pages/nlp.html',
                category: 'الحلول'
            },
            {
                id: 'machine-learning',
                type: 'solution',
                title: 'تعلم الآلة',
                description: 'نماذج تعلم آلة مخصصة لتلبية احتياجات عملك',
                keywords: ['تعلم آلة', 'machine learning', 'ML', 'نماذج', 'تدريب', 'خوارزميات'],
                url: 'frontend/pages/machine.html',
                category: 'الحلول'
            },
            {
                id: 'physical-ai',
                type: 'solution',
                title: 'الذكاء الاصطناعي الفيزيائي',
                description: 'روبوتات وأنظمة ذكاء اصطناعي للتطبيقات الفيزيائية والصناعية',
                keywords: ['روبوت', 'فيزيائي', 'صناعي', 'أتمتة', 'مصنع', 'إنتاج'],
                url: 'frontend/pages/physical-ai.html',
                category: 'الحلول'
            },

            // ==================
            // المنتجات
            // ==================
            {
                id: 'bright-crm',
                type: 'service',
                title: 'نظام CRM الذكي',
                description: 'نظام إدارة علاقات العملاء المدعوم بالذكاء الاصطناعي',
                keywords: ['CRM', 'عملاء', 'مبيعات', 'علاقات', 'إدارة', 'customer'],
                url: 'frontend/pages/brightsales-pro.html',
                category: 'المنتجات'
            },
            {
                id: 'bright-project',
                type: 'service',
                title: 'إدارة المشاريع الذكية',
                description: 'منصة متكاملة لإدارة المشاريع بذكاء اصطناعي',
                keywords: ['مشاريع', 'إدارة', 'تخطيط', 'فريق', 'مهام', 'project'],
                url: 'frontend/pages/brightproject-pro.html',
                category: 'المنتجات'
            },
            {
                id: 'bright-recruiter',
                type: 'service',
                title: 'نظام التوظيف الذكي',
                description: 'منصة توظيف ذكية لأتمتة عمليات الموارد البشرية',
                keywords: ['توظيف', 'موظفين', 'HR', 'موارد', 'تعيين'],
                url: 'frontend/pages/brightrecruiter.html',
                category: 'المنتجات'
            },

            // ==================
            // صفحات الشركة
            // ==================
            {
                id: 'about-us',
                type: 'page',
                title: 'من نحن',
                description: 'تعرف على رؤيتنا وفريقنا في Bright AI - شريكك للتحول الرقمي',
                keywords: ['من نحن', 'فريق', 'رؤية', 'رسالة', 'شركة', 'about'],
                url: 'frontend/pages/about-us.html',
                category: 'الشركة'
            },
            {
                id: 'blog',
                type: 'page',
                title: 'المكتبة الذكية',
                description: 'مقالات وأخبار التقنية والذكاء الاصطناعي',
                keywords: ['مدونة', 'مقالات', 'أخبار', 'تقنية', 'blog', 'مكتبة'],
                url: 'frontend/pages/blog.html',
                category: 'الشركة'
            },
            {
                id: 'docs',
                type: 'page',
                title: 'المستندات',
                description: 'التوثيق التقني والأدلة الإرشادية',
                keywords: ['مستندات', 'توثيق', 'دليل', 'تعليمات', 'docs', 'documentation'],
                url: 'docs.html',
                category: 'الشركة'
            },
            {
                id: 'contact',
                type: 'page',
                title: 'اتصل بنا',
                description: 'تواصل معنا للحصول على استشارة مجانية',
                keywords: ['اتصال', 'تواصل', 'واتساب', 'هاتف', 'contact'],
                url: 'frontend/pages/contact.html',
                category: 'الشركة'
            },

            // ==================
            // مقالات المدونة
            // ==================
            {
                id: 'article-crm',
                type: 'article',
                title: 'نظام CRM الذكي - دليل شامل',
                description: 'كيفية استخدام الذكاء الاصطناعي في إدارة علاقات العملاء',
                keywords: ['CRM', 'عملاء', 'ذكاء اصطناعي', 'إدارة'],
                url: '/frontend/pages/blogger/smart-crm-system.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-automation',
                type: 'article',
                title: 'الأتمتة الذكية - فوائد وتطبيقات',
                description: 'اكتشف كيف يمكن للأتمتة الذكية تحسين كفاءة عملك',
                keywords: ['أتمتة', 'كفاءة', 'إنتاجية', 'عمليات'],
                url: '/frontend/pages/blogger/smart-automation-benefits.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-ai-agents',
                type: 'article',
                title: 'وكلاء الذكاء الاصطناعي في خدمة العملاء',
                description: 'دراسة حالة للشركات السعودية في استخدام AI Agents',
                keywords: ['وكيل', 'agent', 'خدمة عملاء', 'سعودية'],
                url: '/frontend/pages/blogger/case-study-saudi-companies-ai-agents-customer-service.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-digital-transformation',
                type: 'article',
                title: 'التحول الرقمي والأتمتة',
                description: 'كيف يقود الذكاء الاصطناعي الابتكار في التحول الرقمي',
                keywords: ['تحول رقمي', 'ابتكار', 'رقمنة', 'digital'],
                url: '/frontend/pages/blogger/ai-transformation.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-data-analysis',
                type: 'article',
                title: 'تحليل البيانات الضخمة',
                description: 'مستقبل تحليل البيانات في القطاع المالي',
                keywords: ['بيانات ضخمة', 'big data', 'تحليل', 'مالي'],
                url: '/frontend/pages/blogger/future-of-intelligent-data-analysis-finance-sector.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-generative-ai',
                type: 'article',
                title: 'الذكاء الاصطناعي التوليدي',
                description: 'تطبيقات الذكاء الاصطناعي التوليدي في صناعة المحتوى',
                keywords: ['توليدي', 'generative', 'محتوى', 'GPT', 'صناعة'],
                url: '/frontend/pages/blogger/generative-artificial-intelligence.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-nca-compliance',
                type: 'article',
                title: 'الامتثال لمعايير NCA',
                description: 'دليل الامتثال لمعايير الهيئة الوطنية للأمن السيبراني',
                keywords: ['NCA', 'امتثال', 'أمن سيبراني', 'معايير', 'سعودية'],
                url: '/frontend/pages/blogger/nca-compliance.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-digital-health',
                type: 'article',
                title: 'الصحة الرقمية والأرشيف الذكي',
                description: 'مستقبل الرعاية الصحية الرقمية في المملكة',
                keywords: ['صحة', 'رقمية', 'أرشيف', 'مستشفى', 'سجلات'],
                url: '/frontend/pages/blogger/digital-health-smart-archive.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-rpa',
                type: 'article',
                title: 'أتمتة العمليات الروبوتية',
                description: 'دليلك الشامل لـ RPA وأتمتة العمليات',
                keywords: ['RPA', 'روبوت', 'عمليات', 'أتمتة'],
                url: '/frontend/pages/blogger/process-automation.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-inventory',
                type: 'article',
                title: 'إدارة المخزون الذكية',
                description: 'كيفية تحسين إدارة المخزون باستخدام AI',
                keywords: ['مخزون', 'inventory', 'إدارة', 'تخزين'],
                url: '/frontend/pages/blogger/smart-inventory-management.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-logistics',
                type: 'article',
                title: 'حلول النقل واللوجستيات',
                description: 'الذكاء الاصطناعي في قطاع النقل والخدمات اللوجستية',
                keywords: ['نقل', 'لوجستيات', 'شحن', 'توصيل', 'logistics'],
                url: '/frontend/pages/blogger/transport-logistics-solutions.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-document-processing',
                type: 'article',
                title: 'معالجة المستندات الذكية',
                description: 'أتمتة استخراج البيانات من المستندات',
                keywords: ['مستندات', 'معالجة', 'OCR', 'استخراج', 'فواتير'],
                url: '/frontend/pages/blogger/smart-document-processing.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-bi',
                type: 'article',
                title: 'ذكاء الأعمال في السعودية',
                description: 'تطبيقات Business Intelligence للشركات السعودية',
                keywords: ['BI', 'ذكاء أعمال', 'تقارير', 'dashboard'],
                url: '/frontend/pages/blogger/business-intelligence-saudi.html'.html',
                category: 'المقالات'
            },
            {
                id: 'article-banking',
                type: 'article',
                title: 'الخدمات البنكية الرقمية',
                description: 'التحول الرقمي في القطاع البنكي السعودي',
                keywords: ['بنك', 'banking', 'مالي', 'رقمي', 'فنتك'],
                url: '/frontend/pages/blogger/digital-banking-saudi.html'.html',
                category: 'المقالات'
            }
        ];
    }

    init() {
        this.searchData = this.getSearchIndex();
        this.createSearchModal();
        this.bindEvents();
        this.createSearchTrigger();
    }

    createSearchTrigger() {
        // Add search trigger to navigation
        const navContainer = document.querySelector('.nav-container');
        if (!navContainer) return;

        // Create desktop search trigger
        const searchTrigger = document.createElement('button');
        searchTrigger.className = 'search-trigger';
        searchTrigger.setAttribute('aria-label', 'فتح البحث');
        searchTrigger.innerHTML = `
      <iconify-icon icon="lucide:search"></iconify-icon>
      <span>ابحث في الموقع...</span>
      <span class="search-shortcut">⌘K</span>
    `;

        // Create mobile search button
        const mobileSearchBtn = document.createElement('button');
        mobileSearchBtn.className = 'mobile-search-btn';
        mobileSearchBtn.setAttribute('aria-label', 'فتح البحث');
        mobileSearchBtn.innerHTML = `<iconify-icon icon="lucide:search" width="20"></iconify-icon>`;

        // Insert before CTA button
        const ctaBtn = navContainer.querySelector('.nav-btn');
        const ctaContainer = ctaBtn?.parentElement;
        if (ctaContainer) {
            ctaContainer.insertAdjacentElement('beforebegin', searchTrigger);
            ctaContainer.insertAdjacentElement('beforebegin', mobileSearchBtn);
        }

        searchTrigger.addEventListener('click', () => this.open());
        mobileSearchBtn.addEventListener('click', () => this.open());
    }

    createSearchModal() {
        const modal = document.createElement('div');
        modal.className = 'search-modal';
        modal.id = 'searchModal';
        modal.innerHTML = `
      <div class="search-modal-backdrop"></div>
      <div class="search-modal-content" role="dialog" aria-modal="true" aria-label="بحث في الموقع">
        <div class="search-input-wrapper">
          <iconify-icon icon="lucide:search" class="search-icon"></iconify-icon>
          <input 
            type="text" 
            class="search-input" 
            placeholder="ابحث عن خدمات، مقالات، حلول..." 
            autocomplete="off"
            id="searchInput"
          />
          <button class="search-close-btn" aria-label="إغلاق البحث">ESC</button>
        </div>
        
        <div class="search-results" id="searchResults">
          <!-- Quick Actions - Default State -->
          <div class="search-quick-actions" id="quickActions">
            <div class="search-quick-title">
              <iconify-icon icon="lucide:trending-up"></iconify-icon>
              عمليات بحث شائعة
            </div>
            <div class="search-quick-links">
              <a href="frontend/pages/smart-automation.html" class="search-quick-link">
                <iconify-icon icon="lucide:zap"></iconify-icon>
                الأتمتة الذكية
              </a>
              <a href="frontend/pages/ai-agent.html" class="search-quick-link">
                <iconify-icon icon="lucide:bot"></iconify-icon>
                AI Agent
              </a>
              <a href="blogger/smart-crm-system.html" class="search-quick-link">
                <iconify-icon icon="lucide:users"></iconify-icon>
                نظام CRM
              </a>
              <a href="frontend/pages/data-analysis.html" class="search-quick-link">
                <iconify-icon icon="lucide:bar-chart-2"></iconify-icon>
                تحليل البيانات
              </a>
              <a href="frontend/pages/blog.html" class="search-quick-link">
                <iconify-icon icon="lucide:book-open"></iconify-icon>
                المكتبة الذكية
              </a>
              <a href="frontend/pages/smart-medical-archive/" class="search-quick-link">
                <iconify-icon icon="lucide:heart-pulse"></iconify-icon>
                الأرشيف الطبي
              </a>
            </div>
          </div>
        </div>
        
        <div class="search-footer">
          <div class="search-footer-nav">
            <span><kbd>↑</kbd><kbd>↓</kbd> للتنقل</span>
            <span><kbd>↵</kbd> للفتح</span>
            <span><kbd>ESC</kbd> للإغلاق</span>
          </div>
          <div class="search-footer-powered">
            <iconify-icon icon="lucide:sparkles"></iconify-icon>
            <span>بحث ذكي من Bright AI</span>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(modal);

        this.modal = modal;
        this.input = modal.querySelector('#searchInput');
        this.resultsContainer = modal.querySelector('#searchResults');
    }

    bindEvents() {
        // Keyboard shortcut (Cmd/Ctrl + K)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }

            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close on backdrop click
        this.modal.querySelector('.search-modal-backdrop').addEventListener('click', () => {
            this.close();
        });

        // Close button
        this.modal.querySelector('.search-close-btn').addEventListener('click', () => {
            this.close();
        });

        // Search input
        this.input.addEventListener('input', (e) => {
            this.debounceSearch(e.target.value);
        });

        // Keyboard navigation
        this.input.addEventListener('keydown', (e) => {
            this.handleKeyboardNav(e);
        });

        // Quick link clicks
        this.resultsContainer.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
                this.close();
            }
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus input after animation
        setTimeout(() => {
            this.input.focus();
        }, 100);

        // Track with analytics
        if (typeof gtag === 'function') {
            gtag('event', 'search_open', {
                event_category: 'engagement',
                event_label: 'Search Modal Opened'
            });
        }
    }

    close() {
        this.isOpen = false;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.input.value = '';
        this.selectedIndex = -1;
        this.showQuickActions();
    }

    debounceSearch(query) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.search(query);
        }, 150);
    }

    search(query) {
        query = query.trim().toLowerCase();

        if (!query) {
            this.showQuickActions();
            return;
        }

        const results = this.searchData.filter(item => {
            const searchableText = `${item.title} ${item.description} ${item.keywords.join(' ')}`.toLowerCase();
            return this.fuzzyMatch(searchableText, query);
        });

        // Sort by relevance
        results.sort((a, b) => {
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();

            // Exact title match first
            if (aTitle.includes(query) && !bTitle.includes(query)) return -1;
            if (!aTitle.includes(query) && bTitle.includes(query)) return 1;

            // Then by type priority
            const typePriority = { service: 1, solution: 2, page: 3, article: 4 };
            return (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
        });

        this.renderResults(results, query);

        // Track search
        if (typeof gtag === 'function') {
            gtag('event', 'search', {
                search_term: query,
                results_count: results.length
            });
        }
    }

    fuzzyMatch(text, query) {
        // Simple fuzzy matching
        const queryWords = query.split(/\s+/);
        return queryWords.every(word => text.includes(word));
    }

    highlightMatch(text, query) {
        if (!query) return text;

        const queryWords = query.split(/\s+/).filter(w => w.length > 0);
        let result = text;

        queryWords.forEach(word => {
            const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
            result = result.replace(regex, '<mark>$1</mark>');
        });

        return result;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    renderResults(results, query) {
        if (results.length === 0) {
            this.resultsContainer.innerHTML = `
        <div class="search-no-results">
          <iconify-icon icon="lucide:search-x"></iconify-icon>
          <h4>لا توجد نتائج</h4>
          <p>جرب البحث بكلمات مختلفة أو تصفح الأقسام المتاحة</p>
        </div>
      `;
            return;
        }

        // Group results by category
        const grouped = {};
        results.forEach(item => {
            const cat = item.category || 'أخرى';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
        });

        let html = '';
        const categoryIcons = {
            'الخدمات': 'lucide:zap',
            'الحلول': 'lucide:layers',
            'المنتجات': 'lucide:package',
            'الشركة': 'lucide:building',
            'المقالات': 'lucide:newspaper'
        };

        for (const [category, items] of Object.entries(grouped)) {
            html += `
        <div class="search-category">
          <div class="search-category-title">
            <iconify-icon icon="${categoryIcons[category] || 'lucide:folder'}"></iconify-icon>
            ${category}
          </div>
          ${items.map(item => this.renderResultItem(item, query)).join('')}
        </div>
      `;
        }

        this.resultsContainer.innerHTML = html;
        this.selectedIndex = -1;
    }

    renderResultItem(item, query) {
        const iconClass = {
            'service': 'service',
            'solution': 'solution',
            'article': 'article',
            'page': 'page'
        }[item.type] || 'page';

        const icons = {
            'service': 'lucide:zap',
            'solution': 'lucide:layers',
            'article': 'lucide:file-text',
            'page': 'lucide:link'
        };

        return `
      <a href="${item.url}" class="search-result-item" data-id="${item.id}">
        <div class="search-result-icon ${iconClass}">
          <iconify-icon icon="${icons[item.type] || 'lucide:link'}"></iconify-icon>
        </div>
        <div class="search-result-content">
          <div class="search-result-title">${this.highlightMatch(item.title, query)}</div>
          <div class="search-result-desc">${this.highlightMatch(item.description, query)}</div>
          <div class="search-result-meta">
            <span>
              <iconify-icon icon="lucide:folder"></iconify-icon>
              ${item.category}
            </span>
          </div>
        </div>
        <iconify-icon icon="lucide:arrow-left" class="search-result-arrow"></iconify-icon>
      </a>
    `;
    }

    showQuickActions() {
        const quickActions = document.getElementById('quickActions');
        if (quickActions) {
            this.resultsContainer.innerHTML = quickActions.outerHTML;
        }
    }

    handleKeyboardNav(e) {
        const items = this.resultsContainer.querySelectorAll('.search-result-item');

        if (items.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection(items);
                break;

            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    items[this.selectedIndex].click();
                }
                break;
        }
    }

    updateSelection(items) {
        items.forEach((item, index) => {
            item.classList.toggle('active', index === this.selectedIndex);
            if (index === this.selectedIndex) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }
}

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.brightSearch = new BrightSearch();
});
