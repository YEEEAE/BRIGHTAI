# ترقية موقع Bright AI - التصميم التقني المؤسسي

## نظرة عامة على الحل
تحويل الموقع إلى منصة مؤسسية فاخرة (Enterprise-Grade) تستهدف الشركات الكبرى والجهات الحكومية السعودية.

---

## 1. نظام التصميم المؤسسي (Design System)

### 1.1 Design Tokens

```css
/* css/design-tokens-enterprise.css */
:root {
    /* === COLORS === */
    /* Primary - Navy Deep */
    --color-navy-950: #020617;
    --color-navy-900: #0A0F1C;
    --color-navy-800: #0F172A;
    --color-navy-700: #1E293B;
    
    /* Secondary - Slate Professional */
    --color-slate-600: #475569;
    --color-slate-500: #64748B;
    --color-slate-400: #94A3B8;
    --color-slate-300: #CBD5E1;
    
    /* Accent - Gold Executive */
    --color-gold-500: #D4AF37;
    --color-gold-400: #E5C158;
    --color-gold-600: #B8860B;
    
    /* Semantic */
    --color-success: #10B981;
    --color-warning: #F59E0B;
    --color-error: #EF4444;

    /* === TYPOGRAPHY === */
    --font-arabic: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
    --font-english: 'Inter', 'IBM Plex Sans', sans-serif;
    
    /* Font Sizes */
    --text-xs: 0.75rem;      /* 12px */
    --text-sm: 0.875rem;     /* 14px */
    --text-base: 1rem;       /* 16px */
    --text-lg: 1.125rem;     /* 18px */
    --text-xl: 1.25rem;      /* 20px */
    --text-2xl: 1.5rem;      /* 24px */
    --text-3xl: 1.875rem;    /* 30px */
    --text-4xl: 2.25rem;     /* 36px */
    --text-5xl: 3rem;        /* 48px */
    --text-6xl: 3.75rem;     /* 60px */
    
    /* Line Heights */
    --leading-tight: 1.25;
    --leading-normal: 1.5;
    --leading-relaxed: 1.75;
    
    /* === SPACING === */
    --space-1: 0.25rem;   /* 4px */
    --space-2: 0.5rem;    /* 8px */
    --space-3: 0.75rem;   /* 12px */
    --space-4: 1rem;      /* 16px */
    --space-6: 1.5rem;    /* 24px */
    --space-8: 2rem;      /* 32px */
    --space-12: 3rem;     /* 48px */
    --space-16: 4rem;     /* 64px */
    --space-24: 6rem;     /* 96px */
    
    /* === BORDERS === */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-2xl: 24px;
    
    /* === SHADOWS === */
    --shadow-subtle: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-medium: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-elevated: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --shadow-glow-gold: 0 0 30px rgba(212, 175, 55, 0.2);
    
    /* === TRANSITIONS === */
    --transition-fast: 150ms ease;
    --transition-base: 300ms ease;
    --transition-slow: 500ms ease;
    --transition-smooth: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Hero Section المؤسسي

### 2.1 الهيكل HTML

```html
<!-- ENTERPRISE HERO SECTION -->
<header class="enterprise-hero relative min-h-screen flex items-center justify-center overflow-hidden">
    
    <!-- Animated Background Canvas -->
    <canvas id="hero-canvas" class="absolute inset-0 w-full h-full"></canvas>
    
    <!-- Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-900/60 to-navy-950"></div>
    
    <!-- Content -->
    <div class="relative z-10 max-w-5xl mx-auto px-6 text-center">
        
        <!-- Badge -->
        <div class="inline-flex items-center gap-3 px-5 py-2 mb-8 rounded-full 
                    bg-navy-800/50 border border-slate-700/50 backdrop-blur-sm">
            <span class="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
            <span class="text-slate-300 text-sm font-medium">شريككم الاستراتيجي للتحول الرقمي</span>
        </div>
        
        <!-- Main Headline -->
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            نُمكّن المؤسسات السعودية من
            <span class="block text-gold-500">قيادة مستقبل الذكاء الاصطناعي</span>
        </h1>
        
        <!-- Subheadline -->
        <p class="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            حلول ذكاء اصطناعي مؤسسية مصممة للشركات الكبرى والجهات الحكومية.
            بيانات تُدار وتُستضاف داخل المملكة بمعايير أمنية قصوى.
        </p>
        
        <!-- CTA -->
        <a href="https://wa.me/966538229013" target="_blank" rel="noopener"
           class="inline-flex items-center gap-3 px-8 py-4 
                  bg-gold-500 hover:bg-gold-400 text-navy-950 
                  font-semibold text-lg rounded-lg
                  shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30
                  transition-all duration-300 transform hover:-translate-y-0.5">
            <span>طلب استشارة تنفيذية</span>
            <iconify-icon icon="lucide:arrow-left" width="20"></iconify-icon>
        </a>
        
        <!-- Trust Indicators -->
        <div class="mt-16 flex flex-wrap justify-center gap-8 text-slate-500 text-sm">
            <div class="flex items-center gap-2">
                <iconify-icon icon="lucide:shield-check" width="18"></iconify-icon>
                <span>متوافق مع NCA</span>
            </div>
            <div class="flex items-center gap-2">
                <iconify-icon icon="lucide:database" width="18"></iconify-icon>
                <span>استضافة محلية</span>
            </div>
            <div class="flex items-center gap-2">
                <iconify-icon icon="lucide:building-2" width="18"></iconify-icon>
                <span>جاهز للمؤسسات</span>
            </div>
        </div>
    </div>
