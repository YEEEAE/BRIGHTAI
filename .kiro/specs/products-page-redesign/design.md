# Design Document: Bright AI Website Redesign (Light Theme)

## Overview

إعادة تصميم شاملة لموقع Bright AI بالكامل بتصميم Light Theme احترافي مستوحى من claude.com/product/overview. التصميم يركز على تجربة مستخدم سلسة، أداء عالي، وتحويلات أفضل مع دعم كامل للغتين العربية والإنجليزية عبر جميع صفحات الموقع.

### Design Philosophy
- **Clean & Minimal**: تصميم نظيف بمساحات بيضاء واسعة
- **Soft Gradients**: تدرجات لونية ناعمة (purple/pink accents)
- **Glassmorphism Light**: تأثيرات زجاجية خفيفة على خلفيات فاتحة
- **Accessibility First**: تباين عالي وقابلية وصول ممتازة
- **Consistency**: تصميم موحد عبر جميع الصفحات
- **Performance**: تحميل سريع وأداء عالي

## Architecture

### File Structure
```
/
├── index.html                    # الصفحة الرئيسية
├── our-products.html             # صفحة المنتجات
├── data-analysis.html            # صفحة تحليل البيانات
├── smart-automation.html         # صفحة الأتمتة الذكية
├── ai-agent.html                 # صفحة وكلاء الذكاء الاصطناعي
├── ai-bots.html                  # صفحة روبوتات المحادثة
├── blog.html                     # صفحة المدونة
├── contact.html                  # صفحة التواصل
├── consultation.html             # صفحة طلب الاستشارة
├── about-us.html                 # صفحة عن الشركة
├── 404.html                      # صفحة الخطأ 404
├── css/
│   ├── design-tokens-light.css   # متغيرات Light Theme الموحدة
│   ├── design-system.css         # نظام التصميم الموحد
│   ├── components.css            # مكونات قابلة لإعادة الاستخدام
│   ├── animations.css            # الحركات والتأثيرات
│   ├── responsive.css            # التجاوب
│   └── utilities.css             # فئات مساعدة
├── js/
│   ├── app.js                    # التطبيق الرئيسي
│   ├── particle-animation.js     # خلفية الجزيئات
│   ├── cart-system.js            # نظام السلة
│   ├── i18n.js                   # نظام الترجمة
│   ├── analytics.js              # التتبع والتحليلات
│   ├── navigation.js             # نظام التنقل الموحد
│   ├── forms.js                  # معالجة النماذج
│   └── utils.js                  # وظائف مساعدة
├── locales/
│   ├── ar.json                   # الترجمة العربية
│   └── en.json                   # الترجمة الإنجليزية
└── components/
    ├── hero.html                 # قالب Hero Section
    ├── card.html                 # قالب البطاقات
    ├── modal.html                # قالب النوافذ المنبثقة
    └── footer.html               # قالب Footer
```

### Technology Stack
- **HTML5**: Semantic markup with ARIA attributes
- **CSS3**: Custom Properties, Grid, Flexbox, Animations
- **Vanilla JavaScript**: ES6+ modules, no framework dependency
- **Canvas API**: Particle animations
- **localStorage**: Cart persistence, language preference

## Components and Interfaces

### 1. Design Tokens (Light Theme)

```css
/* css/design-tokens-light.css */
:root {
  /* === Primary Colors === */
  --color-primary: #8B5CF6;           /* Purple */
  --color-primary-light: #A78BFA;
  --color-primary-dark: #7C3AED;
  
  --color-secondary: #EC4899;         /* Pink */
  --color-secondary-light: #F472B6;
  
  --color-accent: #6366F1;            /* Indigo */
  
  /* === Background Colors (Light Theme) === */
  --bg-primary: #FFFFFF;
  --bg-secondary: #FAFAFA;
  --bg-tertiary: #F3F4F6;
  --bg-gradient: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.05) 0%, 
    rgba(236, 72, 153, 0.05) 50%, 
    rgba(99, 102, 241, 0.05) 100%);
  
  /* === Text Colors === */
  --text-primary: #111827;            /* Headings */
  --text-secondary: #374151;          /* Body */
  --text-tertiary: #6B7280;           /* Muted */
  --text-on-primary: #FFFFFF;         /* Text on primary color */
  
  /* === Glassmorphism Light === */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-bg-hover: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(139, 92, 246, 0.1);
  --glass-border-hover: rgba(139, 92, 246, 0.2);
  --glass-blur: blur(10px);
  --glass-shadow: 0 8px 32px rgba(139, 92, 246, 0.08);
  --glass-shadow-hover: 0 12px 40px rgba(139, 92, 246, 0.12);
  
  /* === Shadows === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  
  /* === Border Radius === */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* === Typography === */
  --font-family: 'Cairo', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;
  
  /* === Spacing === */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  
  /* === Transitions === */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
  
  /* === Focus States === */
  --focus-ring: 0 0 0 3px rgba(139, 92, 246, 0.4);
  --focus-outline: 3px solid var(--color-primary);
  
  /* === Container === */
  --container-max: 1200px;
  --container-padding: 1rem;
}
```

