/**
 * Validation utilities — centralized input sanitization.
 * All user-controlled values pass through here before reaching the DSP engine.
 * Never trust client input.
 */

// ─── Parameter bounds ─────────────────────────────────────────────────────────
export const BOUNDS = {
  fm:        { min: 0.1,   max: 1000,  label: 'Message frequency (fm)' },
  fs:        { min: 0.2,   max: 5000,  label: 'Sampling frequency (fs)' },
  amplitude: { min: 0.01,  max: 10,    label: 'Amplitude (A)' },
  phase:     { min: -Math.PI * 2, max: Math.PI * 2, label: 'Phase (φ)' },
  duration:  { min: 0.01,  max: 10,    label: 'Duration (s)' },
};

/**
 * Validate and clamp a numeric parameter.
 * @param {*}      value - Raw input (may be string, NaN, etc.)
 * @param {string} name  - Parameter key matching BOUNDS
 * @returns {{ value: number, error: string|null }}
 */
export function validateParam(value, name) {
  const bounds = BOUNDS[name];
  if (!bounds) return { value: 0, error: `Unknown parameter: ${name}` };

  const n = Number(value);

  if (value === null || value === undefined || value === '') {
    return { value: bounds.min, error: `${bounds.label} is required.` };
  }
  if (!isFinite(n) || isNaN(n)) {
    return { value: bounds.min, error: `${bounds.label} must be a finite number.` };
  }
  if (n < bounds.min) {
    return { value: bounds.min, error: `${bounds.label} must be ≥ ${bounds.min}.` };
  }
  if (n > bounds.max) {
    return { value: bounds.max, error: `${bounds.label} must be ≤ ${bounds.max}.` };
  }
  return { value: n, error: null };
}

/**
 * Clamp a numeric value silently to the valid range.
 * Used during slider updates where an error message is unnecessary.
 */
export function clamp(value, name) {
  const { value: clamped } = validateParam(value, name);
  return clamped;
}

/**
 * Validate the full set of simulation parameters.
 * @returns {{ params: object, errors: string[] }}
 */
export function validateAllParams(raw) {
  const keys = ['fm', 'fs', 'amplitude', 'phase', 'duration'];
  const params = {};
  const errors = [];

  for (const key of keys) {
    const { value, error } = validateParam(raw[key], key);
    params[key] = value;
    if (error) errors.push(error);
  }

  return { params, errors };
}

// ─── Snapshot payload validation ──────────────────────────────────────────────

const SNAPSHOT_SCHEMA = {
  id:        { type: 'string',  maxLen: 64  },
  timestamp: { type: 'number'               },
  fm:        { type: 'number'               },
  fs:        { type: 'number'               },
  amplitude: { type: 'number'               },
  phase:     { type: 'number'               },
  duration:  { type: 'number'               },
  label:     { type: 'string',  maxLen: 128 },
};

const ALLOWED_SNAPSHOT_KEYS = new Set(Object.keys(SNAPSHOT_SCHEMA));
const MAX_SNAPSHOT_PAYLOAD = 4096; // bytes

/**
 * Validate a snapshot object parsed from JSON.
 * Rejects unexpected fields, wrong types, oversized strings, out-of-range numbers.
 * Never executes any data.
 * @returns {{ snapshot: object|null, errors: string[] }}
 */
export function validateSnapshot(raw) {
  const errors = [];

  // Size guard (catch oversized imports)
  if (JSON.stringify(raw).length > MAX_SNAPSHOT_PAYLOAD) {
    return { snapshot: null, errors: ['Snapshot payload too large.'] };
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { snapshot: null, errors: ['Snapshot must be a JSON object.'] };
  }

  // Prototype pollution guard
  if (Object.prototype.hasOwnProperty.call(raw, '__proto__') ||
      Object.prototype.hasOwnProperty.call(raw, 'constructor') ||
      Object.prototype.hasOwnProperty.call(raw, 'prototype')) {
    return { snapshot: null, errors: ['Snapshot contains forbidden keys.'] };
  }

  // No unexpected keys
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_SNAPSHOT_KEYS.has(key)) {
      errors.push(`Unexpected field in snapshot: "${key}".`);
    }
  }

  if (errors.length) return { snapshot: null, errors };

  // Type and range checks
  const out = {};

  for (const [key, schema] of Object.entries(SNAPSHOT_SCHEMA)) {
    if (!(key in raw)) {
      if (key === 'label') { out.label = ''; continue; }
      errors.push(`Missing required field: "${key}".`);
      continue;
    }

    const val = raw[key];

    if (schema.type === 'string') {
      if (typeof val !== 'string') {
        errors.push(`Field "${key}" must be a string.`);
        continue;
      }
      if (schema.maxLen && val.length > schema.maxLen) {
        errors.push(`Field "${key}" is too long (max ${schema.maxLen} chars).`);
        continue;
      }
      // Strip any HTML to prevent XSS if label is rendered
      out[key] = val.replace(/[<>&"']/g, '');
    } else if (schema.type === 'number') {
      const n = Number(val);
      if (!isFinite(n) || isNaN(n)) {
        errors.push(`Field "${key}" must be a finite number.`);
        continue;
      }
      out[key] = n;
    }
  }

  if (errors.length) return { snapshot: null, errors };

  // Validate numeric params against DSP bounds
  for (const key of ['fm', 'fs', 'amplitude', 'phase', 'duration']) {
    const { error } = validateParam(out[key], key);
    if (error) errors.push(`Snapshot ${error}`);
  }

  return errors.length ? { snapshot: null, errors } : { snapshot: out, errors: [] };
}
