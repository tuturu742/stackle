import { GROUND_Y, SCREEN_W, WORLD_H, palette } from './config';
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

// The hub's cards: one full screen per level, showing a few of its highlights,
// drawn with the level's own objects. A level not made yet gets a card in its
// season's colours, so the row of seasons is already there.

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

/** Hills, ground and fence: the backdrop every card shares, in its season's colours. */
export function drawLand(ctx: CanvasRenderingContext2D, left: number, right: number, c: Colors, fence?: [string, string]): void {
  drawHills(ctx, left, right, c);
  ctx.fillStyle = c.ground;
  ctx.fillRect(left, GROUND_Y, right - left, WORLD_H - GROUND_Y + 10);
  ctx.fillStyle = c.groundDark;
  ctx.fillRect(left, GROUND_Y + 50, right - left, WORLD_H - GROUND_Y);
  if (fence) drawFence(ctx, left, right, fence[0], fence[1]);
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

/** A round tree in a season's colours, for the cards of levels still to come. */
function seasonTree(ctx: CanvasRenderingContext2D, x: number, canopy: string, light: string, dots?: string): void {
  ctx.fillStyle = '#a07a5c';
  ctx.beginPath();
  ctx.roundRect(x - 20, GROUND_Y - 230, 40, 240, 16);
  ctx.fill();
  const cy = GROUND_Y - 300;
  ctx.fillStyle = canopy;
  for (const [dx, dy, r] of [
    [0, -30, 105],
    [-85, 20, 80],
    [85, 20, 80],
    [-30, 55, 80],
    [40, 55, 80],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx, cy + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x - 35, cy - 55, 45, 0, Math.PI * 2);
  ctx.fill();
  if (!dots) return;
  ctx.fillStyle = dots;
  for (const [dx, dy] of [
    [-80, 0],
    [-20, -70],
    [50, -20],
    [90, 40],
    [-50, 60],
    [20, 50],
    [-110, 40],
    [70, -70],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx, cy + dy, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A gentle wiggle for a card whose level is still to come. */
class Wiggle {
  amount = 0;
  tap(): void {
    this.amount = 1;
  }
  update(dt: number): void {
    this.amount = Math.max(0, this.amount - dt * 1.5);
  }
  angle(time: number): number {
    return Math.sin(time * 16) * this.amount * 0.04;
  }
}

function around(ctx: CanvasRenderingContext2D, x: number, angle: number, draw: () => void): void {
  ctx.save();
  ctx.translate(x, GROUND_Y);
  ctx.rotate(angle);
  ctx.translate(-x, -GROUND_Y);
  draw();
  ctx.restore();
}

/** Spring, still to come: a tree in blossom, tulips, and the duck on a pond. */
export class SpringPreview implements Preview {
  readonly colors: Colors = {
    skyTop: '#cfe9f7',
    skyBottom: '#f3f8e8',
    hillFar: '#d3edbd',
    hillNear: '#bde5a6',
    ground: '#9ad67f',
    groundDark: '#86c46c',
  };
  private pond = new Puddle(640, 360);
  private duck = new Item('duck');
  private flowers = [120, 380, 860, 960].map((x, i) => new Decor('flowers', x, i + 1));
  private wiggle = new Wiggle();

  tap(): void {
    this.wiggle.tap();
    for (const f of this.flowers) f.tap();
  }

  update(dt: number): void {
    this.wiggle.update(dt);
    for (const f of this.flowers) f.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D, time: number, left: number, right: number): void {
    sun(ctx, right - 164, 130, 56, '#fff1b8');
    drawLand(ctx, left, right, this.colors, ['#e6c9a0', '#d8b88c']);
    around(ctx, 260, this.wiggle.angle(time), () => seasonTree(ctx, 260, '#f7c6d6', '#fbd9e4', '#f39ab6'));
    for (const f of this.flowers) f.draw(ctx, time);
    this.pond.draw(ctx, time);
    const bob = Math.sin(time * 2.2) * 2.5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, SCREEN_W, this.pond.depth);
    ctx.clip();
    this.duck.draw(ctx, 600, this.pond.depth - this.duck.height * 0.4 + bob, 0);
    ctx.restore();
  }
}

/** Autumn, still to come: an orange tree, piles of leaves, pumpkins and the wagon. */
export class AutumnPreview implements Preview {
  readonly colors: Colors = {
    skyTop: '#f6dcc0',
    skyBottom: '#fbeedd',
    hillFar: '#ecd2a8',
    hillNear: '#e1c08f',
    ground: '#cdb46e',
    groundDark: '#bca15d',
  };
  private wagon = new Vehicle('wagon', 800);
  private wiggle = new Wiggle();

  tap(): void {
    this.wiggle.tap();
  }

  update(dt: number): void {
    this.wiggle.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D, time: number, left: number, right: number): void {
    sun(ctx, right - 164, 130, 56, '#ffe0a8');
    drawLand(ctx, left, right, this.colors, ['#c99f74', '#b88d64']);
    around(ctx, 280, this.wiggle.angle(time), () => seasonTree(ctx, 280, '#ef8f4c', '#f5a865', '#e0673a'));
    // Leaf piles.
    for (const [x, w, color] of [
      [180, 90, '#e9814a'],
      [470, 120, '#f2a541'],
      [1000, 100, '#d9673f'],
    ] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, GROUND_Y + 28, w / 2, 26, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    // Pumpkins.
    for (const [x, r] of [
      [560, 34],
      [630, 26],
    ]) {
      const y = GROUND_Y + 50 - r;
      ctx.fillStyle = '#ef8a3c';
      for (const dx of [-0.45, 0.45, 0]) {
        ctx.beginPath();
        ctx.ellipse(x + dx * r, y, r * 0.62, r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#7fa35a';
      ctx.fillRect(x - 3, y - r * 0.85 - 10, 6, 12);
    }
    this.wagon.draw(ctx);
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
