# CONTEXT — Makereoke

## ¿Qué es Makereoke?

**Makereoke** es un generador de videos de karaoke que corre en el navegador.
El usuario sube un archivo de audio (MP3/WAV/OGG/M4A/FLAC) y la letra de una canción;
la app los sincroniza y genera un video animado listo para proyectar o compartir.

Está pensado para correr en una máquina local de una LAN (red de casa, estudio, local),
accediendo desde cualquier dispositivo de la red vía `http://<ip>:5500`.

---

## Flujo de trabajo — 4 pasos

### Paso 1 — Carga
- Nombre del proyecto (ej. `Los Bukis — Me Volviste a Enamorar`)
- Soltar o seleccionar el archivo de audio
- Pegar la letra (una frase por línea) o un archivo `.lrc` con tiempos ya marcados
- No se puede avanzar hasta tener: nombre + audio + letra ✓

### Paso 2 — Sincronización
- Se dibuja la forma de onda del audio en un canvas
- El usuario da Play y presiona **Space (o TAP)** al inicio de cada frase
- La letra se va marcando en verde con su timestamp
- Botones de Deshacer y Reiniciar
- Botón **"💾 Guardar proyecto"** (mismo botón en el Paso 3)
  - Si aún no hay workspace definido → abre el selector de carpeta primero, luego guarda
  - Si ya hay workspace → crea la subcarpeta de la canción y guarda los archivos
- **Auto-guardado silencioso** al avanzar a cualquier paso siguiente (solo si el workspace ya está configurado o en modo IDB)

### Paso 3 — Ajuste
- Canvas de línea de tiempo: cada frase es un bloque arrastrable
- Tabla editable con tiempo, duración y botones "📍 Set now" / "▶ Seek"
- Preview de karaoke en vivo (línea anterior / actual / siguiente)

### Paso 4 — Exportación
- **Tema** (8 opciones): classic, neon, fire, ocean, minimal, violeta, dorado, hielo
- **Animación de fondo** (11 opciones): galaxia, matrix, aurora, confeti, hipnotico, etc.
- **Overlay** (4 opciones): notas, brasas, nieve, burbujas
- **Opciones de texto**: tamaño (28–120px), glow, posición, colores activo/inactivo
- **Resolución**: 720p / 1080p / 4K, a 24 / 30 / 60 fps
- **Preview** en tiempo real en el canvas
- **Grabar**: MediaRecorder captura canvas + audio → descarga automática como `.webm` / `.mp4`

---

## Archivos de un proyecto

Cada proyecto es una carpeta con estos archivos:

```
mi-proyecto/
  project.json       ← letra sincronizada + config del Paso 4
  cancion.mp3        ← audio original
  cancion.lrc        ← formato LRC (auto-generado al sincronizar)
  cancion.webm       ← video exportado (se guarda si hay carpeta vinculada)
```

`project.json` tiene esta estructura:
```json
{
  "version": "2",
  "songTitle": "Los Bukis — Me Volviste a Enamorar",
  "createdAt": "2026-03-06T...",
  "updatedAt": "2026-03-06T...",
  "audioFileName": "cancion.mp3",
  "lines": [
    { "text": "Aquí en mi soledad", "time": 2.5, "isBlank": false },
    { "text": "", "time": null, "isBlank": true }
  ],
  "settings": {
    "theme": "classic",
    "animation": "galaxia",
    "overlay": "notas",
    "fontSize": 56,
    "glowIntensity": 2,
    "textPosition": "center",
    "activeColor": "#FFD700",
    "inactiveColor": "#FFFFFF",
    "resolution": "1920x1080",
    "fps": 30,
    "showProgress": true
  }
}
```

---

## Dónde se guardan los proyectos — ARQUITECTURA CORRECTA

### Intención de diseño

Los proyectos se guardan en el **equipo de cada usuario**, NO en el servidor.

- El servidor solo sirve la web app (HTML/JS/CSS).
- Cada persona que usa la app guarda sus canciones en su propio equipo.
- Esto evita llenar el servidor de archivos de audio y video pesados.

### Modos de almacenamiento

| Contexto | API disponible | Cómo se guarda |
|---|---|---|
| `localhost` / HTTPS | File System Access API ✓ | Carpeta real en disco vía browser dialog; si no hay workspace definido, se abre el selector al guardar |
| HTTP por IP (LAN) | File System Access API ✗ | **IndexedDB** en el navegador del cliente; el usuario puede leer proyectos del disco con `<input webkitdirectory>` |

> **Nota**: ya no existe un fallback de descarga automática `.mkproject`. Si el usuario está en localhost y no tiene workspace definido, la app muestra el selector de carpeta antes de guardar.

### File System Access API (localhost / HTTPS)

- `showDirectoryPicker()` → el navegador abre un diálogo de carpeta nativo
- La app obtiene un `FileSystemDirectoryHandle` que se guarda en IndexedDB
- Al reopening, el handle se restaura y se pide permiso de escritura de nuevo
- Escribe directamente `project.json`, audio, `.lrc`, y el video exportado

### IndexedDB fallback (HTTP por IP)

