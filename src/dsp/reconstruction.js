/**
 * Signal Reconstruction
 *
 * Implements sinc (ideal low-pass / Whittaker–Shannon) interpolation.
 * x_r(t) = Σ_n  x[n] · sinc(t/Ts − n)
 *
 * where sinc(x) = sin(π·x) / (π·x),  sinc(0) = 1
 *
 * Performance note: for large sample counts we limit the contributing
 * neighbours to a window of ±WIN samples around each evaluation point.
 * WIN=32 is perceptually indistinguishable from the full sum for typical
 * educational frequency ranges while keeping the frame rate high.
 */

import { samplingInterval, continuousSample, CONTINUOUS_POINTS, MAX_SAMPLES } from './engine.js';

const WIN = 32; // half-window of contributing samples

/** Normalised sinc: sinc(x) = sin(π·x)/(π·x) */
function sinc(x) {
  if (Math.abs(x) < 1e-10) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

/**
 * Reconstruct the signal at a single time point t from the sample array.
 * @param {number} t         - Evaluation time (s)
 * @param {Array}  samples   - Array of {n, t, value} from generateSamples()
 * @param {number} Ts        - Sampling interval (s)
 * @returns {number}
 */
export function reconstructAt(t, samples, Ts) {
  if (!samples || samples.length === 0) return 0;

  // Find the nearest sample index
  const nCenter = t / Ts;
  const nFloor = Math.floor(nCenter);

  let sum = 0;
  const lo = Math.max(0, nFloor - WIN);
  const hi = Math.min(samples.length - 1, nFloor + WIN);

  for (let i = lo; i <= hi; i++) {
    const s = samples[i];
    sum += s.value * sinc(t / Ts - s.n);
  }
  return sum;
}

/**
 * Generate a reconstructed waveform curve at CONTINUOUS_POINTS uniformly
 * spaced over [0, duration].
 * @returns {Array<{t: number, value: number}>}
 */
export function generateReconstructedSignal(samples, fs, duration, nPoints = CONTINUOUS_POINTS) {
  if (!samples || samples.length === 0) return [];
  const Ts = samplingInterval(fs);
  const result = [];
  const dt = duration / (nPoints - 1);
  for (let i = 0; i < nPoints; i++) {
    const t = i * dt;
    result.push({ t, value: reconstructAt(t, samples, Ts) });
  }
  return result;
}
