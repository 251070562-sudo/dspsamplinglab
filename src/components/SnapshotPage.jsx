/**
 * SnapshotPage — full-screen overlay for saving, loading, exporting,
 * importing experiment snapshots.
 */

import React, { useRef, useState } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { exportSnapshot, importSnapshot, saveSnapshotsToStorage } from '../utils/snapshot.js';
import './SnapshotPage.css';

function formatTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function SnapCard({ snap, onLoad, onExport, onDelete }) {
  return (
    <div className="snap-card">
      <div className="snap-card-top">
        <span className="snap-card-label">{snap.label || 'Untitled Snapshot'}</span>
        <span className="snap-card-id">#{snap.id.slice(0, 8)}</span>
      </div>
      <div className="snap-card-params">
        <span className="snap-param"><em>fm</em> {snap.fm.toFixed(2)} Hz</span>
        <span className="snap-param"><em>fs</em> {snap.fs.toFixed(2)} Hz</span>
        <span className="snap-param"><em>A</em> {snap.amplitude.toFixed(2)}</span>
        <span className="snap-param"><em>φ</em> {snap.phase.toFixed(2)} rad</span>
        <span className="snap-param"><em>T</em> {snap.duration.toFixed(2)} s</span>
      </div>
      <div className="snap-card-bottom">
        <span className="snap-card-time">{formatTime(snap.timestamp)}</span>
        <div className="snap-card-actions">
          <button className="sp-btn sp-btn--load" onClick={() => onLoad(snap)}>▶ LOAD</button>
          <button className="sp-btn sp-btn--export" onClick={() => onExport(snap)}>↓ EXPORT</button>
          <button className="sp-btn sp-btn--delete" onClick={() => onDelete(snap.id)} aria-label="Delete">✕</button>
        </div>
      </div>
    </div>
  );
}

export default function SnapshotPage({ onClose }) {
  const snapshots        = useDSPStore((s) => s.snapshots);
  const saveSnapshot     = useDSPStore((s) => s.saveSnapshot);
  const loadSnapshot     = useDSPStore((s) => s.loadSnapshot);
  const deleteSnapshot   = useDSPStore((s) => s.deleteSnapshot);

  const [label, setLabel]   = useState('');
  const [error, setError]   = useState('');
  const [imported, setImported] = useState(null); // flash on success
  const fileRef = useRef();

  const handleSave = () => {
    saveSnapshot(label);
    setLabel('');
  };

  const handleExport = (snap) => {
    const json = exportSnapshot(snap);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `dsp-snap-${snap.id.slice(0,8)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    setError(''); setImported(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4096) { setError('File too large (max 4 KB).'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { snapshot, errors } = importSnapshot(ev.target?.result);
      if (!snapshot) { setError(`Import failed: ${errors.join(' ')}`); return; }
      const store   = useDSPStore.getState();
      const updated = [...store.snapshots, snapshot];
      saveSnapshotsToStorage(updated);
      useDSPStore.setState({ snapshots: updated });
      loadSnapshot(snapshot);
      setImported(snapshot.id);
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoad = (snap) => { loadSnapshot(snap); onClose(); };

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Snapshot Manager">
      <div className="overlay-panel snappage">

        {/* Header */}
        <div className="overlay-header">
          <div className="overlay-header-left">
            <span className="overlay-badge">SNAP</span>
            <h2 className="overlay-title">SNAPSHOT MANAGER</h2>
            <span className="overlay-subtitle">Save &amp; restore experiment states</span>
          </div>
          <button className="overlay-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Save row */}
        <div className="snappage-save">
          <input
            className="snappage-input"
            type="text"
            placeholder="Label (optional)…"
            maxLength={128}
            value={label}
            onChange={(e) => setLabel(e.target.value.replace(/[<>&"']/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            aria-label="Snapshot label"
          />
          <button className="sp-btn sp-btn--save" onClick={handleSave}>💾 SAVE CURRENT</button>
          <button className="sp-btn sp-btn--import" onClick={() => fileRef.current?.click()}>📂 IMPORT JSON</button>
          <input ref={fileRef} type="file" accept=".json,application/json"
            style={{ display: 'none' }} onChange={handleImport} aria-label="Import file" />
        </div>

        {error && <div className="snappage-error" role="alert">⚠ {error}</div>}
        {imported && <div className="snappage-success" role="status">✔ Snapshot imported &amp; loaded.</div>}

        {/* Stats bar */}
        <div className="snappage-stats">
          <span>{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} saved</span>
          <span className="snappage-stats-note">Max 20 · stored in localStorage</span>
        </div>

        {/* Grid of snapshot cards */}
        <div className="snappage-grid">
          {snapshots.length === 0 && (
            <div className="snappage-empty">
              <span className="snappage-empty-icon">📷</span>
              <p>No snapshots yet.</p>
              <p>Press SAVE CURRENT to capture the experiment state.</p>
            </div>
          )}
          {[...snapshots].reverse().map((snap) => (
            <SnapCard
              key={snap.id}
              snap={snap}
              onLoad={handleLoad}
              onExport={handleExport}
              onDelete={deleteSnapshot}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
