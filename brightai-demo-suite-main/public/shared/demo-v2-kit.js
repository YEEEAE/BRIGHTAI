/**
 * BrightAI Demo — Page Anatomy v2 UI Kit
 * Mounts: Scenarios Picker, Thinking Theater, Result Canvas,
 *         CTA Strip, Trust Layer, Related Demos.
 *         Injects JSON-LD structured data.
 */

import {
  DEMOS_META,
  SCENARIOS,
  THINKING_STAGES,
  TRUST_LAYER,
  RELATED_DEMOS,
  CTA_STRIP,
} from '/shared/demo-v2-data.js';

// ── Icon library (inline SVG strings) ─────────────────────────────────────
const ICONS = {
  inbox:    '<svg viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  brain:    '<svg viewBox="0 0 24 24"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3 2.5 2.5 0 0 1 2.46-2.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3 2.5 2.5 0 0 0-2.46-2.04z"/></svg>',
  database: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>',
  cpu:      '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="14" x2="22" y2="14"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="14" x2="4" y2="14"/></svg>',
  sparkle:  '<svg viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-2.2L12 3z"/></svg>',
  check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  arrow:    '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  clock:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  copy:     '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  share:    '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
  shuffle:  '<svg viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
  phone:    '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  message:  '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  file:     '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  agent:    '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  shield:   '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
  lock:     '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  globe:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  audit:    '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  noShare:  '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg>',
  workflow: '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6m-9 3v6m12-6v6m-9 3h6"/></svg>',
  chart:    '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  bot:      '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
  book:     '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  hospital: '<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h0M9 12h0M9 15h0M9 18h0"/></svg>',
};

// Icon by demoId (used in canvas header + related cards)
const DEMO_ICONS = {
  'ai-agent': ICONS.agent,
  'ai-tenders-analysis': ICONS.file,
  'ai-workflows': ICONS.workflow,
  'data-analysis': ICONS.chart,
  'smart-automation': ICONS.bot,
  'smart-education-platform': ICONS.book,
  'smart-hospital-management': ICONS.hospital,
};

// HTML escaping helper
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ──────────────────────────────────────────────────────────
// 1. SCENARIOS PICKER
// ──────────────────────────────────────────────────────────
/**
 * Mounts a 7-card scenarios picker. Clicking a card calls onPick(scenario).
 * Initially shows 4 cards; toggle reveals the rest.
 */
export function mountScenariosPicker(container, demoId, onPick) {
  const scenarios = SCENARIOS[demoId] || [];
  if (!container || !scenarios.length) return;

  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'scenarios-wrap';

  const grid = document.createElement('div');
  grid.className = 'scenarios-picker';
  grid.setAttribute('role', 'list');
  grid.setAttribute('aria-label', 'سيناريوهات جاهزة');

  scenarios.forEach((sc, idx) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'scenario-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `${sc.titleAr} — ${sc.descAr}`);
    card.dataset.scenarioId = sc.id;
    if (idx >= 4) card.dataset.extra = '1';

    card.innerHTML = `
      <div class="scenario-card__top">
        <span class="scenario-card__cat">${esc(sc.category)}</span>
        <span class="scenario-card__time">${ICONS.clock}<span>~${sc.durationSec}ث</span></span>
      </div>
      <div class="scenario-card__title">${esc(sc.titleAr)}</div>
      <div class="scenario-card__desc">${esc(sc.descAr)}</div>
      <div class="scenario-card__bottom">
        <span class="scenario-card__outcome">${esc(sc.outcome)}</span>
        <span class="scenario-card__action">جرّب${ICONS.arrow}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      if (typeof onPick === 'function') onPick(sc);
    });
    grid.appendChild(card);
  });

  // Toggle button to show extra cards
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'scenarios-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = `عرض ${scenarios.length - 4} سيناريو إضافي`;

  // Hide extra cards initially
  const styleId = `scenarios-extra-${demoId}`;
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .scenarios-wrap.is-collapsed .scenario-card[data-extra="1"] { display: none; }
    `;
    document.head.appendChild(style);
  }
  wrap.classList.add('is-collapsed');

  toggle.addEventListener('click', () => {
    const collapsed = wrap.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.textContent = collapsed
      ? `عرض ${scenarios.length - 4} سيناريو إضافي`
      : 'عرض أقل';
  });

  wrap.appendChild(grid);
  if (scenarios.length > 4) wrap.appendChild(toggle);
  container.appendChild(wrap);
}

