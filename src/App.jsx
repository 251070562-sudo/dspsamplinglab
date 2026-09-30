import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles/global.css';
import './App.css';
import ControlPanel          from './components/ControlPanel.jsx';
import LiveStatus            from './components/LiveStatus.jsx';
import Waveform3D            from './components/Waveform3D.jsx';
import BottomTabs            from './components/BottomTabs.jsx';
import ThemePicker           from './components/ThemePicker.jsx';
import OnboardingTutorial    from './components/OnboardingTutorial.jsx';
import { useDSPStore }       from './store/useDSPStore.js';
import { NyquistStatus }     from './dsp/engine.js';
import { useThemeStore }     from './store/useThemeStore.js';

// ── Error Boundary ─────────────────────────────────────────────────────────
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

// ── Keyboard shortcut hint toast ───────────────────────────────────────────
function ShortcutToast({ msg }) {
  if (!msg) return null;
  return <div className="shortcut-toast">{msg}</div>;
}

// ── Top Bar ────────────────────────────────────────────────────────────────
function TopBar({ onGear, onHelp }) {
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
          <span className="topbar-pill" title="Message frequency">fm = <strong>{fm.toFixed(2)}</strong> Hz</span>
          <span className="topbar-pill" title="Sampling frequency">fs = <strong>{fs.toFixed(2)}</strong> Hz</span>
          <span className="topbar-pill" title="Sampling ratio fs/fm">Ratio = <strong>{ratio.toFixed(2)}×</strong></span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Help button */}
        <button className="topbar-help" onClick={onHelp}
          title="Show tutorial (H)" aria-label="Show tutorial">?</button>
        <span className="topbar-theme-badge" title={`Theme: ${currentTheme.name}`}>
          {currentTheme.emoji}
        </span>
        <div className="topbar-live" style={{ color: liveCol }}
          title={`Status: ${status}`}>
          <span className="topbar-live-dot"
            style={{ background: liveCol, boxShadow: `0 0 10px ${liveCol}` }} />
          LIVE
        </div>
        <button className="topbar-gear" onClick={onGear}
          title="Change theme (T)" aria-label="Open theme picker">⚙</button>
      </div>
    </header>
  );
}

// ── Keyboard shortcuts panel ───────────────────────────────────────────────
function ShortcutsPanel({ onClose }) {
  return (
    <div className="shortcuts-backdrop" onClick={onClose}>
      <div className="shortcuts-box" onClick={e => e.stopPropagation()}>
        <div className="shortcuts-header">
          <span className="shortcuts-title">⌨️ KEYBOARD SHORTCUTS</span>
          <button className="shortcuts-close" onClick={onClose}>✕</button>
        </div>
        <div className="shortcuts-list">
          {[
            ['Space', 'Play / Pause wave'],
            ['R', 'Reset all parameters'],
            ['E', 'Toggle error overlay'],
            ['F', 'Fullscreen oscilloscope'],
            ['T', 'Open theme picker'],
            ['H', 'Show this help / Tutorial'],
            ['Esc', 'Close any popup'],
          ].map(([key, desc]) => (
            <div key={key} className="shortcuts-row">
              <kbd className="shortcuts-key">{key}</kbd>
              <span className="shortcuts-desc">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [showTheme,     setShowTheme]     = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showOnboarding,setShowOnboarding]= useState(false);
  const [toastMsg,      setToastMsg]      = useState('');
  const toastTimer = useRef(null);
  const canvasAreaRef = useRef(null);

  const { currentTheme, setTheme } = useThemeStore();
  const togglePlay  = useDSPStore((s) => s.togglePlay);
  const reset       = useDSPStore((s) => s.reset);
  const toggleError = useDSPStore((s) => s.toggleError);
  const setActiveTab= useDSPStore((s) => s.setActiveTab);

  // Apply theme vars
  useEffect(() => {
    if (currentTheme?.vars) {
      Object.entries(currentTheme.vars).forEach(([k, v]) =>
        document.documentElement.style.setProperty(k, v)
      );
    }
  }, [currentTheme]);

  // Toast helper
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 1500);
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      showToast('⛶ Fullscreen');
    } else {
      document.exitFullscreen().catch(() => {});
      showToast('⊡ Exit fullscreen');
    }
  }, [showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          showToast('⏯ Play / Pause');
          break;
        case 'KeyR':
          reset();
          showToast('↺ Reset');
          break;
        case 'KeyE':
          toggleError();
          showToast('ε Error overlay');
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'KeyT':
          setShowTheme(v => !v);
          showToast('🎨 Theme picker');
          break;
        case 'KeyH':
          setShowShortcuts(v => !v);
          break;
        case 'Escape':
          setShowTheme(false);
          setShowShortcuts(false);
          setShowOnboarding(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, reset, toggleError, toggleFullscreen, showToast]);

  // Show onboarding on first visit — component checks localStorage itself
  // handleHelp resets localStorage so tutorial shows again
  const handleHelp = () => {
    try { localStorage.removeItem('dsp_onboarding_done'); } catch {}
    setShowOnboarding(true);
  };

  return (
    <ErrorBoundary label="Application error.">
      <div className="app-shell">
        <TopBar
          onGear={() => setShowTheme(v => !v)}
          onHelp={handleHelp}
        />

        <div className="app-main">
          <div className="side-panel">
            <ErrorBoundary label="Controls error."><ControlPanel /></ErrorBoundary>
          </div>

          <div className="app-canvas-area" ref={canvasAreaRef}>
            <ErrorBoundary label="3D error."><Waveform3D /></ErrorBoundary>
          </div>

          <div className="side-panel">
            <ErrorBoundary label="Analysis error."><LiveStatus /></ErrorBoundary>
          </div>
        </div>

        <div className="app-bottom">
          <ErrorBoundary label="Bottom error."><BottomTabs /></ErrorBoundary>
        </div>

        {/* Overlays */}
        {showTheme     && <ThemePicker onClose={() => setShowTheme(false)} />}
        {showShortcuts && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}
        <OnboardingTutorial key={showOnboarding} onClose={() => setShowOnboarding(false)} />

        {/* Keyboard shortcut toast */}
        <ShortcutToast msg={toastMsg} />
      </div>
    </ErrorBoundary>
  );
}
