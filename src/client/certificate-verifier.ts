/**
 * certificate-verifier.ts — TypeScript client للتحقق من شهادات التقييم.
 *
 * القاعدة الحاكمة (من EVAL-CERT-007 + PROMPT-3 spec):
 *   **التحقق النهائي دائمًا server-side.** الـ Web Crypto في المتصفح يقدّم
 *   "optimistic" فحص أولي للـ UX فقط — لكن الحكم النهائي (valid/revoked/
 *   tampered) يُؤخذ من `/api/kernel/certificates/verify?id=X` لأن:
 *     - الـ signature + payload الكامل لا تُسرَّب في الـ public API (عزل مقصود).
 *     - الـ publicKeyPem موجود فقط في جدول signing_keys على الخادم.
 *     - أي جهة خارجية تتحقق عبر نفس الرابط — الثقة من الخادم مو من المتصفح.
 *
 * المسؤوليات:
 *   - fetchCertificate(id)      → نسخة العرض العامة (metadata فقط).
 *   - verifyCertificate(id)     → حكم الخادم النهائي + (اختياري) فحص Web Crypto.
 *   - verifyHashChainClientSide → عند توفر signature/payload/publicKey (نادرًا
 *     في الوضع العام)، يتحقق من Ed25519 محليًا كسرعة أولية. غير ذلك يُعيد
 *     `clientSide: 'unavailable'` ونكتفي بحكم الخادم.
 *
 * لا يُستخدم للـ issue/revoke (admin فقط عبر x-brightai-admin-key).
 */

/* ── Types ─────────────────────────────────────────────────────────── */

export type GateDecision = 'passed' | 'blocked' | 'incomplete' | string;
export type RunEnvironment = 'demo' | 'live' | string;

/** نسخة العرض العامة للشهادة ( sanitized — بلا توقيع/حمولة). */
export interface PublicCertificate {
  certificateId: string;
  evaluationId?: string;
  gate: GateDecision;
  environment: RunEnvironment;
  signedBy: string;
  issuedAt: string;
  verifyUrl: string;
  revokedAt: string | null;
  revocationReason?: string | null;
  revokeReason?: string | null;
}

export type VerifyStatus =
  | 'valid'
  | 'revoked'
  | 'tampered'
  | 'digest-mismatch'
  | 'not-found'
  | 'key-missing'
  | 'incomplete'
  | 'network-error';

/** نتيجة التحقق المعروضة في الـ modal. */
export interface CertificateVerification {
  /** الحكم النهائي (من الخادم — هو المرجع). */
  status: VerifyStatus;
  /** هل الشهادة مسحوبة (revokedAt موجود). */
  revoked: boolean;
  revokedReason: string | null;
  signedBy: string | null;
  signedAt: string | null;
  gate: GateDecision | null;
  environment: RunEnvironment | null;
  certificateId: string;
  /**
   * نتيجة الفحص المحلي (Web Crypto):
   *   'valid'       → التوقيع تحقق محليًا (optimistic).
   *   'unavailable' → payload/signature/publicKey غير متاحة → اعتمدنا الخادم.
   *   'failed'      → الفحص المحلي فشل (مؤشر تلاعب — لكن حكم الخادم يغلب).
   */
  clientSide: 'valid' | 'failed' | 'unavailable';
  /** هل سلسلة الهاش للـ run سليمة (من استجابة الخادم إن توفرت). */
  hashChainValid: boolean | null;
  /** رسالة عربية جاهزة للعرض/إعلان screen-reader. */
  arabicMessage: string;
  /** الخادم هو مصدر الحكم؟ (دائمًا true في هذا التصميم). */
  serverAuthoritative: true;
}

export interface CertApiError {
  ok: false;
  error: string;
  status: number;
  arabicMessage: string;
}

export type CertApiResult<T> = { ok: true; data: T } | CertApiError;

/* حقول إضافية قد يُرجعها الخادم مستقبلًا لو فُتح الفحص المحلي. */
interface ExtendedVerifyResponse {
  ok?: boolean;
  status?: VerifyStatus;
  reason?: string;
  cert?: (PublicCertificate & {
    payload?: unknown;
    signature?: string;
    publicKeyPem?: string;
    payloadDigest?: string;
    hashChainValid?: boolean;
  }) | null;
}

/* ── Admin key (نفس نمط eval-api.ts) ──────────────────────────────── */

