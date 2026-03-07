/* ============================================================
   sync.js — Synchronization step logic (ES module)
   ============================================================ */

import Audio from './audio.js';
import Lyrics from './lyrics.js';
import { formatTime, toast } from './utils.js';

const Sync = (() => {

  let currentSyncIdx = 0;
  let waveformPainted = false;
  let isInitialized = false;
  let _syncProgressListener = null;

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
      ? { col: ['allVoiceColor', 'adj_allVoiceColor'], swatch: ['allVoiceSwatch', 'adj_allVoiceSwatch'], row: null }
      : { col: [`voiceColor_${v}`, `adj_voiceColor_${v}`], swatch: [`voiceSwatch_${v}`, `adj_voiceSwatch_${v}`], row: [`voiceRow_${v}`, `adj_voiceRow_${v}`] };
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

    buildLyricsList();
    updateProgress();
    updateGoButton();

    drawWaveform();

    els.totalTime().textContent = formatTime(Audio.duration);
    els.seekBar().max = Audio.duration;
    els.seekBar().value = Audio.getCurrentTime();
    onTimeUpdate(Audio.getCurrentTime());
  }

  /* ─── WAVEFORM DRAWING ─── */
  function drawWaveform() {
    const canvas = els.waveCanvas();
    const data = Audio.getChannelData();
    if (!data) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement.offsetWidth;
    const H = 100;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
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
    waveformPainted = true;
  }

  /* ─── PLAYHEAD / TIME ─── */
  function onTimeUpdate(t) {
    els.currentTime().textContent = formatTime(t);
    els.seekBar().value = t;

    const pw = els.waveCanvas().offsetWidth;
    const pxLeft = (t / Audio.duration) * pw;
    els.playhead().style.left = pxLeft + 'px';

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
  function handleReset() {
    if (!confirm('¿Reiniciar todas las marcas de tiempo?')) return;
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

    Lyrics.lines.forEach((line, i) => {
      const li = document.createElement('li');
      li.className = 'sync-lyric-item';
      li.dataset.lineIdx = i;

      if (line.isBlank) {
        li.classList.add('blank');
        li.innerHTML = `<span class="sync-dot"></span><span style="font-size:0.8rem;color:var(--text-dim)">— pausa —</span>`;
      } else {
        li.innerHTML = `
          <span class="sync-dot"></span>
          <span class="sync-time">${line.time !== null ? formatTime(line.time, true) : ''}</span>
          <span class="lyric-text">${escapeHtml(line.text)}</span>
        `;
        if (line.time !== null) {
          li.classList.add('synced');
          if (line.voice !== null && line.voice !== undefined) {
            li.dataset.voice = line.voice;
            _applyVoiceStyle(li, line.voice);
          }
        }
        if (i === currentSyncIdx) li.classList.add('current');
      }
      ul.appendChild(li);
    });
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
