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

/** A cloud in the sky: press and drag it to make it rain wherever it goes. */
export class Cloud {
  raining = false;
  private drops: Drop[] = [];
  private spawn = 0;
  /** 0 white, 1 a rainy grey; eases between the two. */
  private grey = 0;
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
    ctx.strokeStyle = '#8fc3e6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const d of this.drops) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - 12);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }
    ctx.fillStyle = mix('#ffffff', '#d5dee8', this.grey);
    for (const [dx, dy, r] of [
      [-55, 10, 34],
      [-20, -12, 44],
      [25, -6, 40],
      [62, 12, 30],
      [0, 18, 34],
    ]) {
      ctx.beginPath();
      ctx.arc(this.x + dx, this.y + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
