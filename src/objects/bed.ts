import { GROUND_Y } from '../config';
import * as audio from '../audio';
import { drawVeg, VEG, type VegKind } from './veg';

export interface Plot {
  x: number;
  kind: VegKind;
  /** 0 = just picked (a sprout), 1 = ripe and pickable. */
  growth: number;
  /** Seconds since it became ripe, for the pop out of the soil. */
  ripeAge: number;
}

/** Seconds of rain a picked plot needs to grow back. Nothing grows without rain. */
const GROW_SECONDS = 4;
const RIPE_POP_SECONDS = 0.3;
/** How much of a vegetable shows above the soil: a peek while growing, half once ripe. */
const GROWING_SHOWS = 0.12;
const RIPE_SHOWS = 0.5;
const KINDS = Object.keys(VEG) as VegKind[];

/** A raised wooden bed of vegetables that grow back only while it rains on them. */
export class Bed {
  readonly plots: Plot[];
  readonly soilY = GROUND_Y - 30;
  /** Drawing order: it stands just behind the ground line things are dropped on. */
  readonly depth = GROUND_Y + 20;

  constructor(
    readonly x: number,
    readonly width: number,
    kinds: VegKind[],
  ) {
    this.plots = kinds.map((kind, i) => ({
      x: x - width / 2 + ((i + 0.5) * width) / kinds.length,
      kind,
      growth: 1,
      ripeAge: RIPE_POP_SECONDS,
    }));
  }

  /** Where a plot's vegetable is drawn: its centre, and its size. */
  private placeOf(plot: Plot): { y: number; scale: number } {
    const h = VEG[plot.kind].height;
    if (plot.growth < 1) {
      const scale = 0.55 + 0.25 * plot.growth;
      return { y: this.soilY + (h * scale) / 2 - GROWING_SHOWS * plot.growth * h * scale, scale };
    }
    const t = Math.min(1, plot.ripeAge / RIPE_POP_SECONDS);
    const pop = 1 + Math.sin(t * Math.PI) * 0.15;
    return { y: this.soilY + h / 2 - RIPE_SHOWS * h * pop, scale: 1 };
  }

  /** The nearest ripe vegetable within reach of the point, if any. */
  plotAt(px: number, py: number, slop: number): { plot: Plot; dist: number } | null {
    let best: { plot: Plot; dist: number } | null = null;
    for (const plot of this.plots) {
      if (plot.growth < 1) continue;
      const look = VEG[plot.kind];
      const dist = Math.hypot(px - plot.x, py - (this.soilY - look.height * 0.25));
      if (dist <= look.radius + slop && (!best || dist < best.dist)) best = { plot, dist };
    }
    return best;
  }

  /** Top of a ripe vegetable, where a tower placed on it rests. */
  vegTop(plot: Plot): number {
    const { y, scale } = this.placeOf(plot);
    return y - (VEG[plot.kind].height * scale) / 2;
  }

  /** The empty or growing plot a vegetable put down here would be planted in. */
  freePlotAt(x: number, bottom: number): Plot | null {
    if (Math.abs(x - this.x) > this.width / 2 + 10) return null;
    if (bottom < this.soilY - 70 || bottom > this.soilY + 40) return null;
    const spacing = this.width / this.plots.length;
    const plot = this.plots.find((p) => Math.abs(x - p.x) <= spacing / 2);
    return plot && plot.growth < 1 ? plot : null;
  }

  /** Pull the vegetable out; a sprout of something new is left behind. Returns where its centre was. */
  pick(plot: Plot): number {
    const { y } = this.placeOf(plot);
    plot.growth = 0;
    plot.ripeAge = 0;
    plot.kind = KINDS[Math.floor(Math.random() * KINDS.length)];
    return y;
  }

  /** Put a vegetable back: it is ripe again straight away. */
  plant(plot: Plot, kind: VegKind): void {
    plot.kind = kind;
    plot.growth = 1;
    plot.ripeAge = 0;
  }

  update(dt: number, wet: (x: number) => boolean, canGrow: boolean): void {
    for (const plot of this.plots) {
      if (plot.growth >= 1) {
        plot.ripeAge += dt;
        continue;
      }
      if (!canGrow || !wet(plot.x)) continue;
      plot.growth = Math.min(1, plot.growth + dt / GROW_SECONDS);
      if (plot.growth === 1) {
        plot.ripeAge = 0;
        audio.grown();
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - this.width / 2;
    ctx.fillStyle = '#7a5340';
    ctx.beginPath();
    ctx.roundRect(left - 4, this.soilY - 10, this.width + 8, 30, 14);
    ctx.fill();

    for (const plot of this.plots) {
      const { y, scale } = this.placeOf(plot);
      // Leaves of the young plant, until the vegetable itself shows.
      if (plot.growth < 1) {
        const s = 0.5 + plot.growth;
        ctx.fillStyle = '#6dbb5a';
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(plot.x + side * 6 * s, this.soilY - 7 * s, 4 * s, 9 * s, side * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Only what is above the soil shows.
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x - 60, this.soilY - 200, 120, 200 + 4);
      ctx.clip();
      drawVeg(ctx, plot.kind, plot.x, y, 0, scale, scale);
      ctx.restore();
    }

    ctx.fillStyle = '#c8956a';
    ctx.beginPath();
    ctx.roundRect(left - 10, this.soilY + 2, this.width + 20, 48, 10);
    ctx.fill();
    ctx.fillStyle = '#b5815a';
    ctx.fillRect(left - 2, this.soilY + 24, this.width + 4, 4);
  }
}
