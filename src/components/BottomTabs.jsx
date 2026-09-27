/**
 * BottomTabs — compact info cards at the bottom.
 * Each card shows a key metric. Click any card → popup with full detail.
 */

import React, { useState } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { NyquistStatus } from '../dsp/engine.js';
import SpectrumPanel from './SpectrumPanel.jsx';
import RatioGraph from './RatioGraph.jsx';
import ReconstructionPanel from './ReconstructionPanel.jsx';
import ExperimentSummary from './ExperimentSummary.jsx';
import SnapshotManager from './SnapshotManager.jsx';
import DemoMode from './DemoMode.jsx';
import './BottomTabs.css';

// ─── Popup overlay ────────────────────────────────────────────────────────────
function Popup({ id, onClose }) {
  return (
    <div className="bt-popup-backdrop" onClick={onClose}>
      <div className="bt-popup-box" onClick={(e) => e.stopPropagation()}>
        <button className="bt-popup-close" onClick={onClose} aria-label="Close">✕</button>
        {id === 'spectrum'       && <SpectrumPanel />}
        {id === 'ratio'          && <RatioGraph />}
        {id === 'reconstruction' && <ReconstructionPanel />}
        {id === 'summary'        && <ExperimentSummary />}
        {id === 'snapshots'      && <SnapshotManager />}
        {id === 'demo'           && <DemoMode />}
      </div>
    </div>
  );
}

// ─── Individual info card ─────────────────────────────────────────────────────
function InfoCard({ icon, label, value, sub, highlight, onClick }) {
  return (
    <button
      className={`bt-card ${highlight ? 'bt-card--highlight' : ''}`}
      onClick={onClick}
      title={`Click to expand ${label}`}
    >
      <span className="bt-card-icon">{icon}</span>
      <div className="bt-card-body">
        <span className="bt-card-label">{label}</span>
        <span className="bt-card-value">{value}</span>
        {sub && <span className="bt-card-sub">{sub}</span>}
      </div>
      <span className="bt-card-arrow">⤢</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BottomTabs() {
  const [popup, setPopup] = useState(null);

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

  const statusColor = isAlias ? '#ff4466' : isBoundary ? '#ffc800' : '#00ff80';
  const statusLabel = isAlias ? 'ALIASING' : isBoundary ? 'BOUNDARY' : 'SAFE';

  return (
    <>
      <div className="bottom-tabs">
        {/* Row of info cards */}
        <div className="bt-cards">

          <InfoCard
            icon="〜"
            label="SPECTRUM"
            value={`fm = ${fm.toFixed(1)} Hz`}
            sub={`fs = ${fs.toFixed(1)} Hz`}
            onClick={() => setPopup('spectrum')}
          />

          <InfoCard
            icon="⊗"
            label="RATIO"
            value={`${ratio.toFixed(2)}×`}
            sub={`fs / fm`}
            highlight={isAlias}
            onClick={() => setPopup('ratio')}
          />

          <InfoCard
            icon="⚡"
            label="NYQUIST"
            value={`${nyquistRate.toFixed(1)} Hz`}
            sub={`Ts = ${(Ts * 1000).toFixed(2)} ms`}
            onClick={() => setPopup('ratio')}
          />

          <InfoCard
            icon="⤴"
            label="RECONSTRUCTION"
            value={`RMS ${error?.rmsError?.toFixed(3) ?? '—'}`}
            sub={`${samples?.length ?? 0} samples`}
            highlight={error?.relativeError > 0.05}
            onClick={() => setPopup('reconstruction')}
          />

          <InfoCard
            icon="👻"
            label="ALIAS"
            value={aliasFreq != null ? `${aliasFreq.toFixed(2)} Hz` : 'None'}
            sub={<span style={{ color: statusColor }}>{statusLabel}</span>}
            highlight={isAlias}
            onClick={() => setPopup('summary')}
          />

          <InfoCard
            icon="≡"
            label="SUMMARY"
            value="EXPERIMENT"
            sub="Click to view"
            onClick={() => setPopup('summary')}
          />

          <InfoCard
            icon="💾"
            label="SNAPSHOTS"
            value="SAVE / LOAD"
            sub="Experiment states"
            onClick={() => setPopup('snapshots')}
          />

          <InfoCard
            icon="▶"
            label="DEMO"
            value="NYQUIST DEMO"
            sub="Auto walkthrough"
            onClick={() => setPopup('demo')}
          />

        </div>
      </div>

      {/* Popup overlay */}
      {popup && <Popup id={popup} onClose={() => setPopup(null)} />}
    </>
  );
}
