const endpoint = '/api/enterprise-inquiry/';

export async function enableEnterpriseInquiry(draft: HTMLTextAreaElement) {
  const form = document.querySelector<HTMLFormElement>('#enterprise-inquiry');
  const email = document.querySelector<HTMLInputElement>('#inquiry-email');
  const submit = document.querySelector<HTMLButtonElement>('#inquiry-submit');
  const feedback = document.querySelector<HTMLElement>('#inquiry-feedback');
  if (!form || !email || !submit || !feedback || !crypto.randomUUID) return;

  try {
    const response = await fetch(endpoint, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(4000) });
    if (!response.ok || (await response.json()).available !== true) return;
  } catch {
    return;
  }

  let attempt: { submissionId: string; email: string; message: string } | undefined;
  const announce = (state: string, message: string) => {
    feedback.dataset.state = state;
    feedback.textContent = message;
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const message = draft.value.trim();
    const address = email.value.trim();
    if (!message) {
      announce('error', 'اكتب استفسارك في المسودة أولًا.');
      draft.focus();
      return;
    }
    if (attempt?.message !== message || attempt.email !== address) {
      attempt = { submissionId: crypto.randomUUID(), email: address, message };
    }
    submit.disabled = true;
    email.readOnly = true;
    draft.readOnly = true;
    announce('loading', 'جارٍ إرسال الاستفسار…');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attempt),
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
      const receipt = await response.json();
      if (response.status !== 201 || receipt.status !== 'received' || receipt.submissionId !== attempt.submissionId) {
        if (response.status === 409) {
          attempt = undefined;
          announce('error', 'تعذر مطابقة محاولة الإرسال. راجع المسودة ثم أعد المحاولة.');
          submit.textContent = 'أعد المحاولة';
          return;
        }
        throw new Error();
      }
      attempt = undefined;
      form.reset();
      draft.value = '';
      submit.textContent = 'أرسل الاستفسار';
      announce('success', 'وصل استفسارك إلى فريق BRIGHTAI للمراجعة. سيستخدم الفريق بريدك للرد.');
    } catch {
      announce('error', 'تعذر تأكيد وصول الاستفسار. أعد المحاولة أو استخدم البريد أو واتساب.');
      submit.textContent = 'أعد المحاولة';
    } finally {
      submit.disabled = false;
      email.readOnly = false;
      draft.readOnly = false;
    }
  });
  form.hidden = false;
}
