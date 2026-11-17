import type { AnimalKind } from '../objects/animals';
import type { FruitKind } from '../objects/fruit';
import type { ToyKind } from '../objects/goods';
import type { HatKind } from '../objects/hat';
import type { VegKind } from '../objects/veg';
import type { StallLook } from '../objects/stall';
import type { VehicleKind } from '../objects/vehicle';
import type { ItemKind } from '../objects/item';
import type { ThemeName } from '../theme';

// A scene is plain data: which objects exist and where. Adding a scene or an
// object should only take a few lines here.

export type ObjectDef =
  /** A fruit tree; `look` dresses its crown for the season (blossom in spring, warm colours in autumn). */
  | { type: 'tree'; x: number; fruit: FruitKind; look?: 'summer' | 'blossom' | 'autumn' }
  | { type: 'puddle'; x: number; width: number }
  /** `depth` is the ground line it stands on; larger is nearer the viewer. */
  /** `home`: where it starts out, floating in the puddle (or mud) under it, sitting in the coop or on a farmhouse sill. */
  | { type: 'animal'; x: number; animal: AnimalKind; depth: number; hat?: HatKind; home?: Home; seat?: number }
  /** A toy that is never lost, like an animal: the model ship, an instrument. */
  | { type: 'toy'; x: number; toy: ToyKind; depth: number; home?: Home; seat?: number }
  /** A raised bed with one plot per vegetable listed. */
  | { type: 'bed'; x: number; width: number; veg: VegKind[] }
  /** A rain cloud in the sky; `y` is its height on screen. */
  | { type: 'cloud'; x: number; y: number }
  | { type: 'bin'; x: number }
  | { type: 'barn'; x: number }
  /** An open stable; put the horse in it with an animal entry at the same x. */
  | { type: 'stable'; x: number }
  | { type: 'swing'; x: number }
  | { type: 'windmill'; x: number }
  /** The hat machine. */
  | { type: 'dispenser'; x: number }
  | { type: 'vehicle'; x: number; vehicle: VehicleKind }
  /** `clearing`: the middle of a stretch left without corn (where the scarecrow stands). */
  | { type: 'cornfield'; x: number; width: number; clearing?: number }
  /** Stands in the corn with crows on its arms; wears any hat put on its head. */
  | { type: 'scarecrow'; x: number }
  | { type: 'sunflowers'; x: number; width: number }
  /** Scenery in front of the fence; `seed` varies its look. A bush can start with an animal hiding in it. */
  | { type: 'bush'; x: number; seed: number; animal?: AnimalKind }
  | { type: 'rock' | 'flowers'; x: number; seed: number }
  | { type: 'bird'; x: number; color: string }
  /** An owl in a hollow, `height` above the ground (put it in a tree's crown). */
  | { type: 'owl'; x: number; height: number }
  /** A picnic blanket with bunting above it. */
  | { type: 'picnic'; x: number; width: number }
  | { type: 'basket'; x: number }
  | { type: 'grill'; x: number }
  /** Plays a song per tap, then quiet; the winter one is a radio playing carols. */
  | { type: 'boombox'; x: number; style?: 'summer' | 'winter' }
  /** The farmhouse, with four windows and a door; `town` dresses it for the winter town, `cabin` is autumn's log cabin. */
  | { type: 'house'; x: number; style?: 'farm' | 'town' | 'cabin' }
  | { type: 'coop'; x: number }
  /** A bench for two. */
  | { type: 'bench'; x: number }
  | { type: 'mud'; x: number; width: number }
  // The winter town.
  /** A stall giving out its kind of thing in turn: ice cubes, candles, sweets, cocoa, hats, fast food, ornaments. */
  | { type: 'stall'; x: number; look: StallLook }
  /** A row of ice columns; a candle on one colours it. */
  | { type: 'columns'; x: number }
  /** Hold it to grow a snowball in its mouth, let go to fire it. */
  | { type: 'cannon'; x: number }
  /** A snowy slope with a sled that riders go down. */
  | { type: 'sledhill'; x: number }
  /** A frozen rink: things let go on it slide and leave scratches. */
  | { type: 'rink'; x: number; width: number }
  | { type: 'lamp'; x: number }
  /** A snowy pine; ornaments put on it hang there. With `garland` it has a string of lights. */
  | { type: 'pine'; x: number; seed: number; garland?: boolean; height?: number }
  /** A string of lights between two posts whose bulbs light up one after another. */
  | { type: 'chaselights'; x: number; width: number }
  /** Santa's chair: put the polar bear in it with an animal entry at the same x, `home: 'chair'`. */
  | { type: 'santachair'; x: number }
  /** A Christmas market table with a bench at each end (`home: 'table'` seats an animal there). */
  | { type: 'market'; x: number }
  /** A box of Christmas decorations to take, on a doorstep. */
  | { type: 'decorbox'; x: number }
  // Spring.
  /** A nest on a stump: an egg put in it hatches into a chick. */
  | { type: 'nest'; x: number }
  /** Lily pads floating on the puddle at the same x. */
  | { type: 'lilypads'; x: number }
  /** A beehive with a jar of honey to take; a tap sends the bees out. */
  | { type: 'hive'; x: number }
  /** Butterflies over a meadow; they follow a carried flower. */
  | { type: 'butterflies'; x: number; width: number }
  // Autumn.
  /** Places that make one thing into another: a pumpkin into a jack-o'-lantern, fruit into juice, a marshmallow toasted. */
  | { type: 'carving' | 'press' | 'campfire'; x: number }
  /** A ring of toadstools that each play a note. */
  | { type: 'mushrooms'; x: number; seed: number }
  /** A pile of leaves; like a bush, a hiding place for one animal. */
  | { type: 'leafpile'; x: number; seed: number; animal?: AnimalKind }
  /** A bag of marshmallows to take, for the campfire. */
  | { type: 'marshmallows'; x: number }
  /** A hollow fallen log; like a bush, a hiding place for one animal. */
  | { type: 'log'; x: number; seed: number; animal?: AnimalKind }
  /** A stack of cut logs under a little roof; things stand on top. */
  | { type: 'woodpile'; x: number }
  // More spring.
  /** A basket of eggs to take, for the nest. */
  | { type: 'eggs'; x: number }
  /** A glass greenhouse with a potting bench in front to put things on. */
  | { type: 'greenhouse'; x: number }
  /** A little arched footbridge over the stream (a puddle) at the same x. */
  | { type: 'bridge'; x: number; width: number }
  /** A birdhouse: a tap makes the baby birds peep out. */
  | { type: 'birdhouse'; x: number }
  /** A ribbon pole: a tap swirls its ribbons round. */
  | { type: 'ribbonpole'; x: number }
  /** The park's playground: a slide anything goes down, a seesaw, a merry-go-round; and a fountain. */
  | { type: 'slide' | 'seesaw' | 'carousel' | 'fountain'; x: number }
  /** A camping tent; its flap opens and shuts on a tap, hiding whoever is inside. */
  | { type: 'tent'; x: number }
  /** A chopping block: a log of firewood put on it is split into kindling. */
  | { type: 'chopblock'; x: number }
  /** An Easter egg hunt: painted eggs tucked half out of sight in grass, flowers, leaves or stones. */
  | { type: 'egghunt'; spots: { x: number; depth: number; cover: 'grass' | 'flowers' | 'leaves' | 'stones' }[] }
  /** A crate of pumpkins to take, for the carving table. */
  | { type: 'pumpkins'; x: number }
  /** Loose things standing there at the start, like a snowman (they come back, so they are not kept). */
  | { type: 'stack'; x: number; items: ItemKind[]; depth: number; home?: Home };

export type Home = 'pond' | 'coop' | 'house' | 'bush' | 'chair' | 'bench' | 'table' | 'pads' | 'nest' | 'tent' | 'seesaw';
// With a `home` of coop or house, `seat` picks the seat (house: windows 0-3, the doorway 4), shut or not.

export interface SceneDef {
  /** Scene width in world units. One screen is 1024. */
  width: number;
  /** Where the view starts. The farm loops round, so x = width is x = 0 again. */
  start?: number;
  /** Colours and backdrop; summer if not given. */
  theme?: ThemeName;
  objects: ObjectDef[];
}
