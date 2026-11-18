import { GROUND_Y } from '../config';
import { settings } from '../settings';

const W = 120;
const H = 70;
/** How many songs it has; one more tap after the last turns it off. */
export const SONG_COUNT = 3;
const LIGHTS = ['#e8665c', '#f2c14e', '#6b93e0'];
/** The first song of each: the summer boombox plays songs 1-3, the winter radio the carols, 4-6,
 * the spring music box 7-9 and the autumn gramophone 10-12. */
const FIRST_SONG = { summer: 1, winter: 4, spring: 7, autumn: 10 };
export type BoomboxStyle = keyof typeof FIRST_SONG;

/**
 * A boombox on the picnic blanket; in winter an old wooden radio with holly on it,
 * in spring a music box with a flower turning on top, in autumn a gramophone. Each
 * tap plays the next song, and after the last, quiet.
 */
export class Boombox {
  readonly depth = GROUND_Y + 28;
  /** 0 off, or which song is playing. It starts on its first one. */
  song: number;
  private beat = 0;

  constructor(
    readonly x: number,
    readonly style: BoomboxStyle = 'summer',
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

  /** Is song `i` (0-2) of its own three the one playing? */
  private lit(i: number): boolean {
    return this.song === FIRST_SONG[this.style] + i;
  }

  /** How far a turning part has gone round: it turns only while a song plays. */
  private get turn(): number {
    return settings.reduceMotion ? this.beat * 0.4 : this.beat * 1.6;
  }

  update(dt: number): void {
    this.beat = this.song ? this.beat + dt : 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.style === 'winter') return this.drawRadio(ctx);
    if (this.style === 'spring') return this.drawMusicBox(ctx);
    if (this.style === 'autumn') return this.drawGramophone(ctx);
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
      ctx.fillStyle = this.lit(i) ? color : '#3f6b65';
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
      ctx.fillStyle = this.lit(i) ? color : '#8a5a3c';
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

  /** A painted music box with its lid open, a flower turning on a stem and a winding key. */
  private drawMusicBox(ctx: CanvasRenderingContext2D): void {
    const w = 104;
    const h = 52;
    const left = this.x - w / 2;
    const top = this.depth - h;
    // The lid, open and leaning back.
    ctx.fillStyle = '#e7a3b8';
    ctx.beginPath();
    ctx.moveTo(left + 4, top + 2);
    ctx.lineTo(left + 14, top - 40);
    ctx.lineTo(left + w - 14, top - 40);
    ctx.lineTo(left + w - 4, top + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f6d6df';
    ctx.beginPath();
    ctx.moveTo(left + 14, top - 2);
    ctx.lineTo(left + 21, top - 33);
    ctx.lineTo(left + w - 21, top - 33);
    ctx.lineTo(left + w - 14, top - 2);
    ctx.closePath();
    ctx.fill();
    // The box, with a band of painted dots.
    ctx.fillStyle = '#f2b8c8';
    ctx.beginPath();
    ctx.roundRect(left, top, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#fbe3ea';
    ctx.fillRect(left, top + 14, w, 12);
    // One dot per song: the one playing is lit.
    LIGHTS.forEach((color, i) => {
      ctx.fillStyle = this.lit(i) ? color : '#e59fb3';
      ctx.beginPath();
      ctx.arc(this.x - 16 + i * 16, top + 20, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
    // The winding key on its side, turning.
    const kx = left + w + 6;
    const ky = top + h / 2;
    ctx.fillStyle = '#e8c27a';
    ctx.fillRect(left + w - 2, ky - 3, 8, 6);
    const squeeze = Math.abs(Math.cos(this.turn * 2));
    for (const dy of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(kx + 4, ky + dy * 9 * squeeze, 5 * Math.max(0.3, squeeze), 8 * Math.max(0.3, squeeze), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // A flower on a stem, turning round while a song plays.
    const fx = this.x;
    const fy = top - 26;
    ctx.strokeStyle = '#7dbb72';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx, top + 2);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    const spin = Math.cos(this.turn * 3);
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(Math.max(0.15, Math.abs(spin)), 1);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 9, Math.sin(a) * 9, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** A gramophone on a wooden box: a record that turns while it plays, and a big flower-shaped horn. */
  private drawGramophone(ctx: CanvasRenderingContext2D): void {
    const w = 96;
    const h = 46;
    const left = this.x - w / 2;
    const top = this.depth - h;
    // The box, with a darker band and one light per song.
    ctx.fillStyle = '#9a6440';
    ctx.beginPath();
    ctx.roundRect(left, top, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#7d4f32';
    ctx.fillRect(left, top + h - 14, w, 6);
    LIGHTS.forEach((color, i) => {
      ctx.fillStyle = this.lit(i) ? color : '#6b4229';
      ctx.beginPath();
      ctx.arc(this.x - 14 + i * 14, top + 17, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    // The record, seen from the side, with a shine going round.
    const rx = this.x - 6;
    const ry = top - 3;
    ctx.fillStyle = '#3f3a40';
    ctx.beginPath();
    ctx.ellipse(rx, ry, 38, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8665c';
    ctx.beginPath();
    ctx.ellipse(rx, ry, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    const a = this.turn * 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(rx + Math.cos(a) * 25, ry + Math.sin(a) * 5, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // The horn: a neck rising from the back corner, opening wide like a flower.
    const nx = left + w - 14;
    ctx.strokeStyle = '#d9a640';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(nx, top - 2);
    ctx.quadraticCurveTo(nx + 6, top - 40, nx - 10, top - 58);
    ctx.stroke();
    const pulse = this.song && !settings.reduceMotion ? Math.max(0, Math.sin(this.beat * Math.PI * 4)) * 0.05 : 0;
    ctx.save();
    ctx.translate(nx - 14, top - 62);
    ctx.rotate(-0.7);
    ctx.scale(1 + pulse, 1 + pulse);
    ctx.fillStyle = '#e8b84f';
    ctx.beginPath();
    ctx.moveTo(-4, 6);
    ctx.lineTo(-40, -34);
    ctx.quadraticCurveTo(0, -56, 40, -34);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c98f35';
    ctx.beginPath();
    ctx.ellipse(0, -40, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(0, -38, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
