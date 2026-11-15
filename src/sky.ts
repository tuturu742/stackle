import { palette } from './config';
import * as audio from './audio';

const SUN = { x: 860, y: 130, r: 60 };
/** Seconds for day to turn into night, or back. */
const FADE_SECONDS = 2;

// Night is drawn by multiplying the whole scene with this colour, so these sky
// colours are chosen to come out as a deep blue once multiplied.
const NIGHT_TINT = [107, 120, 168];
const NIGHT_SKY_TOP = '#4a5b7c';
const NIGHT_SKY_BOTTOM = '#8997a9';

// Fixed stars, kept to open sky away from the tree and the moon. They never twinkle.
const STARS = [
  [540, 60, 2.5],
  [620, 140, 2],
  [700, 50, 3],
  [760, 200, 2],
  [960, 60, 2.5],
  [990, 230, 2],
  [520, 250, 2],
  [660, 300, 2.5],
  [900, 320, 2],
  [60, 70, 2.5],
  [180, 40, 2],
  [330, 70, 3],
  [440, 120, 2],
  [30, 220, 2],
];

/** Tap the sun for night, tap the moon for day. */
export class Sky {
  /** 0 = full day, 1 = full night. */
  night = 0;
  private toNight = false;

  get isNight(): boolean {
    return this.night > 0.5;
  }

  hits(x: number, y: number, slop: number): boolean {
    return Math.hypot(x - SUN.x, y - SUN.y) <= SUN.r + slop;
  }

  toggle(): void {
    this.toNight = !this.toNight;
    audio.chime(this.toNight);
  }

  update(dt: number): void {
    const step = dt / FADE_SECONDS;
    this.night = this.toNight ? Math.min(1, this.night + step) : Math.max(0, this.night - step);
  }

  /** Sky colours and the sun, behind everything else. Drawn in screen pixels. */
  drawSky(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, mix(palette.skyTop, NIGHT_SKY_TOP, this.night));
    sky.addColorStop(1, mix(palette.skyBottom, NIGHT_SKY_BOTTOM, this.night));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
  }

  /** The sun sinks and fades as night comes. Drawn in world units. */
  drawSun(ctx: CanvasRenderingContext2D): void {
    if (this.night >= 1) return;
    const t = ease(this.night);
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = palette.sun;
    ctx.beginPath();
    ctx.arc(SUN.x, SUN.y + t * 50, SUN.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /** Darken the finished scene, then put the moon and stars on top. */
  drawNight(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number): void {
    if (this.night <= 0) return;
    const t = ease(this.night);
    const [r, g, b] = NIGHT_TINT.map((c) => Math.round(255 + (c - 255) * t));
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(left, top, width, height);
    ctx.globalCompositeOperation = 'source-over';

    ctx.globalAlpha = t;
    ctx.fillStyle = '#fdf6d8';
    for (const [x, y, size] of STARS) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    // The moon rises into the sun's place: a soft crescent.
    const y = SUN.y + (1 - t) * 50;
    ctx.save();
    ctx.beginPath();
    ctx.rect(SUN.x - SUN.r * 2, y - SUN.r * 2, SUN.r * 4, SUN.r * 4);
    ctx.arc(SUN.x + 24, y - 14, SUN.r * 0.62, 0, Math.PI * 2);
    ctx.clip('evenodd');
    ctx.fillStyle = '#f6efcf';
    ctx.beginPath();
    ctx.arc(SUN.x, y, SUN.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const channel = (shift: number) => {
    const ca = (pa >> shift) & 255;
    const cb = (pb >> shift) & 255;
    return Math.round(ca + (cb - ca) * t);
  };
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}
