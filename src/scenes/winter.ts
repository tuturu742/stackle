import { GROUND_Y } from '../config';
import type { IceKind } from '../objects/goods';
import type { SceneDef, ObjectDef } from './scene';

/** A little castle of the ice chest's own blocks, standing as real towers that can be taken apart. */
const CASTLE: IceKind[][] = [
  ['icecube', 'icecube', 'icewindow', 'icetop'],
  ['icecube', 'icewindow'],
  ['icecube', 'icecube', 'icecube', 'icewindow', 'icetop'],
  ['icecube', 'icewindow'],
  ['icecube', 'icecube', 'icewindow', 'icetop'],
];
/** Ice blocks are 80 wide: the columns stand flush side by side. */
const BLOCK_W = 80;

function iceCastle(x: number, depth: number): ObjectDef[] {
  return CASTLE.map((items, i) => ({ type: 'stack', x: x + (i - (CASTLE.length - 1) / 2) * BLOCK_W, items, depth }));
}

// The winter town: thirteen screens of snow, looping round like the farm. A
// sleigh with gifts, an ice castle and the ice chest to build with, a house with a fox at its
// window, candles for the ice columns, stalls of sweets, cocoa, hats, fast food
// and ornaments, the post van with parcels, the snow plough and the snow cannon
// for snowmen, two sled hills, the ice rink up on a terrace under a string
// of lights, a Christmas market table, and Santa's chair with the polar bear in it,
// small friends on its arms, presents and a radio playing carols.
export const winter: SceneDef = {
  width: 13 * 1024,
  start: 100,
  theme: 'winter',
  objects: [
    // Screen 0: the sleigh with a gift on the back, and the reindeer.
    { type: 'pine', x: 120, seed: 0, garland: true },
    { type: 'vehicle', x: 460, vehicle: 'sleigh' },
    { type: 'animal', x: 730, animal: 'reindeer', depth: GROUND_Y + 40, hat: 'earmuffs' },

    // Screen 1: an ice castle built from the ice chest's blocks (towers with turret tops at the
    // ends and the middle, walls with windows between), then the ice chest itself, with open snow to
    // build in, a bin for spare blocks, the penguin and a lamp.
    ...iceCastle(1060, GROUND_Y + 20),
    { type: 'stall', x: 1420, look: 'icechest' },
    { type: 'animal', x: 1610, animal: 'penguin', depth: GROUND_Y + 50, hat: 'pompom' },
    { type: 'lamp', x: 1700 },
    { type: 'bin', x: 1830 },
    { type: 'pine', x: 2010, seed: 1 },

    // Screen 2: a town house with the fox behind an upstairs shutter, a box of decorations on
    // its step for the pine beside it, and the spinning top.
    { type: 'house', x: 2400, style: 'town' },
    { type: 'animal', x: 2530, animal: 'fox', depth: GROUND_Y + 40, home: 'house', seat: 3 },
    { type: 'decorbox', x: 2500 },
    { type: 'pine', x: 2740, seed: 6 },
    { type: 'toy', x: 2890, toy: 'top', depth: GROUND_Y + 50 },
    { type: 'lamp', x: 3010 },

    // Screen 3: the candle stall and the ice columns, with a bench to watch them from.
    { type: 'stall', x: 3260, look: 'candles' },
    { type: 'columns', x: 3660 },
    { type: 'bench', x: 3990 },

    // Screen 4: the sweet stall, the bunny and a bin.
    { type: 'stall', x: 4300, look: 'sweets' },
    { type: 'animal', x: 4520, animal: 'bunny', depth: GROUND_Y + 40 },
    { type: 'bin', x: 4760 },
    { type: 'pine', x: 5010, seed: 2, garland: true },

    // Screen 5: the post van with parcels under a string of lights across the street, and the raccoon.
    { type: 'lights', x: 5640, width: 620 },
    { type: 'vehicle', x: 5440, vehicle: 'postvan' },
    { type: 'animal', x: 5760, animal: 'raccoon', depth: GROUND_Y + 50, hat: 'beanie' },
    { type: 'lamp', x: 6060 },

    // Screen 6: the snow plough, a lit pine, and the cocoa hut, with the cat.
    { type: 'vehicle', x: 6380, vehicle: 'plough' },
    { type: 'pine', x: 6640, seed: 5, garland: true },
    { type: 'stall', x: 6880, look: 'cocoa' },
    { type: 'animal', x: 7060, animal: 'cat', depth: GROUND_Y + 40 },

    // Screen 7: the fast food stall and a Christmas market table, with the pig and a hen at it.
    { type: 'stall', x: 7400, look: 'food' },
    { type: 'market', x: 7790 },
    { type: 'animal', x: 7622, animal: 'pig', depth: GROUND_Y + 40, hat: 'beanie', home: 'table', seat: 0 },
    { type: 'animal', x: 7958, animal: 'hen', depth: GROUND_Y + 40, home: 'table', seat: 1 },
    { type: 'lamp', x: 8100 },

    // Screen 8: the first sled hill with the sheep on a bench to watch, and the snow cannon.
    { type: 'sledhill', x: 8620 },
    { type: 'bench', x: 8400 },
    { type: 'animal', x: 8360, animal: 'sheep', depth: GROUND_Y + 40, hat: 'earmuffs', home: 'bench', seat: 0 },
    { type: 'cannon', x: 9070 },

    // Screen 9: the hat stall, a bin, and a snowman someone already built.
    { type: 'stall', x: 9450, look: 'hats' },
    { type: 'bin', x: 9740 },
    { type: 'pine', x: 9880, seed: 3 },
    { type: 'stack', x: 10060, items: ['snowball4', 'snowball3', 'snowball2', 'tophat'], depth: GROUND_Y + 40 },

    // Screen 10: the second sled hill, and the ornament stall with a pine right by it.
    { type: 'sledhill', x: 10660 },
    { type: 'stall', x: 11100, look: 'ornaments' },
    { type: 'pine', x: 11340, seed: 7, height: 440 },

    // Screen 11: the ice rink up on a snowy terrace, with the seal on it, under a string of lights.
    { type: 'lights', x: 11860, width: 740 },
    { type: 'rink', x: 11860, width: 640 },
    { type: 'animal', x: 11720, animal: 'seal', depth: GROUND_Y - 130 },

    // Screen 12: a lit pine, Santa's chair with the polar bear dressed as Santa, and the radio.
    { type: 'pine', x: 12420, seed: 4, garland: true },
    // Santa's chair: the polar bear in it, a penguin and the bunny on its arms, presents beside it.
    { type: 'santachair', x: 12740 },
    { type: 'animal', x: 12740, animal: 'polarbear', depth: GROUND_Y + 60, hat: 'santa', home: 'chair', seat: 0 },
    { type: 'animal', x: 12644, animal: 'penguin', depth: GROUND_Y + 40, home: 'chair', seat: 1 },
    { type: 'animal', x: 12836, animal: 'bunny', depth: GROUND_Y + 40, home: 'chair', seat: 2 },
    { type: 'stack', x: 12905, items: ['giftBig', 'giftSmall'], depth: GROUND_Y + 34 },
    { type: 'stack', x: 12975, items: ['giftTall'], depth: GROUND_Y + 44 },
    { type: 'boombox', x: 13080, style: 'winter' },
    { type: 'lamp', x: 13250 },
  ],
};
