import {
  FALL_FLOOR,
  FRONT_FLOOR,
  GRAB_SLOP,
  GRAVITY,
  GROUND_BAND,
  GROUND_Y,
  MAX_RELEASE_SPEED,
  PLACE_SPEED,
  SCREEN_W,
  STEP,
  TOP_MARGIN,
  WORLD_H,
  palette,
} from './config';
import * as audio from './audio';
import { Notes, Splashes } from './fx';
import { SNORE_SECONDS, type AnimalKind } from './objects/animals';
import { Barn, type HayBale } from './objects/barn';
import { Bed, type Plot } from './objects/bed';
import { Bin } from './objects/bin';
import { Cloud } from './objects/cloud';
import { Coop } from './objects/coop';
import { Bird, Decor, FENCE_TOP } from './objects/decor';
import { Bench } from './objects/bench';
import { Boombox } from './objects/boombox';
import { Dispenser } from './objects/dispenser';
import { CornField, SunflowerField, type Cob } from './objects/fields';
import { isInstrument, TREATS, type InstrumentKind, type ToyKind } from './objects/goods';
import { House } from './objects/house';
import { Item, drawLoose, isFruit, isHat, isVeg, sizeOf, type ItemKind, type LooseKind } from './objects/item';
import type { Perch } from './objects/perch';
import { BAKE_SECONDS, Basket, Grill, Picnic } from './objects/picnic';
import { Mud, Puddle } from './objects/puddle';
import type { Sink } from './objects/sink';
import { Stable } from './objects/stable';
import { Stack, type Anchor } from './objects/stack';
import { Swing } from './objects/swing';
import { Tree, type Slot } from './objects/tree';
import type { VegKind } from './objects/veg';
import { Vehicle } from './objects/vehicle';
import { Windmill } from './objects/windmill';
import type { Saved, SavedStack } from './save';
import type { Home, SceneDef } from './scenes/scene';
import { settings } from './settings';
import { Sky } from './sky';

/** Where a stack resting on something stands. */
function anchorPoint(anchor: Anchor): { x: number; top: number } {
  if ('slot' in anchor) return { x: anchor.slot.x, top: anchor.tree.fruitTop(anchor.slot) };
  if ('plot' in anchor) return { x: anchor.plot.x, top: anchor.bed.vegTop(anchor.plot) };
  return { x: anchor.perch.seatX(anchor.seat), top: anchor.perch.seatTop(anchor.seat) };
}

/** Do two anchors hold a stack at the same spot? */
function sameSpot(a: Anchor, b: Anchor): boolean {
  if ('slot' in a) return 'slot' in b && a.slot === b.slot;
  if ('plot' in a) return 'plot' in b && a.plot === b.plot;
  return 'perch' in b && a.perch === b.perch && a.seat === b.seat;
}

interface Hold {
  stack: Stack;
  /** Where the finger is on screen, so the world can scroll under a resting finger. */
  cssX: number;
  cssY: number;
  /** Offset from the finger to the stack's bottom centre, so it never jumps when grabbed. */
  dx: number;
  dy: number;
}

/** A finger dragging a rain cloud. */
interface CloudHold {
  cloud: Cloud;
  cssX: number;
  cssY: number;
  dx: number;
  dy: number;
}

/** A finger driving a vehicle along the ground. */
interface VehicleHold {
  vehicle: Vehicle;
  cssX: number;
  startX: number;
  dx: number;
  /** How far the finger has moved, to tell a tap (a honk) from a drive. */
  moved: number;
}

/** A finger on something riding the swing: a tap pushes the swing, a drag picks the rider up. */
interface RiderTouch {
  stack: Stack;
  index: number;
  point: { x: number; y: number };
  startX: number;
  startY: number;
}

/** A finger sliding a barn door. */
interface DoorHold {
  barn: Barn;
  side: 0 | 1;
  startSlide: number;
  startWorldX: number;
  cssX: number;
  startX: number;
  moved: number;
}

/** A finger turning the windmill's sails. */
interface TurnHold {
  windmill: Windmill;
  cssX: number;
  cssY: number;
  startX: number;
  startY: number;
  moved: number;
}

/** A finger on empty ground or on a structure: a drag pans, a tap is passed on to what is there. */
interface Pan {
  cssX: number;
  speed: number;
  startX: number;
  startY: number;
  moved: number;
}

/** Food or a hat on its way into the water, a bin or a mouth. */
interface Vanishing {
  kind: LooseKind;
  x: number;
  y: number;
  age: number;
  into: 'water' | 'bin' | 'mouth';
  /** Drawing order: just in front of the puddle or bin it goes into. */
  depth: number;
  /** Going under: the line it slides down through, and how far it goes. */
  waterline?: number;
  drop?: number;
  /** Colour of the ring it leaves on the water (clean or muddy). */
  light?: string;
  /** A bin's opening: it stays in sight inside it, down to the front lip. */
  hole?: { x: number; rx: number; ry: number };
}

/** Something that is never lost: an animal or a toy, and how to put it back at home. */
interface Keeper {
  kind: AnimalKind | ToyKind;
  spawn: () => void;
}

/** Something drawn in depth order, with roughly where it is so far-off things can be skipped. */
interface Layer {
  depth: number;
  x: number;
  reach: number;
  draw: () => void;
}

const SINK_SECONDS = 0.3;
/** Carrying food this close to an animal's mouth makes it open. */
const MOUTH_OPEN_DIST = 90;
/** Letting go of food this close to an open mouth feeds the animal. */
const EAT_DIST = 18;
/** A drowning tower loses at most one item this often. */
const DROWN_INTERVAL = 0.3;
/** A thing that falls onto the ground lands this far in front of what is already there. */
const LAYER_GAP = 14;
/** Carrying something this close to the screen edge (in screen pixels) scrolls the world. */
const EDGE_SCROLL_ZONE = 70;
const EDGE_SCROLL_SPEED = 700;
/** A swipe glides at most this fast (world units per second), so it never flies off. */
const MAX_GLIDE = 1600;
// Supply caps: with this much out in the world, what makes more waits until some is used.
/** Fruit of one kind, and fruit of all kinds together. */
const FRUIT_KIND_CAP = 16;
const FRUIT_CAP = 32;
const VEG_CAP = 20;
const HAY_CAP = 10;
const TREAT_CAP = 10;
const EGG_CAP = 6;
/** Hats, counting the ones the animals start out wearing. */
const HAT_CAP = 15;
/** A finger that moves less than this (screen pixels) is a tap. */
const TAP_SLOP = 14;
/** Floating boats and ducks paddle across the water this fast. */
const PADDLE_SPEED: Partial<Record<ItemKind, number>> = { ship: 120, duck: 24 };
/** Seconds an animal plays an instrument given to it. */
const PLAY_SECONDS = 2.2;
/** Each animal's umbrella. */
const UMBRELLA_COLORS: Record<AnimalKind, string> = {
  cow: '#e8665c',
  horse: '#6b93e0',
  pig: '#7fb85e',
  sheep: '#b39ddb',
  duck: '#f2c14e',
  hen: '#f28b82',
  cat: '#5fa8a0',
};
/** Bigger animals play lower. */
const PITCH: Record<AnimalKind, number> = { cow: 0.6, horse: 0.7, pig: 0.85, sheep: 0.9, duck: 1.1, hen: 1.3, cat: 1.2 };

export class Game {
  private stacks: Stack[] = [];
  private trees: Tree[] = [];
  private puddles: Puddle[] = [];
  private beds: Bed[] = [];
  private clouds: Cloud[] = [];
  private bins: Bin[] = [];
  private barns: Barn[] = [];
  private stables: Stable[] = [];
  private swings: Swing[] = [];
  private windmills: Windmill[] = [];
  private dispensers: Dispenser[] = [];
  private vehicles: Vehicle[] = [];
  private cornfields: CornField[] = [];
  private sunfields: SunflowerField[] = [];
  private decor: Decor[] = [];
  private birds: Bird[] = [];
  private picnics: Picnic[] = [];
  private baskets: Basket[] = [];
  private grills: Grill[] = [];
  private boomboxes: Boombox[] = [];
  private benches: Bench[] = [];
  private houses: House[] = [];
  private coops: Coop[] = [];

  private holds = new Map<number, Hold>();
  /** Fingers dragging empty ground, panning the world. */
  private pans = new Map<number, Pan>();
  private cloudHolds = new Map<number, CloudHold>();
  private doorHolds = new Map<number, DoorHold>();
  private vehicleHolds = new Map<number, VehicleHold>();
  private turnHolds = new Map<number, TurnHold>();
  private riderTouches = new Map<number, RiderTouch>();
  /** Time of the last splash from a wheel in a puddle, per vehicle. */
  private wheelSplashAt = new Map<Vehicle, number>();
  private lastVehicleX = new Map<Vehicle, number>();
  /** Glide left over after a swipe, in world units per second. */
  private camVx = 0;
  /** The farm loops round: walking off one end comes back in at the other. */
  private readonly width: number;
  /** What the scene's layout looks like, so a save made from another layout keeps only its stacks. */
  private readonly layout: string;
  private readonly keepers: Keeper[] = [];
  private vanishing: Vanishing[] = [];
  private splashes = new Splashes();
  private notes = new Notes();
  private sky = new Sky();
  private motorOn = false;
  private nextSnoreAt = 0;
  private snoreTurn = 0;
  /** Offscreen canvas for the landscape at night. */
  private layer: CanvasRenderingContext2D | null = null;
  private time = 0;

