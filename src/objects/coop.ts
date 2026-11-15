import { GROUND_Y } from '../config';
import type { Perch } from './perch';

const BOX_W = 210;
const BOX_TOP = GROUND_Y - 236;
const BOX_BOTTOM = GROUND_Y - 92;
const NEST_W = 112;

/**
 * A cheerful hen house on legs. Anything can sit in its nest; a hen fed there
 * lays an egg, which drops out underneath.
 */
export class Coop implements Perch {
  readonly depth = GROUND_Y + 6;
  readonly seatCount = 1;

  constructor(readonly x: number) {}

  /** The nest is on the left, the round window on the right. */
  private get nestX(): number {
    return this.x - 34;
  }

  seatX(): number {
    return this.nestX;
  }

  seatTop(): number {
    return BOX_BOTTOM - 10;
  }

  seatReach(): number {
    return 52;
  }

  /** Where a new egg starts falling from. */
  get eggDrop(): { x: number; bottom: number } {
    return { x: this.nestX, bottom: BOX_BOTTOM + 30 };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - BOX_W / 2;
    const right = this.x + BOX_W / 2;
    // Legs.
    ctx.fillStyle = '#b07d5b';
    for (const dx of [-BOX_W / 2 + 16, BOX_W / 2 - 28]) ctx.fillRect(this.x + dx, BOX_BOTTOM, 12, this.depth - BOX_BOTTOM);
    // Ramp with little rungs, down to the ground.
    const top = { x: right - 8, y: BOX_BOTTOM - 4 };
    const foot = { x: right + 80, y: this.depth - 4 };
    ctx.strokeStyle = '#d9a36b';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(foot.x, foot.y);
    ctx.stroke();
    ctx.strokeStyle = '#b07d5b';
    ctx.lineWidth = 4;
    for (let t = 0.2; t < 0.95; t += 0.2) {
      const x = top.x + (foot.x - top.x) * t;
      const y = top.y + (foot.y - top.y) * t;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 6);
      ctx.lineTo(x + 4, y + 6);
      ctx.stroke();
    }
    // House: sunny walls with planks.
    ctx.fillStyle = '#f6cf6e';
    ctx.beginPath();
    ctx.roundRect(left, BOX_TOP, BOX_W, BOX_BOTTOM - BOX_TOP, 8);
    ctx.fill();
    ctx.fillStyle = '#eebf58';
    for (let y = BOX_TOP + 26; y < BOX_BOTTOM - 6; y += 26) ctx.fillRect(left + 6, y, BOX_W - 12, 3);
    ctx.fillStyle = '#e9b04c';
    ctx.fillRect(left, BOX_BOTTOM - 10, BOX_W, 10);
    // Roof with a white edge.
    ctx.fillStyle = '#f6efe0';
    ctx.beginPath();
    ctx.moveTo(left - 24, BOX_TOP + 10);
    ctx.lineTo(this.x, BOX_TOP - 78);
    ctx.lineTo(right + 24, BOX_TOP + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8665c';
    ctx.beginPath();
    ctx.moveTo(left - 14, BOX_TOP + 2);
    ctx.lineTo(this.x, BOX_TOP - 68);
    ctx.lineTo(right + 14, BOX_TOP + 2);
    ctx.closePath();
    ctx.fill();
    // A heart under the peak.
    ctx.fillStyle = '#f6efe0';
    const hx = this.x;
    const hy = BOX_TOP - 24;
    ctx.beginPath();
    ctx.arc(hx - 6, hy, 7, 0, Math.PI * 2);
    ctx.arc(hx + 6, hy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 13, hy + 2);
    ctx.lineTo(hx, hy + 16);
    ctx.lineTo(hx + 13, hy + 2);
    ctx.fill();
    // The nest opening, warm inside, with straw spilling over the edge.
    ctx.fillStyle = '#9b6a4e';
    ctx.beginPath();
    ctx.roundRect(this.nestX - NEST_W / 2, BOX_TOP + 22, NEST_W, BOX_BOTTOM - BOX_TOP - 30, [54, 54, 6, 6]);
    ctx.fill();
    ctx.fillStyle = '#f2dc8a';
    ctx.beginPath();
    ctx.ellipse(this.nestX, BOX_BOTTOM - 10, NEST_W / 2 + 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e3c66c';
    ctx.lineWidth = 3;
    for (const dx of [-40, -18, 8, 30, 46]) {
      ctx.beginPath();
      ctx.moveTo(this.nestX + dx, BOX_BOTTOM - 12);
      ctx.lineTo(this.nestX + dx + 7, BOX_BOTTOM + 2);
      ctx.stroke();
    }
    // Round window with a flower box.
    const wx = right - 46;
    const wy = BOX_TOP + 62;
    ctx.fillStyle = '#f6efe0';
    ctx.beginPath();
    ctx.arc(wx, wy, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bfe3f2';
    ctx.beginPath();
    ctx.arc(wx, wy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7fb85e';
    ctx.beginPath();
    ctx.roundRect(wx - 30, wy + 34, 60, 16, 4);
    ctx.fill();
    for (const [dx, color] of [
      [-18, '#e8665c'],
      [0, '#f6efe0'],
      [18, '#b39ddb'],
    ] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(wx + dx, wy + 30, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
