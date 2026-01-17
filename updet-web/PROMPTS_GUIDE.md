# 🎯 دليل البرومبتات الشامل لمشروع Bright AI

## 📐 برومبت توحيد التصميم

```
أنت مصمم UI/UX خبير متخصص في تطوير مواقع الذكاء الاصطناعي.

المهمة: توحيد تصميم جميع صفحات موقع Bright AI لتطابق الصفحة الرئيسية index.html

المتطلبات:
1. استخدام نفس نظام الألوان:
   - Navy: #020617, #0f172a
   - Gold: #fbbf24, #f59e0b
   - Gradients المحددة في index.html

2. توحيد المكونات:
   - Navigation: نفس الهيكل والأنيميشن
   - Cards: glass-card effect موحد
   - Buttons: نفس الأنماط (primary, secondary, ghost)
   - Typography: IBM Plex Sans Arabic

3. توحيد التباعد والمسافات:
   - Sections: py-24 px-6
   - Containers: max-w-7xl mx-auto
   - Grid gaps: gap-8 أو gap-12

4. توحيد الأنيميشن:
   - Hover effects: translateY(-5px)
   - Transitions: all 0.3s ease
   - Scroll animations: fadeInUp

5. توحيد الأيقونات:
   - استخدام Iconify
   - نفس الأحجام (width="24" للعادي، width="32" للكبير)

الملفات المطلوب توحيدها:
- ai-workflows.html
- aiaas.html (AIaaS للمنشآت)
- data-analysis.html
- consultation.html
- smart-automation.html
- blog.html
- our-products.html

الخطوات:
1. تحليل index.html واستخراج جميع الأنماط
2. إنشاء ملف components.css يحتوي على جميع المكونات القابلة لإعادة الاستخدام
3. تطبيق الأنماط على كل صفحة
4. التأكد من التناسق الكامل
5. اختبار الاستجابة على جميع الأحجام

ملاحظات:
- الحفاظ على RTL direction
- ضمان إمكانية الوصول (ARIA labels)
- تحسين الأداء (lazy loading)
```

---

## 🎨 برومبت الأنيميشن العالمية

```
أنت مطور front-end متخصص في الأنيميشن والتفاعلات الحركية.

المهمة: إنشاء نظام أنيميشن عالمي موحد لموقع Bright AI

المتطلبات:

### 1. Scroll Animations
```css
/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade In Left (للعناصر من اليمين في RTL) */
@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 2. Hover Effects
```css
/* Card Hover */
.interactive-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.interactive-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(251, 191, 36, 0.3);
}

/* Button Hover */
.btn-hover {
  position: relative;
  overflow: hidden;
}

.btn-hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-hover:hover::before {
  left: 100%;
}

/* Icon Rotate */
.icon-rotate {
  transition: transform 0.3s ease;
}

.icon-rotate:hover {
  transform: rotate(15deg);
}
```

### 3. Loading States
```css
/* Skeleton Loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #1e293b 25%,
    #334155 50%,
    #1e293b 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.5rem;
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### 4. Page Transitions
```css
/* Page Enter */
@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

body {
  animation: pageEnter 0.5s ease-out;
}

/* Section Reveal */
.section-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease-out;
}

.section-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 5. Micro Interactions
```css
/* Button Click */
@keyframes buttonClick {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.btn-click:active {
  animation: buttonClick 0.2s ease;
}

/* Success Checkmark */
@keyframes checkmark {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.checkmark {
  stroke-dasharray: 100;
  animation: checkmark 0.5s ease-out forwards;
}

/* Number Counter */
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.counter {
  animation: countUp 0.5s ease-out;
}
```

### JavaScript للتفعيل:
```javascript
// Intersection Observer للـ Scroll Animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});

// Stagger Animation
document.querySelectorAll('.stagger-container').forEach(container => {
  const items = container.querySelectorAll('.stagger-item');
  items.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.1}s`;
  });
});

// Number Counter
function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-count'));
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

document.querySelectorAll('[data-count]').forEach(el => {
  observer.observe(el);
  el.addEventListener('visible', () => animateCounter(el));
});
```

الملف النهائي: animations.css + animations.js
```

---

## 🛠️ برومبت إصلاح صفحة الخدمات (our-products.html)

