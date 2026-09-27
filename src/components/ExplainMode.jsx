/**
 * ExplainMode — contextual educational panel.
 * Adapts its explanation text to the current simulation state.
 * Only shown when explainMode is enabled in the store.
 */

import React from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { NyquistStatus } from '../dsp/engine.js';
import './ExplainMode.css';

function Term({ label, formula, explanation }) {
  return (
    <div className="explain-term">
      <div className="explain-term-header">
        <span className="explain-term-label">{label}</span>
        {formula && <code className="explain-term-formula">{formula}</code>}
      </div>
      <p className="explain-term-text">{explanation}</p>
    </div>
  );
}

export default function ExplainMode() {
  const explainMode = useDSPStore((s) => s.explainMode);
  if (!explainMode) return null;

  const fm     = useDSPStore((s) => s.fm);
  const fs     = useDSPStore((s) => s.fs);
  const Ts     = useDSPStore((s) => s.Ts);
  const status = useDSPStore((s) => s.status);
  const nyquistRate = useDSPStore((s) => s.nyquistRate);
  const aliasFreq   = useDSPStore((s) => s.aliasFreq);

  const statusText = {
    [NyquistStatus.SAFE]:
      `With fs = ${fs.toFixed(2)} Hz > 2·fm = ${nyquistRate.toFixed(2)} Hz, the Nyquist criterion is satisfied. ` +
      `The signal can be perfectly reconstructed using a low-pass filter with cutoff at fs/2.`,
    [NyquistStatus.BOUNDARY]:
      `fs = ${fs.toFixed(2)} Hz is exactly at the Nyquist rate. While theoretically sufficient, this is fragile: ` +
      `any phase shift will cause the sample to coincide with a zero crossing, collapsing the reconstructed amplitude.`,
    [NyquistStatus.ALIASING]:
      `fs = ${fs.toFixed(2)} Hz is BELOW the Nyquist rate of ${nyquistRate.toFixed(2)} Hz. ` +
      `Spectral replicas overlap with the baseband signal, causing irreversible frequency aliasing. ` +
      (aliasFreq != null ? `The input at ${fm.toFixed(2)} Hz appears as ${aliasFreq.toFixed(2)} Hz in the sampled spectrum.` : ''),
  }[status];

  return (
    <div className="explain-panel" aria-label="Educational explanations">
      <div className="explain-header">
        <span className="explain-badge">EXPLAIN</span>
        <span className="explain-title">EDUCATIONAL MODE</span>
      </div>

      <div className="explain-body">
        <div className="explain-status-card">
          <p className="explain-status-text">{statusText}</p>
        </div>

        <div className="explain-terms">
          <Term
            label="fm — Message Frequency"
            formula={`fm = ${fm.toFixed(2)} Hz`}
            explanation={`The frequency of your input sinusoid. One complete cycle occurs every ${(1/fm*1000).toFixed(2)} ms.`}
          />
          <Term
            label="fs — Sampling Frequency"
            formula={`fs = ${fs.toFixed(2)} Hz`}
            explanation={`Samples are taken ${fs.toFixed(2)} times per second, every Ts = ${(Ts*1000).toFixed(3)} ms.`}
          />
          <Term
            label="Nyquist Criterion"
            formula="fs ≥ 2·fm"
            explanation={`To avoid aliasing, you must sample at least twice the highest frequency present. Here 2·fm = ${nyquistRate.toFixed(2)} Hz. ${fs >= nyquistRate ? '✔ Currently satisfied.' : '✘ Currently violated — aliasing occurs!'}`}
          />
          <Term
            label="Ts — Sampling Interval"
            formula={`Ts = 1/fs = ${(Ts*1000).toFixed(3)} ms`}
            explanation="The time between consecutive samples. Shorter Ts means higher temporal resolution."
          />
          <Term
            label="Aliasing"
            formula={aliasFreq != null ? `f_alias = ${aliasFreq.toFixed(3)} Hz` : 'None'}
            explanation={
              aliasFreq != null
                ? `When fs < 2·fm, a sinusoid at fm appears as if it were at a lower frequency. Here fm = ${fm.toFixed(2)} Hz folds to ${aliasFreq.toFixed(3)} Hz. The original frequency information is permanently lost.`
                : 'Aliasing does not occur when fs ≥ 2·fm. All frequency components remain distinct and recoverable.'
            }
          />
          <Term
            label="Spectral Replicas"
            formula="X_s(f) = Σ X(f − k·fs)"
            explanation={`Sampling creates copies of the spectrum shifted by multiples of fs. When fs < 2·fm, these copies overlap with the baseband spectrum — causing aliasing distortion.`}
          />
          <Term
            label="Reconstruction"
            formula="x_r(t) = Σ x[n]·sinc(t/Ts − n)"
            explanation="The Whittaker–Shannon interpolation formula reconstructs the continuous signal from its samples using a sum of sinc functions. It is equivalent to ideal low-pass filtering in the frequency domain."
          />
        </div>
      </div>
    </div>
  );
}
