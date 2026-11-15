import { palette } from './config';

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  floor: number;
  color: string;
}

const GRAVITY = 1500;

/** Water droplets thrown up by a splash. */
export class Splashes {
  private drops: Drop[] = [];

  splash(x: number, y: number, size: number, color: string = palette.waterLight): void {
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
        color,
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
    for (const d of this.drops) {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

interface Note {
  x: number;
  y: number;
  age: number;
  color: string;
}

const NOTE_COLORS = ['#e8665c', '#6b93e0', '#f2a541', '#7fb85e'];
const NOTE_SECONDS = 1.6;

/** Music notes floating up from an animal playing an instrument. */
export class Notes {
  private notes: Note[] = [];
  private count = 0;

  add(x: number, y: number): void {
    this.notes.push({ x, y, age: 0, color: NOTE_COLORS[this.count++ % NOTE_COLORS.length] });
  }

  update(dt: number): void {
    for (const n of this.notes) {
      n.age += dt;
      n.y -= 50 * dt;
      n.x += Math.sin(n.age * 4) * 20 * dt;
    }
    this.notes = this.notes.filter((n) => n.age < NOTE_SECONDS);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const n of this.notes) {
      ctx.globalAlpha = 1 - n.age / NOTE_SECONDS;
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.ellipse(n.x, n.y, 7, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(n.x + 4, n.y - 22, 3, 22);
      ctx.beginPath();
      ctx.moveTo(n.x + 7, n.y - 22);
      ctx.quadraticCurveTo(n.x + 16, n.y - 16, n.x + 14, n.y - 8);
      ctx.lineTo(n.x + 7, n.y - 15);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
