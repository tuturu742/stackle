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
- The tree does nothing when touched; it only gives fruit. (The owl in the pear tree is its own
  thing: asleep by day, a tap only makes it peek with one eye; awake at night with glowing eyes,
  a tap makes it hoot.)
- Only things that come back (fruit, vegetables, corn, hay, treats, pies, eggs, hats, and the winter
  town's gifts, parcels, ice cubes, candles, snowballs, sweets, food and ornaments) are disposable.
  Animals and toys (the model ship, instruments, the spinning top) are keepers: never lost, even across layouts. Animals can be moved and
  stacked (in the same towers as fruit) but never disposed of; every item carries a
  `disposable` flag. A drowning tower stops at the first animal, which stands in the water.
- Animals (cow, hen, sheep, pig, horse, duck, cat, bunny, raccoon, beaver, and in winter penguin,
  reindeer, polar bear, fox, seal; some start out wearing a hat) make their sound when
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
  grill: the cow and sheep sit on the blanket under a string of paper lanterns. The open basket has the next treat (cake, corndog,
  sandwich, cookie in turn) sitting on top to take; the next one then rises out from inside; fruit or a vegetable on the grill bakes into a pie. An instrument put on an animal makes
  it play a tune (bigger animals lower). The boombox starts out playing song 1 (it starts with the level, once sound is allowed);
  each tap goes to song 2, 3, then off, then 1 again (`audio.playSong`; the loops are stand-ins for
  real songs).
- An animal out in the rain puts up an umbrella (its own colour), folded again when the rain
  stops; under a roof (barn, coop, window) it needs none.
- The farmhouse has two storeys, four windows and a door that open and shut on tap; what sits on
  a shut sill or in a shut doorway is hidden, and an animal waiting there says hello when opened
  (the cat starts behind an upstairs shutter). Tapping the chimney starts smoke, tapping again
  stops it. Two lanterns hang over the door. A bench for two stands in front.
- Lanterns (picnic string, farmhouse door) each switch on or off with their own tap; lit ones glow
  over the dark at night (`src/objects/lantern.ts`). They start lit. Floating on a puddle, the model ship sails back and forth with a soft motor
  (heard only while in sight) and the duck paddles slowly; both face the way they go.
- A hen fed while sitting in the coop lays an egg, which drops out underneath. The mud puddle
  (`Mud`, a brown `Puddle`) does everything a puddle does; an animal sitting in it gets muddy, and
  floating in clean water or standing in rain washes it.
- Hidden discoveries, each only in response to the child:
  - the scarecrow stands in a clearing in the corn and wears any hat put on its head, which sends
    both crows flying; a tap on the scarecrow only wobbles it, a tap on a crow sends that one off;
  - bushes are hiding places: the bunny, beaver and raccoon start in one each; three shakes (taps)
    in a row bring its animal out, and an animal let go with its body anywhere over the leaves
    goes in, out of sight (`Decor.catches`); one standing on the ground in front stays out;
  - a ladybird sits on a sunflower and flies to another one, picked at random, when tapped;
  - tapping a puddle ripples it, and at night the moon's reflection wobbles;
  - spinning the windmill really fast for a while puffs one sack of flour out of its door (cap 4),
    again only after it slows down; the grill makes flour into tortillas and corn into popcorn;
  - fireflies over the cornfield at night gather round a held finger and drift home after;
  - a hen put down near another hen clucks, and the other clucks back;
  - every third meal an animal does a little dance turn and burps a sung note.
- Scenery: a fence all round; bushes rustle, flowers chime, sunflowers nod;
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
- Levels: the app opens on a hub (`src/hub.ts`), one full-screen card per season (spring,
  summer, autumn, winter) side by side in a loop (after winter comes spring again). A swipe moves one card, a tap anywhere on a playable card
  goes in, and a card still to come only wiggles. Each card shows a few highlights of its level,
  drawn with the level's own objects (`src/previews.ts`). Summer is the farm and Winter the snowy
  town; spring and autumn are placeholder cards until their scenes exist. Leaving a level for the hub resets it: going in
  again always starts fresh.
- Every level has a spinning top (`src/objects/top.ts`), an item like any other (carried, stacked,
  stacked on). Dropped or thrown, it lands spinning with its eyes squeezed shut, wobbles as it slows
  and flops over onto one of its four sides (star, heart, flower, moon; picked at random, like a
  real top), each with its own sound, dizzy for a moment. Picked up, it stands upright again.
- Winter (`src/scenes/winter.ts`, `theme: 'winter'`): a thirteen-screen snowy town that loops, with
  a town backdrop, snow banks, soft falling snow, pines and street lamps (tap: on or off).
  - Givers: the sleigh (gifts in four sizes and colours on its back) and the post van (a parcel on
    its roof) are vehicles, driven like the tractor (the sleigh's bells ring as it moves); stalls
    (`Stall`: ice chest, candles, sweets, warm drinks, hats, fast food, ornaments) each have their next
    thing waiting to take, the next rising after. Here the next thing is picked at random (never
    the same twice running; the ice chest mostly gives plain cubes): the parent asked for that.
    A tap on a stall switches its string of lights. Caps: 6 gifts and parcels, 16 ice cubes, 30 decorations (stall and house box together), 10 per other stall, hats share the
    hat cap, 12 snowballs.
  - A gift or parcel put on an animal's head (or its hat) opens with confetti, and the animal
    dances.
  - Ice blocks (cube, window, turret top) build walls: one let go beside another ice tower stands
    flush against it on the same ground line.
  - Candles come lit; a tap switches one on or off, and a lit one glows at night wherever it is. A
    candle with something on it shows no wick. A candle standing on an ice column (`IceColumns`, a
    perch) gives the ice its colour, back to plain ice once it is taken off.
  - Pines are perches (`Pine`): anything put on a branch stays there (decorations hang), a star
    spot on the tip; a let-go goes to the nearer of a free spot and the top of what hangs there, so
    decorations stack like anything else. Decorations: baubles in five colours and designs, a bell,
    a star. Some
    pines have a string of lights a tap switches; plain pines shed snow. Over the rink, a string of
    lights (`ChaseLights`) lights its bulbs one after another. Every light at night is switchable:
    lamps, stall lights, pine lights, candles; the rink's string and the house's eave lights bulb by
    bulb (a tap on a rink post switches the whole string). A bin stands by the ice chest.
  - The town house is dressed for Christmas, with a box of decorations (`DecorBox`) on its step
    for the pine beside it; the ornament stall has a pine right by it too.
  - Santa's chair (`SantaChair`) has the polar bear in a Santa hat on the cushion, and a small
    animal can sit on each arm (a penguin and the bunny start there); presents beside it are real
    items. Beside it a radio (the winter `Boombox`) plays carols 4, 5, 6, then off.
  - The Christmas market (`MarketTable`): a table with a bench at each end for animals (the pig and
    a hen start there) and places on the table for food, next to the fast food stall.
  - The ice rink stands up on a snowy terrace, off the road: things let go over it, or falling
    onto it, stand on the ice.
  - Snowballs: driving the snow plough rolls one in front of its blade, bigger the further it goes
    (four sizes), left there when let go. Holding the snow cannon grows one in its mouth, bigger
    the longer the press, and a finger moved while holding turns the barrel toward it; letting go
    fires it in an arc. A snowball on a snowball makes a snowman:
    the top one gets a face, middle ones buttons and twig arms.
  - Sled hills (`SledHill`): anything on the sled goes down, runs out and is pulled back up, again
    and again while someone rides (only while the hill is on screen); empty, it waits at the top, and a tap on the hill sends it.
  - The ice rink (`Rink`): anything let go on it slides (at least a little), slowing gently and
    bouncing softly off the edge, leaving scratches that fade.
- Hidden parent controls: holding a finger still in the top-left corner (140 px) for 3 s leaves
  a level for the hub. In the hub, the same hold (under a parents icon) opens an icon-only panel; a faint ring fills under the finger after the first second. Only lifting or
  moving the finger away stops the hold, since iPadOS may cancel a long touch near the top edge. The panel has: sound, reduce motion (no sway, squash, glide; small splashes; gentler swing
  and windmill), start every level again (hold 2 s), close. Settings live in `src/settings.ts`.
- Target 60 fps on the iPad 9th gen: keep object counts modest.

## Layout

- `src/main.ts`: canvas, resize, pointer input, wake lock, fixed-step loop, switching between
  the hub and levels
- `src/hub.ts`, `src/previews.ts`: the level select and its cards
- `src/game.ts`: world, motion, grabbing, placing, drowning, depth-sorted drawing
- `src/scenes/`: one file per level, defined as data (`SceneDef`); `summer.ts` is the farm
- `src/objects/`: shared objects (items, fruit, vegetables, hats, animals, stacks, tree, bed,
  goods, cloud, puddle, bin, barn, stable, swing, windmill, hat machine, vehicles, perch, bench, boombox, scarecrow, owl, fireflies, fields,
  decor, picnic, house, coop, mud; the top; winter: stall, offer, columns, cannon, sledhill, rink, town, throne, market)
- `src/theme.ts`: each level's colours and backdrop
- `src/audio.ts`, `src/fx.ts`: synthesised sounds and splash particles
- `src/save.ts`: the level being played is saved to localStorage (`Game.snapshot`/`Game.restore`)
  every 2 s and when the app is left, so a reload mid-play (iPadOS does that) reopens straight into
  it as it was. Leaving it for the hub forgets the save. The hub remembers its card. The farm's
  older single save is read as summer's, mid-play. A save from another layout keeps its stacks; animals are never lost.
- `public/`: manifest, icons (`icon.svg` is the source of the PNGs) and the service worker, which
  serves a cached copy offline and refreshes it on each online launch.
- World units: one screen is 1024x768, ground at y=640.
- In dev builds the level being played is on `window.game` (once entered), so browser tests can
  inspect `game.stacks`; `window.hub`, `enterLevel(id)` and `leaveLevel()` drive the hub.

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

10. Seasons: a hub to swipe between levels, with the farm as Summer and cards for spring, autumn
    and winter. **Awaiting test.**
11. Winter: the snowy town level, new animals, the spinning top in every level. **Awaiting test.**

The original roadmap is done. What comes next is decided by watching what he does: new
scenes (the design document lists a winter scene with a snowball truck), more hidden
interactions, and "use it" outlets for food (pies, smoothies).

Finish one milestone and stop for a real-device test before starting the next.

## Git

Commit as the anonymous identity configured in this repo (not the global one). The remote
uses the `github-anon` SSH host alias.