  // View: world units are scaled to fit the screen, ground anchored at the bottom.
  private scale = 1;
  private camX = 0;
  /** How far the view has travelled in all, never wrapped: the hills scroll by this. */
  private camTravel = 0;
  private camY = 0;
  private viewW = SCREEN_W;
  private viewH = WORLD_H;

  constructor(scene: SceneDef) {
    this.width = scene.width;
    Stack.loop = scene.width;
    this.layout = JSON.stringify(scene);
    for (const def of scene.objects) {
      switch (def.type) {
        case 'tree':
          this.trees.push(new Tree(def.x, def.fruit));
          break;
        case 'puddle':
          this.puddles.push(new Puddle(def.x, def.width));
          break;
        case 'bed':
          this.beds.push(new Bed(def.x, def.width, def.veg));
          break;
        case 'cloud':
          this.clouds.push(new Cloud(def.x, def.y));
          break;
        case 'bin':
          this.bins.push(new Bin(def.x));
          break;
        case 'barn':
          this.barns.push(new Barn(def.x));
          break;
        case 'stable':
          this.stables.push(new Stable(def.x));
          break;
        case 'swing':
          this.swings.push(new Swing(def.x));
          break;
        case 'windmill':
          this.windmills.push(new Windmill(def.x));
          break;
        case 'dispenser':
          this.dispensers.push(new Dispenser(def.x));
          break;
        case 'vehicle':
          this.vehicles.push(new Vehicle(def.vehicle, def.x));
          break;
        case 'cornfield':
          this.cornfields.push(new CornField(def.x, def.width));
          break;
        case 'sunflowers':
          this.sunfields.push(new SunflowerField(def.x, def.width));
          break;
        case 'bush':
        case 'rock':
        case 'flowers':
          this.decor.push(new Decor(def.type, def.x, def.seed));
          break;
        case 'bird':
          this.birds.push(new Bird(def.x, def.color));
          break;
        case 'picnic':
          this.picnics.push(new Picnic(def.x, def.width));
          break;
        case 'basket':
          this.baskets.push(new Basket(def.x));
          break;
        case 'grill':
          this.grills.push(new Grill(def.x));
          break;
        case 'bench':
          this.benches.push(new Bench(def.x));
          break;
        case 'boombox':
          this.boomboxes.push(new Boombox(def.x));
          break;
        case 'house':
          this.houses.push(new House(def.x));
          break;
        case 'coop':
          this.coops.push(new Coop(def.x));
          break;
        case 'mud':
          this.puddles.push(new Mud(def.x, def.width));
          break;
        case 'animal':
        case 'toy':
          // Placed once everything they can sit in exists.
          break;
      }
    }
    for (const def of scene.objects) {
      if (def.type === 'animal') {
        const kinds: ItemKind[] = def.hat ? [def.animal, def.hat] : [def.animal];
        this.keepers.push({ kind: def.animal, spawn: () => this.placeAtHome(kinds, def.x, def.depth, def.home, def.seat) });
      } else if (def.type === 'toy') {
        this.keepers.push({ kind: def.toy, spawn: () => this.placeAtHome([def.toy], def.x, def.depth, def.home, def.seat) });
      }
    }
    for (const keeper of this.keepers) keeper.spawn();
    this.setCamera(scene.start ?? 0);
  }

  // --- The loop round ----------------------------------------------------

  /** A position on the loop, from 0 up to the farm's width. */
  private wrap(x: number): number {
    return ((x % this.width) + this.width) % this.width;
  }

  /** The shortest way from `b` to `a` round the loop. */
  private delta(a: number, b: number): number {
    return this.wrap(a - b + this.width / 2) - this.width / 2;
  }

  // --- Setting up --------------------------------------------------------

  /** Put an animal or toy where it lives: on the ground, floating in the pond, in the coop, on a sill. */
  private placeAtHome(kinds: ItemKind[], x: number, depth: number, home?: Home, only?: number): void {
    const stack = this.standOnGround(kinds, x, depth);
    if (home === 'pond') {
      const puddle = this.puddles.find((p) => Math.abs(this.delta(x, p.x)) < p.width / 2);
      if (puddle) this.settleFloating(stack, puddle);
    } else if (home) {
      const perches: Perch[] = home === 'coop' ? this.coops : this.houses;
      for (const perch of perches) {
        for (let seat = 0; seat < perch.seatCount; seat++) {
          if (Math.abs(this.delta(perch.seatX(seat), x)) > 300 || this.taken({ perch, seat })) continue;
          if (only !== undefined ? seat !== only : perch.accepts?.(seat, stack.items[0]) === false) continue;
          stack.state = 'anchored';
          stack.anchor = { perch, seat };
          ({ x: stack.x, top: stack.bottom } = anchorPoint(stack.anchor));
          return;
        }
      }
    }
  }

  private settleFloating(stack: Stack, sink: Sink): void {
    stack.floatingIn = sink;
    stack.state = 'resting';
    stack.x = sink.floatX(stack.x, stack.radius);
    stack.bottom = stack.floor = sink.floatBottom(stack.items[0].height);
  }

  private get walls(): (Barn | House)[] {
    return [...this.barns, ...this.houses];
  }

  /** Nothing stands behind a front wall unless it went into the barn through the doors. */
  private clearOfWalls(stack: Stack, mayBeInside: boolean): void {
    for (const barn of this.barns) if (mayBeInside && barn.isInside(stack.x, stack.floor)) return;
    for (const wall of this.walls) {
      if (wall.behindWall(stack.x, stack.floor)) stack.floor = stack.bottom = (wall instanceof House ? wall.frontDepth : wall.depth) + 2;
    }
  }

  /** Is the stack shut away, out of sight and reach: behind a barn door or a closed shutter? */
  private hidden(stack: Stack): boolean {
    const a = stack.anchor;
    if (a && 'perch' in a) return !!a.perch.hides?.(a.seat);
    return stack.state === 'resting' && this.barns.some((b) => b.isInside(stack.x, stack.floor) && b.covered(stack.x));
  }

  private standOnGround(kinds: ItemKind[], x: number, floor: number): Stack {
    const items = kinds.map((kind) => new Item(kind));
    const stack = new Stack(items, this.wrap(x), floor);
    stack.state = 'resting';
    stack.floor = floor;
    this.stacks.push(stack);
    return stack;
  }

  /** Puddles first, then bins: saves refer to them by this order. */
  private get sinks(): Sink[] {
    return [...this.puddles, ...this.bins];
  }

  /** Everywhere a stack can sit and move with; saves refer to them by this order. */
  private get perches(): Perch[] {
    return [...this.vehicles, ...this.swings, ...this.grills, ...this.coops, ...this.houses, ...this.benches];
  }

  // --- Saving ------------------------------------------------------------

  /** The scene as it would be once everything settles: carried and falling things are put down. */
  snapshot(): Saved {
    const stacks: SavedStack[] = [];
    for (const stack of this.stacks) {
      let items = stack.items;
      const water = stack.drowningIn ?? stack.floatingIn;
      // Drowning food is gone already; an animal in it floats with whatever it carries.
      if (stack.drowningIn) items = items.slice(Math.max(0, items.findIndex((i) => !i.disposable)));
      if (stack.drowningIn && items.every((i) => i.disposable)) continue;
      const saved: SavedStack = { items: items.map((i) => i.kind), x: stack.x, floor: stack.floor };
      const a = stack.anchor;
      if (water) saved.puddle = this.sinks.indexOf(water);
      else if (a && 'slot' in a) saved.tree = [this.trees.indexOf(a.tree), a.tree.slots.indexOf(a.slot)];
      else if (a && 'plot' in a) saved.bed = [this.beds.indexOf(a.bed), a.bed.plots.indexOf(a.plot)];
      else if (a) saved.perch = [this.perches.indexOf(a.perch), a.seat];
      else if (stack.state === 'held') saved.floor = stack.bottom >= GROUND_BAND ? stack.bottom : FALL_FLOOR;
      else if (stack.state === 'falling') saved.floor = this.landingFloor(stack);
      saved.floor = Math.min(FRONT_FLOOR, Math.max(GROUND_Y, saved.floor));
      stacks.push(saved);
    }
    return {
      version: 1,
      layout: this.layout,
      camX: this.camX,
      night: this.sky.toNight,
      stacks,
      trees: this.trees.map((t) => t.slots.map((s) => s.growth)),
      beds: this.beds.map((b) => b.plots.map((p) => ({ kind: p.kind, growth: p.growth }))),
      clouds: this.clouds.map((c) => [c.x, c.y]),
      vehicles: this.vehicles.map((v) => v.x),
      barns: this.barns.map((b) => [...b.slide]),
      dispensers: this.dispensers.map((d) => d.next),
      baskets: this.baskets.map((b) => b.turn),
      windows: this.houses.map((h) => [...h.isOpen]),
      doors: this.houses.map((h) => h.doorOpen),
    };
  }

