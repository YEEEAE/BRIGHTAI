# تصميم مشروع توسيع خدمات Bright AI

## نظرة عامة على التصميم

هذا المستند يحدد التصميم التقني الشامل لتطوير 7 أقسام احترافية لموقع Bright AI بمستوى عالمي يضاهي شركات مثل Anthropic, OpenAI, Google, Apple.

## البنية التقنية

### Stack التقني
- **Frontend Framework**: Vanilla JavaScript (ES6+) - لا React/Vue
- **Styling**: Tailwind CSS v3.x (CDN)
- **Animation Libraries**: 
  - GSAP 3.x للأنيميشن المتقدمة
  - Three.js r150+ للعناصر ثلاثية الأبعاد
- **Icons**: Iconify
- **Build Tools**: لا حاجة (vanilla JS)
- **Performance**: Lazy loading, Code splitting, Image optimization

### البنية الملفية المقترحة
```
/
├── index.html (الصفحة الرئيسية - موجودة)
├── services/
│   ├── recruitment-system.html
│   ├── healthcare-ai.html
│   ├── ai-agents.html
│   ├── data-analytics.html
│   ├── ai-consulting.html
│   └── smart-automation.html
├── blog/
│   ├── index.html
│   └── article-template.html
├── css/
│   ├── main.css (موجود)
│   ├── components.css (موجود)
│   └── services.css (جديد)
├── js/
│   ├── main.js (موجود)
│   ├── animations.js (جديد)
│   ├── three-effects.js (جديد)
│   └── components/
│       ├── cursor.js
│       ├── scroll-animations.js
│       └── interactive-demos.js
└── assets/
    ├── images/
    └── videos/
```

## نظام التصميم (Design System)

### الألوان

```css
:root {
  /* Primary Colors */
  --color-indigo-400: #818CF8;
  --color-indigo-500: #6366F1;
  --color-indigo-600: #4F46E5;
  
  /* Secondary Colors */
  --color-purple-400: #C084FC;
  --color-purple-500: #A855F7;
  --color-purple-600: #9333EA;
  
  /* Accent Colors */
  --color-gold-400: #FCD34D;
  --color-gold-500: #D4AF37;
  --color-gold-600: #B8941E;
  
  /* Healthcare Colors */
  --color-teal-400: #2DD4BF;
  --color-teal-500: #14B8A6;
  --color-blue-500: #3B82F6;
  --color-green-500: #22C55E;
  
  /* Background Colors */
  --color-navy-900: #020617;
  --color-navy-800: #0F172A;
  --color-slate-800: #1E293B;
  --color-slate-700: #334155;
  
  /* Text Colors */
  --color-white: #FFFFFF;
  --color-slate-300: #CBD5E1;
  --color-slate-400: #94A3B8;
  --color-slate-500: #64748B;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, var(--color-indigo-500), var(--color-purple-500));
  --gradient-gold: linear-gradient(135deg, var(--color-gold-500), var(--color-gold-400));
  --gradient-healthcare: linear-gradient(135deg, var(--color-teal-500), var(--color-blue-500));
}
```

### Typography
```css
/* Arabic Font */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');

/* Code Font */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');

:root {
  --font-arabic: 'IBM Plex Sans Arabic', sans-serif;
  --font-code: 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  --text-6xl: 3.75rem;   /* 60px */
}
```

### Spacing & Layout
```css
:root {
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
  --spacing-24: 6rem;     /* 96px */
  
  --container-max: 1280px;
  --container-padding: 1.5rem;
}
```

### Animations & Transitions
```css
:root {
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 500ms ease;
  
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

## المكونات الأساسية (Core Components)

### 1. Glass Card Component
```html
<div class="glass-card">
  <!-- Content -->
</div>
```

```css
.glass-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  transition: all var(--transition-base);
}

