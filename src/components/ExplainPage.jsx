/**
 * ExplainPage — full-screen overlay educational reference.
 * All values pulled live from the DSP store so formulas update in real time.
 */

import React, { useState } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { NyquistStatus } from '../dsp/engine.js';
import './ExplainPage.css';

// ─── Small reusable blocks ─────────────────────────────────────────────────
function Formula({ children }) {
  return <div className="ep-formula">{children}</div>;
}

function ConceptCard({ icon, title, formula, children, highlight }) {
  return (
    <div className={`ep-card ${highlight ? 'ep-card--highlight' : ''}`}>
      <div className="ep-card-header">
        <span className="ep-card-icon">{icon}</span>
        <span className="ep-card-title">{title}</span>
      </div>
      {formula && <Formula>{formula}</Formula>}
      <div className="ep-card-body">{children}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    [NyquistStatus.SAFE]:     { cls: 'safe',     icon: '✔', label: 'SAFE — Perfect reconstruction possible' },
    [NyquistStatus.BOUNDARY]: { cls: 'boundary', icon: '△', label: 'NYQUIST BOUNDARY — Theoretically sufficient, practically risky' },
    [NyquistStatus.ALIASING]: { cls: 'alias',    icon: '⚠', label: 'ALIASING DETECTED — Signal information lost' },
  };
  const m = map[status] || map[NyquistStatus.SAFE];
  return (
    <div className={`ep-status ep-status--${m.cls}`}>
      <span className="ep-status-icon">{m.icon}</span>
      <span>{m.label}</span>
    </div>
  );
}

