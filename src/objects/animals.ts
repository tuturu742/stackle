// Farm, winter, spring and autumn animals, drawn front-on from rounded shapes. Faces stay simple: two dot
// eyes and a smile, a mouth that opens for food, and closed happy eyes.

export type AnimalKind =
  | 'cow'
  | 'hen'
  | 'sheep'
  | 'pig'
  | 'horse'
  | 'duck'
  | 'cat'
  | 'bunny'
  | 'raccoon'
  | 'beaver'
  | 'penguin'
  | 'reindeer'
  | 'polarbear'
  | 'fox'
  | 'seal'
  | 'frog'
  | 'chick'
  | 'lamb'
  | 'squirrel'
  | 'hedgehog'
  | 'dog';

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
  horse: { radius: 54, height: 124, mouthY: 12 },
  duck: { radius: 36, height: 62, mouthY: -10 },
  cat: { radius: 40, height: 76, mouthY: -4 },
  bunny: { radius: 32, height: 74, mouthY: 2 },
  raccoon: { radius: 40, height: 70, mouthY: 2 },
  beaver: { radius: 42, height: 74, mouthY: 4 },
  penguin: { radius: 36, height: 74, mouthY: -8 },
  reindeer: { radius: 50, height: 120, mouthY: 16 },
  polarbear: { radius: 56, height: 108, mouthY: 16 },
  fox: { radius: 40, height: 76, mouthY: 8 },
  seal: { radius: 50, height: 72, mouthY: 8 },
  frog: { radius: 30, height: 40, mouthY: 6 },
  chick: { radius: 22, height: 36, mouthY: -4 },
  lamb: { radius: 34, height: 60, mouthY: 6 },
  squirrel: { radius: 30, height: 62, mouthY: 0 },
  hedgehog: { radius: 32, height: 40, mouthY: 10 },
  dog: { radius: 42, height: 80, mouthY: 10 },
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
  if (kind === 'hen' || kind === 'penguin' || kind === 'chick') drawBeak(ctx, look.mouthY, open);
  else if (kind === 'duck') drawBill(ctx, look.mouthY, open);
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
  horse: [14, -34],
  duck: [9, -24],
  cat: [11, -18],
  bunny: [10, -10],
  raccoon: [13, -10],
  beaver: [12, -14],
  penguin: [9, -20],
  reindeer: [12, -24],
  polarbear: [15, -22],
  fox: [10, -12],
  seal: [10, -14],
  frog: [12, -15],
  chick: [7, -10],
  lamb: [8, -8],
  squirrel: [8, -12],
  hedgehog: [8, -1],
  dog: [11, -10],
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

