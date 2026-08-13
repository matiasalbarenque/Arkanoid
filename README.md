# Juego de Arkanoid

Juego de Arkanoid en HTML, CSS y JavaScript puro. Cero dependencias, sin `package.json` ni build tool.

## Cómo jugar

Abrir `index.html` en el navegador. No requiere servidor ni instalación.

## Estado del proyecto

MVP jugable implementado, con mejoras incrementales vía specs:

- **SPEC 01** — MVP jugable: nivel único en canvas, pala controlada por teclado, bola con rebote de ángulo variable, bloques que suman puntaje, 3 vidas, pantallas de victoria/derrota con reinicio.
- **SPEC 02** — Destrucción de bloques animada: explosión de 4 frames al romperse un bloque.
- **SPEC 03** — Sonidos de colisiones: sonido al rebotar la bola y al romperse un bloque o perder una vida.
- **SPEC 04** — Boost de agrandar pala: ítem que cae ocasionalmente y, al ser atrapado, agranda la pala y acelera la bola de forma temporal.

Detalle completo de cada spec en `specs/01-mvp-jugable.md` a `specs/04-boost-agrandar-pala.md`.

## Estructura

- `index.html`, `style.css`, `game.js` — juego.
- `assets/spritesheet-breakout.png` + `assets/spritesheet.js` — sprites de bloques y animaciones.
- `assets/icons/star.png` — ícono del boost.
- `assets/sounds/` — efectos de sonido (`ball-bounce.mp3`, `break-sound.mp3`, `boost.mp3`).
- `specs/` — specs numeradas del desarrollo (workflow `/spec` y `/spec-impl`).

## Workflow de desarrollo

Repo usa comandos `/spec` y `/spec-impl` para desarrollo guiado por specs. Ver `CLAUDE.md` para detalle.
