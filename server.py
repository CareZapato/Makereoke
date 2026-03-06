#!/usr/bin/env python3
"""
Makereoke — servidor web con CORS habilitado.
Compatible con despliegue en Render.com y uso local.

Local:   python server.py [puerto]      → http://localhost:5500
Render:  lee automáticamente la variable de entorno PORT
"""

import http.server
import socketserver
import socket
import sys
import os

# Render inyecta PORT como variable de entorno; localmente usa argv o 5500
PORT = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 5500))
HOST = "0.0.0.0"   # escucha en todas las interfaces

CORS_ORIGINS = "*"


class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler con cabeceras CORS en todas las respuestas."""

    # ── Añadir cabeceras CORS a TODOS los intentos de respuesta ──────────────
    def end_headers(self):
        self._add_cors_headers()
        super().end_headers()

    def _add_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin",  CORS_ORIGINS)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, X-Requested-With, Range"
        )
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range")
        self.send_header("Access-Control-Max-Age", "86400")     # cache preflight 24 h
        # Necesario para SharedArrayBuffer / MediaRecorder en Chrome (algunos casos)
        self.send_header("Cross-Origin-Opener-Policy",   "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")

    # ── Responder a preflight OPTIONS ────────────────────────────────────────
    def do_OPTIONS(self):
        self.send_response(204)          # No Content
        self._add_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    # ── Suprimir el log de favicon y rutas de assets para limpiar consola ───
    def log_request(self, code="-", size="-"):
        if isinstance(code, int) and code == 404 and "favicon" in self.path:
            return
        super().log_request(code, size)


def get_local_ip():
    """Obtiene la IP local de la máquina en la red."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


# ── Cambiar al directorio del proyecto ──────────────────────────────────────
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# ── Arrancar servidor ────────────────────────────────────────────────────────
with socketserver.TCPServer((HOST, PORT), CORSRequestHandler) as httpd:
    local_ip = get_local_ip()
    print()
    print("  🎤  Makereoke — servidor listo")
    print("  ─────────────────────────────────────────")
    print(f"  Local:    http://localhost:{PORT}")
    print(f"  Red:      http://{local_ip}:{PORT}")
    print()
    print("  CORS:     habilitado para todos los orígenes (*)")
    print("  Ctrl+C para detener")
    print()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor detenido.")
