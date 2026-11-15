import type { SceneDef } from './scene';

// Milestone 1: one screen, one tree, one puddle.
export const orchard: SceneDef = {
  width: 1024,
  objects: [
    { type: 'tree', x: 290, fruit: 'apple' },
    { type: 'puddle', x: 735, width: 300 },
  ],
};
