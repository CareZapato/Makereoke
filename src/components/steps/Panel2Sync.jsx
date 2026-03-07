import React from 'react';

export default function Panel2Sync({ isActive, goToStep, syncDone }) {
  return (
    <section id="panel2" className={`step-panel${isActive ? ' active' : ''}`}>
      <h2 className="panel-title">🥁 Sincronizar letra</h2>
      <p className="panel-subtitle sync-subtitle">
        Reproduce la canción y pulsa <kbd>Espacio</kbd> o el botón TAP al inicio de cada frase.
      </p>

      {/* ── Voice configuration (collapsible) ── */}
      <div className="voice-config-panel" id="voiceConfigPanel">
        <div className="voice-config-header">
          <span className="voice-config-title">🎤 Cantantes</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="voice-count-selector">
              {[1, 2, 3, 4].map(n => (
                <button key={n} id={`voiceCountBtn_${n}`} className={`voice-count-btn${n === 2 ? ' active' : ''}`}>{n}</button>
              ))}
            </div>
            <button id="voiceConfigToggle" className="voice-config-toggle" title="Mostrar/ocultar">▾</button>
          </div>
        </div>
        <div className="voice-config-rows" id="voiceConfigRows">
          {[
            { id: 1, name: 'Voz 1',  color: '#FF6B6B' },
            { id: 2, name: 'Voz 2',  color: '#4ECDC4' },
            { id: 3, name: 'Voz 3',  color: '#FFE66D' },
            { id: 4, name: 'Voz 4',  color: '#C084FC' },
          ].map(v => (
            <div key={v.id} id={`voiceRow_${v.id}`} className="voice-row" style={{ '--vc': v.color, display: v.id > 2 ? 'none' : '' }}>
              <label
                id={`voiceSwatch_${v.id}`}
                className="voice-row-swatch"
                htmlFor={`voiceColor_${v.id}`}
                style={{ background: v.color }}
                title="Haz clic para cambiar color"
              />
              <input type="text" id={`voiceName_${v.id}`} className="voice-name-input" defaultValue={v.name} />
              <input type="color" id={`voiceColor_${v.id}`} className="voice-color-picker" defaultValue={v.color} />
            </div>
          ))}
          <div className="voice-row voice-row-all" style={{ '--vc': '#FFFFFF' }}>
            <label
              id="allVoiceSwatch"
              className="voice-row-swatch"
              htmlFor="allVoiceColor"
              style={{ background: '#FFFFFF' }}
              title="Haz clic para cambiar color"
            />
            <span className="voice-all-label">Todos juntos</span>
            <input type="color" id="allVoiceColor" className="voice-color-picker" defaultValue="#FFFFFF" />
          </div>
        </div>
      </div>

      <div className="sync-layout">
        {/* ── Left: player + tap ── */}
        <div className="sync-player">

          {/* Waveform */}
          <div className="waveform-container" id="waveformContainer">
            <canvas id="waveformCanvas" />
            <div id="playhead" className="playhead" />
          </div>

          {/* Zoom controls */}
          <div className="waveform-zoom-bar">
            <button id="waveZoomOut" className="zoom-btn" title="Alejar (−)">−</button>
            <span id="waveZoomLabel" className="zoom-label">1×</span>
            <button id="waveZoomIn" className="zoom-btn" title="Acercar (+)">+</button>
            <button id="waveZoomFit" className="zoom-btn zoom-btn-fit" title="Ver canción completa">⊙</button>
          </div>

          {/* Transport */}
          <div className="sync-transport">
            <div className="sync-transport-row">
              <button id="syncPlayBtn" className="btn btn-primary sync-play-btn">▶</button>
              <button id="syncRewindBtn" className="btn btn-ghost btn-sm">⟵ 5s</button>
              <div className="time-display">
                <span id="currentTime">0:00</span>
                <span style={{ color: 'var(--text-dim)', margin: '0 3px' }}>/</span>
                <span id="totalTime" style={{ color: 'var(--text-dim)' }}>0:00</span>
              </div>
              <div className="volume-wrap">
                <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>🔊</span>
                <input id="volumeBar" type="range" className="volume-bar" min="0" max="1" step="0.01" defaultValue="1" />
              </div>
            </div>
            <input id="seekBar" type="range" className="seek-bar" min="0" step="0.01" defaultValue="0" />
          </div>

          {/* Active voice selector */}
          <div id="voicePills" className="voice-pills" />

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
          <div id="voiceLegend" className="voice-legend" />
          <ul id="syncLyricsList" className="sync-lyrics-list" />
        </div>
      </div>

      {/* Navigation */}
      <div className="panel-footer">
        <button className="btn btn-ghost" onClick={() => goToStep(1)}>← Volver</button>
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
