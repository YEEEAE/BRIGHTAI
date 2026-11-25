import { createHash, randomBytes } from 'node:crypto';
import { EncryptJWT, jwtDecrypt, createRemoteJWKSet, jwtVerify } from 'jose';
import { KernelError, isUuid } from './core.mjs';
import { trustedApiOrigin } from '../api/origin.mjs';

const pending = '__Host-brightai-oidc-flow';
const proof = '__Host-brightai-oidc-proof';
const nonce = () => randomBytes(32).toString('base64url');
const unavailable = () => new KernelError(503, 'SSO_UNAVAILABLE', 'تعذر الاتصال بخدمة الدخول المؤسسي.');
function configuration() {
  try {
    const rows = JSON.parse(process.env.AIGAS_OIDC_CONNECTIONS ?? '[]');
    if (!Array.isArray(rows)) throw Error();
    const map = new Map();
    for (const row of rows) {
      if (!isUuid(row.workspace) || map.has(row.workspace) || !['test','required','suspended'].includes(row.mode)) throw Error();
      for (const key of ['issuer','authorization','token','jwks']) {
        const url = new URL(row[key]);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw Error();
      }
      if (!row.clientId || !row.revision || !Array.isArray(row.bindings) ||
          row.bindings.some(b => !isUuid(b.userId) || typeof b.subject !== 'string' || !b.subject) ||
          new Set(row.bindings.map(b => b.subject)).size !== row.bindings.length) throw Error();
      map.set(row.workspace, row);
    }
    return map;
  } catch { throw unavailable(); }
}
function key() {
  const value = process.env.AIGAS_OIDC_COOKIE_KEY;
  if (!/^[a-f0-9]{64}$/i.test(value ?? '')) throw unavailable();
  return Buffer.from(value,'hex');
}
function cookie(request, name) {
  return (request.headers.get('cookie') ?? '').split(';').map(x => x.trim()).find(x => x.startsWith(name+'='))?.slice(name.length+1);
}
async function seal(name, claims, minutes) {
  const value = await new EncryptJWT(claims).setProtectedHeader({alg:'dir',enc:'A256GCM'})
    .setAudience(name).setIssuedAt().setExpirationTime(minutes+'m').encrypt(key());
  return name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+minutes*60;
}
async function open(request, name) {
  const value = cookie(request,name);
  if (!value) return null;
  try { return (await jwtDecrypt(value,key(),{audience:name,keyManagementAlgorithms:['dir'],contentEncryptionAlgorithms:['A256GCM']})).payload; }
  catch { return null; }
}
export function workspaceSsoAvailable(workspace) {
  const row = configuration().get(workspace);
  return Boolean(row && row.mode !== 'suspended');
}
export const ssoProof = request => open(request,proof);
export function requireWorkspaceSso(identity, workspace, required = false) {
  const row = configuration().get(workspace);
  if (!required && (!row || row.mode === 'test')) return;
  const p = identity.sso;
  if (row?.mode === 'required' && p?.workspace === workspace && p.issuer === row.issuer && p.clientId === row.clientId &&
      p.userId === identity.userId && p.revision === row.revision && row.bindings.some(b => b.subject === p.subject && b.userId === identity.userId)) return;
  throw new KernelError(403,'SSO_REQUIRED','يلزم التحقق عبر موفر هوية المؤسسة.');
}
export async function oidcRoute(request, callback, fetchToken = fetch, keysFor = url => createRemoteJWKSet(new URL(url))) {
  const headers = new Headers({'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
  try {
    const origin = trustedApiOrigin(request);
    if (!origin || !origin.startsWith('https://')) throw unavailable();
    const redirect = origin+'/auth/sso/callback/';
    const params = new URL(request.url).searchParams;
    if (callback) headers.append('Set-Cookie', pending+'=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0');
    const flow = callback ? await open(request,pending) : null;
    const workspace = callback ? flow?.workspace : params.get('workspace');
    const connections = configuration();
    const row = connections.get(workspace);
    if (!row || row.mode === 'suspended') throw unavailable();
    if (!callback) {
      const state = nonce(), verifier = nonce(), challenge = nonce();
      const url = new URL(row.authorization);
      url.search = new URLSearchParams({client_id:row.clientId,redirect_uri:redirect,response_type:'code',scope:'openid',
        state,nonce:challenge,code_challenge_method:'S256',code_challenge:createHash('sha256').update(verifier).digest('base64url')});
      headers.append('Set-Cookie',await seal(pending,{workspace,state,verifier,challenge,redirect,issuer:row.issuer,revision:row.revision},5));
      headers.set('Location',url.href);
    } else {
      if (!flow || params.get('state') !== flow.state || !params.get('code') || flow.redirect !== redirect ||
          (new Set([...connections.values()].map(c => c.issuer)).size > 1 && params.get('iss') !== row.issuer) ||
          flow.issuer !== row.issuer || flow.revision !== row.revision || (params.has('iss') && params.get('iss') !== row.issuer)) throw unavailable();
      const body = new URLSearchParams({grant_type:'authorization_code',code:params.get('code'),client_id:row.clientId,
        redirect_uri:redirect,code_verifier:flow.verifier});
      const response = await fetchToken(row.token,{method:'POST',body,redirect:'error',signal:AbortSignal.timeout(5000)});
      if (!response.ok) throw unavailable();
      const {id_token} = await response.json();
      const {payload} = await jwtVerify(id_token,keysFor(row.jwks),{issuer:row.issuer,audience:row.clientId,
        algorithms:['RS256','ES256'],requiredClaims:['sub','nonce','iat','exp'],maxTokenAge:'5m'});
      if (payload.nonce !== flow.challenge || ((Array.isArray(payload.aud) && payload.aud.length>1 || payload.azp !== undefined) && payload.azp !== row.clientId) ||
          !row.bindings.some(b => b.subject === payload.sub)) throw unavailable();
      headers.append('Set-Cookie',await seal(proof,{workspace,issuer:row.issuer,subject:payload.sub,userId:row.bindings.find(b => b.subject === payload.sub).userId,clientId:row.clientId,revision:row.revision},10));
      headers.set('Location','/app/kernel/?workspace='+workspace);
    }
    return new Response(null,{status:302,headers});
  } catch { return new Response('تعذر إكمال التحقق المؤسسي. راجع مسؤول الهوية.',{status:403,headers}); }
}
