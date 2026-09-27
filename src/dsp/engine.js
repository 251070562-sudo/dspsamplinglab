/**
 * DSP Engine — single source of truth for all sampling mathematics.
 * All formulas are derived from first principles; no results are hard-coded.
 */

// ─── Constants ───────────────────────────────────────────────────────────────
export const TWO_PI = 2 * Math.PI;
export const MAX_SAMPLES = 2048;        // hard cap to prevent freeze
export const CONTINUOUS_POINTS = 1024; // resolution of the continuous curve

// ─── Core signal ─────────────────────────────────────────────────────────────

/**
 * Evaluate the continuous-time signal at time t.
 * x(t) = A · sin(2π·fm·t + φ)
 */
export function continuousSample(t, fm, amplitude, phase) {
  return amplitude * Math.sin(TWO_PI * fm * t + phase);
}

/**
 * Generate an array of {t, value} points for the continuous waveform.
 * @param {number} fm       - Message frequency (Hz)
 * @param {number} amplitude
 * @param {number} phase    - Phase offset (radians)
 * @param {number} duration - Total time window (seconds)
 * @param {number} [nPoints=CONTINUOUS_POINTS] - Number of evaluation points
 */
export function generateContinuousSignal(fm, amplitude, phase, duration, nPoints = CONTINUOUS_POINTS) {
  const points = [];
  const dt = duration / (nPoints - 1);
  for (let i = 0; i < nPoints; i++) {
    const t = i * dt;
    points.push({ t, value: continuousSample(t, fm, amplitude, phase) });
  }
  return points;
}

// ─── Sampling ────────────────────────────────────────────────────────────────

/**
 * Compute the sampling interval.
 * Ts = 1 / fs
 */
export function samplingInterval(fs) {
  return 1 / fs;
}

/**
 * Generate discrete samples x[n] = x(n·Ts) for n = 0, 1, 2 … up to duration.
 * Returns array of { n, t, value }.
 */
export function generateSamples(fm, fs, amplitude, phase, duration) {
  const Ts = samplingInterval(fs);
  const samples = [];
  let n = 0;
  while (n * Ts <= duration + 1e-9) {
    if (n >= MAX_SAMPLES) break; // safety cap
    const t = n * Ts;
    samples.push({ n, t, value: continuousSample(t, fm, amplitude, phase) });
    n++;
  }
  return samples;
}

// ─── Nyquist & Aliasing ───────────────────────────────────────────────────────

export const NyquistStatus = {
  SAFE: 'SAFE',
  BOUNDARY: 'NYQUIST_BOUNDARY',
  ALIASING: 'ALIASING_DETECTED',
};

/**
 * Determine Nyquist sampling status.
 * fs > 2·fm → SAFE
 * fs = 2·fm → BOUNDARY (within tolerance)
 * fs < 2·fm → ALIASING
 */
export function getNyquistStatus(fm, fs) {
  const nyquist = 2 * fm;
  const ratio = fs / nyquist;
  if (Math.abs(ratio - 1) < 0.001) return NyquistStatus.BOUNDARY;
  if (fs > nyquist) return NyquistStatus.SAFE;
  return NyquistStatus.ALIASING;
}

/**
 * Calculate alias frequency when undersampling occurs.
 *
 * For a sinusoid at fm sampled at fs, the apparent frequency is determined by
 * folding fm into the Nyquist interval [0, fs/2] using modular arithmetic:
 *
 *   f_mod = fm mod fs                    (reduce to [0, fs))
 *   if f_mod > fs/2: f_alias = fs - f_mod   (fold about Nyquist)
 *   else:            f_alias = f_mod
 *
 * When fs >= 2·fm the alias equals fm (no aliasing).
 *
 * @returns {number|null} alias frequency in Hz, or null when there is no aliasing
 */
export function calculateAliasFrequency(fm, fs) {
  if (fs >= 2 * fm) return null; // no aliasing

  const fmod = fm % fs;
  const falias = fmod > fs / 2 ? fs - fmod : fmod;
  return Math.round(falias * 1000) / 1000; // round to 3 decimal places
}

// ─── Spectral replicas ────────────────────────────────────────────────────────

/**
 * Return the list of spectral replica centre frequencies visible within
 * the display range [0, maxFreq].
 * Replicas appear at k·fs ± fm for k = 0, ±1, ±2 …
 * We only return positive frequencies up to maxFreq.
 */
export function getSpectralReplicas(fm, fs, maxFreq) {
  const replicas = [];
  const seen = new Set();

  const addFreq = (f) => {
    const rounded = Math.round(f * 100) / 100;
    if (rounded >= 0 && rounded <= maxFreq && !seen.has(rounded)) {
      seen.add(rounded);
      replicas.push(rounded);
    }
  };

  addFreq(fm); // original component
  for (let k = 1; k * fs - fm <= maxFreq || k * fs + fm <= maxFreq; k++) {
    if (k > 20) break; // guard
    addFreq(k * fs - fm);
    addFreq(k * fs + fm);
  }

  return replicas.sort((a, b) => a - b);
}

// ─── Derived metrics ──────────────────────────────────────────────────────────

/**
 * Build a complete metrics object from current parameters.
 * This is the single call the store makes to get all derived values.
 */
export function computeMetrics(fm, fs, amplitude, phase, duration) {
  const nyquistRate = 2 * fm;
  const ratio = fs / fm;
  const Ts = samplingInterval(fs);
  const status = getNyquistStatus(fm, fs);
  const aliasFreq = calculateAliasFrequency(fm, fs);

  const continuous = generateContinuousSignal(fm, amplitude, phase, duration);
  const samples = generateSamples(fm, fs, amplitude, phase, duration);

  return {
    nyquistRate,
    ratio,
    Ts,
    status,
    aliasFreq,
    continuous,
    samples,
  };
}
