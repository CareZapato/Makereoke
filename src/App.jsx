import React, { useState, useEffect, useCallback, useRef } from 'react';
import Audio from './lib/audio.js';
import Lyrics from './lib/lyrics.js';
import ExportEngine from './lib/export-engine.js';
import Sync from './lib/sync.js';
import Adjust from './lib/adjust.js';
import Intro from './lib/intro.js';
import Outro from './lib/outro.js';
import { toast } from './lib/utils.js';
import Header from './components/Header.jsx';
import Panel1Upload from './components/steps/Panel1Upload.jsx';
import Panel2Sync from './components/steps/Panel2Sync.jsx';
import Panel3Adjust from './components/steps/Panel3Adjust.jsx';
import Panel4Export from './components/steps/Panel4Export.jsx';
import ChangelogModal from './components/ChangelogModal.jsx';

export default function App() {
  const [step, setStep]             = useState(1);
  const [hasAudio, setHasAudio]     = useState(false);
  const [hasLyrics, setHasLyrics]   = useState(false);
  const [syncDone, setSyncDone]     = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const pendingSettingsRef = useRef(null);

  /* ── Boot ── */
  useEffect(() => {
    ExportEngine.init();
    Sync.setSyncProgressListener(count => setSyncDone(count > 0));
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
      ExportEngine.setup();
      // If restoring a session, apply saved settings after setup() completes
      if (pendingSettingsRef.current) {
        const s = pendingSettingsRef.current;
        pendingSettingsRef.current = null;
        requestAnimationFrame(() => ExportEngine.applySettings(s));
      }
    }
  }, [step]);

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

  /* ── loadSession: restore a saved .mkrk session file ── */
  const loadSession = useCallback(async file => {
    try {
      const text = await file.text();
      const pkg  = JSON.parse(text);
      if (!pkg.audioB64 || !pkg.lines) throw new Error('Archivo .mkrk inválido');

      // Reconstruct audio File from base64
      const binaryStr = atob(pkg.audioB64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const audioBlob = new Blob([bytes], { type: pkg.audioMime || 'audio/mpeg' });
      const audioFile = new File([audioBlob], pkg.audioFileName || 'audio', { type: pkg.audioMime || 'audio/mpeg' });

      // Load audio
      const dur = await Audio.load(audioFile);
      setHasAudio(true);
      const dropEl = document.getElementById('audioDropZone');
      if (dropEl) {
        dropEl.innerHTML = `<div class="drop-success">
          <span class="drop-icon">🎵</span>
          <strong>${audioFile.name}</strong>
          <span style="color:var(--text-dim);font-size:0.85rem">${formatDuration(dur)}</span>
        </div>`;
      }

      // Restore lyrics
      Lyrics.restore(pkg.lines, pkg.endTime ?? null);
      setHasLyrics(Lyrics.lyricsCount() > 0);
      setSyncDone(Lyrics.syncedCount() > 0);

      // Restore intro / outro
      if (pkg.intro) Intro.set(pkg.intro);
      if (pkg.outro) Outro.set(pkg.outro);

      // Restore project name
      if (pkg.projectName) {
        const nameInput = document.getElementById('songTitleInput');
        if (nameInput) nameInput.value = pkg.projectName;
      }

      // Store settings so the step-4 useEffect can apply them after setup()
      if (pkg.settings) pendingSettingsRef.current = pkg.settings;

      toast('Sesión cargada. Abriendo paso 4…', 'success');
      setStep(4);
    } catch (err) {
      console.error('[App] loadSession error:', err);
      toast('No se pudo cargar la sesión: ' + err.message, 'error');
    }
  }, []);

  return (
    <>
      <Header step={step} onShowChangelog={() => setShowChangelog(true)} />

      <main className="app-main">
        <Panel1Upload
          isActive={step === 1}
          hasAudio={hasAudio}
          hasLyrics={hasLyrics}
          setHasLyrics={setHasLyrics}
          loadAudioFile={loadAudioFile}
          loadSession={loadSession}
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

      {/* Changelog overlay */}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </>
  );
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