</header>
```

### 2.2 Canvas Animation (خلفية هادئة)

```javascript
// js/hero-canvas.js - Enterprise Neural Network Animation
class EnterpriseHeroCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.animationId = null;
        
        this.config = {
            nodeCount: 50,
            connectionDistance: 150,
            nodeSpeed: 0.3,  // بطيء وهادئ
            nodeColor: 'rgba(212, 175, 55, 0.3)',  // Gold subtle
            lineColor: 'rgba(148, 163, 184, 0.1)', // Slate subtle
            nodeRadius: 2
        };
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createNodes();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
        
        // Respect reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.config.nodeSpeed = 0;
        }
    }
    
    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    createNodes() {
        this.nodes = [];
        for (let i = 0; i < this.config.nodeCount; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.config.nodeSpeed,
                vy: (Math.random() - 0.5) * this.config.nodeSpeed
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        this.nodes.forEach((node, i) => {
            this.nodes.slice(i + 1).forEach(other => {
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.config.connectionDistance) {
                    const opacity = (1 - dist / this.config.connectionDistance) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(node.x, node.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.stroke();
                }
            });
        });
        
        // Draw and update nodes
        this.nodes.forEach(node => {
            // Draw
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.config.nodeRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.config.nodeColor;
            this.ctx.fill();
            
            // Update position
            node.x += node.vx;
            node.y += node.vy;
            
            // Bounce
            if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new EnterpriseHeroCanvas('hero-canvas');
});
```

---

## 3. قسم القيمة المقترحة (Value Proposition)

```html
<!-- VALUE PROPOSITION SECTION -->
<section class="py-24 px-6 bg-navy-900 relative">
    <div class="max-w-6xl mx-auto">
        
        <!-- Section Header -->
        <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">
                من الابتكار الكامل إلى التطوير المخصص
                <span class="block text-gold-500 mt-2">ذكاء اصطناعي يخدم أهدافك</span>
            </h2>
            <p class="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
                اصنع تحولاً جذرياً في مسار أعمالك معنا. نحن لا نبني أنظمة مبتكرة تضاعف النمو فحسب، 
                بل نقدم خدمات تطوير متقدمة لنظامك الخاص ليعمل بذكاء وكفاءة لم تعهدها من قبل.
            </p>
        </div>
        
        <!-- Two Cards -->
        <div class="grid md:grid-cols-2 gap-8">
            
            <!-- Innovation Card -->
            <div class="group p-8 rounded-xl bg-navy-800/50 border border-slate-700/50
                        hover:border-gold-500/30 transition-all duration-300
                        hover:shadow-lg hover:shadow-gold-500/5">
                <div class="w-14 h-14 rounded-lg bg-gold-500/10 flex items-center justify-center mb-6
                            group-hover:bg-gold-500/20 transition-colors">
                    <iconify-icon icon="lucide:lightbulb" width="28" class="text-gold-500"></iconify-icon>
                </div>
                <h3 class="text-xl font-semibold text-white mb-3">الابتكار الكامل</h3>
                <p class="text-slate-400 leading-relaxed">
                    نبني لك نظاماً ذكياً من الصفر، مصمماً خصيصاً لتحدياتك وأهدافك الفريدة.
                    من التصور إلى التشغيل الكامل.
                </p>
            </div>
            
            <!-- Development Card -->
            <div class="group p-8 rounded-xl bg-navy-800/50 border border-slate-700/50
                        hover:border-gold-500/30 transition-all duration-300
                        hover:shadow-lg hover:shadow-gold-500/5">
                <div class="w-14 h-14 rounded-lg bg-gold-500/10 flex items-center justify-center mb-6
                            group-hover:bg-gold-500/20 transition-colors">
                    <iconify-icon icon="lucide:settings" width="28" class="text-gold-500"></iconify-icon>
                </div>
                <h3 class="text-xl font-semibold text-white mb-3">التطوير المخصص</h3>
                <p class="text-slate-400 leading-relaxed">
                    نطور نظامك الحالي ونضيف إليه قدرات الذكاء الاصطناعي 
                    ليعمل بكفاءة غير مسبوقة دون إعادة البناء من الصفر.
                </p>
            </div>
        </div>
    </div>
</section>
```

---

## 4. قسم الثقة المؤسسية (Trust Layer)

```html
<!-- TRUST & COMPLIANCE SECTION -->
<section class="py-24 px-6 bg-navy-950 border-y border-slate-800">
    <div class="max-w-6xl mx-auto">
        
        <!-- Header -->
        <div class="text-center mb-16">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                        bg-green-500/10 border border-green-500/20 mb-6">
                <iconify-icon icon="lucide:shield-check" width="18" class="text-green-500"></iconify-icon>
                <span class="text-green-400 text-sm font-medium">الامتثال والحوكمة</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
                حلول ذكاء اصطناعي مؤسسية
            </h2>
            <p class="text-xl text-gold-500 font-medium">
                بيانات تُدار وتُستضاف داخل المملكة
            </p>
        </div>
        
        <!-- Compliance Grid -->
        <div class="grid md:grid-cols-3 gap-6 mb-12">
            
            <!-- NCA -->
            <div class="p-6 rounded-xl bg-navy-900/50 border border-slate-800 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 
                            flex items-center justify-center">
                    <iconify-icon icon="lucide:shield" width="32" class="text-slate-400"></iconify-icon>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">NCA</h3>
                <p class="text-slate-500 text-sm">
                    متوافق مع معايير الهيئة الوطنية للأمن السيبراني
                </p>
            </div>
            
            <!-- NDMO -->
            <div class="p-6 rounded-xl bg-navy-900/50 border border-slate-800 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 
                            flex items-center justify-center">
                    <iconify-icon icon="lucide:database" width="32" class="text-slate-400"></iconify-icon>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">NDMO</h3>
                <p class="text-slate-500 text-sm">
                    ملتزمون بسياسات مكتب إدارة البيانات الوطنية
                </p>
            </div>
            
            <!-- Local Hosting -->
            <div class="p-6 rounded-xl bg-navy-900/50 border border-slate-800 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 
                            flex items-center justify-center">
                    <iconify-icon icon="lucide:server" width="32" class="text-slate-400"></iconify-icon>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">استضافة محلية</h3>
                <p class="text-slate-500 text-sm">
                    بياناتك تبقى داخل حدود المملكة العربية السعودية
                </p>
            </div>
        </div>
        
        <!-- Key Message -->
        <div class="text-center p-8 rounded-xl bg-gradient-to-r from-navy-800/50 to-navy-900/50 
                    border border-slate-700/50">
            <p class="text-slate-300 text-lg leading-relaxed max-w-3xl mx-auto">
                نحن جاهزون للتعامل مع <span class="text-white font-semibold">العقود الكبيرة</span> 
                و<span class="text-white font-semibold">البيئات الحساسة</span>. 
                خبرتنا في القطاعات الحكومية والمؤسسية تضمن لك شريكاً يفهم متطلباتك الأمنية والتنظيمية.
            </p>
        </div>
    </div>
</section>
```

---

## 5. قسم القطاعات (Industries)

```html
<!-- INDUSTRIES SECTION -->
<section class="py-24 px-6 bg-navy-900">
    <div class="max-w-6xl mx-auto">
        
        <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
                تطبيقات قطاعية متخصصة
            </h2>
            <p class="text-slate-400 text-lg">
                حلول مصممة لتحديات كل قطاع
            </p>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <!-- Retail -->
            <div class="group p-6 rounded-xl bg-navy-800/30 border border-slate-800
                        hover:border-slate-700 transition-all duration-300">
                <iconify-icon icon="lucide:shopping-bag" width="32" 
                              class="text-slate-500 group-hover:text-gold-500 transition-colors mb-4"></iconify-icon>
                <h3 class="text-lg font-semibold text-white mb-2">التجزئة</h3>
                <p class="text-slate-500 text-sm">تحليل سلوك العملاء وتحسين المخزون</p>
            </div>
            
            <!-- Manufacturing -->
            <div class="group p-6 rounded-xl bg-navy-800/30 border border-slate-800
                        hover:border-slate-700 transition-all duration-300">
                <iconify-icon icon="lucide:factory" width="32" 
                              class="text-slate-500 group-hover:text-gold-500 transition-colors mb-4"></iconify-icon>
                <h3 class="text-lg font-semibold text-white mb-2">الصناعة</h3>
                <p class="text-slate-500 text-sm">الصيانة التنبؤية ومراقبة الجودة</p>
            </div>
            
            <!-- Healthcare -->
            <div class="group p-6 rounded-xl bg-navy-800/30 border border-slate-800
                        hover:border-slate-700 transition-all duration-300">
                <iconify-icon icon="lucide:heart-pulse" width="32" 
                              class="text-slate-500 group-hover:text-gold-500 transition-colors mb-4"></iconify-icon>
                <h3 class="text-lg font-semibold text-white mb-2">الرعاية الصحية</h3>
                <p class="text-slate-500 text-sm">التشخيص الذكي وإدارة الموارد</p>
            </div>
            
            <!-- Government -->
            <div class="group p-6 rounded-xl bg-navy-800/30 border border-slate-800
                        hover:border-slate-700 transition-all duration-300">
                <iconify-icon icon="lucide:landmark" width="32" 
                              class="text-slate-500 group-hover:text-gold-500 transition-colors mb-4"></iconify-icon>
                <h3 class="text-lg font-semibold text-white mb-2">الجهات الحكومية</h3>
                <p class="text-slate-500 text-sm">أتمتة الخدمات وتحليل البيانات</p>
            </div>
        </div>
    </div>
</section>
```

---

## 6. قسم منهجية العمل (Methodology)

```html
<!-- METHODOLOGY SECTION -->
<section class="py-24 px-6 bg-navy-950">
    <div class="max-w-6xl mx-auto">
        
        <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
                منهجية العمل
            </h2>
            <p class="text-slate-400 text-lg">
                من التقييم إلى التشغيل والتحسين المستمر
            </p>
        </div>
        
        <!-- Timeline -->
        <div class="relative">
            <!-- Line -->
            <div class="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2"></div>
            
            <div class="grid md:grid-cols-4 gap-8">
                
                <!-- Step 1 -->
                <div class="relative text-center">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-gold-500 text-navy-950 
                                flex items-center justify-center font-bold text-lg relative z-10">1</div>
                    <h3 class="text-lg font-semibold text-white mb-2">التقييم</h3>
                    <p class="text-slate-500 text-sm">تحليل الوضع الراهن وتحديد الفرص</p>
                </div>
                
                <!-- Step 2 -->
                <div class="relative text-center">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-700 text-white 
                                flex items-center justify-center font-bold text-lg relative z-10">2</div>
                    <h3 class="text-lg font-semibold text-white mb-2">التصميم</h3>
                    <p class="text-slate-500 text-sm">بناء الحل المناسب لاحتياجاتك</p>
                </div>
                
                <!-- Step 3 -->
                <div class="relative text-center">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-700 text-white 
                                flex items-center justify-center font-bold text-lg relative z-10">3</div>
                    <h3 class="text-lg font-semibold text-white mb-2">التنفيذ</h3>
                    <p class="text-slate-500 text-sm">تطوير ونشر الحل بمعايير عالية</p>
                </div>
                
                <!-- Step 4 -->
                <div class="relative text-center">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-700 text-white 
                                flex items-center justify-center font-bold text-lg relative z-10">4</div>
                    <h3 class="text-lg font-semibold text-white mb-2">التحسين</h3>
                    <p class="text-slate-500 text-sm">مراقبة وتحسين مستمر للأداء</p>
                </div>
            </div>
        </div>
    </div>
</section>
```

---

## 7. الشات بوت المؤسسي

### 7.1 System Prompt

```javascript
// js/gemini-chat-enterprise.js
const ENTERPRISE_SYSTEM_PROMPT = `
أنت "مستشار Bright AI" - مساعد ذكي مؤسسي لشركة Bright AI السعودية.

## هويتك:
- الاسم: مستشار Bright AI
- الدور: مساعد دعم فني ومبيعات مؤسسية
- اللغة: العربية الفصحى الرسمية مع لمسة سعودية احترافية

## معلومات الشركة:
- Bright AI (مُشرقة AI) - شركة سعودية متخصصة في حلول الذكاء الاصطناعي المؤسسية
- المقر: الرياض، المملكة العربية السعودية
- الفئة المستهدفة: الشركات الكبرى والجهات الحكومية
- الامتثال: NCA، NDMO، معايير الأمن السيبراني

## الخدمات الرئيسية:
1. الابتكار الكامل - بناء أنظمة ذكية من الصفر
2. التطوير المخصص - تطوير الأنظمة الحالية بالذكاء الاصطناعي
3. AIaaS للمنشآت - خدمات مُدارة للمنشآت الفيزيائية
4. استشارات التحول الرقمي - خارطة طريق استراتيجية
5. تحليل البيانات المتقدم - رؤى قابلة للتنفيذ

## قواعد الرد:
1. كن مختصراً ومهنياً (3-4 جمل كحد أقصى)
2. استخدم لغة رسمية تناسب صناع القرار
3. لا تشارك أي معلومات حساسة أو أسعار محددة
4. وجّه دائماً لحجز استشارة تنفيذية للتفاصيل
5. أكد على السيادة الرقمية والاستضافة المحلية عند الحاجة
6. لا تخترع معلومات غير موجودة

## رابط الاستشارة:
wa.me/966538229013

## أمثلة للردود:
- للأسعار: "تختلف التكلفة حسب نطاق المشروع ومتطلباته. أنصحكم بحجز استشارة تنفيذية لتقييم احتياجاتكم وتقديم عرض مخصص."
- للتفاصيل التقنية: "نقدم حلولاً مؤسسية متكاملة مع ضمان استضافة البيانات داخل المملكة. للتفاصيل التقنية الدقيقة، يسعدنا ترتيب جلسة مع فريقنا التقني."
`;
```

### 7.2 Backend Endpoint

```javascript
// server/endpoints/chat.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Rate limiting
const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: { error: 'عذراً، يرجى الانتظار قليلاً قبل إرسال رسالة جديدة.' }
});

