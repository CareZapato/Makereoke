# Changelog

Todas las mejoras notables de Karaoke Video Maker se documentan en este archivo.

---

## [0.3.9] - 2026-03-10

### 🐛 Correcciones

#### ⏱️ Sistema de Tiempos del Logo Rehecho
- **Eliminados** los sliders "Primeros X segundos" y "Últimos X segundos" que causaban apariciones erráticas del logo
- Reescrita la función `_drawWatermark` con lógica limpia basada puramente en arrays de rangos; ya no hay condiciones ambiguas

### ✨ Nuevas Funcionalidades

#### 🗓️ Hasta 3 Rangos de Tiempo para el Logo
Define hasta 3 ventanas de tiempo independientes donde aparece el logo:
- **Rango 1**, **Rango 2**, **Rango 3**: cada uno tiene su propio toggle y sliders Desde/Hasta (en segundos)
- Los rangos son independientes, pueden solaparse o estar separados
- **Sin rangos activos**: el logo aparece continuamente durante todo el video
- Transición suave de 0.5 s al entrar y salir de cada rango

#### 🎬 Logo sobre Intro y Outro
- El logo ahora se dibuja también cuando el video está en la pantalla de intro o de outro
- Respeta la misma configuración de rangos que el resto del video

---

## [0.3.8] - 2026-03-10

### ✨ Nuevas Funcionalidades

#### 🪙🏅🌀🫧 Animaciones de Medalla y Moneda para el Logo
Cuatro nuevas animaciones continuas pensadas para darle vida al logo del video:
- **Moneda** 🪙: el logo gira sobre su eje Y simulando el volteo de una moneda, con un destello al pasar por el punto de giro
- **Péndulo** 🏅: oscila como una medalla colgante, rotando suavemente desde la parte superior con movimiento sinusoidal
- **Girar** 🌀: rotación continua de 360° — ideal para logos circulares o icónicos
- **Flotar** 🫧: movimiento vertical suave con un leve pulso de escala que da sensación de flotación

### 🐛 Correcciones

#### Controles del Logo Siempre Visibles
- Todos los controles del logo (opacidad, tamaño, posición, efectos visuales, animaciones y tiempos) ahora están siempre visibles en la sección «🖼️ Logo del video» sin necesidad de un panel oculto
- El toggle «Mostrar logo» únicamente controla si el logo se dibuja en el video — ya no oculta los controles
- Toda la lógica de estado del logo se inicializa al entrar al Paso 4, solucionando un bug donde los controles no respondían al arrancar la aplicación

---

## [0.3.7] - 2026-03-10

### ✨ Nuevas Funcionalidades

#### ⏱️ Control Total de Tiempo para el Logo en el Video
El logo (marca de agua) ahora soporta tres modos de aparición temporal, combinables entre sí:
- **Primeros X segundos**: el logo aparece solo al inicio de la canción
- **Últimos X segundos**: aparece solo en los últimos momentos
- **Rango personalizado**: define un intervalo exacto [desde → hasta] en segundos para que el logo aparezca únicamente en esa franja (activa el toggle “Rango personalizado”)
- Por defecto, si no hay ningún rango activo, el logo se muestra continuamente

#### 🎞️ Animaciones del Logo
Elige cómo entra y sale el logo de pantalla en cada ventana de tiempo:
- **Sin animación** ⬜: aparece y desaparece instantáneamente
- **Fundido suave** 🌫️: transición de opacidad gradual (0.5 s)
- **Deslizar** ➡️: entra/sale desde el lado de la pantalla
- **Zoom** 🔍: aparece/desaparece con efecto de escala

#### 🎨 8 Nuevos Efectos de Primer Plano
Nueva categoría **Retro** y 7 efectos adicionales distribuidos entre las categorías existentes:
- **Lluvia** 🌧️, **Humo** 💨 (Naturaleza)
- **Globos** 🎈, **Diamantes** 💎 (Festivo)
- **Meteoritos** ☄️, **Aurora Boreal** 🌌 (Sci-fi)
- **Piano** 🎹 (Música)
- **Scanlines** 📺 (nueva categoría Retro)

### 💫 Mejoras

- **Logo, controles de tiempo**: los modos “Primeros X s” y “Últimos X s” ahora aplican transiciones de fade suave al aparecer y desaparecer, en lugar de corte abrupto.

