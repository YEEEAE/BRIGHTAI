/**
 * auth-guard.js — Frontend Authentication & Authorization Shield
 * AR: حماية واجهات المستخدم الفرونتند وتوجيه الزوار غير المصرحين.
 */
(function () {
  'use strict';

  if (window.__AuthGuardInitialized) return;
  window.__AuthGuardInitialized = true;

  const PAGES_PROTECTED = {
    'index.html': 'view:dashboard',
    'executive.html': 'view:executive',
    'finance.html': 'view:finance',
    'quality.html': 'view:quality',
    'production.html': 'view:production',
    'workflow.html': 'view:workflow',
    'technical.html': 'view:technical',
    'reports.html': 'generate:reports',
    'users.html': 'manage:users' // admin/users.html
  };

  const getPageName = () => {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  };

  const goToLogin = () => {
    window.location.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const goToPermissionDenied = () => {
    window.location.replace('/permission-denied');
  };

  const setLoadingState = (enabled) => {
    document.documentElement.classList.toggle('auth-checking', enabled);
    if (document.body) {
      document.body.classList.toggle('auth-checking', enabled);
    }

    let loader = document.getElementById('auth-guard-loading');
    if (enabled && !loader) {
      loader = document.createElement('div');
      loader.id = 'auth-guard-loading';
      loader.setAttribute('role', 'status');
      loader.setAttribute('aria-live', 'polite');
      
      loader.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
        color: #f8fafc;
        font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
        gap: 1.5rem;
        transition: opacity 0.3s ease;
      `;
      
      loader.innerHTML = `
        <div style="position: relative; display: flex; justify-content: center; align-items: center;">
          <!-- حلقة النيون الدوارة ثلاثية الأبعاد -->
          <div style="
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 4px solid rgba(99, 102, 241, 0.1);
            border-top: 4px solid #6366f1;
            border-right: 4px solid #14b8a6;
            animation: auth-spin 1s linear infinite;
          "></div>
          <!-- أيقونة الشعار في المنتصف النابضة -->
          <div style="
            position: absolute;
            font-size: 24px;
            animation: auth-pulse 2s ease-in-out infinite;
          ">🛡️</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
          <h2 style="margin: 0; font-size: 1.2rem; font-weight: 700; letter-spacing: -0.025em; background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">BrightAI Shield</h2>
          <p style="margin: 0; font-size: 0.85rem; color: #94a3b8; font-weight: 500; direction: rtl;">جاري التحقق من أمان الجلسة...</p>
        </div>
        
        <style>
          @keyframes auth-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes auth-pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 1; }
          }
        </style>
      `;
      
      if (document.body) {
        document.body.appendChild(loader);
      }
    } else if (!enabled && loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        const el = document.getElementById('auth-guard-loading');
        if (el) el.remove();
      }, 300);
    }
  };

  const toNameArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => typeof item === 'string' ? item : item && item.name).filter(Boolean);
  };

  const normalizeAuthPayload = (payload) => {
    const data = payload && payload.data ? payload.data : {};
    const user = data.user || payload || {};
    const roles = toNameArray(data.roles || user.roles);
    if (user.role && !roles.includes(user.role)) roles.push(user.role);
    const permissions = toNameArray(data.permissions || user.permissions);

    return {
      user: {
        ...user,
        roles,
        permissions,
        role: roles.join(', ') || user.role || 'Viewer'
      },
      roles,
      permissions
    };
  };

  const checkAuth = async () => {
    const currentPage = getPageName();
    
    // AR: لا نفحص صفحة تسجيل الدخول أو استعادة الكلمة لتفادي حلقة توجيه لا نهائية
    // EN: Skip check on auth pages to avoid redirect loops
    if (['login.html', 'forgot-password.html', 'reset-password.html', 'permission-denied.html'].includes(currentPage)) {
      return;
    }

    setLoadingState(true);

    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      
      if (res.status === 401) {
        goToLogin();
        return;
      }

      if (!res.ok) {
        throw new Error('Unauthorized');
      }

      const { user, roles, permissions } = normalizeAuthPayload(await res.json());

      // تخزين بيانات المستخدم بالذاكرة المؤقتة للفرونتند
      window.currentUser = user;
      window.userRoles = roles;
      window.userPermissions = permissions;

      // فحص ترخيص الصفحة
      const requiredPermission = PAGES_PROTECTED[currentPage];
      if (requiredPermission) {
        // الحساب الفائق يمر دائماً
        if (roles.includes('Super yazeed QC')) return;

        // التحقق من الصلاحيات المحفوظة محلياً (بدون استدعاء إضافي للـ API)
        if (!permissions.includes(requiredPermission)) {
          goToPermissionDenied();
          return;
        }
      }
    } catch (err) {
      goToLogin();
    } finally {
      setLoadingState(false);
    }
  };

  // تشغيل الفحص فوراً عند تحميل الـ Script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