### 2. Hero Section Component

```html
<!-- Hero Section Structure -->
<section class="hero" id="hero">
  <canvas class="hero-particles" aria-hidden="true"></canvas>
  <div class="hero-gradient-overlay"></div>
  
  <div class="hero-container">
    <div class="hero-content">
      <span class="hero-badge" data-i18n="hero.badge">حلول الذكاء الاصطناعي</span>
      <h1 class="hero-title" data-i18n="hero.title">
        <span class="gradient-text">منتجاتنا وخدماتنا</span>
        <br>المبتكرة في السعودية
      </h1>
      <p class="hero-description" data-i18n="hero.description">
        اختر الحل المناسب لعملك واستفد من تقنيات الذكاء الاصطناعي
      </p>
      <div class="hero-cta">
        <a href="#products" class="btn btn-primary btn-lg">
          <span data-i18n="hero.cta.explore">استكشف المنتجات</span>
          <svg><!-- Arrow icon --></svg>
        </a>
        <a href="#contact" class="btn btn-outline btn-lg">
          <span data-i18n="hero.cta.contact">تواصل معنا</span>
        </a>
      </div>
    </div>
  </div>
  
  <div class="hero-scroll-indicator" aria-hidden="true">
    <span class="scroll-mouse"></span>
  </div>
</section>
```

```css
/* Hero Section Styles */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--bg-primary);
  overflow: hidden;
  padding-top: 80px;
}

.hero-particles {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.6;
}

.hero-gradient-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 30% 20%,
    rgba(139, 92, 246, 0.08) 0%,
    transparent 50%
  ),
  radial-gradient(
    ellipse at 70% 80%,
    rgba(236, 72, 153, 0.06) 0%,
    transparent 50%
  );
  z-index: 2;
}

.hero-container {
  position: relative;
  z-index: 3;
  text-align: center;
  max-width: var(--container-max);
  padding: var(--space-8);
}

.hero-badge {
  display: inline-block;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
  margin-bottom: var(--space-6);
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: var(--space-6);
}

.gradient-text {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: var(--font-size-xl);
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto var(--space-8);
  line-height: 1.7;
}

.hero-cta {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}
```

### 3. Product Card Component

```html
<!-- Product Card Structure -->
<article class="product-card" data-product-id="data-1">
  <div class="product-card-header">
    <span class="product-badge">تحليل بيانات</span>
  </div>
  
  <h3 class="product-title">تحليل بيانات المبيعات الشهرية</h3>
  
  <p class="product-description">
    تحليل شامل ومفصل لأداء المبيعات يساعد على تحسين الكفاءة التشغيلية
  </p>
  
  <ul class="product-features">
    <li><svg><!-- Check icon --></svg> تحليل اتجاهات المبيعات</li>
    <li><svg><!-- Check icon --></svg> تقارير أداء المنتجات</li>
    <li><svg><!-- Check icon --></svg> تحليل سلوك العملاء</li>
  </ul>
  
  <div class="product-pricing">
    <span class="product-price">267</span>
    <span class="product-currency">ريال سعودي</span>
  </div>
  
  <p class="product-delivery">
    <svg><!-- Clock icon --></svg>
    مدة التسليم: 5-7 أيام عمل
  </p>
  
  <div class="product-actions">
    <button class="btn btn-primary buy-btn" data-product-id="data-1">
      <svg><!-- Cart icon --></svg>
      شراء الآن
    </button>
    <button class="btn btn-ghost details-btn" data-modal="details-data-1">
      <svg><!-- Info icon --></svg>
      التفاصيل
    </button>
  </div>
</article>
```

```css
/* Product Card Styles */
.product-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-base);
  box-shadow: var(--glass-shadow);
}

.product-card:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  box-shadow: var(--glass-shadow-hover);
  transform: translateY(-4px);
}

.product-badge {
  display: inline-block;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: var(--text-on-primary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.product-title {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  margin: var(--space-4) 0;
  line-height: 1.4;
}

.product-description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  flex-grow: 1;
}

.product-features {
  list-style: none;
  padding: 0;
  margin: var(--space-4) 0;
}

.product-features li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-2);
}

.product-features svg {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
}

.product-pricing {
  text-align: center;
  margin: var(--space-4) 0;
}

.product-price {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-primary);
}

.product-currency {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin-right: var(--space-1);
}

.product-delivery {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
}

.product-actions {
  display: flex;
  gap: var(--space-3);
}

.product-actions .btn {
  flex: 1;
}
```

### 4. Button System

```css
/* Button Base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
  min-height: 44px; /* Touch target */
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: var(--text-on-primary);
  border-color: transparent;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Outline Button */
.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-outline:hover {
  background: rgba(139, 92, 246, 0.1);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--glass-border);
}

.btn-ghost:hover {
  background: var(--bg-tertiary);
  border-color: var(--glass-border-hover);
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  min-height: 36px;
}

.btn-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--font-size-lg);
  min-height: 52px;
}
```

### 5. Navigation Component