  /** Open the farm as it was saved. Animals and toys are never lost, even from a save of another layout. */
  restore(saved: Saved): void {
    const sameLayout = saved.layout === this.layout;
    if (sameLayout) {
      saved.vehicles?.forEach((x, i) => this.vehicles[i]?.moveTo(x, 0));
      saved.barns?.forEach((slide, i) => {
        const barn = this.barns[i];
        if (!barn || !Array.isArray(slide)) return;
        barn.drag(0, slide[0]);
        barn.drag(1, slide[1]);
      });
      saved.dispensers?.forEach((next, i) => {
        const d = this.dispensers[i];
        if (d) d.next = next;
      });
      saved.baskets?.forEach((turn, i) => {
        const b = this.baskets[i];
        if (b) b.turn = turn;
      });
      saved.doors?.forEach((open, i) => {
        const house = this.houses[i];
        if (house && open !== house.doorOpen) house.toggleDoor();
        house?.update(10);
      });
      saved.windows?.forEach((open, i) => {
        const house = this.houses[i];
        if (!house) return;
        house.isOpen.forEach((_, w) => {
          house.isOpen[w] = !!open[w];
          house.open[w] = open[w] ? 1 : 0;
        });
      });
    }
    this.stacks = [];
    for (const s of saved.stacks) {
      if (!s.items.length) continue;
      const stack = this.standOnGround(s.items, s.x, s.floor);
      const sink = s.puddle !== undefined ? this.sinks[s.puddle] : undefined;
      const perch = sameLayout && s.perch ? this.perches[s.perch[0]] : undefined;
      const tree = sameLayout && s.tree ? this.trees[s.tree[0]] : undefined;
      const slot = tree?.slots[s.tree![1]];
      const bed = sameLayout && s.bed ? this.beds[s.bed[0]] : undefined;
      const plot = bed?.plots[s.bed![1]];
      if (sink && sameLayout) {
        this.settleFloating(stack, sink);
      } else if (tree && slot) {
        stack.state = 'anchored';
        stack.anchor = { tree, slot };
      } else if (bed && plot && plot.growth >= 1) {
        stack.state = 'anchored';
        stack.anchor = { bed, plot };
      } else if (perch && s.perch![1] < perch.seatCount) {
        stack.state = 'anchored';
        stack.anchor = { perch, seat: s.perch![1] };
      } else if (s.puddle !== undefined || s.tree || s.bed || s.perch) {
        // Its place is gone in the new layout: it stands on the ground instead.
        stack.bottom = stack.floor = FALL_FLOOR;
      }
      if (stack.anchor) ({ x: stack.x, top: stack.bottom } = anchorPoint(stack.anchor));
      else if (!stack.floatingIn) this.clearOfWalls(stack, sameLayout);
    }
    if (sameLayout) {
      saved.trees.forEach((growths, t) =>
        growths.forEach((growth, i) => {
          const slot = this.trees[t]?.slots[i];
          if (slot) slot.growth = growth;
        }),
      );
      saved.beds.forEach((plots, b) =>
        plots.forEach((p, i) => {
          const plot = this.beds[b]?.plots[i];
          if (plot) Object.assign(plot, p);
        }),
      );
      saved.clouds.forEach(([x, y], i) => {
        const cloud = this.clouds[i];
        if (cloud) Object.assign(cloud, { x: Math.max(cloud.minX, Math.min(cloud.maxX, x)), y });
      });
    }
    // Every animal and toy of the scene is there: any the save does not have (a new one) is put at home.
    const have: ItemKind[] = this.stacks.flatMap((s) => s.items.map((i) => i.kind));
    for (const keeper of this.keepers) {
      const i = have.indexOf(keeper.kind);
      if (i >= 0) have.splice(i, 1);
      else keeper.spawn();
    }
    this.sky.setNight(saved.night);
    this.setCamera(saved.camX);
  }

  resize(cssW: number, cssH: number): void {
    this.scale = Math.min(cssW / SCREEN_W, cssH / WORLD_H);
    this.viewW = cssW / this.scale;
    this.viewH = cssH / this.scale;
    this.camY = WORLD_H - this.viewH;
    this.setCamera(this.camX);
  }

  /** Move the view. The farm loops, so there is no end to stop at. */
  private setCamera(x: number): void {
    this.camTravel += x - this.camX;
    this.camX = this.wrap(x);
    this.sky.setView(this.camX, this.viewW);
  }

  /** A point on screen, in world units on the loop. */
  private toWorld(cssX: number, cssY: number): { x: number; y: number } {
    return { x: this.wrap(cssX / this.scale + this.camX), y: cssY / this.scale + this.camY };
  }

  // --- Input -------------------------------------------------------------