Cuando File System Access API no está disponible (HTTP en otro equipo):
- El `project.json` + el Blob del audio se almacenan en **IndexedDB del navegador**
- Los videos se descargan automáticamente al terminar la grabación
- El panel Proyectos lista los proyectos guardados en IndexedDB del propio navegador
- El usuario puede también leer proyectos ya guardados en disco usando el botón 📂 (abre `<input webkitdirectory>`, solo lectura desde el navegador)
- Para hacer backup, se puede exportar un `.mkproject` (JSON) importable desde el panel Proyectos

---

## Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3.1 | UI de los 4 pasos y overlays |
| Vite | 5.4.21 | Build + dev server |
| Web Audio API | — | Decodificación, playback, stream para grabar |
| Canvas 2D API | — | Forma de onda, línea de tiempo, render del video |
| MediaRecorder API | — | Captura canvas + audio → WebM / MP4 |
| File System Access API | — | Carpeta real en disco (solo localhost / HTTPS) |
| IndexedDB | — | Persistencia de proyectos en el navegador (HTTP LAN) |

### Backend (Node.js)
| Tecnología | Versión | Uso |
|---|---|---|
| Express | 4.21.2 | Servidor HTTP estático + API REST |
| http (Node built-in) | — | Servidor sin TLS (HTTP puro) |
| child_process | — | PowerShell para folder picker nativo (localhost only) |
| fs/promises | — | Lectura/escritura de archivos cuando se usa la API server-side |

### Módulos cliente (src/lib/)
| Módulo | Responsabilidad |
|---|---|
| `audio.js` | Carga, playback, volumen, stream de grabación |
| `lyrics.js` | Modelo de letra: parse, tiempos, índice activo |
| `sync.js` | Lógica del Paso 2: waveform, TAP, lista |
| `adjust.js` | Lógica del Paso 3: timeline canvas, arrastre, tabla |
| `renderer.js` | Render de frames: temas, animaciones, overlays, texto |
| `export-engine.js` | Lógica del Paso 4: settings, preview loop, grabación |
| `projects.js` | Persistencia: File System API, IndexedDB, save/load |
| `projects-api.js` | Cliente REST para API del servidor (fallback) |
| `utils.js` | formatTime, parseTime, toast, clamp, debounce |

---

## Arquitectura del servidor

```
server.js          ← Express HTTP en puerto 5500, escucha en 0.0.0.0
  ├── express.static(dist/)   ← sirve el bundle de Vite
  ├── /api → api.js           ← router REST (solo para compatibilidad / guardar en servidor)
  └── GET * → dist/index.html ← SPA routing
```

```
vite.config.js     ← Dev server Vite (puerto 5500)
  ├── plugin react()
  └── middleware /api → api.js  (mismo router, dev mode)
```

### Endpoints REST (api.js)
Estos son opcionales — existen para cuando el usuario prefiere guardar en el servidor.

```
GET  /api/projects           → lista proyectos del PROJECTS_DIR
GET  /api/projects/:name     → lee project.json de un proyecto
POST /api/projects/:name     → guarda project.json (crea carpeta si no existe)
POST /api/audio/:name/:file  → sube archivo de audio al proyecto
GET  /api/audio/:name/:file  → streamea audio de un proyecto
GET  /api/folder             → devuelve el PROJECTS_DIR actual
POST /api/set-folder         → cambia el PROJECTS_DIR
GET  /api/browse             → lista subdirectorios (para el browser in-app)
GET  /api/browse-native      → abre FolderBrowserDialog PowerShell (solo localhost Windows)
```

---

## Despliegue

- **Local**: `npm run serve` → `node server.js` (sin Vite devserver)
- **Dev**: `npm run dev` → `vite` con middleware de API
- **Build**: `npm run build` → Vite genera `dist/`
- **Render.com**: `render.yaml` configura el deploy automático desde GitHub

---

## Notas de seguridad y limitaciones

- **File System Access API** requiere contexto seguro (`localhost` o `https://`). No funciona en `http://<ip-lan>`.
- **MediaRecorder** + **Canvas API** no tienen esa restricción → grabación funciona en HTTP LAN.
- **CORS**: La API del servidor permite cualquier origen (`Access-Control-Allow-Origin: *`).
- **browse-native** solo ejecuta PowerShell si el request viene de `127.0.0.1` (loopback), nunca de LAN.
- Máximo 10 MB en `express.json()` (suficiente para `project.json` con letras largas).
- Los archivos de audio y video no pasan por el servidor en el modo cliente (IndexedDB/File System API).

---

## Estado actual de la persistencia (pendiente de refactor)

Actualmente la app en HTTP/LAN usa la API REST del servidor para guardar proyectos en el servidor.
**Esto es incorrecto** según el diseño original.

El refactor pendiente es:
1. En `projects.js`, cuando File System API no está disponible → usar IndexedDB para guardar `project.json` + el ArrayBuffer del audio
2. El panel de Proyectos en HTTP/LAN lista proyectos de IndexedDB, no del servidor
3. El botón "guardar" en Paso 2 escribe en IndexedDB
4. Los videos se descargan automáticamente (ya funciona así)
5. El botón 📂 en HTTP/LAN no pide ruta del servidor — simplemente no existe el concepto de "carpeta" when en este modo
