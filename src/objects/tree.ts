import { GROUND_Y, REGROW_SECONDS, palette } from '../config';
import * as audio from '../audio';
import { FRUIT, drawFruit, type FruitKind } from './fruit';

export interface Slot {
  x: number;
  y: number;
  /** 0 = just picked, 1 = ripe and pickable. */
  growth: number;
  wobble: number;
  /** Seconds since it became ripe, for the pop to full size. */
  ripeAge: number;
}

/** Growing fruit stays clearly small; it only reaches full size once it can be picked. */
const UNRIPE_MAX_SCALE = 0.6;
const RIPE_POP_SECONDS = 0.3;
/** Rain makes fruit grow back this many times faster. */
const RAIN_BOOST = 3;

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
    this.slots = SLOT_OFFSETS.map(([dx, dy]) => ({
      x: x + dx,
      y: GROUND_Y + dy,
      growth: 1,
      wobble: 0,
      ripeAge: RIPE_POP_SECONDS,
    }));
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
    slot.ripeAge = 0;
  }

  /** Drawn size of the fruit in a slot: small while growing, a pop to full size when ripe. */
  scaleOf(slot: Slot): number {
    if (slot.growth < 1) return 0.15 + (UNRIPE_MAX_SCALE - 0.15) * slot.growth;
    const t = Math.min(1, slot.ripeAge / RIPE_POP_SECONDS);
    return UNRIPE_MAX_SCALE + (1 - UNRIPE_MAX_SCALE) * easeOutBack(t);
  }

  /** Top edge of the fruit hanging in a slot, rising as it grows. */
  fruitTop(slot: Slot): number {
    return slot.y - FRUIT[this.fruit].radius * 0.9 * this.scaleOf(slot);
  }

  /** `canGrow` is false while too much food is out in the world: nothing grows until some is used. */
  update(dt: number, wet: (x: number) => boolean, canGrow: boolean): void {
    for (const slot of this.slots) {
      if (slot.growth < 1 && !canGrow) {
        // Waiting for room.
      } else if (slot.growth < 1) {
        const speed = wet(slot.x) ? RAIN_BOOST : 1;
        slot.growth = Math.min(1, slot.growth + (dt * speed) / REGROW_SECONDS);
        if (slot.growth === 1) {
          slot.wobble = 1;
          slot.ripeAge = 0;
          audio.grown();
        }
      } else {
        slot.ripeAge += dt;
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
      const g = this.scaleOf(slot);
      const w = Math.sin(time * 30) * slot.wobble * 0.15;
      // Unripe fruit is green, turning its own colour only as it ripens.
      const unripe = slot.growth < 1 ? 1 - slot.growth * 0.4 : 0;
      drawFruit(ctx, this.fruit, slot.x, slot.y, 0, g * (1 + w), g * (1 - w), 1, unripe);
    }
  }
}

function easeOutBack(t: number): number {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