// ─── Sections ──────────────────────────────────────────────────────────────
function LiveValuesSection({ fm, fs, Ts, nyquistRate, ratio, aliasFreq, status }) {
  return (
    <div className="ep-live-grid">
      <div className="ep-live-row"><span>fm</span><span>{fm.toFixed(4)} Hz</span></div>
      <div className="ep-live-row"><span>fs</span><span>{fs.toFixed(4)} Hz</span></div>
      <div className="ep-live-row"><span>Nyquist Rate  2·fm</span><span>{nyquistRate.toFixed(4)} Hz</span></div>
      <div className="ep-live-row ep-live-row--accent"><span>fs / fm</span><span>{ratio.toFixed(4)}</span></div>
      <div className="ep-live-row"><span>Ts = 1/fs</span><span>{(Ts * 1000).toFixed(4)} ms</span></div>
      <div className={`ep-live-row ${aliasFreq != null ? 'ep-live-row--warn' : ''}`}>
        <span>Alias Frequency</span>
        <span>{aliasFreq != null ? `${aliasFreq.toFixed(4)} Hz` : 'None'}</span>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
const TABS = ['CONCEPTS', 'LIVE VALUES', 'FORMULAS', 'ALIASING', 'RECONSTRUCTION'];

export default function ExplainPage({ onClose }) {
  const [tab, setTab] = useState('CONCEPTS');

  const fm          = useDSPStore((s) => s.fm);
  const fs          = useDSPStore((s) => s.fs);
  const amplitude   = useDSPStore((s) => s.amplitude);
  const phase       = useDSPStore((s) => s.phase);
  const Ts          = useDSPStore((s) => s.Ts);
  const nyquistRate = useDSPStore((s) => s.nyquistRate);
  const ratio       = useDSPStore((s) => s.ratio);
  const status      = useDSPStore((s) => s.status);
  const aliasFreq   = useDSPStore((s) => s.aliasFreq);
  const error       = useDSPStore((s) => s.error);
  const samples     = useDSPStore((s) => s.samples);

  const isAliasing  = status === NyquistStatus.ALIASING;
  const isBoundary  = status === NyquistStatus.BOUNDARY;

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Educational Reference">
      <div className="overlay-panel explainpage">

        {/* Header */}
        <div className="overlay-header">
          <div className="overlay-header-left">
            <span className="overlay-badge" style={{ borderColor: 'rgba(120,255,120,0.3)', color: '#78ff78', background: 'rgba(120,255,120,0.1)' }}>LEARN</span>
            <h2 className="overlay-title">DSP EDUCATIONAL REFERENCE</h2>
            <span className="overlay-subtitle">Live values update as you change parameters</span>
          </div>
          <button className="overlay-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Live status bar */}
        <div className="ep-statusbar">
          <StatusBadge status={status} />
          <span className="ep-statusbar-params">
            fm = <strong>{fm.toFixed(2)} Hz</strong>
            &nbsp;·&nbsp; fs = <strong>{fs.toFixed(2)} Hz</strong>
            &nbsp;·&nbsp; ratio = <strong>{ratio.toFixed(2)}×</strong>
            &nbsp;·&nbsp; Ts = <strong>{(Ts * 1000).toFixed(2)} ms</strong>
          </span>
        </div>

        {/* Tab bar */}
        <div className="ep-tabbar" role="tablist">
          {TABS.map((t) => (
            <button
              key={t} role="tab"
              className={`ep-tab ${tab === t ? 'ep-tab--active' : ''}`}
              aria-selected={tab === t}
              onClick={() => setTab(t)}
            >{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div className="ep-content">

          {/* ── CONCEPTS ── */}
          {tab === 'CONCEPTS' && (
            <div className="ep-grid">
              <ConceptCard icon="〜" title="Message Frequency — fm"
                formula={`x(t) = A · sin(2π · ${fm.toFixed(2)} · t + φ)`}>
                <p>The frequency of your input sinusoid. The signal completes <strong>{fm.toFixed(2)}</strong> full cycles every second.</p>
                <p>One period = <strong>{(1000 / fm).toFixed(3)} ms</strong></p>
                <p>Increasing fm makes the wave oscillate faster. The Nyquist rate rises proportionally — you need a higher fs to keep up.</p>
              </ConceptCard>

              <ConceptCard icon="⏱" title="Sampling Frequency — fs"
                formula={`Ts = 1/fs = ${(Ts * 1000).toFixed(3)} ms`}>
                <p>How many samples are taken per second. Currently <strong>{fs.toFixed(2)}</strong> samples/sec, one every <strong>{(Ts * 1000).toFixed(3)} ms</strong>.</p>
                <p>Total samples in window: <strong>{samples?.length ?? 0}</strong></p>
                <p>Think of fs as the camera frame rate for the signal — too slow and you miss detail.</p>
              </ConceptCard>

              <ConceptCard icon="⚖" title="Nyquist–Shannon Theorem"
                formula="fs ≥ 2 · fm" highlight={isAliasing}>
                <p>The fundamental theorem of digital signal processing. To faithfully reconstruct a signal of frequency fm, you must sample at <em>at least twice</em> that frequency.</p>
                <p>Required: <strong>{nyquistRate.toFixed(2)} Hz</strong> &nbsp;|&nbsp; Current: <strong>{fs.toFixed(2)} Hz</strong></p>
                <p>{fs >= nyquistRate
                  ? `✔ Satisfied by a margin of ${(ratio - 2).toFixed(2)}×`
                  : `✘ Violated — fs is ${(nyquistRate - fs).toFixed(2)} Hz too low`}</p>
              </ConceptCard>

              <ConceptCard icon="👻" title="Aliasing"
                formula={aliasFreq != null ? `f_alias = ${aliasFreq.toFixed(3)} Hz` : 'No aliasing currently'} highlight={isAliasing}>
                <p>When fs &lt; 2·fm, the sampled signal appears to have a <em>lower</em> frequency than the original. This impostor frequency is called the alias.</p>
                {aliasFreq != null
                  ? <p>Your <strong>{fm.toFixed(2)} Hz</strong> signal currently aliases to <strong>{aliasFreq.toFixed(3)} Hz</strong> — a completely different frequency.</p>
                  : <p>No aliasing right now. Reduce fs below <strong>{nyquistRate.toFixed(2)} Hz</strong> to trigger aliasing.</p>}
                <p>Aliasing is <strong>irreversible</strong> — you cannot recover the original frequency once aliased.</p>
              </ConceptCard>

              <ConceptCard icon="🔁" title="Reconstruction"
                formula="x_r(t) = Σ x[n] · sinc(t/Ts − n)">
                <p>The Whittaker–Shannon interpolation formula reconstructs a continuous signal from discrete samples using a sum of sinc functions.</p>
                <p>RMS Error: <strong>{error?.rmsError?.toFixed(4) ?? '—'}</strong> &nbsp;|&nbsp; Max Error: <strong>{error?.maxAbsError?.toFixed(4) ?? '—'}</strong></p>
                <p>{isAliasing
                  ? '⚠ Reconstruction is currently distorted — alias frequencies are contaminating the output.'
                  : '✔ Reconstruction is accurate — low error confirms the Nyquist criterion is satisfied.'}</p>
              </ConceptCard>

              <ConceptCard icon="📡" title="Spectral Replicas"
                formula="X_s(f) = Σ_k X(f − k·fs)">
                <p>Sampling in time creates <em>copies</em> of the spectrum at every multiple of fs. These replicas sit at k·fs ± fm.</p>
                <p>When fs is large, replicas stay far apart. When fs shrinks toward 2fm, replicas crowd the baseband and eventually overlap — causing aliasing.</p>
              </ConceptCard>
            </div>
          )}

          {/* ── LIVE VALUES ── */}
          {tab === 'LIVE VALUES' && (
            <div className="ep-live-section">
              <p className="ep-live-note">These values update in real time as you move sliders.</p>
              <LiveValuesSection
                fm={fm} fs={fs} Ts={Ts}
                nyquistRate={nyquistRate} ratio={ratio}
                aliasFreq={aliasFreq} status={status}
              />
              <div className="ep-live-error-grid">
                <div className="ep-live-row"><span>RMS Reconstruction Error</span><span>{error?.rmsError?.toFixed(6) ?? '—'}</span></div>
                <div className="ep-live-row"><span>Max |Error|</span><span>{error?.maxAbsError?.toFixed(6) ?? '—'}</span></div>
                <div className="ep-live-row ep-live-row--accent"><span>Relative Error</span>
                  <span>{error?.relativeError != null ? `${(error.relativeError * 100).toFixed(3)} %` : '—'}</span>
                </div>
                <div className="ep-live-row"><span>Samples in window</span><span>{samples?.length ?? 0}</span></div>
                <div className="ep-live-row"><span>Amplitude A</span><span>{amplitude.toFixed(4)}</span></div>
                <div className="ep-live-row"><span>Phase φ</span><span>{phase.toFixed(4)} rad</span></div>
              </div>
            </div>
          )}

          {/* ── FORMULAS ── */}
          {tab === 'FORMULAS' && (
            <div className="ep-formulas">
              {[
                { label: 'Continuous signal',    f: 'x(t) = A · sin(2π·fm·t + φ)',              current: `= ${amplitude.toFixed(2)} · sin(2π·${fm.toFixed(2)}·t + ${phase.toFixed(2)})` },
                { label: 'Sampling interval',    f: 'Ts = 1 / fs',                               current: `= 1 / ${fs.toFixed(2)} = ${(Ts*1000).toFixed(3)} ms` },
                { label: 'Discrete samples',     f: 'x[n] = x(n·Ts) = A·sin(2π·fm·n·Ts + φ)',   current: `n = 0, 1, …, ${(samples?.length ?? 1) - 1}` },
                { label: 'Nyquist rate',         f: 'fN = 2·fm',                                  current: `= 2 × ${fm.toFixed(2)} = ${nyquistRate.toFixed(2)} Hz` },
                { label: 'Nyquist criterion',    f: 'fs ≥ 2·fm',                                  current: `${fs.toFixed(2)} ${fs >= nyquistRate ? '≥' : '<'} ${nyquistRate.toFixed(2)} → ${fs >= nyquistRate ? 'SATISFIED' : 'VIOLATED'}` },
                { label: 'Alias frequency',      f: 'f_mod = fm mod fs;  f_alias = f_mod > fs/2 ? fs−f_mod : f_mod', current: aliasFreq != null ? `= ${aliasFreq.toFixed(3)} Hz` : 'N/A (no aliasing)' },
                { label: 'Sinc function',        f: 'sinc(x) = sin(π·x) / (π·x),  sinc(0)=1',    current: '' },
                { label: 'Sinc reconstruction',  f: 'x_r(t) = Σ_n  x[n] · sinc(t/Ts − n)',       current: '' },
                { label: 'RMS error',            f: 'ε_rms = √( (1/N) Σ (x(t_i)−x_r(t_i))² )',  current: `= ${error?.rmsError?.toFixed(6) ?? '—'}` },
                { label: 'Spectral replicas',    f: 'X_s(f) = Σ_k X(f − k·fs)',                   current: `k = 0, ±1, ±2, …  (fs=${fs.toFixed(1)} Hz)` },
              ].map(({ label, f, current }) => (
                <div className="ep-formula-row" key={label}>
                  <div className="ep-formula-label">{label}</div>
                  <div className="ep-formula-expr">{f}</div>
                  {current && <div className="ep-formula-current">{current}</div>}
                </div>
              ))}
            </div>
          )}

          {/* ── ALIASING ── */}
          {tab === 'ALIASING' && (
            <div className="ep-article">
              <h3 className="ep-article-title">What is Aliasing?</h3>
              <p>When a signal is sampled below the Nyquist rate, different frequencies become indistinguishable from each other in the sampled domain. A high-frequency sinusoid "pretends" to be a lower-frequency one.</p>

              <h3 className="ep-article-title">Why does it happen?</h3>
              <p>Sampling at fs creates spectral replicas at every multiple of fs. If fs is too low, these replicas overlap with the original baseband spectrum. The overlapping components add up and cannot be separated — aliasing is a form of irreversible information loss.</p>

              <h3 className="ep-article-title">Alias Frequency Calculation</h3>
              <Formula>f_mod = fm mod fs</Formula>
              <Formula>f_alias = f_mod {'>'} fs/2  ?  fs − f_mod  :  f_mod</Formula>
              {aliasFreq != null ? (
                <div className="ep-alias-calc">
                  <p>With your current values:</p>
                  <p><strong>fm = {fm.toFixed(2)} Hz,  fs = {fs.toFixed(2)} Hz</strong></p>
                  <p>f_mod = {fm.toFixed(2)} mod {fs.toFixed(2)} = <strong>{(fm % fs).toFixed(3)} Hz</strong></p>
                  <p>{(fm % fs) > fs / 2
                    ? `f_mod (${(fm%fs).toFixed(3)}) > fs/2 (${(fs/2).toFixed(3)}) → fold: f_alias = ${fs.toFixed(2)} − ${(fm%fs).toFixed(3)} = `
                    : `f_mod (${(fm%fs).toFixed(3)}) ≤ fs/2 (${(fs/2).toFixed(3)}) → f_alias = `}
                    <strong>{aliasFreq.toFixed(3)} Hz</strong></p>
                </div>
              ) : (
                <div className="ep-alias-calc ep-alias-calc--safe">
                  <p>✔ No aliasing with current values. fs ({fs.toFixed(2)} Hz) ≥ 2·fm ({nyquistRate.toFixed(2)} Hz).</p>
                  <p>Reduce fs below <strong>{nyquistRate.toFixed(2)} Hz</strong> to see aliasing occur.</p>
                </div>
              )}

              <h3 className="ep-article-title">Practical Prevention</h3>
              <p>Real ADC systems use an <strong>anti-aliasing filter</strong> (a low-pass filter) before sampling. This removes all frequency components above fs/2 before they can cause aliasing. The filter cutoff must be set to fs/2 or below.</p>

              <h3 className="ep-article-title">Demo Scenario</h3>
              <div className="ep-scenario-table">
                {[
                  { fs: 50, note: '5× oversample — perfect' },
                  { fs: 30, note: '3× oversample — safe margin' },
                  { fs: 20, note: 'Exactly Nyquist — risky in practice' },
                  { fs: 18, note: 'Aliasing begins — alias appears' },
                  { fs: 15, note: 'Strong aliasing — reconstruction fails' },
                ].map(({ fs: dfs, note }) => {
                  const fmod = fm % dfs;
                  const alias = fmod > dfs/2 ? dfs - fmod : fmod;
                  const ok = dfs >= 2 * fm;
                  return (
                    <div className="ep-scenario-row" key={dfs}>
                      <span className="ep-scenario-fs">fs = {dfs} Hz</span>
                      <span className={`ep-scenario-status ${ok ? 'safe' : 'alias'}`}>{ok ? '✔ SAFE' : `⚠ alias → ${alias.toFixed(1)} Hz`}</span>
                      <span className="ep-scenario-note">{note}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── RECONSTRUCTION ── */}
          {tab === 'RECONSTRUCTION' && (
            <div className="ep-article">
              <h3 className="ep-article-title">Whittaker–Shannon Interpolation</h3>
              <p>Given a set of discrete samples x[n] taken at interval Ts, the original continuous signal can be exactly reconstructed (when the Nyquist criterion is met) using:</p>
              <Formula>x_r(t) = Σ_n  x[n] · sinc( t/Ts − n )</Formula>
              <p>where the normalised sinc function is:</p>
              <Formula>sinc(x) = sin(π·x) / (π·x),   sinc(0) = 1</Formula>

              <h3 className="ep-article-title">How it works</h3>
              <p>Each sample contributes a sinc "pulse" centred at its time position. At every sample instant n·Ts, its own sinc equals 1 and all other sincs equal 0 — so the reconstructed signal passes exactly through every sample. Between samples, the overlapping sinc tails sum to interpolate smoothly.</p>

              <h3 className="ep-article-title">Frequency domain view</h3>
              <p>In the frequency domain, this is equivalent to multiplying the spectrum by an ideal rectangular low-pass filter with cutoff at fs/2. Any frequency above fs/2 is removed — which is why undersampled signals cannot be reconstructed: their alias frequencies are inside the passband.</p>

              <h3 className="ep-article-title">Current Error Metrics</h3>
              <div className="ep-live-error-grid" style={{ marginTop: 8 }}>
                <div className="ep-live-row"><span>RMS Error</span><span>{error?.rmsError?.toFixed(6) ?? '—'}</span></div>
                <div className="ep-live-row"><span>Max |Error|</span><span>{error?.maxAbsError?.toFixed(6) ?? '—'}</span></div>
                <div className="ep-live-row ep-live-row--accent"><span>Relative Error</span>
                  <span>{error?.relativeError != null ? `${(error.relativeError*100).toFixed(3)} %` : '—'}</span>
                </div>
              </div>
              <p style={{ marginTop: 12 }}>
                {isAliasing
                  ? '⚠ High error expected — aliasing is distorting the reconstruction. The reconstructed signal represents the alias frequency, not the original.'
                  : error?.relativeError > 0.01
                    ? 'Minor error due to finite sinc window (±32 samples). Negligible for practical purposes.'
                    : '✔ Near-zero error — perfect reconstruction confirmed under current conditions.'}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
