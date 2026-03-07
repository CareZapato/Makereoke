/* ============================================================
   export-engine.js — Step 4: Export (video recording) (ES module)
   ============================================================ */

import Audio from './audio.js';
import Lyrics from './lyrics.js';
import Renderer from './renderer.js';
import Sync from './sync.js';
import { formatTime, debounce } from './utils.js';
import { Muxer, ArrayBufferTarget } from 'webm-muxer';

const ExportEngine = (() => {

  /* ── State ────────────────────────────────────────────── */
  let currentTheme     = 'classic';
  let currentAnimation = 'none';
  let currentOverlay   = 'none';
  let currentTextPos   = 'center';
  let currentGlow      = 1;
  let currentFont      = 'segoe';
  let currentZoom      = 1;
  let currentTextEffect= 'none';
  let currentProgressStyle = 'bottom';
  let currentProgressOpacity = 1;
  let currentSecondarySize    = 0.62;
  let currentSecondaryOpacity = 0.65;
  let currentNextOffset       = 1.05;
  let currentPrevOpacity      = 0.22;
  // Tracked inactive color state — NOT read from DOM on every frame
  let currentInactiveColor = '#ffffff';
  // AbortController for setup() event re-wiring (prevents duplicate listeners)
  let _setupAbortCtrl = null;
  let previewRaf       = null;
  let recording        = false;

  /* ── DOM refs (set in init) ────────────────────────────────────── */
  let themeSelector, animGrid, overlayGrid;
  let fontSelector, textEffectGrid, progressStyleGrid, zoomSlider, zoomVal;
  let progressOpacitySlider, progressOpacityVal;
  let progressBarColorPicker;
  let secondarySizeSlider, secondarySizeVal;
  let secondaryOpacitySlider, secondaryOpacityVal;
  let nextOffsetSlider, nextOffsetVal;
  let prevOpacitySlider, prevOpacityVal;
  let resolutionSelect, fontSizeSlider, fontSizeVal;
  let glowSlider, glowVal, textPositionSelect, fpsSelect;
  let showProgressToggle;
  let songTitleInput, activeColorPicker, inactiveColorPicker;
  let previewCanvas, exportPlayBtn, exportSeekBar, exportCurrentTime;
  let exportVolumeSlider, exportSpeedSelect, exportFullscreenBtn;
  let startRecordBtn, previewExportBtn;
  let recordProgress, progressBarInner, progressLabel;

  /* ═══════════════════════════════════════════════════════
     Cat-tab + search helpers
  ═══════════════════════════════════════════════════════ */

  /** Build category tab strip above a grid and wire it with optional search input.
   *  gridEl rows must have [data-cat] set before calling this. */
  function buildCatTabsEl(tabsEl, gridEl, categories, rowSelector, searchEl) {
    if (!tabsEl) return;
    tabsEl.innerHTML = '';

    const rows = Array.from(gridEl.querySelectorAll(rowSelector));

    function applyFilter(catId, q) {
      q = (q || '').toLowerCase().trim();
      rows.forEach(row => {
        const rowCat = row.dataset.cat;
        const catMatch = catId === '__all__' || rowCat === catId;
        if (!catMatch) { row.style.display = 'none'; return; }
        if (!q) {
          row.style.display = '';
          row.querySelectorAll('.anim-card, .theme-btn, .font-btn').forEach(c => c.style.display = '');
          return;
        }
        let anyVis = false;
        row.querySelectorAll('.anim-card, .theme-btn, .font-btn').forEach(c => {
          const lbl = c.querySelector('.anim-label, .theme-btn-label, .font-btn-label, .font-btn-preview')?.textContent.toLowerCase() || '';
          const vis = lbl.includes(q);
          c.style.display = vis ? '' : 'none';
          if (vis) anyVis = true;
        });
        row.style.display = anyVis ? '' : 'none';
      });
      gridEl.querySelectorAll('.selector-cat-label').forEach(lbl => {
        lbl.style.display = catId === '__all__' && !q ? '' : 'none';
      });
    }

    const allBtn = document.createElement('button');
    allBtn.className = 'cat-tab active';
    allBtn.textContent = 'Todos';
    allBtn.dataset.cat = '__all__';
    tabsEl.appendChild(allBtn);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'cat-tab';
      btn.textContent = (cat.emoji ? cat.emoji + ' ' : '') + cat.label;
      btn.dataset.cat = cat.id;
      tabsEl.appendChild(btn);
    });

    tabsEl.addEventListener('click', e => {
      const btn = e.target.closest('.cat-tab');
      if (!btn) return;
      tabsEl.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.cat, searchEl?.value || '');
    });

    if (searchEl) {
      searchEl.addEventListener('input', () => {
        const active = tabsEl.querySelector('.cat-tab.active');
        applyFilter(active?.dataset.cat || '__all__', searchEl.value);
      });
    }
  }

  /** Wire a simple text search for flat grids (no categories). */
  function wireSimpleSearch(searchEl, gridEl, cardSelector, labelSelector) {
    if (!searchEl) return;
    searchEl.addEventListener('input', () => {
      const q = searchEl.value.toLowerCase().trim();
      gridEl.querySelectorAll(cardSelector).forEach(c => {
        const lbl = c.querySelector(labelSelector)?.textContent.toLowerCase() || '';
        c.style.display = !q || lbl.includes(q) ? '' : 'none';
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     init() — called once on app boot
  ═══════════════════════════════════════════════════════ */
  function init() {
    themeSelector      = document.getElementById('themeSelector');
    animGrid           = document.getElementById('animGrid');
    resolutionSelect   = document.getElementById('resolutionSelect');
    fontSizeSlider     = document.getElementById('fontSizeSlider');
    fontSizeVal        = document.getElementById('fontSizeVal');
    songTitleInput     = null; // removed from Step 4 UI
    activeColorPicker  = null; // removed from Step 4 UI
    inactiveColorPicker= document.getElementById('inactiveColorPicker');
    previewCanvas      = document.getElementById('exportPreviewCanvas');
    exportPlayBtn      = document.getElementById('exportPlayBtn');
    exportSeekBar      = document.getElementById('exportSeekBar');
    exportCurrentTime  = document.getElementById('exportCurrentTime');
    exportVolumeSlider = document.getElementById('exportVolumeSlider');
    exportSpeedSelect  = document.getElementById('exportSpeedSelect');
    exportFullscreenBtn= document.getElementById('exportFullscreenBtn');
    startRecordBtn     = document.getElementById('startRecordBtn');
    previewExportBtn   = document.getElementById('previewExportBtn');
    recordProgress     = document.getElementById('recordProgress');
    progressBarInner   = document.getElementById('progressBarInner');
    progressLabel      = document.getElementById('progressLabel');

    // Guard: export panel may not be mounted yet on first boot
    if (!themeSelector || !animGrid || !fontSizeSlider || !exportPlayBtn || !startRecordBtn) {
      console.warn('[EE] init() — EARLY RETURN: critical element missing', { themeSelector: !!themeSelector, animGrid: !!animGrid, fontSizeSlider: !!fontSizeSlider, exportPlayBtn: !!exportPlayBtn, startRecordBtn: !!startRecordBtn });
      return;
    }
    console.log('[EE] init() — DOM refs resolved:', {
      inactiveColorPicker: inactiveColorPicker ? `✓ value="${inactiveColorPicker.value}"` : '✗ NULL',
    });

    /* ── Build theme buttons from Renderer.THEME_LIST grouped by category ── */
    themeSelector.innerHTML = '';
    Renderer.THEME_CATEGORIES.forEach(cat => {
      const items = Renderer.THEME_LIST.filter(t => t.cat === cat.id);
      if (!items.length) return;
      const grpLabel = document.createElement('div');
      grpLabel.className = 'selector-cat-label';
      grpLabel.textContent = cat.label;
      themeSelector.appendChild(grpLabel);
      const row = document.createElement('div');
      row.className = 'theme-selector-row';
      row.dataset.cat = cat.id;
      items.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'theme-btn' + (t.id === currentTheme ? ' active' : '');
        btn.dataset.theme = t.id;
        btn.dataset.cat = cat.id;
        btn.innerHTML = `<span class="theme-btn-emoji">${t.emoji}</span><span class="theme-btn-label">${t.label}</span>`;
        btn.addEventListener('click', () => {
          currentTheme = t.id;
          themeSelector.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t.id));
          // Sync inactive color picker to new theme
          const newT = Renderer.THEMES[t.id] || Renderer.THEMES.classic;
          currentInactiveColor = _hexFromCssColor(newT.textDim);
          if (inactiveColorPicker) inactiveColorPicker.value = currentInactiveColor;
          renderPreviewFrame();
        });
        row.appendChild(btn);
      });
      themeSelector.appendChild(row);
    });
    buildCatTabsEl(
      document.getElementById('themeCatTabs'), themeSelector,
      Renderer.THEME_CATEGORIES, '.theme-selector-row',
      document.getElementById('themeSearch')
    );

    /* ── Build animation grid from Renderer.ANIMATION_LIST grouped by category ── */
    animGrid.innerHTML = '';
    Renderer.ANIMATION_CATEGORIES.forEach(cat => {
      const items = Renderer.ANIMATION_LIST.filter(a => a.cat === cat.id);
      if (!items.length) return;
      const grpLabel = document.createElement('div');
      grpLabel.className = 'selector-cat-label';
      grpLabel.textContent = cat.label;
      animGrid.appendChild(grpLabel);
      const row = document.createElement('div');
      row.className = 'anim-grid-row';
      row.dataset.cat = cat.id;
      items.forEach(a => {
        const card = document.createElement('div');
        card.className = 'anim-card' + (a.id === currentAnimation ? ' active' : '');
        card.dataset.anim = a.id;
        card.dataset.cat = cat.id;
        card.innerHTML = `<span class="anim-emoji">${a.emoji}</span><span class="anim-label">${a.label}</span>`;
        card.addEventListener('click', () => {
          currentAnimation = a.id;
          animGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.anim === a.id));
          renderPreviewFrame();
        });
        row.appendChild(card);
      });
      animGrid.appendChild(row);
    });
    const animSearch = document.getElementById('animSearch');
    if (animSearch) {
      animSearch.addEventListener('input', () => {
        const q = animSearch.value.toLowerCase().trim();
        animGrid.querySelectorAll('.anim-grid-row').forEach(row => {
          if (!q) { row.style.display = ''; row.querySelectorAll('.anim-card').forEach(c => c.style.display = ''); return; }
          let anyVis = false;
          row.querySelectorAll('.anim-card').forEach(c => {
            const lbl = c.querySelector('.anim-label')?.textContent.toLowerCase() || '';
            const vis = lbl.includes(q);
            c.style.display = vis ? '' : 'none';
            if (vis) anyVis = true;
          });
          row.style.display = anyVis ? '' : 'none';
        });
        animGrid.querySelectorAll('.selector-cat-label').forEach(lbl => lbl.style.display = q ? 'none' : '');
      });
    }

    /* ── Build overlay grid from Renderer.OVERLAY_LIST grouped by category ── */
    overlayGrid = document.getElementById('overlayGrid');
    if (overlayGrid) {
      overlayGrid.innerHTML = '';
      Renderer.OVERLAY_CATEGORIES.forEach(cat => {
        const items = Renderer.OVERLAY_LIST.filter(o => o.cat === cat.id);
        if (!items.length) return;
        const grpLabel = document.createElement('div');
        grpLabel.className = 'selector-cat-label';
        grpLabel.textContent = cat.label;
        overlayGrid.appendChild(grpLabel);
        const row = document.createElement('div');
        row.className = 'anim-grid-row';
        row.dataset.cat = cat.id;
        items.forEach(o => {
          const card = document.createElement('div');
          card.className = 'anim-card' + (o.id === currentOverlay ? ' active' : '');
          card.dataset.ov = o.id;
          card.dataset.cat = cat.id;
          card.innerHTML = `<span class="anim-emoji">${o.emoji}</span><span class="anim-label">${o.label}</span>`;
          card.addEventListener('click', () => {
            currentOverlay = o.id;
            overlayGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.ov === o.id));
            renderPreviewFrame();
          });
          row.appendChild(card);
        });
        overlayGrid.appendChild(row);
      });
      buildCatTabsEl(
        document.getElementById('overlayCatTabs'), overlayGrid,
        Renderer.OVERLAY_CATEGORIES, '.anim-grid-row',
        document.getElementById('overlaySearch')
      );
    }

    /* ── Font size ── */
    fontSizeSlider.addEventListener('input', () => {
      fontSizeVal.textContent = fontSizeSlider.value + 'px';
      renderPreviewFrame();
    });

    /* ── Build font selector ── */
    fontSelector = document.getElementById('fontSelector');
    if (fontSelector) {
      fontSelector.innerHTML = '';
      Renderer.FONT_LIST.forEach(f => {
        const btn = document.createElement('button');
        btn.className = 'font-btn' + (f.id === currentFont ? ' active' : '');
        btn.dataset.font = f.id;
        btn.innerHTML = `<span class="font-btn-preview" style="font-family:${f.family}">${f.preview}</span><span class="font-btn-label">${f.label}</span>`;
        btn.addEventListener('click', () => {
          currentFont = f.id;
          fontSelector.querySelectorAll('.font-btn').forEach(b => b.classList.toggle('active', b.dataset.font === f.id));
          renderPreviewFrame();
        });
        fontSelector.appendChild(btn);
      });
      wireSimpleSearch(document.getElementById('fontSearch'), fontSelector, '.font-btn', '.font-btn-label');
    }

    /* ── Build text effect grid ── */
    textEffectGrid = document.getElementById('textEffectGrid');
    if (textEffectGrid) {
      textEffectGrid.innerHTML = '';
      Renderer.TEXT_EFFECT_LIST.forEach(ef => {
        const card = document.createElement('div');
        card.className = 'anim-card' + (ef.id === currentTextEffect ? ' active' : '');
        card.dataset.te = ef.id;
        card.innerHTML = `<span class="anim-emoji">${ef.emoji}</span><span class="anim-label">${ef.label}</span>`;
        card.addEventListener('click', () => {
          currentTextEffect = ef.id;
          textEffectGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.te === ef.id));
          renderPreviewFrame();
        });
        textEffectGrid.appendChild(card);
      });
      wireSimpleSearch(document.getElementById('textFxSearch'), textEffectGrid, '.anim-card', '.anim-label');
    }

    /* ── Progress style grid ── */
    progressStyleGrid = document.getElementById('progressStyleGrid');
    if (progressStyleGrid) {
      progressStyleGrid.innerHTML = '';
      Renderer.PROGRESS_BAR_LIST.forEach(p => {
        const card = document.createElement('div');
        card.className = 'anim-card' + (p.id === currentProgressStyle ? ' active' : '');
        card.dataset.ps = p.id;
        card.innerHTML = `<span class="anim-emoji">${p.emoji}</span><span class="anim-label">${p.label}</span>`;
        card.addEventListener('click', () => {
          currentProgressStyle = p.id;
          progressStyleGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.ps === p.id));
          renderPreviewFrame();
        });
        progressStyleGrid.appendChild(card);
      });
    }

    /* ── Progress opacity slider ── */
    progressOpacitySlider = document.getElementById('progressOpacitySlider');
    progressOpacityVal    = document.getElementById('progressOpacityVal');
    if (progressOpacitySlider) {
      progressOpacitySlider.addEventListener('input', () => {
        currentProgressOpacity = parseFloat(progressOpacitySlider.value);
        if (progressOpacityVal) progressOpacityVal.textContent = Math.round(currentProgressOpacity * 100) + '%';
        renderPreviewFrame();
      });
    }

    /* ── Progress bar color picker ── */
    progressBarColorPicker = document.getElementById('progressBarColorPicker');
    if (progressBarColorPicker) progressBarColorPicker.addEventListener('input', renderPreviewFrame);

    /* ── Secondary text controls ── */
    secondarySizeSlider    = document.getElementById('secondarySizeSlider');
    secondarySizeVal       = document.getElementById('secondarySizeVal');
    secondaryOpacitySlider = document.getElementById('secondaryOpacitySlider');
    secondaryOpacityVal    = document.getElementById('secondaryOpacityVal');
    nextOffsetSlider       = document.getElementById('nextOffsetSlider');
    nextOffsetVal          = document.getElementById('nextOffsetVal');
    prevOpacitySlider      = document.getElementById('prevOpacitySlider');
    prevOpacityVal         = document.getElementById('prevOpacityVal');
    if (secondarySizeSlider) {
      secondarySizeSlider.addEventListener('input', () => {
        currentSecondarySize = parseFloat(secondarySizeSlider.value);
        if (secondarySizeVal) secondarySizeVal.textContent = Math.round(currentSecondarySize * 100) + '%';
        renderPreviewFrame();
      });
    }
    if (secondaryOpacitySlider) {
      secondaryOpacitySlider.addEventListener('input', () => {
        currentSecondaryOpacity = parseFloat(secondaryOpacitySlider.value);
        if (secondaryOpacityVal) secondaryOpacityVal.textContent = Math.round(currentSecondaryOpacity * 100) + '%';
        renderPreviewFrame();
      });
    }
    if (nextOffsetSlider) {
      nextOffsetSlider.addEventListener('input', () => {
        currentNextOffset = parseFloat(nextOffsetSlider.value);
        if (nextOffsetVal) nextOffsetVal.textContent = currentNextOffset.toFixed(2);
        renderPreviewFrame();
      });
    }
    if (prevOpacitySlider) {
      prevOpacitySlider.addEventListener('input', () => {
        currentPrevOpacity = parseFloat(prevOpacitySlider.value);
        if (prevOpacityVal) prevOpacityVal.textContent = Math.round(currentPrevOpacity * 100) + '%';
        renderPreviewFrame();
      });
    }

    /* ── Zoom slider ── */
    zoomSlider = document.getElementById('zoomSlider');
    zoomVal    = document.getElementById('zoomVal');
    if (zoomSlider) {
      zoomSlider.addEventListener('input', () => {
        currentZoom = parseFloat(zoomSlider.value);
        if (zoomVal) zoomVal.textContent = currentZoom.toFixed(2) + '×';
        renderPreviewFrame();
      });
    }

    /* ── Glow + text position + new controls ── */
    glowSlider         = document.getElementById('glowSlider');
    glowVal            = document.getElementById('glowVal');
    textPositionSelect = document.getElementById('textPositionSelect');
    fpsSelect          = document.getElementById('fpsSelect');
    showProgressToggle = document.getElementById('showProgressToggle');
    if (glowSlider) {
      glowSlider.addEventListener('input', () => {
        currentGlow = parseFloat(glowSlider.value);
        if (glowVal) glowVal.textContent = currentGlow.toFixed(1) + '×';
        renderPreviewFrame();
      });
    }
    if (textPositionSelect) textPositionSelect.addEventListener('change', () => { currentTextPos = textPositionSelect.value; renderPreviewFrame(); });
    if (showProgressToggle) showProgressToggle.addEventListener('change', renderPreviewFrame);

    /* ── Color pickers (inactive color listener wired in setup() via AbortController) ── */

    /* ── Preview player ── */
    exportPlayBtn.addEventListener('click', () => {
      if (recording) return;
      if (Audio.isPlaying) {
        Audio.pause(); stopPreviewLoop();
        exportPlayBtn.textContent = '▶';
      } else {
        startPreviewLoop();
        Audio.play(Audio.getCurrentTime());
        exportPlayBtn.textContent = '⏸';
      }
    });

    exportSeekBar.addEventListener('input', () => {
      const t = (exportSeekBar.value / 100) * Audio.duration;
      Audio.seek(t);
      renderPreviewAt(t);
    });

    Audio.onEnded = () => {
      exportPlayBtn.textContent = '▶';
      stopPreviewLoop();
    };

    /* ── Volume ── */
    if (exportVolumeSlider) {
      exportVolumeSlider.addEventListener('input', () => {
        const v = parseFloat(exportVolumeSlider.value);
        Audio.setVolume(v);
        const icon = document.getElementById('exportVolIcon');
        if (icon) icon.textContent = v === 0 ? '🔇' : v < 0.5 ? '🔉' : '🔊';
      });
    }

    /* ── Playback speed ── */
    if (exportSpeedSelect) {
      exportSpeedSelect.addEventListener('change', () => {
        Audio.setPlaybackRate(parseFloat(exportSpeedSelect.value));
      });
    }

    /* ── Fullscreen ── */
    if (exportFullscreenBtn) {
      exportFullscreenBtn.addEventListener('click', () => {
        const wrap = document.getElementById('exportCanvasWrap');
        if (!document.fullscreenElement) {
          wrap?.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      });
      document.addEventListener('fullscreenchange', () => {
        if (!exportFullscreenBtn) return;
        exportFullscreenBtn.textContent = document.fullscreenElement ? '✕' : '⛶';
        exportFullscreenBtn.title = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
      });
    }

    /* ── Export / Record ── */
    previewExportBtn.addEventListener('click', () => {
      if (recording) return;
      if (Audio.isPlaying) { Audio.pause(); stopPreviewLoop(); exportPlayBtn.textContent = '▶'; }
      Audio.seek(0);
      startPreviewLoop();
      Audio.play(0);
      exportPlayBtn.textContent = '⏸';
    });

    startRecordBtn.addEventListener('click', () => {
      if (recording) return;
      startRecording();
    });

    /* ── Section collapse buttons ── */
    document.querySelectorAll('.sec-collapse-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const secId = btn.dataset.sec;
        const sec = document.getElementById(secId);
        if (!sec) return;
        sec.classList.toggle('collapsed');
        btn.textContent = sec.classList.contains('collapsed') ? '▸' : '▾';
      });
    });

    /* ── Collapse all button ── */
    const collapseAllBtn = document.getElementById('collapseAllBtn');
    if (collapseAllBtn) {
      let allCollapsed = false;
      collapseAllBtn.addEventListener('click', () => {
        const secs = document.querySelectorAll('.settings-section');
        allCollapsed = !allCollapsed;
        secs.forEach(sec => {
          sec.classList.toggle('collapsed', allCollapsed);
          const btn2 = sec.querySelector('.sec-collapse-btn');
          if (btn2) btn2.textContent = allCollapsed ? '▸' : '▾';
        });
        collapseAllBtn.textContent = allCollapsed ? '▸ Todo' : '▾ Todo';
      });
    }

    /* ── Clear selection button ── */
    const clearSelBtn = document.getElementById('clearSelectionBtn');
    if (clearSelBtn) {
      clearSelBtn.addEventListener('click', () => {
        currentAnimation = 'none';
        currentOverlay   = 'none';
        currentTheme     = 'classic';
        currentFont      = 'segoe';
        currentTextEffect= 'none';
        currentProgressStyle = 'bottom';
        currentProgressOpacity = 1;
        if (progressOpacitySlider) { progressOpacitySlider.value = '1'; if (progressOpacityVal) progressOpacityVal.textContent = '100%'; }
        if (progressBarColorPicker) progressBarColorPicker.value = '#9c6dff';
        currentSecondarySize    = 0.62;
        currentSecondaryOpacity = 0.65;
        currentNextOffset       = 1.05;
        currentPrevOpacity      = 0.22;
        if (secondarySizeSlider)    { secondarySizeSlider.value    = '0.62'; if (secondarySizeVal)    secondarySizeVal.textContent    = '62%'; }
        if (secondaryOpacitySlider) { secondaryOpacitySlider.value = '0.65'; if (secondaryOpacityVal) secondaryOpacityVal.textContent = '65%'; }
        if (nextOffsetSlider)       { nextOffsetSlider.value       = '1.05'; if (nextOffsetVal)       nextOffsetVal.textContent       = '1.05'; }
        if (prevOpacitySlider)      { prevOpacitySlider.value      = '0.22'; if (prevOpacityVal)      prevOpacityVal.textContent      = '22%'; }
        if (animGrid)      animGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.anim === 'none'));
        if (overlayGrid)   overlayGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.ov === 'none'));
        if (themeSelector) themeSelector.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === 'classic'));
        if (fontSelector)  fontSelector.querySelectorAll('.font-btn').forEach(b => b.classList.toggle('active', b.dataset.font === 'segoe'));
        if (textEffectGrid)textEffectGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.te === 'none'));
        if (progressStyleGrid) progressStyleGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.ps === 'bottom'));
        const _classicTheme = Renderer.THEMES.classic || {};
        currentInactiveColor = _hexFromCssColor(_classicTheme.textDim    || '#ffffff');
        if (inactiveColorPicker) inactiveColorPicker.value = currentInactiveColor;
        renderPreviewFrame();
      });
    }

    /* ── Clear filters button ── */
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        // Clear all search inputs
        document.querySelectorAll('.sec-search').forEach(inp => { inp.value = ''; inp.dispatchEvent(new Event('input')); });
        // Reset all cat-tabs to "Todos"
        document.querySelectorAll('.cat-tabs').forEach(tabs => {
          const allTab = tabs.querySelector('[data-cat="__all__"]');
          if (allTab) allTab.click();
        });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════
     setup() — called whenever panel4 becomes active
  ═══════════════════════════════════════════════════════ */
  function setup() {
    console.log('[EE] setup() START — currentTheme:', currentTheme, '| currentInactiveColor:', currentInactiveColor);
    if (Audio.isPlaying) { Audio.pause(); exportPlayBtn.textContent = '▶'; }
    stopPreviewLoop();
    Audio.seek(0);

    Audio.onTimeUpdate = t => {
      if (!recording) {
        const pct = Audio.duration > 0 ? (t / Audio.duration) * 100 : 0;
        exportSeekBar.value = pct;
        exportCurrentTime.textContent = formatTime(t);
        renderPreviewAt(t);
      }
    };

    Audio.onEnded = () => {
      exportPlayBtn.textContent = '▶';
      stopPreviewLoop();
    };

    const [rW, rH] = (resolutionSelect.value || '1920x1080').split('x').map(Number);
    previewCanvas.width  = rW;
    previewCanvas.height = rH;

    // Abort previous setup() listeners and create fresh ones (prevents duplicates)
    if (_setupAbortCtrl) _setupAbortCtrl.abort();
    _setupAbortCtrl = new AbortController();
    const { signal } = _setupAbortCtrl;

    // Always sync inactive color picker to the current theme on entry
    const T0 = Renderer.THEMES[currentTheme] || Renderer.THEMES.classic;
    currentInactiveColor = _hexFromCssColor(T0.textDim);
    if (inactiveColorPicker) inactiveColorPicker.value = currentInactiveColor;
    console.log('[EE] setup() theme-sync → inactiveColor:', currentInactiveColor,
      '| inactiveColorPicker:', inactiveColorPicker ? '✓' : '✗ NULL');

    // Wire inactive color picker listener (fresh each activation)
    if (inactiveColorPicker) {
      inactiveColorPicker.addEventListener('input', () => {
        currentInactiveColor = inactiveColorPicker.value;
        console.log('[EE] 🎨 inactiveColorPicker input → currentInactiveColor:', currentInactiveColor);
        renderPreviewFrame();
      }, { signal });
    }

    // Seek to middle of first lyric so active text + colors are visible immediately
    const previewLines = Lyrics.getSyncedLines();
    let seekTarget = 0;
    if (previewLines.length >= 2) {
      seekTarget = (previewLines[0].time + previewLines[1].time) / 2;
    } else if (previewLines.length === 1) {
      seekTarget = previewLines[0].time + 0.5;
    }
    console.log('[EE] setup() DONE — seekTarget:', seekTarget.toFixed(2), '| previewLines:', previewLines.length,
      '| currentInactiveColor:', currentInactiveColor, '| signal.aborted:', signal.aborted);
    Audio.seek(seekTarget);
    exportSeekBar.value = Audio.duration > 0 ? (seekTarget / Audio.duration) * 100 : 0;
    exportCurrentTime.textContent = formatTime(seekTarget);

    renderPreviewAt(seekTarget);
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function getRenderOpts(time) {
    return {
      time,
      duration:              Audio.duration,
      lines:                 Lyrics.getSyncedLines(),
      theme:                 currentTheme,
      animation:             currentAnimation,
      overlayEffect:         currentOverlay,
      textPosition:          currentTextPos,
      glowIntensity:         currentGlow,
      fontSize:              parseInt(fontSizeSlider.value, 10),
      songTitle:             '',
      activeColorOverride:   undefined,
      inactiveColorOverride: currentInactiveColor,
      showProgressBar:       showProgressToggle ? showProgressToggle.checked : true,
      showTitle:             false,
      voiceConfig:           Sync.getVoiceConfig(),
      fontFamily:            Renderer.FONT_LIST.find(f => f.id === currentFont)?.family || "'Segoe UI', sans-serif",
      activeZoom:            currentZoom,
      textEffect:            currentTextEffect,
      progressBarStyle:      currentProgressStyle,
      progressBarOpacity:    currentProgressOpacity,
      progressColorOverride: progressBarColorPicker?.value || null,
      secondarySizeRatio:    currentSecondarySize,
      secondaryOpacity:      currentSecondaryOpacity,
      nextLineOffset:        currentNextOffset,
      prevLineOpacity:       currentPrevOpacity,
    };
  }

  /** Convert any CSS color string to a #rrggbb hex value that <input type="color"> can accept.
   *  Handles: #rgb, #rrggbb, rgba(...), hsl(...) by painting to an offscreen 1×1 canvas. */
  function _hexFromCssColor(color) {
    if (!color) return '#ffffff';
    // Fast path: already #rrggbb lowercase/uppercase
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
    // Short hex #rgb → #rrggbb
    if (/^#[0-9a-fA-F]{3}$/.test(color))
      return '#' + [...color.slice(1)].map(c => c + c).join('');
    // Fallback: draw to tiny canvas
    try {
      const c = document.createElement('canvas'); c.width = c.height = 1;
      const cx = c.getContext('2d'); cx.fillStyle = color; cx.fillRect(0, 0, 1, 1);
      const [r, g, b] = cx.getImageData(0, 0, 1, 1).data;
      return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    } catch (_) { return '#ffffff'; }
  }

  function renderPreviewFrame() { renderPreviewAt(Audio.getCurrentTime()); }

  function renderPreviewAt(t) {
    const [rW, rH] = (resolutionSelect.value || '1920x1080').split('x').map(Number);
    if (previewCanvas.width !== rW || previewCanvas.height !== rH) {
      previewCanvas.width = rW; previewCanvas.height = rH;
    }
    const opts = getRenderOpts(t);
    // Log only when opts change (rate-limited by value comparison)
    if (renderPreviewAt._lastActive !== opts.activeColorOverride ||
        renderPreviewAt._lastTitle  !== opts.songTitle) {
      renderPreviewAt._lastActive = opts.activeColorOverride;
      renderPreviewAt._lastTitle  = opts.songTitle;
      console.log('[EE] renderPreviewAt — opts snapshot: activeColorOverride:', opts.activeColorOverride,
        '| songTitle:', `"${opts.songTitle}"`, '| t:', t.toFixed(2));
    }
    Renderer.drawFrame(previewCanvas, opts);
  }

  function startPreviewLoop() {
    stopPreviewLoop();
    function loop() {
      renderPreviewAt(Audio.getCurrentTime());
      previewRaf = requestAnimationFrame(loop);
    }
    previewRaf = requestAnimationFrame(loop);
  }

  function stopPreviewLoop() {
    if (previewRaf) { cancelAnimationFrame(previewRaf); previewRaf = null; }
  }

  /* ═══════════════════════════════════════════════════════
     startRecording()
  ═══════════════════════════════════════════════════════ */
  /* ─────────────────────────────────────────────────────
     Fast offline render using WebCodecs + webm-muxer.
     Falls back to MediaRecorder when WebCodecs unavailable.
  ───────────────────────────────────────────────────────── */
  async function startRecording() {
    if (recording) return;
    recording = true;
    stopPreviewLoop();
    Audio.seek(0);
    Audio.setPlaybackRate(1);
    if (exportSpeedSelect) exportSpeedSelect.value = '1';
    exportPlayBtn.textContent = '▶';

    const [rW, rH] = (resolutionSelect.value || '1920x1080').split('x').map(Number);

    document.querySelector('.status-idle').classList.add('hidden');
    recordProgress.classList.remove('hidden');
    progressBarInner.style.width = '0%';
    progressLabel.textContent = 'Preparando...';
    startRecordBtn.disabled = true;
    previewExportBtn.disabled = true;

    // ── Prefer fast offline WebCodecs path ──
    const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined';
    if (hasWebCodecs && Audio.rawFile) {
      try {
        await _startWebCodecsRecording(rW, rH);
        return;
      } catch (err) {
        console.warn('[export] WebCodecs render failed, falling back to MediaRecorder:', err);
      }
    }

    // ── Fallback: real-time MediaRecorder ──
    const recCanvas = document.createElement('canvas');
    recCanvas.width = rW; recCanvas.height = rH;

    const fps = parseInt(fpsSelect?.value || '30', 10);
    const mimeTypes = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ];
    const mimeType = mimeTypes.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch(_){ return false; } }) || 'video/webm';
    const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    const videoStream = recCanvas.captureStream(fps);
    const audioInfo   = Audio.createRecordingStream();
    const combined    = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioInfo.stream.getAudioTracks(),
    ]);

    const recorder = new MediaRecorder(combined, { mimeType });
    const chunks   = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = async () => {
      audioInfo.stop();
      recording = false;
      const blob = new Blob(chunks, { type: mimeType });

      const rawTitle  = songTitleInput.value.trim() || 'karaoke';
      const safeTitle = rawTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'karaoke';
      const filename  = safeTitle + '.' + ext;

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      document.querySelector('.status-idle').classList.remove('hidden');
      recordProgress.classList.add('hidden');
      startRecordBtn.disabled = false;
      previewExportBtn.disabled = false;
      progressBarInner.style.width = '0%';
      alert('✅ Video listo');
    };

    recorder.onerror = err => {
      recording = false;
      audioInfo.stop();
      document.querySelector('.status-idle').classList.remove('hidden');
      recordProgress.classList.add('hidden');
      startRecordBtn.disabled = false;
      previewExportBtn.disabled = false;
      alert('❌ Error al grabar el video: ' + err.error?.message);
    };

    recorder.start(200);
    progressLabel.textContent = 'Grabando... 0%';

    let rafId;
    function recLoop() {
      const t   = Audio.getCurrentTime();
      const dur = Audio.duration;
      Renderer.drawFrame(recCanvas, getRenderOpts(t));

      const pct = dur > 0 ? Math.round((t / dur) * 100) : 0;
      progressBarInner.style.width = pct + '%';
      progressLabel.textContent    = `Grabando... ${pct}%`;

      const pctSk = dur > 0 ? (t / dur) * 100 : 0;
      exportSeekBar.value = pctSk;
      exportCurrentTime.textContent = formatTime(t);

      rafId = requestAnimationFrame(recLoop);
    }

    Audio.onEnded = () => {
      cancelAnimationFrame(rafId);
      recorder.stop();
    };

    Audio.play(0);
    rafId = requestAnimationFrame(recLoop);
  }

  /* ─── WebCodecs offline fast render ─────────────────── */
  async function _startWebCodecsRecording(rW, rH) {
    const fps       = parseInt(fpsSelect?.value || '30', 10);
    const duration  = Audio.duration;
    const totalFrames = Math.ceil(duration * fps);
    const frameStep   = duration / totalFrames; // seconds per frame

    // Decode audio to PCM using a temporary AudioContext
    progressLabel.textContent = 'Decodificando audio...';
    const arrayBuffer = await Audio.rawFile.arrayBuffer();
    const tempCtx     = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    await tempCtx.close();

    const sampleRate   = audioBuffer.sampleRate;
    const numChannels  = Math.min(audioBuffer.numberOfChannels, 2);
    const totalSamples = audioBuffer.length;

    // Try VP9 first, fall back to VP8 for broader hardware support
    let videoCodec = 'vp09.00.10.08';
    try {
      const vRes = await VideoEncoder.isConfigSupported({ codec: videoCodec, width: rW, height: rH, bitrate: 4_000_000 });
      if (!vRes.supported) videoCodec = 'vp8';
    } catch (_) { videoCodec = 'vp8'; }

    const muxer = new Muxer({
      target:  new ArrayBufferTarget(),
      video:   { codec: videoCodec === 'vp8' ? 'V_VP8' : 'V_VP9', width: rW, height: rH, frameRate: fps },
      audio:   { codec: 'A_OPUS', sampleRate, numberOfChannels: numChannels },
      firstTimestampBehavior: 'offset',
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error:  e => { throw e; },
    });
    videoEncoder.configure({ codec: videoCodec, width: rW, height: rH, bitrate: 4_000_000, latencyMode: 'quality' });

    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error:  e => { throw e; },
    });
    audioEncoder.configure({ codec: 'opus', sampleRate, numberOfChannels: numChannels, bitrate: 128_000 });

    // ── Encode video + update preview ──────────────────
    progressLabel.textContent = 'Renderizando... 0%';
    const offCanvas = document.createElement('canvas');
    offCanvas.width = rW; offCanvas.height = rH;

    // Update previewCanvas size if needed
    if (previewCanvas.width !== rW || previewCanvas.height !== rH) {
      previewCanvas.width = rW; previewCanvas.height = rH;
    }
    const prevCtx = previewCanvas.getContext('2d');

    for (let i = 0; i < totalFrames; i++) {
      const t         = i * frameStep;
      const tsUs      = Math.round(t * 1_000_000); // microseconds

      Renderer.drawFrame(offCanvas, getRenderOpts(t));
      // Mirror to visible preview every frame — rAF not needed, browser paints on yield
      prevCtx.drawImage(offCanvas, 0, 0);

      const videoFrame = new VideoFrame(offCanvas, { timestamp: tsUs, duration: Math.round(frameStep * 1_000_000) });
      videoEncoder.encode(videoFrame, { keyFrame: i % (fps * 2) === 0 });
      videoFrame.close();

      // Update progress bar and seek bar
      const pct = Math.round(((i + 1) / totalFrames) * 100);
      progressBarInner.style.width = pct + '%';
      progressLabel.textContent    = `Renderizando... ${pct}%`;
      exportSeekBar.value          = (t / duration) * 100;
      exportCurrentTime.textContent = formatTime(t);

      // Yield to browser every 8 frames so UI updates are visible
      if (i % 8 === 7) await new Promise(r => setTimeout(r, 0));
    }

    // ── Encode audio in chunks ──────────────────────────
    progressLabel.textContent = 'Codificando audio...';
    const audioChunkSamples = Math.round(sampleRate / fps);
    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));

    for (let start = 0; start < totalSamples; start += audioChunkSamples) {
      const count    = Math.min(audioChunkSamples, totalSamples - start);
      const tsUs     = Math.round((start / sampleRate) * 1_000_000);
      const planar   = new Float32Array(count * numChannels);
      for (let c = 0; c < numChannels; c++) {
        planar.set(channels[c].subarray(start, start + count), c * count);
      }
      const audioData = new AudioData({
        format: 'f32-planar', sampleRate, numberOfChannels: numChannels,
        numberOfFrames: count, timestamp: tsUs, data: planar,
      });
      audioEncoder.encode(audioData);
      audioData.close();
    }

    progressLabel.textContent = 'Finalizando...';
    await videoEncoder.flush();
    await audioEncoder.flush();
    muxer.finalize();

    recording = false;
    const blob = new Blob([muxer.target.buffer], { type: 'video/webm' });
    const rawTitle  = songTitleInput.value.trim() || 'karaoke';
    const safeTitle = rawTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'karaoke';
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = safeTitle + '.webm'; a.click();
    URL.revokeObjectURL(url);

    document.querySelector('.status-idle').classList.remove('hidden');
    recordProgress.classList.add('hidden');
    startRecordBtn.disabled = false;
    previewExportBtn.disabled = false;
    progressBarInner.style.width = '0%';
    alert('✅ Video listo');
  }

  /* ═══════════════════════════════════════════════════════
     applySettings() — restore saved project settings into UI
  ═══════════════════════════════════════════════════════ */
  function applySettings(s) {
    if (!s) return;
    if (s.theme) {
      currentTheme = s.theme;
      if (themeSelector) themeSelector.querySelectorAll('.theme-btn')
        .forEach(b => b.classList.toggle('active', b.dataset.theme === s.theme));
    }
    if (s.animation !== undefined) {
      currentAnimation = s.animation;
      if (animGrid) animGrid.querySelectorAll('.anim-card')
        .forEach(c => c.classList.toggle('active', c.dataset.anim === s.animation));
    }
    if (s.overlay !== undefined) {
      currentOverlay = s.overlay;
      if (overlayGrid) overlayGrid.querySelectorAll('.anim-card')
        .forEach(c => c.classList.toggle('active', c.dataset.ov === s.overlay));
    }
    if (s.textPosition && textPositionSelect) { currentTextPos = s.textPosition; textPositionSelect.value = s.textPosition; }
    if (s.glow !== undefined && glowSlider) { currentGlow = s.glow; glowSlider.value = s.glow; if (glowVal) glowVal.textContent = parseFloat(s.glow).toFixed(1) + '×'; }
    if (s.fontSize    && fontSizeSlider)   { fontSizeSlider.value = s.fontSize; fontSizeVal.textContent = s.fontSize + 'px'; }
    if (s.resolution  && resolutionSelect)   resolutionSelect.value   = s.resolution;
    if (s.inactiveColor) {
      currentInactiveColor = s.inactiveColor;
      if (inactiveColorPicker) inactiveColorPicker.value = s.inactiveColor;
    }
    if (s.progressBarColor && progressBarColorPicker) progressBarColorPicker.value = s.progressBarColor;
    if (s.secondarySize !== undefined && secondarySizeSlider) {
      currentSecondarySize = s.secondarySize; secondarySizeSlider.value = s.secondarySize;
      if (secondarySizeVal) secondarySizeVal.textContent = Math.round(s.secondarySize * 100) + '%';
    }
    if (s.secondaryOpacity !== undefined && secondaryOpacitySlider) {
      currentSecondaryOpacity = s.secondaryOpacity; secondaryOpacitySlider.value = s.secondaryOpacity;
      if (secondaryOpacityVal) secondaryOpacityVal.textContent = Math.round(s.secondaryOpacity * 100) + '%';
    }
    if (s.nextOffset !== undefined && nextOffsetSlider) {
      currentNextOffset = s.nextOffset; nextOffsetSlider.value = s.nextOffset;
      if (nextOffsetVal) nextOffsetVal.textContent = parseFloat(s.nextOffset).toFixed(2);
    }
    if (s.prevOpacity !== undefined && prevOpacitySlider) {
      currentPrevOpacity = s.prevOpacity; prevOpacitySlider.value = s.prevOpacity;
      if (prevOpacityVal) prevOpacityVal.textContent = Math.round(s.prevOpacity * 100) + '%';
    }
    if (s.font && fontSelector) {
      currentFont = s.font;
      fontSelector.querySelectorAll('.font-btn').forEach(b => b.classList.toggle('active', b.dataset.font === s.font));
    }
    if (s.zoom !== undefined && zoomSlider) {
      currentZoom = s.zoom; zoomSlider.value = s.zoom;
      if (zoomVal) zoomVal.textContent = parseFloat(s.zoom).toFixed(2) + '×';
    }
    if (s.textEffect !== undefined && textEffectGrid) {
      currentTextEffect = s.textEffect;
      textEffectGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.te === s.textEffect));
    }
  }

  return { init, setup, applySettings };
})();

export default ExportEngine;
