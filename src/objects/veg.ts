// Vegetables from the beds, drawn from rounded shapes like the fruit.

export type VegKind = 'carrot' | 'tomato' | 'cabbage' | 'corn';

interface VegLook {
  /** Half the width. */
  radius: number;
  height: number;
}

export const VEG: Record<VegKind, VegLook> = {
  carrot: { radius: 20, height: 72 },
  tomato: { radius: 30, height: 56 },
  cabbage: { radius: 34, height: 60 },
  corn: { radius: 18, height: 66 },
};

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

const DRAW: Record<VegKind, (ctx: CanvasRenderingContext2D) => void> = {
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
