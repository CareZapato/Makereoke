/* ============================================================
   audio.js — Audio engine using Web Audio API (ES module)
   ============================================================ */
import { readFileAsArrayBuffer, clamp } from './utils.js';

const Audio = (() => {
  let audioCtx = null;
  let audioBuffer = null;
  let sourceNode = null;
  let gainNode = null;
  let rawFile = null;

  let isPlaying = false;
  let startedAt = 0;
  let pausedAt = 0;
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
    startedAt = ctx.currentTime;  // wall-clock time at play start
    sourceNode.playbackRate.value = _playbackRate;
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
    cancelAnimationFrame(rafId);
    const elapsed = audioCtx.currentTime - startedAt;
    pausedAt = clamp(pausedAt + elapsed * _playbackRate, 0, duration);
    if (sourceNode) { try { sourceNode.stop(); } catch (e) {} sourceNode = null; }
    isPlaying = false;
  }

  function stop() {
    pause();
    pausedAt = 0;
  }

  function toggle() {
    if (isPlaying) pause(); else play(pausedAt);
  }

  function seek(secs) {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      if (sourceNode) {
        sourceNode.onended = null; // prevent stale callback from resetting state after restart
        try { sourceNode.stop(); } catch(e){}
        sourceNode = null;
      }
      isPlaying = false;
    }
    pausedAt = clamp(secs, 0, duration);
    if (wasPlaying) play(pausedAt);
    else if (onTimeUpdate) onTimeUpdate(pausedAt); // update playhead/time even when paused
  }

  function getCurrentTime() {
    if (isPlaying) {
      const elapsed = audioCtx.currentTime - startedAt;
      return clamp(pausedAt + elapsed * _playbackRate, 0, duration);
    }
    return pausedAt;
  }

  let _volume = 1;
  function setVolume(v) {
    _volume = clamp(v, 0, 1);
    if (gainNode) gainNode.gain.value = _volume;
  }

  let _playbackRate = 1;
  function setPlaybackRate(r) {
    _playbackRate = clamp(r, 0.1, 4);
    if (isPlaying) {
      // Seamlessly restart at current position with new rate
      const current = getCurrentTime();
      if (sourceNode) { sourceNode.onended = null; try { sourceNode.stop(); } catch(e){} sourceNode = null; }
      isPlaying = false;
      play(current);
    }
  }

  function _scheduleRaf() {
    cancelAnimationFrame(rafId);
    function loop() {
      if (isPlaying && onTimeUpdate) onTimeUpdate(getCurrentTime());
      if (isPlaying) rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  function getChannelData() {
    if (!audioBuffer) return null;
    return audioBuffer.getChannelData(0);
  }

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
    load, play, pause, stop, toggle, seek, setVolume, setPlaybackRate, getCurrentTime,
    getChannelData, createRecordingStream,
    get duration()   { return duration; },
    get isPlaying()  { return isPlaying; },
    get rawFile()    { return rawFile; },
    get volume()     { return _volume; },
    set onTimeUpdate(fn) { onTimeUpdate = fn; },
    set onEnded(fn)      { onEnded = fn; },
  };
})();

export default Audio;
