import type { AnimalKind } from '../objects/animals';
import type { FruitKind } from '../objects/fruit';
import type { ToyKind } from '../objects/goods';
import type { HatKind } from '../objects/hat';
import type { VegKind } from '../objects/veg';
import type { VehicleKind } from '../objects/vehicle';

// A scene is plain data: which objects exist and where. Adding a scene or an
// object should only take a few lines here.

export type ObjectDef =
  | { type: 'tree'; x: number; fruit: FruitKind }
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
  | { type: 'cornfield'; x: number; width: number }
  | { type: 'sunflowers'; x: number; width: number }
  /** Scenery in front of the fence; `seed` varies its look. */
  | { type: 'bush' | 'rock' | 'flowers'; x: number; seed: number }
  | { type: 'bird'; x: number; color: string }
  /** A picnic blanket with bunting above it. */
  | { type: 'picnic'; x: number; width: number }
  | { type: 'basket'; x: number }
  | { type: 'grill'; x: number }
  /** Plays a song per tap, then quiet. */
  | { type: 'boombox'; x: number }
  /** The farmhouse, with two windows. */
  | { type: 'house'; x: number }
  | { type: 'coop'; x: number }
  /** A bench for two. */
  | { type: 'bench'; x: number }
  | { type: 'mud'; x: number; width: number };

export type Home = 'pond' | 'coop' | 'house';
// With a `home` of coop or house, `seat` picks the seat (house: windows 0-3, the doorway 4), shut or not.

export interface SceneDef {
  /** Scene width in world units. One screen is 1024. */
  width: number;
  /** Where the view starts. The farm loops round, so x = width is x = 0 again. */
  start?: number;
  objects: ObjectDef[];
}
