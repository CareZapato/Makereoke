#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Makereoke — servidor web con CORS y live-reload en desarrollo.

Local:   python server.py [puerto]   → http://localhost:5500
Render:  lee PORT del entorno; live-reload desactivado automáticamente.

Live-reload:
  • Hilo en segundo plano vigila cambios en .html/.css/.js/.json
  • Inyecta un <script> mínimo en respuestas HTML que escucha SSE
  • El navegador recarga solo al guardar cualquier fichero del proyecto
"""

import http.server
import socketserver
import socket
import sys
import os
import threading
import queue
import time

# Fix Windows console encoding so emojis don't crash on cp1252
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Entorno ─────────────────────────────────────────────────────────────────
PORT      = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 5500))
HOST      = "0.0.0.0"
CORS_ORIGINS   = "*"
IS_RENDER = "RENDER" in os.environ   # en Render el live-reload no aplica
LIVE_RELOAD    = not IS_RENDER

# ── Estado live-reload ───────────────────────────────────────────────────────
_sse_clients  = []          # lista de Queue, uno por pestaña conectada
_sse_lock     = threading.Lock()
_reload_event = threading.Event()   # señal de "algo cambió"

LIVERELOAD_SCRIPT = b"""<script>
(function(){
  var es=new EventSource('/__livereload');
  es.onmessage=function(){ location.reload(); };
  es.onerror=function(){ es.close(); setTimeout(function(){ location.reload(); },800); };
})();
</script>"""

WATCH_EXTS  = {".html", ".css", ".js", ".json"}
SKIP_DIRS   = {"__pycache__", ".git", "node_modules", ".vscode"}
WATCH_ROOT  = os.path.dirname(os.path.abspath(__file__))

def _file_watcher(interval=0.7):
    """Polling de mtimes; emite evento cuando detecta un cambio."""
    mtimes = {}
    while True:
        changed = False
        for dirpath, dirs, files in os.walk(WATCH_ROOT):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
            for fname in files:
                if os.path.splitext(fname)[1] not in WATCH_EXTS:
                    continue
                path = os.path.join(dirpath, fname)
                try:
                    mtime = os.stat(path).st_mtime
                except OSError:
                    continue
                if path in mtimes:
                    if mtimes[path] != mtime:
                        mtimes[path] = mtime
                        changed = True
                        print(f"  ↻  Cambio detectado: {os.path.relpath(path, WATCH_ROOT)}")
                else:
                    mtimes[path] = mtime
        if changed:
            _reload_event.set()
            with _sse_lock:
                for q in list(_sse_clients):
                    try:
                        q.put_nowait("reload")
                    except Exception:
                        pass
        time.sleep(interval)


# ── Servidor con hilos (necesario para conexiones SSE largas) ────────────────
class ThreadingServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads    = True
    allow_reuse_address = True


class DevHandler(http.server.SimpleHTTPRequestHandler):

    # ── CORS ─────────────────────────────────────────────────────────────────
    def end_headers(self):
        self._add_cors_headers()
        super().end_headers()

    def _add_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin",   CORS_ORIGINS)
        self.send_header("Access-Control-Allow-Methods",  "GET, POST, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers",
                         "Content-Type, Authorization, X-Requested-With, Range")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range")
        self.send_header("Access-Control-Max-Age",        "86400")
        self.send_header("Cross-Origin-Resource-Policy",  "cross-origin")

    def do_OPTIONS(self):
        self.send_response(204)
        self._add_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    # ── Endpoint SSE para live-reload ────────────────────────────────────────
    def do_GET(self):
        if LIVE_RELOAD and self.path == "/__livereload":
            self._serve_sse()
            return
        super().do_GET()

    def _serve_sse(self):
        self.send_response(200)
        self.send_header("Content-Type",  "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection",    "keep-alive")
        self._add_cors_headers()
        # end_headers() llamaría a _add_cors_headers de nuevo, lo evitamos:
        http.server.BaseHTTPRequestHandler.end_headers(self)

        q = queue.Queue()
        with _sse_lock:
            _sse_clients.append(q)
        try:
            while True:
                try:
                    msg = q.get(timeout=20)
                    self.wfile.write(f"data: {msg}\n\n".encode())
                    self.wfile.flush()
                except queue.Empty:
                    # Heartbeat para mantener la conexión activa
                    self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
        except Exception:
            pass
        finally:
            with _sse_lock:
                try:
                    _sse_clients.remove(q)
                except ValueError:
                    pass

    # ── Inyección de script live-reload en respuestas HTML ───────────────────
    def send_head(self):
        if not LIVE_RELOAD:
            return super().send_head()

        # Solo inyectar en archivos .html servidos localmente
        path = self.translate_path(self.path)
        _, ext = os.path.splitext(path)
        if ext.lower() not in (".html", ".htm"):
            return super().send_head()

        try:
            with open(path, "rb") as f:
                content = f.read()
        except OSError:
            return super().send_head()

        # Inyectar antes de </body> si existe, o al final
        inject_at = content.rfind(b"</body>")
        if inject_at != -1:
            content = content[:inject_at] + LIVERELOAD_SCRIPT + content[inject_at:]
        else:
            content += LIVERELOAD_SCRIPT

        self.send_response(200)
        self.send_header("Content-Type",   "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control",  "no-cache")
        self.end_headers()

        # Devolvemos un objeto tipo-file con el contenido modificado
        import io
        return io.BytesIO(content)

    # ── Log limpio ───────────────────────────────────────────────────────────
    def log_request(self, code="-", size="-"):
        if isinstance(code, int) and code == 404 and "favicon" in self.path:
            return
        if self.path == "/__livereload":
            return
        super().log_request(code, size)


# ── Helpers ──────────────────────────────────────────────────────────────────
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


# ── Arranque ─────────────────────────────────────────────────────────────────
os.chdir(WATCH_ROOT)

if LIVE_RELOAD:
    t = threading.Thread(target=_file_watcher, daemon=True)
    t.start()

with ThreadingServer((HOST, PORT), DevHandler) as httpd:
    local_ip = get_local_ip()
    print()
    print("  🎤  Makereoke — servidor listo")
    print("  ─────────────────────────────────────────")
    print(f"  Local:    http://localhost:{PORT}")
    print(f"  Red:      http://{local_ip}:{PORT}")
    print()
    if LIVE_RELOAD:
        print("  ♻️   Live-reload ACTIVO  (recarga al guardar .html/.css/.js)")
    else:
        print("  Live-reload: desactivado (entorno Render)")
    print("  CORS:     habilitado para todos los orígenes (*)")
    print("  Ctrl+C para detener")
    print()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor detenido.")

