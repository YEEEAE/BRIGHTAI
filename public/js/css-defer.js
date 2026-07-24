/**
 * public/js/css-defer.js
 * Converts preloaded CSS link tags (rel="preload" as="style" data-css-defer)
 * to rel="stylesheet" upon load or DOM ready without inline onload="" handlers.
 * CSP Compliant (REPORTS-CSP-01).
 */
(function () {
  function swapLink(link) {
    if (link.dataset.cssDeferred) return;
    link.dataset.cssDeferred = 'true';
    link.rel = 'stylesheet';
  }

  function initCssDefer() {
    var links = document.querySelectorAll('link[rel="preload"][as="style"][data-css-defer]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.sheet) {
        swapLink(link);
      } else {
        link.addEventListener('load', function () {
          swapLink(this);
        });
      }
    }
  }

  // Capture phase listener for link load events that happen before DOMContentLoaded
  document.addEventListener(
    'load',
    function (e) {
      if (
        e.target &&
        e.target.nodeName === 'LINK' &&
        e.target.getAttribute('data-css-defer') !== null
      ) {
        swapLink(e.target);
      }
    },
    true
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCssDefer);
  } else {
    initCssDefer();
  }
})();
