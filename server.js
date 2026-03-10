import express    from 'express';
import http       from 'http';
import { fileURLToPath } from 'url';
import path       from 'path';
import os         from 'os';
import apiRouter, { PROJECTS_DIR } from './api.js';

const app       = express();
const PORT      = parseInt(process.env.PORT || '5500', 10);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST      = path.join(__dirname, 'dist');

function _getLocalIPs() {
  const ips = [];
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs) {
      if (a.family === 'IPv4') ips.push(a.address);
    }
  }
  return ips;
}

/* ── Express app ─────────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRouter);
app.use(express.static(DIST));
app.get('*', (_, res) => res.sendFile(path.join(DIST, 'index.html')));

/* ── HTTP server ─────────────────────────────────────────────── */
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  const ips = _getLocalIPs();
  console.log(`\n  Karaoke Video Maker  →  http://localhost:${PORT}`);
  ips.filter(ip => !ip.startsWith('127.')).forEach(ip =>
    console.log(`  LAN        →  http://${ip}:${PORT}`)
  );
  console.log(`  Projects   →  ${PROJECTS_DIR}\n`);
});
