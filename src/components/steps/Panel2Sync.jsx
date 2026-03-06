import React from 'react';

export default function Panel2Sync({ isActive, goToStep }) {
  return (
    <section id="panel2" className={`step-panel${isActive ? ' active' : ''}`}>
      <h2 className="panel-title">🥁 Sincronizar letra</h2>
      <p className="panel-subtitle">Reproduce la canción y pulsa TAP en cada frase.</p>

      <div className="sync-layout">
        {/* Left: player + tap */}
        <div className="sync-player">
          {/* Waveform */}
          <div className="waveform-container">
            <canvas id="waveformCanvas" />
            <div id="playhead" className="playhead" />
          </div>

          {/* Transport */}
          <div className="player-controls">
            <button id="syncPlayBtn" className="btn btn-primary" style={{ minWidth: '44px' }}>▶</button>
            <button id="syncRewindBtn" className="btn btn-ghost" style={{ minWidth: '52px' }}>⟵ 5s</button>
            <div className="time-display">
              <span id="currentTime">0:00</span>
              <span style={{ color: 'var(--text-dim)', margin: '0 2px' }}>/</span>
              <span id="totalTime" style={{ color: 'var(--text-dim)' }}>0:00</span>
            </div>
            <input id="seekBar" type="range" className="seek-bar" min="0" step="0.01" defaultValue="0" />
            <div className="volume-wrap">
              <span>🔊</span>
              <input id="volumeBar" type="range" className="volume-bar" min="0" max="1" step="0.01" defaultValue="1" />
            </div>
          </div>

          {/* TAP button */}
          <button id="tapBtn" className="tap-btn">
            <span className="tap-icon">🥁</span>
            <span className="tap-label">TAP</span>
            <span className="tap-hint">[Espacio]</span>
          </button>

          {/* Controls */}
          <div className="sync-instructions">
            <button id="undoLastSync" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>↩ Deshacer</button>
            <button id="resetSyncBtn" className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>🗑 Reiniciar</button>
            <span id="syncProgress" className="sync-badge">0/0 marcados</span>
          </div>
        </div>

        {/* Right: lyrics list */}
        <div className="sync-lyrics-panel">
          <ul id="syncLyricsList" className="sync-lyrics-list" />
        </div>
      </div>

      {/* Navigation */}
      <div className="panel-footer">
        <button className="btn btn-ghost" onClick={() => goToStep(1)}>← Volver</button>
        <button id="goToAdjustBtn" className="btn btn-primary" disabled onClick={() => goToStep(3)}>
          Ajustar →
        </button>
      </div>
    </section>
  );
}
