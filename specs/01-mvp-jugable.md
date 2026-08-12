# SPEC 01 — MVP jugable de Arkanoid

> **Status:** approved
> **Depends on:** ninguno
> **Date:** 2026-08-12
> **Objective:** Un único nivel jugable de Arkanoid en canvas, con pala controlada por teclado, bola con rebote de ángulo variable, bloques que se rompen sumando puntaje, 3 vidas, y pantallas de victoria/derrota con reinicio.

---

## Scope

**In:**

- Canvas HTML de 800x600px, un solo archivo `index.html` + `style.css` + `game.js`.
- Pala movida con flechas izquierda/derecha del teclado.
- Bola con física simple: rebote en paredes (arriba, izquierda, derecha), rebote en pala con ángulo variable según punto de impacto, rebote en bloques.
- Grid de bloques: 5 filas x 8 columnas, un color distinto por fila (`red`, `yellow`, `green`, `cyan`, `magenta` de `SPRITES.blocks`), todos se rompen de un golpe.
- Sistema de 3 vidas: al caer la bola por debajo de la pala se pierde una vida, pala y bola vuelven a posición inicial y la bola queda pegada a la pala hasta que el usuario presione una tecla para lanzarla.
- Puntaje simple: +10 puntos por cada bloque roto, sin importar color.
- HUD visible: puntaje actual y vidas restantes.
- Pantalla de victoria (se limpiaron todos los bloques) y de derrota (0 vidas), ambas con botón de reinicio que resetea el estado completo del juego.
- Reutiliza `assets/spritesheet.js` (`loadSpritesheet`, `drawSprite`) y `assets/spritesheet-breakout.png` para dibujar pala, bola y bloques.

**Out of scope (para futuros specs):**

- Sonido (`assets/sounds/ball-bounce.mp3`, `break-sound.mp3`).
- Persistencia de highscore (localStorage).
- Múltiples niveles / progresión.
- Power-ups.
- Control por mouse.
- Pausa manual (tecla Esc/pausa).
- Versión móvil / touch.

---

## Data model

```js
// Estado global del juego
const state = {
  screen: 'playing', // 'playing' | 'won' | 'lost'
  score: 0,
  lives: 3,
  ballAttached: true, // true = bola pegada a pala, esperando input para lanzar

  paddle: { x: 320, y: 560, w: 162, h: 14, speed: 8 },

  ball: { x: 401, y: 546, r: 8, vx: 0, vy: 0, speed: 5.6 },

  bricks: [/* { x, y, w: 90, h: 24, color: 'red'|'yellow'|'green'|'cyan'|'magenta', alive: true } */],
};
```

Convenciones:

- Origen de coordenadas: esquina superior izquierda del canvas.
- Velocidades en píxeles/frame (loop vía `requestAnimationFrame`).
- Grid de bloques: 8 columnas x 90px, gap 5px, margen izquierdo 25px (8\*90 + 7\*5 = 755px, cabe en 800px). 5 filas x 24px de alto, gap 5px, margen superior 40px.
- `state.bricks` se genera al iniciar/reiniciar el juego; fila 0 = `red`, fila 1 = `yellow`, fila 2 = `green`, fila 3 = `cyan`, fila 4 = `magenta`.

---

## Implementation plan