function getAdminKey(): string | null {
  try {
    return localStorage.getItem('brightai-admin-key');
  } catch {
    return null;
  }
}

/* ── Core request helper ───────────────────────────────────────────── */

async function request<T>(url: string, options: RequestInit = {}): Promise<CertApiResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const headers = new Headers(options.headers as HeadersInit);
    headers.set('Accept', 'application/json');
    const adminKey = getAdminKey();
    if (adminKey) headers.set('x-brightai-admin-key', adminKey);

    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeout);

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error: 'unauthorized',
        status: response.status,
        arabicMessage: 'هذه القائمة محمية. أدخل مفتاح الإدارة لعرض البيانات الحية.',
      };
    }
    if (response.status === 404) {
      return {
        ok: false,
        error: 'not_found',
        status: 404,
        arabicMessage: 'لا توجد شهادة بهذا المعرّف.',
      };
    }
    if (!response.ok) {
      return {
        ok: false,
        error: 'server_error',
        status: response.status,
        arabicMessage: `حدث خطأ في الخادم (${response.status}). حاول مجددًا لاحقًا.`,
      };
    }
    const body = (await response.json()) as T;
    return { ok: true, data: body };
  } catch (err) {
    clearTimeout(timeout);
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    return {
      ok: false,
      error: aborted ? 'timeout' : 'network_error',
      status: 0,
      arabicMessage: aborted
        ? 'انتهت مهلة الاتصال بالخادم. تحقق من اتصال الإنترنت.'
        : 'لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت.',
    };
  }
}

/* ── Canonical JSON (مطابق لـ kernel-certs/canonical.ts) ──────────────
 * يُستخدم فقط عند توفر الـ payload محليًا (الفحص الـ optimistic).
 * نفس قواعد الفرز/التقريب حتى يتطابق الـ digest مع الخادم. */

type CanonicalValue =
  | null
  | string
  | number
  | boolean
  | CanonicalValue[]
  | { [k: string]: CanonicalValue };

export function canonicalJson(input: unknown, seen?: WeakSet<object>): string {
  const seenSet = seen ?? new WeakSet<object>();
  if (input === null || input === undefined) return 'null';
  const t = typeof input;
  if (t === 'number') {
    const n = input as number;
    if (!Number.isFinite(n)) return 'null';
    if (Object.is(n, -0)) return '0';
    if (Number.isInteger(n)) return String(n);
    return String(Math.round(n * 1e9) / 1e9);
  }
  if (t === 'string') return JSON.stringify(input);
  if (t === 'boolean') return input ? 'true' : 'false';
  if (Array.isArray(input)) {
    if (seenSet.has(input)) return 'null';
    seenSet.add(input);
    return `[${input.map((v) => canonicalJson(v, seenSet)).join(',')}]`;
  }
  if (t === 'object') {
    const obj = input as Record<string, unknown>;
    if (seenSet.has(obj)) return 'null';
    seenSet.add(obj);
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k], seenSet)}`).join(',')}}`;
  }
  return 'null';
}

/* ── Web Crypto helpers ────────────────────────────────────────────── */

export function hasWebCryptoEd25519(): boolean {
  try {
    return (
      typeof crypto !== 'undefined' &&
      !!crypto.subtle &&
      // Ed25519 مدعوم في Chromium 113+ / Safari 17+ / Firefox 129+.
      typeof crypto.subtle.importKey === 'function'
    );
  } catch {
    return false;
  }
}