.glass-card:hover {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
```

### 2. Gradient Text Component
```html
<h1 class="text-gradient">نص متدرج</h1>
```

```css
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient-gold {
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 3. Button Components
```html
<!-- Primary Button -->
<button class="btn-primary">
  <span>نص الزر</span>
  <iconify-icon icon="lucide:arrow-left"></iconify-icon>
</button>

<!-- Secondary Button -->
<button class="btn-secondary">نص الزر</button>

<!-- Ghost Button -->
<button class="btn-ghost">نص الزر</button>
```

```css
.btn-primary {
  padding: 0.75rem 2rem;
  background: var(--gradient-primary);
  color: white;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(255,255,255,0.2), 
    transparent);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.btn-primary:hover::before {
  opacity: 1;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
}
```



## التصميم التفصيلي للأقسام

### القسم 1: نظام التوظيف الذكي (recruitment-system.html)

#### 1.1 Hero Section
**التصميم:**
- خلفية: Canvas animation لـ workflow متحرك
- Layout: Grid 2 columns (text + visual)
- عناصر تفاعلية: Animated counters, CTA buttons

**الكود المطلوب:**
```javascript
// animations/recruitment-hero.js
class RecruitmentHero {
  constructor() {
    this.canvas = document.getElementById('workflow-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.init();
  }
  
  init() {
    this.resize();
    this.createParticles();
    this.animate();
  }
  
  createParticles() {
    // Create CV icons flowing through pipeline
    // Create checkmarks, stars for successful matches
  }
  
  animate() {
    // Animation loop
    requestAnimationFrame(() => this.animate());
  }
}
```

#### 1.2 Problems/Solutions Section
**التصميم:**
- Interactive slider للمقارنة
- Split screen effect
- Icons + metrics

**المكون:**
```html
<div class="before-after-section">
  <div class="comparison-slider">
    <div class="before-side">
      <div class="problem-card">
        <iconify-icon icon="lucide:clock"></iconify-icon>
        <h3>فرز 500 CV يدوياً</h3>
        <p class="metric">40 ساعة</p>
      </div>
    </div>
    <div class="after-side">
      <div class="solution-card">
        <iconify-icon icon="lucide:zap"></iconify-icon>
        <h3>فرز ذكي آلي</h3>
        <p class="metric">5 دقائق</p>
      </div>
    </div>
    <div class="slider-handle"></div>
  </div>
</div>
```

#### 1.3 Features Grid (Bento Layout)
**التصميم:**
- CSS Grid مع أحجام مختلفة
- Hover effects متقدمة
- Icons متحركة

```css
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  grid-auto-rows: 250px;
}

.feature-card {
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at var(--mouse-x) var(--mouse-y),
    rgba(99, 102, 241, 0.1),
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.feature-card:hover::before {
  opacity: 1;
}
```

#### 1.4 Interactive Flowchart
**التصميم:**
- Horizontal timeline
- Clickable steps
- Animated connections

**المكون:**
```javascript
class InteractiveFlowchart {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.steps = [
      { id: 1, title: 'رفع الوظيفة', icon: 'upload' },
      { id: 2, title: 'استقبال CVs', icon: 'inbox' },
      { id: 3, title: 'الفرز الذكي', icon: 'filter' },
      { id: 4, title: 'مقابلة AI', icon: 'video' },
      { id: 5, title: 'التقييم', icon: 'star' },
      { id: 6, title: 'قرار التوظيف', icon: 'check-circle' }
    ];
    this.currentStep = 0;
    this.render();
  }
  
  render() {
    // Create timeline HTML
    // Add click handlers
    // Animate connections with SVG
  }
  
  showStepDetails(stepId) {
    // Show modal or expand section with step details
  }
}
```

#### 1.5 Pricing Table
**التصميم:**
- 3 columns responsive
- Toggle monthly/yearly
- Comparison tooltip

```html
<div class="pricing-section">
  <div class="pricing-toggle">
    <button class="active">شهري</button>
    <button>سنوي <span class="badge">وفر 20%</span></button>
  </div>
  
  <div class="pricing-grid">
    <div class="pricing-card">
      <div class="plan-header">
        <h3>Basic</h3>
        <div class="price">
          <span class="amount">2,500</span>
          <span class="currency">ر.س</span>
          <span class="period">/شهر</span>
        </div>
      </div>
      <ul class="features-list">
        <li><iconify-icon icon="lucide:check"></iconify-icon> 50 وظيفة/شهر</li>
        <li><iconify-icon icon="lucide:check"></iconify-icon> فرز CV</li>
        <li><iconify-icon icon="lucide:x"></iconify-icon> مقابلات AI</li>
      </ul>
      <button class="btn-primary">ابدأ الآن</button>
    </div>
    <!-- Pro & Enterprise cards -->
  </div>
</div>
```

### القسم 2: الذكاء الاصطناعي في الرعاية الصحية

#### 2.1 Medical Hero with DNA Helix
**Three.js Implementation:**
```javascript
// three-effects/dna-helix.js
class DNAHelix {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 
      this.container.clientWidth / this.container.clientHeight, 
      0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    
    this.init();
  }
  
  init() {
    this.setupRenderer();
    this.createHelix();
    this.setupLights();
    this.animate();
  }
  
  createHelix() {
    const helixGroup = new THREE.Group();
    const radius = 2;
    const height = 10;
    const segments = 100;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 4;
      const y = (i / segments) * height - height / 2;
      
      // Create sphere for DNA base
      const geometry = new THREE.SphereGeometry(0.1, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0x14B8A6 : 0x3B82F6,
        emissive: i % 2 === 0 ? 0x14B8A6 : 0x3B82F6,
        emissiveIntensity: 0.3
      });
      
      const sphere1 = new THREE.Mesh(geometry, material);
      sphere1.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      
      const sphere2 = new THREE.Mesh(geometry, material);
      sphere2.position.set(
        Math.cos(angle + Math.PI) * radius,
        y,
        Math.sin(angle + Math.PI) * radius
      );
      
      helixGroup.add(sphere1, sphere2);
      
      // Add connection line
      if (i % 5 === 0) {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          sphere1.position,
          sphere2.position
        ]);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x22C55E,
          opacity: 0.3,
          transparent: true
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        helixGroup.add(line);
      }
    }
    
    this.helix = helixGroup;
    this.scene.add(helixGroup);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    this.helix.rotation.y += 0.005;
    this.renderer.render(this.scene, this.camera);
  }
}
```

#### 2.2 Interactive X-Ray Demo
**التصميم:**
- Drag & drop zone
- Image analysis simulation
- Heatmap overlay

```javascript
class XRayDemo {
  constructor() {
    this.dropZone = document.getElementById('xray-drop-zone');
    this.canvas = document.getElementById('xray-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.setupDropZone();
  }
  
  setupDropZone() {
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('drag-over');
    });
    
    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      this.analyzeImage(file);
    });
  }
  
  analyzeImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.drawImage(img);
        this.simulateAnalysis();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  
  simulateAnalysis() {
    // Simulate AI analysis with progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      this.updateProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        this.showResults();
      }
    }, 100);
  }
  
  showResults() {
    // Display findings with confidence scores
    const findings = [
      { area: 'الرئة اليمنى', condition: 'طبيعي', confidence: 98.5 },
      { area: 'الرئة اليسرى', condition: 'التهاب خفيف', confidence: 87.3 },
      { area: 'القلب', condition: 'طبيعي', confidence: 99.1 }
    ];
    
    this.renderFindings(findings);
    this.drawHeatmap();
  }
}
```

### القسم 3: الوكلاء الأذكياء (AI Agents)

#### 3.1 Agent Gallery with 3D Avatars
```javascript
class AgentGallery {
  constructor() {
    this.agents = [
      {
        id: 'support',
        name: 'BrightSupport',
        avatar: 'lucide:headset',
        color: '#6366F1',
        specialty: 'خدمة العملاء 24/7',
        capabilities: ['رد فوري', 'تصعيد ذكي', 'تحليل المشاعر'],
        stats: { satisfaction: 95, responseTime: '<2s' }
      },
      // ... more agents
    ];
    
    this.render();
  }
  
  render() {
    const container = document.getElementById('agent-gallery');
    
    this.agents.forEach(agent => {
      const card = this.createAgentCard(agent);
      container.appendChild(card);
    });
  }
  
  createAgentCard(agent) {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.innerHTML = `
      <div class="agent-avatar" style="--agent-color: ${agent.color}">
        <iconify-icon icon="${agent.avatar}"></iconify-icon>
      </div>
      <h3>${agent.name}</h3>
      <p class="specialty">${agent.specialty}</p>
      <ul class="capabilities">
        ${agent.capabilities.map(cap => `<li>${cap}</li>`).join('')}
      </ul>
      <div class="agent-stats">
        <div class="stat">
          <span class="value">${agent.stats.satisfaction}%</span>
          <span class="label">رضا العملاء</span>
        </div>
        <div class="stat">
          <span class="value">${agent.stats.responseTime}</span>
          <span class="label">وقت الرد</span>
        </div>
      </div>
      <button class="btn-demo" data-agent="${agent.id}">
        جرب الآن
      </button>
    `;
    
    return card;
  }
}
```

#### 3.2 Interactive Chat Demo
```javascript
class AgentChatDemo {
  constructor(agentId) {
    this.agentId = agentId;
    this.messages = [];
    this.container = document.getElementById('chat-demo');
    this.init();
  }
  
  init() {
    this.render();
    this.setupEventListeners();
    this.addWelcomeMessage();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="chat-header">
        <div class="agent-info">
          <div class="agent-avatar-small"></div>
          <div>
            <h4>${this.getAgentName()}</h4>
            <span class="status">متصل</span>
          </div>
        </div>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input">
        <input type="text" placeholder="اكتب رسالتك..." id="message-input">
        <button id="send-btn">
          <iconify-icon icon="lucide:send"></iconify-icon>
        </button>
      </div>
      <div class="suggested-questions">
        <button class="suggestion">ما هي ساعات العمل؟</button>
        <button class="suggestion">كيف أتتبع طلبي؟</button>
        <button class="suggestion">أريد التحدث مع مسؤول</button>
      </div>
    `;
  }
  
  addMessage(text, isUser = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isUser ? 'user' : 'agent'}`;
    
    if (!isUser) {
      this.showTypingIndicator();
      setTimeout(() => {
        this.hideTypingIndicator();
        messageEl.innerHTML = `
          <div class="message-avatar"></div>
          <div class="message-bubble">${text}</div>
        `;
        document.getElementById('chat-messages').appendChild(messageEl);
        this.scrollToBottom();
      }, 1000 + Math.random() * 1000);
    } else {
      messageEl.innerHTML = `
        <div class="message-bubble">${text}</div>
      `;
      document.getElementById('chat-messages').appendChild(messageEl);
      this.scrollToBottom();
    }
  }
  
  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing';
    indicator.innerHTML = `
      <span></span><span></span><span></span>
    `;
    document.getElementById('chat-messages').appendChild(indicator);
  }
}
```



#### 3.3 ROI Calculator
```javascript
class ROICalculator {
  constructor() {
    this.inputs = {
      monthlyQueries: 1000,
      avgHandlingTime: 10, // minutes
      hourlyRate: 50 // SAR
    };
    
    this.render();
    this.calculate();
  }
  
  calculate() {
    const manualHours = (this.inputs.monthlyQueries * this.inputs.avgHandlingTime) / 60;
    const automatedHours = manualHours * 0.1; // 90% automation
    const savedHours = manualHours - automatedHours;
    const monthlySavings = savedHours * this.inputs.hourlyRate;
    const annualSavings = monthlySavings * 12;
    const roi = ((annualSavings - 30000) / 30000) * 100; // Assuming 30K SAR annual cost
    
    this.displayResults({
      savedHours,
      monthlySavings,
      annualSavings,
      roi
    });
  }
  
  displayResults(results) {
    // Animate counters
    this.animateCounter('saved-hours', results.savedHours);
    this.animateCounter('monthly-savings', results.monthlySavings);
    this.animateCounter('annual-savings', results.annualSavings);
    this.animateCounter('roi', results.roi);
    
    // Update charts
    this.updateChart(results);
  }
  
  animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    let current = 0;
    const increment = targetValue / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        current = targetValue;
        clearInterval(timer);
      }
      element.textContent = Math.round(current).toLocaleString('ar-SA');
    }, 20);
  }
}
```

### القسم 4: تحليل البيانات المتقدم

#### 4.1 Interactive Dashboard Demo
**أهم مكون في المشروع - Dashboard كامل تفاعلي**

```javascript
class InteractiveDashboard {
  constructor() {
    this.data = this.generateMockData();
    this.filters = {
      dateRange: 'last-30-days',
      category: 'all',
      region: 'all'
    };
    
    this.charts = {};
    this.init();
  }
  
  generateMockData() {
    // Generate realistic sales data
    const categories = ['إلكترونيات', 'ملابس', 'أغذية', 'أثاث', 'كتب'];
    const regions = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'];
    const data = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      categories.forEach(category => {
        regions.forEach(region => {
          data.push({
            date: date.toISOString().split('T')[0],
            category,
            region,
            sales: Math.floor(Math.random() * 100000) + 10000,
            orders: Math.floor(Math.random() * 500) + 50,
            revenue: Math.floor(Math.random() * 500000) + 50000
          });
        });
      });
    }
    
    return data;
  }
  
  init() {
    this.renderLayout();
    this.setupFilters();
    this.createCharts();
    this.createDataTable();
  }
  
  renderLayout() {
    const container = document.getElementById('dashboard-container');
    container.innerHTML = `
      <div class="dashboard-header">
        <h2>لوحة التحكم التفاعلية</h2>
        <div class="dashboard-actions">
          <button class="btn-icon" id="refresh-btn">
            <iconify-icon icon="lucide:refresh-cw"></iconify-icon>
          </button>
          <button class="btn-icon" id="export-btn">
            <iconify-icon icon="lucide:download"></iconify-icon>
          </button>
          <button class="btn-icon" id="fullscreen-btn">
            <iconify-icon icon="lucide:maximize"></iconify-icon>
          </button>
        </div>
      </div>
      
      <div class="dashboard-filters">
        <select id="date-range-filter">
          <option value="last-7-days">آخر 7 أيام</option>
          <option value="last-30-days" selected>آخر 30 يوم</option>
          <option value="last-90-days">آخر 90 يوم</option>
          <option value="custom">مخصص</option>
        </select>
        
        <select id="category-filter">
          <option value="all">جميع الفئات</option>
          <option value="إلكترونيات">إلكترونيات</option>
          <option value="ملابس">ملابس</option>
          <option value="أغذية">أغذية</option>
        </select>
        
        <select id="region-filter">
          <option value="all">جميع المناطق</option>
          <option value="الرياض">الرياض</option>
          <option value="جدة">جدة</option>
          <option value="الدمام">الدمام</option>
        </select>
      </div>
      
      <div class="dashboard-grid">
        <!-- KPI Cards -->
        <div class="kpi-cards">
          <div class="kpi-card">
            <div class="kpi-icon" style="background: rgba(99, 102, 241, 0.1)">
              <iconify-icon icon="lucide:trending-up" style="color: #6366F1"></iconify-icon>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">إجمالي المبيعات</span>
              <span class="kpi-value" id="total-sales">0</span>
              <span class="kpi-change positive">+12.5%</span>
            </div>
          </div>
          
          <div class="kpi-card">
            <div class="kpi-icon" style="background: rgba(168, 85, 247, 0.1)">
              <iconify-icon icon="lucide:shopping-cart" style="color: #A855F7"></iconify-icon>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">عدد الطلبات</span>
              <span class="kpi-value" id="total-orders">0</span>
              <span class="kpi-change positive">+8.3%</span>
            </div>
          </div>
          
          <div class="kpi-card">
            <div class="kpi-icon" style="background: rgba(212, 175, 55, 0.1)">
              <iconify-icon icon="lucide:dollar-sign" style="color: #D4AF37"></iconify-icon>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">متوسط قيمة الطلب</span>
              <span class="kpi-value" id="avg-order-value">0</span>
              <span class="kpi-change negative">-2.1%</span>
            </div>
          </div>
          
          <div class="kpi-card">
            <div class="kpi-icon" style="background: rgba(34, 197, 94, 0.1)">
              <iconify-icon icon="lucide:users" style="color: #22C55E"></iconify-icon>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">العملاء النشطون</span>
              <span class="kpi-value" id="active-customers">0</span>
              <span class="kpi-change positive">+15.7%</span>
            </div>
          </div>
        </div>
        
        <!-- Charts -->
        <div class="chart-container large">
          <div class="chart-header">
            <h3>اتجاه المبيعات</h3>
            <div class="chart-actions">
              <button class="chart-type-btn active" data-type="line">
                <iconify-icon icon="lucide:line-chart"></iconify-icon>
              </button>
              <button class="chart-type-btn" data-type="bar">
                <iconify-icon icon="lucide:bar-chart"></iconify-icon>
              </button>
            </div>
          </div>
          <canvas id="sales-trend-chart"></canvas>
        </div>
        
        <div class="chart-container">
          <div class="chart-header">
            <h3>المبيعات حسب الفئة</h3>
          </div>
          <canvas id="category-chart"></canvas>
        </div>
        
        <div class="chart-container">
          <div class="chart-header">
            <h3>التوزيع الجغرافي</h3>
          </div>
          <canvas id="region-chart"></canvas>
        </div>
        
        <div class="chart-container">
          <div class="chart-header">
            <h3>أداء المنتجات</h3>
          </div>
          <canvas id="products-chart"></canvas>
        </div>
        
        <!-- Data Table -->
        <div class="data-table-container">
          <div class="table-header">
            <h3>تفاصيل المبيعات</h3>
            <div class="table-actions">
              <input type="search" placeholder="بحث..." id="table-search">
              <button class="btn-secondary" id="export-csv">
                <iconify-icon icon="lucide:file-text"></iconify-icon>
                تصدير CSV
              </button>
            </div>
          </div>
          <div class="table-wrapper">
            <table id="sales-table">
              <thead>
                <tr>
                  <th data-sort="date">التاريخ <iconify-icon icon="lucide:chevron-down"></iconify-icon></th>
                  <th data-sort="category">الفئة</th>
                  <th data-sort="region">المنطقة</th>
                  <th data-sort="sales">المبيعات</th>
                  <th data-sort="orders">الطلبات</th>
                  <th data-sort="revenue">الإيرادات</th>
                </tr>
              </thead>
              <tbody id="table-body">
                <!-- Populated by JS -->
              </tbody>
            </table>
          </div>
          <div class="table-pagination">
            <button id="prev-page">السابق</button>
            <span id="page-info">صفحة 1 من 10</span>
            <button id="next-page">التالي</button>
          </div>
        </div>
      </div>
    `;
  }
  
  createCharts() {
    // Sales Trend Chart (Line)
    this.charts.salesTrend = new Chart(
      document.getElementById('sales-trend-chart'),
      {
        type: 'line',
        data: {
          labels: this.getDateLabels(),
          datasets: [{
            label: 'المبيعات',
            data: this.getSalesTrendData(),
            borderColor: '#6366F1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: '#fff',
              bodyColor: '#CBD5E1',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              borderWidth: 1,
              padding: 12,
              displayColors: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#94A3B8'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#94A3B8'
              }
            }
          }
        }
      }
    );
    
    // Category Chart (Doughnut)
    this.charts.category = new Chart(
      document.getElementById('category-chart'),
      {
        type: 'doughnut',
        data: {
          labels: ['إلكترونيات', 'ملابس', 'أغذية', 'أثاث', 'كتب'],
          datasets: [{
            data: [35, 25, 20, 12, 8],
            backgroundColor: [
              '#6366F1',
              '#A855F7',
              '#D4AF37',
              '#14B8A6',
              '#3B82F6'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#CBD5E1',
                padding: 15,
                font: {
                  family: 'IBM Plex Sans Arabic'
                }
              }
            }
          }
        }
      }
    );
    
    // Region Chart (Bar)
    this.charts.region = new Chart(
      document.getElementById('region-chart'),
      {
        type: 'bar',
        data: {
          labels: ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'],
          datasets: [{
            label: 'المبيعات',
            data: [450000, 380000, 290000, 210000, 180000],
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#94A3B8'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#94A3B8'
              }
            }
          }
        }
      }
    );
  }
  
  setupFilters() {
    ['date-range', 'category', 'region'].forEach(filterType => {
      document.getElementById(`${filterType}-filter`).addEventListener('change', (e) => {
        this.filters[filterType.replace('-', '')] = e.target.value;
        this.updateDashboard();
      });
    });
  }
  
  updateDashboard() {
    // Filter data based on current filters
    const filteredData = this.filterData();
    
    // Update KPIs
    this.updateKPIs(filteredData);
    
    // Update charts
    this.updateCharts(filteredData);
    
    // Update table
    this.updateTable(filteredData);
  }
  
  exportToCSV() {
    const csv = this.convertToCSV(this.data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-data-${new Date().toISOString()}.csv`;
    a.click();
  }
}
```



### القسم 5: استشارات الذكاء الاصطناعي

#### 5.1 Multi-Step Booking Form
```javascript
class BookingForm {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.formData = {};
    this.init();
  }
  
  init() {
    this.render();
    this.setupEventListeners();
  }
  
  render() {
    const container = document.getElementById('booking-form-container');
    container.innerHTML = `
      <div class="booking-form">
        <div class="form-progress">
          ${this.renderProgressSteps()}
        </div>
        
        <div class="form-steps">
          ${this.renderStep1()}
          ${this.renderStep2()}
          ${this.renderStep3()}
          ${this.renderStep4()}
        </div>
        
        <div class="form-navigation">
          <button class="btn-secondary" id="prev-step" style="display: none;">
            <iconify-icon icon="lucide:arrow-right"></iconify-icon>
            السابق
          </button>
          <button class="btn-primary" id="next-step">
            التالي
            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
          </button>
        </div>
      </div>
    `;
  }
  
  renderProgressSteps() {
    let html = '';
    const steps = [
      { num: 1, label: 'معلوماتك' },
      { num: 2, label: 'احتياجاتك' },
      { num: 3, label: 'الموعد' },
      { num: 4, label: 'التأكيد' }
    ];
    
    steps.forEach(step => {
      const isActive = step.num === this.currentStep;
      const isCompleted = step.num < this.currentStep;
      
      html += `
        <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
          <div class="step-number">
            ${isCompleted ? '<iconify-icon icon="lucide:check"></iconify-icon>' : step.num}
          </div>
          <span class="step-label">${step.label}</span>
        </div>
      `;
      
      if (step.num < this.totalSteps) {
        html += `<div class="progress-line ${isCompleted ? 'completed' : ''}"></div>`;
      }
    });
    
    return html;
  }
  
  renderStep1() {
    return `
      <div class="form-step ${this.currentStep === 1 ? 'active' : ''}" data-step="1">
        <h3>معلوماتك الشخصية</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>الاسم الكامل *</label>
            <input type="text" name="fullName" required>
          </div>
          <div class="form-group">
            <label>البريد الإلكتروني *</label>
            <input type="email" name="email" required>
          </div>
          <div class="form-group">
            <label>رقم الهاتف *</label>
            <input type="tel" name="phone" required>
          </div>
          <div class="form-group">
            <label>اسم الشركة *</label>
            <input type="text" name="company" required>
          </div>
          <div class="form-group">
            <label>المنصب *</label>
            <select name="position" required>
              <option value="">اختر المنصب</option>
              <option value="ceo">المدير التنفيذي</option>
              <option value="cto">مدير التقنية</option>
              <option value="coo">مدير العمليات</option>
              <option value="manager">مدير</option>
              <option value="other">أخرى</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
  
  renderStep2() {
    return `
      <div class="form-step ${this.currentStep === 2 ? 'active' : ''}" data-step="2">
        <h3>احتياجاتك</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>القطاع *</label>
            <select name="industry" required>
              <option value="">اختر القطاع</option>
              <option value="retail">التجزئة</option>
              <option value="healthcare">الرعاية الصحية</option>
              <option value="finance">المالية</option>
              <option value="manufacturing">الصناعة</option>
              <option value="government">حكومي</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div class="form-group">
            <label>حجم الشركة *</label>
            <select name="companySize" required>
              <option value="">اختر الحجم</option>
              <option value="1-50">1-50 موظف</option>
              <option value="51-200">51-200 موظف</option>
              <option value="201-1000">201-1000 موظف</option>
              <option value="1000+">أكثر من 1000 موظف</option>
            </select>
          </div>
          <div class="form-group full-width">
            <label>التحدي الرئيسي *</label>
            <textarea name="challenge" rows="4" required 
              placeholder="صف التحدي الذي تواجهه أو الهدف الذي تريد تحقيقه..."></textarea>
          </div>
          <div class="form-group full-width">
            <label>هل لديك فريق تقني؟ *</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="hasTechTeam" value="yes" required>
                <span>نعم، لدينا فريق تقني</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="hasTechTeam" value="no">
                <span>لا، نحتاج دعم كامل</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="hasTechTeam" value="partial">
                <span>فريق صغير، نحتاج دعم جزئي</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  renderStep3() {
    return `
      <div class="form-step ${this.currentStep === 3 ? 'active' : ''}" data-step="3">
        <h3>اختر موعد الاستشارة</h3>
        <div class="calendar-container">
          <div id="calendar"></div>
          <div class="time-slots" id="time-slots">
            <!-- Populated by JS -->
          </div>
        </div>
      </div>
    `;
  }
  
  renderStep4() {
    return `
      <div class="form-step ${this.currentStep === 4 ? 'active' : ''}" data-step="4">
        <h3>تأكيد الحجز</h3>
        <div class="booking-summary">
          <div class="summary-section">
            <h4>معلوماتك</h4>
            <p><strong>الاسم:</strong> <span id="summary-name"></span></p>
            <p><strong>البريد:</strong> <span id="summary-email"></span></p>
            <p><strong>الهاتف:</strong> <span id="summary-phone"></span></p>
            <p><strong>الشركة:</strong> <span id="summary-company"></span></p>
          </div>
          <div class="summary-section">
            <h4>الموعد</h4>
            <p><strong>التاريخ:</strong> <span id="summary-date"></span></p>
            <p><strong>الوقت:</strong> <span id="summary-time"></span></p>
            <p><strong>المدة:</strong> 60 دقيقة</p>
          </div>
          <div class="summary-section">
            <h4>التحدي</h4>
            <p id="summary-challenge"></p>
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" name="terms" required>
            <span>أوافق على <a href="/terms">الشروط والأحكام</a> و<a href="/privacy">سياسة الخصوصية</a></span>
          </label>
        </div>
        <button class="btn-primary btn-large" id="submit-booking">
          <iconify-icon icon="lucide:check-circle"></iconify-icon>
          تأكيد الحجز
        </button>
      </div>
    `;
  }
  
  nextStep() {
    if (this.validateCurrentStep()) {
      this.saveStepData();
      this.currentStep++;
      this.updateView();
      
      if (this.currentStep === 3) {
        this.initCalendar();
      }
      
      if (this.currentStep === 4) {
        this.populateSummary();
      }
    }
  }
  
  validateCurrentStep() {
    const currentStepEl = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
    const inputs = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
    
    let isValid = true;
    inputs.forEach(input => {
      if (!input.value) {
        input.classList.add('error');
        isValid = false;
      } else {
        input.classList.remove('error');
      }
    });
    
    return isValid;
  }
  
  submitBooking() {
    // Show loading
    const submitBtn = document.getElementById('submit-booking');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<iconify-icon icon="lucide:loader" class="spin"></iconify-icon> جاري الحجز...';
    
    // Simulate API call
    setTimeout(() => {
      this.showSuccessMessage();
    }, 2000);
  }
  
  showSuccessMessage() {
    const container = document.getElementById('booking-form-container');
    container.innerHTML = `
      <div class="success-message">
        <div class="success-icon">
          <iconify-icon icon="lucide:check-circle"></iconify-icon>
        </div>
        <h2>تم الحجز بنجاح!</h2>
        <p>شكراً لك! تم تأكيد موعد الاستشارة.</p>
        <p>ستصلك رسالة تأكيد على البريد الإلكتروني خلال دقائق.</p>
        <div class="success-details">
          <p><strong>رقم الحجز:</strong> #BR${Date.now()}</p>
          <p><strong>الموعد:</strong> ${this.formData.date} في ${this.formData.time}</p>
        </div>
        <button class="btn-primary" onclick="window.location.href='/'">
          العودة للرئيسية
        </button>
      </div>
    `;
    
    // Confetti animation
    this.triggerConfetti();
  }
  
  triggerConfetti() {
    // Simple confetti effect
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.backgroundColor = ['#6366F1', '#A855F7', '#D4AF37'][Math.floor(Math.random() * 3)];
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 3000);
    }
  }
}
```

### القسم 6: الأتمتة الذكية

#### 6.1 Process Builder (Drag & Drop)
```javascript
class ProcessBuilder {
  constructor() {
    this.canvas = document.getElementById('process-canvas');
    this.components = [];
    this.connections = [];
    this.selectedComponent = null;
    this.init();
  }
  
