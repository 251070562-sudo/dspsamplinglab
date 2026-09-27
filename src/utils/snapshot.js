/**
 * Snapshot serialization / deserialization.
 * All imports go through validateSnapshot before being applied to state.
 */

import { validateSnapshot } from './validation.js';

let _counter = 0;

/**
 * Generate a short, non-predictable snapshot ID.
 * Uses crypto.randomUUID when available, falls back to timestamp + random.
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 18);
  }
  _counter++;
  return `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a snapshot object from current simulation parameters.
 * Only stores the minimal configuration needed to reproduce the experiment.
 */
export function createSnapshot(params, label = '') {
  return {
    id: generateId(),
    timestamp: Date.now(),
    fm: params.fm,
    fs: params.fs,
    amplitude: params.amplitude,
    phase: params.phase,
    duration: params.duration,
    label: String(label).slice(0, 128).replace(/[<>&"']/g, ''),
  };
}

/**
 * Serialize a snapshot to a compact JSON string safe for export/sharing.
 */
export function exportSnapshot(snapshot) {
  return JSON.stringify(snapshot);
}

/**
 * Deserialize and validate a snapshot from an imported JSON string.
 * @returns {{ snapshot: object|null, errors: string[] }}
 */
export function importSnapshot(jsonString) {
  if (typeof jsonString !== 'string' || jsonString.length > 4096) {
    return { snapshot: null, errors: ['Invalid snapshot data.'] };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { snapshot: null, errors: ['Snapshot is not valid JSON.'] };
  }

  return validateSnapshot(parsed);
}

/**
 * Save a list of snapshots to localStorage.
 * Limits to the 20 most recent to avoid unbounded growth.
 */
export function saveSnapshotsToStorage(snapshots) {
  try {
    const limited = snapshots.slice(-20);
    localStorage.setItem('dsp_snapshots', JSON.stringify(limited));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded)
  }
}

/**
 * Load snapshots from localStorage.
 * Each entry is re-validated before being returned.
 */
export function loadSnapshotsFromStorage() {
  try {
    const raw = localStorage.getItem('dsp_snapshots');
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => validateSnapshot(item))
      .filter(({ snapshot }) => snapshot !== null)
      .map(({ snapshot }) => snapshot);
  } catch {
    return [];
  }
}
