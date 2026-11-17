// Soft things drifting down over the view: autumn leaves tumbling from the
// trees, or spring blossom petals. Drawn in world units over the part in view;
// every piece's place comes from its number and the time, so nothing is kept.

const LEAF_COLORS = ['#e8873a', '#d9603b', '#f2b544', '#b9773f', '#e4a03c'];
const PETAL_COLORS = ['#f8d3e0', '#fbe6ee', '#f7f3ea', '#f3c1d3'];
/** The view's width and height in world units: a little wider than a screen, for wide displays. */
const VIEW_W = 1024 * 1.4;
const VIEW_H = 768;

export function drawFalling(
  ctx: CanvasRenderingContext2D,
  left: number,
  time: number,
  kind: 'leaves' | 'petals',
  reduceMotion: boolean,
): void {
  const leaves = kind === 'leaves';
  const count = (leaves ? 14 : 16) * (reduceMotion ? 0.5 : 1);
  const speed = (leaves ? 1 : 0.7) * (reduceMotion ? 0.5 : 1);
  const colors = leaves ? LEAF_COLORS : PETAL_COLORS;
  const h = VIEW_H + 60;
  for (let i = 0; i < count; i++) {
    const fall = time * (24 + (i % 4) * 6) * speed;
    const drift = Math.sin(time * (0.6 + (i % 3) * 0.15) + i) * (leaves ? 40 : 28);
    const x = left + ((((i * 233.9 + drift + time * 12 * speed) % VIEW_W) + VIEW_W) % VIEW_W);
    const y = -30 + ((i * 101.3 + fall) % h);
    // Tumbling: a turn, and a flip that narrows the shape as it rolls over.
    const spin = time * (0.8 + (i % 5) * 0.2) * speed + i;
    const flip = Math.cos(spin * 1.3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.scale(1, 0.35 + 0.65 * Math.abs(flip));
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    if (leaves) {
      const s = 10 + (i % 3) * 2;
      ctx.moveTo(-s, 0);
      ctx.quadraticCurveTo(0, -s * 0.7, s, 0);
      ctx.quadraticCurveTo(0, s * 0.7, -s, 0);
    } else {
      // A petal: round at one end, a little notch at the other.
      const s = 6 + (i % 3);
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s, -s * 0.4, 0, s);
      ctx.quadraticCurveTo(-s, -s * 0.4, 0, -s);
    }
    ctx.fill();
    ctx.restore();
  }
}
