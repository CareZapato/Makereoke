/* ============================================================
   export-engine.js — Step 4: Export (video recording) (ES module)
   ============================================================ */

import Audio from './audio.js';
import Lyrics from './lyrics.js';
import Renderer from './renderer.js';
import Sync from './sync.js';
import Intro from './intro.js';
import Outro from './outro.js';
import { formatTime, debounce } from './utils.js';
import { Muxer, ArrayBufferTarget } from 'webm-muxer';
import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4ABTarget } from 'mp4-muxer';
import AppModal from './app-modal.js';

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
  let currentFillEffect       = 'default'; // karaoke reveal style
  let showWatermark           = false;
  let currentWatermarkOpacity = 0.35;
  let currentWatermarkSize    = 0.22;   // fraction of video width
  let currentWatermarkPos     = 'br';   // tl | tr | bl | br | center | rotate
  let watermarkAnim            = 'none'; // none | fade | slide | zoom | coin | pendulum | spin | float
  let watermarkVisualEffect    = 'none'; // none | glow | pulse | outline | stamp | shadow
  let watermarkRanges = [                // up to 3 optional time windows
    { enabled: false, from: 0, to: 30 },
    { enabled: false, from: 0, to: 30 },
    { enabled: false, from: 0, to: 30 },
  ];
  let currentProgressBarThickness = 1.0;
  let currentProgressTimeSize     = 1.0;
  // Text shadow (active lyric line)
  let currentTextShadowType    = 'none';
  let currentTextShadowColor   = '#000000';
  let currentTextShadowBlur    = 12;
  let currentTextShadowOffsetY = 3;
  // Stroke / contorno (active lyric line)
  let currentStrokeWidth  = 0;
  let currentStrokeColor  = '#000000';
  let currentStrokeEffect = 'solid';
  // Tracked inactive color state — NOT read from DOM on every frame
  let currentInactiveColor = '#ffffff';
  // AbortController for setup() event re-wiring (prevents duplicate listeners)
  let _setupAbortCtrl = null;
  let previewRaf       = null;
  let recording        = false;

  /* ── DOM refs (set in init) ────────────────────────────────────── */
  let themeSelector, animGrid, overlayGrid;
  let fontSelector, textEffectGrid, fillEffectGrid, progressStyleGrid, zoomSlider, zoomVal;
  let progressOpacitySlider, progressOpacityVal;
  let progressBarColorPicker;
  let secondarySizeSlider, secondarySizeVal;
  let secondaryOpacitySlider, secondaryOpacityVal;
  let nextOffsetSlider, nextOffsetVal;
  let prevOpacitySlider, prevOpacityVal;
  let resolutionSelect, fontSizeSlider, fontSizeVal;
  let glowSlider, glowVal, textPositionSelect, fpsSelect, exportFormatSelect;
  let showProgressToggle;
  let songTitleInput, activeColorPicker, inactiveColorPicker;
  let previewCanvas, exportPlayBtn, exportSeekBar, exportCurrentTime;
  let exportVolumeSlider, exportSpeedSelect, exportFullscreenBtn;
  let fsPlayBtn, fsSeekBar, fsCurrentTime, fsSpeedSelect, fsVolumeSlider, fsExitBtn;
  let startRecordBtn, previewExportBtn;
  let recordProgress, progressBarInner, progressLabel, progressDetail;
  let progressBarThicknessSlider, progressBarThicknessVal;
  let progressTimeSizeSlider,     progressTimeSizeVal;
  let watermarkOpacitySlider, watermarkOpacityVal;
  let watermarkSizeSlider,    watermarkSizeVal;
  let watermarkPosGrid;
  let watermarkAnimGrid;
  let watermarkEffectGrid;

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
    fsPlayBtn          = document.getElementById('fsPlayBtn');
    fsSeekBar          = document.getElementById('fsSeekBar');
    fsCurrentTime      = document.getElementById('fsCurrentTime');
    fsSpeedSelect      = document.getElementById('fsSpeedSelect');
    fsExitBtn          = document.getElementById('fsExitBtn');
    startRecordBtn     = document.getElementById('startRecordBtn');
    previewExportBtn   = document.getElementById('previewExportBtn');
    recordProgress     = document.getElementById('recordProgress');
    progressBarInner   = document.getElementById('progressBarInner');
    progressLabel      = document.getElementById('progressLabel');
    progressDetail     = document.getElementById('progressDetail');

    // Guard: export panel may not be mounted yet on first boot
    if (!themeSelector || !animGrid || !fontSizeSlider || !exportPlayBtn || !startRecordBtn) {
      console.warn('[EE] init() — EARLY RETURN: critical element missing', { themeSelector: !!themeSelector, animGrid: !!animGrid, fontSizeSlider: !!fontSizeSlider, exportPlayBtn: !!exportPlayBtn, startRecordBtn: !!startRecordBtn });
      return;
    }
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

    /* ── Fill effect grid ── */
    fillEffectGrid = document.getElementById('fillEffectGrid');
    if (fillEffectGrid) {
      fillEffectGrid.innerHTML = '';
      Renderer.FILL_EFFECT_LIST.forEach(ef => {
        const card = document.createElement('div');
        card.className = 'anim-card' + (ef.id === currentFillEffect ? ' active' : '');
        card.dataset.fe = ef.id;
        card.innerHTML = `<span class="anim-emoji">${ef.emoji}</span><span class="anim-label">${ef.label}</span>`;
        card.addEventListener('click', () => {
          currentFillEffect = ef.id;
          fillEffectGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.fe === ef.id));
          renderPreviewFrame();
        });
        fillEffectGrid.appendChild(card);
      });
    }

    /* ── Voice colors in export panel ── */
    _buildExportVoiceColors();

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

    /* ── Progress bar thickness slider ── */
    progressBarThicknessSlider = document.getElementById('progressBarThicknessSlider');
    progressBarThicknessVal    = document.getElementById('progressBarThicknessVal');
    if (progressBarThicknessSlider) {
      progressBarThicknessSlider.addEventListener('input', () => {
        currentProgressBarThickness = parseFloat(progressBarThicknessSlider.value);
        if (progressBarThicknessVal) progressBarThicknessVal.textContent = currentProgressBarThickness.toFixed(1) + '×';
        renderPreviewFrame();
      });
    }

    /* ── Progress time text size slider ── */
    progressTimeSizeSlider = document.getElementById('progressTimeSizeSlider');
    progressTimeSizeVal    = document.getElementById('progressTimeSizeVal');
    if (progressTimeSizeSlider) {
      progressTimeSizeSlider.addEventListener('input', () => {
        currentProgressTimeSize = parseFloat(progressTimeSizeSlider.value);
        if (progressTimeSizeVal) progressTimeSizeVal.textContent = currentProgressTimeSize.toFixed(1) + '×';
        renderPreviewFrame();
      });
    }

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
    exportFormatSelect = document.getElementById('exportFormatSelect');
    showProgressToggle = document.getElementById('showProgressToggle');

    // Update hint text when format changes
    if (exportFormatSelect) {
      const _hints = {
        mp4:  'MP4 — H.264 + AAC. Mejor compatibilidad con reproductores y editores.',
        webm: 'WebM — VP9 + Opus. Ideal para web. Requiere Chrome/Edge.',
        avi:  'AVI — MJPEG + PCM16. Máxima compatibilidad clásica. Archivos más grandes.',
      };
      const _hintEl = document.getElementById('exportFormatHint');
      exportFormatSelect.addEventListener('change', () => {
        if (_hintEl) _hintEl.textContent = _hints[exportFormatSelect.value] || '';
      });
    }
    if (glowSlider) {
      glowSlider.addEventListener('input', () => {
        currentGlow = parseFloat(glowSlider.value);
        if (glowVal) glowVal.textContent = currentGlow.toFixed(1) + '×';
        renderPreviewFrame();
      });
    }
    if (textPositionSelect) textPositionSelect.addEventListener('change', () => { currentTextPos = textPositionSelect.value; renderPreviewFrame(); });
    if (showProgressToggle) showProgressToggle.addEventListener('change', renderPreviewFrame);

    /* ── Text shadow controls ── */
    const textShadowTypeGrid    = document.getElementById('textShadowTypeGrid');
    const textShadowColorPicker = document.getElementById('textShadowColorPicker');
    const textShadowBlurSlider  = document.getElementById('textShadowBlurSlider');
    const textShadowBlurVal     = document.getElementById('textShadowBlurVal');
    const textShadowOffsetYSlider = document.getElementById('textShadowOffsetYSlider');
    const textShadowOffsetYVal  = document.getElementById('textShadowOffsetYVal');

    if (textShadowTypeGrid) {
      textShadowTypeGrid.addEventListener('click', e => {
        const btn = e.target.closest('[data-shadow-type]');
        if (!btn) return;
        currentTextShadowType = btn.dataset.shadowType;
        textShadowTypeGrid.querySelectorAll('[data-shadow-type]').forEach(b => b.classList.toggle('active', b === btn));
        renderPreviewFrame();
      });
    }
    if (textShadowColorPicker) textShadowColorPicker.addEventListener('input', () => { currentTextShadowColor = textShadowColorPicker.value; renderPreviewFrame(); });
    if (textShadowBlurSlider) {
      textShadowBlurSlider.addEventListener('input', () => {
        currentTextShadowBlur = parseInt(textShadowBlurSlider.value, 10);
        if (textShadowBlurVal) textShadowBlurVal.textContent = currentTextShadowBlur + 'px';
        renderPreviewFrame();
      });
    }
    if (textShadowOffsetYSlider) {
      textShadowOffsetYSlider.addEventListener('input', () => {
        currentTextShadowOffsetY = parseInt(textShadowOffsetYSlider.value, 10);
        if (textShadowOffsetYVal) textShadowOffsetYVal.textContent = currentTextShadowOffsetY + 'px';
        renderPreviewFrame();
      });
    }

    /* ── Stroke / contorno controls ── */
    const strokeEffectGrid   = document.getElementById('strokeEffectGrid');
    const strokeColorPicker  = document.getElementById('strokeColorPicker');
    const strokeWidthSlider  = document.getElementById('strokeWidthSlider');
    const strokeWidthVal     = document.getElementById('strokeWidthVal');
    if (strokeEffectGrid) {
      strokeEffectGrid.addEventListener('click', e => {
        const btn = e.target.closest('[data-stroke-effect]');
        if (!btn) return;
        currentStrokeEffect = btn.dataset.strokeEffect;
        strokeEffectGrid.querySelectorAll('[data-stroke-effect]').forEach(b => b.classList.toggle('active', b === btn));
        renderPreviewFrame();
      });
    }
    if (strokeColorPicker)  strokeColorPicker.addEventListener('input',  () => { currentStrokeColor = strokeColorPicker.value; renderPreviewFrame(); });
    if (strokeWidthSlider) {
      strokeWidthSlider.addEventListener('input', () => {
        currentStrokeWidth = parseInt(strokeWidthSlider.value, 10);
        if (strokeWidthVal) strokeWidthVal.textContent = currentStrokeWidth + 'px';
        renderPreviewFrame();
      });
    }

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
        const isFs = !!document.fullscreenElement;
        exportFullscreenBtn.textContent = isFs ? '✕' : '⛶';
        exportFullscreenBtn.title = isFs ? 'Salir de pantalla completa' : 'Pantalla completa';
        // Toggle class so CSS can reliably show/hide fs-controls
        const wrap = document.getElementById('exportCanvasWrap');
        wrap?.classList.toggle('is-fullscreen', isFs);
        // Sync fs controls to current state on entry
        if (isFs) {
          const t = Audio.getCurrentTime?.() ?? 0;
          const pct = Audio.duration > 0 ? (t / Audio.duration) * 100 : 0;
          if (fsSeekBar)      fsSeekBar.value = pct;
          if (fsCurrentTime) fsCurrentTime.textContent = formatTime(t);
          if (fsPlayBtn)     fsPlayBtn.textContent = Audio.isPlaying ? '⏸' : '▶';
          if (fsSpeedSelect && exportSpeedSelect) fsSpeedSelect.value = exportSpeedSelect.value;
          if (fsVolumeSlider && exportVolumeSlider) fsVolumeSlider.value = exportVolumeSlider.value;
        }
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

    startRecordBtn.addEventListener('click', async () => {
      if (recording) return;
      const vol = Audio.volume;
      if (typeof vol === 'number' && vol < 1) {
        const pct = Math.round(vol * 100);
        const ok = await AppModal.confirm(
          `El volumen actual está al ${pct}%. Para exportar con la mejor calidad de audio, se ajustará al 100% automáticamente.`,
          { title: '🔊 Ajuste de volumen', icon: '🔊', confirmLabel: 'Exportar al 100%', cancelLabel: 'Cancelar' }
        );
        if (!ok) return;
        Audio.setVolume(1);
        if (exportVolumeSlider) exportVolumeSlider.value = 1;
      }
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

    /* ── Intro card controls ── */
    const introEnabledToggle     = document.getElementById('introEnabledToggle');
    const introTitleInput        = document.getElementById('introTitleInput');
    const introArtistInput       = document.getElementById('introArtistInput');
    const introDurationSlider    = document.getElementById('introDurationSlider');
    const introDurationVal       = document.getElementById('introDurationVal');
    const introTitleColorPicker  = document.getElementById('introTitleColorPicker');
    const introArtistColorPicker = document.getElementById('introArtistColorPicker');
    const introTitleSizeSlider   = document.getElementById('introTitleSizeSlider');
    const introTitleSizeVal      = document.getElementById('introTitleSizeVal');
    const introArtistRatioSlider = document.getElementById('introArtistRatioSlider');
    const introArtistRatioVal    = document.getElementById('introArtistRatioVal');
    const introShowLogoToggle    = document.getElementById('introShowLogoToggle');
    const introStyleGrid         = document.getElementById('introStyleGrid');
    const introTransitionGrid    = document.getElementById('introTransitionGrid');

    function _syncIntroUI() {
      const ic = Intro.get();
      if (introEnabledToggle)     introEnabledToggle.checked       = ic.enabled;
      if (introTitleInput)        introTitleInput.value             = ic.title;
      if (introArtistInput)       introArtistInput.value            = ic.artist;
      if (introDurationSlider)    { introDurationSlider.value = ic.duration;  if (introDurationVal) introDurationVal.textContent = ic.duration.toFixed(1) + 's'; }
      if (introTitleColorPicker)  introTitleColorPicker.value       = ic.titleColor;
      if (introArtistColorPicker) introArtistColorPicker.value      = ic.artistColor;
      if (introTitleSizeSlider)   { introTitleSizeSlider.value = ic.titleSize;  if (introTitleSizeVal) introTitleSizeVal.textContent = ic.titleSize.toFixed(2) + '×'; }
      if (introArtistRatioSlider) { introArtistRatioSlider.value = ic.artistRatio; if (introArtistRatioVal) introArtistRatioVal.textContent = Math.round(ic.artistRatio * 100) + '%'; }
      if (introShowLogoToggle)    introShowLogoToggle.checked       = ic.showLogo;
      if (introStyleGrid)      introStyleGrid.querySelectorAll('.intro-style-card').forEach(c => c.classList.toggle('active', c.dataset.style === ic.style));
      if (introTransitionGrid) introTransitionGrid.querySelectorAll('.intro-trans-card').forEach(c => c.classList.toggle('active', c.dataset.transition === ic.transition));
      const introTransitionOutGrid = document.getElementById('introTransitionOutGrid');
      const introSameTransOutToggle = document.getElementById('introSameTransOutToggle');
      const introTransOutLabel = document.getElementById('introTransOutLabel');
      if (introSameTransOutToggle) introSameTransOutToggle.checked = ic.useSameTransOut;
      if (introTransitionOutGrid) {
        introTransitionOutGrid.style.opacity = ic.useSameTransOut ? '0.4' : '1';
        introTransitionOutGrid.style.pointerEvents = ic.useSameTransOut ? 'none' : 'auto';
        introTransitionOutGrid.querySelectorAll('.intro-trans-card').forEach(c => c.classList.toggle('active', c.dataset.transitionOut === (ic.transitionOut || ic.transition)));
      }
      if (introTransOutLabel) introTransOutLabel.style.opacity = ic.useSameTransOut ? '0.4' : '1';

      // New typography / glow / shadow sync
      const introTitleFontSelectEl  = document.getElementById('introTitleFontSelect');
      const introArtistFontSelectEl = document.getElementById('introArtistFontSelect');
      if (introTitleFontSelectEl)  introTitleFontSelectEl.value  = ic.titleFont  || '';
      if (introArtistFontSelectEl) introArtistFontSelectEl.value = ic.artistFont || '';

      const introTitleGlowSliderEl  = document.getElementById('introTitleGlowSlider');
      const introTitleGlowValEl     = document.getElementById('introTitleGlowVal');
      const introArtistGlowSliderEl = document.getElementById('introArtistGlowSlider');
      const introArtistGlowValEl    = document.getElementById('introArtistGlowVal');
      if (introTitleGlowSliderEl)  { introTitleGlowSliderEl.value  = ic.titleGlow  ?? 1.0; if (introTitleGlowValEl)  introTitleGlowValEl.textContent  = (ic.titleGlow  ?? 1.0).toFixed(1) + '×'; }
      if (introArtistGlowSliderEl) { introArtistGlowSliderEl.value = ic.artistGlow ?? 0.6; if (introArtistGlowValEl) introArtistGlowValEl.textContent = (ic.artistGlow ?? 0.6).toFixed(1) + '×'; }

      const introTitleShadowColorEl   = document.getElementById('introTitleShadowColorPicker');
      const introTitleShadowBlurEl    = document.getElementById('introTitleShadowBlurSlider');
      const introTitleShadowBlurValEl = document.getElementById('introTitleShadowBlurVal');
      const introTitleShadowOffsetEl  = document.getElementById('introTitleShadowOffsetSlider');
      const introTitleShadowOffsetValEl = document.getElementById('introTitleShadowOffsetVal');
      if (introTitleShadowColorEl)   introTitleShadowColorEl.value   = ic.titleShadowColor  || '#000000';
      if (introTitleShadowBlurEl)    { introTitleShadowBlurEl.value    = ic.titleShadowBlur    ?? 0; if (introTitleShadowBlurValEl)    introTitleShadowBlurValEl.textContent    = (ic.titleShadowBlur    ?? 0) + 'px'; }
      if (introTitleShadowOffsetEl)  { introTitleShadowOffsetEl.value  = ic.titleShadowOffsetY ?? 2; if (introTitleShadowOffsetValEl)  introTitleShadowOffsetValEl.textContent  = (ic.titleShadowOffsetY ?? 2) + 'px'; }

      const introArtistShadowColorEl   = document.getElementById('introArtistShadowColorPicker');
      const introArtistShadowBlurEl    = document.getElementById('introArtistShadowBlurSlider');
      const introArtistShadowBlurValEl = document.getElementById('introArtistShadowBlurVal');
      if (introArtistShadowColorEl)  introArtistShadowColorEl.value   = ic.artistShadowColor || '#000000';
      if (introArtistShadowBlurEl)   { introArtistShadowBlurEl.value   = ic.artistShadowBlur  ?? 0; if (introArtistShadowBlurValEl) introArtistShadowBlurValEl.textContent = (ic.artistShadowBlur ?? 0) + 'px'; }
    }

    if (introEnabledToggle) introEnabledToggle.addEventListener('change', () => { Intro.set({ enabled: introEnabledToggle.checked }); renderPreviewFrame(); });
    if (introTitleInput)    introTitleInput.addEventListener('input',  debounce(() => { Intro.set({ title:  introTitleInput.value  }); renderPreviewFrame(); }, 200));
    if (introArtistInput)   introArtistInput.addEventListener('input', debounce(() => { Intro.set({ artist: introArtistInput.value }); renderPreviewFrame(); }, 200));
    if (introDurationSlider) {
      introDurationSlider.addEventListener('input', () => {
        const d = parseFloat(introDurationSlider.value);
        Intro.set({ duration: d });
        if (introDurationVal) introDurationVal.textContent = d.toFixed(1) + 's';
        renderPreviewFrame();
      });
    }
    if (introTitleColorPicker)  introTitleColorPicker.addEventListener('input',  () => { Intro.set({ titleColor:  introTitleColorPicker.value  }); renderPreviewFrame(); });
    if (introArtistColorPicker) introArtistColorPicker.addEventListener('input', () => { Intro.set({ artistColor: introArtistColorPicker.value }); renderPreviewFrame(); });
    if (introTitleSizeSlider) {
      introTitleSizeSlider.addEventListener('input', () => {
        const v = parseFloat(introTitleSizeSlider.value);
        Intro.set({ titleSize: v });
        if (introTitleSizeVal) introTitleSizeVal.textContent = v.toFixed(2) + '×';
        renderPreviewFrame();
      });
    }
    if (introArtistRatioSlider) {
      introArtistRatioSlider.addEventListener('input', () => {
        const v = parseFloat(introArtistRatioSlider.value);
        Intro.set({ artistRatio: v });
        if (introArtistRatioVal) introArtistRatioVal.textContent = Math.round(v * 100) + '%';
        renderPreviewFrame();
      });
    }
    if (introShowLogoToggle) introShowLogoToggle.addEventListener('change', () => { Intro.set({ showLogo: introShowLogoToggle.checked }); renderPreviewFrame(); });
    if (introStyleGrid) {
      introStyleGrid.addEventListener('click', e => {
        const card = e.target.closest('.intro-style-card');
        if (!card) return;
        Intro.set({ style: card.dataset.style });
        introStyleGrid.querySelectorAll('.intro-style-card').forEach(c => c.classList.toggle('active', c === card));
        renderPreviewFrame();
      });
    }
    if (introTransitionGrid) {
      introTransitionGrid.addEventListener('click', e => {
        const card = e.target.closest('.intro-trans-card');
        if (!card) return;
        Intro.set({ transition: card.dataset.transition });
        introTransitionGrid.querySelectorAll('.intro-trans-card').forEach(c => c.classList.toggle('active', c === card));
        // Seek to start of intro to show entry transition
        Audio.seek(0);
        renderPreviewFrame();
      });
    }
    const introTransitionOutGrid = document.getElementById('introTransitionOutGrid');
    const introSameTransOutToggle = document.getElementById('introSameTransOutToggle');
    const introTransOutLabel = document.getElementById('introTransOutLabel');
    if (introTransitionOutGrid) {
      introTransitionOutGrid.addEventListener('click', e => {
        const card = e.target.closest('.intro-trans-card');
        if (!card) return;
        Intro.set({ transitionOut: card.dataset.transitionOut });
        introTransitionOutGrid.querySelectorAll('.intro-trans-card').forEach(c => c.classList.toggle('active', c === card));
        // Seek to show exit transition (go to end of intro minus exit transition duration)
        const ic = Intro.get();
        const introDur = ic.duration || 4;
        const exitStartTime = Math.max(0, introDur - 1);
        Audio.seek(exitStartTime);
        renderPreviewFrame();
      });
    }
    if (introSameTransOutToggle) {
      introSameTransOutToggle.addEventListener('change', () => {
        const useSame = introSameTransOutToggle.checked;
        Intro.set({ useSameTransOut: useSame, transitionOut: useSame ? null : Intro.get().transition });
        if (introTransitionOutGrid) {
          introTransitionOutGrid.style.opacity = useSame ? '0.4' : '1';
          introTransitionOutGrid.style.pointerEvents = useSame ? 'none' : 'auto';
        }
        if (introTransOutLabel) introTransOutLabel.style.opacity = useSame ? '0.4' : '1';
        renderPreviewFrame();
      });
    }
    _syncIntroUI();

    /* ── Intro typography / glow / shadow controls ── */
    const introTitleFontSelect  = document.getElementById('introTitleFontSelect');
    const introArtistFontSelect = document.getElementById('introArtistFontSelect');
    if (introTitleFontSelect)  introTitleFontSelect.addEventListener('change',  () => { Intro.set({ titleFont:  introTitleFontSelect.value  }); renderPreviewFrame(); });
    if (introArtistFontSelect) introArtistFontSelect.addEventListener('change', () => { Intro.set({ artistFont: introArtistFontSelect.value }); renderPreviewFrame(); });

    const introTitleGlowSlider  = document.getElementById('introTitleGlowSlider');
    const introTitleGlowVal     = document.getElementById('introTitleGlowVal');
    const introArtistGlowSlider = document.getElementById('introArtistGlowSlider');
    const introArtistGlowVal    = document.getElementById('introArtistGlowVal');
    if (introTitleGlowSlider) {
      introTitleGlowSlider.addEventListener('input', () => {
        const v = parseFloat(introTitleGlowSlider.value);
        Intro.set({ titleGlow: v });
        if (introTitleGlowVal) introTitleGlowVal.textContent = v.toFixed(1) + '×';
        renderPreviewFrame();
      });
    }
    if (introArtistGlowSlider) {
      introArtistGlowSlider.addEventListener('input', () => {
        const v = parseFloat(introArtistGlowSlider.value);
        Intro.set({ artistGlow: v });
        if (introArtistGlowVal) introArtistGlowVal.textContent = v.toFixed(1) + '×';
        renderPreviewFrame();
      });
    }

    const introTitleShadowColorPicker  = document.getElementById('introTitleShadowColorPicker');
    const introTitleShadowBlurSlider   = document.getElementById('introTitleShadowBlurSlider');
    const introTitleShadowBlurVal      = document.getElementById('introTitleShadowBlurVal');
    const introTitleShadowOffsetSlider = document.getElementById('introTitleShadowOffsetSlider');
    const introTitleShadowOffsetVal    = document.getElementById('introTitleShadowOffsetVal');
    if (introTitleShadowColorPicker)  introTitleShadowColorPicker.addEventListener('input',  () => { Intro.set({ titleShadowColor:  introTitleShadowColorPicker.value }); renderPreviewFrame(); });
    if (introTitleShadowBlurSlider) {
      introTitleShadowBlurSlider.addEventListener('input', () => {
        const v = parseInt(introTitleShadowBlurSlider.value, 10);
        Intro.set({ titleShadowBlur: v });
        if (introTitleShadowBlurVal) introTitleShadowBlurVal.textContent = v + 'px';
        renderPreviewFrame();
      });
    }
    if (introTitleShadowOffsetSlider) {
      introTitleShadowOffsetSlider.addEventListener('input', () => {
        const v = parseInt(introTitleShadowOffsetSlider.value, 10);
        Intro.set({ titleShadowOffsetY: v });
        if (introTitleShadowOffsetVal) introTitleShadowOffsetVal.textContent = v + 'px';
        renderPreviewFrame();
      });
    }

    const introArtistShadowColorPicker = document.getElementById('introArtistShadowColorPicker');
    const introArtistShadowBlurSlider  = document.getElementById('introArtistShadowBlurSlider');
    const introArtistShadowBlurVal     = document.getElementById('introArtistShadowBlurVal');
    if (introArtistShadowColorPicker)  introArtistShadowColorPicker.addEventListener('input',  () => { Intro.set({ artistShadowColor: introArtistShadowColorPicker.value }); renderPreviewFrame(); });
    if (introArtistShadowBlurSlider) {
      introArtistShadowBlurSlider.addEventListener('input', () => {
        const v = parseInt(introArtistShadowBlurSlider.value, 10);
        Intro.set({ artistShadowBlur: v });
        if (introArtistShadowBlurVal) introArtistShadowBlurVal.textContent = v + 'px';
        renderPreviewFrame();
      });
    }

    /* ── Outro card controls ── */
    function _syncOutroUI() {
      const oc = Outro.get();
      const outroEnabledToggle      = document.getElementById('outroEnabledToggle');
      const outroMirrorToggle       = document.getElementById('outroMirrorToggle');
      const outroTitleInput         = document.getElementById('outroTitleInput');
      const outroArtistInput        = document.getElementById('outroArtistInput');
      const outroDurationSlider     = document.getElementById('outroDurationSlider');
      const outroDurationVal        = document.getElementById('outroDurationVal');
      const outroTitleColorPicker   = document.getElementById('outroTitleColorPicker');
      const outroArtistColorPicker  = document.getElementById('outroArtistColorPicker');
      const outroTitleSizeSlider    = document.getElementById('outroTitleSizeSlider');
      const outroTitleSizeVal       = document.getElementById('outroTitleSizeVal');
      const outroArtistRatioSlider  = document.getElementById('outroArtistRatioSlider');
      const outroArtistRatioVal     = document.getElementById('outroArtistRatioVal');
      const outroShowLogoToggle     = document.getElementById('outroShowLogoToggle');
      const outroStyleGrid          = document.getElementById('outroStyleGrid');
      const outroTransitionGrid     = document.getElementById('outroTransitionGrid');
      if (outroEnabledToggle)      outroEnabledToggle.checked = oc.enabled;
      if (outroMirrorToggle)       outroMirrorToggle.checked  = oc.mirrorIntro;
      if (outroTitleInput)         outroTitleInput.value       = oc.title;
      if (outroArtistInput)        outroArtistInput.value      = oc.artist;
      if (outroDurationSlider)     { outroDurationSlider.value = oc.duration; if (outroDurationVal) outroDurationVal.textContent = oc.duration.toFixed(1) + 's'; }
      if (outroTitleColorPicker)   outroTitleColorPicker.value  = oc.titleColor;
      if (outroArtistColorPicker)  outroArtistColorPicker.value = oc.artistColor;
      if (outroTitleSizeSlider)    { outroTitleSizeSlider.value = oc.titleSize; if (outroTitleSizeVal) outroTitleSizeVal.textContent = oc.titleSize.toFixed(2) + '×'; }
      if (outroArtistRatioSlider)  { outroArtistRatioSlider.value = oc.artistRatio; if (outroArtistRatioVal) outroArtistRatioVal.textContent = Math.round(oc.artistRatio * 100) + '%'; }
      if (outroShowLogoToggle)     outroShowLogoToggle.checked  = oc.showLogo;
      if (outroStyleGrid)     outroStyleGrid.querySelectorAll('.intro-style-card').forEach(c => c.classList.toggle('active', c.dataset.style === oc.style));
      if (outroTransitionGrid) outroTransitionGrid.querySelectorAll('.intro-trans-card').forEach(c => c.classList.toggle('active', c.dataset.transition === oc.transition));
      // Mirror-dependent fields opacity
      const isLocked = oc.mirrorIntro;
      [outroTitleInput, outroArtistInput, outroTitleColorPicker, outroArtistColorPicker, outroTitleSizeSlider, outroArtistRatioSlider, outroStyleGrid, outroTransitionGrid, outroShowLogoToggle].forEach(el => {
        if (el) el.style.opacity = isLocked ? '0.45' : '1'; if (el) el.style.pointerEvents = isLocked ? 'none' : 'auto';
      });
    }

    function _outroMirrorApply() {
      Outro.mirrorFrom(Intro.get());
      _syncOutroUI();
      renderPreviewFrame();
    }

    const outroEnabledToggle = document.getElementById('outroEnabledToggle');
    if (outroEnabledToggle) outroEnabledToggle.addEventListener('change', () => { Outro.set({ enabled: outroEnabledToggle.checked }); renderPreviewFrame(); });
    const outroMirrorToggle = document.getElementById('outroMirrorToggle');
    if (outroMirrorToggle)  outroMirrorToggle.addEventListener('change', () => { Outro.set({ mirrorIntro: outroMirrorToggle.checked }); if (outroMirrorToggle.checked) _outroMirrorApply(); else _syncOutroUI(); });
    const outroCopyIntroBtn = document.getElementById('outroCopyIntroBtn');
    if (outroCopyIntroBtn)  outroCopyIntroBtn.addEventListener('click', () => { _outroMirrorApply(); });
    const outroTitleInput = document.getElementById('outroTitleInput');
    if (outroTitleInput)    outroTitleInput.addEventListener('input', debounce(() => { Outro.set({ title: outroTitleInput.value }); renderPreviewFrame(); }, 200));
    const outroArtistInput = document.getElementById('outroArtistInput');
    if (outroArtistInput)   outroArtistInput.addEventListener('input', debounce(() => { Outro.set({ artist: outroArtistInput.value }); renderPreviewFrame(); }, 200));
    const outroDurationSlider = document.getElementById('outroDurationSlider');
    if (outroDurationSlider) outroDurationSlider.addEventListener('input', () => { const d = parseFloat(outroDurationSlider.value); Outro.set({ duration: d }); const v = document.getElementById('outroDurationVal'); if (v) v.textContent = d.toFixed(1) + 's'; renderPreviewFrame(); });
    const outroTitleColorPicker  = document.getElementById('outroTitleColorPicker');
    if (outroTitleColorPicker)   outroTitleColorPicker.addEventListener('input',  () => { Outro.set({ titleColor:  outroTitleColorPicker.value  }); renderPreviewFrame(); });
    const outroArtistColorPicker = document.getElementById('outroArtistColorPicker');
    if (outroArtistColorPicker)  outroArtistColorPicker.addEventListener('input', () => { Outro.set({ artistColor: outroArtistColorPicker.value }); renderPreviewFrame(); });
    const outroTitleSizeSlider = document.getElementById('outroTitleSizeSlider');
    if (outroTitleSizeSlider)  outroTitleSizeSlider.addEventListener('input', () => { const v = parseFloat(outroTitleSizeSlider.value); Outro.set({ titleSize: v }); const lbl = document.getElementById('outroTitleSizeVal'); if (lbl) lbl.textContent = v.toFixed(2) + '×'; renderPreviewFrame(); });
    const outroArtistRatioSlider = document.getElementById('outroArtistRatioSlider');
    if (outroArtistRatioSlider)  outroArtistRatioSlider.addEventListener('input', () => { const v = parseFloat(outroArtistRatioSlider.value); Outro.set({ artistRatio: v }); const lbl = document.getElementById('outroArtistRatioVal'); if (lbl) lbl.textContent = Math.round(v * 100) + '%'; renderPreviewFrame(); });
    const outroShowLogoToggle = document.getElementById('outroShowLogoToggle');
    if (outroShowLogoToggle) outroShowLogoToggle.addEventListener('change', () => { Outro.set({ showLogo: outroShowLogoToggle.checked }); renderPreviewFrame(); });
    const outroStyleGrid = document.getElementById('outroStyleGrid');
    if (outroStyleGrid) {
      outroStyleGrid.addEventListener('click', e => {
        const card = e.target.closest('.intro-style-card'); if (!card) return;
        Outro.set({ style: card.dataset.style });
        outroStyleGrid.querySelectorAll('.intro-style-card').forEach(c => c.classList.toggle('active', c === card));
        renderPreviewFrame();
      });
    }
    const outroTransitionGrid = document.getElementById('outroTransitionGrid');
    if (outroTransitionGrid) {
      outroTransitionGrid.addEventListener('click', e => {
        const card = e.target.closest('.intro-trans-card'); if (!card) return;
        Outro.set({ transition: card.dataset.transition });
        outroTransitionGrid.querySelectorAll('.intro-trans-card').forEach(c => c.classList.toggle('active', c === card));
        // Seek to near the end to preview outro entry
        const t = Math.max(0, Audio.duration - (Outro.get().duration || 4));
        Audio.seek(t); renderPreviewFrame();
      });
    }
    _syncOutroUI();
  }

  function _buildExportVoiceColors() {
    const container = document.getElementById('exportVoiceColorsWrap');
    if (!container) return;
    container.innerHTML = '';
    const vc = Sync.getVoiceConfig();
    const btnStyle = 'width:32px;height:32px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);cursor:pointer;flex-shrink:0';
    const voices = vc.count > 1 ? vc.voices : [vc.voices[0]];
    voices.forEach((v, i) => {
      const n = i + 1;
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px';
      const swatch = document.createElement('label');
      swatch.id = `exp_voiceSwatch_${n}`;
      swatch.htmlFor = `exp_voiceColor_${n}`;
      swatch.style.cssText = btnStyle + `;background:${v.color};box-shadow:0 0 6px ${v.color}66`;
      swatch.title = 'Haz clic para cambiar color';
      const nameEl = document.createElement('span');
      nameEl.style.cssText = 'flex:1;font-size:0.83rem;color:var(--text-dim)';
      nameEl.textContent = v.name || `Voz ${n}`;
      const picker = document.createElement('input');
      picker.type = 'color'; picker.id = `exp_voiceColor_${n}`;
      picker.className = 'color-picker'; picker.value = v.color;
      picker.addEventListener('input', () => { Sync.setVoiceColor(n, picker.value); renderPreviewFrame(); });
      row.append(swatch, nameEl, picker);
      container.appendChild(row);
    });
    if (vc.count > 1) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px';
      const swatch = document.createElement('label');
      swatch.id = 'exp_allVoiceSwatch'; swatch.htmlFor = 'exp_allVoiceColor';
      swatch.style.cssText = btnStyle + `;background:${vc.allColor}`;
      const nameEl = document.createElement('span');
      nameEl.style.cssText = 'flex:1;font-size:0.83rem;color:var(--text-dim)'; nameEl.textContent = 'Todos juntos';
      const picker = document.createElement('input');
      picker.type = 'color'; picker.id = 'exp_allVoiceColor'; picker.className = 'color-picker'; picker.value = vc.allColor;
      picker.addEventListener('input', () => { Sync.setVoiceColor(0, picker.value); renderPreviewFrame(); });
      row.append(swatch, nameEl, picker); container.appendChild(row);
    }
  }
  function setup() {
    if (Audio.isPlaying) { Audio.pause(); exportPlayBtn.textContent = '▶'; }
    stopPreviewLoop();
    Audio.seek(0);

    Audio.onTimeUpdate = t => {
      if (!recording) {
        const pct = Audio.duration > 0 ? (t / Audio.duration) * 100 : 0;
        exportSeekBar.value = pct;
        exportCurrentTime.textContent = formatTime(t);
        if (fsSeekBar)      fsSeekBar.value           = pct;
        if (fsCurrentTime) fsCurrentTime.textContent  = formatTime(t);
        renderPreviewAt(t);
      }
    };

    Audio.onEnded = () => {
      exportPlayBtn.textContent = '▶';
      if (fsPlayBtn) fsPlayBtn.textContent = '▶';
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
    // Wire inactive color picker listener (fresh each activation)
    if (inactiveColorPicker) {
      inactiveColorPicker.addEventListener('input', () => {
        currentInactiveColor = inactiveColorPicker.value;
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
    // If intro is enabled, override to show the intro card on entry
    const _introPreview = Intro.get();
    if (_introPreview.enabled && _introPreview.duration > 0) {
      seekTarget = 0;
    }
    Audio.seek(seekTarget);
    exportSeekBar.value = Audio.duration > 0 ? (seekTarget / Audio.duration) * 100 : 0;
    exportCurrentTime.textContent = formatTime(seekTarget);

    renderPreviewAt(seekTarget);
    // Refresh voice color pickers in export panel to reflect current Sync state
    _buildExportVoiceColors();

    /* ── Re-grab fs control refs (Panel4 is now mounted) ── */
    fsPlayBtn      = document.getElementById('fsPlayBtn');
    fsSeekBar      = document.getElementById('fsSeekBar');
    fsCurrentTime  = document.getElementById('fsCurrentTime');
    fsSpeedSelect  = document.getElementById('fsSpeedSelect');
    fsVolumeSlider = document.getElementById('fsVolumeSlider');
    fsExitBtn      = document.getElementById('fsExitBtn');

    /* ── Wire fs controls (using signal so they’re cleaned up on next setup()) ── */
    if (fsPlayBtn) {
      fsPlayBtn.textContent = Audio.isPlaying ? '⏸' : '▶';
      fsPlayBtn.addEventListener('click', () => {
        if (recording) return;
        if (Audio.isPlaying) {
          Audio.pause(); stopPreviewLoop();
          fsPlayBtn.textContent = '▶'; exportPlayBtn.textContent = '▶';
        } else {
          startPreviewLoop(); Audio.play(Audio.getCurrentTime?.() ?? 0);
          fsPlayBtn.textContent = '⏸'; exportPlayBtn.textContent = '⏸';
        }
      }, { signal });
    }
    if (fsSeekBar) {
      fsSeekBar.value = exportSeekBar.value;
      fsSeekBar.addEventListener('input', () => {
        const t = (fsSeekBar.value / 100) * Audio.duration;
        Audio.seek(t); renderPreviewAt(t);
        exportSeekBar.value = fsSeekBar.value;
        exportCurrentTime.textContent = formatTime(t);
        if (fsCurrentTime) fsCurrentTime.textContent = formatTime(t);
      }, { signal });
    }
    if (fsSpeedSelect && exportSpeedSelect) {
      fsSpeedSelect.value = exportSpeedSelect.value;
      fsSpeedSelect.addEventListener('change', () => {
        Audio.setPlaybackRate(parseFloat(fsSpeedSelect.value));
        if (exportSpeedSelect) exportSpeedSelect.value = fsSpeedSelect.value;
      }, { signal });
    }
    if (fsVolumeSlider && exportVolumeSlider) {
      fsVolumeSlider.value = exportVolumeSlider.value;
      fsVolumeSlider.addEventListener('input', () => {
        const v = parseFloat(fsVolumeSlider.value);
        Audio.setVolume(v);
        if (exportVolumeSlider) exportVolumeSlider.value = v;
        const icon = document.getElementById('exportVolIcon');
        if (icon) icon.textContent = v === 0 ? '🔇' : v < 0.5 ? '🔉' : '🔊';
        const fsVolIcon = document.getElementById('fsVolIcon');
        if (fsVolIcon) fsVolIcon.textContent = v === 0 ? '🔇' : v < 0.5 ? '🔉' : '🔊';
      }, { signal });
    }
    if (fsExitBtn) {
      fsExitBtn.addEventListener('click', () => document.exitFullscreen?.(), { signal });
    }

    /* ── Watermark: all controls ── */
    const wmToggle = document.getElementById('watermarkToggle');
    if (wmToggle) {
      wmToggle.checked = showWatermark;
      wmToggle.addEventListener('change', () => { showWatermark = wmToggle.checked; renderPreviewFrame(); }, { signal });
    }
    watermarkOpacitySlider = document.getElementById('watermarkOpacitySlider');
    watermarkOpacityVal    = document.getElementById('watermarkOpacityVal');
    if (watermarkOpacitySlider) {
      watermarkOpacitySlider.value = currentWatermarkOpacity;
      if (watermarkOpacityVal) watermarkOpacityVal.textContent = Math.round(currentWatermarkOpacity * 100) + '%';
      watermarkOpacitySlider.addEventListener('input', () => {
        currentWatermarkOpacity = parseFloat(watermarkOpacitySlider.value);
        if (watermarkOpacityVal) watermarkOpacityVal.textContent = Math.round(currentWatermarkOpacity * 100) + '%';
        renderPreviewFrame();
      }, { signal });
    }
    watermarkSizeSlider = document.getElementById('watermarkSizeSlider');
    watermarkSizeVal    = document.getElementById('watermarkSizeVal');
    if (watermarkSizeSlider) {
      watermarkSizeSlider.value = currentWatermarkSize;
      if (watermarkSizeVal) watermarkSizeVal.textContent = Math.round(currentWatermarkSize * 100) + '%';
      watermarkSizeSlider.addEventListener('input', () => {
        currentWatermarkSize = parseFloat(watermarkSizeSlider.value);
        if (watermarkSizeVal) watermarkSizeVal.textContent = Math.round(currentWatermarkSize * 100) + '%';
        renderPreviewFrame();
      }, { signal });
    }
    watermarkPosGrid = document.getElementById('watermarkPosGrid');
    if (watermarkPosGrid) {
      watermarkPosGrid.querySelectorAll('.wm-pos-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.pos === currentWatermarkPos);
        btn.addEventListener('click', () => {
          currentWatermarkPos = btn.dataset.pos;
          watermarkPosGrid.querySelectorAll('.wm-pos-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === currentWatermarkPos));
          renderPreviewFrame();
        }, { signal });
      });
    }
    // ── Watermark time ranges (up to 3) ──
    [1, 2, 3].forEach(n => {
      const idx    = n - 1;
      const toggle = document.getElementById(`wmR${n}Toggle`);
      const panel  = document.getElementById(`wmR${n}Panel`);
      const fromEl = document.getElementById(`wmR${n}From`);
      const fromTx = document.getElementById(`wmR${n}FromText`);
      const toEl   = document.getElementById(`wmR${n}To`);
      const toTx   = document.getElementById(`wmR${n}ToText`);
      const dur    = Math.ceil(Audio.duration || 600);

      if (toggle) {
        toggle.checked = watermarkRanges[idx].enabled;
        if (panel) panel.style.display = watermarkRanges[idx].enabled ? '' : 'none';
        toggle.addEventListener('change', () => {
          watermarkRanges[idx].enabled = toggle.checked;
          if (panel) panel.style.display = toggle.checked ? '' : 'none';
          renderPreviewFrame();
        }, { signal });
      }

      // Helper: wire a slider + text-input pair for a range field ('from' or 'to')
      function _wireRangeField(sliderEl, textEl, getVal, setVal) {
        if (!sliderEl) return;
        sliderEl.max   = dur;
        sliderEl.value = getVal();
        if (textEl) textEl.value = _secToMmss(getVal());

        sliderEl.addEventListener('input', () => {
          const v = parseInt(sliderEl.value, 10);
          setVal(v);
          if (textEl) textEl.value = _secToMmss(v);
          renderPreviewFrame();
        }, { signal });

        if (textEl) {
          const commit = () => {
            const v = _mmssToSec(textEl.value, dur);
            setVal(v);
            sliderEl.value = v;
            textEl.value   = _secToMmss(v);
            renderPreviewFrame();
          };
          textEl.addEventListener('change', commit, { signal });
          textEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); textEl.blur(); } }, { signal });
        }
      }

      _wireRangeField(fromEl, fromTx,
        () => watermarkRanges[idx].from,
        v  => { watermarkRanges[idx].from = v; }
      );
      _wireRangeField(toEl, toTx,
        () => watermarkRanges[idx].to,
        v  => { watermarkRanges[idx].to = v; }
      );
    });
    watermarkAnimGrid = document.getElementById('watermarkAnimGrid');
    if (watermarkAnimGrid) {
      watermarkAnimGrid.querySelectorAll('.wm-pos-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.anim === watermarkAnim);
        btn.addEventListener('click', () => {
          watermarkAnim = btn.dataset.anim;
          watermarkAnimGrid.querySelectorAll('.wm-pos-btn').forEach(b => b.classList.toggle('active', b.dataset.anim === watermarkAnim));
          renderPreviewFrame();
        }, { signal });
      });
    }
    watermarkEffectGrid = document.getElementById('watermarkEffectGrid');
    if (watermarkEffectGrid) {
      watermarkEffectGrid.querySelectorAll('.wm-pos-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.vfx === watermarkVisualEffect);
        btn.addEventListener('click', () => {
          watermarkVisualEffect = btn.dataset.vfx;
          watermarkEffectGrid.querySelectorAll('.wm-pos-btn').forEach(b => b.classList.toggle('active', b.dataset.vfx === watermarkVisualEffect));
          renderPreviewFrame();
        }, { signal });
      });
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */

  /** Seconds → "M:SS" string */
  function _secToMmss(s) {
    const sec = Math.max(0, Math.round(s));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  /** "M:SS" / "MM:SS" / bare number → integer seconds, clamped to [0, max] */
  function _mmssToSec(str, max) {
    const parts = String(str).trim().split(':');
    let sec;
    if (parts.length >= 2) {
      sec = parseInt(parts[0], 10) * 60 + parseInt(parts[parts.length - 1], 10);
    } else {
      sec = parseInt(parts[0], 10);
    }
    if (isNaN(sec) || sec < 0) sec = 0;
    return Math.min(sec, max != null ? max : 99999);
  }

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
      progressBarThickness:  currentProgressBarThickness,
      progressTimeSize:      currentProgressTimeSize,
      showTitle:             false,
      voiceConfig:           Sync.getVoiceConfig(),
      fontFamily:            Renderer.FONT_LIST.find(f => f.id === currentFont)?.family || "'Segoe UI', sans-serif",
      activeZoom:            currentZoom,
      textEffect:            currentTextEffect,
      fillEffect:            currentFillEffect,
      progressBarStyle:      currentProgressStyle,
      progressBarOpacity:    currentProgressOpacity,
      progressColorOverride: progressBarColorPicker?.value || null,
      secondarySizeRatio:    currentSecondarySize,
      secondaryOpacity:      currentSecondaryOpacity,
      nextLineOffset:        currentNextOffset,
      prevLineOpacity:       currentPrevOpacity,
      introConfig:           Intro.get(),
      outroConfig:           Outro.get(),
      showWatermark:         showWatermark,
      watermarkOpacity:      currentWatermarkOpacity,
      watermarkSize:         currentWatermarkSize,
      watermarkPosition:     currentWatermarkPos,
      watermarkRanges:       watermarkRanges,
      watermarkAnim:         watermarkAnim,
      watermarkVisualEffect:  watermarkVisualEffect,
      lyricsEndTime:         Lyrics.getEndTime(),
      textShadowType:        currentTextShadowType,
      textShadowColor:       currentTextShadowColor,
      textShadowBlur:        currentTextShadowBlur,
      textShadowOffsetX:     0,
      textShadowOffsetY:     currentTextShadowOffsetY,
      strokeWidth:           currentStrokeWidth,
      strokeColor:           currentStrokeColor,
      strokeEffect:          currentStrokeEffect,
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

  /** Build a safe download filename: "Artista - Título.ext" (or just "Título.ext"). */
  function _buildSafeFilename(ext) {
    const clean = s => (s || '').trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim();
    const title  = clean(Intro.get().title)  || 'karaoke';
    const artist = clean(Intro.get().artist);
    const name   = artist ? artist + ' - ' + title : title;
    return name + '.' + ext;
  }

  function renderPreviewFrame() { renderPreviewAt(Audio.getCurrentTime()); }

  function renderPreviewAt(t) {
    const [rW, rH] = (resolutionSelect.value || '1920x1080').split('x').map(Number);
    if (previewCanvas.width !== rW || previewCanvas.height !== rH) {
      previewCanvas.width = rW; previewCanvas.height = rH;
    }
    const opts = getRenderOpts(t);
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

  // Near-zero delay yield via MessageChannel (avoids 4ms setTimeout minimum clamp)
  function _msYield() {
    return new Promise(resolve => {
      const ch = new MessageChannel();
      ch.port1.onmessage = () => resolve();
      ch.port2.postMessage(null);
    });
  }
  function _fmtSecs(s) {
    if (!isFinite(s) || s <= 0) return '...';
    const m = Math.floor(s / 60), sec = Math.round(s % 60);
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

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
    const _format = exportFormatSelect?.value || 'webm';
    if (hasWebCodecs && Audio.rawFile) {
      try {
        await _startWebCodecsRecording(rW, rH, _format);
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

      const filename  = _buildSafeFilename(ext);

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
      if (progressDetail) progressDetail.textContent = '';
      AppModal.alert('¡Tu video ha sido exportado y descargado correctamente!', { title: '✅ Video listo', icon: '🎬', btnLabel: '¡Genial!' });
    };

    recorder.onerror = err => {
      recording = false;
      audioInfo.stop();
      document.querySelector('.status-idle').classList.remove('hidden');
      recordProgress.classList.add('hidden');
      startRecordBtn.disabled = false;
      previewExportBtn.disabled = false;
      AppModal.alert('Error al grabar: ' + (err.error?.message ?? 'error desconocido'), { title: '❌ Error de exportación', icon: '⚠️', btnStyle: 'danger' });
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

  /* ─── Minimal RIFF/AVI MJPEG container writer ──────────────────
     Produces standard RIFF AVI v1 with MJPEG video + 16-bit PCM audio.
     Compatible with VLC, Windows Media Player, ffmpeg, video editors, etc.
  ──────────────────────────────────────────────────────────────── */
  class _MjpegAviWriter {
    constructor({ width, height, fps, sampleRate, numChannels }) {
      this.w = width; this.h = height; this.fps = fps;
      this.sr = sampleRate; this.nc = numChannels;
      this.vFrames = []; this.aFrames = [];
    }
    addVideo(jpegU8) { this.vFrames.push(jpegU8); }
    addAudio(pcm16)  { this.aFrames.push(pcm16);  }

    finalize() {
      const { w, h, fps, sr, nc } = this;
      const nf          = this.vFrames.length;
      const nBlockAlign = nc * 2; // bytes per stereo/mono sample frame
      const totalAudioBlocks = this.aFrames.reduce((s, a) => s + (a.length / nc), 0);
      const maxVFrame   = Math.max(...this.vFrames.map(f => f.length));

      // ── Pre-calculate movi layout (offsets needed for idx1) ──
      const chunks = []; // { fcc, isKey, data: Uint8Array, pad, moviOff }
      let moviOffset = 4; // bytes inside movi after 'movi' FCC
      for (let i = 0; i < nf; i++) {
        const vd = this.vFrames[i];
        const vPad = vd.length & 1;
        chunks.push({ fcc: 0x30306463 /* '00dc' */, isKey: true,  data: vd, pad: vPad, moviOff: moviOffset });
        moviOffset += 8 + vd.length + vPad;
        if (this.aFrames[i]) {
          const ab = new Uint8Array(this.aFrames[i].buffer, this.aFrames[i].byteOffset, this.aFrames[i].byteLength);
          const aPad = ab.length & 1;
          chunks.push({ fcc: 0x30317762 /* '01wb' */, isKey: false, data: ab, pad: aPad, moviOff: moviOffset });
          moviOffset += 8 + ab.length + aPad;
        }
      }
      const moviDataSize = moviOffset - 4;

      // ── Header & total size calculation ──
      const avihSz = 56, strhSz = 56, strfVSz = 40, strfASz = 18;
      const strlVSz       = 4 + (8 + strhSz) + (8 + strfVSz);
      const strlASz       = 4 + (8 + strhSz) + (8 + strfASz);
      const hdrlPayload   = 4 + (8 + avihSz) + (8 + strlVSz) + (8 + strlASz);
      const moviListPayload = 4 + moviDataSize;
      const idx1Sz        = chunks.length * 16;
      const riffData      = 4 + (8 + hdrlPayload) + (8 + moviListPayload) + (8 + idx1Sz);
      const totalSz       = 8 + riffData;

      const buf = new ArrayBuffer(totalSz);
      const dv  = new DataView(buf);
      const u8  = new Uint8Array(buf);
      let p = 0;

      // Helpers (AVI uses little-endian for sizes, big-endian for FCC viewed as uint32)
      const wFCC = (code) => { dv.setUint32(p, code, false); p += 4; };
      const w4   = (v)    => { dv.setUint32(p, v, true);     p += 4; };
      const w2   = (v)    => { dv.setUint16(p, v, true);     p += 2; };
      const wBuf = (arr)  => { u8.set(arr, p); p += arr.length; };

      // RIFF AVI
      wFCC(0x52494646); w4(riffData); wFCC(0x41564920); // 'RIFF' <size> 'AVI '

      // LIST hdrl
      wFCC(0x4C495354); w4(hdrlPayload); wFCC(0x6864726C); // 'LIST' <size> 'hdrl'

      // avih — AVI main header
      wFCC(0x61766968); w4(avihSz);
      w4(Math.round(1_000_000 / fps)); // dwMicroSecPerFrame
      w4((sr * nBlockAlign) + maxVFrame * fps); // dwMaxBytesPerSec
      w4(0);                           // dwPaddingGranularity
      w4(0x00000110);                  // dwFlags: HASINDEX(0x10) | ISINTERLEAVED(0x100)
      w4(nf);                          // dwTotalFrames
      w4(0);                           // dwInitialFrames
      w4(2);                           // dwStreams
      w4(maxVFrame + Math.ceil(sr / fps) * nBlockAlign); // dwSuggestedBufferSize
      w4(w); w4(h);                    // dwWidth, dwHeight
      w4(0); w4(0); w4(0); w4(0);     // dwReserved[4]

      // LIST strl — video stream
      wFCC(0x4C495354); w4(strlVSz); wFCC(0x7374726C);
      wFCC(0x73747268); w4(strhSz); // strh
      wFCC(0x76696473); // fccType  = 'vids'
      wFCC(0x4D4A5047); // fccHandler = 'MJPG'
      w4(0); w2(0); w2(0); w4(0);   // Flags, Priority, Language, InitialFrames
      w4(1); w4(fps);                // dwScale=1, dwRate=fps
      w4(0); w4(nf);                 // dwStart, dwLength
      w4(maxVFrame);                 // dwSuggestedBufferSize
      w4(0xFFFFFFFF);                // dwQuality
      w4(0);                         // dwSampleSize (variable-size frames)
      w2(0); w2(0); w2(w); w2(h);  // rcFrame
      wFCC(0x73747266); w4(strfVSz); // strf
      w4(40); w4(w); w4(h); w2(1); w2(24); // biSize,Width,Height,Planes,BitCount
      wFCC(0x4D4A5047);              // biCompression = 'MJPG'
      w4(w * h * 3);                 // biSizeImage
      w4(0); w4(0); w4(0); w4(0);   // XPels,YPels,ClrUsed,ClrImportant

      // LIST strl — audio stream
      wFCC(0x4C495354); w4(strlASz); wFCC(0x7374726C);
      wFCC(0x73747268); w4(strhSz); // strh
      wFCC(0x61756473); // fccType = 'auds'
      w4(0);             // fccHandler
      w4(0); w2(0); w2(0); w4(0);               // Flags, Priority, Language, InitialFrames
      w4(nBlockAlign); w4(sr * nBlockAlign);      // dwScale, dwRate
      w4(0); w4(Math.round(totalAudioBlocks));    // dwStart, dwLength (blocks)
      w4(Math.ceil(sr / fps) * nBlockAlign);      // dwSuggestedBufferSize
      w4(0xFFFFFFFF);                             // dwQuality
      w4(nBlockAlign);                            // dwSampleSize
      w2(0); w2(0); w2(0); w2(0);                // rcFrame
      wFCC(0x73747266); w4(strfASz); // strf (WAVEFORMATEX)
      w2(1); w2(nc);                              // WAVE_FORMAT_PCM, nChannels
      w4(sr); w4(sr * nBlockAlign);               // nSamplesPerSec, nAvgBytesPerSec
      w2(nBlockAlign); w2(16); w2(0);             // nBlockAlign, wBitsPerSample, cbSize

      // LIST movi
      wFCC(0x4C495354); w4(moviListPayload); wFCC(0x6D6F7669);
      for (const ck of chunks) {
        wFCC(ck.fcc); w4(ck.data.length);
        wBuf(ck.data);
        if (ck.pad) u8[p++] = 0;
      }

      // idx1 chunk index
      wFCC(0x69647831); w4(idx1Sz);
      for (const ck of chunks) {
        wFCC(ck.fcc);
        w4(ck.isKey ? 0x10 : 0x00); // AVIIF_KEYFRAME
        w4(ck.moviOff);
        w4(ck.data.length);
      }

      return buf;
    }
  }

  /* ─── AVI MJPEG offline render ──────────────────────────── */
  async function _encodeAsAvi(rW, rH, fps, audioBuffer, totalFrames, frameStep) {
    const sampleRate    = audioBuffer.sampleRate;
    const numChannels   = Math.min(audioBuffer.numberOfChannels, 2);
    const channels      = [];
    for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));
    const samplesPerFrame = Math.round(sampleRate / fps);
    const duration        = totalFrames / fps;

    const aviWriter = new _MjpegAviWriter({ width: rW, height: rH, fps, sampleRate: sampleRate, numChannels });

    console.log('[EE] AVI MJPEG render START — resolution:', rW + 'x' + rH,
      '| fps:', fps, '| frames:', totalFrames);
    progressLabel.textContent = 'Renderizando... 0%';

    const offCanvas = document.createElement('canvas');
    offCanvas.width = rW; offCanvas.height = rH;
    if (previewCanvas.width !== rW || previewCanvas.height !== rH) {
      previewCanvas.width = rW; previewCanvas.height = rH;
    }
    const prevCtx = previewCanvas.getContext('2d');
    let _lastYieldA = performance.now();
    const _renderStartA = performance.now();

    for (let i = 0; i < totalFrames; i++) {
      const t = i * frameStep;
      Renderer.drawFrame(offCanvas, getRenderOpts(t));
      if (i % fps === 0) prevCtx.drawImage(offCanvas, 0, 0);

      // Synchronous JPEG encoding via canvas API
      const dataUrl   = offCanvas.toDataURL('image/jpeg', 0.82);
      const b64       = dataUrl.slice(dataUrl.indexOf(',') + 1);
      const rawStr    = atob(b64);
      const jpegBytes = new Uint8Array(rawStr.length);
      for (let j = 0; j < rawStr.length; j++) jpegBytes[j] = rawStr.charCodeAt(j);
      aviWriter.addVideo(jpegBytes);

      // PCM16 interleaved audio for this frame
      const aStart = i * samplesPerFrame;
      const count  = Math.min(samplesPerFrame, audioBuffer.length - aStart);
      const pcm16  = new Int16Array(Math.max(0, count) * numChannels);
      for (let c = 0; c < numChannels; c++) {
        const ch = channels[c];
        for (let s = 0; s < count; s++) {
          const raw = (aStart + s) < ch.length ? ch[aStart + s] : 0;
          pcm16[s * numChannels + c] = Math.max(-32768, Math.min(32767, Math.round(raw * 32767)));
        }
      }
      aviWriter.addAudio(pcm16);

      const pct = Math.round(((i + 1) / totalFrames) * 100);
      progressBarInner.style.width = pct + '%';
      progressLabel.textContent    = `Renderizando AVI... ${pct}%`;
      exportSeekBar.value          = (t / duration) * 100;
      exportCurrentTime.textContent = formatTime(t);
      // Time-based yield — keeps UI responsive at any FPS without over-yielding
      const _nowA = performance.now();
      if (_nowA - _lastYieldA >= 12) {
        const elapsed = (_nowA - _renderStartA) / 1000;
        const rate = elapsed > 0.1 ? (i + 1) / elapsed : 0;
        const remaining = rate > 0 ? (totalFrames - i - 1) / rate : 0;
        if (progressDetail) progressDetail.textContent =
          `Cuadro ${i + 1} / ${totalFrames}  ·  ${rate.toFixed(0)} fps rend.  ·  queda ~${_fmtSecs(remaining)}`;
        await _msYield();
        _lastYieldA = performance.now();
      }
    }

    progressLabel.textContent = 'Finalizando AVI...';
    if (progressDetail) progressDetail.textContent = 'Ensamblando contenedor RIFF/AVI…';
    console.log('[EE] AVI frames done — building RIFF container...');
    await new Promise(r => setTimeout(r, 0)); // one paint before heavy finalize
    const buffer = aviWriter.finalize();
    console.log('[EE] AVI finalized — size:', buffer.byteLength, 'bytes');

    recording = false;
    const blob = new Blob([buffer], { type: 'video/x-msvideo' });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = _buildSafeFilename('avi'); a.click();
    URL.revokeObjectURL(url);

    document.querySelector('.status-idle').classList.remove('hidden');
    recordProgress.classList.add('hidden');
    startRecordBtn.disabled = false;
    previewExportBtn.disabled = false;
    progressBarInner.style.width = '0%';
    if (progressDetail) progressDetail.textContent = '';
    AppModal.alert('¡Tu video AVI ha sido exportado y descargado correctamente!', { title: '✅ Video AVI listo', icon: '🎬', btnLabel: '¡Genial!' });
  }

  /* ─── WebCodecs offline fast render (WebM / MP4) ──────── */
  async function _startWebCodecsRecording(rW, rH, format) {
    const fps       = parseInt(fpsSelect?.value || '30', 10);
    const duration  = Audio.duration;
    const totalFrames = Math.ceil(duration * fps);
    const frameStep   = duration / totalFrames;

    progressLabel.textContent = 'Decodificando audio...';
    if (progressDetail) progressDetail.textContent = 'Leyendo y decodificando el archivo de audio…';
    const arrayBuffer = await Audio.rawFile.arrayBuffer();
    const tempCtx     = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    await tempCtx.close();

    const sampleRate   = audioBuffer.sampleRate;
    const numChannels  = Math.min(audioBuffer.numberOfChannels, 2);
    const totalSamples = audioBuffer.length;

    // ── AVI path delegates to MJPEG writer ──
    if (format === 'avi') {
      return _encodeAsAvi(rW, rH, fps, audioBuffer, totalFrames, frameStep);
    }

    // ── MP4 (H.264 + AAC) or WebM (VP9/VP8 + Opus) ──
    let muxer, videoCodec, audioCodecStr, fileExt, blobType;

    if (format === 'mp4') {
      // Try H.264 profiles from highest level to most compatible.
      // Level 4.2 (0x2A) is required for 1080p 60fps — Level 4.0 (0x28) caps at ~30fps
      // and hardware decoders enforce this strictly, causing playback freezes at 60fps.
      const h264Profiles = ['avc1.640034', 'avc1.64002A', 'avc1.640028', 'avc1.4d001f', 'avc1.42E01E'];
      for (const p of h264Profiles) {
        try {
          const r = await VideoEncoder.isConfigSupported({ codec: p, width: rW, height: rH, bitrate: 4_000_000, framerate: fps });
          if (r.supported) { videoCodec = p; break; }
        } catch (_) {}
      }
      if (!videoCodec) throw new Error('H.264 encoding no soportado en este navegador — intenta WebM');

      const aacCheck = await AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2', sampleRate, numberOfChannels: numChannels, bitrate: 128_000,
      }).catch(() => ({ supported: false }));
      if (!aacCheck.supported) throw new Error('AAC encoding no soportado en este navegador — intenta WebM');

      audioCodecStr = 'mp4a.40.2';
      muxer = new Mp4Muxer({
        target: new Mp4ABTarget(),
        video:  { codec: 'avc', width: rW, height: rH },
        audio:  { codec: 'aac', numberOfChannels: numChannels, sampleRate },
        fastStart: 'in-memory',
      });
      fileExt = 'mp4'; blobType = 'video/mp4';
    } else {
      // WebM — VP9 with VP8 fallback.
      // Level 4.1 (41) supports 1080p 60fps; Level 1.0 (10) only covers sub-240p
      // and causes hardware decoder freezes on higher-resolution content.
      videoCodec = 'vp09.00.41.08';
      try {
        const vRes = await VideoEncoder.isConfigSupported({ codec: videoCodec, width: rW, height: rH, bitrate: 4_000_000, framerate: fps });
        if (!vRes.supported) videoCodec = 'vp8';
      } catch (_) { videoCodec = 'vp8'; }

      audioCodecStr = 'opus';
      muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video:  { codec: videoCodec === 'vp8' ? 'V_VP8' : 'V_VP9', width: rW, height: rH, frameRate: fps },
        audio:  { codec: 'A_OPUS', sampleRate, numberOfChannels: numChannels },
        firstTimestampBehavior: 'offset',
      });
      fileExt = 'webm'; blobType = 'video/webm';
    }

    // Errors stored and rethrown on main loop (throwing from a callback crashes the tab)
    let _vcErr = null, _acErr = null;

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error:  e => { _vcErr = e; },
    });
    // Bitrate scales with resolution and frame rate (5 Mbps baseline at 1080p 30fps)
    const videoBitrate = Math.max(2_000_000, Math.min(20_000_000,
      Math.round(rW * rH * fps / (1920 * 1080 * 30) * 5_000_000)));
    videoEncoder.configure({ codec: videoCodec, width: rW, height: rH, bitrate: videoBitrate, framerate: fps, latencyMode: 'quality' });

    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error:  e => { _acErr = e; },
    });
    audioEncoder.configure({ codec: audioCodecStr, sampleRate, numberOfChannels: numChannels, bitrate: 128_000 });

    console.log('[EE] WebCodecs render START —', fileExt.toUpperCase(),
      '| vcodec:', videoCodec, '| acodec:', audioCodecStr,
      '| resolution:', rW + 'x' + rH, '| fps:', fps, '| bitrate:', videoBitrate,
      '| duration:', duration.toFixed(2) + 's', '| frames:', totalFrames);
    progressLabel.textContent = 'Renderizando... 0%';
    if (progressDetail) progressDetail.textContent = `Preparando ${totalFrames} cuadros a ${fps} fps…`;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = rW; offCanvas.height = rH;
    if (previewCanvas.width !== rW || previewCanvas.height !== rH) {
      previewCanvas.width = rW; previewCanvas.height = rH;
    }
    const prevCtx  = previewCanvas.getContext('2d');
    const MAX_QUEUE = 12;
    let _lastYield = performance.now();
    const _renderStart = performance.now();

    for (let i = 0; i < totalFrames; i++) {
      if (_vcErr) throw _vcErr;
      while (videoEncoder.encodeQueueSize > MAX_QUEUE) {
        await new Promise(r => setTimeout(r, 5));
        if (_vcErr) throw _vcErr;
      }

      // Integer-based timestamps avoid floating-point drift over thousands of frames
      const tsUs  = Math.round(i * 1_000_000 / fps);
      const durUs = Math.round((i + 1) * 1_000_000 / fps) - tsUs;
      const t     = tsUs / 1_000_000;

      Renderer.drawFrame(offCanvas, getRenderOpts(t));
      if (i % fps === 0) prevCtx.drawImage(offCanvas, 0, 0);

      const videoFrame = new VideoFrame(offCanvas, { timestamp: tsUs, duration: durUs });
      // Keyframe every 1 second; force first frame as keyframe unconditionally
      videoEncoder.encode(videoFrame, { keyFrame: i === 0 || i % fps === 0 });
      videoFrame.close();

      const pct = Math.round(((i + 1) / totalFrames) * 100);
      progressBarInner.style.width = pct + '%';
      progressLabel.textContent    = `Renderizando... ${pct}%`;
      exportSeekBar.value          = (t / duration) * 100;
      exportCurrentTime.textContent = formatTime(t);

      // Yield to the browser using time-based check (keeps UI responsive at any FPS)
      const _nowTs = performance.now();
      if (_nowTs - _lastYield >= 12) {
        const elapsed = (_nowTs - _renderStart) / 1000;
        const rate = elapsed > 0.1 ? (i + 1) / elapsed : 0;
        const remaining = rate > 0 ? (totalFrames - i - 1) / rate : 0;
        if (progressDetail) progressDetail.textContent =
          `Cuadro ${i + 1} / ${totalFrames}  ·  ${rate.toFixed(0)} fps rend.  ·  queda ~${_fmtSecs(remaining)}`;
        await _msYield();
        _lastYield = performance.now();
      }
    }
    if (_vcErr) throw _vcErr;
    console.log('[EE] Video frames done — encodeQueueSize:', videoEncoder.encodeQueueSize);

    progressLabel.textContent = 'Codificando audio...';
    if (progressDetail) progressDetail.textContent = 'Procesando y codificando pistas de audio…';
    const audioChunkSamples = Math.round(sampleRate / fps);
    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));

    for (let start = 0; start < totalSamples; start += audioChunkSamples) {
      const count  = Math.min(audioChunkSamples, totalSamples - start);
      const tsUs   = Math.round((start / sampleRate) * 1_000_000);
      const planar = new Float32Array(count * numChannels);
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

    if (_acErr) throw _acErr;
    progressLabel.textContent = 'Finalizando...';
    if (progressDetail) progressDetail.textContent = 'Empaquetando video y audio en el archivo…';
    console.log('[EE] Audio done — flushing encoders...');
    const FLUSH_TIMEOUT = 20_000;
    await Promise.race([
      Promise.all([videoEncoder.flush(), audioEncoder.flush()]),
      new Promise(r => setTimeout(r, FLUSH_TIMEOUT)),
    ]);
    if (_vcErr) throw _vcErr;
    if (_acErr) throw _acErr;
    muxer.finalize();
    console.log('[EE] Muxer finalized — size:', muxer.target.buffer.byteLength, 'bytes');

    recording = false;
    const blob = new Blob([muxer.target.buffer], { type: blobType });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = _buildSafeFilename(fileExt); a.click();
    URL.revokeObjectURL(url);

    document.querySelector('.status-idle').classList.remove('hidden');
    recordProgress.classList.add('hidden');
    startRecordBtn.disabled = false;
    previewExportBtn.disabled = false;
    progressBarInner.style.width = '0%';
    if (progressDetail) progressDetail.textContent = '';
    AppModal.alert('¡Tu video ha sido exportado y descargado correctamente!', { title: '✅ Video listo', icon: '🎬', btnLabel: '¡Genial!' });
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
    if (s.fillEffect !== undefined && fillEffectGrid) {
      currentFillEffect = s.fillEffect;
      fillEffectGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.fe === s.fillEffect));
    }
    if (s.progressBarThickness !== undefined && progressBarThicknessSlider) {
      currentProgressBarThickness = s.progressBarThickness;
      progressBarThicknessSlider.value = s.progressBarThickness;
      if (progressBarThicknessVal) progressBarThicknessVal.textContent = parseFloat(s.progressBarThickness).toFixed(1) + '×';
    }
    if (s.progressTimeSize !== undefined && progressTimeSizeSlider) {
      currentProgressTimeSize = s.progressTimeSize;
      progressTimeSizeSlider.value = s.progressTimeSize;
      if (progressTimeSizeVal) progressTimeSizeVal.textContent = parseFloat(s.progressTimeSize).toFixed(1) + '×';
    }
  }

  return { init, setup, applySettings };
})();

export default ExportEngine;
