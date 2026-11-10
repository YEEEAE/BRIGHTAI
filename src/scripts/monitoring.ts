// No vendor SDK, persistence, form capture, identity or browser fingerprinting.
// The server rechecks approval and kill switches for every inbound signal.
type Signal = 'client_error' | 'client_rejection' | 'login_flow_result';
let sent = 0;
function signal(kind: Signal, status_code?: number) {
  try {
    const gate = document.querySelector<HTMLElement>('[data-monitoring-gate]');
    if (!gate || sent >= 10) return;
    if (kind === 'login_flow_result' ? gate.dataset.analytics !== 'true' && gate.dataset.errors !== 'true' : gate.dataset.errors !== 'true') return;
    const match = location.pathname.match(/^\/app\/(kernel|firewall|ledger|human-gate|risk-engine|secure-chat)(?:\/|$)/);
    const section = location.pathname.startsWith('/auth/') ? 'auth' : match?.[1] ?? 'portal';
    sent++;
    // Only constants and a numeric result leave the browser. Never read Error,
    // rejection.reason, filename, DOM content, query strings or form values.
    void fetch('/api/observability/', {
      method: 'POST', credentials: 'omit', mode: 'same-origin',
      referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, section, ...(status_code === undefined ? {} : { status_code }) }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => { /* Telemetry failure must not affect authentication or UI. */ });
  } catch { /* A browser API/DOM failure must also leave the auth result intact. */ }
}

let installed = false;
export function installErrorObserver() {
  if (installed || document.querySelector<HTMLElement>('[data-monitoring-gate]')?.dataset.errors !== 'true') return;
  installed = true;
  window.addEventListener('error', () => signal('client_error'));
  window.addEventListener('unhandledrejection', () => signal('client_rejection'));
}

// Preserve the exact provider result/exception. Monitoring never sees inputs or
// error text. Status represents the auth call, not a verified workspace session.
export async function observeLogin<T>(work: () => Promise<T>): Promise<T> {
  try {
    const result = await work();
    const outcome = result as { error?: { status?: unknown } | null; data?: unknown };
    const status = outcome.error?.status;
    const challenge = (outcome.data as { twoFactorRedirect?: unknown } | null)?.twoFactorRedirect;
    signal('login_flow_result', outcome.error
      ? typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599 ? status : 400
      : challenge ? 409 : 200);
    return result;
  } catch (error) {
    signal('login_flow_result', 503);
    throw error;
  }
}
