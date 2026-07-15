import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// Set up env variables before importing anything
process.env.BRIGHTAI_CHAT_KEY = 'test-secret-key';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.CHAT_STREAMING_ENABLED = 'true';

// Mock dependency modules referenced by chat.ts using the correct absolute resolution paths
vi.mock('../../../../src/lib/ip', () => ({
  getClientIp: () => '127.0.0.1',
}));

let rateLimitAllowed = true;
let rateLimitRetryAfterSec = 0;
vi.mock('../../../../src/lib/ratelimit', () => ({
  rateLimit: async () => ({
    allowed: rateLimitAllowed,
    retryAfterSec: rateLimitAllowed ? 0 : rateLimitRetryAfterSec,
    limit: 10,
    remaining: rateLimitAllowed ? 9 : 0,
  }),
}));

const mockSessionPush = vi.fn(async () => ({ ok: true as const, degraded: false }));
const mockSessionRecent = vi.fn(async () => ({ ok: [], degraded: false }));

vi.mock('../../../../src/lib/redis', () => ({
  getChatSessionStore: () => ({
    push: mockSessionPush,
    recent: mockSessionRecent,
    close: async () => {},
  }),
}));

// Now import the Astro POST handler
import { POST } from '../../../../src/pages/api/ai/chat';

// Helper to parse SSE frames from raw text
function parseSSE(text: string) {
  const lines = text.split('\n');
  const events: Array<{ event: string; data: any }> = [];
  let currentEvent = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('event: ')) {
      currentEvent = trimmed.slice(7).trim();
    } else if (trimmed.startsWith('data: ')) {
      events.push({
        event: currentEvent,
        data: JSON.parse(trimmed.slice(6).trim()),
      });
    }
  }
  return events;
}

describe('POST /api/ai/chat — SSE Streaming', () => {
  let fetchMock: any;

  beforeEach(() => {
    rateLimitAllowed = true;
    rateLimitRetryAfterSec = 0;
    mockSessionPush.mockClear();
    mockSessionRecent.mockClear();
    
    // Reset global fetch mock
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  it('serves standard JSON when client requests application/json (backwards compat)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'This is a JSON reply' } }],
      }),
    });

    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-brightai-chat-key': 'test-secret-key',
      },
      body: JSON.stringify({
        message: 'hello json',
        promptId: 'compliance',
      }),
    });

    const res = await POST({ request: req } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body.reply).toBe('This is a JSON reply');
    expect(body.provider).toBe('groq');
  });

  it('serves SSE streaming when client requests text/event-stream', async () => {
    // Mock Groq streaming response
    const mockSSEChunks = [
      'data: {"choices":[{"delta":{"content":"مرحباً "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"بكم "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"في "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"BrightAI"}}]}\n\n',
      'data: [DONE]\n\n',
    ];

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for (const chunk of mockSSEChunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    fetchMock.mockResolvedValue({
      ok: true,
      body: stream,
      getReader: () => stream.getReader(),
    });

    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'x-brightai-chat-key': 'test-secret-key',
      },
      body: JSON.stringify({
        message: 'hello stream',
        promptId: 'compliance',
      }),
    });

    const res = await POST({ request: req } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.headers.get('X-Accel-Buffering')).toBe('no');

    const resText = await res.text();
    const events = parseSSE(resText);

    expect(events.length).toBe(5);
    expect(events[0]).toEqual({ event: 'token', data: { delta: 'مرحباً ' } });
    expect(events[1]).toEqual({ event: 'token', data: { delta: 'بكم ' } });
    expect(events[3]).toEqual({ event: 'token', data: { delta: 'BrightAI' } });
    expect(events[4]).toEqual({ event: 'done', data: { provider: 'groq', sessionId: null } });
  });

  it('falls back to Gemini stream if Groq stream fails pre-first-token', async () => {
    // Groq stream fails immediately (HTTP 500)
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('api.groq.com')) {
        return { ok: false, status: 500, text: async () => 'Groq down' };
      }
      
      // Gemini stream works
      const mockGeminiChunks = [
        'data: {"candidates":[{"content":{"parts":[{"text":"مساعد "}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"جمناي"}]}}]}\n\n',
        'data: [DONE]\n\n',
      ];
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          for (const chunk of mockGeminiChunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        },
      });
      return {
        ok: true,
        body: stream,
        getReader: () => stream.getReader(),
      };
    });

    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'x-brightai-chat-key': 'test-secret-key',
      },
      body: JSON.stringify({
        message: 'hello fallback',
        promptId: 'compliance',
        provider: 'auto',
      }),
    });

    const res = await POST({ request: req } as any);
    expect(res.status).toBe(200);

    const resText = await res.text();
    const events = parseSSE(resText);

    expect(events[0]).toEqual({ event: 'token', data: { delta: 'مساعد ' } });
    expect(events[1]).toEqual({ event: 'token', data: { delta: 'جمناي' } });
    expect(events[2]).toEqual({ event: 'done', data: { provider: 'gemini', sessionId: null } });
  });

  it('sends event: error and halts if stream fails mid-stream after first token', async () => {
    // Groq starts sending tokens, then throws an error mid-stream (delayed to let first read succeed)
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"أول توكن "}}]}\n\n'));
        setTimeout(() => {
          controller.error(new Error('connection dropped'));
        }, 10);
      },
    });

    fetchMock.mockResolvedValue({
      ok: true,
      body: stream,
      getReader: () => stream.getReader(),
    });

    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'x-brightai-chat-key': 'test-secret-key',
      },
      body: JSON.stringify({
        message: 'hello mid-fail',
        promptId: 'compliance',
      }),
    });

    const res = await POST({ request: req } as any);
    expect(res.status).toBe(200);

    const resText = await res.text();
    const events = parseSSE(resText);

    expect(events[0]).toEqual({ event: 'token', data: { delta: 'أول توكن ' } });
    expect(events[1].event).toBe('error');
    expect(events[1].data.error).toBeDefined();
  });

  it('respects CHAT_STREAMING_ENABLED=false feature flag and falls back to JSON', async () => {
    process.env.CHAT_STREAMING_ENABLED = 'false';

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Fallback response because flag is off' } }],
      }),
    });

    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream', // Client wants stream
        'x-brightai-chat-key': 'test-secret-key',
      },
      body: JSON.stringify({
        message: 'hello streaming disabled',
        promptId: 'compliance',
      }),
    });

    const res = await POST({ request: req } as any);
    expect(res.status).toBe(200);
    // Even though client asked for SSE, flag is false so it returns application/json
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body.reply).toBe('Fallback response because flag is off');
    
    // Restore
    process.env.CHAT_STREAMING_ENABLED = 'true';
  });

  it('returns 429 rate limit error in application/json even if Accept is event-stream', async () => {
    rateLimitAllowed = false;
    rateLimitRetryAfterSec = 30;

    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'x-brightai-chat-key': 'test-secret-key',
      },
      body: JSON.stringify({
        message: 'hello rate limit',
        promptId: 'compliance',
      }),
    });

    const res = await POST({ request: req } as any);
    expect(res.status).toBe(429);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('Retry-After')).toBe('30');

    const body = await res.json();
    expect(body.error).toBe('rate_limited');
  });
});
