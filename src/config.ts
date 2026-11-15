// World units: the design screen is 1024x768 (iPad landscape). The view scales
// this to fit and shows extra sky or ground on other aspect ratios.
export const SCREEN_W = 1024;
export const WORLD_H = 768;
export const GROUND_Y = 640;

export const STEP = 1 / 60;

// Touch is forgiving: an object can be grabbed this far outside its shape.
export const GRAB_SLOP = 32;

// Depth on the ground: a larger floor line is nearer the viewer and drawn in front.
// Things dropped from the air land on FALL_FLOOR, just in front of the puddles
// (whose front edge is at about GROUND_Y + 79).
export const FALL_FLOOR = GROUND_Y + 88;
export const FRONT_FLOOR = WORLD_H - 14;
/** Letting go with the bottom at least this low counts as putting it on the ground. */
export const GROUND_BAND = GROUND_Y - 24;

export const GRAVITY = 1800;

// Let go slower than this and the thing is placed; faster is a flick. A flick
// only sends things a short way (world units per second).
export const PLACE_SPEED = 400;
export const MAX_RELEASE_SPEED = 600;

/** Towers can grow only this close to the top of the screen. */
export const TOP_MARGIN = 8;

export const REGROW_SECONDS = 3;

export const palette = {
  skyTop: '#bfe3f2',
  skyBottom: '#e8f5ef',
  sun: '#fff1c2',
  hillFar: '#c9e6b8',
  hillNear: '#addb9a',
  ground: '#8fcf7e',
  groundDark: '#7cbf6c',
  trunk: '#a7826a',
  canopy: '#6fbf73',
  canopyLight: '#86cc84',
  water: '#7cc4e8',
  waterLight: '#a9dcf3',
  waterDeep: '#5fb0dc',
  leaf: '#5aa860',
  stem: '#7a5a46',
};
