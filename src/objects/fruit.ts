import Matter from 'matter-js';
import { palette } from '../config';

export type FruitKind = 'apple' | 'pear' | 'plum';

interface FruitLook {
  radius: number;
  color: string;
  shine: string;
}

export const FRUIT: Record<FruitKind, FruitLook> = {
  apple: { radius: 34, color: '#ec7a6c', shine: '#f7b2a8' },
  pear: { radius: 32, color: '#d9d76a', shine: '#eeedb0' },
  plum: { radius: 28, color: '#a07ac4', shine: '#c8b0e0' },
};

/** Anything that can be picked up and moved. */
export class Item {
  readonly body: Matter.Body;
  readonly radius: number;
  /** Only regrowable things can go into a puddle or bin. Characters never can. */
  readonly disposable = true;
  held = false;
  squash = 0;
  lastPlop = 0;

  constructor(
    readonly kind: FruitKind,
    x: number,
    y: number,
  ) {
    const r = FRUIT[kind].radius;
    this.radius = r;
    // A rounded box rather than a circle, so fruit sits still and stacks.
    this.body = Matter.Bodies.rectangle(x, y, r * 2, r * 1.8, {
      chamfer: { radius: r * 0.8 },
      friction: 0.9,
      frictionStatic: 1.2,
      frictionAir: 0.02,
      restitution: 0.15,
      density: 0.002,
      sleepThreshold: 40,
    });
  }

  update(dt: number): void {
    this.squash = Math.max(0, this.squash - dt * 1.5);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.body.position;
    const s = Math.sin(performance.now() / 40) * this.squash;
    drawFruit(ctx, this.kind, x, y, this.body.angle, 1 + this.squash * 0.6 + s * 0.1, 1 - this.squash * 0.6);
  }
}

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  kind: FruitKind,
  x: number,
  y: number,
  angle: number,
  scaleX: number,
  scaleY: number,
  alpha = 1,
): void {
  const look = FRUIT[kind];
  const r = look.radius;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);

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

  ctx.fillStyle = look.color;
  ctx.beginPath();
  if (kind === 'pear') {
    ctx.ellipse(0, r * 0.15, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.ellipse(0, -r * 0.35, r * 0.6, r * 0.55, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.fillStyle = look.shine;
  ctx.globalAlpha = alpha * 0.7;
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.35, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
