import type { SceneDef } from './scene';

// One screen: a tree, a puddle and a few animals to stack and feed.
export const orchard: SceneDef = {
  width: 1024,
  objects: [
    { type: 'tree', x: 290, fruit: 'apple' },
    { type: 'puddle', x: 735, width: 300 },
    { type: 'animal', x: 70, animal: 'sheep', depth: 700 },
    { type: 'animal', x: 470, animal: 'hen', depth: 690 },
    { type: 'animal', x: 565, animal: 'cow', depth: 655 },
    { type: 'animal', x: 955, animal: 'pig', depth: 705 },
  ],
};
