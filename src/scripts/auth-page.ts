import { createWorkspaceAuth, getWorkspaceSession } from './workspace-context';
import { observeLogin } from './monitoring';

const card = document.querySelector<HTMLElement>('.auth-card');
if (card) mount(card);

function mount(card: HTMLElement) {
  const auth = createWorkspaceAuth();
  const form = card.querySelector<HTMLFormElement>('[data-auth-form]')!;
  const formView = card.querySelector<HTMLElement>('[data-auth-form-view]')!;
  const sessionView = card.querySelector<HTMLElement>('[data-auth-session]')!;
  const verify = card.querySelector<HTMLFormElement>('[data-verify-form]')!;
  const name = form.querySelector<HTMLInputElement>('#auth-name')!;
  const email = form.querySelector<HTMLInputElement>('#auth-email')!;
  const password = form.querySelector<HTMLInputElement>('#auth-password')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const switchButton = card.querySelector<HTMLButtonElement>('[data-switch]')!;
  const passwordToggle = form.querySelector<HTMLButtonElement>('[data-password-toggle]')!;
  const otpEmail = verify.querySelector<HTMLInputElement>('#verify-email')!;
  const otp = verify.querySelector<HTMLInputElement>('#verify-otp')!;
  const purpose = verify.querySelector<HTMLSelectElement>('#otp-purpose')!;
  const send = verify.querySelector<HTMLButtonElement>('[data-send-otp]')!;
  const proceed = card.querySelector<HTMLAnchorElement>('[data-continue]')!;
  const status = document.getElementById('auth-status')!;
  const retry = card.querySelector<HTMLButtonElement>('[data-auth-retry]')!;
  const controls = [...card.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button')];
  let signingUp = card.dataset.mode !== 'sign-in';
  let busy = false;
  let activeSession = false;
  let sessionVersion = 0;
  let nextCheck = 0;
  let navigating = false;
  const unavailable = 'خدمة الحسابات غير متاحة مؤقتًا. حاول مرة ثانية.';
  const rejected = 'تعذر تسجيل الدخول. راجع البيانات أو اطلب رمزًا جديدًا.';
  const invalidOtp = 'تعذر التحقق من الرمز. راجع الرمز أو اطلب رمزًا جديدًا.';
  const mfa = 'يتطلب الدخول خطوة تحقق إضافية لا تدعمها هذه البوابة حاليًا. تواصل مع الدعم.';
  const setStatus = (message: string) => { status.textContent = message; };
  function requireAuthAvailable(error: unknown) {
    if (Number((error as { status?: number })?.status) >= 500) throw error;
  }
  const needsMfa = (data: unknown) => Boolean((data as { twoFactorRedirect?: unknown } | null)?.twoFactorRedirect);

  function setMode(signUp: boolean) {
    signingUp = signUp;
    name.closest<HTMLElement>('[data-name-field]')!.hidden = !signUp;
    name.required = signUp;
    password.autocomplete = signUp ? 'new-password' : 'current-password';
    password.minLength = signUp ? 8 : 0;
    password.type = 'password';
    password.value = '';
    passwordToggle.textContent = 'إظهار كلمة المرور';
    passwordToggle.setAttribute('aria-pressed', 'false');
    submit.textContent = signUp ? 'إنشاء الحساب' : 'تسجيل الدخول';
    card.querySelector('[data-switch-label]')!.textContent = signUp ? 'عندك حساب؟' : 'ما عندك حساب؟';
    switchButton.textContent = signUp ? 'تسجيل الدخول' : 'إنشاء حساب';
    for (const input of [name, email, password]) input.removeAttribute('aria-invalid');
    card.querySelector('#auth-heading')!.textContent = submit.textContent;
  }

  function showForm(message: string) {
    activeSession = false;
    clearTimeout(nextCheck);
    sessionView.hidden = true;
    proceed.hidden = true;
    otpEmail.readOnly = false;
    formView.hidden = false;
    verify.hidden = false;
    setStatus(message);
  }

  async function run(message: string, action: () => Promise<void>, denied?: string) {
    if (busy || navigating) return;
    busy = true;
    retry.hidden = true;
    card.setAttribute('aria-busy', 'true');
    controls.forEach(control => { control.disabled = true; });
    setStatus(message);
    try { await action(); }
    catch (error) {
      const authError = error as { status?: number; code?: string; error?: { status?: number; code?: string } };
      const code = authError?.error?.code ?? authError?.code;
      const httpStatus = authError?.error?.status ?? authError?.status ?? 0;
      if (code === 'AUTH_SETUP_REQUIRED' || code === 'AUTH_PORTAL_CLOSED') {
        setStatus(code === 'AUTH_PORTAL_CLOSED' ? 'بوابة مساحة العمل مغلقة حاليًا.' : 'خدمة الحسابات غير مهيأة في هذا التشغيل.');
      } else {
        setStatus(denied && httpStatus >= 400 && httpStatus < 500 ? denied : unavailable);
      }
      if (!activeSession) showForm(status.textContent ?? unavailable);
      retry.hidden = false;
    } finally {
      busy = false;
      if (!navigating) {
        controls.forEach(control => { control.disabled = false; });
        purpose.disabled = activeSession;
      }
      card.removeAttribute('aria-busy');
    }
  }

  async function refresh(allowReturn: boolean, empty: string) {
    const version = sessionVersion;
    const { data, error } = await getWorkspaceSession(auth, true);
    if (version !== sessionVersion) return;
    if (error) throw error;
    const user = data?.user;
    const session = data?.session;
    if (!user?.email || !session) {
      showForm(activeSession ? 'انتهت جلسة الدخول. سجّل الدخول مرة ثانية.' : empty);
      return;
    }
    activeSession = true;
    formView.hidden = true;
    sessionView.hidden = false;
    card.querySelector('[data-current-user]')!.textContent = user.email;
    const verified = user.emailVerified === true;
    purpose.value = 'email-verification';
    otpEmail.value = user.email;
    otpEmail.readOnly = !verified;
    verify.hidden = verified;
    proceed.hidden = !verified;
    setStatus(verified ? 'جلسة الدخول نشطة.' : 'وثّق بريدك بالرمز للمتابعة.');
    clearTimeout(nextCheck);
    const expires = new Date(session.expiresAt).getTime();
    const delay = Number.isFinite(expires) ? Math.min(2147483647, Math.max(2000, expires - Date.now() + 200)) : 60000;
    nextCheck = window.setTimeout(() => {
      if (activeSession && !busy) void run('جارٍ تحديث الجلسة…', () => refresh(false, 'سجّل الدخول مرة ثانية.'));
    }, delay);
    if (allowReturn && verified && card.dataset.autoReturn === 'true' && card.dataset.workspacePath) {
      navigating = true;
      setStatus('تم تسجيل الدخول. جارٍ فتح الوجهة…');
      location.replace(card.dataset.workspacePath);
    }
  }

  setMode(signingUp);
  switchButton.addEventListener('click', () => {
    setMode(!signingUp);
    setStatus('');
    (signingUp ? name : email).focus();
  });
  form.addEventListener('input', event => {
    if (event.target instanceof HTMLInputElement) event.target.removeAttribute('aria-invalid');
  });
  passwordToggle.addEventListener('click', () => {
    const visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    passwordToggle.textContent = visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور';
    passwordToggle.setAttribute('aria-pressed', String(visible));
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (busy) return;
    const invalid = [
      { field: name, invalid: signingUp && !name.value.trim(), message: 'اكتب اسمك.' },
      { field: email, invalid: !email.validity.valid, message: 'أدخل بريدًا إلكترونيًا صالحًا.' },
      { field: password, invalid: !password.value || (signingUp && password.value.length < 8), message: signingUp ? 'استخدم 8 أحرف على الأقل.' : 'اكتب كلمة المرور.' },
    ].find(item => item.invalid);
    if (invalid) {
      invalid.field.setAttribute('aria-invalid', 'true');
      setStatus(invalid.message);
      invalid.field.focus();
      return;
    }
    void run(signingUp ? 'جارٍ إرسال طلب التسجيل…' : 'جارٍ تسجيل الدخول…', async () => {
      const credentials = { email: email.value.trim(), password: password.value };
      try {
        if (signingUp) {
          const result = await observeLogin(() => auth.signUp.email({ ...credentials, name: name.value.trim() }));
          requireAuthAvailable(result.error);
          if (result.error) { setStatus('تعذر إكمال الطلب. راجع البيانات وحاول مرة ثانية.'); return; }
          otpEmail.value = credentials.email;
          purpose.value = 'email-verification';
          setMode(false);
          setStatus('إذا أمكن إكمال التسجيل بهذا البريد، استخدم رمز التوثيق. تقدر تطلب رمزًا من هذه الصفحة.');
          return;
        }
        const result = await observeLogin(() => auth.signIn.email(credentials));
        requireAuthAvailable(result.error);
        if (result.error) { setStatus(rejected); return; }
        if (needsMfa(result.data)) { setStatus(mfa); return; }
        await refresh(true, rejected);
      } finally {
        password.value = '';
      }
    }, rejected);
  });

  send.addEventListener('click', () => {
    if (!otpEmail.validity.valid) { setStatus('أدخل بريدًا إلكترونيًا صالحًا.'); otpEmail.focus(); return; }
    void run('جارٍ طلب الرمز…', async () => {
      const type = activeSession || purpose.value !== 'sign-in' ? 'email-verification' : 'sign-in';
      const { error } = await auth.emailOtp.sendVerificationOtp({ email: otpEmail.value.trim(), type });
      if (error) throw error;
      setStatus('إذا أمكن إرسال رمز لهذا البريد، بيصلك خلال دقائق. راجع صندوق الوارد.');
    });
  });

  verify.addEventListener('submit', event => {
    event.preventDefault();
    if (!verify.reportValidity()) return;
    void run('جارٍ التحقق من الرمز…', async () => {
      const details = { email: otpEmail.value.trim(), otp: otp.value };
      const signingIn = !activeSession && purpose.value === 'sign-in';
      try {
        const result = signingIn ? await auth.signIn.emailOtp(details) : await auth.emailOtp.verifyEmail(details);
        requireAuthAvailable(result.error);
        if (result.error) { setStatus(invalidOtp); return; }
        if (needsMfa(result.data)) { setStatus(mfa); return; }
        if (!signingIn) setMode(false);
        await refresh(true, signingIn ? rejected : 'تم توثيق البريد. سجّل الدخول بكلمة المرور أو اطلب رمز دخول.');
      } finally {
        otp.value = '';
      }
    }, invalidOtp);
  });

  function checkSession() {
    void run('جارٍ تحديث الجلسة…', () => refresh(false, 'سجّل الدخول للمتابعة.'));
  }
  card.querySelector('[data-refresh]')!.addEventListener('click', checkSession);
  retry.addEventListener('click', checkSession);
  card.querySelector('[data-sign-out]')!.addEventListener('click', () => {
    void run('جارٍ تسجيل الخروج…', async () => {
      const { error } = await auth.signOut();
      if (error) throw error;
      setMode(false);
      form.reset();
      verify.reset();
      otpEmail.readOnly = false;
      showForm('تم تسجيل الخروج.');
    });
  });
  document.addEventListener('workspace-session-ended', () => {
    sessionVersion++;
    otpEmail.readOnly = false;
    showForm('انتهت جلسة الدخول. سجّل الدخول مرة ثانية.');
  });
  document.addEventListener('visibilitychange', () => {
    if (activeSession && document.visibilityState === 'visible') checkSession();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) checkSession(); });
  void run('جارٍ التحقق من جلسة الدخول…', () => refresh(true, signingUp ? 'أكمل الحقول لإنشاء حساب.' : 'سجّل الدخول بكلمة المرور أو برمز البريد.'));
}
