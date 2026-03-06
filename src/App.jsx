import React, { useState, useEffect, useCallback } from 'react';
import Audio from './lib/audio.js';
import Lyrics from './lib/lyrics.js';
import ExportEngine from './lib/export-engine.js';
import Projects from './lib/projects.js';
import Sync from './lib/sync.js';
import Adjust from './lib/adjust.js';
import { toast } from './lib/utils.js';
import Header from './components/Header.jsx';
import Panel1Upload from './components/steps/Panel1Upload.jsx';
import Panel2Sync from './components/steps/Panel2Sync.jsx';
import Panel3Adjust from './components/steps/Panel3Adjust.jsx';
import Panel4Export from './components/steps/Panel4Export.jsx';
import ProjectsOverlay from './components/projects/ProjectsOverlay.jsx';

export default function App() {
  const [step, setStep]             = useState(1);
  const [hasAudio, setHasAudio]     = useState(false);
  const [hasLyrics, setHasLyrics]   = useState(false);
  const [projectName, setProjectName] = useState(null);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [syncDone, setSyncDone]         = useState(false);

  /* ── Boot: init ExportEngine, bridge Projects → React, restore folder ── */
  useEffect(() => {
    ExportEngine.init();
    Projects.setProjectChangeListener(name => setProjectName(name));
    Sync.setSyncProgressListener(count => setSyncDone(count > 0));
    Projects.tryRestoreFolder(); // silent background – no await needed for UI
  }, []);

  /* ── Step change → call module setup ── */
  useEffect(() => {
    if (step === 2) {
      Sync.setup();
    } else if (step === 3) {
      if (!Audio.isPlaying) Audio.seek(0);
      Adjust.setup();
    } else if (step === 4) {
      Audio.seek(0);
      const pending = Projects.consumePendingSettings();
      if (pending) ExportEngine.applySettings(pending);
      ExportEngine.setup();
    }
  }, [step]);

  /* ── Keyboard: Escape closes overlay ── */
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setProjectsOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const goToStep = useCallback(n => setStep(n), []);

  /* ── loadAudioFile: used by Panel1 and ProjectsOverlay ── */
  const loadAudioFile = useCallback(async file => {
    const statusEl = document.getElementById('audioStatus');
    const dropEl   = document.getElementById('audioDropZone');
    if (statusEl) statusEl.textContent = 'Cargando…';
    try {
      const dur = await Audio.load(file);
      setHasAudio(true);
      if (dropEl) {
        dropEl.innerHTML = `<div class="drop-success">
          <span class="drop-icon">🎵</span>
          <strong>${file.name}</strong>
          <span style="color:var(--text-dim);font-size:0.85rem">${formatDuration(dur)}</span>
        </div>`;
      }
      if (statusEl) statusEl.textContent = '';
      toast(`Audio cargado: ${file.name}`, 'success');
    } catch (err) {
      if (statusEl) statusEl.textContent = '❌ Error al cargar el audio.';
      toast('No se pudo cargar el audio.', 'error');
    }
  }, []);

  const handleSaveProject = useCallback(async () => {
    if (Projects.hasPendingHandle) {
      const ok = await Projects.requestStoredPermission();
      if (!ok) { toast('Permiso denegado para la carpeta.', 'error'); return; }
    }
    await Projects.saveCurrentProject();
  }, []);

  return (
    <>
      <Header
        step={step}
        projectName={projectName}
        onOpenProjects={() => setProjectsOpen(true)}
        onSaveProject={handleSaveProject}
      />

      <main className="app-main">
        <Panel1Upload
          isActive={step === 1}
          hasAudio={hasAudio}
          hasLyrics={hasLyrics}
          setHasLyrics={setHasLyrics}
          loadAudioFile={loadAudioFile}
          goToStep={goToStep}
        />
        <Panel2Sync
          isActive={step === 2}
          goToStep={goToStep}
          syncDone={syncDone}
        />
        <Panel3Adjust
          isActive={step === 3}
          goToStep={goToStep}
        />
        <Panel4Export
          isActive={step === 4}
          goToStep={goToStep}
        />
      </main>

      {/* Global toast container */}
      <div id="toastContainer" />

      {/* Projects overlay */}
      <ProjectsOverlay
        isOpen={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        loadAudioFile={loadAudioFile}
        goToStep={goToStep}
        onLyricsRestore={() => setHasLyrics(true)}
      />
    </>
  );
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
