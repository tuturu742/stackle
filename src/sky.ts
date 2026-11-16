import { SCREEN_W, palette } from './config';
import * as audio from './audio';
import { mix } from './color';

// The sun keeps its place near the top right of the screen as the world scrolls.
const SUN = { fromRight: 164, y: 130, r: 60 };
/** Seconds for day to turn into night, or back. */
const FADE_SECONDS = 2;

const NIGHT_SKY_TOP = '#1f2b52';
const NIGHT_SKY_BOTTOM = '#3a4870';
/** At full night the landscape is washed with this colour. */
const NIGHT_WASH = 'rgba(18, 26, 68, 0.62)';

// Fixed stars, spread across the screen behind everything. They never twinkle.
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
  toNight = false;
  private left = 0;
  private width = SCREEN_W;
  /** The day sky's colours, top and bottom, for the level. */
  colors = { top: palette.skyTop, bottom: palette.skyBottom };

  setView(left: number, width: number): void {
    this.left = left;
    this.width = width;
  }

  private get sunX(): number {
    return this.left + this.width - SUN.fromRight;
  }

  get isNight(): boolean {
    return this.night > 0.5;
  }

  hits(x: number, y: number, slop: number): boolean {
    return Math.hypot(x - this.sunX, y - SUN.y) <= SUN.r + slop;
  }

  /** Straight to day or night, without the fade or the chime, as when a saved scene opens. */
  setNight(on: boolean): void {
    this.toNight = on;
    this.night = on ? 1 : 0;
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
    sky.addColorStop(0, mix(this.colors.top, NIGHT_SKY_TOP, this.night));
    sky.addColorStop(1, mix(this.colors.bottom, NIGHT_SKY_BOTTOM, this.night));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Sun, moon and stars, in world units, behind the landscape: the sun sinks
   * and fades as night comes, and the moon rises into its place.
   */
  drawLights(ctx: CanvasRenderingContext2D): void {
    const t = ease(this.night);
    const x = this.sunX;
    if (t < 1) {
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = palette.sun;
      ctx.beginPath();
      ctx.arc(x, SUN.y + t * 50, SUN.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (t > 0) {
      ctx.globalAlpha = t;
      ctx.fillStyle = '#fdf6d8';
      const spread = this.width / SCREEN_W;
      for (const [sx, sy, size] of STARS) {
        ctx.beginPath();
        ctx.arc(this.left + sx * spread, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
      // A soft crescent: the moon with a round bite clipped out of it.
      const y = SUN.y + (1 - t) * 50;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - SUN.r * 2, y - SUN.r * 2, SUN.r * 4, SUN.r * 4);
      ctx.arc(x + 24, y - 14, SUN.r * 0.62, 0, Math.PI * 2);
      ctx.clip('evenodd');
      ctx.fillStyle = '#f6efcf';
      ctx.beginPath();
      ctx.arc(x, y, SUN.r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /** Darken a layer holding only the landscape, leaving the sky behind it alone. */
  washLandscape(layer: CanvasRenderingContext2D): void {
    if (this.night <= 0) return;
    layer.save();
    layer.setTransform(1, 0, 0, 1, 0, 0);
    layer.globalCompositeOperation = 'source-atop';
    layer.globalAlpha = ease(this.night);
    layer.fillStyle = NIGHT_WASH;
    layer.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
    layer.restore();
  }
}

function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