router.post('/chat', chatLimiter, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'الرسالة مطلوبة' });
        }
        
        if (message.length > 500) {
            return res.status(400).json({ error: 'الرسالة طويلة جداً' });
        }
        
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: ENTERPRISE_SYSTEM_PROMPT },
                        { text: `رسالة العميل: ${message}` }
                    ]
                }],
                generationConfig: {
                    maxOutputTokens: 200,
                    temperature: 0.7
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Gemini API error');
        }
        
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'عذراً، حدث خطأ. يرجى المحاولة لاحقاً أو التواصل معنا مباشرة.';
        
        res.json({ reply });
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
            error: 'عذراً، حدث خطأ في الخدمة. يمكنكم التواصل معنا عبر واتساب.' 
        });
    }
});

module.exports = router;
```

---

## 8. Structured Data (SEO)

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Bright AI - مُشرقة AI",
    "alternateName": "مُشرقة للذكاء الاصطناعي",
    "url": "https://brightai.site",
    "logo": "https://brightai.site/Gemini.png",
    "description": "شركة سعودية رائدة في حلول الذكاء الاصطناعي المؤسسية للشركات الكبرى والجهات الحكومية",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "الرياض",
        "addressRegion": "منطقة الرياض",
        "addressCountry": "SA"
    },
    "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+966538229013",
        "contactType": "sales",
        "availableLanguage": ["Arabic", "English"]
    },
    "areaServed": {
        "@type": "Country",
        "name": "Saudi Arabia"
    },
    "knowsAbout": [
        "Artificial Intelligence",
        "Machine Learning",
        "Enterprise Solutions",
        "Digital Transformation",
        "Data Analytics"
    ]
}
</script>
```

---

## 9. هيكل الملفات النهائي

```
/
├── index.html                    # الصفحة الرئيسية المؤسسية
├── physical-ai.html              # صفحة AIaaS
├── css/
│   ├── design-tokens-enterprise.css  # متغيرات التصميم
│   ├── homepage-enterprise.css       # أنماط الصفحة الرئيسية
│   └── unified-nav.css               # التنقل (موجود)
├── js/
│   ├── hero-canvas.js                # خلفية Hero المتحركة
│   ├── homepage-enterprise.js        # تفاعلات الصفحة
│   ├── gemini-chat-enterprise.js     # الشات بوت
│   └── scroll-animations.js          # أنيميشن التمرير
├── server/
│   └── endpoints/
│       └── chat.js                   # Backend للشات بوت
└── Gemini.png                        # الشعار
```
