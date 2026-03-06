import React from 'react';

export default function Panel3Adjust({ isActive, goToStep }) {
  return (
    <section id="panel3" className={`step-panel${isActive ? ' active' : ''}`}>
      <h2 className="panel-title">✏️ Ajustar tiempos</h2>
      <p className="panel-subtitle">Arrastra las frases en la línea de tiempo o edita los valores.</p>

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
