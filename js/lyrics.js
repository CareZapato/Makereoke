/* ============================================================
   lyrics.js — Lyrics parsing, storage, and sync data model
   ============================================================ */

const Lyrics = (() => {

  /**
   * Each entry: { text: string, time: number|null, isBlank: boolean }
   *   isBlank = true → empty line / separator between stanzas
   */
  let lines = [];

  /** Parse raw text into lines array */
  function parse(raw) {
    const rawLines = raw.split('\n');
    lines = rawLines.map(l => {
      const trimmed = l.trim();
      return {
        text: trimmed,
        time: null,
        isBlank: trimmed === '',
      };
    });
    // Remove trailing blank lines
    while (lines.length && lines[lines.length - 1].isBlank) lines.pop();
    return lines;
  }

  /** Parse LRC format: [mm:ss.xx] text */
  function parseLRC(raw) {
    const result = [];
    const lrcRegex = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/;
    const rawLines = raw.split('\n');

    for (const l of rawLines) {
      const m = l.match(lrcRegex);
      if (m) {
        const sec = parseInt(m[1]) * 60 + parseFloat(m[2]);
        const text = m[3].trim();
        result.push({ text, time: sec, isBlank: text === '' });
      } else if (l.trim() === '') {
        result.push({ text: '', time: null, isBlank: true });
      }
    }
    if (result.length) lines = result;
    return lines;
  }

  /** Try to auto-detect format and parse */
  function autoLoad(raw) {
    if (/\[\d+:\d+/.test(raw)) return parseLRC(raw);
    return parse(raw);
  }

  /** Set timestamp for a line index */
  function setTime(index, time) {
    if (index >= 0 && index < lines.length) {
      lines[index].time = time;
    }
  }

  /** Clear all timestamps */
  function resetTimes() {
    lines.forEach(l => { l.time = null; });
  }

  /** Return index of the current active line at given time */
  function getActiveIndex(time) {
    let active = -1;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].isBlank && lines[i].time !== null && lines[i].time <= time) {
        active = i;
      }
    }
    return active;
  }

  /** Get the lyric lines (skipping blanks) sorted by time for display */
  function getSyncedLines() {
    return lines.filter(l => !l.isBlank && l.time !== null)
                .sort((a, b) => a.time - b.time);
  }

  /** Export as LRC string */
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

  /** Number of lines that have been synced */
  function syncedCount() {
    return lines.filter(l => !l.isBlank && l.time !== null).length;
  }

  /** Number of non-blank lines total */
  function lyricsCount() {
    return lines.filter(l => !l.isBlank).length;
  }

  return {
    parse, parseLRC, autoLoad, setTime, resetTimes,
    getActiveIndex, getSyncedLines, toLRC, syncedCount, lyricsCount,
    get lines() { return lines; },
  };
})();