  pointerDown(id: number, cssX: number, cssY: number): void {
    const p = this.toWorld(cssX, cssY);

    let best: { stack: Stack; index: number } | null = null;
    let bestDist = Infinity;
    for (const stack of this.stacks) {
      if (stack.state === 'held' || this.hidden(stack)) continue;
      stack.shown().forEach((shown, index) => {
        const d = Math.hypot(this.delta(p.x, shown.x), p.y - shown.y);
        if (d <= shown.item.reach + GRAB_SLOP && d < bestDist) {
          best = { stack, index };
          bestDist = d;
        }
      });
    }

    // Things to pick that grow back: the nearest wins, against stacks too.
    let pickup: (() => Stack) | null = null;
    const offer = (dist: number, take: () => Stack) => {
      if (dist >= bestDist) return;
      bestDist = dist;
      best = null;
      pickup = take;
    };
    for (const tree of this.trees) {
      const hit = tree.slotAt(p.x, p.y, GRAB_SLOP);
      if (hit) offer(hit.dist, () => this.pick(tree, hit.slot));
    }
    for (const barn of this.barns) {
      const hit = barn.hayAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickHay(barn, hit.bale));
    }
    for (const bed of this.beds) {
      const hit = bed.plotAt(p.x, p.y, GRAB_SLOP);
      if (hit) offer(hit.dist, () => this.pickVeg(bed, hit.plot));
    }
    for (const basket of this.baskets) {
      const hit = basket.treatAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickTreat(basket));
    }
    for (const field of this.cornfields) {
      const hit = field.cobAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickCorn(field, hit.cob));
    }

    const cloud = this.clouds.find((c) => c.hits(p.x, p.y, GRAB_SLOP) && !c.raining);
    const door = this.barns.map((barn) => ({ barn, side: barn.doorAt(p.x, p.y, 10) })).find((d) => d.side !== null);
    const sails = this.windmills.find((w) => w.hitsSails(p.x, p.y, 10));
    const driven = new Set([...this.vehicleHolds.values()].map((h) => h.vehicle));
    const vehicle = this.vehicles.find((v) => v.hits(p.x, p.y, 0) && !driven.has(v));
    const take = pickup as (() => Stack) | null;
    if (take) {
      this.grab(id, take(), p);
    } else if (best) {
      const { stack, index } = best as { stack: Stack; index: number };
      const a = stack.anchor;
      if (a && 'perch' in a && a.perch instanceof Swing) this.riderTouches.set(id, { stack, index, point: p, startX: cssX, startY: cssY });
      else this.grab(id, index === 0 ? stack : this.split(stack, index), p);
    } else if (door) {
      const side = door.side!;
      this.doorHolds.set(id, { barn: door.barn, side, startSlide: door.barn.slide[side], startWorldX: p.x, cssX, startX: cssX, moved: 0 });
    } else if (sails) {
      sails.grab(p.x, p.y);
      this.turnHolds.set(id, { windmill: sails, cssX, cssY, startX: cssX, startY: cssY, moved: 0 });
    } else if (vehicle) {
      this.vehicleHolds.set(id, { vehicle, cssX, startX: cssX, dx: this.delta(vehicle.x, p.x), moved: 0 });
    } else if (cloud) {
      // Holding the cloud makes it rain.
      cloud.raining = true;
      this.cloudHolds.set(id, { cloud, cssX, cssY, dx: cloud.x - p.x, dy: cloud.y - p.y });
      audio.setRain(true);
    } else if (this.sky.hits(cssX / this.scale + this.camX, p.y, GRAB_SLOP)) {
      this.sky.toggle();
    } else {
      // Empty ground, sky or a structure: a drag moves the world, a tap goes to what is there.
      this.camVx = 0;
      this.pans.set(id, { cssX, speed: 0, startX: cssX, startY: cssY, moved: 0 });
    }
  }

  /** A tap on a structure or scenery: each does its own small thing. */
  private tap(p: { x: number; y: number }): void {
    const swing = this.swings.find((s) => s.hits(p.x, p.y, GRAB_SLOP));
    if (swing) {
      swing.push(p.x);
      audio.swoosh();
      return;
    }
    const dispenser = this.dispensers.find((d) => d.hits(p.x, p.y, 10));
    if (dispenser) return this.dispense(dispenser);
    const boombox = this.boomboxes.find((b) => b.hits(p.x, p.y, 10));
    if (boombox) {
      // Only one song at a time on the whole farm.
      for (const other of this.boomboxes) if (other !== boombox) other.song = 0;
      audio.shutter();
      audio.playSong(boombox.tap());
      return;
    }
    for (const house of this.houses) {
      if (house.chimneyAt(p.x, p.y, 10)) {
        audio.puff(house.toggleSmoke());
        return;
      }
      if (house.doorAt(p.x, p.y, 6)) {
        audio.creak(house.toggleDoor());
        this.greet(house, 4);
        return;
      }
      const w = house.windowAt(p.x, p.y, 10);
      if (w === null) continue;
      house.toggle(w);
      audio.shutter();
      if (house.isOpen[w]) this.greet(house, w);
      return;
    }
    const bird = this.birds.find((b) => b.hits(p.x, p.y, GRAB_SLOP));
    if (bird) return bird.scare();
    if (this.sunfields.some((f) => f.tap(p.x, p.y, 10))) return;
    const picnic = this.picnics.find((pc) => pc.hitsBunting(p.x, p.y, 10));
    if (picnic) {
      picnic.tapBunting();
      audio.flutter();
      return;
    }
    const windmill = this.windmills.find((w) => w.hits(p.x, p.y, 10));
    if (windmill) {
      windmill.push();
      audio.whoosh();
      return;
    }
    this.decor.find((d) => d.hits(p.x, p.y, 10))?.tap();
  }

  /** Opening a window or door: an animal waiting behind it says hello. */
  private greet(perch: Perch, seat: number): void {
    const stack = this.stacks.find((s) => s.anchor && 'perch' in s.anchor && s.anchor.perch === perch && s.anchor.seat === seat);
    const animal = stack?.items.find((i) => i.animal);
    if (!animal) return;
    animal.wake();
    audio.animal(animal.animal!);
  }

  /** How many of each thing that comes back are out in the world (carried, stacked or lying about). */
  private countOut(): { fruit: Map<string, number>; veg: number; hay: number; hats: number; treats: number; eggs: number } {
    const out = { fruit: new Map<string, number>(), veg: 0, hay: 0, hats: 0, treats: 0, eggs: 0 };
    for (const stack of this.stacks) {
      for (const { kind } of stack.items) {
        if (isFruit(kind)) out.fruit.set(kind, (out.fruit.get(kind) ?? 0) + 1);
        else if (isVeg(kind)) out.veg++;
        else if (kind === 'hay') out.hay++;
        else if (kind === 'egg') out.eggs++;
        else if (isHat(kind)) out.hats++;
        else if ((TREATS as string[]).includes(kind)) out.treats++;
      }
    }
    return out;
  }

  /** A hat slides out of the machine, unless enough are out already. */
  private dispense(dispenser: Dispenser): void {
    const hats = this.countOut().hats;
    if (hats >= HAT_CAP) {
      dispenser.pressEmpty();
      audio.boop();
      return;
    }
    const { kind, x, bottom } = dispenser.dispense();
    const stack = new Stack([new Item(kind)], x, bottom);
    // Each new hat slides a little further out and lands in front of the ones already there.
    stack.vx = 110 + 50 * (hats % 8);
    stack.vy = -120;
    this.stacks.push(stack);
    audio.clunk();
  }

  pointerMove(id: number, cssX: number, cssY: number): void {
    const hold = this.holds.get(id);
    if (hold) {
      hold.cssX = cssX;
      hold.cssY = cssY;
    }
    const cloudHold = this.cloudHolds.get(id);
    if (cloudHold) {
      cloudHold.cssX = cssX;
      cloudHold.cssY = cssY;
    }
    const rider = this.riderTouches.get(id);
    if (rider && Math.hypot(cssX - rider.startX, cssY - rider.startY) >= TAP_SLOP) {
      this.riderTouches.delete(id);
      const { stack, index } = rider;
      if (this.stacks.includes(stack) && index < stack.items.length) {
        this.grab(id, index === 0 ? stack : this.split(stack, index), rider.point);
        const grabbed = this.holds.get(id)!;
        grabbed.cssX = cssX;
        grabbed.cssY = cssY;
      }
    }
    const doorHold = this.doorHolds.get(id);
    if (doorHold) {
      doorHold.cssX = cssX;
      doorHold.moved = Math.max(doorHold.moved, Math.abs(cssX - doorHold.startX));
    }
    const turn = this.turnHolds.get(id);
    if (turn) {
      turn.cssX = cssX;
      turn.cssY = cssY;
      turn.moved = Math.max(turn.moved, Math.hypot(cssX - turn.startX, cssY - turn.startY));
    }
    const drive = this.vehicleHolds.get(id);
    if (drive) {
      drive.moved = Math.max(drive.moved, Math.abs(cssX - drive.startX));
      drive.cssX = cssX;
    }
    const pan = this.pans.get(id);
    if (pan) {
      pan.moved = Math.max(pan.moved, Math.hypot(cssX - pan.startX, cssY - pan.startY));
      const dx = (cssX - pan.cssX) / this.scale;
      pan.cssX = cssX;
      this.setCamera(this.camX - dx);
      pan.speed = pan.speed * 0.6 + (-dx / STEP) * 0.4;
    }
  }

  pointerUp(id: number): void {
    const cloudHold = this.cloudHolds.get(id);
    if (cloudHold) {
      this.cloudHolds.delete(id);
      cloudHold.cloud.raining = false;
      audio.setRain(this.clouds.some((c) => c.raining));
    }
    const rider = this.riderTouches.get(id);
    if (rider) {
      this.riderTouches.delete(id);
      const a = rider.stack.anchor;
      if (a && 'perch' in a && a.perch instanceof Swing) {
        a.perch.push(rider.point.x);
        audio.swoosh();
      }
    }
    const doorHold = this.doorHolds.get(id);
    if (doorHold) {
      this.doorHolds.delete(id);
      if (doorHold.moved < TAP_SLOP) audio.creak(doorHold.barn.toggle(doorHold.side));
    }
    const turn = this.turnHolds.get(id);
    if (turn) {
      this.turnHolds.delete(id);
      turn.windmill.letGo();
      if (turn.moved < TAP_SLOP) {
        turn.windmill.push();
        audio.whoosh();
      }
    }
    const drive = this.vehicleHolds.get(id);
    if (drive) {
      this.vehicleHolds.delete(id);
      if (drive.moved < TAP_SLOP) audio.honk(drive.vehicle.kind === 'tractor');
    }
    const pan = this.pans.get(id);
    if (pan) {
      this.pans.delete(id);
      if (pan.moved < TAP_SLOP) this.tap(this.toWorld(pan.startX, pan.startY));
      else if (!settings.reduceMotion) this.camVx = Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, pan.speed));
    }
    const hold = this.holds.get(id);
    if (!hold) return;
    this.holds.delete(id);
    this.release(hold.stack);
  }

  /** Pulling a ripe vegetable out of its bed also takes any tower resting on it. */
  private pickVeg(bed: Bed, plot: Plot): Stack {
    const item = new Item(plot.kind);
    const resting = this.restingOn(plot);
    const y = bed.pick(plot);
    return this.picked(item, resting, plot.x, y + item.height / 2);
  }

  private pickCorn(field: CornField, cob: Cob): Stack {
    const item = new Item('corn');
    field.pick(cob);
    return this.picked(item, undefined, cob.x + 12, cob.y + item.height / 2);
  }

  /** Take the treat sitting on top of the picnic basket. */
  private pickTreat(basket: Basket): Stack {
    const { kind, x, bottom } = basket.take();
    return this.picked(new Item(kind), undefined, x, bottom);
  }

  /** Take a bale of hay from the barn floor. */
  private pickHay(barn: Barn, bale: HayBale): Stack {
    const item = new Item('hay');
    barn.takeHay(bale);
    return this.picked(item, undefined, bale.x, barn.insideFloor);
  }

  /** Taking a fruit off the tree also takes any tower resting on it. */
  private pick(tree: Tree, slot: Slot): Stack {
    const item = new Item(tree.fruit);
    const resting = this.restingOn(slot);
    tree.pick(slot);
    return this.picked(item, resting, slot.x, slot.y + item.height / 2);
  }

  private restingOn(spot: Slot | Plot): Stack | undefined {
    return this.stacks.find((s) => s.anchor && ('slot' in s.anchor ? s.anchor.slot : 'plot' in s.anchor ? s.anchor.plot : null) === spot);
  }

  private taken(anchor: Anchor): boolean {
    return this.stacks.some((s) => s.anchor && sameSpot(s.anchor, anchor));
  }

  private picked(item: Item, resting: Stack | undefined, x: number, bottom: number): Stack {
    audio.pop();
    const stack = new Stack([item, ...(resting?.items ?? [])], x, bottom);
    if (resting) {
      stack.continueFrom(resting);
      this.removeStack(resting);
    }
    this.stacks.push(stack);
    return stack;
  }

  private grab(id: number, stack: Stack, p: { x: number; y: number }): void {
    stack.state = 'held';
    stack.anchor = null;
    stack.drowningIn = null;
    stack.floatingIn = null;
    for (const item of stack.items) item.wake();
    const animal = stack.items.find((i) => i.animal)?.animal;
    if (animal) audio.animal(animal);
    const css = { x: this.wrap(p.x - this.camX) * this.scale, y: (p.y - this.camY) * this.scale };
    this.holds.set(id, { stack, cssX: css.x, cssY: css.y, dx: this.delta(stack.x, p.x), dy: stack.bottom - p.y });
  }

  /** Grabbing above the bottom splits the tower: that item and all above come away. */
  private split(stack: Stack, index: number): Stack {
    const upper = new Stack(stack.items.splice(index), stack.x, stack.bottomOf(index));
    upper.continueFrom(stack);
    this.stacks.push(upper);
    return upper;
  }

  /**
   * Letting go: placed gently on a tower, a fruit or a seat it sticks there,
   * placed on water it drowns. Otherwise it stays at that depth if let go low
   * on the ground, or falls from the air onto the ground in front.
   */
  private release(stack: Stack): void {
    const speed = Math.hypot(stack.vx, stack.vy);
    if (speed < PLACE_SPEED) {
      const eater = this.mouthFor(stack);
      if (eater && eater.dist <= stack.items[0].radius + EAT_DIST) return this.feed(eater.item, stack);
      const target = this.towerUnder(stack);
      if (target) return this.glue(target, stack);
      const anchor = this.fruitUnder(stack) ?? this.vegUnder(stack) ?? this.seatUnder(stack);
      if (anchor) return this.rest(stack, anchor);
      const bed = this.beds.find((b) => b.freePlotAt(stack.x, stack.bottom));
      const bottom = stack.items[0];
      if (bed && isVeg(bottom.kind)) return this.plant(bed, stack);
      const sink = this.sinks.find((p) => p.holds(stack.x, stack.bottom));
      if (sink) return this.intoSink(stack, sink);
      const barn = this.barns.find((b) => b.takesIn(stack.x, stack.bottom));
      if (barn) {
        stack.x = barn.insideX(stack.x, stack.radius);
        stack.fixedFloor = barn.insideFloor;
        stack.vx = stack.vy = 0;
        stack.state = 'falling';
        return;
      }
    } else {
      const k = MAX_RELEASE_SPEED / speed;
      if (k < 1) {
        stack.vx *= k;
        stack.vy *= k;
      }
    }
    this.drop(stack);
  }

  /** Let go somewhere plain: low on the ground it stays at that depth, in the air it falls in front. */
  private drop(stack: Stack): void {
    let floor = stack.bottom >= GROUND_BAND ? Math.min(FRONT_FLOOR, Math.max(GROUND_Y, stack.bottom)) : null;
    // Never behind a front wall: into the barn only through the doors.
    for (const wall of this.walls) {
      const front = wall instanceof House ? wall.frontDepth : wall.depth;
      if (floor !== null && wall.behindWall(stack.x, floor)) floor = front + 2;
    }
    stack.fixedFloor = floor;
    stack.state = 'falling';
  }

  /** Into the water or the bin: what comes back goes under one by one, an animal or toy floats or sits. */
  private intoSink(stack: Stack, sink: Sink): void {
    if (!stack.items[0].disposable) return this.float(stack, sink);
    stack.drowningIn = sink;
    stack.fixedFloor = sink.drownY;
    if (sink instanceof Bin) stack.x = sink.floatX(stack.x, 0);
    stack.vx = stack.vy = 0;
    stack.state = 'falling';
  }

  /** An animal or toy at the bottom of a stack floats on the water, slightly sunk in, or sits on a bin. */
  private float(stack: Stack, sink: Sink): void {
    stack.floatingIn = sink;
    stack.drowningIn = null;
    stack.fixedFloor = sink.floatBottom(stack.items[0].height);
    stack.vx = stack.vy = 0;
    stack.state = 'falling';
  }

  /** The animal whose mouth is nearest to the food being held, if close enough. */
  private mouthFor(food: Stack): { item: Item; dist: number } | null {
    if (!food.items[0].food) return null;
    const fx = food.x;
    const fy = food.bottom - food.items[0].height / 2;
    let best: { item: Item; dist: number } | null = null;
    for (const stack of this.stacks) {
      if (stack === food || stack.state === 'held' || this.hidden(stack)) continue;
      for (const s of stack.shown()) {
        if (!s.item.animal || s.item.chew > 0) continue;
        const dist = Math.hypot(this.delta(fx, s.x), fy - (s.y + s.item.mouthY));
        if (dist < MOUTH_OPEN_DIST && (!best || dist < best.dist)) best = { item: s.item, dist };
      }
    }
    return best;
  }

  /** The animal eats only the piece being held; anything stacked on it drops to the ground. */
  private feed(animal: Item, food: Stack): void {
    const owner = this.stacks.find((s) => s.items.includes(animal))!;
    const shown = owner.shown().find((s) => s.item === animal)!;
    const eaten = food.items.shift()!;
    this.vanishing.push({
      kind: eaten.kind as LooseKind,
      x: shown.x,
      y: shown.y + animal.mouthY,
      age: 0,
      into: 'mouth',
      depth: Infinity,
    });
    animal.feed();
    if (food.items.length === 0) return this.removeStack(food);
    food.bottom -= eaten.height;
    food.vx = food.vy = 0;
    this.drop(food);
  }

  private towerUnder(stack: Stack): Stack | null {
    let best: Stack | null = null;
    let bestDist = Infinity;
    for (const other of this.stacks) {
      if (other === stack || (other.state !== 'resting' && other.state !== 'anchored') || other.drowningIn) continue;
      if (this.hidden(other)) continue;
      const top = other.items[other.items.length - 1];
      const dx = Math.abs(this.delta(stack.x, other.x));
      const dy = Math.abs(stack.bottom - (other.bottom - other.height));
      if (dx < (top.radius + stack.radius) * 0.6 && dy < stack.items[0].height * 0.5 && dx + dy < bestDist) {
        best = other;
        bestDist = dx + dy;
      }
    }
    return best;
  }

  private fruitUnder(stack: Stack): Anchor | null {
    for (const tree of this.trees) {
      for (const slot of tree.slots) {
        if (slot.growth < 0.15 || this.restingOn(slot)) continue;
        const dx = Math.abs(stack.x - slot.x);
        const dy = Math.abs(stack.bottom - tree.fruitTop(slot));
        if (dx < stack.radius * 0.8 && dy < stack.items[0].height * 0.5) return { tree, slot };
      }
    }
    return null;
  }

  /** A ripe vegetable in a bed under the stack's bottom, free to stack on. */
  private vegUnder(stack: Stack): Anchor | null {
    for (const bed of this.beds) {
      for (const plot of bed.plots) {
        if (plot.growth < 1 || this.restingOn(plot)) continue;
        const dx = Math.abs(stack.x - plot.x);
        const dy = Math.abs(stack.bottom - bed.vegTop(plot));
        if (dx < stack.radius * 0.8 && dy < stack.items[0].height * 0.5) return { bed, plot };
      }
    }
    return null;
  }

  /** The bottom vegetable goes back into the bed, ripe; anything stacked on it stays on top. */
  private plant(bed: Bed, stack: Stack): void {
    const plot = bed.freePlotAt(stack.x, stack.bottom)!;
    const planted = stack.items.shift()!;
    bed.plant(plot, planted.kind as VegKind);
    audio.plop(0.5);
    if (stack.items.length === 0) return this.removeStack(stack);
    this.rest(stack, { bed, plot });
  }

  /** A free seat under the stack's bottom: a vehicle, the swing, the grill, the coop, a sill. */
  private seatUnder(stack: Stack): Anchor | null {
    const bottom = stack.items[0];
    for (const perch of this.perches) {
      for (let seat = 0; seat < perch.seatCount; seat++) {
        if (this.taken({ perch, seat }) || perch.accepts?.(seat, bottom) === false) continue;
        const dx = Math.abs(this.delta(stack.x, perch.seatX(seat)));
        const dy = Math.abs(stack.bottom - perch.seatTop(seat));
        if (dx <= perch.seatReach(seat) && dy <= Math.max(24, bottom.height * 0.5)) {
          perch.seated?.(seat, stack.vx);
          return { perch, seat };
        }
      }
    }
    return null;
  }

  /** Glue `upper` straight on top of `lower`, so they move as one tower. */
  private glue(lower: Stack, upper: Stack): void {
    const below = lower.items[lower.items.length - 1];
    below.squash = 0.15;
    upper.items[0].squash = 0.25;
    // A sideways landing sets the tower rocking a little.
    lower.nudge((upper.vx / 60) * 0.3);
    lower.items.push(...upper.items);
    this.removeStack(upper);
    audio.plop(0.4);
    this.limitHeight(lower);
    this.playIfGiven(lower);
  }

  /** Rest a stack on a fruit hanging on the tree (even a growing one), a bed vegetable or a seat. */
  private rest(stack: Stack, anchor: Anchor): void {
    stack.state = 'anchored';
    stack.anchor = anchor;
    ({ x: stack.x, top: stack.bottom } = anchorPoint(anchor));
    stack.vx = stack.vy = 0;
    stack.items[0].squash = 0.25;
    audio.plop(0.4);
    this.limitHeight(stack);
    this.playIfGiven(stack);
  }

  /** An instrument sitting straight on an animal: the animal plays it. */
  private playIfGiven(stack: Stack): void {
    for (let i = 1; i < stack.items.length; i++) {
      const animal = stack.items[i - 1];
      const instrument = stack.items[i];
      if (!animal.animal || !isInstrument(instrument.kind) || animal.playing > 0) continue;
      animal.playing = PLAY_SECONDS;
      animal.wake();
      audio.music(instrument.kind as InstrumentKind, PITCH[animal.animal]);
    }
  }

  /** A tower stops at the top of the screen; what does not fit falls off beside it. */
  private limitHeight(stack: Stack): void {
    const top = this.camY + TOP_MARGIN;
    let keep = 1;
    while (keep < stack.items.length && stack.bottomOf(keep + 1) >= top) keep++;
    if (keep >= stack.items.length) return;

    const bottom = stack.bottomOf(keep);
    const excess = stack.items.splice(keep);
    const towardMiddle = this.delta(stack.x, this.camX + this.viewW / 2) < 0 ? 1 : -1;
    const fallen = new Stack(excess, this.wrap(stack.x + towardMiddle * (stack.radius + excess[0].radius) * 1.1), bottom);
    fallen.continueFrom(stack);
    fallen.nudge(towardMiddle * 1.5);
    this.stacks.push(fallen);
  }

  private removeStack(stack: Stack): void {
    this.stacks = this.stacks.filter((s) => s !== stack);
    for (const [id, hold] of this.holds) if (hold.stack === stack) this.holds.delete(id);
  }

  /** Where a dropped stack lands: in front of the ground line and anything it falls past. */
  private landingFloor(stack: Stack): number {
    if (stack.fixedFloor !== null) return stack.fixedFloor;
    let floor = FALL_FLOOR;
    for (const other of this.stacks) {
      if (other === stack || other.state !== 'resting' || other.drowningIn || other.floatingIn) continue;
      if (Math.abs(this.delta(other.x, stack.x)) < (other.radius + stack.radius) * 0.9) floor = Math.max(floor, other.floor + LAYER_GAP);
    }
    return Math.min(floor, FRONT_FLOOR);
  }

  // --- Simulation --------------------------------------------------------

  step(): void {
    const dt = STEP;
    this.time += dt;

    const camBefore = this.camX;
    this.moveCamera(dt);
    const camMoved = this.delta(this.camX, camBefore);

    for (const stack of this.stacks) for (const item of stack.items) item.wantsFood = false;
    for (const hold of this.holds.values()) {
      const eater = this.mouthFor(hold.stack);
      if (eater) eater.item.wantsFood = true;
    }

    for (const drive of this.vehicleHolds.values()) {
      const { vehicle } = drive;
      const finger = this.toWorld(drive.cssX, 0);
      const x = this.wrap(finger.x + drive.dx);
      vehicle.moveTo(x, this.delta(x, vehicle.x));
    }
    this.splashWheels();
    for (const hold of this.doorHolds.values()) {
      if (hold.moved < TAP_SLOP) continue;
      const finger = this.toWorld(hold.cssX, 0);
      const slid = (this.delta(finger.x, hold.startWorldX) * Barn.direction(hold.side)) / Barn.panelWidth;
      hold.barn.drag(hold.side, hold.startSlide + slid);
    }
    for (const turn of this.turnHolds.values()) {
      const finger = this.toWorld(turn.cssX, turn.cssY);
      turn.windmill.follow(turn.windmill.x + this.delta(finger.x, turn.windmill.x), finger.y, dt);
    }

    for (const hold of this.holds.values()) {
      const { stack } = hold;
      const finger = this.toWorld(hold.cssX, hold.cssY);
      const x = this.wrap(finger.x + hold.dx);
      const bottom = finger.y + hold.dy;
      // Smoothed finger speed, kept for a flick on release. Scrolling is not a flick.
      stack.vx = stack.vx * 0.5 + ((this.delta(x, stack.x) - camMoved) / dt) * 0.5;
      stack.vy = stack.vy * 0.5 + ((bottom - stack.bottom) / dt) * 0.5;
      stack.x = x;
      stack.bottom = bottom;
    }

    for (const stack of [...this.stacks]) {
      switch (stack.state) {
        case 'anchored':
          ({ x: stack.x, top: stack.bottom } = anchorPoint(stack.anchor!));
          break;
        case 'falling':
          this.fall(stack, dt);
          break;
        case 'resting':
          if (stack.vx !== 0) {
            stack.x = this.wrap(stack.x + stack.vx * dt);
            stack.vx *= Math.exp(-10 * dt);
            if (Math.abs(stack.vx) < 5) stack.vx = 0;
          }
          if (stack.drowningIn && this.time >= stack.nextSinkAt) this.sinkBottom(stack, stack.drowningIn);
          else if (stack.floatingIn instanceof Puddle) this.paddle(stack, stack.floatingIn, dt);
          break;
      }
    }

    for (const stack of this.stacks) {
      for (const item of stack.items) {
        if (stack.state === 'held') item.wake();
        item.asleep = this.sky.isNight && !!item.animal && item.restful;
      }
      stack.update(dt);
    }
    this.runMotor();
    this.layEggs();
    this.bake(dt);
    this.playMusic();
    this.sky.update(dt);
    this.snoreNow();
    this.rain(dt);
    for (const puddle of this.puddles) puddle.update(dt);
    for (const thing of [
      ...this.bins,
      ...this.swings,
      ...this.windmills,
      ...this.dispensers,
      ...this.sunfields,
      ...this.decor,
      ...this.picnics,
      ...this.boomboxes,
    ])
      thing.update(dt);
    for (const house of this.houses) house.update(dt, settings.reduceMotion);
    for (const bird of this.birds) bird.update(dt, this.onScreen(bird.x, 60));
    for (const v of this.vanishing) v.age += dt;
    this.vanishing = this.vanishing.filter((v) => v.age < SINK_SECONDS);
    this.splashes.update(dt);
    this.notes.update(dt);
  }

  /** Is this spot on screen right now (with a margin)? */
  private onScreen(x: number, margin: number): boolean {
    const d = this.wrap(x - this.camX);
    return d >= -margin && d <= this.viewW + margin;
  }

  /** A boat or duck floating on a puddle paddles slowly from one side to the other and back. */
  private paddle(stack: Stack, puddle: Puddle, dt: number): void {
    const speed = PADDLE_SPEED[stack.items[0].kind];
    if (!speed) return;
    const reach = Math.max(0, puddle.width / 2 - stack.radius * 0.8);
    stack.x += stack.paddle * speed * dt;
    if (stack.x > puddle.x + reach) stack.paddle = -1;
    if (stack.x < puddle.x - reach) stack.paddle = 1;
    stack.x = Math.max(puddle.x - reach, Math.min(puddle.x + reach, stack.x));
  }

  /** The ship's motor is heard while it sails somewhere in sight. */
  private runMotor(): void {
    const sailing = this.stacks.some(
      (s) => s.items[0].kind === 'ship' && s.floatingIn instanceof Puddle && s.state === 'resting' && this.onScreen(s.x, 0),
    );
    if (sailing === this.motorOn) return;
    this.motorOn = sailing;
    audio.setMotor(sailing);
  }

  /** A hen fed while sitting in the coop lays an egg, which drops out underneath. */
  private layEggs(): void {
    for (const stack of this.stacks) {
      const a = stack.anchor;
      if (!a || !('perch' in a) || !(a.perch instanceof Coop)) continue;
      const hen = stack.items[0];
      if (hen.kind !== 'hen' || !hen.justAte || this.countOut().eggs >= EGG_CAP) continue;
      const { x, bottom } = a.perch.eggDrop;
      const egg = new Stack([new Item('egg')], x, bottom);
      egg.fixedFloor = a.perch.depth + 20;
      this.stacks.push(egg);
      audio.eggPop();
    }
  }

  /** Fruit or a vegetable on the grill bakes into a pie. */
  private bake(dt: number): void {
    for (const grill of this.grills) {
      const stack = this.stacks.find((s) => s.anchor && 'perch' in s.anchor && s.anchor.perch === grill);
      const raw = stack && (isFruit(stack.items[0].kind) || isVeg(stack.items[0].kind));
      if (!stack || !raw) {
        grill.baking = 0;
        continue;
      }
      if (grill.baking === 0) audio.sizzle();
      grill.baking += dt;
      if (grill.baking < BAKE_SECONDS) continue;
      stack.items[0] = new Item('pie');
      stack.items[0].squash = 0.3;
      grill.baking = 0;
      audio.ding();
    }
  }

  /** Notes float up from every animal playing an instrument. */
  private playMusic(): void {
    const every = settings.reduceMotion ? 0.7 : 0.35;
    if (Math.floor(this.time / every) === Math.floor((this.time - STEP) / every)) return;
    for (const stack of this.stacks) {
      if (this.hidden(stack)) continue;
      for (const s of stack.shown()) if (s.item.playing > 0) this.notes.add(s.x + s.item.radius * 0.6, s.y - s.item.height / 2);
    }
    for (const box of this.boomboxes) if (box.song) this.notes.add(box.x + (Math.random() - 0.5) * 60, box.depth - 80);
  }

  /** Glide after a swipe, and scroll while something is carried to the screen edge. */
  private moveCamera(dt: number): void {
    let x = this.camX;
    // A finger resting on the ground lets its swipe speed fade, so letting go then doesn't glide.
    for (const pan of this.pans.values()) pan.speed *= Math.exp(-12 * dt);
    if (this.pans.size === 0) {
      x += this.camVx * dt;
      this.camVx *= Math.exp(-5 * dt);
    }
    const screenW = this.viewW * this.scale;
    const zone = Math.min(EDGE_SCROLL_ZONE, screenW / 6);
    for (const hold of [...this.holds.values(), ...this.cloudHolds.values(), ...this.vehicleHolds.values(), ...this.doorHolds.values()]) {
      // A cloud at the end of its reach no longer pulls the view along.
      const cloud = 'cloud' in hold ? hold.cloud : null;
      if (hold.cssX < zone && !(cloud && cloud.x <= cloud.minX)) x -= EDGE_SCROLL_SPEED * (1 - hold.cssX / zone) * dt;
      else if (hold.cssX > screenW - zone && !(cloud && cloud.x >= cloud.maxX))
        x += EDGE_SCROLL_SPEED * (1 - (screenW - hold.cssX) / zone) * dt;
    }
    if (x !== this.camX) this.setCamera(x);
  }

  /** Move held clouds; rain grows vegetables, speeds up fruit, ripples puddles and washes off mud. */
  private rain(dt: number): void {
    for (const hold of this.cloudHolds.values()) {
      const finger = this.toWorld(hold.cssX, hold.cssY);
      const { cloud } = hold;
      const target = cloud.x + this.delta(finger.x + hold.dx, cloud.x);
      cloud.x = Math.max(cloud.minX, Math.min(cloud.maxX, target));
      cloud.y = Math.max(70, Math.min(300, finger.y + hold.dy));
    }
    const wet = (x: number) => this.clouds.some((c) => c.wets(x));
    const out = this.countOut();
    const fruit = [...out.fruit.values()].reduce((a, b) => a + b, 0);
    for (const tree of this.trees) tree.update(dt, wet, fruit < FRUIT_CAP && (out.fruit.get(tree.fruit) ?? 0) < FRUIT_KIND_CAP);
    for (const bed of this.beds) bed.update(dt, wet, out.veg < VEG_CAP);
    for (const field of this.cornfields) field.update(dt, wet, out.veg < VEG_CAP);
    for (const barn of this.barns) barn.update(dt, out.hay < HAY_CAP);
    for (const basket of this.baskets) if (basket.update(dt, out.treats < TREAT_CAP)) audio.basket();
    for (const cloud of this.clouds) {
      cloud.update(dt, (x) => {
        const puddle = this.puddles.find((p) => Math.abs(x - p.x) < p.width * 0.4);
        if (puddle && Math.random() < 0.15) puddle.ripple(x, 0.2);
      });
    }
    // An animal out in the rain puts up an umbrella, and folds it when the rain stops.
    for (const stack of this.stacks) {
      const out = stack.state !== 'held' && !this.hidden(stack) && !this.underRoof(stack);
      const wants = out && wet(stack.x) && stack.items.some((i) => i.animal) ? 1 : 0;
      stack.umbrella += (wants - stack.umbrella) * Math.min(1, dt * 5);
    }
    // Water washes mud off: floating in a puddle quickly, standing in the rain slowly.
    for (const stack of this.stacks) {
      if (stack.floatingIn instanceof Mud) {
        // Sitting in the mud keeps an animal muddy, rain or not.
        if (stack.state === 'resting' && stack.items[0].animal) stack.items[0].muddy = 1;
        continue;
      }
      const rate = stack.floatingIn instanceof Puddle ? 0.8 : wet(stack.x) ? 0.4 : 0;
      if (rate) for (const item of stack.items) item.muddy = Math.max(0, item.muddy - rate * dt);
    }
  }

  /** Inside the barn, or in the coop or a window, rain does not reach. */
  private underRoof(stack: Stack): boolean {
    const a = stack.anchor;
    if (a && 'perch' in a) return a.perch instanceof Coop || a.perch instanceof House;
    return stack.state === 'resting' && this.barns.some((b) => b.isInside(stack.x, stack.floor));
  }

  /** Deep in the night, now and then one sleeping animal snores. */
  private snoreNow(): void {
    if (this.sky.night < 1) {
      this.nextSnoreAt = this.time + 2;
      return;
    }
    if (this.time < this.nextSnoreAt) return;
    const sleepers = this.stacks.flatMap((s) => (s.state === 'held' ? [] : s.items.filter((i) => i.asleep)));
    this.nextSnoreAt = this.time + 4 + Math.random() * 4;
    if (!sleepers.length) return;
    sleepers[this.snoreTurn++ % sleepers.length].snore = SNORE_SECONDS;
    audio.snore();
  }

  private fall(stack: Stack, dt: number): void {
    stack.vy += GRAVITY * dt;
    stack.x = this.wrap(stack.x + stack.vx * dt);
    // A floater drifts gently toward open water.
    if (stack.floatingIn) stack.x += (stack.floatingIn.floatX(stack.x, stack.radius) - stack.x) * Math.min(1, dt * 6);
    const before = stack.bottom;
    stack.bottom += stack.vy * dt;
    // Thrown or dropped through a bin's opening, it goes in.
    if (!stack.drowningIn && !stack.floatingIn && stack.vy > 0) {
      const bin = this.bins.find((b) => b.catches(stack.x, before, stack.bottom));
      if (bin) {
        stack.bottom = bin.rim;
        this.intoSink(stack, bin);
      }
    }
    stack.floor = this.landingFloor(stack);
    if (stack.bottom < stack.floor) return;

    stack.bottom = stack.floor;
    const impact = stack.vy;
    if (stack.floatingIn instanceof Puddle) {
      stack.x = stack.floatingIn.floatX(stack.x, stack.radius);
      this.splash(stack.x, stack.floatingIn.surfaceY, 0.4, stack.floatingIn.light);
      stack.floatingIn.ripple(stack.x, 1);
      if (stack.floatingIn instanceof Mud) audio.squelch();
      else audio.plop(0.6);
    } else if (stack.floatingIn) {
      stack.x = stack.floatingIn.floatX(stack.x, stack.radius);
      stack.items[0].squash = 0.2;
      audio.plop(0.4);
    } else if (impact > 80) {
      stack.items[0].squash = Math.min(0.3, impact * 0.0004);
      audio.plop(impact / 900);
    }
    if (impact > 500 && !stack.drowningIn && !stack.floatingIn) {
      stack.vy = -impact * 0.25;
      return;
    }
    stack.vy = 0;
    stack.state = 'resting';
    this.limitHeight(stack);
    if (!stack.drowningIn) this.playIfGiven(stack);
  }

  /** A tower goes under (or into the bin) one item at a time, bottom first; the rest drops in after it. */
  private sinkBottom(stack: Stack, sink: Sink): void {
    const first = stack.items.shift()!;
    const y = stack.bottom - first.height / 2;
    const water = sink instanceof Puddle;
    this.vanishing.push({
      kind: first.kind as LooseKind,
      x: stack.x,
      y,
      age: 0,
      into: water ? 'water' : 'bin',
      // In front of the puddle or bin, hidden below the water line or the middle of the bin's opening.
      depth: sink.depth + 0.6,
      waterline: sink instanceof Bin ? sink.rim + 4 : stack.bottom,
      drop: first.height + 8,
      light: water ? sink.light : undefined,
      hole: sink instanceof Bin ? { x: sink.x, rx: Bin.openingRx, ry: Bin.openingRy } : undefined,
    });
    if (sink instanceof Puddle) {
      this.splash(stack.x, sink.surfaceY, 1, sink.light);
      sink.ripple(stack.x, 1);
      audio.plock(1);
    } else if (sink instanceof Bin) {
      sink.swallow();
      audio.gulp();
      if (!stack.items.some((i) => i.disposable)) audio.burp(0.35);
    }

    if (stack.items.length === 0) return this.removeStack(stack);
    stack.bottom -= first.height;
    stack.nextSinkAt = this.time + DROWN_INTERVAL;
    stack.state = 'falling';
    // Animals and toys never drown: the rest of the tower floats on them.
    if (!stack.items[0].disposable) this.float(stack, sink);
  }

  private splash(x: number, y: number, size: number, color?: string): void {
    this.splashes.splash(x, y, settings.reduceMotion ? size * 0.3 : size, color);
  }

  /** Driving through a puddle throws up water: something to find out by trying. */
  private splashWheels(): void {
    for (const drive of this.vehicleHolds.values()) {
      const { vehicle } = drive;
      if (this.time - (this.wheelSplashAt.get(vehicle) ?? -1) < 0.18) continue;
      if (Math.abs(this.delta(vehicle.x, this.lastVehicleX.get(vehicle) ?? vehicle.x)) < 1.5) continue;
      for (const wheel of vehicle.wheels) {
        const wx = vehicle.x + wheel.dx;
        const puddle = this.puddles.find((p) => Math.abs(this.delta(wx, p.x)) < p.width / 2 - 10);
        if (!puddle) continue;
        this.splash(wx, vehicle.depth - 6, 0.5, puddle.light);
        puddle.ripple(puddle.x + this.delta(wx, puddle.x), 0.6);
        audio.plop(0.5);
        this.wheelSplashAt.set(vehicle, this.time);
        break;
      }
    }
    for (const v of this.vehicles) this.lastVehicleX.set(v, v.x);
  }

  // --- Drawing -----------------------------------------------------------

  /** Drawing order: further back first. */
  private depthOf(stack: Stack): number {
    if (stack.state === 'held') return Infinity;
    // On a tree: behind everything on the ground. Elsewhere: just in front of what holds it.
    const a = stack.anchor;
    if (a) {
      if ('bed' in a) return a.bed.depth + 0.1;
      if ('perch' in a) return a.perch.depth + 0.1;
      return -Infinity;
    }
    const water = stack.drowningIn ?? stack.floatingIn;
    if (water) return water.depth + 0.5;
    return stack.floor;
  }

  /**
   * Sinking fruit slides down through its own spot on the water, as if through
   * a hole: whatever is below the water line there is hidden.
   */
  private drawSinking(ctx: CanvasRenderingContext2D, v: Vanishing, t: number): void {
    const waterline = v.waterline!;
    const r = sizeOf(v.kind).radius;
    ctx.save();
    ctx.beginPath();
    ctx.rect(v.x - r * 2, waterline - 400, r * 4, 400);
    if (v.hole) ctx.ellipse(v.hole.x, waterline, v.hole.rx, v.hole.ry, 0, 0, Math.PI * 2);
    ctx.clip('nonzero');
    drawLoose(ctx, v.kind, v.x, v.y + v.drop! * t * t, 0, 1, 1);
    ctx.restore();
    if (v.into === 'bin') return;
    ctx.strokeStyle = v.light ?? palette.waterLight;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1 - t * 0.5;
    ctx.beginPath();
    ctx.ellipse(v.x, waterline, r * 0.95, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** A floating tower bobs gently, its bottom hidden under the water line. */
  private drawFloating(ctx: CanvasRenderingContext2D, stack: Stack, puddle: Puddle): void {
    const bob = Math.sin(this.time * 2.2 + stack.x * 0.05) * 2.5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(stack.x - 400, -2000, 800, 2000 + puddle.depth);
    ctx.clip();
    ctx.translate(0, bob);
    // Boats and ducks face the way they paddle.
    if (PADDLE_SPEED[stack.items[0].kind] && stack.paddle < 0) {
      ctx.translate(stack.x * 2, 0);
      ctx.scale(-1, 1);
    }
    stack.draw(ctx);
    ctx.restore();
    ctx.strokeStyle = puddle.light;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(stack.x, puddle.depth, stack.radius * 0.95, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** An umbrella held up over the whole tower, opening out from its handle. */
  private drawUmbrella(ctx: CanvasRenderingContext2D, s: Stack): void {
    const open = s.umbrella;
    if (open < 0.02) return;
    const animal = s.items.find((i) => i.animal)!.animal!;
    const color = UMBRELLA_COLORS[animal];
    const sway = s.shown();
    const top = sway[sway.length - 1];
    const x = top.x;
    const handleBottom = top.y + top.item.height * 0.1;
    const canopy = top.y - top.item.height / 2 - 34;
    const r = Math.max(48, s.radius * 1.3) * (0.3 + 0.7 * open);
    ctx.globalAlpha = Math.min(1, open * 2);
    ctx.strokeStyle = '#6b5a4e';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, canopy - 4);
    ctx.lineTo(x, handleBottom - 8);
    ctx.arc(x + 8, handleBottom - 8, 8, Math.PI, 0, true);
    ctx.stroke();
    // A dome with a scalloped edge.
    const h = r * 0.62 * (0.4 + 0.6 * open);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - r, canopy);
    ctx.quadraticCurveTo(x - r, canopy - h, x, canopy - h);
    ctx.quadraticCurveTo(x + r, canopy - h, x + r, canopy);
    const n = 4;
    for (let i = n; i > 0; i--) {
      const a = x - r + ((i - 1) * 2 * r) / n;
      const b = x - r + (i * 2 * r) / n;
      ctx.quadraticCurveTo((a + b) / 2, canopy - h * 0.22, a, canopy);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.35, canopy - h * 0.55, r * 0.22, h * 0.18, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b5a4e';
    ctx.beginPath();
    ctx.arc(x, canopy - h - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawStack(ctx: CanvasRenderingContext2D, s: Stack): void {
    if (this.hidden(s) && s.anchor) return;
    this.drawStackBody(ctx, s);
    this.drawUmbrella(ctx, s);
  }

  private drawStackBody(ctx: CanvasRenderingContext2D, s: Stack): void {
    const a = s.anchor;
    const barn = s.state === 'resting' ? this.barns.find((b) => b.isInside(s.x, s.floor)) : undefined;
    // Only once it has settled on the water; while falling in it is drawn whole.
    if (s.floatingIn instanceof Puddle && s.state === 'resting') this.drawFloating(ctx, s, s.floatingIn);
    else if (barn || (a && 'perch' in a && a.perch.clip)) {
      ctx.save();
      if (barn) barn.clipInside(ctx);
      else if (a && 'perch' in a) a.perch.clip!(ctx, a.seat);
      s.draw(ctx);
      ctx.restore();
    } else s.draw(ctx);
  }

  private layers(ctx: CanvasRenderingContext2D): Layer[] {
    const t = this.time;
    const at = (depth: number, x: number, reach: number, draw: () => void): Layer => ({ depth, x, reach, draw });
    return [
      ...this.cornfields.map((f) => at(f.depth, f.x, f.width / 2 + 60, () => f.draw(ctx))),
      ...this.sunfields.map((f) => at(f.depth, f.x, f.width / 2 + 60, () => f.draw(ctx))),
      ...this.decor.map((d) => at(d.depth, d.x, 100, () => d.draw(ctx, t))),
      ...this.birds.map((b) => at(b.depth, b.x, 1200, () => b.draw(ctx))),
      ...this.picnics.flatMap((p) => [
        at(p.backDepth, p.x, p.width / 2 + 80, () => p.drawBack(ctx, t)),
        at(p.depth, p.x, p.width / 2 + 80, () => p.draw(ctx)),
      ]),
      ...this.puddles.map((p) => at(p.depth, p.x, p.width / 2, () => p.draw(ctx, t))),
      ...this.beds.map((b) => at(b.depth, b.x, b.width / 2 + 20, () => b.draw(ctx))),
      ...this.bins.map((b) => at(b.depth, b.x, 80, () => b.draw(ctx))),
      ...this.barns.flatMap((b) => [at(b.backDepth, b.x, 220, () => b.drawBack(ctx)), at(b.depth, b.x, 220, () => b.draw(ctx))]),
      ...this.houses.flatMap((h) => [
        at(h.depth, h.x, 260, () => h.drawBack(ctx)),
        at(h.frontDepth, h.x, 260, () => h.draw(ctx)),
        at(h.frontDepth + 0.05, h.x, 260, () => h.drawShutters(ctx)),
      ]),
      ...[...this.stables, ...this.dispensers, ...this.coops, ...this.vehicles, ...this.baskets, ...this.benches].map((s) =>
        at(s.depth, s.x, 250, () => s.draw(ctx)),
      ),
      ...[...this.swings, ...this.windmills].map((s) => at(s.depth, s.x, 250, () => s.draw(ctx))),
      ...this.grills.map((g) => at(g.depth, g.x, 80, () => g.draw(ctx, t))),
      ...this.boomboxes.map((b) => at(b.depth, b.x, 80, () => b.draw(ctx))),
      ...this.stacks.map((s) => at(this.depthOf(s), s.x, 200, () => this.drawStack(ctx, s))),
      ...this.vanishing.map((v) =>
        at(v.depth, v.x, 100, () => {
          if (v.age < 0) return;
          const k = v.age / SINK_SECONDS;
          if (v.into === 'water' || v.into === 'bin') this.drawSinking(ctx, v, k);
          else drawLoose(ctx, v.kind, v.x, v.y, 0, 1 - k * 0.8, 1 - k * 0.8, 1 - k);
        }),
      ),
    ].sort((a, b) => a.depth - b.depth);
  }

  draw(screen: CanvasRenderingContext2D, dpr: number): void {
    screen.setTransform(1, 0, 0, 1, 0, 0);
    this.sky.drawSky(screen);
    const k = this.scale * dpr;
    screen.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);
    this.sky.drawLights(screen);

    // At night the landscape is drawn on its own layer, so it can be darkened
    // without dimming the moon and stars behind it.
    const night = this.sky.night > 0;
    const ctx = night ? this.landscapeLayer(screen.canvas) : screen;
    if (night) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);
    }

    const left = this.camX;
    const right = this.camX + this.viewW;

    // Hills scroll slower than the ground, so they feel far away.
    this.drawHills(ctx, left, right, 0.3, GROUND_Y - 120, 90, 0.004, palette.hillFar);
    this.drawHills(ctx, left, right, 0.6, GROUND_Y - 60, 60, 0.007, palette.hillNear);

    ctx.fillStyle = palette.ground;
    ctx.fillRect(left, GROUND_Y, right - left, WORLD_H - GROUND_Y + 10);
    ctx.fillStyle = palette.groundDark;
    ctx.fillRect(left, GROUND_Y + 50, right - left, WORLD_H - GROUND_Y);
    this.drawFence(ctx, left, right);

    // Where the view runs past the end of the farm, the start is drawn again after it.
    const shifts = right > this.width ? [0, this.width] : [0];
    const layers = this.layers(ctx);
    const margin = 40;
    for (const shift of shifts) {
      const seen = (x: number, reach: number) => x + shift + reach > left - margin && x + shift - reach < right + margin;
      ctx.save();
      ctx.translate(shift, 0);
      for (const tree of this.trees) if (seen(tree.x, 260)) tree.draw(ctx, this.time);
      for (const layer of layers) if (seen(layer.x, layer.reach)) layer.draw();
      for (const cloud of this.clouds) if (seen(cloud.x, 200)) cloud.draw(ctx);
      this.splashes.draw(ctx);
      this.notes.draw(ctx);
      ctx.restore();
    }

    if (night) {
      this.sky.washLandscape(ctx);
      screen.setTransform(1, 0, 0, 1, 0, 0);
      screen.drawImage(ctx.canvas, 0, 0);
    }
  }

  /** A wooden fence runs right round the farm, behind everything. */
  private drawFence(ctx: CanvasRenderingContext2D, left: number, right: number): void {
    const spacing = 64;
    ctx.fillStyle = '#d9b48a';
    ctx.fillRect(left, FENCE_TOP, right - left, 9);
    ctx.fillRect(left, FENCE_TOP + 22, right - left, 9);
    ctx.fillStyle = '#c99f74';
    for (let x = Math.floor(left / spacing) * spacing; x <= right + spacing; x += spacing) {
      ctx.beginPath();
      ctx.roundRect(x - 6, FENCE_TOP - 8, 12, GROUND_Y + 4 - (FENCE_TOP - 8), [6, 6, 0, 0]);
      ctx.fill();
    }
  }

  private landscapeLayer(like: HTMLCanvasElement): CanvasRenderingContext2D {
    if (!this.layer) this.layer = document.createElement('canvas').getContext('2d')!;
    const { canvas } = this.layer;
    if (canvas.width !== like.width || canvas.height !== like.height) {
      canvas.width = like.width;
      canvas.height = like.height;
    }
    return this.layer;
  }

  private drawHills(
    ctx: CanvasRenderingContext2D,
    left: number,
    right: number,
    parallax: number,
    base: number,
    height: number,
    freq: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, GROUND_Y + 1);
    // Measured from the total distance travelled, so the hills never jump where the farm loops.
    const travelled = this.camTravel * parallax;
    for (let x = left; x <= right + 20; x += 20) {
      const u = x - left + travelled;
      ctx.lineTo(x, base - height * (0.5 + 0.5 * Math.sin(u * freq) * Math.cos(u * freq * 0.37)));
    }
    ctx.lineTo(right, GROUND_Y + 1);
    ctx.fill();
  }
}
