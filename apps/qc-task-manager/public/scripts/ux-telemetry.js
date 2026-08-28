(() => {
  'use strict';

  const script = document.currentScript;
  if (!script || script.dataset.enabled !== 'true') return;
  const route = script.dataset.route || window.location.pathname;
  const startedAt = performance.now();
  const flowStarts = new WeakMap();
  let firstActionSent = false;

  function send(eventName, outcome = 'neutral', details = {}, durationMs = null) {
    const metadata = {};
    for (const key of ['surface', 'action', 'result', 'section', 'target', 'reason_code', 'filter_count', 'result_count', 'query_length', 'form_type', 'status']) {
      const value = details[key];
      if ((typeof value === 'string' && value.length <= 80) || (Number.isInteger(value) && value >= 0 && value <= 1000000)) metadata[key] = value;
    }
    const payload = { event_name: eventName, route: route.split('?')[0], outcome, metadata };
    if (Number.isInteger(durationMs) && durationMs >= 0) payload.duration_ms = Math.min(durationMs, 86400000);
    if (details.flowId) payload.flow_id = details.flowId;
    fetch('/api/ux/events', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
  }

  send('page_view');
  const resultMarker = document.querySelector('[data-ux-search-results]');
  if (route === '/search' && resultMarker) {
    const resultCount = Number(resultMarker.dataset.resultCount || 0);
    send('search_submit', resultCount > 0 ? 'success' : 'neutral', { surface: 'search', result_count: resultCount, filter_count: Number(resultMarker.dataset.filterCount || 0) });
    if (resultCount === 0 && resultMarker.dataset.hasFilters === 'true') {
      send('search_zero_results', 'neutral', { surface: 'search', result_count: 0 });
      try { sessionStorage.setItem('qc-ux-search-zero', '1'); } catch (_) {}
    } else if (resultCount > 0) {
      try {
        if (sessionStorage.getItem('qc-ux-search-zero') === '1') {
          send('search_reformulation', 'success', { surface: 'search', result_count: resultCount });
          sessionStorage.removeItem('qc-ux-search-zero');
        }
      } catch (_) {}
    }
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-ux-event]') : null;
    if (!target) return;
    const eventName = target.dataset.uxEvent;
    if (!eventName) return;
    const details = { ...target.dataset };
    delete details.uxEvent;
    if (!firstActionSent && route === '/dashboard') {
      firstActionSent = true;
      send('dashboard_first_action', 'success', { surface: 'dashboard', action: eventName, target: details.uxTarget || 'unknown' }, Math.round(performance.now() - startedAt));
    }
    send(eventName, target.dataset.uxOutcome || 'success', details);
    if (eventName === 'dashboard_urgent_discovery') send('dashboard_drilldown', 'success', { surface: 'dashboard', target: details.uxTarget || 'unknown' });
  }, { passive: true });

  document.addEventListener('focusin', (event) => {
    const form = event.target instanceof Element ? event.target.closest('[data-ux-flow]') : null;
    if (form && !flowStarts.has(form)) flowStarts.set(form, performance.now());
  });
  document.addEventListener('submit', (event) => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form || !form.dataset.uxFlow) return;
    const start = flowStarts.get(form) || startedAt;
    const flowId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
    const flow = form.dataset.uxFlow;
    const eventName = flow === 'review' ? 'review_decision_attempt' : 'lab_form_submit_attempt';
    send(eventName, 'neutral', { surface: form.dataset.uxSurface || 'form', form_type: flow, action: submitter?.getAttribute('value') || submitter?.textContent?.trim().slice(0, 40), flowId }, Math.round(performance.now() - start));
    if (flow === 'review' && ['request_changes', 'reject'].includes(submitter?.getAttribute('value') || '')) send('review_rework', 'neutral', { surface: 'review-center', action: submitter?.getAttribute('value') });
  }, { passive: true });
})();
