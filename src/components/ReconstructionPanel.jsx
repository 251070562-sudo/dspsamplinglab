/**
 * ReconstructionPanel — 2D SVG overlay of original vs reconstructed signal
 * with error plot and numeric error metrics.
 */

import React, { useMemo } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import './ReconstructionPanel.css';

const W = 700;
const H = 180;
const PAD = { left: 40, right: 16, top: 18, bottom: 28 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function pointsToPolyline(points, amplitude, duration) {
  return points
    .map(({ t, value }) => {
      const x = PAD.left + (t / duration) * PLOT_W;
      const y = PAD.top + PLOT_H / 2 - (value / (amplitude * 1.1)) * (PLOT_H / 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function ReconstructionPanel() {
  const continuous    = useDSPStore((s) => s.continuous);
  const reconstructed = useDSPStore((s) => s.reconstructed);
  const amplitude     = useDSPStore((s) => s.amplitude);
  const duration      = useDSPStore((s) => s.duration);
  const error         = useDSPStore((s) => s.error);
  const showError     = useDSPStore((s) => s.showError);

  const origPoly = useMemo(
    () => continuous?.length ? pointsToPolyline(continuous, amplitude, duration) : '',
    [continuous, amplitude, duration]
  );
  const recoPoly = useMemo(
    () => reconstructed?.length ? pointsToPolyline(reconstructed, amplitude, duration) : '',
    [reconstructed, amplitude, duration]
  );
  const errPoly = useMemo(() => {
    if (!showError || !error?.errorCurve?.length) return '';
    return pointsToPolyline(error.errorCurve, amplitude, duration);
  }, [error, showError, amplitude, duration]);

  const relPct = error?.relativeError != null
    ? (error.relativeError * 100).toFixed(2)
    : null;

  return (
    <div className="recon-panel">
      <div className="recon-header">
        <span className="recon-title">RECONSTRUCTION — SINC INTERPOLATION</span>
        <div className="recon-metrics">
          <span className="recon-metric">
            RMS: <strong>{error?.rmsError?.toFixed(4) ?? '—'}</strong>
          </span>
          <span className="recon-metric">
            Max|ε|: <strong>{error?.maxAbsError?.toFixed(4) ?? '—'}</strong>
          </span>
          {relPct != null && (
            <span className={`recon-metric ${parseFloat(relPct) > 5 ? 'recon-metric--warn' : ''}`}>
              Rel: <strong>{relPct}%</strong>
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="recon-svg"
        aria-label="Comparison of original and reconstructed signals"
        role="img"
      >
        {/* Zero line */}
        <line
          x1={PAD.left} y1={PAD.top + PLOT_H / 2}
          x2={W - PAD.right} y2={PAD.top + PLOT_H / 2}
          stroke="#0d2030" strokeWidth={1}
        />

        {/* Original */}
        {origPoly && (
          <polyline
            points={origPoly}
            fill="none"
            stroke="#00d9ff"
            strokeWidth={1.5}
            opacity={0.8}
          />
        )}

        {/* Reconstructed */}
        {recoPoly && (
          <polyline
            points={recoPoly}
            fill="none"
            stroke="#78ff78"
            strokeWidth={1.5}
            strokeDasharray="6,3"
            opacity={0.9}
          />
        )}

        {/* Error overlay */}
        {errPoly && (
          <polyline
            points={errPoly}
            fill="none"
            stroke="#ff4466"
            strokeWidth={1}
            opacity={0.75}
          />
        )}

        {/* X axis baseline */}
        <line
          x1={PAD.left} y1={PAD.top + PLOT_H}
          x2={W - PAD.right} y2={PAD.top + PLOT_H}
          stroke="#1a3a5a" strokeWidth={1}
        />

        {/* Time labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const x = PAD.left + frac * PLOT_W;
          return (
            <text key={frac} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#3a6a8a">
              {(frac * duration).toFixed(3)}s
            </text>
          );
        })}

        {/* Y label */}
        <text
          transform={`rotate(-90, 12, ${H / 2})`}
          x={12} y={H / 2}
          textAnchor="middle" fontSize="9" fill="#2a5a7a"
        >
          x(t)
        </text>
      </svg>

      <div className="recon-legend" aria-hidden="true">
        <span style={{ color: '#00d9ff' }}>── Original x(t)</span>
        <span style={{ color: '#78ff78' }}>╌╌ Reconstructed x_r(t)</span>
        {showError && <span style={{ color: '#ff4466' }}>── Error ε(t)</span>}
      </div>
    </div>
  );
}
