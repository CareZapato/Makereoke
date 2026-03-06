/* ============================================================
   export-engine.js — Step 4: Export (video recording) (ES module)
   ============================================================ */

import Audio from './audio.js';
import Lyrics from './lyrics.js';
import Renderer from './renderer.js';
import Projects from './projects.js';
import { formatTime, debounce } from './utils.js';

const ExportEngine = (() => {

  /* ── State ────────────────────────────────────────────── */
  let currentTheme     = 'classic';
  let currentAnimation = 'none';
  let currentOverlay   = 'none';
  let currentTextPos   = 'center';
  let currentGlow      = 1;
  let previewRaf       = null;
  let recording        = false;

  /* ── DOM refs (set in init) ────────────────────────────── */
  let themeSelector, animGrid, overlayGrid;
  let resolutionSelect, fontSizeSlider, fontSizeVal;
  let glowSlider, glowVal, textPositionSelect, fpsSelect;
  let showProgressToggle, showTitleToggle;
  let songTitleInput, activeColorPicker, inactiveColorPicker;
  let previewCanvas, exportPlayBtn, exportSeekBar, exportCurrentTime;
  let startRecordBtn, previewExportBtn;
  let recordProgress, progressBarInner, progressLabel;

  /* ═══════════════════════════════════════════════════════
     init() — called once on app boot
  ═══════════════════════════════════════════════════════ */
  function init() {
    themeSelector      = document.getElementById('themeSelector');
    animGrid           = document.getElementById('animGrid');
    resolutionSelect   = document.getElementById('resolutionSelect');
    fontSizeSlider     = document.getElementById('fontSizeSlider');
    fontSizeVal        = document.getElementById('fontSizeVal');
    songTitleInput     = document.getElementById('songTitleInput');
    activeColorPicker  = document.getElementById('activeColorPicker');
    inactiveColorPicker= document.getElementById('inactiveColorPicker');
    previewCanvas      = document.getElementById('exportPreviewCanvas');
    exportPlayBtn      = document.getElementById('exportPlayBtn');
    exportSeekBar      = document.getElementById('exportSeekBar');
    exportCurrentTime  = document.getElementById('exportCurrentTime');
    startRecordBtn     = document.getElementById('startRecordBtn');
    previewExportBtn   = document.getElementById('previewExportBtn');
    recordProgress     = document.getElementById('recordProgress');
    progressBarInner   = document.getElementById('progressBarInner');
    progressLabel      = document.getElementById('progressLabel');

    // Guard: export panel may not be mounted yet on first boot
    if (!themeSelector || !animGrid || !fontSizeSlider || !exportPlayBtn || !startRecordBtn) return;

    /* ── Build theme buttons from Renderer.THEME_LIST ── */
    themeSelector.innerHTML = '';
    Renderer.THEME_LIST.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'theme-btn' + (t.id === currentTheme ? ' active' : '');
      btn.dataset.theme = t.id;
      btn.textContent = `${t.emoji} ${t.label}`;
      btn.addEventListener('click', () => {
        currentTheme = t.id;
        themeSelector.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t.id));
        renderPreviewFrame();
      });
      themeSelector.appendChild(btn);
    });

    /* ── Build animation grid from Renderer.ANIMATION_LIST ── */
    animGrid.innerHTML = '';
    Renderer.ANIMATION_LIST.forEach(a => {
      const card = document.createElement('div');
      card.className = 'anim-card' + (a.id === currentAnimation ? ' active' : '');
      card.dataset.anim = a.id;
      card.innerHTML = `<span class="anim-emoji">${a.emoji}</span><span class="anim-label">${a.label}</span>`;
      card.addEventListener('click', () => {
        currentAnimation = a.id;
        animGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.anim === a.id));
        renderPreviewFrame();
      });
      animGrid.appendChild(card);
    });

    /* ── Build overlay grid from Renderer.OVERLAY_LIST ── */
    overlayGrid = document.getElementById('overlayGrid');
    if (overlayGrid) {
      overlayGrid.innerHTML = '';
      Renderer.OVERLAY_LIST.forEach(o => {
        const card = document.createElement('div');
        card.className = 'anim-card' + (o.id === currentOverlay ? ' active' : '');
        card.dataset.ov = o.id;
        card.innerHTML = `<span class="anim-emoji">${o.emoji}</span><span class="anim-label">${o.label}</span>`;
        card.addEventListener('click', () => {
          currentOverlay = o.id;
          overlayGrid.querySelectorAll('.anim-card').forEach(c => c.classList.toggle('active', c.dataset.ov === o.id));
          renderPreviewFrame();
        });
        overlayGrid.appendChild(card);
      });
    }

    /* ── Font size ── */
    fontSizeSlider.addEventListener('input', () => {
      fontSizeVal.textContent = fontSizeSlider.value + 'px';
      renderPreviewFrame();
    });

    /* ── Glow + text position + new controls ── */
    glowSlider         = document.getElementById('glowSlider');
    glowVal            = document.getElementById('glowVal');
    textPositionSelect = document.getElementById('textPositionSelect');
    fpsSelect          = document.getElementById('fpsSelect');
    showProgressToggle = document.getElementById('showProgressToggle');
    showTitleToggle    = document.getElementById('showTitleToggle');
    if (glowSlider) {
      glowSlider.addEventListener('input', () => {
        currentGlow = parseFloat(glowSlider.value);
        if (glowVal) glowVal.textContent = currentGlow.toFixed(1) + '×';
        renderPreviewFrame();
      });
    }
    if (textPositionSelect) textPositionSelect.addEventListener('change', () => { currentTextPos = textPositionSelect.value; renderPreviewFrame(); });
    if (showProgressToggle) showProgressToggle.addEventListener('change', renderPreviewFrame);
    if (showTitleToggle)    showTitleToggle.addEventListener('change', renderPreviewFrame);

    /* ── Color pickers ── */
    activeColorPicker.addEventListener('input', renderPreviewFrame);
    inactiveColorPicker.addEventListener('input', renderPreviewFrame);

    /* ── Song title ── */
    songTitleInput.addEventListener('input', debounce(renderPreviewFrame, 200));

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
  }

  /* ═══════════════════════════════════════════════════════
     setup() — called whenever panel4 becomes active
  ═══════════════════════════════════════════════════════ */
  function setup() {
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

    renderPreviewAt(0);
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
      songTitle:             songTitleInput.value.trim(),
      activeColorOverride:   activeColorPicker.value   !== '#FFD700' ? activeColorPicker.value   : null,
      inactiveColorOverride: inactiveColorPicker.value !== '#FFFFFF' ? inactiveColorPicker.value : null,
      showProgressBar:       showProgressToggle ? showProgressToggle.checked : true,
      showTitle:             showTitleToggle    ? showTitleToggle.checked    : true,
    };
  }

  function renderPreviewFrame() { renderPreviewAt(Audio.getCurrentTime()); }

  function renderPreviewAt(t) {
    const [rW, rH] = (resolutionSelect.value || '1920x1080').split('x').map(Number);
    if (previewCanvas.width !== rW || previewCanvas.height !== rH) {
      previewCanvas.width = rW; previewCanvas.height = rH;
    }
    Renderer.drawFrame(previewCanvas, getRenderOpts(t));
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
  async function startRecording() {
    if (recording) return;
    recording = true;
    stopPreviewLoop();
    Audio.seek(0);
    exportPlayBtn.textContent = '▶';

    const [rW, rH] = (resolutionSelect.value || '1920x1080').split('x').map(Number);
    const recCanvas = document.createElement('canvas');
    recCanvas.width = rW; recCanvas.height = rH;

    document.querySelector('.status-idle').classList.add('hidden');
    recordProgress.classList.remove('hidden');
    progressBarInner.style.width = '0%';
    progressLabel.textContent = 'Preparando...';
    startRecordBtn.disabled = true;
    previewExportBtn.disabled = true;

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

      if (Projects.isOpen) {
        await Projects.saveVideoToProject(blob, filename);
      }

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
    if (s.activeColor   && activeColorPicker)   activeColorPicker.value   = s.activeColor;
    if (s.inactiveColor && inactiveColorPicker) inactiveColorPicker.value = s.inactiveColor;
  }

  return { init, setup, applySettings };
})();

export default ExportEngine;
