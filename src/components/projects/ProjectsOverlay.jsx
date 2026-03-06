import React, { useState, useEffect, useRef } from 'react';
import Projects from '../../lib/projects.js';
import Lyrics from '../../lib/lyrics.js';
import { toast } from '../../lib/utils.js';

/*
  Storage strategy:
  ─ isSecureContext (localhost / HTTPS) → File System Access API
    The browser opens a real folder picker; files are written to disk.
  ─ HTTP over LAN (isSecureContext = false) → two sources:
    • <input webkitdirectory> to READ existing projects from a folder on the
      client’s disk (read-only from the browser’s perspective)
    • IndexedDB for projects SAVED from within the app (write)
    Videos are always auto-downloaded.
*/

export default function ProjectsOverlay({ isOpen, onClose, loadAudioFile, goToStep, onLyricsRestore }) {
  const [folderName, setFolderName] = useState('');
  const [projects, setProjects]     = useState([]);
  const [isLoading, setIsLoading]   = useState(false);

  // Disk projects loaded via <input webkitdirectory> (HTTP LAN mode)
  const [diskProjects, setDiskProjects]   = useState([]);
  const [diskFolderName, setDiskFolderName] = useState('');
  const [diskFilesMap, setDiskFilesMap]   = useState({});

  // Pending folder handle: saved in IDB but needs permission re-grant
  const [hasPending, setHasPending]   = useState(false);
  const [pendingName, setPendingName] = useState('');

  // File System Access API is only available in a secure context (localhost / HTTPS)
  const canUseFileSystem = typeof window !== 'undefined'
    && window.isSecureContext
    && typeof window.showDirectoryPicker === 'function';

  const importRef = useRef(null);
  const folderRef = useRef(null); // webkitdirectory input for HTTP LAN

  useEffect(() => {
    if (!isOpen) return;
    refreshList();
  }, [isOpen]);

  async function refreshList() {
    setIsLoading(true);
    try {
      if (canUseFileSystem) {
        // Try to silently restore workspace handle saved in a previous session
        if (!Projects.hasFolder && !Projects.hasPendingHandle) {
          await Projects.tryRestoreFolder();
        }
        if (Projects.hasFolder) {
          setHasPending(false);
          const list = await Projects.scanProjects();
          setProjects(list);
          setFolderName(Projects.rootFolderName ?? '');
        } else if (Projects.hasPendingHandle) {
          setHasPending(true);
          setPendingName(Projects.pendingFolderName ?? 'carpeta guardada');
          setProjects([]);
          setFolderName('');
        } else {
          setHasPending(false);
          setProjects([]);
          setFolderName('');
        }
      } else {
        // IndexedDB mode — list projects saved from within this browser
        const idbList = await Projects.idbListProjects();
        // Merge with disk projects already loaded this session
        const combined = [
          ...diskProjects.map(p => ({ ...p, source: 'disk' })),
          ...idbList.map(p => ({ ...p, source: 'idb' })),
        ];
        setProjects(combined);
      }
    } catch (e) {
      console.error('[Projects] refreshList error:', e);
      toast('Error al cargar proyectos.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // Secure context: open native folder picker (or reconnect stored handle)
  async function handleBrowse() {
    // If a handle was stored but lost permission, try to re-request it first
    if (Projects.hasPendingHandle) {
      const ok = await Projects.requestStoredPermission();
      if (ok) {
        setHasPending(false);
        setFolderName(Projects.rootFolderName ?? '');
        const list = await Projects.scanProjects();
        setProjects(list);
        return;
      }
      // Permission still denied — fall through to open a new picker
    }
    const result = await Projects.openFolder();
    if (result !== null) {
      setHasPending(false);
      setFolderName(Projects.rootFolderName ?? '');
      setProjects(result);
    }
  }

  async function handleClearFolder() {
    await Projects.clearFolder();
    setFolderName('');
    setProjects([]);
  }

  // HTTP LAN: user selected a folder via <input webkitdirectory>
  async function handleFolderSelect(e) {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) {
      toast('No se leyeron archivos. Selecciona la carpeta de workspace (que contiene subcarpetas de proyectos).', 'warn');
      return;
    }

    setIsLoading(true);
    try {
      // folder name = first path segment of webkitRelativePath
      const rootFolder = files[0].webkitRelativePath.split('/')[0];
      setDiskFolderName(rootFolder);

      // Detect structure: depth-2 = user selected a project folder directly;
      //                   depth-3+ = user selected the workspace root folder
      const maxDepth = Math.max(...files.map(f => f.webkitRelativePath.split('/').length));
      const byProject = {};

      if (maxDepth <= 2) {
        // User opened the project subfolder itself — treat it as a single project
        const projName = rootFolder;
        byProject[projName] = {};
        for (const file of files) {
          const fileName = file.name;
          if (fileName === 'project.json') byProject[projName].jsonFile = file;
          else if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileName)) {
            if (!byProject[projName].audioFile) byProject[projName].audioFile = file;
          }
        }
      } else {
        // User opened the workspace root — subfolders are individual projects
        for (const file of files) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length < 3) continue;
          const projName = parts[1];
          if (!byProject[projName]) byProject[projName] = {};
          const fileName = parts[parts.length - 1];
          if (fileName === 'project.json') byProject[projName].jsonFile = file;
          else if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileName)) {
            if (!byProject[projName].audioFile) byProject[projName].audioFile = file;
          }
        }
      }

      // Parse each project.json
      const parsed = [];
      const filesMap = {};
      for (const [name, fileSet] of Object.entries(byProject)) {
        if (!fileSet.jsonFile) continue;
        try {
          const data   = JSON.parse(await fileSet.jsonFile.text());
          const synced = data?.lines?.filter(l => !l.isBlank && l.time !== null).length ?? 0;
          const total  = data?.lines?.filter(l => !l.isBlank).length ?? 0;
          parsed.push({
            name, data, source: 'disk',
            audioFile: fileSet.audioFile?.name ?? null,
            videoFile: null, synced, total,
          });
          filesMap[name] = fileSet;
        } catch { /* skip corrupt project.json */ }
      }
      parsed.sort((a, b) => (a.data?.updatedAt ?? '0') < (b.data?.updatedAt ?? '0') ? 1 : -1);

      setDiskProjects(parsed);
      setDiskFilesMap(filesMap);

      // Merge with IDB projects
      const idbList = await Projects.idbListProjects();
      setProjects([
        ...parsed,
        ...idbList.map(p => ({ ...p, source: 'idb' })),
      ]);

      if (parsed.length === 0) {
        toast(`No se encontraron proyectos en "${rootFolder}". ¿Abriste la carpeta correcta?`, 'warn');
      } else {
        toast(`${parsed.length} proyecto(s) cargado(s) desde "${rootFolder}"`, 'success');
      }
    } catch (e) {
      toast('No se pudo leer la carpeta.', 'error');
      console.error('[handleFolderSelect]', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoadProject(proj) {
    onClose();
    try {
      if (canUseFileSystem) {
        // File System API: reads files directly from disk
        const data = await Projects.loadProject(proj, loadAudioFile);
        if (!data) return;
        if (data.lines?.length) {
          const el = document.getElementById('lyricsInput');
          if (el) el.value = data.lines.map(l => l.text).join('\n');
        }
      } else if (proj.source === 'disk') {
        // Loaded from disk via webkitdirectory
        const fileSet = diskFilesMap[proj.name];
        Projects.restoreFromData(proj.name, proj.data);
        if (proj.data?.lines?.length) {
          Lyrics.restore(proj.data.lines);
          const el = document.getElementById('lyricsInput');
          if (el) el.value = proj.data.lines.map(l => l.text).join('\n');
        }
        if (fileSet?.audioFile && typeof loadAudioFile === 'function') {
          await loadAudioFile(fileSet.audioFile);
        }
        if (proj.data?.settings) Projects.setPendingSettings(proj.data.settings);
      } else {
        // IndexedDB: restore project.json + audio Blob stored in browser
        const entry = await Projects.idbLoadProject(proj.name);
        if (!entry) { toast('No se pudo cargar el proyecto.', 'error'); return; }
        Projects.restoreFromData(proj.name, entry.data);
        if (entry.data?.lines?.length) {
          Lyrics.restore(entry.data.lines);
          const el = document.getElementById('lyricsInput');
          if (el) el.value = entry.data.lines.map(l => l.text).join('\n');
        }
        if (entry.audioBlob && typeof loadAudioFile === 'function') {
          const mimeType = entry.audioBlob.type || 'audio/mpeg';
          const file = new File([entry.audioBlob], entry.audioName || 'audio.mp3', { type: mimeType });
          await loadAudioFile(file);
        }
        if (entry.data?.settings) Projects.setPendingSettings(entry.data.settings);
      }

      onLyricsRestore();
      goToStep(1);
      toast(`Proyecto cargado: ${proj.name}`, 'success');
    } catch (e) {
      console.error('[Projects] load error:', e);
      toast('Error al cargar el proyecto.', 'error');
    }
  }

  async function handleImportProject(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    onClose();
    const data = await Projects.loadProjectFromJson(file);
    if (data) {
      onLyricsRestore();
      goToStep(1);
    }
  }

  function handleNewProject() {
    Projects.clearCurrentProject();
    onClose();
    goToStep(1);
  }

  if (!isOpen) return null;

  return (
    <div className="projects-overlay">
      <div className="projects-backdrop" onClick={onClose} />
      <div className="projects-panel">

        <div className="projects-panel-header">
          <span className="projects-panel-title">📁 Proyectos</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleNewProject}
            title="Empezar un proyecto nuevo (mantiene la carpeta de workspace)"
          >
            ➕ Nuevo proyecto
          </button>
          <button className="btn btn-ghost close-panel-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── Toolbar ── */}
        <div className="projects-toolbar">
          <div className="path-input-wrap">

            {/* Import .mkproject button */}
            <button
              className="path-btn-icon"
              title="Importar proyecto (.mkproject)"
              onClick={() => importRef.current?.click()}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </button>
            <input ref={importRef} type="file" accept=".mkproject" style={{ display: 'none' }} onChange={handleImportProject} />

            {/* Folder picker (hidden input for webkitdirectory in LAN mode) */}
            <input
              ref={folderRef}
              type="file"
              // @ts-ignore
              webkitdirectory="true"
              multiple
              style={{ display: 'none' }}
              onChange={handleFolderSelect}
            />

            {canUseFileSystem ? (
              <>
                {/* Folder picker button — secure context (File System Access API) */}
                <button
                  className="path-btn-icon path-btn-browse"
                  title="Seleccionar carpeta de proyectos"
                  onClick={handleBrowse}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                  </svg>
                </button>

                <input
                  type="text"
                  className="path-input"
                  readOnly
                  value={
                    hasPending
                      ? `📁 ${pendingName} — clic para reconectar`
                      : folderName
                        ? `📁 ${folderName}${projects.length > 0 ? `  (${projects.length} proyecto${projects.length !== 1 ? 's' : ''})` : ''}`
                        : ''
                  }
                  placeholder="Selecciona carpeta de workspace…"
                  title={
                    hasPending
                      ? 'Haz clic en el botón 📂 para reconectar el acceso'
                      : folderName
                        ? `Workspace: ${folderName}\n⚠️ El navegador solo muestra el nombre de carpeta (no la ruta completa) por seguridad.`
                        : 'Haz clic en 📂 para seleccionar la carpeta donde guardarás tus proyectos'
                  }
                  style={hasPending ? { color: 'var(--text-dim)', fontStyle: 'italic' } : {}}
                />

                {folderName && (
                  <button
                    className="path-btn-icon path-btn-clear"
                    title="Limpiar ruta"
                    onClick={handleClearFolder}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Folder picker via <input webkitdirectory> — HTTP LAN mode */}
                <button
                  className="path-btn-icon path-btn-browse"
                  title="Abrir carpeta de proyectos desde este equipo"
                  onClick={() => folderRef.current?.click()}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                  </svg>
                </button>
                <input
                  type="text"
                  className="path-input"
                  readOnly
                  value={diskFolderName}
                  placeholder="Abrir carpeta de proyectos…"
                  title={diskFolderName}
                />
              </>
            )}

            <button
              className="path-btn-icon"
              title="Actualizar lista"
              onClick={refreshList}
              disabled={isLoading}
            >
              <svg
                viewBox="0 0 20 20" fill="currentColor" width="16" height="16"
                style={isLoading ? { animation: 'spin 0.8s linear infinite' } : {}}
              >
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Project list ── */}
        <div className="projects-body">
          {isLoading ? (
            <div className="projects-empty">
              <span className="empty-icon">⏳</span>
              <p>Cargando proyectos…</p>
            </div>
          ) : canUseFileSystem && !folderName && hasPending ? (
            <div className="projects-empty">
              <span className="empty-icon">🔑</span>
              <h3>Acceso pendiente</h3>
              <p>Carpeta guardada: <strong>{pendingName}</strong><br/>
                Haz clic en el botón 📂 para reconectar el acceso al workspace.</p>
            </div>
          ) : canUseFileSystem && !folderName ? (
            <div className="projects-empty">
              <span className="empty-icon">📁</span>
              <h3>Define tu workspace</h3>
              <p>
                Haz clic en 📂 para seleccionar la carpeta donde se guardarán todos tus proyectos.<br/>
                <small style={{color:'var(--text-dim)'}}>Se recordará entre sesiones. Cada canción es una subcarpeta dentro de ella.</small>
              </p>
            </div>
          ) : !canUseFileSystem && projects.length === 0 ? (
            <div className="projects-empty">
              <span className="empty-icon">📁</span>
              <h3>Sin proyectos</h3>
              <p>
                Haz clic en 📂 para leer proyectos desde tu disco (esta sesión).<br/>
                O guarda uno nuevo desde el Paso 2.<br/>
                <small style={{color:'var(--text-dim)'}}>En modo LAN los proyectos se guardan en este navegador. Para acceder a carpetas del sistema, abre la app desde <strong>localhost</strong>.</small>
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="projects-empty">
              <span className="empty-icon">🎵</span>
              <h3>Sin proyectos</h3>
              <p>No hay proyectos en esta carpeta. Se crean al guardar desde el Paso 2.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(proj => (
                <div key={`${proj.source ?? ''}:${proj.name}`} className="project-card" onClick={() => handleLoadProject(proj)}>
                  <span className="project-card-title">{proj.name}</span>
                  <div className="project-card-meta">
                    <span className="project-card-badge">{proj.synced}/{proj.total} frases</span>
                    {proj.audioFile && <span className="project-card-badge audio">🎵 audio</span>}
                    {proj.videoFile && <span className="project-card-badge video">🎬 video</span>}
                    {proj.source === 'idb'  && <span className="project-card-badge idb">💾 local</span>}
                    {proj.source === 'disk' && <span className="project-card-badge disk">📁 disco</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