function drawBill(ctx: CanvasRenderingContext2D, y: number, open: number): void {
  const gap = 6 * open;
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.ellipse(0, y - gap / 2, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8923a';
  ctx.beginPath();
  ctx.ellipse(0, y + 5 + gap / 2, 10, 4, 0, 0, Math.PI * 2);
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

  horse(ctx) {
    legs(ctx, 22, 26, 62, '#b97a4f', '#5e4136');
    ctx.fillStyle = '#c98a5c';
    ctx.beginPath();
    ctx.roundRect(-50, -6, 100, 48, 24);
    ctx.fill();
    // Mane and ears behind the long face.
    ctx.fillStyle = '#c98a5c';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 12, -58);
      ctx.lineTo(side * 26, -72);
      ctx.lineTo(side * 26, -48);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#d69a6b';
    ctx.beginPath();
    ctx.roundRect(-26, -62, 52, 86, 26);
    ctx.fill();
    blob(ctx, '#7a4a35', [
      [-8, -62, 11],
      [6, -64, 10],
      [-2, -54, 9],
    ]);
    ctx.fillStyle = '#efcfae';
    ctx.beginPath();
    ctx.roundRect(-22, -4, 44, 30, 15);
    ctx.fill();
    blob(ctx, '#c4936f', [
      [-9, 2, 3],
      [9, 2, 3],
    ]);
  },

  cat(ctx) {
    // Tail curling up beside it.
    ctx.strokeStyle = '#e59a52';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(24, 30);
    ctx.quadraticCurveTo(52, 26, 46, -4);
    ctx.stroke();
    // Body and head.
    blob(ctx, '#f2b06a', [
      [0, 18, 28],
      [0, -12, 25],
    ]);
    // Ears.
    ctx.fillStyle = '#f2b06a';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 22, -24);
      ctx.lineTo(side * 20, -46);
      ctx.lineTo(side * 6, -34);
      ctx.fill();
    }
    ctx.fillStyle = '#f6c9b8';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 19, -29);
      ctx.lineTo(side * 18, -40);
      ctx.lineTo(side * 10, -33);
      ctx.fill();
    }
    // Stripes on the head, a pale chest and paws.
    ctx.fillStyle = '#e59a52';
    for (const dx of [-7, 0, 7]) {
      ctx.beginPath();
      ctx.roundRect(dx - 2, -36, 4, 10, 2);
      ctx.fill();
    }
    blob(ctx, '#fbe3c4', [
      [0, 20, 15],
      [-12, 40, 8],
      [12, 40, 8],
    ]);
    // Nose and whiskers.
    ctx.fillStyle = '#e8857a';
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.lineTo(4, -10);
    ctx.lineTo(0, -6);
    ctx.fill();
    ctx.strokeStyle = '#c98552';
    ctx.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      for (const dy of [-8, -3]) {
        ctx.beginPath();
        ctx.moveTo(side * 10, dy);
        ctx.lineTo(side * 26, dy - 3 + (dy + 5) * 0.4);
        ctx.stroke();
      }
    }
  },

  bunny(ctx) {
    // Long ears, a round body and a cotton tail peeking out.
    blob(ctx, '#f7f3ea', [[26, 26, 9]]);
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#e9e1d6';
      ctx.beginPath();
      ctx.ellipse(side * 10, -34, 8, 20, side * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3c3c3';
      ctx.beginPath();
      ctx.ellipse(side * 10, -33, 4, 14, side * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#e9e1d6', [
      [0, 18, 26],
      [0, -6, 21],
    ]);
    blob(ctx, '#f7f3ea', [
      [0, 20, 15],
      [-10, 36, 7],
      [10, 36, 7],
    ]);
    blob(ctx, '#f3a3a3', [[0, -2, 3.5]]);
  },

  raccoon(ctx) {
    // Striped tail behind, grey body, a dark mask round the eyes.
    ctx.save();
    ctx.translate(30, 18);
    ctx.rotate(-0.5);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? '#4b4f58' : '#a9adb5';
      ctx.beginPath();
      ctx.ellipse(0, -i * 10, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    blob(ctx, '#9da2ab', [
      [0, 18, 27],
      [0, -10, 24],
    ]);
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#9da2ab';
      ctx.beginPath();
      ctx.moveTo(side * 22, -20);
      ctx.lineTo(side * 18, -38);
      ctx.lineTo(side * 6, -30);
      ctx.fill();
    }
    blob(ctx, '#e9e7e3', [
      [0, -2, 13],
      [0, 22, 14],
    ]);
    ctx.fillStyle = '#4b4f58';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 12, -10, 10, 7, side * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    // Light rings so the eyes still show on the mask.
    ctx.fillStyle = '#e9e7e3';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 13, -10, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#4b4f58', [[0, -4, 3.5]]);
  },

  beaver(ctx) {
    // A flat paddle tail behind, brown body, big front teeth.
    ctx.fillStyle = '#7a5a48';
    ctx.beginPath();
    ctx.ellipse(28, 30, 22, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();
    blob(ctx, '#a8754f', [
      [0, 18, 28],
      [0, -10, 24],
      [-18, -30, 6],
      [18, -30, 6],
    ]);
    blob(ctx, '#c99a72', [
      [0, 2, 12],
      [0, 22, 15],
    ]);
    blob(ctx, '#5b3a33', [[0, -4, 4]]);
    ctx.fillStyle = '#f7f3ea';
    ctx.beginPath();
    ctx.roundRect(-5, 7, 10, 9, 2);
    ctx.fill();
  },

  duck(ctx) {
    ctx.fillStyle = '#f2a541';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 12, 29, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#f7f3ea', [
      [0, 10, 30],
      [0, -18, 19],
    ]);
    ctx.fillStyle = '#ece4d6';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 26, 10, 9, 16, side * -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#7fb9a0', [[0, -34, 5]]);
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

  penguin(ctx) {
    // Orange feet, a dark coat with flippers, a white belly and a white face.
    ctx.fillStyle = '#f2a541';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 12, 34, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3d4a66';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 29, 8, 8, 18, side * -0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#46557a', [
      [0, 10, 28],
      [0, -14, 23],
    ]);
    ctx.fillStyle = '#fbf8f2';
    ctx.beginPath();
    ctx.ellipse(0, 14, 19, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    blob(ctx, '#fbf8f2', [
      [-8, -16, 10],
      [8, -16, 10],
      [0, -8, 11],
    ]);
    blob(ctx, '#f3b7b0', [
      [-15, -8, 4],
      [15, -8, 4],
    ]);
  },

  reindeer(ctx) {
    legs(ctx, 22, 24, 58, '#9b6a4c', '#4e3a32');
    ctx.fillStyle = '#a97553';
    ctx.beginPath();
    ctx.roundRect(-46, -4, 92, 44, 22);
    ctx.fill();
    // Little antlers and ears behind the head.
    ctx.strokeStyle = '#e3c79a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 12, -40);
      ctx.lineTo(side * 22, -58);
      ctx.moveTo(side * 17, -49);
      ctx.lineTo(side * 30, -52);
      ctx.stroke();
    }
    ctx.fillStyle = '#9b6a4c';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 32, -30, 13, 7, side * -0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#b8815e';
    ctx.beginPath();
    ctx.roundRect(-26, -46, 52, 76, 26);
    ctx.fill();
    // A pale chest patch, a light muzzle and a round red nose.
    ctx.fillStyle = '#ead2b4';
    ctx.beginPath();
    ctx.roundRect(-20, 0, 40, 28, 14);
    ctx.fill();
    blob(ctx, '#e0675e', [[0, 3, 7]]);
    blob(ctx, '#f19a90', [[-2, 1, 2.5]]);
  },

  polarbear(ctx) {
    legs(ctx, 26, 22, 54, '#efeae0');
    ctx.fillStyle = '#f2ede4';
    ctx.beginPath();
    ctx.roundRect(-52, -10, 104, 54, 28);
    ctx.fill();
    // Round ears with a soft grey inside.
    blob(ctx, '#f6f2ea', [
      [-28, -46, 12],
      [28, -46, 12],
    ]);
    blob(ctx, '#d9d3cb', [
      [-28, -46, 6],
      [28, -46, 6],
    ]);
    blob(ctx, '#f9f6f0', [[0, -16, 38]]);
    ctx.fillStyle = '#ece6dc';
    ctx.beginPath();
    ctx.ellipse(0, 8, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3f45';
    ctx.beginPath();
    ctx.ellipse(0, 1, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  dog(ctx) {
    // A puppy sitting up: a tail wagging gently behind, a round tan body with a cream chest.
    const wag = Math.sin(performance.now() / 160) * 0.35;
    ctx.save();
    ctx.translate(26, 24);
    ctx.rotate(-0.9 + wag);
    ctx.fillStyle = '#d9a46c';
    ctx.beginPath();
    ctx.ellipse(0, -12, 7, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    blob(ctx, '#e3b27c', [[0, 18, 28]]);
    blob(ctx, '#f6e6cc', [[0, 22, 16]]);
    // Front paws.
    blob(ctx, '#f6e6cc', [
      [-12, 38, 8],
      [12, 38, 8],
    ]);
    // A round head with a pale muzzle; one ear darker than the other, both flopping down.
    blob(ctx, '#e8bb86', [[0, -10, 27]]);
    ctx.fillStyle = '#9c6a48';
    ctx.beginPath();
    ctx.ellipse(-26, -6, 10, 18, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d29a62';
    ctx.beginPath();
    ctx.ellipse(26, -6, 10, 18, -0.35, 0, Math.PI * 2);
    ctx.fill();
    blob(ctx, '#f6e6cc', [[0, 4, 13]]);
    // A patch round one eye.
    ctx.fillStyle = '#d29a62';
    ctx.beginPath();
    ctx.ellipse(11, -11, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // A red collar with a round golden tag.
    ctx.fillStyle = '#e0675e';
    ctx.beginPath();
    ctx.roundRect(-19, 20, 38, 7, 3.5);
    ctx.fill();
    blob(ctx, '#f2c14e', [[0, 31, 4.5]]);
    // The nose.
    ctx.fillStyle = '#4a3f45';
    ctx.beginPath();
    ctx.ellipse(0, -1, 5, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  fox(ctx) {
    // A bushy tail with a white tip, curled up beside it.
    ctx.save();
    ctx.translate(30, 16);
    ctx.rotate(-0.6);
    ctx.fillStyle = '#e8834a';
    ctx.beginPath();
    ctx.ellipse(0, -6, 12, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbf3e8';
    ctx.beginPath();
    ctx.ellipse(0, -24, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    blob(ctx, '#ee8f52', [
      [0, 18, 26],
      [0, -8, 24],
    ]);
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#ee8f52';
      ctx.beginPath();
      ctx.moveTo(side * 23, -12);
      ctx.lineTo(side * 21, -38);
      ctx.lineTo(side * 5, -26);
      ctx.fill();
      ctx.fillStyle = '#7a4a3e';
      ctx.beginPath();
      ctx.moveTo(side * 19, -18);
      ctx.lineTo(side * 19, -33);
      ctx.lineTo(side * 10, -26);
      ctx.fill();
    }
    // White cheeks and chest, dark little paws.
    blob(ctx, '#fbf3e8', [
      [-12, 2, 11],
      [12, 2, 11],
      [0, 6, 10],
      [0, 22, 13],
    ]);
    blob(ctx, '#6b4438', [
      [-11, 37, 7],
      [11, 37, 7],
    ]);
    blob(ctx, '#4a3f45', [[0, -1, 3.5]]);
  },

  seal(ctx) {
    // Sitting up: a tail fin behind, a round grey body, front flippers.
    ctx.fillStyle = '#8e9aa6';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 16, 32, 14, 5, side * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#a5b0bb';
    ctx.beginPath();
    ctx.ellipse(0, 12, 40, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#95a1ad';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 36, 18, 15, 7, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#b3bdc7', [[0, -10, 24]]);
    blob(ctx, '#c9d1d8', [[0, 18, 18]]);
    // A pale muzzle with whisker dots.
    blob(ctx, '#d6dce2', [
      [-7, 2, 8],
      [7, 2, 8],
    ]);
    ctx.fillStyle = '#6f7a85';
    for (const [x, y] of [
      [-10, 0],
      [-6, 4],
      [-11, 5],
      [10, 0],
      [6, 4],
      [11, 5],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#4a3f45', [[0, -4, 4]]);
  },

  frog(ctx) {
    // Splayed back feet, a wide round body with a pale belly, and big eyes on top.
    ctx.fillStyle = '#6aa865';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 24, 16, 13, 6, side * -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#7dbb72', [[0, 4, 26]]);
    ctx.fillStyle = '#7dbb72';
    ctx.beginPath();
    ctx.ellipse(0, 6, 30, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d7ecc0';
    ctx.beginPath();
    ctx.ellipse(0, 12, 17, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Front feet tucked in.
    blob(ctx, '#6aa865', [
      [-10, 19, 5],
      [10, 19, 5],
    ]);
    // Eye bumps with white eyes; the pupils are drawn on top.
    blob(ctx, '#7dbb72', [
      [-12, -15, 10],
      [12, -15, 10],
    ]);
    blob(ctx, '#fbf8f2', [
      [-12, -15, 7.5],
      [12, -15, 7.5],
    ]);
    blob(ctx, '#f3b7b0', [
      [-20, 2, 3.5],
      [20, 2, 3.5],
    ]);
  },

  chick(ctx) {
    // A fluffy round chick: little orange feet, stubby wings, a tuft on top.
    ctx.strokeStyle = '#f2a541';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 7, 12);
      ctx.lineTo(side * 7, 18);
      ctx.moveTo(side * 3, 18);
      ctx.lineTo(side * 11, 18);
      ctx.stroke();
    }
    ctx.fillStyle = '#f7d65c';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 17, 4, 6, 9, side * -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#fbe27a', [
      [0, 3, 16],
      [0, -8, 13],
      [-3, -21, 4],
      [3, -22, 3.5],
    ]);
    blob(ctx, '#fff0a8', [[0, 7, 9]]);
    blob(ctx, '#f6b9a4', [
      [-11, -5, 3],
      [11, -5, 3],
    ]);
  },

  lamb(ctx) {
    legs(ctx, 13, 12, 30, '#8a7466', '#5e4a42');
    // Cream wool, fluffy all over, with a soft brown face and floppy ears.
    blob(ctx, '#f6efe0', [
      [-20, 6, 14],
      [-6, 12, 15],
      [10, 12, 15],
      [22, 4, 13],
      [-14, -8, 13],
      [14, -8, 13],
      [0, -2, 16],
    ]);
    ctx.fillStyle = '#b89a86';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 19, -10, 9, 5, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#c9ad97';
    ctx.beginPath();
    ctx.roundRect(-14, -24, 28, 38, 14);
    ctx.fill();
    blob(ctx, '#f6efe0', [
      [-6, -24, 7],
      [3, -27, 7],
      [9, -22, 6],
    ]);
    blob(ctx, '#d9c0ad', [[0, 6, 8]]);
  },

  squirrel(ctx) {
    // A big bushy tail curling up behind, with a lighter curl at the tip.
    ctx.fillStyle = '#c4673f';
    ctx.beginPath();
    ctx.ellipse(20, 6, 14, 26, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(26, -18, 13, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    blob(ctx, '#d98a5e', [[29, -21, 7]]);
    // Sitting up: a round body, a cream tummy, little paws held together.
    blob(ctx, '#cf7448', [
      [0, 14, 17],
      [0, -12, 15],
    ]);
    // Tufted ears.
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#cf7448';
      ctx.beginPath();
      ctx.moveTo(side * 14, -18);
      ctx.lineTo(side * 13, -33);
      ctx.lineTo(side * 4, -24);
      ctx.fill();
      ctx.fillStyle = '#9b4f33';
      ctx.beginPath();
      ctx.arc(side * 13, -32, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    blob(ctx, '#f4e2c8', [
      [0, 18, 11],
      [-6, -2, 6],
      [6, -2, 6],
    ]);
    blob(ctx, '#b85c38', [
      [-5, 12, 4.5],
      [5, 12, 4.5],
      [-8, 29, 5],
      [8, 29, 5],
    ]);
    blob(ctx, '#4a3f45', [[0, -5, 2.8]]);
  },

  hedgehog(ctx) {
    // A dome of soft rounded spines, a pale face peeking out in front, a dark nose.
    blob(ctx, '#7a5c48', [
      [-22, 2, 12],
      [22, 2, 12],
      [-16, -10, 12],
      [16, -10, 12],
      [-6, -16, 12],
      [6, -16, 12],
      [0, 4, 22],
    ]);
    blob(ctx, '#94735c', [
      [-18, -4, 6],
      [-8, -12, 6],
      [8, -12, 6],
      [18, -4, 6],
      [-24, 8, 5],
      [24, 8, 5],
    ]);
    blob(ctx, '#6b4f3d', [
      [-12, 18, 6],
      [12, 18, 6],
    ]);
    ctx.fillStyle = '#efdcc4';
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    blob(ctx, '#f3b7b0', [
      [-11, 6, 3],
      [11, 6, 3],
    ]);
    blob(ctx, '#4a3f45', [[0, 5, 3.5]]);
  },
};
