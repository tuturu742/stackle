import type { AnimalKind } from '../objects/animals';
import type { FruitKind } from '../objects/fruit';
import type { VegKind } from '../objects/veg';

// A scene is plain data: which objects exist and where. Adding a scene or an
// object should only take a few lines here.

export type ObjectDef =
  | { type: 'tree'; x: number; fruit: FruitKind }
  | { type: 'puddle'; x: number; width: number }
  /** `depth` is the ground line it stands on; larger is nearer the viewer. */
  | { type: 'animal'; x: number; animal: AnimalKind; depth: number }
  /** A raised bed with one plot per vegetable listed. */
  | { type: 'bed'; x: number; width: number; veg: VegKind[] }
  /** A rain cloud in the sky; `y` is its height on screen. */
  | { type: 'cloud'; x: number; y: number };

export interface SceneDef {
  /** Scene width in world units. One screen is 1024. */
  width: number;
  objects: ObjectDef[];
}
