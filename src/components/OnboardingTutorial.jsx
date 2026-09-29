/**
 * OnboardingTutorial — 3-step guide shown on first visit.
 * Stored in localStorage — never shown again after dismiss.
 */
import React, { useState } from 'react';
import './OnboardingTutorial.css';

const STEPS = [
  {
    icon: '🎛️',
    title: 'Control the Signal',
    desc: 'Use the left panel to set message frequency (fm) and sampling frequency (fs). Try dragging the sliders — the 3D waveform updates instantly.',
    highlight: 'Try: drag the fs slider',
  },
  {
    icon: '⚠️',
    title: 'Trigger Aliasing',
    desc: 'Drag fs below 20 Hz (when fm = 10 Hz). Watch the sample stems turn red, the alias frequency appear, and the spectrum show overlap.',
    highlight: 'Try: set fs = 15 Hz',
  },
  {
    icon: '▶',
    title: 'Run the Nyquist Demo',
    desc: 'Click the DEMO card at the bottom and press RUN NYQUIST DEMO. It automatically steps through aliasing conditions with live diagnostics.',
    highlight: 'Try: click DEMO card below',
  },
];

const STORAGE_KEY = 'dsp_onboarding_done';

export default function OnboardingTutorial({ onClose }) {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="ob-backdrop">
      <div className="ob-box" role="dialog" aria-label="Getting started guide">
        {/* Header */}
        <div className="ob-header">
          <span className="ob-badge">GETTING STARTED</span>
          <button className="ob-skip" onClick={dismiss} aria-label="Skip tutorial">
            Skip ✕
          </button>
        </div>

        {/* Step dots */}
        <div className="ob-dots" aria-label="Step progress">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`ob-dot ${i === step ? 'ob-dot--active' : i < step ? 'ob-dot--done' : ''}`}
              onClick={() => setStep(i)}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="ob-content">
          <span className="ob-icon">{current.icon}</span>
          <h3 className="ob-title">
            Step {step + 1} of {STEPS.length} — {current.title}
          </h3>
          <p className="ob-desc">{current.desc}</p>
          <span className="ob-highlight">{current.highlight}</span>
        </div>

        {/* Actions */}
        <div className="ob-actions">
          {step > 0 && (
            <button className="ob-btn ob-btn--back" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          {!isLast ? (
            <button className="ob-btn ob-btn--next" onClick={() => setStep(s => s + 1)}>
              Next →
            </button>
          ) : (
            <button className="ob-btn ob-btn--start" onClick={dismiss}>
              🚀 Start Experimenting
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
