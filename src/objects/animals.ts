// Farm animals, drawn front-on from rounded shapes. Faces stay simple: two dot
// eyes and a smile, a mouth that opens for food, and closed happy eyes.

export type AnimalKind = 'cow' | 'hen' | 'sheep' | 'pig';

interface AnimalLook {
  /** Half the width. */
  radius: number;
  height: number;
  /** Mouth position below the item's centre. */
  mouthY: number;
}

export const ANIMAL: Record<AnimalKind, AnimalLook> = {
  cow: { radius: 56, height: 112, mouthY: 22 },
  sheep: { radius: 50, height: 92, mouthY: 14 },
  pig: { radius: 48, height: 84, mouthY: 10 },
  hen: { radius: 36, height: 72, mouthY: -8 },
};

export interface Face {
  /** 0 closed, 1 wide open for food. */
  mouth: number;
  /** Seconds of chewing left. */
  chew: number;
  /** Seconds of looking pleased left. */
  happy: number;
  asleep: boolean;
  /** Seconds left of the current snore, 0 when quiet. */
  snore: number;
}

export const SNORE_SECONDS = 1.1;

const INK = '#4a3f45';

export function drawAnimal(
  ctx: CanvasRenderingContext2D,
  kind: AnimalKind,
  x: number,
  y: number,
  angle: number,
  scaleX: number,
  scaleY: number,
  face: Face,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);
  BODY[kind](ctx);
  const look = ANIMAL[kind];
  // While chewing the mouth keeps opening and closing.
  const open = face.chew > 0 ? 0.25 + 0.25 * Math.sin(face.chew * 18) : face.asleep ? 0 : face.mouth;
  const ink = kind === 'sheep' ? '#f5efe6' : INK;
  if (kind === 'hen') drawBeak(ctx, look.mouthY, open);
  else drawMouth(ctx, look.mouthY, open, ink);
  drawEyes(ctx, EYES[kind], face.asleep ? 'asleep' : face.happy > 0 ? 'happy' : 'open', ink);
  if (face.snore > 0) drawSnoreBubble(ctx, look.radius, look.mouthY, 1 - face.snore / SNORE_SECONDS);
  ctx.restore();
}

const EYES: Record<AnimalKind, [number, number]> = {
  cow: [14, -30],
  sheep: [9, -8],
  pig: [13, -22],
  hen: [9, -20],
};

