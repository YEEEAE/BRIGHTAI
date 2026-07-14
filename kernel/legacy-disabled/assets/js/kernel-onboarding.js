/**
 * BrightAI Kernel - First-time onboarding wizard
 * Shows a short RTL walkthrough once, then stores completion locally.
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'kernel_onboarding_done';
  const ROOT_ID = 'kernel-onboarding-root';
  const STYLE_ID = 'kernel-onboarding-styles';

  const steps = [
    {
      eyebrow: 'تشغيل أول مرة',
      title: 'مرحباً في BrightAI Kernel',
      body: 'نواة تشغيل لحوكمة الذكاء الاصطناعي: تفحص الطلبات، تصنف المخاطر، تحفظ الأدلة، وتوضح متى يحتاج القرار مراجعة بشرية.',
      illustration: 'shield',
    },
    {
      eyebrow: 'امتثال جاهز',
      title: 'اختر حزمة الامتثال',
      body: 'ابدأ من الحزمة الأقرب لبيئتك، ثم عدل السياسات لاحقاً حسب البيانات والأنظمة الداخلية.',
      illustration: 'compliance',
    },
    {
      eyebrow: 'انطلاق سريع',
      title: 'ابدأ أول محادثة',
      body: 'جرّب سؤالاً عملياً وشاهد كيف يسجل Kernel المخاطر، الضوابط، وسجل التدقيق قبل الرد.',
      illustration: 'chat',
    },
  ];

  const compliancePacks = [
    {
      name: 'PDPL',
      description: 'حماية البيانات الشخصية، تقليل المشاركة، وتنبيه عند ظهور معلومات حساسة.',
    },
    {
      name: 'NCA ECC',
      description: 'ضوابط أمن سيبراني، تصعيد للمخاطر العالية، وسجل تدقيق قابل للمراجعة.',
    },
    {
      name: 'SFDA',
      description: 'حوكمة استخدامات صحية، فصل القرار السريري، وحفظ أدلة المراجعة.',
    },
  ];

  const KernelOnboarding = {
    state: {
      index: 0,
      open: false,
      lastFocus: null,
    },

    init(options = {}) {
      this.injectStyles();
      this.bindGlobalOpenEvent();

      if (options.force === true || this.shouldShow()) {
        this.open({ force: options.force === true });
      }
    },

    shouldShow() {
      return this.readDoneFlag() !== 'true';
    },

    readDoneFlag() {
      try {
        return global.localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        return null;
      }
    },

    writeDoneFlag() {
      try {
        global.localStorage.setItem(STORAGE_KEY, 'true');
      } catch (error) {
        // Storage may be blocked; closing still works for this page view.
      }
    },

    reset() {
      try {
        global.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        // Storage is optional.
      }
      this.open({ force: true });
    },

    open(options = {}) {
      if (this.state.open) return;
      if (!options.force && !this.shouldShow()) return;

      this.state.index = 0;
      this.state.open = true;
      this.state.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      const root = document.createElement('div');
      root.id = ROOT_ID;
      root.className = 'kernel-onboarding';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-labelledby', 'kernel-onboarding-title');
      root.setAttribute('aria-describedby', 'kernel-onboarding-copy');
      root.innerHTML = global.KernelUtils?.sanitizeHtml?.(this.render()) || this.render();

      document.body.appendChild(root);
      document.body.classList.add('kernel-onboarding-open');
      this.updateStep();

      requestAnimationFrame(() => {
        root.classList.add('is-visible');
        this.focusFirst();
      });

      root.addEventListener('click', (event) => {
        const action = event.target.closest('[data-onboarding-action]');
        if (!action) return;

        const actionName = action.getAttribute('data-onboarding-action');
        if (actionName === 'next') this.next();
        if (actionName === 'skip') this.complete(false);
        if (actionName === 'chat') this.complete(true);
      });

      document.addEventListener('keydown', this.handleKeydown);
    },

    close() {
      const root = document.getElementById(ROOT_ID);
      this.state.open = false;
      document.body.classList.remove('kernel-onboarding-open');
      document.removeEventListener('keydown', this.handleKeydown);

      if (!root) {
        this.restoreFocus();
        return;
      }

      root.classList.remove('is-visible');
      setTimeout(() => {
        root.remove();
        this.restoreFocus();
      }, 260);
    },

    next() {
      if (this.state.index >= steps.length - 1) {
        this.complete(true);
        return;
      }

      this.state.index += 1;
      this.updateStep();
    },

    complete(goToChat) {
      this.writeDoneFlag();
      this.close();

      if (goToChat) {
        setTimeout(() => {
          global.location.href = '/kernel/chat/?example=governance-first-message';
        }, 120);
      }
    },

    updateStep() {
      const root = document.getElementById(ROOT_ID);
      if (!root) return;

      const step = steps[this.state.index];
      const isLast = this.state.index === steps.length - 1;

      root.style.setProperty('--kernel-onboarding-index', String(this.state.index));

      root.querySelector('[data-onboarding-eyebrow]').textContent = step.eyebrow;
      root.querySelector('[data-onboarding-title]').textContent = step.title;
      root.querySelector('[data-onboarding-copy]').textContent = step.body;
      root.querySelector('[data-onboarding-next]').textContent = isLast ? 'ابدأ المحادثة' : 'التالي';
      root.querySelector('[data-onboarding-next]').setAttribute('data-onboarding-action', isLast ? 'chat' : 'next');
      root.querySelector('[data-onboarding-progress]').textContent = this.renderProgressText();
      root.querySelector('[data-onboarding-progress]').setAttribute('aria-label', `الخطوة ${this.state.index + 1} من ${steps.length}`);

      root.querySelectorAll('[data-onboarding-visual]').forEach((visual) => {
        visual.classList.toggle('active', visual.getAttribute('data-onboarding-visual') === step.illustration);
      });

      root.querySelectorAll('[data-onboarding-panel]').forEach((panel, index) => {
        const active = index === this.state.index;
        panel.classList.toggle('active', active);
        panel.setAttribute('aria-hidden', String(!active));
      });
    },

    renderProgressText() {
      return steps.map((_, index) => (index <= this.state.index ? '●' : '○')).join('');
    },

    render() {
      return `
        <div class="kernel-onboarding__backdrop" aria-hidden="true"></div>
        <section class="kernel-onboarding__sheet">
          <button class="kernel-onboarding__skip" type="button" data-onboarding-action="skip">تخطي</button>

          <div class="kernel-onboarding__visuals" aria-hidden="true">
            ${this.renderIllustrations()}
          </div>

          <div class="kernel-onboarding__content">
            <span class="kernel-onboarding__eyebrow" data-onboarding-eyebrow></span>
            <h2 class="kernel-onboarding__title" id="kernel-onboarding-title" data-onboarding-title></h2>
            <p class="kernel-onboarding__copy" id="kernel-onboarding-copy" data-onboarding-copy></p>

            <div class="kernel-onboarding__track">
              <div class="kernel-onboarding__slides">
                ${steps.map((step, index) => this.renderPanel(step, index)).join('')}
              </div>
            </div>
          </div>

          <footer class="kernel-onboarding__footer">
            <span class="kernel-onboarding__progress" data-onboarding-progress aria-live="polite"></span>
            <button class="kernel-onboarding__next" type="button" data-onboarding-next data-onboarding-action="next">التالي</button>
          </footer>
        </section>
      `;
    },

    renderPanel(step, index) {
      if (index === 1) {
        return `
          <div class="kernel-onboarding__panel" data-onboarding-panel>
            <div class="kernel-onboarding__packs" aria-label="حزم الامتثال">
              ${compliancePacks.map((pack) => `
                <article class="kernel-onboarding__pack">
                  <strong>${pack.name}</strong>
                  <span>${pack.description}</span>
                </article>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (index === 2) {
        return `
          <div class="kernel-onboarding__panel" data-onboarding-panel>
            <div class="kernel-onboarding__example">
              <span>مثال سريع</span>
              <p>راجع هذا الطلب: هل يحتوي بيانات شخصية؟ وما مستوى المخاطر قبل إرساله للنموذج؟</p>
            </div>
          </div>
        `;
      }

      return `
        <div class="kernel-onboarding__panel" data-onboarding-panel>
          <div class="kernel-onboarding__summary">
            <span>Risk Score</span>
            <strong>Low → Review → Evidence</strong>
          </div>
          <div class="kernel-onboarding__summary">
            <span>Audit Trail</span>
            <strong>Trace ID + policy decisions</strong>
          </div>
        </div>
      `;
    },

    renderIllustrations() {
      return `
        <div class="kernel-onboarding__visual active" data-onboarding-visual="shield">
          <span class="kernel-onboarding__halo"></span>
          <svg viewBox="0 0 180 180" role="img" aria-label="درع BrightAI Kernel">
            <path d="M90 18l55 21v43c0 38-22 66-55 80-33-14-55-42-55-80V39l55-21z" />
            <path d="M63 89l18 18 39-43" />
            <circle cx="90" cy="90" r="64" />
          </svg>
        </div>
        <div class="kernel-onboarding__visual" data-onboarding-visual="compliance">
          <span class="kernel-onboarding__halo"></span>
          <svg viewBox="0 0 180 180" role="img" aria-label="حزم الامتثال">
            <path d="M45 48h90v84H45z" />
            <path d="M63 72h54M63 92h54M63 112h32" />
            <path d="M90 28v20M70 28h40" />
            <circle cx="132" cy="130" r="20" />
            <path d="M123 130l7 7 13-17" />
          </svg>
        </div>
        <div class="kernel-onboarding__visual" data-onboarding-visual="chat">
          <span class="kernel-onboarding__halo"></span>
          <svg viewBox="0 0 180 180" role="img" aria-label="محادثة Kernel">
            <path d="M38 48h104a18 18 0 0118 18v48a18 18 0 01-18 18H82l-34 20 9-20H38a18 18 0 01-18-18V66a18 18 0 0118-18z" />
            <path d="M58 82h64M58 104h42" />
            <circle cx="136" cy="104" r="8" />
          </svg>
        </div>
      `;
    },

    focusFirst() {
      const root = document.getElementById(ROOT_ID);
      const button = root ? root.querySelector('[data-onboarding-action="skip"]') : null;
      if (button) button.focus({ preventScroll: true });
    },

    restoreFocus() {
      if (this.state.lastFocus && document.contains(this.state.lastFocus)) {
        this.state.lastFocus.focus({ preventScroll: true });
      }
      this.state.lastFocus = null;
    },

    handleKeydown(event) {
      const root = document.getElementById(ROOT_ID);
      if (!root) return;

      if (event.key === 'Escape') {
        KernelOnboarding.complete(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(root.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.offsetParent !== null || element === document.activeElement);

      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },

    bindGlobalOpenEvent() {
      if (this.boundGlobalOpenEvent) return;
      this.boundGlobalOpenEvent = true;
      document.addEventListener('kernel:onboarding:open', () => this.open({ force: true }));
      document.addEventListener('kernel:onboarding:reset', () => this.reset());
      document.addEventListener('click', (event) => {
        const openTrigger = event.target.closest('[data-kernel-onboarding-open]');
        const resetTrigger = event.target.closest('[data-kernel-onboarding-reset]');
        if (!openTrigger && !resetTrigger) return;

        event.preventDefault();
        if (resetTrigger) {
          this.reset();
        } else {
          this.open({ force: true });
        }
      });
    },

    injectStyles() {
      if (document.getElementById(STYLE_ID)) return;

      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        body.kernel-onboarding-open {
          overflow: hidden;
        }

        .kernel-onboarding {
          position: fixed;
          inset: 0;
          z-index: var(--z-modal, 500);
          display: grid;
          place-items: center;
          padding: max(20px, var(--safe-area-top, 0px)) max(16px, var(--safe-area-right, 0px)) max(20px, var(--safe-area-bottom, 0px)) max(16px, var(--safe-area-left, 0px));
          color: var(--text-primary, #f1f5f9);
          direction: rtl;
          opacity: 0;
          pointer-events: none;
          transition: opacity 260ms ease;
        }

        .kernel-onboarding.is-visible {
          opacity: 1;
          pointer-events: auto;
        }

        .kernel-onboarding__backdrop {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 24% 20%, rgba(0, 212, 255, 0.18), transparent 34%),
            radial-gradient(circle at 78% 76%, rgba(245, 158, 11, 0.13), transparent 32%),
            rgba(3, 10, 24, 0.78);
          backdrop-filter: blur(18px);
        }

        .kernel-onboarding__sheet {
          position: relative;
          width: min(920px, 100%);
          min-height: 520px;
          display: grid;
          grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.15fr);
          grid-template-rows: 1fr auto;
          gap: 0;
          overflow: hidden;
          border: 1px solid var(--border-active, rgba(0, 212, 255, 0.4));
          border-radius: var(--radius-xl, 24px);
          background: linear-gradient(145deg, rgba(11, 22, 40, 0.98), rgba(17, 30, 56, 0.94));
          box-shadow: var(--shadow-aurora, 0 0 80px rgba(0, 212, 255, 0.15)), var(--shadow-xl, 0 16px 48px rgba(0, 0, 0, 0.6));
          transform: translateY(14px) scale(0.98);
          transition: transform 320ms ease;
        }

        .kernel-onboarding.is-visible .kernel-onboarding__sheet {
          transform: translateY(0) scale(1);
        }

        .kernel-onboarding__skip {
          position: absolute;
          inset-block-start: 18px;
          inset-inline-start: 18px;
          z-index: 2;
          min-height: 40px;
          padding: 0 16px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: var(--radius-full, 9999px);
          background: rgba(15, 23, 42, 0.54);
          color: var(--text-secondary, #94a3b8);
          font: inherit;
          cursor: pointer;
          transition: border-color 180ms ease, color 180ms ease, background 180ms ease;
        }

        .kernel-onboarding__skip:hover,
        .kernel-onboarding__skip:focus-visible {
          border-color: var(--border-active, rgba(0, 212, 255, 0.4));
          background: rgba(0, 212, 255, 0.1);
          color: var(--text-primary, #f1f5f9);
          outline: none;
        }

        .kernel-onboarding__visuals {
          position: relative;
          display: grid;
          place-items: center;
          min-height: 100%;
          padding: 48px 28px;
          border-inline-end: 1px solid var(--border, rgba(0, 212, 255, 0.1));
          background:
            linear-gradient(180deg, rgba(0, 212, 255, 0.08), rgba(245, 158, 11, 0.04)),
            rgba(3, 10, 24, 0.45);
        }

        .kernel-onboarding__visual {
          position: absolute;
          width: min(230px, 72%);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          opacity: 0;
          transform: translateX(calc((var(--kernel-onboarding-index, 0) - 1) * 18px)) scale(0.92);
          transition: opacity 320ms ease, transform 320ms ease;
        }

        .kernel-onboarding__visual.active {
          opacity: 1;
          transform: translateX(0) scale(1);
        }

        .kernel-onboarding__halo {
          position: absolute;
          inset: 12%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.28), transparent 68%);
          filter: blur(4px);
        }

        .kernel-onboarding__visual svg {
          position: relative;
          width: 100%;
          height: 100%;
          fill: rgba(0, 212, 255, 0.07);
          stroke: var(--brand, #00d4ff);
          stroke-width: 7;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 22px rgba(0, 212, 255, 0.28));
        }

        .kernel-onboarding__content {
          min-width: 0;
          padding: 70px 42px 24px;
        }

        .kernel-onboarding__eyebrow {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 0 12px;
          border: 1px solid rgba(245, 158, 11, 0.22);
          border-radius: var(--radius-full, 9999px);
          background: rgba(245, 158, 11, 0.11);
          color: var(--gold-light, #fbbf24);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .kernel-onboarding__title {
          margin-block-start: 18px;
          font-size: clamp(1.7rem, 3vw, 2.55rem);
          line-height: 1.25;
          letter-spacing: 0;
        }

        .kernel-onboarding__copy {
          margin-block-start: 14px;
          max-width: 56ch;
          color: var(--text-secondary, #94a3b8);
          font-size: 1.02rem;
          line-height: 1.9;
        }

        .kernel-onboarding__track {
          margin-block-start: 28px;
          overflow: hidden;
        }

        .kernel-onboarding__slides {
          display: flex;
          width: 300%;
          direction: ltr;
          transform: translateX(calc(var(--kernel-onboarding-index, 0) * -33.333%));
          transition: transform 360ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .kernel-onboarding__panel {
          width: 33.333%;
          flex: 0 0 33.333%;
          direction: rtl;
          opacity: 0.42;
          transition: opacity 240ms ease;
        }

        .kernel-onboarding__panel.active {
          opacity: 1;
        }

        .kernel-onboarding__summary,
        .kernel-onboarding__example,
        .kernel-onboarding__pack {
          border: 1px solid var(--border, rgba(0, 212, 255, 0.1));
          border-radius: var(--radius-md, 10px);
          background: rgba(3, 10, 24, 0.42);
        }

        .kernel-onboarding__summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          min-height: 62px;
          padding: 14px 16px;
        }

        .kernel-onboarding__summary + .kernel-onboarding__summary {
          margin-block-start: 10px;
        }

        .kernel-onboarding__summary span,
        .kernel-onboarding__example span {
          color: var(--text-tertiary, #64748b);
          font-size: 0.85rem;
          font-weight: 700;
        }

        .kernel-onboarding__summary strong {
          color: var(--text-primary, #f1f5f9);
          font-family: 'IBM Plex Mono', 'Consolas', monospace;
          font-size: 0.86rem;
          direction: ltr;
        }

        .kernel-onboarding__packs {
          display: grid;
          gap: 10px;
        }

        .kernel-onboarding__pack {
          display: grid;
          gap: 4px;
          min-height: 78px;
          padding: 14px 16px;
        }

        .kernel-onboarding__pack strong {
          color: var(--brand-light, #4de8ff);
          font-family: 'IBM Plex Mono', 'Consolas', monospace;
          letter-spacing: 0;
        }

        .kernel-onboarding__pack span {
          color: var(--text-secondary, #94a3b8);
          font-size: 0.92rem;
          line-height: 1.65;
        }

        .kernel-onboarding__example {
          padding: 18px;
          border-color: rgba(16, 185, 129, 0.24);
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(0, 212, 255, 0.06));
        }

        .kernel-onboarding__example p {
          margin-block-start: 8px;
          color: var(--text-primary, #f1f5f9);
          font-size: 1rem;
          line-height: 1.85;
        }

        .kernel-onboarding__footer {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 24px;
          border-block-start: 1px solid var(--border, rgba(0, 212, 255, 0.1));
          background: rgba(3, 10, 24, 0.42);
        }

        .kernel-onboarding__progress {
          color: var(--brand, #00d4ff);
          font-size: 1.05rem;
          letter-spacing: 4px;
          direction: ltr;
        }

        .kernel-onboarding__next {
          min-width: 150px;
          min-height: 46px;
          padding: 0 22px;
          border: 0;
          border-radius: var(--radius-full, 9999px);
          background: var(--gradient-brand, linear-gradient(135deg, #00d4ff 0%, #14b8a6 100%));
          color: var(--text-inverse, #0f172a);
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          box-shadow: var(--glow-brand, 0 0 12px rgba(0, 212, 255, 0.4));
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .kernel-onboarding__next:hover,
        .kernel-onboarding__next:focus-visible {
          transform: translateY(-1px);
          box-shadow: var(--shadow-glow-lg, 0 0 40px rgba(0, 212, 255, 0.3));
          outline: none;
        }

        @media (max-width: 760px) {
          .kernel-onboarding {
            align-items: end;
            justify-items: stretch;
            padding: 0;
          }

          .kernel-onboarding__sheet {
            width: 100%;
            min-height: auto;
            max-height: min(92dvh, calc(var(--vh, 1vh) * 92));
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
            border-radius: var(--radius-xl, 24px) var(--radius-xl, 24px) 0 0;
            border-inline: 0;
            border-block-end: 0;
            overflow-y: auto;
            transform: translateY(100%);
          }

          .kernel-onboarding.is-visible .kernel-onboarding__sheet {
            transform: translateY(0);
          }

          .kernel-onboarding__visuals {
            min-height: 150px;
            padding: 22px 24px 10px;
            border-inline-end: 0;
            border-block-end: 1px solid var(--border, rgba(0, 212, 255, 0.1));
          }

          .kernel-onboarding__visual {
            width: 132px;
          }

          .kernel-onboarding__content {
            padding: 24px 20px 16px;
          }

          .kernel-onboarding__title {
            font-size: 1.62rem;
          }

          .kernel-onboarding__copy {
            font-size: 0.96rem;
          }

          .kernel-onboarding__summary {
            align-items: flex-start;
            flex-direction: column;
          }

          .kernel-onboarding__footer {
            position: sticky;
            bottom: 0;
            padding: 14px 16px calc(14px + var(--safe-area-bottom, 0px));
          }

          .kernel-onboarding__next {
            min-width: 132px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kernel-onboarding,
          .kernel-onboarding__sheet,
          .kernel-onboarding__slides,
          .kernel-onboarding__visual,
          .kernel-onboarding__next,
          .kernel-onboarding__skip {
            transition: none;
          }
        }
      `;

      document.head.appendChild(style);
    },
  };

  global.KernelOnboarding = KernelOnboarding;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KernelOnboarding.init());
  } else {
    KernelOnboarding.init();
  }
})(typeof window !== 'undefined' ? window : this);
