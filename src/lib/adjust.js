/* ============================================================
   adjust.js — Timeline visualization and fine-tuning step (ES module)
   ============================================================ */

import Audio from './audio.js';
import Lyrics from './lyrics.js';
import Sync from './sync.js';
import { formatTime, parseTime, toast, clamp } from './utils.js';

const Adjust = (() => {

  let isInitialized = false;
  let previewRaf = null;
  let isDragging = false;
  let dragIdx = -1;
  let timelineScale = 80;

  /* ─── INIT ─── */
  function init() {
    if (isInitialized) return;
    isInitialized = true;

    document.getElementById('adjPlayBtn').addEventListener('click', handlePlay);
    document.getElementById('adjSeekBar').addEventListener('input', e => {
      Audio.seek(parseFloat(e.target.value));
      updatePreview();
    });

    initTimeline();
  }

  function initTimeline() {
    const canvas = document.getElementById('timelineCanvas');
    canvas.addEventListener('mousedown', onTimelineMouseDown);
    canvas.addEventListener('touchstart', onTimelineTouchStart, { passive: false });
    window.addEventListener('mousemove', onTimelineMouseMove);
    window.addEventListener('mouseup', onTimelineMouseUp);
    window.addEventListener('touchmove', onTimelineTouchMove, { passive: false });
    window.addEventListener('touchend', onTimelineMouseUp);
  }

  /* ─── SETUP ─── */
  function setup() {
    init();
    Audio.onTimeUpdate = onTimeUpdate;
    Audio.onEnded = () => { document.getElementById('adjPlayBtn').textContent = '▶'; };
    setupVoiceConfig();    buildAdjustTable();
    drawTimeline();
    updatePreview();

    const dur = Audio.duration;
    document.getElementById('adjSeekBar').max = dur;
    document.getElementById('adjTotalTime').textContent = formatTime(dur);
    onTimeUpdate(Audio.getCurrentTime());
  }

  /* ─── VOICE CONFIG (mirrors sync.js state into adj_ inputs) ─── */
  function setupVoiceConfig() {
    const cfg = Sync.getVoiceConfig();
    for (let n = 1; n <= 4; n++) {
      const row     = document.getElementById(`adj_voiceRow_${n}`);
      const colEl   = document.getElementById(`adj_voiceColor_${n}`);
      const nameEl  = document.getElementById(`adj_voiceName_${n}`);
      const swatchEl= document.getElementById(`adj_voiceSwatch_${n}`);
      const v = cfg.voices[n - 1];
      if (!v) continue;
      if (row)     { row.style.display = n <= cfg.count ? '' : 'none'; row.style.setProperty('--vc', v.color); }
      if (swatchEl) swatchEl.style.background = v.color;
      if (colEl)   { colEl.value = v.color;  colEl.oninput  = () => Sync.setVoiceColor(n, colEl.value); }
      if (nameEl)  { nameEl.value = v.name;  nameEl.oninput = () => Sync.setVoiceName(n, nameEl.value); }
    }
    const adjAllRow    = document.getElementById('adj_voiceRow_all');
    const adjAllCol    = document.getElementById('adj_allVoiceColor');
    const adjAllSwatch = document.getElementById('adj_allVoiceSwatch');
    if (adjAllRow)    { adjAllRow.style.display = cfg.count > 1 ? '' : 'none'; adjAllRow.style.setProperty('--vc', cfg.allColor); }
    if (adjAllSwatch) adjAllSwatch.style.background = cfg.allColor;
    if (adjAllCol)    { adjAllCol.value = cfg.allColor; adjAllCol.oninput = () => Sync.setVoiceColor(0, adjAllCol.value); }
  }

  /* ─── PLAYER ─── */
  function handlePlay() {
    Audio.toggle();
    document.getElementById('adjPlayBtn').textContent = Audio.isPlaying ? '⏸' : '▶';
  }

  function onTimeUpdate(t) {
    document.getElementById('adjCurrentTime').textContent = formatTime(t);
    document.getElementById('adjSeekBar').value = t;
    updatePreview();
    drawTimeline();
    highlightTableRow();
  }

  /* ─── KARAOKE PREVIEW ─── */
  function updatePreview() {
    const t = Audio.getCurrentTime();
    const cfg = Sync.getVoiceConfig();
    const lines = Lyrics.lines.filter(l => !l.isBlank && l.time !== null);
    lines.sort((a, b) => a.time - b.time);

    let activeIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= t) activeIdx = i;
    }

    const prevLine = activeIdx > 0 ? lines[activeIdx - 1] : null;
    const currLine = activeIdx >= 0 ? lines[activeIdx] : null;
    const nextLine = (activeIdx >= 0 && activeIdx < lines.length - 1) ? lines[activeIdx + 1] : null;

    document.getElementById('kpPrev').textContent    = prevLine ? prevLine.text : '';
    document.getElementById('kpCurrent').textContent = currLine ? currLine.text : '—';
    document.getElementById('kpNext').textContent    = nextLine ? nextLine.text : '';

    applyKpColor('kpCurrent', currLine, cfg, 1.0);
    applyKpColor('kpPrev',    prevLine, cfg, 0.28);
    applyKpColor('kpNext',    nextLine, cfg, 0.55);
  }

  function applyKpColor(elId, line, cfg, alpha) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!line || line.voice === null) {
      el.style.color = '';
      el.style.textShadow = '';
      return;
    }
    let hex = null;
    if (line.voice === 0) hex = cfg.allColor;
    else if (line.voice >= 1 && cfg.voices[line.voice - 1]) hex = cfg.voices[line.voice - 1].color;
    if (!hex) { el.style.color = ''; el.style.textShadow = ''; return; }
    const [r, g, b] = hexToRgb(hex);
    el.style.color = `rgba(${r},${g},${b},${alpha})`;
    if (elId === 'kpCurrent') {
      el.style.textShadow = `0 0 20px rgba(${r},${g},${b},0.85), 0 0 40px rgba(${r},${g},${b},0.35)`;
    } else {
      el.style.textShadow = '';
    }
  }

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function highlightTableRow() {
    const t = Audio.getCurrentTime();
    const active = Lyrics.getActiveIndex(t);
    document.querySelectorAll('#adjustTableBody tr').forEach(tr => {
      const li = parseInt(tr.dataset.lineIdx);
      tr.classList.toggle('row-current', li === active);
    });
  }

  /* ─── ADJUST TABLE ─── */
  function buildAdjustTable() {
    const tbody = document.getElementById('adjustTableBody');
    tbody.innerHTML = '';
    const dur = Audio.duration;
    const cfg = Sync.getVoiceConfig();

    const sorted = [];
    Lyrics.lines.forEach((l, i) => {
      if (!l.isBlank) sorted.push({ ...l, origIdx: i });
    });
    sorted.sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity));

    sorted.forEach((line, rank) => {
      const nextTime = sorted[rank + 1]?.time ?? dur;
      const origDur = line.time !== null && nextTime ? (nextTime - line.time).toFixed(2) : '—';
      const timeStr = line.time !== null ? formatTime(line.time, true) : '';

      const v = line.voice; // null | 0 | 1..4
      let dotColor = '#555';
      if (v === 0) dotColor = cfg.allColor;
      else if (v !== null && v >= 1 && cfg.voices[v - 1]) dotColor = cfg.voices[v - 1].color;

      // Build mini voice pills
      let pillsHtml = `<button class="vmini${v === null ? ' vmini-active' : ''}" data-setvoice="null" data-lidx="${line.origIdx}" title="Sin asignar">—</button>`;
      if (cfg.count > 1) {
        pillsHtml += `<button class="vmini${v === 0 ? ' vmini-active' : ''}" data-setvoice="0" data-lidx="${line.origIdx}" title="Todos juntos" style="border-color:${cfg.allColor};color:${cfg.allColor}">∀</button>`;
      }
      for (let n = 1; n <= cfg.count; n++) {
        const vc = cfg.voices[n - 1];
        const col = vc?.color || '#888';
        pillsHtml += `<button class="vmini${v === n ? ' vmini-active' : ''}" data-setvoice="${n}" data-lidx="${line.origIdx}" title="${escapeHtml(vc?.name || `Voz ${n}`)}" style="border-color:${col};color:${col}">${n}</button>`;
      }

      const tr = document.createElement('tr');
      tr.dataset.lineIdx = line.origIdx;
      tr.style.setProperty('--row-vc', dotColor);
      tr.innerHTML = `
        <td><span class="line-num-badge">${rank + 1}</span></td>
        <td class="col-voice">
          <div class="voice-cell">
            <span class="voice-dot-sm" style="background:${dotColor}" title="${v === null ? 'Sin asignar' : v === 0 ? 'Todos' : (cfg.voices[v-1]?.name || `Voz ${v}`)}"></span>
            <div class="vmini-row">${pillsHtml}</div>
          </div>
        </td>
        <td><span class="lyric-text-cell" title="${escapeHtml(line.text)}">${escapeHtml(line.text)}</span></td>
        <td>
          <input type="text" class="time-input"
            data-orig-idx="${line.origIdx}"
            value="${timeStr}"
            placeholder="0:00.00"
          />
        </td>
        <td class="col-dur" style="color:var(--text-dim);font-size:0.8rem">${origDur}s</td>
        <td class="row-actions">
          <button class="icon-btn" data-action="set-now" data-idx="${line.origIdx}" title="Marcar en posición actual">📍</button>
          <button class="icon-btn" data-action="seek" data-time="${line.time}" title="Saltar a esta frase">▶</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.time-input').forEach(inp => {
      inp.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.origIdx);
        const t = parseTime(e.target.value);
        Lyrics.setTime(idx, t);
        e.target.value = formatTime(t, true);
        drawTimeline();
        updatePreview();
      });
    });

    tbody.addEventListener('click', e => {
      // Voice pill click
      const pill = e.target.closest('[data-setvoice]');
      if (pill) {
        const lidx = parseInt(pill.dataset.lidx);
        const raw  = pill.dataset.setvoice;
        const newVoice = raw === 'null' ? null : parseInt(raw);
        Lyrics.setVoice(lidx, newVoice);
        buildAdjustTable();
        return;
      }

      // Row action buttons
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'set-now') {
        const idx = parseInt(btn.dataset.idx);
        const t = Audio.getCurrentTime();
        Lyrics.setTime(idx, t);
        buildAdjustTable();
        drawTimeline();
        toast('Tiempo actualizado', 'success');
      }
      if (action === 'seek') {
        const t = parseFloat(btn.dataset.time);
        if (!isNaN(t)) Audio.seek(t);
      }
    });
  }

  function escapeHtml(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ─── TIMELINE CANVAS ─── */
  function drawTimeline() {
    const canvas = document.getElementById('timelineCanvas');
    const wrapper = canvas.parentElement;
    const dur = Audio.duration;
    const H = 120;
    const cfg = Sync.getVoiceConfig();

    const W = Math.max(wrapper.offsetWidth, dur * timelineScale);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#141428';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#31316a';
    ctx.fillRect(0, 30, W, 1);

    const step = timelineScale >= 60 ? 5 : 10;
    for (let s = 0; s <= dur; s += step) {
      const x = (s / dur) * W;
      ctx.fillStyle = '#31316a';
      ctx.fillRect(x, 0, 1, 30);
      ctx.fillStyle = '#8888bb';
      ctx.font = '10px monospace';
      ctx.fillText(formatTime(s), x + 3, 20);
    }

    const lines = Lyrics.lines.filter(l => !l.isBlank && l.time !== null)
                               .sort((a, b) => a.time - b.time);
    lines.forEach((line, i) => {
      const x = (line.time / dur) * W;
      const nextT = lines[i + 1]?.time ?? dur;
      const blockW = Math.max(4, ((nextT - line.time) / dur) * W - 2);
      const y = 36;
      const bH = 72;

      const isActive = line.time <= Audio.getCurrentTime() &&
                        (lines[i + 1]?.time ?? Infinity) > Audio.getCurrentTime();

      // Voice color
      const vn = line.voice;
      let baseHex = '#7c4dff';
      if (vn === 0) baseHex = cfg.allColor;
      else if (vn !== null && vn >= 1 && cfg.voices[vn - 1]) baseHex = cfg.voices[vn - 1].color;
      const [vr, vg, vb] = hexToRgb(baseHex);

      ctx.fillStyle = isActive
        ? `rgba(${vr},${vg},${vb},0.55)`
        : `rgba(${vr},${vg},${vb},0.22)`;
      roundRect(ctx, x, y, blockW, bH, 4);
      ctx.fill();

      ctx.strokeStyle = isActive ? baseHex : `rgba(${vr},${vg},${vb},0.4)`;
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, blockW, bH, 4);
      ctx.stroke();

      ctx.fillStyle = baseHex;
      roundRect(ctx, x, y, 4, bH, 2);
      ctx.fill();

      if (blockW > 30) {
        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 6, y + 2, blockW - 10, bH - 4);
        ctx.clip();
        ctx.fillText(line.text, x + 6, y + 18);
        ctx.restore();
      }
    });

    const ph = (Audio.getCurrentTime() / dur) * W;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(ph - 1, 0, 2, H);
    ctx.beginPath();
    ctx.moveTo(ph, 0);
    ctx.lineTo(ph + 6, 8);
    ctx.lineTo(ph - 6, 8);
    ctx.closePath();
    ctx.fillStyle = '#FFD700';
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /* ─── TIMELINE DRAG ─── */
  function timelineEventToTime(e) {
    const canvas = document.getElementById('timelineCanvas');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const W = parseFloat(canvas.style.width);
    return clamp((x / W) * Audio.duration, 0, Audio.duration);
  }

  function findDragTarget(e) {
    const t = timelineEventToTime(e);
    const lines = Lyrics.lines
      .map((l, i) => ({ ...l, origIdx: i }))
      .filter(l => !l.isBlank && l.time !== null);
    const threshold = 0.5;
    for (const l of lines) {
      if (Math.abs(l.time - t) < threshold) return l.origIdx;
    }
    return -1;
  }

  function onTimelineMouseDown(e) {
    dragIdx = findDragTarget(e);
    if (dragIdx >= 0) {
      isDragging = true;
      e.preventDefault();
    } else {
      Audio.seek(timelineEventToTime(e));
    }
  }
  function onTimelineTouchStart(e) {
    e.preventDefault();
    dragIdx = findDragTarget(e);
    if (dragIdx >= 0) isDragging = true;
    else Audio.seek(timelineEventToTime(e));
  }
  function onTimelineMouseMove(e) {
    if (!isDragging || dragIdx < 0) return;
    const t = timelineEventToTime(e);
    Lyrics.setTime(dragIdx, t);
    drawTimeline();
    updatePreview();
  }
  function onTimelineTouchMove(e) {
    if (!isDragging || dragIdx < 0) return;
    e.preventDefault();
    const t = timelineEventToTime(e);
    Lyrics.setTime(dragIdx, t);
    drawTimeline();
    updatePreview();
  }
  function onTimelineMouseUp() {
    if (isDragging) { isDragging = false; dragIdx = -1; buildAdjustTable(); }
  }

  return { setup };
})();

export default Adjust;
