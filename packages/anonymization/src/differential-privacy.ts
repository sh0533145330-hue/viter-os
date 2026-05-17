import type { DpConfig } from './types.js';
import { dpConfigSchema } from './types.js';

/**
 * LaplaceNoise adds Laplace-distributed noise to numeric values for
 * ε-differential privacy. The noise follows Laplace(0, sensitivity/epsilon).
 *
 * Uses the inverse CDF method — no external dependencies required.
 */
export class LaplaceNoise {
  private readonly epsilon: number;
  private readonly sensitivity: number;
  private readonly scale: number;

  constructor(config: Partial<DpConfig> = {}) {
    const parsed = dpConfigSchema.parse(config);
    this.epsilon = parsed.epsilon;
    this.sensitivity = parsed.sensitivity;
    this.scale = this.sensitivity / this.epsilon;
  }

  /**
   * Apply Laplace noise to a single value.
   */
  apply(value: number): number {
    return value + this.sample();
  }

  /**
   * Apply Laplace noise to an array of values (e.g., a histogram or count column).
   */
  applyArray(values: number[]): number[] {
    return values.map((v) => this.apply(v));
  }

  /**
   * Apply noise to a numeric aggregate result.
   */
  aggregate(value: number): number {
    return value + this.sample();
  }

  /**
   * Get the current scale parameter (sensitivity/epsilon).
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * Sample from Laplace(0, scale) using the inverse CDF method:
   *   X = μ - b * sgn(U - 1/2) * ln(1 - 2|U - 1/2|)
   * where U ~ Uniform(0,1), μ = 0, b = scale.
   */
  private sample(): number {
    // Use Math.random() or crypto-based random
    const u = secureRandom();
    const shifted = u - 0.5;
    const sign = shifted >= 0 ? -1 : 1;
    return sign * this.scale * Math.log(1 - 2 * Math.abs(shifted));
  }
}

/**
 * Generate a cryptographically secure random number in [0, 1).
 * Falls back to Math.random() if crypto is unavailable (shouldn't happen on Node 20+).
 */
function secureRandom(): number {
  // Use crypto.getRandomValues to generate a random 32-bit integer, then normalize
  const buf = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    // Fallback for tests or edge cases
    buf[0] = (Math.random() * 0xffffffff) >>> 0;
  }
  return (buf[0] ?? 0) / 0xffffffff;
}
