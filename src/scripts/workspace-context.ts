import { createAuthClient } from '@neon/neon-js/auth';
export type WorkspaceAuth = ReturnType<typeof createAuthClient>;
let sessionEpoch = 0;
document.addEventListener('workspace-session-ended', () => { sessionEpoch++; restored = false; });
const sessionChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('aigas-session') : null;
sessionChannel?.addEventListener('message', event => { if (event.data === 'SIGN_OUT') document.dispatchEvent(new Event('workspace-session-ended')); });
export function createWorkspaceAuth(url: string): WorkspaceAuth {
  const client = createAuthClient(url);
  return new Proxy(client, {
    get(target, key, receiver) {
      if (key === 'signOut') return async () => {
        const result = await target.signOut();
        if (!result.error) { sessionChannel?.postMessage('SIGN_OUT'); document.dispatchEvent(new Event('workspace-session-ended')); setWorkspace(''); }
        return result;
      };
      return Reflect.get(target, key, receiver);
    }
  });
}
export const selectedWorkspace = () => new URL(location.href).searchParams.get('workspace') || '';
export function setWorkspace(id: string) {
  const url = new URL(location.href);
  if (id) url.searchParams.set('workspace', id); else url.searchParams.delete('workspace');
  history.replaceState(history.state, '', url);
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    const target = new URL(link.href, location.href);
    if (target.origin === location.origin && /^\/app\/(?:kernel|firewall|ledger|human-gate|risk-engine|secure-chat)\/$/.test(target.pathname)) {
      if (id) target.searchParams.set('workspace', id); else target.searchParams.delete('workspace');
      link.href = target.href;
    }
  });
}
let restored = false;
export async function getWorkspaceSession(auth: WorkspaceAuth, force = false) {
  // 0.8.2 returns a JWT in session.token; X-Force-Fetch bypasses its session cache.
  force ||= !restored; restored = true;
  return auth.getSession(force ? { fetchOptions: { headers: { 'X-Force-Fetch': 'true' } } } : undefined);
}
export async function appFetch(auth: WorkspaceAuth, input: string, init: RequestInit = {}) {
  const epoch = sessionEpoch;
  const session = await getWorkspaceSession(auth);
  const token = session.data?.session?.token;
  if (session.error || !session.data?.user || !token) throw Object.assign(new Error('سجّل الدخول من Kernel لاستعادة الجلسة.'), { unauthorized: true });
  const url = new URL(input, location.origin);
  if (!url.searchParams.has('workspace') && selectedWorkspace()) url.searchParams.set('workspace', selectedWorkspace());
  const headers = new Headers(init.headers); headers.set('Authorization', `Bearer ${token}`);
  let response = await fetch(url, { ...init, headers, cache: 'no-store' });
  if (response.status === 401) {
    const refreshed = await getWorkspaceSession(auth, true);
    const fresh = refreshed.data?.session?.token;
    // Never replay mutations: the user must review server state before trying again.
    if (!refreshed.error && fresh && (init.method || 'GET') === 'GET') {
      headers.set('Authorization', `Bearer ${fresh}`);
      response = await fetch(url, { ...init, headers, cache: 'no-store' });
    }
    if (response.status === 401) document.dispatchEvent(new Event('workspace-session-ended'));
  }
  if (epoch !== sessionEpoch) throw Object.assign(new Error('تغيرت جلسة الدخول؛ أعد تحميل المساحة.'), {unauthorized:true});
  return response;
}
// Reload on tenant switches: abort old page work and discard forms, dialogs and responses.
// Selection is URL state only, never an authorization grant or persisted customer data.
document.addEventListener('change', event => {
  const select = event.target;
  if (!(select instanceof HTMLSelectElement) || !select.matches('[data-workspace]')) return;
  event.stopImmediatePropagation();
  const url = new URL(location.href); url.searchParams.set('workspace', select.value);
  document.querySelector('main')?.setAttribute('hidden', '');
  location.assign(url.href);
}, true);
window.addEventListener('pageshow', event => { if (event.persisted) { restored = false; document.querySelector('main')?.removeAttribute('hidden'); } });
setWorkspace(selectedWorkspace());
