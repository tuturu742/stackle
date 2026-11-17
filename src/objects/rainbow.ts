import { GROUND_Y } from '../config';

/** Seconds to fade in, to stay, and to fade out. */
const FADE_IN = 1.5;
const STAY = 8;
const FADE_OUT = 2;
const HALF = 450;
const RISE = 420;
const BAND = 16;
const BANDS = ['#f4a3a3', '#f6c79a', '#f6e39c', '#b5e0a4', '#a8cdee', '#c6b0e6'];

/**
 * A rainbow that comes out when the rain stops: a big soft arc fading in over
 * where it rained, staying a while, then fading away. It never flashes.
 */
export class Rainbow {
  private x = 0;
  /** Seconds since it started showing, or Infinity when gone. */
  private age = Infinity;

  /** Show it over x; if it is already out, it stays longer. */
  show(x: number): void {
    if (this.visible) {
      // Keep the fade where it is, but put off the fading out.
      this.age = Math.min(this.age, FADE_IN);
      return;
    }
    this.x = x;
    this.age = 0;
  }

  update(dt: number): void {
    if (this.age !== Infinity) this.age += dt;
    if (this.age > FADE_IN + STAY + FADE_OUT) this.age = Infinity;
  }

  get visible(): boolean {
    return this.age !== Infinity;
  }

  /** 0..1, how much of it shows. */
  private get strength(): number {
    const a = this.age;
    if (a === Infinity) return 0;
    if (a < FADE_IN) return a / FADE_IN;
    if (a < FADE_IN + STAY) return 1;
    return Math.max(0, 1 - (a - FADE_IN - STAY) / FADE_OUT);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const k = this.strength;
    if (k <= 0) return;
    // An ease so it softly appears rather than switching on.
    ctx.globalAlpha = 0.55 * k * k * (3 - 2 * k);
    ctx.lineWidth = BAND + 1;
    BANDS.forEach((color, i) => {
      const r = HALF - i * BAND;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.ellipse(this.x, GROUND_Y, r, r * (RISE / HALF), 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
}
