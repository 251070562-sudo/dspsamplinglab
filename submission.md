# Project Title

**DSP Sampling Lab** — Interactive 3D Visualization of the Sampling Theorem, Nyquist Criterion & Aliasing

---

## Problem Statement Fit

> *"I know the formula fs ≥ 2fm — but I still don't understand why aliasing happens."*
> — Every DSP student, ever.

The Nyquist–Shannon Sampling Theorem is one of the most important results in all of engineering. It is also one of the most poorly taught. Students memorize the inequality. They draw static 2D diagrams. They move on — without ever truly seeing what happens when the theorem is violated.

**DSP Sampling Lab fixes this.**

We built a fully interactive virtual DSP laboratory where moving a single slider immediately shows you the complete consequence — in the time domain, the frequency domain, the reconstruction, and the error — all at once, all in real time.

When you drag fs below the Nyquist rate:
- The sample stems on the 3D oscilloscope turn **red**
- The alias frequency appears in the analysis panel
- Spectral replicas visibly overlap in the spectrum view
- The reconstructed signal **diverges** from the original
- The RMS error spikes
- The status badge changes to **⚠ ALIASING DETECTED**

Every single one of these changes is driven by real DSP mathematics — not animations, not pre-programmed responses, not fake data.

---

## Target Users

| Who | Why This Helps |
|---|---|
| ECE / EEE undergraduate students | See the cause-and-effect of sampling in real time instead of memorising static diagrams |
| DSP instructors | First interactive classroom demo tool that shows all domains simultaneously |
| Self-learners | Experiment safely without signal generators or oscilloscopes |
| Hackathon judges | Live, working proof of DSP understanding — not a mockup |

**The core problem:** No existing tool connects fm, fs, aliasing, spectral replicas, reconstruction, and error in a single synchronized live view. Until now.

---

## What We Built

A **production-quality, fully functional** single-page web application that implements the complete DSP sampling pipeline — entirely in the browser, with no backend, no server, no fake data.

The pipeline runs on every parameter change:

```
Change fm or fs
      ↓
DSP engine computes x[n] = x(n·Ts)
      ↓
Nyquist criterion evaluated: fs ≥ 2·fm ?
      ↓
Alias frequency calculated: f_alias = fold(fm mod fs)
      ↓
3D oscilloscope updates live
      ↓
Sinc reconstruction runs: x_r(t) = Σ x[n]·sinc(t/Ts − n)
      ↓
Error metrics computed: RMS, Max|ε|, Relative %
      ↓
Spectrum updates with moving replicas
      ↓
Status: SAFE / NYQUIST BOUNDARY / ALIASING DETECTED
```

Every number on screen comes from this pipeline. **Nothing is hard-coded.**

---

## Core Features

- **Live 3D Oscilloscope** — Three.js WebGL canvas showing x(t), x[n] sample stems, and x_r(t) simultaneously. Wave scrolls in real time like a real oscilloscope. Orbit, zoom, pan. Error overlay toggle. FPS counter.
- **Real-Time DSP Engine** — Correct implementation of x(t) = A·sin(2π·fm·t + φ), discrete sampling, Nyquist check, alias frequency via modular folding, and Whittaker–Shannon sinc interpolation reconstruction.
- **Live Analysis Panel** — Signal Parameters, Sampling Info, and Reconstruction Error in collapsible cards, updating every frame. Status badge: ✔ SAFE / △ BOUNDARY / ⚠ ALIASING.
- **Frequency Spectrum** — SVG view with original component at fm and spectral replicas at k·fs±fm that move dynamically as fs changes. Overlap warning pulses when aliasing occurs.
- **Sampling Ratio Graph** — Visual zone plot showing exactly where safe sampling ends and aliasing begins.
- **Nyquist Demo Mode** — One-click automated walkthrough: fs = 50 → 30 → 20 → 18 → 15 Hz. Each step includes a live diagnostic panel with specific fix instructions (e.g. *"Increase fs by 2 Hz to eliminate aliasing"*).
- **Control Panel** — Sliders and numeric inputs for fm, fs, amplitude, phase, and duration. All inputs validated — rejects NaN, Infinity, and out-of-range values.
- **Snapshot System** — Save, load, export, and import experiment states as JSON. All imports are security-validated against prototype pollution, XSS, and oversized payloads.
- **4 UI Themes** — Cyber Dark, Amber Lab, Matrix Green, Violet Storm — switchable live from the top bar.

---

## Technical Architecture

**Design principle:** One pipeline. One store. Everything in sync.

All DSP calculations live in a single Zustand store. Every parameter change triggers the full pipeline atomically: `computeMetrics → generateReconstructedSignal → computeErrorMetrics → getSpectralReplicas`. No component ever holds its own DSP state. No value is ever stale.

