import * as audio from '../audio';
import { ANIMAL, drawAnimal, type AnimalKind } from './animals';
import { FRUIT, drawFruit, type FruitKind } from './fruit';
import { GOODS, drawCandleFlame, drawJackLight, drawGood, isCandle, isGood, isSnowball, isToy, type GoodFoodKind, type GoodKind, type ToyKind, type WinterThingKind } from './goods';
import { drawTop, newTop, startSpin, stopTop, updateTop, SPIN_SECONDS, type TopState } from './top';
import { HAT, drawHat, type HatKind } from './hat';
import { VEG, drawVeg, isFlower, type VegKind } from './veg';
import { settings } from '../settings';

/** Food: fruit, vegetables, hay, treats, pies and eggs. */
export type FoodKind = FruitKind | VegKind | GoodFoodKind;
/** Everything that can go into a puddle or a bin: food, hats, and the winter things that come back. */
export type LooseKind = FoodKind | HatKind | WinterThingKind;
export type ItemKind = LooseKind | AnimalKind | ToyKind;

/** Seconds per bite while an animal eats. */
const BITE = 0.35;

export function isFruit(kind: ItemKind): kind is FruitKind {
  return kind in FRUIT;
}

export function isFood(kind: ItemKind): kind is FoodKind {
  return kind in FRUIT || (kind in VEG && !isFlower(kind)) || (isGood(kind) && GOODS[kind].food);
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
/** Seconds of the happy dance after every third meal. */
const DANCE_SECONDS = 1.4;

export class Item {
  /** Half the width. */
  readonly radius: number;
  /** Stacked items sit this far apart. */
  readonly height: number;
  /** Only things that come back (food, hats, gifts, snowballs...) can go into a puddle or bin. Animals and toys never can. */
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
  /** The spinning top: how it spins and which side it lies on. */
  readonly top: TopState | null;
  /** A snowball in a snowman: the head gets a face, the middle buttons and twig arms. */
  snowman: 'head' | 'body' | null = null;
  /** A candle: lit or not (a tap switches it), and whether something stands on it, hiding its wick. */
  lit = true;
  covered = false;
  /** Meals eaten: every third one ends in a little dance. */
  private meals = 0;
  /** Seconds of dancing left. */
  dance = 0;
  private awake = 0;

  constructor(readonly kind: ItemKind) {
    if (!(kind in ANIMAL)) {
      const thing = kind as LooseKind | ToyKind;
      ({ radius: this.radius, height: this.height } = sizeOf(thing));
      this.food = isFood(thing);
      this.disposable = !isToy(thing);
      this.animal = null;
      this.top = thing === 'top' ? newTop() : null;
    } else {
      this.radius = ANIMAL[kind as AnimalKind].radius;
      this.height = ANIMAL[kind as AnimalKind].height;
      this.disposable = this.food = false;
      this.animal = kind as AnimalKind;
      this.top = null;
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
    return this.awake <= 0 && this.chew === 0 && !this.wantsFood && this.playing === 0 && this.dance === 0;
  }

  /** Start eating a piece of food. */
  feed(): void {
    this.chew += BITE;
    this.mouth = 0;
  }

  /** Dropped or thrown, the top lands spinning. */
  spin(): void {
    if (!this.top) return;
    startSpin(this.top);
    audio.spinTop(SPIN_SECONDS);
  }

  /** Picked up: the top stands upright and stops. */
  lift(): void {
    if (this.top) stopTop(this.top);
  }

  update(dt: number): void {
    this.squash = Math.max(0, this.squash - dt * 1.5);
    this.justAte = false;
    if (this.top && updateTop(this.top, dt)) {
      this.squash = 0.2;
      audio.topFace(this.top.side);
    }
    if (!this.animal) return;
    this.playing = Math.max(0, this.playing - dt);
    this.dance = Math.max(0, this.dance - dt);
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
        if (++this.meals % 3 === 0) {
          this.dance = DANCE_SECONDS;
          this.happy = DANCE_SECONDS + 0.5;
          audio.burpNote(0.1);
        } else audio.animal(this.animal);
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
      // A dance: a turn right round (the body narrows to its edge and back) with little hops.
      let turn = 1;
      let hop = 0;
      if (this.dance > 0 && !settings.reduceMotion) {
        const t = 1 - this.dance / DANCE_SECONDS;
        turn = Math.cos(t * Math.PI * 2);
        if (Math.abs(turn) < 0.15) turn = Math.sign(turn || 1) * 0.15;
        hop = Math.abs(Math.sin(t * Math.PI * 3)) * 12;
      }
      drawAnimal(ctx, this.animal, x, y - hop, angle, sx * turn, sy, face);
      if (this.muddy > 0.02) this.drawMud(ctx, x, y, angle);
    }
    else if (this.top) drawTop(ctx, this.top, x, y, angle, sx, sy, settings.reduceMotion);
    else {
      drawLoose(ctx, this.kind as LooseKind | ToyKind, x, y, angle, sx, sy);
      if (isCandle(this.kind) && !this.covered) drawCandleFlame(ctx, x, y, angle, sx, sy, this.lit, performance.now() / 1000);
      if (this.kind === 'jackolantern' && this.lit) drawJackLight(ctx, x, y, angle, sx, sy);
      if (this.snowman) drawSnowman(ctx, this.snowman, x, y, angle, this.radius);
    }
  }
}

/** A snowman's face on its head, or buttons and twig arms on its middle. */
function drawSnowman(ctx: CanvasRenderingContext2D, part: 'head' | 'body', x: number, y: number, angle: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const ink = '#4a3f45';
  ctx.fillStyle = ink;
  if (part === 'head') {
    for (const dx of [-0.32, 0.32]) {
      ctx.beginPath();
      ctx.arc(dx * r, -0.2 * r, Math.max(2.5, r * 0.09), 0, Math.PI * 2);
      ctx.fill();
    }
    // A carrot nose.
    ctx.fillStyle = '#f08a3c';
    ctx.beginPath();
    ctx.moveTo(-0.08 * r, 0.02 * r);
    ctx.lineTo(0.55 * r, 0.12 * r);
    ctx.lineTo(-0.06 * r, 0.2 * r);
    ctx.closePath();
    ctx.fill();
    // A smile of little coal dots.
    ctx.fillStyle = ink;
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.25 + i * 0.125);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, Math.max(1.6, r * 0.05), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (const dy of [-0.35, 0, 0.35]) {
      ctx.beginPath();
      ctx.arc(0, dy * r, Math.max(2.5, r * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
    // Twig arms, waving up.
    ctx.strokeStyle = '#7a5a46';
    ctx.lineWidth = Math.max(3, r * 0.08);
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.85, -0.1 * r);
      ctx.lineTo(side * r * 1.6, -0.6 * r);
      ctx.moveTo(side * r * 1.35, -0.43 * r);
      ctx.lineTo(side * r * 1.45, -0.75 * r);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Is this a snowball (they stack into snowmen)? */
export function snowballItem(item: Item): boolean {
  return isSnowball(item.kind);
}
