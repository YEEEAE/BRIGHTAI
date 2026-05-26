(function () {
  var form = document.getElementById('login-form');
  var input = document.getElementById('token-input');
  var btn = document.getElementById('login-btn');
  var errEl = document.getElementById('login-error');
  var redirect = new URLSearchParams(window.location.search).get('redirect') || 'index.html';

  async function handleLogin() {
    var token = input.value.trim();
    if (!token) {
      errEl.textContent = 'Please enter an access token.';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errEl.style.display = 'none';

    try {
      var res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token })
      });

      if (!res.ok) {
        var errData = await res.json().catch(function () { return {}; });
        throw new Error(errData.message || 'Invalid access token');
      }

      // AR: لا نخزن التوكن في تخزين المتصفح؛ السيرفر يضعه في HttpOnly cookie.
      // EN: Do not store tokens in browser storage; the server sets HttpOnly cookies.
      window.location.href = redirect;
    } catch (e) {
      errEl.textContent = e.message || 'Login failed. Please check your token and try again.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Sign In';
      input.focus();
    }
  }

  if (form) form.addEventListener('submit', handleLogin);
  if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleLogin(); });
}());
