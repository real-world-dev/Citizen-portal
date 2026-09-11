// In-memory sliding-window rate limiter. Deliberately simple: it's the
// right trade-off for a single-server MVP deployment (Vercel dev / a single
// long-running instance), and the README flags the documented limitation
// that this resets per-instance and doesn't coordinate across multiple
// serverless function instances — swap for Upstash Redis / Cloudflare
// Durable Objects before scaling past one town's traffic.
//
// Two limits are enforced at the API layer:
//   - per-user daily submission cap (anti-spam)
//   - per-IP short-window request cap (anti-injection / brute force)

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.windowStart + windowMs };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.windowStart + windowMs,
  };
}

// Sane defaults, referenced from the API routes.
export const SUBMISSION_LIMIT = { limit: 5, windowMs: 24 * 60 * 60 * 1000 }; // 5/day/user
export const IP_LIMIT = { limit: 30, windowMs: 10 * 60 * 1000 }; // 30/10min/IP
export const UPVOTE_LIMIT = { limit: 60, windowMs: 60 * 1000 }; // 60/min/user
export const AI_PREVIEW_LIMIT = { limit: 15, windowMs: 60 * 60 * 1000 }; // 15/hour/user

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