### 🐛 Correcciones

- **Logo manual del intro/outro**: eliminado el logo antiguo dibujado manualmente con canvas (clapperboard + micrófono) que aparecía siempre en la esquina superior derecha del intro y outro, independientemente de la configuración. Ahora solo existe el logo SVG del nuevo sistema de marca de agua.

---

## [0.3.6] - 2026-03-10

### ✨ Nuevas Funcionalidades

#### 🎨 Fondos Sólidos (17 colores)
Nueva categoría de fondos **"Sólido"** con 17 colores lisos para el video: negro, blanco, azul marino, azul rey, morado, violeta, rojo, escarlata, rosa, magenta, naranja, verde esmeralda, verde oliva, turquesa, café y más. Útiles para proyectos minimalistas o cuando las letras son lo principal.

#### 🎨 Fondos con Textura (10 texturas)
Nueva categoría **"Textura"** con 10 fondos estáticos de textura: lunares, rayas horizontales, rayas diagonales, cuadros, cruzado, puntos, hexagonales, triángulos, diamantes y madera. Cada textura usa la paleta de colores del tema activo.

#### 💧 Sello del Logo en el Video (Marca de Agua)
Nueva opción en el Paso 4 para estampar el logo de Makereoke en el video exportado:
- **Opacidad**: controla qué tan visible es el logo (3–100%)
- **Tamaño**: ajusta el ancho del logo como porcentaje del video (5–60%)
- **Posición**: elige dónde aparece — arriba izquierda, arriba derecha, centro, abajo derecha, abajo izquierda o modo rotación (recorre las esquinas cada 40 s)
- El logo se muestra con sus colores reales (púrpura) con sombra sutil para legibilidad en cualquier fondo

#### 📺 Controles en Pantalla Completa
Al entrar en pantalla completa en el Paso 4, ahora aparece una **barra de controles** en la parte inferior del video:
- **Barra de tiempo**: arrastra para navegar a cualquier punto del audio
- **Botón Reproducir/Pausar**
- **Selector de velocidad** (×0.25 a ×2)
- **Botón Salir** de pantalla completa
Los controles son semi-transparentes y no interrumpen la visualización.

### 💫 Mejoras Visuales

#### 🧑‍🎨 Cabecera Rediseñada
- Fondo blanco limpio con sombra sutil
- **Altura ampliada** (130 px) para dar más protagonismo al logo
- **Botón de colapsar** (▴/▾): comprime la cabecera a 56 px para ganar espacio en pantalla
- En pantallas pequeñas (≤ 600 px) la cabecera siempre aparece compacta
- **Etiqueta de versión** reposicionada al pie del logo (esquina inferior derecha de la cabecera) — presiona para ver este historial de cambios
- Indicadores de pasos en esquema claro con círculos de color sobre fondo blanco

### 🐛 Correcciones

- **Exportación a 60 fps**: corregido un bloqueo completo del navegador al exportar con WebCodecs en 60 fps. La solución involucró mejorar el perfil H.264 (Level 4.2/5.2), ajustar el perfil VP9 (Level 4.1), incluir `framerate` en la configuración del encoder y usar timestamps basados en enteros para evitar deriva de tiempo
- **Sello del logo**: corregido un error que mostraba el logo como silueta blanca en lugar de sus colores originales (se eliminaba el filtro `brightness(0) invert(1)` incorrecto)

---

## [0.3.5] - 2026-03-09

### ✨ Nuevas Funcionalidades

#### 🎬 Carta de Outro
- Nuevo módulo `outro.js` (espejo de `intro.js`) con soporte de `mirrorFrom(introConfig)`
- Nueva sección **"🎬 Outro del video"** en el Paso 4 con todos los controles del intro: activar/desactivar, duración, título, artista, colores, tamaño de texto, estilos visuales (15), transiciones (6), logo
- Toggle **"Espejo del intro"**: cuando activo, el outro copia automáticamente la configuración visual del intro
- Botón **"↩ Copiar configuración del intro"** para sincronizar manualmente
- El renderer soporta `outroConfig` en `drawFrame` y `drawOutroFrame()` que reutiliza la lógica del intro con tiempo remapeado

