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
