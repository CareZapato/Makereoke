/* ============================================================
   lyrics.js — Lyrics parsing, storage, and sync data model (ES module)
   ============================================================ */

const Lyrics = (() => {
  let lines = [];
  let endTime = null; // null = use audio duration as display end for last line

  function parse(raw) {
    const rawLines = raw.split('\n');
    lines = rawLines.map(l => {
      const trimmed = l.trim();
      return { text: trimmed, time: null, isBlank: trimmed === '', voice: null };
    });
    while (lines.length && lines[lines.length - 1].isBlank) lines.pop();
    return lines;
  }

  function parseLRC(raw) {
    const result = [];
    const lrcRegex = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/;
    const rawLines = raw.split('\n');
    for (const l of rawLines) {
      const m = l.match(lrcRegex);
      if (m) {
        const sec = parseInt(m[1]) * 60 + parseFloat(m[2]);
        const text = m[3].trim();
        result.push({ text, time: sec, isBlank: text === '', voice: null });
      } else if (l.trim() === '') {
        result.push({ text: '', time: null, isBlank: true, voice: null });
      }
    }
    if (result.length) lines = result;
    return lines;
  }

  function autoLoad(raw) {
    if (/\[\d+:\d+/.test(raw)) return parseLRC(raw);
    return parse(raw);
  }

  function setTime(index, time) {
    if (index >= 0 && index < lines.length) lines[index].time = time;
  }

  function setVoice(index, voiceId) {
    if (index >= 0 && index < lines.length) lines[index].voice = voiceId;
  }

  function resetTimes() { lines.forEach(l => { l.time = null; l.voice = null; }); endTime = null; }

  /** Insert a new line immediately after `index` */
  function insertAfter(index, { text = '', isBlank = false, isLabel = false } = {}) {
    const trimmed = String(text).trim();
    lines.splice(index + 1, 0, {
      text:    trimmed,
      time:    null,
      isBlank: isBlank || trimmed === '',
      isLabel: Boolean(isLabel),
      voice:   null,
    });
  }

  /** Remove line at `index` */
  function removeLine(index) {
    if (index >= 0 && index < lines.length) lines.splice(index, 1);
  }

  /** Toggle `isLabel` flag on a line (un-blank it too) */
  function toggleLabel(index) {
    if (index < 0 || index >= lines.length) return;
    lines[index].isLabel = !lines[index].isLabel;
    if (lines[index].isLabel) lines[index].isBlank = false;
  }

  /** Edit the text of an existing line */
  function setLineText(index, text) {
    if (index >= 0 && index < lines.length) {
      const trimmed = String(text).trim();
      lines[index].text    = trimmed;
      lines[index].isBlank = trimmed === '';
    }
  }

  function setEndTime(t)   { endTime = t; }
  function getEndTime()    { return endTime; }
  function clearEndTime()  { endTime = null; }

  function getActiveIndex(time) {
    let active = -1;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].isBlank && lines[i].time !== null && lines[i].time <= time) active = i;
    }
    return active;
  }

  function getSyncedLines() {
    // Include blank lines that have been explicitly synced — they act as silence/pause markers
    return lines.filter(l => l.time !== null)
                .sort((a, b) => a.time - b.time);
  }

  function toLRC() {
    return lines
      .filter(l => !l.isBlank && l.time !== null)
      .sort((a, b) => a.time - b.time)
      .map(l => {
        const m = Math.floor(l.time / 60);
        const s = (l.time % 60).toFixed(2).padStart(5, '0');
        return `[${String(m).padStart(2,'0')}:${s}]${l.text}`;
      })
      .join('\n');
  }

  function restore(arr, savedEndTime = null) {
    lines = arr.map(l => ({
      text:    String(l.text ?? ''),
      time:    l.time ?? null,
      isBlank: Boolean(l.isBlank),
      isLabel: Boolean(l.isLabel),
      voice:   l.voice ?? null,
    }));
    endTime = savedEndTime ?? null;
  }

  function syncedCount()  { return lines.filter(l => !l.isBlank && l.time !== null).length; }
  function lyricsCount()  { return lines.filter(l => !l.isBlank).length; }

  return {
    parse, parseLRC, autoLoad, restore, setTime, setVoice, resetTimes,
    insertAfter, removeLine, toggleLabel, setLineText,
    setEndTime, getEndTime, clearEndTime,
    getActiveIndex, getSyncedLines, toLRC, syncedCount, lyricsCount,
    get lines() { return lines; },
  };
})();

export default Lyrics;
