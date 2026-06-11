interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = input.now ?? Date.now();
  const existing = buckets.get(input.key);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + input.windowMs };

  if (bucket.count >= input.limit) {
    buckets.set(input.key, bucket);
    return { allowed: false, remaining: 0, resetAt: new Date(bucket.resetAt) };
  }

  bucket.count += 1;
  buckets.set(input.key, bucket);

  return {
    allowed: true,
    remaining: Math.max(input.limit - bucket.count, 0),
    resetAt: new Date(bucket.resetAt),
  };
}

export function clearRateLimitBucketsForTests(): void {
  buckets.clear();
}