async function sha256HexBrowser(input: string): Promise<string | null> {
  try {
    if (!crypto?.subtle) return null;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

function pemToDer(pem: string): ArrayBuffer | null {
  try {
    const b64 = pem
      .replace(/-----BEGIN [^-]+-----/, '')
      .replace(/-----END [^-]+-----/, '')
      .replace(/\s+/g, '');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  } catch {
    return null;
  }
}

function base64ToBytes(b64: string): Uint8Array | null {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/**
 * فحص Ed25519 محلي (optimistic). يعيد 'valid' | 'failed' | 'unavailable'.
 * يتطلب payload + signature + publicKeyPem + payloadDigest — غير متاحة
 * في الـ public API الحالي، لذا غالبًا 'unavailable'.
 */
export async function verifyEd25519ClientSide(opts: {
  payload: unknown;
  signature: string;
  publicKeyPem: string;
  payloadDigest: string;
}): Promise<'valid' | 'failed' | 'unavailable'> {
  if (!hasWebCryptoEd25519()) return 'unavailable';
  try {
    const canonical = canonicalJson(opts.payload);
    const digest = await sha256HexBrowser(canonical);
    if (!digest) return 'unavailable';
    // لو الـ digest تغيّر → الحمولة عُدّلت بعد التوقيع.
    if (digest !== opts.payloadDigest) return 'failed';

    const der = pemToDer(opts.publicKeyPem);
    const sig = base64ToBytes(opts.signature);
    if (!der || !sig) return 'unavailable';

    const key = await crypto.subtle.importKey(
      'spki',
      der,
      { name: 'Ed25519' } as EcKeyImportParams,
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'Ed25519' as AlgorithmIdentifier,
      key,
      sig as BufferSource,
      new TextEncoder().encode(canonical),
    );
    return ok ? 'valid' : 'failed';
  } catch {
    // بعض المتصفحات ترمي لو Ed25519 غير مدعوم رغم وجود subtle.
    return 'unavailable';
  }
}

/* ── Arabic status messages ────────────────────────────────────────── */

function statusArabic(status: VerifyStatus, revokedReason: string | null): string {
  switch (status) {
    case 'valid':
      return 'الشهادة صالحة — التوقيع الرقمي سليم ولم تُسحب.';
    case 'revoked':
      return `الشهادة مسحوبة${revokedReason ? ` — السبب: ${revokedReason}` : ''}.`;
    case 'tampered':
      return 'فشل التحقق من التوقيع — الحمولة لا تطابق التوقيع (مؤشر تلاعب).';
    case 'digest-mismatch':
      return 'تغيّر محتوى الشهادة بعد التوقيع — البصمة لا تطابق (مؤشر تلاعب).';
    case 'not-found':
      return 'لا توجد شهادة بهذا المعرّف.';
    case 'key-missing':
      return 'مفتاح التحقق غير موجود (ربما سُحب بالتدوير).';
    case 'incomplete':
      return 'حمولة الشهادة ناقصة — لا يمكن التحقق.';
    case 'network-error':
    default:
      return 'تعذّر الاتصال بخادم التحقق. حاول مجددًا.';
  }
}

/* ── Public API ────────────────────────────────────────────────────── */

const CERTS_BASE = '/api/kernel/certificates';

/**
 * قائمة الشهادات (محمية بمفتاح الإدارة — نفس نمط eval-api).
 * الزائر العادي (بلا مفتاح) يستلم 401/403 → الصفحة تقع back على بيانات
 * العرض التوضيحي الموجودة أصلًا في evidence.astro.
 */
export async function fetchCertificates(
  limit = 50,
): Promise<CertApiResult<PublicCertificate[]>> {
  const res = await request<{ ok: boolean; certs: PublicCertificate[] }>(
    `${CERTS_BASE}?limit=${encodeURIComponent(String(limit))}`,
  );
  if (!res.ok) return res;
  const certs = (res.data.certs ?? []) as PublicCertificate[];
  return { ok: true, data: certs };
}

/**
 * التحقق النهائي من شهادة — يضرب الـ public server endpoint.
 * القاعدة: النتيجة المعروضة للمستخدم هي نتيجة الخادم دائمًا.
 * الفحص المحلي (إن توفرت الحقول) مجرد طبقة UX أولية.
 */
export async function verifyCertificate(
  certificateId: string,
): Promise<CertificateVerification> {
  const id = String(certificateId || '').trim();

  if (!id) {
    return {
      status: 'not-found',
      revoked: false,
      revokedReason: null,
      signedBy: null,
      signedAt: null,
      gate: null,
      environment: null,
      certificateId: id,
      clientSide: 'unavailable',
      hashChainValid: null,
      arabicMessage: statusArabic('not-found', null),
      serverAuthoritative: true,
    };
  }

  // 1) حكم الخادم (المرجع النهائي) — public، بلا مصادقة.
  const res = await request<ExtendedVerifyResponse>(
    `${CERTS_BASE}/verify?id=${encodeURIComponent(id)}`,
  );

  if (!res.ok) {
    const status: VerifyStatus =
      res.error === 'not_found' ? 'not-found' : 'network-error';
    return {
      status,
      revoked: false,
      revokedReason: null,
      signedBy: null,
      signedAt: null,
      gate: null,
      environment: null,
      certificateId: id,
      clientSide: 'unavailable',
      hashChainValid: null,
      arabicMessage: res.arabicMessage || statusArabic(status, null),
      serverAuthoritative: true,
    };
  }

  const body = res.data;
  const cert = body.cert ?? null;
  const serverStatus = (body.status ?? 'not-found') as VerifyStatus;
  const revoked = !!cert?.revokedAt || serverStatus === 'revoked';
  const revokedReason = cert?.revocationReason ?? cert?.revokeReason ?? null;

  // 2) فحص محلي اختياري (فقط لو الخادم ردّ بالحقول الكاملة).
  let clientSide: CertificateVerification['clientSide'] = 'unavailable';
  if (
    cert?.payload !== undefined &&
    typeof cert?.signature === 'string' &&
    typeof cert?.publicKeyPem === 'string' &&
    typeof cert?.payloadDigest === 'string'
  ) {
    clientSide = await verifyEd25519ClientSide({
      payload: cert.payload,
      signature: cert.signature,
      publicKeyPem: cert.publicKeyPem,
      payloadDigest: cert.payloadDigest,
    });
  }

  return {
    status: serverStatus,
    revoked,
    revokedReason,
    signedBy: cert?.signedBy ?? null,
    signedAt: cert?.issuedAt ?? null,
    gate: cert?.gate ?? null,
    environment: cert?.environment ?? null,
    certificateId: cert?.certificateId ?? id,
    clientSide,
    hashChainValid: typeof cert?.hashChainValid === 'boolean' ? cert.hashChainValid : null,
    arabicMessage: statusArabic(serverStatus, revokedReason),
    serverAuthoritative: true,
  };
}

/* ── Downloads ─────────────────────────────────────────────────────── */

/** تنزيل الحمولة الخام كـ JSON (لو قدّمها الخادم في استجابة موسّعة). */
export function downloadCertificateJson(cert: PublicCertificate & { payload?: unknown }): void {
  const payload = {
    schema: 'brightai.evaluation-certificate',
    ...('payload' in cert && cert.payload
      ? (cert.payload as Record<string, unknown>)
      : {
          certificateId: cert.certificateId,
          gate: cert.gate,
          environment: cert.environment,
          signedBy: cert.signedBy,
          issuedAt: cert.issuedAt,
          verifyUrl: cert.verifyUrl,
        }),
    revokedAt: cert.revokedAt ?? null,
  };
  triggerDownload(
    `${cert.certificateId}.json`,
    'application/json;charset=utf-8',
    JSON.stringify(payload, null, 2),
  );
}

/** تنزيل شهادة PDF مولّدة من الـ payload (client-side، بلا مكتبات). */
export function downloadCertificatePdf(cert: PublicCertificate): void {
  // PDF text-line generator (أدنى PDF صالح — بلا pdf-lib للحجم).
  const lines = [
    'BrightAI Kernel — Evaluation Certificate',
    '='.repeat(46),
    '',
    `Certificate ID : ${cert.certificateId}`,
    `Signed By      : ${cert.signedBy}`,
    `Signed At      : ${cert.issuedAt}`,
    `Environment    : ${cert.environment}`,
    `Gate Decision  : ${cert.gate}`,
    `Verify URL     : ${cert.verifyUrl}`,
    `Revoked        : ${cert.revokedAt ? `Yes (${cert.revokedAt})` : 'No'}`,
    '',
    'Cryptographic verification: /api/kernel/certificates/verify',
    'Signature: Ed25519 over SHA-256 of canonical payload (RFC 8785-ish).',
  ];
  const pdf = buildMinimalPdf(lines);
  triggerDownload(`${cert.certificateId}.pdf`, 'application/pdf', pdf);
}

function triggerDownload(name: string, mime: string, content: string | Blob): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * يبني PDF نصي أدنى صالح (single page) من سطور نصية.
 * يستخدم خط Courier (standard 14 font) لتفادي تضمين خطوط. ASCII-safe عبر
 * تحويل أي حرف غير Latin-1 إلى '?' (الشهادة بالعربي تُعرض كاملة في JSON).
 */
function buildMinimalPdf(lines: string[]): Blob {
  const escapePdf = (s: string) =>
    s
      .replace(/[^\x20-\x7E]/g, '?')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const content: string[] = ['BT', '/F1 11 Tf', '14 TL', '56 780 Td'];
  lines.forEach((line, i) => {
    if (i > 0) content.push('T*');
    content.push(`(${escapePdf(line)}) Tj`);
  });
  content.push('ET');
  const stream = content.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}
