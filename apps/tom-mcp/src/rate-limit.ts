export interface RateLimitConfig {
  rpm: number;
  dailyCostCapCents: number;
}

interface UserBucket {
  windowStart: number;
  count: number;
  dailyCostCents: number;
  dayStart: number;
}

export class McpRateLimiter {
  private buckets = new Map<string, UserBucket>();
  constructor(private config: RateLimitConfig = { rpm: 60, dailyCostCapCents: 5000 }) {}

  check(userId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const winMs = 60 * 1000;
    let bucket = this.buckets.get(userId);
    if (!bucket) {
      bucket = { windowStart: now, count: 0, dailyCostCents: 0, dayStart: now };
      this.buckets.set(userId, bucket);
    }
    if (now - bucket.windowStart > winMs) {
      bucket.windowStart = now;
      bucket.count = 0;
    }
    if (now - bucket.dayStart > dayMs) {
      bucket.dayStart = now;
      bucket.dailyCostCents = 0;
    }
    if (bucket.count >= this.config.rpm) {
      return { allowed: false, reason: `Rate limit: ${this.config.rpm} requests per minute` };
    }
    if (bucket.dailyCostCents >= this.config.dailyCostCapCents) {
      return { allowed: false, reason: `Daily cost cap reached: $${this.config.dailyCostCapCents / 100}` };
    }
    bucket.count++;
    return { allowed: true };
  }

  recordCost(userId: string, costCents: number): void {
    let bucket = this.buckets.get(userId);
    if (!bucket) {
      const now = Date.now();
      bucket = { windowStart: now, count: 0, dailyCostCents: 0, dayStart: now };
      this.buckets.set(userId, bucket);
    }
    bucket.dailyCostCents += costCents;
  }

  getStats(userId: string): { rpm: number; dailyCostCents: number } {
    const bucket = this.buckets.get(userId);
    return bucket ? { rpm: bucket.count, dailyCostCents: bucket.dailyCostCents } : { rpm: 0, dailyCostCents: 0 };
  }
}
