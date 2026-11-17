import { GROUND_Y } from '../config';
import type { SceneDef } from './scene';

// Autumn: deep in the woods, nine screens that loop round, among tall trees
// with ferns and bracken along the back. An oak dropping acorns with the
// squirrel under it and the owl in it, leaf piles and a hollow log to hide in, a
// ring of toadstools that play notes, a tent and a campfire for toasting
// marshmallows (wood on it burns), a stream with the beaver, a crate of pumpkins
// and the carving table, the log cabin with its woodpile and a chopping block, a
// vegetable bed under a rain cloud, wild apple and pear trees by the cider
// press, and the dog hiding in a leaf pile. Only woodland animals and the dog.
export const autumn: SceneDef = {
  width: 9 * 1024,
  start: 60,
  theme: 'autumn',
  objects: [
    // Screen 0: the old oak with acorns, the squirrel, the owl, a leaf pile with the hedgehog in it.
    { type: 'tree', x: 220, fruit: 'acorn', look: 'autumn' },
    { type: 'owl', x: 160, height: 300 },
    { type: 'animal', x: 420, animal: 'squirrel', depth: GROUND_Y + 50 },
    { type: 'leafpile', x: 620, seed: 1, animal: 'hedgehog' },
    { type: 'mushrooms', x: 860, seed: 1 },

    // Screen 1: the tent with the fox in it, the campfire and a bag of marshmallows.
    { type: 'tent', x: 1230 },
    { type: 'animal', x: 1230, animal: 'fox', depth: GROUND_Y + 40, home: 'tent' },
    { type: 'campfire', x: 1560 },
    { type: 'marshmallows', x: 1730 },
    { type: 'rock', x: 1930, seed: 2 },

    // Screen 2: the stream with the beaver, then a crate of pumpkins and the carving table.
    { type: 'puddle', x: 2380, width: 480 },
    { type: 'animal', x: 2300, animal: 'beaver', depth: GROUND_Y + 40, home: 'pond' },
    { type: 'pumpkins', x: 2760 },
    { type: 'carving', x: 2980 },

    // Screen 3: the log cabin with the cat at a window, its woodpile and the chopping block.
    { type: 'house', x: 3420, style: 'cabin' },
    { type: 'animal', x: 3420, animal: 'cat', depth: GROUND_Y + 40, home: 'house', seat: 2 },
    { type: 'woodpile', x: 3830 },
    { type: 'chopblock', x: 4110 },

    // Screen 4: the cabin's vegetable bed under a rain cloud, and a wild apple tree.
    { type: 'cloud', x: 4400, y: 150 },
    { type: 'bed', x: 4400, width: 340, veg: ['pumpkin', 'carrot', 'cabbage'] },
    { type: 'tree', x: 4840, fruit: 'apple', look: 'autumn' },

    // Screen 5: the cider press, a wild pear tree, and the bunny in a leaf pile.
    { type: 'press', x: 5150 },
    { type: 'tree', x: 5480, fruit: 'pear', look: 'autumn' },
    { type: 'leafpile', x: 5850, seed: 2, animal: 'bunny' },

    // Screen 6: a muddy hollow and a puddle with the duck.
    { type: 'mud', x: 6250, width: 220 },
    { type: 'puddle', x: 6650, width: 220 },
    { type: 'animal', x: 6650, animal: 'duck', depth: GROUND_Y + 40, home: 'pond' },
    { type: 'bird', x: 6900, color: '#c9744f' },

    // Screen 7: a bin, the spinning top, and a hollow log with the raccoon hiding in it.
    { type: 'bin', x: 7300 },
    { type: 'toy', x: 7520, toy: 'top', depth: GROUND_Y + 50 },
    { type: 'log', x: 7820, seed: 3, animal: 'raccoon' },

    // Screen 8: a leaf pile with the dog hiding in it, and a rock, back round to the oak.
    { type: 'leafpile', x: 8400, seed: 4, animal: 'dog' },
    { type: 'rock', x: 8720, seed: 8 },
    { type: 'bird', x: 8960, color: '#b0623f' },
  ],
};
