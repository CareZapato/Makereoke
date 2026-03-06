/* ============================================================
   audio.js — Audio engine using Web Audio API
   ============================================================ */

const Audio = (() => {
  let audioCtx = null;
  let audioBuffer = null;
  let sourceNode = null;
  let gainNode = null;
  let rawFile = null;

  let isPlaying = false;
  let startedAt = 0;    // audioCtx.currentTime when play started
  let pausedAt = 0;     // seconds into song when paused
  let duration = 0;

  let onTimeUpdate = null;
  let onEnded = null;
  let rafId = null;

  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  async function load(file) {
    rawFile = file;
    const ctx = getCtx();
    const buffer = await readFileAsArrayBuffer(file);
    audioBuffer = await ctx.decodeAudioData(buffer);
    duration = audioBuffer.duration;
    pausedAt = 0;
    isPlaying = false;

    // Create persistent gain node so recording dest can be connected at any time
    if (gainNode) gainNode.disconnect();
    gainNode = ctx.createGain();
    gainNode.gain.value = _volume;
    gainNode.connect(ctx.destination);

    return duration;
  }

  function play(from) {
    if (!audioBuffer) return;
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    if (sourceNode) { sourceNode.disconnect(); sourceNode = null; }

    // gainNode is persistent — already connected to destination
    if (!gainNode) {
      gainNode = ctx.createGain();
      gainNode.gain.value = _volume;
      gainNode.connect(ctx.destination);
    }

    sourceNode = ctx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(gainNode);

    const offset = (from !== undefined) ? clamp(from, 0, duration) : pausedAt;
    pausedAt = offset;
    startedAt = ctx.currentTime - offset;
    sourceNode.start(0, offset);
    isPlaying = true;

    sourceNode.onended = () => {
      if (isPlaying) {
        isPlaying = false;
        pausedAt = 0;
        if (onEnded) onEnded();
      }
    };

    _scheduleRaf();
  }

  function pause() {
    if (!isPlaying) return;
    pausedAt = getCurrentTime();
    sourceNode.stop();
    sourceNode = null;
    isPlaying = false;
    cancelAnimationFrame(rafId);
  }

  function stop() {
    if (sourceNode) { try { sourceNode.stop(); } catch(e){} sourceNode = null; }
    isPlaying = false;
    pausedAt = 0;
    cancelAnimationFrame(rafId);
  }

  function toggle() {
    if (isPlaying) pause(); else play();
  }

  function seek(secs) {
    const wasPlaying = isPlaying;
    if (wasPlaying) { if (sourceNode) { try { sourceNode.stop(); } catch(e){} sourceNode = null; } isPlaying = false; }
    pausedAt = clamp(secs, 0, duration);
    if (wasPlaying) play(pausedAt);
  }

  function getCurrentTime() {
    if (isPlaying) return clamp(audioCtx.currentTime - startedAt, 0, duration);
    return pausedAt;
  }

  let _volume = 1;
  function setVolume(v) {
    _volume = clamp(v, 0, 1);
    if (gainNode) gainNode.gain.value = _volume;
  }

  function _scheduleRaf() {
    cancelAnimationFrame(rafId);
    function loop() {
      if (isPlaying && onTimeUpdate) onTimeUpdate(getCurrentTime());
      if (isPlaying) rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  /** Get the raw PCM channel data for waveform drawing */
  function getChannelData() {
    if (!audioBuffer) return null;
    return audioBuffer.getChannelData(0);
  }

  /** Create a MediaStreamDestination for recording.
   *  Connects the SAME gainNode so audio is recorded in sync.
   *  Returns { stream, stop } — call stop() after recording to disconnect.
   */
  function createRecordingStream() {
    const ctx = getCtx();
    const dest = ctx.createMediaStreamDestination();
    if (gainNode) gainNode.connect(dest);
    return {
      stream: dest.stream,
      stop: () => { try { gainNode.disconnect(dest); } catch(e){} }
    };
  }

  return {
    load, play, pause, stop, toggle, seek, setVolume, getCurrentTime,
    getChannelData, createRecordingStream,
    get duration() { return duration; },
    get isPlaying() { return isPlaying; },
    get rawFile() { return rawFile; },
    set onTimeUpdate(fn) { onTimeUpdate = fn; },
    set onEnded(fn) { onEnded = fn; },
  };
})();
