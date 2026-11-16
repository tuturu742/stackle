import { GROUND_Y } from '../config';
import { mix } from '../color';

interface Drop {
  x: number;
  y: number;
  /** Where it lands, so drops end at different depths on the ground. */
  floor: number;
}

const FALL_SPEED = 700;
const DROPS_PER_SECOND = 70;
/** Rain falls this far either side of the cloud's middle. */
const RAIN_HALF_WIDTH = 80;
/** A cloud can be dragged at most one screen away from where it started, over its bed. */
const RANGE = 1024;

/**
 * A friendly little cloud in the sky with a sleepy smiling face: press and
 * drag it to make it rain wherever it goes. Raining, it turns a soft blue and
 * closes its eyes contentedly.
 */
export class Cloud {
  raining = false;
  private drops: Drop[] = [];
  private spawn = 0;
  /** 0 white, 1 a rainy blue; eases between the two. */
  private grey = 0;
  private time = 0;
  readonly home: number;

  constructor(
    public x: number,
    public y: number,
  ) {
    this.home = x;
  }

  get minX(): number {
    return this.home - RANGE;
  }

  get maxX(): number {
    return this.home + RANGE;
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= 100 + slop / 2 && Math.abs(py - this.y) <= 50 + slop / 2;
  }

  /** Is rain falling at this x right now? */
  wets(x: number): boolean {
    return this.raining && Math.abs(x - this.x) <= RAIN_HALF_WIDTH;
  }

  /** `onLand` hears about each drop reaching the ground, for ripples in puddles. */
  update(dt: number, onLand: (x: number) => void): void {
    this.time += dt;
    this.grey += ((this.raining ? 1 : 0) - this.grey) * Math.min(1, dt * 4);
    if (this.raining) {
      this.spawn += dt * DROPS_PER_SECOND;
      for (; this.spawn >= 1; this.spawn--) {
        this.drops.push({
          x: this.x + (Math.random() * 2 - 1) * RAIN_HALF_WIDTH,
          y: this.y + 20 + Math.random() * 20,
          floor: GROUND_Y - 10 + Math.random() * 90,
        });
      }
    }
    for (const d of this.drops) d.y += FALL_SPEED * dt;
    this.drops = this.drops.filter((d) => {
      if (d.y < d.floor) return true;
      onLand(d.x);
      return false;
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Raindrops as little teardrops.
    ctx.fillStyle = '#9ccbec';
    for (const d of this.drops) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - 14);
      ctx.quadraticCurveTo(d.x + 5, d.y - 3, d.x, d.y);
      ctx.quadraticCurveTo(d.x - 5, d.y - 3, d.x, d.y - 14);
      ctx.fill();
    }
    // A slow, gentle bob while it rains.
    const x = this.x;
    const y = this.y + Math.sin(this.time * 2.2) * 3 * this.grey;
    const body = mix('#ffffff', '#cfdcf3', this.grey);
    const shade = mix('#e8eef8', '#b9c9ea', this.grey);
    // A soft shade under the puffs, then the puffs themselves: round on top, flat-ish below.
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.roundRect(x - 92, y + 2, 184, 44, 22);
    ctx.fill();
    ctx.fillStyle = body;
    for (const [dx, dy, r] of [
      [-60, 6, 32],
      [-24, -16, 42],
      [24, -20, 46],
      [64, 4, 32],
    ]) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.roundRect(x - 90, y - 4, 180, 42, 21);
    ctx.fill();
    // Its face: eyes open and shining, closed in happy arcs while it rains; rosy cheeks and a smile.
    const eye = '#5d6478';
    ctx.fillStyle = eye;
    ctx.strokeStyle = eye;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const ex of [-18, 18]) {
      if (this.raining) {
        ctx.beginPath();
        ctx.arc(x + ex, y + 6, 6, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(x + ex, y + 4, 4.5, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + ex + 1.5, y + 2, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = eye;
      }
    }
    ctx.fillStyle = 'rgba(244, 150, 170, 0.45)';
    for (const cx of [-32, 32]) {
      ctx.beginPath();
      ctx.ellipse(x + cx, y + 14, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y + 12, 6, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
}
