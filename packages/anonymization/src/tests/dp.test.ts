import { describe, expect, it } from 'vitest';
import { LaplaceNoise } from '../differential-privacy.js';

describe('LaplaceNoise', () => {
  it('adds noise to a numeric value', () => {
    const dp = new LaplaceNoise({ epsilon: 1.0, sensitivity: 1.0 });
    const result = dp.apply(100);
    // Result should differ from original
    expect(result).not.toBe(100);
    // Should be a number
    expect(typeof result).toBe('number');
  });

  it('applies noise to an array of values', () => {
    const dp = new LaplaceNoise({ epsilon: 1.0, sensitivity: 1.0 });
    const original = [10, 20, 30, 40, 50];
    const noisy = dp.applyArray(original);
    expect(noisy).toHaveLength(5);
    // At least one should differ (could theoretically be all same with 0 noise)
    const anyDiff = noisy.some((v, i) => v !== original[i]);
    expect(anyDiff).toBe(true);
  });

  it('aggregate adds noise consistently', () => {
    const dp = new LaplaceNoise({ epsilon: 1.0, sensitivity: 2.0 });
    const result = dp.aggregate(500);
    expect(result).not.toBe(500);
    expect(typeof result).toBe('number');
  });

  it('higher epsilon (less privacy) produces less noise on average', () => {
    // This is a statistical property — we verify the scale is correct
    const dpHigh = new LaplaceNoise({ epsilon: 10.0, sensitivity: 1.0 });
    const dpLow = new LaplaceNoise({ epsilon: 0.1, sensitivity: 1.0 });

    // Scale should be sensitivity / epsilon
    expect(dpHigh.getScale()).toBe(0.1);
    expect(dpLow.getScale()).toBe(10);
  });

  it('scale is sensitivity divided by epsilon', () => {
    const dp = new LaplaceNoise({ sensitivity: 5, epsilon: 2 });
    expect(dp.getScale()).toBe(2.5);
  });

  it('defaults to epsilon=1.0, sensitivity=1.0', () => {
    const dp = new LaplaceNoise();
    expect(dp.getScale()).toBe(1.0);
  });

  it('produces values centered around the original over many samples', () => {
    const dp = new LaplaceNoise({ epsilon: 0.5, sensitivity: 1.0 });
    const original = 42;
    const samples: number[] = [];
    for (let i = 0; i < 1000; i++) {
      samples.push(dp.apply(original));
    }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    // Mean should be roughly around the original value (± reasonable tolerance)
    expect(mean).toBeGreaterThan(original - 5);
    expect(mean).toBeLessThan(original + 5);
  });
});
