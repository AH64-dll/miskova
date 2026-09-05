/** Per-process burst protection. Trusted-edge limits remain necessary across replicas. */
const buckets = new Map<string, { hits: number; resetAt: number }>();

export function rateLimit(scope: string, limit: number, windowMs: number, now = Date.now()): number {
  let bucket = buckets.get(scope);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { hits: 0, resetAt: now + windowMs };
    buckets.set(scope, bucket);
  }
  if (bucket.hits >= limit) return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  bucket.hits++;
  return 0;
}