```html
<!-- Navigation Structure -->
<nav class="navbar" role="navigation" aria-label="التنقل الرئيسي">
  <div class="navbar-container">
    <a href="/" class="navbar-logo" aria-label="الصفحة الرئيسية">
      <img src="logo.png" alt="Bright AI" width="42" height="42">
    </a>
    
    <button class="navbar-toggle" aria-label="فتح القائمة" aria-expanded="false">
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
    
    <ul class="navbar-menu" role="menubar">
      <li role="none"><a role="menuitem" href="/">الرئيسية</a></li>
      <li role="none"><a role="menuitem" href="/products" class="active">المنتجات</a></li>
      <li role="none"><a role="menuitem" href="/services">الخدمات</a></li>
      <li role="none"><a role="menuitem" href="/about">عن الشركة</a></li>
      <li role="none"><a role="menuitem" href="/contact">تواصل معنا</a></li>
    </ul>
    
    <div class="navbar-actions">
      <button class="lang-switcher" aria-label="تغيير اللغة">
        <span class="lang-current">عربي</span>
        <svg><!-- Globe icon --></svg>
      </button>
      
      <button class="cart-btn" aria-label="سلة المشتريات">
        <svg><!-- Cart icon --></svg>
        <span class="cart-count">0</span>
      </button>
    </div>
  </div>
</nav>
```

```css
/* Navigation Styles */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid var(--glass-border);
  transition: all var(--transition-base);
}

.navbar.scrolled {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-md);
}

.navbar-container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-menu {
  display: flex;
  list-style: none;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
}

.navbar-menu a {
  display: block;
  padding: var(--space-2) var(--space-4);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.navbar-menu a:hover,
.navbar-menu a.active {
  color: var(--color-primary);
  background: rgba(139, 92, 246, 0.1);
}

.navbar-menu a:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Mobile Navigation */
@media (max-width: 768px) {
  .navbar-menu {
    position: fixed;
    top: 60px;
    right: -100%;
    width: 80%;
    max-width: 300px;
    height: calc(100vh - 60px);
    background: var(--bg-primary);
    flex-direction: column;
    padding: var(--space-4);
    box-shadow: var(--shadow-xl);
    transition: right var(--transition-base);
  }
  
  .navbar-menu.open {
    right: 0;
  }
  
  .navbar-toggle {
    display: flex;
  }
}
```

### 6. Modal Component

```css
/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-base);
}

.modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 2001;
  opacity: 0;
  transition: all var(--transition-base);
}

.modal.active {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: var(--color-primary);
  color: var(--text-on-primary);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--glass-border);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

### 7. Particle Animation System

```javascript
// js/particle-animation.js
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 50;
    this.colors = [
      'rgba(139, 92, 246, 0.3)',   // Purple
      'rgba(236, 72, 153, 0.2)',   // Pink
      'rgba(99, 102, 241, 0.25)'   // Indigo
    ];
    this.animationId = null;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.init();
  }
  
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    if (!this.isReducedMotion) {
      this.createParticles();
      this.animate();
    }
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 3 + 1,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();
    });
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

export default ParticleSystem;
```

### 8. i18n System

```javascript
// js/i18n.js
class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('lang') || 'ar';
    this.translations = {};
    this.init();
  }
  
  async init() {
    await this.loadTranslations(this.currentLang);
    this.applyTranslations();
    this.updateDirection();
  }
  
  async loadTranslations(lang) {
    try {
      const response = await fetch(`/locales/${lang}.json`);
      this.translations = await response.json();
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }
  
  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getNestedValue(this.translations, key);
      if (translation) {
        element.textContent = translation;
      }
    });
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
  
  updateDirection() {
    document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLang;
  }
  
  async switchLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    await this.loadTranslations(lang);
    this.applyTranslations();
    this.updateDirection();
  }
}

export default I18n;
```

### 9. Cart System

```javascript
// js/cart-system.js
class CartSystem {
  constructor() {
    this.items = [];
    this.load();
    this.init();
  }
  