// ──────────────────────────────────────────────────────────
// 2. THINKING THEATER
// ──────────────────────────────────────────────────────────
/**
 * Starts a 5-stage thinking animation. Returns a controller with .complete() and .stop().
 * Stages auto-advance with timers. If the response arrives early, .complete() snaps all to done.
 */
export function startThinkingTheater(container) {
  if (!container) return { complete() {}, stop() {} };

  container.innerHTML = '';
  container.style.display = 'block';

  const root = document.createElement('div');
  root.className = 'thinking-theater';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-label', 'الذكاء الاصطناعي يعالج طلبك');

  root.innerHTML = `
    <div class="thinking-theater__header">
      <span class="thinking-theater__header-dot" aria-hidden="true"></span>
      <span>جاري المعالجة الذكية</span>
    </div>
    <div class="thinking-stages">
      ${THINKING_STAGES.map((s, i) => `
        <div class="thinking-stage" data-stage-idx="${i}">
          <div class="thinking-stage__icon" aria-hidden="true">${ICONS[s.icon] || ICONS.cpu}</div>
          <div class="thinking-stage__text">
            <div class="thinking-stage__title">${esc(s.titleAr)}</div>
            <div class="thinking-stage__desc">${esc(s.descAr)}</div>
          </div>
          <div class="thinking-stage__check" aria-hidden="true">${ICONS.check}</div>
        </div>
      `).join('')}
    </div>
  `;

  container.appendChild(root);

  const stageEls = Array.from(root.querySelectorAll('.thinking-stage'));
  let currentIdx = 0;
  let advancer = null;
  let stopped = false;

  function setActive(idx) {
    stageEls.forEach((el, i) => {
      el.classList.remove('is-active', 'is-done');
      if (i < idx) el.classList.add('is-done');
      else if (i === idx) el.classList.add('is-active');
    });
  }

  function advance() {
    if (stopped) return;
    setActive(currentIdx);
    // Hold the last stage looping until response arrives
    if (currentIdx < stageEls.length - 1) {
      const delay = [600, 1100, 1400, 1700][currentIdx] || 1500;
      advancer = setTimeout(() => {
        currentIdx++;
        advance();
      }, delay);
    }
  }

  advance();

  return {
    complete() {
      if (stopped) return;
      stopped = true;
      if (advancer) clearTimeout(advancer);
      // Snap all to done with a short fade
      stageEls.forEach((el) => {
        el.classList.remove('is-active');
        el.classList.add('is-done');
      });
      setTimeout(() => {
        container.style.display = 'none';
        container.innerHTML = '';
      }, 500);
    },
    stop() {
      stopped = true;
      if (advancer) clearTimeout(advancer);
      container.style.display = 'none';
      container.innerHTML = '';
    },
  };
}

// ──────────────────────────────────────────────────────────
// 3. RESULT CANVAS
// ──────────────────────────────────────────────────────────
/**
 * Mounts an empty result canvas. Returns a controller with .update().
 */