```
أنت مطور web متخصص في تحسين تجربة المستخدم وتنظيم المحتوى.

المهمة: إصلاح وتحسين صفحة الخدمات our-products.html

المشاكل الحالية:
1. الكود طويل جداً (+1000 سطر)
2. تكرار في structured data
3. عدم تنظيم المنتجات
4. أسعار غير متسقة
5. تجربة مستخدم ضعيفة

الحلول المطلوبة:

### 1. إعادة هيكلة الصفحة
```html
<!-- الهيكل الجديد -->
<main>
  <!-- Hero Section -->
  <section class="hero">
    <h1>خدماتنا المتكاملة</h1>
    <p>اختر الحل المناسب لعملك</p>
    <!-- Search & Filter -->
    <div class="filters">
      <input type="search" placeholder="ابحث عن خدمة...">
      <select class="category-filter">
        <option>جميع الفئات</option>
        <option>تحليل البيانات</option>
        <option>الأتمتة</option>
        <option>وكلاء AI</option>
      </select>
      <select class="price-filter">
        <option>جميع الأسعار</option>
        <option>أقل من 500 ريال</option>
        <option>500-1000 ريال</option>
        <option>أكثر من 1000 ريال</option>
      </select>
    </div>
  </section>

  <!-- Categories Tabs -->
  <section class="categories">
    <div class="tabs">
      <button class="tab active" data-category="all">الكل</button>
      <button class="tab" data-category="data">تحليل البيانات</button>
      <button class="tab" data-category="automation">الأتمتة</button>
      <button class="tab" data-category="agents">وكلاء AI</button>
      <button class="tab" data-category="robots">الروبوتات</button>
    </div>
  </section>

  <!-- Products Grid -->
  <section class="products-grid">
    <!-- Product Cards -->
  </section>

  <!-- Comparison Tool -->
  <section class="comparison">
    <h2>قارن بين الخدمات</h2>
    <div class="comparison-table"></div>
  </section>

  <!-- FAQ -->
  <section class="faq">
    <h2>الأسئلة الشائعة</h2>
  </section>

  <!-- CTA -->
  <section class="cta">
    <h2>هل تحتاج مساعدة في الاختيار؟</h2>
    <button>تحدث مع خبير</button>
  </section>
</main>
```

### 2. تحسين بطاقة المنتج
```html
<div class="product-card glass-card" data-category="data" data-price="267">
  <!-- Badge -->
  <div class="product-badge">الأكثر مبيعاً</div>
  
  <!-- Icon -->
  <div class="product-icon">
    <iconify-icon icon="lucide:bar-chart"></iconify-icon>
  </div>
  
  <!-- Content -->
  <div class="product-content">
    <h3>تحليل بيانات المبيعات</h3>
    <p class="product-description">تحليل شامل لأداء المبيعات...</p>
    
    <!-- Features -->
    <ul class="product-features">
      <li><iconify-icon icon="lucide:check"></iconify-icon> تحليل الاتجاهات</li>
      <li><iconify-icon icon="lucide:check"></iconify-icon> تقارير مفصلة</li>
      <li><iconify-icon icon="lucide:check"></iconify-icon> توصيات ذكية</li>
    </ul>
    
    <!-- Pricing -->
    <div class="product-pricing">
      <span class="price-current">267 ريال</span>
      <span class="price-original">356 ريال</span>
      <span class="price-discount">-25%</span>
    </div>
    
    <!-- Meta -->
    <div class="product-meta">
      <span><iconify-icon icon="lucide:clock"></iconify-icon> 5-7 أيام</span>
      <span><iconify-icon icon="lucide:star"></iconify-icon> 4.9 (127)</span>
    </div>
    
    <!-- Actions -->
    <div class="product-actions">
      <button class="btn-primary">شراء الآن</button>
      <button class="btn-secondary">التفاصيل</button>
      <button class="btn-icon" title="إضافة للمقارنة">
        <iconify-icon icon="lucide:git-compare"></iconify-icon>
      </button>
    </div>
  </div>
</div>
```

### 3. إضافة JavaScript للتفاعل
```javascript
// Filter Products
const filterProducts = (category, priceRange, searchTerm) => {
  const products = document.querySelectorAll('.product-card');
  
  products.forEach(product => {
    const matchCategory = category === 'all' || 
                         product.dataset.category === category;
    const matchPrice = checkPriceRange(product.dataset.price, priceRange);
    const matchSearch = product.textContent.toLowerCase()
                              .includes(searchTerm.toLowerCase());
    
    if (matchCategory && matchPrice && matchSearch) {
      product.style.display = 'block';
      product.classList.add('fade-in');
    } else {
      product.style.display = 'none';
    }
  });
};

// Comparison Tool
const comparisonItems = [];

