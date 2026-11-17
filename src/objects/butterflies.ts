import { GROUND_Y } from '../config';

interface Butterfly {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  phase: number;
  color: string;
  spot: string;
  /** Which way it faces, smoothed. */
  face: number;
}

/** How near (world units) a held flower has to be for a butterfly to come. */
const CALL_DIST = 320;
const COLORS: [string, string][] = [
  ['#f3a3c4', '#fbe0ec'],
  ['#f2c14e', '#fbe9b8'],
  ['#9ec5f0', '#e3effb'],
  ['#c3a6e8', '#ece2f8'],
  ['#f4a46a', '#fde1cc'],
  ['#a8d88e', '#e4f4da'],
];

/**
 * Butterflies over a meadow. In the day each one flutters round its home, and
 * comes to flutter round a flower carried near it; at night they rest low in
 * the grass with their wings folded.
 */
export class Butterflies {
  private readonly flies: Butterfly[] = [];
  private time = 0;
  private night = 0;

  constructor(
    readonly x: number,
    readonly width: number,
  ) {
    COLORS.forEach(([color, spot], i) => {
      const homeX = x - width / 2 + ((i * 0.618 + 0.1) % 1) * width;
      const homeY = GROUND_Y - 90 - ((i * 0.41) % 1) * 130;
      this.flies.push({ homeX, homeY, x: homeX, y: homeY, phase: i * 1.7, color, spot, face: 1 });
    });
  }

  /** `lures` are held flowers in world units near this meadow. */
  update(dt: number, lures: { x: number; y: number }[], night: number): void {
    this.time += dt;
    this.night = night;
    for (const f of this.flies) {
      let lure: { x: number; y: number } | null = null;
      if (night < 0.5) {
        let best = CALL_DIST;
        for (const p of lures) {
          const d = Math.hypot(p.x - f.x, p.y - f.y);
          if (d < best) {
            best = d;
            lure = p;
          }
        }
      }
      const t = this.time * 0.7 + f.phase;
      let tx: number;
      let ty: number;
      if (night >= 0.5) {
        // Resting low in the grass for the night.
        tx = f.homeX;
        ty = GROUND_Y - 6;
      } else if (lure) {
        tx = lure.x + Math.cos(t * 1.9) * 40;
        ty = lure.y - 20 + Math.sin(t * 2.6) * 26;
      } else {
        tx = f.homeX + Math.sin(t * 0.45) * 70;
        ty = f.homeY + Math.cos(t * 0.8) * 34;
      }
      const k = Math.min(1, dt * (lure ? 2 : 0.7));
      const dx = (tx - f.x) * k;
      f.x += dx;
      f.y += (ty - f.y) * k;
      if (Math.abs(dx) > 0.05) f.face += ((dx > 0 ? 1 : -1) - f.face) * Math.min(1, dt * 4);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const resting = this.night >= 0.5;
    for (const f of this.flies) {
      // Wings flap by narrowing; folded upright while resting.
      const flap = resting ? 0.25 : 0.3 + 0.7 * Math.abs(Math.sin(this.time * 9 + f.phase));
      const bob = resting ? 0 : Math.sin(this.time * 4 + f.phase) * 2;
      const x = f.x;
      const y = f.y + bob;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flap * (f.face < 0 ? -1 : 1), 1);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(-8, -8, 11, 13, -0.5, 0, Math.PI * 2);
      ctx.ellipse(8, -8, 11, 13, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-6, 6, 7, 8, 0.4, 0, Math.PI * 2);
      ctx.ellipse(6, 6, 7, 8, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.spot;
      ctx.beginPath();
      ctx.arc(-9, -9, 4, 0, Math.PI * 2);
      ctx.arc(9, -9, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // The body and feelers, not narrowed by the flap.
      ctx.fillStyle = '#5e4a42';
      ctx.beginPath();
      ctx.roundRect(x - 2, y - 10, 4, 20, 2);
      ctx.fill();
      ctx.strokeStyle = '#5e4a42';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 1, y - 10);
      ctx.quadraticCurveTo(x - 4, y - 18, x - 7, y - 19);
      ctx.moveTo(x + 1, y - 10);
      ctx.quadraticCurveTo(x + 4, y - 18, x + 7, y - 19);
      ctx.stroke();
    }
  }
}
