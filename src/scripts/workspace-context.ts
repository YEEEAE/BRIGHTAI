import './auth-validation';
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
export function createWorkspaceAuth(): WorkspaceAuth {
  const client = createAuthClient(new URL('/auth/api', location.origin).href, {
    adapter: BetterAuthVanillaAdapter({
      fetchOptions: {
        credentials: 'same-origin',
        redirect: 'error',
        onRequest(request) {
          // Astro requires a trailing slash; a redirect on POST can discard its body.
          if (!request.url.pathname.endsWith('/')) request.url.pathname += '/';
        },
      },
    }),
  }) as unknown as WorkspaceAuth;
  return new Proxy(client, {
    get(target, key, receiver) {
      if (key === 'signOut') return async () => {
        const result = await target.signOut({ fetchOptions: { headers: { 'X-Force-Fetch': 'true' } } });
        if (!result.error) { sessionChannel?.postMessage('SIGN_OUT'); document.dispatchEvent(new Event('workspace-session-ended')); setWorkspace(''); }
        return result;
      };
      // The declared contract is a token or null. The provider client throws when no
      // session exists (the token endpoint answers 404), which would surface a raw
      // upstream status on a signed-out or expired visit. Every caller already maps a
      // null token to its own sign-in message, so an absent credential stays absent.
      if (key === 'getJWTToken') return async () => {
        // Better Auth exposes token(); an unknown getJWTToken property is turned
        // into /get-jwt-token by its proxy and returns 404 even after sign-in.
        try {
          const result = await target.token({ fetchOptions: { headers: { 'X-Force-Fetch': 'true' } } });
          return !result.error && typeof result.data?.token === 'string' ? result.data.token : null;
        } catch { return null; }
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
  const url = new URL(input, location.origin);
  if (url.origin !== location.origin || !url.pathname.startsWith('/app/api/')) {
    throw new Error('وجهة طلب مساحة العمل غير صالحة.');
  }
  const epoch = sessionEpoch;
  const expired = () => Object.assign(new Error('انتهت جلسة الدخول أو تغيرت؛ سجّل الدخول مرة ثانية.'), { unauthorized: true });
  const session = await getWorkspaceSession(auth);
  if (session.error) throw new Error('تعذر التحقق من الجلسة. حاول مرة ثانية.');
  if (!session.data?.session || !session.data.user) {
    if (epoch === sessionEpoch) document.dispatchEvent(new Event('workspace-session-ended'));
    throw expired();
  }
  const token = await auth.getJWTToken();
  if (epoch !== sessionEpoch) throw expired();
  if (!token) {
    const refreshed = await getWorkspaceSession(auth, true);
    if (epoch !== sessionEpoch) throw expired();
    if (!refreshed.error && (!refreshed.data?.session || refreshed.data.user?.id !== session.data.user.id)) {
      document.dispatchEvent(new Event('workspace-session-ended'));
      throw expired();
    }
    throw new Error('تعذر تحديث بيانات الجلسة. حاول مرة ثانية.');
  }
  // The URL selector may be sent as a requested scope on the first read, because every
  // endpoint re-authorizes it. It is never copied into navigation links until the
  // backend has confirmed the tenant; `verifiedWorkspace` wins once available.
  const requestedWorkspace = verifiedWorkspace || selectedWorkspace();
  if (!url.searchParams.has('workspace') && requestedWorkspace) url.searchParams.set('workspace', requestedWorkspace);
  const headers = new Headers(init.headers); headers.set('Authorization', `Bearer ${token}`);
  let response = await fetch(url, { ...init, headers, cache: 'no-store' });
  if (response.status === 401) {
    const refreshed = await getWorkspaceSession(auth, true);
    if (epoch !== sessionEpoch) throw expired();
    const sameIdentity = !refreshed.error && !!refreshed.data?.session && refreshed.data.user?.id === session.data.user.id;
    // Replay reads once after refresh. A mutation must be retried explicitly.
    if (sameIdentity && ['GET', 'HEAD'].includes((init.method ?? 'GET').toUpperCase())) {
      const fresh = await auth.getJWTToken();
      if (epoch !== sessionEpoch) throw expired();
      if (fresh) {
        headers.set('Authorization', `Bearer ${fresh}`);
        response = await fetch(url, { ...init, headers, cache: 'no-store' });
      }
    }
    if (epoch !== sessionEpoch) throw expired();
    if (response.status === 401 && !refreshed.error && (!sameIdentity || ['GET', 'HEAD'].includes((init.method ?? 'GET').toUpperCase()))) {
      document.dispatchEvent(new Event('workspace-session-ended'));
      throw expired();
    }
  }
  if (epoch !== sessionEpoch) throw expired();
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
