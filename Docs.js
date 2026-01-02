// بيانات المستندات
const documents = [
    {
        id: 1,
        title: "نبذة عن Bright AI",
        category: "نبذة عن الشركة",
        date: "15 يناير 2025",
        description: "تعرف على Bright AI، الشركة الرائدة في مجال حلول الذكاء الاصطناعي في المملكة العربية السعودية.",
        file: "Docfile/About.Bright.AI.html",
        featured: true
    },
    {
        id: 2,
        title: "رؤية ورسالة Bright AI",
        category: "نبذة عن الشركة",
        date: "18 يناير 2025",
        description: "تعرف على رؤيتنا ورسالتنا في مجال الذكاء الاصطناعي وأهدافنا الاستراتيجية.",
        file: "Docfile/Vision.Mission.html",
        featured: true
    },
    {
        id: 3,
        title: "قيمنا الأساسية",
        category: "نبذة عن الشركة",
        date: "20 يناير 2025",
        description: "الابتكار والجودة والشراكة - القيم التي تقود عملنا في Bright AI.",
        file: "Docfile/serves.dov.html",
        featured: false
    },
    {
        id: 4,
        title: "خدمات Bright AI الرائدة",
        category: "الخدمات",
        date: "25 يناير 2025",
        description: "رفيقك الذكي نحو التحول الرقمي - تعرف على باقة خدماتنا المتكاملة.",
        file: "Docfile/projects.html",
        featured: true
    },
    {
        id: 5,
        title: "أتمتة العمليات الذكية",
        category: "أتمتة العمليات",
        date: "1 فبراير 2025",
        description: "حلول Bright AI المتكاملة لتحويل الأعمال: تقليل الأخطاء، زيادة السرعة، خفض التكاليف، وتعزيز الإنتاجية.",
        file: "Docfile/atou.doc.html",
        featured: true
    },
    {
        id: 6,
        title: "تحليل البيانات المتقدم",
        category: "تحليل البيانات",
        date: "5 فبراير 2025",
        description: "حلول Bright AI لاتخاذ قرارات ذكية: استخراج الرؤى، التنبؤ بالاتجاهات، تحسين العمليات. اكتشف كيف تحوّل بياناتك إلى قرارات استراتيجية.",
        file: "Docfile/anlisis.doc.html",
        featured: false
    },
    {
        id: 7,
        title: "استشارات الذكاء الاصطناعي",
        category: "الاستشارات الذكية",
        date: "10 فبراير 2025",
        description: "تصميم استراتيجيات التحول الرقمي مع Bright AI: استشارات متخصصة لتحديد أولويات التحول الرقمي، تصميم استراتيجيات فعالة، وحل التحديات التقنية.",
        file: "Docfile/culn.doc.html",
        featured: false
    },
    {
        id: 8,
        title: "وكلاء الذكاء الاصطناعي المخصصين",
        category: "مساعد \"وكيل\" الذكاء الاصطناعي",
        date: "15 فبراير 2025",
        description: "حلول Bright AI لتحويل تفاعلات الأعمال: وكلاء ذكاء اصطناعي مخصصين لأتمتة المهام، تحسين خدمة العملاء، وتعزيز التفاعلات.",
        file: "Docfile/agent.doc.html",
        featured: true
    },
    {
        id: 9,
        title: "أدوات الذكاء الاصطناعي المجانية",
        category: "مكتبة الموارد",
        date: "20 فبراير 2025",
        description: "منصات تعليمية وحلول أعمال ذكية من Bright AI: مجموعة أدوات الذكاء الاصطناعي المجانية، منصات تعليمية ذكية، مدقق قواعد لغوي، أدوات إدارة مخزون، وتقنيات تعلم آلي.",
        file: "Docfile/tool.doc.html",
        featured: false
    },
    {
        id: 10,
        title: "التحول الرقمي باستخدام الذكاء الاصطناعي",
        category: "الاستشارات الذكية",
        date: "25 فبراير 2025",
        description: "دليل شامل حول كيفية استخدام تقنيات الذكاء الاصطناعي لتحقيق التحول الرقمي، مع أمثلة عملية من السوق السعودي.",
        file: "Docfile/Vision.Mission.html",
        featured: true
    }
];

// تهيئة واجهة المستخدم
document.addEventListener('DOMContentLoaded', () => {
    renderDocuments(documents);
    setupEventListeners();
    setupCategoryHighlighting();
    showFeaturedDocuments();
});

