import { createAuthClient, type VanillaBetterAuthClient } from '@neon/neon-js/auth';
import { BetterAuthVanillaAdapter } from '@neon/neon-js/auth/vanilla/adapters';
export type WorkspaceAuth = VanillaBetterAuthClient & { getJWTToken: () => Promise<string | null> };
let sessionEpoch = 0;
let restored = false;
// Set only after the server has confirmed that this identity is a member of the
// tenant. A URL parameter is a selector, never proof of membership; navigation
// must not carry it until the backend has answered for it.
let verifiedWorkspace = '';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
document.addEventListener('workspace-session-ended', () => { sessionEpoch++; restored = false; verifiedWorkspace = ''; });
const sessionChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('aigas-session') : null;
sessionChannel?.addEventListener('message', event => { if (event.data === 'SIGN_OUT') document.dispatchEvent(new Event('workspace-session-ended')); });
export function createWorkspaceAuth(url: string): WorkspaceAuth {
  const client = createAuthClient(url, { adapter: BetterAuthVanillaAdapter() }) as unknown as WorkspaceAuth;
  return new Proxy(client, {
    get(target, key, receiver) {
      if (key === 'signOut') return async () => {
        const result = await target.signOut();
        if (!result.error) { sessionChannel?.postMessage('SIGN_OUT'); document.dispatchEvent(new Event('workspace-session-ended')); setWorkspace(''); }
        return result;
      };
      // The declared contract is a token or null. The provider client throws when no
      // session exists (the token endpoint answers 404), which would surface a raw
      // upstream status on a signed-out or expired visit. Every caller already maps a
      // null token to its own sign-in message, so an absent credential stays absent.
      if (key === 'getJWTToken') return async () => {
        try { return await target.getJWTToken(); } catch { return null; }
      };
      return Reflect.get(target, key, receiver);
    }
  });
}
export const selectedWorkspace = () => new URL(location.href).searchParams.get('workspace') || '';
// Applies a tenant id that the server has already authorized for this session.
export function setWorkspace(id: string) {
  verifiedWorkspace = id;
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
export async function getWorkspaceSession(auth: WorkspaceAuth, force = false) {
  // X-Force-Fetch bypasses the session cache when restoring or refreshing a session.
  force ||= !restored;
  const result = await auth.getSession(force ? { fetchOptions: { headers: { 'X-Force-Fetch': 'true' } } } : undefined);
  restored = !result.error && !!result.data?.session;
  return result;
}
export async function appFetch(auth: WorkspaceAuth, input: string, init: RequestInit = {}) {
  const epoch = sessionEpoch;
  const session = await getWorkspaceSession(auth);
  const token = await auth.getJWTToken();
  if (session.error || !session.data?.user || !token) {
    document.dispatchEvent(new Event('workspace-session-ended'));
    throw Object.assign(new Error('انتهت جلسة الدخول؛ سجّل الدخول مجددًا. لم يُنفذ الطلب.'), { unauthorized: true });
  }
  const url = new URL(input, location.origin);
  // The URL selector may be sent as a requested scope on the first read, because every
  // endpoint re-authorizes it. It is never copied into navigation links until the
  // backend has confirmed the tenant; `verifiedWorkspace` wins once available.
  const requestedWorkspace = verifiedWorkspace || selectedWorkspace();
  if (!url.searchParams.has('workspace') && requestedWorkspace) url.searchParams.set('workspace', requestedWorkspace);
  const headers = new Headers(init.headers); headers.set('Authorization', `Bearer ${token}`);
  let response = await fetch(url, { ...init, headers, cache: 'no-store' });
  if (response.status === 401) {
    const refreshed = await getWorkspaceSession(auth, true);
    const fresh = await auth.getJWTToken();
    // Never replay mutations: the user must review server state before trying again.
    if (!refreshed.error && fresh && (init.method || 'GET') === 'GET') {
      headers.set('Authorization', `Bearer ${fresh}`);
      response = await fetch(url, { ...init, headers, cache: 'no-store' });
    }
    if (response.status === 401) document.dispatchEvent(new Event('workspace-session-ended'));
  }
  if (epoch !== sessionEpoch) throw Object.assign(new Error('انتهت جلسة الدخول أو تغيرت؛ أعد تحميل المساحة قبل إعادة المحاولة.'), { unauthorized: true });
  return response;
}
// Reload on tenant switches: abort old page work and discard forms, dialogs and responses.
// Selection is URL state only, never an authorization grant or persisted customer data.
document.addEventListener('change', event => {
  const select = event.target;
  if (!(select instanceof HTMLSelectElement) || !select.matches('[data-workspace]')) return;
  event.stopImmediatePropagation();
  const workspace = select.value;
  // A malformed or already-applied value never triggers a navigation.
  if (!UUID.test(workspace) || workspace === verifiedWorkspace) return;
  const main = document.querySelector('main');
  select.disabled = true;
  select.setAttribute('aria-busy', 'true');
  main?.setAttribute('aria-busy', 'true');
  main?.setAttribute('hidden', '');
  const url = new URL(location.href); url.searchParams.set('workspace', workspace);
  location.assign(url.href);
}, true);
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  restored = false;
  const main = document.querySelector('main');
  main?.removeAttribute('hidden');
  main?.removeAttribute('aria-busy');
});
