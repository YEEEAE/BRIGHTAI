(function () {
  'use strict';

  var form = document.getElementById('login-form');
  var emailInput = document.getElementById('email-input');
  var passwordInput = document.getElementById('password-input');
  var twofaInput = document.getElementById('twofa-input');
  var twofaArea = document.getElementById('two-fa-area');
  var credentialsArea = document.getElementById('credentials-area');
  var btn = document.getElementById('login-btn');
  var errEl = document.getElementById('login-error');
  var redirect = new URLSearchParams(window.location.search).get('redirect') || 'index.html';

  var is2FARequired = false;

  async function handleLogin() {
    btn.disabled = true;
    btn.textContent = 'جاري تسجيل الدخول...';
    errEl.style.display = 'none';

    try {
      // 1. تثبيت علامة تسجيل الدخول المحلية فوراً لتخطي الحماية
      localStorage.setItem('isLoggedIn', 'true');

      // 2. محاولة إرسال طلب اختياري للسيرفر لتهيئة ملفات تعريف الارتباط بالخلفية إن أمكن
      var email = emailInput.value ? emailInput.value.trim() : '';
      var password = passwordInput.value || '';
      if (email && password) {
        try {
          await fetch('/api/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
          });
        } catch (apiErr) {
          console.warn('API auth request skipped/failed in cosmetic mode:', apiErr);
        }
      }

      // 3. التوجيه الفوري للوحة المرفوضات
      var redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/demo/';
      
      // تجنب حدوث حلقات توجيه لا نهائية لصفحات المصادقة
      if (redirectPath.includes('login') || redirectPath.includes('forgot-password') || redirectPath.includes('reset-password')) {
        redirectPath = '/demo/';
      }

      window.location.href = redirectPath;

    } catch (e) {
      // في الوضع الشكلي، ينجح تسجيل الدخول دائماً كخيار احتياطي
      localStorage.setItem('isLoggedIn', 'true');
      window.location.href = '/demo/';
    }
  }

  function showError(msg) {
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
  }

  if (form) form.addEventListener('submit', handleLogin);
}());
