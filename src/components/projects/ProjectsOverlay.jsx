import React, { useState, useEffect } from 'react';
import Projects from '../../lib/projects.js';
import { toast } from '../../lib/utils.js';

export default function ProjectsOverlay({ isOpen, onClose, loadAudioFile, goToStep, onLyricsRestore }) {
  const [folderName, setFolderName]   = useState(Projects.rootFolderName);
  const [projects, setProjects]       = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [newName, setNewName]         = useState('');

  /* ── Load projects when overlay opens ── */
  useEffect(() => {
    if (!isOpen) return;
    setFolderName(Projects.rootFolderName);
    if (Projects.hasFolder) {
      refreshList();
    }
    // If there's a pending handle, prompt for permission on open
    if (Projects.hasPendingHandle) {
      Projects.requestStoredPermission().then(ok => {
        if (ok) {
          setFolderName(Projects.rootFolderName);
          refreshList();
        }
      });
    }
  }, [isOpen]);

  async function refreshList() {
    setIsLoading(true);
    const list = await Projects.scanProjects();
    setProjects(list || []);
    setFolderName(Projects.rootFolderName);
    setIsLoading(false);
  }

  async function handleOpenFolder() {
    const list = await Projects.openFolder();
    if (list !== null) {
      setProjects(list);
      setFolderName(Projects.rootFolderName);
      toast('Carpeta vinculada correctamente.', 'success');
    }
  }

  async function handleLoadProject(proj) {
    onClose();
    const data = await Projects.loadProject(proj.handle, loadAudioFile);
    if (data) {
      onLyricsRestore();
      goToStep(1);
      toast(`Proyecto cargado: ${proj.name}`, 'success');
    }
  }

  async function handleCreateProject() {
    if (!newName.trim()) return;
    const proj = await Projects.createProject(newName.trim());
    setShowModal(false);
    setNewName('');
    if (proj) {
      toast(`Proyecto creado: ${proj.name}`, 'success');
      await refreshList();
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="projects-overlay">
        <div className="projects-backdrop" onClick={onClose} />

        <div className="projects-panel">
          <div className="projects-panel-header">
            <span className="projects-panel-title">📁 Proyectos</span>
            <button className="btn btn-ghost close-panel-btn" onClick={onClose}>✕</button>
          </div>

          <div className="projects-toolbar">
            <div className="folder-info">
              <span className="folder-icon">📂</span>
              <span className={`folder-name${folderName ? ' has-folder' : ''}`}>
                {folderName || 'Sin carpeta seleccionada'}
              </span>
            </div>
            <div className="projects-actions">
              <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={handleOpenFolder}>
                {folderName ? 'Cambiar carpeta' : '📂 Seleccionar carpeta'}
              </button>
              {folderName && (
                <>
                  <button className="btn btn-ghost" style={{ fontSize: '0.82rem' }} onClick={refreshList}>
                    🔄 Actualizar
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => setShowModal(true)}>
                    ➕ Nuevo proyecto
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="projects-body">
            {isLoading ? (
              <div className="projects-empty">
                <span className="empty-icon">⏳</span>
                <p>Cargando proyectos…</p>
              </div>
            ) : !folderName ? (
              <div className="projects-empty">
                <span className="empty-icon">📁</span>
                <h3>Sin carpeta raíz</h3>
                <p>Selecciona una carpeta para guardar y cargar tus proyectos de karaoke.</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="projects-empty">
                <span className="empty-icon">🎵</span>
                <h3>Sin proyectos</h3>
                <p>No hay proyectos en esta carpeta. Crea uno nuevo para empezar.</p>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map(proj => (
                  <div key={proj.name} className="project-card" onClick={() => handleLoadProject(proj)}>
                    <span className="project-card-title">{proj.name}</span>
                    <div className="project-card-meta">
                      <span className="project-card-badge">{proj.synced}/{proj.total} frases</span>
                      {proj.audioFile && <span className="project-card-badge">🎵 audio</span>}
                      {proj.videoFile && (
                        <span className="project-card-badge" style={{ color: 'var(--success)' }}>🎬 video</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New project modal */}
      {showModal && (
        <div className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setNewName(''); } }}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Nuevo proyecto</h3>
              <button className="btn btn-ghost close-panel-btn"
                onClick={() => { setShowModal(false); setNewName(''); }}>✕</button>
            </div>
            <label className="field-label">Nombre del proyecto (= nombre de la carpeta)</label>
            <input
              type="text"
              className="field-input"
              style={{ width: '100%' }}
              placeholder="Artista - Canción"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateProject(); }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setShowModal(false); setNewName(''); }}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreateProject} disabled={!newName.trim()}>
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
