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

  const toNameArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => typeof item === 'string' ? item : item && item.name).filter(Boolean);
  };

  const normalizeAuthPayload = (payload) => {
    const data = payload && payload.data ? payload.data : {};
    const user = data.user || {};
    const roles = toNameArray(data.roles || user.roles);
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

    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      
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
          window.location.href = '/ai-reject-dashboard/frontend/pages/permission-denied.html';
        }
      }
    } catch (err) {
      window.location.href = `/ai-reject-dashboard/frontend/pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  };

  // تشغيل الفحص فوراً عند تحميل الـ Script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
