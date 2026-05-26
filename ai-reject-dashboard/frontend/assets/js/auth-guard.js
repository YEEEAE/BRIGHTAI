/**
 * auth-guard.js — Frontend Authentication & Authorization Shield
 * AR: حماية واجهات المستخدم الفرونتند وتوجيه الزوار غير المصرحين.
 */
(function () {
  'use strict';

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
      const permissions = data.data.preferences ? data.data.user.permissions || [] : [];

      // تخزين بيانات المستخدم بالذاكرة المؤقتة للفرونتند
      window.currentUser = user;
      window.userPermissions = permissions;

      // فحص ترخيص الصفحة
      const requiredPermission = PAGES_PROTECTED[currentPage];
      if (requiredPermission) {
        // الحساب الفائق يمر دائماً
        if (user.role === 'Super yazeed QC') return;

        // التحقق من أن السيرفر يدرج الصلاحيات، أو جلبها ومطابقتها
        const hasPerm = await verifyPermissionLocally(requiredPermission);
        if (!hasPerm) {
          window.location.href = '/pages/permission-denied.html';
        }
      }
    } catch (err) {
      window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  };

  const verifyPermissionLocally = async (permission) => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.success) return false;
      const roles = data.data.user.role;
      if (roles === 'Super yazeed QC') return true;

      // جلب الصلاحيات الفعلية من الـ API
      const permissions = data.data.user.permissions || [];
      return permissions.includes(permission);
    } catch (e) {
      return false;
    }
  };

  // تشغيل الفحص فوراً عند تحميل الـ Script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
