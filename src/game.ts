import {
  FALL_FLOOR,
  FRONT_FLOOR,
  GRAB_SLOP,
  GRAVITY,
  GROUND_BAND,
  GROUND_Y,
  MAX_RELEASE_SPEED,
  PLACE_SPEED,
  SCREEN_W,
  STEP,
  VIEW_ZOOM,
  WORLD_H,
  palette,
} from './config';
import * as audio from './audio';
import { Notes, Splashes } from './fx';
import { SNORE_SECONDS, type AnimalKind } from './objects/animals';
import { Barn, type HayBale } from './objects/barn';
import { Bed, type Plot } from './objects/bed';
import { Bin } from './objects/bin';
import { Cloud } from './objects/cloud';
import { Coop } from './objects/coop';
import { Bird, Decor, drawFence } from './objects/decor';
import { Bench } from './objects/bench';
import { Boombox } from './objects/boombox';
import { Dispenser } from './objects/dispenser';
import { CornField, SunflowerField, type Cob } from './objects/fields';
import { CANDLES, CANDLE_COLOR, CANDLE_FLAME_DY, ORNAMENTS, PAINTED_EGGS, isCandle, isEgg, isGift, isInstrument, isSnowball, SNOWBALLS, TREATS, type CandleKind, type InstrumentKind, type ToyKind } from './objects/goods';
import { House } from './objects/house';
import { Item, drawLoose, isFruit, isHat, isVeg, sizeOf, type ItemKind, type LooseKind } from './objects/item';
import type { Perch } from './objects/perch';
import { BAKE_SECONDS, Basket, Grill, Picnic } from './objects/picnic';
import { Mud, Puddle } from './objects/puddle';
import { Fireflies } from './objects/fireflies';
import { Owl } from './objects/owl';
import { Scarecrow } from './objects/scarecrow';
import type { Sink } from './objects/sink';
import { Stable } from './objects/stable';
import { OfferSeat } from './objects/offerseat';
import { Stack, type Anchor } from './objects/stack';
import { Swing } from './objects/swing';
import { Tree, type Slot } from './objects/tree';
import { isFlower, type VegKind } from './objects/veg';
import { Vehicle } from './objects/vehicle';
import { Windmill } from './objects/windmill';
import { Cannon } from './objects/cannon';
import { IceColumns } from './objects/columns';
import { Rink } from './objects/rink';
import { SledHill } from './objects/sledhill';
import { Stall } from './objects/stall';
import { LightString, Pine, StreetLamp, drawSnowBank, drawTown } from './objects/town';
import { SantaChair } from './objects/throne';
import { DecorBox, MarketTable } from './objects/market';
import { Nest } from './objects/nest';
import { LilyPads } from './objects/lilypads';
import { Hive } from './objects/hive';
import { Butterflies } from './objects/butterflies';
import { Rainbow } from './objects/rainbow';
import { Campfire, CarvingTable, CiderPress } from './objects/station';
import { Mushrooms } from './objects/mushrooms';
import { drawFalling } from './objects/falling';
import { Birdhouse, Bridge, Greenhouse, RibbonPole } from './objects/garden';
import { drawHedge, drawParkTown, drawPath, drawSpringGround } from './objects/meadow';
import { ChoppingBlock, Woodpile, drawLeafLitter, drawUndergrowth, drawWoods } from './objects/woods';
import { Carousel, Fountain, Seesaw, Slide } from './objects/park';
import { Tent } from './objects/tent';
import { EggHunt } from './objects/egghunt';
import { THEMES, type Theme } from './theme';
import type { Saved, SavedStack } from './save';
import type { Home, SceneDef } from './scenes/scene';
import { settings } from './settings';
import { Sky } from './sky';

/** Where a stack resting on something stands. */
function anchorPoint(anchor: Anchor): { x: number; top: number } {
  if ('slot' in anchor) return { x: anchor.slot.x, top: anchor.tree.fruitTop(anchor.slot) };
  if ('plot' in anchor) return { x: anchor.plot.x, top: anchor.bed.vegTop(anchor.plot) };
  return { x: anchor.perch.seatX(anchor.seat), top: anchor.perch.seatTop(anchor.seat) };
}

/** Do two anchors hold a stack at the same spot? */
function sameSpot(a: Anchor, b: Anchor): boolean {
  if ('slot' in a) return 'slot' in b && a.slot === b.slot;
  if ('plot' in a) return 'plot' in b && a.plot === b.plot;
  return 'perch' in b && a.perch === b.perch && a.seat === b.seat;
}

interface Hold {
  stack: Stack;
  /** Where the finger is on screen, so the world can scroll under a resting finger. */
  cssX: number;
  cssY: number;
  /** Offset from the finger to the stack's bottom centre, so it never jumps when grabbed. */
  dx: number;
  dy: number;
}

/** A finger dragging a rain cloud. */
interface CloudHold {
  cloud: Cloud;
  cssX: number;
  cssY: number;
  dx: number;
  dy: number;
}

/** A finger driving a vehicle along the ground. */
interface VehicleHold {
  vehicle: Vehicle;
  cssX: number;
  startX: number;
  dx: number;
  /** How far the finger has moved, to tell a tap (a honk) from a drive. */
  moved: number;
}

/** A finger on something riding the swing, or on a candle: a tap pushes the swing or switches the candle, a drag picks it up. */
interface RiderTouch {
  stack: Stack;
  index: number;
  point: { x: number; y: number };
  startX: number;
  startY: number;
}

/** A finger sliding a barn door. */
interface DoorHold {
  barn: Barn;
  side: 0 | 1;
  startSlide: number;
  startWorldX: number;
  cssX: number;
  startX: number;
  moved: number;
}

/** A finger turning the windmill's sails. */
interface TurnHold {
  windmill: Windmill;
  cssX: number;
  cssY: number;
  startX: number;
  startY: number;
  moved: number;
}

/** A finger holding the snow cannon down: a snowball grows until it lets go. */
interface CannonHold {
  cannon: Cannon;
  cssX: number;
  cssY: number;
  startX: number;
  startY: number;
  moved: number;
}

/** A finger on empty ground or on a structure: a drag pans, a tap is passed on to what is there. */
interface Pan {
  cssX: number;
  cssY: number;
  speed: number;
  startX: number;
  startY: number;
  moved: number;
}

/** Food or a hat on its way into the water, a bin or a mouth. */
interface Vanishing {
  kind: LooseKind;
  x: number;
  y: number;
  age: number;
  into: 'water' | 'bin' | 'mouth';
  /** Drawing order: just in front of the puddle or bin it goes into. */
  depth: number;
  /** Going under: the line it slides down through, and how far it goes. */
  waterline?: number;
  drop?: number;
  /** Colour of the ring it leaves on the water (clean or muddy). */
  light?: string;
  /** A bin's opening: it stays in sight inside it, down to the front lip. */
  hole?: { x: number; rx: number; ry: number };
}

/** Something that is never lost: an animal or a toy, and how to put it back at home. */
interface Keeper {
  kind: AnimalKind | ToyKind;
  spawn: () => void;
}

/** Something drawn in depth order, with roughly where it is so far-off things can be skipped. */
interface Layer {
  depth: number;
  x: number;
  reach: number;
  draw: () => void;
}

const SINK_SECONDS = 0.3;
/** Carrying food this close to an animal's mouth makes it open. */
const MOUTH_OPEN_DIST = 90;
/** Letting go of food this close to an open mouth feeds the animal. */
const EAT_DIST = 18;
/** A drowning tower loses at most one item this often. */
const DROWN_INTERVAL = 0.3;
/** A thing that falls onto the ground lands this far in front of what is already there. */
const LAYER_GAP = 14;
/** Carrying something this close to the screen edge (in screen pixels) scrolls the world. */
const EDGE_SCROLL_ZONE = 70;
const EDGE_SCROLL_SPEED = 700;
/** A swipe glides at most this fast (world units per second), so it never flies off. */
const MAX_GLIDE = 1600;
// Supply caps: with this much out in the world, what makes more waits until some is used.
/** Fruit of one kind, and fruit of all kinds together. */
const FRUIT_KIND_CAP = 16;
const FRUIT_CAP = 32;
const VEG_CAP = 20;
const HAY_CAP = 10;
const TREAT_CAP = 10;
const EGG_CAP = 6;
const FLOUR_CAP = 4;
/** A hen this close to another (world units, sideways) chats with it. */
const HEN_CHAT_DIST = 200;
/** Hats, counting the ones the animals start out wearing. */
const HAT_CAP = 15;
// The winter town's things: gifts and parcels, ice cubes, candles, snowballs, and each stall's goods.
const GIFT_CAP = 6;
/** Ice blocks out beyond the ones the level starts with (the winter castle). */
const ICE_CAP = 16;
/** Drawing depth of owls in tree crowns; what is stacked on a tree's fruit is drawn just after. */
const IN_TREE = -1e6;
const SNOWBALL_CAP = 12;
const STALL_CAP = 10;
/** Decorations are wanted in numbers: enough to dress a few trees. */
const ORNAMENT_CAP = 30;
/** Things that slide on the rink slow down this much (per second; the ground stops them at 10). */
const ICE_FRICTION = 0.7;
/** Let go on the rink, things slide off at least this fast. */
const MIN_SLIDE = 50;
/** The plough rolls snow, and makes a soft crunch every this far. */
const CRUNCH_EVERY = 90;
/** The sleigh's bells ring every this far it is driven. */
const JINGLE_EVERY = 110;
/** A finger that moves less than this (screen pixels) is a tap. */
const TAP_SLOP = 14;
/** Floating boats and ducks paddle across the water this fast. */
const PADDLE_SPEED: Partial<Record<ItemKind, number>> = { ship: 120, duck: 24 };
/** Seconds an animal plays an instrument given to it. */
const PLAY_SECONDS = 2.2;
/** What the grill makes: corn pops into popcorn, flour makes tortillas, other fruit and vegetables bake into pies. */
function bakesInto(kind: ItemKind): 'pie' | 'popcorn' | 'tortilla' | null {
  if (kind === 'corn') return 'popcorn';
  if (kind === 'flour') return 'tortilla';
  return (isFruit(kind) || isVeg(kind)) && !isFlower(kind) ? 'pie' : null;
}

/** Spring and autumn: an egg in the nest hatches after this long, while there are fewer chicks than the cap. */
const HATCH_SECONDS = 4;
const CHICK_CAP = 6;
const HONEY_CAP = 6;
const MARSHMALLOW_CAP = 8;
const PUMPKIN_CAP = 6;
const FIREWOOD_CAP = 8;
const PAINTED_EGG_CAP = 12;
/** Seconds a carving, pressing or toasting takes. */
const WORK_SECONDS = 2.5;
/** Chopping a log takes a few swings; wood on the fire burns away in this long. */
const CHOP_SECONDS = 2.4;
const BURN_SECONDS = 1.5;
/** A kite sinks no faster than this, and floats no higher than this. */
const KITE_SINK = 80;
const KITE_CEILING = 90;
/** A cloud stays at least this far below the top of the view. */
const CLOUD_TOP = 80;
/** A cloud that rained at least this long leaves a rainbow behind in spring. */
const RAINBOW_AFTER = 1.5;

/** Things that light up: candles, and jack-o'-lanterns. A tap switches them; lit, they glow at night. */
function isLight(kind: ItemKind): boolean {
  return isCandle(kind) || kind === 'jackolantern';
}

/** What each station makes of the thing on it: a pumpkin carved, fruit pressed, a log split, a
 * marshmallow toasted (over a lit fire); wood on the fire burns away (`'burn'`). */
function worksInto(station: CarvingTable | CiderPress | Campfire | ChoppingBlock, kind: ItemKind): ItemKind | 'burn' | null {
  if (station instanceof CarvingTable) return kind === 'pumpkin' ? 'jackolantern' : null;
  if (station instanceof CiderPress) return kind === 'apple' || kind === 'pear' ? 'juice' : null;
  if (station instanceof ChoppingBlock) return kind === 'firewood' ? 'kindling' : null;
  if (kind === 'firewood' || kind === 'kindling') return 'burn';
  return kind === 'marshmallow' && station.lit ? 'toasted' : null;
}

/** The ice chest's blocks: they build walls and towers side by side. */
function isIce(kind: ItemKind): boolean {
  return kind === 'icecube' || kind === 'icewindow' || kind === 'icetop';
}

/** Each animal's umbrella. */
const UMBRELLA_COLORS: Record<AnimalKind, string> = {
  cow: '#e8665c',
  horse: '#6b93e0',
  pig: '#7fb85e',
  sheep: '#b39ddb',
  duck: '#f2c14e',
  hen: '#f28b82',
  cat: '#5fa8a0',
  bunny: '#f3a3c4',
  raccoon: '#81c7e8',
  beaver: '#f2a541',
  penguin: '#6bc3c9',
  reindeer: '#d9574f',
  polarbear: '#8cb8e8',
  fox: '#7fb85e',
  seal: '#f2c14e',
  frog: '#f28b82',
  chick: '#6b9fe0',
  lamb: '#f3a3c4',
  squirrel: '#7fb85e',
  hedgehog: '#b39ddb',
  dog: '#6bc0b0',
};
/** Bigger animals play lower. */
const PITCH: Record<AnimalKind, number> = { cow: 0.6, horse: 0.7, pig: 0.85, sheep: 0.9, duck: 1.1, hen: 1.3, cat: 1.2, bunny: 1.4, raccoon: 1.1, beaver: 1, penguin: 1.25, reindeer: 0.7, polarbear: 0.6, fox: 1.15, seal: 0.9, frog: 1.1, chick: 1.6, lamb: 1.2, squirrel: 1.4, hedgehog: 1.3, dog: 1.1 };

export class Game {
  private stacks: Stack[] = [];
  private trees: Tree[] = [];
  private puddles: Puddle[] = [];
  private beds: Bed[] = [];
  private clouds: Cloud[] = [];
  private bins: Bin[] = [];
  private barns: Barn[] = [];
  private stables: Stable[] = [];
  private swings: Swing[] = [];
  private windmills: Windmill[] = [];
  private dispensers: Dispenser[] = [];
  private vehicles: Vehicle[] = [];
  private cornfields: CornField[] = [];
  private sunfields: SunflowerField[] = [];
  private decor: Decor[] = [];
  private birds: Bird[] = [];
  private picnics: Picnic[] = [];
  private baskets: Basket[] = [];
  private grills: Grill[] = [];
  private boomboxes: Boombox[] = [];
  private benches: Bench[] = [];
  private scarecrows: Scarecrow[] = [];
  private owls: Owl[] = [];
  private fireflies: Fireflies[] = [];
  private houses: House[] = [];
  private coops: Coop[] = [];
  private stalls: Stall[] = [];
  private columns: IceColumns[] = [];
  private cannons: Cannon[] = [];
  private hills: SledHill[] = [];
  private rinks: Rink[] = [];
  private lamps: StreetLamp[] = [];
  private pines: Pine[] = [];
  private lightStrings: LightString[] = [];
  private chairs: SantaChair[] = [];
  private tables: MarketTable[] = [];
  private boxes: DecorBox[] = [];
  private nests: Nest[] = [];
  private pads: LilyPads[] = [];
  private hives: Hive[] = [];
  private butterflies: Butterflies[] = [];
  private stations: (CarvingTable | CiderPress | Campfire | ChoppingBlock)[] = [];
  /** How long each held marshmallow has been over the fire. */
  private toasting = new Map<Stack, number>();
  private eggHunts: EggHunt[] = [];
  private mushrooms: Mushrooms[] = [];
  private greenhouses: Greenhouse[] = [];
  private bridges: Bridge[] = [];
  private birdhouses: Birdhouse[] = [];
  private poles: RibbonPole[] = [];
  private woodpiles: Woodpile[] = [];
  /** What every giver has waiting, as a seat to stack on. */
  private offerSeats: OfferSeat[] = [];
  private slides: Slide[] = [];
  private seesaws: Seesaw[] = [];
  private carousels: Carousel[] = [];
  private fountains: Fountain[] = [];
  private tents: Tent[] = [];
  /** Spring's rainbow after rain, and how long each cloud has been raining. */
  private rainbow = new Rainbow();
  private rained = new Map<Cloud, number>();
  private readonly theme: Theme;
  /** How far each driven plough or sleigh has gone since its last crunch or jingle. */
  private travelled = new Map<Vehicle, number>();
  /** When a stack sliding on the ice last scraped, so the sound is not a buzz. */
  private lastScratchAt = 0;

