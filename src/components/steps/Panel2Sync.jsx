import React from 'react';

export default function Panel2Sync({ isActive, goToStep, syncDone, onSaveProject }) {
  return (
    <section id="panel2" className={`step-panel${isActive ? ' active' : ''}`}>
      <h2 className="panel-title">🥁 Sincronizar letra</h2>
      <p className="panel-subtitle">
        Reproduce la canción y pulsa <kbd>Espacio</kbd> o el botón TAP al inicio de cada frase.
      </p>

      <div className="sync-layout">
        {/* ── Left: player + tap ── */}
        <div className="sync-player">

          {/* Waveform */}
          <div className="waveform-container">
            <canvas id="waveformCanvas" />
            <div id="playhead" className="playhead" />
          </div>

          {/* Transport bar */}
          <div className="player-controls">
            <button id="syncPlayBtn" className="btn btn-primary" style={{ minWidth: '44px' }}>▶</button>
            <button id="syncRewindBtn" className="btn btn-ghost btn-sm">⟵ 5s</button>
            <div className="time-display">
              <span id="currentTime">0:00</span>
              <span style={{ color: 'var(--text-dim)', margin: '0 3px' }}>/</span>
              <span id="totalTime" style={{ color: 'var(--text-dim)' }}>0:00</span>
            </div>
            <input id="seekBar" type="range" className="seek-bar" min="0" step="0.01" defaultValue="0" />
            <div className="volume-wrap">
              <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>🔊</span>
              <input id="volumeBar" type="range" className="volume-bar" min="0" max="1" step="0.01" defaultValue="1" />
            </div>
          </div>

          {/* TAP button */}
          <button id="tapBtn" className="tap-btn">
            <span className="tap-icon">🥁</span>
            <span className="tap-label">TAP</span>
            <span className="tap-hint">[Espacio]</span>
          </button>

          {/* Undo / Reset */}
          <div className="sync-instructions">
            <button id="undoLastSync" className="btn btn-ghost btn-sm">↩ Deshacer último</button>
            <button id="resetSyncBtn" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
              🗑 Reiniciar todo
            </button>
          </div>
        </div>

        {/* ── Right: lyrics list ── */}
        <div className="sync-lyrics-panel">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: '8px', borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-dim)', letterSpacing: '0.03em' }}>
              📝 FRASES
            </span>
            <span id="syncProgress" className="sync-badge">0 / 0</span>
          </div>
          <ul id="syncLyricsList" className="sync-lyrics-list" />
        </div>
      </div>

      {/* Navigation */}
      <div className="panel-footer">
        <button className="btn btn-ghost" onClick={() => goToStep(1)}>← Volver</button>
        <button className="btn btn-secondary" onClick={onSaveProject} title="Guardar proyecto">
          💾 Guardar
        </button>
        <button
          id="goToAdjustBtn"
          className="btn btn-primary"
          disabled={!syncDone}
          onClick={() => goToStep(3)}
        >
          Ajustar →
        </button>
      </div>
    </section>
  );
}