  init() {
    // Bind event listeners
    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.currentTarget.dataset.productId;
        this.addItem(productId);
      });
    });
    
    document.querySelector('.cart-btn')?.addEventListener('click', () => {
      this.openCart();
    });
  }
  
  addItem(productId) {
    // Find product data
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return false;
    
    const name = productCard.querySelector('.product-title').textContent;
    const price = parseInt(productCard.querySelector('.product-price').textContent);
    
    // Check if item already exists
    const existingItem = this.items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        productId,
        name,
        price,
        quantity: 1,
        addedAt: new Date()
      });
    }
    
    this.save();
    this.updateUI();
    this.showNotification(`تمت إضافة ${name} إلى السلة`);
    
    return true;
  }
  
  removeItem(productId) {
    this.items = this.items.filter(item => item.productId !== productId);
    this.save();
    this.updateUI();
  }
  
  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.productId === productId);
    if (item) {
      item.quantity = Math.max(1, Math.min(99, quantity));
      this.save();
      this.updateUI();
    }
  }
  
  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  
  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  getState() {
    return {
      items: this.items,
      total: this.getTotal(),
      itemCount: this.getItemCount(),
      lastUpdated: new Date()
    };
  }
  
  save() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.items));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }
  
  load() {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        this.items = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      this.items = [];
    }
  }
  
  clear() {
    this.items = [];
    this.save();
    this.updateUI();
  }
  
  updateUI() {
    // Update cart count badge
    const countBadge = document.querySelector('.cart-count');
    if (countBadge) {
      countBadge.textContent = this.getItemCount();
      countBadge.style.display = this.getItemCount() > 0 ? 'flex' : 'none';
    }
  }
  
  openCart() {
    const modal = document.querySelector('.cart-modal');
    if (!modal) return;
    
    // Render cart items
    const cartContent = modal.querySelector('.cart-content');
    if (this.items.length === 0) {
      cartContent.innerHTML = this.renderEmptyState();
    } else {
      cartContent.innerHTML = this.renderCartItems();
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  renderEmptyState() {
    return `
      <div class="empty-state">
        <svg class="empty-icon" width="64" height="64" viewBox="0 0 24 24">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>
        </svg>
        <h3>سلة المشتريات فارغة</h3>
        <p>لم تقم بإضافة أي منتجات بعد</p>
        <a href="#products" class="btn btn-primary">تصفح المنتجات</a>
      </div>
    `;
  }
  
  renderCartItems() {
    const itemsHTML = this.items.map(item => `
      <div class="cart-item" data-product-id="${item.productId}">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p class="cart-item-price">${item.price} ريال</p>
        </div>
        <div class="cart-item-controls">
          <button class="quantity-btn" onclick="cart.updateQuantity('${item.productId}', ${item.quantity - 1})">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="quantity-btn" onclick="cart.updateQuantity('${item.productId}', ${item.quantity + 1})">+</button>
        </div>
        <button class="remove-btn" onclick="cart.removeItem('${item.productId}')" aria-label="حذف ${item.name}">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    `).join('');
    
    return `
      <div class="cart-items">
        ${itemsHTML}
      </div>
      <div class="cart-summary">
        <div class="cart-total">
          <span>المجموع:</span>
          <span class="total-amount">${this.getTotal()} ريال سعودي</span>
        </div>
        <button class="btn btn-primary btn-lg checkout-btn">
          إتمام الطلب
        </button>
      </div>
    `;
  }
  
  showNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
      <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('toast-show'), 100);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

export default CartSystem;
```

### 10. Footer Component

```html
<!-- Footer Structure -->
<footer class="footer" role="contentinfo">
  <div class="footer-container">
    <!-- Company Info -->
    <div class="footer-section">
      <img src="logo.png" alt="Bright AI" class="footer-logo" width="120" height="32">
      <p class="footer-description">
        شركة سعودية رائدة في مجال الذكاء الاصطناعي، نقدم حلول مبتكرة لتحسين الأعمال
      </p>
      <div class="footer-social">
        <a href="https://twitter.com/brightai" aria-label="تويتر" rel="noopener noreferrer" target="_blank">
          <svg><!-- Twitter icon --></svg>
        </a>
        <a href="https://linkedin.com/company/brightai" aria-label="لينكد إن" rel="noopener noreferrer" target="_blank">
          <svg><!-- LinkedIn icon --></svg>
        </a>
        <a href="https://instagram.com/brightai" aria-label="إنستغرام" rel="noopener noreferrer" target="_blank">
          <svg><!-- Instagram icon --></svg>
        </a>
      </div>
    </div>
    
    <!-- Quick Links -->
    <div class="footer-section">
      <h3 class="footer-title">روابط سريعة</h3>
      <ul class="footer-links">
        <li><a href="/">الرئيسية</a></li>
        <li><a href="/our-products">المنتجات</a></li>
        <li><a href="/about-us">عن الشركة</a></li>
        <li><a href="/blog">المدونة</a></li>
        <li><a href="/contact">تواصل معنا</a></li>
      </ul>
    </div>
    
    <!-- Services -->
    <div class="footer-section">
      <h3 class="footer-title">خدماتنا</h3>
      <ul class="footer-links">
        <li><a href="/data-analysis">تحليل البيانات</a></li>
        <li><a href="/smart-automation">الأتمتة الذكية</a></li>
        <li><a href="/ai-agent">وكلاء الذكاء الاصطناعي</a></li>
        <li><a href="/ai-bots">روبوتات المحادثة</a></li>
        <li><a href="/consultation">استشارات AI</a></li>
      </ul>
    </div>
    
    <!-- Contact Info -->
    <div class="footer-section">
      <h3 class="footer-title">تواصل معنا</h3>
      <ul class="footer-contact">
        <li>
          <svg><!-- Phone icon --></svg>
          <a href="tel:+966538229013">+966 53 822 9013</a>
        </li>
        <li>
          <svg><!-- Email icon --></svg>
          <a href="mailto:info@brightai.site">info@brightai.site</a>
        </li>
        <li>
          <svg><!-- Location icon --></svg>
          <span>الرياض، المملكة العربية السعودية</span>
        </li>
      </ul>
    </div>
  </div>
  
  <!-- Footer Bottom -->
  <div class="footer-bottom">
    <div class="footer-container">
      <p class="footer-copyright">
        © <span id="current-year">2025</span> Bright AI. جميع الحقوق محفوظة.
      </p>
      <div class="footer-legal">
        <a href="/privacy-policy">سياسة الخصوصية</a>
        <a href="/terms-and-conditions">الشروط والأحكام</a>
      </div>
    </div>
  </div>
</footer>
```

```css
/* Footer Styles */
.footer {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border);
  padding: var(--space-16) 0 var(--space-8);
  margin-top: var(--space-20);
}

