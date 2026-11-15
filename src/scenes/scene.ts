import type { FruitKind } from '../objects/fruit';

// A scene is plain data: which objects exist and where. Adding a scene or an
// object should only take a few lines here.

export type ObjectDef =
  | { type: 'tree'; x: number; fruit: FruitKind }
  | { type: 'puddle'; x: number; width: number };

export interface SceneDef {
  /** Scene width in world units. One screen is 1024. */
  width: number;
  objects: ObjectDef[];
}
