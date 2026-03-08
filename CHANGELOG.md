# Changelog

Todas las mejoras notables de Makereoke se documentan en este archivo.

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
