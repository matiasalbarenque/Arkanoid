# SPEC 02 — Destrucción de bloques con animación

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-08-13
> **Objective:** Al romperse un bloque se reproduce sobre su posición una animación de explosión de 4 frames usando `EXPLOSION_FRAMES` del color correspondiente, sin afectar la física de la bola.

---

## Scope

**In:**

- Al detectar colisión bola-bloque en `checkBrickCollision`, además de marcar `brick.alive = false`, se crea una entrada de explosión con la posición y color del bloque.
- La animación recorre los 4 frames de `EXPLOSION_FRAMES[color]` a 150ms por frame (600ms de duración total por explosión), usando `drawFrame` de `assets/spritesheet.js`.
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
explosions: [], // { x, y, w: 32, h: 16, color, frameIndex: 0, frameStartedAt: timestamp }
```

Convenciones:

- `x`, `y` son la posición del bloque roto (`brick.x`, `brick.y`); tamaño de dibujo fijo en 32x16 (tamaño nativo de `EXPLOSION_FRAMES`), centrado sobre el hueco del bloque de 90x24 si no coincide el tamaño.
- `frameStartedAt` se compara contra `performance.now()` (o timestamp de `requestAnimationFrame`) en cada `update()`; al superar 150ms se avanza `frameIndex` y se resetea `frameStartedAt`.
- Cuando `frameIndex` supera el último índice de `EXPLOSION_FRAMES[color]` (índice 3), la explosión se remueve de `state.explosions`.

---

## Implementation plan

1. Agregar `explosions: []` a `createInitialState()` en `game.js`. Prueba manual: el juego sigue cargando y jugándose igual que antes, sin cambios visibles.
2. En `checkBrickCollision`, al romper un bloque (`brick.alive = false`), hacer `push` a `state.explosions` de una nueva entrada `{ x: brick.x, y: brick.y, color: brick.color, frameIndex: 0, frameStartedAt: performance.now() }`. Prueba manual: en consola, loguear `state.explosions.length` tras romper un bloque y confirmar que crece.
3. Implementar función `updateExplosions()` que avanza `frameIndex` de cada explosión activa según el tiempo transcurrido (150ms por frame) y elimina del array las que completaron los 4 frames; llamarla desde `update()`. Prueba manual: loguear cuando una explosión se elimina del array tras ~600ms.
4. Implementar `drawExplosions()` que dibuja cada explosión activa con `drawFrame(ctx, EXPLOSION_FRAMES[color][frameIndex], x, y, w, h)`; llamarla desde `draw()` después de dibujar los bloques vivos. Prueba manual: romper un bloque muestra visualmente la secuencia de 4 frames de explosión sobre su posición antes de desaparecer.
5. Verificar reinicio: confirmar que `createInitialState()` (ya usado por el botón "Reiniciar") deja `explosions` en `[]` al reiniciar con animaciones en curso. Prueba manual: romper un bloque, reiniciar antes de que termine la animación, confirmar que no quedan restos de explosión en la nueva partida.

---

## Acceptance criteria

- [ ] Al romper un bloque se ve una animación de 4 frames de explosión sobre su posición, con el color correspondiente a la fila del bloque.
- [ ] La animación dura aproximadamente 600ms (150ms por frame) y luego desaparece sin dejar rastro.
- [ ] La bola rebota y continúa su movimiento en el mismo frame en que se rompe el bloque, sin pausas ni retrasos causados por la animación.
- [ ] Romper varios bloques en rápida sucesión muestra varias animaciones de explosión simultáneas, cada una independiente.
- [ ] Romper el último bloque muestra la pantalla de victoria sin esperar a que termine su animación de explosión.
- [ ] Reiniciar la partida mientras hay animaciones en curso no deja explosiones residuales visibles en la nueva partida.

---

## Decisions

- **Sí:** física de la bola inmediata, animación como overlay cosmético puro. Evita agregar un estado de pausa por bloque y mantiene el loop simple.
- **No:** bola espera a que termine la animación. Rompe el flujo de juego clásico de Arkanoid y complica el estado sin beneficio.
- **Sí:** 150ms por frame (600ms total). Da tiempo suficiente para percibir la secuencia de 4 frames sin sentirse lenta.
- **Sí:** `state.explosions[]` como array separado en vez de campo por bloque. Los bloques ya se eliminan de la lógica de colisión al morir; una lista independiente de animaciones activas es más simple de recorrer y limpiar.
- **Sí:** victoria se dispara de inmediato sin esperar animaciones. Consistente con el comportamiento ya definido en SPEC 01, sin agregar una condición extra de sincronización.
- **No:** colores `hotpink` y `gray` de `EXPLOSION_FRAMES`. Ningún `ROW_COLORS` los usa hoy; quedan disponibles pero fuera de este spec.
- **No:** sonido de explosión. Ya diferido explícitamente en SPEC 01 a un spec futuro.

---

## What is **not** in this spec

- Sonido de explosión (`assets/sounds/break-sound.mp3`).
- Animaciones para otros eventos del juego (pérdida de vida, lanzamiento, victoria/derrota).
- Soporte para colores de bloque `hotpink` y `gray`.

Cada uno de estos, si se implementa, va en su propio spec.
