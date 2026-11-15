// Things that are neither fruit, vegetables, hats nor animals: hay from the
// barn, treats from the picnic basket, pies, popcorn and tortillas from the
// grill, eggs from the coop, flour from the windmill (all food), and toys that are kept forever: the model ship and instruments.

export type TreatKind = 'cake' | 'corndog' | 'sandwich' | 'cookie';
export type GoodFoodKind = 'hay' | 'pie' | 'egg' | 'popcorn' | 'flour' | 'tortilla' | TreatKind;
export type InstrumentKind = 'drum' | 'guitar' | 'trumpet';
export type ToyKind = 'ship' | InstrumentKind;
export type GoodKind = GoodFoodKind | ToyKind;

export const TREATS: TreatKind[] = ['cake', 'corndog', 'sandwich', 'cookie'];
export const INSTRUMENTS: InstrumentKind[] = ['drum', 'guitar', 'trumpet'];

interface GoodLook {
  radius: number;
  height: number;
  food: boolean;
}

export const GOODS: Record<GoodKind, GoodLook> = {
  hay: { radius: 34, height: 36, food: true },
  pie: { radius: 36, height: 26, food: true },
  egg: { radius: 16, height: 40, food: true },
  popcorn: { radius: 28, height: 44, food: true },
  flour: { radius: 26, height: 46, food: true },
  tortilla: { radius: 36, height: 14, food: true },
  cake: { radius: 30, height: 40, food: true },
  corndog: { radius: 14, height: 66, food: true },
  sandwich: { radius: 32, height: 30, food: true },
  cookie: { radius: 22, height: 16, food: true },
  ship: { radius: 48, height: 56, food: false },
  drum: { radius: 30, height: 36, food: false },
  guitar: { radius: 22, height: 70, food: false },
  trumpet: { radius: 34, height: 26, food: false },
};

export function isGood(kind: string): kind is GoodKind {
  return kind in GOODS;
}

export function isInstrument(kind: string): kind is InstrumentKind {
  return (INSTRUMENTS as string[]).includes(kind);
}

export function drawGood(
  ctx: CanvasRenderingContext2D,
  kind: GoodKind,
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

function fill(ctx: CanvasRenderingContext2D, color: string, shape: () => void): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  shape();
  ctx.fill();
}

function lines(ctx: CanvasRenderingContext2D, color: string, width: number, segments: number[][]): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of segments) {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  }
  ctx.stroke();
}

