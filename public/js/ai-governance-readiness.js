const DIMENSIONS = {
  inventory: { label: 'حصر استخدامات الذكاء الاصطناعي', control: 'أنشئ سجلًا موحدًا لاستخدامات الذكاء الاصطناعي والمالك والبيانات المرتبطة بكل استخدام.' },
  ownership: { label: 'الملكية والمسؤوليات', control: 'سمِّ مالكًا تشغيليًا ومالكًا للمخاطر لكل استخدام مهم.' },
  risk: { label: 'إدارة المخاطر', control: 'حدّد مراجعة مخاطر متناسبة قبل إطلاق الاستخدامات ذات الأثر العالي.' },
  policy: { label: 'سياسة استخدام الذكاء الاصطناعي', control: 'وثّق سياسة استخدام واضحة وعرّف متى تُراجع وتُحدّث.' },
  data: { label: 'البيانات والخصوصية', control: 'اربط كل استخدام بنوع البيانات المسموح بها والقناة المعتمدة لمعالجتها.' },
  approvals: { label: 'الموافقات البشرية', control: 'أنشئ مسار اعتماد بشري للحالات عالية الأثر.' },
  evidence: { label: 'التسجيل والأدلة', control: 'حدّد ما الذي يجب تسجيله ومن يراجعه وكيف يُحفظ الدليل التشغيلي.' },
  monitoring: { label: 'المراقبة والمراجعة', control: 'جدول مراجعة دورية للاستخدامات والمخاطر والتغييرات المهمة.' },
};

export function summarizeReadiness(answers) {
  const strengths = [];
  const gaps = [];
  const nextControls = [];
  for (const [id, dimension] of Object.entries(DIMENSIONS)) {
    if (answers[id] === 'established') strengths.push(dimension.label);
    if (answers[id] === 'partial' || answers[id] === 'not_started') { gaps.push(dimension.label); nextControls.push(dimension.control); }
  }
  return { strengths, gaps, nextControls };
}

// Privacy: only step/dimension/position identifiers are ever sent.
// Answer text, contact data, and identifiers are never included.
const ALLOWED_KEYS = new Set(['step', 'dimension', 'position']);

function track(event, payload = {}) {
  const safe = Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) => ALLOWED_KEYS.has(key) && typeof value === 'string',
    ),
  );
  window.__BRIGHTAI_ANALYTICS__?.track?.(event, safe);
}
function listMarkup(items, emptyText) { return items.length ? items.map((item) => `<li>${item}</li>`).join('') : `<li>${emptyText}</li>`; }
function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function initAssessment() {
  const form = document.querySelector('[data-readiness-assessment]'); if (!form) return;
  const groups = [...form.querySelectorAll('[data-assessment-group]')]; const status = form.querySelector('[data-assessment-status]'); const progress = form.querySelector('[data-assessment-progress]'); const stepLabel = form.querySelector('[data-assessment-step-label]'); const error = form.querySelector('[data-assessment-error]'); const results = document.querySelector('[data-assessment-results]'); let active = 0; let started = false; let completed = false; let abandoned = false;
  form.classList.add('assessment-form--enhanced');
  function setStep(index, focus = true) { active = index; groups.forEach((group, i) => { group.hidden = i !== active; }); const title = groups[active].querySelector('legend'); const stepText = `الخطوة ${active + 1} من ${groups.length}: ${title.textContent}`; status.textContent = stepText; if (stepLabel) stepLabel.textContent = `المرحلة ${active + 1} من ${groups.length}: ${groups[active].dataset.groupTitle || ''}`.trim(); progress.value = active + 1; progress.setAttribute('aria-valuetext', `الخطوة ${active + 1} من ${groups.length}`); progress.textContent = `الخطوة ${active + 1} من ${groups.length}`; form.querySelector('[data-assessment-back]').hidden = active === 0; form.querySelector('[data-assessment-next]').hidden = active === groups.length - 1; form.querySelector('[data-assessment-submit]').hidden = active !== groups.length - 1; error.hidden = true; if (focus) title.focus(); }
  function valid() { const names = [...new Set([...groups[active].querySelectorAll('input[type="radio"]')].map((field) => field.name))]; if (names.every((name) => form.querySelector(`input[name="${name}"]:checked`))) return true; error.textContent = 'اختر إجابة لكل محور قبل ما تكمل.'; error.hidden = false; error.focus(); return false; }
  function markAbandoned() { if (started && !completed && !abandoned) { abandoned = true; track('assessment_abandon', { step: String(active + 1) }); } }
  form.addEventListener('change', (event) => { if (!started && event.target.matches('input[type="radio"]')) { started = true; track('assessment_start', { step: '1' }); } });
  form.querySelector('[data-assessment-next]').addEventListener('click', () => { if (valid()) { track('assessment_step_progress', { step: String(active + 1) }); setStep(active + 1); } });
  form.querySelector('[data-assessment-back]').addEventListener('click', () => setStep(active - 1));
  form.addEventListener('submit', (event) => { event.preventDefault(); if (!valid()) return; const summary = summarizeReadiness(Object.fromEntries(new FormData(form).entries())); results.querySelector('[data-result-strengths]').innerHTML = listMarkup(summary.strengths, 'ما اخترت محاور مكتملة بعد؛ استخدم النتيجة كبداية لترتيب الأولويات.'); results.querySelector('[data-result-gaps]').innerHTML = listMarkup(summary.gaps, 'ما ظهر نقص معلن في إجاباتك؛ راجع الإجابات مع فريقك قبل اتخاذ قرار.'); results.querySelector('[data-result-controls]').innerHTML = listMarkup(summary.nextControls, 'راجِع المحاور مع فريق الحوكمة وحدد أول ضابط تشغيلي يناسب نطاقكم.'); results.hidden = false; completed = true; track('assessment_complete', { step: String(groups.length) }); results.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }); results.querySelector('h2').focus(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') markAbandoned(); }); window.addEventListener('pagehide', markAbandoned); setStep(0, false);
}
if (typeof document !== 'undefined') initAssessment();
