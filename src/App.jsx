import React, { useState, useEffect } from 'react';
import './styles/global.css';
import './App.css';
import ControlPanel  from './components/ControlPanel.jsx';
import LiveStatus    from './components/LiveStatus.jsx';
import Waveform3D    from './components/Waveform3D.jsx';
import BottomTabs    from './components/BottomTabs.jsx';
import ThemePicker   from './components/ThemePicker.jsx';
import { useDSPStore }    from './store/useDSPStore.js';
import { NyquistStatus }  from './dsp/engine.js';
import { useThemeStore }  from './store/useThemeStore.js';

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch(e, i) { console.error('[DSP Lab]', e, i?.componentStack); }
  render() {
    if (this.state.err) return (
      <div className="error-fallback" role="alert">
        <span className="error-fallback-icon">⚠</span>
        <p className="error-fallback-title">{this.props.label || 'Rendering error.'}</p>
        <pre className="error-fallback-detail">{this.state.err.message}</pre>
        <button className="error-fallback-btn"
          onClick={() => this.setState({ err: null })}>Retry</button>
      </div>
    );
    return this.props.children;
  }
}

// ── Top Bar ───────────────────────────────────────────────────────────────────
function TopBar({ onGear }) {
  const fm     = useDSPStore((s) => s.fm);
  const fs     = useDSPStore((s) => s.fs);
  const ratio  = useDSPStore((s) => s.ratio);
  const status = useDSPStore((s) => s.status);
  const { currentTheme } = useThemeStore();

  const liveCol =
    status === NyquistStatus.ALIASING ? 'var(--red)'    :
    status === NyquistStatus.BOUNDARY ? 'var(--yellow)' : 'var(--green)';

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-brand-icon">∿</span>
        <span className="topbar-brand-name">DSP</span>
        <span className="topbar-brand-lab">SAMPLING LAB</span>
        <span className="topbar-sep" />
        <span className="topbar-sub">Sampling Theorem Visualization</span>
      </div>

      <div className="topbar-center">
        <div className="topbar-pills">
          <span className="topbar-pill">fm = <strong>{fm.toFixed(2)}</strong> Hz</span>
          <span className="topbar-pill">fs = <strong>{fs.toFixed(2)}</strong> Hz</span>
          <span className="topbar-pill">Ratio = <strong>{ratio.toFixed(2)}×</strong></span>
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-theme-badge" title={`Theme: ${currentTheme.name}`}>
          {currentTheme.emoji}
        </span>
        <div className="topbar-live" style={{ color: liveCol }}>
          <span className="topbar-live-dot"
            style={{ background: liveCol, boxShadow: `0 0 10px ${liveCol}` }} />
          LIVE
        </div>
        <button className="topbar-gear" onClick={onGear}
          title="Change theme" aria-label="Open theme picker">⚙</button>
      </div>
    </header>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [showTheme, setShowTheme] = useState(false);
  const { currentTheme } = useThemeStore();

  // Re-apply theme CSS vars after mount
  useEffect(() => {
    if (currentTheme?.vars) {
      Object.entries(currentTheme.vars).forEach(([k, v]) =>
        document.documentElement.style.setProperty(k, v)
      );
    }
  }, [currentTheme]);

  return (
    <ErrorBoundary label="Application error.">
      <div className="app-shell">
        <TopBar onGear={() => setShowTheme((v) => !v)} />

        <div className="app-main">
          <div className="side-panel">
            <ErrorBoundary label="Controls error."><ControlPanel /></ErrorBoundary>
          </div>
          <div className="app-canvas-area">
            <ErrorBoundary label="3D error."><Waveform3D /></ErrorBoundary>
          </div>
          <div className="side-panel">
            <ErrorBoundary label="Analysis error."><LiveStatus /></ErrorBoundary>
          </div>
        </div>

        <div className="app-bottom">
          <ErrorBoundary label="Bottom error."><BottomTabs /></ErrorBoundary>
        </div>

        {showTheme && <ThemePicker onClose={() => setShowTheme(false)} />}
      </div>
    </ErrorBoundary>
  );
}
