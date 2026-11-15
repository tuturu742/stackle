import { GROUND_Y } from '../config';

interface Fly {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  phase: number;
}

/** How near (world units) a held finger has to be for the fireflies to come. */
const CALL_DIST = 450;

/**
 * Fireflies over a field, glowing only at night. They gather round a finger
 * held nearby and drift back home when it lifts.
 */
export class Fireflies {
  private readonly flies: Fly[] = [];
  private time = 0;

  constructor(
    readonly x: number,
    readonly width: number,
  ) {
    for (let i = 0; i < 14; i++) {
      const homeX = x - width / 2 + ((i * 0.618) % 1) * width;
      const homeY = GROUND_Y - 120 - ((i * 0.37) % 1) * 160;
      this.flies.push({ homeX, homeY, x: homeX, y: homeY, phase: i * 1.3 });
    }
  }

  /** `fingers` are held fingers in world units near this field; they only call at night. */
  update(dt: number, fingers: { x: number; y: number }[], night: number): void {
    this.time += dt;
    for (const f of this.flies) {
      let finger: { x: number; y: number } | null = null;
      if (night > 0.5) {
        let best = CALL_DIST;
        for (const p of fingers) {
          const d = Math.hypot(p.x - f.x, p.y - f.y);
          if (d < best) {
            best = d;
            finger = p;
          }
        }
      }
      const t = this.time * 0.8 + f.phase;
      const tx = finger ? finger.x + Math.cos(t * 1.7) * 46 : f.homeX + Math.sin(t * 0.5) * 50;
      const ty = finger ? finger.y + Math.sin(t * 2.1) * 34 : f.homeY + Math.cos(t * 0.6) * 30;
      const k = Math.min(1, dt * (finger ? 2.2 : 0.8));
      f.x += (tx - f.x) * k;
      f.y += (ty - f.y) * k;
    }
  }

  draw(ctx: CanvasRenderingContext2D, night: number): void {
    if (night <= 0) return;
    for (const f of this.flies) {
      const glow = night * (0.55 + 0.45 * Math.sin(this.time * 2.4 + f.phase * 2));
      ctx.globalAlpha = glow * 0.35;
      ctx.fillStyle = '#f6f2a0';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#fbf8c8';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
