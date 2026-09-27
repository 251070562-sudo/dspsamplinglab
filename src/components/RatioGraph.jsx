/**
 * RatioGraph — SVG plot of fs/fm ratio showing safe / aliasing zones.
 * The current fs/fm point animates along the axis.
 */

import React from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { NyquistStatus } from '../dsp/engine.js';
import './RatioGraph.css';

const W = 700;
const H = 180;
const PAD = { left: 48, right: 24, top: 24, bottom: 36 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const MAX_RATIO = 10;

export default function RatioGraph() {
  const ratio  = useDSPStore((s) => s.ratio);
  const status = useDSPStore((s) => s.status);
  const fm     = useDSPStore((s) => s.fm);
  const fs     = useDSPStore((s) => s.fs);

  const clampedRatio = Math.min(ratio, MAX_RATIO);
  const pointX = PAD.left + (clampedRatio / MAX_RATIO) * PLOT_W;
  const midY   = PAD.top + PLOT_H / 2;

  const ticks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const dotColor =
    status === NyquistStatus.SAFE     ? '#00ff80' :
    status === NyquistStatus.BOUNDARY ? '#ffc800' : '#ff4466';

  return (
    <div className="ratio-graph">
      <div className="ratio-header">
        <span className="ratio-title">SAMPLING RATIO  fs / fm = {ratio.toFixed(3)}</span>
        <span className="ratio-caption">
          fs = {fs.toFixed(2)} Hz &nbsp;|&nbsp; fm = {fm.toFixed(2)} Hz
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="ratio-svg"
        role="img"
        aria-label={`Sampling ratio chart. Current ratio is ${ratio.toFixed(2)}`}
      >
        {/* Aliasing zone (ratio < 2) */}
        <rect
          x={PAD.left} y={PAD.top}
          width={(2 / MAX_RATIO) * PLOT_W} height={PLOT_H}
          fill="rgba(255,60,60,0.07)"
        />
        <text x={PAD.left + 4} y={PAD.top + 14} fontSize="9" fill="#ff4466" opacity={0.7}>
          ALIASING ZONE
        </text>

        {/* Safe zone */}
        <rect
          x={PAD.left + (2 / MAX_RATIO) * PLOT_W} y={PAD.top}
          width={PLOT_W - (2 / MAX_RATIO) * PLOT_W} height={PLOT_H}
          fill="rgba(0,255,128,0.04)"
        />
        <text
          x={PAD.left + (2.1 / MAX_RATIO) * PLOT_W} y={PAD.top + 14}
          fontSize="9" fill="#00ff80" opacity={0.5}
        >
          SAFE ZONE  (fs ≥ 2fm)
        </text>

        {/* Nyquist boundary line at ratio = 2 */}
        <line
          x1={PAD.left + (2 / MAX_RATIO) * PLOT_W} y1={PAD.top}
          x2={PAD.left + (2 / MAX_RATIO) * PLOT_W} y2={PAD.top + PLOT_H}
          stroke="#ffc800" strokeWidth={1.5} strokeDasharray="5,4"
        />
        <text
          x={PAD.left + (2 / MAX_RATIO) * PLOT_W + 3} y={midY - 6}
          fontSize="9" fill="#ffc800"
        >
          Nyquist = 2
        </text>

        {/* Centre line */}
        <line
          x1={PAD.left} y1={midY}
          x2={W - PAD.right} y2={midY}
          stroke="#0d2030" strokeWidth={1}
        />

        {/* Current ratio indicator */}
        <line
          x1={pointX} y1={PAD.top + 4}
          x2={pointX} y2={PAD.top + PLOT_H - 4}
          stroke={dotColor} strokeWidth={1.5} opacity={0.6}
        />
        <circle cx={pointX} cy={midY} r={7} fill={dotColor} />
        <text x={pointX} y={midY - 14} textAnchor="middle" fontSize="10" fill={dotColor} fontWeight="bold">
          {ratio > MAX_RATIO ? `>${MAX_RATIO}` : ratio.toFixed(2)}
        </text>

        {/* X axis */}
        <line
          x1={PAD.left} y1={PAD.top + PLOT_H}
          x2={W - PAD.right} y2={PAD.top + PLOT_H}
          stroke="#1a3a5a"
        />
        {ticks.map((v) => {
          const x = PAD.left + (v / MAX_RATIO) * PLOT_W;
          return (
            <g key={v}>
              <line x1={x} y1={PAD.top + PLOT_H} x2={x} y2={PAD.top + PLOT_H + 4} stroke="#1a3a5a" />
              <text x={x} y={H - 8} textAnchor="middle" fontSize="9" fill="#3a6a8a">{v}</text>
            </g>
          );
        })}

        <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="9" fill="#2a5a7a">
          fs/fm
        </text>
      </svg>
    </div>
  );
}
