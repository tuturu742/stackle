import * as audio from '../audio';
import { ANIMAL, drawAnimal, type AnimalKind } from './animals';
import { FRUIT, drawFruit, type FruitKind } from './fruit';
import { GOODS, drawGood, isGood, type GoodFoodKind, type GoodKind, type ToyKind } from './goods';
import { HAT, drawHat, type HatKind } from './hat';
import { VEG, drawVeg, type VegKind } from './veg';
import { settings } from '../settings';

/** Food: fruit, vegetables, hay, treats, pies and eggs. */
export type FoodKind = FruitKind | VegKind | GoodFoodKind;
/** Everything that can go into a puddle or a bin: food, and hats. */
export type LooseKind = FoodKind | HatKind;
export type ItemKind = LooseKind | AnimalKind | ToyKind;

/** Seconds per bite while an animal eats. */
const BITE = 0.35;

export function isFruit(kind: ItemKind): kind is FruitKind {
  return kind in FRUIT;
}

export function isFood(kind: ItemKind): kind is FoodKind {
  return kind in FRUIT || kind in VEG || (isGood(kind) && GOODS[kind].food);
}

export function isVeg(kind: ItemKind): kind is VegKind {
  return kind in VEG;
}

export function isHat(kind: ItemKind): kind is HatKind {
  return kind in HAT;
}

/** Half-width and height of anything but an animal. */
export function sizeOf(kind: LooseKind | ToyKind): { radius: number; height: number } {
  if (isFruit(kind)) return { radius: FRUIT[kind].radius, height: FRUIT[kind].radius * 1.8 };
  if (isHat(kind)) return HAT[kind];
  if (isGood(kind)) return GOODS[kind];
  return VEG[kind];
}

export function drawLoose(
  ctx: CanvasRenderingContext2D,
  kind: LooseKind | ToyKind,
  x: number,
  y: number,
  angle: number,
  scaleX: number,
  scaleY: number,
  alpha = 1,
): void {
  if (isFruit(kind)) drawFruit(ctx, kind, x, y, angle, scaleX, scaleY, alpha);
  else if (isHat(kind)) drawHat(ctx, kind, x, y, angle, scaleX, scaleY, alpha);
  else if (isGood(kind)) drawGood(ctx, kind as GoodKind, x, y, angle, scaleX, scaleY, alpha);
  else drawVeg(ctx, kind, x, y, angle, scaleX, scaleY, alpha);
}

/** Anything that can be picked up, moved and stacked. Stacks own position and motion. */
export class Item {
  /** Half the width. */
  readonly radius: number;
  /** Stacked items sit this far apart. */
  readonly height: number;
  /** Only things that come back (food, hats) can go into a puddle or bin. Animals and toys never can. */
  readonly disposable: boolean;
  readonly food: boolean;
  readonly animal: AnimalKind | null;
  squash = 0;

  // Animals only.
  mouth = 0;
  wantsFood = false;
  chew = 0;
  happy = 0;
  asleep = false;
  snore = 0;
  /** 0 clean, 1 covered in mud; washed off by water or rain. */
  muddy = 0;
  /** Seconds of playing an instrument left. */
  playing = 0;
  /** True for the one step in which it finished eating. */
  justAte = false;
  private awake = 0;

  constructor(readonly kind: ItemKind) {
    if (!(kind in ANIMAL)) {
      const thing = kind as LooseKind | ToyKind;
      ({ radius: this.radius, height: this.height } = sizeOf(thing));
      this.food = isFood(thing);
      this.disposable = this.food || isHat(thing);
      this.animal = null;
    } else {
      this.radius = ANIMAL[kind as AnimalKind].radius;
      this.height = ANIMAL[kind as AnimalKind].height;
      this.disposable = this.food = false;
      this.animal = kind as AnimalKind;
    }
  }

  /** How far a touch can be from the centre and still grab it. */
  get reach(): number {
    return Math.max(this.radius, this.height / 2);
  }

  /** Mouth position relative to the item's centre. */
  get mouthY(): number {
    return this.animal ? ANIMAL[this.animal].mouthY : 0;
  }

  /** Picked up or offered food: stays awake a little while, even at night. */
  wake(): void {
    this.awake = 2.5;
    this.snore = 0;
  }

  /** Nothing is keeping it awake, so at night it can sleep. */
  get restful(): boolean {
    return this.awake <= 0 && this.chew === 0 && !this.wantsFood && this.playing === 0;
  }

  /** Start eating a piece of food. */
  feed(): void {
    this.chew += BITE;
    this.mouth = 0;
  }

  update(dt: number): void {
    this.squash = Math.max(0, this.squash - dt * 1.5);
    this.justAte = false;
    if (!this.animal) return;
    this.playing = Math.max(0, this.playing - dt);
    if (this.wantsFood) this.wake();
    this.awake = Math.max(0, this.awake - dt);
    this.snore = Math.max(0, this.snore - dt);
    this.mouth += ((this.wantsFood ? 1 : 0) - this.mouth) * Math.min(1, dt * 12);
    if (this.chew > 0) {
      const before = Math.ceil(this.chew / BITE);
      this.chew = Math.max(0, this.chew - dt);
      if (Math.ceil(this.chew / BITE) < before) audio.munch();
      if (this.chew === 0) {
        this.justAte = true;
        this.happy = 1.5;
        this.squash = 0.2;
        audio.animal(this.animal);
      }
    }
    this.happy = Math.max(0, this.happy - dt);
  }

  /** Brown splodges over the body, fading as it is washed. */
  private drawMud(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.75 * this.muddy;
    ctx.fillStyle = '#8a6a4f';
    const r = this.radius;
    const h = this.height;
    for (const [fx, fy, s] of [
      [-0.5, 0.25, 0.22],
      [0.45, 0.32, 0.18],
      [0.1, 0.4, 0.16],
      [-0.25, -0.25, 0.12],
      [0.35, -0.05, 0.14],
    ]) {
      ctx.beginPath();
      ctx.ellipse(fx * r, fy * h, s * r * 1.3, s * r, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
    const squash = settings.reduceMotion ? 0 : this.squash;
    const s = Math.sin(performance.now() / 40) * squash;
    const sx = 1 + squash * 0.6 + s * 0.1;
    const sy = 1 - squash * 0.6;
    if (this.animal) {
      // Playing music looks happy.
      const face = this.playing > 0 ? { ...this, happy: 1 } : this;
      drawAnimal(ctx, this.animal, x, y, angle, sx, sy, face);
      if (this.muddy > 0.02) this.drawMud(ctx, x, y, angle);
    }
    else drawLoose(ctx, this.kind as LooseKind | ToyKind, x, y, angle, sx, sy);
  }
}