  private holds = new Map<number, Hold>();
  /** Fingers dragging empty ground, panning the world. */
  private pans = new Map<number, Pan>();
  private cloudHolds = new Map<number, CloudHold>();
  private doorHolds = new Map<number, DoorHold>();
  private vehicleHolds = new Map<number, VehicleHold>();
  private turnHolds = new Map<number, TurnHold>();
  private riderTouches = new Map<number, RiderTouch>();
  private cannonHolds = new Map<number, CannonHold>();
  /** Time of the last splash from a wheel in a puddle, per vehicle. */
  private wheelSplashAt = new Map<Vehicle, number>();
  private lastVehicleX = new Map<Vehicle, number>();
  /** Glide left over after a swipe, in world units per second. */
  private camVx = 0;
  /** The farm loops round: walking off one end comes back in at the other. */
  private readonly width: number;
  /** What the scene's layout looks like, so a save made from another layout keeps only its stacks. */
  private readonly layout: string;
  private readonly keepers: Keeper[] = [];
  private vanishing: Vanishing[] = [];
  private splashes = new Splashes();
  private notes = new Notes();
  private sky = new Sky();
  private motorOn = false;
  /** Animals about to answer: a hen clucking back. */
  private replies: { item: Item; at: number }[] = [];
  private nextSnoreAt = 0;
  private snoreTurn = 0;
  /** Offscreen canvas for the landscape at night. */
  private layer: CanvasRenderingContext2D | null = null;
  private time = 0;

  // View: world units are scaled to fit the screen, ground anchored at the bottom.
  private scale = 1;
  private camX = 0;
  /** How far the view has travelled in all, never wrapped: the hills scroll by this. */
  private camTravel = 0;
  private camY = 0;
  private viewW = SCREEN_W;
  private viewH = WORLD_H;

  constructor(scene: SceneDef) {
    this.width = scene.width;
    Stack.loop = scene.width;
    this.theme = THEMES[scene.theme ?? 'summer'];
    this.sky.colors = { top: this.theme.skyTop, bottom: this.theme.skyBottom };
    this.layout = JSON.stringify(scene);
    for (const def of scene.objects) {
      switch (def.type) {
        case 'tree':
          this.trees.push(new Tree(def.x, def.fruit, def.look));
          break;
        case 'puddle':
          this.puddles.push(new Puddle(def.x, def.width));
          break;
        case 'bed':
          this.beds.push(new Bed(def.x, def.width, def.veg));
          break;
        case 'cloud':
          this.clouds.push(new Cloud(def.x, def.y));
          break;
        case 'bin':
          this.bins.push(new Bin(def.x));
          break;
        case 'barn':
          this.barns.push(new Barn(def.x));
          break;
        case 'stable':
          this.stables.push(new Stable(def.x));
          break;
        case 'swing':
          this.swings.push(new Swing(def.x));
          break;
        case 'windmill':
          this.windmills.push(new Windmill(def.x));
          break;
        case 'dispenser':
          this.dispensers.push(new Dispenser(def.x));
          break;
        case 'vehicle':
          this.vehicles.push(new Vehicle(def.vehicle, def.x));
          break;
        case 'cornfield':
          this.cornfields.push(new CornField(def.x, def.width, def.clearing));
          this.fireflies.push(new Fireflies(def.x, def.width));
          break;
        case 'sunflowers':
          this.sunfields.push(new SunflowerField(def.x, def.width));
          break;
        case 'bush':
        case 'rock':
        case 'flowers':
          this.decor.push(new Decor(def.type, def.x, def.seed));
          break;
        case 'bird':
          this.birds.push(new Bird(def.x, def.color));
          break;
        case 'picnic':
          this.picnics.push(new Picnic(def.x, def.width));
          break;
        case 'lanterns':
          this.picnics.push(new Picnic(def.x, def.width, false, def.high));
          break;
        case 'basket':
          this.baskets.push(new Basket(def.x));
          break;
        case 'grill':
          this.grills.push(new Grill(def.x));
          break;
        case 'scarecrow': {
          const scarecrow = new Scarecrow(def.x);
          this.scarecrows.push(scarecrow);
          this.birds.push(...scarecrow.crows);
          break;
        }
        case 'owl':
          this.owls.push(new Owl(def.x, def.height));
          break;
        case 'bench':
          this.benches.push(new Bench(def.x));
          break;
        case 'boombox':
          this.boomboxes.push(new Boombox(def.x, def.style));
          break;
        case 'house':
          this.houses.push(new House(def.x, undefined, def.style));
          break;
        case 'coop':
          this.coops.push(new Coop(def.x));
          break;
        case 'mud':
          this.puddles.push(new Mud(def.x, def.width));
          break;
        case 'stall':
          this.stalls.push(new Stall(def.look, def.x));
          break;
        case 'columns':
          this.columns.push(new IceColumns(def.x));
          break;
        case 'cannon':
          this.cannons.push(new Cannon(def.x));
          break;
        case 'sledhill':
          this.hills.push(new SledHill(def.x));
          break;
        case 'rink':
          this.rinks.push(new Rink(def.x, def.width));
          break;
        case 'lamp':
          this.lamps.push(new StreetLamp(def.x));
          break;
        case 'pine':
          this.pines.push(new Pine(def.x, def.seed, def.garland, def.height));
          break;
        case 'lights':
          this.lightStrings.push(new LightString(def.x, def.width));
          break;
        case 'santachair':
          this.chairs.push(new SantaChair(def.x));
          break;
        case 'market':
          this.tables.push(new MarketTable(def.x));
          break;
        case 'decorbox':
          this.boxes.push(new DecorBox(def.x));
          break;
        case 'marshmallows':
          this.boxes.push(new DecorBox(def.x, 'marshmallows'));
          break;
        case 'nest':
          this.nests.push(new Nest(def.x));
          break;
        case 'hive':
          this.hives.push(new Hive(def.x));
          break;
        case 'butterflies':
          this.butterflies.push(new Butterflies(def.x, def.width));
          break;
        case 'carving':
          this.stations.push(new CarvingTable(def.x));
          break;
        case 'press':
          this.stations.push(new CiderPress(def.x));
          break;
        case 'campfire':
          this.stations.push(new Campfire(def.x));
          break;
        case 'mushrooms':
          this.mushrooms.push(new Mushrooms(def.x, def.seed));
          break;
        case 'leafpile':
        case 'log':
          this.decor.push(new Decor(def.type, def.x, def.seed));
          break;
        case 'eggs':
          this.boxes.push(new DecorBox(def.x, 'eggs'));
          break;
        case 'greenhouse':
          this.greenhouses.push(new Greenhouse(def.x));
          break;
        case 'bridge':
          this.bridges.push(new Bridge(def.x, def.width));
          break;
        case 'birdhouse':
          this.birdhouses.push(new Birdhouse(def.x));
          break;
        case 'ribbonpole':
          this.poles.push(new RibbonPole(def.x));
          break;
        case 'woodpile':
          this.woodpiles.push(new Woodpile(def.x));
          break;
        case 'slide':
          this.slides.push(new Slide(def.x));
          break;
        case 'seesaw':
          this.seesaws.push(new Seesaw(def.x));
          break;
        case 'carousel':
          this.carousels.push(new Carousel(def.x));
          break;
        case 'fountain':
          this.fountains.push(new Fountain(def.x));
          break;
        case 'chopblock':
          this.stations.push(new ChoppingBlock(def.x));
          break;
        case 'egghunt':
          this.eggHunts.push(new EggHunt(def.spots));
          break;
        case 'tent':
          this.tents.push(new Tent(def.x));
          break;
        case 'pumpkins':
          this.boxes.push(new DecorBox(def.x, 'pumpkins'));
          break;
        case 'lilypads':
          // Placed once the puddle under them exists.
          break;
        case 'stack':
          if (def.home) this.placeAtHome(def.items, def.x, def.depth, def.home);
          else this.standOnGround(def.items, def.x, def.depth);
          break;
        case 'animal':
        case 'toy':
          // Placed once everything they can sit in exists.
          break;
      }
    }
    this.iceCap = ICE_CAP + this.countKinds(isIce);
    for (const def of scene.objects) {
      if (def.type !== 'lilypads') continue;
      const pond = this.puddles.find((p) => Math.abs(this.delta(def.x, p.x)) < p.width / 2);
      if (pond) this.pads.push(new LilyPads(pond.x, pond.width, pond.surfaceY));
    }
    for (const def of scene.objects) {
      if (def.type === 'animal') {
        const kinds: ItemKind[] = def.hat ? [def.animal, def.hat] : [def.animal];
        this.keepers.push({ kind: def.animal, spawn: () => this.placeAtHome(kinds, def.x, def.depth, def.home, def.seat) });
      } else if ((def.type === 'bush' || def.type === 'leafpile' || def.type === 'log') && def.animal) {
        const kind = def.animal;
        this.keepers.push({ kind, spawn: () => this.placeAtHome([kind], def.x, GROUND_Y + 40, 'bush') });
      } else if (def.type === 'toy') {
        this.keepers.push({ kind: def.toy, spawn: () => this.placeAtHome([def.toy], def.x, def.depth, def.home, def.seat) });
      }
    }
    for (const giver of [...this.stalls, ...this.boxes, ...this.hives, ...this.woodpiles, ...this.baskets]) {
      this.offerSeats.push(new OfferSeat(giver, () => giver.offered(), () => giver.depth));
    }
    for (const vehicle of this.vehicles) {
      if (vehicle.offer) this.offerSeats.push(new OfferSeat(vehicle, () => vehicle.offered(), () => vehicle.depth));
    }
    for (const hunt of this.eggHunts) {
      hunt.spots.forEach((spot, i) => this.offerSeats.push(new OfferSeat(spot, () => hunt.offered(i), () => spot.depth)));
    }
    for (const keeper of this.keepers) keeper.spawn();
    this.setCamera(scene.start ?? 0);
  }

  // --- The loop round ----------------------------------------------------

  /** A position on the loop, from 0 up to the farm's width. */
  private wrap(x: number): number {
    return ((x % this.width) + this.width) % this.width;
  }

  /** The shortest way from `b` to `a` round the loop. */
  private delta(a: number, b: number): number {
    return this.wrap(a - b + this.width / 2) - this.width / 2;
  }

  // --- Setting up --------------------------------------------------------

  /** Put an animal or toy where it lives: on the ground, floating in the pond, in the coop, on a sill. */
  private placeAtHome(kinds: ItemKind[], x: number, depth: number, home?: Home, only?: number): void {
    const stack = this.standOnGround(kinds, x, depth);
    if (home === 'pond') {
      const puddle = this.puddles.find((p) => Math.abs(this.delta(x, p.x)) < p.width / 2);
      if (puddle) this.settleFloating(stack, puddle);
    } else if (home) {
      const homes: Record<string, Perch[]> = {
        coop: this.coops,
        bush: this.bushes,
        chair: this.chairs,
        bench: this.benches,
        table: this.tables,
        pads: this.pads,
        nest: this.nests,
        tent: this.tents,
        seesaw: this.seesaws,
      };
      const perches = homes[home] ?? this.houses;
      for (const perch of perches) {
        for (let seat = 0; seat < perch.seatCount; seat++) {
          if (Math.abs(this.delta(perch.seatX(seat), x)) > 300 || this.taken({ perch, seat })) continue;
          if (only !== undefined ? seat !== only : perch.accepts?.(seat, stack.items[0]) === false) continue;
          stack.state = 'anchored';
          stack.anchor = { perch, seat };
          ({ x: stack.x, top: stack.bottom } = anchorPoint(stack.anchor));
          return;
        }
      }
    }
  }

  private settleFloating(stack: Stack, sink: Sink): void {
    stack.floatingIn = sink;
    stack.state = 'resting';
    stack.x = sink.floatX(stack.x, stack.radius);
    stack.bottom = stack.floor = sink.floatBottom(stack.items[0].height);
  }

  private get walls(): (Barn | House)[] {
    return [...this.barns, ...this.houses];
  }

  /** Nothing stands behind a front wall unless it went into the barn through the doors. */
  private clearOfWalls(stack: Stack, mayBeInside: boolean): void {
    for (const barn of this.barns) if (mayBeInside && barn.isInside(stack.x, stack.floor)) return;
    for (const wall of this.walls) {
      if (wall.behindWall(stack.x, stack.floor)) stack.floor = stack.bottom = (wall instanceof House ? wall.frontDepth : wall.depth) + 2;
    }
  }

  /** Is the stack shut away, out of sight and reach: behind a barn door or a closed shutter? */
  private hidden(stack: Stack): boolean {
    const a = stack.anchor;
    if (a && 'perch' in a) return !!a.perch.hides?.(a.seat);
    return stack.state === 'resting' && this.barns.some((b) => b.isInside(stack.x, stack.floor) && b.covered(stack.x));
  }

  private standOnGround(kinds: ItemKind[], x: number, floor: number): Stack {
    const items = kinds.map((kind) => new Item(kind));
    const stack = new Stack(items, this.wrap(x), floor);
    stack.state = 'resting';
    stack.floor = floor;
    this.stacks.push(stack);
    return stack;
  }

  /** Puddles first, then bins: saves refer to them by this order. */
  private get sinks(): Sink[] {
    return [...this.puddles, ...this.bins];
  }

  /** Everywhere a stack can sit and move with; saves refer to them by this order. */
  private get perches(): Perch[] {
    return [
      ...this.vehicles,
      ...this.swings,
      ...this.grills,
      ...this.coops,
      ...this.houses,
      ...this.benches,
      ...this.bushes,
      ...this.scarecrows,
      ...this.columns,
      ...this.hills,
      ...this.pines,
      ...this.chairs,
      ...this.tables,
      ...this.nests,
      ...this.pads,
      ...this.stations,
      ...this.greenhouses,
      ...this.bridges,
      ...this.woodpiles,
      ...this.slides,
      ...this.seesaws,
      ...this.carousels,
      ...this.tents,
      ...this.offerSeats,
    ];
  }

  private get bushes(): Decor[] {
    return this.decor.filter((d) => d.kind === 'bush' || d.kind === 'leafpile' || d.kind === 'log');
  }

  // --- Saving ------------------------------------------------------------

  /** The scene as it would be once everything settles: carried and falling things are put down. */
  snapshot(): Saved {
    const stacks: SavedStack[] = [];
    for (const stack of this.stacks) {
      let items = stack.items;
      const water = stack.drowningIn ?? stack.floatingIn;
      // Drowning food is gone already; an animal in it floats with whatever it carries.
      if (stack.drowningIn) items = items.slice(Math.max(0, items.findIndex((i) => !i.disposable)));
      if (stack.drowningIn && items.every((i) => i.disposable)) continue;
      const saved: SavedStack = { items: items.map((i) => i.kind), x: stack.x, floor: stack.floor };
      const a = stack.anchor;
      if (water) saved.puddle = this.sinks.indexOf(water);
      else if (a && 'slot' in a) saved.tree = [this.trees.indexOf(a.tree), a.tree.slots.indexOf(a.slot)];
      else if (a && 'plot' in a) saved.bed = [this.beds.indexOf(a.bed), a.bed.plots.indexOf(a.plot)];
      else if (a) saved.perch = [this.perches.indexOf(a.perch), a.seat];
      else if (stack.state === 'held') saved.floor = stack.bottom >= GROUND_BAND ? stack.bottom : FALL_FLOOR;
      else if (stack.state === 'falling') saved.floor = this.landingFloor(stack);
      const onIce = this.rinks.some((r) => r.holds(r.x + this.delta(stack.x, r.x), saved.floor));
      if (!onIce) saved.floor = Math.min(FRONT_FLOOR, Math.max(GROUND_Y, saved.floor));
      stacks.push(saved);
    }
    return {
      version: 1,
      layout: this.layout,
      camX: this.camX,
      night: this.sky.toNight,
      stacks,
      trees: this.trees.map((t) => t.slots.map((s) => s.growth)),
      beds: this.beds.map((b) => b.plots.map((p) => ({ kind: p.kind, growth: p.growth }))),
      clouds: this.clouds.map((c) => [c.x, c.y]),
      vehicles: this.vehicles.map((v) => v.x),
      barns: this.barns.map((b) => [...b.slide]),
      dispensers: this.dispensers.map((d) => d.next),
      baskets: this.baskets.map((b) => b.turn),
      stalls: this.stalls.map((st) => st.turn),
      offers: this.vehicles.map((v) => v.offer?.turn ?? 0),
      songs: this.boomboxes.map((b) => b.song),
      windows: this.houses.map((h) => [...h.isOpen]),
      doors: this.houses.map((h) => h.doorOpen),
      eggs: this.eggHunts.map((h) => h.snapshot()),
    };
  }

