/**
 * BrightAI Kernel - Demo Banner UI
 * Renders and wires the demo-data banner and toggle controls.
 */

(function (global) {
  'use strict';

  const {
    isFileProtocol,
    shouldUseDemoData,
    ensureDBInitialized,
    updateStatsDOMDirectly,
    startLiveFeedSimulator,
  } = global.KernelDemoStore || {};

  if (typeof shouldUseDemoData !== 'function') {
    throw new Error('KernelDemoStore must load before kernel-demo-banner.js');
  }

  function injectBannerStyles() {
    const css = `
      .brightai-demo-banner {
        background: linear-gradient(135deg, #0b1329 0%, #152244 100%);
        border-bottom: 2px solid #eab308;
        padding: 0.625rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        color: #f8fafc;
        font-family: 'IBM Plex Sans Arabic', sans-serif;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        position: relative;
        z-index: 99999;
      }
      .brightai-demo-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.9375rem;
        font-weight: 700;
      }
      .brightai-demo-badge {
        background: rgba(234, 179, 8, 0.12);
        border: 1px solid #eab308;
        color: #eab308;
        padding: 0.125rem 0.625rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }
      .brightai-demo-pulse {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #eab308;
        animation: brightai-pulse 1.5s infinite;
      }
      .brightai-demo-text {
        font-size: 0.875rem;
        color: #94a3b8;
      }
      .brightai-demo-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .brightai-demo-toggle-wrap {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255,255,255,0.05);
        padding: 0.25rem 0.75rem;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .brightai-demo-label {
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
      }
      .brightai-demo-switch {
        position: relative;
        display: inline-block;
        width: 38px;
        height: 20px;
      }
      .brightai-demo-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .brightai-demo-slider {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: #475569;
        transition: .3s;
        border-radius: 20px;
      }
      .brightai-demo-slider:before {
        position: absolute;
        content: "";
        height: 14px; width: 14px;
        left: 3px; bottom: 3px;
        background-color: white;
        transition: .3s;
        border-radius: 50%;
      }
      input:checked + .brightai-demo-slider {
        background-color: #eab308;
      }
      input:checked + .brightai-demo-slider:before {
        transform: translateX(18px);
      }
      .brightai-demo-btn {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        color: #f8fafc;
        padding: 0.375rem 0.875rem;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .brightai-demo-btn:hover {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.3);
      }
      @keyframes brightai-pulse {
        0% { transform: scale(0.9); opacity: 0.6; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0.6; }
      }
      @media (max-width: 768px) {
        .brightai-demo-banner {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .brightai-demo-actions {
          width: 100%;
          justify-content: space-between;
        }
      }
    `;
    const style = document.createElement('style');
    style.id = 'brightai-demo-banner-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectBannerUI() {
    if (document.getElementById('brightai-demo-banner-ui')) return;

    const banner = document.createElement('div');
    banner.id = 'brightai-demo-banner-ui';
    banner.className = 'brightai-demo-banner';

    const demoStorageKey = global.KernelRuntimeConfig?.get?.().demoStorageKey || 'brightai_kernel_demo_mode';
    const isDemo = localStorage.getItem(demoStorageKey) === 'true';

    banner.innerHTML = global.KernelUtils?.sanitizeHtml?.(`
      <div class="brightai-demo-brand">
        <span class="brightai-demo-badge">
          <span class="brightai-demo-pulse"></span>
          بيانات تجريبية
        </span>
        <span class="brightai-demo-text" id="brightai-demo-helper-text"></span>
      </div>
      <div class="brightai-demo-actions">
        <div class="brightai-demo-toggle-wrap">
          <span class="brightai-demo-label" id="brightai-demo-mode-label">بيانات تجريبية</span>
          <label class="brightai-demo-switch">
            <input type="checkbox" id="brightai-demo-toggle-checkbox" ${isDemo ? 'checked' : ''}>
            <span class="brightai-demo-slider"></span>
          </label>
        </div>
        <button class="brightai-demo-btn" id="brightai-demo-reset-btn">إعادة تعيين البيانات</button>
      </div>
    `) || '';

    // Inject as the first child of the body element to display at top
    if (document.body) {
      document.body.insertBefore(banner, document.body.firstChild);
    }

    // Attach control listeners
    document.getElementById('brightai-demo-toggle-checkbox')?.addEventListener('change', (e) => {
      const active = e.target.checked;
      localStorage.setItem(demoStorageKey, active ? 'true' : 'false');
      window.location.reload();
    });

    document.getElementById('brightai-demo-reset-btn')?.addEventListener('click', () => {
      if (confirm('هل أنت متأكد من إعادة تعيين كافة البيانات التجريبية لحالتها الأصلية؟')) {
        localStorage.removeItem('brightai_kernel_mock_db');
        window.location.reload();
      }
    });
  }

  function updateBannerUI() {
    const checkbox = document.getElementById('brightai-demo-toggle-checkbox');
    if (checkbox) {
      checkbox.checked = shouldUseDemoData();
      checkbox.disabled = isFileProtocol();
    }

    const badge = document.querySelector('#brightai-demo-banner-ui .brightai-demo-badge');
    if (badge) {
      badge.lastChild.textContent = shouldUseDemoData() ? ' بيانات تجريبية' : ' Production API';
    }

    const helper = document.getElementById('brightai-demo-helper-text');
    if (helper) {
      helper.textContent = isFileProtocol()
        ? 'تم تفعيل البيانات التجريبية تلقائياً لأن الصفحة مفتوحة محلياً عبر file://'
        : shouldUseDemoData()
          ? 'بيانات سعودية صناعية ومحمية بالكامل، لا تُستخدم إلا عند تفعيل هذا الخيار'
          : 'الوضع الافتراضي يتصل بواجهة الإنتاج /api/kernel بدون محاكاة محلية';
    }
  }

  // Auto initialize on DOM Load
  document.addEventListener('DOMContentLoaded', async () => {
    injectBannerStyles();
    injectBannerUI();
    updateBannerUI();
    
    if (shouldUseDemoData()) {
      await ensureDBInitialized();
      updateStatsDOMDirectly();
      startLiveFeedSimulator();
    }
  });


  global.KernelDemoBanner = {
    injectBannerStyles,
    injectBannerUI,
    updateBannerUI,
  };

})(typeof window !== 'undefined' ? window : this);
