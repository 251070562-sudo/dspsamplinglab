/**
 * Waveform3D — Pure imperative Three.js, live animated oscilloscope.
 * Wave scrolls in real time like an oscilloscope screen.
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useDSPStore } from '../store/useDSPStore.js';
import { NyquistStatus, continuousSample } from '../dsp/engine.js';
import './Waveform3D.css';

const C_ORIG   = 0x00d9ff;
const C_RECON  = 0x78ff78;

// Read canvas background from CSS custom property (theme-aware)
function getCanvasBg() {
  if (typeof document === 'undefined') return 0x060d14;
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue('--canvas-bg').trim();
  if (!val) return 0x060d14;
  return parseInt(val.replace('#', '0x'), 16) || 0x060d14;
}
const C_SAMPLE = 0xffc800;
const C_ALIAS  = 0xff4466;
const C_ERROR  = 0xff4466;
const C_GRID   = 0x0a1e2e;
const C_AXIS   = 0x1a3a5a;
const C_GUIDE  = 0x0d1820;

const N_PTS     = 512;   // curve resolution
const WINDOW    = 0.8;   // seconds visible — 3-4 clean cycles at fm=10Hz
const MAX_STEMS = 50;
const WIN_SINC  = 24;    // sinc interpolation half-window
const MIN_SPEED = 0.05;
const MAX_SPEED = 2.0;
const DEFAULT_SPEED = 0.3; // slow, smooth, professional on load

// Normalised sinc
function sinc(x) {
  if (Math.abs(x) < 1e-9) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

// Reconstruct at time t using nearest store samples
function reconstruct(t, fm, fs, amplitude, phase) {
  const Ts = 1 / fs;
  const nCenter = t / Ts;
  const nFloor  = Math.floor(nCenter);
  let sum = 0;
  for (let i = nFloor - WIN_SINC; i <= nFloor + WIN_SINC; i++) {
    const sampleVal = continuousSample(i * Ts, fm, amplitude, phase);
    sum += sampleVal * sinc(t / Ts - i);
  }
  return sum;
}

function buildLine(color) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N_PTS * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setDrawRange(0, N_PTS);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
}

export default function Waveform3D() {
  const mountRef  = useRef(null);
  const stateRef  = useRef(null);
  const fpsRef    = useRef(null);
  const speedLabelRef = useRef(null);
  const paramsRef = useRef({});
  const speedRef  = useRef(DEFAULT_SPEED); // mutable speed, no re-render

  // Pull DSP state
  const fm        = useDSPStore((s) => s.fm);
  const fs        = useDSPStore((s) => s.fs);
  const amplitude = useDSPStore((s) => s.amplitude);
  const phase     = useDSPStore((s) => s.phase);
  const nyqStatus = useDSPStore((s) => s.status);
  const isPlaying = useDSPStore((s) => s.isPlaying);
  const showError = useDSPStore((s) => s.showError);
  const toggleError = useDSPStore((s) => s.toggleError);

  // Keep a mutable ref so animation loop always has latest values
  paramsRef.current = { fm, fs, amplitude, phase, nyqStatus, isPlaying, showError };

  // ── Init Three.js once ───────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const bgColor = getCanvasBg();
    renderer.setClearColor(bgColor, 1);
    el.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2, 3, 10);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);

    // Update bg when theme changes — poll every 600ms
    const bgInterval = setInterval(() => {
      const nb = getCanvasBg();
      renderer.setClearColor(nb, 1);
      scene.background.set(nb);
    }, 600);
    scene.background = new THREE.Color(bgColor);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3;
    controls.maxDistance = 28;

    // ── Static geometry ──────────────────────────────────────────────────────

    // Floor grid
    const gPts = [];
    for (let x = -5; x <= 5; x++)      gPts.push(x,-1.6,-2.5, x,-1.6,2.5);
    for (let z = -2.5; z<=2.5; z+=0.5) gPts.push(-5,-1.6,z, 5,-1.6,z);
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gPts), 3));
    scene.add(new THREE.LineSegments(gridGeo,
      new THREE.LineBasicMaterial({ color: C_GRID, transparent: true, opacity: 0.8 })));

    // X/Y axes
    const aPts = new Float32Array([-5.5,0,0, 5.7,0,0,  0,-1.8,0, 0,1.8,0]);
    const aGeo = new THREE.BufferGeometry();
    aGeo.setAttribute('position', new THREE.BufferAttribute(aPts, 3));
    scene.add(new THREE.LineSegments(aGeo, new THREE.LineBasicMaterial({ color: C_AXIS })));

    // Horizontal guides ±0.5 ±1
    const hPts = [];
    for (const y of [-1,-0.5,0.5,1]) hPts.push(-5,y,0, 5,y,0);
    const hGeo = new THREE.BufferGeometry();
    hGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(hPts), 3));
    scene.add(new THREE.LineSegments(hGeo,
      new THREE.LineBasicMaterial({ color: C_GUIDE, transparent: true, opacity: 0.9 })));

    // ── Dynamic lines ────────────────────────────────────────────────────────
    const origLine  = buildLine(C_ORIG);
    const reconLine = buildLine(C_RECON);
    const errLine   = buildLine(C_ERROR);
    errLine.visible = false;
    scene.add(origLine, reconLine, errLine);

    const stemsGroup = new THREE.Group();
    scene.add(stemsGroup);

    // ── Animation loop ────────────────────────────────────────────────────────
    let timeOffset = 0;
    let prevTime   = performance.now();
    let frameCount = 0;
    let lastFps    = performance.now();
    let stemTimer  = 0;
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now   = performance.now();
      const delta = Math.min((now - prevTime) / 1000, 0.05); // cap at 50ms
      prevTime    = now;

      const { fm, fs, amplitude, phase, nyqStatus, isPlaying, showError } = paramsRef.current;
      const Ts = 1 / fs;

      if (isPlaying) timeOffset += delta * speedRef.current;

      // window: [timeOffset - WINDOW, timeOffset]
      const tStart = timeOffset - WINDOW;

      // ── Original waveform ──────────────────────────────────────────────
      {
        const pos = origLine.geometry.attributes.position;
        for (let i = 0; i < N_PTS; i++) {
          const frac = i / (N_PTS - 1);
          const t    = tStart + frac * WINDOW;
          const x    = (frac - 0.5) * 10;
          pos.setXYZ(i, x, continuousSample(t, fm, amplitude, phase), 0);
        }
        pos.needsUpdate = true;
      }

      // ── Reconstructed waveform ─────────────────────────────────────────
      {
        const pos = reconLine.geometry.attributes.position;
        for (let i = 0; i < N_PTS; i++) {
          const frac = i / (N_PTS - 1);
          const t    = tStart + frac * WINDOW;
          const x    = (frac - 0.5) * 10;
          pos.setXYZ(i, x, reconstruct(t, fm, fs, amplitude, phase), 0.04);
        }
        pos.needsUpdate = true;
      }

      // ── Error overlay ──────────────────────────────────────────────────
      errLine.visible = showError;
      if (showError) {
        const pos = errLine.geometry.attributes.position;
        for (let i = 0; i < N_PTS; i++) {
          const frac  = i / (N_PTS - 1);
          const t     = tStart + frac * WINDOW;
          const x     = (frac - 0.5) * 10;
          const orig  = continuousSample(t, fm, amplitude, phase);
          const recon = reconstruct(t, fm, fs, amplitude, phase);
          pos.setXYZ(i, x, orig - recon, 0.08);
        }
        pos.needsUpdate = true;
      }

      // ── Sample stems (rebuild every ~8 frames) ─────────────────────────
      stemTimer++;
      if (stemTimer >= 8) {
        stemTimer = 0;
        while (stemsGroup.children.length) {
          const c = stemsGroup.children[0];
          c.geometry?.dispose();
          stemsGroup.remove(c);
        }

        const isAlias = nyqStatus === NyquistStatus.ALIASING;
        const col = isAlias ? C_ALIAS : C_SAMPLE;
        const mat = new THREE.MeshBasicMaterial({ color: col });
        const sGeo = new THREE.SphereGeometry(0.055, 6, 5);

        // How many stems fit in the window
        const totalSamples = Math.floor(WINDOW / Ts);
        const step = Math.max(1, Math.ceil(totalSamples / MAX_STEMS));

        // First sample index in window
        let n = Math.ceil(tStart / Ts);
        let count = 0;

        while (n * Ts <= timeOffset && count < MAX_STEMS) {
          const t = n * Ts;
          if (t >= tStart) {
            const frac = (t - tStart) / WINDOW;
            const x = (frac - 0.5) * 10;
            const y = continuousSample(t, fm, amplitude, phase);
            const h = Math.max(Math.abs(y), 0.02);

            // Stem
            const stemGeo = new THREE.BoxGeometry(0.022, h, 0.022);
            const stem = new THREE.Mesh(stemGeo, mat);
            stem.position.set(x, y / 2, 0);
            stemsGroup.add(stem);

            // Dot on top
            const dot = new THREE.Mesh(sGeo, mat);
            dot.position.set(x, y, 0);
            stemsGroup.add(dot);
            count++;
          }
          n += step;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // FPS counter
      frameCount++;
      if (now - lastFps >= 800) {
        const fps = Math.round((frameCount * 1000) / (now - lastFps));
        if (fpsRef.current) fpsRef.current.textContent = `${fps} FPS`;
        frameCount = 0;
        lastFps = now;
      }
    };

    animate();

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);
    const w = el.clientWidth || 600, h = el.clientHeight || 400;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    stateRef.current = { renderer, controls, ro };

    return () => {
      clearInterval(bgInterval);
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []); // run once only

  const statusColor =
    nyqStatus === NyquistStatus.ALIASING ? '#ff4466' :
    nyqStatus === NyquistStatus.BOUNDARY ? '#ffc800' : '#00ff80';

  return (
    <div className="waveform3d">
      <div className="waveform3d-bar">
        <span className="waveform3d-icon">∿</span>
        <span className="waveform3d-label">OSCILLOSCOPE — LIVE 3D WAVEFORM</span>
        <div className="waveform3d-controls">
          <div className="w3d-speed">
            <span className="w3d-speed-label">SPEED</span>
            <input
              type="range"
              className="w3d-speed-slider"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={0.05}
              defaultValue={DEFAULT_SPEED}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                speedRef.current = v;
                if (speedLabelRef.current) speedLabelRef.current.textContent = `${v.toFixed(1)}×`;
              }}
              aria-label="Wave scroll speed"
              title="Wave scroll speed"
            />
            <span ref={speedLabelRef} className="w3d-speed-val">{DEFAULT_SPEED.toFixed(1)}×</span>
          </div>
          <button
            className={`w3d-btn ${showError ? 'w3d-btn--on' : ''}`}
            onClick={toggleError}
            aria-pressed={showError}
          >⊕ ERROR</button>
          <span ref={fpsRef} className="w3d-fps">— FPS</span>
        </div>
      </div>

      <div className="waveform3d-legend" aria-hidden="true">
        <span style={{ color: '#00d9ff' }}>── x(t) original</span>
        <span style={{ color: '#78ff78' }}>── x_r(t) reconstructed</span>
        <span style={{ color: statusColor }}>● x[n] samples</span>
        {showError && <span style={{ color: '#ff4466' }}>── ε(t) error</span>}
      </div>

      <div ref={mountRef} className="waveform3d-canvas" aria-hidden="true" />
      <div className="waveform3d-hint">Drag · Scroll · Right-drag to pan</div>
    </div>
  );
}
