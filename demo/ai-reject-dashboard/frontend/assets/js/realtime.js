/**
 * Documentation:
 * - docs/02-data/realtime-updates.md
 * - docs/06-testing/excel-update-test.md
 */
/**
 * BrightAI Realtime Client Service (realtime.js)
 * ───────────────────────────────────────────
 * - Dynamically loads Socket.io client library.
 * - Establishes WebSockets connection to the backend.
 * - Listens for 'data:updated' and broadcasts window CustomEvents.
 * - Renders premium HSL/CSS animated toasts and notification banners sitewide.
 */
(function() {
  'use strict';

  // Inject styles for Premium Toast & Sticky Notification Banner
  const styles = `
    .realtime-toast {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 10000;
      background: var(--navy, #0F4C81);
      color: #fff;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 380px;
      font-family: 'BrightAI Official', sans-serif;
      animation: slideInRealtime 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      border-right: 4px solid var(--teal, #00A6A6);
      direction: rtl;
    }
    @keyframes slideInRealtime {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .realtime-toast-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .realtime-toast-close {
      cursor: pointer;
      font-size: 1.1rem;
      opacity: 0.7;
      transition: opacity 0.2s;
      margin-right: 12px;
    }
    .realtime-toast-close:hover { opacity: 1; }
    .realtime-toast-body {
      font-size: 0.8rem;
      opacity: 0.9;
      line-height: 1.4;
    }
    .realtime-toast-stats {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      font-size: 0.75rem;
    }
    .realtime-stat-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .realtime-stat-added { background: rgba(0, 166, 166, 0.2); color: #00e0e0; }
    .realtime-stat-changed { background: rgba(244, 162, 97, 0.2); color: #ffb070; }
    .realtime-stat-removed { background: rgba(231, 111, 81, 0.2); color: #ff8570; }

    .realtime-banner {
      background: linear-gradient(90deg, #E76F51, #F4A261);
      color: white;
      text-align: center;
      padding: 10px;
      font-size: 0.82rem;
      font-weight: 700;
      font-family: 'BrightAI Official', sans-serif;
      position: sticky;
      top: 0;
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      direction: rtl;
    }
    .realtime-banner-btn {
      background: white;
      color: #E76F51;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.75rem;
      transition: background 0.2s;
    }
    .realtime-banner-btn:hover { background: #f0f0f0; }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  function showToast(data) {
    const existing = document.querySelector('.realtime-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'realtime-toast';

    const lang = localStorage.getItem('lang') || 'ar';
    const isAr = lang === 'ar';

    toast.innerHTML = `
      <div class="realtime-toast-header">
        <span>${isAr ? '🔄 تحديث فوري للمخزون' : '🔄 Realtime Inventory Sync'}</span>
        <span class="realtime-toast-close">&times;</span>
      </div>
      <div class="realtime-toast-body">
        ${isAr ? 'تمت مزامنة ملف Excel وتحديث لوحة التحكم بنجاح!' : 'Excel workbook synced and dashboard updated successfully!'}
      </div>
      <div class="realtime-toast-stats">
        <span class="realtime-stat-badge realtime-stat-added">${isAr ? `إضافة: ${data.added_count}` : `Added: ${data.added_count}`}</span>
        <span class="realtime-stat-badge realtime-stat-changed">${isAr ? `تعديل: ${data.changed_count}` : `Modified: ${data.changed_count}`}</span>
        <span class="realtime-stat-badge realtime-stat-removed">${isAr ? `إزالة: ${data.removed_count}` : `Removed: ${data.removed_count}`}</span>
      </div>
    `;

    toast.querySelector('.realtime-toast-close').addEventListener('click', () => {
      toast.remove();
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 8000);
  }

  function showUpdateBanner(data) {
    const existing = document.querySelector('.realtime-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = 'realtime-banner';

    const lang = localStorage.getItem('lang') || 'ar';
    const isAr = lang === 'ar';

    banner.innerHTML = `
      <span>${isAr ? `📢 تم تحديث ملف إكسل بالخلفية (إجمالي السجلات: ${data.record_count})` : `📢 Excel file updated in background (Total records: ${data.record_count})`}</span>
      <button class="realtime-banner-btn">${isAr ? 'تحديث العرض' : 'Refresh View'}</button>
    `;

    banner.querySelector('.realtime-banner-btn').addEventListener('click', () => {
      banner.remove();
      window.dispatchEvent(new CustomEvent('data:updated', { detail: data }));
    });

    const appLayout = document.querySelector('.app-layout');
    if (appLayout) {
      appLayout.parentNode.insertBefore(banner, appLayout);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }

  function loadSocketIo(callback) {
    if (window.io) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = '/demo/node_modules/socket.io/client-dist/socket.io.js';
    script.onload = () => {
      callback();
    };
    script.onerror = () => {
      console.warn('Realtime Socket.io not available locally. Polling active.');
    };
    document.head.appendChild(script);
  }

  loadSocketIo(() => {
    try {
      const socket = window.io();

      socket.on('connect', () => {
        console.log('⚡ Connected to BrightAI Realtime Service');
      });

      socket.on('data:updated', (data) => {
        console.log('📢 Realtime data update received!', data);

        // Dispatch internal window event
        const event = new CustomEvent('data:updated', { detail: data });
        window.dispatchEvent(event);

        // Show toast notifications
        showToast(data);

        // Show update banner
        showUpdateBanner(data);
      });
    } catch (e) {
      console.warn('Realtime connection failed:', e);
    }
  });

})();
