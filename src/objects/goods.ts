// Things that are neither fruit, vegetables, hats nor animals.
// The farm: hay from the barn, treats from the picnic basket, pies, popcorn and
// tortillas from the grill, eggs from the coop, flour from the windmill (all food).
// The winter town: sweets, fast food, cocoa and gingerbread from the stalls (food);
// gifts and parcels to open, ice cubes to build with, candles that colour ice
// columns, snowballs to make snowmen of, and tree ornaments (things that come back).
// Spring and autumn: honey from the hive, apple juice from the press, marshmallows
// to toast, ice creams from the park's cart (food); jack-o'-lanterns carved from pumpkins, painted
// eggs hidden round the park for an egg hunt, and firewood and the kindling chopped from it (they come back).
// Toys are kept forever: the model ship, instruments, the spinning top and the kite.

import { TOP, drawTop, newTop } from './top';
import { drawVeg } from './veg';

export type TreatKind = 'cake' | 'corndog' | 'sandwich' | 'cookie';
export type SweetKind = 'candycane' | 'lollipop' | 'donut' | 'cupcake';
export type FastFoodKind = 'hotdog' | 'taco' | 'pretzel' | 'fries';
export type WarmKind = 'cocoa' | 'coffee' | 'tea' | 'gingerbread' | 'bun';
export type IceCreamKind = 'icecreamPink' | 'icecreamChoc' | 'icecreamMint';
/** Spring and autumn food: honey, apple juice, a marshmallow and the same one toasted, ice creams. */
export type SeasonFoodKind = 'honey' | 'juice' | 'marshmallow' | 'toasted' | IceCreamKind;
export type GoodFoodKind =
  | 'hay'
  | 'pie'
  | 'egg'
  | 'popcorn'
  | 'flour'
  | 'tortilla'
  | TreatKind
  | SweetKind
  | FastFoodKind
  | WarmKind
  | SeasonFoodKind;
export type GiftKind = 'gift' | 'giftSmall' | 'giftTall' | 'giftBig';
export type IceKind = 'icecube' | 'icewindow' | 'icetop';
export type CandleKind = 'candleRed' | 'candleYellow' | 'candleGreen' | 'candleBlue' | 'candlePink';
export type SnowballKind = 'snowball1' | 'snowball2' | 'snowball3' | 'snowball4';
export type OrnamentKind = 'bauble' | 'baubleRed' | 'baubleBlue' | 'baubleGold' | 'baublePurple' | 'bell' | 'star';
export type PaintedEggKind = 'eggStripes' | 'eggDots' | 'eggZigzag' | 'eggHearts' | 'eggStars' | 'eggFlowers';
/** Things that are not food but come back, like hats (winter's, the jack-o'-lantern, painted eggs, firewood): they can go into a bin. */
export type WinterThingKind =
  | GiftKind
  | 'parcel'
  | IceKind
  | CandleKind
  | SnowballKind
  | OrnamentKind
  | 'jackolantern'
  | PaintedEggKind
  | 'firewood'
  | 'kindling';
export type InstrumentKind = 'drum' | 'guitar' | 'trumpet';
export type ToyKind = 'ship' | 'top' | 'kite' | InstrumentKind;
export type GoodKind = GoodFoodKind | WinterThingKind | ToyKind;

export const TREATS: TreatKind[] = ['cake', 'corndog', 'sandwich', 'cookie'];
export const SWEETS: SweetKind[] = ['candycane', 'lollipop', 'donut', 'cupcake'];
export const FASTFOOD: FastFoodKind[] = ['hotdog', 'taco', 'pretzel', 'fries'];
/** The cocoa hut's warm things; the donut is a sweet too. */
export const WARM: (WarmKind | 'donut')[] = ['cocoa', 'coffee', 'tea', 'gingerbread', 'bun', 'donut'];
export const GIFTS: GiftKind[] = ['gift', 'giftSmall', 'giftTall', 'giftBig'];
/** Ice to build with: plain blocks, blocks with a window, pointed turret tops. */
export const ICE_BLOCKS: IceKind[] = ['icecube', 'icewindow', 'icetop'];
export const ORNAMENTS: OrnamentKind[] = ['bauble', 'baubleRed', 'baubleBlue', 'baubleGold', 'baublePurple', 'bell', 'star'];
export const CANDLES: CandleKind[] = ['candleRed', 'candleYellow', 'candleGreen', 'candleBlue', 'candlePink'];
/** Smallest to biggest. */
export const SNOWBALLS: SnowballKind[] = ['snowball1', 'snowball2', 'snowball3', 'snowball4'];
export const ICECREAMS: IceCreamKind[] = ['icecreamPink', 'icecreamChoc', 'icecreamMint'];
/** The egg hunt's painted eggs, each its own colour and pattern. */
export const PAINTED_EGGS: readonly PaintedEggKind[] = ['eggStripes', 'eggDots', 'eggZigzag', 'eggHearts', 'eggStars', 'eggFlowers'];
export const INSTRUMENTS: InstrumentKind[] = ['drum', 'guitar', 'trumpet'];

/** Each candle's wax colour; an ice column a candle is put on takes it. */
export const CANDLE_COLOR: Record<CandleKind, string> = {
  candleRed: '#e8665c',
  candleYellow: '#f2c14e',
  candleGreen: '#7fbf6a',
  candleBlue: '#6b9fe0',
  candlePink: '#ef8fb4',
};
const SNOWBALL_R: Record<SnowballKind, number> = { snowball1: 22, snowball2: 30, snowball3: 38, snowball4: 46 };

interface GoodLook {
  radius: number;
  height: number;
  food: boolean;
}

