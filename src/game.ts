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
import { drawFruit, type FruitKind } from './objects/fruit';
import { Item } from './objects/item';
import { Puddle } from './objects/puddle';
import { Stack, type Anchor } from './objects/stack';
import { Tree } from './objects/tree';
import type { SceneDef } from './scenes/scene';

interface Hold {
  stack: Stack;
  /** Where the finger is, in world units. */
  x: number;
  y: number;
  /** Offset from the finger to the stack's bottom centre, so it never jumps when grabbed. */
  dx: number;
  dy: number;
}

/** Food on its way into the water or into a mouth. */
interface Vanishing {
  kind: FruitKind;
  x: number;
  y: number;
  age: number;
  into: 'water' | 'mouth';
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

export class Game {
  private stacks: Stack[] = [];
  private trees: Tree[] = [];
  private puddles: Puddle[] = [];
  private holds = new Map<number, Hold>();
  private vanishing: Vanishing[] = [];
  private splashes = new Splashes();
  private time = 0;

  // View: world units are scaled to fit the screen, ground anchored at the bottom.
  private scale = 1;
  private camX = 0;
  private camY = 0;
  private viewW = SCREEN_W;
  private viewH = WORLD_H;

  constructor(scene: SceneDef) {
    for (const def of scene.objects) {
      switch (def.type) {
        case 'tree':
          this.trees.push(new Tree(def.x, def.fruit));
          break;
        case 'puddle':
          this.puddles.push(new Puddle(def.x, def.width));
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
    this.camX = (SCREEN_W - this.viewW) / 2;
    this.camY = WORLD_H - this.viewH;
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

    let bestSlot: Anchor | null = null;
    for (const tree of this.trees) {
      const hit = tree.slotAt(p.x, p.y, GRAB_SLOP);
      if (hit && hit.dist < bestDist) {
        bestSlot = { tree, slot: hit.slot };
        bestDist = hit.dist;
      }
    }

    if (bestSlot) {
      this.grab(id, this.pick(bestSlot), p);
    } else if (best) {
      const { stack, index } = best as { stack: Stack; index: number };
      this.grab(id, index === 0 ? stack : this.split(stack, index), p);
    }
  }

  pointerMove(id: number, cssX: number, cssY: number): void {
    const hold = this.holds.get(id);
    if (!hold) return;
    const p = this.toWorld(cssX, cssY);
    hold.x = p.x;
    hold.y = p.y;
  }

  pointerUp(id: number): void {
    const hold = this.holds.get(id);
    if (!hold) return;
    this.holds.delete(id);
    this.release(hold.stack);
  }

  /** Taking a fruit off the tree also takes any tower resting on it. */
  private pick({ tree, slot }: Anchor): Stack {
    const item = new Item(tree.fruit);
    const resting = this.stacks.find((s) => s.anchor?.slot === slot);
    tree.pick(slot);
    audio.pop();
    const stack = new Stack([item, ...(resting?.items ?? [])], slot.x, slot.y + item.height / 2);
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
    const animal = stack.items.find((i) => i.animal)?.animal;
    if (animal) audio.animal(animal);
    this.holds.set(id, { stack, x: p.x, y: p.y, dx: stack.x - p.x, dy: stack.bottom - p.y });
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
      const anchor = this.fruitUnder(stack);
      if (anchor) return this.rest(stack, anchor);
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

  /** The animal whose mouth is nearest to a carried pile of food, if close enough. */
  private mouthFor(food: Stack): { item: Item; dist: number } | null {
    if (!food.items.every((i) => i.food)) return null;
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

  /** The animal eats the whole pile, one bite per piece. */
  private feed(animal: Item, food: Stack): void {
    const owner = this.stacks.find((s) => s.items.includes(animal))!;
    const shown = owner.shown().find((s) => s.item === animal)!;
    food.items.forEach((item, i) => {
      this.vanishing.push({
        kind: item.kind as FruitKind,
        x: shown.x,
        y: shown.y + animal.mouthY - i * 6,
        age: -i * 0.35,
        into: 'mouth',
      });
    });
    animal.feed(food.items.length);
    this.removeStack(food);
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
        if (slot.growth < 0.15 || this.stacks.some((s) => s.anchor?.slot === slot)) continue;
        const dx = Math.abs(stack.x - slot.x);
        const dy = Math.abs(stack.bottom - tree.fruitTop(slot));
        if (dx < stack.radius * 0.8 && dy < stack.items[0].height * 0.5) return { tree, slot };
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
  }

  /** Rest a stack on a fruit hanging on the tree, even a growing one. */
  private rest(stack: Stack, anchor: Anchor): void {
    stack.state = 'anchored';
    stack.anchor = anchor;
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
    const left = this.camX;
    const right = this.camX + this.viewW;

    for (const stack of this.stacks) for (const item of stack.items) item.wantsFood = false;
    for (const hold of this.holds.values()) {
      const eater = this.mouthFor(hold.stack);
      if (eater) eater.item.wantsFood = true;
    }

    for (const hold of this.holds.values()) {
      const { stack } = hold;
      const x = Math.max(left + stack.radius, Math.min(right - stack.radius, hold.x + hold.dx));
      const bottom = hold.y + hold.dy;
      // Smoothed finger speed, kept for a flick on release.
      stack.vx = stack.vx * 0.5 + ((x - stack.x) / dt) * 0.5;
      stack.vy = stack.vy * 0.5 + ((bottom - stack.bottom) / dt) * 0.5;
      stack.x = x;
      stack.bottom = bottom;
    }

    for (const stack of [...this.stacks]) {
      switch (stack.state) {
        case 'anchored': {
          const { tree, slot } = stack.anchor!;
          stack.x = slot.x;
          stack.bottom = tree.fruitTop(slot);
          break;
        }
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

    for (const stack of this.stacks) stack.update(dt);
    for (const tree of this.trees) tree.update(dt);
    for (const puddle of this.puddles) puddle.update(dt);
    for (const v of this.vanishing) v.age += dt;
    this.vanishing = this.vanishing.filter((v) => v.age < SINK_SECONDS);
    this.splashes.update(dt);
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
    this.vanishing.push({ kind: first.kind as FruitKind, x: stack.x, y, age: 0, into: 'water' });
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
    if (stack.state === 'anchored') return -Infinity;
    const water = stack.drowningIn ?? stack.floatingIn;
    if (water) return water.depth + 0.5;
    return stack.floor;
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

  draw(ctx: CanvasRenderingContext2D, dpr: number): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(1, palette.skyBottom);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const k = this.scale * dpr;
    ctx.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);

    const left = this.camX;
    const right = this.camX + this.viewW;

    ctx.fillStyle = palette.sun;
    ctx.beginPath();
    ctx.arc(860, 130, 60, 0, Math.PI * 2);
    ctx.fill();

    this.drawHills(ctx, left, right, 520, 90, 0.004, palette.hillFar);
    this.drawHills(ctx, left, right, 580, 60, 0.007, palette.hillNear);

    ctx.fillStyle = palette.ground;
    ctx.fillRect(left, GROUND_Y, right - left, WORLD_H - GROUND_Y + 10);
    ctx.fillStyle = palette.groundDark;
    ctx.fillRect(left, GROUND_Y + 50, right - left, WORLD_H - GROUND_Y);

    for (const tree of this.trees) tree.draw(ctx, this.time);

    const layers: { depth: number; draw: () => void }[] = [
      ...this.puddles.map((p) => ({ depth: p.depth, draw: () => p.draw(ctx, this.time) })),
      ...this.stacks.map((s) => ({
        depth: this.depthOf(s),
        draw: () => {
          // Only once it has settled on the water; while falling in it is drawn whole.
          if (s.floatingIn && s.state === 'resting') this.drawFloating(ctx, s, s.floatingIn);
          else s.draw(ctx);
        },
      })),
      ...this.vanishing.map((v) => ({
        depth: v.into === 'water' ? GROUND_Y + 4.6 : Infinity,
        draw: () => {
          if (v.age < 0) return;
          const t = v.age / SINK_SECONDS;
          if (v.into === 'water') drawFruit(ctx, v.kind, v.x, v.y + t * 30, 0, 1 + t * 0.2, 1 - t * 0.7, 1 - t);
          else drawFruit(ctx, v.kind, v.x, v.y, 0, 1 - t * 0.8, 1 - t * 0.8, 1 - t);
        },
      })),
    ];
    layers.sort((a, b) => a.depth - b.depth);
    for (const layer of layers) layer.draw();

    this.splashes.draw(ctx);
  }

  private drawHills(
    ctx: CanvasRenderingContext2D,
    left: number,
    right: number,
    base: number,
    height: number,
    freq: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, GROUND_Y + 1);
    for (let x = left; x <= right + 20; x += 20) {
      ctx.lineTo(x, base - height * (0.5 + 0.5 * Math.sin(x * freq) * Math.cos(x * freq * 0.37)));
    }
    ctx.lineTo(right, GROUND_Y + 1);
    ctx.fill();
  }
}
