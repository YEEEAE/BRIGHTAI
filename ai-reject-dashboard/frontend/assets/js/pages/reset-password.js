/**
 * Documentation:
 * - docs/04-api/auth-api.md
 * - docs/05-security/auth-rbac.md
 */
const token = new URLSearchParams(window.location.search).get('token');

document.getElementById('reset-form').addEventListener('submit', async () => {
  const pass = document.getElementById('password-input').value;
  const confirm = document.getElementById('confirm-input').value;
  const btn = document.getElementById('submit-btn');
  const alertBox = document.getElementById('alert-box');

  if (!token) {
    alertBox.className = 'alert alert-danger';
    alertBox.textContent = 'رمز استعادة كلمة المرور مفقود أو غير صحيح.';
    alertBox.style.display = 'block';
    return;
  }

  if (pass !== confirm) {
    alertBox.className = 'alert alert-danger';
    alertBox.textContent = 'كلمتا المرور غير متطابقتين.';
    alertBox.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'جاري الحفظ...';
  alertBox.style.display = 'none';

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: pass })
    });

    const data = await res.json();

    if (res.ok) {
      alertBox.className = 'alert alert-success';
      alertBox.textContent = 'تم حفظ وتغيير كلمة المرور بنجاح! جاري التوجيه لصفحة تسجيل الدخول...';
      alertBox.style.display = 'block';
      
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 3000);
    } else {
      throw new Error(data.message || 'Failed to reset password');
    }
  } catch (e) {
    alertBox.className = 'alert alert-danger';
    alertBox.textContent = e.message;
    alertBox.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'حفظ كلمة المرور';
  }
});
