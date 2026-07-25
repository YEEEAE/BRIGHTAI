/**
 * thank-you-id.js — BAI-SEC-18 (2026-07-25)
 *
 * Extracted from src/pages/thank-you/index.astro inline <script>
 * block to enable strict-CSP (no 'unsafe-inline' on script-src).
 *
 * CRO audit 2026-07-18 (Prompt 4): if the URL carries ?id=<lead_id>,
 * surface it in the page so the user can reference it when they call
 * us. The lead_id itself is not PII (it's an opaque id from the form
 * sink), so it can be shown in cleartext.
 *
 * Loaded as a static ES module via
 * <script type="module" src="/js/thank-you-id.js">.
 */
(function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  if (!id) return;
  var el = document.querySelector('[data-thank-you-id]');
  var val = document.querySelector('[data-thank-you-id-value]');
  if (el && val) {
    val.textContent = id;
    el.hidden = false;
  }
})();
