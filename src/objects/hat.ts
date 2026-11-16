// Hats from the hat machine. They stack like anything else, sit well on an
// animal's head, and can go into a puddle or a bin: the machine makes more.

export type HatKind = 'straw' | 'cap' | 'beanie' | 'party' | 'earmuffs' | 'pompom' | 'tophat' | 'santa';

export const HAT: Record<HatKind, { radius: number; height: number }> = {
  straw: { radius: 46, height: 30 },
  cap: { radius: 34, height: 26 },
  beanie: { radius: 30, height: 34 },
  party: { radius: 24, height: 48 },
  earmuffs: { radius: 40, height: 30 },
  pompom: { radius: 30, height: 44 },
  tophat: { radius: 30, height: 40 },
  santa: { radius: 34, height: 44 },
};

/** The farm's hat machine gives these, in this order. */
export const HAT_KINDS: HatKind[] = ['straw', 'cap', 'beanie', 'party'];
/** Hats for the winter town. */
export const WINTER_HATS: HatKind[] = ['beanie', 'earmuffs', 'pompom', 'tophat', 'santa'];

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
  earmuffs(ctx) {
    ctx.strokeStyle = '#8a8f99';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 8, 28, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    for (const dx of [-28, 28]) {
      blob(ctx, '#f3a3c4', () => ctx.arc(dx, 4, 12, 0, Math.PI * 2));
      blob(ctx, '#f8c6da', () => ctx.arc(dx - 3, 1, 5, 0, Math.PI * 2));
    }
  },
  pompom(ctx) {
    blob(ctx, '#e8665c', () => ctx.ellipse(0, 12, 28, 26, 0, Math.PI, Math.PI * 2));
    // Knitted stripes, kept inside the dome.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 12, 28, 26, 0, Math.PI, Math.PI * 2);
    ctx.clip();
    blob(ctx, '#f6efe0', () => {
      ctx.rect(-30, -1, 60, 5);
      ctx.rect(-30, -10, 60, 4);
    });
    ctx.restore();
    blob(ctx, '#d4554c', () => ctx.roundRect(-30, 8, 60, 13, 6));
    blob(ctx, '#f6efe0', () => ctx.arc(0, -15, 8, 0, Math.PI * 2));
  },
  tophat(ctx) {
    blob(ctx, '#3f3a40', () => ctx.ellipse(0, 15, 30, 5, 0, 0, Math.PI * 2));
    blob(ctx, '#4a434a', () => ctx.roundRect(-18, -20, 36, 36, [5, 5, 2, 2]));
    blob(ctx, '#e8665c', () => ctx.rect(-18, 4, 36, 7));
    blob(ctx, 'rgba(255, 255, 255, 0.12)', () => ctx.roundRect(-13, -16, 5, 18, 2.5));
  },
  santa(ctx) {
    // A red cone flopping over to one side, a white fur band and a pompom on the tip.
    blob(ctx, '#d9473f', () => {
      ctx.moveTo(-26, 12);
      ctx.quadraticCurveTo(-22, -16, 2, -18);
      ctx.quadraticCurveTo(22, -18, 26, -2);
      ctx.quadraticCurveTo(14, -10, 10, 0);
      ctx.lineTo(26, 12);
      ctx.closePath();
    });
    blob(ctx, 'rgba(255, 255, 255, 0.14)', () => ctx.ellipse(-10, -4, 6, 10, -0.5, 0, Math.PI * 2));
    blob(ctx, '#f7f3ea', () => ctx.roundRect(-34, 8, 68, 14, 7));
    blob(ctx, '#f7f3ea', () => ctx.arc(26, -4, 8, 0, Math.PI * 2));
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
