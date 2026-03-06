/* ============================================================
   projects.js — Song project management (ES module)
   Uses File System Access API (Chrome/Edge on HTTPS / localhost).
   Each project = a subfolder containing:
     • project.json  (lyrics, times, settings)
     • <audio-file>  (original audio, copied on first save)
   ============================================================ */

import Lyrics from './lyrics.js';
import Audio from './audio.js';
import { toast } from './utils.js';


const Projects = (() => {

  /* ── Persistence via IndexedDB ───────────────────────────── */
  const DB_NAME    = 'makereoke-db';
  const DB_VER     = 2;          // v2 adds 'projects' store
  const STORE      = 'handles';  // FileSystemDirectoryHandles
  const STORE_PROJ = 'projects'; // client-side project storage (HTTP LAN)

  function _openDB() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE))      db.createObjectStore(STORE);
        if (!db.objectStoreNames.contains(STORE_PROJ)) db.createObjectStore(STORE_PROJ);
      };
      req.onsuccess = e => res(e.target.result);
      req.onerror   = e => rej(e.target.error);
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

  /* ── IDB project store (HTTP LAN — no File System Access API) ───────── */
  async function idbSaveProject(name, data, audioFile) {
    const db = await _openDB();
    const entry = { data, audioName: audioFile?.name ?? data?.audioFileName ?? null };
    // Store audio Blob — IndexedDB handles large Blobs natively
    if (audioFile instanceof File || audioFile instanceof Blob) {
      entry.audioBlob = audioFile;
    }
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE_PROJ, 'readwrite');
      tx.objectStore(STORE_PROJ).put(entry, name);
      tx.oncomplete = res; tx.onerror = rej;
    });
    db.close();
  }

  async function idbListProjects() {
    const db = await _openDB();
    const entries = await new Promise((res, rej) => {
      const tx    = db.transaction(STORE_PROJ, 'readonly');
      const store = tx.objectStore(STORE_PROJ);
      let values = [], keys = [];
      store.getAll().onsuccess    = e => { values = e.target.result; };
      store.getAllKeys().onsuccess = e => { keys   = e.target.result; };
      tx.oncomplete = () => res(keys.map((k, i) => ({ name: k, ...values[i] })));
      tx.onerror    = rej;
    });
    db.close();
    return entries.map(e => ({
      name:      e.name,
      data:      e.data,
      audioFile: e.audioName ?? null,
      videoFile: null, // videos are always downloaded
      synced:    e.data?.lines?.filter(l => !l.isBlank && l.time !== null).length ?? 0,
      total:     e.data?.lines?.filter(l => !l.isBlank).length ?? 0,
    })).sort((a, b) => ((a.data?.updatedAt ?? '0') < (b.data?.updatedAt ?? '0') ? 1 : -1));
  }

  async function idbLoadProject(name) {
    const db = await _openDB();
    const entry = await new Promise((res, rej) => {
      const tx  = db.transaction(STORE_PROJ, 'readonly');
      const req = tx.objectStore(STORE_PROJ).get(name);
      req.onsuccess = () => res(req.result ?? null);
      req.onerror   = rej;
    });
    db.close();
    return entry; // { data, audioBlob?, audioName }
  }

  async function idbDeleteProject(name) {
    const db = await _openDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE_PROJ, 'readwrite');
      tx.objectStore(STORE_PROJ).delete(name);
      tx.oncomplete = res; tx.onerror = rej;
    });
    db.close();
  }

  /* ── State ──────────────────────────────────────────────────── */
  let rootHandle             = null;
  let _pendingHandle         = null;
  let currentProjHandle      = null;
  let currentProjData        = null;
  let _idbProjectName        = null; // active project name in IDB mode
  let _pendingSettings       = null;
  let _projectChangeListener = null;
  let _serverFolder          = '';

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

  /* ── Scanning ──────────────────────────────────────────── */
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
      toast('La selección de carpeta requiere HTTPS. Conecta vía https:// para seleccionar carpetas desde cualquier PC.', 'warn');
      return null;
    }
    if (!window.showDirectoryPicker) {
      toast('Tu navegador no soporta el selector de carpetas. Usa Chrome o Edge.', 'error');
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
  async function loadProject(proj, audioLoaderFn) {
    const handle = proj?.handle ?? proj;
    const data   = await _readJson(handle);
    if (!data) { toast('No se pudo leer project.json', 'error'); return false; }
    currentProjHandle = handle;
    currentProjData   = data;

    if (data.lines?.length) {
      Lyrics.restore(data.lines);
      const rawText = data.lines.map(l => l.text).join('\n');
      const el = document.getElementById('lyricsInput');
      if (el) el.value = rawText;
    }

    const { audio: audioName } = await _scanDirFiles(handle);
    if (audioName && typeof audioLoaderFn === 'function') {
      try {
        const fh   = await handle.getFileHandle(audioName);
        const file = await fh.getFile();
        await audioLoaderFn(file);
      } catch (e) { console.warn('No se pudo cargar el audio del proyecto:', e); }
    }

    if (data.settings) _pendingSettings = { ...data.settings };
    _updateHeaderIndicator();
    return data;
  }

  /* ── Save project ───────────────────────────────────────────── */
  async function saveCurrentProject() {
    const songTitle = document.getElementById('songTitleInput')?.value.trim()
                    || currentProjData?.songTitle || '';

    /* ─ No File System handle available ───────────────────────────── */
    if (!currentProjHandle && !rootHandle) {
      if (!window.isSecureContext) {
        /* HTTP LAN: save everything to IndexedDB in this browser */
        if (!songTitle) {
          toast('Define el nombre del proyecto en el Paso 1 antes de guardar.', 'warn');
          return false;
        }
        const safeName = songTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'Sin título';
        const lines    = Lyrics.lines;
        const settings = _readUISettings();
        const audioFile = Audio.rawFile;
        const data = _buildProjectData(
          safeName, lines,
          audioFile?.name ?? currentProjData?.audioFileName ?? null,
          settings, currentProjData?.createdAt,
        );
        await idbSaveProject(safeName, data, audioFile ?? null);
        currentProjData   = data;
        _idbProjectName   = safeName;
        toast(`💾 Proyecto guardado en este navegador: ${safeName}`, 'success');
        _updateHeaderIndicator();
        return true;
      }
      /* Secure context but no folder — fall back to download */
      saveProjectAsDownload();
      return true;
    }

    /* Auto-create project subfolder if root selected but no project open yet */
    if (!currentProjHandle) {
      if (!songTitle) {
        toast('Define el nombre del proyecto en el Paso 1 antes de guardar.', 'warn');
        return false;
      }
      const safeName    = songTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'Sin título';
      currentProjHandle = await rootHandle.getDirectoryHandle(safeName, { create: true });
    }

    const lines     = Lyrics.lines;
    const settings  = _readUISettings();
    const audioFile = Audio.rawFile;

    const data = _buildProjectData(
      songTitle,
      lines,
      audioFile?.name ?? currentProjData?.audioFileName ?? null,
      settings,
      currentProjData?.createdAt,
    );

    if (audioFile) {
      try {
        const ah = await currentProjHandle.getFileHandle(audioFile.name, { create: true });
        const wr = await ah.createWritable();
        await wr.write(audioFile);
        await wr.close();
      } catch (e) { console.warn('No se pudo copiar el audio:', e); }
    }

    await _writeJson(currentProjHandle, data);

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

  /* ── Header indicator (React bridge) ──────────────────────── */
  function _updateHeaderIndicator() {
    if (_projectChangeListener) {
      _projectChangeListener(currentProjHandle?.name ?? null);
    }
  }

  function setProjectChangeListener(cb) {
    _projectChangeListener = cb;
  }

  /* ── Clear folder ──────────────────────────────────────────── */
  async function clearFolder() {
    rootHandle     = null;
    _pendingHandle = null;
    try {
      const db = await _openDB();
      await new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete('rootFolder');
        tx.oncomplete = res; tx.onerror = rej;
      });
      db.close();
    } catch (e) { /* ignore */ }
    _updateHeaderIndicator();
  }

  /* ── Download-based save (fallback without File System API) ─── */
  function _triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  function saveProjectAsDownload() {
    const songTitle = document.getElementById('songTitleInput')?.value.trim()
                    || currentProjData?.songTitle || currentProjHandle?.name || 'proyecto';
    const lines    = Lyrics.lines;
    const settings = _readUISettings();
    const data     = _buildProjectData(
      songTitle, lines,
      currentProjData?.audioFileName ?? null,
      settings, currentProjData?.createdAt,
    );
    const safeName = songTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'proyecto';
    _triggerDownload(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      safeName + '.mkproject'
    );
    const rawText = lines.map(l => l.text).join('\n');
    if (rawText.trim()) {
      _triggerDownload(
        new Blob([rawText], { type: 'text/plain;charset=utf-8' }),
        safeName + '.txt'
      );
    }
    toast(`💾 Proyecto descargado: ${safeName}.mkproject`, 'success');
  }

  /* ── Import from .mkproject file ───────────────────────── */
  async function loadProjectFromJson(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.lines || !data.version) {
        toast('Archivo no válido. Usa un archivo .mkproject.', 'error');
        return false;
      }
      currentProjData   = data;
      currentProjHandle = null;
      if (data.lines?.length) {
        Lyrics.restore(data.lines);
        const rawText = data.lines.map(l => l.text).join('\n');
        const el = document.getElementById('lyricsInput');
        if (el) el.value = rawText;
      }
      if (data.settings) _pendingSettings = { ...data.settings };
      _updateHeaderIndicator();
      toast(`Proyecto importado: ${data.songTitle || file.name}`, 'success');
      return data;
    } catch (e) {
      toast('No se pudo leer el archivo de proyecto.', 'error');
      return false;
    }
  }

  /* ── restoreFromData — called by ProjectsOverlay (server-side load) ── */
  function restoreFromData(name, data) {
    currentProjHandle = null; // no File System handle needed
    currentProjData   = data;
    if (data?.settings) _pendingSettings = { ...data.settings };
    _serverFolder = _serverFolder; // keep as-is
    _updateHeaderIndicator();
  }

  function setPendingSettings(settings) {
    _pendingSettings = { ...settings };
  }

  /* ── Public ─────────────────────────────────────────────────── */
  return {
    openFolder,
    clearFolder,
    tryRestoreFolder,
    requestStoredPermission,
    scanProjects,
    createProject,
    loadProject,
    saveCurrentProject,
    saveProjectAsDownload,
    loadProjectFromJson,
    saveVideoToProject,
    consumePendingSettings,
    setProjectChangeListener,
    restoreFromData,
    setPendingSettings,
    idbSaveProject,
    idbListProjects,
    idbLoadProject,
    idbDeleteProject,
    get hasFolder()        { return rootHandle !== null; },
    get hasPendingHandle() { return _pendingHandle !== null; },
    get rootFolderName()   { return rootHandle?.name ?? null; },
    get currentName()      { return currentProjHandle?.name ?? null; },
    get isOpen()           { return currentProjHandle !== null; },
    get serverFolder()     { return _serverFolder; },
  };

})();

export default Projects;
