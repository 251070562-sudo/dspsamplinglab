/**
 * ThemePicker — small popup triggered by the gear icon in TopBar.
 * Shows 4 theme cards, click to apply instantly.
 */

import React, { useEffect, useRef } from 'react';
import { useThemeStore, THEMES } from '../store/useThemeStore.js';
import './ThemePicker.css';

export default function ThemePicker({ onClose }) {
  const { currentTheme, setTheme } = useThemeStore();
  const ref = useRef(null);

  // Close on Escape or outside click
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onClickOut = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    window.addEventListener('keydown', onKey);
    // slight delay so the opener click doesn't immediately close
    const t = setTimeout(() => document.addEventListener('mousedown', onClickOut), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
      document.removeEventListener('mousedown', onClickOut);
    };
  }, [onClose]);

  return (
    <div className="tp-panel" ref={ref} role="dialog" aria-label="Theme selector">
      <div className="tp-header">
        <span className="tp-title">⚙ THEME</span>
        <button className="tp-close" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="tp-grid">
        {Object.values(THEMES).map((theme) => {
          const active = theme.id === currentTheme.id;
          return (
            <button
              key={theme.id}
              className={`tp-card ${active ? 'tp-card--active' : ''}`}
              onClick={() => { setTheme(theme.id); onClose(); }}
              aria-pressed={active}
              title={theme.name}
            >
              {/* Mini preview swatch */}
              <div
                className="tp-swatch"
                style={{
                  background: theme.vars['--bg'],
                  borderColor: theme.vars['--cyan'],
                  boxShadow: active ? `0 0 12px ${theme.vars['--cyan-glow']}` : 'none',
                }}
              >
                <div className="tp-swatch-line" style={{ background: theme.vars['--cyan'] }} />
                <div className="tp-swatch-dot"  style={{ background: theme.vars['--yellow'] }} />
                <div className="tp-swatch-dot2" style={{ background: theme.vars['--green'] }} />
              </div>

              <div className="tp-info">
                <span className="tp-emoji">{theme.emoji}</span>
                <div>
                  <div className="tp-name">{theme.name}</div>
                  <div className="tp-desc">{theme.desc}</div>
                </div>
              </div>

              {active && <span className="tp-check" aria-hidden="true">✔</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