  init() {
    this.setupCanvas();
    this.setupComponentPalette();
    this.setupEventListeners();
  }
  
  setupComponentPalette() {
    const palette = document.getElementById('component-palette');
    const componentTypes = [
      { type: 'trigger', icon: 'lucide:zap', label: 'محفز', color: '#6366F1' },
      { type: 'action', icon: 'lucide:play', label: 'إجراء', color: '#A855F7' },
      { type: 'condition', icon: 'lucide:git-branch', label: 'شرط', color: '#D4AF37' },
      { type: 'loop', icon: 'lucide:repeat', label: 'حلقة', color: '#14B8A6' },
      { type: 'integration', icon: 'lucide:plug', label: 'تكامل', color: '#3B82F6' }
    ];
    
    componentTypes.forEach(comp => {
      const el = document.createElement('div');
      el.className = 'component-item';
      el.draggable = true;
      el.dataset.type = comp.type;
      el.innerHTML = `
        <div class="component-icon" style="background: ${comp.color}20; color: ${comp.color}">
          <iconify-icon icon="${comp.icon}"></iconify-icon>
        </div>
        <span>${comp.label}</span>
      `;
      
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('componentType', comp.type);
      });
      
      palette.appendChild(el);
    });
  }
  
  setupCanvas() {
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('componentType');
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.addComponent(type, x, y);
    });
  }
  
  addComponent(type, x, y) {
    const component = {
      id: `comp-${Date.now()}`,
      type,
      x,
      y,
      config: {}
    };
    
    this.components.push(component);
    this.renderComponent(component);
  }
  
  renderComponent(component) {
    const el = document.createElement('div');
    el.className = 'process-component';
    el.dataset.id = component.id;
    el.style.left = component.x + 'px';
    el.style.top = component.y + 'px';
    
    const config = this.getComponentConfig(component.type);
    el.innerHTML = `
      <div class="component-header" style="background: ${config.color}">
        <iconify-icon icon="${config.icon}"></iconify-icon>
        <span>${config.label}</span>
        <button class="component-delete">
          <iconify-icon icon="lucide:x"></iconify-icon>
        </button>
      </div>
      <div class="component-body">
        <p class="component-description">${config.description}</p>
      </div>
      <div class="component-ports">
        <div class="port port-input"></div>
        <div class="port port-output"></div>
      </div>
    `;
    
    // Make draggable
    this.makeDraggable(el);
    
    // Click to configure
    el.addEventListener('click', () => {
      this.showComponentConfig(component);
    });
    
    this.canvas.appendChild(el);
  }
  
  makeDraggable(el) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    
    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.component-delete')) return;
      
      isDragging = true;
      initialX = e.clientX - el.offsetLeft;
      initialY = e.clientY - el.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      el.style.left = currentX + 'px';
      el.style.top = currentY + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  exportWorkflow() {
    const workflow = {
      components: this.components,
      connections: this.connections
    };
    
    const json = JSON.stringify(workflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
  }
}
```



### القسم 7: المكتبة الذكية (Blog)

#### 7.1 Blog Layout & Components
```javascript
class BlogSystem {
  constructor() {
    this.articles = [];
    this.currentPage = 1;
    this.articlesPerPage = 9;
    this.currentFilter = 'all';
    this.init();
  }
  