export const GOODS: Record<GoodKind, GoodLook> = {
  hay: { radius: 34, height: 36, food: true },
  pie: { radius: 36, height: 26, food: true },
  egg: { radius: 16, height: 40, food: true },
  popcorn: { radius: 28, height: 44, food: true },
  flour: { radius: 26, height: 46, food: true },
  tortilla: { radius: 36, height: 14, food: true },
  cake: { radius: 30, height: 40, food: true },
  corndog: { radius: 14, height: 66, food: true },
  sandwich: { radius: 32, height: 30, food: true },
  cookie: { radius: 22, height: 16, food: true },
  candycane: { radius: 16, height: 58, food: true },
  lollipop: { radius: 22, height: 60, food: true },
  donut: { radius: 30, height: 22, food: true },
  cupcake: { radius: 24, height: 44, food: true },
  hotdog: { radius: 38, height: 22, food: true },
  taco: { radius: 32, height: 30, food: true },
  pretzel: { radius: 30, height: 34, food: true },
  fries: { radius: 22, height: 48, food: true },
  cocoa: { radius: 28, height: 42, food: true },
  coffee: { radius: 30, height: 34, food: true },
  tea: { radius: 30, height: 32, food: true },
  gingerbread: { radius: 26, height: 52, food: true },
  bun: { radius: 28, height: 24, food: true },
  honey: { radius: 26, height: 44, food: true },
  juice: { radius: 16, height: 58, food: true },
  icecreamPink: { radius: 20, height: 56, food: true },
  icecreamChoc: { radius: 20, height: 56, food: true },
  icecreamMint: { radius: 20, height: 56, food: true },
  marshmallow: { radius: 16, height: 52, food: true },
  toasted: { radius: 16, height: 52, food: true },
  jackolantern: { radius: 44, height: 66, food: false },
  eggStripes: { radius: 18, height: 44, food: false },
  eggDots: { radius: 18, height: 44, food: false },
  eggZigzag: { radius: 18, height: 44, food: false },
  eggHearts: { radius: 18, height: 44, food: false },
  eggStars: { radius: 18, height: 44, food: false },
  eggFlowers: { radius: 18, height: 44, food: false },
  firewood: { radius: 30, height: 30, food: false },
  kindling: { radius: 26, height: 26, food: false },
  gift: { radius: 32, height: 50, food: false },
  giftSmall: { radius: 24, height: 36, food: false },
  giftTall: { radius: 26, height: 66, food: false },
  giftBig: { radius: 46, height: 58, food: false },
  parcel: { radius: 34, height: 40, food: false },
  icecube: { radius: 40, height: 70, food: false },
  icewindow: { radius: 40, height: 70, food: false },
  icetop: { radius: 40, height: 62, food: false },
  candleRed: { radius: 16, height: 40, food: false },
  candleYellow: { radius: 16, height: 40, food: false },
  candleGreen: { radius: 16, height: 40, food: false },
  candleBlue: { radius: 16, height: 40, food: false },
  candlePink: { radius: 16, height: 40, food: false },
  snowball1: { radius: 22, height: 42, food: false },
  snowball2: { radius: 30, height: 57, food: false },
  snowball3: { radius: 38, height: 72, food: false },
  snowball4: { radius: 46, height: 87, food: false },
  bauble: { radius: 24, height: 50, food: false },
  baubleRed: { radius: 24, height: 50, food: false },
  baubleBlue: { radius: 24, height: 50, food: false },
  baubleGold: { radius: 24, height: 50, food: false },
  baublePurple: { radius: 24, height: 50, food: false },
  bell: { radius: 24, height: 50, food: false },
  star: { radius: 28, height: 52, food: false },
  ship: { radius: 48, height: 56, food: false },
  top: { radius: TOP.radius, height: TOP.height, food: false },
  kite: { radius: 34, height: 70, food: false },
  drum: { radius: 30, height: 36, food: false },
  guitar: { radius: 22, height: 70, food: false },
  trumpet: { radius: 34, height: 26, food: false },
};

export function isGood(kind: string): kind is GoodKind {
  return kind in GOODS;
}

/** A hen's egg or a painted one: anything the nest can hatch. */
export function isEgg(kind: string): boolean {
  return kind === 'egg' || (PAINTED_EGGS as readonly string[]).includes(kind);
}

export function isCandle(kind: string): kind is CandleKind {
  return kind in CANDLE_COLOR;
}

/** Anything an animal opens: the gifts, and parcels. */
export function isGift(kind: string): boolean {
  return kind === 'parcel' || (GIFTS as string[]).includes(kind);
}

export function isSnowball(kind: string): kind is SnowballKind {
  return kind in SNOWBALL_R;
}

/** Toys are kept forever, like animals. */
export function isToy(kind: string): kind is ToyKind {
  return kind === 'ship' || kind === 'top' || kind === 'kite' || isInstrument(kind);
}

export function isInstrument(kind: string): kind is InstrumentKind {
  return (INSTRUMENTS as string[]).includes(kind);
}

export function drawGood(
  ctx: CanvasRenderingContext2D,
  kind: GoodKind,
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

function fill(ctx: CanvasRenderingContext2D, color: string, shape: () => void): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  shape();
  ctx.fill();
}

function lines(ctx: CanvasRenderingContext2D, color: string, width: number, segments: number[][]): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of segments) {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  }
  ctx.stroke();
}

/** The candle item is just its wax, so candles stack flush; the wick and flame stand above it. */
const CANDLE_SHIFT = -7.5;

/** A pillar candle's wax in its colour; the wick and flame above it are drawn by drawCandleFlame. */
function candle(ctx: CanvasRenderingContext2D, wax: string): void {
  ctx.translate(0, CANDLE_SHIFT);
  fill(ctx, wax, () => ctx.roundRect(-14, -12, 28, 39, [6, 6, 5, 5]));
  fill(ctx, 'rgba(255, 255, 255, 0.28)', () => ctx.roundRect(-9, -9, 6, 30, 3));
  // A drip of wax over the rim.
  fill(ctx, wax, () => ctx.roundRect(4, -13, 7, 14, 3.5));
}

/** Where a candle's flame has its middle, above the item's centre. */
export const CANDLE_FLAME_DY = -20 + CANDLE_SHIFT;

/**
 * A candle's wick, and its flame when lit, with the same centre and transform as
 * drawGood. The flame sways and breathes a little; it never flickers on and off.
 */
export function drawCandleFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  scaleX: number,
  scaleY: number,
  lit: boolean,
  time: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);
  ctx.translate(0, CANDLE_SHIFT);
  lines(ctx, '#5e4a42', 2.5, [[0, -12, 0, -17]]);
  if (lit) {
    const sway = Math.sin(time * 3.1) * 1.2 + Math.sin(time * 7.3) * 0.5;
    const tall = 1 + Math.sin(time * 4.7) * 0.06;
    const tip = -15 - 12 * tall;
    fill(ctx, '#f6b44c', () => {
      ctx.moveTo(sway, tip);
      ctx.quadraticCurveTo(7, -18, 0, -15);
      ctx.quadraticCurveTo(-7, -18, sway, tip);
    });
    fill(ctx, '#fff1b8', () => ctx.ellipse(sway * 0.3, -18.5, 2.5, 4 * tall, 0, 0, Math.PI * 2));
  }
  ctx.restore();
}

/** A puffy marshmallow on a short stick: white, or toasted golden-brown with a melty drip. */
function marshmallow(ctx: CanvasRenderingContext2D, body: string, shade: string, melty: boolean): void {
  lines(ctx, '#b5814f', 4, [[0, 2, 0, 26]]);
  fill(ctx, shade, () => ctx.roundRect(-15, -24, 30, 28, 11));
  fill(ctx, body, () => ctx.roundRect(-15, -26, 30, 26, 11));
  fill(ctx, 'rgba(255, 255, 255, 0.45)', () => ctx.ellipse(-6, -18, 4, 5, -0.4, 0, Math.PI * 2));
  if (melty) fill(ctx, shade, () => ctx.roundRect(6, -4, 6, 10, 3));
}

/** The little loop and cap a decoration hangs by. */
/** The egg outline, 18 wide each side and 22 up and down from the middle. */
function eggPath(ctx: CanvasRenderingContext2D): void {
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(16, -22, 18, 7, 18, 9);
  ctx.bezierCurveTo(18, 20, 9, 22, 0, 22);
  ctx.bezierCurveTo(-9, 22, -18, 20, -18, 9);
  ctx.bezierCurveTo(-18, 7, -16, -22, 0, -22);
}

