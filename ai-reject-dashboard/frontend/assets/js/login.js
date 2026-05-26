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
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var twofaToken = twofaInput.value.trim();

    if (!email || !password) {
      showError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    if (is2FARequired && !twofaToken) {
      showError('يرجى إدخال رمز التحقق الثنائي المكون من 6 أرقام.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'جاري التحقق...';
    errEl.style.display = 'none';

    try {
      var res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          twoFactorToken: is2FARequired ? twofaToken : undefined
        })
      });

      var data = await res.json().catch(function () { return {}; });

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // إذا طالبنا السيرفر برمز التحقق الثنائي
      if (data.require2FA) {
        is2FARequired = true;
        twofaArea.style.display = 'block';
        
        // إخفاء حقول البريد لتسهيل التركيز البصري
        if (credentialsArea) credentialsArea.style.opacity = '0.5';
        
        btn.disabled = false;
        btn.textContent = 'تأكيد ودخول';
        if (twofaInput) {
          twofaInput.required = true;
          twofaInput.focus();
        }
        return;
      }

      // تسجيل دخول ناجح
      window.location.href = redirect;

    } catch (e) {
      showError(e.message || 'فشلت عملية تسجيل الدخول. يرجى التحقق وإعادة المحاولة.');
      btn.disabled = false;
      btn.textContent = is2FARequired ? 'تأكيد ودخول' : 'تسجيل الدخول';
      
      if (is2FARequired && twofaInput) {
        twofaInput.value = '';
        twofaInput.focus();
      } else if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
      }
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