// عرض المستندات في الصفحة
function renderDocuments(docs) {
    const grid = document.getElementById('documentsGrid');
    grid.innerHTML = '';
    
    if (docs.length === 0) {
        grid.innerHTML = '<div class="no-results">لم يتم العثور على مستندات مطابقة للبحث</div>';
        return;
    }
    
    docs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'document-item';
        if (doc.featured) {
            card.classList.add('featured');
        }
        
        card.innerHTML = `
            <h3>${doc.title}</h3>
            <p>${doc.description}</p>
            <a href="${doc.file}" class="view-doc-btn">عرض المستند</a>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('view-doc-btn')) {
                showDocumentPreview(doc);
            }
        });
        
        grid.appendChild(card);
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // مستمع البحث
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // مستمعي التصنيفات
    document.querySelectorAll('.categories li').forEach(li => {
        li.addEventListener('click', () => {
            // إزالة الفئة النشطة من جميع العناصر
            document.querySelectorAll('.categories li').forEach(item => {
                item.classList.remove('active');
            });
            
            // إضافة الفئة النشطة للعنصر المحدد
            li.classList.add('active');
            
            // تصفية المستندات حسب الفئة
            const category = li.textContent;
            if (category === 'جميع المستندات') {
                renderDocuments(documents);
            } else {
                const filtered = documents.filter(doc => doc.category === category);
                renderDocuments(filtered);
            }
        });
    });
}

// إعداد تمييز التصنيفات
function setupCategoryHighlighting() {
    const categories = document.querySelectorAll('.categories li');
    categories.forEach(category => {
        category.addEventListener('mouseover', () => {
            category.style.transition = 'all 0.3s ease';
        });
    });
}

// عرض المستندات المميزة
function showFeaturedDocuments() {
    const featured = documents.filter(doc => doc.featured);
    const recGrid = document.getElementById('recGrid');
    recGrid.innerHTML = '';
    
    if (featured.length === 0) {
        recGrid.innerHTML = '<div class="no-recommendations">لا توجد مستندات مقترحة حالياً</div>';
        return;
    }
    
    featured.forEach(doc => {
        const recCard = document.createElement('div');
        recCard.className = 'document-item';
        recCard.innerHTML = `
            <h3>${doc.title}</h3>
            <p>${doc.description.substring(0, 100)}${doc.description.length > 100 ? '...' : ''}</p>
            <a href="${doc.file}" class="view-doc-btn">عرض المستند</a>
        `;
        
        recCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('view-doc-btn')) {
                showDocumentPreview(doc);
            }
        });
        
        recGrid.appendChild(recCard);
    });
}

// معالجة البحث
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderDocuments(documents);
        return;
    }
    
    const filtered = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.description.toLowerCase().includes(searchTerm) ||
        doc.category.toLowerCase().includes(searchTerm)
    );
    
    // إظهار رسالة نتائج البحث
    const grid = document.getElementById('documentsGrid');
    const resultsMessage = document.createElement('div');
    resultsMessage.className = 'search-results-message';
    resultsMessage.textContent = `تم العثور على ${filtered.length} نتيجة لـ "${searchTerm}"`;
    
    grid.innerHTML = '';
    grid.appendChild(resultsMessage);
    
    renderDocuments(filtered);
}

// عرض معاينة المستند
function showDocumentPreview(doc) {
    const preview = document.getElementById('docPreview');
    preview.style.display = 'block';
    
    // تمرير إلى قسم المعاينة
    preview.scrollIntoView({ behavior: 'smooth' });
    
    // تعيين بيانات المستند
    document.getElementById('docTitle').textContent = doc.title;
    document.getElementById('docDescription').textContent = doc.description;
    document.getElementById('docCategory').textContent = `التصنيف: ${doc.category}`;
    document.getElementById('docDate').textContent = `تاريخ النشر: ${doc.date}`;
    
    // تحديث زر التحميل
    const downloadBtn = document.querySelector('.download-btn');
    downloadBtn.onclick = () => window.open(doc.file, '_blank');
    
    // تحديث زر المشاركة
    const shareBtn = document.querySelector('.share-btn');
    shareBtn.onclick = () => shareDocument(doc);
    
    // عرض المستندات المقترحة ذات الصلة
    showRelatedDocuments(doc);
}

// عرض المستندات ذات الصلة
function showRelatedDocuments(currentDoc) {
    const related = documents.filter(doc => 
        doc.category === currentDoc.category && doc.id !== currentDoc.id
    );
    
    const recGrid = document.getElementById('recGrid');
    recGrid.innerHTML = '';
    
    if (related.length === 0) {
        recGrid.innerHTML = '<div class="no-recommendations">لا توجد مستندات ذات صلة</div>';
        return;
    }
    
    // عرض حتى 3 مستندات ذات صلة
    const relatedToShow = related.slice(0, 3);
    
    relatedToShow.forEach(doc => {
        const recCard = document.createElement('div');
        recCard.className = 'document-item';
        recCard.innerHTML = `
            <h3>${doc.title}</h3>
            <p>${doc.description.substring(0, 100)}${doc.description.length > 100 ? '...' : ''}</p>
            <a href="${doc.file}" class="view-doc-btn">عرض المستند</a>
        `;
        
        recCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('view-doc-btn')) {
                showDocumentPreview(doc);
            }
        });
        
        recGrid.appendChild(recCard);
    });
}

// مشاركة المستند
function shareDocument(doc) {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = 'تم نسخ رابط المستند إلى الحافظة';
    document.body.appendChild(notification);
    
    // نسخ الرابط إلى الحافظة (في تطبيق حقيقي)
    // navigator.clipboard.writeText(window.location.origin + '/' + doc.file);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // إخفاء الإشعار بعد 3 ثوانٍ
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
