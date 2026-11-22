import { GROUND_Y } from '../config';
import type { SceneDef } from './scene';

// Autumn: deep in the woods, nine screens that loop round, among tall trees
// with ferns and bracken along the back. An oak dropping acorns with the
// squirrel under it and the owl in it, leaf piles and a hollow log to hide in, a
// ring of toadstools that play notes, a tent and a campfire for toasting
// marshmallows (wood on it burns) by a gramophone, under paper lanterns, a stream
// with the beaver, a crate of pumpkins and the carving table, the log cabin
// with its woodpile and a chopping block, a vegetable bed under a rain cloud,
// wild apple and pear trees by the cider press, a wild beehive, a
// creek with a footbridge, and the dog hiding in a leaf pile. Only woodland animals and the dog.
export const autumn: SceneDef = {
  width: 9 * 1024,
  start: 60,
  theme: 'autumn',
  objects: [
    // Screen 0: the old oak with acorns, the squirrel, the owl, a leaf pile with the hedgehog in it.
    { type: 'tree', x: 220, fruit: 'acorn', look: 'autumn' },
    { type: 'owl', x: 160, height: 345 },
    { type: 'animal', x: 420, animal: 'squirrel', depth: GROUND_Y + 50 },
    { type: 'leafpile', x: 600, seed: 1, animal: 'hedgehog' },
    { type: 'mushrooms', x: 900, seed: 1 },

    // Screen 1: the tent with the fox in it, the campfire, a bag of marshmallows and a gramophone.
    { type: 'tent', x: 1230 },
    { type: 'animal', x: 1230, animal: 'fox', depth: GROUND_Y + 40, home: 'tent' },
    { type: 'campfire', x: 1560 },
    { type: 'marshmallows', x: 1730 },
    { type: 'boombox', x: 1910, style: 'autumn' },
    { type: 'lanterns', x: 1560, width: 520, high: 400 },

    // Screen 2: the stream with the beaver, then a crate of pumpkins and the carving table.
    { type: 'puddle', x: 2380, width: 480 },
    { type: 'animal', x: 2300, animal: 'beaver', depth: GROUND_Y + 40, home: 'pond' },
    { type: 'pumpkins', x: 2760 },
    { type: 'carving', x: 2980 },

    // Screen 3: the log cabin with the cat at a window, its woodpile and the chopping block.
    { type: 'house', x: 3420, style: 'cabin' },
    { type: 'animal', x: 3420, animal: 'cat', depth: GROUND_Y + 40, home: 'house', seat: 2 },
    { type: 'woodpile', x: 3830 },
    { type: 'chopblock', x: 4160 },

    // Screen 4: the cabin's vegetable bed under a rain cloud, and a wild apple tree.
    { type: 'cloud', x: 4400, y: 150 },
    { type: 'bed', x: 4400, width: 340, veg: ['pumpkin', 'carrot', 'cabbage'] },
    { type: 'tree', x: 4840, fruit: 'apple', look: 'autumn' },

    // Screen 5: the cider press, a wild pear tree, and the bunny in a leaf pile.
    { type: 'press', x: 5150 },
    { type: 'tree', x: 5480, fruit: 'pear', look: 'autumn' },
    { type: 'leafpile', x: 5850, seed: 2, animal: 'bunny' },

    // Screen 6: a muddy hollow, a mossy rock, a puddle with the duck, and a bench.
    { type: 'mud', x: 6200, width: 220 },
    { type: 'rock', x: 6440, seed: 4 },
    { type: 'puddle', x: 6680, width: 220 },
    { type: 'animal', x: 6680, animal: 'duck', depth: GROUND_Y + 40, home: 'pond' },
    { type: 'bench', x: 6990 },
    { type: 'bird', x: 6900, color: '#c9744f' },

    // Screen 7: a bin, the spinning top, a hollow log with the raccoon hiding in it, and a wild beehive.
    { type: 'bin', x: 7260 },
    { type: 'toy', x: 7450, toy: 'top', depth: GROUND_Y + 50 },
    { type: 'log', x: 7700, seed: 3, animal: 'raccoon' },
    { type: 'hive', x: 8000 },

    // Screen 8: a leaf pile with the dog hiding in it, and a little creek with a footbridge, back round to the oak.
    { type: 'leafpile', x: 8340, seed: 4, animal: 'dog' },
    { type: 'puddle', x: 8720, width: 300 },
    { type: 'bridge', x: 8720, width: 380 },
    { type: 'rock', x: 9000, seed: 8 },
    { type: 'bird', x: 8960, color: '#b0623f' },
  ],
};
