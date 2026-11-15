import type { SceneDef } from './scene';

// Five screens wide. Each screen has something new: a different tree, a
// puddle, an animal. Drag the ground to walk along it.
export const orchard: SceneDef = {
  width: 5 * 1024,
  objects: [
    // Screen 1: apple tree, puddle, sheep and hen.
    { type: 'tree', x: 290, fruit: 'apple' },
    { type: 'puddle', x: 735, width: 300 },
    { type: 'animal', x: 70, animal: 'sheep', depth: 700 },
    { type: 'animal', x: 470, animal: 'hen', depth: 690 },

    // Screen 2: pear tree and the cow.
    { type: 'tree', x: 1400, fruit: 'pear' },
    { type: 'animal', x: 1780, animal: 'cow', depth: 660 },

    // Screen 3: the big puddle and the pig.
    { type: 'puddle', x: 2500, width: 440 },
    { type: 'animal', x: 2860, animal: 'pig', depth: 705 },

    // Screen 4: plum tree beside a small puddle.
    { type: 'tree', x: 3380, fruit: 'plum' },
    { type: 'puddle', x: 3860, width: 240 },

    // Screen 5: another apple tree at the far end.
    { type: 'tree', x: 4560, fruit: 'apple' },
    { type: 'puddle', x: 4920, width: 260 },
  ],
};
