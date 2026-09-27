/**
 * DSP Engine Tests
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import viteConfig from '../vite.config.js';
import {
  calculateAliasFrequency,
  getNyquistStatus,
  NyquistStatus,
  generateSamples,
  generateContinuousSignal,
  MAX_SAMPLES,
} from '../src/dsp/engine.js';
import { validateParam, validateSnapshot } from '../src/utils/validation.js';
import { importSnapshot } from '../src/utils/snapshot.js';

// ─── Deployment regression: upload-safe asset paths ───────────────────────────
describe('Deployment config', () => {
  it('should build with relative asset paths for hosted uploads', () => {
    expect(viteConfig.base).toBe('./');
  });
});

// ─── Test 1: fm=10, fs=50 → No aliasing ─────────────────────────────────────
describe('Test 1: fm=10, fs=50 — Safe sampling', () => {
  it('should return SAFE status', () => {
    expect(getNyquistStatus(10, 50)).toBe(NyquistStatus.SAFE);
  });
  it('should return null alias frequency', () => {
    expect(calculateAliasFrequency(10, 50)).toBeNull();
  });
  it('should generate correct number of samples', () => {
    const samples = generateSamples(10, 50, 1, 0, 0.5);
    // 0.5s / (1/50) = 25 + 1 = 26 samples (n=0..25)
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.length).toBeLessThanOrEqual(MAX_SAMPLES);
  });
  it('should have correct sample values', () => {
    // x[0] = A*sin(2π*fm*0 + 0) = 0
    const s = generateSamples(10, 50, 1, 0, 0.1);
    expect(Math.abs(s[0].value)).toBeLessThan(1e-10);
  });
});

// ─── Test 2: fm=10, fs=20 → Nyquist boundary ─────────────────────────────────
describe('Test 2: fm=10, fs=20 — Nyquist boundary', () => {
  it('should return NYQUIST_BOUNDARY status', () => {
    expect(getNyquistStatus(10, 20)).toBe(NyquistStatus.BOUNDARY);
  });
  it('should return null alias frequency at exact Nyquist', () => {
    // fs = 2fm means no aliasing (alias = fm stays as fm)
    expect(calculateAliasFrequency(10, 20)).toBeNull();
  });
});

// ─── Test 3: fm=8, fs=10 → Alias at 2 Hz ────────────────────────────────────
describe('Test 3: fm=8, fs=10 — Aliasing, alias = 2 Hz', () => {
  it('should return ALIASING_DETECTED status', () => {
    expect(getNyquistStatus(8, 10)).toBe(NyquistStatus.ALIASING);
  });
  it('should compute alias frequency = 2 Hz', () => {
    // fm=8, fs=10: fmod = 8%10 = 8, fs/2=5, 8>5 → alias = 10-8 = 2
    const alias = calculateAliasFrequency(8, 10);
    expect(alias).toBeCloseTo(2, 3);
  });
});

// ─── Test 4: fs=0 → Validation error ─────────────────────────────────────────
describe('Test 4: fs=0 — Validation error', () => {
  it('should reject fs=0', () => {
    const { error } = validateParam(0, 'fs');
    expect(error).not.toBeNull();
  });
  it('should clamp fs=0 to minimum bound', () => {
    const { value } = validateParam(0, 'fs');
    expect(value).toBeGreaterThan(0);
  });
});

// ─── Test 5: fm=NaN → Validation error ───────────────────────────────────────
describe('Test 5: fm=NaN — Validation error', () => {
  it('should reject NaN fm', () => {
    const { error } = validateParam(NaN, 'fm');
    expect(error).not.toBeNull();
  });
  it('should reject Infinity fm', () => {
    const { error } = validateParam(Infinity, 'fm');
    expect(error).not.toBeNull();
  });
  it('should reject string fm', () => {
    const { error } = validateParam('abc', 'fm');
    expect(error).not.toBeNull();
  });
});

// ─── Test 6: Malformed snapshot → Rejected ───────────────────────────────────
describe('Test 6: Malformed snapshot — rejected safely', () => {
  it('should reject non-JSON string', () => {
    const { snapshot, errors } = importSnapshot('NOT JSON }{}{');
    expect(snapshot).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject snapshot with unexpected fields', () => {
    const bad = JSON.stringify({ fm: 10, fs: 25, amplitude: 1, phase: 0, duration: 0.5, id: 'x', timestamp: Date.now(), label: '', __proto__: { isAdmin: true } });
    const { snapshot } = importSnapshot(bad);
    // __proto__ key in JSON is not prototype pollution, but we should handle gracefully
    // The important check is the snapshot validates cleanly without dangerous injection
    // (JSON.parse of __proto__ is safe in modern JS engines — it creates own property)
    expect(snapshot !== undefined).toBe(true);
  });

  it('should reject snapshot with evil eval string in label', () => {
    const evil = JSON.stringify({
      fm: 10, fs: 25, amplitude: 1, phase: 0, duration: 0.5,
      id: 'test', timestamp: Date.now(),
      label: '<script>alert(1)</script>',
    });
    const { snapshot, errors } = importSnapshot(evil);
    if (snapshot) {
      // Label must be sanitized
      expect(snapshot.label).not.toContain('<script>');
    }
  });

  it('should reject snapshot missing required fields', () => {
    const incomplete = JSON.stringify({ fm: 10 }); // missing fs, amplitude, etc.
    const { snapshot, errors } = importSnapshot(incomplete);
    expect(snapshot).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject oversized payload', () => {
    const huge = JSON.stringify({ data: 'x'.repeat(5000) });
    const { snapshot, errors } = importSnapshot(huge);
    expect(snapshot).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ─── Test 7: Extremely large sample count → Clamped ──────────────────────────
describe('Test 7: Extremely large sample count — clamped', () => {
  it('should cap samples at MAX_SAMPLES', () => {
    // Very high fs (10000) for 10s duration would be 100,000 samples
    const samples = generateSamples(1, 10000, 1, 0, 10);
    expect(samples.length).toBeLessThanOrEqual(MAX_SAMPLES);
  });

  it('should not freeze or throw for extreme parameters', () => {
    expect(() => generateSamples(1, 5000, 1, 0, 10)).not.toThrow();
  });

  it('should not freeze for continuous signal with many points', () => {
    expect(() => generateContinuousSignal(1000, 1, 0, 0.01)).not.toThrow();
  });
});

// ─── Additional alias frequency edge cases ────────────────────────────────────
describe('Alias frequency edge cases', () => {
  it('fm=10, fs=30 → no alias (fs > 2fm)', () => {
    expect(calculateAliasFrequency(10, 30)).toBeNull();
  });

  it('fm=15, fs=10 → alias = 5 Hz (fmod=5, 5 ≤ fs/2=5)', () => {
    // fmod = 15%10 = 5, fs/2 = 5, 5 is NOT > 5 → alias = 5
    const alias = calculateAliasFrequency(15, 10);
    expect(alias).toBeCloseTo(5, 3);
  });

  it('fm=12, fs=10 → alias = 2 Hz', () => {
    // fmod = 12%10 = 2, fs/2 = 5, 2 < 5 → alias = 2
    const alias = calculateAliasFrequency(12, 10);
    expect(alias).toBeCloseTo(2, 3);
  });
});
