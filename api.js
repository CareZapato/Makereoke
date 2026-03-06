/* ============================================================
   api.js — Project management REST API
   Mounted at /api in both Express (production) and Vite (dev).
   ============================================================ */
import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import os from 'os';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export let PROJECTS_DIR = process.env.PROJECTS_DIR
  ? path.resolve(process.env.PROJECTS_DIR)
  : path.join(__dirname, 'projects');

let _folderExplicit = false; // true only after user picks via /api/set-folder

async function ensureProjectsDir() {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
}

function safeName(raw) {
  return path.basename(String(raw)).replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'proyecto';
}

const router = Router();

// NOTE: body parsing is handled by the parent (server.js uses express.json,
// vite.config.js wraps this router in its own express app).
// The inline parser below is only a fallback for direct Router usage.
function express_json() {
  return async (req, _res, next) => {
    if (req.body !== undefined) return next(); // already parsed upstream
    if (req.headers['content-type']?.includes('application/json')) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      try { req.body = JSON.parse(Buffer.concat(chunks).toString()); } catch { req.body = {}; }
    }
    next();
  };
}

router.use(express_json());

/* GET /api/projects — list all projects */
router.get('/projects', async (_req, res) => {
  try {
    await ensureProjectsDir();
    const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
    const projects = await Promise.all(entries
      .filter(e => e.isDirectory())
      .map(async e => {
        const dir = path.join(PROJECTS_DIR, e.name);
        let data = null;
        try { data = JSON.parse(await fs.readFile(path.join(dir, 'project.json'), 'utf8')); } catch {}
        let audioFile = null, videoFile = null;
        try {
          const files = await fs.readdir(dir);
          audioFile = files.find(f => /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f)) ?? null;
          videoFile = files.find(f => /\.(webm|mp4|mkv)$/i.test(f)) ?? null;
        } catch {}
        const synced = data?.lines?.filter(l => !l.isBlank && l.time !== null).length ?? 0;
        const total  = data?.lines?.filter(l => !l.isBlank).length ?? 0;
        return { name: e.name, data, audioFile, videoFile, synced, total };
      }));
    projects.sort((a, b) => ((a.data?.updatedAt ?? '0') < (b.data?.updatedAt ?? '0') ? 1 : -1));
    res.json({ ok: true, projects, folder: PROJECTS_DIR, explicit: _folderExplicit });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/projects/:name — get a single project's full data */
router.get('/projects/:name', async (req, res) => {
  try {
    const name = safeName(req.params.name);
    const jsonPath = path.join(PROJECTS_DIR, name, 'project.json');
    if (!existsSync(jsonPath)) return res.status(404).json({ ok: false, error: 'Not found' });
    const data = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* POST /api/projects/:name — create or overwrite project.json */
router.post('/projects/:name', async (req, res) => {
  try {
    const name = safeName(req.params.name);
    const dir  = path.join(PROJECTS_DIR, name);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'project.json'), JSON.stringify(req.body, null, 2), 'utf8');
    /* Write LRC if there are synced lines */
    const synced = req.body.lines?.filter(l => !l.isBlank && l.time !== null) ?? [];
    if (synced.length) {
      const lrcLines = synced.map(l => {
        const m = Math.floor(l.time / 60), s = Math.floor(l.time % 60), cs = Math.round((l.time % 1) * 100);
        return `[${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}]${l.text}`;
      });
      const lrcName = (req.body.songTitle || name).replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || name;
      await fs.writeFile(path.join(dir, lrcName + '.lrc'), lrcLines.join('\n'), 'utf8');
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* POST /api/audio/:name/:file — upload (or replace) an audio file for a project */
router.post('/audio/:name/:file', async (req, res) => {
  try {
    const dir      = path.join(PROJECTS_DIR, safeName(req.params.name));
    const fileName = path.basename(req.params.file);
    const filePath = path.join(dir, fileName);
    if (!filePath.startsWith(PROJECTS_DIR)) return res.status(403).end();
    await fs.mkdir(dir, { recursive: true });
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    await fs.writeFile(filePath, Buffer.concat(chunks));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/audio/:name/:file — stream audio file */
router.get('/audio/:name/:file', async (req, res) => {
  try {
    const filePath = path.join(PROJECTS_DIR, safeName(req.params.name), path.basename(req.params.file));
    if (!filePath.startsWith(PROJECTS_DIR)) return res.status(403).end();
    if (!existsSync(filePath)) return res.status(404).end();
    const stat = await fs.stat(filePath);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Accept-Ranges', 'bytes');
    createReadStream(filePath).pipe(res);
  } catch {
    res.status(500).end();
  }
});

/* GET /api/folder — return current projects directory path */
router.get('/folder', async (_req, res) => {
  await ensureProjectsDir();
  res.json({ ok: true, folder: PROJECTS_DIR, explicit: _folderExplicit });
});

/* GET /api/browse-native — open real OS folder picker on the server machine */
router.get('/browse-native', async (_req, res) => {
  try {
    const isWin = process.platform === 'win32';
    if (!isWin) return res.json({ ok: false, error: 'native-unavailable' });

    const script = [
      'Add-Type -AssemblyName System.Windows.Forms',
      '$d = New-Object System.Windows.Forms.FolderBrowserDialog',
      '$d.Description = "Seleccionar carpeta de proyectos Makereoke"',
      '$d.ShowNewFolderButton = $true',
      '$d.RootFolder = [System.Environment+SpecialFolder]::MyComputer',
      'if ($d.ShowDialog() -eq "OK") { Write-Output $d.SelectedPath }',
    ].join('\n');

    const tmpFile = path.join(os.tmpdir(), 'mkr-folder-picker.ps1');
    await fs.writeFile(tmpFile, script, 'utf8');

    const selected = await new Promise((resolve, reject) => {
      exec(
        `powershell -STA -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`,
        { timeout: 120000, encoding: 'utf8' },
        (err, stdout) => {
          const result = stdout ? stdout.trim() : '';
          if (err && !result) reject(err);
          else resolve(result);
        }
      );
    });

    await fs.unlink(tmpFile).catch(() => {});

    if (selected) res.json({ ok: true, path: selected });
    else res.json({ ok: false, error: 'cancelled' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/browse?path=<dir> — list subdirectories of a server path */
router.get('/browse', async (req, res) => {
  try {
    let dir = req.query.path ? String(req.query.path) : null;
    if (!dir) {
      // Default: drives on Windows, / on Unix
      const isWin = process.platform === 'win32';
      if (isWin) {
        // List available drive letters
        const { execSync } = await import('child_process');
        let drives = [];
        try {
          const out = execSync('wmic logicaldisk get name', { encoding: 'utf8', timeout: 3000 });
          drives = out.split(/\r?\n/).map(l => l.trim()).filter(l => /^[A-Z]:$/.test(l)).map(d => d + '\\');
        } catch { drives = ['C:\\']; }
        return res.json({ ok: true, path: null, entries: drives.map(d => ({ name: d, path: d, isRoot: true })), parent: null });
      } else {
        dir = '/';
      }
    }
    dir = path.resolve(dir);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => ({ name: e.name, path: path.join(dir, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const parent = path.dirname(dir) !== dir ? path.dirname(dir) : null;
    res.json({ ok: true, path: dir, entries: dirs, parent });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* POST /api/set-folder — change the projects directory at runtime */
router.post('/set-folder', async (req, res) => {
  try {
    const newPath = req.body?.path ? path.resolve(String(req.body.path)) : null;
    if (!newPath) return res.status(400).json({ ok: false, error: 'path required' });
    await fs.mkdir(newPath, { recursive: true });
    PROJECTS_DIR = newPath;
    _folderExplicit = true;
    res.json({ ok: true, folder: PROJECTS_DIR });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
