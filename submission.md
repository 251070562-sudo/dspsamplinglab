# 🎛️ DSP Sampling Lab
## Interactive 3D Visualization of the Sampling Theorem, Nyquist Criterion & Aliasing

> *"Don't just learn the Sampling Theorem — see it happen."*

---

## 🏆 Problem Statement

Digital Signal Processing is one of the most mathematically rich yet visually underrepresented fields in engineering education. Students routinely memorize the Nyquist–Shannon Sampling Theorem without ever truly understanding **why** aliasing occurs, **what** it looks like in the time and frequency domains, and **how** reconstruction fails when the theorem is violated.

**DSP Sampling Lab** solves this by replacing static equations with a fully interactive virtual laboratory — where every slider movement triggers a real DSP calculation and updates the entire visualization pipeline in real time.

---

## 👥 Target Users

| User | Pain Point Solved |
|---|---|
| Engineering students (ECE/EEE) | Abstract DSP math with no visual feedback |
| DSP instructors | No interactive demo tool for classroom use |
| Self-learners | Can't experiment without physical hardware |
| Hackathon judges | Live proof of DSP knowledge and implementation depth |

---

## ✅ What We Built

A **production-quality, fully functional** single-page DSP simulation platform.

The complete cause-and-effect pipeline runs on every parameter change:

```
User changes fm or fs
        ↓
DSP engine recalculates samples
        ↓
Nyquist criterion evaluated
        ↓
Alias frequency computed (mathematically)
        ↓
3D oscilloscope animates live
        ↓
Sinc reconstruction recalculates
        ↓
Reconstruction error metrics update
        ↓
Frequency spectrum updates
        ↓
Status badge changes (SAFE / BOUNDARY / ALIASING)
```

**Zero fake data. Zero hard-coded results. Everything is computed from first-principles DSP mathematics.**

---

## 🚀 Core Features

### 1. Live 3D Oscilloscope
- Three.js WebGL canvas with continuous scrolling animation (real oscilloscope feel)
- Simultaneously displays: **x(t)** original (cyan), **x_r(t)** reconstructed (green), **x[n]** sample stems (yellow → red when aliasing)
- Orbit, zoom, pan via OrbitControls
- Adjustable scroll speed slider
- Toggle **ε ERROR** overlay: shows `ε(t) = x(t) − x_r(t)` directly on the waveform
- FPS counter

### 2. Real-Time DSP Engine
- `x(t) = A · sin(2π·fm·t + φ)` — continuous signal
- `Ts = 1/fs` — sampling interval
- `x[n] = x(n·Ts)` — discrete samples
- `fs ≥ 2·fm` — Nyquist criterion check
- Alias frequency via modular folding: `f_mod = fm mod fs`, fold about `fs/2`
- **Whittaker–Shannon sinc interpolation** reconstruction (±24-sample window)
- RMS Error, Max |Error|, Relative Error computed on every update

### 3. Live Analysis Panel (Right Sidebar)
- Three collapsible sections: **Signal Parameters**, **Sampling Info**, **Reconstruction Error**
- All values update in real time
- Color-coded status badge: ✔ SAFE / △ BOUNDARY / ⚠ ALIASING

### 4. Frequency Spectrum View
- SVG frequency-domain visualization
- Original component at fm (neon cyan)
- Spectral replicas at k·fs±fm (animated, move as fs changes)
- Overlap detection with pulsing **⚠ SPECTRAL OVERLAP → ALIASING** warning

### 5. Sampling Ratio Graph
- Visual fs/fm zone plot — green SAFE zone, red ALIASING zone
- Current ratio indicator with glow effect

### 6. Reconstruction Panel
- Side-by-side SVG comparison of x(t) vs x_r(t)
- Error metrics displayed live

### 7. Nyquist Demo Mode (One-Click Presentation)
- Automated walkthrough: fs = 50 → 30 → 20 → 18 → 15 Hz
- Each step shows the DSP state change with description
- **Live Diagnostic Result panel** — tells you exactly what is wrong and how to fix it:
  - *"Increase fs by X Hz to resolve aliasing"*
  - *"Current alias: 10 Hz appears as 5 Hz"*

### 8. Theme Switcher (4 Premium Themes)
| Theme | Style |
|---|---|
| 🔵 Cyber Dark | Navy + Neon Cyan (default) |
| 🟠 Amber Lab | Dark Charcoal + Gold |
| 🟢 Matrix Green | Pure Black + Terminal Green |
| 🟣 Violet Storm | Deep Purple + Magenta |
- Switchable via ⚙ gear icon in top bar
- Persisted to localStorage

### 9. Snapshot System
- Save / Load / Export (JSON) / Import experiment states
- All imports security-validated (schema check, prototype pollution guard, XSS strip, 4096B cap)

### 10. Experiment Summary
- Auto-generated textual report from actual computed values
- Includes observation paragraph contextualised to current DSP state

