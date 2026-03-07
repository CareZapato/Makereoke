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

          {/* Intro del video */}
          <div className="settings-section" id="sec-intro">
            <div className="settings-section-header">
              <div className="settings-section-title">🎬 Intro del video</div>
              <button className="sec-collapse-btn" data-sec="sec-intro" title="Colapsar">▾</button>
            </div>
            <div className="sec-body">

              <div className="toggle-row">
                <label className="toggle-label">
                  <input id="introEnabledToggle" type="checkbox" />
                  <span>Activar carta de título</span>
                </label>
              </div>

              <label className="field-label">Título de la canción</label>
              <input id="introTitleInput" type="text" className="field-input" placeholder="Nombre de la canción..." />

              <label className="field-label">Artista / Banda</label>
              <input id="introArtistInput" type="text" className="field-input" placeholder="Nombre del artista..." />

              <label className="field-label">Duración</label>
              <div className="slider-row">
                <input id="introDurationSlider" type="range" className="slider" min="2" max="12" step="0.5" defaultValue="4" />
                <span id="introDurationVal" className="slider-val">4.0s</span>
              </div>

              <label className="field-label">Estilo visual</label>
              <div id="introStyleGrid" className="intro-style-grid">
                {[
                  { id: 'minimal',    icon: '☁️',  label: 'Minimal'    },
                  { id: 'bold',       icon: '★',   label: 'Bold'        },
                  { id: 'neon',       icon: '⚡',  label: 'Neon'        },
                  { id: 'cinematic',  icon: '🎞️', label: 'Cinematic'   },
                  { id: 'vintage',    icon: '🎭',  label: 'Vintage'     },
                  { id: 'frame_gold', icon: '🏆',  label: 'Frame Oro'   },
                  { id: 'frame_neon', icon: '🔲',  label: 'Frame Neón'  },
                  { id: 'luxury',     icon: '💎',  label: 'Luxury'      },
                  { id: 'glitch',     icon: '📺',  label: 'Glitch'      },
                  { id: 'aurora',     icon: '🌈',  label: 'Aurora'      },
                  { id: 'magazine',   icon: '📰',  label: 'Magazine'    },
                ].map(s => (
                  <button key={s.id} className={`intro-style-card${s.id === 'bold' ? ' active' : ''}`} data-style={s.id}>
                    <span className="intro-style-icon">{s.icon}</span>
                    <span className="intro-style-label">{s.label}</span>
                  </button>
                ))}
              </div>

              <label className="field-label">Transición</label>
              <div id="introTransitionGrid" className="intro-trans-grid">
                {[
                  { id: 'fade',       label: '✨ Fade'      },
                  { id: 'slide-up',   label: '↑ Slide'     },
                  { id: 'zoom',       label: '🔍 Zoom'     },
                  { id: 'typewriter', label: '⌨️ Type'     },
                  { id: 'blur-in',    label: '🔵 Blur'     },
                  { id: 'bounce',     label: '🏀 Bounce'   },
                  { id: 'glitch-in',  label: '📺 Glitch'   },
                  { id: 'swipe-left', label: '← Swipe'     },
                  { id: 'spin-in',    label: '🔄 Spin'     },
                ].map((t, i) => (
                  <button key={t.id} className={`intro-trans-card${i === 0 ? ' active' : ''}`} data-transition={t.id}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="color-row" style={{ marginTop: '8px' }}>
                <div className="color-item">
                  <label className="field-label">Color título</label>
                  <input id="introTitleColorPicker" type="color" className="color-picker" defaultValue="#ffffff" />
                </div>
                <div className="color-item">
                  <label className="field-label">Color artista</label>
                  <input id="introArtistColorPicker" type="color" className="color-picker" defaultValue="#c0a0ff" />
                </div>
              </div>

              <label className="field-label">Tamaño del título</label>
              <div className="slider-row">
                <input id="introTitleSizeSlider" type="range" className="slider" min="0.5" max="1.8" step="0.05" defaultValue="1.0" />
                <span id="introTitleSizeVal" className="slider-val">1.00×</span>
              </div>

              <label className="field-label">Tamaño del artista</label>
              <div className="slider-row">
                <input id="introArtistRatioSlider" type="range" className="slider" min="0.2" max="0.8" step="0.05" defaultValue="0.45" />
                <span id="introArtistRatioVal" className="slider-val">45%</span>
              </div>

              <div className="toggle-row">
                <label className="toggle-label">
                  <input id="introShowLogoToggle" type="checkbox" defaultChecked />
                  <span>Mostrar logo Makereoke</span>
                </label>
              </div>

            </div>
          </div>

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

          {/* Texto y tipografía (fuente + efectos + parámetros) */}
          <div className="settings-section collapsed" id="sec-typo">
            <div className="settings-section-header">
              <div className="settings-section-title">✍️ Texto y tipografía</div>
              <button className="sec-collapse-btn" data-sec="sec-typo" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">

              {/* ─── Fuente ─── */}
              <div className="typo-subgroup-label">💬 Fuente</div>
              <div className="sec-search-wrap">
                <input type="text" id="fontSearch" className="sec-search" placeholder="Buscar fuente..." />
              </div>
              <div id="fontSelector" className="font-selector" />

              {/* ─── Efectos de texto ─── */}
              <div className="typo-subgroup-label">✨ Efectos</div>
              <div className="sec-search-wrap">
                <input type="text" id="textFxSearch" className="sec-search" placeholder="Buscar efecto..." />
              </div>
              <div id="textEffectGrid" className="anim-grid-row" />

              {/* ─── Parámetros ─── */}
              <div className="typo-subgroup-label">⚙️ Parámetros</div>

              <label className="field-label">Tamaño de fuente</label>
              <div className="slider-row">
                <input id="fontSizeSlider" type="range" className="slider" min="28" max="120" defaultValue="56" />
                <span id="fontSizeVal" className="slider-val">56px</span>
              </div>

              <label className="field-label">Zoom al texto activo</label>
              <div className="slider-row">
                <input id="zoomSlider" type="range" className="slider" min="1" max="1.4" step="0.01" defaultValue="1" />
                <span id="zoomVal" className="slider-val">1.00×</span>
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

              <div className="color-item">
                <label className="field-label">Color inactivo</label>
                <input id="inactiveColorPicker" type="color" className="color-picker" defaultValue="#FFFFFF" />
              </div>

              <div className="typo-subgroup-label">📝 Letras secundarias</div>

              <label className="field-label">Tamaño</label>
              <div className="slider-row">
                <input id="secondarySizeSlider" type="range" className="slider" min="0.3" max="1.0" step="0.02" defaultValue="0.62" />
                <span id="secondarySizeVal" className="slider-val">62%</span>
              </div>

              <label className="field-label">Opacidad</label>
              <div className="slider-row">
                <input id="secondaryOpacitySlider" type="range" className="slider" min="0" max="1" step="0.05" defaultValue="0.65" />
                <span id="secondaryOpacityVal" className="slider-val">65%</span>
              </div>

              <label className="field-label">Distancia letra siguiente</label>
              <div className="slider-row">
                <input id="nextOffsetSlider" type="range" className="slider" min="0.5" max="2.5" step="0.05" defaultValue="1.05" />
                <span id="nextOffsetVal" className="slider-val">1.05</span>
              </div>

              <label className="field-label">Opacidad letra anterior</label>
              <div className="slider-row">
                <input id="prevOpacitySlider" type="range" className="slider" min="0" max="0.6" step="0.02" defaultValue="0.22" />
                <span id="prevOpacityVal" className="slider-val">22%</span>
              </div>



            </div>
          </div>

          {/* Barra de progreso */}
          <div className="settings-section collapsed" id="sec-progress">
            <div className="settings-section-header">
              <div className="settings-section-title">📊 Barra de progreso</div>
              <button className="sec-collapse-btn" data-sec="sec-progress" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">

            <div className="toggle-row">
              <label className="toggle-label">
                <input id="showProgressToggle" type="checkbox" defaultChecked />
                <span>Mostrar barra de progreso</span>
              </label>
            </div>

            <label className="field-label">Opacidad</label>
            <div className="slider-row">
              <input id="progressOpacitySlider" type="range" className="slider" min="0.1" max="1" step="0.05" defaultValue="1" />
              <span id="progressOpacityVal" className="slider-val">100%</span>
            </div>

            <label className="field-label">Estilo</label>
            <div id="progressStyleGrid" className="prog-style-row" />

            <div className="color-row" style={{ marginTop: '8px' }}>
              <div className="color-item">
                <label className="field-label">Color</label>
                <input id="progressBarColorPicker" type="color" className="color-picker" defaultValue="#9c6dff" />
              </div>
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

            <label className="field-label" htmlFor="exportFormatSelect">Formato de exportación</label>
            <select id="exportFormatSelect" className="field-select">
              <option value="mp4">MP4 — H.264 + AAC (compatible)</option>
              <option value="webm">WebM — VP9 + Opus (web)</option>
              <option value="avi">AVI — MJPEG + PCM (clásico)</option>
            </select>
            <p className="field-hint" id="exportFormatHint">MP4 es el formato más compatible con reproductores y editores de video.</p>

            </div>
          </div>

          </div>
        </div>

        {/* ══════════════════════════════
            RIGHT — Preview + record
            ══════════════════════════════ */}
        <div className="export-preview-wrap">

          <div id="exportCanvasWrap" className="export-canvas-wrap">
            <canvas id="exportPreviewCanvas" className="export-canvas" />
            <button id="exportFullscreenBtn" className="export-fullscreen-btn" title="Pantalla completa">⛶</button>
          </div>

          <div className="export-player">
            <button id="exportPlayBtn" className="btn btn-primary" style={{ minWidth: '44px' }}>▶</button>
            <span id="exportCurrentTime" style={{ fontFamily: 'monospace', minWidth: '50px', color: 'var(--text-dim)' }}>0:00</span>
            <input id="exportSeekBar" type="range" className="seek-bar" min="0" max="100" step="0.1" defaultValue="0" style={{ flex: 1 }} />
          </div>

          <div className="export-player-meta">
            <div className="ep-meta-group">
              <span id="exportVolIcon" className="ep-meta-icon" title="Volumen">🔊</span>
              <input id="exportVolumeSlider" type="range" className="ep-mini-slider" min="0" max="1" step="0.05" defaultValue="1" />
            </div>
            <div className="ep-meta-group">
              <span className="ep-meta-icon">⏩</span>
              <select id="exportSpeedSelect" className="ep-speed-select" defaultValue="1">
                <option value="0.25">0.25×</option>
                <option value="0.5">0.5×</option>
                <option value="0.75">0.75×</option>
                <option value="1">1×</option>
                <option value="1.25">1.25×</option>
                <option value="1.5">1.5×</option>
                <option value="2">2×</option>
              </select>
            </div>
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