```
src/
  dsp/         engine.js          ← Sampling, Nyquist, alias math
               reconstruction.js  ← Whittaker–Shannon sinc interpolation
               errorMetrics.js    ← RMS, Max|ε|, Relative error
  utils/       validation.js      ← Bounds checking + snapshot security
               snapshot.js        ← Serialization + localStorage
  store/       useDSPStore.js     ← Single source of truth (Zustand)
               useThemeStore.js   ← 4-theme CSS variable injection
  components/  Waveform3D         ← Three.js imperative WebGL canvas
               ControlPanel       ← Validated sliders + numeric inputs
               LiveStatus         ← Real-time collapsible metrics
               SpectrumPanel      ← SVG frequency domain
               DemoMode           ← Animated demo + live diagnostics
               ThemePicker        ← Theme switcher popup
               ... and more
tests/         dsp.test.js        ← 25 unit tests
public/        _headers           ← HTTP security headers
```

**Key decisions:**
- Pure imperative Three.js (no wrapper) → smaller bundle, no Babel/ESM issues
- BufferGeometry updated in-place every frame → stable 60 FPS, no scene rebuild
- CSS custom properties for theming → full UI theme switch with zero re-renders

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 |
| Build | Vite 6.4 |
| 3D Rendering | Three.js 0.160 (pure imperative) |
| State | Zustand 4 |
| Testing | Vitest 3 — 25/25 tests passing |
| Charts | Pure SVG — no Chart.js, no D3 |
| Styling | CSS Custom Properties — no Tailwind, no UI library |
| Typography | IBM Plex Sans + IBM Plex Mono |
| Storage | localStorage (snapshots + theme) |
| Security | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy |

---

## Innovation / Uniqueness

**1. Mathematically correct aliasing — not a visual trick.**
The alias frequency uses the exact DSP formula: `f_alias = (fm mod fs) > fs/2 ? fs − (fm mod fs) : (fm mod fs)`. It matches the textbook derivation and produces correct results at every parameter combination including edge cases.

**2. Real sinc reconstruction — not a redraw.**
The reconstructed signal is computed from the Whittaker–Shannon formula on every animation frame. When aliasing occurs, the reconstruction genuinely fails and this failure is measurable through live error metrics and visible as a diverging curve.

**3. Diagnostic-guided demo — not just a slideshow.**
The Nyquist demo generates context-aware fix instructions from the actual current values. It tells you the exact Hz amount to change, not just that aliasing exists.

**4. Fully atomic pipeline — nothing is ever stale.**
Every derived value updates in one computation cycle. The waveform, spectrum, error metrics, and status badge are always perfectly consistent with each other.

**5. Security-hardened from day one.**
Snapshot imports validated against prototype pollution, XSS, schema violations, and oversized payloads. HTTP headers hardened (CSP, HSTS, X-Frame-Options). Source maps disabled in production. 25 security and DSP unit tests.

---

## Demo Instructions

```bash
npm install
npm run dev
```

Open **http://localhost:5173** on a desktop browser (1280px+ recommended).

**2-minute judge walkthrough:**

| Step | Action | What you see |
|---|---|---|
| 1 | App loads | fs=25, fm=10 → SAFE. Wave scrolls, stems visible. |
| 2 | Click **DEMO** → **▶ RUN NYQUIST DEMO** | Automated 5-step aliasing progression with live diagnostics |
| 3 | Drag **fs slider** below 20 Hz | Stems turn red, alias frequency appears, spectrum overlaps |
| 4 | Click **⚙ gear** icon | Switch between 4 themes instantly |
| 5 | Click any bottom card | Full-screen popup with detailed analysis |
| 6 | Click **ERROR** in 3D toolbar | Error curve ε(t) overlaid on the waveform |

```bash
npm run build     # ✓ Built in ~1.6s — zero errors
npm test          # ✓ 25/25 tests pass
```

---

## Known Limitations

- Desktop-optimized layout (1280px+ recommended) — three-column grid does not fully adapt to mobile screens
- Sinc reconstruction uses a ±24-sample sliding window for real-time performance, not the theoretically infinite sum
- Sample stem rendering capped at 50 stems per frame to maintain 60 FPS at high sampling frequencies
- Signal source is purely mathematical — no real-time audio or hardware ADC input
- Server response header and DNSSEC are controlled by CDN infrastructure, not configurable from application code

---

## Future Work

- Real-time microphone input via Web Audio API
- Multi-signal mode (sum of sinusoids) for wideband aliasing demonstration
- Full mobile-responsive layout
- Animated anti-aliasing filter visualization in the frequency domain
- Collaborative sessions with shared real-time simulation state
- PDF export of experiment summary and error metrics
- Noise channel to demonstrate SNR degradation near the Nyquist boundary