### 11. Interactive Bottom Info Cards
- 8 compact cards: Spectrum, Ratio, Nyquist, Reconstruction, Alias, Summary, Snapshots, Demo
- Click any card → full-screen popup with detailed analysis

---

## 🏗️ Technical Architecture

```
src/
  dsp/          engine.js           — Sampling, Nyquist, alias frequency
                reconstruction.js   — Whittaker-Shannon sinc interpolation
                errorMetrics.js     — RMS, Max, Relative error
  utils/        validation.js       — Input bounds, snapshot security
                snapshot.js         — Serialization, localStorage
  store/        useDSPStore.js      — Zustand (single source of truth)
                useThemeStore.js    — Theme system (4 themes, CSS vars)
  components/   Waveform3D          — Three.js imperative WebGL canvas
                ControlPanel        — Sliders + validated numeric inputs
                LiveStatus          — Collapsible real-time metrics
                SpectrumPanel       — SVG frequency domain
                RatioGraph          — SVG sampling ratio zones
                ReconstructionPanel — SVG signal comparison
                ExperimentSummary   — Auto-generated report
                SnapshotManager     — Save/load/import/export
                DemoMode            — Animated Nyquist demo + diagnostics
                BottomTabs          — Info cards + popup system
                ThemePicker         — 4-theme switcher with swatches
  styles/       global.css          — CSS custom property design tokens
tests/          dsp.test.js         — 25 unit tests (DSP + security)
public/         _headers            — HTTP security headers
                .well-known/
                  security.txt      — Vulnerability disclosure
```

**Key decisions:**
- DSP pipeline in Zustand store — components only read derived state reactively
- Pure imperative Three.js (no React Three Fiber) — eliminates Babel/ESM issues, smaller bundle
- BufferGeometry updated in-place every frame — no scene rebuild, stable 60 FPS
- CSS custom properties for theming — instant full-UI theme change, zero re-renders

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite 6.4 |
| 3D Rendering | Three.js 0.160 (pure imperative) |
| State Management | Zustand 4 |
| Testing | Vitest 3 |
| Visualization | Pure SVG — no Chart.js, no D3 |
| Styling | CSS Custom Properties — no Tailwind, no UI lib |
| Typography | IBM Plex Sans + IBM Plex Mono |
| Storage | localStorage (snapshots + theme) |
| Security | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy |

---

## 💡 Innovation & Uniqueness

1. **Mathematically correct aliasing** — Not a visual trick. Alias frequency calculated via `f_mod = fm mod fs`, folded about `fs/2`. Matches DSP textbook formula exactly.

2. **Real sinc reconstruction** — Whittaker–Shannon interpolation runs every frame in real time. The difference between original and reconstructed signals is always measurable and visible.

3. **Live oscilloscope feel** — Waveform continuously scrolls like a real oscilloscope. PAUSE/PLAY. Adjustable speed. Three signal layers animate together.

4. **Nyquist Demo with specific fix instructions** — The demo doesn't just show aliasing — it tells you exactly how many Hz to change to fix it.

5. **Full synchronized pipeline** — Every single derived value (Nyquist rate, alias freq, error metrics, spectrum, status) updates atomically on each parameter change. Nothing is stale.

6. **Production security** — Snapshot import validated against prototype pollution, XSS, and oversized payloads. HTTP headers hardened. Source maps disabled. No secrets in code.

---

## 🎮 Demo Instructions

```bash
npm install
npm run dev        # http://localhost:5173
```

**2-minute judge walkthrough:**

| Step | Action | What to observe |
|---|---|---|
| 1 | Click **DEMO** card → **▶ RUN NYQUIST DEMO** | Auto steps through aliasing progression |
| 2 | Drag **fs slider** below 20 Hz | Stems turn red, alias appears, spectrum overlaps |
| 3 | Click **⚙ gear** icon | Switch theme instantly |
| 4 | Click any bottom card | Full popup with detailed analysis |
| 5 | Toggle **ε ERROR** button in 3D toolbar | Error curve appears on waveform |

```bash
npm run build      # ✓ Built in 1.62s — zero errors
npm test           # ✓ 25/25 tests passed
```

---

## ⚠️ Known Limitations

- Desktop-optimized (1280px+ recommended) — mobile layout not fully responsive
- Sinc reconstruction uses ±24-sample window for real-time performance
- Three.js bundle ~666 KB (expected for WebGL application)
- No real-time audio input — signal source is mathematical only
- `Server: AmazonS3` header and DNSSEC are hosting-infrastructure concerns outside app control

---

## 🔭 Future Work

- Real-time microphone input via Web Audio API as signal source
- Multi-signal mode (sum of sinusoids) for advanced spectral aliasing demos
- Full mobile-responsive layout
- Anti-aliasing filter visualization in frequency domain
- Collaborative real-time sessions via WebSocket
- Export experiment as PDF report
- Noise channel for SNR degradation demonstration
