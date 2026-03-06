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
      // Apply any pending project settings before setup()
      const pending = Projects.consumePendingSettings();
      if (pending) Export.applySettings(pending);
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
      // Auto-save project when times have been set
      if (Projects.isOpen) Projects.saveCurrentProject();
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
      // Auto-save project when moving to export step
      if (Projects.isOpen) Projects.saveCurrentProject();
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

    if (e.key === 'Escape') {
      // Close projects overlay first
      const overlay = document.getElementById('projectsOverlay');
      const modal   = document.getElementById('newProjectModal');
      if (modal && !modal.classList.contains('hidden'))   { modal.classList.add('hidden'); return; }
      if (overlay && !overlay.classList.contains('hidden')) { overlay.classList.add('hidden'); document.body.style.overflow = ''; return; }
      // Otherwise stop audio
      if (Audio.isPlaying) {
        Audio.pause();
        document.querySelectorAll('.play-btn').forEach(b => b.textContent = '▶');
      }
    }
  });

  /* ══════════════════════════════════════════
     PROJECTS PANEL
  ══════════════════════════════════════════ */
  function initProjects() {
    const overlay          = document.getElementById('projectsOverlay');
    const openBtn          = document.getElementById('openProjectsBtn');
    const closeBtn         = document.getElementById('closeProjectsBtn');
    const backdrop         = document.getElementById('projectsBackdrop');
    const openFolderBtn    = document.getElementById('openFolderBtn');
    const openFolderEmptyBtn = document.getElementById('openFolderEmptyBtn');
    const reconnectBtn     = document.getElementById('reconnectFolderBtn');
    const newProjectBtn    = document.getElementById('newProjectBtn');
    const rootFolderNameEl = document.getElementById('rootFolderName');
    const projectsBody     = document.getElementById('projectsBody');
    const projectsEmpty    = document.getElementById('projectsEmpty');
    const newProjectModal  = document.getElementById('newProjectModal');
    const nameInput        = document.getElementById('newProjectNameInput');
    const cancelNewBtn     = document.getElementById('cancelNewProjectBtn');
    const confirmNewBtn    = document.getElementById('confirmNewProjectBtn');
    const saveProjectBtn   = document.getElementById('saveProjectBtn');

    function openOverlay() {
      overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      updateFolderUI();
      if (Projects.hasFolder) refreshProjectsList();
    }
    function closeOverlay() {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', async () => {
      // If we have a pending handle, try to request permission first (this is a user gesture)
      if (!Projects.hasFolder && Projects.hasPendingHandle) {
        const ok = await Projects.requestStoredPermission();
        if (ok) updateFolderUI();
      }
      openOverlay();
    });
    closeBtn.addEventListener('click', closeOverlay);
    backdrop.addEventListener('click', closeOverlay);

    async function doOpenFolder() {
      const list = await Projects.openFolder();
      if (list !== null) { updateFolderUI(); renderList(list); }
    }
    openFolderBtn.addEventListener('click', doOpenFolder);
    openFolderEmptyBtn.addEventListener('click', doOpenFolder);
    reconnectBtn.addEventListener('click', async () => {
      const ok = await Projects.requestStoredPermission();
      if (ok) { updateFolderUI(); refreshProjectsList(); }
    });

    /* New project modal */
    newProjectBtn.addEventListener('click', () => {
      newProjectModal.classList.remove('hidden');
      nameInput.value = ''; nameInput.focus();
    });
    cancelNewBtn.addEventListener('click', () => newProjectModal.classList.add('hidden'));
    async function doCreateProject() {
      const name = nameInput.value.trim();
      if (!name) { toast('Escribe un nombre para el proyecto.', 'warn'); return; }
      newProjectModal.classList.add('hidden');
      const proj = await Projects.createProject(name);
      if (proj) {
        const ti = document.getElementById('songTitleInput');
        if (ti) ti.value = name;
        Projects.updateHeaderIndicator();
        closeOverlay();
        checkUploadReady();
        toast(`Proyecto creado: “${name}”`, 'success');
      }
      refreshProjectsList();
    }
    confirmNewBtn.addEventListener('click', doCreateProject);
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doCreateProject(); });

    /* Save button in header */
    saveProjectBtn.addEventListener('click', () => Projects.saveCurrentProject());

    /* Helpers */
    function updateFolderUI() {
      const name = Projects.rootFolderName;
      if (name) {
        rootFolderNameEl.textContent = name;
        rootFolderNameEl.classList.add('has-folder');
        newProjectBtn.disabled = false;
        reconnectBtn.classList.add('hidden');
      } else {
        rootFolderNameEl.textContent = Projects.hasPendingHandle ? '(requiere permiso)' : 'Sin carpeta seleccionada';
        rootFolderNameEl.classList.remove('has-folder');
        newProjectBtn.disabled = true;
        if (Projects.hasPendingHandle) reconnectBtn.classList.remove('hidden');
      }
    }

    async function refreshProjectsList() {
      projectsBody.innerHTML = '<div class="projects-loading"><div class="spinner"></div><span>Cargando…</span></div>';
      const list = await Projects.scanProjects();
      renderList(list);
    }

    function renderList(list) {
      projectsBody.innerHTML = '';
      if (!Projects.hasFolder) {
        projectsBody.appendChild(projectsEmpty);
        projectsEmpty.classList.remove('hidden');
        return;
      }
      if (list.length === 0) {
        projectsBody.innerHTML = `
          <div class="projects-empty">
            <div class="empty-icon">🎵</div>
            <h3>Carpeta vacía</h3>
            <p>No hay proyectos todavía. Crea uno nuevo con el botón de arriba.</p>
          </div>`;
        return;
      }
      const grid = document.createElement('div');
      grid.className = 'projects-grid';
      list.forEach(proj => {
        const syncCls  = proj.synced === proj.total && proj.total > 0 ? 'synced' : proj.synced > 0 ? 'partial' : '';
        const syncTxt  = proj.total > 0 ? `${proj.synced}/${proj.total} frases` : 'Sin letra';
        const dateStr  = proj.data?.updatedAt ? new Date(proj.data.updatedAt).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }) : '';
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
          <div class="project-card-title">${proj.name}</div>
          <div class="project-card-meta">
            <span class="project-card-badge ${syncCls}">♪ ${syncTxt}</span>
            ${proj.audioFile ? '<span class="project-card-badge audio">🎵 Audio</span>' : ''}
            ${proj.videoFile ? '<span class="project-card-badge video">🎬 Video</span>' : ''}
            ${dateStr ? `<span class="project-card-date">${dateStr}</span>` : ''}
          </div>
          <div class="project-card-actions">
            <button class="project-load-btn">Cargar →</button>
          </div>`;

        card.querySelector('.project-load-btn').addEventListener('click', async () => {
          const data = await Projects.loadProject(proj.handle, loadAudioFile);
          if (!data) return;
          // Restore song title field
          const ti = document.getElementById('songTitleInput');
          if (ti && data.songTitle) ti.value = data.songTitle;
          Projects.updateHeaderIndicator();
          closeOverlay();
          const hasTimes  = data.lines?.some(l => !l.isBlank && l.time !== null);
          const hasAudioLoaded = Audio.duration > 0;
          const hasLyricsLoaded = data.lines?.some(l => !l.isBlank) ?? false;
          checkUploadReady();
          // Navigate to the most advanced applicable step
          if (hasTimes)                         goToStep(3);
          else if (hasAudioLoaded && hasLyricsLoaded) goToStep(2);
          else                                  goToStep(1);
          toast(`💼 Proyecto cargado: “${proj.name}”`, 'success');
        });
        grid.appendChild(card);
      });
      projectsBody.appendChild(grid);
    }

    /* Restore folder on load (non-user-gesture — only query permission) */
    Projects.tryRestoreFolder().then(restored => {
      if (restored) {
        updateFolderUI();
        // Silently ready — no toast, just update UI state
      } else if (Projects.hasPendingHandle) {
        updateFolderUI(); // show reconnect button state
      }
    });
  }

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
    initProjects();
    initResizeObserver();
    console.log(`%c🎤 Makereoke v${APP_VERSION}`, 'color:#b47aff;font-size:14px;font-weight:700');
  });

})();