function drawEyes(
  ctx: CanvasRenderingContext2D,
  [dx, y]: [number, number],
  mood: 'open' | 'happy' | 'asleep',
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    if (mood === 'happy') {
      ctx.arc(side * dx, y + 2, 5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (mood === 'asleep') {
      ctx.arc(side * dx, y - 2, 5, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else {
      ctx.arc(side * dx, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A bubble that swells from the side of the mouth and shrinks away. */
function drawSnoreBubble(ctx: CanvasRenderingContext2D, radius: number, mouthY: number, phase: number): void {
  const r = 3 + 11 * Math.sin(phase * Math.PI);
  const x = Math.min(radius * 0.45, 12) + r;
  ctx.fillStyle = 'rgba(190, 225, 245, 0.8)';
  ctx.beginPath();
  ctx.arc(x, mouthY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, mouthY - r * 0.35, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawMouth(ctx: CanvasRenderingContext2D, y: number, open: number, color: string): void {
  if (open < 0.05) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, y - 5, 7, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(0, y, 6 + 4 * open, 2 + 9 * open, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e78a8a';
  ctx.beginPath();
  ctx.ellipse(0, y + 5 * open, 4 + 2 * open, 3 * open, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeak(ctx: CanvasRenderingContext2D, y: number, open: number): void {
  const gap = 7 * open;
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.moveTo(-8, y - 2 - gap / 2);
  ctx.lineTo(8, y - 2 - gap / 2);
  ctx.lineTo(0, y + 6 - gap / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8923a';
  ctx.beginPath();
  ctx.moveTo(-6, y + 4 + gap / 2);
  ctx.lineTo(6, y + 4 + gap / 2);
  ctx.lineTo(0, y + 10 + gap / 2);
  ctx.closePath();
  ctx.fill();
}

function legs(ctx: CanvasRenderingContext2D, dx: number, top: number, bottom: number, color: string, hoof?: string): void {
  for (const side of [-1, 1]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(side * dx - 9, top, 18, bottom - top, 7);
    ctx.fill();
    if (hoof) {
      ctx.fillStyle = hoof;
      ctx.beginPath();
      ctx.roundRect(side * dx - 9, bottom - 8, 18, 8, [0, 0, 6, 6]);
      ctx.fill();
    }
  }
}

function blob(ctx: CanvasRenderingContext2D, color: string, circles: number[][]): void {
  ctx.fillStyle = color;
  for (const [x, y, r] of circles) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

const BODY: Record<AnimalKind, (ctx: CanvasRenderingContext2D) => void> = {
  cow(ctx) {
    legs(ctx, 24, 24, 56, '#f4eee2', '#8a6f62');
    ctx.fillStyle = '#f4eee2';
    ctx.beginPath();
    ctx.roundRect(-50, -12, 100, 52, 26);
    ctx.fill();
    blob(ctx, '#a98270', [
      [-30, 14, 13],
      [32, 22, 10],
    ]);
    // Horns and ears sit behind the head.
    ctx.fillStyle = '#efe0b8';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 24, -58, 6, 10, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#d9c7bb';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 44, -36, 14, 8, side * -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f8f4ec';
    ctx.beginPath();
    ctx.roundRect(-36, -58, 72, 66, 30);
    ctx.fill();
    blob(ctx, '#a98270', [[-18, -44, 11]]);
    ctx.fillStyle = '#f2bdb3';
    ctx.beginPath();
    ctx.roundRect(-28, -2, 56, 36, 16);
    ctx.fill();
  },

  sheep(ctx) {
    legs(ctx, 18, 22, 46, '#6b6670');
    blob(ctx, '#f7f3ea', [
      [0, -4, 38],
      [-30, 6, 24],
      [30, 6, 24],
      [-22, -28, 21],
      [22, -28, 21],
      [0, -38, 20],
      [-18, 22, 20],
      [18, 22, 20],
    ]);
    ctx.fillStyle = '#6b6670';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 30, -10, 12, 6, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(0, -2, 21, 27, 0, 0, Math.PI * 2);
    ctx.fill();
    blob(ctx, '#f7f3ea', [
      [-8, -30, 9],
      [6, -31, 9],
    ]);
  },

  pig(ctx) {
    legs(ctx, 18, 20, 42, '#e9a3b2');
    ctx.fillStyle = '#f4b6c2';
    ctx.beginPath();
    ctx.ellipse(0, 10, 46, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ee9fb0';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 12, -38);
      ctx.lineTo(side * 30, -44);
      ctx.lineTo(side * 28, -26);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#f7c5cf';
    ctx.beginPath();
    ctx.arc(0, -14, 31, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ee9fb0';
    ctx.beginPath();
    ctx.ellipse(0, -5, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    blob(ctx, '#d9838f', [
      [-5, -5, 2.5],
      [5, -5, 2.5],
    ]);
  },

  hen(ctx) {
    ctx.strokeStyle = '#f2a541';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 10, 26);
      ctx.lineTo(side * 10, 35);
      ctx.stroke();
    }
    blob(ctx, '#e8574f', [
      [-8, -35, 6],
      [0, -38, 7],
      [8, -35, 6],
    ]);
    blob(ctx, '#fbf6ec', [
      [0, 8, 29],
      [0, -14, 22],
    ]);
    ctx.fillStyle = '#efe4d2';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 25, 10, 9, 15, side * -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e8574f';
    ctx.beginPath();
    ctx.ellipse(0, 6, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  },
};
