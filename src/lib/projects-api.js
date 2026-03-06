/* ============================================================
   projects-api.js — REST client for server-side project storage
   Used automatically when File System Access API is unavailable
   (i.e. access via LAN IP, non-HTTPS context).
   ============================================================ */

const BASE = '/api';

async function _json(res) {
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'API error');
  return data;
}

export async function apiListProjects() {
  const res = await fetch(`${BASE}/projects`);
  return _json(res); // { ok, projects, folder }
}

export async function apiGetProject(name) {
  const res = await fetch(`${BASE}/projects/${encodeURIComponent(name)}`);
  return _json(res); // { ok, data }
}

export async function apiSaveProject(name, data, audioFile = null) {
  const res = await fetch(`${BASE}/projects/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await _json(res); // throws on error

  if (audioFile) {
    const audRes = await fetch(
      `${BASE}/audio/${encodeURIComponent(name)}/${encodeURIComponent(audioFile.name)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': audioFile.type || 'application/octet-stream' },
        body: audioFile,
      }
    );
    await _json(audRes);
  }

  return { ok: true };
}

export async function apiGetFolder() {
  const res = await fetch(`${BASE}/folder`);
  return _json(res); // { ok, folder }
}

export async function apiBrowse(dirPath) {
  const url = dirPath ? `${BASE}/browse?path=${encodeURIComponent(dirPath)}` : `${BASE}/browse`;
  const res = await fetch(url);
  return _json(res); // { ok, path, entries: [{name, path}], parent }
}

export async function apiSetFolder(folderPath) {
  const res = await fetch(`${BASE}/set-folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: folderPath }),
  });
  return _json(res); // { ok, folder }
}

export async function apiAudioUrl(projectName, audioFile) {
  return `${BASE}/audio/${encodeURIComponent(projectName)}/${encodeURIComponent(audioFile)}`;
}