.footer-container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-8);
}

.footer-logo {
  margin-bottom: var(--space-4);
}

.footer-description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  margin-bottom: var(--space-4);
}

.footer-social {
  display: flex;
  gap: var(--space-3);
}

.footer-social a {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  transition: all var(--transition-base);
}

.footer-social a:hover {
  background: var(--color-primary);
  color: var(--text-on-primary);
  transform: translateY(-2px);
}

.footer-title {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  font-weight: 600;
}

.footer-links,
.footer-contact {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li,
.footer-contact li {
  margin-bottom: var(--space-2);
}

.footer-links a,
.footer-contact a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: color var(--transition-fast);
  display: inline-block;
}

.footer-links a:hover,
.footer-contact a:hover {
  color: var(--color-primary);
}

.footer-contact li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.footer-contact svg {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
}

.footer-bottom {
  border-top: 1px solid var(--glass-border);
  margin-top: var(--space-8);
  padding-top: var(--space-6);
}

.footer-bottom .footer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.footer-copyright {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.footer-legal {
  display: flex;
  gap: var(--space-4);
}

.footer-legal a {
  color: var(--text-tertiary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: color var(--transition-fast);
}

.footer-legal a:hover {
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .footer-container {
    grid-template-columns: 1fr;
  }
  
  .footer-bottom .footer-container {
    flex-direction: column;
    text-align: center;
  }
}
```

### 11. Testimonials Section

```html
<!-- Testimonials Section Structure -->
<section class="testimonials" id="testimonials">
  <div class="container">
    <div class="section-header">
      <span class="section-badge">آراء العملاء</span>
      <h2 class="section-title">
        <span class="gradient-text">ماذا يقول</span> عملاؤنا
      </h2>
      <p class="section-description">
        نفخر بثقة عملائنا ونسعى دائماً لتقديم أفضل الحلول
      </p>
    </div>
    
    <div class="testimonials-grid">
      <!-- Testimonial Card 1 -->
      <article class="testimonial-card">
        <div class="testimonial-rating">
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
        </div>
        <blockquote class="testimonial-text">
          "خدمة ممتازة وحلول مبتكرة ساعدتنا في تحسين كفاءة العمل بشكل كبير. فريق محترف ومتعاون."
        </blockquote>
        <div class="testimonial-author">
          <img src="avatar1.jpg" alt="" class="author-avatar" width="48" height="48">
          <div class="author-info">
            <cite class="author-name">أحمد المالكي</cite>
            <span class="author-role">مدير تقنية المعلومات، شركة النجاح</span>
          </div>
        </div>
      </article>
      
      <!-- Testimonial Card 2 -->
      <article class="testimonial-card">
        <div class="testimonial-rating">
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
        </div>
        <blockquote class="testimonial-text">
          "تجربة رائعة مع فريق Bright AI. النتائج فاقت التوقعات والدعم الفني ممتاز."
        </blockquote>
        <div class="testimonial-author">
          <img src="avatar2.jpg" alt="" class="author-avatar" width="48" height="48">
          <div class="author-info">
            <cite class="author-name">سارة العتيبي</cite>
            <span class="author-role">مديرة التسويق، مؤسسة الإبداع</span>
          </div>
        </div>
      </article>
      
      <!-- Testimonial Card 3 -->
      <article class="testimonial-card">
        <div class="testimonial-rating">
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
          <svg class="star-icon" aria-hidden="true"><!-- Star --></svg>
        </div>
        <blockquote class="testimonial-text">
          "حلول الذكاء الاصطناعي من Bright AI ساعدتنا في أتمتة العمليات وتوفير الوقت والجهد."
        </blockquote>
        <div class="testimonial-author">
          <img src="avatar3.jpg" alt="" class="author-avatar" width="48" height="48">
          <div class="author-info">
            <cite class="author-name">خالد السعيد</cite>
            <span class="author-role">الرئيس التنفيذي، شركة التطور</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</section>
```

```css
/* Testimonials Styles */
.testimonials {
  padding: var(--space-20) 0;
  background: var(--bg-secondary);
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-badge {
  display: inline-block;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  line-height: 1.2;
}

.section-description {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.testimonial-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all var(--transition-base);
  box-shadow: var(--glass-shadow);
}

.testimonial-card:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  box-shadow: var(--glass-shadow-hover);
  transform: translateY(-4px);
}

.testimonial-rating {
  display: flex;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}

.star-icon {
  width: 20px;
  height: 20px;
  fill: var(--color-primary);
}

.testimonial-text {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 var(--space-6);
  font-style: italic;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--glass-border);
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 600;
  font-style: normal;
}

.author-role {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}
```

## Data Models

### Product Model
```typescript
interface Product {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  currency: 'SAR';
  category: 'data-analysis' | 'automation' | 'ai-agents' | 'robots';
  deliveryTime: string;
  features: string[];
  featuresEn: string[];
  image?: string;
  badge?: string;
  isPopular?: boolean;
}
```

### Cart Item Model
```typescript
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  addedAt: Date;
}
```

### Cart State Model
```typescript
interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  lastUpdated: Date;
 }
