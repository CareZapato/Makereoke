/* ============================================================
   sync.js — Synchronization step logic (ES module)
   ============================================================ */

import Audio from './audio.js';
import Lyrics from './lyrics.js';
import Intro from './intro.js';
import Outro from './outro.js';
import { formatTime, toast } from './utils.js';
import AppModal from './app-modal.js';

const Sync = (() => {

  let currentSyncIdx = 0;
  let waveformPainted = false;
  let isInitialized = false;
  let _syncProgressListener = null;
  let waveZoom = 1; // 1 = full song; 2/4/8/16 = zoomed in
  const ZOOM_LEVELS = [1, 2, 4, 8, 16];

  /* ─── VOICE STATE (JS-authoritative, DOM is a mirror) ─── */
  const VOICE_DEFAULTS = [
    { name: 'Voz 1', color: '#FF6B6B' },
    { name: 'Voz 2', color: '#4ECDC4' },
    { name: 'Voz 3', color: '#FFE66D' },
    { name: 'Voz 4', color: '#C084FC' },
  ];
  const ALL_VOICE_DEFAULT_COLOR = '#FFFFFF';
  // Mutable state arrays — DOM inputs are synced from here
  let voiceColors = VOICE_DEFAULTS.map(v => v.color);
  let voiceNames  = VOICE_DEFAULTS.map(v => v.name);
  let allVoiceColorState = ALL_VOICE_DEFAULT_COLOR;
  let voiceCount = 2;
  let currentVoice = 1; // 1..N = singer; 0 = "todos juntos"

  const els = {
    playBtn:    () => document.getElementById('syncPlayBtn'),
    rewindBtn:  () => document.getElementById('syncRewindBtn'),
    tapBtn:     () => document.getElementById('tapBtn'),
    seekBar:    () => document.getElementById('seekBar'),
    currentTime:() => document.getElementById('currentTime'),
    totalTime:  () => document.getElementById('totalTime'),
    lyricsList: () => document.getElementById('syncLyricsList'),
    progress:   () => document.getElementById('syncProgress'),
    undoBtn:    () => document.getElementById('undoLastSync'),
    resetBtn:   () => document.getElementById('resetSyncBtn'),
    goAdjust:   () => document.getElementById('goToAdjustBtn'),
    waveCanvas: () => document.getElementById('waveformCanvas'),
    playhead:   () => document.getElementById('playhead'),
    volBar:     () => document.getElementById('volumeBar'),
    voicePills: () => document.getElementById('voicePills'),
  };

  /* ─── VOICE HELPERS ─── */
  function getVoiceColor(v) {
    if (v === null || v === undefined) return null;
    if (v === 0) return allVoiceColorState;
    return voiceColors[v - 1] || VOICE_DEFAULTS[v - 1]?.color || '#aaaaaa';
  }

  function getVoiceName(v) {
    if (v === 0) return 'Todos juntos';
    return voiceNames[v - 1] || VOICE_DEFAULTS[v - 1]?.name || `Voz ${v}`;
  }

  /* Update state AND mirror all DOM inputs/swatches for this voice */
  function _updateVoiceDOM(v, color, name) {
    const ids = v === 0
      ? { col: ['allVoiceColor', 'adj_allVoiceColor', 'exp_allVoiceColor'], swatch: ['allVoiceSwatch', 'adj_allVoiceSwatch', 'exp_allVoiceSwatch'], row: null }
      : { col: [`voiceColor_${v}`, `adj_voiceColor_${v}`, `exp_voiceColor_${v}`], swatch: [`voiceSwatch_${v}`, `adj_voiceSwatch_${v}`, `exp_voiceSwatch_${v}`], row: [`voiceRow_${v}`, `adj_voiceRow_${v}`] };
    if (color !== undefined) {
      ids.col.forEach(id => { const el = document.getElementById(id); if (el) el.value = color; });
      ids.swatch.forEach(id => { const el = document.getElementById(id); if (el) el.style.background = color; });
      if (ids.row) ids.row.forEach(id => { const el = document.getElementById(id); if (el) el.style.setProperty('--vc', color); });
      if (v === 0) { document.querySelectorAll('.voice-row-all').forEach(el => el.style.setProperty('--vc', color)); }
    }
    if (name !== undefined && v !== 0) {
      [`voiceName_${v}`, `adj_voiceName_${v}`].forEach(id => { const el = document.getElementById(id); if (el) el.value = name; });
    }
  }

  function setVoiceColor(v, color) {
    if (v === 0) allVoiceColorState = color;
    else voiceColors[v - 1] = color;
    _updateVoiceDOM(v, color, undefined);
    buildVoicePills();
    buildVoiceLegend();
  }

  function setVoiceName(v, name) {
    if (v <= 0) return;
    voiceNames[v - 1] = name;
    _updateVoiceDOM(v, undefined, name);
    buildVoicePills();
    buildVoiceLegend();
  }

  function setVoiceCount(n) {
    voiceCount = n;
    for (let i = 1; i <= 4; i++) {
      const btn = document.getElementById(`voiceCountBtn_${i}`);
      if (btn) btn.classList.toggle('active', i === n);
      const row = document.getElementById(`voiceRow_${i}`);
      if (row) row.style.display = i <= n ? '' : 'none';
    }
    // Show/hide "Todos juntos" row based on voice count
    const allRow = document.querySelector('.voice-row-all');
    if (allRow) allRow.style.display = n > 1 ? '' : 'none';
    // If active voice is out of range, reset to 1
    if (currentVoice > n) selectVoice(1);
    else buildVoicePills();
    buildVoiceLegend();
  }

  /* Sync all DOM mirrors from JS state (call when panel mounts/re-activates) */
  function _syncSwatches() {
    for (let n = 1; n <= 4; n++) _updateVoiceDOM(n, voiceColors[n-1], voiceNames[n-1]);
    _updateVoiceDOM(0, allVoiceColorState, undefined);
  }

  /* Build the legend in the lyrics panel showing active voices and their colors */
  function buildVoiceLegend() {
    const container = document.getElementById('voiceLegend');
    if (!container) return;
    container.innerHTML = '';
    if (voiceCount < 2) return; // single voice = no legend needed
    for (let i = 1; i <= voiceCount; i++) {
      const item = document.createElement('span');
      item.className = 'voice-legend-item';
      item.style.setProperty('--vc', getVoiceColor(i));
      item.textContent = getVoiceName(i);
      container.appendChild(item);
    }
    const allItem = document.createElement('span');
    allItem.className = 'voice-legend-item voice-legend-all';
    allItem.style.setProperty('--vc', getVoiceColor(0));
    allItem.textContent = 'Todos';
    container.appendChild(allItem);
  }

  function selectVoice(v) {
    currentVoice = v;
    buildVoicePills();
    // Update TAP button accent color
    const color = getVoiceColor(v);
    const tapBtn = els.tapBtn();
    if (tapBtn && color) {
      tapBtn.style.background = `linear-gradient(135deg, ${color}cc, ${color}88)`;
      tapBtn.style.boxShadow = `0 0 20px ${color}66`;
    }
  }

  function buildVoicePills() {
    const container = els.voicePills();
    if (!container) return;
    container.innerHTML = '';

    for (let i = 1; i <= voiceCount; i++) {
      const btn = document.createElement('button');
      btn.className = 'voice-pill' + (currentVoice === i ? ' active' : '');
      btn.dataset.voice = i;
      const color = getVoiceColor(i);
      btn.style.setProperty('--vc', color);
      btn.textContent = getVoiceName(i);
      btn.title = `[Tecla ${i}]`;
      btn.addEventListener('click', () => selectVoice(i));
      container.appendChild(btn);
    }

    if (voiceCount > 1) {
      const btn = document.createElement('button');
      btn.className = 'voice-pill voice-pill-all' + (currentVoice === 0 ? ' active' : '');
      btn.dataset.voice = 0;
      const color = getVoiceColor(0);
      btn.style.setProperty('--vc', color);
      btn.textContent = 'Todos juntos';
      btn.title = '[Tecla 0]';
      btn.addEventListener('click', () => selectVoice(0));
      container.appendChild(btn);
    }
  }

  /* Returns full voice config — used by export engine for colored rendering */
  function getVoiceConfig() {
    const voices = [];
    for (let i = 1; i <= voiceCount; i++) {
      voices.push({ name: getVoiceName(i), color: getVoiceColor(i) });
    }
    return {
      count: voiceCount,
      voices,
      allColor: getVoiceColor(0),
    };
  }

  /* ─── INIT ─── */
  function init() {
    if (isInitialized) return;
    isInitialized = true;

    els.playBtn().addEventListener('click', handlePlay);
    els.rewindBtn().addEventListener('click', () => Audio.seek(Audio.getCurrentTime() - 5));
    els.tapBtn().addEventListener('click', handleTap);
    els.tapBtn().addEventListener('touchstart', e => { e.preventDefault(); handleTap(); }, { passive: false });
    els.undoBtn().addEventListener('click', handleUndo);
    els.resetBtn().addEventListener('click', handleReset);
    els.seekBar().addEventListener('input', () => Audio.seek(parseFloat(els.seekBar().value)));
    els.volBar().addEventListener('input', () => Audio.setVolume(parseFloat(els.volBar().value)));

    // Voice count buttons
    for (let n = 1; n <= 4; n++) {
      const btn = document.getElementById(`voiceCountBtn_${n}`);
      if (btn) btn.addEventListener('click', () => setVoiceCount(n));
    }
    // DOM inputs call the authoritative JS setters
    for (let n = 1; n <= 4; n++) {
      const col  = document.getElementById(`voiceColor_${n}`);
      const name = document.getElementById(`voiceName_${n}`);
      if (col)  col.addEventListener('input', () => setVoiceColor(n, col.value));
      if (name) name.addEventListener('input', () => setVoiceName(n, name.value));
    }
    const allCol = document.getElementById('allVoiceColor');
    if (allCol) allCol.addEventListener('input', () => setVoiceColor(0, allCol.value));

    // Waveform zoom controls
    const zoomIn  = document.getElementById('waveZoomIn');
    const zoomOut = document.getElementById('waveZoomOut');
    const zoomFit = document.getElementById('waveZoomFit');
    if (zoomIn)  zoomIn.addEventListener('click',  () => { const i = ZOOM_LEVELS.indexOf(waveZoom); if (i < ZOOM_LEVELS.length - 1) setWaveZoom(ZOOM_LEVELS[i + 1]); });
    if (zoomOut) zoomOut.addEventListener('click', () => { const i = ZOOM_LEVELS.indexOf(waveZoom); if (i > 0) setWaveZoom(ZOOM_LEVELS[i - 1]); });
    if (zoomFit) zoomFit.addEventListener('click', () => setWaveZoom(1));

    // Touch pinch-to-zoom on waveform container
    const waveContainer = document.getElementById('waveformContainer');
    if (waveContainer) {
      let _pinchDist = null;
      waveContainer.addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
          _pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
      }, { passive: true });
      waveContainer.addEventListener('touchmove', e => {
        if (e.touches.length === 2 && _pinchDist !== null) {
          const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          const ratio = newDist / _pinchDist;
          if (ratio > 1.3) { const i = ZOOM_LEVELS.indexOf(waveZoom); if (i < ZOOM_LEVELS.length - 1) { setWaveZoom(ZOOM_LEVELS[i + 1]); _pinchDist = newDist; } }
          else if (ratio < 0.7) { const i = ZOOM_LEVELS.indexOf(waveZoom); if (i > 0) { setWaveZoom(ZOOM_LEVELS[i - 1]); _pinchDist = newDist; } }
        }
      }, { passive: true });
      waveContainer.addEventListener('touchend', () => { _pinchDist = null; });
    }

    // Voice config collapse toggle
    const vcToggle = document.getElementById('voiceConfigToggle');
    const vcPanel  = document.getElementById('voiceConfigPanel');
    if (vcToggle && vcPanel) {
      vcToggle.addEventListener('click', () => {
        const collapsed = vcPanel.classList.toggle('vc-collapsed');
        vcToggle.textContent = collapsed ? '▸' : '▾';
      });
    }

    document.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (!document.getElementById('panel2').classList.contains('active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); handleTap(); }
    if (e.code === 'Backspace') handleUndo();
    // Voice selection via digit keys
    const digit = e.key >= '0' && e.key <= '4' ? parseInt(e.key) : -1;
    if (digit === 0 && voiceCount > 1) { selectVoice(0); return; }
    if (digit >= 1 && digit <= voiceCount) { selectVoice(digit); return; }
  }

  /* ─── SETUP (called each time panel2 is shown) ─── */
  function setup() {
    init();
    Audio.onTimeUpdate = onTimeUpdate;
    Audio.onEnded = () => { els.playBtn().textContent = '▶'; };

    currentSyncIdx = 0;
    // Apply stored voice count
    setVoiceCount(voiceCount);
    _syncSwatches();
    buildVoicePills();
    buildVoiceLegend();
    // Set initial TAP button color
    selectVoice(currentVoice);

    // Collapse voice config panel by default on small screens to maximise tap area
    const vcPanel  = document.getElementById('voiceConfigPanel');
    const vcToggle = document.getElementById('voiceConfigToggle');
    if (vcPanel && window.innerWidth < 700) {
      vcPanel.classList.add('vc-collapsed');
      if (vcToggle) vcToggle.textContent = '▸';
    }

    buildLyricsList();
    updateProgress();
    updateGoButton();

    drawWaveform();
    _updateZoomUI();

    els.totalTime().textContent = formatTime(Audio.duration);
    els.seekBar().max = Audio.duration;
    els.seekBar().value = Audio.getCurrentTime();
    onTimeUpdate(Audio.getCurrentTime());
  }

  /* ─── WAVEFORM DRAWING ─── */
  function _updateZoomUI() {
    const lbl = document.getElementById('waveZoomLabel');
    if (lbl) lbl.textContent = waveZoom + '×';
    const btnOut = document.getElementById('waveZoomOut');
    const btnIn  = document.getElementById('waveZoomIn');
    if (btnOut) btnOut.disabled = waveZoom <= ZOOM_LEVELS[0];
    if (btnIn)  btnIn.disabled  = waveZoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  }

  function setWaveZoom(newZoom) {
    waveZoom = newZoom;
    drawWaveform();
    // Scroll to keep the playhead centred after zoom changes
    const container = document.getElementById('waveformContainer');
    const canvas    = els.waveCanvas();
    if (container && canvas) {
      const t = Audio.getCurrentTime();
      const pxLeft = (t / (Audio.duration || 1)) * canvas.offsetWidth;
      container.scrollLeft = Math.max(0, pxLeft - container.offsetWidth / 2);
    }
    _updateZoomUI();
  }

  function drawWaveform() {
    const canvas    = els.waveCanvas();
    const container = document.getElementById('waveformContainer') || canvas.parentElement;
    const data = Audio.getChannelData();
    if (!data) return;

    const dpr        = window.devicePixelRatio || 1;
    const containerW = container.offsetWidth;
    const W          = Math.max(containerW, Math.round(containerW * waveZoom));
    const H          = 100;
    canvas.width       = W * dpr;
    canvas.height      = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const step = Math.ceil(data.length / W);
    const mid = H / 2;

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#7c4dff');
    grad.addColorStop(0.5, '#b47aff');
    grad.addColorStop(1, '#FFD700');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      let max = 0;
      for (let j = 0; j < step; j++) {
        const v = Math.abs(data[x * step + j] || 0);
        if (v > max) max = v;
      }
      const h = max * mid * 0.9;
      ctx.moveTo(x, mid - h);
      ctx.lineTo(x, mid + h);
    }
    ctx.stroke();

    // ── Intro region overlay ──
    const ic = Intro.get();
    if (ic.enabled && ic.duration > 0 && Audio.duration > 0) {
      const introW = (ic.duration / Audio.duration) * W;
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#7c4dff';
      ctx.fillRect(0, 0, introW, H); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = '#ccc';
      ctx.font = `bold ${Math.max(9, W * 0.015)}px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('INTRO', 4, H - 3); ctx.restore();
    }

    // ── lyricsEndTime vertical line ──
    const endT = Lyrics.getEndTime();
    if (endT !== null && Audio.duration > 0) {
      const endPx = (endT / Audio.duration) * W;
      ctx.save(); ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(endPx, 0); ctx.lineTo(endPx, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#ff6b6b';
      ctx.font = `bold ${Math.max(9, W * 0.013)}px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('⏹', Math.min(endPx + 2, W - 22), 2); ctx.restore();
    }

    // ── Outro region overlay ──
    const oc = Outro.get();
    if (oc.enabled && oc.duration > 0 && Audio.duration > 0) {
      const outroStartPx = ((Audio.duration - oc.duration) / Audio.duration) * W;
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#4ECDC4';
      ctx.fillRect(outroStartPx, 0, W - outroStartPx, H); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = '#ccc';
      ctx.font = `bold ${Math.max(9, W * 0.015)}px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText('OUTRO', W - 4, H - 3); ctx.restore();
    }

    waveformPainted = true;
  }

  /* ─── PLAYHEAD / TIME ─── */
  function onTimeUpdate(t) {
    els.currentTime().textContent = formatTime(t);
    els.seekBar().value = t;

    const canvas    = els.waveCanvas();
    const container = document.getElementById('waveformContainer') || canvas.parentElement;
    const canvasW   = canvas.offsetWidth;
    const pxLeft    = (t / (Audio.duration || 1)) * canvasW;
    els.playhead().style.left = pxLeft + 'px';

    // Auto-scroll to keep playhead centred when zoomed
    if (waveZoom > 1) {
      container.scrollLeft = Math.max(0, pxLeft - container.offsetWidth / 2);
    }

    const active = Lyrics.getActiveIndex(t);
    highlightActive(active);
  }

  function highlightActive(idx) {
    const items = els.lyricsList().querySelectorAll('.sync-lyric-item');
    items.forEach((el, i) => {
      el.classList.remove('current');
      const lineIdx = parseInt(el.dataset.lineIdx);
      if (lineIdx === idx) el.classList.add('current');
    });
  }

  /* ─── PLAY/PAUSE ─── */
  function handlePlay() {
    Audio.toggle();
    els.playBtn().textContent = Audio.isPlaying ? '⏸' : '▶';
  }

  /* ─── TAP ─── */
  function handleTap() {
    const lines = Lyrics.lines;
    if (currentSyncIdx >= lines.length) {
      toast('¡Todas las frases han sido marcadas!', 'success');
      return;
    }

    while (currentSyncIdx < lines.length && lines[currentSyncIdx].isBlank) {
      currentSyncIdx++;
    }
    if (currentSyncIdx >= lines.length) return;

    const t = Audio.getCurrentTime();
    Lyrics.setTime(currentSyncIdx, t);
    Lyrics.setVoice(currentSyncIdx, currentVoice);

    const item = document.querySelector(`[data-line-idx="${currentSyncIdx}"]`);
    if (item) {
      item.classList.add('synced');
      item.classList.remove('current');
      item.dataset.voice = currentVoice;
      const timeEl = item.querySelector('.sync-time');
      if (timeEl) timeEl.textContent = formatTime(t, true);
      _applyVoiceStyle(item, currentVoice);
    }

    currentSyncIdx++;

    while (currentSyncIdx < lines.length && lines[currentSyncIdx].isBlank) {
      currentSyncIdx++;
    }
    const nextItem = document.querySelector(`[data-line-idx="${currentSyncIdx}"]`);
    if (nextItem) {
      nextItem.classList.add('current');
      nextItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    els.tapBtn().classList.remove('flash');
    void els.tapBtn().offsetWidth;
    els.tapBtn().classList.add('flash');

    updateProgress();
    updateGoButton();
  }

  /* ─── UNDO ─── */
  function handleUndo() {
    let idx = currentSyncIdx - 1;
    while (idx >= 0 && Lyrics.lines[idx].isBlank) idx--;
    if (idx < 0) return;

    Lyrics.setTime(idx, null);
    Lyrics.setVoice(idx, null);
    currentSyncIdx = idx;

    const item = document.querySelector(`[data-line-idx="${idx}"]`);
    if (item) {
      item.classList.remove('synced', 'current');
      item.classList.add('current');
      delete item.dataset.voice;
      const timeEl = item.querySelector('.sync-time');
      if (timeEl) timeEl.textContent = '';
      _clearVoiceStyle(item);
    }

    updateProgress();
    updateGoButton();
    toast('Marca deshecha', 'warn');
  }

  /* ─── RESET ─── */
  async function handleReset() {
    const ok = await AppModal.confirm('¿Reiniciar todas las marcas de tiempo? Esta acción no se puede deshacer.', {
      title: '🔄 Reiniciar marcas', icon: '🔄',
      confirmLabel: 'Reiniciar', confirmStyle: 'danger', cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    Lyrics.resetTimes();
    currentSyncIdx = 0;
    buildLyricsList();
    updateProgress();
    updateGoButton();
    toast('Marcas reiniciadas', 'warn');
  }

  /* ─── VOICE STYLE HELPERS ─── */
  function _applyVoiceStyle(item, v) {
    const color = getVoiceColor(v);
    if (!color) return;
    const dot  = item.querySelector('.sync-dot');
    const text = item.querySelector('.lyric-text');
    if (dot)  { dot.style.background  = color; dot.style.boxShadow = `0 0 6px ${color}99`; }
    if (text) text.style.color = color;
  }

  function _clearVoiceStyle(item) {
    const dot  = item.querySelector('.sync-dot');
    const text = item.querySelector('.lyric-text');
    if (dot)  { dot.style.background = ''; dot.style.boxShadow = ''; }
    if (text) text.style.color = '';
  }

  /* ─── BUILD LIST ─── */
  function buildLyricsList() {
    const ul = els.lyricsList();
    ul.innerHTML = '';
    const btnStyle = 'font-size:10px;padding:1px 5px;border-radius:3px;border:1px solid var(--border,#333);background:var(--bg-card,#111);cursor:pointer;line-height:1.5;color:var(--text-dim,#888);flex-shrink:0';

    Lyrics.lines.forEach((line, i) => {
      const li = document.createElement('li');
      li.className = 'sync-lyric-item';
      li.dataset.lineIdx = i;
      li.style.cssText = 'display:flex;align-items:center;gap:4px';

      // ── Action button group (visible on hover) ──
      const actions = document.createElement('span');
      actions.style.cssText = 'display:inline-flex;gap:2px;margin-left:auto;opacity:0;flex-shrink:0;transition:opacity .12s';
      li.addEventListener('mouseenter', () => { actions.style.opacity = '1'; });
      li.addEventListener('mouseleave', () => { actions.style.opacity = '0'; });

      // + insert after
      const bIns = document.createElement('button');
      bIns.textContent = '+'; bIns.title = 'Insertar línea después'; bIns.style.cssText = btnStyle;
      bIns.addEventListener('click', e => { e.stopPropagation(); _insertLineAfter(i); });
      actions.appendChild(bIns);

      if (line.isBlank) {
        li.classList.add('blank');
        if (line.time !== null) li.classList.add('synced');
        const dot = document.createElement('span'); dot.className = 'sync-dot';
        if (line.time !== null) { dot.style.background = '#888'; dot.style.boxShadow = ''; }
        li.appendChild(dot);
        const timeEl = document.createElement('span'); timeEl.className = 'sync-time';
        timeEl.style.color = '#888';
        timeEl.textContent = line.time !== null ? formatTime(line.time, true) : '';
        li.appendChild(timeEl);
        const lbl = document.createElement('span');
        lbl.style.cssText = 'font-size:0.8rem;color:var(--text-dim);flex:1';
        lbl.textContent = '— pausa —'; li.appendChild(lbl);
        // Button to sync silence start time
        const bSilence = document.createElement('button');
        bSilence.textContent = line.time !== null ? '🔇 ' + formatTime(line.time, true) : '🔇 Sincronizar';
        bSilence.title = 'Marca dónde termina la frase anterior y comienza el silencio';
        bSilence.style.cssText = btnStyle + ';color:#aaa;font-size:10px';
        bSilence.addEventListener('click', e => {
          e.stopPropagation();
          const t = Audio.getCurrentTime();
          Lyrics.setTime(i, t);
          timeEl.textContent = formatTime(t, true);
          bSilence.textContent = '🔇 ' + formatTime(t, true);
          dot.style.background = '#888';
          li.classList.add('synced');
          toast('Silencio marcado en ' + formatTime(t, true), 'info');
        });
        actions.appendChild(bSilence);
      } else {
        const dot = document.createElement('span'); dot.className = 'sync-dot'; li.appendChild(dot);
        const timeEl = document.createElement('span'); timeEl.className = 'sync-time';
        timeEl.textContent = line.time !== null ? formatTime(line.time, true) : '';
        li.appendChild(timeEl);
        const txtEl = document.createElement('span'); txtEl.className = 'lyric-text';
        txtEl.style.cssText = line.isLabel ? 'font-style:italic;color:#aaaaff' : '';
        txtEl.textContent = (line.isLabel ? '🏷 ' : '') + escapeHtml(line.text);
        txtEl.title = 'Doble clic para editar';

        // ── Inline text editing ──
        txtEl.addEventListener('dblclick', e => {
          e.stopPropagation();
          txtEl.contentEditable = 'true';
          txtEl.style.outline = '1px solid var(--accent,#7c4dff)';
          txtEl.style.borderRadius = '3px';
          txtEl.style.padding = '0 3px';
          txtEl.style.minWidth = '60px';
          txtEl.focus();
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(txtEl);
          sel.removeAllRanges();
          sel.addRange(range);
        });
        const _commitEdit = () => {
          txtEl.contentEditable = 'false';
          txtEl.style.outline = '';
          txtEl.style.padding = '';
          const rawText = txtEl.textContent.replace(/^🏷\s*/, '').trim();
          Lyrics.setLineText(i, rawText);
          txtEl.textContent = (line.isLabel ? '🏷 ' : '') + rawText;
        };
        txtEl.addEventListener('blur', _commitEdit);
        txtEl.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); txtEl.blur(); }
          if (e.key === 'Escape') {
            txtEl.contentEditable = 'false';
            txtEl.style.outline = '';
            txtEl.style.padding = '';
            txtEl.textContent = (line.isLabel ? '🏷 ' : '') + escapeHtml(line.text);
          }
        });

        li.appendChild(txtEl);

        if (line.time !== null) {
          li.classList.add('synced');
          if (line.voice !== null && line.voice !== undefined) {
            li.dataset.voice = line.voice;
            _applyVoiceStyle(li, line.voice);
          }
        }
        if (i === currentSyncIdx) li.classList.add('current');

        // 🏷 Toggle label
        const bLbl = document.createElement('button');
        bLbl.textContent = '🏷'; bLbl.title = line.isLabel ? 'Quitar indicación' : 'Marcar como indicación';
        bLbl.style.cssText = line.isLabel
          ? btnStyle + ';background:rgba(100,100,255,.22);color:#aaf'
          : btnStyle;
        bLbl.addEventListener('click', e => { e.stopPropagation(); _toggleLabel(i); });
        actions.appendChild(bLbl);
      }

      // × delete
      const bDel = document.createElement('button');
      bDel.textContent = '×'; bDel.title = 'Eliminar línea'; bDel.style.cssText = btnStyle + ';color:#e55';
      bDel.addEventListener('click', e => { e.stopPropagation(); _removeLine(i); });
      actions.appendChild(bDel);

      li.appendChild(actions);
      ul.appendChild(li);
    });

    // ── Intro duration marker row ──
    const icPre = Intro.get();
    const introLi = document.createElement('li');
    introLi.className = 'sync-lyric-item' + (icPre.enabled ? ' synced' : '');
    introLi.style.cssText = 'border-bottom:1px dashed var(--border,#333);margin-bottom:8px;padding-bottom:6px;display:flex;align-items:center;gap:6px;opacity:0.8';
    const introDot = document.createElement('span'); introDot.className = 'sync-dot'; introDot.style.background = '#7c4dff';
    const introVal = document.createElement('span'); introVal.className = 'sync-time';
    introVal.textContent = icPre.enabled ? formatTime(icPre.duration, true) : '';
    const introLbl = document.createElement('span'); introLbl.className = 'lyric-text';
    introLbl.style.cssText = 'font-style:italic;color:var(--text-dim,#888)'; introLbl.textContent = '🎬 Inicio de letra (fin del intro)';
    const introBtn = document.createElement('button');
    introBtn.className = 'btn btn-ghost btn-sm';
    introBtn.style.cssText = 'margin-left:auto;font-size:0.72rem;padding:2px 8px';
    introBtn.textContent = icPre.enabled ? '✓ ' + icPre.duration.toFixed(1) + 's' : 'Marcar aquí';
    introBtn.title = 'Marca el momento en que termina el intro y comienzan las letras';
    introBtn.addEventListener('click', () => {
      const t = Audio.getCurrentTime();
      Intro.set({ enabled: true, duration: parseFloat(t.toFixed(1)) });
      introVal.textContent = formatTime(t, true);
      introBtn.textContent = '✓ ' + t.toFixed(1) + 's';
      introLi.classList.add('synced');
      drawWaveform();
      toast('Duración del intro: ' + t.toFixed(1) + 's', 'success');
    });
    introLi.append(introDot, introVal, introLbl, introBtn);
    ul.prepend(introLi);

    // ── End-time marker row ──
    const savedEnd = Lyrics.getEndTime();
    const endLi = document.createElement('li');
    endLi.className = 'sync-lyric-item' + (savedEnd !== null ? ' synced' : '');
    endLi.style.cssText = 'border-top:1px dashed var(--border,#333);margin-top:8px;padding-top:6px;display:flex;align-items:center;gap:6px;opacity:0.8;flex-shrink:0';
    const endDot = document.createElement('span'); endDot.className = 'sync-dot'; endDot.style.background = '#888';
    const endVal = document.createElement('span'); endVal.className = 'sync-time'; endVal.id = 'syncEndTimeVal';
    endVal.textContent = savedEnd !== null ? formatTime(savedEnd, true) : '';
    const endLbl = document.createElement('span'); endLbl.className = 'lyric-text';
    endLbl.style.cssText = 'font-style:italic;color:var(--text-dim,#888)'; endLbl.textContent = '⏹ Fin de letra';
    const endBtn = document.createElement('button');
    endBtn.className = 'btn btn-ghost btn-sm';
    endBtn.style.cssText = 'margin-left:auto;font-size:0.72rem;padding:2px 8px';
    endBtn.textContent = savedEnd !== null ? '✓ Marcado' : 'Marcar aquí';
    endBtn.title = 'Marca el momento en que deja de verse la última frase';
    endBtn.addEventListener('click', () => {
      const t = Audio.getCurrentTime();
      Lyrics.setEndTime(t);
      endVal.textContent = formatTime(t, true);
      endBtn.textContent = '✓ Marcado';
      endLi.classList.add('synced');
      toast('Fin de letra marcado: ' + formatTime(t, true), 'success');
    });
    endLi.append(endDot, endVal, endLbl, endBtn);
    ul.appendChild(endLi);

    // ── Outro duration marker row ──
    const ocPost = Outro.get();
    const outroDurCurrent = ocPost.enabled ? ocPost.duration : null;
    const outroLi = document.createElement('li');
    outroLi.className = 'sync-lyric-item' + (outroDurCurrent !== null ? ' synced' : '');
    outroLi.style.cssText = 'border-top:1px dashed var(--border,#333);margin-top:4px;padding-top:6px;display:flex;align-items:center;gap:6px;opacity:0.8';
    const outroDot = document.createElement('span'); outroDot.className = 'sync-dot'; outroDot.style.background = '#4ECDC4';
    const outroVal = document.createElement('span'); outroVal.className = 'sync-time';
    outroVal.textContent = outroDurCurrent !== null ? formatTime(Audio.duration - outroDurCurrent, true) : '';
    const outroLbl = document.createElement('span'); outroLbl.className = 'lyric-text';
    outroLbl.style.cssText = 'font-style:italic;color:var(--text-dim,#888)'; outroLbl.textContent = '🎬 Inicio del outro (fin de letra)';
    const outroBtn = document.createElement('button');
    outroBtn.className = 'btn btn-ghost btn-sm';
    outroBtn.style.cssText = 'margin-left:auto;font-size:0.72rem;padding:2px 8px';
    outroBtn.textContent = outroDurCurrent !== null ? '✓ ' + outroDurCurrent.toFixed(1) + 's' : 'Marcar aquí';
    outroBtn.title = 'Marca el momento en que termina la letra y comienza el outro';
    outroBtn.addEventListener('click', () => {
      const t = Audio.getCurrentTime();
      const dur = Audio.duration > 0 ? parseFloat((Audio.duration - t).toFixed(1)) : 4;
      Outro.set({ enabled: true, duration: Math.max(1, dur) });
      outroVal.textContent = formatTime(t, true);
      outroBtn.textContent = '✓ ' + Math.max(1, dur).toFixed(1) + 's';
      outroLi.classList.add('synced');
      drawWaveform();
      toast('Outro comienza en ' + formatTime(t, true) + ' (duración: ' + Math.max(1, dur).toFixed(1) + 's)', 'success');
    });
    outroLi.append(outroDot, outroVal, outroLbl, outroBtn);
    ul.appendChild(outroLi);
  }

  function _insertLineAfter(i) {
    const ul = els.lyricsList();
    if (!ul) return;

    // Remove any existing inline form to avoid duplicates
    const existing = ul.querySelector('.insert-line-form');
    if (existing) existing.remove();

    // Find the <li> that corresponds to index i
    const targetRow = ul.querySelector(`[data-line-idx="${i}"]`);
    if (!targetRow) return;

    const formLi = document.createElement('li');
    formLi.className = 'insert-line-form';
    formLi.innerHTML = `
      <div class="insert-line-inner">
        <span class="insert-line-icon">✏️</span>
        <input type="text" class="insert-line-input" placeholder="Texto de la nueva línea (vacío = pausa)…" />
        <button class="insert-line-ok" title="Añadir">✓</button>
        <button class="insert-line-cancel" title="Cancelar">✕</button>
      </div>`;
    targetRow.insertAdjacentElement('afterend', formLi);

    const inp = formLi.querySelector('.insert-line-input');
    inp.focus();

    const commit = () => {
      const trimmed = inp.value.trim();
      formLi.remove();
      Lyrics.insertAfter(i, { text: trimmed, isBlank: trimmed === '', isLabel: false });
      if (currentSyncIdx > i) currentSyncIdx++;
      buildLyricsList(); updateProgress(); updateGoButton();
    };
    const cancel = () => formLi.remove();

    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
    formLi.querySelector('.insert-line-ok').addEventListener('click', commit);
    formLi.querySelector('.insert-line-cancel').addEventListener('click', cancel);
  }

  async function _removeLine(i) {
    if (Lyrics.lines.length <= 1) { toast('No se puede eliminar la última línea', 'warn'); return; }
    const ok = await AppModal.confirm('¿Eliminar esta línea de la lista?', {
      title: '🗑️ Eliminar línea', icon: '🗑️',
      confirmLabel: 'Eliminar', confirmStyle: 'danger', cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    Lyrics.removeLine(i);
    if (currentSyncIdx > i) currentSyncIdx = Math.max(0, currentSyncIdx - 1);
    else if (currentSyncIdx === i) currentSyncIdx = Math.min(i, Lyrics.lines.length - 1);
    buildLyricsList(); updateProgress(); updateGoButton();
  }

  function _toggleLabel(i) {
    Lyrics.toggleLabel(i);
    buildLyricsList();
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function updateProgress() {
    const done = Lyrics.syncedCount();
    const total = Lyrics.lyricsCount();
    const el = els.progress();
    el.textContent = `${done}/${total} marcados`;
    el.className = done === total ? 'sync-badge sync-done' : 'sync-badge';
  }

  function updateGoButton() {
    const count = Lyrics.syncedCount();
    const btn = els.goAdjust();
    if (btn) btn.disabled = count < 1;
    if (_syncProgressListener) _syncProgressListener(count);
  }

  return {
    setup,
    drawWaveform,
    getVoiceConfig,
    setVoiceColor,
    setVoiceName,
    setSyncProgressListener(cb) { _syncProgressListener = cb; },
  };
})();

export default Sync;