document.querySelectorAll('.btn-compare').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const productId = e.target.closest('.product-card').dataset.id;
    
    if (comparisonItems.includes(productId)) {
      comparisonItems = comparisonItems.filter(id => id !== productId);
      btn.classList.remove('active');
    } else if (comparisonItems.length < 3) {
      comparisonItems.push(productId);
      btn.classList.add('active');
    } else {
      alert('يمكنك مقارنة 3 منتجات كحد أقصى');
    }
    
    updateComparisonBar();
  });
});

// Modal Details
const openModal = (productId) => {
  const modal = document.getElementById('product-modal');
  const product = getProductData(productId);
  
  modal.querySelector('.modal-title').textContent = product.title;
  modal.querySelector('.modal-description').textContent = product.description;
  modal.querySelector('.modal-features').innerHTML = 
    product.features.map(f => `<li>${f}</li>`).join('');
  
  modal.classList.add('active');
};

// Sort Products
const sortProducts = (sortBy) => {
  const container = document.querySelector('.products-grid');
  const products = Array.from(container.querySelectorAll('.product-card'));
  
  products.sort((a, b) => {
    if (sortBy === 'price-low') {
      return parseInt(a.dataset.price) - parseInt(b.dataset.price);
    } else if (sortBy === 'price-high') {
      return parseInt(b.dataset.price) - parseInt(a.dataset.price);
    } else if (sortBy === 'popular') {
      return parseInt(b.dataset.rating) - parseInt(a.dataset.rating);
    }
  });
  
  products.forEach(product => container.appendChild(product));
};
```

### 4. تحسين SEO
```html
<!-- Structured Data موحد -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "Product",
      "position": 1,
      "name": "تحليل بيانات المبيعات",
      "description": "...",
      "offers": {
        "@type": "Offer",
        "price": "267",
        "priceCurrency": "SAR"
      }
    }
  ]
}
</script>
```

### 5. تحسين الأداء
- تقسيم الصفحة إلى components
- Lazy loading للصور
- Virtual scrolling للمنتجات الكثيرة
- Caching للبيانات

الملفات المطلوبة:
- our-products.html (محسّن)
- products.css
- products.js
- products-data.json
```

---

## 📄 برومبت محتوى AI Workflows

```
أنت كاتب محتوى تقني متخصص في الذكاء الاصطناعي.

المهمة: كتابة محتوى شامل ومقنع لصفحة AI Workflows

الأقسام المطلوبة:

### 1. Hero Section
العنوان: "هندسة سير العمل بذكاء المستقبل"
النص: "حوّل عملياتك المعقدة إلى سير عمل ذكي ومؤتمت يعمل بكفاءة 24/7"
CTA: "ابدأ التحول الرقمي الآن"

### 2. ما هو AI Workflows؟
شرح مبسط وواضح عن:
- التعريف
- كيف يعمل
- الفرق بينه وبين الأتمتة التقليدية
- الفوائد الرئيسية

### 3. حالات الاستخدام
- إدارة علاقات العملاء (CRM)
- معالجة الطلبات
- إدارة المخزون
- الموارد البشرية
- المحاسبة والمالية
- التسويق الرقمي

### 4. المميزات
- التكامل السلس
- الذكاء التكيفي
- التحليلات المتقدمة
- الأمان والخصوصية
- قابلية التوسع

### 5. كيف نعمل
خطوات واضحة من البداية للنهاية

### 6. الأسعار
باقات مختلفة حسب الحجم

### 7. FAQ
أسئلة شائعة وإجاباتها

النبرة: احترافية، واضحة، مقنعة
اللغة: عربية فصحى مبسطة
الطول: شامل ومفصل
```

---

## 📄 برومبت محتوى AIaaS للمنشآت

```
أنت كاتب محتوى متخصص في حلول B2B.

المهمة: كتابة محتوى شامل لصفحة AIaaS للمنشآت

الأقسام:

### 1. Hero
"الذكاء الاصطناعي كخدمة لمنشأتك"
"لا حاجة لفريق تقني - نحن نوفر كل شيء"

### 2. ما هو AIaaS؟
شرح الخدمة المدارة بالكامل

### 3. ما نقدمه
- الأجهزة والمعدات
- البرمجيات والأنظمة
- الصيانة والدعم
- التدريب
- التحديثات

### 4. القطاعات
- التجزئة
- الصناعة
- الضيافة
- الرعاية الصحية
- التعليم

### 5. دراسات حالة
أمثلة واقعية من السوق السعودي

### 6. الأسعار
نموذج اشتراك شهري

### 7. البدء
خطوات بسيطة للبدء

النبرة: ودية، مطمئنة، عملية
التركيز: سهولة الاستخدام وعدم الحاجة لخبرة تقنية
```

---

**ملاحظة:** هذه البرومبتات قابلة للتخصيص حسب الحاجة
