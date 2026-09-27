import React, { useState } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { NyquistStatus } from '../dsp/engine.js';
import './LiveStatus.css';

function Section({ icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ls-section">
      <button className="ls-section-header" onClick={() => setOpen(!open)}>
        <span className="ls-section-icon">{icon}</span>
        <span className="ls-section-title">{title}</span>
        <span className={`ls-section-arrow ${open ? 'ls-section-arrow--open' : ''}`}>∧</span>
      </button>
      {open && <div className="ls-section-body">{children}</div>}
    </div>
  );
}

function Row({ label, value, accent, warn, good }) {
  return (
    <div className="ls-row">
      <span className="ls-row-label">{label}</span>
      <span className={`ls-row-value ${accent ? 'ls-row--accent' : ''} ${warn ? 'ls-row--warn' : ''} ${good ? 'ls-row--good' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default function LiveStatus() {
  const fm          = useDSPStore((s) => s.fm);
  const fs          = useDSPStore((s) => s.fs);
  const nyquistRate = useDSPStore((s) => s.nyquistRate);
  const ratio       = useDSPStore((s) => s.ratio);
  const Ts          = useDSPStore((s) => s.Ts);
  const status      = useDSPStore((s) => s.status);
  const aliasFreq   = useDSPStore((s) => s.aliasFreq);
  const error       = useDSPStore((s) => s.error);
  const samples     = useDSPStore((s) => s.samples);

  const isAlias    = status === NyquistStatus.ALIASING;
  const isBoundary = status === NyquistStatus.BOUNDARY;

  const statusColor  = isAlias ? 'var(--red)' : isBoundary ? 'var(--yellow)' : 'var(--green)';
  const statusLabel  = isAlias ? 'ALIASING DETECTED' : isBoundary ? 'NYQUIST BOUNDARY' : 'SAFE';
  const statusIcon   = isAlias ? '⚠' : isBoundary ? '△' : '●';
  const relPct       = error?.relativeError != null ? (error.relativeError * 100).toFixed(2) : null;

  return (
    <aside className="live-status">
      {/* Header */}
      <div className="ls-header">
        <span className="ls-header-icon">∿</span>
        <span className="ls-header-title">LIVE ANALYSIS</span>
        <span className="ls-live-dot" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
        <span className="ls-live-text" style={{ color: statusColor }}>LIVE</span>
      </div>

      {/* Sections */}
      <div className="ls-body">
        <Section icon="⊞" title="SIGNAL PARAMETERS">
          <Row label="Message Frequency (fm)" value={`${fm.toFixed(3)} Hz`} />
          <Row label="Sampling Frequency (fs)" value={`${fs.toFixed(3)} Hz`} />
          <Row label="Nyquist Rate (2fm)" value={`${nyquistRate.toFixed(3)} Hz`} />
          <Row label="Ratio (fs/fm)" value={ratio.toFixed(3)} accent />
          <Row label="Interval Ts" value={`${(Ts * 1000).toFixed(3)} ms`} />
        </Section>

        <Section icon="⊙" title="SAMPLING INFO">
          <Row label="Samples Captured" value={samples?.length ?? 0} />
          <Row
            label="Alias Frequency"
            value={aliasFreq != null ? `${aliasFreq.toFixed(3)} Hz` : 'None'}
            warn={aliasFreq != null}
          />
        </Section>

        <Section icon="≋" title="RECONSTRUCTION ERROR">
          <Row label="RMS Error"      value={error?.rmsError?.toFixed(4) ?? '—'} warn={error?.rmsError > 0.1} />
          <Row label="Max |Error|"    value={error?.maxAbsError?.toFixed(4) ?? '—'} />
          <Row
            label="Relative Error"
            value={relPct != null ? `${relPct} %` : '—'}
            warn={parseFloat(relPct) > 5}
            good={parseFloat(relPct) <= 1}
            accent={parseFloat(relPct) > 5}
          />
        </Section>
      </div>

      {/* Status badge */}
      <div className="ls-status-badge" style={{ '--sc': statusColor }}>
        <span className="ls-status-icon">{statusIcon}</span>
        <span className="ls-status-text">{statusLabel}</span>
      </div>
    </aside>
  );
}