  init() {
    this.loadArticles();
    this.renderFeatured();
    this.renderGrid();
    this.setupFilters();
    this.setupSearch();
  }
  
  loadArticles() {
    // Mock data - في الواقع سيتم جلبها من API
    this.articles = [
      {
        id: 1,
        title: 'مستقبل الذكاء الاصطناعي في المملكة العربية السعودية',
        excerpt: 'نظرة شاملة على كيفية تحول المملكة إلى مركز عالمي للذكاء الاصطناعي ضمن رؤية 2030...',
        category: 'أخبار',
        author: {
          name: 'أحمد السعيد',
          avatar: '/assets/authors/ahmed.jpg'
        },
        date: '2024-01-15',
        readTime: '8 دقائق',
        image: '/assets/blog/ai-saudi.jpg',
        tags: ['رؤية 2030', 'ذكاء اصطناعي', 'السعودية'],
        featured: true
      },
      // ... more articles
    ];
  }
  
  renderFeatured() {
    const featured = this.articles.filter(a => a.featured).slice(0, 3);
    const container = document.getElementById('featured-articles');
    
    let currentIndex = 0;
    const renderSlide = () => {
      const article = featured[currentIndex];
      container.innerHTML = `
        <div class="featured-article">
          <div class="featured-image">
            <img src="${article.image}" alt="${article.title}">
            <div class="featured-overlay"></div>
          </div>
          <div class="featured-content">
            <span class="category-badge">${article.category}</span>
            <h2>${article.title}</h2>
            <p>${article.excerpt}</p>
            <div class="article-meta">
              <div class="author-info">
                <img src="${article.author.avatar}" alt="${article.author.name}">
                <span>${article.author.name}</span>
              </div>
              <span class="date">${this.formatDate(article.date)}</span>
              <span class="read-time">
                <iconify-icon icon="lucide:clock"></iconify-icon>
                ${article.readTime}
              </span>
            </div>
            <a href="/blog/${article.id}" class="btn-primary">
              اقرأ المقال
              <iconify-icon icon="lucide:arrow-left"></iconify-icon>
            </a>
          </div>
        </div>
        <div class="carousel-dots">
          ${featured.map((_, i) => `
            <button class="dot ${i === currentIndex ? 'active' : ''}" 
                    data-index="${i}"></button>
          `).join('')}
        </div>
      `;
      
      // Auto-slide
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % featured.length;
        renderSlide();
      }, 5000);
    };
    
    renderSlide();
  }
  
  renderGrid() {
    const container = document.getElementById('articles-grid');
    const start = (this.currentPage - 1) * this.articlesPerPage;
    const end = start + this.articlesPerPage;
    const filtered = this.filterArticles();
    const paginated = filtered.slice(start, end);
    
    container.innerHTML = paginated.map(article => `
      <article class="article-card">
        <a href="/blog/${article.id}" class="article-image">
          <img src="${article.image}" alt="${article.title}" loading="lazy">
          <span class="category-badge">${article.category}</span>
        </a>
        <div class="article-content">
          <h3>
            <a href="/blog/${article.id}">${article.title}</a>
          </h3>
          <p class="excerpt">${article.excerpt}</p>
          <div class="article-meta">
            <div class="author-info">
              <img src="${article.author.avatar}" alt="${article.author.name}">
              <span>${article.author.name}</span>
            </div>
            <span class="date">${this.formatDate(article.date)}</span>
          </div>
          <div class="article-tags">
            ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
      </article>
    `).join('');
    
    this.renderPagination(filtered.length);
  }
  
  setupSearch() {
    const searchInput = document.getElementById('blog-search');
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.renderGrid();
      }, 300);
    });
  }
}
```

#### 7.2 Single Article Template
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>عنوان المقال - Bright AI</title>
  <!-- SEO Meta Tags -->
  <meta name="description" content="وصف المقال">
  <meta property="og:title" content="عنوان المقال">
  <meta property="og:description" content="وصف المقال">
  <meta property="og:image" content="صورة المقال">
  
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/css/blog.css">
</head>
<body>
  <!-- Navigation (same as main site) -->
  
  <article class="blog-article">
    <!-- Hero Image -->
    <div class="article-hero">
      <img src="/assets/blog/article-image.jpg" alt="عنوان المقال">
    </div>
    
    <!-- Article Header -->
    <header class="article-header">
      <div class="container-narrow">
        <div class="article-meta-top">
          <span class="category-badge">الذكاء الاصطناعي</span>
          <span class="date">15 يناير 2024</span>
          <span class="read-time">
            <iconify-icon icon="lucide:clock"></iconify-icon>
            8 دقائق قراءة
          </span>
        </div>
        
        <h1>عنوان المقال الرئيسي هنا</h1>
        
        <div class="author-card">
          <img src="/assets/authors/author.jpg" alt="اسم الكاتب" class="author-avatar">
          <div class="author-info">
            <h4>أحمد السعيد</h4>
            <p>خبير ذكاء اصطناعي - 10 سنوات خبرة</p>
            <div class="author-social">
              <a href="#"><iconify-icon icon="lucide:linkedin"></iconify-icon></a>
              <a href="#"><iconify-icon icon="lucide:twitter"></iconify-icon></a>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Reading Progress Bar -->
    <div class="reading-progress">
      <div class="progress-bar" id="reading-progress-bar"></div>
    </div>
    
    <!-- Article Content -->
    <div class="article-body">
      <div class="container-narrow">
        <div class="article-layout">
          <!-- Main Content -->
          <div class="article-content">
            <!-- Table of Contents (Mobile) -->
            <div class="toc-mobile">
              <button class="toc-toggle">
                <iconify-icon icon="lucide:list"></iconify-icon>
                جدول المحتويات
              </button>
              <div class="toc-dropdown">
                <ul id="toc-list-mobile"></ul>
              </div>
            </div>
            
            <!-- Article Text -->
            <div class="prose">
              <h2 id="section-1">المقدمة</h2>
              <p>نص المقال هنا...</p>
              
              <h2 id="section-2">النقطة الأولى</h2>
              <p>المزيد من النص...</p>
              
              <!-- Code Block Example -->
              <pre><code class="language-python">
def hello_ai():
    print("مرحباً بالذكاء الاصطناعي")
              </code></pre>
              
              <!-- Blockquote Example -->
              <blockquote>
                <p>الذكاء الاصطناعي ليس المستقبل، بل هو الحاضر.</p>
                <cite>- أحمد السعيد</cite>
              </blockquote>
              
              <!-- Callout Box Example -->
              <div class="callout callout-info">
                <iconify-icon icon="lucide:info"></iconify-icon>
                <div>
                  <h4>معلومة مهمة</h4>
                  <p>نص المعلومة هنا...</p>
                </div>
              </div>
              
              <!-- Image with Caption -->
              <figure>
                <img src="/assets/blog/image.jpg" alt="وصف الصورة">
                <figcaption>شرح الصورة هنا</figcaption>
              </figure>
              
              <h2 id="section-3">الخلاصة</h2>
              <p>النص الختامي...</p>
            </div>
            
            <!-- Article Tags -->
            <div class="article-tags-section">
              <h4>الوسوم:</h4>
              <div class="tags">
                <a href="/blog/tag/ai" class="tag">ذكاء اصطناعي</a>
                <a href="/blog/tag/ml" class="tag">تعلم آلي</a>
                <a href="/blog/tag/saudi" class="tag">السعودية</a>
              </div>
            </div>
            
            <!-- Share Buttons -->
            <div class="share-section">
              <h4>شارك المقال:</h4>
              <div class="share-buttons">
                <button class="share-btn twitter">
                  <iconify-icon icon="lucide:twitter"></iconify-icon>
                  Twitter
                </button>
                <button class="share-btn linkedin">
                  <iconify-icon icon="lucide:linkedin"></iconify-icon>
                  LinkedIn
                </button>
                <button class="share-btn whatsapp">
                  <iconify-icon icon="lucide:message-circle"></iconify-icon>
                  WhatsApp
                </button>
                <button class="share-btn copy">
                  <iconify-icon icon="lucide:copy"></iconify-icon>
                  نسخ الرابط
                </button>
              </div>
            </div>
            
            <!-- Author Bio (Expanded) -->
            <div class="author-bio-expanded">
              <img src="/assets/authors/author.jpg" alt="أحمد السعيد">
              <div>
                <h3>عن الكاتب</h3>
                <h4>أحمد السعيد</h4>
                <p>خبير ذكاء اصطناعي مع أكثر من 10 سنوات خبرة في تطوير حلول AI للشركات الكبرى...</p>
                <button class="btn-secondary">تابع</button>
              </div>
            </div>
            
            <!-- Related Articles -->
            <div class="related-articles">
              <h3>مقالات ذات صلة</h3>
              <div class="related-grid">
                <!-- 3 article cards -->
              </div>
            </div>
            
            <!-- Comments Section -->
            <div class="comments-section">
              <h3>التعليقات (12)</h3>
              
              <div class="comment-form">
                <textarea placeholder="أضف تعليقك..."></textarea>
                <button class="btn-primary">نشر التعليق</button>
              </div>
              
              <div class="comments-list">
                <!-- Comment items -->
              </div>
            </div>
          </div>
          
          <!-- Sidebar (Desktop) -->
          <aside class="article-sidebar">
            <!-- Table of Contents -->
            <div class="sidebar-widget toc-widget sticky">
              <h4>جدول المحتويات</h4>
              <ul id="toc-list">
                <li><a href="#section-1" class="active">المقدمة</a></li>
                <li><a href="#section-2">النقطة الأولى</a></li>
                <li><a href="#section-3">الخلاصة</a></li>
              </ul>
            </div>
            
            <!-- Share Widget -->
            <div class="sidebar-widget share-widget">
              <h4>شارك</h4>
              <div class="share-buttons-vertical">
                <button><iconify-icon icon="lucide:twitter"></iconify-icon></button>
                <button><iconify-icon icon="lucide:linkedin"></iconify-icon></button>
                <button><iconify-icon icon="lucide:message-circle"></iconify-icon></button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </article>
  
  <!-- Back to Top Button -->
  <button class="back-to-top" id="back-to-top">
    <iconify-icon icon="lucide:arrow-up"></iconify-icon>
  </button>
  
  <script src="/js/blog-article.js"></script>
</body>
</html>
```