```

### Analytics Event Model
```typescript
interface AnalyticsEvent {
  eventName: string;
  eventCategory: string;
  eventLabel?: string;
  eventValue?: number;
  customParams?: Record<string, any>;
}
```

### Translation Model
```typescript
interface Translation {
  [key: string]: string | Translation;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Hero Section Display Completeness
*For any* page load, the Hero Section should display all required elements (headline, subheadline, at least two CTA buttons, and animated background) with proper styling and accessibility attributes.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Animation Performance Threshold
*For any* animation running on the page (particles, gradients, scroll effects), the frame rate should remain at or above 30fps, and animations should be disabled when the user has prefers-reduced-motion enabled.

**Validates: Requirements 2.3, 2.5**

### Property 3: Product Card Information Completeness
*For any* product card rendered, it should display all required information (name, description, price, delivery time) and contain properly labeled buy and details buttons with ARIA attributes.

**Validates: Requirements 3.1, 3.5**

### Property 4: Product Card Hover State Consistency
*For any* product card, hovering should apply the lift and glow effect consistently, and the effect should be reversible when hover ends.

**Validates: Requirements 3.2**

### Property 5: Modal Open/Close Round Trip
*For any* modal, opening then closing should return the page to its original state (body scroll restored, focus returned to trigger element, modal content reset).

**Validates: Requirements 3.4, 12.3, 12.4**

### Property 6: Navigation Link Accessibility
*For any* navigation link, it should be a proper anchor element (not a button), have keyboard focus indicators, and support keyboard navigation.

**Validates: Requirements 4.3, 4.5**

### Property 7: SEO Meta Tags Completeness
*For any* page load, all required SEO meta tags (title, description, OG tags, Twitter cards, structured data) should be present and properly formatted.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 8: Heading Hierarchy Validity
*For any* page, there should be exactly one H1 element, and all heading levels should follow logical order without skipping levels.

**Validates: Requirements 5.4**

### Property 9: Color Contrast Compliance
*For any* text element on the page, the color contrast ratio against its background should meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 6.1**

### Property 10: Keyboard Navigation Completeness
*For any* interactive element, it should be reachable and operable using only keyboard navigation (Tab, Enter, Space, Escape).

**Validates: Requirements 6.3**

### Property 11: Touch Target Size Compliance
*For any* interactive element on mobile, the touch target should be at least 44x44 pixels.

**Validates: Requirements 6.5**

### Property 12: Focus Trap in Modal
*For any* open modal, pressing Tab should cycle focus only within the modal elements, and pressing Escape should close the modal and return focus.

**Validates: Requirements 6.6, 12.3**

### Property 13: Cart Addition Notification
*For any* product added to cart, the system should display a notification with the product name and update the cart count.

**Validates: Requirements 8.1**

### Property 14: Cart Persistence Round Trip
*For any* cart state, saving to localStorage then loading should produce an equivalent cart state with the same items, quantities, and total.

**Validates: Requirements 8.2**

### Property 15: Cart Total Calculation Accuracy
*For any* cart state, the displayed total should equal the sum of (price × quantity) for all items.

**Validates: Requirements 8.6**

### Property 16: Language Switch Round Trip
*For any* language preference, switching from Arabic to English and back to Arabic should restore all Arabic translations correctly.

**Validates: Requirements 15.1, 15.2, 15.3, 15.5**

### Property 17: RTL/LTR Direction Consistency
*For any* language setting, all UI elements should consistently follow the correct text direction (RTL for Arabic, LTR for English).

**Validates: Requirements 15.2, 15.3**

### Property 18: Analytics Event Tracking
*For any* tracked user action (CTA click, add to cart, purchase), the system should fire the corresponding analytics event with correct parameters.

**Validates: Requirements 13.3, 13.4, 13.5**

### Property 19: Image Lazy Loading
*For any* image below the fold, it should not be loaded until it enters the viewport or is about to enter.

**Validates: Requirements 7.2**

### Property 20: External Link Security
*For any* external link, it should include rel="noopener noreferrer" attributes for security.

**Validates: Requirements 17.4**

## Error Handling

### Client-Side Error Handling

#### 1. Network Errors
```javascript
// Graceful handling of failed API calls
async function fetchWithRetry(url, options = {}, retries = 3) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}
```

#### 2. LocalStorage Errors
```javascript
// Safe localStorage operations with fallback
class SafeStorage {
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('localStorage error:', error);
      // Fallback to in-memory storage
      this.memoryStorage = this.memoryStorage || {};
      this.memoryStorage[key] = value;
      return false;
    }
  }
  
  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('localStorage error:', error);
      return this.memoryStorage?.[key] || null;
    }
  }
}
```

#### 3. Animation Errors
```javascript
// Graceful degradation for animation failures
function initAnimations() {
  try {
    const canvas = document.querySelector('.hero-particles');
    if (!canvas || !canvas.getContext) {
      throw new Error('Canvas not supported');
    }
    
    const particleSystem = new ParticleSystem(canvas);
    return particleSystem;
  } catch (error) {
    console.warn('Animations disabled:', error);
    // Remove canvas and show static gradient
    document.querySelector('.hero-particles')?.remove();
    return null;
  }
}
```

#### 4. Translation Loading Errors
```javascript
// Fallback to default language on translation failure
async loadTranslations(lang) {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) throw new Error('Translation file not found');
    this.translations = await response.json();
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to Arabic
    if (lang !== 'ar') {
      console.warn('Falling back to Arabic');
      await this.loadTranslations('ar');
    }
  }
}
```

### User-Facing Error Messages

#### Empty Cart State
```html
<div class="empty-state">
  <svg class="empty-icon"><!-- Cart icon --></svg>
  <h3>سلة المشتريات فارغة</h3>
  <p>لم تقم بإضافة أي منتجات بعد</p>
  <a href="#products" class="btn btn-primary">تصفح المنتجات</a>
</div>
```

#### Payment Error State
```html
<div class="error-state">
  <svg class="error-icon"><!-- Alert icon --></svg>
  <h3>حدث خطأ في عملية الدفع</h3>
  <p>نعتذر عن الإزعاج. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.</p>
  <div class="error-actions">
    <button class="btn btn-primary">إعادة المحاولة</button>
    <a href="/contact" class="btn btn-outline">تواصل مع الدعم</a>
  </div>
</div>
```

#### Network Error Toast
```javascript
function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-error';
  toast.innerHTML = `
    <svg class="toast-icon"><!-- Alert icon --></svg>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}
