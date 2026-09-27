/**
 * SnapshotManager — save, load, delete, export, import experiment states.
 * All import operations go through the security-validated importSnapshot().
 */

import React, { useRef, useState } from 'react';
import { useDSPStore } from '../store/useDSPStore.js';
import { exportSnapshot, importSnapshot, saveSnapshotsToStorage } from '../utils/snapshot.js';
import './SnapshotManager.css';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function SnapshotManager() {
  const snapshots      = useDSPStore((s) => s.snapshots);
  const saveSnapshot   = useDSPStore((s) => s.saveSnapshot);
  const loadSnapshot   = useDSPStore((s) => s.loadSnapshot);
  const deleteSnapshot = useDSPStore((s) => s.deleteSnapshot);
  const snapshotError  = useDSPStore((s) => s.snapshotError);
  const setSnapshotError = useDSPStore((s) => s.setSnapshotError);
  const clearSnapshotError = useDSPStore((s) => s.clearSnapshotError);

  const [label, setLabel] = useState('');
  const fileRef = useRef();

  const handleSave = () => {
    saveSnapshot(label);
    setLabel('');
  };

  const handleExport = (snap) => {
    const json = exportSnapshot(snap);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dsp-snapshot-${snap.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    clearSnapshotError();
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4096) {
      setSnapshotError('File too large (max 4 KB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      const { snapshot, errors } = importSnapshot(text);
      if (!snapshot) {
        setSnapshotError(`Import failed: ${errors.join(' ')}`);
        return;
      }
      // Add imported snapshot to the list and load it
      const store = useDSPStore.getState();
      const updated = [...store.snapshots, snapshot];
      // Use the already-imported saveSnapshotsToStorage (static import at top)
      saveSnapshotsToStorage(updated);
      useDSPStore.setState({ snapshots: updated });
      loadSnapshot(snapshot);
    };
    reader.onerror = () => setSnapshotError('Failed to read file.');
    reader.readAsText(file);
    // Reset the input so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <div className="snapshot-mgr">
      <div className="snapshot-header">
        <span className="snapshot-badge">SNAP</span>
        <span className="snapshot-title">SNAPSHOT MANAGER</span>
      </div>

      {/* Save row */}
      <div className="snapshot-save-row">
        <input
          className="snapshot-label-input"
          type="text"
          placeholder="Optional label…"
          maxLength={128}
          value={label}
          onChange={(e) => setLabel(e.target.value.replace(/[<>&"']/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          aria-label="Snapshot label"
        />
        <button className="snap-btn snap-btn--save" onClick={handleSave} title="Save snapshot">
          💾 SAVE
        </button>
        <button
          className="snap-btn snap-btn--import"
          onClick={() => fileRef.current?.click()}
          title="Import snapshot from JSON file"
        >
          📂 IMPORT
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
          aria-label="Import snapshot file"
        />
      </div>

      {snapshotError && (
        <div className="snapshot-error" role="alert">⚠ {snapshotError}</div>
      )}

      {/* Snapshot list */}
      <div className="snapshot-list" role="list">
        {snapshots.length === 0 && (
          <p className="snapshot-empty">No snapshots yet. Press SAVE to capture the current state.</p>
        )}
        {[...snapshots].reverse().map((snap) => (
          <div className="snapshot-item" key={snap.id} role="listitem">
            <div className="snapshot-item-info">
              <span className="snapshot-item-label">{snap.label || 'Snapshot'}</span>
              <span className="snapshot-item-meta">
                fm={snap.fm.toFixed(1)} Hz · fs={snap.fs.toFixed(1)} Hz · {formatTime(snap.timestamp)}
              </span>
            </div>
            <div className="snapshot-item-actions">
              <button
                className="snap-btn snap-btn--load"
                onClick={() => loadSnapshot(snap)}
                title="Load this snapshot"
              >
                ▶ LOAD
              </button>
              <button
                className="snap-btn snap-btn--export"
                onClick={() => handleExport(snap)}
                title="Export snapshot as JSON"
              >
                ↓ EXPORT
              </button>
              <button
                className="snap-btn snap-btn--delete"
                onClick={() => deleteSnapshot(snap.id)}
                title="Delete this snapshot"
                aria-label={`Delete snapshot ${snap.label || snap.id}`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
