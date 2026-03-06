import React, { useRef } from 'react';
import Lyrics from '../../lib/lyrics.js';
import { toast } from '../../lib/utils.js';

export default function Panel1Upload({ isActive, hasAudio, hasLyrics, setHasLyrics, loadAudioFile, goToStep }) {
  const fileInputRef = useRef(null);
  const canGoToSync = hasAudio && hasLyrics;

  /* ── Audio drop zone ── */
  function onDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name)) {
      loadAudioFile(file);
    } else {
      toast('Formato no soportado. Usa MP3, WAV, OGG, M4A, AAC o FLAC.', 'error');
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  function onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function onFileChange(e) {
    const file = e.target.files[0];
    if (file) loadAudioFile(file);
  }

  /* ── Lyrics ── */
  function onLyricsChange(e) {
    const text = e.target.value;
    if (text.trim()) {
      Lyrics.parse(text);
      setHasLyrics(Lyrics.lyricsCount() > 0);
    } else {
      setHasLyrics(false);
    }
  }

  function onLoadLrc() {
    const textarea = document.getElementById('lyricsInput');
    if (!textarea) return;
    const result = Lyrics.autoLoad(textarea.value);
    if (result) {
      setHasLyrics(true);
      toast('LRC cargado con marcas de tiempo.', 'success');
    } else {
      toast('No se detectó formato LRC válido.', 'warn');
    }
  }

  return (
    <section id="panel1" className={`step-panel${isActive ? ' active' : ''}`}>
      <h2 className="panel-title">🎵 Carga tu canción</h2>
      <p className="panel-subtitle">Sube un archivo de audio y escribe o pega la letra.</p>

      <div className="upload-grid">
        {/* Audio upload card */}
        <div
          id="audioDropZone"
          className="upload-card"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="upload-icon">🎵</span>
          <h3>🎧 Audio</h3>
          <p>Arrastra tu MP3 / WAV / OGG aquí<br/>o haz clic para seleccionar</p>
          <p className="file-formats">MP3 · WAV · OGG · M4A · AAC · FLAC</p>
          <p id="audioStatus" className="upload-status" />
          <input
            ref={fileInputRef}
            id="audioFileInput"
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,.aac,.flac"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
        </div>

        {/* Lyrics card */}
        <div className="upload-card lyrics-card" onClick={e => e.stopPropagation()}>
          <h3>📝 Letra</h3>
          <p>Una frase por línea, o pega un LRC con tiempos.</p>
          <textarea
            id="lyricsInput"
            placeholder="Pega aquí la letra de la canción (una frase por línea).

También puedes pegar un archivo .lrc con marcas de tiempo."
            onChange={onLyricsChange}
          />
          <div className="lyrics-actions">
            <button id="loadLyricsBtn" className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={onLoadLrc}>
              🎵 Importar LRC
            </button>
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <button
          id="goToSyncBtn"
          className="btn btn-primary"
          disabled={!canGoToSync}
          onClick={() => goToStep(2)}
        >
          Sincronizar →
        </button>
      </div>
    </section>
  );
}
