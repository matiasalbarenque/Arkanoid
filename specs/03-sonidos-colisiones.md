# SPEC 03 — Sonidos de colisiones

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-08-13
> **Objective:** Al rebotar la bola contra bordes de pantalla o la pala se reproduce `ball-bounce.mp3`, y al romperse un bloque o perder una vida se reproduce `break-sound.mp3`.

---

## Scope

**In:**

- Precarga de dos objetos `Audio` al iniciar el juego: uno para `assets/sounds/ball-bounce.mp3`, otro para `assets/sounds/break-sound.mp3`.
- `ball-bounce.mp3` suena en cada rebote contra los tres bordes del canvas (izquierdo, derecho, superior) en `moveBall()`, y en cada rebote contra la pala en `checkPaddleCollision()`.
- `break-sound.mp3` suena al romperse un bloque en `checkBrickCollision()`, y también al perder una vida (bola cae por debajo del canvas) en `loseLife()`.
- Reproducción resetea `currentTime = 0` antes de `play()` sobre el mismo objeto `Audio`, para permitir rebotes/roturas consecutivos rápidos sin esperar a que termine el sonido anterior.
- Volumen fijo por defecto del elemento `Audio` (sin ajuste explícito, sin control de mute).

**Out of scope (para futuros specs):**

- Control de volumen o mute (tecla o botón en UI).
- Sonido distinto para pared vs. pala (ambos usan `ball-bounce.mp3`).
- Sonido dedicado y distinto para pérdida de vida (reusa `break-sound.mp3`, no se agrega un tercer asset).
- Música de fondo.
- Precarga con indicador de progreso o manejo de error si el navegador bloquea autoplay.

---

## Data model

Este feature no introduce nuevas estructuras en `state`. Agrega dos variables de módulo en `game.js`:

```js
const ballBounceSound = new Audio( 'assets/sounds/ball-bounce.mp3' );
const breakSound = new Audio( 'assets/sounds/break-sound.mp3' );
```

Convenciones:

- Ambos objetos se crean una sola vez a nivel de módulo (no dentro del loop ni de las funciones de colisión).
- Reproducir un sonido siempre pasa por una función `playSound(audio)` que hace `audio.currentTime = 0; audio.play();`, evitando repetir esa lógica en cada punto de colisión.

---

## Implementation plan

1. Declarar `ballBounceSound` y `breakSound` como constantes de módulo en `game.js`, y una función `playSound(audio)` que resetea `currentTime` y llama `play()`. Prueba manual: el juego sigue cargando sin errores en consola, sin cambios audibles todavía.
2. Llamar `playSound(ballBounceSound)` en los tres rebotes de pared dentro de `moveBall()` (líneas ~109-120) y en el rebote de pala dentro de `checkPaddleCollision()` (línea ~172, tras fijar `ball.y`). Prueba manual: mover la pala y dejar rebotar la bola contra bordes y pala reproduce el sonido en cada rebote.
3. Llamar `playSound(breakSound)` dentro de `checkBrickCollision()` justo después de marcar `brick.alive = false` (línea ~188), y dentro de `loseLife()` al inicio (línea ~131). Prueba manual: romper un bloque y dejar caer la bola reproducen el sonido de rotura en ambos casos.
4. Prueba manual final: partida completa con rebotes rápidos consecutivos (varios bloques en sucesión, rebotes seguidos contra pared) confirma que los sonidos se solapan correctamente sin cortarse ni acumular retraso.

---

## Acceptance criteria

- [x] El juego carga sin errores en consola con los dos sonidos precargados.
- [x] La bola rebotando contra la pared izquierda, derecha o superior reproduce `ball-bounce.mp3`.
- [x] La bola rebotando contra la pala reproduce `ball-bounce.mp3`.
- [x] Romper un bloque reproduce `break-sound.mp3`.
- [x] Perder una vida (bola cae por debajo del canvas) reproduce `break-sound.mp3`.
- [x] Rebotes o roturas consecutivos en menos de la duración de un sonido no cortan el sonido en curso ni generan errores en consola.

---

## Decisions

- **Sí:** `ball-bounce.mp3` para pared y pala por igual. No hay asset separado para cada uno; usar el mismo evita inventar sonidos o generar nuevos assets fuera de alcance del pedido.
- **Sí:** reusar `break-sound.mp3` al perder una vida. No existe asset dedicado a ese evento; el sonido de rotura funciona como señal audible de evento negativo sin agregar un tercer archivo.
- **Sí:** un objeto `Audio` precargado por sonido, reseteando `currentTime` en cada reproducción. Evita el costo de instanciar `new Audio()` en cada colisión y permite solapar sonidos rápidos sin cortar el anterior.
- **No:** clonar el nodo `Audio` (`cloneNode`) para permitir solapamiento perfecto entre instancias simultáneas. El reset de `currentTime` es suficientemente bueno para el ritmo de colisiones de este juego; añadir clones es complejidad sin beneficio claro ahora.
- **No:** control de volumen o mute. No fue pedido; se difiere a spec futuro si se necesita.
- **Sí:** lógica de audio vive en `game.js`, sin archivo nuevo. Consistente con la decisión de SPEC 01 de mantener archivos sueltos sin build tool; el volumen de código de audio es mínimo y no justifica un módulo aparte.

---

## What is **not** in this spec

- Control de volumen o mute.
- Sonidos distintos para pared vs. pala, o un tercer sonido dedicado a pérdida de vida.
- Música de fondo.

Cada uno de estos, si se implementa, va en su propio spec.
