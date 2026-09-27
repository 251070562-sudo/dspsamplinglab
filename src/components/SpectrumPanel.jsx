/**
 * SpectrumPanel — SVG frequency-domain view.
 * Shows original component, spectral replicas, and overlap indication.
 * Fully derived from DSP engine data — no static mockups.
 */

import React, { useMemo } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { NyquistStatus } from '../dsp/engine.js';
import './SpectrumPanel.css';

const W = 700;
const H = 180;
const PAD = { left: 48, right: 16, top: 20, bottom: 36 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function freqToX(f, maxF) {
  return PAD.left + (f / maxF) * PLOT_W;
}

function SpectralLine({ f, maxF, height, color, label, dashed }) {
  const x = freqToX(f, maxF);
  const y1 = PAD.top + PLOT_H;
  const y2 = PAD.top + PLOT_H - height * PLOT_H;
  return (
    <g className="spectral-line">
      <line
        x1={x} y1={y1} x2={x} y2={y2}
        stroke={color}
        strokeWidth={dashed ? 1 : 2}
        strokeDasharray={dashed ? '4,3' : undefined}
        opacity={dashed ? 0.55 : 1}
      />
      <circle cx={x} cy={y2} r={3} fill={color} opacity={dashed ? 0.55 : 1} />
      {label && (
        <text
          x={x} y={y2 - 6}
          textAnchor="middle"
          fontSize="9"
          fill={color}
          opacity={dashed ? 0.7 : 1}
        >
          {label}
        </text>
      )}
    </g>
  );
}

export default function SpectrumPanel() {
  const fm            = useDSPStore((s) => s.fm);
  const fs            = useDSPStore((s) => s.fs);
  const spectralReplicas = useDSPStore((s) => s.spectralReplicas);
  const maxDisplayFreq   = useDSPStore((s) => s.maxDisplayFreq);
  const status        = useDSPStore((s) => s.status);
  const aliasFreq     = useDSPStore((s) => s.aliasFreq);

  const nyquist = fs / 2;
  const isAliasing = status === NyquistStatus.ALIASING;

  // X-axis tick marks
  const ticks = useMemo(() => {
    const step = Math.ceil(maxDisplayFreq / 8 / 10) * 10;
    const result = [];
    for (let f = 0; f <= maxDisplayFreq; f += step) result.push(f);
    return result;
  }, [maxDisplayFreq]);

  return (
    <div className="spectrum-panel">
      <div className="spectrum-header">
        <span className="spectrum-title">FREQUENCY DOMAIN — SPECTRUM</span>
        {isAliasing && (
          <span className="alias-warning" role="alert">
            ⚠ SPECTRAL OVERLAP → ALIASING
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="spectrum-svg"
        aria-label="Frequency spectrum showing original and replica components"
        role="img"
      >
        {/* Background grid */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <line key={frac}
            x1={PAD.left} y1={PAD.top + PLOT_H * (1 - frac)}
            x2={W - PAD.right} y2={PAD.top + PLOT_H * (1 - frac)}
            stroke="#0d2040" strokeWidth={1} />
        ))}

        {/* Nyquist boundary */}
        {nyquist <= maxDisplayFreq && (
          <g>
            <line x1={freqToX(nyquist, maxDisplayFreq)} y1={PAD.top}
              x2={freqToX(nyquist, maxDisplayFreq)} y2={PAD.top + PLOT_H}
              stroke="#2a4a3a" strokeWidth={1} strokeDasharray="5,4" />
            <text x={freqToX(nyquist, maxDisplayFreq) + 4} y={PAD.top + 12}
              fontSize="9" fill="#2a6a4a">fs/2={nyquist.toFixed(1)}Hz</text>
          </g>
        )}

        {/* Replicas */}
        {spectralReplicas.filter((f) => Math.abs(f - fm) > 0.01).map((f) => {
          const overlaps = isAliasing && Math.abs(f - fm) < fs / 2;
          return (
            <SpectralLine key={f} f={f} maxF={maxDisplayFreq} height={0.6}
              color={overlaps ? '#ff3838' : '#1a5a8a'} label={`${f.toFixed(0)}`} dashed />
          );
        })}

        {/* Alias */}
        {aliasFreq != null && (
          <SpectralLine f={aliasFreq} maxF={maxDisplayFreq} height={0.9}
            color="#ff6820" label={`alias ${aliasFreq.toFixed(1)}`} />
        )}

        {/* Original fm */}
        <SpectralLine f={fm} maxF={maxDisplayFreq} height={1.0}
          color="#00d9ff" label={`fm=${fm.toFixed(1)}`} />

        {/* X axis */}
        <line x1={PAD.left} y1={PAD.top + PLOT_H}
          x2={W - PAD.right} y2={PAD.top + PLOT_H} stroke="#1a3a5a" strokeWidth={1} />

        {/* Ticks */}
        {ticks.map((f) => (
          <g key={f}>
            <line x1={freqToX(f, maxDisplayFreq)} y1={PAD.top + PLOT_H}
              x2={freqToX(f, maxDisplayFreq)} y2={PAD.top + PLOT_H + 4} stroke="#1a3a5a" />
            <text x={freqToX(f, maxDisplayFreq)} y={PAD.top + PLOT_H + 14}
              textAnchor="middle" fontSize="9" fill="#3a6a8a">{f}</text>
          </g>
        ))}

        <text transform={`rotate(-90,12,${H/2})`} x={12} y={H/2}
          textAnchor="middle" fontSize="9" fill="#3a6a8a">|X(f)|</text>
        <text x={W - PAD.right} y={H - 4} textAnchor="end" fontSize="9" fill="#3a6a8a">f (Hz)</text>
      </svg>

      <div className="spectrum-legend" aria-hidden="true">
        <span className="legend-item" style={{ '--c': '#00d9ff' }}>● Original (fm)</span>
        <span className="legend-item" style={{ '--c': '#1a5a8a' }}>● Replicas</span>
        {aliasFreq != null && <span className="legend-item" style={{ '--c': '#ffd000' }}>● Alias</span>}
        {isAliasing && <span className="legend-item" style={{ '--c': '#ff4466' }}>● Overlap</span>}
      </div>
    </div>
  );
}
