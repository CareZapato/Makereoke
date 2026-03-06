/* ============================================================
   export.js — Video export/recording step
   ============================================================ */

const Export = (() => {

  let isInitialized = false;
  let currentTheme = 'classic';
  let previewRaf = null;
  let isRecording = false;
  let mediaRecorder = null;
  let recordedChunks = [];

  /* ─── INIT ─── */
  function init() {
    if (isInitialized) return;
    isInitialized = true;

    // Theme selector
    document.getElementById('themeSelector').addEventListener('click', e => {
      const btn = e.target.closest('.theme-btn');
      if (!btn) return;
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTheme = btn.dataset.theme;
      updatePreviewFrame();
    });

    // Font size
    document.getElementById('fontSizeSlider').addEventListener('input', e => {
      document.getElementById('fontSizeVal').textContent = e.target.value + 'px';
      updatePreviewFrame();
    });

    // Color pickers
    document.getElementById('activeColorPicker').addEventListener('input', updatePreviewFrame);
    document.getElementById('inactiveColorPicker').addEventListener('input', updatePreviewFrame);

    // Song title
    document.getElementById('songTitleInput').addEventListener('input', updatePreviewFrame);

    // Preview player
    document.getElementById('exportPlayBtn').addEventListener('click', togglePreviewPlay);
    document.getElementById('exportSeekBar').addEventListener('input', e => {
      Audio.seek(parseFloat(e.target.value));
      updatePreviewFrame();
    });

    // Buttons
    document.getElementById('previewExportBtn').addEventListener('click', startPreviewPlayback);
    document.getElementById('startRecordBtn').addEventListener('click', startRecording);
  }

  /* ─── SETUP ─── */
  function setup() {
    init();
    // Always reassign callbacks
    Audio.onTimeUpdate = onPreviewTimeUpdate;
    Audio.onEnded = () => { document.getElementById('exportPlayBtn').textContent = '▶'; };

    sizePreviewCanvas();
    updatePreviewFrame();

    const dur = Audio.duration;
    document.getElementById('exportSeekBar').max = dur;
    document.getElementById('exportSeekBar').value = Audio.getCurrentTime();
  }

  function sizePreviewCanvas() {
    const [W, H] = getResolution();
    const canvas = document.getElementById('exportPreviewCanvas');
    const wrap = canvas.parentElement;
    const maxW = wrap.offsetWidth;
    const maxH = 380;
    const ar = W / H;
    let dW = Math.min(maxW, W);
    let dH = dW / ar;
    if (dH > maxH) { dH = maxH; dW = dH * ar; }
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = dW + 'px';
    canvas.style.height = dH + 'px';
  }

  /* ─── RENDER OPTIONS ─── */
  function getRenderOpts(time) {
    return {
      time,
      duration: Audio.duration,
      lines: Lyrics.getSyncedLines(),
      theme: currentTheme,
      fontSize: parseInt(document.getElementById('fontSizeSlider').value),
      songTitle: document.getElementById('songTitleInput').value,
      activeColorOverride: document.getElementById('activeColorPicker').value,
      inactiveColorOverride: document.getElementById('inactiveColorPicker').value,
    };
  }

  /* ─── PREVIEW ─── */
  function updatePreviewFrame() {
    const canvas = document.getElementById('exportPreviewCanvas');
    Renderer.drawFrame(canvas, getRenderOpts(Audio.getCurrentTime()));
  }

  function onPreviewTimeUpdate(t) {
    document.getElementById('exportCurrentTime').textContent = formatTime(t);
    document.getElementById('exportSeekBar').value = t;
    updatePreviewFrame();
  }

  function togglePreviewPlay() {
    Audio.toggle();
    document.getElementById('exportPlayBtn').textContent = Audio.isPlaying ? '⏸' : '▶';
  }

  function startPreviewPlayback() {
    Audio.seek(0);
    Audio.play(0);
    document.getElementById('exportPlayBtn').textContent = '⏸';
  }

  /* ─── RESOLUTION HELPER ─── */
  function getResolution() {
    const val = document.getElementById('resolutionSelect').value;
    return val.split('x').map(Number);
  }

  /* ─── RECORDING ─── */
  async function startRecording() {
    if (isRecording) return;

    // Stop preview
    if (Audio.isPlaying) { Audio.pause(); document.getElementById('exportPlayBtn').textContent = '▶'; }
    cancelAnimationFrame(previewRaf);

    const [W, H] = getResolution();
    const fps = 30;

    // Set up recording canvas (hidden, full resolution)
    const recCanvas = document.createElement('canvas');
    recCanvas.width = W;
    recCanvas.height = H;

    // Video stream from canvas
    const videoStream = recCanvas.captureStream(fps);

    // Audio stream — tap into existing AudioContext gain node
    const recStream = Audio.createRecordingStream();
    let combinedStream = videoStream;
    try {
      if (recStream && recStream.stream) {
        recStream.stream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
      }
    } catch (e) {
      console.warn('No audio stream', e);
    }

    // Select codec
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';

    recordedChunks = [];
    try {
      mediaRecorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 8_000_000 });
    } catch (e) {
      toast('Tu navegador no soporta grabación de video. Usa Chrome o Edge.', 'error');
      return;
    }

    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => finishRecording(mimeType);

    isRecording = true;
    showRecordingUI(true);

    // Start audio playback from beginning
    Audio.seek(0);
    Audio.play(0);

    mediaRecorder.start(100);

    const opts = getRenderOpts(0);
    const dur = Audio.duration;

    function recordLoop() {
      const elapsed = Audio.getCurrentTime();
      if (!isRecording) return;

      opts.time = elapsed;
      Renderer.drawFrame(recCanvas, opts);

      const progress = Math.min(elapsed / dur * 100, 100);
      document.getElementById('progressBarInner').style.width = progress + '%';
      document.getElementById('progressLabel').textContent = `Grabando... ${Math.round(progress)}%`;

      previewRaf = requestAnimationFrame(recordLoop);
    }

    function finalize() {
      isRecording = false;
      cancelAnimationFrame(previewRaf);
      Audio.stop();
      recStream.stop();
      if (mediaRecorder.state !== 'inactive') {
        setTimeout(() => mediaRecorder.stop(), 200); // let last chunk flush
      }
    }

    // Draw first frame immediately
    Renderer.drawFrame(recCanvas, getRenderOpts(0));
    previewRaf = requestAnimationFrame(recordLoop);

    // Auto-stop when audio naturally ends
    Audio.onEnded = () => {
      setTimeout(finalize, 400);
      document.getElementById('exportPlayBtn').textContent = '▶';
    };
  }

  function finishRecording(mimeType) {
    showRecordingUI(false);
    if (recordedChunks.length === 0) {
      toast('Error: no se grabaron datos.', 'error');
      return;
    }

    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const title = document.getElementById('songTitleInput').value.trim() || 'karaoke';
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_\- ]/g,'_')}.${ext}`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 5000);

    toast(`¡Video descargado exitosamente! (${ext.toUpperCase()})`, 'success');
    document.getElementById('progressLabel').textContent = '✅ ¡Listo! Video descargado.';
    document.getElementById('progressBarInner').style.width = '100%';
  }

  function showRecordingUI(show) {
    document.getElementById('recordProgress').classList.toggle('hidden', !show);
    document.getElementById('startRecordBtn').disabled = show;
    document.getElementById('previewExportBtn').disabled = show;
    document.getElementById('backToAdjustBtn').disabled = show;
    if (!show) {
      document.getElementById('progressBarInner').style.width = '0%';
    }
  }

  return { setup };
})();
