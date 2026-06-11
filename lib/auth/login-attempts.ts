const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

interface AttemptBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, AttemptBucket>();

export function loginAttemptKey(username: string, ipAddress = "unknown"): string {
  return `${username.trim().toLowerCase()}:${ipAddress}`;
}

export function canAttemptLogin(key: string, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    return true;
  }

  return bucket.count < MAX_FAILED_ATTEMPTS;
}

export function recordFailedLogin(key: string, now = Date.now()): void {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  bucket.count += 1;
}

export function clearLoginAttempts(key: string): void {
  buckets.delete(key);
}

export function resetLoginAttemptBucketsForTest(): void {
  buckets.clear();
}
