import React from 'react';

export default function Panel3Adjust({ isActive, goToStep }) {
  return (
    <section id="panel3" className={`step-panel${isActive ? ' active' : ''}`}>
      <h2 className="panel-title">✏️ Ajustar tiempos</h2>
      <p className="panel-subtitle">Arrastra las frases en la línea de tiempo o edita los valores.</p>

      {/* ── Voice colors (editable from this step too) ── */}
      <div className="voice-config-panel voice-config-adj">
        <div className="voice-config-header">
          <div>
            <span className="voice-config-title">🎤 Colores de cantantes</span>
            <span className="voice-config-hint">Los cambios se reflejan en el video exportado</span>
          </div>
        </div>
        <div className="voice-config-rows">
          {[
            { id: 1, name: 'Voz 1', color: '#FF6B6B' },
            { id: 2, name: 'Voz 2', color: '#4ECDC4' },
            { id: 3, name: 'Voz 3', color: '#FFE66D' },
            { id: 4, name: 'Voz 4', color: '#C084FC' },
          ].map(v => (
            <div key={v.id} id={`adj_voiceRow_${v.id}`} className="voice-row" style={{ '--vc': v.color, display: v.id > 2 ? 'none' : '' }}>
              <label id={`adj_voiceSwatch_${v.id}`} className="voice-row-swatch" htmlFor={`adj_voiceColor_${v.id}`} style={{ background: v.color }} title="Haz clic para cambiar color" />
              <input type="text" id={`adj_voiceName_${v.id}`} className="voice-name-input" defaultValue={v.name} />
              <input type="color" id={`adj_voiceColor_${v.id}`} className="voice-color-picker" defaultValue={v.color} />
            </div>
          ))}
          <div id="adj_voiceRow_all" className="voice-row voice-row-all" style={{ '--vc': '#FFFFFF' }}>
            <label id="adj_allVoiceSwatch" className="voice-row-swatch" htmlFor="adj_allVoiceColor" style={{ background: '#FFFFFF' }} title="Haz clic para cambiar color" />
            <span className="voice-all-label">Todos juntos</span>
            <input type="color" id="adj_allVoiceColor" className="voice-color-picker" defaultValue="#FFFFFF" />
          </div>
        </div>
      </div>

      <div className="adjust-layout">
        {/* Transport */}
        <div className="adjust-player">
          <button id="adjPlayBtn" className="btn btn-primary" style={{ minWidth: '44px' }}>▶</button>
          <div className="time-display">
            <span id="adjCurrentTime">0:00</span>
            <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>/</span>
            <span id="adjTotalTime" style={{ color: 'var(--text-dim)' }}>0:00</span>
          </div>
          <input id="adjSeekBar" type="range" className="seek-bar" min="0" step="0.01" defaultValue="0" style={{ flex: 1 }} />
        </div>

        {/* Timeline */}
        <div className="timeline-toolbar">
          <span className="timeline-toolbar-label">📍 Línea de tiempo</span>
          <div className="timeline-zoom-controls">
            <button id="adjZoomOut" className="zoom-btn" title="Alejar">−</button>
            <span id="adjZoomLabel" className="zoom-label">1×</span>
            <button id="adjZoomIn" className="zoom-btn" title="Acercar">+</button>
            <button id="adjZoomFit" className="zoom-btn zoom-btn-fit" title="Canción completa">⊙</button>
          </div>
        </div>
        <div className="timeline-wrapper">
          <canvas id="timelineCanvas" className="timeline-canvas" />
        </div>

        {/* Karaoke preview */}
        <div className="preview-section">
          <h3>🎤 Vista previa karaoke</h3>
          <div className="karaoke-preview">
            <div id="kpPrev" className="kp-prev" />
            <div id="kpCurrent" className="kp-current">—</div>
            <div id="kpNext" className="kp-next" />
          </div>
        </div>

        {/* Adjust table */}
        <div className="adjust-list-wrap">
          <table className="adjust-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="col-voice-th">Voz</th>
                <th>Frase</th>
                <th>Tiempo</th>
                <th className="col-dur">Dur.</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="adjustTableBody" />
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div className="panel-footer">
        <button className="btn btn-ghost" onClick={() => goToStep(2)}>← Volver</button>
        <button id="goToExportBtn" className="btn btn-primary" onClick={() => goToStep(4)}>
          Exportar →
        </button>
      </div>
    </section>
  );
}
