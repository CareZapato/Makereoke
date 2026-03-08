/* ============================================================
   utils.js — Helper functions (ES module)
   ============================================================ */

export const APP_VERSION = '0.3.4';

/** Format seconds to MM:SS or MM:SS.ms */
export function formatTime(sec, ms = false) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const base = `${m}:${String(s).padStart(2, '0')}`;
  if (ms) {
    const msec = Math.round((sec % 1) * 100);
    return `${base}.${String(msec).padStart(2, '0')}`;
  }
  return base;
}

/** Parse "M:SS.ms" → seconds */
export function parseTime(str) {
  if (!str) return 0;
  str = str.trim();
  const parts = str.split(':');
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(str) || 0;
}

/** Show a toast notification */
export function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3300);
}

/** Clamp a value between min and max */
export function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

/** Deep clone a plain object/array */
export function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

/** Debounce function */
export function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

/** Read file as ArrayBuffer */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/** Read file as text */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}