/** A painted egg: a pastel base, its pattern clipped to the shell, and a soft shine. */
function paintedEgg(ctx: CanvasRenderingContext2D, base: string, paint: string, pattern: (ctx: CanvasRenderingContext2D) => void): void {
  fill(ctx, base, () => eggPath(ctx));
  ctx.save();
  ctx.beginPath();
  eggPath(ctx);
  ctx.clip();
  ctx.fillStyle = paint;
  ctx.strokeStyle = paint;
  pattern(ctx);
  ctx.restore();
  fill(ctx, 'rgba(255, 255, 255, 0.55)', () => ctx.ellipse(-7, -9, 3.5, 6, -0.35, 0, Math.PI * 2));
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.1, x - s * 0.6, y - s * 1.3, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.6, y - s * 1.3, x + s * 1.6, y - s * 0.1, x, y + s);
  ctx.fill();
}

function star5(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
}

function hook(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#c9a24e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -20, 4, Math.PI, Math.PI * 3);
  ctx.stroke();
  fill(ctx, '#d9b45a', () => ctx.roundRect(-7, -18, 14, 9, 2));
}

/** A round glass decoration in its colour, with a band, stripes, a snowflake or dots, and a shine. */
function bauble(ctx: CanvasRenderingContext2D, color: string, design: 'band' | 'plain' | 'stripes' | 'flake' | 'dots'): void {
  hook(ctx);
  fill(ctx, color, () => ctx.arc(0, 4, 21, 0, Math.PI * 2));
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 4, 21, 0, Math.PI * 2);
  ctx.clip();
  if (design === 'band') fill(ctx, '#f2c14e', () => ctx.rect(-21, 1, 42, 5));
  if (design === 'stripes') {
    ctx.strokeStyle = '#f7f3ea';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const y of [-6, 4, 14]) {
      ctx.moveTo(-22, y + 3);
      for (let x = -22; x <= 22; x += 8) ctx.lineTo(x + 4, y + (((x + 22) / 8) % 2 ? 3 : -3));
    }
    ctx.stroke();
  }
  if (design === 'flake') {
    lines(ctx, '#fff6dc', 2.5, [
      [0, -8, 0, 16],
      [-10, -2, 10, 10],
      [-10, 10, 10, -2],
    ]);
  }
  if (design === 'dots') {
    for (const [x, y] of [
      [-10, -6],
      [6, -9],
      [12, 6],
      [-4, 8],
      [-14, 14],
      [6, 20],
    ]) {
      fill(ctx, '#f6d7f0', () => ctx.arc(x, y, 3, 0, Math.PI * 2));
    }
  }
  ctx.restore();
  fill(ctx, 'rgba(255, 255, 255, 0.5)', () => ctx.ellipse(-8, -5, 5, 7, -0.6, 0, Math.PI * 2));
}

/** The jack-o'-lantern's carved face: two round eyes and a smile. */
function jackFace(ctx: CanvasRenderingContext2D): () => void {
  return () => {
    ctx.ellipse(-12, -3, 6, 7, 0, 0, Math.PI * 2);
    ctx.moveTo(18, -3);
    ctx.ellipse(12, -3, 6, 7, 0, 0, Math.PI * 2);
    ctx.moveTo(-17, 11);
    ctx.quadraticCurveTo(0, 28, 17, 11);
    ctx.quadraticCurveTo(0, 18, -17, 11);
  };
}

/** The candle's glow inside a lit jack-o'-lantern's face, with the same centre and transform as drawGood. */
export function drawJackLight(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scaleX: number, scaleY: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);
  ctx.translate(0, 1.5);
  ctx.scale(0.8, 0.8);
  fill(ctx, '#ffd36b', jackFace(ctx));
  ctx.restore();
}

/** A wrapped present: box, lid, ribbon both ways and a bow, in its own size and colours. */
function present(ctx: CanvasRenderingContext2D, w: number, h: number, box: string, lid: string, ribbon: string, knot: string): void {
  const top = -h / 2 + 10;
  const lidH = Math.max(8, h * 0.18);
  const bottom = h / 2;
  fill(ctx, box, () => ctx.roundRect(-w / 2, top + lidH * 0.6, w, bottom - top - lidH * 0.6, 5));
  fill(ctx, lid, () => ctx.roundRect(-w / 2 - 2, top, w + 4, lidH, 4));
  const band = Math.max(7, w * 0.16);
  fill(ctx, ribbon, () => {
    ctx.rect(-band / 2, top, band, bottom - top);
    ctx.rect(-w / 2, top + lidH + (bottom - top - lidH) * 0.4, w, band * 0.8);
  });
  const bow = Math.max(7, w * 0.17);
  fill(ctx, ribbon, () => {
    ctx.ellipse(-bow * 0.9, top - bow * 0.4, bow, bow * 0.6, -0.5, 0, Math.PI * 2);
    ctx.moveTo(bow * 1.9, top - bow * 0.4);
    ctx.ellipse(bow * 0.9, top - bow * 0.4, bow, bow * 0.6, 0.5, 0, Math.PI * 2);
  });
  fill(ctx, knot, () => ctx.arc(0, top - bow * 0.2, bow * 0.45, 0, Math.PI * 2));
}

/** A block of ice for building: a lighter face, a darker edge, and shine. */
function iceBlock(ctx: CanvasRenderingContext2D): void {
  fill(ctx, '#a9d6ee', () => ctx.roundRect(-40, -35, 80, 70, 8));
  fill(ctx, '#c4e6f6', () => ctx.roundRect(-35, -35, 75, 62, 7));
}

/** A plain ball of snow, shaded underneath. */
function snowball(ctx: CanvasRenderingContext2D, r: number): void {
  const h = r * 1.9;
  // Squashed a touch so it rests on its flat-ish bottom.
  ctx.save();
  ctx.scale(1, h / (2 * r));
  fill(ctx, '#d6e3f0', () => ctx.arc(0, 0, r, 0, Math.PI * 2));
  fill(ctx, '#eaf1f8', () => ctx.arc(0, -r * 0.05, r * 0.95, 0, Math.PI * 2));
  fill(ctx, '#ffffff', () => ctx.arc(0, -r * 0.12, r * 0.86, 0, Math.PI * 2));
  fill(ctx, 'rgba(255, 255, 255, 0.9)', () => ctx.ellipse(-r * 0.35, -r * 0.42, r * 0.18, r * 0.11, -0.6, 0, Math.PI * 2));
  ctx.restore();
}

/** A waffle cone with two scoops, a paler highlight on each, and a little topping on top. */
function iceCream(ctx: CanvasRenderingContext2D, scoop: string, light: string, topping: string): void {
  fill(ctx, '#e5b673', () => {
    ctx.moveTo(-15, -2);
    ctx.lineTo(15, -2);
    ctx.quadraticCurveTo(3, 24, 0, 28);
    ctx.quadraticCurveTo(-3, 24, -15, -2);
    ctx.closePath();
  });
  lines(ctx, '#c99a5a', 1.5, [
    [-9, 0, 2, 20],
    [1, -1, 6, 10],
    [9, 0, -2, 20],
    [-1, -1, -6, 10],
  ]);
  fill(ctx, scoop, () => ctx.arc(0, -6, 17, 0, Math.PI * 2));
  fill(ctx, scoop, () => ctx.arc(0, -16, 13, 0, Math.PI * 2));
  fill(ctx, light, () => ctx.ellipse(-6, -20, 4, 5, -0.5, 0, Math.PI * 2));
  fill(ctx, light, () => ctx.ellipse(-8, -8, 4, 5, -0.5, 0, Math.PI * 2));
  fill(ctx, topping, () => ctx.arc(1, -28, 4, 0, Math.PI * 2));
}

