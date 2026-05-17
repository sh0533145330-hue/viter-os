import type { RotationConfig } from './types.js';
import { rotationConfigSchema } from './types.js';

/**
 * KeyRotationScheduler determines when encryption keys should be rotated.
 * Integrates with key metadata from the database to check key age.
 */
export class KeyRotationScheduler {
  private readonly config: RotationConfig;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<RotationConfig> = {}) {
    this.config = rotationConfigSchema.parse(config);
  }

  /**
   * Check whether a key needs rotation based on its age.
   * @param createdAt ISO timestamp of key creation
   * @returns true if the key is older than maxAgeDays
   */
  needsRotation(createdAt: string): boolean {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const ageMs = now - created;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays > this.config.maxAgeDays;
  }

  /**
   * Start periodic rotation checks. Calls `callback` when rotation is needed.
   */
  startRotationCheck(
    callback: () => void | Promise<void>,
  ): void {
    this.stopRotationCheck();
    const intervalMs = this.config.checkIntervalHours * 60 * 60 * 1000;
    this.timer = setInterval(() => {
      void (async () => {
        await callback();
      })();
    }, intervalMs);
  }

  /**
   * Stop periodic checks.
   */
  stopRotationCheck(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Get current rotation config.
   */
  getConfig(): RotationConfig {
    return { ...this.config };
  }

  /**
   * Check if auto-rotation is enabled.
   */
  isAutoRotate(): boolean {
    return this.config.autoRotate;
  }
}