const DRAW: Record<GoodKind, (ctx: CanvasRenderingContext2D) => void> = {
  hay(ctx) {
    fill(ctx, '#e8cf7a', () => ctx.roundRect(-34, -18, 68, 36, 9));
    lines(ctx, '#d4b65e', 2.5, [
      [-26, -8, 10, -8],
      [-18, 2, 24, 2],
      [-28, 11, 4, 11],
    ]);
    fill(ctx, '#b5814f', () => {
      ctx.rect(-16, -18, 4, 36);
      ctx.rect(12, -18, 4, 36);
    });
  },
  pie(ctx) {
    fill(ctx, '#d99a55', () => ctx.ellipse(0, 4, 36, 9, 0, 0, Math.PI * 2));
    fill(ctx, '#e8b56a', () => ctx.roundRect(-34, -8, 68, 14, [10, 10, 4, 4]));
    fill(ctx, '#f2cd86', () => ctx.ellipse(0, -8, 32, 6, 0, 0, Math.PI * 2));
    lines(ctx, '#d99a55', 3, [
      [-20, -11, -12, -5],
      [-4, -12, 4, -4],
      [12, -11, 20, -5],
    ]);
  },
  popcorn(ctx) {
    // A striped tub heaped with popcorn.
    fill(ctx, '#fbf3df', () => {
      for (const [dx, dy, r] of [
        [-16, -10, 10],
        [0, -16, 12],
        [15, -10, 10],
        [-7, -4, 9],
        [8, -4, 9],
      ]) {
        ctx.moveTo(dx + r, dy);
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
      }
    });
    fill(ctx, '#f6e2a8', () => ctx.arc(4, -18, 4, 0, Math.PI * 2));
    fill(ctx, '#f7f3ea', () => {
      ctx.moveTo(-24, -2);
      ctx.lineTo(24, -2);
      ctx.lineTo(18, 22);
      ctx.lineTo(-18, 22);
      ctx.closePath();
    });
    for (const dx of [-14, 0, 14]) fill(ctx, '#e8665c', () => ctx.rect(dx - 3.5 - dx * 0.12, -2, 7, 24));
  },
  flour(ctx) {
    // A tied sack with a wheat ear on it.
    fill(ctx, '#efe6d2', () => {
      ctx.moveTo(-12, -18);
      ctx.quadraticCurveTo(-28, 0, -24, 18);
      ctx.quadraticCurveTo(0, 26, 24, 18);
      ctx.quadraticCurveTo(28, 0, 12, -18);
      ctx.closePath();
    });
    fill(ctx, '#e3d7bd', () => ctx.ellipse(0, -21, 12, 5, 0, 0, Math.PI * 2));
    fill(ctx, '#c9a26b', () => ctx.roundRect(-13, -17, 26, 5, 2));
    lines(ctx, '#d9a64e', 3, [[0, 14, 0, -4]]);
    for (const dy of [-2, 4, 10]) {
      fill(ctx, '#e8b85a', () => ctx.ellipse(-5, dy, 5, 3, 0.6, 0, Math.PI * 2));
      fill(ctx, '#e8b85a', () => ctx.ellipse(5, dy, 5, 3, -0.6, 0, Math.PI * 2));
    }
  },
  tortilla(ctx) {
    fill(ctx, '#e6c88f', () => ctx.ellipse(0, 2, 36, 9, 0, 0, Math.PI * 2));
    fill(ctx, '#f2dcaa', () => ctx.ellipse(0, -1, 34, 7, 0, 0, Math.PI * 2));
    for (const [dx, dy] of [
      [-16, -1],
      [6, -3],
      [18, 1],
      [-4, 2],
    ])
      fill(ctx, '#d4a865', () => ctx.ellipse(dx, dy, 3, 1.5, 0, 0, Math.PI * 2));
  },
  egg(ctx) {
    fill(ctx, '#fbf6ec', () => {
      ctx.moveTo(0, -20);
      ctx.bezierCurveTo(14, -20, 16, 6, 16, 8);
      ctx.bezierCurveTo(16, 18, 8, 20, 0, 20);
      ctx.bezierCurveTo(-8, 20, -16, 18, -16, 8);
      ctx.bezierCurveTo(-16, 6, -14, -20, 0, -20);
    });
    fill(ctx, '#ffffff', () => ctx.ellipse(-5, -6, 4, 6, -0.3, 0, Math.PI * 2));
  },
  cake(ctx) {
    fill(ctx, '#f3c8d4', () => ctx.roundRect(-30, -8, 60, 28, 8));
    fill(ctx, '#fff4ef', () => ctx.roundRect(-30, -14, 60, 12, 6));
    fill(ctx, '#e8645f', () => ctx.arc(0, -18, 6, 0, Math.PI * 2));
    fill(ctx, '#e3a1b5', () => ctx.rect(-30, 6, 60, 4));
  },
  corndog(ctx) {
    fill(ctx, '#e2c49a', () => ctx.roundRect(-3, 14, 6, 19, 3));
    fill(ctx, '#e3a54b', () => ctx.roundRect(-14, -33, 28, 50, 14));
    lines(ctx, '#f2d06b', 3, [[-6, -24, 2, -14]]);
  },
  sandwich(ctx) {
    fill(ctx, '#f0d9a7', () => ctx.roundRect(-32, 4, 64, 11, 5));
    fill(ctx, '#86c26a', () => ctx.roundRect(-34, -2, 68, 8, 4));
    fill(ctx, '#e8665c', () => ctx.roundRect(-28, -6, 56, 6, 3));
    fill(ctx, '#f0d9a7', () => ctx.roundRect(-32, -15, 64, 11, [8, 8, 4, 4]));
  },
  cookie(ctx) {
    fill(ctx, '#d9a066', () => ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2));
    fill(ctx, '#7a4a35', () => {
      ctx.arc(-9, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(4, -3, 2.5, 0, Math.PI * 2);
      ctx.arc(10, 2, 2.5, 0, Math.PI * 2);
    });
  },
  ship(ctx) {
    // A little sailing boat: hull, mast and two sails.
    fill(ctx, '#c0614f', () => {
      ctx.moveTo(-48, 10);
      ctx.lineTo(48, 10);
      ctx.lineTo(34, 28);
      ctx.lineTo(-34, 28);
      ctx.closePath();
    });
    fill(ctx, '#f6efe0', () => ctx.rect(-40, 10, 80, 5));
    fill(ctx, '#8d5c4f', () => ctx.rect(-2, -28, 4, 40));
    fill(ctx, '#f6efe0', () => {
      ctx.moveTo(4, -26);
      ctx.lineTo(36, 6);
      ctx.lineTo(4, 6);
      ctx.closePath();
    });
    fill(ctx, '#eadfca', () => {
      ctx.moveTo(-4, -20);
      ctx.lineTo(-30, 6);
      ctx.lineTo(-4, 6);
      ctx.closePath();
    });
    fill(ctx, '#6b93e0', () => {
      ctx.moveTo(2, -28);
      ctx.lineTo(16, -23);
      ctx.lineTo(2, -18);
      ctx.closePath();
    });
  },
  drum(ctx) {
    fill(ctx, '#e8665c', () => ctx.roundRect(-30, -10, 60, 28, 8));
    fill(ctx, '#f6efe0', () => ctx.ellipse(0, -10, 30, 8, 0, 0, Math.PI * 2));
    lines(ctx, '#f2c14e', 3, [
      [-26, -4, -12, 16],
      [-12, -4, 2, 16],
      [2, -4, 16, 16],
      [16, -4, 28, 12],
    ]);
  },
  guitar(ctx) {
    fill(ctx, '#8d5c4f', () => ctx.roundRect(-4, -35, 8, 40, 3));
    fill(ctx, '#e3a54b', () => {
      ctx.arc(0, 8, 16, 0, Math.PI * 2);
      ctx.arc(0, 22, 20, 0, Math.PI * 2);
    });
    fill(ctx, '#7a4a35', () => ctx.arc(0, 14, 6, 0, Math.PI * 2));
    fill(ctx, '#5e4136', () => ctx.roundRect(-6, -36, 12, 8, 3));
  },
  trumpet(ctx) {
    fill(ctx, '#f2c14e', () => {
      ctx.moveTo(14, -12);
      ctx.lineTo(34, -18);
      ctx.lineTo(34, 18);
      ctx.lineTo(14, 12);
      ctx.closePath();
    });
    fill(ctx, '#f2c14e', () => ctx.roundRect(-34, -5, 52, 10, 5));
    fill(ctx, '#d9a63a', () => {
      ctx.roundRect(-14, -12, 6, 10, 3);
      ctx.roundRect(-4, -12, 6, 10, 3);
      ctx.roundRect(6, -12, 6, 10, 3);
    });
  },
};
