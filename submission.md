# DSP Sampling Lab

## Problem Statement Fit

We selected the problem of making the Nyquist–Shannon Sampling Theorem and its real-world consequences — aliasing and signal reconstruction failure — visually and interactively understandable for engineering students.

This theorem is foundational to every electrical and computer engineering curriculum, yet it is almost always taught through static equations and 2D diagrams. Students memorise the formula fs ≥ 2fm without ever seeing why reconstruction breaks down when the condition is violated, or what aliasing actually looks like in the time and frequency domains simultaneously.

DSP Sampling Lab addresses this directly by providing a fully interactive virtual laboratory. Every parameter change immediately triggers the complete DSP pipeline and updates all visualisations in real time — waveform, spectrum, reconstruction, error metrics, and status. Students can watch aliasing appear the moment fs drops below the Nyquist rate, see spectral replicas overlap in the frequency domain, and measure the exact reconstruction error — all from a single interface with no hardware required.

## Target Users

The primary users are undergraduate electrical and computer engineering students studying Digital Signal Processing, Signals and Systems, or Communications.

Secondary users are DSP instructors who need an interactive classroom demonstration tool, and self-learners exploring sampling concepts without access to physical signal generators or oscilloscopes.

The core pain points this project addresses:

- No accessible tool connects message frequency, sampling frequency, aliasing, reconstruction error, and spectral replicas in a single live view
- Static textbook diagrams cannot show how reconstruction quality degrades continuously as the sampling rate decreases
- Experimenting safely with undersampling requires hardware most students do not have
- The cause-and-effect chain from sampling rate to aliasing to reconstruction failure is invisible when learning from equations alone

## What We Built

A fully functional single-page web application that implements a complete DSP experiment loop entirely in the browser with no backend or server-side computation.

The application generates a continuous-time sinusoidal signal, samples it at a user-controlled rate, evaluates the Nyquist criterion, calculates the alias frequency when undersampling occurs, reconstructs the signal from samples using Whittaker–Shannon sinc interpolation, computes reconstruction error metrics, and visualises all of this simultaneously across a live 3D oscilloscope, a frequency spectrum panel, a sampling ratio graph, and a reconstruction comparison panel.

Every value displayed is computed from correct DSP mathematics on every update. Nothing is hard-coded, pre-computed, or faked for display purposes.

## Core Features

- Live 3D oscilloscope (Three.js WebGL) showing the original signal x(t), discrete samples x[n] with vertical stems, and the reconstructed signal x_r(t) simultaneously on an animated scrolling canvas with orbit, zoom, and pan support
- Real-time DSP engine implementing x(t) = A·sin(2π·fm·t + φ), Ts = 1/fs, x[n] = x(n·Ts), Nyquist criterion check, alias frequency calculation via modular folding, and Whittaker–Shannon sinc reconstruction
- Live analysis panel with collapsible sections showing signal parameters (fm, fs, Nyquist rate, ratio, Ts), sampling info (samples captured, alias frequency), and reconstruction error (RMS, Max |Error|, Relative %) — all updating in real time with hover tooltips explaining each metric
- Frequency spectrum view showing the original component at fm and spectral replicas at k·fs±fm that move dynamically as fs changes, with a pulsing overlap warning when aliasing is detected
- Nyquist demo mode — one-click automated walkthrough through fs = 50, 30, 20, 18, 15 Hz with a live diagnostic panel that explains the current state and gives specific numerical fix instructions
- Control panel with sliders and numeric inputs for fm, fs, amplitude, phase, and duration — all validated against bounds, rejecting NaN and Infinity
- Snapshot system to save, load, export, and import experiment states as JSON with full security validation on import
- Four switchable UI themes (Cyber Dark, Amber Lab, Matrix Green, Violet Storm) accessible from the top bar gear icon, persisted to localStorage
- Keyboard shortcuts for all major actions — Space (play/pause), R (reset), E (error overlay), F (fullscreen), T (theme picker), H (help)
- Fullscreen mode for the 3D oscilloscope — triggered via toolbar button or F key
- Onboarding tutorial shown automatically on first visit — 3-step interactive guide covering signal control, aliasing, and demo mode. Accessible anytime via the ? button
- Eight interactive bottom info cards (Spectrum, Ratio, Nyquist, Reconstruction, Alias, Summary, Snapshots, Demo) each opening a full-screen popup with detailed analysis

## Technical Architecture

All DSP calculations are centralised in a single Zustand store. On every parameter change the store runs the full pipeline: computeMetrics → generateReconstructedSignal → computeErrorMetrics → getSpectralReplicas. React components read only the derived state and never perform DSP calculations independently. This ensures every panel always shows consistent, synchronised values.

Three.js is used imperatively without a React wrapper library. BufferGeometry attributes are updated in-place on every animation frame without rebuilding the scene, maintaining stable 60 FPS. The animation loop reads DSP parameters from a mutable ref to avoid React re-renders per frame.

