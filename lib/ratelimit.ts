import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const memoryHits = new Map<string, { count: number; reset: number }>();

function memoryLimit(key: string): LimitResult {
  const limit = 10;
  const now = Date.now();
  const windowMs = 60_000;
  const current = memoryHits.get(key);
  if (!current || current.reset <= now) {
    const reset = now + windowMs;
    memoryHits.set(key, { count: 1, reset });
    return { success: true, limit, remaining: limit - 1, reset };
  }
  current.count += 1;
  return {
    success: current.count <= limit,
    limit,
    remaining: Math.max(0, limit - current.count),
    reset: current.reset
  };
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const upstashLimiter =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "brightai-demo"
      })
    : null;

export async function ratelimit(key: string): Promise<LimitResult> {
  if (!upstashLimiter) return memoryLimit(key);
  return upstashLimiter.limit(key);
}
