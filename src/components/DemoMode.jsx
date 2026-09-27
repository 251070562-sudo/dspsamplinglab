/**
 * DemoMode — animated Nyquist demo with live diagnostic result panel.
 * After each step (and when user manually changes params), shows exactly
 * what is wrong and how to fix it.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { NyquistStatus } from '../dsp/engine.js';
import './DemoMode.css';

const DEMO_STEPS = [
  { fs: 50, label: 'Well above Nyquist',    desc: 'fs = 50 Hz — 5× oversampling. Clean, dense samples. Perfect reconstruction.' },
  { fs: 30, label: 'Comfortable margin',    desc: 'fs = 30 Hz — 3× oversampling. Still safely above Nyquist rate.' },
  { fs: 20, label: '← Nyquist Boundary →', desc: 'fs = 20 Hz — exactly 2×fm. Theoretically sufficient; phase-sensitive in practice.' },
  { fs: 18, label: 'Undersampling begins',  desc: 'fs = 18 Hz — below Nyquist. Aliasing appears. Reconstructed signal drifts.' },
  { fs: 15, label: 'Strong aliasing',       desc: 'fs = 15 Hz — severe undersampling. Alias frequency = 5 Hz. Reconstruction fails.' },
];

const FM_DEMO    = 10;
const STEP_DURATION = 3000;

// ── Diagnostic result panel ───────────────────────────────────────────────────
function DiagnosticResult() {
  const fm          = useDSPStore((s) => s.fm);
  const fs          = useDSPStore((s) => s.fs);
  const status      = useDSPStore((s) => s.status);
  const nyquistRate = useDSPStore((s) => s.nyquistRate);
  const aliasFreq   = useDSPStore((s) => s.aliasFreq);
  const ratio       = useDSPStore((s) => s.ratio);
  const error       = useDSPStore((s) => s.error);

  const isSafe     = status === NyquistStatus.SAFE;
  const isBoundary = status === NyquistStatus.BOUNDARY;
  const isAlias    = status === NyquistStatus.ALIASING;

  // How much fs needs to increase to be safe (with 20% margin)
  const requiredFs   = nyquistRate * 1.2;
  const fsDeficit    = requiredFs - fs;

  return (
    <div className={`diag-panel ${isAlias ? 'diag--alias' : isBoundary ? 'diag--boundary' : 'diag--safe'}`}>

      {/* Status header */}
      <div className="diag-header">
        <span className="diag-icon">
          {isSafe ? '✔' : isBoundary ? '△' : '⚠'}
        </span>
        <span className="diag-status">
          {isSafe ? 'SAFE — No aliasing' : isBoundary ? 'NYQUIST BOUNDARY' : 'ALIASING DETECTED'}
        </span>
      </div>

      {/* Key numbers */}
      <div className="diag-rows">
        <div className="diag-row">
          <span className="diag-key">Current fs</span>
          <span className="diag-val">{fs.toFixed(2)} Hz</span>
        </div>
        <div className="diag-row">
          <span className="diag-key">Required (2·fm)</span>
          <span className="diag-val">{nyquistRate.toFixed(2)} Hz</span>
        </div>
        <div className="diag-row">
          <span className="diag-key">Ratio fs/fm</span>
          <span className={`diag-val ${ratio < 2 ? 'diag-val--bad' : 'diag-val--good'}`}>
            {ratio.toFixed(3)}×  {ratio < 2 ? '✘' : '✔'}
          </span>
        </div>
        {aliasFreq != null && (
          <div className="diag-row">
            <span className="diag-key">Alias frequency</span>
            <span className="diag-val diag-val--bad">{aliasFreq.toFixed(3)} Hz</span>
          </div>
        )}
        <div className="diag-row">
          <span className="diag-key">RMS recon. error</span>
          <span className={`diag-val ${(error?.relativeError ?? 0) > 0.05 ? 'diag-val--bad' : 'diag-val--good'}`}>
            {error?.rmsError?.toFixed(4) ?? '—'}
          </span>
        </div>
      </div>

      {/* Fix instructions */}
      <div className="diag-fix">
        {isSafe && (
          <>
            <p className="diag-fix-title diag-fix-title--ok">✔ Everything looks good</p>
            <p className="diag-fix-body">
              Sampling frequency is <strong>{ratio.toFixed(2)}×</strong> the Nyquist rate.
              Signal can be perfectly reconstructed. No action needed.
            </p>
          </>
        )}

        {isBoundary && (
          <>
            <p className="diag-fix-title diag-fix-title--warn">△ Increase fs slightly</p>
            <p className="diag-fix-body">
              fs = 2·fm is theoretically exact but practically unreliable.
              Increase <strong>fs above {(nyquistRate * 1.1).toFixed(1)} Hz</strong> to get a safe margin.
              A rule of thumb: use at least <strong>fs = 2.5·fm = {(fm * 2.5).toFixed(1)} Hz</strong>.
            </p>
          </>
        )}

        {isAlias && (
          <>
            <p className="diag-fix-title diag-fix-title--bad">⚠ How to fix aliasing</p>
            <ul className="diag-fix-list">
              <li>
                <strong>Increase fs</strong> — set fs &gt; {nyquistRate.toFixed(1)} Hz.
                Recommended: <strong>fs = {requiredFs.toFixed(1)} Hz</strong> (20% margin above Nyquist).
                You need to raise fs by at least <strong>{fsDeficit.toFixed(1)} Hz</strong>.
              </li>
              <li>
                <strong>OR decrease fm</strong> — reduce message frequency below <strong>{(fs / 2).toFixed(1)} Hz</strong> to stay within the current fs.
              </li>
              <li>
                <strong>In real hardware</strong> — add an anti-aliasing low-pass filter with cutoff at fs/2 = <strong>{(fs / 2).toFixed(1)} Hz</strong> before the ADC.
              </li>
            </ul>
            <p className="diag-fix-body" style={{ marginTop: 6 }}>
              Currently the <strong>{fm.toFixed(1)} Hz</strong> signal appears as <strong>{aliasFreq?.toFixed(2)} Hz</strong> — this information loss is irreversible once sampled.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DemoMode() {
  const applyDemoStep = useDSPStore((s) => s.applyDemoStep);
  const setPlaying    = useDSPStore((s) => s.setPlaying);

  const [running, setRunning]         = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const timerRef = useRef(null);
  const stepRef  = useRef(0);

  const stopDemo = useCallback(() => {
    clearTimeout(timerRef.current);
    setRunning(false);
    setCurrentStep(-1);
    stepRef.current = 0;
  }, []);

  const runStep = useCallback(() => {
    const idx = stepRef.current;
    if (idx >= DEMO_STEPS.length) { stopDemo(); return; }
    applyDemoStep(FM_DEMO, DEMO_STEPS[idx].fs);
    setCurrentStep(idx);
    stepRef.current = idx + 1;
    timerRef.current = setTimeout(runStep, STEP_DURATION);
  }, [applyDemoStep, stopDemo]);

  const startDemo = useCallback(() => {
    stopDemo();
    setPlaying(true);
    setRunning(true);
    stepRef.current = 0;
    runStep();
  }, [runStep, stopDemo, setPlaying]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const active = currentStep >= 0 && currentStep < DEMO_STEPS.length
    ? DEMO_STEPS[currentStep] : null;

  return (
    <div className={`demo-mode ${running ? 'demo-mode--running' : ''}`}>

      {/* Header */}
      <div className="demo-header">
        <span className="demo-badge">DEMO</span>
        <span className="demo-title">NYQUIST DEMO</span>
        <div className="demo-controls">
          {!running
            ? <button className="demo-btn demo-btn--start" onClick={startDemo}>▶ RUN NYQUIST DEMO</button>
            : <button className="demo-btn demo-btn--stop"  onClick={stopDemo}>■ STOP</button>
          }
        </div>
      </div>

      <div className="demo-body">
        {/* Left — steps */}
        <div className="demo-left">
          <div className="demo-steps">
            {DEMO_STEPS.map((step, i) => (
              <div key={step.fs} className={`demo-step ${
                currentStep === i ? 'demo-step--active' :
                currentStep > i  ? 'demo-step--done'   : ''
              }`}>
                <span className="demo-step-num">{i + 1}</span>
                <div className="demo-step-info">
                  <span className="demo-step-label">{step.label}</span>
                  <span className="demo-step-freq">fm={FM_DEMO} · fs={step.fs} Hz</span>
                </div>
                {currentStep === i && <span className="demo-step-cur">◀</span>}
              </div>
            ))}
          </div>

          {active && (
            <div className="demo-desc">
              <span className="demo-desc-text">{active.desc}</span>
              <div className="demo-progress">
                <div className="demo-progress-bar"
                  style={{ animationDuration: `${STEP_DURATION}ms` }}
                  key={currentStep} />
              </div>
            </div>
          )}
        </div>

        {/* Right — live diagnostic */}
        <div className="demo-right">
          <DiagnosticResult />
        </div>
      </div>

    </div>
  );
}
