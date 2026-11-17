import { GROUND_Y, WORLD_H, palette } from './config';
import { drawFence, Decor } from './objects/decor';
import { IceColumns } from './objects/columns';
import { CANDLES, CANDLE_COLOR } from './objects/goods';
import { Rink } from './objects/rink';
import { Pine, drawSnowBank, drawTown } from './objects/town';
import { THEMES } from './theme';
import { CornField } from './objects/fields';
import { Item } from './objects/item';
import { Puddle } from './objects/puddle';
import { Scarecrow } from './objects/scarecrow';
import { Tree } from './objects/tree';
import { Vehicle } from './objects/vehicle';
import { LilyPads } from './objects/lilypads';
import { Nest } from './objects/nest';
import { Butterflies } from './objects/butterflies';
import { Rainbow } from './objects/rainbow';
import { Mushrooms } from './objects/mushrooms';
import { Campfire } from './objects/station';
import { drawFalling } from './objects/falling';
import { drawHedge, drawParkTown, drawPath, drawSpringGround } from './objects/meadow';
import { drawLeafLitter, drawUndergrowth, drawWoods } from './objects/woods';
import { settings } from './settings';

// The hub's cards: one full screen per level, showing a few of its highlights,
// drawn with the level's own objects.

/** A season's colours: sky (top, bottom), far and near hills, ground (top, lower). */
export interface Colors {
  skyTop: string;
  skyBottom: string;
  hillFar: string;
  hillNear: string;
  ground: string;
  groundDark: string;
}

export interface Preview {
  readonly colors: Colors;
  /** Draw the highlights in world units: one screen is 1024 wide, with the ground at GROUND_Y.
   * `left` and `right` are the edges of what is in view, past 0 and 1024 on wide screens. */
  draw(ctx: CanvasRenderingContext2D, time: number, left: number, right: number): void;
  /** A tap on the card; for a level not made yet, its scene gives a little wiggle. */
  tap?(): void;
  update?(dt: number): void;
}

/** Soft rolling hills along the back, fixed for each card. */
function drawHills(ctx: CanvasRenderingContext2D, left: number, right: number, c: Colors): void {
  for (const [base, height, freq, color] of [
    [GROUND_Y - 120, 90, 0.004, c.hillFar],
    [GROUND_Y - 60, 60, 0.007, c.hillNear],
  ] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, GROUND_Y + 1);
    for (let x = left; x <= right + 20; x += 20) {
      ctx.lineTo(x, base - height * (0.5 + 0.5 * Math.sin(x * freq + 1) * Math.cos(x * freq * 0.37)));
    }
    ctx.lineTo(right, GROUND_Y + 1);
    ctx.fill();
  }
}

/** Hills, ground and fence: the backdrop every card shares, in its season's colours. Spring
 * and autumn have their own: a blossom meadow and hedge, a wood and a stone wall. */
export function drawLand(ctx: CanvasRenderingContext2D, left: number, right: number, c: Colors, fence?: [string, string], land?: 'park' | 'woods'): void {
  if (land === 'park') drawParkTown(ctx, left, right, 0);
  else if (land === 'woods') drawWoods(ctx, left, right, 0);
  else drawHills(ctx, left, right, c);
  ctx.fillStyle = c.ground;
  ctx.fillRect(left, GROUND_Y, right - left, WORLD_H - GROUND_Y + 10);
  ctx.fillStyle = c.groundDark;
  ctx.fillRect(left, GROUND_Y + 50, right - left, WORLD_H - GROUND_Y);
  if (land === 'park') {
    drawSpringGround(ctx, left, right);
    drawPath(ctx, left, right);
    drawHedge(ctx, left, right);
  } else if (land === 'woods') {
    drawLeafLitter(ctx, left, right);
    drawUndergrowth(ctx, left, right);
  } else if (fence) drawFence(ctx, left, right, fence[0], fence[1]);
}

