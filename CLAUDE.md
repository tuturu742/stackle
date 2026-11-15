# Stackle

A calm placing-and-stacking toy for a 3-year-old, played on an iPad 9th gen in Safari
as a home-screen web app. TypeScript + Vite, Canvas 2D rendering, a small hand-written
motion model (gravity and depth floors, no physics engine), Web Audio sounds generated
in code. Deployed to GitHub Pages by `.github/workflows/deploy.yml`.

The full design document lives locally (gitignored) as `Stackle Name & Design Document.md`.
Read it when it exists; it is the source of truth for intent. Keep personal details
from it out of committed files: the repo is public.

## Hard rules

- No network calls, analytics, ads, text, menus, timers, scores or fail states. Ever. The only
  fetches are the service worker (`public/sw.js`) loading the app's own files.
- Calm and predictable: same action, same result. Surprises happen only in response to
  something the child did. Nothing flashes, jumps or makes loud noise unprompted.
- Forgiving touch: big hit areas (`GRAB_SLOP`), drag from anywhere on an object,
  every pointer tracked on its own so whole-hand taps never break anything.
- The ground has depth: each stack rests on a floor line, and a larger line is nearer the
  viewer and drawn in front. Stacks never collide with each other. Nothing rests below
  `FRONT_FLOOR`, well above the bottom edge, where a swipe up leaves the app.
- Letting go decides everything (`Game.release`). Placed gently (slow release):
  - on the top of a tower, on a fruit hanging on a tree (even a growing one), on a ripe
    vegetable in its bed, or on a seat (`Perch`: vehicle seats, the swing, the grill, the coop,
    an open farmhouse sill), it glues on straight and moves with what holds it;
  - a vegetable on an empty or growing bed plot is planted there, ripe again; anything stacked
    on it stays on top;
  - directly on a puddle's water or a bin's opening (`Sink`), it goes in one item at a time,
    bottom first; an animal floats on the water or sits on the bin;
  - low in the barn doorway where no door is in the way, it goes inside the barn.
  Otherwise: let go low on the ground, it stays at that depth; let go in the air, it falls and
  lands on `FALL_FLOOR` (just in front of the puddles), in front of anything it falls past.
  Falling things never join a tower. Anything thrown or dropped down through a bin's opening goes
  in (`Bin.catches`), like a hoop; an animal sits on the bin. No aim assist.
- Towers never tumble; sway while carried is drawn only (a damped spring), so the connection
  never breaks. Grabbing the bottom item lifts the whole tower; grabbing a higher item splits
  it, taking that item and everything above. Picking a tree fruit or bed vegetable takes the tower on it too.
- Stack limit: a tower stops at the top of the screen; whatever does not fit breaks off and
  falls beside it as a new stack.
- The tree does nothing when touched; it only gives fruit.
- Only things that come back (fruit, vegetables, corn, hay, treats, pies, eggs, hats) are disposable.
  Animals and toys (the model ship, instruments) are keepers: never lost, even across layouts. Animals can be moved and
  stacked (in the same towers as fruit) but never disposed of; every item carries a
  `disposable` flag. A drowning tower stops at the first animal, which stands in the water.
- Animals (cow, hen, sheep, pig, horse, duck, cat; some start out wearing a hat) make their sound when
  picked up. Carrying food near an animal's mouth opens it;
  letting go over the open mouth feeds it the held piece only (anything stacked on that piece
  drops to the ground), letting go on its head stacks.
- Supply caps (`Game.countOut`): a tree waits while 16 of its fruit or 32 fruit in all are out;
  beds and the cornfield wait at 20 vegetables, the barn's hay at 10, the picnic basket at 10 treats,
  the coop at 6 eggs. The hat machine gives nothing while 15 hats
  are out, counting the ones animals start out wearing (a soft boop); hats come out in a fixed
  order, each sliding a little further.
- Structures do something when tapped (a tap is a touch on empty ground or a structure that
  barely moves; a drag there pans): the hat machine gives a hat; anywhere on the swing, or on
  whatever rides it, pushes it (a drag on the rider picks it up). The two barn doors slide along
  a rail under a finger, and a tap slides one fully open or shut; whatever stands inside behind
  a door is hidden and out of reach. Hay bales inside the barn can be taken and fed to animals,
  and grow back. The windmill's sails turn under a finger and keep a flick's spin; a tap pushes. Vehicles are dragged sideways along their ground line, carrying
  whatever sits on their seats; a tap without moving honks; driving through a puddle splashes.
  A swing push always adds to the way it is already moving.
- Picnic, right between the first garden and the barn so fruit and vegetables are close to the
  grill: the cow and sheep sit on the blanket. The open basket has the next treat (cake, corndog,
  sandwich, cookie in turn) sitting on top to take; the next one then rises out from inside; fruit or a vegetable on the grill bakes into a pie. An instrument put on an animal makes
  it play a tune (bigger animals lower). The boombox plays song 1, 2, 3, then off, one tap each
  (`audio.playSong`; the loops are stand-ins for real songs).
- An animal out in the rain puts up an umbrella (its own colour), folded again when the rain
  stops; under a roof (barn, coop, window) it needs none.
