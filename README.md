# Petals at Dusk

**Petals at Dusk** is a cinematic, side-scrolling pixel-art narrative adventure for the browser.

This README intentionally omits its story, characters, locations, encounters, and ending so the experience remains unspoiled.

## Current vertical slice

A playable vertical slice is included. Further details are deliberately left for the player to discover.

## Play locally

Open `index.html` directly in a modern browser. The game has no dependencies and no build step.

Run `node tests/quest-flow.test.cjs` to execute the gameplay smoke test.

## Controls

- **A / D** or **Left / Right** — move
- **Shift** — hold while moving to sprint
- **Up** — enter or leave through a nearby doorway
- **E** or **Space** — interact
- **Space** — reveal or continue dialogue
- Touch controls appear on touch devices
- On touch devices, hold **RUN** together with either movement button to sprint

## Publish with GitHub Pages

Open the repository's **Settings → Pages**, select **Deploy from a branch**, then choose the `main` branch and `/ (root)` folder.

## Project structure

- `index.html` — game interface and screens
- `styles.css` — presentation and responsive layout
- `game.js` — gameplay, rendering, dialogue, animation, audio, and state
- `assets/` — production artwork and sprite sheets
- `tests/` — gameplay smoke tests
- `tools/` — local asset utilities
