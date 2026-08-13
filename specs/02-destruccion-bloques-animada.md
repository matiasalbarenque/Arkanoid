# SPEC 02 — Destrucción de bloques con animación

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-08-13
> **Objective:** Al romperse un bloque se reproduce sobre su posición una animación de explosión de 4 frames usando `EXPLOSION_FRAMES` del color correspondiente, creciendo desde el tamaño del bloque hasta una escala mayor, sin afectar la física de la bola.

---

## Scope

**In:**

- Al detectar colisión bola-bloque en `checkBrickCollision`, además de marcar `brick.alive = false`, se crea una entrada de explosión con la posición, tamaño y color del bloque.
- La animación recorre los 4 frames de `EXPLOSION_FRAMES[color]` a 150ms por frame (600ms de duración total por explosión), usando `drawFrame` de `assets/spritesheet.js`.
- El tamaño de dibujo de la explosión se escala respecto al tamaño del bloque roto (`EXPLOSION_SCALE = 1.4`, es decir, un 40% más grande que el bloque), en vez de usar el tamaño nativo del sprite (32×16).
- Esa escala final no aparece de golpe: al crearse, la explosión arranca al tamaño exacto del bloque (escala 1.0) y crece con easing (ease-out cuadrático) hasta `EXPLOSION_SCALE` en `EXPLOSION_GROW_DURATION` (500ms), dando un efecto de "pop". El crecimiento es independiente del avance de `frameIndex`: ambas animaciones (frames del sprite y escala) corren en paralelo sobre el mismo timestamp de creación.
- La bola rebota y sigue su física en el mismo frame en que se rompe el bloque; la explosión es un overlay puramente visual que no bloquea ni retrasa nada.
- Múltiples explosiones pueden estar activas simultáneamente (varios bloques rotos en sucesión rápida).
- Cada explosión se elimina automáticamente de la lista activa al completar su cuarto frame.
- La pantalla de victoria (`state.screen = 'won'`) se dispara igual que en SPEC 01, sin esperar a que termine la última animación de explosión en curso.
- Al reiniciar (`createInitialState`), la lista de explosiones activas se vacía junto con el resto del estado.

**Out of scope (para futuros specs):**

- Sonido de explosión (`assets/sounds/break-sound.mp3`).
- Animaciones para otros eventos (pérdida de vida, lanzamiento de bola, etc).
- Colores `hotpink` y `gray` de `EXPLOSION_FRAMES` (no usados por ningún `ROW_COLORS` actual, quedan disponibles para specs futuros que agreguen esos colores de fila).

---

## Data model

```js
// Nuevo campo en state (SPEC 01), inicializado en createInitialState()
explosions: [], // { x, y, w, h, color, frameIndex: 0, frameStartedAt: timestamp, startedAt: timestamp }
```

Convenciones:

- `x`, `y`, `w`, `h` son la posición y el tamaño del bloque roto (`brick.x`, `brick.y`, `brick.w`, `brick.h` = 90×24), no el tamaño nativo del sprite de explosión (32×16). El sprite se estira sobre ese tamaño (y su escala animada), igual que ya ocurre con los sprites de bloque.
- `frameStartedAt` se compara contra `performance.now()` en cada `update()`; al superar 150ms (`EXPLOSION_FRAME_DURATION`) se avanza `frameIndex` y se resetea `frameStartedAt`.
- `startedAt` se fija una sola vez al crear la explosión y no se resetea; se usa en `draw()` para calcular el progreso de la animación de escala (crecimiento de 1.0 a `EXPLOSION_SCALE` en `EXPLOSION_GROW_DURATION` ms), independiente de `frameStartedAt`/`frameIndex`.
- Cuando `frameIndex` supera el último índice de `EXPLOSION_FRAMES[color]` (índice 3), la explosión se remueve de `state.explosions`.

---

## Implementation plan

