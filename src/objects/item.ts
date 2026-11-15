import * as audio from '../audio';
import { ANIMAL, drawAnimal, type AnimalKind } from './animals';
import { FRUIT, drawFruit, type FruitKind } from './fruit';

export type ItemKind = FruitKind | AnimalKind;

/** Seconds per bite while an animal eats. */
const BITE = 0.35;

export function isFruit(kind: ItemKind): kind is FruitKind {
  return kind in FRUIT;
}

/** Anything that can be picked up, moved and stacked. Stacks own position and motion. */
export class Item {
  /** Half the width. */
  readonly radius: number;
  /** Stacked items sit this far apart. */
  readonly height: number;
  /** Only regrowable things can go into a puddle or bin. Animals never can. */
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
  private awake = 0;

  constructor(readonly kind: ItemKind) {
    if (isFruit(kind)) {
      this.radius = FRUIT[kind].radius;
      this.height = this.radius * 1.8;
      this.disposable = this.food = true;
      this.animal = null;
    } else {
      this.radius = ANIMAL[kind].radius;
      this.height = ANIMAL[kind].height;
      this.disposable = this.food = false;
      this.animal = kind;
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
    return this.awake <= 0 && this.chew === 0 && !this.wantsFood;
  }

  /** Start eating a piece of food. */
  feed(): void {
    this.chew += BITE;
    this.mouth = 0;
  }

  update(dt: number): void {
    this.squash = Math.max(0, this.squash - dt * 1.5);
    if (!this.animal) return;
    if (this.wantsFood) this.wake();
    this.awake = Math.max(0, this.awake - dt);
    this.snore = Math.max(0, this.snore - dt);
    this.mouth += ((this.wantsFood ? 1 : 0) - this.mouth) * Math.min(1, dt * 12);
    if (this.chew > 0) {
      const before = Math.ceil(this.chew / BITE);
      this.chew = Math.max(0, this.chew - dt);
      if (Math.ceil(this.chew / BITE) < before) audio.munch();
      if (this.chew === 0) {
        this.happy = 1.5;
        this.squash = 0.2;
        audio.animal(this.animal);
      }
    }
    this.happy = Math.max(0, this.happy - dt);
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
    const s = Math.sin(performance.now() / 40) * this.squash;
    const sx = 1 + this.squash * 0.6 + s * 0.1;
    const sy = 1 - this.squash * 0.6;
    if (this.animal) drawAnimal(ctx, this.animal, x, y, angle, sx, sy, this);
    else drawFruit(ctx, this.kind as FruitKind, x, y, angle, sx, sy);
  }
}
