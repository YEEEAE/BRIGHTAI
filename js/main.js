/**
 * Bright AI - Main JavaScript
 * ========================================
 */

// ========== Mobile Menu Logic ==========
document.addEventListener('DOMContentLoaded', function () {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const navLinks = document.querySelector('.nav-links');
  const navOverlay = document.querySelector('.nav-overlay');
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  // Toggle mobile menu
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function () {
      const isActive = this.classList.toggle('active');
      navLinks.classList.toggle('active');
      navOverlay.classList.toggle('active');
      this.setAttribute('aria-expanded', isActive);
      document.body.style.overflow = isActive ? 'hidden' : '';
    });
  }

  // Close menu when clicking overlay
  if (navOverlay) {
    navOverlay.addEventListener('click', function () {
      hamburgerBtn.classList.remove('active');
      navLinks.classList.remove('active');
      this.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Handle dropdown toggles in mobile
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        const parent = this.closest('.nav-dropdown');
        parent.classList.toggle('active');
      }
    });
  });

  // Close mobile menu on window resize
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) {
      hamburgerBtn.classList.remove('active');
      navLinks.classList.remove('active');
      navOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Add scrolled class to nav on scroll
  window.addEventListener('scroll', function () {
    const nav = document.querySelector('.unified-nav');
    if (nav) {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  });
});

// ========== Glass Card Mouse Effect ==========
// ========== Glass Card Mouse Effect ==========
document.querySelectorAll('.glass-card, .service-card, .feature-card, .stat-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  });
});

// ========== Typewriter Effect for Terminal ==========
const codeElement = document.getElementById('typewriter-code');
if (codeElement) {
  const codeLines = [
    "<span class='text-purple-400'>import</span> <span class='text-white'>bright_ai</span> <span class='text-purple-400'>as</span> <span class='text-white'>bai</span>",
    "",
    "<span class='text-slate-500'># Initialize Sovereign Client</span>",
    "<span class='text-blue-400'>client</span> = bai.Client(api_key=<span class='text-green-400'>'sk_sa_...'</span>, region=<span class='text-green-400'>'SA'</span>)",
    "",
    "<span class='text-slate-500'># Analyze Enterprise Data</span>",
    "<span class='text-blue-400'>response</span> = client.analyze({",
    "  <span class='text-gold-400'>source</span>: <span class='text-green-400'>'aramco_logistics_v2'</span>,",
    "  <span class='text-gold-400'>model</span>: <span class='text-green-400'>'falcon-40b-instruct'</span>,",
    "  <span class='text-gold-400'>compliance</span>: <span class='text-green-400'>'NCA_ESSENTIAL'</span>",
    "})",
    "",
    "<span class='text-yellow-300'>print</span>(response.json())"
  ];

  const jsonOutput = `
    <span class='text-slate-500'>// Output</span>
    <br>
    <span class='text-white'>{</span>
    <br>
    &nbsp;&nbsp;<span class='text-green-400'>"status"</span>: <span class='text-green-400'>"optimized"</span>,
    <br>
    &nbsp;&nbsp;<span class='text-green-400'>"efficiency_gain"</span>: <span class='text-blue-400'>24.5%</span>,
    <br>
    &nbsp;&nbsp;<span class='text-green-400'>"latency"</span>: <span class='text-blue-400'>"12ms"</span>
    <br>
    <span class='text-white'>}</span>`;

  let lineIndex = 0;
  let currentHTML = '';

  function typeWriter() {
    if (lineIndex < codeLines.length) {
      currentHTML += (lineIndex > 0 ? '<br>' : '') + codeLines[ lineIndex ];
      codeElement.innerHTML = currentHTML + '<span class="cursor-blink">|</span>';
      lineIndex++;
      setTimeout(typeWriter, 400);
    } else {
      setTimeout(() => {
        codeElement.innerHTML = currentHTML + '<br><br>' + jsonOutput + '<span class="cursor-blink">|</span>';
      }, 800);
    }
  }

  // Start typewriter when terminal is visible
  const termObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        typeWriter();
        termObserver.disconnect();
      }
    });
  });

  const terminalWindow = document.querySelector('.terminal-window');
  if (terminalWindow) {
    termObserver.observe(terminalWindow);
  }
}

