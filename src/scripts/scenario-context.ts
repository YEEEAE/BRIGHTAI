import { parseScenario, scenarioEvidence } from '../shared/kernel-demo.mjs';
const params = new URLSearchParams(location.search);
let saved: string | null = null;
try { saved = sessionStorage.getItem('aigas:scenario'); } catch { /* URL remains sufficient. */ }
const scenario = parseScenario(params.get('scenarioId') ?? params.get('scenario') ?? saved);
try { sessionStorage.setItem('aigas:scenario', scenario.id); } catch { /* No storage required. */ }
const evidence = scenarioEvidence(scenario.id);
document.querySelectorAll('[data-scenario-id]').forEach(el => el.textContent = scenario.id);
document.querySelectorAll('[data-scenario-summary]').forEach(el => el.textContent = `${evidence.assetName} · ${evidence.policyName} · ${evidence.decision}`);
function updateLinks() {
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && (url.pathname === '/kernel/' || /^\/(products|demo)\/(firewall|ledger|human-gate|risk-engine|secure-chat)\/$/.test(url.pathname))) {
      const source = new URLSearchParams(location.search);
      const id = parseScenario(source.get('scenarioId') ?? source.get('scenario') ?? scenario.id).id;
      // Preserve product-specific fixture selectors such as Human Gate's escalation.
      const selector = url.searchParams.get('scenario');
      url.searchParams.set(selector && !selector.startsWith('demo-v1-') ? 'scenarioId' : 'scenario', id);
      if (url.pathname === '/kernel/') {
        try {
          const saved = new URLSearchParams(sessionStorage.getItem('aigas:scenario:kernel') ?? '');
          if (saved.get('scenario') === url.searchParams.get('scenario')) {
            if (saved.get('stage') === 'evidence') url.searchParams.set('stage', 'evidence');
            if (['approved', 'rejected'].includes(saved.get('review') ?? '')) url.searchParams.set('review', saved.get('review')!);
          }
        } catch { /* The fixture still travels in the URL. */ }
      }
      link.href = url.pathname + url.search + url.hash;
    }
  });
}
updateLinks();
window.addEventListener('aigas:scenario-change', updateLinks);
