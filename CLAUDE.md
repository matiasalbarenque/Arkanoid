# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Arkanoid game, plain HTML/CSS/JavaScript, zero dependencies (`index.html`, `style.css`, `game.js`). No `package.json`, no build tool, no test suite. Implemented via specs `01`–`04`: playable MVP, animated block destruction, collision sounds, paddle-enlarge boost.

## Spec-driven workflow

This repo uses custom slash commands `/spec` and `/spec-impl` (`.claude/skills/spec` and `.claude/skills/spec-impl` symlink into `.agents/skills/`, synced via `skills-lock.json` from `Klerith/fernando-skills`). Follow it instead of jumping straight to code:

- `/spec <feature description>` — clarifies requirements through Q&A, then writes `specs/NN-slug.md` (numbered sequentially, `NN` zero-padded, status starts as `Draft`).
- `/spec-impl NN-slug` — only runs if the spec's status is `Approved`. Creates branch `spec-NN-slug`, then implements the plan step by step, pausing after each step for diff review. Never commits automatically. On completion the spec's status is updated to `Implemented`.
- Branch auto-creation is controlled by `specs/.spec-config.yml` (`AutoCreateBranch`, default `true`).

When asked to build a feature for this game, prefer starting from `/spec` rather than writing code ad hoc, unless the user explicitly wants a quick throwaway change.

### Spec file structure

Each `specs/NN-slug.md` follows a fixed section order (see `specs/01-mvp-jugable.md` through `04-boost-agrandar-pala.md` for reference):

1. Title `# SPEC NN — <name>` + header block: `> **Status:**` (`Draft` / `Approved` / `Implemented`), `> **Depends on:**` (other spec numbers or `ninguno`), `> **Date:**`, `> **Objective:**` (one-sentence summary).
2. `## Scope` — `**In:**` and `**Out of scope (para futuros specs):**` bullet lists.
3. `## Data model` — new/changed state fields.
4. `## Implementation plan` — ordered steps `/spec-impl` executes and pauses on.
5. `## Acceptance criteria` — checkable behaviors.
6. `## Decisions` — resolved ambiguities from the Q&A phase.
7. `## What is **not** in this spec` — explicit exclusions, mirrors "Out of scope."

Specs are written in Spanish; keep new specs consistent with that and this structure.

## Assets

- `assets/spritesheet-breakout.png` — sprite sheet image.
- `assets/spritesheet.js` — sprite coordinate tables (`SPRITES`, `EXPLOSION_FRAMES`) and loader helpers (`loadSpritesheet`, `drawSprite`, `drawFrame`) for drawing onto a `<canvas>` 2D context. `drawSprite` dispatches on name, treating any `block_<color>` prefix as a lookup into `SPRITES.blocks`.
- `assets/icons/star.png` — boost icon, loaded separately from the spritesheet.
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`, `boost.mp3`, played via `playSound()`.

Any canvas-based game code should reuse this spritesheet module rather than re-deriving sprite coordinates.
