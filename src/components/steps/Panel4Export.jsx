import React from 'react';

export default function Panel4Export({ isActive, goToStep }) {
  return (
    <section id="panel4" className={`step-panel${isActive ? ' active' : ''}`}>
      <h2 className="panel-title">🎬 Exportar video</h2>
      <p className="panel-subtitle">Personaliza el estilo y graba tu video karaoke.</p>

      <div className="export-layout">

        {/* ══════════════════════════════
            LEFT — Settings sidebar
            ══════════════════════════════ */}
        <div className="export-settings">

          {/* Tema */}
          <div className="settings-section">
            <div className="settings-section-title">🎨 Tema visual</div>
            <div id="themeSelector" className="theme-selector" />
          </div>

          {/* Animación de fondo */}
          <div className="settings-section">
            <div className="settings-section-title">🌌 Animación de fondo</div>
            <div id="animGrid" className="anim-grid" />
          </div>

          {/* Efecto en primer plano */}
          <div className="settings-section">
            <div className="settings-section-title">🎇 Efecto en primer plano</div>
            <div id="overlayGrid" className="anim-grid" />
          </div>

          {/* Texto */}
          <div className="settings-section">
            <div className="settings-section-title">✍️ Texto y posición</div>

            <label className="field-label">Tamaño de fuente</label>
            <div className="slider-row">
              <input id="fontSizeSlider" type="range" className="slider" min="28" max="120" defaultValue="56" />
              <span id="fontSizeVal" className="slider-val">56px</span>
            </div>

            <label className="field-label">Intensidad de brillo</label>
            <div className="slider-row">
              <input id="glowSlider" type="range" className="slider" min="0" max="3" step="0.1" defaultValue="1" />
              <span id="glowVal" className="slider-val">1.0×</span>
            </div>

            <label className="field-label" htmlFor="textPositionSelect">Posición del texto</label>
            <select id="textPositionSelect" className="field-select">
              <option value="center">Centro</option>
              <option value="lower">Tercio inferior</option>
              <option value="upper">Tercio superior</option>
            </select>

            <label className="field-label" htmlFor="songTitleInput">Título de la canción</label>
            <input id="songTitleInput" type="text" className="field-input" placeholder="Artista — Título" />

            <div className="color-row">
              <div className="color-item">
                <label className="field-label">Color activo</label>
                <input id="activeColorPicker" type="color" className="color-picker" defaultValue="#FFD700" />
              </div>
              <div className="color-item">
                <label className="field-label">Color inactivo</label>
                <input id="inactiveColorPicker" type="color" className="color-picker" defaultValue="#FFFFFF" />
              </div>
            </div>

            <div className="toggle-row">
              <label className="toggle-label">
                <input id="showTitleToggle" type="checkbox" defaultChecked />
                <span>Mostrar título en video</span>
              </label>
            </div>
          </div>

          {/* Opciones de video */}
          <div className="settings-section">
            <div className="settings-section-title">⚙️ Opciones de video</div>

            <label className="field-label" htmlFor="resolutionSelect">Resolución</label>
            <select id="resolutionSelect" className="field-select">
              <option value="1920x1080">1920 × 1080 — Full HD</option>
              <option value="1280x720">1280 × 720 — HD</option>
              <option value="3840x2160">3840 × 2160 — 4K</option>
            </select>

            <label className="field-label" htmlFor="fpsSelect">Fotogramas por segundo</label>
            <select id="fpsSelect" className="field-select">
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
              <option value="24">24 fps cinematográfico</option>
            </select>

            <div className="toggle-row">
              <label className="toggle-label">
                <input id="showProgressToggle" type="checkbox" defaultChecked />
                <span>Mostrar barra de progreso</span>
              </label>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════
            RIGHT — Preview + record
            ══════════════════════════════ */}
        <div className="export-preview-wrap">

          <canvas id="exportPreviewCanvas" className="export-canvas" />

          <div className="export-player">
            <button id="exportPlayBtn" className="btn btn-primary" style={{ minWidth: '44px' }}>▶</button>
            <span id="exportCurrentTime" style={{ fontFamily: 'monospace', minWidth: '50px', color: 'var(--text-dim)' }}>0:00</span>
            <input id="exportSeekBar" type="range" className="seek-bar" min="0" max="100" step="0.1" defaultValue="0" style={{ flex: 1 }} />
          </div>

          <div className="export-actions">
            <div className="export-btns status-idle">
              <button id="previewExportBtn" className="btn btn-secondary">▶ Preview completo</button>
              <button id="startRecordBtn" className="btn btn-success btn-lg">⏺ Grabar video</button>
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

      <div className="panel-footer" style={{ justifyContent: 'flex-start' }}>
        <button className="btn btn-ghost" onClick={() => goToStep(3)}>← Volver a Ajustar</button>
      </div>
    </section>
  );
}

