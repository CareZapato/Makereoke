/* ============================================================
   changelog.js  —  Información del proyecto e historial de cambios
   ============================================================ */

export const PROJECT_INFO = {
  name: 'Makereoke',
  description:
    'Crea videos karaoke desde tu navegador: carga tu audio, sincroniza las letras y exporta el video listo para compartir.',
  author: 'Zapato',
  lastUpdate: '2026-03-07',
};

/**
 * Tipos de cambio disponibles:
 *  'new'     → Función o sección nueva  ✨
 *  'improve' → Mejora de algo existente 🔧
 *  'fix'     → Corrección de error      🐛
 *  'visual'  → Cambio estético / UI     🎨
 *  'mobile'  → Mejora en móvil          📱
 */
export const CHANGELOG = [
  {
    version: '0.2.14',
    date: '2026-03-07',
    changes: [
      { type: 'mobile',  text: 'Diseño del paso 2 (Sincronización) rediseñado para móvil: controles en dos filas, más espacio y fácil de usar con el pulgar.' },
      { type: 'mobile',  text: 'La sección de configuración de voces se oculta automáticamente en pantallas pequeñas.' },
      { type: 'new',     text: 'La línea de tiempo en el paso 3 ahora muestra la canción completa de un vistazo.' },
      { type: 'new',     text: 'Control de zoom para la línea de tiempo: niveles ×1, ×2, ×4, ×8 y ×16.' },
      { type: 'new',     text: 'Gestos de pellizco (pinch-to-zoom) en la línea de tiempo.' },
      { type: 'improve', text: 'La reproducción hace scroll automático para mantener el cursor visible al navegar con zoom.' },
    ],
  },
  {
    version: '0.2.13',
    date: '2026-02',
    changes: [
      { type: 'improve', text: 'Nuevas opciones para configurar las letras secundarias: tamaño, posición y estilo independientes.' },
    ],
  },
  {
    version: '0.2.12',
    date: '2026-02',
    changes: [
      { type: 'improve', text: 'Modo pantalla completa mejorado en el paso de exportación.' },
      { type: 'improve', text: 'Control de volumen accesible directamente en la previsualización del paso 4.' },
    ],
  },
  {
    version: '0.2.11',
    date: '2026-01',
    changes: [
      { type: 'new',    text: 'Nuevos efectos visuales para la barra de progreso del karaoke.' },
      { type: 'new',    text: 'Más tipografías disponibles para personalizar el texto de las letras.' },
    ],
  },
  {
    version: '0.2.10',
    date: '2026-01',
    changes: [
      { type: 'improve', text: 'Mejoras en el panel de ajuste de tiempos: edición más precisa y ágil.' },
    ],
  },
  {
    version: '0.2.9',
    date: '2025-12',
    changes: [
      { type: 'improve', text: 'La barra de herramientas del paso 3 ahora puede colapsarse para ganar espacio en la línea de tiempo.' },
      { type: 'visual',  text: 'Diseño más compacto y organizado en el panel de ajuste.' },
    ],
  },
  {
    version: '0.2.7',
    date: '2025-12',
    changes: [
      { type: 'new',    text: 'Nuevos efectos de animación para el video de exportación.' },
      { type: 'new',    text: 'Soporte para múltiples voces con un color personalizable por cada una.' },
    ],
  },
  {
    version: '0.2.5',
    date: '2025-11',
    changes: [
      { type: 'improve', text: 'Interfaz simplificada: se eliminó la sección de proyectos para mayor claridad.' },
    ],
  },
  {
    version: '0.2.4',
    date: '2025-11',
    changes: [
      { type: 'fix',  text: 'Corrección de rutas de carpetas y configuración inicial de la aplicación.' },
      { type: 'new',  text: 'Primera versión alpha disponible para pruebas.' },
    ],
  },
  {
    version: '0.2.3',
    date: '2025-10',
    changes: [
      { type: 'visual',  text: 'Mejoras visuales generales en todos los paneles.' },
      { type: 'new',     text: 'Más efectos de animación disponibles para el video.' },
      { type: 'new',     text: 'Opción para exportar el video en formato MP4.' },
      { type: 'new',     text: 'Mayor personalización del video: fondo, márgenes y colores.' },
      { type: 'fix',     text: 'Corrección en la barra de tiempo y sincronización de reproducción.' },
    ],
  },
  {
    version: '0.2.0',
    date: '2025-09',
    changes: [
      { type: 'new',     text: 'Migración completa a React + Vite: aplicación más rápida y fluida.' },
      { type: 'new',     text: 'Biblioteca de proyectos: tarjetas visuales, guardado automático y restauración.' },
      { type: 'visual',  text: '11 animaciones de entrada, 8 temas de color y fondo animado.' },
      { type: 'new',     text: 'Guardado del archivo LRC y el video en la carpeta del proyecto.' },
      { type: 'improve', text: 'Navegación por pasos más inteligente al cargar un proyecto existente.' },
    ],
  },
  {
    version: '0.1.0',
    date: '2025-08',
    changes: [
      { type: 'new', text: 'Lanzamiento inicial de Makereoke.' },
      { type: 'new', text: 'Carga de audio, sincronización de letras en formato LRC y exportación de video karaoke.' },
    ],
  },
];
