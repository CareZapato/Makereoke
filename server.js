import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const app  = express();
const PORT = parseInt(process.env.PORT || '5500', 10);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');

app.use(express.static(DIST));
app.get('*', (_, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Makereoke  →  http://localhost:${PORT}\n`);
});
