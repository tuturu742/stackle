// What grows in the beds, drawn from rounded shapes like the fruit: the farm's
// vegetables, autumn's pumpkins, and spring's flowers (cut flowers are not food).

export type FlowerKind = 'tulip' | 'daffodil' | 'daisy';
export type VegKind = 'carrot' | 'tomato' | 'cabbage' | 'corn' | 'pumpkin' | FlowerKind;

interface VegLook {
  /** Half the width. */
  radius: number;
  height: number;
  /** How much of it shows above the soil once ripe, if not half. */
  shows?: number;
}

export const VEG: Record<VegKind, VegLook> = {
  carrot: { radius: 20, height: 72 },
  tomato: { radius: 30, height: 56 },
  cabbage: { radius: 34, height: 60 },
  corn: { radius: 18, height: 66 },
  pumpkin: { radius: 44, height: 66, shows: 0.8 },
  tulip: { radius: 20, height: 56, shows: 0.7 },
  daffodil: { radius: 20, height: 56, shows: 0.7 },
  daisy: { radius: 20, height: 56, shows: 0.7 },
};

/** The farm's vegetables: a picked plot in their bed grows back one of these. */
export const GARDEN_VEG: VegKind[] = ['carrot', 'tomato', 'cabbage', 'corn'];
export const FLOWERS: FlowerKind[] = ['tulip', 'daffodil', 'daisy'];

/** Flowers grow in beds like vegetables, but nobody eats them. */
export function isFlower(kind: string): kind is FlowerKind {
  return (FLOWERS as string[]).includes(kind);
}

const LEAF = '#6dbb5a';

export function drawVeg(
  ctx: CanvasRenderingContext2D,
  kind: VegKind,
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

/** A cut flower's stem and one leaf, from the bloom down to the cut end. */
function stem(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#5fae55';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(2, 10, 0, 27);
  ctx.stroke();
  ctx.fillStyle = LEAF;
  ctx.beginPath();
  ctx.ellipse(8, 12, 4, 11, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

const DRAW: Record<VegKind, (ctx: CanvasRenderingContext2D) => void> = {
  pumpkin(ctx) {
    // A curly stem and a leaf, then the ribbed body: side lobes behind, the middle in front.
    ctx.strokeStyle = '#7a8a3c';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.quadraticCurveTo(-2, -32, 4, -35);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#6dbb5a';
    ctx.beginPath();
    ctx.arc(10, -32, 5, Math.PI, Math.PI * 2.6);
    ctx.stroke();
    ctx.fillStyle = LEAF;
    ctx.beginPath();
    ctx.ellipse(-12, -28, 10, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e9853a';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 22, 4, 22, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f39a48';
    ctx.beginPath();
    ctx.ellipse(0, 3, 22, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6b26b';
    ctx.globalAlpha *= 0.7;
    ctx.beginPath();
    ctx.ellipse(-8, -10, 5, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= 0.7;
  },

  tulip(ctx) {
    stem(ctx);
    // A cup of three petals.
    ctx.fillStyle = '#ec6f8c';
    for (const [dx, tilt] of [
      [-7, -0.25],
      [7, 0.25],
    ]) {
      ctx.beginPath();
      ctx.ellipse(dx, -16, 8, 13, tilt, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f58ea6';
    ctx.beginPath();
    ctx.ellipse(0, -15, 8, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  daffodil(ctx) {
    stem(ctx);
    // Pale petals all round, and a deep yellow trumpet in the middle.
    ctx.fillStyle = '#fbe58a';
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 9, -16 + Math.sin(a) * 9, 7, 5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f2b33d';
    ctx.beginPath();
    ctx.arc(0, -16, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e39a2a';
    ctx.beginPath();
    ctx.arc(0, -16, 3.5, 0, Math.PI * 2);
    ctx.fill();
  },

  daisy(ctx) {
    stem(ctx);
    ctx.fillStyle = '#fbf8f0';
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 10, -16 + Math.sin(a) * 10, 6, 3.5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(0, -16, 6, 0, Math.PI * 2);
    ctx.fill();
  },

  carrot(ctx) {
    ctx.fillStyle = LEAF;
    for (const [dx, tilt] of [
      [-7, -0.35],
      [0, 0],
      [7, 0.35],
    ]) {
      ctx.beginPath();
      ctx.ellipse(dx, -27, 5, 11, tilt, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f08a3c';
    ctx.beginPath();
    ctx.moveTo(-20, -14);
    ctx.quadraticCurveTo(-20, -20, -12, -20);
    ctx.lineTo(12, -20);
    ctx.quadraticCurveTo(20, -20, 20, -14);
    ctx.quadraticCurveTo(10, 20, 2, 34);
    ctx.quadraticCurveTo(0, 37, -2, 34);
    ctx.quadraticCurveTo(-10, 20, -20, -14);
    ctx.fill();
    ctx.strokeStyle = '#d9732c';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (const [y, w] of [
      [-4, 8],
      [10, 6],
      [22, 4],
    ]) {
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.lineTo(w * 0.2, y);
      ctx.stroke();
    }
  },

  tomato(ctx) {
    ctx.fillStyle = '#e9584a';
    ctx.beginPath();
    ctx.ellipse(0, 3, 30, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f39488';
    ctx.globalAlpha *= 0.7;
    ctx.beginPath();
    ctx.ellipse(-12, -6, 7, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= 0.7;
    ctx.fillStyle = LEAF;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + ((i - 2) * Math.PI) / 5;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 7, -21 + Math.sin(a) * 3 + 3, 7, 3, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.roundRect(-2, -28, 4, 8, 2);
    ctx.fill();
  },

  corn(ctx) {
    ctx.fillStyle = '#f2cf4e';
    ctx.beginPath();
    ctx.ellipse(0, -4, 13, 29, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e3b93a';
    for (let y = -22; y <= 14; y += 9) {
      for (const x of [-5, 4]) {
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Husk leaves wrapped round the bottom.
    ctx.fillStyle = LEAF;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 33);
      ctx.quadraticCurveTo(side * 22, 14, side * 10, -14);
      ctx.quadraticCurveTo(side * 8, 10, 0, 33);
      ctx.fill();
    }
  },

  cabbage(ctx) {
    ctx.fillStyle = '#b6de95';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 18, 6, 18, 22, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#9fd27a';
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#80bf5e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-6, 4, 16, -Math.PI * 0.4, Math.PI * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(6, 2, 12, Math.PI * 0.65, Math.PI * 1.4);
    ctx.stroke();
  },
};
