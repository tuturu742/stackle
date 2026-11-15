import { GROUND_Y, REGROW_SECONDS, palette } from '../config';
import * as audio from '../audio';
import { FRUIT, drawFruit, type FruitKind } from './fruit';

export interface Slot {
  x: number;
  y: number;
  /** 0 = just picked, 1 = ripe and pickable. */
  growth: number;
  wobble: number;
}

// Fruit positions relative to the trunk base, low enough to reach easily.
const SLOT_OFFSETS = [
  [-95, -270],
  [-20, -235],
  [65, -290],
  [110, -225],
];

export class Tree {
  readonly slots: Slot[];

  constructor(
    readonly x: number,
    readonly fruit: FruitKind,
  ) {
    this.slots = SLOT_OFFSETS.map(([dx, dy]) => ({ x: x + dx, y: GROUND_Y + dy, growth: 1, wobble: 0 }));
  }

  /** Nearest ripe fruit within reach of the point, if any. */
  slotAt(px: number, py: number, slop: number): { slot: Slot; dist: number } | null {
    const reach = FRUIT[this.fruit].radius + slop;
    let best: { slot: Slot; dist: number } | null = null;
    for (const slot of this.slots) {
      if (slot.growth < 1) continue;
      const dist = Math.hypot(px - slot.x, py - slot.y);
      if (dist <= reach && (!best || dist < best.dist)) best = { slot, dist };
    }
    return best;
  }

  /** Taking the fruit starts a new one growing in the same place. */
  pick(slot: Slot): void {
    slot.growth = 0;
  }

  /** Top edge of the fruit hanging in a slot, rising as it grows. */
  fruitTop(slot: Slot): number {
    return slot.y - FRUIT[this.fruit].radius * 0.9 * easeOutBack(slot.growth);
  }

  update(dt: number): void {
    for (const slot of this.slots) {
      if (slot.growth < 1) {
        slot.growth = Math.min(1, slot.growth + dt / REGROW_SECONDS);
        if (slot.growth === 1) {
          slot.wobble = 1;
          audio.grown();
        }
      }
      slot.wobble = Math.max(0, slot.wobble - dt * 2.5);
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = palette.trunk;
    ctx.beginPath();
    ctx.roundRect(this.x - 22, GROUND_Y - 250, 44, 260, 18);
    ctx.fill();

    const cy = GROUND_Y - 320;
    ctx.fillStyle = palette.canopy;
    for (const [dx, dy, r] of [
      [0, -40, 120],
      [-100, 20, 95],
      [100, 20, 95],
      [-40, 60, 90],
      [50, 60, 90],
    ]) {
      ctx.beginPath();
      ctx.arc(this.x + dx, cy + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = palette.canopyLight;
    ctx.beginPath();
    ctx.arc(this.x - 40, cy - 70, 55, 0, Math.PI * 2);
    ctx.fill();

    for (const slot of this.slots) {
      if (slot.growth <= 0.02) continue;
      const g = easeOutBack(slot.growth);
      const w = Math.sin(time * 30) * slot.wobble * 0.15;
      drawFruit(ctx, this.fruit, slot.x, slot.y, 0, g * (1 + w), g * (1 - w));
    }
  }
}

function easeOutBack(t: number): number {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
