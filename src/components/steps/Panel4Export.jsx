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
              <div id="introStyleGrid" />

              <label className="field-label">Transición de entrada</label>
              <div id="introTransitionGrid" />

              <div className="toggle-row" style={{ marginTop: '8px' }}>
                <label className="toggle-label">
                  <input id="introSameTransOutToggle" type="checkbox" defaultChecked />
                  <span>Usar misma transición para salida</span>
                </label>
              </div>

              <label className="field-label" id="introTransOutLabel" style={{ opacity: 0.4 }}>Trans. de salida</label>
              <div id="introTransitionOutGrid" style={{ opacity: 0.4, pointerEvents: 'none' }} />

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

              <div className="typo-subgroup-label" style={{ marginTop: '10px' }}>🔤 Tipografía del intro</div>

              <label className="field-label">Fuente del título</label>
              <select id="introTitleFontSelect" className="field-select">
                <option value="">— Usar fuente global —</option>
                {['Segoe UI','Arial','Verdana','Impact','Georgia','Times New Roman','Courier New','Trebuchet MS','Futura','Comic Sans MS'].map(f => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>

              <label className="field-label">Fuente del artista</label>
              <select id="introArtistFontSelect" className="field-select">
                <option value="">— Igual que título —</option>
                {['Segoe UI','Arial','Verdana','Impact','Georgia','Times New Roman','Courier New','Trebuchet MS','Futura','Comic Sans MS'].map(f => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>

              <label className="field-label">✨ Brillo del título</label>
              <div className="slider-row">
                <input id="introTitleGlowSlider" type="range" className="slider" min="0" max="3" step="0.1" defaultValue="1.0" />
                <span id="introTitleGlowVal" className="slider-val">1.0×</span>
              </div>

              <label className="field-label">✨ Brillo del artista</label>
              <div className="slider-row">
                <input id="introArtistGlowSlider" type="range" className="slider" min="0" max="3" step="0.1" defaultValue="0.6" />
                <span id="introArtistGlowVal" className="slider-val">0.6×</span>
              </div>

              <div className="typo-subgroup-label">🌑 Sombra del título</div>
              <div className="color-row">
                <div className="color-item">
                  <label className="field-label">Color sombra</label>
                  <input id="introTitleShadowColorPicker" type="color" className="color-picker" defaultValue="#000000" />
                </div>
              </div>
              <label className="field-label">Difusión de sombra</label>
              <div className="slider-row">
                <input id="introTitleShadowBlurSlider" type="range" className="slider" min="0" max="40" step="1" defaultValue="0" />
                <span id="introTitleShadowBlurVal" className="slider-val">0px</span>
              </div>
              <label className="field-label">Desplazamiento Y</label>
              <div className="slider-row">
                <input id="introTitleShadowOffsetSlider" type="range" className="slider" min="-20" max="20" step="1" defaultValue="2" />
                <span id="introTitleShadowOffsetVal" className="slider-val">2px</span>
              </div>

              <div className="typo-subgroup-label">🌑 Sombra del artista</div>
              <div className="color-row">
                <div className="color-item">
                  <label className="field-label">Color sombra</label>
                  <input id="introArtistShadowColorPicker" type="color" className="color-picker" defaultValue="#000000" />
                </div>
              </div>
              <label className="field-label">Difusión de sombra</label>
              <div className="slider-row">
                <input id="introArtistShadowBlurSlider" type="range" className="slider" min="0" max="40" step="1" defaultValue="0" />
                <span id="introArtistShadowBlurVal" className="slider-val">0px</span>
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


            </div>
          </div>

          {/* Outro del video */}
          <div className="settings-section collapsed" id="sec-outro">
            <div className="settings-section-header">
              <div className="settings-section-title">🎬 Outro del video</div>
              <button className="sec-collapse-btn" data-sec="sec-outro" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">

              <div className="toggle-row">
                <label className="toggle-label">
                  <input id="outroEnabledToggle" type="checkbox" />
                  <span>Activar carta de cierre</span>
                </label>
              </div>

              <div className="toggle-row">
                <label className="toggle-label">
                  <input id="outroMirrorToggle" type="checkbox" defaultChecked />
                  <span>Espejo del intro (misma config)</span>
                </label>
              </div>
              <button id="outroCopyIntroBtn" className="btn btn-ghost btn-sm" style={{ marginBottom: '8px', width: '100%' }}>
                ↩ Copiar configuración del intro
              </button>

              <label className="field-label">Título</label>
              <input id="outroTitleInput" type="text" className="field-input" placeholder="Nombre de la canción..." />

              <label className="field-label">Artista / Banda</label>
              <input id="outroArtistInput" type="text" className="field-input" placeholder="Nombre del artista..." />

              <label className="field-label">Duración</label>
              <div className="slider-row">
                <input id="outroDurationSlider" type="range" className="slider" min="2" max="12" step="0.5" defaultValue="4" />
                <span id="outroDurationVal" className="slider-val">4.0s</span>
              </div>

              <label className="field-label">Estilo visual</label>
              <div id="outroStyleGrid" />

              <label className="field-label">Transición de entrada</label>
              <div id="outroTransitionGrid" />

              <div className="color-row" style={{ marginTop: '8px' }}>
                <div className="color-item">
                  <label className="field-label">Color título</label>
                  <input id="outroTitleColorPicker" type="color" className="color-picker" defaultValue="#ffffff" />
                </div>
                <div className="color-item">
                  <label className="field-label">Color artista</label>
                  <input id="outroArtistColorPicker" type="color" className="color-picker" defaultValue="#c0a0ff" />
                </div>
              </div>

              <label className="field-label">Tamaño del título</label>
              <div className="slider-row">
                <input id="outroTitleSizeSlider" type="range" className="slider" min="0.5" max="1.8" step="0.05" defaultValue="1.0" />
                <span id="outroTitleSizeVal" className="slider-val">1.00×</span>
              </div>

              <label className="field-label">Tamaño del artista</label>
              <div className="slider-row">
                <input id="outroArtistRatioSlider" type="range" className="slider" min="0.2" max="0.8" step="0.05" defaultValue="0.45" />
                <span id="outroArtistRatioVal" className="slider-val">45%</span>
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
              <div id="themeSelector" />
            </div>
          </div>

          {/* Fondo del video */}
          <div className="settings-section collapsed" id="sec-anim">
            <div className="settings-section-header">
              <div className="settings-section-title">🖼️ Fondo del video</div>
              <button className="sec-collapse-btn" data-sec="sec-anim" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">
              <div id="animGrid" />
            </div>
          </div>

          {/* Efecto en primer plano */}
          <div className="settings-section collapsed" id="sec-overlay">
            <div className="settings-section-header">
              <div className="settings-section-title">🎇 Efecto en primer plano</div>
              <button className="sec-collapse-btn" data-sec="sec-overlay" title="Colapsar">▸</button>
            </div>
            <div className="sec-body">
              <div id="overlayGrid" />
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
              <div id="fontSelector" />

              {/* ─── Efectos de texto ─── */}
              <div className="typo-subgroup-label">✨ Efectos</div>
              <div id="textEffectGrid" />

              {/* ─── Estilo de relleno ─── */}
              <div className="typo-subgroup-label">🎯 Relleno karaoke</div>
              <div id="fillEffectGrid" className="anim-grid-row" />

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

              {/* ─── Sombra del texto ─── */}
              <div className="typo-subgroup-label">🌑 Sombra del texto activo</div>

              <label className="field-label">Tipo de sombra</label>
              <div id="textShadowTypeGrid" />

              <div className="color-row" style={{ marginTop: '6px' }}>
                <div className="color-item">
                  <label className="field-label">Color sombra</label>
                  <input id="textShadowColorPicker" type="color" className="color-picker" defaultValue="#000000" />
                </div>
              </div>

              <label className="field-label">Difusión (blur)</label>
              <div className="slider-row">
                <input id="textShadowBlurSlider" type="range" className="slider" min="0" max="50" step="1" defaultValue="12" />
                <span id="textShadowBlurVal" className="slider-val">12px</span>
              </div>

              <label className="field-label">Desplazamiento Y</label>
              <div className="slider-row">
                <input id="textShadowOffsetYSlider" type="range" className="slider" min="-20" max="20" step="1" defaultValue="3" />
                <span id="textShadowOffsetYVal" className="slider-val">3px</span>
              </div>

              {/* ─── Contorno del texto ─── */}
              <div className="typo-subgroup-label">✏️ Contorno del texto activo</div>

              <label className="field-label">Tipo de contorno</label>
              <div id="strokeEffectGrid" />

              <div className="color-row" style={{ marginTop: '6px' }}>
                <div className="color-item">
                  <label className="field-label">Color contorno</label>
                  <input id="strokeColorPicker" type="color" className="color-picker" defaultValue="#000000" />
                </div>
              </div>

              <label className="field-label">Grosor del contorno</label>
              <div className="slider-row">
                <input id="strokeWidthSlider" type="range" className="slider" min="0" max="14" step="1" defaultValue="0" />
                <span id="strokeWidthVal" className="slider-val">0px</span>
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

              {/* ─── Colores por voz ─── */}
              <div className="typo-subgroup-label">🎤 Colores por voz</div>
              <div id="exportVoiceColorsWrap" />

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

          {/* Logo del video */}
          <div className="settings-section" id="sec-logo">
            <div className="settings-section-header">
              <div className="settings-section-title">🖼️ Logo del video</div>
              <button className="sec-collapse-btn" data-sec="sec-logo" title="Colapsar">▾</button>
            </div>
            <div className="sec-body">

              <div className="toggle-row" style={{ alignItems: 'center' }}>
                <label className="toggle-label" style={{ flex: 1 }}>
                  <input id="watermarkToggle" type="checkbox" />
                  <span>Mostrar logo en el video</span>
                </label>
                <img src={new URL('../../logo.svg', import.meta.url).href} alt="logo" className="wm-logo-thumb" />
              </div>

              <label className="field-label">Opacidad</label>
              <div className="slider-row">
                <input id="watermarkOpacitySlider" type="range" className="slider" min="0.03" max="1" step="0.01" defaultValue="0.35" />
                <span id="watermarkOpacityVal" className="slider-val">35%</span>
              </div>

              <label className="field-label">Tamaño</label>
              <div className="slider-row">
                <input id="watermarkSizeSlider" type="range" className="slider" min="0.05" max="0.60" step="0.01" defaultValue="0.22" />
                <span id="watermarkSizeVal" className="slider-val">22%</span>
              </div>

              <label className="field-label">Posición</label>
              <div id="watermarkPosGrid" className="wm-pos-grid">
                <button className="wm-pos-btn" data-pos="tl" title="Arriba izquierda">↖</button>
                <button className="wm-pos-btn" data-pos="tr" title="Arriba derecha">↗</button>
                <button className="wm-pos-btn" data-pos="center" title="Centro">▣</button>
                <button className="wm-pos-btn active" data-pos="br" title="Abajo derecha">↘</button>
                <button className="wm-pos-btn" data-pos="bl" title="Abajo izquierda">↙</button>
                <button className="wm-pos-btn" data-pos="rotate" title="Rotar esquinas">🔄</button>
              </div>

              <label className="field-label" style={{ marginTop: '8px' }}>Efecto visual</label>
              <div id="watermarkEffectGrid" className="wm-pos-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <button className="wm-pos-btn active" data-vfx="none"    title="Sin efecto">⬜ Ninguno</button>
                <button className="wm-pos-btn" data-vfx="glow"    title="Brillo suave">✨ Brillo</button>
                <button className="wm-pos-btn" data-vfx="pulse"   title="Pulso de luz">💫 Pulso</button>
                <button className="wm-pos-btn" data-vfx="outline" title="Contorno blanco">🔲 Contorno</button>
                <button className="wm-pos-btn" data-vfx="stamp"   title="Sello oscilante">🔖 Sello</button>
                <button className="wm-pos-btn" data-vfx="shadow"  title="Sombra profunda">🌑 Sombra</button>
              </div>

              <label className="field-label" style={{ marginTop: '8px' }}>Animación de entrada/salida</label>
              <div id="watermarkAnimGrid" className="wm-pos-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <button className="wm-pos-btn active" data-anim="none"      title="Sin animación">⬜</button>
                <button className="wm-pos-btn" data-anim="fade"      title="Fundido">🌫️</button>
                <button className="wm-pos-btn" data-anim="slide"     title="Deslizar">➡️</button>
                <button className="wm-pos-btn" data-anim="zoom"      title="Zoom">🔍</button>
                <button className="wm-pos-btn" data-anim="coin"      title="Voltear (moneda/medalla)">🪙</button>
                <button className="wm-pos-btn" data-anim="pendulum"  title="Péndulo (medalla colgante)">🏅</button>
                <button className="wm-pos-btn" data-anim="spin"      title="Girar 360°">🌀</button>
                <button className="wm-pos-btn" data-anim="float"     title="Flotar (suave)">🪸</button>
              </div>

              <div className="typo-subgroup-label" style={{ marginTop: '10px' }}>⏱️ Cuándo aparece</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.40)', marginBottom: '6px', lineHeight: 1.4 }}>
                Sin rangos activos: el logo aparece durante todo el video (incluido intro/outro).
              </div>

              {/* Rango 1 */}
              <div className="toggle-row" style={{ marginTop: '4px' }}>
                <label className="toggle-label">
                  <input id="wmR1Toggle" type="checkbox" />
                  <span>Rango 1</span>
                </label>
              </div>
              <div id="wmR1Panel" style={{ display: 'none', paddingLeft: '8px', borderLeft: '2px solid rgba(255,255,255,0.12)', marginBottom: '4px' }}>
                <label className="field-label">Desde</label>
                <div className="slider-row">
                  <input id="wmR1From" type="range" className="slider" min="0" max="600" step="1" defaultValue="0" />
                  <input id="wmR1FromText" type="text" className="slider-val time-text-input" defaultValue="0:00" title="Escribe como M:SS o MM:SS" />
                </div>
                <label className="field-label">Hasta</label>
                <div className="slider-row">
                  <input id="wmR1To" type="range" className="slider" min="0" max="600" step="1" defaultValue="30" />
                  <input id="wmR1ToText" type="text" className="slider-val time-text-input" defaultValue="0:30" title="Escribe como M:SS o MM:SS" />
                </div>
              </div>

              {/* Rango 2 */}
              <div className="toggle-row" style={{ marginTop: '4px' }}>
                <label className="toggle-label">
                  <input id="wmR2Toggle" type="checkbox" />
                  <span>Rango 2</span>
                </label>
              </div>
              <div id="wmR2Panel" style={{ display: 'none', paddingLeft: '8px', borderLeft: '2px solid rgba(255,255,255,0.12)', marginBottom: '4px' }}>
                <label className="field-label">Desde</label>
                <div className="slider-row">
                  <input id="wmR2From" type="range" className="slider" min="0" max="600" step="1" defaultValue="0" />
                  <input id="wmR2FromText" type="text" className="slider-val time-text-input" defaultValue="0:00" title="Escribe como M:SS o MM:SS" />
                </div>
                <label className="field-label">Hasta</label>
                <div className="slider-row">
                  <input id="wmR2To" type="range" className="slider" min="0" max="600" step="1" defaultValue="30" />
                  <input id="wmR2ToText" type="text" className="slider-val time-text-input" defaultValue="0:30" title="Escribe como M:SS o MM:SS" />
                </div>
              </div>

              {/* Rango 3 */}
              <div className="toggle-row" style={{ marginTop: '4px' }}>
                <label className="toggle-label">
                  <input id="wmR3Toggle" type="checkbox" />
                  <span>Rango 3</span>
                </label>
              </div>
              <div id="wmR3Panel" style={{ display: 'none', paddingLeft: '8px', borderLeft: '2px solid rgba(255,255,255,0.12)', marginBottom: '4px' }}>
                <label className="field-label">Desde</label>
                <div className="slider-row">
                  <input id="wmR3From" type="range" className="slider" min="0" max="600" step="1" defaultValue="0" />
                  <input id="wmR3FromText" type="text" className="slider-val time-text-input" defaultValue="0:00" title="Escribe como M:SS o MM:SS" />
                </div>
                <label className="field-label">Hasta</label>
                <div className="slider-row">
                  <input id="wmR3To" type="range" className="slider" min="0" max="600" step="1" defaultValue="30" />
                  <input id="wmR3ToText" type="text" className="slider-val time-text-input" defaultValue="0:30" title="Escribe como M:SS o MM:SS" />
                </div>
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

            <label className="field-label">Grosor de barra</label>
            <div className="slider-row">
              <input id="progressBarThicknessSlider" type="range" className="slider" min="0.5" max="4" step="0.25" defaultValue="1" />
              <span id="progressBarThicknessVal" className="slider-val">1.0×</span>
            </div>

            <label className="field-label">Tamaño del tiempo</label>
            <div className="slider-row">
              <input id="progressTimeSizeSlider" type="range" className="slider" min="0.5" max="2.5" step="0.1" defaultValue="1" />
              <span id="progressTimeSizeVal" className="slider-val">1.0×</span>
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

            {/* ── Pantalla completa: barra de control ── */}
            <div id="fsControls" className="fs-controls">
              <button id="fsPlayBtn" className="fs-btn" title="Reproducir / Pausar">▶</button>
              <input  id="fsSeekBar" type="range" className="fs-seek" min="0" max="100" step="0.1" defaultValue="0" />
              <span  id="fsCurrentTime" className="fs-time">0:00</span>
              <span  id="fsVolIcon" className="fs-icon">🔊</span>
              <input  id="fsVolumeSlider" type="range" className="fs-vol" min="0" max="1" step="0.05" defaultValue="1" title="Volumen" />
              <select id="fsSpeedSelect" className="fs-speed" defaultValue="1" title="Velocidad">
                <option value="0.25">×0.25</option>
                <option value="0.5">×0.5</option>
                <option value="0.75">×0.75</option>
                <option value="1" selected>×1</option>
                <option value="1.25">×1.25</option>
                <option value="1.5">×1.5</option>
                <option value="2">×2</option>
              </select>
              <button id="fsExitBtn" className="fs-btn" title="Salir de pantalla completa">✕</button>
            </div>
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
              <p id="progressDetail" className="progress-detail"></p>
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

