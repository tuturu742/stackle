import { GROUND_Y } from '../config';
import { settings } from '../settings';
import type { Item } from './item';
import type { Perch } from './perch';
import type { Sink } from './sink';
import type { Bed, Plot } from './bed';
import type { Slot, Tree } from './tree';

export interface Shown {
  item: Item;
  x: number;
  y: number;
  angle: number;
}

/** What a stack can rest on and move with: a tree fruit, a bed vegetable, a perch's seat. */
export type Anchor = { tree: Tree; slot: Slot } | { bed: Bed; plot: Plot } | { perch: Perch; seat: number };

export type StackState = 'held' | 'falling' | 'resting' | 'anchored';

// Sway is a damped spring on the tower's lean, pushed by sideways acceleration.
const SWAY_GAIN = 0.005;
const MAX_LEAN = 0.6;

/**
 * One or more items glued into a straight tower, bottom first. A lone item is
 * just a stack of one. Towers never tip over; their sway is only drawn,
 * bending the tower like a stalk, so the items never come apart.
 */
export class Stack {
  /** The farm loops round: its width, so moving across the join is not a jump. */
  static loop = Infinity;

  state: StackState = 'falling';
  /** Floating boats and ducks paddle back and forth: which way, -1 or 1. */
  paddle = 1;
  /** An umbrella over an animal out in the rain: 0 closed, 1 open. */
  umbrella = 0;
  anchor: Anchor | null = null;
  drowningIn: Sink | null = null;
  /** Animals placed on water float instead of drowning; on a bin they sit on it. */
  floatingIn: Sink | null = null;
  /** While drowning, the next item may only go under after this time. */
  nextSinkAt = 0;

  vx = 0;
  vy = 0;
  /** Ground line it rests on or is falling to; larger is nearer the viewer. */
  floor = GROUND_Y;
  /** Set when it was put at a particular depth rather than dropped from the air. */
  fixedFloor: number | null = null;

  private lean = 0;
  private leanVel = 0;
  private lastX: number;
  private lastVx = 0;
  private accel = 0;

  constructor(
    readonly items: Item[],
    /** Bottom centre of the tower. */
    public x: number,
    public bottom: number,
  ) {
    this.lastX = x;
  }

  get height(): number {
    return this.items.reduce((h, item) => h + item.height, 0);
  }

  get radius(): number {
    return this.items[0].radius;
  }

  /** Bottom edge of the item at `index`. */
  bottomOf(index: number): number {
    let y = this.bottom;
    for (let i = 0; i < index; i++) y -= this.items[i].height;
    return y;
  }

  /** Keep the sway going when a tower is rebuilt. */
  continueFrom(other: Stack): void {
    this.lean = other.lean;
    this.leanVel = other.leanVel;
    this.lastX = other.lastX;
    this.lastVx = other.lastVx;
    this.accel = other.accel;
  }

  nudge(speed: number): void {
    this.leanVel += speed;
  }

  update(dt: number): void {
    for (const item of this.items) item.update(dt);

    let dx = this.x - this.lastX;
    if (Math.abs(dx) > Stack.loop / 2) dx -= Math.sign(dx) * Stack.loop;
    const vx = dx / dt;
    const ax = (vx - this.lastVx) / dt;
    this.lastX = this.x;
    this.lastVx = vx;
    // Finger movement is jittery, so smooth the push before it reaches the spring.
    this.accel += (ax - this.accel) * 0.15;

    // Taller towers sway slower and further, like a real stack would.
    const stiffness = 70 / (1 + 0.12 * this.items.length);
    const damping = 2 * 0.2 * Math.sqrt(stiffness);
    this.leanVel += (-stiffness * this.lean - damping * this.leanVel - this.accel * SWAY_GAIN) * dt;
    this.lean = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, this.lean + this.leanVel * dt));
    if (settings.reduceMotion) this.lean = this.leanVel = 0;
  }

  /** Where each item is drawn: the straight tower bent by its current lean. */
  shown(): Shown[] {
    const n = this.items.length;
    const baseAngle = this.lean * 0.15;
    const first = this.items[0];
    const out: Shown[] = [{ item: first, x: this.x, y: this.bottom - first.height / 2, angle: baseAngle }];
    for (let i = 1; i < n; i++) {
      const prev = out[i - 1];
      const item = this.items[i];
      const angle = baseAngle + ((this.lean - baseAngle) * i) / (n - 1);
      const mid = (prev.angle + angle) / 2;
      const dist = (prev.item.height + item.height) / 2;
      out.push({ item, x: prev.x + Math.sin(mid) * dist, y: prev.y - Math.cos(mid) * dist, angle });
    }
    return out;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const s of this.shown()) s.item.draw(ctx, s.x, s.y, s.angle);
  }
}