1. Crear `index.html` con canvas 800x600, enlazando `assets/spritesheet.js`, `style.css` y `game.js`. Prueba manual: la página carga sin errores de consola y muestra canvas vacío.
2. En `game.js`, cargar el spritesheet (`loadSpritesheet`) y dibujar la escena estática inicial: pala, bola pegada a pala, grid completo de 40 bloques. Prueba manual: se ve la escena fija correctamente posicionada.
3. Implementar movimiento de pala con flechas (`keydown`/`keyup`) dentro de un loop `requestAnimationFrame`, con límites del canvas. Prueba manual: la pala se mueve izquierda/derecha sin salirse del canvas.
4. Implementar movimiento de la bola y rebote contra paredes (arriba, izquierda, derecha); si cae por debajo del canvas, por ahora solo se detiene. Prueba manual: la bola se mueve y rebota en las 3 paredes.
5. Implementar colisión pala-bola con ángulo de salida variable según punto de impacto relativo al centro de la pala. Prueba manual: golpear con el borde de la pala cambia visiblemente el ángulo de rebote.
6. Implementar colisión bola-bloques: al impactar, el bloque se marca `alive: false`, deja de dibujarse, la bola rebota, y `state.score += 10`. Prueba manual: romper bloques suma puntaje visible en HUD (aunque el HUD final se agregue en paso 9, loguear en consola sirve de verificación intermedia).
7. Implementar pérdida de vida: si la bola cae por debajo de la pala, `state.lives -= 1`, se resetean posiciones de pala y bola, `state.ballAttached = true`. Si `state.lives === 0`, `state.screen = 'lost'`. Prueba manual: dejar caer la bola 3 veces dispara el estado de derrota.
8. Implementar lanzamiento de bola pegada a pala (cualquier tecla la lanza con ángulo inicial fijo hacia arriba) y detección de victoria cuando todos los bloques están `alive: false` (`state.screen = 'won'`). Prueba manual: romper todos los bloques dispara el estado de victoria.
9. Implementar HUD (puntaje y vidas en la parte superior del canvas) y overlays de victoria/derrota con botón "Reiniciar" que resetea `state` completo y vuelve a `screen: 'playing'`. Prueba manual: partida completa jugable de principio a fin, ganar y perder ambos reinician correctamente.

---

## Acceptance criteria

- [ ] El juego carga en el navegador sin errores en consola.
- [ ] Las flechas izquierda/derecha mueven la pala sin salirse del canvas.
- [ ] La bola rebota correctamente en paredes izquierda, derecha y superior.
- [ ] El ángulo de rebote en la pala cambia según el punto de impacto.
- [ ] Romper un bloque lo elimina visualmente y suma exactamente 10 puntos al score mostrado en el HUD.
- [ ] Perder las 3 vidas (bola cae 3 veces) muestra pantalla de derrota.
- [ ] Romper los 40 bloques muestra pantalla de victoria.
- [ ] El botón "Reiniciar" en ambas pantallas devuelve el juego al estado inicial (score 0, 3 vidas, 40 bloques, pala y bola en posición inicial).
- [ ] Tras perder una vida (sin llegar a 0), la bola queda pegada a la pala hasta presionar una tecla.

---

## Decisions

- **Sí:** control solo por teclado (flechas). Simplicidad para el MVP, sin lógica de tracking de mouse.
- **No:** control por mouse. Se puede agregar en spec futuro si se pide.
- **Sí:** un solo nivel fijo. Evita diseñar sistema de progresión/niveles para el MVP.
- **Sí:** ángulo de rebote variable en la pala. Es el comportamiento esperado de Arkanoid clásico, no agrega complejidad significativa.
- **Sí:** puntaje plano (10 puntos por bloque, sin importar color). Evita definir una tabla de valores por color en el MVP.
- **No:** sonido en el MVP. Se difiere, los assets ya existen (`assets/sounds/`) para un spec futuro.
- **No:** persistencia de highscore. Se difiere a spec futuro (localStorage).
- **Sí:** canvas fijo de 800x600px con archivos sueltos en raíz (`index.html`, `style.css`, `game.js`). Estructura mínima sin build tool, consistente con "zero dependencies" del proyecto.
- **Sí:** grid de 5 filas x 8 columnas con colores por fila usando `SPRITES.blocks` existente. Reutiliza el spritesheet sin inventar nuevos assets.

---

## What is **not** in this spec

- Sonido (rebote, rotura de bloque).
- Persistencia de highscore entre sesiones.
- Múltiples niveles o progresión.
- Power-ups.
- Control por mouse o touch.
- Pausa manual.

Cada uno de estos, si se implementa, va en su propio spec.
