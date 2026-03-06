import React from 'react';

export default function Panel4Export({ isActive, goToStep }) {
  return (
    <section id="panel4" className={`step-panel${isActive ? ' active' : ''}`}>
      <h2 className="panel-title">🎬 Exportar video</h2>
      <p className="panel-subtitle">Personaliza el estilo y graba tu video karaoke.</p>

      <div className="export-layout">
        {/* Left column: settings */}
        <div className="export-settings">
          <h3>🎨 Tema visual</h3>
          <div id="themeSelector" className="theme-selector" />

          <h3>✨ Animación de fondo</h3>
          <div id="animGrid" className="anim-grid" />

          <h3>⚙️ Opciones</h3>

          <label className="field-label" htmlFor="resolutionSelect">Resolución</label>
          <select id="resolutionSelect" className="field-select">
            <option value="1920x1080">1920×1080 (Full HD)</option>
            <option value="1280x720">1280×720 (HD)</option>
            <option value="3840x2160">3840×2160 (4K)</option>
          </select>

          <label className="field-label" htmlFor="fontSizeSlider">Tamaño fuente</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input id="fontSizeSlider" type="range" className="slider" min="28" max="120" defaultValue="56" />
            <span id="fontSizeVal" style={{ minWidth: '50px', textAlign: 'right', fontFamily: 'monospace' }}>56px</span>
          </div>

          <label className="field-label" htmlFor="songTitleInput">Título de la canción</label>
          <input id="songTitleInput" type="text" className="field-input" placeholder="Artista — Título" />

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '4px' }}>
            <div>
              <label className="field-label" htmlFor="activeColorPicker">Color activo</label>
              <input id="activeColorPicker" type="color" className="color-picker" defaultValue="#FFD700" />
            </div>
            <div>
              <label className="field-label" htmlFor="inactiveColorPicker">Color inactivo</label>
              <input id="inactiveColorPicker" type="color" className="color-picker" defaultValue="#FFFFFF" />
            </div>
          </div>
        </div>

        {/* Right column: preview + record */}
        <div className="export-preview-wrap">
          <h3>🎬 Preview</h3>
          <canvas id="exportPreviewCanvas" className="export-canvas" />

          {/* Preview transport */}
          <div className="export-player">
            <button id="exportPlayBtn" className="btn btn-primary" style={{ minWidth: '44px' }}>▶</button>
            <span id="exportCurrentTime" style={{ fontFamily: 'monospace', minWidth: '50px' }}>0:00</span>
            <input id="exportSeekBar" type="range" className="seek-bar" min="0" max="100" step="0.1" defaultValue="0" style={{ flex: 1 }} />
          </div>

          {/* Record actions */}
          <div className="export-actions">
            <div className="export-btns status-idle">
              <button id="previewExportBtn" className="btn btn-secondary">▶ Preview completo</button>
              <button id="startRecordBtn" className="btn btn-success">⏺ Grabar video</button>
            </div>
            <div id="recordProgress" className="progress-wrap hidden">
              <span id="progressLabel">Grabando... 0%</span>
              <div className="progress-bar-outer">
                <div id="progressBarInner" className="progress-bar-inner" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="panel-footer" style={{ justifyContent: 'flex-start' }}>
        <button className="btn btn-ghost" onClick={() => goToStep(3)}>← Volver a Ajustar</button>
      </div>
    </section>
  );
}
