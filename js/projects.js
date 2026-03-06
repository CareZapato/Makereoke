/* ============================================================
   projects.js — Song project management
   Uses File System Access API (Chrome/Edge).
   Each project = a subfolder containing:
     • project.json  (lyrics, times, settings)
     • <audio-file>  (original audio, copied on first save)
   ============================================================ */

const Projects = (() => {

  /* ── Persistence via IndexedDB ───────────────────────────── */
  const DB_NAME = 'makereoke-db', DB_VER = 1, STORE = 'handles';

  function _openDB() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
      req.onsuccess  = e => res(e.target.result);
      req.onerror    = e => rej(e.target.error);
    });
  }
  async function _putHandle(key, handle) {
    const db = await _openDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(handle, key);
      tx.oncomplete = res; tx.onerror = rej;
    });
    db.close();
  }
  async function _getHandle(key) {
    const db = await _openDB();
    const result = await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => res(req.result); req.onerror = rej;
    });
    db.close();
    return result ?? null;
  }

  /* ── State ─────────────────────────────────────────────────── */
  let rootHandle          = null; // FileSystemDirectoryHandle
  let _pendingHandle      = null; // stored handle awaiting user gesture
  let currentProjHandle   = null; // FileSystemDirectoryHandle for active project
  let currentProjData     = null; // last loaded project.json
  let _pendingSettings    = null; // settings to apply when Export setup runs

  /* ── FileSystem helpers ────────────────────────────────────── */
  async function _readJson(dirHandle) {
    try {
      const fh   = await dirHandle.getFileHandle('project.json');
      const file = await fh.getFile();
      return JSON.parse(await file.text());
    } catch (e) { return null; }
  }

  async function _writeJson(dirHandle, data) {
    const fh       = await dirHandle.getFileHandle('project.json', { create: true });
    const writable = await fh.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  /* Write an LRC file next to project.json — only if there are synced lines */
  async function _writeLrc(dirHandle, title) {
    const lrcText = Lyrics.toLRC();
    if (!lrcText) return;
    const safeName = (title || 'lyrics').replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'lyrics';
    try {
      const fh       = await dirHandle.getFileHandle(safeName + '.lrc', { create: true });
      const writable = await fh.createWritable();
      await writable.write(lrcText);
      await writable.close();
    } catch (e) { console.warn('No se pudo escribir el LRC:', e); }
  }

  /* Scan a project subfolder in a single pass — returns audio + video filenames */
  async function _scanDirFiles(dirHandle) {
    const result = { audio: null, video: null };
    try {
      for await (const [name] of dirHandle.entries()) {
        if (!result.audio && /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name)) result.audio = name;
        if (!result.video && /\.(webm|mp4|mkv)$/i.test(name)) result.video = name;
      }
    } catch (e) {}
    return result;
  }

  /* ── Scanning ──────────────────────────────────────────────── */
  async function scanProjects() {
    if (!rootHandle) return [];
    const list = [];
    for await (const [name, handle] of rootHandle.entries()) {
      if (handle.kind !== 'directory') continue;
      const data     = await _readJson(handle);
      const files    = await _scanDirFiles(handle);
      const synced   = data?.lines ? data.lines.filter(l => !l.isBlank && l.time !== null).length : 0;
      const total    = data?.lines ? data.lines.filter(l => !l.isBlank).length : 0;
      list.push({ name, handle, data, audioFile: files.audio, videoFile: files.video, synced, total });
    }
    list.sort((a, b) => {
      const da = a.data?.updatedAt ?? '0';
      const db = b.data?.updatedAt ?? '0';
      return da < db ? 1 : -1;
    });
    return list;
  }

  /* ── Folder picker ─────────────────────────────────────────── */
  async function openFolder() {
    if (!window.isSecureContext) {
      toast('La API de archivos requiere HTTPS o localhost. Accede vía http://localhost:5500', 'error');
      return null;
    }
    if (!window.showDirectoryPicker) {
      toast('Tu navegador no soporta la API de archivos. Usa Chrome o Edge.', 'error');
      return null;
    }
    try {
      rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await _putHandle('rootFolder', rootHandle);
      return await scanProjects();
    } catch (e) {
      if (e.name !== 'AbortError') toast('No se pudo abrir la carpeta.', 'error');
      return null;
    }
  }

  /* Try to restore saved folder handle on app load */
  async function tryRestoreFolder() {
    try {
      const handle = await _getHandle('rootFolder');
      if (!handle) return false;
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        rootHandle = handle;
        return true;
      }
      if (perm === 'prompt') { _pendingHandle = handle; }
    } catch (e) {}
    return false;
  }

  /* Must be called inside a user gesture */
  async function requestStoredPermission() {
    if (!_pendingHandle) return false;
    try {
      const perm = await _pendingHandle.requestPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        rootHandle = _pendingHandle;
        _pendingHandle = null;
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* ── Create project ─────────────────────────────────────────── */
  async function createProject(rawName) {
    if (!rootHandle) { toast('Primero selecciona una carpeta raíz.', 'warn'); return null; }
    const safeName  = rawName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'Sin título';
    const dirHandle = await rootHandle.getDirectoryHandle(safeName, { create: true });
    const data      = _buildProjectData(safeName, [], null, _defaultSettings());
    await _writeJson(dirHandle, data);
    currentProjHandle = dirHandle;
    currentProjData   = data;
    return { name: safeName, handle: dirHandle, data };
  }

  /* ── Load project ───────────────────────────────────────────── */
  async function loadProject(handle, audioLoaderFn) {
    const data = await _readJson(handle);
    if (!data) { toast('No se pudo leer project.json', 'error'); return false; }
    currentProjHandle = handle;
    currentProjData   = data;

    /* Restore lyrics + times */
    if (data.lines?.length) {
      Lyrics.restore(data.lines);
      const rawText = data.lines.map(l => l.text).join('\n');
      const el = document.getElementById('lyricsInput');
      if (el) el.value = rawText;
    }

    /* Restore audio */
    const { audio: audioName } = await _scanDirFiles(handle);
    if (audioName && typeof audioLoaderFn === 'function') {
      try {
        const fh   = await handle.getFileHandle(audioName);
        const file = await fh.getFile();
        await audioLoaderFn(file);
      } catch (e) { console.warn('No se pudo cargar el audio del proyecto:', e); }
    }

    /* Stash settings for Export to pick up */
    if (data.settings) _pendingSettings = { ...data.settings };

    return data;
  }

  /* ── Save project ───────────────────────────────────────────── */
  async function saveCurrentProject() {
    if (!currentProjHandle) { toast('No hay proyecto abierto. Crea o carga uno.', 'warn'); return false; }

    /* Collect current App state */
    const songTitle = document.getElementById('songTitleInput')?.value.trim()
                    || currentProjData?.songTitle || '';
    const lines      = Lyrics.lines; // getter — returns full array
    const settings   = _readUISettings();
    const audioFile  = Audio.rawFile;

    const data = _buildProjectData(
      songTitle,
      lines,
      audioFile?.name ?? currentProjData?.audioFileName ?? null,
      settings,
      currentProjData?.createdAt,
    );

    /* Try to copy the audio file into the project folder */
    if (audioFile) {
      try {
        const ah = await currentProjHandle.getFileHandle(audioFile.name, { create: true });
        const wr = await ah.createWritable();
        await wr.write(audioFile);
        await wr.close();
      } catch (e) { console.warn('No se pudo copiar el audio:', e); }
    }

    await _writeJson(currentProjHandle, data);

    /* Write / update the LRC file if there are synced lines */
    if (Lyrics.syncedCount() > 0) {
      await _writeLrc(currentProjHandle, songTitle || currentProjHandle.name);
    }

    currentProjData = data;
    toast(`💾 Proyecto guardado: ${currentProjHandle.name}`, 'success');
    _updateHeaderIndicator();
    return true;
  }

  /* ── Save video blob to project folder ──────────────────────── */
  async function saveVideoToProject(blob, filename) {
    if (!currentProjHandle) return false;
    try {
      const safe = (filename || 'video.webm').replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim();
      const fh   = await currentProjHandle.getFileHandle(safe, { create: true });
      const wr   = await fh.createWritable();
      await wr.write(blob);
      await wr.close();
      toast(`🎬 Video guardado en carpeta del proyecto`, 'success');
      return true;
    } catch (e) {
      console.warn('No se pudo guardar el video en el proyecto:', e);
      toast('No se pudo guardar el video en la carpeta.', 'warn');
      return false;
    }
  }

  /* ── Settings helpers ────────────────────────────────────────── */
  function _defaultSettings() {
    return { theme: 'classic', animation: 'none', fontSize: 56, resolution: '1920x1080', activeColor: '#FFD700', inactiveColor: '#FFFFFF' };
  }

  function _readUISettings() {
    return {
      theme:       document.querySelector('#themeSelector .theme-btn.active')?.dataset.theme    ?? 'classic',
      animation:   document.querySelector('#animGrid .anim-card.active')?.dataset.anim           ?? 'none',
      fontSize:    parseInt(document.getElementById('fontSizeSlider')?.value ?? '56', 10),
      resolution:  document.getElementById('resolutionSelect')?.value                           ?? '1920x1080',
      activeColor: document.getElementById('activeColorPicker')?.value                          ?? '#FFD700',
      inactiveColor: document.getElementById('inactiveColorPicker')?.value                      ?? '#FFFFFF',
    };
  }

  function _buildProjectData(songTitle, lines, audioFileName, settings, createdAt) {
    return {
      version:       '2',
      songTitle,
      createdAt:     createdAt ?? new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
      audioFileName: audioFileName ?? null,
      lines:         lines ?? [],
      settings:      settings ?? _defaultSettings(),
    };
  }

  function consumePendingSettings() {
    const s = _pendingSettings;
    _pendingSettings = null;
    return s;
  }

  /* ── Header indicator (updates name badge) ──────────────────── */
  function _updateHeaderIndicator() {
    const indicator = document.getElementById('projectIndicator');
    const nameEl    = document.getElementById('currentProjectName');
    if (!indicator || !nameEl) return;
    if (currentProjHandle) {
      nameEl.textContent = currentProjHandle.name;
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  }

  /* ── Public ─────────────────────────────────────────────────── */
  return {
    openFolder,
    tryRestoreFolder,
    requestStoredPermission,
    scanProjects,
    createProject,
    loadProject,
    saveCurrentProject,
    saveVideoToProject,
    consumePendingSettings,
    updateHeaderIndicator: _updateHeaderIndicator,
    get hasFolder()        { return rootHandle !== null; },
    get hasPendingHandle() { return _pendingHandle !== null; },
    get rootFolderName()   { return rootHandle?.name ?? null; },
    get currentName()      { return currentProjHandle?.name ?? null; },
    get isOpen()           { return currentProjHandle !== null; },
  };

})();
