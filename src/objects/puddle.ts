import Matter from 'matter-js';
import { GROUND_Y, palette } from '../config';

interface Ripple {
  x: number;
  age: number;
  size: number;
}

/**
 * A puddle sits on solid ground. Its water surface is a sensor: a disposable
 * thing that touches it after being let go sinks with a splash.
 */
export class Puddle {
  readonly sensor: Matter.Body;
  readonly surfaceY = GROUND_Y - 4;
  private ripples: Ripple[] = [];

  constructor(
    readonly x: number,
    readonly width: number,
  ) {
    this.sensor = Matter.Bodies.rectangle(x, GROUND_Y - 12, width * 0.88, 28, {
      isStatic: true,
      isSensor: true,
    });
  }

  ripple(x: number, size: number): void {
    this.ripples.push({ x, age: 0, size });
  }

  update(dt: number): void {
    for (const r of this.ripples) r.age += dt;
    this.ripples = this.ripples.filter((r) => r.age < 1.4);
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const rx = this.width / 2;
    const ry = 20;
    const cy = GROUND_Y + 4;

    ctx.fillStyle = palette.waterDeep;
    ctx.beginPath();
    ctx.ellipse(this.x, cy + 3, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.water;
    ctx.beginPath();
    ctx.ellipse(this.x, cy, rx - 6, ry - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(this.x, cy, rx - 6, ry - 4, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = palette.waterLight;
    ctx.globalAlpha = 0.6;
    const shimmer = Math.sin(time * 1.5) * 8;
    ctx.beginPath();
    ctx.ellipse(this.x - rx * 0.35 + shimmer, cy - 5, rx * 0.25, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.waterLight;
    ctx.lineWidth = 3;
    for (const r of this.ripples) {
      const t = r.age / 1.4;
      ctx.globalAlpha = (1 - t) * 0.9;
      const w = 12 + t * rx * (0.6 + 0.2 * r.size);
      ctx.beginPath();
      ctx.ellipse(r.x, cy, w, w * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
