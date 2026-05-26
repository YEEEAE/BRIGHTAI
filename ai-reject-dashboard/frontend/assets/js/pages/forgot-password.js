document.getElementById('forgot-form').addEventListener('submit', async () => {
  const email = document.getElementById('email-input').value.trim();
  const btn = document.getElementById('submit-btn');
  const alertBox = document.getElementById('alert-box');

  if (!email) return;

  btn.disabled = true;
  btn.textContent = 'جاري المعالجة...';
  alertBox.style.display = 'none';

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (res.ok) {
      alertBox.className = 'alert alert-success';
      alertBox.textContent = data.message;
      alertBox.style.display = 'block';
      
      if (data.resetToken) {
        console.log('💡 Reset Token retrieved for simulation:', data.resetToken);
        setTimeout(() => {
          window.location.href = `/pages/reset-password.html?token=${data.resetToken}`;
        }, 3000);
      }
    } else {
      throw new Error(data.message || 'Failed to request reset');
    }
  } catch (e) {
    alertBox.className = 'alert alert-danger';
    alertBox.textContent = e.message;
    alertBox.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'إرسال رابط الاستعادة';
  }
});
