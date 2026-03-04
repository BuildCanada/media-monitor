export class RateLimiter {
  private lastRequestTime = 0;
  private minIntervalMs: number;

  constructor(minIntervalMs = 500) {
    this.minIntervalMs = minIntervalMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}
