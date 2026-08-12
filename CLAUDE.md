# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Arkanoid game, plain HTML/CSS/JavaScript, zero dependencies. Code not implemented yet — repo currently has only assets and a spec-workflow setup. No `package.json`, no build tool, no test suite exist yet.

## Spec-driven workflow

This repo uses custom slash commands `/spec` and `/spec-impl` (defined in `.claude/skills/spec/` and `.claude/skills/spec-impl/`, synced via `skills-lock.json` from `Klerith/fernando-skills`). Follow it instead of jumping straight to code:

- `/spec <feature description>` — clarifies requirements through Q&A, then writes `specs/NN-slug.md` (numbered sequentially, state starts as `Draft`).
- `/spec-impl NN-slug` — only runs if the spec's state is `Approved`. Creates branch `spec-NN-slug`, then implements the plan step by step, pausing after each step for diff review. Never commits automatically.
- Branch auto-creation is controlled by `specs/.spec-config.yml` (`AutoCreateBranch`, default `true`).

When asked to build a feature for this game, prefer starting from `/spec` rather than writing code ad hoc, unless the user explicitly wants a quick throwaway change.

## Assets

- `assets/spritesheet-breakout.png` — sprite sheet image.
- `assets/spritesheet.js` — sprite coordinate tables (`SPRITES`, `EXPLOSION_FRAMES`) and loader helpers (`loadSpritesheet`, `drawSprite`, `drawFrame`) for drawing onto a `<canvas>` 2D context. `drawSprite` dispatches on name, treating any `block_<color>` prefix as a lookup into `SPRITES.blocks`.
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.

Any canvas-based game code should reuse this spritesheet module rather than re-deriving sprite coordinates.
