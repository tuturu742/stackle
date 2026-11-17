import { palette } from '../config';
import { mix } from '../color';

export type FruitKind = 'apple' | 'pear' | 'plum' | 'cherry' | 'acorn';

interface FruitLook {
  radius: number;
  color: string;
  shine: string;
}

export const FRUIT: Record<FruitKind, FruitLook> = {
  apple: { radius: 34, color: '#ec7a6c', shine: '#f7b2a8' },
  pear: { radius: 32, color: '#d9d76a', shine: '#eeedb0' },
  plum: { radius: 28, color: '#a07ac4', shine: '#c8b0e0' },
  cherry: { radius: 22, color: '#d9474f', shine: '#f08a8f' },
  acorn: { radius: 22, color: '#c08a4e', shine: '#dcb27e' },
};

const UNRIPE = '#9ccc65';
const UNRIPE_SHINE = '#cfe8a8';

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  kind: FruitKind,
  x: number,
  y: number,
  angle: number,
  scaleX: number,
  scaleY: number,
  alpha = 1,
  /** 0 = ripe colour, 1 = fully green. */
  unripe = 0,
): void {
  const look = FRUIT[kind];
  const r = look.radius;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);
  const body = unripe > 0 ? mix(look.color, UNRIPE, unripe) : look.color;
  const shine = unripe > 0 ? mix(look.shine, UNRIPE_SHINE, unripe) : look.shine;
  if (kind === 'cherry') drawCherries(ctx, r, body, shine, alpha);
  else if (kind === 'acorn') drawAcorn(ctx, r, body, shine, alpha, unripe);
  else drawRound(ctx, kind, r, body, shine, alpha);
  ctx.restore();
}

/** An apple, pear or plum: a stem and a leaf on top of a round body. */
function drawRound(ctx: CanvasRenderingContext2D, kind: FruitKind, r: number, body: string, shine: string, alpha: number): void {
  ctx.strokeStyle = palette.stem;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.75);
  ctx.quadraticCurveTo(2, -r * 1.05, 5, -r * 1.2);
  ctx.stroke();

  ctx.fillStyle = palette.leaf;
  ctx.beginPath();
  ctx.ellipse(r * 0.32, -r * 1.05, r * 0.3, r * 0.14, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath();
  if (kind === 'pear') {
    ctx.ellipse(0, r * 0.15, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.ellipse(0, -r * 0.35, r * 0.6, r * 0.55, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.fillStyle = shine;
  ctx.globalAlpha = alpha * 0.7;
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.35, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

/** Two cherries hanging from stems joined at the top, with a leaf. */
function drawCherries(ctx: CanvasRenderingContext2D, r: number, body: string, shine: string, alpha: number): void {
  ctx.strokeStyle = palette.stem;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.2);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.6, r * 0.1, -r * 1.2);
  ctx.moveTo(r * 0.55, r * 0.35);
  ctx.quadraticCurveTo(r * 0.5, -r * 0.5, r * 0.1, -r * 1.2);
  ctx.stroke();
  ctx.fillStyle = palette.leaf;
  ctx.beginPath();
  ctx.ellipse(r * 0.45, -r * 1.15, r * 0.4, r * 0.18, -0.3, 0, Math.PI * 2);
  ctx.fill();
  for (const [dx, dy] of [
    [-r * 0.5, r * 0.4],
    [r * 0.55, r * 0.55],
  ]) {
    ctx.fillStyle = body;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(dx, dy, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shine;
    ctx.globalAlpha = alpha * 0.7;
    ctx.beginPath();
    ctx.ellipse(dx - r * 0.18, dy - r * 0.18, r * 0.12, r * 0.08, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** An acorn: a smooth nut under a bumpy cap with a little stalk. */
function drawAcorn(ctx: CanvasRenderingContext2D, r: number, body: string, shine: string, alpha: number, unripe: number): void {
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.2, r * 0.75, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shine;
  ctx.globalAlpha = alpha * 0.7;
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, r * 0.15, r * 0.14, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha;
  const cap = unripe > 0 ? mix('#8a6a48', UNRIPE, unripe * 0.6) : '#8a6a48';
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.42, r * 0.92, r * 0.5, 0, Math.PI, Math.PI * 2);
  ctx.roundRect(-r * 0.92, -r * 0.48, r * 1.84, r * 0.26, r * 0.12);
  ctx.fill();
  ctx.fillStyle = mix(cap, '#ffffff', 0.18);
  for (const dx of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.arc(dx * r, -r * 0.62, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = palette.stem;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.9);
  ctx.lineTo(r * 0.12, -r * 1.2);
  ctx.stroke();
}
