import type { SceneDef } from './scene';

// Seven screens wide, each its own place: one tree of each kind, two gardens
// with their rain clouds, a big pond and small puddles, and the animals spread
// along the way. Drag the ground to walk along it. It grows as new things arrive.
export const orchard: SceneDef = {
  width: 7 * 1024,
  objects: [
    // Screen 1: apple tree, puddle, sheep and hen.
    { type: 'tree', x: 290, fruit: 'apple' },
    { type: 'puddle', x: 735, width: 300 },
    { type: 'animal', x: 70, animal: 'sheep', depth: 700 },
    { type: 'animal', x: 470, animal: 'hen', depth: 690 },

    // Screen 2: the first vegetable garden under its cloud, and the cow.
    { type: 'bed', x: 1600, width: 300, veg: ['carrot', 'tomato', 'cabbage', 'carrot'] },
    { type: 'cloud', x: 1600, y: 150 },
    { type: 'animal', x: 1960, animal: 'cow', depth: 690 },

    // Screen 3: the pear tree on its own.
    { type: 'tree', x: 2560, fruit: 'pear' },

    // Screen 4: the big pond and the pig.
    { type: 'puddle', x: 3560, width: 460 },
    { type: 'animal', x: 3960, animal: 'pig', depth: 705 },

    // Screen 5: the plum tree.
    { type: 'tree', x: 4620, fruit: 'plum' },

    // Screen 6: a second garden with its own cloud.
    { type: 'bed', x: 5640, width: 300, veg: ['tomato', 'cabbage', 'tomato'] },
    { type: 'cloud', x: 5640, y: 140 },

    // Screen 7: a little puddle at the far end.
    { type: 'puddle', x: 6640, width: 280 },
  ],
};
