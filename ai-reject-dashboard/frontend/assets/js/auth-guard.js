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

      const data = await res.json();
      const user = data.data.user;
      const permissions = user ? user.permissions || [] : [];

      // تخزين بيانات المستخدم بالذاكرة المؤقتة للفرونتند
      window.currentUser = user;
      window.userPermissions = permissions;

      // فحص ترخيص الصفحة
      const requiredPermission = PAGES_PROTECTED[currentPage];
      if (requiredPermission) {
        // الحساب الفائق يمر دائماً
        if (user.role === 'Super yazeed QC') return;

        // التحقق من الصلاحيات المحفوظة محلياً (بدون استدعاء إضافي للـ API)
        if (!permissions.includes(requiredPermission)) {
          window.location.href = '/pages/permission-denied.html';
        }
      }
    } catch (err) {
      window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  };

  // تشغيل الفحص فوراً عند تحميل الـ Script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
