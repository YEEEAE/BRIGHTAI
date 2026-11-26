import { enableEnterpriseInquiry } from './enterprise-inquiry';

const openButton = document.querySelector<HTMLButtonElement>('#enterprise-dialog-open');
const dialog = document.querySelector<HTMLDialogElement>('#enterprise-request-dialog');
const closeButton = document.querySelector<HTMLButtonElement>('#enterprise-dialog-close');
const draft = document.querySelector<HTMLTextAreaElement>('#inquiry-message');
const fallback = document.querySelector<HTMLElement>('#inquiry-fallback');
const retryButton = document.querySelector<HTMLButtonElement>('#inquiry-availability-retry');
const feedback = document.querySelector<HTMLElement>('#inquiry-feedback');

if (openButton && dialog && closeButton && draft && fallback && retryButton && feedback) {
  let inquiryEnabled = false;

  async function checkAvailability() {
    retryButton.disabled = true;
    feedback.textContent = 'جارٍ التحقق من توافر الاستقبال…';
    const available = await enableEnterpriseInquiry(draft);
    inquiryEnabled = available || inquiryEnabled;
    fallback.hidden = inquiryEnabled;
    feedback.textContent = inquiryEnabled
      ? 'الاستقبال متاح. اكتب بريدك ورسالتك ثم أرسل.'
      : 'الاستقبال غير متاح الآن. استخدم قناة التواصل البديلة أو أعد التحقق.';
    retryButton.disabled = false;
  }

  openButton.addEventListener('click', async () => {
    if (dialog.open) return;
    dialog.showModal();
    if (!inquiryEnabled) await checkAvailability();
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => openButton.focus());
  retryButton.addEventListener('click', () => void checkAvailability());
}
