# Stackle

A calm placing-and-stacking toy for a 3-year-old, played on an iPad 9th gen in Safari
as a home-screen web app. TypeScript + Vite, Canvas 2D rendering, a small hand-written
motion model (gravity and depth floors, no physics engine), Web Audio sounds generated
in code. Deployed to GitHub Pages by `.github/workflows/deploy.yml`.

The full design document lives locally (gitignored) as `Stackle Name & Design Document.md`.
Read it when it exists; it is the source of truth for intent. Keep personal details
from it out of committed files: the repo is public.

## Hard rules

- No network calls, analytics, ads, text, menus, timers, scores or fail states. Ever.
- Calm and predictable: same action, same result. Surprises happen only in response to
  something the child did. Nothing flashes, jumps or makes loud noise unprompted.
- Forgiving touch: big hit areas (`GRAB_SLOP`), drag from anywhere on an object,
  every pointer tracked on its own so whole-hand taps never break anything.
- The ground has depth: each stack rests on a floor line, and a larger line is nearer the
  viewer and drawn in front. Stacks never collide with each other.
- Letting go decides everything (`Game.release`). Placed gently (slow release):
  - on the top of a tower or on a fruit hanging on a tree (even a growing one), it glues on
    straight;
  - directly on a puddle's water (or a bin's opening), it drowns one item at a time, bottom first.
  Otherwise: let go low on the ground, it stays at that depth; let go in the air, it falls and
  lands on `FALL_FLOOR` (just in front of the puddles), in front of anything it falls past.
  Falling things never join a tower. No aim assist.
- Towers never tumble; sway while carried is drawn only (a damped spring), so the connection
  never breaks. Grabbing the bottom item lifts the whole tower; grabbing a higher item splits
  it, taking that item and everything above. Picking a tree fruit takes the tower on it too.
- Stack limit: a tower stops at the top of the screen; whatever does not fit breaks off and
  falls beside it as a new stack.
- The tree does nothing when touched; it only gives fruit.
- Only regrowable things (fruit, treats, food) are disposable. Animals can be moved and
  stacked (in the same towers as fruit) but never disposed of; every item carries a
  `disposable` flag. A drowning tower stops at the first animal, which stands in the water.
- Animals make their sound when picked up. Carrying food near an animal's mouth opens it;
  letting go over the open mouth feeds it the held piece only (anything stacked on that piece
  drops to the ground), letting go on its head stacks.
- The farm is a long scene (`SceneDef.width`, five screens now). Dragging empty ground or sky
  pans; a swipe glides a little (capped), a resting finger stops it. Carrying something to the
  screen edge scrolls the world. Sun, moon and stars stay fixed on screen.
- Tapping the sun brings night (`src/sky.ts`), tapping the moon brings day. At night animals
  sleep; one at a time snores quietly with a bubble every few seconds. Holding an animal or
  offering it food keeps it awake for a little while.
- All art is original, drawn in code: flat rounded shapes, soft palette, no outlines.
  `references/` (gitignored) holds screenshots of Sago Mini Farm as inspiration for the
  kinds of play only. Never copy its characters, art, buildings or scene layouts.
- Target 60 fps on the iPad 9th gen: keep object counts modest.

## Layout

- `src/main.ts`: canvas, resize, pointer input, wake lock, fixed-step loop
- `src/game.ts`: world, motion, grabbing, placing, drowning, depth-sorted drawing
- `src/scenes/`: one file per scene, defined as data (`SceneDef`)
- `src/objects/`: shared objects (items, fruit, animals, stacks, tree, puddle)
- `src/audio.ts`, `src/fx.ts`: synthesised sounds and splash particles
- World units: one screen is 1024x768, ground at y=640.
- In dev builds the game is on `window.game`, so browser tests can inspect `game.stacks`.

## Milestones

1. Placement test: one tree, one puddle, pick/carry/place/splash. Done.
2. Stacking: glued towers, depth layers, stack limit, one-by-one drowning. Done.
3. Animals: cow, hen, sheep, pig; stack with fruit; feeding through an open mouth. Done.
4. Day and night. Done.
5. Long scrolling farm, five screens, edge scrolling while carrying. **Awaiting test.**

Farm roadmap (the parent's goal, in rough order, each slice tested before the next):

- Hats and a hat dispenser; hats stack on animals and can be drowned.
- Rain cloud you press and drag; vegetable beds grow under the rain, pickable when ready.
- Vehicles animals can sit on.
- Lots of interactive farm structures: doors that open, swings, and more.
- Bin, supply cap, installable offline app with a saved scene, hidden parent controls.

Finish one milestone and stop for a real-device test before starting the next.

## Git

Commit as the anonymous identity configured in this repo (not the global one). The remote
uses the `github-anon` SSH host alias.
