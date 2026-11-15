import { GROUND_Y } from '../config';

const WIDTH = 300;
const WALL_TOP = GROUND_Y - 190;

/** An open-fronted stable for the horse: a back wall, a sloping roof on posts, a hay rack. */
export class Stable {
  /** Drawn behind anything standing in it. */
  readonly depth = GROUND_Y - 1;

  constructor(readonly x: number) {}

  update(): void {}

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - WIDTH / 2;
    // Back wall of planks.
    ctx.fillStyle = '#b98763';
    ctx.fillRect(left, WALL_TOP, WIDTH, this.depth - WALL_TOP);
    ctx.fillStyle = '#ad7b58';
    for (let x = left + 30; x < left + WIDTH; x += 50) ctx.fillRect(x, WALL_TOP, 5, this.depth - WALL_TOP);
    // Hay rack with hay poking out.
    ctx.fillStyle = '#e8cf7a';
    ctx.beginPath();
    ctx.ellipse(this.x + 70, WALL_TOP + 72, 46, 22, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a5245';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x + 22, WALL_TOP + 72);
    ctx.lineTo(this.x + 118, WALL_TOP + 72);
    for (let x = this.x + 30; x <= this.x + 110; x += 16) {
      ctx.moveTo(x, WALL_TOP + 72);
      ctx.lineTo(x + 6, WALL_TOP + 100);
    }
    ctx.stroke();
    // Posts and a sloping roof that overhangs the front.
    ctx.fillStyle = '#8d5c4f';
    ctx.fillRect(left - 6, WALL_TOP - 10, 16, this.depth - WALL_TOP + 10);
    ctx.fillRect(left + WIDTH - 10, WALL_TOP - 10, 16, this.depth - WALL_TOP + 10);
    ctx.fillStyle = '#6f8fb0';
    ctx.beginPath();
    ctx.moveTo(left - 30, WALL_TOP + 10);
    ctx.lineTo(left - 10, WALL_TOP - 60);
    ctx.lineTo(left + WIDTH + 10, WALL_TOP - 60);
    ctx.lineTo(left + WIDTH + 30, WALL_TOP + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5f7fa0';
    for (let x = left; x < left + WIDTH; x += 40) ctx.fillRect(x, WALL_TOP - 58, 6, 66);
  }
}
