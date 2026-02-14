(function () {
  function trackCta(label) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'cta_click', {
      event_category: 'conversion',
      event_label: label || 'unknown'
    });
  }

  function sanitize(value) {
    return String(value || '').replace(/[<>]/g, '').trim();
  }

  function bindNavToggle() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.getElementById('top-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });
  }

  function bindCtas() {
    var ctas = document.querySelectorAll('[data-cta]');
    ctas.forEach(function (node) {
      node.addEventListener('click', function () {
        trackCta(node.getAttribute('data-cta'));
      });
    });
  }

  function bindDemoForms() {
    var forms = document.querySelectorAll('[data-demo-form]');
    forms.forEach(function (form) {
      var input = form.querySelector('[data-demo-input]');
      var output = form.querySelector('[data-demo-output]');
      var chips = form.querySelectorAll('[data-demo-chip]');
      var template = form.getAttribute('data-demo-template') || 'نتيجة تجريبية: تم تحليل الطلب "{query}". يتم الآن عرض التوصيات التنفيذية وخطة الإجراء.';

      function render(query) {
        var safeQuery = sanitize(query);
        if (!safeQuery || !output) {
          if (output) {
            output.classList.remove('active');
            output.textContent = '';
          }
          return;
        }

        var result = template.replace('{query}', safeQuery);
        output.textContent = result;
        output.classList.add('active');
      }

      if (form) {
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          render(input ? input.value : '');
          trackCta(form.getAttribute('data-demo-cta') || 'demo-submit');
        });
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var value = chip.getAttribute('data-demo-chip') || '';
          if (input) input.value = value;
          render(value);
          if (input) input.focus();
        });
      });
    });
  }

  function bindYear() {
    var years = document.querySelectorAll('[data-year]');
    years.forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindNavToggle();
    bindCtas();
    bindDemoForms();
    bindYear();
  });
})();
