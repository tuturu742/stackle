import { GROUND_Y } from '../config';
import type { SceneDef } from './scene';

// Thirteen screens wide, each its own place, and looping round: walking past
// the sunflowers at the far end comes back to the cornfield at the start. A
// fence runs all the way round, with bushes, rocks, flowers and birds along it.
// Some animals start out wearing hats. Drag the ground to walk along it.
// It grows as new things arrive.
export const orchard: SceneDef = {
  width: 13 * 1024,
  start: 1024,
  objects: [
    // Screen 0: the cornfield, where the farm loops round to the sunflowers.
    { type: 'cornfield', x: 500, width: 800 },
    { type: 'bird', x: 160, color: '#e9a23b' },
    { type: 'rock', x: 960, seed: 1 },

    // Screen 1: apple tree, a wide puddle, and the hen.
    { type: 'flowers', x: 1090, seed: 0 },
    { type: 'tree', x: 1314, fruit: 'apple' },
    { type: 'animal', x: 1494, animal: 'hen', depth: GROUND_Y + 50 },
    { type: 'puddle', x: 1770, width: 430 },

    // Screen 2: the first vegetable garden under its cloud, then the picnic right by it, so fruit
    // and vegetables are close to the grill: the cow and the sheep on the blanket with the
    // instruments and a boombox, the basket of treats at one end and the grill at the other.
    { type: 'bed', x: 2330, width: 300, veg: ['carrot', 'tomato', 'cabbage', 'carrot'] },
    { type: 'cloud', x: 2330, y: 150 },
    { type: 'basket', x: 2560 },
    { type: 'picnic', x: 2885, width: 470 },
    { type: 'animal', x: 2690, animal: 'cow', depth: GROUND_Y + 70, hat: 'straw' },
    { type: 'toy', x: 2790, toy: 'drum', depth: GROUND_Y + 30 },
    { type: 'toy', x: 2860, toy: 'guitar', depth: GROUND_Y + 30 },
    { type: 'toy', x: 2925, toy: 'trumpet', depth: GROUND_Y + 30 },
    { type: 'boombox', x: 3005 },
    { type: 'animal', x: 3095, animal: 'sheep', depth: GROUND_Y + 70 },
    { type: 'grill', x: 3240 },

    // Screen 3: the barn with hay inside, and the horse in its stable next door.
    { type: 'barn', x: 3504 },
    { type: 'stable', x: 3894 },
    { type: 'animal', x: 3894, animal: 'horse', depth: GROUND_Y + 30, hat: 'cap' },

    // Screen 4: the pear tree and the hen house, with a hen sitting in it.
    { type: 'tree', x: 4354, fruit: 'pear' },
    { type: 'flowers', x: 4600, seed: 3 },
    { type: 'coop', x: 4850 },
    { type: 'animal', x: 4850, animal: 'hen', depth: GROUND_Y + 40, home: 'coop' },
    { type: 'bird', x: 5030, color: '#7fb3d5' },

    // Screen 5: the mud puddle with the pig sitting in it, and the big pond with the duck.
    { type: 'mud', x: 5290, width: 230 },
    { type: 'animal', x: 5290, animal: 'pig', depth: GROUND_Y + 65, hat: 'party', home: 'pond' },
    { type: 'puddle', x: 5680, width: 440 },
    { type: 'animal', x: 5600, animal: 'duck', depth: GROUND_Y + 40, home: 'pond' },
    { type: 'bush', x: 6060, seed: 5 },

    // Screen 6: the swing and a bin.
    { type: 'swing', x: 6420 },
    { type: 'rock', x: 6660, seed: 4 },
    { type: 'bin', x: 6880 },

    // Screen 7: the farmhouse, a model ship on its sill, and a puddle to sail it on.
    { type: 'flowers', x: 7276, seed: 6 },
    { type: 'house', x: 7656 },
    { type: 'toy', x: 7786, toy: 'ship', depth: GROUND_Y + 40, home: 'house' },
    { type: 'puddle', x: 8056, width: 250 },

    // Screen 8: the hat machine and the tractor.
    { type: 'dispenser', x: 8726 },
    { type: 'vehicle', x: 9096, vehicle: 'tractor' },

    // Screen 9: the plum tree and a wagon.
    { type: 'tree', x: 9506, fruit: 'plum' },
    { type: 'bird', x: 9756, color: '#d77a8f' },
    { type: 'vehicle', x: 9976, vehicle: 'wagon' },

    // Screen 10: the windmill and a little puddle.
    { type: 'windmill', x: 10536 },
    { type: 'puddle', x: 10976, width: 280 },
    { type: 'bush', x: 11206, seed: 7 },

    // Screen 11: a second garden with its own cloud, and a last bin.
    { type: 'bed', x: 11626, width: 300, veg: ['tomato', 'cabbage', 'tomato'] },
    { type: 'cloud', x: 11626, y: 140 },
    { type: 'bin', x: 12036 },

    // Screen 12: the sunflower field.
    { type: 'sunflowers', x: 12806, width: 860 },
  ],
};
