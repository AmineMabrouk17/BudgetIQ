import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type RateLimitOptions = {
  prefix: string;
  identifier: string;
  limit: number;
  window: number;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const hasRedis = Boolean(redisUrl && redisToken);

const redisClient = hasRedis
  ? new Redis({ url: redisUrl!, token: redisToken! })
  : null;

const redisLimiters = new Map<string, Ratelimit>();

function getRedisLimiter({ prefix, limit, window }: RateLimitOptions): Ratelimit {
  const key = `${prefix}:${limit}:${window}`;
  let limiter = redisLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redisClient!,
      limiter: Ratelimit.slidingWindow(limit, `${window} s`),
      prefix: `budgetiq:${prefix}`,
    });
    redisLimiters.set(key, limiter);
  }
  return limiter;
}

const memoryBuckets = new Map<string, { count: number; reset: number }>();

function memoryRateLimit({
  prefix,
  identifier,
  limit,
  window,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = window * 1000;
  const key = `${prefix}:${identifier}`;
  const current = memoryBuckets.get(key);
  const reset = now + windowMs;

  if (!current || current.reset <= now) {
    memoryBuckets.set(key, { count: 1, reset });
    return { success: true, limit, remaining: limit - 1, reset };
  }

  if (current.count >= limit) {
    return { success: false, limit, remaining: 0, reset: current.reset };
  }

  current.count += 1;
  return { success: true, limit, remaining: limit - current.count, reset };
}

export async function rateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (hasRedis && redisClient) {
    return await getRedisLimiter(options).limit(options.identifier);
  }
  return memoryRateLimit(options);
}
