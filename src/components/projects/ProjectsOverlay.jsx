import React, { useState, useEffect, useRef } from 'react';
import Projects from '../../lib/projects.js';
import { apiBrowse, apiSetFolder, apiListProjects, apiGetProject, apiAudioUrl } from '../../lib/projects-api.js';
import Lyrics from '../../lib/lyrics.js';
import { toast } from '../../lib/utils.js';

export default function ProjectsOverlay({ isOpen, onClose, loadAudioFile, goToStep, onLyricsRestore }) {
  const [folderPath, setFolderPath] = useState('');
  const [projects, setProjects]     = useState([]);
  const [isLoading, setIsLoading]   = useState(false);

  /* ── Server-side folder browser state ── */
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserPath, setBrowserPath] = useState(null);
  const [browserEntries, setBrowserEntries] = useState([]);
  const [browserParent, setBrowserParent]   = useState(null);
  const [browserLoading, setBrowserLoading] = useState(false);

  const importRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    refreshList();
  }, [isOpen]);

  async function refreshList() {
    setIsLoading(true);
    try {
      const data = await apiListProjects();
      setProjects(data.projects || []);
      // Only show folder path if user explicitly selected one
      if (data.explicit) setFolderPath(data.folder || '');
    } catch (e) {
      console.error('[Projects] refreshList error:', e);
      toast('Error al cargar proyectos.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  /* ── Browse: native OS picker first, fallback to in-app browser ── */
  async function handleBrowse() {
    try {
      const res = await fetch('/api/browse-native');
      const data = await res.json();
      if (data.ok) {
        const set = await apiSetFolder(data.path);
        setFolderPath(set.folder);
        await refreshList();
        toast('Carpeta seleccionada: ' + set.folder, 'success');
        return;
      }
      // cancelled = user closed dialog without selecting, do nothing
      if (data.error === 'cancelled') return;
      // native unavailable (non-Windows) → fallback to in-app browser
      setBrowserOpen(true);
      await browseDir(null);
    } catch (e) {
      console.error('[handleBrowse]', e);
      toast('Error al abrir el selector de carpetas.', 'error');
    }
  }

  /* ── In-app folder browser (fallback for non-Windows) ── */
  async function browseDir(dirPath) {
    setBrowserLoading(true);
    try {
      const data = await apiBrowse(dirPath);
      setBrowserPath(data.path);
      setBrowserEntries(data.entries || []);
      setBrowserParent(data.parent ?? null);
    } catch (e) {
      toast('No se pudo leer la carpeta.', 'error');
    } finally {
      setBrowserLoading(false);
    }
  }

  async function handleSelectFolder() {
    if (!browserPath) return;
    try {
      const data = await apiSetFolder(browserPath);
      setFolderPath(data.folder);
      setBrowserOpen(false);
      await refreshList();
      toast('Carpeta vinculada: ' + data.folder, 'success');
    } catch (e) {
      toast('No se pudo establecer la carpeta.', 'error');
    }
  }

  async function handleClearFolder() {
    setFolderPath('');
    setProjects([]);
  }

  async function handleLoadProject(proj) {
    onClose();
    try {
      const { data } = await apiGetProject(proj.name);
      Projects.restoreFromData(proj.name, data);
      if (data?.lines?.length) {
        Lyrics.restore(data.lines);
        const el = document.getElementById('lyricsInput');
        if (el) el.value = data.lines.map(l => l.text).join('\n');
      }
      if (proj.audioFile && typeof loadAudioFile === 'function') {
        const audioUrl = await apiAudioUrl(proj.name, proj.audioFile);
        const res = await fetch(audioUrl);
        const blob = await res.blob();
        const file = new File([blob], proj.audioFile, { type: blob.type });
        await loadAudioFile(file);
      }
      if (data?.settings) Projects.setPendingSettings(data.settings);
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

  if (!isOpen) return null;

  return (
    <div className="projects-overlay">
      <div className="projects-backdrop" onClick={onClose} />
      <div className="projects-panel">

        <div className="projects-panel-header">
          <span className="projects-panel-title">📁 Proyectos</span>
          <button className="btn btn-ghost close-panel-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── Path row ── */}
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

            {/* Browse folder button */}
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
              value={folderPath}
              placeholder="Selecciona una carpeta…"
              title={folderPath}
            />

            {folderPath && (
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
          ) : !folderPath ? (
            <div className="projects-empty">
              <span className="empty-icon">📁</span>
              <h3>Sin carpeta raíz</h3>
              <p>Usa el botón 📂 para vincular la carpeta donde están tus proyectos.</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="projects-empty">
              <span className="empty-icon">🎵</span>
              <h3>Sin proyectos</h3>
              <p>No hay proyectos aquí. Se crean automáticamente al guardar desde el Paso 2.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(proj => (
                <div key={proj.name} className="project-card" onClick={() => handleLoadProject(proj)}>
                  <span className="project-card-title">{proj.name}</span>
                  <div className="project-card-meta">
                    <span className="project-card-badge">{proj.synced}/{proj.total} frases</span>
                    {proj.audioFile && <span className="project-card-badge audio">🎵 audio</span>}
                    {proj.videoFile && <span className="project-card-badge video">🎬 video</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Server-side folder browser modal ── */}
      {browserOpen && (
        <div className="fb-overlay" onClick={e => e.target === e.currentTarget && setBrowserOpen(false)}>
          <div className="fb-modal">
            <div className="fb-header">
              <span className="fb-title">📂 Seleccionar carpeta</span>
              <button className="btn btn-ghost fb-close" onClick={() => setBrowserOpen(false)}>✕</button>
            </div>
            <div className="fb-current-path">{browserPath || 'Unidades del sistema'}</div>
            <div className="fb-list">
              {browserParent !== null && (
                <button className="fb-item fb-up" onClick={() => browseDir(browserParent)}>
                  <span className="fb-item-icon">↑</span>
                  <span className="fb-item-name">..</span>
                </button>
              )}
              {browserLoading ? (
                <div className="fb-state">Cargando…</div>
              ) : browserEntries.length === 0 ? (
                <div className="fb-state">Sin subcarpetas</div>
              ) : (
                browserEntries.map(e => (
                  <button key={e.path} className="fb-item" onClick={() => browseDir(e.path)}>
                    <span className="fb-item-icon">📁</span>
                    <span className="fb-item-name">{e.name}</span>
                  </button>
                ))
              )}
            </div>
            <div className="fb-footer">
              <button
                className="btn btn-primary"
                disabled={!browserPath}
                onClick={handleSelectFolder}
              >
                Seleccionar esta carpeta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