#### 🔚 Fin de Letra (lyricsEndTime)
- Nueva fila **"⏹ Fin de letra"** al pie de la lista de sincronización (Paso 2): botón **"Marcar aquí"** que registra el momento exacto en que deja de mostrarse la última frase
- El renderer blanquea completamente la pantalla de letras después del `lyricsEndTime` (ya no muestra la última frase congelada)
- `lyricsEndTime` también determina la duración real del último segmento de avance karaoke

#### 🎬 Marcadores de Intro/Outro en el Paso 2
- Nueva fila **"🎬 Inicio de letra (fin del intro)"** al inicio de la lista de sincronización: establece `Intro.duration` al tiempo actual y activa el intro automáticamente
- Nueva fila **"🎬 Inicio del outro"** al final de la lista: establece `Outro.duration` = `duración_total − tiempo_actual` y activa el outro
- El **waveform canvas** ahora dibuja:
  - Banda **violeta semitransparente** para el intro con etiqueta "INTRO"
  - Línea **roja punteada** para el fin de letra con ícono ⏹
  - Banda **teal semitransparente** para el outro con etiqueta "OUTRO"

#### 🎤 Colores por Voz en Paso 4
- Nueva sección **"🎤 Colores por voz"** en la pestaña Tipografía del Paso 4
- Pickers de color dinámicos generados por `_buildExportVoiceColors()` para cada voz activa
- Los cambios se sincronizan con los pickers del Paso 2 y Paso 3 en tiempo real via `Sync.setVoiceColor()`

#### 🎯 Estilos de Relleno Karaoke
- Nueva grilla **"🎯 Relleno karaoke"** en Tipografía del Paso 4 con 4 modos:
  - **Default**: clip rectangular clásico
  - **Glow Edge**: avance luminoso con destello en el borde de revelado
  - **Gradiente**: relleno de color a blanco
  - **Por Palabra**: revelado palabra a palabra

#### 💧 Marca de Agua
- Nueva opción **"Marca de agua (Karaoke Video Maker)"** en Tipografía del Paso 4
- Aparece como texto rotado (-20°) en esquinas alternas cada 45 segundos, con fade-out final
- Corregido: ya no se requería esperar 0.8 s para que apareciera en preview — ahora es visible inmediatamente al activar el toggle

#### ✨ Nuevos Efectos de Texto
- **Aparecer**: fade-in suave de la línea activa
- **Subir**: slide-up + fade-in desde abajo
- **Typing**: efecto máquina de escribir carácter a carácter con cursor parpadeante
- **Vibrar**: micro-temblor aleatorio

#### 📁 Nombre de archivo de video
- El nombre del video exportado ahora incluye artista y título: `Artista - Título.mp4` (tomados de la configuración del intro)
- Aplica en los tres métodos de exportación: MediaRecorder, AVI writer y WebCodecs

### 🐛 Correcciones

- **Marca de agua**: eliminado el fade-in inicial de 0.8 s que impedía verla en preview al activar el toggle; ahora aparece de inmediato con opacidad completa y solo hace fade-out al final del ciclo
- **Último verso**: el `lyricsEndTime` ahora borra correctamente la letra de pantalla en lugar de dejarla congelada
- **Relleno "palabra"**: completada implementación del modo de relleno por palabra que quedó truncada en la sesión anterior
- **export-engine.js**: corregida llave `}` faltante en `getRenderOpts()` que producía error de sintaxis

---

## [0.3.4] - 2026-03-07

### ✨ Nuevas Animaciones (12)

#### Naturaleza
- **🌙 Luna**: Animación con fases realistas (llena, media, cuarto) que cambian con el tiempo, con cráteres y resplandor
- **🌺 Primavera**: Flores de colores con pétalos animados, partículas brillantes flotantes
- **☀️ Verano**: Sol radiante con manchas solares, rayos animados y olas del mar con efecto de espuma
- **🍂 Otoño**: Hojas cayendo (🍂🍁🌰) con movimiento natural, árboles con follaje
- **❄️ Invierno**: Nieve cayendo con efecto drift, carámbanos colgantes con animación
- **🌾 Campo**: Paisaje con colinas ondulantes, nubes en movimiento, flores silvestres

#### Espacio
- **🪐 Planetas**: Planetas viajeros con órbitas realistas, rotación de superficie, algunos con anillos y lunas

#### Digital
- **🌆 Synthwave**: Estética retro con sol de neón, grid de perspectiva animado, palmeras silueta y estrellas en movimiento

