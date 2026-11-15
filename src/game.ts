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
import { Splashes } from './fx';
import { SNORE_SECONDS } from './objects/animals';
import { Bed, type Plot } from './objects/bed';
import { Cloud } from './objects/cloud';
import { Item, drawFood, isFruit, sizeOf, type FoodKind } from './objects/item';
import { Puddle } from './objects/puddle';
import { Stack, type Anchor } from './objects/stack';
import { Tree, type Slot } from './objects/tree';
import type { VegKind } from './objects/veg';
import type { SceneDef } from './scenes/scene';
import { Sky } from './sky';

/** The fruit or vegetable a stack rests on. */
function spotOf(anchor: Anchor): Slot | Plot {
  return 'slot' in anchor ? anchor.slot : anchor.plot;
}

/** Where a stack resting on that fruit or vegetable stands. */
function anchorPoint(anchor: Anchor): { x: number; top: number } {
  return 'slot' in anchor
    ? { x: anchor.slot.x, top: anchor.tree.fruitTop(anchor.slot) }
    : { x: anchor.plot.x, top: anchor.bed.vegTop(anchor.plot) };
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

/** Food on its way into the water or into a mouth. */
interface Vanishing {
  kind: FoodKind;
  x: number;
  y: number;
  age: number;
  into: 'water' | 'mouth';
  /** Drawing order: just in front of the puddle it sinks into. */
  depth: number;
  /** Sinking fruit: the water line it slides down through, and how far it goes. */
  waterline?: number;
  drop?: number;
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

export class Game {
  private stacks: Stack[] = [];
  private trees: Tree[] = [];
  private puddles: Puddle[] = [];
  private holds = new Map<number, Hold>();
  /** Fingers dragging empty ground, panning the world. */
  private pans = new Map<number, { cssX: number; speed: number }>();
  private beds: Bed[] = [];
  private clouds: Cloud[] = [];
  private cloudHolds = new Map<number, CloudHold>();
  /** Glide left over after a swipe, in world units per second. */
  private camVx = 0;
  private readonly width: number;
  private vanishing: Vanishing[] = [];
  private splashes = new Splashes();
  private sky = new Sky();
  private nextSnoreAt = 0;
  private snoreTurn = 0;
  /** Offscreen canvas for the landscape at night. */
  private layer: CanvasRenderingContext2D | null = null;
  private time = 0;

  // View: world units are scaled to fit the screen, ground anchored at the bottom.
  private scale = 1;
  private camX = 0;
  private camY = 0;
  private viewW = SCREEN_W;
  private viewH = WORLD_H;

  constructor(scene: SceneDef) {
    this.width = scene.width;
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
        case 'animal': {
          const stack = new Stack([new Item(def.animal)], def.x, def.depth);
          stack.state = 'resting';
          stack.floor = def.depth;
          this.stacks.push(stack);
          break;
        }
      }
    }
  }

  resize(cssW: number, cssH: number): void {
    this.scale = Math.min(cssW / SCREEN_W, cssH / WORLD_H);
    this.viewW = cssW / this.scale;
    this.viewH = cssH / this.scale;
    this.camY = WORLD_H - this.viewH;
    this.setCamera(this.camX);
  }

  /** Move the view, never past either end of the scene. */
  private setCamera(x: number): void {
    const max = this.width - this.viewW;
    this.camX = max <= 0 ? max / 2 : Math.max(0, Math.min(max, x));
    this.sky.setView(this.camX, this.viewW);
  }

  private toWorld(cssX: number, cssY: number): { x: number; y: number } {
    return { x: cssX / this.scale + this.camX, y: cssY / this.scale + this.camY };
  }

  // --- Input -------------------------------------------------------------

  pointerDown(id: number, cssX: number, cssY: number): void {
    const p = this.toWorld(cssX, cssY);

    let best: { stack: Stack; index: number } | null = null;
    let bestDist = Infinity;
    for (const stack of this.stacks) {
      if (stack.state === 'held') continue;
      stack.shown().forEach((shown, index) => {
        const d = Math.hypot(p.x - shown.x, p.y - shown.y);
        if (d <= shown.item.reach + GRAB_SLOP && d < bestDist) {
          best = { stack, index };
          bestDist = d;
        }
      });
    }

    let bestSlot: { tree: Tree; slot: Slot } | null = null;
    for (const tree of this.trees) {
      const hit = tree.slotAt(p.x, p.y, GRAB_SLOP);
      if (hit && hit.dist < bestDist) {
        bestSlot = { tree, slot: hit.slot };
        bestDist = hit.dist;
      }
    }

    let bestPlot: { bed: Bed; plot: Plot } | null = null;
    for (const bed of this.beds) {
      const hit = bed.plotAt(p.x, p.y, GRAB_SLOP);
      if (hit && hit.dist < bestDist) {
        bestPlot = { bed, plot: hit.plot };
        bestSlot = null;
        bestDist = hit.dist;
      }
    }

    const cloud = this.clouds.find((c) => c.hits(p.x, p.y, GRAB_SLOP) && !c.raining);
    if (bestPlot) {
      this.grab(id, this.pickVeg(bestPlot.bed, bestPlot.plot), p);
    } else if (bestSlot) {
      this.grab(id, this.pick(bestSlot), p);
    } else if (best) {
      const { stack, index } = best as { stack: Stack; index: number };
      this.grab(id, index === 0 ? stack : this.split(stack, index), p);
    } else if (cloud) {
      // Holding the cloud makes it rain.
      cloud.raining = true;
      this.cloudHolds.set(id, { cloud, cssX, cssY, dx: cloud.x - p.x, dy: cloud.y - p.y });
      audio.setRain(true);
    } else if (this.sky.hits(p.x, p.y, GRAB_SLOP)) {
      this.sky.toggle();
    } else {
      // Empty ground or sky: drag the world.
      this.camVx = 0;
      this.pans.set(id, { cssX, speed: 0 });
    }
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
    const pan = this.pans.get(id);
    if (pan) {
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
    const pan = this.pans.get(id);
    if (pan) {
      this.pans.delete(id);
      this.camVx = Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, pan.speed));
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

  /** Taking a fruit off the tree also takes any tower resting on it. */
  private pick({ tree, slot }: { tree: Tree; slot: Slot }): Stack {
    const item = new Item(tree.fruit);
    const resting = this.restingOn(slot);
    tree.pick(slot);
    return this.picked(item, resting, slot.x, slot.y + item.height / 2);
  }

  private restingOn(spot: Slot | Plot): Stack | undefined {
    return this.stacks.find((s) => s.anchor && spotOf(s.anchor) === spot);
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
    const css = { x: (p.x - this.camX) * this.scale, y: (p.y - this.camY) * this.scale };
    this.holds.set(id, { stack, cssX: css.x, cssY: css.y, dx: stack.x - p.x, dy: stack.bottom - p.y });
  }

  /** Grabbing above the bottom splits the tower: that item and all above come away. */
  private split(stack: Stack, index: number): Stack {
    const upper = new Stack(stack.items.splice(index), stack.x, stack.bottomOf(index));
    upper.continueFrom(stack);
    this.stacks.push(upper);
    return upper;
  }

  /**
   * Letting go: placed gently on a tower or a fruit it sticks there, placed on
   * water it drowns. Otherwise it stays at that depth if let go low on the
   * ground, or falls from the air onto the ground in front.
   */
  private release(stack: Stack): void {
    const speed = Math.hypot(stack.vx, stack.vy);
    if (speed < PLACE_SPEED) {
      const eater = this.mouthFor(stack);
      if (eater && eater.dist <= stack.items[0].radius + EAT_DIST) return this.feed(eater.item, stack);
      const target = this.towerUnder(stack);
      if (target) return this.glue(target, stack);
      const anchor = this.fruitUnder(stack) ?? this.vegUnder(stack);
      if (anchor) return this.rest(stack, anchor);
      const bed = this.beds.find((b) => b.freePlotAt(stack.x, stack.bottom));
      const bottom = stack.items[0];
      if (bed && bottom.food && !isFruit(bottom.kind)) return this.plant(bed, stack);
      const puddle = this.puddles.find((p) => p.holds(stack.x, stack.bottom));
      if (puddle && stack.items[0].disposable) {
        stack.drowningIn = puddle;
        stack.fixedFloor = puddle.drownY;
        stack.vx = stack.vy = 0;
        stack.state = 'falling';
        return;
      }
      if (puddle) return this.float(stack, puddle);
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
    stack.fixedFloor =
      stack.bottom >= GROUND_BAND ? Math.min(FRONT_FLOOR, Math.max(GROUND_Y, stack.bottom)) : null;
    stack.state = 'falling';
  }

  /** An animal at the bottom of a stack floats on the water, slightly sunk in. */
  private float(stack: Stack, puddle: Puddle): void {
    stack.floatingIn = puddle;
    stack.drowningIn = null;
    stack.fixedFloor = puddle.floatBottom(stack.items[0].height);
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
      if (stack === food || stack.state === 'held') continue;
      for (const s of stack.shown()) {
        if (!s.item.animal || s.item.chew > 0) continue;
        const dist = Math.hypot(fx - s.x, fy - (s.y + s.item.mouthY));
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
      kind: eaten.kind as FoodKind,
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
      const top = other.items[other.items.length - 1];
      const dx = Math.abs(stack.x - other.x);
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
  }

  /** Rest a stack on a fruit hanging on the tree (even a growing one) or a vegetable in its bed. */
  private rest(stack: Stack, anchor: Anchor): void {
    stack.state = 'anchored';
    stack.anchor = anchor;
    ({ x: stack.x, top: stack.bottom } = anchorPoint(anchor));
    stack.vx = stack.vy = 0;
    stack.items[0].squash = 0.25;
    audio.plop(0.4);
    this.limitHeight(stack);
  }

  /** A tower stops at the top of the screen; what does not fit falls off beside it. */
  private limitHeight(stack: Stack): void {
    const top = this.camY + TOP_MARGIN;
    let keep = 1;
    while (keep < stack.items.length && stack.bottomOf(keep + 1) >= top) keep++;
    if (keep >= stack.items.length) return;

    const bottom = stack.bottomOf(keep);
    const excess = stack.items.splice(keep);
    const towardMiddle = stack.x < this.camX + this.viewW / 2 ? 1 : -1;
    const fallen = new Stack(excess, stack.x + towardMiddle * (stack.radius + excess[0].radius) * 1.1, bottom);
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
      if (other === stack || other.state !== 'resting' || other.drowningIn) continue;
      if (Math.abs(other.x - stack.x) < (other.radius + stack.radius) * 0.9) floor = Math.max(floor, other.floor + LAYER_GAP);
    }
    return Math.min(floor, FRONT_FLOOR);
  }

  // --- Simulation --------------------------------------------------------

  step(): void {
    const dt = STEP;
    this.time += dt;
    const left = 0;
    const right = this.width;

    const camBefore = this.camX;
    this.moveCamera(dt);
    const camMoved = this.camX - camBefore;

    for (const stack of this.stacks) for (const item of stack.items) item.wantsFood = false;
    for (const hold of this.holds.values()) {
      const eater = this.mouthFor(hold.stack);
      if (eater) eater.item.wantsFood = true;
    }

    for (const hold of this.holds.values()) {
      const { stack } = hold;
      const finger = this.toWorld(hold.cssX, hold.cssY);
      const x = Math.max(left + stack.radius, Math.min(right - stack.radius, finger.x + hold.dx));
      const bottom = finger.y + hold.dy;
      // Smoothed finger speed, kept for a flick on release. Scrolling is not a flick.
      stack.vx = stack.vx * 0.5 + ((x - stack.x - camMoved) / dt) * 0.5;
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
          this.fall(stack, dt, left, right);
          break;
        case 'resting':
          if (stack.vx !== 0) {
            stack.x = Math.max(left + stack.radius, Math.min(right - stack.radius, stack.x + stack.vx * dt));
            stack.vx *= Math.exp(-10 * dt);
            if (Math.abs(stack.vx) < 5) stack.vx = 0;
          }
          if (stack.drowningIn && this.time >= stack.nextSinkAt) this.sinkBottom(stack, stack.drowningIn);
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
    this.sky.update(dt);
    this.snoreNow();
    this.rain(dt);
    for (const puddle of this.puddles) puddle.update(dt);
    for (const v of this.vanishing) v.age += dt;
    this.vanishing = this.vanishing.filter((v) => v.age < SINK_SECONDS);
    this.splashes.update(dt);
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
    for (const hold of [...this.holds.values(), ...this.cloudHolds.values()]) {
      // A cloud at the end of its reach no longer pulls the view along.
      const cloud = 'cloud' in hold ? hold.cloud : null;
      if (hold.cssX < zone && !(cloud && cloud.x <= cloud.minX)) x -= EDGE_SCROLL_SPEED * (1 - hold.cssX / zone) * dt;
      else if (hold.cssX > screenW - zone && !(cloud && cloud.x >= cloud.maxX))
        x += EDGE_SCROLL_SPEED * (1 - (screenW - hold.cssX) / zone) * dt;
    }
    if (x !== this.camX) this.setCamera(x);
  }

  /** Move held clouds; rain grows vegetables, speeds up fruit and ripples puddles. */
  private rain(dt: number): void {
    for (const hold of this.cloudHolds.values()) {
      const finger = this.toWorld(hold.cssX, hold.cssY);
      const { cloud } = hold;
      cloud.x = Math.max(0, cloud.minX, Math.min(this.width, cloud.maxX, finger.x + hold.dx));
      cloud.y = Math.max(70, Math.min(300, finger.y + hold.dy));
    }
    const wet = (x: number) => this.clouds.some((c) => c.wets(x));
    for (const tree of this.trees) tree.update(dt, wet);
    for (const bed of this.beds) bed.update(dt, wet);
    for (const cloud of this.clouds) {
      cloud.update(dt, (x) => {
        const puddle = this.puddles.find((p) => Math.abs(x - p.x) < p.width * 0.4);
        if (puddle && Math.random() < 0.15) puddle.ripple(x, 0.2);
      });
    }
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

  private fall(stack: Stack, dt: number, left: number, right: number): void {
    stack.vy += GRAVITY * dt;
    stack.x = Math.max(left + stack.radius, Math.min(right - stack.radius, stack.x + stack.vx * dt));
    // A floater drifts gently toward open water.
    if (stack.floatingIn) stack.x += (stack.floatingIn.floatX(stack.x, stack.radius) - stack.x) * Math.min(1, dt * 6);
    stack.bottom += stack.vy * dt;
    stack.floor = this.landingFloor(stack);
    if (stack.bottom < stack.floor) return;

    stack.bottom = stack.floor;
    const impact = stack.vy;
    if (stack.floatingIn) {
      stack.x = stack.floatingIn.floatX(stack.x, stack.radius);
      this.splashes.splash(stack.x, stack.floatingIn.surfaceY, 0.4);
      stack.floatingIn.ripple(stack.x, 1);
      audio.plop(0.6);
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
  }

  /** A tower drowns one item at a time, bottom first; the rest drops in after it. */
  private sinkBottom(stack: Stack, puddle: Puddle): void {
    const first = stack.items.shift()!;
    const y = stack.bottom - first.height / 2;
    this.vanishing.push({
      kind: first.kind as FoodKind,
      x: stack.x,
      y,
      age: 0,
      into: 'water',
      depth: puddle.depth + 0.6,
      waterline: stack.bottom,
      drop: first.height + 8,
    });
    this.splashes.splash(stack.x, puddle.surfaceY, 1);
    puddle.ripple(stack.x, 1);
    audio.plock(1);

    if (stack.items.length === 0) return this.removeStack(stack);
    stack.bottom -= first.height;
    stack.nextSinkAt = this.time + DROWN_INTERVAL;
    stack.state = 'falling';
    // Animals never drown: the rest of the tower floats on them.
    if (!stack.items[0].disposable) this.float(stack, puddle);
  }

  // --- Drawing -----------------------------------------------------------

  /** Drawing order: further back first. */
  private depthOf(stack: Stack): number {
    if (stack.state === 'held') return Infinity;
    // On a tree: behind everything on the ground. In a bed: just in front of it.
    if (stack.anchor) return 'bed' in stack.anchor ? stack.anchor.bed.depth + 0.1 : -Infinity;
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
    ctx.clip();
    drawFood(ctx, v.kind, v.x, v.y + v.drop! * t * t, 0, 1, 1);
    ctx.restore();
    ctx.strokeStyle = palette.waterLight;
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
    stack.draw(ctx);
    ctx.restore();
    ctx.strokeStyle = palette.waterLight;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(stack.x, puddle.depth, stack.radius * 0.95, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
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
    this.drawHills(ctx, left, right, 0.3, 520, 90, 0.004, palette.hillFar);
    this.drawHills(ctx, left, right, 0.6, 580, 60, 0.007, palette.hillNear);

    ctx.fillStyle = palette.ground;
    ctx.fillRect(left, GROUND_Y, right - left, WORLD_H - GROUND_Y + 10);
    ctx.fillStyle = palette.groundDark;
    ctx.fillRect(left, GROUND_Y + 50, right - left, WORLD_H - GROUND_Y);

    for (const tree of this.trees) tree.draw(ctx, this.time);

    const layers: { depth: number; draw: () => void }[] = [
      ...this.puddles.map((p) => ({ depth: p.depth, draw: () => p.draw(ctx, this.time) })),
      ...this.beds.map((b) => ({ depth: b.depth, draw: () => b.draw(ctx) })),
      ...this.stacks.map((s) => ({
        depth: this.depthOf(s),
        draw: () => {
          // Only once it has settled on the water; while falling in it is drawn whole.
          if (s.floatingIn && s.state === 'resting') this.drawFloating(ctx, s, s.floatingIn);
          else s.draw(ctx);
        },
      })),
      ...this.vanishing.map((v) => ({
        depth: v.depth,
        draw: () => {
          if (v.age < 0) return;
          const t = v.age / SINK_SECONDS;
          if (v.into === 'water') this.drawSinking(ctx, v, t);
          else drawFood(ctx, v.kind, v.x, v.y, 0, 1 - t * 0.8, 1 - t * 0.8, 1 - t);
        },
      })),
    ];
    layers.sort((a, b) => a.depth - b.depth);
    for (const layer of layers) layer.draw();

    for (const cloud of this.clouds) cloud.draw(ctx);
    this.splashes.draw(ctx);

    if (night) {
      this.sky.washLandscape(ctx);
      screen.setTransform(1, 0, 0, 1, 0, 0);
      screen.drawImage(ctx.canvas, 0, 0);
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
    const shift = this.camX * (1 - parallax);
    for (let x = left; x <= right + 20; x += 20) {
      const u = x - shift;
      ctx.lineTo(x, base - height * (0.5 + 0.5 * Math.sin(u * freq) * Math.cos(u * freq * 0.37)));
    }
    ctx.lineTo(right, GROUND_Y + 1);
    ctx.fill();
  }
}