// ========== Interactive Feature Tabs ==========
window.updateFeature = function (feature, button) {
  // Remove active class from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Add active class to clicked button
  button.classList.add('active');

  const contentDiv = document.getElementById('feature-content');
  if (!contentDiv) return;

  let content = '';

  switch (feature) {
    case 'vision':
      content = `
        <iconify-icon icon="lucide:scan-face" width="64" class="text-indigo-400"></iconify-icon>
        <div class="w-3/4 space-y-3">
          <div class="h-2 bg-indigo-500/20 rounded-full w-full overflow-hidden">
            <div class="h-full bg-indigo-500 w-[85%]"></div>
          </div>
          <div class="flex justify-between text-xs text-indigo-300">
            <span>دقة التشخيص</span>
            <span>98.5%</span>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 w-full mt-4">
          <div class="h-24 bg-white/5 rounded-lg border border-white/5 animate-pulse"></div>
          <div class="h-24 bg-white/5 rounded-lg border border-white/5"></div>
          <div class="h-24 bg-white/5 rounded-lg border border-white/5"></div>
        </div>
      `;
      break;

    case 'predict':
      content = `
        <iconify-icon icon="lucide:bar-chart-3" width="64" class="text-purple-400"></iconify-icon>
        <div class="w-3/4 space-y-3">
          <div class="h-2 bg-purple-500/20 rounded-full w-full overflow-hidden">
            <div class="h-full bg-purple-500 w-[92%]"></div>
          </div>
          <div class="flex justify-between text-xs text-purple-300">
            <span>دقة التنبؤ</span>
            <span>92%</span>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-2 w-full mt-4">
          <div class="h-16 bg-purple-500/20 rounded"></div>
          <div class="h-24 bg-purple-500/30 rounded"></div>
          <div class="h-20 bg-purple-500/25 rounded"></div>
          <div class="h-28 bg-purple-500/40 rounded"></div>
        </div>
      `;
      break;

    case 'hospital':
      content = `
        <iconify-icon icon="lucide:activity-square" width="64" class="text-green-400"></iconify-icon>
        <div class="w-3/4 space-y-3">
          <div class="h-2 bg-green-500/20 rounded-full w-full overflow-hidden">
            <div class="h-full bg-green-500 w-[78%]"></div>
          </div>
          <div class="flex justify-between text-xs text-green-300">
            <span>كفاءة الإدارة</span>
            <span>78%</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 w-full mt-4">
          <div class="p-4 bg-white/5 rounded-lg border border-white/5">
            <div class="text-2xl font-bold text-green-400">245</div>
            <div class="text-xs text-slate-400">مريض/يوم</div>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/5">
            <div class="text-2xl font-bold text-green-400">15</div>
            <div class="text-xs text-slate-400">دقيقة متوسط</div>
          </div>
        </div>
      `;
      break;

    case 'gemini':
      content = `
        <iconify-icon icon="lucide:bot" width="64" class="text-gold-400"></iconify-icon>
        <div class="w-3/4 space-y-3">
          <div class="h-2 bg-gold-500/20 rounded-full w-full overflow-hidden">
            <div class="h-full bg-gold-500 w-[95%]"></div>
          </div>
          <div class="flex justify-between text-xs text-gold-300">
            <span>دقة المساعد</span>
            <span>95%</span>
          </div>
        </div>
        <div class="w-full mt-4 p-4 bg-white/5 rounded-lg border border-white/5 text-right">
          <div class="text-xs text-slate-400 mb-2">استشارة طبية ذكية</div>
          <div class="text-sm text-slate-300">تحليل الأعراض وتقديم التوصيات الطبية بدقة عالية</div>
        </div>
      `;
      break;
  }

  contentDiv.innerHTML = content;
  contentDiv.classList.add('animate-blob');
  setTimeout(() => {
    contentDiv.classList.remove('animate-blob');
  }, 700);
};