  /** Open the farm as it was saved. Animals and toys are never lost, even from a save of another layout. */
  restore(saved: Saved): void {
    const sameLayout = saved.layout === this.layout;
    if (sameLayout) {
      saved.vehicles?.forEach((x, i) => this.vehicles[i]?.moveTo(x, 0));
      saved.barns?.forEach((slide, i) => {
        const barn = this.barns[i];
        if (!barn || !Array.isArray(slide)) return;
        barn.drag(0, slide[0]);
        barn.drag(1, slide[1]);
      });
      saved.dispensers?.forEach((next, i) => {
        const d = this.dispensers[i];
        if (d) d.next = next;
      });
      saved.baskets?.forEach((turn, i) => {
        const b = this.baskets[i];
        if (b) b.turn = turn;
      });
      saved.stalls?.forEach((turn, i) => {
        const st = this.stalls[i];
        if (st) st.turn = turn;
      });
      saved.offers?.forEach((turn, i) => {
        const offer = this.vehicles[i]?.offer;
        if (offer) offer.turn = turn;
      });
      saved.eggs?.forEach((present, i) => this.eggHunts[i]?.restore(present));
      saved.songs?.forEach((song, i) => {
        const b = this.boomboxes[i];
        if (b) b.song = song;
      });
      saved.doors?.forEach((open, i) => {
        const house = this.houses[i];
        if (house && open !== house.doorOpen) house.toggleDoor();
        house?.update(10);
      });
      saved.windows?.forEach((open, i) => {
        const house = this.houses[i];
        if (!house) return;
        house.isOpen.forEach((_, w) => {
          house.isOpen[w] = !!open[w];
          house.open[w] = open[w] ? 1 : 0;
        });
      });
    }
    this.stacks = [];
    for (const s of saved.stacks) {
      if (!s.items.length) continue;
      const stack = this.standOnGround(s.items, s.x, s.floor);
      const sink = s.puddle !== undefined ? this.sinks[s.puddle] : undefined;
      const perch = sameLayout && s.perch ? this.perches[s.perch[0]] : undefined;
      const tree = sameLayout && s.tree ? this.trees[s.tree[0]] : undefined;
      const slot = tree?.slots[s.tree![1]];
      const bed = sameLayout && s.bed ? this.beds[s.bed[0]] : undefined;
      const plot = bed?.plots[s.bed![1]];
      if (sink && sameLayout) {
        this.settleFloating(stack, sink);
      } else if (tree && slot) {
        stack.state = 'anchored';
        stack.anchor = { tree, slot };
      } else if (bed && plot && plot.growth >= 1) {
        stack.state = 'anchored';
        stack.anchor = { bed, plot };
      } else if (perch && s.perch![1] < perch.seatCount) {
        stack.state = 'anchored';
        stack.anchor = { perch, seat: s.perch![1] };
      } else if (s.puddle !== undefined || s.tree || s.bed || s.perch) {
        // Its place is gone in the new layout: it stands on the ground instead.
        stack.bottom = stack.floor = FALL_FLOOR;
      }
      if (stack.anchor) ({ x: stack.x, top: stack.bottom } = anchorPoint(stack.anchor));
      else if (!stack.floatingIn) this.clearOfWalls(stack, sameLayout);
    }
    if (sameLayout) {
      saved.trees.forEach((growths, t) =>
        growths.forEach((growth, i) => {
          const slot = this.trees[t]?.slots[i];
          if (slot) slot.growth = growth;
        }),
      );
      saved.beds.forEach((plots, b) =>
        plots.forEach((p, i) => {
          const plot = this.beds[b]?.plots[i];
          if (plot) Object.assign(plot, p);
        }),
      );
      saved.clouds.forEach(([x, y], i) => {
        const cloud = this.clouds[i];
        if (cloud) Object.assign(cloud, { x: Math.max(cloud.minX, Math.min(cloud.maxX, x)), y });
      });
    }
    // Every animal and toy of the scene is there: any the save does not have (a new one) is put at home.
    const have: ItemKind[] = this.stacks.flatMap((s) => s.items.map((i) => i.kind));
    for (const keeper of this.keepers) {
      const i = have.indexOf(keeper.kind);
      if (i >= 0) have.splice(i, 1);
      else keeper.spawn();
    }
    this.sky.setNight(saved.night);
    this.setCamera(saved.camX);
  }

  resize(cssW: number, cssH: number): void {
    this.scale = Math.min(cssW / SCREEN_W, cssH / WORLD_H) * VIEW_ZOOM;
    this.viewW = cssW / this.scale;
    this.viewH = cssH / this.scale;
    this.camY = WORLD_H - this.viewH;
    // Clouds keep clear of the top of the view.
    for (const cloud of this.clouds) cloud.y = Math.max(cloud.y, this.camY + CLOUD_TOP);
    this.setCamera(this.camX);
  }

  /** Move the view. The farm loops, so there is no end to stop at. */
  private setCamera(x: number): void {
    this.camTravel += x - this.camX;
    this.camX = this.wrap(x);
    this.sky.setView(this.camX, this.viewW, this.camY);
  }

  /** A point on screen, in world units on the loop. */
  private toWorld(cssX: number, cssY: number): { x: number; y: number } {
    return { x: this.wrap(cssX / this.scale + this.camX), y: cssY / this.scale + this.camY };
  }

  // --- Input -------------------------------------------------------------

