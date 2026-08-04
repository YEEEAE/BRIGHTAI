/**
 * audit-verifier.ts — تحقق العميل من سلسلة هاش أحداث التدقيق.
 *
 * القاعدة الحاكمة (EVAL-CERT + PROMPT-4 spec):
 *   التحقق النهائي دائمًا server-side. هذا الملف يوفّر فحصًا محليًا
 *   حتميًا (deterministic) كطبقة UX أولية + fallback عند انقطاع الخادم.
 *   الحكم النهائي (valid/broken) يُؤخذ من إعادة الحساب المحلية لأنها
 *   خوارزمية نقية لا تعتمد على سر — لكن إن أُبلغ عن كسر، يجب تأكيده
 *   عبر الخادم قبل إعلان تلاعب قطعي.
 *
 * معادلة الهاش (مطابقة لـ kernel-certs/prisma-store.ts:appendAuditEvent):
 *   hash = SHA256(canonicalJson({
 *     prevHash,
 *     action,
 *     evaluationId,
 *     certificateId: certificateId ?? null,
 *     metadata: metadata ?? {},
 *   }))
 *
 * ملاحظة: الـ prompt الأصلي ذكر SHA256(prevHash + action + actor +
 * metadata + timestamp)، لكن تنفيذ الخادم لا يشمل actor/timestamp في
 * الـ digest (مثبت بـ 12/12 اختبار تكاملي). نطابق الخادم حرفيًا؛ أي
 * انحراف يُنتج false-positive "مكسور" دائم.
 */
