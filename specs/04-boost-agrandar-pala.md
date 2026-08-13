# SPEC 04 — Boost de agrandar pala

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 03
> **Date:** 2026-08-13
> **Objective:** Cada cierto intervalo cae desde arriba del canvas, con baja probabilidad, un boost giratorio basado en `assets/icons/star.png` que al ser atrapado por la pala la agranda (acumulable, con tope) y aumenta la velocidad de la bola un 10% (acumulable), ambos efectos temporales y reseteados juntos tras 10 segundos.

---

## Scope

**In:**

- Cada `BOOST_CHECK_INTERVAL` (5000ms) se tira una probabilidad `BOOST_SPAWN_CHANCE` (10%) de spawnear un boost nuevo, en una posición X aleatoria dentro del ancho del canvas, y = 0.
- El boost cae a velocidad constante (`BOOST_FALL_SPEED`, 2px/frame) y rota sobre su propio eje (~180°/segundo) mientras cae, usando `assets/icons/star.png` como imagen (cargada aparte del spritesheet de bloques).
- Colisión rectángulo boost vs rectángulo pala (AABB simple, igual de estilo que la colisión bola-bloque existente): si se solapan, el boost se atrapa.
- Al atrapar un boost: el ancho de la pala aumenta un incremento fijo (`PADDLE_BOOST_STEP`, +20% del ancho base) respecto a su ancho actual boosteado, hasta un tope de `PADDLE_BOOST_MAX` (2x el ancho base); la velocidad de la bola (`ball.speed`) se multiplica x1.10 respecto a su valor boosteado actual; y se reinicia a `BOOST_DURATION` (10000ms) un único temporizador compartido por ambos efectos.
- Al agarrar el boost se reproduce `assets/sounds/boost.mp3` (precargado igual que los sonidos existentes, vía `playSound()`).
- Al expirar el temporizador (pasan los 10s sin agarrar otro boost), la pala vuelve de una sola vez a su ancho base y la bola vuelve de una sola vez a su velocidad base — no hay decaimiento gradual.
- Si el boost cae hasta salir del canvas por abajo sin ser atrapado, se elimina sin ningún efecto (ni sonido, ni penalidad).
- Perder una vida (`loseLife()`) o reiniciar la partida (`createInitialState()`) resetea de inmediato el ancho de la pala y la velocidad de la bola a sus valores base, cancela el temporizador activo, y vacía cualquier boost cayendo en ese momento.
- Múltiples boosts pueden estar cayendo en simultáneo (cada spawn es independiente del anterior).

**Out of scope (para futuros specs):**

- Otros tipos de boost/power-up (bola múltiple, láser, vida extra, etc.) — este spec cubre únicamente el de agrandar pala + velocidad de bola.
- Indicador visual en el HUD del tiempo restante del boost activo.
- Boosts que empeoran al jugador (power-downs).
- Ajustar la probabilidad/intervalo de spawn dinámicamente según progreso de la partida.
- Sprite animado o efecto de partículas al atrapar el boost (más allá del sonido).

---

## Data model

```js
// Nuevo campo en state, inicializado en createInitialState()
fallingBoosts: [], // { x, y, w, h, rotation }

// Nuevos campos en state.paddle, además de x/y/w/h/speed existentes
paddle: {
  ...,
  baseW: 81,        // ancho base sin boost, valor fijo igual al w inicial actual
  boostExpiresAt: null, // timestamp (performance.now()) en que expira el boost activo, o null si no hay boost activo
}

// Nuevo campo en state.ball, además de x/y/r/vx/vy/speed existentes
ball: {
  ...,
  baseSpeed: 4.48,  // velocidad base sin boost, valor fijo igual al speed inicial actual
}
```

Convenciones:

- `paddle.w` es siempre el ancho efectivo actual (base o boosteado); `paddle.baseW` nunca cambia salvo por `createInitialState()`.
- `ball.speed` es siempre la velocidad efectiva actual; `ball.baseSpeed` nunca cambia salvo por `createInitialState()`.
- `paddle.boostExpiresAt` es la única fuente de verdad sobre si hay boost activo: `null` = sin boost (w y speed en su valor base); con timestamp = boost activo, comparado contra `performance.now()` en cada `update()`.
- `x`, `y` de cada entrada en `fallingBoosts` son la esquina superior izquierda del sprite (tamaño fijo `BOOST_SIZE` = 24×24); `rotation` es el ángulo actual en radianes, incrementado cada frame en `draw()`/`update()` según la velocidad de rotación.
- El boost usa una imagen propia (`assets/icons/star.png`) cargada con un `Image()` independiente del spritesheet de bloques — no pasa por `loadSpritesheet`/`drawSprite`, porque ese módulo solo indexa `spritesheet-breakout.png`.

