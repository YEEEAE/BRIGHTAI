import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// ----- next/server stub -----
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: HeadersInit }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: init?.headers as HeadersInit,
      }),
  },
}));

// ----- next/headers stub -----
let headerMap: Record<string, string> = {};
vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => headerMap[name.toLowerCase()] ?? null,
  }),
}));

// ----- svix stub -----
let verifyOk = true;
let verifyError: string | null = null;
vi.mock('svix', () => {
  return {
    Webhook: class {
      constructor(_secret: string) {}
      verify(_body: string, _headers: Record<string, string>) {
        if (!verifyOk) throw new Error(verifyError ?? 'invalid signature');
        return JSON.parse(_body);
      }
    },
  };
});

// ----- @brightai/db stub -----
const upserts: Array<{ where: { clerkUserId: string }; create: Record<string, unknown>; update: Record<string, unknown> }> = [];
const deletes: Array<{ where: { clerkUserId: string } }> = [];

vi.mock('@brightai/db', () => ({
  dbServiceRole: {
    user: {
      upsert: vi.fn(async ({ where, create, update }: { where: { clerkUserId: string }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        upserts.push({ where, create, update });
        return { id: 'usr_test', ...where, ...create };
      }),
      deleteMany: vi.fn(async ({ where }: { where: { clerkUserId: string } }) => {
        deletes.push({ where });
        return { count: 1 };
      }),
    },
  },
}));

let POST: typeof import('../../app/api/webhooks/clerk/route').POST;

beforeAll(async () => {
  process.env.CLERK_WEBHOOK_SECRET = 'whsec_test_secret';
  POST = (await import('../../app/api/webhooks/clerk/route')).POST;
});

beforeEach(() => {
  headerMap = {};
  verifyOk = true;
  verifyError = null;
  upserts.length = 0;
  deletes.length = 0;
});

function buildRequest(body: unknown): Request {
  return new Request('http://localhost/api/webhooks/clerk', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function setSvixHeaders(id = 'evt_1', ts = '1700000000', sig = 'v1,signature') {
  headerMap['svix-id'] = id;
  headerMap['svix-timestamp'] = ts;
  headerMap['svix-signature'] = sig;
}

async function readBody(res: Response) {
  return JSON.parse(await res.text()) as Record<string, unknown>;
}

describe('POST /api/webhooks/clerk — signature verification', () => {
  it('returns 400 when Svix headers are missing', async () => {
    const res = await POST(buildRequest({ type: 'user.created', data: {} }) as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const body = await readBody(res);
    expect(body.error).toMatch(/Svix/i);
  });

  it('returns 401 when signature is invalid', async () => {
    setSvixHeaders();
    verifyOk = false;
    verifyError = 'bad sig';
    const res = await POST(buildRequest({ type: 'user.created', data: {} }) as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(401);
    const body = await readBody(res);
    expect(body.error).toMatch(/signature/i);
  });

  it('returns 500 when CLERK_WEBHOOK_SECRET is not set', async () => {
    const saved = process.env.CLERK_WEBHOOK_SECRET;
    delete process.env.CLERK_WEBHOOK_SECRET;
    // Re-import the route so the env read at module top picks up the change.
    vi.resetModules();
    const { POST: POSTNoSecret } = await import('../../app/api/webhooks/clerk/route');
    setSvixHeaders();
    const res = await POSTNoSecret(
      buildRequest({ type: 'user.created', data: { id: 'x' } }) as unknown as import('next/server').NextRequest,
    );
    expect(res.status).toBe(500);
    process.env.CLERK_WEBHOOK_SECRET = saved;
    vi.resetModules();
    // Re-establish POST with secret restored.
    POST = (await import('../../app/api/webhooks/clerk/route')).POST;
  });
});

describe('POST /api/webhooks/clerk — user events', () => {
  it('upserts a user on user.created with ar locale by default', async () => {
    setSvixHeaders();
    const event = {
      type: 'user.created',
      data: {
        id: 'clerk_user_1',
        email_addresses: [{ id: 'em1', email_address: 'ahmed@example.com' }],
        first_name: 'Ahmed',
        last_name: 'Alotaibi',
        image_url: 'https://img',
        public_metadata: { fullNameAr: 'أحمد العتيبي' },
      },
    };
    const res = await POST(buildRequest(event) as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const body = await readBody(res);
    expect(body.ok).toBe(true);
    expect(body.action).toBe('user.created');
    expect(upserts).toHaveLength(1);
    expect(upserts[0].where.clerkUserId).toBe('clerk_user_1');
    expect(upserts[0].create.email).toBe('ahmed@example.com');
    expect(upserts[0].create.fullName).toBe('Ahmed Alotaibi');
    expect(upserts[0].create.fullNameAr).toBe('أحمد العتيبي');
    expect(upserts[0].create.primaryLocale).toBe('ar');
    expect(upserts[0].create.emailVerified).toBe(true);
  });

  it('defaults primaryLocale to ar when not provided', async () => {
    setSvixHeaders();
    const res = await POST(
      buildRequest({
        type: 'user.updated',
        data: {
          id: 'clerk_user_2',
          email_addresses: [],
          first_name: null,
          last_name: null,
          image_url: null,
        },
      }) as unknown as import('next/server').NextRequest,
    );
    expect(res.status).toBe(200);
    expect(upserts[0].create.primaryLocale).toBe('ar');
  });

  it('honors locale=en from public_metadata', async () => {
    setSvixHeaders();
    const res = await POST(
      buildRequest({
        type: 'user.updated',
        data: {
          id: 'clerk_user_en',
          email_addresses: [],
          first_name: 'John',
          last_name: 'Doe',
          image_url: null,
          public_metadata: { locale: 'en' },
        },
      }) as unknown as import('next/server').NextRequest,
    );
    expect(res.status).toBe(200);
    expect(upserts[0].create.primaryLocale).toBe('en');
  });

  it('deletes the user on user.deleted', async () => {
    setSvixHeaders();
    const res = await POST(
      buildRequest({
        type: 'user.deleted',
        data: {
          id: 'clerk_user_gone',
          email_addresses: [],
          first_name: null,
          last_name: null,
          image_url: null,
        },
      }) as unknown as import('next/server').NextRequest,
    );
    expect(res.status).toBe(200);
    const body = await readBody(res);
    expect(body.action).toBe('deleted');
    expect(deletes).toHaveLength(1);
    expect(deletes[0].where.clerkUserId).toBe('clerk_user_gone');
    expect(upserts).toHaveLength(0);
  });
});
