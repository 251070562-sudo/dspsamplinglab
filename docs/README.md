# DSP Sampling Lab — Documentation

## Overview

DSP Sampling Lab is an interactive 3D web application for visualizing the Nyquist–Shannon Sampling Theorem, aliasing, and signal reconstruction in real time.

## Running Locally

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

## Building for Production

```bash
npm run build
```

Output in `dist/` — static files, deployable to any static host.

## Running Tests

```bash
npm test
```

25 unit tests covering:
- DSP engine (sampling, Nyquist, alias frequency)
- Input validation (NaN, Infinity, out-of-range)
- Snapshot security (malformed JSON, oversized payload, XSS)
- Edge cases (extreme sample counts, boundary conditions)

## Architecture

See [submission.md](../submission.md) for full technical architecture and feature documentation.

## Key Files

| File | Purpose |
|---|---|
| `src/dsp/engine.js` | Core DSP math |
| `src/dsp/reconstruction.js` | Sinc interpolation |
| `src/dsp/errorMetrics.js` | RMS/Max/Relative error |
| `src/utils/validation.js` | Input + snapshot security |
| `src/store/useDSPStore.js` | Global state (Zustand) |
| `src/store/useThemeStore.js` | Theme system |
| `src/components/Waveform3D.jsx` | Three.js oscilloscope |
| `tests/dsp.test.js` | 25 unit tests |
| `public/_headers` | HTTP security headers |

## Published Project Details
- **Project Title**: dspsamplinglab
- **Description**: N/A
- **Version**: v22
- **Tags**: N/A

## Git Repository Metadata (Tracked)
- **Repository URL**: https://github.com/251070562-sudo/dspsamplinglab.git
- **Current Branch**: main
- **Last Commit Hash**: ae7b8707e373cfc8a4c61469b650af5b9c0feb34
- **Last Checked**: 9/28/2026, 11:31:23 PM

## AI Prompt Ingest History (Tracked)
| Date & Time | AI Agent / Tool | Prompt | Status |
| :--- | :--- | :--- | :--- |
| 9/23/2026, 7:50:50 PM | `BuilderAgent:generateApi` | Scaffold API controller/route 'HealthCheck' for framework React | success |
| 9/23/2026, 7:50:50 PM | `BuilderAgent:generateComponent` | Scaffold UI component 'MainDashboard' for framework React | success |
| 9/23/2026, 7:50:50 PM | `BuilderAgent:generateProject` | Scaffold project dspsamplinglab using framework React and database None | success |