#### Temático (Nueva Categoría)
- **🎌 Anime**: Estilo cómic manga con speed lines, explosión de poder, efectos de impacto y pétalos de sakura
- **🤘 Metal**: Fuego intenso con calaveras 3D como sombras que aparecen y se diluyen, efecto glow rojo
- **🌸 Cerezos**: Ramas de cerezo con pétalos cayendo suavemente (sakura japonés)
- **🏙️ Urbano**: Edificios con perspectiva 3D, sombras realistas, ventanas iluminadas, niebla urbana y postes de luz

### 🎨 Mejoras a Animaciones Existentes

- **Synthwave**: Agregadas estrellas en movimiento, sol con efecto de escaneo, grid de carretera con scroll animado, palmeras con hojas animadas
- **Agujero Negro**: Disco de acreción en 3 capas con rotación diferencial, distorsión gravitacional, anillo de fotones brillante, horizonte de eventos mejorado
- **Verano**: Sol con gradiente multicapa y manchas solares animadas, 16 rayos con variación de intensidad, olas del mar totalmente rellenas con múltiples capas y crestas brillantes
- **Planetas**: Perspectiva gran angular con distorsión, rotación visible de superficie con bandas atmosféricas, traslación orbital, lunas orbitales, texturas realistas con cráteres, anillos mejorados
- **Metal**: Fuego más intenso, calaveras renderizadas como sombras 3D con efecto de profundidad, cuencas de ojos, nariz, mandíbula y dientes dibujados
- **Anime**: Convertido a estilo cómic manga con speed lines radiales, explosión de poder central, efectos de impacto, pétalos geométricos, ondas de energía y chispas brillantes
- **Urbano**: Edificios con sombras y perspectiva 3D (lado + techo visibles), ventanas con marcos y reflejos realistas, niebla urbana en capas, postes de luz con glow

### 🎭 Mejoras a Estilos de Intro

- **Teatro**: Telón de terciopelo con 18 pliegues realistas y sombras, textura de terciopelo, borlas doradas animadas en la parte superior con cuerdas, ornamentos dorados mejorados para el título
- **Escenario**: Spotlight mejorado con haz de luz cónico definido, partículas de polvo visibles en el haz de luz, luces laterales azuladas, piso con reflejo sutil, eliminado el efecto de asterisco amarillo

### 🐛 Correcciones

- **Planetas**: Corregido error `IndexSizeError` cuando el radio de la elipse de los anillos era negativo. Ahora se asegura que `ringTilt` siempre sea positivo usando `Math.abs()`

---

## [0.3.3] - 2026-03-07

### ✨ Nuevos Estilos Visuales para Intro (7)

- **Clásico**: Diseño limpio y atemporal con fondos sutiles
- **Gamer**: Estética gaming con elementos neón y tecnológicos
- **Metal**: Intenso con efectos de fuego y elementos oscuros
- **Fotografía**: Elegante con marcos y efectos estilo galería de fotos
- **Espacial**: Temática del espacio con estrellas y nebulosas
- **Teatro**: Telón rojo con cortinas teatrales
- **Escenario**: Spotlight de escenario con iluminación dramática

### ✨ Nuevas Transiciones (6)

Transiciones modernas para entrada y salida de la intro:
- **Deslizar hacia abajo**: La intro baja suavemente
- **Cortina izquierda**: Efecto de cortina desde la izquierda
- **Cortina derecha**: Efecto de cortina desde la derecha
- **Círculo expandido**: Transición circular que se expande desde el centro
- **Cortina abierta**: Las cortinas se abren desde el centro
- **Empuje hacia arriba**: La intro sube con efecto de empuje

### 🎨 Mejoras

- **Transiciones de salida personalizables**: Ahora puedes elegir una transición diferente para el final de la intro
- **Auto-navegación en prueba de transiciones**: Al probar transiciones, el video salta automáticamente al inicio o final de la intro para ver el efecto en acción

### 🐛 Correcciones

- **Transiciones visuales**: Corregido bug que hacía que las transiciones dejaran de funcionar al cambiar entre diferentes efectos

---

## Versiones Anteriores

Para ver el historial completo de versiones anteriores, consulta el archivo `src/lib/changelog.js` que incluye cambios desde la versión 0.1.0.