function sun(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Summer, the farm: the apple tree, a puddle, the scarecrow in the corn, and the tractor. */
export class SummerPreview implements Preview {
  readonly colors: Colors = {
    skyTop: palette.skyTop,
    skyBottom: palette.skyBottom,
    hillFar: palette.hillFar,
    hillNear: palette.hillNear,
    ground: palette.ground,
    groundDark: palette.groundDark,
  };
  private tree = new Tree(150, 'apple');
  private puddle = new Puddle(330, 220);
  private corn = new CornField(710, 400, 710);
  private scarecrow = new Scarecrow(710);
  private tractor = new Vehicle('tractor', 885);
  private hen = new Item('hen');
  private flowers = new Decor('flowers', 560, 2);

  draw(ctx: CanvasRenderingContext2D, time: number, left: number, right: number): void {
    sun(ctx, right - 164, 130, 60, palette.sun);
    drawLand(ctx, left, right, this.colors, ['#d9b48a', '#c99f74']);
    this.corn.draw(ctx);
    this.scarecrow.draw(ctx, time);
    for (const crow of this.scarecrow.crows) crow.draw(ctx);
    this.flowers.draw(ctx, time);
    this.tree.draw(ctx, time);
    this.puddle.draw(ctx, time);
    this.hen.draw(ctx, 245, GROUND_Y + 15 - this.hen.height / 2, 0);
    this.tractor.draw(ctx);
  }
}

/** Spring: a cherry tree in blossom, the frog on a lily pad, a chick in its nest, butterflies, a kite and a rainbow. */
export class SpringPreview implements Preview {
  readonly colors: Colors = THEMES.spring;
  private tree = new Tree(200, 'cherry', 'blossom');
  private pond = new Puddle(720, 300);
  private pads = new LilyPads(720, 300, this.pond.surfaceY);
  private frog = new Item('frog');
  private nest = new Nest(930);
  private chick = new Item('chick');
  private kite = new Item('kite');
  private butterflies = new Butterflies(420, 520);
  private rainbow = new Rainbow();

  update(dt: number): void {
    this.rainbow.show(560);
    this.rainbow.update(dt);
    this.pads.update(dt);
    this.butterflies.update(dt, [], 0);
  }

  draw(ctx: CanvasRenderingContext2D, time: number, left: number, right: number): void {
    sun(ctx, right - 164, 130, 56, '#fff1b8');
    drawLand(ctx, left, right, this.colors, undefined, 'park');
    this.rainbow.draw(ctx);
    this.tree.draw(ctx, time);
    this.pond.draw(ctx, time);
    this.pads.draw(ctx);
    this.frog.draw(ctx, this.pads.seatX(1), this.pads.seatTop(1) - this.frog.height / 2, 0);
    this.nest.draw(ctx);
    this.chick.draw(ctx, this.nest.seatX(), this.nest.seatTop() - this.chick.height / 2, 0);
    this.nest.drawFront(ctx);
    // The kite drifting high on the breeze.
    this.kite.draw(ctx, 420 + Math.sin(time * 0.7) * 40, 200 + Math.sin(time * 1.3) * 16, Math.sin(time * 0.9) * 0.2);
    this.butterflies.draw(ctx);
    drawFalling(ctx, left, time, 'petals', settings.reduceMotion);
  }
}

/** Autumn: the oak with the squirrel, a leaf pile, pumpkins and a jack-o'-lantern, toadstools and the campfire. */
export class AutumnPreview implements Preview {
  readonly colors: Colors = THEMES.autumn;
  private tree = new Tree(210, 'acorn', 'autumn');
  private squirrel = new Item('squirrel');
  private pile = new Decor('leafpile', 420, 1);
  private pumpkin = new Item('pumpkin');
  private lantern = new Item('jackolantern');
  private mushrooms = new Mushrooms(740, 2);
  private fire = new Campfire(910);

  update(dt: number): void {
    this.pile.update(dt);
    this.mushrooms.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D, time: number, left: number, right: number): void {
    sun(ctx, right - 164, 130, 56, '#ffe0a8');
    drawLand(ctx, left, right, this.colors, undefined, 'woods');
    this.tree.draw(ctx, time);
    this.pile.draw(ctx, time);
    this.squirrel.draw(ctx, 330, GROUND_Y + 50 - this.squirrel.height / 2, 0);
    this.mushrooms.draw(ctx);
    this.fire.draw(ctx, time);
    this.pumpkin.draw(ctx, 620, GROUND_Y + 64 - this.pumpkin.height / 2, 0);
    this.lantern.draw(ctx, 820, GROUND_Y + 80 - this.lantern.height / 2, 0);
    drawFalling(ctx, left, time, 'leaves', settings.reduceMotion);
  }
}

/** Winter, the snowy town: the sleigh with a gift, coloured ice columns with candles, a snowman, and the rink. */
export class WinterPreview implements Preview {
  readonly colors: Colors = THEMES.winter;
  private sleigh = new Vehicle('sleigh', 170);
  private columns = new IceColumns(470);
  private rink = new Rink(905, 230);
  private penguin = new Item('penguin');
  private snowman = (['snowball3', 'snowball2', 'snowball1', 'tophat'] as const).map((k) => new Item(k));
  private candles = CANDLES.map((k) => new Item(k));
  private pines = [new Pine(30, 2), new Pine(1000, 4)];
  private time = 0;

  constructor() {
    CANDLES.forEach((kind, i) => this.columns.tint(i, CANDLE_COLOR[kind]));
    this.columns.update(10);
    this.snowman[1].snowman = 'body';
    this.snowman[2].snowman = 'head';
  }

  update(dt: number): void {
    this.time += dt;
    // The penguin glides to and fro on the ice, scratching it.
    const x = this.penguinX(this.time);
    const was = this.penguinX(this.time - dt);
    this.rink.scratch(was, x, this.rink.cy + 10);
    this.rink.update(dt);
  }

  private penguinX(t: number): number {
    return this.rink.x + Math.sin(t * 0.8) * 70;
  }

  draw(ctx: CanvasRenderingContext2D, time: number, left: number, right: number): void {
    sun(ctx, right - 164, 130, 56, '#fff6dc');
    drawTown(ctx, left, right, 0);
    ctx.fillStyle = this.colors.ground;
    ctx.fillRect(left, GROUND_Y, right - left, WORLD_H - GROUND_Y + 10);
    ctx.fillStyle = this.colors.groundDark;
    ctx.fillRect(left, GROUND_Y + 50, right - left, WORLD_H - GROUND_Y);
    drawSnowBank(ctx, left, right);
    for (const pine of this.pines) pine.draw(ctx);
    this.columns.draw(ctx);
    this.candles.forEach((candle, i) => candle.draw(ctx, this.columns.seatX(i), this.columns.seatTop(i) - candle.height / 2, 0));
    this.rink.draw(ctx);
    this.sleigh.draw(ctx);
    let y = GROUND_Y + 60;
    for (const ball of this.snowman) {
      ball.draw(ctx, 745, y - ball.height / 2, 0);
      y -= ball.height;
    }
    const lean = Math.cos(this.time * 0.8) * 0.12;
    this.penguin.draw(ctx, this.penguinX(this.time), this.rink.cy + 10 - this.penguin.height / 2, lean);
    // Snow falling softly.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 40; i++) {
      const x = left + ((i * 197.3 + Math.sin(time * 0.6 + i) * 30) % (right - left + 40));
      const y = ((i * 89.7 + time * (30 + (i % 5) * 8)) % (WORLD_H + 40)) - 20;
      ctx.beginPath();
      ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
