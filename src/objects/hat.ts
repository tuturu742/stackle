// Hats from the hat machine. They stack like anything else, sit well on an
// animal's head, and can go into a puddle or a bin: the machine makes more.

export type HatKind = 'straw' | 'cap' | 'beanie' | 'party';

export const HAT: Record<HatKind, { radius: number; height: number }> = {
  straw: { radius: 46, height: 30 },
  cap: { radius: 34, height: 26 },
  beanie: { radius: 30, height: 34 },
  party: { radius: 24, height: 48 },
};

export const HAT_KINDS = Object.keys(HAT) as HatKind[];

export function drawHat(
  ctx: CanvasRenderingContext2D,
  kind: HatKind,
  x: number,
  y: number,
  angle: number,
  scaleX: number,
  scaleY: number,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);
  DRAW[kind](ctx);
  ctx.restore();
}

function blob(ctx: CanvasRenderingContext2D, fill: string, draw: () => void): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  draw();
  ctx.fill();
}

const DRAW: Record<HatKind, (ctx: CanvasRenderingContext2D) => void> = {
  straw(ctx) {
    blob(ctx, '#e3b65c', () => ctx.ellipse(0, 8, 46, 8, 0, 0, Math.PI * 2));
    blob(ctx, '#efc873', () => ctx.roundRect(-24, -15, 48, 25, [16, 16, 4, 4]));
    blob(ctx, '#e07a6a', () => ctx.rect(-24, 0, 48, 7));
  },
  cap(ctx) {
    blob(ctx, '#d9534f', () => ctx.ellipse(18, 10, 22, 5, 0, 0, Math.PI * 2));
    blob(ctx, '#e8665f', () => ctx.ellipse(-4, 13, 28, 26, 0, Math.PI, Math.PI * 2));
    blob(ctx, '#f39a8f', () => ctx.arc(-4, -13, 4, 0, Math.PI * 2));
  },
  beanie(ctx) {
    blob(ctx, '#6b93e0', () => ctx.ellipse(0, 9, 28, 24, 0, Math.PI, Math.PI * 2));
    blob(ctx, '#5682d4', () => ctx.roundRect(-30, 5, 60, 12, 6));
    blob(ctx, '#f4f1ea', () => ctx.arc(0, -13, 8, 0, Math.PI * 2));
  },
  party(ctx) {
    blob(ctx, '#f2a65a', () => {
      ctx.moveTo(-22, 22);
      ctx.quadraticCurveTo(0, 26, 22, 22);
      ctx.lineTo(2, -17);
      ctx.quadraticCurveTo(0, -20, -2, -17);
      ctx.closePath();
    });
    for (const [dx, dy] of [
      [-8, 12],
      [7, 6],
      [-1, -4],
    ])
      blob(ctx, '#fbe39a', () => ctx.arc(dx, dy, 3.5, 0, Math.PI * 2));
    blob(ctx, '#ef7f9a', () => ctx.arc(0, -19, 6, 0, Math.PI * 2));
  },
};