---

## Implementation plan

1. Declarar constantes de módulo en `game.js`: `BOOST_CHECK_INTERVAL`, `BOOST_SPAWN_CHANCE`, `BOOST_FALL_SPEED`, `BOOST_ROTATION_SPEED`, `BOOST_SIZE`, `PADDLE_BOOST_STEP`, `PADDLE_BOOST_MAX`, `BOOST_DURATION`; cargar `assets/icons/star.png` en un `Image()` de módulo (`boostImg`) con su propio flag de `loaded`; declarar y precargar `boostSound = new Audio('assets/sounds/boost.mp3')`. Prueba manual: el juego sigue cargando sin errores en consola, sin cambios visibles todavía.
2. Agregar `fallingBoosts: []` a `createInitialState()`, y los campos `baseW`/`boostExpiresAt` a `paddle`, `baseSpeed` a `ball`. Prueba manual: el juego sigue jugándose igual que antes.
3. Implementar `updateBoostSpawn()`: cada `BOOST_CHECK_INTERVAL` ms transcurridos desde el último chequeo, tira `Math.random() < BOOST_SPAWN_CHANCE` y si sale true agrega una entrada a `state.fallingBoosts` en X aleatoria (`Math.random() * (canvas.width - BOOST_SIZE)`), y = 0. Llamarla desde `update()`. Prueba manual: loguear en consola cuando spawnea un boost y confirmar que aparece cada tanto tiempo jugando varios minutos.
4. Implementar `updateFallingBoosts()`: mueve cada boost `y += BOOST_FALL_SPEED`, incrementa `rotation`, elimina los que salen del canvas por abajo (`y > canvas.height`) sin ningún efecto, y detecta colisión AABB contra `state.paddle` — al atrapar uno: aplicar `applyPaddleBoost()` (ver paso 5), reproducir `playSound(boostSound)`, y eliminar el boost atrapado del array. Llamarla desde `update()`. Prueba manual: dejar caer un boost sin mover la pala confirma que desaparece solo al llegar abajo; mover la pala para interceptarlo confirma que desaparece y agranda la pala.
5. Implementar `applyPaddleBoost()`: `paddle.w = Math.min(paddle.baseW * PADDLE_BOOST_MAX, paddle.w + paddle.baseW * PADDLE_BOOST_STEP)`; `ball.speed = ball.speed * 1.10`; `paddle.boostExpiresAt = performance.now() + BOOST_DURATION`. Prueba manual: agarrar boosts seguidos muestra la pala creciendo por pasos hasta detenerse en el doble del ancho base, sin pasarse.
6. Implementar chequeo de expiración dentro de `update()`: si `paddle.boostExpiresAt !== null && performance.now() >= paddle.boostExpiresAt`, resetear `paddle.w = paddle.baseW`, `ball.speed = ball.baseSpeed`, `paddle.boostExpiresAt = null`. Prueba manual: agarrar un boost y esperar 10s sin agarrar otro confirma que la pala y la velocidad de la bola vuelven de golpe a su tamaño/velocidad original.
7. En `loseLife()` y dentro de `createInitialState()` (ya usado por el botón "Reiniciar"), resetear `paddle.w = paddle.baseW`, `ball.speed = ball.baseSpeed`, `paddle.boostExpiresAt = null`, y vaciar `state.fallingBoosts = []`. Prueba manual: agarrar boosts, dejar caer la bola antes de que expiren, confirmar que la pala y velocidad vuelven a su base y no quedan boosts cayendo residuales; repetir con "Reiniciar".
8. Implementar `drawFallingBoosts()`: por cada entrada activa, `ctx.save()`, trasladar al centro del boost, `ctx.rotate(rotation)`, dibujar `boostImg` centrado con `drawImage` a tamaño `BOOST_SIZE`×`BOOST_SIZE`, `ctx.restore()`. Llamarla desde `draw()`, antes de dibujar la pala. Prueba manual: los boosts cayendo se ven girando visualmente de forma continua y fluida mientras caen.
9. Prueba manual final: partida completa donde se agarran varios boosts seguidos (pala llega al tope de ancho, velocidad de bola sube en cada uno), se deja expirar el timer (todo vuelve a base), se deja caer un boost sin agarrar (desaparece sin efecto), y se pierde una vida con boost activo (todo se resetea de inmediato); confirmar en consola que no hay errores en ningún caso.

