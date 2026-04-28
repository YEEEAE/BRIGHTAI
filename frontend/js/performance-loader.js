(() => {
  'use strict';

  const currentScript = document.currentScript;
  if (!currentScript) return;
  const BUILD_VERSION = '20260427-ui-safety';

  const config = {
    analytics: currentScript.dataset.analytics || 'content',
    clarity: currentScript.dataset.clarity || 'interaction',
    sentry: currentScript.dataset.sentry || 'idle',
    iconify: currentScript.dataset.iconify || 'off',
    localScripts: (currentScript.dataset.localScripts || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    localScriptsOn: currentScript.dataset.localScriptsOn || 'idle',
    mobileRemove: (currentScript.dataset.mobileRemove || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  };

  const loadedScripts = new Set();
  const isMobile =
    window.matchMedia('(max-width: 768px)').matches ||
    Boolean(navigator.connection && navigator.connection.saveData);
  const interactionEvents = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
  const interactionListenerOptions = { once: true, passive: true };

  const reserveIconifySpace = () => {
    if (document.getElementById('bright-iconify-reserve-style')) return;
    const style = document.createElement('style');
    style.id = 'bright-iconify-reserve-style';
    style.textContent =
      'iconify-icon{display:inline-block;inline-size:1em;block-size:1em;min-inline-size:1em;min-block-size:1em;vertical-align:-0.125em;contain:layout style;}';
    document.head.appendChild(style);
  };

  const addVersion = (src) => {
    if (!src || /^https?:\/\//i.test(src) || src.includes('?v=') || src.includes('&v=')) return src;
    if (!/\.(?:js|css)(?:$|\?)/.test(src)) return src;
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}v=${BUILD_VERSION}`;
  };

  const loadScript = (src, attributes = {}) =>
    new Promise((resolve, reject) => {
      if (!src) {
        resolve();
        return;
      }

      const versionedSrc = addVersion(src);

      if (loadedScripts.has(versionedSrc) || document.querySelector(`script[src="${src}"],script[src="${versionedSrc}"]`)) {
        loadedScripts.add(versionedSrc);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = versionedSrc;
      script.async = attributes.async !== false;
      if (attributes.defer) script.defer = true;
      if (attributes.crossorigin) script.crossOrigin = attributes.crossorigin;
      script.fetchPriority = attributes.fetchpriority || 'low';
      if (attributes.referrerpolicy) script.referrerPolicy = attributes.referrerpolicy;
      const timeout = window.setTimeout(() => {
        script.onload = null;
        script.onerror = null;
        reject(new Error(`Timed out loading ${versionedSrc}`));
      }, attributes.timeout || 8000);
      script.onload = () => {
        window.clearTimeout(timeout);
        loadedScripts.add(versionedSrc);
        resolve();
      };
      script.onerror = (error) => {
        window.clearTimeout(timeout);
        reject(error);
      };
      document.head.appendChild(script);
    });

  const schedule = (mode, task) => {
    if (mode === 'off') return;

    if (mode === 'immediate') {
      task();
      return;
    }

    if (mode === 'load') {
      if (document.readyState === 'complete') {
        task();
      } else {
        window.addEventListener('load', task, { once: true });
      }
      return;
    }

    if (mode === 'content') {
      const runAfterContent = () => {
        const startWhenQuiet = () => {
          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(task, { timeout: isMobile ? 3200 : 2200 });
          } else {
            setTimeout(task, isMobile ? 2400 : 1600);
          }
        };

        if ('requestAnimationFrame' in window) {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(startWhenQuiet);
          });
        } else {
          setTimeout(startWhenQuiet, 0);
        }
      };

      if (document.readyState === 'complete') {
        runAfterContent();
      } else {
        window.addEventListener('load', runAfterContent, { once: true });
      }
      return;
    }

    if (mode === 'interaction') {
      let started = false;
      let fallbackTimer = null;
      const run = () => {
        if (started) return;
        started = true;
        if (fallbackTimer) window.clearTimeout(fallbackTimer);
        interactionEvents.forEach((eventName) => {
          window.removeEventListener(eventName, run, interactionListenerOptions);
        });
        task();
      };

      interactionEvents.forEach((eventName) => {
        window.addEventListener(eventName, run, interactionListenerOptions);
      });
      fallbackTimer = window.setTimeout(run, isMobile ? 5000 : 3500);
      return;
    }

    const runWhenIdle = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(task, { timeout: isMobile ? 2200 : 1400 });
      } else {
        setTimeout(task, isMobile ? 1800 : 1200);
      }
    };

    if (document.readyState === 'complete') {
      runWhenIdle();
    } else {
      window.addEventListener('load', runWhenIdle, { once: true });
    }
  };

  const initAnalyticsStub = () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };
  };

  const initClarityStub = () => {
    window.clarity =
      window.clarity ||
      function clarity() {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };
  };

  const loadAnalytics = async () => {
    if (window.__brightAnalyticsLoaded) return;
    window.__brightAnalyticsLoaded = true;
    initAnalyticsStub();
    await loadScript('https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q', { async: true });
    window.gtag('js', new Date());
    window.gtag('config', 'G-8LLESL207Q');
  };

  const loadClarity = async () => {
    if (window.__brightClarityLoaded) return;
    window.__brightClarityLoaded = true;
    initClarityStub();
    await loadScript('https://www.clarity.ms/tag/voq2kb6voe', { async: true });
  };

  const loadSentry = async () => {
    if (window.__brightSentryLoaded) return;
    window.__brightSentryLoaded = true;
    await loadScript('https://js.sentry-cdn.com/655a2e73b738777ce12e3ec8eaa91e6c.min.js', {
      async: true,
      crossorigin: 'anonymous',
    });
    await loadScript('/frontend/js/sentry-init.js', { async: true, defer: true });
  };

  const loadIconify = async () => {
    if (window.__brightIconifyLoaded) return;
    window.__brightIconifyLoaded = true;
    reserveIconifySpace();
    await loadScript('/frontend/js/iconify-preload.js', { async: true, defer: true });
    await loadScript('/frontend/js/vendor/iconify-icon.min.js', { async: true, defer: true });
  };

  const loadLocalScripts = () => {
    const seen = new Set();
    config.localScripts.forEach((src) => {
      const versionedSrc = addVersion(src);
      if (seen.has(versionedSrc)) return;
      seen.add(versionedSrc);
      loadScript(versionedSrc, { async: true, defer: true }).catch(() => {});
    });
  };

  const removeMobileNodes = () => {
    if (!isMobile || !config.mobileRemove.length) return;

    const run = () => {
      config.mobileRemove.forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => node.remove());
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
      run();
    }
  };

  initAnalyticsStub();
  initClarityStub();
  removeMobileNodes();

  schedule(config.analytics, () => loadAnalytics().catch(() => {}));
  schedule(config.clarity, () => loadClarity().catch(() => {}));
  schedule(config.sentry, () => loadSentry().catch(() => {}));
  schedule(config.iconify, () => loadIconify().catch(() => {}));
  schedule(config.localScriptsOn, loadLocalScripts);
})();
