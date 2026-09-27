/**
 * Zustand store — single source of truth for all simulation state.
 * The DSP calculation pipeline runs here; components only read and dispatch.
 */

import { create } from 'zustand';
import { computeMetrics, getSpectralReplicas, NyquistStatus } from '../dsp/engine.js';
import { generateReconstructedSignal } from '../dsp/reconstruction.js';
import { computeErrorMetrics } from '../dsp/errorMetrics.js';
import { clamp } from '../utils/validation.js';
import {
  createSnapshot,
  saveSnapshotsToStorage,
  loadSnapshotsFromStorage,
} from '../utils/snapshot.js';

// ─── Default parameters ───────────────────────────────────────────────────────
const DEFAULT_PARAMS = {
  fm: 10,
  fs: 25,
  amplitude: 1,
  phase: 0,
  duration: 0.5,
};

// ─── Derived computation ──────────────────────────────────────────────────────
function computeDerived(params) {
  const { fm, fs, amplitude, phase, duration } = params;
  const metrics = computeMetrics(fm, fs, amplitude, phase, duration);
  const reconstructed = generateReconstructedSignal(
    metrics.samples,
    fs,
    duration
  );
  const error = computeErrorMetrics(metrics.continuous, reconstructed);
  const maxDisplayFreq = Math.max(fs * 3, fm * 4, 100);
  const spectralReplicas = getSpectralReplicas(fm, fs, maxDisplayFreq);

  return {
    ...metrics,
    reconstructed,
    error,
    spectralReplicas,
    maxDisplayFreq,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useDSPStore = create((set, get) => {
  const initDerived = computeDerived(DEFAULT_PARAMS);

  return {
    // ── Parameters ─────────────────────────────────────────────────────────
    ...DEFAULT_PARAMS,

    // ── Derived / computed ──────────────────────────────────────────────────
    ...initDerived,

    // ── UI state ────────────────────────────────────────────────────────────
    isPlaying: true,
    showError: false,
    explainMode: false,
    activeTab: 'spectrum',          // 'spectrum' | 'ratio' | 'reconstruction' | 'log'
    snapshots: loadSnapshotsFromStorage(),
    snapshotError: null,
    inputErrors: {},

    // ── Parameter setters (all clamp + re-derive) ───────────────────────────
    setParam(name, rawValue) {
      const value = clamp(rawValue, name);
      const next = { ...get(), [name]: value };
      const derived = computeDerived({
        fm: next.fm,
        fs: next.fs,
        amplitude: next.amplitude,
        phase: next.phase,
        duration: next.duration,
      });
      set({ [name]: value, ...derived });
    },

    setInputError(name, msg) {
      set((s) => ({ inputErrors: { ...s.inputErrors, [name]: msg } }));
    },

    clearInputError(name) {
      set((s) => {
        const errs = { ...s.inputErrors };
        delete errs[name];
        return { inputErrors: errs };
      });
    },

    // ── Playback ────────────────────────────────────────────────────────────
    togglePlay() { set((s) => ({ isPlaying: !s.isPlaying })); },
    setPlaying(v) { set({ isPlaying: v }); },

    reset() {
      const derived = computeDerived(DEFAULT_PARAMS);
      set({ ...DEFAULT_PARAMS, ...derived, isPlaying: true, inputErrors: {} });
    },

    // ── Display toggles ─────────────────────────────────────────────────────
    toggleError()   { set((s) => ({ showError: !s.showError })); },
    toggleExplain() { set((s) => ({ explainMode: !s.explainMode })); },
    setActiveTab(tab) { set({ activeTab: tab }); },

    // ── Snapshots ───────────────────────────────────────────────────────────
    saveSnapshot(label = '') {
      const s = get();
      const snap = createSnapshot(
        { fm: s.fm, fs: s.fs, amplitude: s.amplitude, phase: s.phase, duration: s.duration },
        label
      );
      const updated = [...s.snapshots, snap];
      saveSnapshotsToStorage(updated);
      set({ snapshots: updated });
      return snap;
    },

    loadSnapshot(snap) {
      const derived = computeDerived({
        fm: snap.fm,
        fs: snap.fs,
        amplitude: snap.amplitude,
        phase: snap.phase,
        duration: snap.duration,
      });
      set({
        fm: snap.fm,
        fs: snap.fs,
        amplitude: snap.amplitude,
        phase: snap.phase,
        duration: snap.duration,
        ...derived,
        inputErrors: {},
      });
    },

    deleteSnapshot(id) {
      set((s) => {
        const updated = s.snapshots.filter((sn) => sn.id !== id);
        saveSnapshotsToStorage(updated);
        return { snapshots: updated };
      });
    },

    setSnapshotError(msg) { set({ snapshotError: msg }); },
    clearSnapshotError()  { set({ snapshotError: null }); },

    // ── Demo automation (called externally) ─────────────────────────────────
    applyDemoStep(fm, fs) {
      const s = get();
      const params = { fm, fs, amplitude: s.amplitude, phase: s.phase, duration: s.duration };
      const derived = computeDerived(params);
      set({ fm, fs, ...derived });
    },
  };
});
