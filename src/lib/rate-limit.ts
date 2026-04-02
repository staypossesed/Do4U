/**
 * Simple in-memory sliding-window rate limiter per key.
 * Suitable for single Node runtime; for multi-instance use Redis/Upstash.
 */
const buckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  let stamps = buckets.get(key) ?? [];
  stamps = stamps.filter((t) => t > windowStart);

  if (stamps.length >= maxRequests) {
    const oldest = stamps[0]!;
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    buckets.set(key, stamps);
    return { ok: false, retryAfterMs };
  }

  stamps.push(now);
  buckets.set(key, stamps);
  return { ok: true };
}