  pointerDown(id: number, cssX: number, cssY: number): void {
    const p = this.toWorld(cssX, cssY);
    // A finger on a vehicle never reaches through it to what stands behind.
    const front = this.vehicles.find((v) => v.hits(p.x, p.y, 0));
    const behind = (depth: number) => !!front && depth < front.depth;

    let best: { stack: Stack; index: number } | null = null;
    let bestDist = Infinity;
    for (const stack of this.stacks) {
      if (this.hidden(stack) || behind(this.depthOf(stack))) continue;
      stack.shown().forEach((shown, index) => {
        // From a tower another finger is carrying, a second finger can take the top part off.
        if (stack.state === 'held' && index === 0) return;
        const d = Math.hypot(this.delta(p.x, shown.x), p.y - shown.y);
        if (d <= shown.item.reach + GRAB_SLOP && d < bestDist) {
          best = { stack, index };
          bestDist = d;
        }
      });
    }

    // Things to pick that grow back: the nearest wins, against stacks too.
    let pickup: (() => Stack) | null = null;
    const offer = (dist: number, take: () => Stack, depth: number) => {
      if (dist >= bestDist || behind(depth)) return;
      bestDist = dist;
      best = null;
      pickup = take;
    };
    for (const tree of this.trees) {
      const hit = tree.slotAt(p.x, p.y, GRAB_SLOP);
      if (hit) offer(hit.dist, () => this.pick(tree, hit.slot), -Infinity);
    }
    for (const barn of this.barns) {
      const hit = barn.hayAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickHay(barn, hit.bale), barn.depth);
    }
    for (const bed of this.beds) {
      const hit = bed.plotAt(p.x, p.y, GRAB_SLOP);
      if (hit) offer(hit.dist, () => this.pickVeg(bed, hit.plot), bed.depth);
    }
    for (const basket of this.baskets) {
      const hit = basket.treatAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickTreat(basket), basket.depth);
    }
    for (const field of this.cornfields) {
      const hit = field.cobAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickCorn(field, hit.cob), field.depth);
    }
    for (const stall of this.stalls) {
      const hit = stall.offerAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickFrom(stall.take(), stall), stall.depth);
    }
    for (const vehicle of this.vehicles) {
      const hit = vehicle.offerAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickFrom(vehicle.take(), vehicle), Infinity);
    }
    for (const box of this.boxes) {
      const hit = box.offerAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickFrom(box.take(), box), box.depth);
    }
    for (const hive of this.hives) {
      const hit = hive.offerAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickFrom(hive.take(), hive), hive.depth);
    }
    for (const pile of this.woodpiles) {
      const hit = pile.offerAt(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => this.pickFrom(pile.take(), pile), pile.depth);
    }
    for (const hunt of this.eggHunts) {
      const hit = hunt.at(p.x, p.y, GRAB_SLOP / 2);
      if (hit) offer(hit.dist, () => {
        audio.eggPop();
        return this.pickFrom(hunt.take(hit.spot), hunt.spots[hit.spot]);
      }, hunt.spots[hit.spot].depth);
    }

    const cloud = this.clouds.find((c) => c.hits(p.x, p.y, GRAB_SLOP) && !c.raining);
    const door = this.barns.map((barn) => ({ barn, side: barn.doorAt(p.x, p.y, 10) })).find((d) => d.side !== null);
    const sails = this.windmills.find((w) => w.hitsSails(p.x, p.y, 10));
    const driven = new Set([...this.vehicleHolds.values()].map((h) => h.vehicle));
    const vehicle = this.vehicles.find((v) => v.hits(p.x, p.y, 0) && !driven.has(v));
    const held = new Set([...this.cannonHolds.values()].map((h) => h.cannon));
    const cannon = this.cannons.find((c) => c.hits(p.x, p.y, 10) && !held.has(c));
    const take = pickup as (() => Stack) | null;
    if (take) {
      this.grab(id, take(), p);
    } else if (best) {
      const { stack, index } = best as { stack: Stack; index: number };
      const a = stack.anchor;
      const onSwing = a && 'perch' in a && a.perch instanceof Swing;
      if (onSwing || isLight(stack.items[index].kind)) this.riderTouches.set(id, { stack, index, point: p, startX: cssX, startY: cssY });
      else this.grab(id, index === 0 ? stack : this.split(stack, index), p);
    } else if (door) {
      const side = door.side!;
      this.doorHolds.set(id, { barn: door.barn, side, startSlide: door.barn.slide[side], startWorldX: p.x, cssX, startX: cssX, moved: 0 });
    } else if (sails) {
      sails.grab(p.x, p.y);
      this.turnHolds.set(id, { windmill: sails, cssX, cssY, startX: cssX, startY: cssY, moved: 0 });
    } else if (cannon) {
      // Pressed: a snowball grows in its mouth, unless enough are out already.
      if (this.countKinds(isSnowball) >= SNOWBALL_CAP) audio.boop();
      else {
        cannon.press();
        audio.cannonCharge(true);
        this.cannonHolds.set(id, { cannon, cssX, cssY, startX: cssX, startY: cssY, moved: 0 });
      }
    } else if (vehicle) {
      this.vehicleHolds.set(id, { vehicle, cssX, startX: cssX, dx: this.delta(vehicle.x, p.x), moved: 0 });
    } else if (cloud) {
      // Holding the cloud makes it rain.
      cloud.raining = true;
      this.cloudHolds.set(id, { cloud, cssX, cssY, dx: cloud.x - p.x, dy: cloud.y - p.y });
      audio.setRain(true);
    } else if (this.sky.hits(cssX / this.scale + this.camX, p.y, GRAB_SLOP)) {
      this.sky.toggle();
    } else {
      // Empty ground, sky or a structure: a drag moves the world, a tap goes to what is there.
      this.camVx = 0;
      this.pans.set(id, { cssX, cssY, speed: 0, startX: cssX, startY: cssY, moved: 0 });
    }
  }

  /** A tap on a structure or scenery: each does its own small thing. */
  private tap(p: { x: number; y: number }): void {
    const swing = this.swings.find((s) => s.hits(p.x, p.y, GRAB_SLOP));
    if (swing) {
      swing.push(p.x);
      audio.swoosh();
      return;
    }
    const dispenser = this.dispensers.find((d) => d.hits(p.x, p.y, 10));
    if (dispenser) return this.dispense(dispenser);
    const boombox = this.boomboxes.find((b) => b.hits(p.x, p.y, 10));
    if (boombox) {
      // Only one song at a time on the whole farm.
      for (const other of this.boomboxes) if (other !== boombox) other.song = 0;
      audio.shutter();
      audio.playSong(boombox.tap());
      return;
    }
    for (const house of this.houses) {
      const bulb = house.bulbAt(p.x, p.y, 6);
      if (bulb >= 0) return audio.lantern(house.toggleBulb(bulb));
      const lamp = house.lampAt(p.x, p.y, 6);
      if (lamp !== null) {
        audio.lantern(house.toggleLamp(lamp));
        return;
      }
      if (house.chimneyAt(p.x, p.y, 10)) {
        audio.puff(house.toggleSmoke());
        return;
      }
      if (house.doorAt(p.x, p.y, 6)) {
        audio.creak(house.toggleDoor());
        this.greet(house, 4);
        return;
      }
      const w = house.windowAt(p.x, p.y, 10);
      if (w === null) continue;
      house.toggle(w);
      audio.shutter();
      if (house.isOpen[w]) this.greet(house, w);
      return;
    }
    const lamp = this.lamps.find((l) => l.hits(p.x, p.y, 10));
    if (lamp) return audio.lantern(lamp.toggle());
    const hill = this.hills.find((h) => h.hits(p.x, p.y, 10));
    if (hill) {
      if (hill.push()) audio.whee();
      return;
    }
    const pine = this.pines.find((t) => t.hits(p.x, p.y, 10));
    if (pine) {
      // A tree with lights switches them; a plain one shakes off some snow.
      if (pine.garland) return audio.lantern(pine.toggleLights());
      pine.tap();
      return audio.crunch(0.2);
    }
    const lights = this.lightStrings.find((c) => c.hits(p.x, p.y, 10));
    if (lights) return audio.lantern(lights.tap(p.x, p.y));
    const stall = this.stalls.find((st) => st.hits(p.x, p.y, 0));
    if (stall) return audio.lantern(stall.toggleLights());
    const owl = this.owls.find((o) => o.hits(p.x, p.y, 10));
    if (owl) return audio.hoot(owl.tap(this.sky.night > 0.5));
    const bird = this.birds.find((b) => b.hits(p.x, p.y, GRAB_SLOP));
    if (bird) return bird.scare();
    const scarecrow = this.scarecrows.find((s) => s.hits(p.x, p.y, 10));
    if (scarecrow) return scarecrow.tap();
    if (this.sunfields.some((f) => f.tap(p.x, p.y, 10))) return;
    for (const picnic of this.picnics) {
      const lantern = picnic.lanternAt(p.x, p.y, 8);
      if (lantern === null) continue;
      audio.lantern(picnic.toggle(lantern));
      return;
    }
    const windmill = this.windmills.find((w) => w.hits(p.x, p.y, 10));
    if (windmill) {
      windmill.push();
      audio.whoosh();
      return;
    }
    for (const m of this.mushrooms) {
      const i = m.tapAt(p.x, p.y, 10);
      if (i >= 0) return audio.boing(i);
    }
    const carousel = this.carousels.find((c) => c.hits(p.x, p.y, 10));
    if (carousel) {
      carousel.tap();
      return audio.whee();
    }
    const seesaw = this.seesaws.find((sw) => sw.hits(p.x, p.y, 10));
    if (seesaw) {
      seesaw.tap();
      return audio.swoosh();
    }
    const fountain = this.fountains.find((f) => f.hits(p.x, p.y, 10));
    if (fountain) {
      fountain.tap();
      return audio.plop(0.4);
    }
    const tent = this.tents.find((tn) => tn.hits(p.x, p.y, 10));
    if (tent) {
      audio.shutter();
      if (tent.toggle()) this.greet(tent, 0);
      return;
    }
    const birdhouse = this.birdhouses.find((b) => b.hits(p.x, p.y, 10));
    if (birdhouse) {
      birdhouse.tap();
      return audio.animal('chick');
    }
    const pole = this.poles.find((pl) => pl.hits(p.x, p.y, 10));
    if (pole) {
      pole.tap();
      return audio.swoosh();
    }
    const hive = this.hives.find((h) => h.hits(p.x, p.y, 10));
    if (hive) {
      if (!hive.out) audio.bees();
      return hive.tap();
    }
    const fire = this.stations.find((st): st is Campfire => st instanceof Campfire && st.hits(p.x, p.y, 10));
    if (fire) {
      if (fire.toggle()) audio.crackle();
      else audio.puff(false);
      return;
    }
    for (const pads of this.pads) {
      const i = pads.padAt(p.x, p.y, 10);
      if (i < 0) continue;
      pads.bob(i);
      this.puddles.find((pd) => pd.x === pads.x)?.tap(p.x);
      return audio.plop(0.25);
    }
    const puddle = this.puddles.find((pd) => pd.holds(p.x, p.y));
    if (puddle) {
      puddle.tap(p.x);
      audio.plop(0.25);
      return;
    }
    const decor = this.decor.find((d) => d.hits(p.x, p.y, 10));
    if (!decor) return;
    if (decor.kind !== 'bush' && decor.kind !== 'leafpile' && decor.kind !== 'log') return decor.tap();
    if (decor.kind !== 'bush') audio.leaves();
    // A few shakes of a bush bring out whatever hides in it.
    const hiding = this.stacks.find((s) => s.anchor && 'perch' in s.anchor && s.anchor.perch === decor);
    if (decor.shake() && hiding) this.comeOut(hiding, decor);
  }

  /** An animal hops out of its bush, toward the middle of the screen. */
  private comeOut(stack: Stack, bush: Decor): void {
    const toward = this.delta(this.camX + this.viewW / 2, bush.x) >= 0 ? 1 : -1;
    stack.anchor = null;
    stack.state = 'falling';
    stack.x = this.wrap(bush.x + toward * 20);
    stack.bottom = GROUND_Y - 30;
    stack.vx = toward * 130;
    stack.vy = -420;
    stack.fixedFloor = GROUND_Y + 40;
    for (const item of stack.items) item.wake();
    const animal = stack.items.find((i) => i.animal)?.animal;
    if (animal) audio.animal(animal);
  }

  /** Opening a window or door: an animal waiting behind it says hello. */
  private greet(perch: Perch, seat: number): void {
    const stack = this.stacks.find((s) => s.anchor && 'perch' in s.anchor && s.anchor.perch === perch && s.anchor.seat === seat);
    const animal = stack?.items.find((i) => i.animal);
    if (!animal) return;
    animal.wake();
    audio.animal(animal.animal!);
  }

  /** How many of each thing that comes back are out in the world (carried, stacked or lying about). */
  private countOut(): { fruit: Map<string, number>; veg: number; hay: number; hats: number; treats: number; eggs: number; flour: number } {
    const out = { fruit: new Map<string, number>(), veg: 0, hay: 0, hats: 0, treats: 0, eggs: 0, flour: 0 };
    for (const stack of this.stacks) {
      for (const { kind } of stack.items) {
        if (isFruit(kind)) out.fruit.set(kind, (out.fruit.get(kind) ?? 0) + 1);
        else if (isVeg(kind)) out.veg++;
        else if (kind === 'hay') out.hay++;
        else if (kind === 'egg') out.eggs++;
        else if (kind === 'flour') out.flour++;
        else if (isHat(kind)) out.hats++;
        else if ((TREATS as string[]).includes(kind)) out.treats++;
      }
    }
    return out;
  }

  /** A hat slides out of the machine, unless enough are out already. */
  private dispense(dispenser: Dispenser): void {
    const hats = this.countOut().hats;
    if (hats >= HAT_CAP) {
      dispenser.pressEmpty();
      audio.boop();
      return;
    }
    const { kind, x, bottom } = dispenser.dispense();
    const stack = new Stack([new Item(kind)], x, bottom);
    // Each new hat slides a little further out and lands in front of the ones already there.
    stack.vx = 110 + 50 * (hats % 8);
    stack.vy = -120;
    this.stacks.push(stack);
    audio.clunk();
  }

  pointerMove(id: number, cssX: number, cssY: number): void {
    const hold = this.holds.get(id);
    if (hold) {
      hold.cssX = cssX;
      hold.cssY = cssY;
    }
    const cloudHold = this.cloudHolds.get(id);
    if (cloudHold) {
      cloudHold.cssX = cssX;
      cloudHold.cssY = cssY;
    }
    const rider = this.riderTouches.get(id);
    if (rider && Math.hypot(cssX - rider.startX, cssY - rider.startY) >= TAP_SLOP) {
      this.riderTouches.delete(id);
      const { stack, index } = rider;
      if (this.stacks.includes(stack) && index < stack.items.length) {
        this.grab(id, index === 0 ? stack : this.split(stack, index), rider.point);
        const grabbed = this.holds.get(id)!;
        grabbed.cssX = cssX;
        grabbed.cssY = cssY;
      }
    }
    const doorHold = this.doorHolds.get(id);
    if (doorHold) {
      doorHold.cssX = cssX;
      doorHold.moved = Math.max(doorHold.moved, Math.abs(cssX - doorHold.startX));
    }
    const turn = this.turnHolds.get(id);
    if (turn) {
      turn.cssX = cssX;
      turn.cssY = cssY;
      turn.moved = Math.max(turn.moved, Math.hypot(cssX - turn.startX, cssY - turn.startY));
    }
    const aim = this.cannonHolds.get(id);
    if (aim) {
      aim.cssX = cssX;
      aim.cssY = cssY;
      aim.moved = Math.max(aim.moved, Math.hypot(cssX - aim.startX, cssY - aim.startY));
    }
    const drive = this.vehicleHolds.get(id);
    if (drive) {
      drive.moved = Math.max(drive.moved, Math.abs(cssX - drive.startX));
      drive.cssX = cssX;
    }
    const pan = this.pans.get(id);
    if (pan) {
      pan.moved = Math.max(pan.moved, Math.hypot(cssX - pan.startX, cssY - pan.startY));
      pan.cssY = cssY;
      const dx = (cssX - pan.cssX) / this.scale;
      pan.cssX = cssX;
      this.setCamera(this.camX - dx);
      pan.speed = pan.speed * 0.6 + (-dx / STEP) * 0.4;
    }
  }

  /** Back to the hub: every finger lets go where it is, and the level's looping sounds stop. */
  leave(): void {
    const ids = new Set<number>();
    for (const map of [this.holds, this.pans, this.cloudHolds, this.doorHolds, this.vehicleHolds, this.turnHolds, this.riderTouches, this.cannonHolds]) {
      for (const id of map.keys()) ids.add(id);
    }
    for (const id of ids) this.pointerUp(id);
    audio.setRain(false);
    audio.setMotor(false);
    audio.playSong(0);
  }

  /** Into the level: a playing boombox (the first song, to begin with) starts its song. */
  resume(): void {
    audio.playSong(this.boomboxes.find((b) => b.song > 0)?.song ?? 0);
  }

  pointerUp(id: number): void {
    const cloudHold = this.cloudHolds.get(id);
    if (cloudHold) {
      this.cloudHolds.delete(id);
      cloudHold.cloud.raining = false;
      audio.setRain(this.clouds.some((c) => c.raining));
    }
    const rider = this.riderTouches.get(id);
    if (rider) {
      this.riderTouches.delete(id);
      const a = rider.stack.anchor;
      const item = rider.stack.items[rider.index];
      if (item && isLight(item.kind)) {
        item.lit = !item.lit;
        audio.lantern(item.lit);
      } else if (a && 'perch' in a && a.perch instanceof Swing) {
        a.perch.push(rider.point.x);
        audio.swoosh();
      }
    }
    const doorHold = this.doorHolds.get(id);
    if (doorHold) {
      this.doorHolds.delete(id);
      if (doorHold.moved < TAP_SLOP) audio.creak(doorHold.barn.toggle(doorHold.side));
    }
    const turn = this.turnHolds.get(id);
    if (turn) {
      this.turnHolds.delete(id);
      turn.windmill.letGo();
      if (turn.moved < TAP_SLOP) {
        turn.windmill.push();
        audio.whoosh();
      }
    }
    const drive = this.vehicleHolds.get(id);
    if (drive) {
      this.vehicleHolds.delete(id);
      const { vehicle } = drive;
      if (drive.moved < TAP_SLOP) {
        if (vehicle.kind === 'sleigh') audio.jingle();
        else audio.honk(vehicle.kind === 'tractor' || vehicle.kind === 'plough');
      }
      // The plough leaves its snowball in front of the blade.
      const ball = vehicle.dropBall();
      if (ball) {
        const stack = new Stack([new Item(ball.kind)], ball.x, ball.bottom);
        stack.state = 'resting';
        stack.floor = ball.bottom;
        this.stacks.push(stack);
        audio.crunch(1);
      }
    }
    const cannonHold = this.cannonHolds.get(id);
    if (cannonHold) {
      this.cannonHolds.delete(id);
      audio.cannonCharge(false);
      const shot = cannonHold.cannon.fire();
      const ball = new Stack([new Item(shot.kind)], shot.x, shot.bottom);
      ball.vx = shot.vx;
      ball.vy = shot.vy;
      this.stacks.push(ball);
      audio.cannonFire(SNOWBALLS.indexOf(shot.kind) / (SNOWBALLS.length - 1));
    }
    const pan = this.pans.get(id);
    if (pan) {
      this.pans.delete(id);
      if (pan.moved < TAP_SLOP) this.tap(this.toWorld(pan.startX, pan.startY));
      else if (!settings.reduceMotion) this.camVx = Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, pan.speed));
    }
    const hold = this.holds.get(id);
    if (!hold) return;
    this.holds.delete(id);
    this.release(hold.stack);
  }

  /** Pulling a ripe vegetable out of its bed also takes any tower resting on it. */
  private pickVeg(bed: Bed, plot: Plot): Stack {
    const item = new Item(plot.kind);
    const resting = this.restingOn(plot);
    const y = bed.pick(plot);
    return this.picked(item, resting, plot.x, y + item.height / 2);
  }

  private pickCorn(field: CornField, cob: Cob): Stack {
    const item = new Item('corn');
    field.pick(cob);
    return this.picked(item, undefined, cob.x + 12, cob.y + item.height / 2);
  }

  /** Take the treat sitting on top of the picnic basket. */
  private pickTreat(basket: Basket): Stack {
    return this.pickFrom(basket.take(), basket);
  }

  /** Take what a stall or a vehicle offers: a candle, a gift, a parcel... and any tower stacked on it. */
  private pickFrom({ kind, x, bottom }: { kind: ItemKind; x: number; bottom: number }, giver: object): Stack {
    const seat = this.offerSeats.find((s) => s.owner === giver);
    const resting = this.stacks.find((s) => s.anchor && 'perch' in s.anchor && s.anchor.perch === seat);
    return this.picked(new Item(kind), resting, x, bottom);
  }

  /** Take a bale of hay from the barn floor. */
  private pickHay(barn: Barn, bale: HayBale): Stack {
    const item = new Item('hay');
    barn.takeHay(bale);
    return this.picked(item, undefined, bale.x, barn.insideFloor);
  }

  /** Taking a fruit off the tree also takes any tower resting on it. */
  private pick(tree: Tree, slot: Slot): Stack {
    const item = new Item(tree.fruit);
    const resting = this.restingOn(slot);
    tree.pick(slot);
    return this.picked(item, resting, slot.x, slot.y + item.height / 2);
  }

  private restingOn(spot: Slot | Plot): Stack | undefined {
    return this.stacks.find((s) => s.anchor && ('slot' in s.anchor ? s.anchor.slot : 'plot' in s.anchor ? s.anchor.plot : null) === spot);
  }

  private taken(anchor: Anchor): boolean {
    return this.stacks.some((s) => s.anchor && sameSpot(s.anchor, anchor));
  }

  private picked(item: Item, resting: Stack | undefined, x: number, bottom: number): Stack {
    audio.pop();
    const stack = new Stack([item, ...(resting?.items ?? [])], x, bottom);
    if (resting) {
      stack.continueFrom(resting);
      this.removeStack(resting);
    }
    this.stacks.push(stack);
    return stack;
  }

  private grab(id: number, stack: Stack, p: { x: number; y: number }): void {
    stack.state = 'held';
    stack.anchor = null;
    stack.drowningIn = null;
    stack.floatingIn = null;
    for (const item of stack.items) {
      item.wake();
      item.lift();
    }
    const animal = stack.items.find((i) => i.animal)?.animal;
    if (animal) audio.animal(animal);
    const css = { x: this.wrap(p.x - this.camX) * this.scale, y: (p.y - this.camY) * this.scale };
    this.holds.set(id, { stack, cssX: css.x, cssY: css.y, dx: this.delta(stack.x, p.x), dy: stack.bottom - p.y });
  }

  /** Grabbing above the bottom splits the tower: that item and all above come away. */
  private split(stack: Stack, index: number): Stack {
    const upper = new Stack(stack.items.splice(index), stack.x, stack.bottomOf(index));
    upper.continueFrom(stack);
    this.stacks.push(upper);
    return upper;
  }

  /**
   * Letting go: placed gently on a tower, a fruit or a seat it sticks there,
   * placed on water it drowns. Otherwise it stays at that depth if let go low
   * on the ground, or falls from the air onto the ground in front.
   */
  private release(stack: Stack): void {
    const speed = Math.hypot(stack.vx, stack.vy);
    if (speed < PLACE_SPEED) {
      const eater = this.mouthFor(stack);
      if (eater && eater.dist <= stack.items[0].radius + EAT_DIST) return this.feed(eater.item, stack);
      // On a pine's branches, a free spot and the top of something already hanging there can both
      // be in reach: it goes to whichever is nearer.
      const target = this.towerUnder(stack);
      const branch = this.seatUnder(stack);
      if (branch && 'perch' in branch && branch.perch instanceof Pine) {
        const toSpot = Math.hypot(this.delta(stack.x, branch.perch.seatX(branch.seat)), stack.bottom - branch.perch.seatTop(branch.seat));
        const toTop = target ? Math.hypot(this.delta(stack.x, target.x), stack.bottom - (target.bottom - target.height)) : Infinity;
        if (toSpot < toTop) return this.rest(stack, branch);
      }
      if (target) return this.glue(target, stack);
      const beside = this.iceBeside(stack);
      if (beside) return this.buildBeside(stack, beside);
      const anchor = this.fruitUnder(stack) ?? this.vegUnder(stack) ?? this.seatUnder(stack);
      if (anchor) return this.rest(stack, anchor);
      const bed = this.beds.find((b) => b.freePlotAt(stack.x, stack.bottom));
      const bottom = stack.items[0];
      if (bed && isVeg(bottom.kind)) return this.plant(bed, stack);
      const sink = this.sinks.find((p) => p.holds(stack.x, stack.bottom));
      if (sink) return this.intoSink(stack, sink);
      const barn = this.barns.find((b) => b.takesIn(stack.x, stack.bottom));
      if (barn) {
        stack.x = barn.insideX(stack.x, stack.radius);
        stack.fixedFloor = barn.insideFloor;
        stack.vx = stack.vy = 0;
        stack.state = 'falling';
        return;
      }
    } else {
      const k = MAX_RELEASE_SPEED / speed;
      if (k < 1) {
        stack.vx *= k;
        stack.vy *= k;
      }
    }
    this.drop(stack);
  }

  /** Let go somewhere plain: low on the ground it stays at that depth, in the air it falls in front. */
  private drop(stack: Stack): void {
    // Let go over the raised rink, it stands on the ice there.
    const rink = this.rinks.find((r) => r.holds(r.x + this.delta(stack.x, r.x), stack.bottom));
    if (rink) {
      stack.fixedFloor = stack.bottom;
      stack.state = 'falling';
      return;
    }
    let floor = stack.bottom >= GROUND_BAND ? Math.min(FRONT_FLOOR, Math.max(GROUND_Y, stack.bottom)) : null;
    // Never behind a front wall: into the barn only through the doors.
    for (const wall of this.walls) {
      const front = wall instanceof House ? wall.frontDepth : wall.depth;
      if (floor !== null && wall.behindWall(stack.x, floor)) floor = front + 2;
    }
    // Nor out of sight behind a tall stall or Santa's chair: it stands just in front.
    for (const tall of [...this.stalls, ...this.chairs]) {
      const front = tall instanceof SantaChair ? tall.frontDepth : tall.depth;
      if (floor !== null && floor < front + 2 && Math.abs(this.delta(stack.x, tall.x)) < tall.half + stack.radius * 0.5) floor = front + 2;
    }
    stack.fixedFloor = floor;
    stack.state = 'falling';
  }

  /** Into the water or the bin: what comes back goes under one by one, an animal or toy floats or sits. */
  private intoSink(stack: Stack, sink: Sink): void {
    if (!stack.items[0].disposable) return this.float(stack, sink);
    stack.drowningIn = sink;
    stack.fixedFloor = sink.drownY;
    if (sink instanceof Bin) stack.x = sink.floatX(stack.x, 0);
    stack.vx = stack.vy = 0;
    stack.state = 'falling';
  }

  /** An animal or toy at the bottom of a stack floats on the water, slightly sunk in, or sits on a bin. */
  private float(stack: Stack, sink: Sink): void {
    stack.floatingIn = sink;
    stack.drowningIn = null;
    stack.fixedFloor = sink.floatBottom(stack.items[0].height);
    stack.vx = stack.vy = 0;
    stack.state = 'falling';
  }

  /** The animal whose mouth is nearest to the food being held, if close enough. */
  private mouthFor(food: Stack): { item: Item; dist: number } | null {
    if (!food.items[0].food) return null;
    const fx = food.x;
    const fy = food.bottom - food.items[0].height / 2;
    let best: { item: Item; dist: number } | null = null;
    for (const stack of this.stacks) {
      if (stack === food || stack.state === 'held' || this.hidden(stack)) continue;
      for (const s of stack.shown()) {
        if (!s.item.animal || s.item.chew > 0) continue;
        const dist = Math.hypot(this.delta(fx, s.x), fy - (s.y + s.item.mouthY));
        if (dist < MOUTH_OPEN_DIST && (!best || dist < best.dist)) best = { item: s.item, dist };
      }
    }
    return best;
  }

  /** The animal eats only the piece being held; anything stacked on it drops to the ground. */
  private feed(animal: Item, food: Stack): void {
    const owner = this.stacks.find((s) => s.items.includes(animal))!;
    const shown = owner.shown().find((s) => s.item === animal)!;
    const eaten = food.items.shift()!;
    this.vanishing.push({
      kind: eaten.kind as LooseKind,
      x: shown.x,
      y: shown.y + animal.mouthY,
      age: 0,
      into: 'mouth',
      depth: Infinity,
    });
    animal.feed();
    if (food.items.length === 0) return this.removeStack(food);
    food.bottom -= eaten.height;
    food.vx = food.vy = 0;
    this.drop(food);
  }

  private towerUnder(stack: Stack): Stack | null {
    let best: Stack | null = null;
    let bestDist = Infinity;
    for (const other of this.stacks) {
      // Another finger's stack counts too: one stack let go onto the one held in the other hand.
      if (other === stack || other.state === 'falling' || other.drowningIn) continue;
      if (this.hidden(other)) continue;
      const top = other.items[other.items.length - 1];
      const dx = Math.abs(this.delta(stack.x, other.x));
      const dy = Math.abs(stack.bottom - (other.bottom - other.height));
      if (dx < (top.radius + stack.radius) * 0.6 && dy < stack.items[0].height * 0.5 && dx + dy < bestDist) {
        best = other;
        bestDist = dx + dy;
      }
    }
    return best;
  }

  /** An ice block let go just beside a tower of ice: where it would stand flush against it. */
  private iceBeside(stack: Stack): Stack | null {
    if (!isIce(stack.items[0].kind)) return null;
    let best: Stack | null = null;
    let bestDist = Infinity;
    for (const other of this.stacks) {
      if (other === stack || other.state !== 'resting' || other.drowningIn || other.floatingIn || !isIce(other.items[0].kind)) continue;
      const dx = Math.abs(this.delta(stack.x, other.x));
      const touch = stack.radius + other.radius;
      // Anywhere along its side, from its foot to a little above its top.
      const alongside = stack.bottom <= other.bottom + 40 && stack.bottom >= other.bottom - other.height - 30;
      if (dx >= touch * 0.6 && dx <= touch * 1.5 && alongside && dx < bestDist) {
        best = other;
        bestDist = dx;
      }
    }
    return best;
  }

  /** Stand an ice block flush beside another tower, on the same ground line, starting a new column. */
  private buildBeside(stack: Stack, other: Stack): void {
    const side = this.delta(stack.x, other.x) < 0 ? -1 : 1;
    stack.x = this.wrap(other.x + side * (stack.radius + other.radius));
    stack.vx = stack.vy = 0;
    stack.fixedFloor = other.floor;
    stack.state = 'falling';
    audio.iceClink();
  }

  private fruitUnder(stack: Stack): Anchor | null {
    for (const tree of this.trees) {
      for (const slot of tree.slots) {
        if (slot.growth < 0.15 || this.restingOn(slot)) continue;
        const dx = Math.abs(stack.x - slot.x);
        const dy = Math.abs(stack.bottom - tree.fruitTop(slot));
        if (dx < stack.radius * 0.8 && dy < stack.items[0].height * 0.5) return { tree, slot };
      }
    }
    return null;
  }

  /** A ripe vegetable in a bed under the stack's bottom, free to stack on. */
  private vegUnder(stack: Stack): Anchor | null {
    for (const bed of this.beds) {
      for (const plot of bed.plots) {
        if (plot.growth < 1 || this.restingOn(plot)) continue;
        const dx = Math.abs(stack.x - plot.x);
        const dy = Math.abs(stack.bottom - bed.vegTop(plot));
        if (dx < stack.radius * 0.8 && dy < stack.items[0].height * 0.5) return { bed, plot };
      }
    }
    return null;
  }

  /** The bottom vegetable goes back into the bed, ripe; anything stacked on it stays on top. */
  private plant(bed: Bed, stack: Stack): void {
    const plot = bed.freePlotAt(stack.x, stack.bottom)!;
    const planted = stack.items.shift()!;
    bed.plant(plot, planted.kind as VegKind);
    audio.plop(0.5);
    if (stack.items.length === 0) return this.removeStack(stack);
    this.rest(stack, { bed, plot });
  }

  /** A free seat under the stack's bottom: a vehicle, the swing, the grill, the coop, a sill. */
  private seatUnder(stack: Stack): Anchor | null {
    const bottom = stack.items[0];
    for (const perch of this.perches) {
      for (let seat = 0; seat < perch.seatCount; seat++) {
        if (this.taken({ perch, seat }) || perch.accepts?.(seat, bottom) === false) continue;
        const dx = Math.abs(this.delta(stack.x, perch.seatX(seat)));
        const dy = Math.abs(stack.bottom - perch.seatTop(seat));
        const near = perch.catches
          ? perch.catches(seat, perch.seatX(seat) + this.delta(stack.x, perch.seatX(seat)), stack.bottom, stack.height)
          : dx <= perch.seatReach(seat) && dy <= Math.max(24, bottom.height * 0.5);
        if (near) {
          perch.seated?.(seat, stack.vx);
          return { perch, seat };
        }
      }
    }
    return null;
  }

  /** Glue `upper` straight on top of `lower`, so they move as one tower. */
  private glue(lower: Stack, upper: Stack): void {
    const below = lower.items[lower.items.length - 1];
    below.squash = 0.15;
    upper.items[0].squash = 0.25;
    // A sideways landing sets the tower rocking a little.
    lower.nudge((upper.vx / 60) * 0.3);
    lower.items.push(...upper.items);
    this.removeStack(upper);
    audio.plop(0.4);
    this.openGifts(lower);
    this.playIfGiven(lower);
  }

  /** Rest a stack on a fruit hanging on the tree (even a growing one), a bed vegetable or a seat. */
  private rest(stack: Stack, anchor: Anchor): void {
    stack.state = 'anchored';
    stack.anchor = anchor;
    ({ x: stack.x, top: stack.bottom } = anchorPoint(anchor));
    stack.vx = stack.vy = 0;
    stack.items[0].squash = 0.25;
    audio.plop(0.4);
    this.openGifts(stack);
    this.lightColumn(stack);
    this.playIfGiven(stack);
    this.chat(stack);
  }

  /** A gift or parcel put on an animal's head (or its hat) opens: confetti, and a very happy animal. */
  private openGifts(stack: Stack): void {
    for (let i = 1; i < stack.items.length; i++) {
      const gift = stack.items[i];
      if (!isGift(gift.kind)) continue;
      let below = i - 1;
      while (below > 0 && isHat(stack.items[below].kind)) below--;
      const animal = stack.items[below];
      if (!animal.animal) continue;
      const shown = stack.shown()[i];
      stack.items.splice(i, 1);
      for (const color of ['#e8665c', '#f2c14e', '#7fbf6a', '#6b9fe0', '#ef8fb4']) {
        this.splash(shown.x + (Math.random() - 0.5) * 30, shown.y, 0.5, color);
      }
      animal.happy = 2;
      animal.dance = 1.4;
      animal.squash = 0.25;
      animal.wake();
      audio.giftOpen();
      audio.animal(animal.animal);
      i--;
    }
  }

  /** A candle stood on an ice column chimes (the column takes its colour as it updates). */
  private lightColumn(stack: Stack): void {
    const a = stack.anchor;
    const kind = stack.items[0].kind;
    if (!a || !('perch' in a) || !(a.perch instanceof IceColumns) || !isCandle(kind)) return;
    audio.candle(CANDLES.indexOf(kind as CandleKind));
  }

  /** How many things of a kind are out in the world. */
  /** The ice chest's cap, counting the blocks the level starts with. */
  private iceCap = ICE_CAP;

  private countKinds(match: (kind: ItemKind) => boolean): number {
    let n = 0;
    for (const stack of this.stacks) for (const { kind } of stack.items) if (match(kind)) n++;
    return n;
  }

  /** Whether a stall may put out another: its own kind of thing (hats share the hat cap). */
  private stallCanGive(stall: Stall, hats: number): boolean {
    if (stall.look === 'hats') return hats < HAT_CAP;
    const kinds = new Set<ItemKind>(stall.kinds);
    const cap = stall.look === 'icechest' ? this.iceCap : stall.look === 'ornaments' ? ORNAMENT_CAP : STALL_CAP;
    return this.countKinds((k) => kinds.has(k)) < cap;
  }

  /** A hen put down near another hen clucks, and the other clucks back. */
  private chat(stack: Stack): void {
    const hen = stack.items.find((i) => i.kind === 'hen');
    if (!hen || this.hidden(stack)) return;
    for (const other of this.stacks) {
      if (other === stack || other.state === 'held' || other.state === 'falling' || this.hidden(other)) continue;
      const friend = other.items.find((i) => i.kind === 'hen');
      if (!friend || Math.abs(this.delta(other.x, stack.x)) > HEN_CHAT_DIST) continue;
      hen.happy = 0.8;
      hen.wake();
      friend.wake();
      audio.animal('hen');
      this.replies.push({ item: friend, at: this.time + 0.55 });
      return;
    }
  }

  /** An instrument sitting straight on an animal: the animal plays it. */
  private playIfGiven(stack: Stack): void {
    for (let i = 1; i < stack.items.length; i++) {
      const animal = stack.items[i - 1];
      const instrument = stack.items[i];
      if (!animal.animal || !isInstrument(instrument.kind) || animal.playing > 0) continue;
      animal.playing = PLAY_SECONDS;
      animal.wake();
      audio.music(instrument.kind as InstrumentKind, PITCH[animal.animal]);
    }
  }

  private removeStack(stack: Stack): void {
    this.stacks = this.stacks.filter((s) => s !== stack);
    for (const [id, hold] of this.holds) if (hold.stack === stack) this.holds.delete(id);
  }

  /** Where a dropped stack lands: in front of the ground line and anything it falls past. */
  private landingFloor(stack: Stack): number {
    if (stack.fixedFloor !== null) return stack.fixedFloor;
    let floor = FALL_FLOOR;
    for (const other of this.stacks) {
      if (other === stack || other.state !== 'resting' || other.drowningIn || other.floatingIn) continue;
      if (Math.abs(this.delta(other.x, stack.x)) < (other.radius + stack.radius) * 0.9) floor = Math.max(floor, other.floor + LAYER_GAP);
    }
    return Math.min(floor, FRONT_FLOOR);
  }

  // --- Simulation --------------------------------------------------------

  step(): void {
    const dt = STEP;
    this.time += dt;

    const camBefore = this.camX;
    this.moveCamera(dt);
    const camMoved = this.delta(this.camX, camBefore);

    for (const stack of this.stacks) for (const item of stack.items) item.wantsFood = false;
    for (const hold of this.holds.values()) {
      const eater = this.mouthFor(hold.stack);
      if (eater) eater.item.wantsFood = true;
    }

    for (const drive of this.vehicleHolds.values()) {
      const { vehicle } = drive;
      const finger = this.toWorld(drive.cssX, 0);
      const x = this.wrap(finger.x + drive.dx);
      const moved = this.delta(x, vehicle.x);
      vehicle.moveTo(x, moved);
      if (vehicle.kind === 'plough' && this.countKinds(isSnowball) < SNOWBALL_CAP) this.plough(vehicle, moved);
      // The sleigh's bells ring as it goes.
      if (vehicle.kind === 'sleigh' && this.travel(vehicle, moved, JINGLE_EVERY)) audio.jingleStep();
    }
    this.splashWheels();
    for (const hold of this.doorHolds.values()) {
      if (hold.moved < TAP_SLOP) continue;
      const finger = this.toWorld(hold.cssX, 0);
      const slid = (this.delta(finger.x, hold.startWorldX) * Barn.direction(hold.side)) / Barn.panelWidth;
      hold.barn.drag(hold.side, hold.startSlide + slid);
    }
    // A finger held on the cannon and moved turns its barrel toward it.
    for (const hold of this.cannonHolds.values()) {
      if (hold.moved < TAP_SLOP) continue;
      const finger = this.toWorld(hold.cssX, hold.cssY);
      hold.cannon.aimAt(hold.cannon.x + this.delta(finger.x, hold.cannon.x), finger.y);
    }
    for (const turn of this.turnHolds.values()) {
      const finger = this.toWorld(turn.cssX, turn.cssY);
      turn.windmill.follow(turn.windmill.x + this.delta(finger.x, turn.windmill.x), finger.y, dt);
    }

    for (const hold of this.holds.values()) {
      const { stack } = hold;
      const finger = this.toWorld(hold.cssX, hold.cssY);
      const x = this.wrap(finger.x + hold.dx);
      const bottom = finger.y + hold.dy;
      // Smoothed finger speed, kept for a flick on release. Scrolling is not a flick.
      stack.vx = stack.vx * 0.5 + ((this.delta(x, stack.x) - camMoved) / dt) * 0.5;
      stack.vy = stack.vy * 0.5 + ((bottom - stack.bottom) / dt) * 0.5;
      stack.x = x;
      stack.bottom = bottom;
    }

    for (const stack of [...this.stacks]) {
      switch (stack.state) {
        case 'anchored':
          ({ x: stack.x, top: stack.bottom } = anchorPoint(stack.anchor!));
          break;
        case 'falling':
          this.fall(stack, dt);
          break;
        case 'resting':
          if (stack.vx !== 0) {
            const rink = this.rinkUnder(stack);
            if (rink) this.slide(stack, rink, dt);
            else {
              stack.x = this.wrap(stack.x + stack.vx * dt);
              stack.vx *= Math.exp(-10 * dt);
              if (Math.abs(stack.vx) < 5) stack.vx = 0;
            }
          }
          if (stack.drowningIn && this.time >= stack.nextSinkAt) this.sinkBottom(stack, stack.drowningIn);
          else if (stack.floatingIn instanceof Puddle) this.paddle(stack, stack.floatingIn, dt);
          break;
      }
    }

    for (const stack of this.stacks) {
      for (const item of stack.items) {
        if (stack.state === 'held') item.wake();
        item.asleep = this.sky.isNight && !!item.animal && item.restful;
      }
      stack.update(dt);
    }
    this.buildSnowmen();
    this.runMotor();
    for (const reply of this.replies) {
      if (this.time < reply.at) continue;
      reply.item.happy = 0.8;
      reply.item.squash = 0.15;
      audio.animal('hen');
    }
    this.replies = this.replies.filter((r) => this.time < r.at);
    this.layEggs();
    this.bake(dt);
    this.seasons(dt);
    this.playMusic();
    this.sky.update(dt);
    this.snoreNow();
    this.rain(dt);
    for (const puddle of this.puddles) puddle.update(dt);
    for (const thing of [
      ...this.bins,
      ...this.swings,
      ...this.dispensers,
      ...this.sunfields,
      ...this.decor,
      ...this.picnics,
      ...this.boomboxes,
      ...this.scarecrows,
      ...this.owls,
    ])
      thing.update(dt);
    for (const house of this.houses) house.update(dt, settings.reduceMotion);
    this.winter(dt);
    for (const windmill of this.windmills) if (windmill.update(dt)) this.mill(windmill);
    // Fingers held down (on the ground or carrying something) call the fireflies at night.
    const fingers = [...this.pans.values(), ...this.holds.values()].map((f) => this.toWorld(f.cssX, f.cssY));
    for (const flies of this.fireflies) {
      const near = fingers.map((f) => ({ x: flies.x + this.delta(f.x, flies.x), y: f.y }));
      flies.update(dt, near, this.sky.night);
    }
    for (const bird of this.birds) bird.update(dt, this.onScreen(bird.x, 60));
    for (const v of this.vanishing) v.age += dt;
    this.vanishing = this.vanishing.filter((v) => v.age < SINK_SECONDS);
    this.splashes.update(dt);
    this.notes.update(dt);
  }

  /** Is this spot on screen right now (with a margin)? */
  private onScreen(x: number, margin: number): boolean {
    const d = this.wrap(x - this.camX);
    return d >= -margin && d <= this.viewW + margin;
  }

  /** A boat or duck floating on a puddle paddles slowly from one side to the other and back. */
  private paddle(stack: Stack, puddle: Puddle, dt: number): void {
    const speed = PADDLE_SPEED[stack.items[0].kind];
    if (!speed) return;
    const reach = Math.max(0, puddle.width / 2 - stack.radius * 0.8);
    stack.x += stack.paddle * speed * dt;
    if (stack.x > puddle.x + reach) stack.paddle = -1;
    if (stack.x < puddle.x - reach) stack.paddle = 1;
    stack.x = Math.max(puddle.x - reach, Math.min(puddle.x + reach, stack.x));
  }

  /** The ship's motor is heard while it sails somewhere in sight. */
  private runMotor(): void {
    const sailing = this.stacks.some(
      (s) => s.items[0].kind === 'ship' && s.floatingIn instanceof Puddle && s.state === 'resting' && this.onScreen(s.x, 0),
    );
    if (sailing === this.motorOn) return;
    this.motorOn = sailing;
    audio.setMotor(sailing);
  }

  /** A hen fed while sitting in the coop lays an egg, which drops out underneath. */
  private layEggs(): void {
    for (const stack of this.stacks) {
      const a = stack.anchor;
      if (!a || !('perch' in a) || !(a.perch instanceof Coop)) continue;
      const hen = stack.items[0];
      if (hen.kind !== 'hen' || !hen.justAte || this.countOut().eggs >= EGG_CAP) continue;
      const { x, bottom } = a.perch.eggDrop;
      const egg = new Stack([new Item('egg')], x, bottom);
      egg.fixedFloor = a.perch.depth + 20;
      this.stacks.push(egg);
      audio.eggPop();
    }
  }

  /** Spun really fast, the windmill puffs a sack of flour out of its door, unless enough is out. */
  private mill(windmill: Windmill): void {
    const { x, bottom } = windmill.door;
    this.splash(x, bottom - 20, 0.6, '#f7f3ea');
    if (this.countOut().flour >= FLOUR_CAP) return audio.puff(false);
    const sack = new Stack([new Item('flour')], x, bottom);
    sack.vx = 110;
    sack.vy = -260;
    this.stacks.push(sack);
    audio.puff(true);
  }

  /** Fruit or a vegetable on the grill bakes into a pie. */
  private bake(dt: number): void {
    for (const grill of this.grills) {
      const stack = this.stacks.find((s) => s.anchor && 'perch' in s.anchor && s.anchor.perch === grill);
      const baked = stack && bakesInto(stack.items[0].kind);
      if (!stack || !baked) {
        grill.baking = 0;
        continue;
      }
      if (grill.baking === 0) audio.sizzle();
      const before = grill.baking;
      grill.baking += dt;
      // Corn starts popping before it is done.
      if (baked === 'popcorn' && grill.baking > 1.2 && Math.floor(grill.baking / 0.3) > Math.floor(before / 0.3)) {
        this.splash(stack.x + (Math.random() - 0.5) * 20, stack.bottom - 20, 0.15, '#fbf3df');
        audio.pop();
      }
      if (grill.baking < BAKE_SECONDS) continue;
      stack.items[0] = new Item(baked);
      stack.items[0].squash = 0.3;
      grill.baking = 0;
      audio.ding();
    }
    // A marshmallow held over a lit fire toasts as well, like on a stick.
    for (const stack of this.stacks) {
      const fire = stack.state === 'held' && stack.items[0].kind === 'marshmallow'
        ? this.stations.find((s) => s instanceof Campfire && s.lit && s.over(this.wrap(stack.x), stack.bottom))
        : undefined;
      const t = fire ? (this.toasting.get(stack) ?? 0) + dt : 0;
      if (!fire) {
        this.toasting.delete(stack);
        continue;
      }
      if (t === dt) audio.sizzle();
      this.toasting.set(stack, t);
      if (t < WORK_SECONDS) continue;
      this.toasting.delete(stack);
      stack.items[0] = new Item('toasted');
      stack.items[0].squash = 0.3;
      audio.ding();
    }
  }

  /** Spring and autumn: eggs hatch, honey and marshmallows come back, stations work, butterflies and the rainbow. */
  private seasons(dt: number): void {
    for (const nest of this.nests) {
      const stack = this.stacks.find((s) => s.anchor && 'perch' in s.anchor && s.anchor.perch === nest);
      const egg = stack?.items[0];
      const chicks = this.countKinds((k) => k === 'chick');
      if (!stack || !egg || !isEgg(egg.kind) || chicks >= CHICK_CAP) {
        nest.warm = 0;
        continue;
      }
      const before = nest.warm;
      nest.warm = Math.min(1, nest.warm + dt / HATCH_SECONDS);
      // It rocks a little more and more, then hatches.
      if (Math.floor(before * 6) !== Math.floor(nest.warm * 6)) egg.squash = 0.12 + nest.warm * 0.12;
      if (nest.warm < 1) continue;
      stack.items[0] = new Item('chick');
      stack.items[0].squash = 0.3;
      stack.items[0].happy = 1;
      nest.warm = 0;
      audio.hatch();
    }
    const honey = this.countKinds((k) => k === 'honey');
    for (const hive of this.hives) if (hive.update(dt, honey < HONEY_CAP)) audio.basket();
    // A found Easter egg is hidden again, somewhere out of sight, while not too many are out.
    const painted = this.countKinds((k) => (PAINTED_EGGS as readonly ItemKind[]).includes(k));
    for (const hunt of this.eggHunts) hunt.update(dt, painted < PAINTED_EGG_CAP, (x) => !this.onScreen(x, 200));
    const firewood = this.countKinds((k) => k === 'firewood' || k === 'kindling');
    for (const pile of this.woodpiles) if (pile.offer.update(dt, firewood < FIREWOOD_CAP)) audio.basket();
    const marshmallows = this.countKinds((k) => k === 'marshmallow' || k === 'toasted');
    const pumpkins = this.countKinds((k) => k === 'pumpkin' || k === 'jackolantern');
    for (const box of this.boxes) {
      if (box.look === 'marshmallows' && box.offer.update(dt, marshmallows < MARSHMALLOW_CAP)) audio.basket();
      if (box.look === 'eggs' && box.offer.update(dt, this.countOut().eggs < EGG_CAP)) audio.basket();
      if (box.look === 'pumpkins' && box.offer.update(dt, pumpkins < PUMPKIN_CAP)) audio.basket();
    }
    this.work(dt);
    for (const pads of this.pads) pads.update(dt);
    for (const b of this.birdhouses) b.update(dt);
    for (const c of this.carousels) c.update(dt);
    for (const f of this.fountains) f.update(dt);
    // The seesaw tips toward whichever end holds more.
    for (const sw of this.seesaws) {
      const weight = (seat: number) =>
        this.stacks
          .filter((st) => st.anchor && 'perch' in st.anchor && st.anchor.perch === sw && st.anchor.seat === seat)
          .reduce((sum, st) => sum + st.items.reduce((w, it) => w + it.radius * it.height, 0), 0);
      sw.update(dt, weight(0), weight(1));
    }
    // Whatever sits on top of the slide goes down it and is left on the ground at the bottom.
    for (const slide of this.slides) {
      const rider = this.stacks.find((st) => st.anchor && 'perch' in st.anchor && st.anchor.perch === slide);
      const before = slide.sliding;
      const landed = slide.update(dt, !!rider);
      if (slide.sliding && !before) audio.whee();
      if (!landed || !rider) continue;
      rider.anchor = null;
      rider.state = 'resting';
      rider.x = this.wrap(slide.landX);
      rider.bottom = rider.floor = slide.landFloor;
      rider.vx = 140;
      rider.items[0].squash = 0.25;
      for (const item of rider.items) item.wake();
      slide.reset();
    }
    for (const pl of this.poles) pl.update(dt);
    for (const m of this.mushrooms) m.update(dt);
    // Butterflies come to a flower being carried.
    const lures: { x: number; y: number }[] = [];
    for (const hold of this.holds.values()) {
      for (const s of hold.stack.shown()) if (isFlower(s.item.kind)) lures.push({ x: s.x, y: s.y });
    }
    for (const b of this.butterflies) {
      b.update(dt, lures.map((l) => ({ x: b.x + this.delta(l.x, b.x), y: l.y })), this.sky.night);
    }
    // In spring, a cloud that has rained a while leaves a rainbow when it stops.
    for (const cloud of this.clouds) {
      if (cloud.raining) {
        this.rained.set(cloud, (this.rained.get(cloud) ?? 0) + dt);
        continue;
      }
      const rained = this.rained.get(cloud) ?? 0;
      this.rained.delete(cloud);
      if (rained >= RAINBOW_AFTER && this.theme.falling === 'petals' && !this.sky.isNight) {
        if (!this.rainbow.visible) audio.rainbow();
        this.rainbow.show(cloud.x);
      }
    }
    this.rainbow.update(dt);
  }

  /** The carving table, the cider press and the campfire each make the thing on them into another. */
  private work(dt: number): void {
    for (const station of this.stations) {
      const stack = this.stacks.find((s) => s.anchor && 'perch' in s.anchor && s.anchor.perch === station);
      const made = stack && worksInto(station, stack.items[0].kind);
      if (!stack || !made) {
        station.working = 0;
        continue;
      }
      if (station.working === 0) {
        if (station instanceof CarvingTable) audio.carve();
        else if (station instanceof CiderPress) audio.press();
        else if (station instanceof Campfire) made === 'burn' ? audio.flare() : audio.sizzle();
      }
      const chops = station instanceof ChoppingBlock ? station.chops : 0;
      station.working += dt;
      if (station instanceof ChoppingBlock && station.chops > chops) audio.chop();
      // Wood on the fire catches at once (lighting it if it was out) and burns away; anything on it drops down.
      if (made === 'burn' && station instanceof Campfire) {
        station.lit = true;
        if (station.working < BURN_SECONDS) continue;
        stack.items.shift();
        if (stack.items.length === 0) this.stacks.splice(this.stacks.indexOf(stack), 1);
        station.working = 0;
        continue;
      }
      if (station.working < (station instanceof ChoppingBlock ? CHOP_SECONDS : WORK_SECONDS)) continue;
      stack.items[0] = new Item(made as ItemKind);
      stack.items[0].squash = 0.3;
      station.working = 0;
      audio.ding();
    }
  }

  /** Notes float up from every animal playing an instrument. */
  private playMusic(): void {
    const every = settings.reduceMotion ? 0.7 : 0.35;
    if (Math.floor(this.time / every) === Math.floor((this.time - STEP) / every)) return;
    for (const stack of this.stacks) {
      if (this.hidden(stack)) continue;
      for (const s of stack.shown()) {
        if (s.item.playing > 0 || s.item.dance > 0) this.notes.add(s.x + s.item.radius * 0.6, s.y - s.item.height / 2);
      }
    }
    for (const box of this.boomboxes) if (box.song) this.notes.add(box.x + (Math.random() - 0.5) * 60, box.depth - 80);
  }

  /** Glide after a swipe, and scroll while something is carried to the screen edge. */
  private moveCamera(dt: number): void {
    let x = this.camX;
    // A finger resting on the ground lets its swipe speed fade, so letting go then doesn't glide.
    for (const pan of this.pans.values()) pan.speed *= Math.exp(-12 * dt);
    if (this.pans.size === 0) {
      x += this.camVx * dt;
      this.camVx *= Math.exp(-5 * dt);
    }
    const screenW = this.viewW * this.scale;
    const zone = Math.min(EDGE_SCROLL_ZONE, screenW / 6);
    for (const hold of [...this.holds.values(), ...this.cloudHolds.values(), ...this.vehicleHolds.values(), ...this.doorHolds.values()]) {
      // A cloud at the end of its reach no longer pulls the view along.
      const cloud = 'cloud' in hold ? hold.cloud : null;
      if (hold.cssX < zone && !(cloud && cloud.x <= cloud.minX)) x -= EDGE_SCROLL_SPEED * (1 - hold.cssX / zone) * dt;
      else if (hold.cssX > screenW - zone && !(cloud && cloud.x >= cloud.maxX))
        x += EDGE_SCROLL_SPEED * (1 - (screenW - hold.cssX) / zone) * dt;
    }
    if (x !== this.camX) this.setCamera(x);
  }

  /** Move held clouds; rain grows vegetables, speeds up fruit, ripples puddles and washes off mud. */
  private rain(dt: number): void {
    for (const hold of this.cloudHolds.values()) {
      const finger = this.toWorld(hold.cssX, hold.cssY);
      const { cloud } = hold;
      const target = cloud.x + this.delta(finger.x + hold.dx, cloud.x);
      cloud.x = Math.max(cloud.minX, Math.min(cloud.maxX, target));
      cloud.y = Math.max(this.camY + CLOUD_TOP, Math.min(this.camY + 300, finger.y + hold.dy));
    }
    const wet = (x: number) => this.clouds.some((c) => c.wets(x));
    const out = this.countOut();
    const fruit = [...out.fruit.values()].reduce((a, b) => a + b, 0);
    for (const tree of this.trees) tree.update(dt, wet, fruit < FRUIT_CAP && (out.fruit.get(tree.fruit) ?? 0) < FRUIT_KIND_CAP);
    for (const bed of this.beds) bed.update(dt, wet, out.veg < VEG_CAP);
    for (const field of this.cornfields) field.update(dt, wet, out.veg < VEG_CAP);
    for (const barn of this.barns) barn.update(dt, out.hay < HAY_CAP);
    for (const basket of this.baskets) if (basket.update(dt, out.treats < TREAT_CAP)) audio.basket();
    for (const cloud of this.clouds) {
      cloud.update(dt, (x) => {
        const puddle = this.puddles.find((p) => Math.abs(x - p.x) < p.width * 0.4);
        if (puddle && Math.random() < 0.15) puddle.ripple(x, 0.2);
      });
    }
    // An animal out in the rain puts up an umbrella, and folds it when the rain stops.
    for (const stack of this.stacks) {
      const out = stack.state !== 'held' && !this.hidden(stack) && !this.underRoof(stack);
      const wants = out && wet(stack.x) && stack.items.some((i) => i.animal) ? 1 : 0;
      stack.umbrella += (wants - stack.umbrella) * Math.min(1, dt * 5);
    }
    // Water washes mud off: floating in a puddle quickly, standing in the rain slowly.
    for (const stack of this.stacks) {
      if (stack.floatingIn instanceof Mud) {
        // Sitting in the mud keeps an animal muddy, rain or not.
        if (stack.state === 'resting' && stack.items[0].animal) stack.items[0].muddy = 1;
        continue;
      }
      const rate = stack.floatingIn instanceof Puddle ? 0.8 : wet(stack.x) ? 0.4 : 0;
      if (rate) for (const item of stack.items) item.muddy = Math.max(0, item.muddy - rate * dt);
    }
  }

  /** Inside the barn, or in the coop or a window, rain does not reach. */
  private underRoof(stack: Stack): boolean {
    const a = stack.anchor;
    if (a && 'perch' in a) return a.perch instanceof Coop || a.perch instanceof House;
    return stack.state === 'resting' && this.barns.some((b) => b.isInside(stack.x, stack.floor));
  }

  /** Deep in the night, now and then one sleeping animal snores. */
  private snoreNow(): void {
    if (this.sky.night < 1) {
      this.nextSnoreAt = this.time + 2;
      return;
    }
    if (this.time < this.nextSnoreAt) return;
    const sleepers = this.stacks.flatMap((s) => (s.state === 'held' ? [] : s.items.filter((i) => i.asleep)));
    this.nextSnoreAt = this.time + 4 + Math.random() * 4;
    if (!sleepers.length) return;
    sleepers[this.snoreTurn++ % sleepers.length].snore = SNORE_SECONDS;
    audio.snore();
  }

  private fall(stack: Stack, dt: number): void {
    // A kite on its own drifts down slowly on the breeze, swaying, never off the top of the sky.
    if (stack.items.length === 1 && stack.items[0].kind === 'kite') {
      stack.vy = Math.min(KITE_SINK, (stack.vy + GRAVITY * 0.08 * dt) * Math.exp(-(stack.vy < 0 ? 1.4 : 0) * dt));
      stack.vx = stack.vx * Math.exp(-0.8 * dt) + Math.sin(this.time * 1.7 + stack.x * 0.01) * 50 * dt;
      if (stack.bottom < this.camY + KITE_CEILING) {
        stack.bottom = this.camY + KITE_CEILING;
        stack.vy = Math.max(stack.vy, 0);
      }
    } else stack.vy += GRAVITY * dt;
    stack.x = this.wrap(stack.x + stack.vx * dt);
    // A floater drifts gently toward open water.
    if (stack.floatingIn) stack.x += (stack.floatingIn.floatX(stack.x, stack.radius) - stack.x) * Math.min(1, dt * 6);
    const before = stack.bottom;
    stack.bottom += stack.vy * dt;
    // Thrown or dropped through a bin's opening, it goes in.
    if (!stack.drowningIn && !stack.floatingIn && stack.vy > 0) {
      const bin = this.bins.find((b) => b.catches(stack.x, before, stack.bottom));
      if (bin) {
        stack.bottom = bin.rim;
        this.intoSink(stack, bin);
      }
    }
    // Falling onto the raised rink, it lands on the ice.
    if (stack.fixedFloor === null && !stack.drowningIn && !stack.floatingIn && stack.vy > 0) {
      const rink = this.rinks.find((r) => before <= r.cy && stack.bottom >= r.cy && r.holds(r.x + this.delta(stack.x, r.x), r.cy));
      if (rink) stack.fixedFloor = rink.cy;
    }
    stack.floor = this.landingFloor(stack);
    if (stack.bottom < stack.floor) return;

    stack.bottom = stack.floor;
    const impact = stack.vy;
    if (stack.floatingIn instanceof Puddle) {
      stack.x = stack.floatingIn.floatX(stack.x, stack.radius);
      this.splash(stack.x, stack.floatingIn.surfaceY, 0.4, stack.floatingIn.light);
      stack.floatingIn.ripple(stack.x, 1);
      if (stack.floatingIn instanceof Mud) audio.squelch();
      else audio.plop(0.6);
    } else if (stack.floatingIn) {
      stack.x = stack.floatingIn.floatX(stack.x, stack.radius);
      stack.items[0].squash = 0.2;
      audio.plop(0.4);
    } else if (impact > 80) {
      stack.items[0].squash = Math.min(0.3, impact * 0.0004);
      audio.plop(impact / 900);
    }
    if (impact > 500 && !stack.drowningIn && !stack.floatingIn) {
      stack.vy = -impact * 0.25;
      return;
    }
    stack.vy = 0;
    stack.state = 'resting';
    // Landing on the ice, it slides off, at least a little.
    if (!stack.drowningIn && !stack.floatingIn && this.rinkUnder(stack) && Math.abs(stack.vx) < MIN_SLIDE) {
      stack.vx = (stack.vx < 0 ? -1 : 1) * MIN_SLIDE;
    }
    // A spinning top lands spinning.
    if (stack.items.length === 1 && !stack.drowningIn && !stack.floatingIn) stack.items[0].spin();
    if (!stack.drowningIn) this.playIfGiven(stack);
    this.chat(stack);
  }

  /** The rink a resting stack stands on, if any. */
  private rinkUnder(stack: Stack): Rink | null {
    if (stack.state !== 'resting' || stack.drowningIn || stack.floatingIn || stack.anchor) return null;
    return this.rinks.find((r) => r.holds(r.x + this.delta(stack.x, r.x), stack.floor)) ?? null;
  }

  /** On the ice: it glides on, slowing gently, bouncing softly off the edge, scratching the ice as it goes. */
  private slide(stack: Stack, rink: Rink, dt: number): void {
    const from = rink.x + this.delta(stack.x, rink.x);
    let to = from + stack.vx * dt;
    const reach = rink.reach(stack.floor, stack.radius * 0.6);
    if (Math.abs(to - rink.x) > reach) {
      to = rink.x + Math.sign(to - rink.x) * reach;
      stack.vx = -stack.vx * 0.7;
      stack.nudge(Math.sign(stack.vx) * 1.2);
      audio.plop(0.2);
    }
    rink.scratch(from, to, stack.floor - 2);
    stack.x = this.wrap(to);
    stack.vx *= Math.exp(-ICE_FRICTION * dt);
    if (Math.abs(stack.vx) < 6) stack.vx = 0;
    if (Math.abs(stack.vx) > 40 && this.time - this.lastScratchAt > 0.35) {
      this.lastScratchAt = this.time;
      audio.scratch();
    }
  }

  /** Snowballs stacked on snowballs make a snowman: the top one gets a face, the middle ones arms. */
  private buildSnowmen(): void {
    for (const stack of this.stacks) {
      const items = stack.items;
      for (let i = 0; i < items.length; i++) {
        const ball = isSnowball(items[i].kind);
        const below = i > 0 && isSnowball(items[i - 1].kind);
        const above = i + 1 < items.length && isSnowball(items[i + 1].kind);
        items[i].snowman = ball && below ? (above ? 'body' : 'head') : null;
        // A candle with something on top shows no wick or flame.
        items[i].covered = i < items.length - 1;
      }
    }
  }

  /** Driving the plough rolls a snowball in front of its blade, crunching as it grows. */
  private plough(vehicle: Vehicle, moved: number): void {
    const before = vehicle.snowball;
    vehicle.gather(moved);
    if (this.travel(vehicle, moved, CRUNCH_EVERY)) audio.crunch(0.25);
    if (vehicle.snowball !== before) audio.crunch(0.6);
  }

  /** Count a vehicle's driving; true each time it has gone another `every`. */
  private travel(vehicle: Vehicle, moved: number, every: number): boolean {
    const gone = (this.travelled.get(vehicle) ?? 0) + Math.abs(moved);
    this.travelled.set(vehicle, gone % every);
    return gone >= every;
  }

  /** The winter town's things: stalls and vehicles put out more, the cannon charges, the sleds go. */
  private winter(dt: number): void {
    if (!this.stalls.length && !this.vehicles.some((v) => v.offer) && !this.hills.length && !this.cannons.length) {
      for (const rink of this.rinks) rink.update(dt);
      return;
    }
    const hats = this.countOut().hats;
    for (const stall of this.stalls) if (stall.update(dt, this.stallCanGive(stall, hats))) audio.basket();
    const gifts = this.countKinds(isGift);
    for (const v of this.vehicles) if (v.offer?.update(dt, gifts < GIFT_CAP)) audio.basket();
    const ornaments = this.countKinds((k) => (ORNAMENTS as ItemKind[]).includes(k));
    for (const box of this.boxes) if (box.offer.update(dt, ornaments < ORNAMENT_CAP)) audio.basket();
    // Each ice column takes the colour of a candle standing on it, and loses it when the candle goes.
    for (const c of this.columns) {
      for (let i = 0; i < c.seatCount; i++) {
        const on = this.stacks.find((st) => st.anchor && 'perch' in st.anchor && st.anchor.perch === c && st.anchor.seat === i);
        const kind = on?.items[0].kind;
        c.tint(i, kind && isCandle(kind) ? CANDLE_COLOR[kind] : null);
      }
      c.update(dt);
    }
    for (const c of this.cannons) c.update(dt);
    // The sleds only go while their hill is in sight.
    for (const hill of this.hills) {
      if (!this.onScreen(hill.x, 450)) continue;
      hill.riders = this.stacks.some((st) => st.anchor && 'perch' in st.anchor && st.anchor.perch === hill);
      if (hill.update(dt, settings.reduceMotion)) audio.whee();
    }
    for (const rink of this.rinks) rink.update(dt);
    for (const lamp of this.lamps) lamp.update(dt);
    for (const pine of this.pines) pine.update(dt);
  }

  /** A tower goes under (or into the bin) one item at a time, bottom first; the rest drops in after it. */
  private sinkBottom(stack: Stack, sink: Sink): void {
    const first = stack.items.shift()!;
    const y = stack.bottom - first.height / 2;
    const water = sink instanceof Puddle;
    this.vanishing.push({
      kind: first.kind as LooseKind,
      x: stack.x,
      y,
      age: 0,
      into: water ? 'water' : 'bin',
      // In front of the puddle or bin, hidden below the water line or the middle of the bin's opening.
      depth: sink.depth + 0.6,
      waterline: sink instanceof Bin ? sink.rim + 4 : stack.bottom,
      drop: first.height + 8,
      light: water ? sink.light : undefined,
      hole: sink instanceof Bin ? { x: sink.x, rx: Bin.openingRx, ry: Bin.openingRy } : undefined,
    });
    if (sink instanceof Puddle) {
      this.splash(stack.x, sink.surfaceY, 1, sink.light);
      sink.ripple(stack.x, 1);
      audio.plock(1);
    } else if (sink instanceof Bin) {
      sink.swallow();
      audio.gulp();
      if (!stack.items.some((i) => i.disposable)) audio.burp(0.35);
    }

    if (stack.items.length === 0) return this.removeStack(stack);
    stack.bottom -= first.height;
    stack.nextSinkAt = this.time + DROWN_INTERVAL;
    stack.state = 'falling';
    // Animals and toys never drown: the rest of the tower floats on them.
    if (!stack.items[0].disposable) this.float(stack, sink);
  }

  private splash(x: number, y: number, size: number, color?: string): void {
    this.splashes.splash(x, y, settings.reduceMotion ? size * 0.3 : size, color);
  }

  /** Driving through a puddle throws up water: something to find out by trying. */
  private splashWheels(): void {
    for (const drive of this.vehicleHolds.values()) {
      const { vehicle } = drive;
      if (this.time - (this.wheelSplashAt.get(vehicle) ?? -1) < 0.18) continue;
      if (Math.abs(this.delta(vehicle.x, this.lastVehicleX.get(vehicle) ?? vehicle.x)) < 1.5) continue;
      for (const wheel of vehicle.wheels) {
        const wx = vehicle.x + wheel.dx;
        const puddle = this.puddles.find((p) => Math.abs(this.delta(wx, p.x)) < p.width / 2 - 10);
        if (!puddle) continue;
        this.splash(wx, vehicle.depth - 6, 0.5, puddle.light);
        puddle.ripple(puddle.x + this.delta(wx, puddle.x), 0.6);
        audio.plop(0.5);
        this.wheelSplashAt.set(vehicle, this.time);
        break;
      }
    }
    for (const v of this.vehicles) this.lastVehicleX.set(v, v.x);
  }

  // --- Drawing -----------------------------------------------------------

  /** Drawing order: further back first. */
  private depthOf(stack: Stack): number {
    if (stack.state === 'held') return Infinity;
    // On a tree: behind everything on the ground, but in front of the owl in it. Elsewhere: just in
    // front of what holds it.
    const a = stack.anchor;
    if (a) {
      if ('bed' in a) return a.bed.depth + 0.1;
      if ('perch' in a) return a.perch.seatDepth?.(a.seat) ?? a.perch.depth + 0.1;
      return IN_TREE + 1;
    }
    const water = stack.drowningIn ?? stack.floatingIn;
    if (water) return water.depth + 0.5;
    return stack.floor;
  }

  /**
   * Sinking fruit slides down through its own spot on the water, as if through
   * a hole: whatever is below the water line there is hidden.
   */
  private drawSinking(ctx: CanvasRenderingContext2D, v: Vanishing, t: number): void {
    const waterline = v.waterline!;
    const r = sizeOf(v.kind).radius;
    ctx.save();
    ctx.beginPath();
    ctx.rect(v.x - r * 2, waterline - 400, r * 4, 400);
    if (v.hole) ctx.ellipse(v.hole.x, waterline, v.hole.rx, v.hole.ry, 0, 0, Math.PI * 2);
    ctx.clip('nonzero');
    drawLoose(ctx, v.kind, v.x, v.y + v.drop! * t * t, 0, 1, 1);
    ctx.restore();
    if (v.into === 'bin') return;
    ctx.strokeStyle = v.light ?? palette.waterLight;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1 - t * 0.5;
    ctx.beginPath();
    ctx.ellipse(v.x, waterline, r * 0.95, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** A floating tower bobs gently, its bottom hidden under the water line. */
  private drawFloating(ctx: CanvasRenderingContext2D, stack: Stack, puddle: Puddle): void {
    const bob = Math.sin(this.time * 2.2 + stack.x * 0.05) * 2.5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(stack.x - 400, -2000, 800, 2000 + puddle.depth);
    ctx.clip();
    ctx.translate(0, bob);
    // Boats and ducks face the way they paddle.
    if (PADDLE_SPEED[stack.items[0].kind] && stack.paddle < 0) {
      ctx.translate(stack.x * 2, 0);
      ctx.scale(-1, 1);
    }
    stack.draw(ctx);
    ctx.restore();
    ctx.strokeStyle = puddle.light;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(stack.x, puddle.depth, stack.radius * 0.95, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** An umbrella held up over the whole tower, opening out from its handle. */
  private drawUmbrella(ctx: CanvasRenderingContext2D, s: Stack): void {
    const open = s.umbrella;
    if (open < 0.02) return;
    const animal = s.items.find((i) => i.animal)!.animal!;
    const color = UMBRELLA_COLORS[animal];
    const sway = s.shown();
    const top = sway[sway.length - 1];
    const x = top.x;
    const handleBottom = top.y + top.item.height * 0.1;
    const canopy = top.y - top.item.height / 2 - 34;
    const r = Math.max(48, s.radius * 1.3) * (0.3 + 0.7 * open);
    ctx.globalAlpha = Math.min(1, open * 2);
    ctx.strokeStyle = '#6b5a4e';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, canopy - 4);
    ctx.lineTo(x, handleBottom - 8);
    ctx.arc(x + 8, handleBottom - 8, 8, Math.PI, 0, true);
    ctx.stroke();
    // A dome with a scalloped edge.
    const h = r * 0.62 * (0.4 + 0.6 * open);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - r, canopy);
    ctx.quadraticCurveTo(x - r, canopy - h, x, canopy - h);
    ctx.quadraticCurveTo(x + r, canopy - h, x + r, canopy);
    const n = 4;
    for (let i = n; i > 0; i--) {
      const a = x - r + ((i - 1) * 2 * r) / n;
      const b = x - r + (i * 2 * r) / n;
      ctx.quadraticCurveTo((a + b) / 2, canopy - h * 0.22, a, canopy);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.35, canopy - h * 0.55, r * 0.22, h * 0.18, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b5a4e';
    ctx.beginPath();
    ctx.arc(x, canopy - h - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawStack(ctx: CanvasRenderingContext2D, s: Stack): void {
    if (this.hidden(s) && s.anchor) return;
    this.drawStackBody(ctx, s);
    this.drawUmbrella(ctx, s);
  }

  private drawStackBody(ctx: CanvasRenderingContext2D, s: Stack): void {
    const a = s.anchor;
    const barn = s.state === 'resting' ? this.barns.find((b) => b.isInside(s.x, s.floor)) : undefined;
    // Only once it has settled on the water; while falling in it is drawn whole.
    if (s.floatingIn instanceof Puddle && s.state === 'resting') this.drawFloating(ctx, s, s.floatingIn);
    else if (barn || (a && 'perch' in a && a.perch.clip)) {
      ctx.save();
      if (barn) barn.clipInside(ctx);
      else if (a && 'perch' in a) a.perch.clip!(ctx, a.seat);
      s.draw(ctx);
      ctx.restore();
    } else s.draw(ctx);
  }

  private layers(ctx: CanvasRenderingContext2D): Layer[] {
    const t = this.time;
    const at = (depth: number, x: number, reach: number, draw: () => void): Layer => ({ depth, x, reach, draw });
    return [
      ...this.cornfields.map((f) => at(f.depth, f.x, f.width / 2 + 60, () => f.draw(ctx))),
      ...this.sunfields.map((f) => at(f.depth, f.x, f.width / 2 + 60, () => f.draw(ctx))),
      ...this.decor.map((d) => at(d.depth, d.x, 100, () => d.draw(ctx, t))),
      ...this.scarecrows.map((s) => at(s.depth, s.x, 120, () => s.draw(ctx, t))),
      ...this.owls.map((o) => at(IN_TREE, o.x, 60, () => o.draw(ctx, this.sky.night))),
      ...this.birds.map((b) => at(b.depth, b.x, 1200, () => b.draw(ctx))),
      ...this.picnics.flatMap((p) => [
        at(p.backDepth, p.x, p.width / 2 + 80, () => p.drawBack(ctx)),
        at(p.depth, p.x, p.width / 2 + 80, () => p.draw(ctx)),
      ]),
      ...this.puddles.map((p) => at(p.depth, p.x, p.width / 2, () => p.draw(ctx, t))),
      ...this.beds.map((b) => at(b.depth, b.x, b.width / 2 + 20, () => b.draw(ctx))),
      ...this.bins.map((b) => at(b.depth, b.x, 80, () => b.draw(ctx))),
      ...this.barns.flatMap((b) => [at(b.backDepth, b.x, 220, () => b.drawBack(ctx)), at(b.depth, b.x, 220, () => b.draw(ctx))]),
      ...this.houses.flatMap((h) => [
        at(h.depth, h.x, 260, () => h.drawBack(ctx)),
        at(h.frontDepth, h.x, 260, () => h.draw(ctx)),
        at(h.frontDepth + 0.05, h.x, 260, () => h.drawShutters(ctx)),
      ]),
      ...[...this.stables, ...this.dispensers, ...this.coops, ...this.vehicles, ...this.baskets, ...this.benches, ...this.tables, ...this.boxes].map((s) =>
        at(s.depth, s.x, 250, () => s.draw(ctx)),
      ),
      ...[...this.swings, ...this.windmills].map((s) => at(s.depth, s.x, 250, () => s.draw(ctx))),
      ...this.grills.map((g) => at(g.depth, g.x, 80, () => g.draw(ctx, t))),
      ...this.stalls.map((st) => at(st.depth, st.x, 200, () => st.draw(ctx, t))),
      ...this.columns.map((c) => at(c.depth, c.x, c.width / 2 + 20, () => c.draw(ctx))),
      ...this.cannons.map((c) => at(c.depth, c.x, 160, () => c.draw(ctx))),
      ...this.hills.flatMap((h) => [at(h.hillDepth, h.x, 450, () => h.drawHill(ctx)), at(h.depth, h.x, 450, () => h.drawSled(ctx))]),
      ...this.rinks.map((rk) => at(rk.depth, rk.x, rk.width / 2 + 30, () => rk.draw(ctx))),
      ...this.lamps.map((l) => at(l.depth, l.x, 60, () => l.draw(ctx))),
      ...this.pines.map((pn) => at(pn.depth, pn.x, 140, () => pn.draw(ctx))),
      ...this.lightStrings.map((c) => at(c.depth, c.x, c.width / 2 + 20, () => c.draw(ctx))),
      ...this.nests.flatMap((n) => [at(n.depth, n.x, 60, () => n.draw(ctx)), at(n.frontDepth, n.x, 60, () => n.drawFront(ctx))]),
      ...this.pads.map((pd) => at(pd.depth, pd.x, pd.width / 2, () => pd.draw(ctx))),
      ...this.hives.map((h) => at(h.depth, h.x, 140, () => h.draw(ctx, t))),
      ...this.stations.map((st) => at(st.depth, st.x, 110, () => st.draw(ctx, t))),
      ...this.stations.flatMap((st) => (st instanceof ChoppingBlock ? [at(st.frontDepth, st.x, 120, () => st.drawFront(ctx))] : [])),
      ...this.mushrooms.map((m) => at(m.depth, m.x, 100, () => m.draw(ctx))),
      ...this.greenhouses.map((g) => at(g.depth, g.x, 170, () => g.draw(ctx))),
      ...this.bridges.map((b) => at(b.depth, b.x, b.width / 2 + 20, () => b.draw(ctx))),
      ...this.birdhouses.map((b) => at(b.depth, b.x, 60, () => b.draw(ctx))),
      ...this.poles.map((pl) => at(pl.depth, pl.x, 120, () => pl.draw(ctx, t))),
      ...this.woodpiles.map((w) => at(w.depth, w.x + 30, 190, () => w.draw(ctx))),
      ...this.eggHunts.flatMap((h) => h.spots.map((sp, i) => at(sp.depth, sp.x, 50, () => h.drawSpot(ctx, i, t)))),
      ...this.slides.map((sl) => at(sl.depth, sl.x, 180, () => sl.draw(ctx))),
      ...this.seesaws.map((sw) => at(sw.depth, sw.x, 180, () => sw.draw(ctx))),
      ...this.carousels.flatMap((c) => [at(c.depth, c.x, 180, () => c.draw(ctx, t)), at(c.frontDepth, c.x, 180, () => c.drawFront(ctx))]),
      ...this.fountains.map((f) => at(f.depth, f.x, 150, () => f.draw(ctx, t))),
      ...this.tents.flatMap((tn) => [at(tn.depth, tn.x, 170, () => tn.draw(ctx)), at(tn.frontDepth, tn.x, 170, () => tn.drawFront(ctx))]),
      ...this.chairs.flatMap((c) => [at(c.depth, c.x, 160, () => c.draw(ctx)), at(c.frontDepth, c.x, 160, () => c.drawFront(ctx))]),
      ...this.boomboxes.map((b) => at(b.depth, b.x, 80, () => b.draw(ctx))),
      ...this.stacks.map((s) => at(this.depthOf(s), s.x, 200, () => this.drawStack(ctx, s))),
      ...this.vanishing.map((v) =>
        at(v.depth, v.x, 100, () => {
          if (v.age < 0) return;
          const k = v.age / SINK_SECONDS;
          if (v.into === 'water' || v.into === 'bin') this.drawSinking(ctx, v, k);
          else drawLoose(ctx, v.kind, v.x, v.y, 0, 1 - k * 0.8, 1 - k * 0.8, 1 - k);
        }),
      ),
    ].sort((a, b) => a.depth - b.depth);
  }

  draw(screen: CanvasRenderingContext2D, dpr: number): void {
    screen.setTransform(1, 0, 0, 1, 0, 0);
    this.sky.drawSky(screen);
    const k = this.scale * dpr;
    screen.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);
    this.sky.drawLights(screen);

    // At night the landscape is drawn on its own layer, so it can be darkened
    // without dimming the moon and stars behind it.
    const night = this.sky.night > 0;
    const ctx = night ? this.landscapeLayer(screen.canvas) : screen;
    if (night) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);
    }

    const left = this.camX;
    const right = this.camX + this.viewW;

    // Hills (or the snowy town) scroll slower than the ground, so they feel far away.
    const theme = this.theme;
    if (theme.winter) drawTown(ctx, left, right, this.camTravel);
    else if (theme.land === 'park') drawParkTown(ctx, left, right, this.camTravel);
    else if (theme.land === 'woods') drawWoods(ctx, left, right, this.camTravel);
    else {
      this.drawHills(ctx, left, right, 0.3, GROUND_Y - 180, 130, 0.004, theme.hillFar);
      this.drawHills(ctx, left, right, 0.6, GROUND_Y - 90, 80, 0.007, theme.hillNear);
    }

    ctx.fillStyle = theme.ground;
    ctx.fillRect(left, GROUND_Y, right - left, WORLD_H - GROUND_Y + 10);
    ctx.fillStyle = theme.groundDark;
    ctx.fillRect(left, GROUND_Y + 50, right - left, WORLD_H - GROUND_Y);
    if (theme.land === 'park') {
      drawSpringGround(ctx, left, right);
      drawPath(ctx, left, right);
    }
    if (theme.land === 'woods') drawLeafLitter(ctx, left, right);
    if (theme.winter) drawSnowBank(ctx, left, right);
    else if (theme.land === 'park') drawHedge(ctx, left, right);
    else if (theme.land === 'woods') drawUndergrowth(ctx, left, right);
    else drawFence(ctx, left, right);

    // Where the view runs past the end of the farm, the start is drawn again after it.
    const shifts = right > this.width ? [0, this.width] : [0];
    const layers = this.layers(ctx);
    const margin = 40;
    for (const shift of shifts) {
      const seen = (x: number, reach: number) => x + shift + reach > left - margin && x + shift - reach < right + margin;
      ctx.save();
      ctx.translate(shift, 0);
      if (this.rainbow.visible) this.rainbow.draw(ctx);
      for (const tree of this.trees) if (seen(tree.x, 260)) tree.draw(ctx, this.time);
      for (const layer of layers) if (seen(layer.x, layer.reach)) layer.draw();
      for (const b of this.butterflies) if (seen(b.x, b.width / 2 + 300)) b.draw(ctx);
      for (const cloud of this.clouds) if (seen(cloud.x, 200)) cloud.draw(ctx);
      this.splashes.draw(ctx);
      this.notes.draw(ctx);
      ctx.restore();
    }
    if (theme.winter) this.drawSnowfall(ctx, left);
    else if (theme.falling) drawFalling(ctx, left, this.time, theme.falling, settings.reduceMotion);

    if (night) {
      this.sky.washLandscape(ctx);
      screen.setTransform(1, 0, 0, 1, 0, 0);
      screen.drawImage(ctx.canvas, 0, 0);
      // Fireflies, the owl's eyes and the moon on the water shine over the dark.
      screen.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);
      for (const shift of shifts) {
        screen.save();
        screen.translate(shift, 0);
        for (const flies of this.fireflies) flies.draw(screen, this.sky.night);
        for (const owl of this.owls) owl.drawGlow(screen, this.sky.night);
        for (const picnic of this.picnics) picnic.drawGlow(screen, this.sky.night);
        for (const house of this.houses) house.drawGlow(screen, this.sky.night);
        for (const puddle of this.puddles) puddle.drawMoon(screen, this.time, this.sky.night);
        for (const stall of this.stalls) stall.drawGlow(screen, this.sky.night);
        for (const lamp of this.lamps) lamp.drawGlow(screen, this.sky.night);
        for (const pine of this.pines) if (pine.garland) pine.drawGlow(screen, this.sky.night);
        for (const lights of this.lightStrings) lights.drawGlow(screen, this.sky.night);
        for (const c of this.columns) {
          const lit = c.colors.map((_, i) =>
            this.stacks.some((st) => st.anchor && 'perch' in st.anchor && st.anchor.perch === c && st.anchor.seat === i && st.items[0].lit),
          );
          c.drawGlow(screen, this.sky.night, lit);
        }
        this.drawCandleGlows(screen);
        for (const st of this.stations) if (st instanceof Campfire) st.drawGlow(screen, this.sky.night);
        screen.restore();
      }
    }
  }

  /** Every lit candle and jack-o'-lantern glows at night, wherever it is (a candle not with something on it, nothing shut away). */
  private drawCandleGlows(ctx: CanvasRenderingContext2D): void {
    const night = this.sky.night;
    for (const stack of this.stacks) {
      if (this.hidden(stack)) continue;
      const shown = stack.shown();
      shown.forEach((s, i) => {
        if (!isLight(s.item.kind) || !s.item.lit) return;
        const candle = isCandle(s.item.kind);
        if (candle && i < shown.length - 1) return;
        const x = s.x;
        const y = candle ? s.y + CANDLE_FLAME_DY : s.y;
        const glow = ctx.createRadialGradient(x, y, 2, x, y, 80);
        glow.addColorStop(0, `rgba(255, 214, 140, ${0.6 * night})`);
        glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 80, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  /** Snow falling softly over the winter town, the same few flakes drifting down the screen. */
  private drawSnowfall(ctx: CanvasRenderingContext2D, left: number): void {
    const count = settings.reduceMotion ? 18 : 46;
    const speed = settings.reduceMotion ? 0.4 : 1;
    const top = this.camY;
    const h = this.viewH + 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < count; i++) {
      const fall = this.time * (26 + (i % 5) * 7) * speed;
      const x = left + ((((i * 211.7 + Math.sin(this.time * 0.5 + i) * 24) % this.viewW) + this.viewW) % this.viewW);
      const y = top - 20 + ((i * 97.3 + fall) % h);
      ctx.beginPath();
      ctx.arc(x, y, 2.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private landscapeLayer(like: HTMLCanvasElement): CanvasRenderingContext2D {
    if (!this.layer) this.layer = document.createElement('canvas').getContext('2d')!;
    const { canvas } = this.layer;
    if (canvas.width !== like.width || canvas.height !== like.height) {
      canvas.width = like.width;
      canvas.height = like.height;
    }
    return this.layer;
  }

  private drawHills(
    ctx: CanvasRenderingContext2D,
    left: number,
    right: number,
    parallax: number,
    base: number,
    height: number,
    freq: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, GROUND_Y + 1);
    // Measured from the total distance travelled, so the hills never jump where the farm loops.
    const travelled = this.camTravel * parallax;
    for (let x = left; x <= right + 20; x += 20) {
      const u = x - left + travelled;
      ctx.lineTo(x, base - height * (0.5 + 0.5 * Math.sin(u * freq) * Math.cos(u * freq * 0.37)));
    }
    ctx.lineTo(right, GROUND_Y + 1);
    ctx.fill();
  }
}
