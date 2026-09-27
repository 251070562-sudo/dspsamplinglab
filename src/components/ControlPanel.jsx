import React, { useCallback } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { validateParam, BOUNDS } from '../utils/validation.js';
import './ControlPanel.css';

const PARAM_ICONS = {
  fm:        'fm',
  fs:        'fs',
  amplitude: 'A',
  phase:     'φ',
  duration:  'T',
};

const PARAM_FULL_LABELS = {
  fm:        'MESSAGE FREQUENCY (Hz)',
  fs:        'SAMPLING FREQUENCY (Hz)',
  amplitude: 'AMPLITUDE',
  phase:     'PHASE OFFSET (rad)',
  duration:  'DURATION (s)',
};

const PARAM_DESC = {
  fm:        'Frequency of the input signal',
  fs:        'Rate at which samples are taken',
  amplitude: 'Signal peak amplitude',
  phase:     'Initial phase in radians',
  duration:  'Observation window length',
};

function ParamControl({ name, step }) {
  const value   = useDSPStore((s) => s[name]);
  const error   = useDSPStore((s) => s.inputErrors[name]);
  const setParam       = useDSPStore((s) => s.setParam);
  const setInputError  = useDSPStore((s) => s.setInputError);
  const clearInputError = useDSPStore((s) => s.clearInputError);
  const bounds = BOUNDS[name];

  const handleSlider = useCallback((e) => {
    setParam(name, parseFloat(e.target.value));
    clearInputError(name);
  }, [name, setParam, clearInputError]);

  const handleInput = useCallback((e) => {
    const { value: v, error: err } = validateParam(e.target.value, name);
    if (err) setInputError(name, err);
    else { clearInputError(name); setParam(name, v); }
  }, [name, setParam, setInputError, clearInputError]);

  return (
    <div className={`cp-param ${error ? 'cp-param--error' : ''}`}>
      <div className="cp-param-header">
        <span className="cp-param-icon">{PARAM_ICONS[name]}</span>
        <label className="cp-param-label" htmlFor={`input-${name}`}>
          {PARAM_FULL_LABELS[name]}
        </label>
      </div>
      {PARAM_DESC[name] && <p className="cp-param-desc">{PARAM_DESC[name]}</p>}
      <div className="cp-param-controls">
        <input
          id={`slider-${name}`} type="range"
          className="cp-slider"
          min={bounds.min} max={bounds.max}
          step={step || (bounds.max - bounds.min) / 200}
          value={value} onChange={handleSlider}
          aria-label={`${PARAM_FULL_LABELS[name]} slider`}
        />
        <input
          id={`input-${name}`} type="number"
          className="cp-input"
          min={bounds.min} max={bounds.max} step={step}
          value={value} onChange={handleInput}
          aria-label={`${PARAM_FULL_LABELS[name]} value`}
        />
      </div>
      {error && <span className="cp-error" role="alert">{error}</span>}
    </div>
  );
}

export default function ControlPanel() {
  const isPlaying  = useDSPStore((s) => s.isPlaying);
  const togglePlay = useDSPStore((s) => s.togglePlay);
  const reset      = useDSPStore((s) => s.reset);

  return (
    <aside className="control-panel">
      {/* Header */}
      <div className="cp-header">
        <span className="cp-header-icon">⚙</span>
        <span className="cp-header-title">INPUT PARAMETERS</span>
        <span className="cp-badge">CTRL</span>
      </div>

      {/* Params */}
      <div className="cp-params">
        <ParamControl name="fm"        step={0.5} />
        <ParamControl name="fs"        step={0.5} />
        <ParamControl name="amplitude" step={0.05} />
        <ParamControl name="phase"     step={0.1} />
        <ParamControl name="duration"  step={0.05} />
      </div>

      {/* Actions */}
      <div className="cp-actions">
        <button
          className={`cp-btn cp-btn--play ${isPlaying ? '' : 'cp-btn--paused'}`}
          onClick={togglePlay}
          aria-pressed={isPlaying}
        >
          {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
        <button className="cp-btn cp-btn--reset" onClick={reset}>
          ↺ RESET
        </button>
      </div>
    </aside>
  );
}