Input validation and snapshot security are centralised in src/utils/validation.js. All numeric inputs are checked against explicit min/max bounds. Snapshot imports are validated against a strict schema, checked for prototype pollution, sanitised for XSS, and capped at 4096 bytes.

```
src/dsp/        engine.js, reconstruction.js, errorMetrics.js
src/utils/      validation.js, snapshot.js
src/store/      useDSPStore.js, useThemeStore.js
src/components/ Waveform3D, ControlPanel, LiveStatus, SpectrumPanel,
                RatioGraph, ReconstructionPanel, ExperimentSummary,
                SnapshotManager, DemoMode, BottomTabs, ThemePicker,
                OnboardingTutorial
tests/          dsp.test.js — 25 unit tests
public/         _headers, .well-known/security.txt
```

## Tech Stack

- React 18 — UI framework
- Vite 6.4 — build tool and dev server
- Three.js 0.160 — 3D WebGL rendering (pure imperative, no wrapper library)
- Zustand 4 — global state management
- Vitest 3 — unit testing (25 tests, all passing)
- CSS Custom Properties — design token theming (no Tailwind, no external UI library)
- IBM Plex Sans + IBM Plex Mono — typography via Google Fonts
- localStorage — snapshot and theme persistence
- Web Crypto API — snapshot ID generation

## Innovation / Uniqueness

The alias frequency is calculated using the exact DSP formula — f_mod = fm mod fs, folded about fs/2 — not approximated or faked visually. This matches the textbook derivation and produces correct results at every parameter combination.

The reconstructed signal uses the actual Whittaker–Shannon interpolation formula running on every animation frame in real time. When aliasing occurs the reconstruction diverges from the original, and this divergence is always quantified through live RMS, Max, and Relative error metrics. The error curve can be overlaid directly on the 3D waveform.

The Nyquist demo generates context-aware fix instructions from the actual current values — it tells the user exactly how many Hz to increase fs to resolve the aliasing condition, not just that aliasing exists.

The entire cause-and-effect chain from a slider movement to all derived values updates atomically in one store computation cycle. No panel ever shows a stale value.

The application includes a first-visit onboarding tutorial, keyboard shortcuts for all major actions, fullscreen oscilloscope mode, hover tooltips explaining every DSP metric, and four premium themes — all without any external UI library.

Security is production-grade: HTTP headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy), snapshot import validation against prototype pollution and XSS, source maps disabled in production, and 25 unit tests covering DSP correctness and security edge cases.

## Demo Instructions

```bash
npm install
npm run dev
```

Open http://localhost:5173 on a desktop browser (1280px width recommended).

On first visit, a 3-step onboarding tutorial appears automatically. Press ? at any time to reopen it.

1. The app loads with fm = 10 Hz and fs = 25 Hz. The 3D oscilloscope shows the wave scrolling live with sample stems and a SAFE status badge.
2. Click the **DEMO** card in the bottom row and click **RUN NYQUIST DEMO**. Watch the automated progression through fs = 50, 30, 20, 18, 15 Hz. The status badge changes from SAFE to NYQUIST BOUNDARY to ALIASING DETECTED. The diagnostic panel shows specific fix instructions at each aliasing step.
3. Manually drag the **fs slider** below 20 Hz. Sample stems turn red, alias frequency appears in the analysis panel, the spectrum shows overlap with a warning, and RMS error increases.
4. Click the **gear icon** (top right) to switch between four themes instantly.
5. Click any bottom card (e.g. RECONSTRUCTION, SPECTRUM) to open a full-screen popup with detailed analysis.
6. Click **ERROR** in the 3D toolbar or press **E** to overlay the reconstruction error curve on the waveform.
7. Press **F** or click the fullscreen button in the 3D toolbar for fullscreen oscilloscope mode.

Keyboard shortcuts: Space (play/pause), R (reset), E (error overlay), F (fullscreen), T (theme), H (help/tutorial).

```bash
npm run build     # production build — completes in ~1.6 seconds, zero errors
npm test          # 25/25 unit tests pass
```

## Known Limitations

- The layout is optimised for desktop screens at 1280px and above. The three-column layout does not adapt to mobile or small tablet screens.
- Sinc reconstruction uses a ±24-sample sliding window for real-time performance rather than the theoretically infinite sum.
- Sample stem rendering is capped at 50 visible stems per frame to maintain frame rate at high sampling frequencies.
- The signal source is purely mathematical — there is no real-time audio input or hardware ADC integration.
- The Server response header disclosing the hosting provider and DNSSEC configuration are controlled by the CDN infrastructure and cannot be changed from application code.

## Future Work

- Real-time microphone input via the Web Audio API to use a live audio signal as the source
- Multi-signal mode supporting a sum of sinusoids to demonstrate wideband aliasing
- Full mobile-responsive layout for the three-column dashboard
- Animated anti-aliasing filter visualisation in the frequency domain
- Collaborative experiment sessions with shared simulation state in real time
- PDF export of the experiment summary and error metrics report
- Noise channel to demonstrate SNR degradation near the Nyquist boundary