export function mountResultCanvas(container, demoId) {
  if (!container) return { update() {} };

  const meta = DEMOS_META[demoId] || {};
  const icon = DEMO_ICONS[demoId] || ICONS.sparkle;

  container.innerHTML = `
    <section class="result-canvas result-canvas--empty" id="result-canvas" aria-label="مخرجات التحليل">
      <div class="result-canvas__body" id="result-canvas-body">
        ${ICONS.sparkle}
        <p>اختر سيناريو أعلاه أو اكتب طلبك في صندوق المحادثة، وسيعرض هنا التقرير المُولَّد بصياغة منظمة وعالية الجودة.</p>
      </div>
    </section>
  `;

  const canvasEl = container.querySelector('#result-canvas');
  const bodyEl = container.querySelector('#result-canvas-body');

  function update({ scenario, html, confidence, nextActions, onNextActionPick }) {
    canvasEl.classList.remove('result-canvas--empty');

    const conf = typeof confidence === 'number' ? Math.round(confidence) : 96;
    const scenarioLabel = scenario?.titleAr || meta.canvasTitleAr || 'تقرير ذكي';

    canvasEl.innerHTML = `
      <header class="result-canvas__header">
        <div class="result-canvas__icon" aria-hidden="true">${icon}</div>
        <div class="result-canvas__title-wrap">
          <div class="result-canvas__scenario">${esc(meta.canvasTitleAr || 'تقرير')}</div>
          <div class="result-canvas__title">${esc(scenarioLabel)}</div>
        </div>
        <div class="result-canvas__confidence" aria-label="مستوى الثقة">
          <span class="result-canvas__confidence-dot" aria-hidden="true"></span>
          ثقة ${conf}%
        </div>
        <div class="result-canvas__actions">
          <button class="result-canvas__action-btn" id="rc-copy" aria-label="نسخ التقرير">
            ${ICONS.copy}<span>نسخ</span>
          </button>
        </div>
      </header>
      <div class="result-canvas__body">
        <div class="md-content">${html}</div>
      </div>
      ${nextActions?.length ? `
        <footer class="result-canvas__footer">
          <div class="result-canvas__next-label">خطوات تالية مقترحة</div>
          <div class="result-canvas__next-actions" id="rc-next-actions"></div>
        </footer>
      ` : ''}
    `;

    // Wire copy button
    const copyBtn = canvasEl.querySelector('#rc-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          // Get raw text from rendered HTML
          const tmp = document.createElement('div');
          tmp.innerHTML = html;
          await navigator.clipboard.writeText(tmp.innerText);
          const orig = copyBtn.innerHTML;
          copyBtn.innerHTML = `${ICONS.check}<span>نُسخ</span>`;
          setTimeout(() => { copyBtn.innerHTML = orig; }, 1800);
        } catch {
          /* clipboard unavailable */
        }
      });
    }

    // Wire next-action chips
    const naContainer = canvasEl.querySelector('#rc-next-actions');
    if (naContainer && nextActions?.length) {
      nextActions.forEach((sc) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'next-action-chip';
        chip.innerHTML = `${ICONS.arrow}<span>${esc(sc.titleAr)}</span>`;
        chip.addEventListener('click', () => {
          if (typeof onNextActionPick === 'function') onNextActionPick(sc);
        });
        naContainer.appendChild(chip);
      });
    }

    // Smooth scroll into view
    canvasEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return { update };
}

