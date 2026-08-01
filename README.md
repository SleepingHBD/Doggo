# Petals at Dusk

**Petals at Dusk** is a cinematic, side-scrolling pixel-art narrative adventure for the browser. Choose Momo, a brown Maltipoo, or Mallow, a white Maltese; follow the evening streets to a flower market; and discover which bloom remains after the market's stories have changed your path.

## Current vertical slice

- Two playable four-legged protagonists with standing, walking, sniffing, sitting, and emotional sprite poses
- Eleven connected side-view scenes: six evening-road and market spaces plus five fully painted quest interiors
- Consistent doorway transitions: press Up to enter and press Up again to leave every location
- Strict left/right movement on a fixed ground line
- Hold-to-sprint movement with separate four-frame walking and sprinting cycles, airborne strides, ear and tail follow-through, and trailing dust
- Smooth horizontal camera tracking and environmental transitions
- A normalized production sprite atlas with a shared paw baseline and stable body anchor
- Nine optional memory details aligned to fully painted locations rather than procedural overlay props
- Six flowers that can be approached in any order
- Five playable location quests: find the aquarium shark, finish the pool frame, clear the cat-cafe delivery path, meet Bell, and prepare a rooftop leap
- Ordered environmental interactions replace menu-based obstacle solutions: leave the market, travel to the location, solve three clues, and return
- Typewriter dialogue with restrained dog lines and more personal meaning carried by environmental details and narration
- A cohesive twelve-cell, softly stylised portrait atlas for the florist, keepers, Bell, the original animal sitcom cast, the girl, and narrator
- Dynamic petals, lighting, reflections, camera drift, transitions, and sound cues
- A final-flower walk home to the same bench, where the girl and the unselected dog are waiting

## Play locally

Open `index.html` directly in a modern browser. The game has no dependencies and no build step.

Run `node tests/quest-flow.test.cjs` to validate every doorway, three-step location quest, market return, asset path, and the final-flower count.

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

- `index.html` — accessible interface and game screens
- `styles.css` — cinematic presentation, responsive layout, and character selection
- `game.js` — renderer, movement, location quests, dialogue, animation, sound, and state
- `assets/street-dusk.png` — an earlier neighborhood concept retained as a visual reference
- `assets/bench-blue-hour.png` — the quiet bench environment used as the opening and ending bookend
- `assets/bench-ending.png` — the painted reunion version of the familiar bench
- `assets/memory-aquarium-school.png` — the aquarium and school-football route
- `assets/memory-pool-gaming.png` — the pool hall and console gaming cafe
- `assets/memory-cat-stories.png` — the cat cafe, story shop, chessboard, and creative studio
- `assets/aquarium-interior-v2.png` — the colourful reef, coral tunnel, and shark tank quest interior
- `assets/pool-interior.png` — the pool hall quest interior
- `assets/cat-cafe-interior.png` — the dinner-bowl and delivery-bell quest interior
- `assets/bell-home.png` — Bell's quiet introduction scene
- `assets/market-rooftop.png` — the original sitcom-homage rooftop quest
- `assets/portrait-atlas-v2.png` — the softer, less realistic production dialogue portrait sheet
- `assets/market-entrance.png` — the arcade threshold
- `assets/market-sideview.png` — the flat side-view flower-market interior
- `assets/dog-sprites.png` — original transparent character source sheet
- `assets/dog-sprites-normalized.png` — cleaned and baseline-aligned gameplay atlas
- `assets/dog-locomotion-v3.png` — corrected four-frame walk and sprint cycles for both dogs
- `tools/normalize_dog_sprites.py` — deterministic sprite cleanup utility

The girl's current character art is intentionally a neutral, editable first-draft sprite until appearance references are available. Encounter scripts, memory spots, and flower definitions are data-driven so the story can keep evolving without rebuilding the game foundation.