export function canonicalJson(input, seen) {
    const seenSet = seen ?? new WeakSet();
    if (input === null || input === undefined)
        return 'null';
    const t = typeof input;
    if (t === 'number') {
        const n = input;
        if (!Number.isFinite(n))
            return 'null';
        if (Object.is(n, -0))
            return '0';
        if (Number.isInteger(n))
            return String(n);
        return String(Math.round(n * 1e9) / 1e9);
    }
    if (t === 'string')
        return JSON.stringify(input);
    if (t === 'boolean')
        return input ? 'true' : 'false';
    if (Array.isArray(input)) {
        if (seenSet.has(input))
            return 'null';
        seenSet.add(input);
        return `[${input.map((v) => canonicalJson(v, seenSet)).join(',')}]`;
    }
    if (t === 'object') {
        const obj = input;
        if (seenSet.has(obj))
            return 'null';
        seenSet.add(obj);
        const keys = Object.keys(obj).sort();
        return `{${keys
            .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k], seenSet)}`)
            .join(',')}}`;
    }
    return 'null';
}
/* ── SHA-256 (Web Crypto + JS fallback) ─────────────────────────────── */
export function hasWebCryptoSha256() {
    try {
        return typeof crypto !== 'undefined' && !!crypto.subtle;
    }
    catch {
        return false;
    }
}
/**
 * SHA-256 hex. يفضّل Web Crypto، ويسقط لتنفيذ JS نقي لو لم يتوفر
 * (بيئات قديمة/ضعيفة). كلاهما يُرجع lowercase hex 64-char.
 */
export async function sha256Hex(input) {
    if (hasWebCryptoSha256()) {
        try {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
            return Array.from(new Uint8Array(buf))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
        }
        catch {
            /* fall through to JS impl */
        }
    }
    return sha256HexJs(input);
}
/**
 * تحقق ما إذا كانت قائمة الأحداث تستخدم الـ SHA-256 بصيغة JS نقيًا
 * (متزامن) — مفيد لـ web workers أو البيئات بلا Web Crypto.
 */
export function sha256HexSync(input) {
    if (hasWebCryptoSha256()) {
        // Web Crypto غير متزامن — لا يمكن استخدامه في المسار المتزامن.
        // نسقط لتنفيذ JS النقي.
    }
    return sha256HexJs(input);
}
/* ── SHA-256 pure JS (RFC 6234) ────────────────────────────────────── */
function sha256HexJs(message) {
    const bytes = new TextEncoder().encode(message);
    const k = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
        0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
        0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
        0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
        0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ]);
    const h = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
        0x1f83d9ab, 0x5be0cd19,
    ]);
    const l = bytes.length;
    const bitLen = l * 8;
    const withPad = new Uint8Array(l + 9 + ((64 - ((l + 9) % 64)) % 64));
    withPad.set(bytes);
    withPad[l] = 0x80;
    // 64-bit big-endian length (نحن ≤ 2^32 بايت دائمًا).
    const dv = new DataView(withPad.buffer);
    dv.setUint32(withPad.length - 4, bitLen >>> 0, false);
    dv.setUint32(withPad.length - 8, Math.floor(bitLen / 0x100000000), false);
    const w = new Uint32Array(64);
    for (let i = 0; i < withPad.length; i += 64) {
        for (let j = 0; j < 16; j++) {
            w[j] = dv.getUint32(i + j * 4, false);
        }
        for (let j = 16; j < 64; j++) {
            const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
            const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
            w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
        }
        let [a, b, c, d, e, f, g, hh] = h;
        for (let j = 0; j < 64; j++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (hh + S1 + ch + k[j] + w[j]) >>> 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + maj) >>> 0;
            hh = g;
            g = f;
            f = e;
            e = (d + t1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) >>> 0;
        }
        h[0] = (h[0] + a) >>> 0;
        h[1] = (h[1] + b) >>> 0;
        h[2] = (h[2] + c) >>> 0;
        h[3] = (h[3] + d) >>> 0;
        h[4] = (h[4] + e) >>> 0;
        h[5] = (h[5] + f) >>> 0;
        h[6] = (h[6] + g) >>> 0;
        h[7] = (h[7] + hh) >>> 0;
    }
    let hex = '';
    for (let i = 0; i < 8; i++) {
        hex += h[i].toString(16).padStart(8, '0');
    }
    return hex;
}
function rotr(x, n) {
    return (x >>> n) | (x << (32 - n));
}
/* ── Hash recompute (مطابق لـ prisma-store.appendAuditEvent) ────────── */
/**
 * يعيد حساب الـ hash المتوقع لحدث بنفس معادلة الخادم.
 * حتمي 100% — نفس المدخلات = نفس الخرج.
 */
export function recomputeEventHash(event) {
    const canonical = canonicalJson({
        prevHash: event.prevHash ?? null,
        action: event.action,
        evaluationId: event.evaluationId,
        certificateId: event.certificateId ?? null,
        metadata: event.metadata ?? {},
    });
    return sha256Hex(canonical);
}
/** نسخة متزامنة (تستخدم SHA-256 JS النقي). */
export function recomputeEventHashSync(event) {
    const canonical = canonicalJson({
        prevHash: event.prevHash ?? null,
        action: event.action,
        evaluationId: event.evaluationId,
        certificateId: event.certificateId ?? null,
        metadata: event.metadata ?? {},
    });
    return sha256HexJs(canonical);
}
/* ── Chain verification ────────────────────────────────────────────── */
function reasonArabic(reason, brokenIndex) {
    switch (reason) {
        case 'ok':
            return null;
        case 'empty':
            return 'لا توجد أحداث للتحقق منها.';
        case 'genesis-mismatch':
            return `الحدث الأول (الفهرس ${brokenIndex}) لا يطابق بصمة التكوين — مؤشر تلاعب بالسجل الأولي.`;
        case 'chain-mismatch':
            return `الحادث ذو الفهرس ${brokenIndex} بصمته المُعاد حسابها لا تطابق المخزّنة — مؤشر تلاعب بمحتوى الحدث.`;
        case 'link-mismatch':
            return `الرابط بين الحدثين عند الفهرس ${brokenIndex} مكسور — مؤشر تلاعب بترتيب الأحداث أو حذف صف.`;
        case 'crypto-unavailable':
            return 'تعذّر الوصول إلى وحدة التشفير في المتصفح. حاول في متصفح أحدث.';
        default:
            return 'خطأ غير معروف في التحقق من السلسلة.';
    }
}
/**
 * يتحقق من سلامة سلسلة هاش الأحداث.
 *
 * خوارزمية حتمية:
 *   1. لكل حدث i: يعيد حساب hash_i = recomputeEventHash(event_i).
 *   2. يقارن hash_i مع event_i.hash (كشف تعديل المحتوى).
 *   3. يتأكد أن event_(i+1).prevHash === hash_i (كشف حذف/إعادة ترتيب).
 *
 * يوقف عند أول كسر ويعيد brokenAtIndex. لا يفترض شيئًا بعد الكسر.
 */
export async function verifyHashChain(events) {
    if (!Array.isArray(events) || events.length === 0) {
        return {
            valid: false,
            brokenAtIndex: null,
            brokenEventId: null,
            checked: 0,
            validCount: 0,
            reasonArabic: reasonArabic('empty', null),
            reason: 'empty',
        };
    }
    let expectedPrev = events[0].prevHash ?? null;
    let validCount = 0;
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        // (a) رابط prevHash: لو ما هو الأول، يجب أن يطابق الـ hash المتوقع.
        if (i > 0 && event.prevHash !== expectedPrev) {
            return {
                valid: false,
                brokenAtIndex: i,
                brokenEventId: event.id,
                checked: i,
                validCount,
                reasonArabic: reasonArabic('link-mismatch', i),
                reason: 'link-mismatch',
            };
        }
        // (b) بصمة المحتوى: أعد حساب الـ hash وقارن.
        const recomputed = await recomputeEventHash(event);
        if (recomputed !== event.hash) {
            return {
                valid: false,
                brokenAtIndex: i,
                brokenEventId: event.id,
                checked: i + 1,
                validCount,
                reasonArabic: reasonArabic(i === 0 ? 'genesis-mismatch' : 'chain-mismatch', i),
                reason: i === 0 ? 'genesis-mismatch' : 'chain-mismatch',
            };
        }
        validCount++;
        expectedPrev = event.hash;
    }
    return {
        valid: true,
        brokenAtIndex: null,
        brokenEventId: null,
        checked: events.length,
        validCount,
        reasonArabic: null,
        reason: 'ok',
    };
}
/** نسخة متزامنة (للـ workers/البيئات بلا async). */
export function verifyHashChainSync(events) {
    if (!Array.isArray(events) || events.length === 0) {
        return {
            valid: false,
            brokenAtIndex: null,
            brokenEventId: null,
            checked: 0,
            validCount: 0,
            reasonArabic: reasonArabic('empty', null),
            reason: 'empty',
        };
    }
    let expectedPrev = events[0].prevHash ?? null;
    let validCount = 0;
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (i > 0 && event.prevHash !== expectedPrev) {
            return {
                valid: false,
                brokenAtIndex: i,
                brokenEventId: event.id,
                checked: i,
                validCount,
                reasonArabic: reasonArabic('link-mismatch', i),
                reason: 'link-mismatch',
            };
        }
        const recomputed = recomputeEventHashSync(event);
        if (recomputed !== event.hash) {
            return {
                valid: false,
                brokenAtIndex: i,
                brokenEventId: event.id,
                checked: i + 1,
                validCount,
                reasonArabic: reasonArabic(i === 0 ? 'genesis-mismatch' : 'chain-mismatch', i),
                reason: i === 0 ? 'genesis-mismatch' : 'chain-mismatch',
            };
        }
        validCount++;
        expectedPrev = event.hash;
    }
    return {
        valid: true,
        brokenAtIndex: null,
        brokenEventId: null,
        checked: events.length,
        validCount,
        reasonArabic: null,
        reason: 'ok',
    };
}
/* ── Admin-key fetch (نفس نمط eval-api) ────────────────────────────── */
function getAdminKey() {
    try {
        return localStorage.getItem('brightai-admin-key');
    }
    catch {
        return null;
    }
}
/**
 * يجلب أحداث التدقيق من الخادم (محمية بمفتاح الإدارة — نفس نمط
 * eval-api.ts). لو 401/403 → الصفحة تقع back على بيانات العرض
 * التوضيحي الحتمية الموجودة في audit.astro.
 *
 * يدعم التصفية بمعاملات الاستعلام: action, actor, from, to, limit.
 */
export async function fetchAuditEvents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.action)
        params.set('action', filters.action);
    if (filters.actor)
        params.set('actor', filters.actor);
    if (filters.from)
        params.set('from', filters.from);
    if (filters.to)
        params.set('to', filters.to);
    if (filters.limit)
        params.set('limit', String(filters.limit));
    const qs = params.toString();
    const url = `/api/kernel/audit${qs ? `?${qs}` : ''}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
        const headers = { Accept: 'application/json' };
        const adminKey = getAdminKey();
        if (adminKey)
            headers['x-brightai-admin-key'] = adminKey;
        const response = await fetch(url, {
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.status === 401 || response.status === 403) {
            return {
                ok: false,
                error: 'unauthorized',
                status: response.status,
                arabicMessage: 'سجل التدقيق محمي. أدخل مفتاح الإدارة لعرض الأحداث الحية.',
            };
        }
        if (!response.ok) {
            return {
                ok: false,
                error: 'server_error',
                status: response.status,
                arabicMessage: `خطأ في الخادم (${response.status}). حاول لاحقًا.`,
            };
        }
        const body = (await response.json());
        return { ok: true, data: body };
    }
    catch (err) {
        clearTimeout(timeout);
        const aborted = err instanceof DOMException && err.name === 'AbortError';
        return {
            ok: false,
            error: aborted ? 'timeout' : 'network_error',
            status: 0,
            arabicMessage: aborted
                ? 'انتهت مهلة الاتصال. تحقق من الشبكة.'
                : 'لا يمكن الاتصال بالخادم. تحقق من الشبكة.',
        };
    }
}
/** صدّر كـ CSV (RFC 4180 — quoting آمن). */
export function exportAuditCsv(events) {
    const headers = [
        'id',
        'evaluationId',
        'certificateId',
        'action',
        'actor',
        'metadata',
        'prevHash',
        'hash',
        'createdAt',
    ];
    const escape = (v) => {
        const s = v === null || v === undefined ? '' : String(v);
        if (/[",\n\r]/.test(s))
            return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const rows = events.map((e) => [
        e.id,
        e.evaluationId,
        e.certificateId ?? '',
        e.action,
        e.actor ?? '',
        JSON.stringify(e.metadata ?? {}),
        e.prevHash ?? '',
        e.hash,
        e.createdAt ?? '',
    ]
        .map(escape)
        .join(','));
    return [headers.join(','), ...rows].join('\r\n');
}
/** صدّر كـ JSON منسّق. */
export function exportAuditJson(events) {
    return JSON.stringify({
        schema: 'brightai.kernel.audit-events',
        exportedAt: new Date().toISOString(),
        count: events.length,
        events,
    }, null, 2);
}
/* ── Browser global (للـ engine scripts في public/js) ────────────────
 * نفس نمط certificate-verifier: الـ TS compile يطلّع ESM exports، والـ
 * engine scripts في src/scripts تستخدم window.AuditVerifier. */
if (typeof window !== 'undefined') {
    window.AuditVerifier = {
        verifyHashChain,
        verifyHashChainSync,
        recomputeEventHash,
        recomputeEventHashSync,
        fetchAuditEvents,
        exportAuditCsv,
        exportAuditJson,
        canonicalJson,
        sha256Hex,
        hasWebCryptoSha256,
    };
}
