# Arkanoid Game

Arkanoid game in plain HTML, CSS, and JavaScript. Zero dependencies, no `package.json` or build tool.

## How to play

Open `index.html` in the browser. No server or installation required.

### Controls

- **Left Arrow / Right Arrow** — move the paddle.
- **Mouse click** — click the "Reiniciar" button to restart after winning or losing.

## Project status

Playable MVP implemented, with incremental improvements via specs:

- **SPEC 01** — Playable MVP: single canvas level, keyboard-controlled paddle, ball with variable-angle bounce, blocks that add to the score, 3 lives, win/lose screens with restart.
- **SPEC 02** — Animated block destruction: 4-frame explosion when a block breaks.
- **SPEC 03** — Collision sounds: sound on ball bounce and when a block breaks or a life is lost.
- **SPEC 04** — Paddle-enlarge boost: item that occasionally falls and, when caught, enlarges the paddle and temporarily speeds up the ball.

Full detail for each spec in `specs/01-mvp-jugable.md` through `specs/04-boost-agrandar-pala.md`.

## Structure

- `index.html`, `style.css`, `game.js` — the game.
- `assets/spritesheet-breakout.png` + `assets/spritesheet.js` — block sprites and animations.
- `assets/icons/star.png` — boost icon.
- `assets/sounds/` — sound effects (`ball-bounce.mp3`, `break-sound.mp3`, `boost.mp3`).
- `specs/` — numbered development specs (`/spec` and `/spec-impl` workflow).

## Development workflow

This repo uses `/spec` and `/spec-impl` commands for spec-driven development. See `CLAUDE.md` for details.
