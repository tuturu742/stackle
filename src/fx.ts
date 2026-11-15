import { palette } from './config';

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  floor: number;
}

const GRAVITY = 1500;

/** Water droplets thrown up by a splash. */
export class Splashes {
  private drops: Drop[] = [];

  splash(x: number, y: number, size: number): void {
    const count = 10 + Math.round(8 * size);
    const power = Math.sqrt(size);
    for (let i = 0; i < count; i++) {
      const spread = (i / (count - 1) - 0.5) * 2;
      this.drops.push({
        x: x + spread * 14,
        y,
        vx: spread * (120 + Math.random() * 120) * power,
        vy: -(320 + Math.random() * 280) * power,
        r: 4 + Math.random() * 5,
        floor: y + 4,
      });
    }
  }

  update(dt: number): void {
    for (const d of this.drops) {
      d.vy += GRAVITY * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    }
    this.drops = this.drops.filter((d) => d.vy < 0 || d.y < d.floor);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = palette.waterLight;
    for (const d of this.drops) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