const DRAW: Record<GoodKind, (ctx: CanvasRenderingContext2D) => void> = {
  candycane(ctx) {
    ctx.lineCap = 'round';
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(4, 27);
      ctx.lineTo(4, -14);
      ctx.arc(-4, -14, 8, 0, Math.PI, true);
      ctx.lineTo(-12, -6);
    };
    ctx.strokeStyle = '#fbf6ec';
    ctx.lineWidth = 9;
    path();
    ctx.stroke();
    ctx.strokeStyle = '#e8665c';
    ctx.setLineDash([6, 6]);
    path();
    ctx.stroke();
    ctx.setLineDash([]);
  },
  lollipop(ctx) {
    fill(ctx, '#f6efe0', () => ctx.roundRect(-2.5, 0, 5, 30, 2.5));
    fill(ctx, '#ef8fb4', () => ctx.arc(0, -10, 20, 0, Math.PI * 2));
    ctx.strokeStyle = '#fbe3ee';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) {
      const rr = 2 + a * 1.05;
      const px = Math.cos(a) * rr;
      const py = -10 + Math.sin(a) * rr;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  },
  donut(ctx) {
    fill(ctx, '#e3a96a', () => ctx.ellipse(0, 2, 30, 9, 0, 0, Math.PI * 2));
    fill(ctx, '#e3a96a', () => ctx.roundRect(-30, -4, 60, 8, 4));
    fill(ctx, '#f3a3c4', () => ctx.ellipse(0, -4, 27, 7, 0, 0, Math.PI * 2));
    fill(ctx, '#c98a54', () => ctx.ellipse(0, -4, 8, 2.5, 0, 0, Math.PI * 2));
    for (const [dx, dy, c] of [
      [-16, -5, '#fbe39a'],
      [-6, -8, '#81c7e8'],
      [12, -7, '#ffffff'],
      [18, -3, '#7fbf6a'],
      [-12, -1, '#81c7e8'],
    ] as const)
      fill(ctx, c, () => ctx.roundRect(dx - 2.5, dy - 1, 5, 2, 1));
  },
  cupcake(ctx) {
    fill(ctx, '#7fb3d5', () => {
      ctx.moveTo(-18, 0);
      ctx.lineTo(18, 0);
      ctx.lineTo(13, 22);
      ctx.lineTo(-13, 22);
      ctx.closePath();
    });
    lines(ctx, '#6a9fc4', 2, [
      [-8, 2, -6, 20],
      [0, 2, 0, 20],
      [8, 2, 6, 20],
    ]);
    fill(ctx, '#fbe3ee', () => {
      ctx.ellipse(0, -2, 22, 8, 0, 0, Math.PI * 2);
      ctx.moveTo(15, -8);
      ctx.ellipse(0, -9, 15, 7, 0, 0, Math.PI * 2);
      ctx.moveTo(8, -15);
      ctx.ellipse(0, -15, 8, 5, 0, 0, Math.PI * 2);
    });
    fill(ctx, '#e8645f', () => ctx.arc(0, -19, 4.5, 0, Math.PI * 2));
  },
  hotdog(ctx) {
    fill(ctx, '#e8c088', () => ctx.roundRect(-34, -9, 68, 20, 9));
    fill(ctx, '#d6784e', () => ctx.roundRect(-38, -9, 76, 11, 5.5));
    fill(ctx, '#f0cf8f', () => ctx.roundRect(-32, -1, 64, 12, 6));
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-26, -5);
    for (let x = -26; x <= 26; x += 4) ctx.lineTo(x, -5 + (x % 8 === 0 ? -2 : 2));
    ctx.stroke();
  },
  taco(ctx) {
    fill(ctx, '#86c26a', () => ctx.ellipse(0, -2, 28, 9, 0, Math.PI, Math.PI * 2));
    for (const [dx, c] of [
      [-12, '#e8665c'],
      [4, '#fbe39a'],
      [14, '#e8665c'],
    ] as const)
      fill(ctx, c, () => ctx.arc(dx, -4, 5, 0, Math.PI * 2));
    fill(ctx, '#f0c96e', () => {
      ctx.moveTo(-32, -4);
      ctx.quadraticCurveTo(0, 0, 32, -4);
      ctx.quadraticCurveTo(30, 15, 0, 15);
      ctx.quadraticCurveTo(-30, 15, -32, -4);
    });
    fill(ctx, '#e3b45a', () => ctx.ellipse(0, 9, 20, 3, 0, 0, Math.PI * 2));
  },
  pretzel(ctx) {
    ctx.strokeStyle = '#b8743f';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 13);
    ctx.bezierCurveTo(-30, 0, -30, -16, -14, -16);
    ctx.bezierCurveTo(-2, -16, 4, 2, 12, 13);
    ctx.moveTo(6, 13);
    ctx.bezierCurveTo(30, 0, 30, -16, 14, -16);
    ctx.bezierCurveTo(2, -16, -4, 2, -12, 13);
    ctx.stroke();
    for (const [dx, dy] of [
      [-18, -6],
      [16, -10],
      [-10, -14],
      [22, 0],
      [0, 6],
    ])
      fill(ctx, '#fbf6ec', () => ctx.roundRect(dx - 1.5, dy - 1.5, 3, 3, 1));
  },
  fries(ctx) {
    for (const [dx, top, tilt] of [
      [-12, -24, -0.12],
      [-5, -20, 0.05],
      [2, -24, -0.04],
      [9, -21, 0.1],
      [14, -18, 0.18],
    ]) {
      ctx.save();
      ctx.translate(dx, 0);
      ctx.rotate(tilt);
      fill(ctx, '#f6cf5c', () => ctx.roundRect(-3.5, top, 7, 26, 2));
      ctx.restore();
    }
    fill(ctx, '#e8665c', () => {
      ctx.moveTo(-20, -4);
      ctx.lineTo(20, -4);
      ctx.lineTo(15, 24);
      ctx.lineTo(-15, 24);
      ctx.closePath();
    });
    fill(ctx, '#fbf6ec', () => ctx.arc(0, 8, 5, 0, Math.PI * 2));
  },
  cocoa(ctx) {
    ctx.strokeStyle = '#d96f63';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(22, 4, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    fill(ctx, '#e8806f', () => ctx.roundRect(-22, -10, 44, 31, [4, 4, 10, 10]));
    fill(ctx, '#7a4a35', () => ctx.ellipse(0, -10, 22, 5, 0, 0, Math.PI * 2));
    fill(ctx, '#fbf6ec', () => {
      ctx.roundRect(-14, -18, 11, 10, 3);
      ctx.roundRect(-2, -20, 11, 10, 3);
      ctx.roundRect(8, -16, 9, 9, 3);
    });
    fill(ctx, '#fbf6ec', () => ctx.arc(0, 6, 5, 0, Math.PI * 2));
  },
  gingerbread(ctx) {
    fill(ctx, '#c98a54', () => {
      ctx.arc(0, -15, 11, 0, Math.PI * 2);
      ctx.roundRect(-11, -6, 22, 22, 8);
      ctx.roundRect(-25, -4, 50, 10, 5);
      ctx.roundRect(-13, 8, 10, 18, 5);
      ctx.roundRect(3, 8, 10, 18, 5);
    });
    fill(ctx, '#fbf6ec', () => {
      ctx.arc(-4, -17, 1.8, 0, Math.PI * 2);
      ctx.arc(4, -17, 1.8, 0, Math.PI * 2);
    });
    ctx.strokeStyle = '#fbf6ec';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -13, 4, 0.3, Math.PI - 0.3);
    ctx.stroke();
    lines(ctx, '#fbf6ec', 2, [
      [-22, -1, -18, -1],
      [18, -1, 22, -1],
      [-11, 21, -5, 21],
      [5, 21, 11, 21],
    ]);
    fill(ctx, '#e8665c', () => {
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.arc(0, 8, 2.5, 0, Math.PI * 2);
    });
  },
  gift(ctx) {
    fill(ctx, '#e8665c', () => ctx.roundRect(-30, -10, 60, 35, 5));
    fill(ctx, '#f07a70', () => ctx.roundRect(-32, -16, 64, 10, 4));
    fill(ctx, '#7fbf6a', () => {
      ctx.rect(-5, -16, 10, 41);
      ctx.rect(-30, 3, 60, 8);
    });
    // The bow.
    fill(ctx, '#7fbf6a', () => {
      ctx.ellipse(-9, -20, 10, 6, -0.5, 0, Math.PI * 2);
      ctx.moveTo(19, -20);
      ctx.ellipse(9, -20, 10, 6, 0.5, 0, Math.PI * 2);
    });
    fill(ctx, '#6aab57', () => ctx.arc(0, -18, 4.5, 0, Math.PI * 2));
  },
  giftSmall: (ctx) => present(ctx, 44, 36, '#6b9fe0', '#7fb0ec', '#fbf6ec', '#e6e0d4'),
  giftTall: (ctx) => present(ctx, 44, 66, '#a77fd6', '#b791e0', '#f2c14e', '#d9a63a'),
  giftBig: (ctx) => present(ctx, 88, 58, '#6aab57', '#7fbf6a', '#e8665c', '#d4554c'),
  coffee(ctx) {
    fill(ctx, '#f6efe0', () => ctx.ellipse(0, 13, 30, 5, 0, 0, Math.PI * 2));
    ctx.strokeStyle = '#efe6d2';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(19, -1, 7, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    fill(ctx, '#fbf6ec', () => ctx.roundRect(-19, -10, 38, 22, [3, 3, 12, 12]));
    fill(ctx, '#b07a52', () => ctx.ellipse(0, -10, 19, 4.5, 0, 0, Math.PI * 2));
    // A heart in the foam.
    fill(ctx, '#f4e2c6', () => {
      ctx.moveTo(0, -7.5);
      ctx.bezierCurveTo(-8, -11, -4, -15, 0, -12);
      ctx.bezierCurveTo(4, -15, 8, -11, 0, -7.5);
    });
  },
  tea(ctx) {
    fill(ctx, '#f6efe0', () => ctx.ellipse(0, 12, 30, 5, 0, 0, Math.PI * 2));
    ctx.strokeStyle = '#8cc9e8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(19, 0, 6, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    fill(ctx, '#8cc9e8', () => ctx.roundRect(-20, -8, 40, 19, [3, 3, 14, 14]));
    fill(ctx, '#c98a54', () => ctx.ellipse(0, -8, 20, 4.5, 0, 0, Math.PI * 2));
    fill(ctx, '#fbf6ec', () => ctx.arc(-6, 2, 3, 0, Math.PI * 2));
    // The tea bag's string and tag over the side.
    lines(ctx, '#d8cfc0', 1.5, [[-12, -9, -16, -14], [-16, -14, -24, 0]]);
    fill(ctx, '#f2c14e', () => ctx.roundRect(-29, 0, 10, 10, 2));
  },
  bun(ctx) {
    fill(ctx, '#d9a066', () => ctx.ellipse(0, 2, 28, 11, 0, 0, Math.PI * 2));
    fill(ctx, '#c98a54', () => ctx.ellipse(0, -1, 24, 9, 0, 0, Math.PI * 2));
    // The swirl, and icing.
    ctx.strokeStyle = '#a86e40';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.3) {
      const rr = 2 + a * 1.3;
      const px = Math.cos(a) * rr;
      const py = -1 + Math.sin(a) * rr * 0.38;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    lines(ctx, '#fbf6ec', 2.5, [[-14, -6, -4, -9], [2, -8, 12, -5]]);
  },
  parcel(ctx) {
    fill(ctx, '#d4a473', () => ctx.roundRect(-34, -20, 68, 40, 4));
    fill(ctx, '#c8955f', () => ctx.rect(-34, -20, 68, 6));
    fill(ctx, '#e7c595', () => ctx.rect(-6, -20, 12, 40));
    fill(ctx, '#fbf6ec', () => ctx.roundRect(10, -2, 18, 14, 2));
    lines(ctx, '#b0a69c', 1.6, [
      [13, 3, 25, 3],
      [13, 7, 21, 7],
    ]);
  },
  icecube(ctx) {
    iceBlock(ctx);
    fill(ctx, 'rgba(255, 255, 255, 0.75)', () => {
      ctx.roundRect(-30, -29, 10, 36, 5);
      ctx.roundRect(-14, -29, 18, 7, 3.5);
    });
    fill(ctx, 'rgba(255, 255, 255, 0.45)', () => ctx.roundRect(20, 6, 10, 16, 5));
  },
  icewindow(ctx) {
    iceBlock(ctx);
    // An arched window through the block, deep blue inside.
    fill(ctx, '#6fa8cf', () => {
      ctx.moveTo(-14, 22);
      ctx.lineTo(-14, -6);
      ctx.arc(0, -6, 14, Math.PI, 0);
      ctx.lineTo(14, 22);
      ctx.closePath();
    });
    fill(ctx, '#5a94bd', () => ctx.rect(-14, 12, 28, 10));
    fill(ctx, 'rgba(255, 255, 255, 0.75)', () => {
      ctx.roundRect(-32, -29, 9, 30, 4.5);
      ctx.roundRect(22, -29, 12, 6, 3);
    });
  },
  icetop(ctx) {
    // A pointed turret roof with a flat base, to top a tower.
    fill(ctx, '#a9d6ee', () => {
      ctx.moveTo(-40, 31);
      ctx.lineTo(-40, 22);
      ctx.quadraticCurveTo(-14, 4, 0, -31);
      ctx.quadraticCurveTo(14, 4, 40, 22);
      ctx.lineTo(40, 31);
      ctx.closePath();
    });
    fill(ctx, '#c4e6f6', () => {
      ctx.moveTo(-34, 24);
      ctx.quadraticCurveTo(-12, 6, 0, -27);
      ctx.quadraticCurveTo(10, 6, 30, 22);
      ctx.closePath();
    });
    fill(ctx, '#a9d6ee', () => ctx.roundRect(-42, 22, 84, 9, 4));
    fill(ctx, 'rgba(255, 255, 255, 0.75)', () => {
      ctx.moveTo(-6, -18);
      ctx.quadraticCurveTo(-12, 2, -24, 16);
      ctx.lineTo(-18, 16);
      ctx.quadraticCurveTo(-8, 2, -6, -18);
    });
  },
  candleRed: (ctx) => candle(ctx, CANDLE_COLOR.candleRed),
  candleYellow: (ctx) => candle(ctx, CANDLE_COLOR.candleYellow),
  candleGreen: (ctx) => candle(ctx, CANDLE_COLOR.candleGreen),
  candleBlue: (ctx) => candle(ctx, CANDLE_COLOR.candleBlue),
  candlePink: (ctx) => candle(ctx, CANDLE_COLOR.candlePink),
  snowball1: (ctx) => snowball(ctx, SNOWBALL_R.snowball1),
  snowball2: (ctx) => snowball(ctx, SNOWBALL_R.snowball2),
  snowball3: (ctx) => snowball(ctx, SNOWBALL_R.snowball3),
  snowball4: (ctx) => snowball(ctx, SNOWBALL_R.snowball4),
  bauble: (ctx) => bauble(ctx, '#5fa8a0', 'band'),
  baubleRed: (ctx) => bauble(ctx, '#e0574f', 'plain'),
  baubleBlue: (ctx) => bauble(ctx, '#5b8fd9', 'stripes'),
  baubleGold: (ctx) => bauble(ctx, '#e6b33e', 'flake'),
  baublePurple: (ctx) => bauble(ctx, '#9a6bc9', 'dots'),
  bell(ctx) {
    hook(ctx);
    fill(ctx, '#e6b33e', () => {
      ctx.moveTo(-6, -12);
      ctx.quadraticCurveTo(-16, -10, -16, 6);
      ctx.quadraticCurveTo(-17, 16, -23, 20);
      ctx.lineTo(23, 20);
      ctx.quadraticCurveTo(17, 16, 16, 6);
      ctx.quadraticCurveTo(16, -10, 6, -12);
      ctx.closePath();
    });
    fill(ctx, '#c99a35', () => ctx.arc(0, 22, 5, 0, Math.PI * 2));
    fill(ctx, 'rgba(255, 255, 255, 0.45)', () => ctx.ellipse(-7, 0, 3.5, 8, 0.2, 0, Math.PI * 2));
    // A little red bow where it hangs.
    fill(ctx, '#d64545', () => {
      ctx.ellipse(-7, -13, 7, 4, -0.3, 0, Math.PI * 2);
      ctx.ellipse(7, -13, 7, 4, 0.3, 0, Math.PI * 2);
    });
  },
  star(ctx) {
    ctx.fillStyle = '#f6c84c';
    ctx.strokeStyle = '#f6c84c';
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? 22 : 10;
      ctx.lineTo(Math.cos(a) * rr, 3 + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    fill(ctx, '#fbe39a', () => ctx.ellipse(-6, -6, 4, 6, -0.5, 0, Math.PI * 2));
  },
  hay(ctx) {
    fill(ctx, '#e8cf7a', () => ctx.roundRect(-34, -18, 68, 36, 9));
    lines(ctx, '#d4b65e', 2.5, [
      [-26, -8, 10, -8],
      [-18, 2, 24, 2],
      [-28, 11, 4, 11],
    ]);
    fill(ctx, '#b5814f', () => {
      ctx.rect(-16, -18, 4, 36);
      ctx.rect(12, -18, 4, 36);
    });
  },
  pie(ctx) {
    fill(ctx, '#d99a55', () => ctx.ellipse(0, 4, 36, 9, 0, 0, Math.PI * 2));
    fill(ctx, '#e8b56a', () => ctx.roundRect(-34, -8, 68, 14, [10, 10, 4, 4]));
    fill(ctx, '#f2cd86', () => ctx.ellipse(0, -8, 32, 6, 0, 0, Math.PI * 2));
    lines(ctx, '#d99a55', 3, [
      [-20, -11, -12, -5],
      [-4, -12, 4, -4],
      [12, -11, 20, -5],
    ]);
  },
  popcorn(ctx) {
    // A striped tub heaped with popcorn.
    fill(ctx, '#fbf3df', () => {
      for (const [dx, dy, r] of [
        [-16, -10, 10],
        [0, -16, 12],
        [15, -10, 10],
        [-7, -4, 9],
        [8, -4, 9],
      ]) {
        ctx.moveTo(dx + r, dy);
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
      }
    });
    fill(ctx, '#f6e2a8', () => ctx.arc(4, -18, 4, 0, Math.PI * 2));
    fill(ctx, '#f7f3ea', () => {
      ctx.moveTo(-24, -2);
      ctx.lineTo(24, -2);
      ctx.lineTo(18, 22);
      ctx.lineTo(-18, 22);
      ctx.closePath();
    });
    for (const dx of [-14, 0, 14]) fill(ctx, '#e8665c', () => ctx.rect(dx - 3.5 - dx * 0.12, -2, 7, 24));
  },
  flour(ctx) {
    // A tied sack with a wheat ear on it.
    fill(ctx, '#efe6d2', () => {
      ctx.moveTo(-12, -18);
      ctx.quadraticCurveTo(-28, 0, -24, 18);
      ctx.quadraticCurveTo(0, 26, 24, 18);
      ctx.quadraticCurveTo(28, 0, 12, -18);
      ctx.closePath();
    });
    fill(ctx, '#e3d7bd', () => ctx.ellipse(0, -21, 12, 5, 0, 0, Math.PI * 2));
    fill(ctx, '#c9a26b', () => ctx.roundRect(-13, -17, 26, 5, 2));
    lines(ctx, '#d9a64e', 3, [[0, 14, 0, -4]]);
    for (const dy of [-2, 4, 10]) {
      fill(ctx, '#e8b85a', () => ctx.ellipse(-5, dy, 5, 3, 0.6, 0, Math.PI * 2));
      fill(ctx, '#e8b85a', () => ctx.ellipse(5, dy, 5, 3, -0.6, 0, Math.PI * 2));
    }
  },
  tortilla(ctx) {
    fill(ctx, '#e6c88f', () => ctx.ellipse(0, 2, 36, 9, 0, 0, Math.PI * 2));
    fill(ctx, '#f2dcaa', () => ctx.ellipse(0, -1, 34, 7, 0, 0, Math.PI * 2));
    for (const [dx, dy] of [
      [-16, -1],
      [6, -3],
      [18, 1],
      [-4, 2],
    ])
      fill(ctx, '#d4a865', () => ctx.ellipse(dx, dy, 3, 1.5, 0, 0, Math.PI * 2));
  },
  egg(ctx) {
    fill(ctx, '#fbf6ec', () => {
      ctx.moveTo(0, -20);
      ctx.bezierCurveTo(14, -20, 16, 6, 16, 8);
      ctx.bezierCurveTo(16, 18, 8, 20, 0, 20);
      ctx.bezierCurveTo(-8, 20, -16, 18, -16, 8);
      ctx.bezierCurveTo(-16, 6, -14, -20, 0, -20);
    });
    fill(ctx, '#ffffff', () => ctx.ellipse(-5, -6, 4, 6, -0.3, 0, Math.PI * 2));
  },
  eggStripes(ctx) {
    paintedEgg(ctx, '#bfe3f2', '#f6a9c0', (c) => {
      for (const y of [-10, 2, 14]) c.fillRect(-20, y, 40, 5);
    });
  },
  eggDots(ctx) {
    paintedEgg(ctx, '#f8d3e0', '#fbfbf7', (c) => {
      for (const [x, y] of [
        [-8, -12],
        [6, -6],
        [-10, 4],
        [10, 8],
        [-2, 14],
        [2, -18],
      ]) {
        c.beginPath();
        c.arc(x, y, 3.2, 0, Math.PI * 2);
        c.fill();
      }
    });
  },
  eggZigzag(ctx) {
    paintedEgg(ctx, '#fbe7a6', '#86c7a8', (c) => {
      c.lineWidth = 3.5;
      c.lineJoin = 'round';
      for (const y of [-6, 8]) {
        c.beginPath();
        for (let i = 0; i <= 8; i++) c.lineTo(-20 + i * 5, y + (i % 2 ? -4 : 4));
        c.stroke();
      }
    });
  },
  eggHearts(ctx) {
    paintedEgg(ctx, '#d8ccf0', '#f08aa6', (c) => {
      heart(c, -6, -8, 5);
      heart(c, 7, 4, 5);
      heart(c, -5, 13, 4);
    });
  },
  eggStars(ctx) {
    paintedEgg(ctx, '#bfe6c6', '#f6d36a', (c) => {
      star5(c, -5, -9, 6);
      star5(c, 8, 4, 5.5);
      star5(c, -6, 13, 4.5);
    });
  },
  eggFlowers(ctx) {
    paintedEgg(ctx, '#fbd4b8', '#ffffff', (c) => {
      for (const [x, y] of [
        [-4, -8],
        [7, 9],
      ]) {
        for (let k = 0; k < 5; k++) {
          const a = (k * Math.PI * 2) / 5;
          c.beginPath();
          c.arc(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = '#f2b84b';
        c.beginPath();
        c.arc(x, y, 2.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
      }
      c.fillStyle = '#9fd18e';
      c.fillRect(-20, 16, 40, 4);
    });
  },
  firewood(ctx) {
    // A short round log on its side: bark along the length, the cut end facing the viewer.
    fill(ctx, '#8a5f42', () => ctx.roundRect(-30, -15, 50, 30, 10));
    lines(ctx, '#74503a', 2, [
      [-24, -7, -2, -7],
      [-18, 3, 6, 3],
      [-26, 10, -8, 10],
    ]);
    fill(ctx, '#8a5f42', () => ctx.ellipse(18, 0, 12, 15, 0, 0, Math.PI * 2));
    fill(ctx, '#e2c08f', () => ctx.ellipse(18, 0, 9, 12, 0, 0, Math.PI * 2));
    ctx.strokeStyle = '#cfa673';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(18, 0, 5.5, 7.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    fill(ctx, '#b8875e', () => ctx.arc(18, 0, 1.8, 0, Math.PI * 2));
  },
  kindling(ctx) {
    // Three split wedges standing together, tied round the middle with twine.
    for (const [x, a, h] of [
      [-12, -0.12, 24],
      [12, 0.12, 24],
      [0, 0, 26],
    ]) {
      ctx.save();
      ctx.translate(x, 0);
      ctx.rotate(a);
      fill(ctx, '#8a5f42', () => ctx.roundRect(-8, -h / 2, 16, h, 3));
      fill(ctx, '#e2c08f', () => {
        ctx.moveTo(-8, -h / 2 + 2);
        ctx.lineTo(4, -h / 2 + 2);
        ctx.lineTo(-2, h / 2 - 2);
        ctx.lineTo(-8, h / 2 - 2);
        ctx.closePath();
      });
      ctx.restore();
    }
    fill(ctx, '#c9a26a', () => ctx.roundRect(-24, -2, 48, 5, 2.5));
    fill(ctx, '#c9a26a', () => ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2));
  },
  cake(ctx) {
    fill(ctx, '#f3c8d4', () => ctx.roundRect(-30, -8, 60, 28, 8));
    fill(ctx, '#fff4ef', () => ctx.roundRect(-30, -14, 60, 12, 6));
    fill(ctx, '#e8645f', () => ctx.arc(0, -18, 6, 0, Math.PI * 2));
    fill(ctx, '#e3a1b5', () => ctx.rect(-30, 6, 60, 4));
  },
  corndog(ctx) {
    fill(ctx, '#e2c49a', () => ctx.roundRect(-3, 14, 6, 19, 3));
    fill(ctx, '#e3a54b', () => ctx.roundRect(-14, -33, 28, 50, 14));
    lines(ctx, '#f2d06b', 3, [[-6, -24, 2, -14]]);
  },
  sandwich(ctx) {
    fill(ctx, '#f0d9a7', () => ctx.roundRect(-32, 4, 64, 11, 5));
    fill(ctx, '#86c26a', () => ctx.roundRect(-34, -2, 68, 8, 4));
    fill(ctx, '#e8665c', () => ctx.roundRect(-28, -6, 56, 6, 3));
    fill(ctx, '#f0d9a7', () => ctx.roundRect(-32, -15, 64, 11, [8, 8, 4, 4]));
  },
  cookie(ctx) {
    fill(ctx, '#d9a066', () => ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2));
    fill(ctx, '#7a4a35', () => {
      ctx.arc(-9, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(4, -3, 2.5, 0, Math.PI * 2);
      ctx.arc(10, 2, 2.5, 0, Math.PI * 2);
    });
  },
  // A spinning top standing still; a top in play is drawn by its item, spinning or lying down.
  top(ctx) {
    drawTop(ctx, newTop(), 0, 0, 0, 1, 1, true);
  },
  honey(ctx) {
    // A round jar of golden honey, a cloth lid tied with string, a wooden dipper.
    fill(ctx, '#f2b53d', () => ctx.roundRect(-22, -8, 44, 30, [10, 10, 14, 14]));
    fill(ctx, '#f7cd6b', () => ctx.roundRect(-16, -4, 10, 20, 5));
    fill(ctx, '#e8a33a', () => ctx.roundRect(-18, -14, 36, 8, 3));
    fill(ctx, '#f3e2c4', () => {
      ctx.moveTo(-24, -12);
      ctx.quadraticCurveTo(0, -22, 24, -12);
      ctx.lineTo(20, -2);
      ctx.quadraticCurveTo(0, 2, -20, -2);
      ctx.closePath();
    });
    lines(ctx, '#c9a77a', 2.5, [[-19, -5, 19, -5]]);
    lines(ctx, '#b5814f', 4, [[8, -6, 18, -26]]);
    fill(ctx, '#b5814f', () => ctx.ellipse(19, -27, 5, 4, -1, 0, Math.PI * 2));
  },
  juice(ctx) {
    // A glass bottle of apple juice with a cork and a little apple on the label.
    fill(ctx, '#d6eef2', () => {
      ctx.moveTo(-6, -24);
      ctx.lineTo(6, -24);
      ctx.lineTo(6, -12);
      ctx.quadraticCurveTo(15, -8, 15, 2);
      ctx.lineTo(15, 25);
      ctx.quadraticCurveTo(15, 29, 11, 29);
      ctx.lineTo(-11, 29);
      ctx.quadraticCurveTo(-15, 29, -15, 25);
      ctx.lineTo(-15, 2);
      ctx.quadraticCurveTo(-15, -8, -6, -12);
      ctx.closePath();
    });
    fill(ctx, '#f2bf4a', () => ctx.roundRect(-13, -2, 26, 29, [2, 2, 9, 9]));
    fill(ctx, '#f7efe1', () => ctx.roundRect(-11, 5, 22, 14, 3));
    fill(ctx, '#ec7a6c', () => ctx.arc(0, 12, 4.5, 0, Math.PI * 2));
    fill(ctx, '#c08a5c', () => ctx.roundRect(-5, -29, 10, 8, 2));
    fill(ctx, 'rgba(255, 255, 255, 0.55)', () => ctx.roundRect(-11, -6, 3, 26, 1.5));
  },
  icecreamPink: (ctx) => iceCream(ctx, '#f6a9c4', '#fbd0df', '#e8665c'),
  icecreamChoc: (ctx) => iceCream(ctx, '#a8735a', '#c99478', '#f6a9c4'),
  icecreamMint: (ctx) => iceCream(ctx, '#a8e0c4', '#cdf0dd', '#7a4a35'),
  marshmallow: (ctx) => marshmallow(ctx, '#fbf8f2', '#efe8dc', false),
  toasted: (ctx) => marshmallow(ctx, '#e0a45a', '#c7843f', true),
  jackolantern(ctx) {
    drawVeg(ctx, 'pumpkin', 0, 0, 0, 1, 1);
    // A friendly face; drawJackLight glows inside it while the candle in it is lit.
    fill(ctx, '#7a4320', jackFace(ctx));
  },
  kite(ctx) {
    // A tail of little bows trailing down, then the diamond in two colours with its cross sticks.
    lines(ctx, '#8a8f99', 1.5, [
      [0, 6, -6, 18],
      [-6, 18, 4, 26],
      [4, 26, -2, 34],
    ]);
    for (const [x, y, color] of [
      [-6, 18, '#ef8fb4'],
      [4, 26, '#f2c14e'],
      [-2, 34, '#6b9fe0'],
    ] as const) {
      fill(ctx, color, () => {
        ctx.moveTo(x, y);
        ctx.lineTo(x - 6, y - 4);
        ctx.lineTo(x - 6, y + 4);
        ctx.closePath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 6, y - 4);
        ctx.lineTo(x + 6, y + 4);
        ctx.closePath();
      });
    }
    fill(ctx, '#e8665c', () => {
      ctx.moveTo(0, -35);
      ctx.lineTo(30, -12);
      ctx.lineTo(0, 6);
      ctx.closePath();
    });
    fill(ctx, '#f2c14e', () => {
      ctx.moveTo(0, -35);
      ctx.lineTo(-30, -12);
      ctx.lineTo(0, 6);
      ctx.closePath();
    });
    fill(ctx, 'rgba(255, 255, 255, 0.35)', () => {
      ctx.moveTo(0, -35);
      ctx.lineTo(-30, -12);
      ctx.lineTo(0, -12);
      ctx.closePath();
    });
    lines(ctx, '#b5814f', 2.5, [
      [0, -34, 0, 5],
      [-28, -12, 28, -12],
    ]);
  },
  ship(ctx) {
    // A little sailing boat: hull, mast and two sails.
    fill(ctx, '#c0614f', () => {
      ctx.moveTo(-48, 10);
      ctx.lineTo(48, 10);
      ctx.lineTo(34, 28);
      ctx.lineTo(-34, 28);
      ctx.closePath();
    });
    fill(ctx, '#f6efe0', () => ctx.rect(-40, 10, 80, 5));
    fill(ctx, '#8d5c4f', () => ctx.rect(-2, -28, 4, 40));
    fill(ctx, '#f6efe0', () => {
      ctx.moveTo(4, -26);
      ctx.lineTo(36, 6);
      ctx.lineTo(4, 6);
      ctx.closePath();
    });
    fill(ctx, '#eadfca', () => {
      ctx.moveTo(-4, -20);
      ctx.lineTo(-30, 6);
      ctx.lineTo(-4, 6);
      ctx.closePath();
    });
    fill(ctx, '#6b93e0', () => {
      ctx.moveTo(2, -28);
      ctx.lineTo(16, -23);
      ctx.lineTo(2, -18);
      ctx.closePath();
    });
  },
  drum(ctx) {
    fill(ctx, '#e8665c', () => ctx.roundRect(-30, -10, 60, 28, 8));
    fill(ctx, '#f6efe0', () => ctx.ellipse(0, -10, 30, 8, 0, 0, Math.PI * 2));
    lines(ctx, '#f2c14e', 3, [
      [-26, -4, -12, 16],
      [-12, -4, 2, 16],
      [2, -4, 16, 16],
      [16, -4, 28, 12],
    ]);
  },
  guitar(ctx) {
    fill(ctx, '#8d5c4f', () => ctx.roundRect(-4, -35, 8, 40, 3));
    fill(ctx, '#e3a54b', () => {
      ctx.arc(0, 8, 16, 0, Math.PI * 2);
      ctx.arc(0, 22, 20, 0, Math.PI * 2);
    });
    fill(ctx, '#7a4a35', () => ctx.arc(0, 14, 6, 0, Math.PI * 2));
    fill(ctx, '#5e4136', () => ctx.roundRect(-6, -36, 12, 8, 3));
  },
  trumpet(ctx) {
    fill(ctx, '#f2c14e', () => {
      ctx.moveTo(14, -12);
      ctx.lineTo(34, -18);
      ctx.lineTo(34, 18);
      ctx.lineTo(14, 12);
      ctx.closePath();
    });
    fill(ctx, '#f2c14e', () => ctx.roundRect(-34, -5, 52, 10, 5));
    fill(ctx, '#d9a63a', () => {
      ctx.roundRect(-14, -12, 6, 10, 3);
      ctx.roundRect(-4, -12, 6, 10, 3);
      ctx.roundRect(6, -12, 6, 10, 3);
    });
  },
};

/** A lit jack-o'-lantern's warm glow over the dark, centred on its face. */
export function drawJackGlow(ctx: CanvasRenderingContext2D, x: number, y: number, night: number): void {
  if (night <= 0) return;
  const glow = ctx.createRadialGradient(x, y, 4, x, y, 90);
  glow.addColorStop(0, `rgba(255, 196, 110, ${0.55 * night})`);
  glow.addColorStop(1, 'rgba(255, 196, 110, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 90, 0, Math.PI * 2);
  ctx.fill();
}
