# Stackle

A calm placing-and-stacking toy for a 3-year-old, played on an iPad 9th gen in Safari
as a home-screen web app. TypeScript + Vite, Canvas 2D rendering, Matter.js physics,
Web Audio sounds generated in code. Deployed to GitHub Pages by `.github/workflows/deploy.yml`.

The full design document lives locally (gitignored) as `Stackle Name & Design Document.md`.
Read it when it exists; it is the source of truth for intent. Keep personal details
from it out of committed files: the repo is public.

## Hard rules

- No network calls, analytics, ads, text, menus, timers, scores or fail states. Ever.
- Calm and predictable: same action, same result. Surprises happen only in response to
  something the child did. Nothing flashes, jumps or makes loud noise unprompted.
- Forgiving touch: big hit areas (`GRAB_SLOP`), drag from anywhere on an object,
  every pointer tracked on its own so whole-hand taps never break anything.
- Placement: a disposable thing sinks only when it touches a puddle's water (or a bin's
  opening) after being let go. Anywhere else it is just put down. No aim assist.
- Only regrowable things (fruit, treats, food) are disposable. Characters (animals) can be
  moved and stacked but never disposed of; every object carries a `disposable` flag.
- All art is original, drawn in code: flat rounded shapes, soft palette, no outlines.
  Never imitate Sago Mini or any other game.
- Target 60 fps on the iPad 9th gen: keep physical object counts modest, let bodies sleep.

## Layout

- `src/main.ts`: canvas, resize, pointer input, wake lock, fixed-step loop
- `src/game.ts`: world, physics, grabbing, sinking, drawing
- `src/scenes/`: one file per scene, defined as data (`SceneDef`)
- `src/objects/`: shared objects (fruit/items, tree, puddle)
- `src/audio.ts`, `src/fx.ts`: synthesised sounds and splash particles
- World units: one screen is 1024x768, ground at y=640.

## Milestones

1. Placement test: one tree, one puddle, pick/carry/place/splash. **Done, awaiting iPad test.**
2. Stacking and regrowth, bin, stack limit (top falls off at screen height), supply cap,
   orchard about 5 screens wide with camera panning.
3. Installable and offline: manifest, icons, service worker with versioned cache, saved scene.
4. Polish: scaled splashes, sound pass, hidden long-press parent controls (mute, reduce motion).
5. Winter scene.
6. Grow from watching him.

Finish one milestone and stop for a real-device test before starting the next.

## Git

Commit as the anonymous identity configured in this repo (not the global one). The remote
uses the `github-anon` SSH host alias.