---

## Acceptance criteria

- [ ] Cada `BOOST_CHECK_INTERVAL` (5s) hay una probabilidad baja (10%) de que aparezca un boost cayendo desde arriba del canvas en una posición X aleatoria.
- [ ] El boost cae a velocidad constante girando visiblemente sobre su propio eje, usando la imagen `assets/icons/star.png`.
- [ ] Si el boost llega al borde inferior del canvas sin ser atrapado por la pala, desaparece sin sonido ni penalidad.
- [ ] Atrapar un boost con la pala agranda su ancho un paso fijo y aumenta la velocidad de la bola un 10%, reproduciendo `assets/sounds/boost.mp3`.
- [ ] Atrapar varios boosts seguidos sigue agrandando la pala por pasos hasta un tope de 2x su ancho base, sin superarlo; la velocidad de la bola sigue acumulándose x1.10 en cada uno sin tope definido.
- [ ] Cada boost atrapado reinicia el temporizador único a 10 segundos completos, sin sumarse a un timer anterior.
- [ ] Al expirar el temporizador sin atrapar otro boost, la pala y la velocidad de la bola vuelven de golpe a sus valores base.
- [ ] Perder una vida con un boost activo resetea de inmediato el ancho de la pala y la velocidad de la bola a su base, y elimina cualquier boost cayendo en ese momento.
- [ ] Reiniciar la partida (botón "Reiniciar") elimina cualquier boost activo o cayendo, con pala y bola en su estado base.

---

## Decisions

- **Sí:** imagen `assets/icons/star.png` cargada aparte del spritesheet de bloques (`Image()` propio), en vez de forzarla dentro de `spritesheet.js`. Ese módulo solo indexa coordenadas de `spritesheet-breakout.png`; el ícono del boost es un archivo separado ya provisto por el usuario.
- **Sí:** spawn por chequeo periódico con probabilidad baja (`BOOST_CHECK_INTERVAL` + `BOOST_SPAWN_CHANCE`), no ligado a romper bloques. Así lo pidió el usuario explícitamente: el boost cae solo, de forma random, no como drop de bloque.
- **Sí:** agrandamiento acumulable por pasos con tope (`PADDLE_BOOST_MAX` = 2x), en vez de un único salto fijo de tamaño. El usuario pidió explícitamente que se acumule; el tope evita un paddle absurdamente ancho que rompa la dificultad del juego.
- **Sí:** timer único que se resetea a 10s completos en cada catch, en vez de sumar duraciones. Decisión explícita del usuario para mantener el comportamiento simple y predecible.
- **Sí:** el aumento de velocidad de la bola se acumula (x1.10 por cada boost) pero se resetea junto con el paddle al expirar el timer, en vez de ser permanente. Decisión explícita del usuario.
- **No:** penalidad (vida) por dejar caer un boost sin atrapar. El usuario pidió explícitamente que desaparezca sin efecto.
- **Sí:** reusar `playSound()` ya existente de SPEC 03 para reproducir `boost.mp3`, precargado igual que `ballBounceSound`/`breakSound`. Consistente con el patrón ya establecido, sin duplicar lógica de reproducción.
- **No:** indicador visual de tiempo restante en el HUD. No fue pedido; se difiere a spec futuro si se necesita.
- **No:** decaimiento gradual del ancho de la pala o de la velocidad de la bola al expirar. El usuario no lo pidió y agrega complejidad de animación sin beneficio claro; el reset instantáneo es consistente con cómo ya se resetean posición de pala/bola en `loseLife()`.

---

## What is **not** in this spec

- Otros tipos de power-up (bola múltiple, láser, vida extra, etc.).
- Indicador visual de tiempo restante del boost activo en el HUD.
- Power-downs (efectos negativos).
- Efecto de partículas o animación adicional al atrapar el boost, más allá del sonido.

Cada uno de estos, si se implementa, va en su propio spec.
