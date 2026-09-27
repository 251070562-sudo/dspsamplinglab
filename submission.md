# DSP Sampling Lab

### Problem Statement Fit

Demonstrates the Sampling Theorem, Nyquist criterion, aliasing, and signal reconstruction — a core DSP concept students struggle to grasp from equations alone. This project provides an interactive virtual laboratory where cause-and-effect relationships between fm, fs, aliasing, and reconstruction become visually and numerically observable in real time.

### Target Users

Undergraduate electrical/computer engineering students, DSP instructors, and hackathon judges evaluating DSP concepts. Pain points addressed: abstract math with no interactive feedback, static textbook graphs, and no safe way to experiment with aliasing parameters without physical hardware.

### What We Built

A production-quality single-page React application implementing a complete DSP experiment loop:

- Change fm / fs → DSP engine recalculates → Nyquist logic runs → alias frequency computed → 3D waveform updates → sinc reconstruction updates → error metrics update → spectrum updates → status badge updates.

Everything updates synchronously from a single Zustand store. No simulated or fake data — all signals are computed from first principles.

### Core Features

- **3D Oscilloscope** — Three.js canvas showing live animated original signal x(t), discrete samples x[n] with stems, and reconstructed signal x_r(t) simultaneously. Orbit, zoom, pan supported. Adjustable scroll speed.
- **Live Analysis Panel** — Real-time fm, fs, Nyquist rate, ratio, Ts, alias frequency, and reconstruction error metrics always visible.
- **Spectrum Panel** — SVG frequency-domain view with original component, spectral replicas at k·fs±fm, overlap detection, and animated alias warning.
- **Reconstruction Panel** — SVG overlay comparing x(t) vs x_r(t) via sinc (Whittaker–Shannon) interpolation with live RMS / max / relative error.
- **Ratio Graph** — Visual fs/fm zone plot with safe/aliasing regions and animated current-value indicator.
- **Control Panel** — Sliders + numeric inputs for fm, fs, amplitude, phase, duration — all validated and clamped.
- **Experiment Summary** — Auto-generated textual report with observation derived from actual values.
- **Nyquist Demo Mode** — One-click animated walkthrough: fs=50→30→20→18→15 Hz showing progression to aliasing.
- **Error Overlay** — Toggle ε(t) = x(t) − x_r(t) in the 3D view with RMS/Max/Relative error metrics.

### Technical Architecture

```
src/
  dsp/          — DSP engine (engine.js, reconstruction.js, errorMetrics.js)
  utils/        — validation.js (input + snapshot security), snapshot.js (serialization)
  store/        — useDSPStore.js (Zustand — single source of truth)
  components/   — ControlPanel, LiveStatus, Waveform3D, SpectrumPanel, RatioGraph,
                  ReconstructionPanel, ExperimentSummary, SnapshotManager,
                  DemoMode, BottomTabs
  styles/       — global.css (CSS custom properties design tokens)
  App.jsx/.css  — 3-column + bottom-row grid layout with error boundary
tests/          — dsp.test.js (24 tests, vitest)
```

DSP pipeline is separated from rendering: the Zustand store runs computeMetrics → generateReconstructedSignal → computeErrorMetrics → getSpectralReplicas on every parameter change. Three.js BufferGeometry is updated in-place each animation frame — no scene rebuild.

### Tech Stack

- **React 18** — UI framework
- **Vite 5** — build tool
- **Three.js 0.160** — 3D rendering (pure imperative, no wrapper libraries)
- **Zustand 4** — state management
- **Vitest 1** — unit testing
- **CSS custom properties** — design token theming (no external UI library)
- **Web Crypto API** — snapshot ID generation
- **localStorage** — snapshot persistence

### Innovation / Uniqueness

- Alias frequency is calculated mathematically via modular folding (`fm mod fs`, then fold about Nyquist) — not faked visually.
- Reconstruction uses genuine Whittaker–Shannon sinc interpolation — not a redraw of the original signal.
- Live animated oscilloscope — wave scrolls in real time at adjustable speed, PAUSE/PLAY supported.
- Spectral replicas computed at k·fs±fm and shown dynamically moving as fs changes.
- Snapshot security treats imported JSON as untrusted: schema validation, prototype pollution guard, XSS sanitization, 4096-byte payload cap, no eval.
- The entire cause-and-effect chain (fm → Nyquist → fs → samples → spectrum → reconstruction → error → status) is always synchronized.

### Demo Instructions

```bash
npm install
npm run dev
```

**Quick judge demo (2 min):**
1. Open the **DEMO** tab → click **▶ RUN NYQUIST DEMO** — watch fm=10 Hz cycle through fs=50→30→20→18→15 Hz automatically.
2. Drag the **fs** slider below 20 Hz — 3D stems turn red, alias frequency appears, spectrum shows overlap.
3. Use **SPEED** slider in 3D toolbar to control wave scroll speed.
4. Toggle **ε ERROR** in the 3D toolbar to see the error curve overlay.

```bash
npm run build
npm test          # 24/24 tests pass
```

### Known Limitations

- Three.js bundle is ~450 KB gzipped — expected for a WebGL 3D application.
- Sample stem rendering is capped at 50 visible stems per frame to maintain 60 FPS.
- Sinc reconstruction uses a ±24-sample window for real-time performance.
- No real-time audio input or hardware ADC integration in the current MVP.

### Future Work

- Real-time microphone input (Web Audio API) as the signal source.
- Multi-signal mode (sum of sinusoids) to demonstrate wider spectral aliasing.
- Animated anti-aliasing filter visualization in the spectrum view.
- Noise channel toggle to show SNR degradation at boundary conditions.
- Export experiment as a PDF report.
