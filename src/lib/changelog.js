/* ============================================================
   changelog.js  —  Información del proyecto e historial de cambios
   ============================================================ */

export const PROJECT_INFO = {
  name: 'Karaoke Video Maker',
  description:
    'Crea videos karaoke desde tu navegador: carga tu audio, sincroniza las letras y exporta el video listo para compartir.',
  author: 'Zapato',
  lastUpdate: '2026-03-10',
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
    version: '0.3.9',
    date: '2026-03-10',
    changes: [
      { type: 'fix',     text: 'Rehecho el sistema de tiempos del logo: lógica de visibilidad reescrita, eliminados los sliders "Primeros X s" y "Últimos X s" que causaban apariciones erráticas.' },
      { type: 'new',     text: 'Hasta 3 rangos de tiempo independientes para el logo: activa "Rango 1", "Rango 2" y/o "Rango 3" con sus propios valores Desde/Hasta. Sin rangos activos, el logo aparece en todo el video.' },
      { type: 'new',     text: 'El logo ahora se dibuja también sobre la intro y el outro, respetando la configuración de rangos.' },
      { type: 'improve', text: 'Transición suave de 0.5 s al entrar y salir de cada rango.' },
    ],
  },
  {
    version: '0.3.8',
    date: '2026-03-10',
    changes: [
      { type: 'new',     text: 'Animación Moneda 🪙: el logo gira sobre el eje Y (efecto de voltear una moneda) con destellos en el punto de giro.' },
      { type: 'new',     text: 'Animación Péndulo 🏅: el logo oscila como una medalla colgante, rotando suavemente desde la parte superior.' },
      { type: 'new',     text: 'Animación Girar 🌀: rotación continua de 360° del logo, ideal para animaciones ágiles.' },
      { type: 'new',     text: 'Animación Flotar 🫧: el logo sube y baja suavemente con un leve pulso de escala, efecto fluido y elegante.' },
      { type: 'fix',     text: 'Controles del logo (opacidad, tamaño, posición, efecto visual, animación, tiempos) siempre visibles sin necesidad de panel oculto. El toggle “Mostrar logo” solo afecta el render.' },
      { type: 'fix',     text: 'Toda la lógica de estado del logo movida al momento de montaje del Paso 4 (setup) — ya no falla porque los elementos no existían al arrancar la app.' },
    ],
  },
  {
    version: '0.3.7',
    date: '2026-03-10',
    changes: [
      { type: 'fix',     text: 'Eliminado el logo antiguo dibujado manualmente con canvas (esquina superior derecha) del intro y outro — ahora solo existe el logo del nuevo sistema de marca de agua.' },
      { type: 'new',     text: 'Rango personalizado para la marca de agua: activa el toggle "Rango personalizado" y define un intervalo [desde → hasta] en segundos para que el logo aparezca únicamente en esa franja de la canción.' },
      { type: 'new',     text: 'Animaciones de entrada/salida del logo: Sin animación ⬜, Fundido suave 🌫️, Deslizar ➡️ y Zoom 🔍. El logo hace transición al aparecer y al desaparecer en cada ventana de tiempo.' },
      { type: 'improve', text: 'Controles "Primeros X s" y "Últimos X s" del logo ahora incluyen transiciones suaves de fade en lugar de corte abrupto.' },
      { type: 'new',     text: '8 nuevos efectos de primer plano: Lluvia 🌧️, Humo 💨 (Naturaleza); Globos 🎈, Diamantes 💎 (Festivo); Meteoritos ☄️, Aurora Boreal 🌌 (Sci-fi); Piano 🎹 (Música); Scanlines 📺 (nueva categoría Retro).' },
    ],
  },
  {
    version: '0.3.6',
    date: '2026-03-10',
    changes: [
      { type: 'new',     text: 'Fondos sólidos (17 colores): negro, blanco, grises, rojo, naranja, amarillo, verde, cian, azul, morado, rosa, marrón. Se muestran sin oscurecimiento para que el color sea exacto.' },
      { type: 'new',     text: '10 texturas de fondo estáticas: lunares, puntos finos, rayas horizontales/verticales, cuadros, hexágonos, diagonal, papel, mármol y madera. Se combinan con el tema de color activo.' },
      { type: 'new',     text: 'Sello del logo en el video exportado: opacidad (3–100%), tamaño (5–60% del ancho) y posición (↖ ↗ ↘ ↙ Centro o rotación entre esquinas). El logo se muestra con sus colores reales.' },
      { type: 'new',     text: 'Barra de controles en pantalla completa (Paso 4): barra de tiempo, reproducir/pausar, selector de velocidad y botón de salir aparecen como overlay semi-transparente al fondo del video.' },
      { type: 'visual',  text: 'Cabecera rediseñada: fondo blanco limpio, altura 130 px con logo grande, botón de colapsar (▴/▾) para comprimirla a 56 px y ganar espacio en pantalla.' },
      { type: 'visual',  text: 'Etiqueta de versión reposicionada al pie del logo (esquina inferior derecha de la cabecera). Presionala para ver este historial de cambios.' },
      { type: 'visual',  text: 'Indicadores de paso en tema claro: círculos y etiquetas en tonos oscuros sobre fondo blanco, paso activo en morado.' },
      { type: 'fix',     text: 'Exportación a 60 fps ya no congela el navegador: perfil H.264 mejorado (Level 4.2/5.2), VP9 Level 4.1, parámetro framerate incluido en el encoder y timestamps basados en enteros.' },
      { type: 'fix',     text: 'Sello del logo: corregido error que mostraba el logo como silueta blanca en lugar de sus colores originales (se eliminó el filtro CSS incorrecto).' },
    ],
  },
  {
    version: '0.3.5',
    date: '2026-03-09',
    changes: [
      // ── Outro ──
      { type: 'new',     text: 'Carta de outro con controles completos: estilo, transición (entrada/salida), colores, duración y texto. Toggle "Espejo del intro" para sincronizar automáticamente.' },
      { type: 'new',     text: 'Fin de letra (⏹): marca el momento en que la última frase desaparece; el canvas queda en limpio hasta el outro.' },
      { type: 'fix',     text: 'El outro ya no reiniciaba la animación desde cero; ahora usa el tiempo real de la canción para fondo y barra de progreso.' },
      // ── Intro / tipografía ──
      { type: 'new',     text: 'Tipografía del intro/outro: fuente, brillo y sombra independientes para título y artista.' },
      { type: 'new',     text: '4 nuevos estilos de intro/outro: Retro Pop 🎠, Invierno ❄️, VHS Retro 📼, Neon City 🌇.' },
      // ── Texto activo ──
      { type: 'new',     text: 'Sombra del texto: 4 tipos (Ninguna, Halo, Dura, Difusa) con color, difusión y desplazamiento.' },
      { type: 'new',     text: 'Contorno del texto: tipo (Sólido, Resplandor, Doble), color y grosor configurables.' },
      { type: 'new',     text: '5 nuevos estilos de relleno karaoke: Metálico (destello deslizante), Rayas (diagonales animadas), Ondulado (borde sinusoidal), Arcoíris (gradiente rotante), Pulso Neón.' },
      // ── Temas y animaciones ──
      { type: 'new',     text: '8 nuevos temas en categoría "Gradientes & Motivos": Arcoíris, Océano Profundo, Llamarada, Noche Estrellada, VHS, Vintage Sepia, Nevada, Nebulosa Cósmica.' },
      { type: 'new',     text: '6 nuevos temas claros: Campo (cielo+prado), Cielo (nubes), Papiro, Coral, Menta, Lavanda.' },
      { type: 'new',     text: '5 nuevas animaciones: Psicodélico (caleidoscopio), Hipnótico (espiral), Ritmo & Pulso (beat concéntrico), Viaje Espacial (hiperespacio), Láser Show.' },
      // ── Paso 2 ──
      { type: 'new',     text: 'Edición de letras en línea: doble clic en el Paso 2 para editar cualquier frase directamente.' },
      // ── Paso 4 ──
      { type: 'new',     text: 'Marcadores de intro/outro en waveform (Paso 2) y línea de tiempo (Paso 3).' },
      { type: 'new',     text: 'Colores por voz en Paso 4: un picker por cada voz activa.' },
      { type: 'new',     text: 'Nombre de archivo exportado: incluye artista y título automáticamente.' },
    ],
  },
  {
    version: '0.3.4',
    date: '2026-03-07',
    changes: [
      { type: 'new',     text: '12 nuevas animaciones de fondo: Luna, Primavera, Verano, Otoño, Invierno, Campo (naturaleza), Planetas (espacio), Synthwave (digital), Anime, Metal, Cerezos y Urbano (temático).' },
      { type: 'improve', text: 'Animaciones mejoradas: Synthwave con estrellas móviles y palmeras, Agujero Negro con disco de acreción en 3 capas, Verano con sol realista y olas rellenas.' },
      { type: 'improve', text: 'Planetas mejorados con perspectiva gran angular, rotación visible, traslación orbital, lunas y texturas realistas.' },
      { type: 'improve', text: 'Metal con fuego intenso y calaveras 3D como sombras, Anime convertido a estilo cómic manga con speed lines.' },
      { type: 'improve', text: 'Urbano con edificios en 3D, sombras realistas, ventanas con reflejos y postes de luz.' },
      { type: 'improve', text: 'Teatro mejorado con telón de terciopelo con 18 pliegues y borlas doradas animadas.' },
      { type: 'improve', text: 'Escenario mejorado con spotlight realista, partículas de polvo y luces laterales.' },
      { type: 'fix',     text: 'Corregido error IndexSizeError en animación de planetas cuando los anillos tenían radio negativo.' },
    ],
  },
  {
    version: '0.3.3',
    date: '2026-03-07',
    changes: [
      { type: 'new',     text: '7 nuevos estilos visuales para la intro: Clásico, Gamer, Metal, Fotografía, Espacial, Teatro y Escenario.' },
      { type: 'new',     text: '6 nuevas transiciones modernas: deslizar hacia abajo, cortina izquierda/derecha, círculo expandido, cortina abierta y empuje hacia arriba.' },
      { type: 'new',     text: 'Transiciones de salida personalizables: ahora puedes elegir una transición diferente para el final de la intro.' },
      { type: 'improve', text: 'Al probar transiciones, el video salta automáticamente al inicio o final de la intro para ver el efecto en acción.' },
      { type: 'fix',     text: 'Corregidas transiciones visuales que dejaban de funcionar al cambiar entre diferentes efectos.' },
    ],
  },
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
      { type: 'new', text: 'Lanzamiento inicial de Karaoke Video Maker.' },
      { type: 'new', text: 'Carga de audio, sincronización de letras en formato LRC y exportación de video karaoke.' },
    ],
  },
];