// ──────────────────────────────────────────────────────────
// 4. CTA STRIP
// ──────────────────────────────────────────────────────────
export function mountCTAStrip(container, opts = {}) {
  if (!container) return;

  const titleAr = opts.titleAr || 'هل تريد تطبيق هذا على بياناتك الفعلية؟';
  const subtitleAr = opts.subtitleAr || 'فريقنا في BrightAI جاهز لمساعدتك في تخصيص الحل وتفعيله داخل مؤسستك.';

  container.innerHTML = `
    <section class="cta-strip" aria-labelledby="cta-strip-title">
      <h2 class="cta-strip__title" id="cta-strip-title">${esc(titleAr)}</h2>
      <p class="cta-strip__subtitle">${esc(subtitleAr)}</p>
      <div class="cta-strip__items">
        ${CTA_STRIP.map((cta) => `
          <a class="cta-item cta-item--${cta.variant}" href="${esc(cta.href)}" ${cta.href.startsWith('http') || cta.href.startsWith('mailto') ? 'rel="noopener"' : ''} aria-label="${esc(cta.labelAr)} — ${esc(cta.sublabelAr)}">
            <div class="cta-item__icon" aria-hidden="true">${ICONS[cta.icon] || ICONS.arrow}</div>
            <div class="cta-item__label">${esc(cta.labelAr)}</div>
            <div class="cta-item__sublabel">${esc(cta.sublabelAr)}</div>
          </a>
        `).join('')}
      </div>
    </section>
  `;

  // Make "Try another" CTA scroll to scenarios/demo section
  const tryAnother = container.querySelector('a[href="#demo-section"]');
  if (tryAnother) {
    tryAnother.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('demo-section');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

// ──────────────────────────────────────────────────────────
// 5. TRUST LAYER
// ──────────────────────────────────────────────────────────
const BADGE_ICONS = [ICONS.lock, ICONS.shield, ICONS.globe, ICONS.audit, ICONS.noShare];

export function mountTrustLayer(container) {
  if (!container) return;

  container.innerHTML = `
    <section class="trust-layer" aria-labelledby="trust-title">
      <div class="trust-layer__head">
        <h2 class="v2-section-title" id="trust-title">تثق بنا فرق سعودية تعمل في بيئة حقيقية</h2>
        <p class="v2-section-subtitle">أكثر من ميزات بصرية — بنية أمنية متوافقة مع لوائح المملكة وسيادة بيانات حقيقية.</p>
      </div>

      <div class="testimonials" role="list">
        ${TRUST_LAYER.testimonials.map((t) => `
          <article class="testimonial-card" role="listitem">
            <p class="testimonial-card__quote">${esc(t.quote)}</p>
            <div class="testimonial-card__author">
              <div class="testimonial-card__name">${esc(t.author)}</div>
              <div class="testimonial-card__role">${esc(t.role)}</div>
              <div class="testimonial-card__org">${esc(t.org)}</div>
            </div>
          </article>
        `).join('')}
      </div>

      <div class="security-badges" role="list" aria-label="ضوابط الأمن والامتثال">
        ${TRUST_LAYER.badges.map((b, i) => `
          <div class="security-badge" role="listitem">
            <div class="security-badge__icon" aria-hidden="true">${BADGE_ICONS[i] || ICONS.shield}</div>
            <div class="security-badge__text">
              <div class="security-badge__label">${esc(b.label)}</div>
              <div class="security-badge__sublabel">${esc(b.sublabel)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

// ──────────────────────────────────────────────────────────
// 6. RELATED DEMOS
// ──────────────────────────────────────────────────────────
export function mountRelatedDemos(container, currentDemoId) {
  if (!container) return;

  const relatedIds = RELATED_DEMOS[currentDemoId] || [];
  if (!relatedIds.length) return;

  container.innerHTML = `
    <section class="related-demos" aria-labelledby="related-title">
      <div class="related-demos__head">
        <div>
          <h2 class="v2-section-title" id="related-title">جرّب أدوات أخرى</h2>
          <p class="v2-section-subtitle">اكتشف بقية مجموعة أدوات BrightAI الذكية.</p>
        </div>
      </div>
      <div class="related-demos__grid" role="list">
        ${relatedIds.map((id) => {
          const m = DEMOS_META[id];
          if (!m) return '';
          return `
            <a class="related-demo-card" role="listitem" href="${esc(m.href)}">
              <div class="related-demo-card__top">
                <div class="related-demo-card__icon" aria-hidden="true">${DEMO_ICONS[id] || ICONS.sparkle}</div>
                <div class="related-demo-card__title">${esc(m.titleAr)}</div>
              </div>
              <div class="related-demo-card__desc">${esc(m.descriptionAr)}</div>
              <div class="related-demo-card__cta">افتح الديمو${ICONS.arrow}</div>
            </a>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

// ──────────────────────────────────────────────────────────
// 7. JSON-LD STRUCTURED DATA
// ──────────────────────────────────────────────────────────
/**
 * Injects WebApplication + FAQPage JSON-LD into <head>.
 * Pulls FAQ from the demo schema (already loaded by caller).
 */
export function injectJSONLD(demoId, faqs = []) {
  const meta = DEMOS_META[demoId];
  if (!meta) return;

  const url = (typeof window !== 'undefined' ? window.location.origin : 'https://brightai.sa') + meta.href;

  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: meta.titleAr,
    url,
    description: meta.descriptionAr,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'SAR',
      availability: 'https://schema.org/InStock',
    },
    inLanguage: 'ar',
    provider: {
      '@type': 'Organization',
      name: 'BrightAI',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://brightai.sa',
    },
  };

  const docs = [webApp];

  if (faqs.length) {
    docs.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.questionAr || f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answerAr || f.a,
        },
      })),
    });
  }

  // Remove any previously injected scripts to avoid duplicates on re-run
  document.querySelectorAll('script[data-v0-jsonld="1"]').forEach((s) => s.remove());

  docs.forEach((doc) => {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.dataset.v0Jsonld = '1';
    s.textContent = JSON.stringify(doc);
    document.head.appendChild(s);
  });
}

// ──────────────────────────────────────────────────────────
// 8. NEXT ACTIONS HELPER
// ──────────────────────────────────────────────────────────
/**
 * Picks 3 follow-up scenarios for the next-actions row.
 * Strategy: 3 scenarios from the same demo, excluding the just-used one.
 */
export function pickNextActions(demoId, currentScenarioId) {
  const list = SCENARIOS[demoId] || [];
  return list
    .filter((s) => s.id !== currentScenarioId)
    .slice(0, 3);
}
