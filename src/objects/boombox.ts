import { GROUND_Y } from '../config';
import { settings } from '../settings';

const W = 120;
const H = 70;
/** How many songs it has; one more tap after the last turns it off. */
export const SONG_COUNT = 3;
const LIGHTS = ['#e8665c', '#f2c14e', '#6b93e0'];
/** The first song of each: the summer boombox plays songs 1-3, the winter radio the carols, 4-6. */
const FIRST_SONG = { summer: 1, winter: 4 };

/**
 * A boombox on the picnic blanket, or in winter an old wooden radio with holly
 * on it. Each tap plays the next song, and after the last, quiet.
 */
export class Boombox {
  readonly depth = GROUND_Y + 28;
  /** 0 off, or which song is playing. It starts on its first one. */
  song: number;
  private beat = 0;

  constructor(
    readonly x: number,
    readonly style: 'summer' | 'winter' = 'summer',
  ) {
    this.song = FIRST_SONG[style];
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= W / 2 + slop && py >= this.depth - H - 30 - slop && py <= this.depth + slop;
  }

  /** The next song, or off after the last; returns the song to play, or 0. */
  tap(): number {
    const first = FIRST_SONG[this.style];
    const turn = this.song ? this.song - first + 1 : 0;
    const next = (turn + 1) % (SONG_COUNT + 1);
    this.song = next ? first + next - 1 : 0;
    return this.song;
  }

  /** Speakers thump gently to the beat while a song plays. */
  private get thump(): number {
    return this.song && !settings.reduceMotion ? Math.max(0, Math.sin(this.beat * Math.PI * 4)) * 3 : 0;
  }

  update(dt: number): void {
    this.beat = this.song ? this.beat + dt : 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.style === 'winter') return this.drawRadio(ctx);
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
    const thump = this.thump;
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

  /** An old wooden tabletop radio: a rounded top, speaker cloth, two knobs, holly and a bow. */
  private drawRadio(ctx: CanvasRenderingContext2D): void {
    const top = this.depth - H - 14;
    const left = this.x - W / 2;
    const pulse = this.thump;
    // Wooden case with an arched top, and little feet.
    ctx.fillStyle = '#7a4f36';
    for (const dx of [14, W - 26]) {
      ctx.beginPath();
      ctx.roundRect(left + dx, this.depth - 6, 12, 8, 3);
      ctx.fill();
    }
    ctx.fillStyle = '#b5784c';
    ctx.beginPath();
    ctx.moveTo(left, this.depth - 6);
    ctx.lineTo(left, top + 34);
    ctx.quadraticCurveTo(left, top, this.x, top);
    ctx.quadraticCurveTo(left + W, top, left + W, top + 34);
    ctx.lineTo(left + W, this.depth - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c98d5e';
    ctx.beginPath();
    ctx.moveTo(left + 8, top + 34);
    ctx.quadraticCurveTo(left + 8, top + 8, this.x, top + 8);
    ctx.quadraticCurveTo(left + W - 8, top + 8, left + W - 8, top + 34);
    ctx.closePath();
    ctx.fill();
    // Speaker cloth in an arch, its slats swelling a touch with the beat.
    const cx = this.x - 14;
    const clothTop = top + 18;
    const clothBottom = this.depth - 18;
    ctx.fillStyle = '#efd9b0';
    ctx.beginPath();
    ctx.moveTo(cx - 34, clothBottom);
    ctx.lineTo(cx - 34, clothTop + 24);
    ctx.quadraticCurveTo(cx - 34, clothTop, cx, clothTop);
    ctx.quadraticCurveTo(cx + 34, clothTop, cx + 34, clothTop + 24);
    ctx.lineTo(cx + 34, clothBottom);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9b6a45';
    for (const dx of [-18, 0, 18]) {
      ctx.beginPath();
      ctx.roundRect(cx + dx - 2.5 - pulse * 0.3, clothTop + 10, 5 + pulse * 0.6, clothBottom - clothTop - 16, 2.5);
      ctx.fill();
    }
    // Two knobs on the right, and the song lights above them.
    for (const y of [top + 46, this.depth - 17]) {
      ctx.fillStyle = '#5a3a28';
      ctx.beginPath();
      ctx.arc(this.x + 40, y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8c27a';
      ctx.beginPath();
      ctx.arc(this.x + 40, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    LIGHTS.forEach((color, i) => {
      ctx.fillStyle = this.song === FIRST_SONG.winter + i ? color : '#8a5a3c';
      ctx.beginPath();
      ctx.arc(this.x + 32 + i * 8, top + 28, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    // A sprig of holly on the top, with red berries and a little bow.
    const hx = this.x + 26;
    const hy = top + 6;
    ctx.fillStyle = '#4f9a5c';
    for (const [dx, dy, a] of [
      [-12, 0, -0.5],
      [12, 0, 0.5],
      [0, -6, 0],
    ]) {
      ctx.save();
      ctx.translate(hx + dx, hy + dy);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#e8473f';
    for (const [dx, dy] of [
      [-3, 2],
      [3, 2],
      [0, -2],
    ]) {
      ctx.beginPath();
      ctx.arc(hx + dx, hy + dy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const bx = this.x - 48;
    const by = top + 22;
    ctx.fillStyle = '#d9574f';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 13, by - 8);
    ctx.lineTo(bx - 13, by + 8);
    ctx.closePath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 13, by - 8);
    ctx.lineTo(bx + 13, by + 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx - 2, by + 2);
    ctx.lineTo(bx - 8, by + 16);
    ctx.lineTo(bx - 3, by + 15);
    ctx.moveTo(bx + 2, by + 2);
    ctx.lineTo(bx + 8, by + 16);
    ctx.lineTo(bx + 3, by + 15);
    ctx.fill();
    ctx.fillStyle = '#b8443d';
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