- The farmhouse has two storeys, four windows and a door that open and shut on tap; what sits on
  a shut sill or in a shut doorway is hidden, and an animal waiting there says hello when opened
  (the cat starts behind an upstairs shutter). Tapping the chimney starts smoke, tapping again
  stops it. A bench for two stands in front. Floating on a puddle, the model ship sails back and forth with a soft motor
  (heard only while in sight) and the duck paddles slowly; both face the way they go.
- A hen fed while sitting in the coop lays an egg, which drops out underneath. The mud puddle
  (`Mud`, a brown `Puddle`) does everything a puddle does; an animal sitting in it gets muddy, and
  floating in clean water or standing in rain washes it.
- Scenery: a fence all round; bushes rustle, flowers chime, sunflowers nod, bunting flutters;
  birds fly off only when touched and come back only out of sight. Backdrop things (stable,
  windmill, fields, scenery) sit just behind `GROUND_Y`, so nothing on the ground hides behind them.
- The farm is a long scene (`SceneDef.width`, thirteen screens now) that loops round: a
  cornfield at one end meets a sunflower field at the other. Positions are wrapped (`Game.wrap`,
  `Game.delta`), and the view draws the start again past the end. Each screen is its
  own place, like the references: repeat a kind of thing rarely and far apart, and grow the
  farm as new things arrive rather than padding it with copies. Dragging empty ground or sky
  pans; a swipe glides a little (capped), a resting finger stops it. Carrying something to the
  screen edge scrolls the world. Sun, moon and stars stay fixed on screen.
- Rain: press and hold a cloud to make it rain under it, drag to move it (edge-scrolls too),
  at most one screen from its bed. A picked plot regrows a random vegetable.
  Vegetable beds regrow picked plots only while rained on; rain also makes fruit regrow 3x
  faster and ripples puddles. Growing fruit and vegetables look clearly unripe (small,
  green, mostly hidden in soil) and pop to full size only when pickable.
- Tapping the sun brings night (`src/sky.ts`), tapping the moon brings day. At night animals
  sleep; one at a time snores quietly with a bubble every few seconds. Holding an animal or
  offering it food keeps it awake for a little while.
- All art is original, drawn in code: flat rounded shapes, soft palette, no outlines.
  `references/` (gitignored) holds screenshots of Sago Mini Farm as inspiration for the
  kinds of play only. Never copy its characters, art, buildings or scene layouts.
- Hidden parent controls: holding a finger still in the top-left corner (140 px) for 3 s opens an
  icon-only panel; a faint ring fills under the finger after the first second. Only lifting or
  moving the finger away stops the hold, since iPadOS may cancel a long touch near the top edge. The panel has: sound, reduce motion (no sway, squash, glide; small splashes; gentler swing
  and windmill), start the farm again (hold 2 s), close. Settings live in `src/settings.ts`.
- Target 60 fps on the iPad 9th gen: keep object counts modest.

## Layout

- `src/main.ts`: canvas, resize, pointer input, wake lock, fixed-step loop
- `src/game.ts`: world, motion, grabbing, placing, drowning, depth-sorted drawing
- `src/scenes/`: one file per scene, defined as data (`SceneDef`)
- `src/objects/`: shared objects (items, fruit, vegetables, hats, animals, stacks, tree, bed,
  goods, cloud, puddle, bin, barn, stable, swing, windmill, hat machine, vehicles, perch, bench, boombox, fields,
  decor, picnic, house, coop, mud)
- `src/audio.ts`, `src/fx.ts`: synthesised sounds and splash particles
- `src/save.ts`: the scene is saved to localStorage (`Game.snapshot`/`Game.restore`) every 2 s
  and when the app is left. A save from another layout keeps its stacks; animals are never lost.
- `public/`: manifest, icons (`icon.svg` is the source of the PNGs) and the service worker, which
  serves a cached copy offline and refreshes it on each online launch.
- World units: one screen is 1024x768, ground at y=640.
- In dev builds the game is on `window.game`, so browser tests can inspect `game.stacks`.

## Milestones

1. Placement test: one tree, one puddle, pick/carry/place/splash. Done.
2. Stacking: glued towers, depth layers, stack limit, one-by-one drowning. Done.
3. Animals: cow, hen, sheep, pig; stack with fruit; feeding through an open mouth. Done.
4. Day and night. Done.
5. Long scrolling farm with edge scrolling while carrying. Done.
6. Rain cloud and vegetable beds; a seven-screen farm with each screen its own place. Done.
7. Installable offline app with a saved scene. Awaiting test.
8. Bin and supply caps; hidden parent controls; hats and the hat machine; barn with sliding doors
   and hay, stable and horse, swing, windmill; tractor and wagon; a nine-screen farm.
   **Awaiting test.**
9. A looping fourteen-screen farm: fields at both ends, fence and scenery, picnic (basket, grill,
   instruments), farmhouse with windows and a model ship, coop and eggs, mud, duck. **Awaiting test.**

The original roadmap is done. What comes next is decided by watching what he does: new
scenes (the design document lists a winter scene with a snowball truck), more hidden
interactions, and "use it" outlets for food (pies, smoothies).

Finish one milestone and stop for a real-device test before starting the next.

## Git

Commit as the anonymous identity configured in this repo (not the global one). The remote
uses the `github-anon` SSH host alias.
