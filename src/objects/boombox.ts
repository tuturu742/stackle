import { GROUND_Y } from '../config';
import { settings } from '../settings';

const W = 120;
const H = 70;
/** How many songs it has; one more tap after the last turns it off. */
export const SONG_COUNT = 3;
const LIGHTS = ['#e8665c', '#f2c14e', '#6b93e0'];

/** A boombox on the picnic blanket. Each tap plays the next song, and after the last, quiet. */
export class Boombox {
  readonly depth = GROUND_Y + 28;
  /** 0 off, or which song is playing. */
  song = 0;
  private beat = 0;

  constructor(readonly x: number) {}

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= W / 2 + slop && py >= this.depth - H - 30 - slop && py <= this.depth + slop;
  }

  /** The next song, or off after the last. */
  tap(): number {
    this.song = (this.song + 1) % (SONG_COUNT + 1);
    return this.song;
  }

  update(dt: number): void {
    this.beat = this.song ? this.beat + dt : 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const top = this.depth - H;
    const left = this.x - W / 2;
    // Handle.
    ctx.strokeStyle = '#4b4f58';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(left + 22, top + 2);
    ctx.lineTo(left + 30, top - 20);
    ctx.lineTo(left + W - 30, top - 20);
    ctx.lineTo(left + W - 22, top + 2);
    ctx.stroke();
    ctx.fillStyle = '#5fa8a0';
    ctx.beginPath();
    ctx.roundRect(left, top, W, H, 14);
    ctx.fill();
    // Speakers thump gently to the beat while a song plays.
    const thump = this.song && !settings.reduceMotion ? Math.max(0, Math.sin(this.beat * Math.PI * 4)) * 3 : 0;
    for (const dx of [-32, 32]) {
      ctx.fillStyle = '#3f4650';
      ctx.beginPath();
      ctx.arc(this.x + dx, top + H / 2 + 4, 22 + thump, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6b7380';
      ctx.beginPath();
      ctx.arc(this.x + dx, top + H / 2 + 4, 9 + thump * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // One light per song: the one playing is lit.
    LIGHTS.forEach((color, i) => {
      ctx.fillStyle = this.song === i + 1 ? color : '#3f6b65';
      ctx.beginPath();
      ctx.arc(this.x - 10 + i * 10, top + 14, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