## الأنيميشن والتأثيرات المتقدمة

### 1. Custom Cursor Effect
```javascript
class CustomCursor {
  constructor() {
    this.cursor = document.createElement('div');
    this.cursor.className = 'custom-cursor';
    this.cursorDot = document.createElement('div');
    this.cursorDot.className = 'cursor-dot';
    
    document.body.appendChild(this.cursor);
    document.body.appendChild(this.cursorDot);
    
    this.init();
  }
  
  init() {
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let dotX = 0, dotY = 0;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Instant dot movement
      this.cursorDot.style.left = mouseX + 'px';
      this.cursorDot.style.top = mouseY + 'px';
    });
    
    // Smooth cursor follow
    const animate = () => {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      
      cursorX += dx * 0.1;
      cursorY += dy * 0.1;
      
      this.cursor.style.left = cursorX + 'px';
      this.cursor.style.top = cursorY + 'px';
      
      requestAnimationFrame(animate);
    };
    animate();
    
    // Hover effects
    document.querySelectorAll('a, button, .interactive').forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.classList.add('cursor-hover');
        this.cursorDot.classList.add('cursor-hover');
      });
      
      el.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('cursor-hover');
        this.cursorDot.classList.remove('cursor-hover');
      });
    });
  }
}

// CSS
```css
.custom-cursor {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(99, 102, 241, 0.5);
  border-radius: 50%;
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s, border-color 0.3s;
}