1. Agregar `explosions: []` a `createInitialState()` en `game.js`. Prueba manual: el juego sigue cargando y jugándose igual que antes, sin cambios visibles.
2. En `checkBrickCollision`, al romper un bloque (`brick.alive = false`), hacer `push` a `state.explosions` de una nueva entrada `{ x: brick.x, y: brick.y, w: brick.w, h: brick.h, color: brick.color, frameIndex: 0, frameStartedAt: performance.now(), startedAt: performance.now() }`. Prueba manual: en consola, loguear `state.explosions.length` tras romper un bloque y confirmar que crece.
3. Implementar función `updateExplosions()` que avanza `frameIndex` de cada explosión activa según el tiempo transcurrido (150ms por frame) y elimina del array las que completaron los 4 frames; llamarla desde `update()`. Prueba manual: loguear cuando una explosión se elimina del array tras ~600ms.
4. Implementar `drawExplosions()` que dibuja cada explosión activa con `drawFrame(ctx, EXPLOSION_FRAMES[color][frameIndex], x, y, w, h)`, donde `w`/`h` parten del tamaño del bloque (`explosion.w`/`explosion.h`) multiplicado por una escala animada: `scale = 1 + (EXPLOSION_SCALE - 1) * eased`, con `eased` un ease-out cuadrático sobre `t = min(1, (now - explosion.startedAt) / EXPLOSION_GROW_DURATION)`; `x`/`y` se recalculan para mantener la explosión centrada sobre el hueco del bloque a medida que crece. Llamarla desde `draw()` después de dibujar los bloques vivos. Prueba manual: romper un bloque muestra la explosión apareciendo al tamaño del bloque y creciendo hasta ~1.4x mientras recorre los 4 frames, centrada sobre el hueco.
5. Verificar reinicio: confirmar que `createInitialState()` (ya usado por el botón "Reiniciar") deja `explosions` en `[]` al reiniciar con animaciones en curso. Prueba manual: romper un bloque, reiniciar antes de que termine la animación, confirmar que no quedan restos de explosión en la nueva partida.

---

## Acceptance criteria

- [x] Al romper un bloque se ve una animación de 4 frames de explosión sobre su posición, con el color correspondiente a la fila del bloque.
- [x] La explosión arranca al tamaño del bloque roto y crece suavemente hasta ~1.4x ese tamaño (`EXPLOSION_SCALE`) en 500ms (`EXPLOSION_GROW_DURATION`), permaneciendo centrada sobre el hueco del bloque mientras crece.
- [x] La animación dura aproximadamente 600ms (150ms por frame) y luego desaparece sin dejar rastro.
- [x] La bola rebota y continúa su movimiento en el mismo frame en que se rompe el bloque, sin pausas ni retrasos causados por la animación.
- [x] Romper varios bloques en rápida sucesión muestra varias animaciones de explosión simultáneas, cada una independiente.
- [x] Romper el último bloque muestra la pantalla de victoria sin esperar a que termine su animación de explosión.
- [x] Reiniciar la partida mientras hay animaciones en curso no deja explosiones residuales visibles en la nueva partida.

---

## Decisions

- **Sí:** física de la bola inmediata, animación como overlay cosmético puro. Evita agregar un estado de pausa por bloque y mantiene el loop simple.
- **No:** bola espera a que termine la animación. Rompe el flujo de juego clásico de Arkanoid y complica el estado sin beneficio.
- **Sí:** 150ms por frame (600ms total). Da tiempo suficiente para percibir la secuencia de 4 frames sin sentirse lenta.
- **Sí:** `state.explosions[]` como array separado en vez de campo por bloque. Los bloques ya se eliminan de la lógica de colisión al morir; una lista independiente de animaciones activas es más simple de recorrer y limpiar.
- **Sí:** victoria se dispara de inmediato sin esperar animaciones. Consistente con el comportamiento ya definido en SPEC 01, sin agregar una condición extra de sincronización.
- **No:** colores `hotpink` y `gray` de `EXPLOSION_FRAMES`. Ningún `ROW_COLORS` los usa hoy; quedan disponibles pero fuera de este spec.
- **No:** sonido de explosión. Ya diferido explícitamente en SPEC 01 a un spec futuro.
- **Sí:** dibujar la explosión al tamaño del bloque (90x24) en vez del tamaño nativo del sprite (32x16). El sprite de 32x16 se veía notoriamente más chico que el bloque destruido, rompiendo la lectura visual del evento; se resuelve igual que los sprites de bloque, que ya se estiran a 90x24.
- **Sí:** escalar la explosión a 1.4x el tamaño del bloque (`EXPLOSION_SCALE`) en vez de dejarla exactamente al tamaño del bloque. Un ligero desborde sobre el hueco se lee mejor como "explosión" que un rectángulo exacto, siguiendo el estilo del Arkanoid original.
- **Sí:** animar el crecimiento de la escala (de 1.0 a `EXPLOSION_SCALE` en 500ms, con ease-out) en vez de aparecer directo al tamaño final. Un "pop" gradual se percibe más como una explosión que un cambio de tamaño instantáneo; el ease-out cuadrático da una desaceleración natural al final del crecimiento.
- **Sí:** el crecimiento de escala usa su propio timestamp (`startedAt`, fijado una vez) independiente de `frameStartedAt`/`frameIndex` (que se resetea cada 150ms). Mezclar ambos relojes haría que la escala se reiniciara en cada cambio de frame en vez de crecer una sola vez de forma continua.

---

## What is **not** in this spec

- Sonido de explosión (`assets/sounds/break-sound.mp3`).
- Animaciones para otros eventos del juego (pérdida de vida, lanzamiento, victoria/derrota).
- Soporte para colores de bloque `hotpink` y `gray`.

Cada uno de estos, si se implementa, va en su propio spec.
