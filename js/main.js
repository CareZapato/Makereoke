/* ============================================================
   main.js — App orchestration, navigation, upload handling
   ============================================================ */

(function () {

  /* ══════════════════════════════════════════
     STATE
  ══════════════════════════════════════════ */
  let currentStep = 1;

  /* ══════════════════════════════════════════
     STEP NAVIGATION
  ══════════════════════════════════════════ */
  function goToStep(n) {
    // Deactivate current
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => {
      const sn = parseInt(s.dataset.step);
      s.classList.remove('active', 'done');
      if (sn < n) s.classList.add('done');
      if (sn === n) s.classList.add('active');
    });

    // Update step numbers to ✓ for done steps
    document.querySelectorAll('.step').forEach(s => {
      const sn = parseInt(s.dataset.step);
      const numEl = s.querySelector('.step-num');
      if (sn < n) numEl.textContent = '✓';
      else numEl.textContent = sn;
    });

    document.getElementById(`panel${n}`).classList.add('active');
    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Run setup for each step
    if (n === 2) Sync.setup();
    if (n === 3) {
      if (!Audio.isPlaying) Audio.seek(0);
      Adjust.setup();
    }
    if (n === 4) {
      if (Audio.isPlaying) { Audio.pause(); }
      Audio.seek(0);
      Export.setup();
    }
  }

  /* ══════════════════════════════════════════
     STEP 1 — UPLOAD
  ══════════════════════════════════════════ */
  function initUpload() {
    const audioDropZone = document.getElementById('audioDropZone');
    const audioInput    = document.getElementById('audioInput');
    const lyricsInput   = document.getElementById('lyricsInput');
    const lyricsFileInput = document.getElementById('lyricsFileInput');
    const clearLyricsBtn  = document.getElementById('clearLyricsBtn');
    const goSyncBtn     = document.getElementById('goToSyncBtn');

    // Click on audio drop zone
    audioDropZone.addEventListener('click', () => audioInput.click());

    // File selected
    audioInput.addEventListener('change', e => {
      if (e.target.files[0]) loadAudioFile(e.target.files[0]);
    });

    // Drag & drop on audio zone
    audioDropZone.addEventListener('dragover', e => { e.preventDefault(); audioDropZone.classList.add('drag-over'); });
    audioDropZone.addEventListener('dragleave', () => audioDropZone.classList.remove('drag-over'));
    audioDropZone.addEventListener('drop', e => {
      e.preventDefault();
      audioDropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) loadAudioFile(file);
      else toast('Por favor sube un archivo de audio válido.', 'error');
    });

    // Lyrics text area
    lyricsInput.addEventListener('input', checkUploadReady);

    // Load lyrics from .txt / .lrc
    lyricsFileInput.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await readFileAsText(file);
      lyricsInput.value = text;
      Lyrics.autoLoad(text);
      checkUploadReady();
      toast(`Letra cargada (${Lyrics.lyricsCount()} frases)`, 'success');
    });

    clearLyricsBtn.addEventListener('click', () => {
      lyricsInput.value = '';
      checkUploadReady();
    });

    // Next step button
    goSyncBtn.addEventListener('click', () => {
      const raw = lyricsInput.value;
      if (!raw.trim()) { toast('Por favor agrega la letra.', 'warn'); return; }
      Lyrics.autoLoad(raw);
      if (Lyrics.lyricsCount() < 1) { toast('La letra no tiene frases válidas.', 'warn'); return; }
      goToStep(2);
    });
  }

  async function loadAudioFile(file) {
    const statusEl = document.getElementById('audioStatus');
    const dropZone  = document.getElementById('audioDropZone');
    const uploadIcon = dropZone.querySelector('.upload-icon');

    statusEl.textContent = '⏳ Cargando...';
    dropZone.classList.remove('has-file');

    try {
      const dur = await Audio.load(file);
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      statusEl.innerHTML = `✅ <strong>${file.name}</strong><br/>${formatTime(dur)} · ${sizeMB} MB`;
      dropZone.classList.add('has-file');
      uploadIcon.textContent = '🎵';
      checkUploadReady();
      toast(`Audio cargado: ${file.name}`, 'success');
    } catch (e) {
      statusEl.textContent = '❌ Error al cargar el audio.';
      toast('No se pudo decodificar el audio. Verifica el formato.', 'error');
      console.error(e);
    }
  }

  function checkUploadReady() {
    const hasAudio  = Audio.duration > 0;
    const hasLyrics = document.getElementById('lyricsInput').value.trim().length > 0;
    document.getElementById('goToSyncBtn').disabled = !(hasAudio && hasLyrics);
  }

  /* ══════════════════════════════════════════
     STEP 2 → STEP 3
  ══════════════════════════════════════════ */
  function initSyncNav() {
    document.getElementById('backToUploadBtn').addEventListener('click', () => {
      if (Audio.isPlaying) Audio.pause();
      goToStep(1);
    });
    document.getElementById('goToAdjustBtn').addEventListener('click', () => {
      if (Audio.isPlaying) Audio.pause();
      goToStep(3);
    });
  }

  /* ══════════════════════════════════════════
     STEP 3 → STEP 4
  ══════════════════════════════════════════ */
  function initAdjustNav() {
    document.getElementById('backToSyncBtn').addEventListener('click', () => {
      if (Audio.isPlaying) Audio.pause();
      goToStep(2);
    });
    document.getElementById('goToExportBtn').addEventListener('click', () => {
      if (Audio.isPlaying) Audio.pause();
      goToStep(4);
    });
  }

  /* ══════════════════════════════════════════
     STEP 4 BACK
  ══════════════════════════════════════════ */
  function initExportNav() {
    document.getElementById('backToAdjustBtn').addEventListener('click', () => {
      if (Audio.isPlaying) Audio.pause();
      goToStep(3);
    });
  }

  /* ══════════════════════════════════════════
     KEYBOARD SHORTCUTS (global)
  ══════════════════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Escape — stop audio
    if (e.key === 'Escape' && Audio.isPlaying) {
      Audio.pause();
      document.querySelectorAll('.play-btn').forEach(b => b.textContent = '▶');
    }
  });

  /* ══════════════════════════════════════════
     CANVAS RESIZE OBSERVER
  ══════════════════════════════════════════ */
  function initResizeObserver() {
    const ro = new ResizeObserver(debounce(() => {
      if (currentStep === 2) Sync.drawWaveform();
      if (currentStep === 3) Adjust.setup();
      if (currentStep === 4) Export.setup();
    }, 200));
    ro.observe(document.body);
  }

  /* ══════════════════════════════════════════
     POLYFILL: ctx.roundRect
  ══════════════════════════════════════════ */
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r = 0) {
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.arcTo(x + w, y, x + w, y + r, r);
      this.lineTo(x + w, y + h - r);
      this.arcTo(x + w, y + h, x + w - r, y + h, r);
      this.lineTo(x + r, y + h);
      this.arcTo(x, y + h, x, y + h - r, r);
      this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r);
      this.closePath();
      return this;
    };
  }

  /* ══════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    // Mostrar versión en el header
    const vb = document.getElementById('versionBadge');
    if (vb) vb.textContent = 'v' + APP_VERSION;

    initUpload();
    initSyncNav();
    initAdjustNav();
    initExportNav();
    Export.init();
    initResizeObserver();
    console.log(`%c🎤 Makereoke v${APP_VERSION}`, 'color:#b47aff;font-size:14px;font-weight:700');
  });

})();