.cursor-dot {
  width: 8px;
  height: 8px;
  background: #6366F1;
  border-radius: 50%;
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  transform: translate(-50%, -50%);
}

.custom-cursor.cursor-hover {
  width: 60px;
  height: 60px;
  border-color: rgba(212, 175, 55, 0.8);
}

.cursor-dot.cursor-hover {
  width: 12px;
  height: 12px;
  background: #D4AF37;
}
```

### 2. Scroll Animations with GSAP
```javascript
// animations/scroll-animations.js
class ScrollAnimations {
  constructor() {
    this.init();
  }
  
  init() {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    // Fade in on scroll
    gsap.utils.toArray('.animate-on-scroll').forEach(element => {
      gsap.from(element, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          end: 'top 20%',
          toggleActions: 'play none none reverse'
        }
      });
    });
    
    // Stagger children
    gsap.utils.toArray('.stagger-container').forEach(container => {
      const children = container.querySelectorAll('.stagger-item');
      gsap.from(children, {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.8,
        scrollTrigger: {
          trigger: container,
          start: 'top 75%'
        }
      });
    });
    
    // Parallax backgrounds
    gsap.utils.toArray('.parallax-bg').forEach(bg => {
      gsap.to(bg, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: bg,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
    
    // Counter animations
    gsap.utils.toArray('[data-count]').forEach(counter => {
      const target = parseFloat(counter.dataset.count);
      const obj = { value: 0 };
      
      gsap.to(obj, {
        value: target,
        duration: 2,
        scrollTrigger: {
          trigger: counter,
          start: 'top 80%',
          once: true
        },
        onUpdate: () => {
          counter.textContent = Math.round(obj.value).toLocaleString('ar-SA');
        }
      });
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new ScrollAnimations();
});
```