```

### Error Logging

```javascript
// Centralized error logging
class ErrorLogger {
  static log(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorData);
    }
    
    // Send to analytics in production
    if (window.gtag) {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }
}
```

## Testing Strategy

### Dual Testing Approach

نستخدم نهج اختبار مزدوج يجمع بين:
- **Unit Tests**: للتحقق من أمثلة محددة وحالات الحافة
- **Property-Based Tests**: للتحقق من الخصائص العامة عبر جميع المدخلات

### Testing Framework Selection

**Property-Based Testing Library**: [fast-check](https://github.com/dubzzz/fast-check)
- مكتبة PBT قوية لـ JavaScript/TypeScript
- دعم ممتاز للـ generators
- تكامل سلس مع Vitest/Jest

**Unit Testing Framework**: [Vitest](https://vitest.dev/)
- سريع وحديث
- دعم ES modules
- API متوافق مع Jest

### Property Test Configuration

```javascript
// vitest.config.js
export default {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js'
  }
};
```

```javascript
// tests/setup.js
import { fc } from 'fast-check';

// Configure fast-check for all tests
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test
  verbose: true
});
```

### Property Test Examples

#### Property 1: Hero Section Display Completeness
```javascript
// tests/hero.property.test.js
import { describe, it, expect } from 'vitest';
import { fc } from 'fast-check';

/**
 * Feature: products-page-redesign
 * Property 1: Hero Section Display Completeness
 * For any page load, the Hero Section should display all required elements
 */
