/**
 * ExperimentSummary — auto-generated textual experiment report.
 * All text is derived from live simulation values; nothing is hard-coded.
 */

import React, { useMemo } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { NyquistStatus } from '../dsp/engine.js';
import './ExperimentSummary.css';

function generateObservation(fm, fs, nyquistRate, ratio, aliasFreq, status, rmsError) {
  const lines = [];

  if (status === NyquistStatus.SAFE) {
    lines.push(
      `The sampling frequency fs = ${fs.toFixed(2)} Hz exceeds the Nyquist rate of ${nyquistRate.toFixed(2)} Hz (ratio = ${ratio.toFixed(2)}x).`
    );
    lines.push(
      `The signal x(t) = A·sin(2π·${fm.toFixed(2)}·t) can be perfectly reconstructed from its samples in theory.`
    );
    if (rmsError < 0.001) {
      lines.push('Reconstruction error is negligible under current conditions.');
    } else {
      lines.push(
        `RMS reconstruction error = ${rmsError.toFixed(4)} — minor deviation due to finite sinc window.`
      );
    }
  } else if (status === NyquistStatus.BOUNDARY) {
    lines.push(
      `The sampling frequency fs = ${fs.toFixed(2)} Hz is exactly at the Nyquist rate (fs = 2·fm = ${nyquistRate.toFixed(2)} Hz).`
    );
    lines.push(
      'Sampling at exactly the Nyquist rate is theoretically sufficient but practically insufficient due to phase sensitivity.'
    );
    lines.push(
      'In practice, a safety margin above 2fm is recommended to allow for a realizable anti-aliasing filter.'
    );
  } else {
    lines.push(
      `ALIASING DETECTED: fs = ${fs.toFixed(2)} Hz is below the Nyquist rate of ${nyquistRate.toFixed(2)} Hz.`
    );
    if (aliasFreq != null) {
      lines.push(
        `The input frequency fm = ${fm.toFixed(2)} Hz folds into an alias at f_alias = ${aliasFreq.toFixed(3)} Hz.`
      );
    }
    lines.push(
      'The reconstructed signal does not represent the original. Spectral overlap causes irreversible information loss.'
    );
    lines.push(
      `RMS reconstruction error = ${rmsError.toFixed(4)} confirms significant deviation from the original signal.`
    );
  }

  return lines.join(' ');
}

export default function ExperimentSummary() {
  const fm     = useDSPStore((s) => s.fm);
  const fs     = useDSPStore((s) => s.fs);
  const amplitude = useDSPStore((s) => s.amplitude);
  const phase  = useDSPStore((s) => s.phase);
  const nyquistRate = useDSPStore((s) => s.nyquistRate);
  const ratio  = useDSPStore((s) => s.ratio);
  const Ts     = useDSPStore((s) => s.Ts);
  const status = useDSPStore((s) => s.status);
  const aliasFreq = useDSPStore((s) => s.aliasFreq);
  const error  = useDSPStore((s) => s.error);
  const samples = useDSPStore((s) => s.samples);

  const observation = useMemo(
    () => generateObservation(fm, fs, nyquistRate, ratio, aliasFreq, status, error?.rmsError ?? 0),
    [fm, fs, nyquistRate, ratio, aliasFreq, status, error]
  );

  const statusMeta = {
    [NyquistStatus.SAFE]:     { label: 'SAFE',             cls: 'safe' },
    [NyquistStatus.BOUNDARY]: { label: 'NYQUIST BOUNDARY', cls: 'boundary' },
    [NyquistStatus.ALIASING]: { label: 'ALIASING',         cls: 'alias' },
  };

  const sm = statusMeta[status] || statusMeta[NyquistStatus.SAFE];

  return (
    <div className="exp-summary">
      <div className="exp-header">
        <span className="exp-badge">REPORT</span>
        <span className="exp-title">EXPERIMENT SUMMARY</span>
      </div>

      <div className="exp-body">
        <div className="exp-grid">
          <div className="exp-field">
            <span className="exp-field-label">fm</span>
            <span className="exp-field-value">{fm.toFixed(4)} Hz</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">fs</span>
            <span className="exp-field-value">{fs.toFixed(4)} Hz</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">Amplitude</span>
            <span className="exp-field-value">{amplitude.toFixed(4)}</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">Phase</span>
            <span className="exp-field-value">{phase.toFixed(4)} rad</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">Nyquist Rate</span>
            <span className="exp-field-value">{nyquistRate.toFixed(4)} Hz</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">fs / fm</span>
            <span className="exp-field-value">{ratio.toFixed(4)}</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">Ts</span>
            <span className="exp-field-value">{(Ts * 1000).toFixed(4)} ms</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">Alias Frequency</span>
            <span className="exp-field-value">
              {aliasFreq != null ? `${aliasFreq.toFixed(4)} Hz` : 'None'}
            </span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">Nyquist Status</span>
            <span className={`exp-field-value exp-status--${sm.cls}`}>{sm.label}</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">RMS Recon. Error</span>
            <span className="exp-field-value">{error?.rmsError?.toFixed(4) ?? '—'}</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">Maximum |Error|</span>
            <span className="exp-field-value">{error?.maxAbsError?.toFixed(4) ?? '—'}</span>
          </div>
          <div className="exp-field">
            <span className="exp-field-label">Samples Captured</span>
            <span className="exp-field-value">{samples?.length ?? 0}</span>
          </div>
        </div>

        <div className="exp-observation">
          <span className="exp-obs-title">OBSERVATION</span>
          <p className="exp-obs-text">{observation}</p>
        </div>
      </div>
    </div>
  );
}
