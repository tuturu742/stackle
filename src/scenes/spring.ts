import { GROUND_Y } from '../config';
import type { SceneDef } from './scene';

// Spring: a park at the edge of a little town, nine screens that loop round,
// behind a flowering hedge with the town's roofs beyond and a sandy path in
// front. Cherry trees in flower, flower gardens the rain brings up, a beehive
// with honey, a birdhouse and butterflies that follow a carried flower, a
// playground (slide, seesaw, merry-go-round), a fountain and an ice-cream cart,
// the frog pond with lily pads, an Easter egg hunt (painted eggs tucked away all
// over the park, hidden again out of sight once found) and a nest where an egg
// hatches into a chick, a kite and a ribbon pole, a stream with a little bridge, the
// greenhouse, and a rainbow after rain.
export const spring: SceneDef = {
  width: 9 * 1024,
  start: 60,
  theme: 'spring',
  objects: [
    // Screen 0: a cherry tree in blossom, the beehive, butterflies over the flowers, the birdhouse.
    { type: 'tree', x: 190, fruit: 'cherry', look: 'blossom' },
    { type: 'flowers', x: 400, seed: 1 },
    { type: 'hive', x: 560 },
    { type: 'flowers', x: 720, seed: 2 },
    { type: 'butterflies', x: 600, width: 700 },
    { type: 'birdhouse', x: 890 },

    // Screen 1: flower gardens under a rain cloud, and the fountain.
    { type: 'cloud', x: 1400, y: 150 },
    { type: 'bed', x: 1240, width: 340, veg: ['tulip', 'daffodil', 'daisy', 'tulip'] },
    { type: 'bed', x: 1640, width: 260, veg: ['daisy', 'tulip', 'daffodil'] },
    { type: 'fountain', x: 1920 },

    // Screen 2: the playground: the slide, and the seesaw with two chicks on it.
    { type: 'slide', x: 2250 },
    { type: 'seesaw', x: 2700 },
    { type: 'animal', x: 2560, animal: 'chick', depth: GROUND_Y + 40, home: 'seesaw', seat: 0 },
    { type: 'animal', x: 2840, animal: 'chick', depth: GROUND_Y + 40, home: 'seesaw', seat: 1 },

    // Screen 3: the frog pond with lily pads, the frog and the duck, and the bunny's bush.
    { type: 'puddle', x: 3330, width: 520 },
    { type: 'lilypads', x: 3330 },
    { type: 'animal', x: 3330, animal: 'frog', depth: GROUND_Y + 40, home: 'pads' },
    { type: 'animal', x: 3200, animal: 'duck', depth: GROUND_Y + 40, home: 'pond' },
    { type: 'bush', x: 3760, seed: 3, animal: 'bunny' },
    { type: 'bird', x: 3900, color: '#7fa7d9' },

    // Screen 4: the nest, the lamb, the kite and the ribbon pole.
    { type: 'nest', x: 4400 },
    { type: 'animal', x: 4560, animal: 'lamb', depth: GROUND_Y + 56 },
    { type: 'toy', x: 4700, toy: 'kite', depth: GROUND_Y + 50 },
    { type: 'ribbonpole', x: 4900 },

    // Screen 5: the merry-go-round, the ice-cream cart, and the squirrel on a park bench.
    { type: 'carousel', x: 5300 },
    { type: 'stall', x: 5700, look: 'icecream' },
    { type: 'bench', x: 5980 },
    { type: 'animal', x: 6022, animal: 'squirrel', depth: GROUND_Y + 40, home: 'bench', seat: 1 },

    // Screen 6: a white-blossomed pear tree, and the stream with its bridge and the duck.
    { type: 'tree', x: 6280, fruit: 'pear', look: 'blossom' },
    { type: 'puddle', x: 6720, width: 440 },
    { type: 'bridge', x: 6720, width: 520 },
    { type: 'animal', x: 6640, animal: 'duck', depth: GROUND_Y + 40, home: 'pond' },

    // Screen 7: the greenhouse, the wheelbarrow, the cat, and a muddy puddle to splash in.
    { type: 'greenhouse', x: 7380 },
    { type: 'vehicle', x: 7680, vehicle: 'barrow' },
    { type: 'animal', x: 7820, animal: 'cat', depth: GROUND_Y + 56 },
    { type: 'mud', x: 7990, width: 180 },

    // Screen 8: a bin, the spinning top, the hedgehog, a rock and a bush, back round to the cherry tree.
    { type: 'bin', x: 8330 },
    { type: 'toy', x: 8520, toy: 'top', depth: GROUND_Y + 50 },
    { type: 'animal', x: 8640, animal: 'hedgehog', depth: GROUND_Y + 44 },
    { type: 'rock', x: 8780, seed: 5 },
    { type: 'bush', x: 8960, seed: 6 },
    { type: 'bird', x: 9000, color: '#e8a06b' },

    // The Easter egg hunt: one painted egg in each hiding place, spread over the park.
    {
      type: 'egghunt',
      spots: [
        { x: 340, depth: GROUND_Y + 150, cover: 'grass' },
        { x: 1010, depth: GROUND_Y + 40, cover: 'flowers' },
        { x: 2080, depth: GROUND_Y + 150, cover: 'leaves' },
        { x: 3010, depth: GROUND_Y + 60, cover: 'stones' },
        { x: 4170, depth: GROUND_Y + 40, cover: 'grass' },
        { x: 5520, depth: GROUND_Y + 150, cover: 'flowers' },
        { x: 7080, depth: GROUND_Y + 50, cover: 'leaves' },
        { x: 8140, depth: GROUND_Y + 140, cover: 'stones' },
      ],
    },
  ],
};