describe('Property 1: Hero Section Display', () => {
  it('should display all required elements on any page load', () => {
    fc.assert(
      fc.property(
        fc.record({
          viewport: fc.record({
            width: fc.integer({ min: 320, max: 1920 }),
            height: fc.integer({ min: 568, max: 1080 })
          })
        }),
        (config) => {
          // Set viewport
          window.innerWidth = config.viewport.width;
          window.innerHeight = config.viewport.height;
          
          // Render hero section
          const hero = document.querySelector('.hero');
          
          // Verify all required elements exist
          expect(hero.querySelector('.hero-title')).toBeTruthy();
          expect(hero.querySelector('.hero-description')).toBeTruthy();
          
          const ctaButtons = hero.querySelectorAll('.hero-cta .btn');
          expect(ctaButtons.length).toBeGreaterThanOrEqual(2);
          
          const background = hero.querySelector('.hero-particles') || 
                           hero.querySelector('.hero-gradient-overlay');
          expect(background).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 14: Cart Persistence Round Trip
```javascript
// tests/cart.property.test.js
/**
 * Feature: products-page-redesign
 * Property 14: Cart Persistence Round Trip
 * For any cart state, saving then loading should produce equivalent state
 */
describe('Property 14: Cart Persistence', () => {
  it('should preserve cart state through save/load cycle', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            productId: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.integer({ min: 1, max: 10000 }),
            quantity: fc.integer({ min: 1, max: 99 })
          }),
          { maxLength: 20 }
        ),
        (cartItems) => {
          const cart = new CartSystem();
          
          // Add items to cart
          cartItems.forEach(item => {
            cart.addItem(item);
          });
          
          const originalState = cart.getState();
          
          // Save to localStorage
          cart.save();
          
          // Create new cart instance and load
          const newCart = new CartSystem();
          newCart.load();
          
          const loadedState = newCart.getState();
          
          // Verify equivalence
          expect(loadedState.items).toEqual(originalState.items);
          expect(loadedState.total).toBe(originalState.total);
          expect(loadedState.itemCount).toBe(originalState.itemCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 15: Cart Total Calculation Accuracy
```javascript
/**
 * Feature: products-page-redesign
 * Property 15: Cart Total Calculation Accuracy
 * For any cart state, total should equal sum of (price × quantity)
 */
describe('Property 15: Cart Total Calculation', () => {
  it('should calculate total accurately for any cart state', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            productId: fc.string(),
            price: fc.integer({ min: 1, max: 10000 }),
            quantity: fc.integer({ min: 1, max: 99 })
          })
        ),
        (items) => {
          const cart = new CartSystem();
          items.forEach(item => cart.addItem(item));
          
          const expectedTotal = items.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
          );
          
          expect(cart.getTotal()).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

#### Unit Test: Empty Cart State
```javascript
// tests/cart.unit.test.js
describe('Cart System - Edge Cases', () => {
  it('should display empty state when cart has no items', () => {
    const cart = new CartSystem();
    const emptyState = cart.render();
    
    expect(emptyState).toContain('سلة المشتريات فارغة');
    expect(cart.getItemCount()).toBe(0);
    expect(cart.getTotal()).toBe(0);
  });
  
  it('should handle adding item with zero quantity', () => {
    const cart = new CartSystem();
    const result = cart.addItem({
      productId: 'test-1',
      quantity: 0,
      price: 100
    });
    
    expect(result).toBe(false);
    expect(cart.getItemCount()).toBe(0);
  });
});
```

#### Unit Test: Modal Keyboard Navigation
```javascript
// tests/modal.unit.test.js
describe('Modal - Keyboard Navigation', () => {
  it('should close modal on Escape key', () => {
    const modal = new Modal('#test-modal');
    modal.open();
    
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);
    
    expect(modal.isOpen()).toBe(false);
  });
  
  it('should trap focus within modal', () => {
    const modal = new Modal('#test-modal');
    modal.open();
    
    const firstFocusable = modal.element.querySelector('button');
    const lastFocusable = modal.element.querySelectorAll('button')[1];
    
    // Tab from last element should focus first
    lastFocusable.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    lastFocusable.dispatchEvent(tabEvent);
    
    expect(document.activeElement).toBe(firstFocusable);
  });
});
```

### Integration Tests

```javascript
// tests/integration/checkout-flow.test.js
describe('Checkout Flow Integration', () => {
  it('should complete full checkout flow', async () => {
    // Add product to cart
    const addButton = document.querySelector('[data-product-id="data-1"]');
    addButton.click();
    
    // Verify cart updated
    expect(document.querySelector('.cart-count').textContent).toBe('1');
    
    // Open cart
    document.querySelector('.cart-btn').click();
    await waitFor(() => document.querySelector('.cart-modal.active'));
    
    // Proceed to checkout
    document.querySelector('.checkout-btn').click();
    
    // Verify checkout page loaded
    expect(window.location.href).toContain('/checkout');
  });
});
```

### Accessibility Tests

```javascript
// tests/accessibility.test.js
import { axe } from 'jest-axe';

describe('Accessibility Compliance', () => {
  it('should have no accessibility violations', async () => {
    const results = await axe(document.body);
    expect(results.violations).toHaveLength(0);
  });
  
  it('should have proper ARIA labels on all interactive elements', () => {
    const buttons = document.querySelectorAll('button, a');
    buttons.forEach(button => {
      const hasLabel = button.getAttribute('aria-label') || 
                      button.textContent.trim().length > 0;
      expect(hasLabel).toBe(true);
    });
  });
});
```

### Performance Tests

```javascript
// tests/performance.test.js
describe('Performance Benchmarks', () => {
  it('should maintain 30fps during animations', async () => {
    const frameRates = [];
    let lastTime = performance.now();
    
    const measureFrame = () => {
      const currentTime = performance.now();
      const fps = 1000 / (currentTime - lastTime);
      frameRates.push(fps);
      lastTime = currentTime;
      
      if (frameRates.length < 60) {
        requestAnimationFrame(measureFrame);
      }
    };
    
    requestAnimationFrame(measureFrame);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const avgFps = frameRates.reduce((a, b) => a + b) / frameRates.length;
    expect(avgFps).toBeGreaterThanOrEqual(30);
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All 20 correctness properties implemented
- **Integration Tests**: Critical user flows (checkout, cart, navigation)
- **Accessibility Tests**: WCAG 2.1 AA compliance
- **Performance Tests**: Lighthouse score 80+

### Continuous Testing

```javascript
// package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/**/*.unit.test.js",
    "test:property": "vitest run tests/**/*.property.test.js",
    "test:integration": "vitest run tests/integration/**/*.test.js",
    "test:a11y": "vitest run tests/accessibility.test.js",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```
