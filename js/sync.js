/* ============================================================
   sync.js — Synchronization step logic
   ============================================================ */

const Sync = (() => {

  let currentSyncIdx = 0;   // index into Lyrics.lines (points to next line to sync)
  let waveformPainted = false;
  let isInitialized = false;

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
  };

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

    document.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    // Only activate when sync panel is visible
    if (!document.getElementById('panel2').classList.contains('active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); handleTap(); }
    if (e.code === 'Backspace') handleUndo();
  }

  /* ─── SETUP (called each time panel2 is shown) ─── */
  function setup() {
    init();
    // Always reassign callbacks in case another panel overwrote them
    Audio.onTimeUpdate = onTimeUpdate;
    Audio.onEnded = () => { els.playBtn().textContent = '▶'; };

    currentSyncIdx = 0;
    buildLyricsList();
    updateProgress();
    updateGoButton();

    // Waveform — always repaint on setup to pick up new audio
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

    // Gradient
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
    const pct = Audio.duration > 0 ? (t / Audio.duration) * 100 : 0;
    els.seekBar().value = t;

    // Move playhead
    const pw = els.waveCanvas().offsetWidth;
    const pxLeft = (t / Audio.duration) * pw;
    els.playhead().style.left = pxLeft + 'px';

    // Highlight nearest synced line in the list
    const active = Lyrics.getActiveIndex(t);
    highlightActive(active);
  }

  function highlightActive(idx) {
    const items = els.lyricsList().querySelectorAll('.sync-lyric-item');
    items.forEach((el, i) => {
      el.classList.remove('current');
      // Map list item index → lines index
      const lineIdx = parseInt(el.dataset.lineIdx);
      if (lineIdx === idx) el.classList.add('current');
    });
  }

  /* ─── PLAY/PAUSE ─── */
  function handlePlay() {
    Audio.toggle();
    els.playBtn().textContent = Audio.isPlaying ? '⏸' : '▶';
  }

  /* ─── TAP: mark current line's time ─── */
  function handleTap() {
    const lines = Lyrics.lines;
    if (currentSyncIdx >= lines.length) {
      toast('¡Todas las frases han sido marcadas!', 'success');
      return;
    }

    // Skip blank lines automatically
    while (currentSyncIdx < lines.length && lines[currentSyncIdx].isBlank) {
      currentSyncIdx++;
    }
    if (currentSyncIdx >= lines.length) return;

    const t = Audio.getCurrentTime();
    Lyrics.setTime(currentSyncIdx, t);

    // Update list item
    const item = document.querySelector(`[data-line-idx="${currentSyncIdx}"]`);
    if (item) {
      item.classList.add('synced');
      item.classList.remove('current');
      const timeEl = item.querySelector('.sync-time');
      if (timeEl) timeEl.textContent = formatTime(t, true);
      const dot = item.querySelector('.sync-dot');
      if (dot) dot.style.background = 'var(--success)';
    }

    currentSyncIdx++;

    // Move current highlight
    while (currentSyncIdx < lines.length && lines[currentSyncIdx].isBlank) {
      currentSyncIdx++;
    }
    const nextItem = document.querySelector(`[data-line-idx="${currentSyncIdx}"]`);
    if (nextItem) {
      nextItem.classList.add('current');
      nextItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Flash tap button
    els.tapBtn().classList.remove('flash');
    void els.tapBtn().offsetWidth;
    els.tapBtn().classList.add('flash');

    updateProgress();
    updateGoButton();
  }

  /* ─── UNDO ─── */
  function handleUndo() {
    // Step back to previous non-blank line
    let idx = currentSyncIdx - 1;
    while (idx >= 0 && Lyrics.lines[idx].isBlank) idx--;
    if (idx < 0) return;

    Lyrics.setTime(idx, null);
    currentSyncIdx = idx;

    // Update DOM
    const item = document.querySelector(`[data-line-idx="${idx}"]`);
    if (item) {
      item.classList.remove('synced', 'current');
      item.classList.add('current');
      const timeEl = item.querySelector('.sync-time');
      if (timeEl) timeEl.textContent = '';
      const dot = item.querySelector('.sync-dot');
      if (dot) dot.style.background = '';
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
        if (line.time !== null) li.classList.add('synced');
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
    const btn = els.goAdjust();
    btn.disabled = Lyrics.syncedCount() < 1;
  }

  return { setup, drawWaveform };
})();
