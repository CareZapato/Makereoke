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
        <div className="export-settings-wrap">

          {/* Toolbar */}
          <div className="export-settings-toolbar">
            <span className="export-settings-toolbar-title">Edición</span>
            <div className="export-settings-toolbar-btns">
              <button id="clearSelectionBtn" className="toolbar-btn" title="Limpiar selección">⬜ Limpiar</button>
              <button id="clearFiltersBtn" className="toolbar-btn" title="Limpiar filtros">🔍 Filtros</button>
              <button id="collapseAllBtn" className="toolbar-btn" title="Colapsar todo">▾ Todo</button>
            </div>
          </div>

          <div className="export-settings">

          {/* Tema */}
          <div className="settings-section" id="sec-theme">
            <div className="settings-section-header">
              <div className="settings-section-title">🎨 Tema visual</div>
              <button className="sec-collapse-btn" data-sec="sec-theme" title="Colapsar">▾</button>
            </div>
            <div className="sec-body">
              <div className="sec-search-wrap">
                <input type="text" id="themeSearch" className="sec-search" placeholder="Buscar tema..." />
              </div>
              <div id="themeCatTabs" className="cat-tabs" />
              <div id="themeSelector" className="theme-selector" />
            </div>
          </div>

          {/* Animación de fondo */}
          <div className="settings-section collapsed" id="sec-anim">
            <div className="settings-section-header">
              <div className="settings-section-title">🌌 Animación de fondo</div>
              <button className="sec-collapse-btn" data-sec="sec-anim" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">
              <div className="sec-search-wrap">
                <input type="text" id="animSearch" className="sec-search" placeholder="Buscar animación..." />
              </div>
              <div id="animGrid" className="anim-grid" />
            </div>
          </div>

          {/* Efecto en primer plano */}
          <div className="settings-section collapsed" id="sec-overlay">
            <div className="settings-section-header">
              <div className="settings-section-title">🎇 Efecto en primer plano</div>
              <button className="sec-collapse-btn" data-sec="sec-overlay" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">
              <div className="sec-search-wrap">
                <input type="text" id="overlaySearch" className="sec-search" placeholder="Buscar efecto..." />
              </div>
              <div id="overlayCatTabs" className="cat-tabs" />
              <div id="overlayGrid" className="anim-grid" />
            </div>
          </div>

          {/* Fuente */}
          <div className="settings-section collapsed" id="sec-font">
            <div className="settings-section-header">
              <div className="settings-section-title">💬 Fuente de texto</div>
              <button className="sec-collapse-btn" data-sec="sec-font" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">
              <div className="sec-search-wrap">
                <input type="text" id="fontSearch" className="sec-search" placeholder="Buscar fuente..." />
              </div>
              <div id="fontSelector" className="font-selector" />
            </div>
          </div>

          {/* Efectos de texto */}
          <div className="settings-section collapsed" id="sec-textfx">
            <div className="settings-section-header">
              <div className="settings-section-title">✨ Efectos de texto activo</div>
              <button className="sec-collapse-btn" data-sec="sec-textfx" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">
              <div className="sec-search-wrap">
                <input type="text" id="textFxSearch" className="sec-search" placeholder="Buscar efecto..." />
              </div>
              <div id="textEffectGrid" className="anim-grid-row" />
            </div>
          </div>

          {/* Texto */}
          <div className="settings-section collapsed" id="sec-text">
            <div className="settings-section-header">
              <div className="settings-section-title">✍️ Texto y posición</div>
              <button className="sec-collapse-btn" data-sec="sec-text" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">

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

            <label className="field-label">Zoom al texto activo</label>
            <div className="slider-row">
              <input id="zoomSlider" type="range" className="slider" min="1" max="1.4" step="0.01" defaultValue="1" />
              <span id="zoomVal" className="slider-val">1.00×</span>
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
          </div>

          {/* Opciones de video */}
          <div className="settings-section collapsed" id="sec-video">
            <div className="settings-section-header">
              <div className="settings-section-title">⚙️ Opciones de video</div>
              <button className="sec-collapse-btn" data-sec="sec-video" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">

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

