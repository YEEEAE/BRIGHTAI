/* BrightAI Kernel — Shared Navigation */
(function () {
  var links = [
    { href: '/kernel/', fileHref: 'index.html', label: 'الرئيسية' },
    { href: '/kernel/chat/', fileHref: 'chat.html', label: 'فاحص الطلبات' },
    { href: '/kernel/audit/', fileHref: 'audit.html', label: 'سجل التدقيق' },
    { href: '/kernel/approvals/', fileHref: 'approvals.html', label: 'الموافقات' },
    { href: '/kernel/stats/', fileHref: 'stats.html', label: 'الإحصائيات' },
    { href: '/kernel/compliance/', fileHref: 'compliance.html', label: 'الامتثال' },
    { href: '/kernel/policies/', fileHref: 'policies.html', label: 'السياسات' },
    { href: '/kernel/connectors/', fileHref: 'connectors.html', label: 'الموصلات' },
    { href: '/kernel/scenarios/', fileHref: 'scenarios.html', label: 'السيناريوهات' },
    { href: '/kernel/reports/', fileHref: 'reports.html', label: 'التقارير' },
    { href: '/kernel/evidence/', fileHref: 'evidence.html', label: 'الدليل' },
  ];

  var isFileProtocol = window.location.protocol === 'file:';
  var current = window.location.pathname.replace(/\/$/, '');

  function navHref(link) {
    return isFileProtocol ? link.fileHref : link.href;
  }

  function normalizePath(value) {
    return String(value || '')
      .replace(/\/index\.html$/i, '')
      .replace(/\.html$/i, '')
      .replace(/\/$/, '');
  }

  function isActive(href) {
    var h = normalizePath(href);
    var c = normalizePath(current);
    if (h === '/kernel' && (c === '/kernel' || c.endsWith('/kernel'))) return true;
    return c === h || c.endsWith(h);
  }

  var navHtml = `
  <nav class="kernel-nav" role="navigation" aria-label="التنقل الرئيسي">
    <a href="${navHref(links[0])}" class="logo" aria-label="BrightAI Kernel الصفحة الرئيسية">BrightAI <span>Kernel</span></a>
    <ul class="nav-links" role="list">
      ${links.map(function(l){
        return '<li><a href="'+navHref(l)+'"'+(isActive(l.href)?' class="active" aria-current="page"':'')+'>'+l.label+'</a></li>';
      }).join('')}
    </ul>
    <button class="nav-toggle" id="nav-toggle" aria-label="فتح القائمة" aria-expanded="false" aria-controls="mobile-menu">
      &#9776;
    </button>
  </nav>
  <div class="mobile-menu" id="mobile-menu" role="navigation" aria-label="القائمة الجوالة">
    ${links.map(function(l){
      return '<a href="'+navHref(l)+'"'+(isActive(l.href)?' class="active"':'')+'>'+l.label+'</a>';
    }).join('')}
  </div>`;

  document.currentScript.insertAdjacentHTML('beforebegin', navHtml);

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('mobile-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  });
})();
