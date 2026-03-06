import React, { useState, useEffect } from 'react';
import Projects from '../../lib/projects.js';
import { toast } from '../../lib/utils.js';

export default function ProjectsOverlay({ isOpen, onClose, loadAudioFile, goToStep, onLyricsRestore }) {
  const [folderPath, setFolderPath] = useState('');
  const [projects, setProjects]     = useState([]);
  const [isLoading, setIsLoading]   = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFolderPath(Projects.rootFolderName ?? '');
    if (Projects.isServerMode) {
      refreshList();
    } else if (Projects.hasFolder) {
      refreshList();
    } else if (Projects.hasPendingHandle) {
      Projects.requestStoredPermission().then(ok => {
        if (ok) { setFolderPath(Projects.rootFolderName ?? ''); refreshList(); }
      });
    }
  }, [isOpen]);

  async function refreshList() {
    setIsLoading(true);
    const list = await Projects.scanProjects();
    setProjects(list || []);
    setFolderPath(Projects.rootFolderName ?? '');
    setIsLoading(false);
  }

  async function handleBrowse() {
    if (Projects.isServerMode) return;
    const list = await Projects.openFolder();
    if (list !== null) {
      setProjects(list);
      setFolderPath(Projects.rootFolderName ?? '');
      toast('Carpeta vinculada.', 'success');
    }
  }

  async function handleLoadProject(proj) {
    onClose();
    const data = await Projects.loadProject(proj, loadAudioFile);
    if (data) {
      onLyricsRestore();
      goToStep(1);
      toast(`Proyecto cargado: ${proj.name}`, 'success');
    }
  }

  if (!isOpen) return null;

  const canBrowse = !Projects.isServerMode;

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
            <input
              type="text"
              className="path-input"
              readOnly
              value={folderPath}
              placeholder={canBrowse ? 'Selecciona una carpeta…' : 'Cargando ruta del servidor…'}
              title={folderPath}
            />
            {canBrowse && (
              <button
                className="path-btn-icon"
                title="Seleccionar carpeta"
                onClick={handleBrowse}
              >
                {/* folder open icon */}
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                </svg>
              </button>
            )}
            <button
              className="path-btn-icon"
              title="Actualizar lista"
              onClick={refreshList}
              disabled={isLoading}
            >
              {/* refresh icon */}
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
              <p>Usa el botón 📂 para vincular la carpeta donde se guardan tus proyectos.</p>
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
    </div>
  );
}
