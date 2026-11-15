import type { ItemKind } from './objects/item';
import type { VegKind } from './objects/veg';

// The scene is kept on the device, so the farm is as it was left when the app
// opens again. Nothing ever leaves the device.

export interface SavedStack {
  items: ItemKind[];
  x: number;
  /** Ground line it stands on. */
  floor: number;
  /** Resting on a tree fruit or a bed vegetable, by index. */
  tree?: [number, number];
  bed?: [number, number];
  /** Floating in a puddle or sitting on a bin, by index: puddles first, then bins. */
  puddle?: number;
  /** Sitting on a seat (vehicle, swing, grill, coop, sill), by perch index and seat. */
  perch?: [number, number];
}

export interface Saved {
  version: 1;
  /** Trees, beds and clouds are only restored into the same layout they were saved from. */
  layout: string;
  camX: number;
  night: boolean;
  stacks: SavedStack[];
  trees: number[][];
  beds: { kind: VegKind; growth: number }[][];
  clouds: [number, number][];
  vehicles?: number[];
  /** How far each barn door has slid open. */
  barns?: number[][];
  dispensers?: number[];
  baskets?: number[];
  /** Which farmhouse windows are open. */
  windows?: boolean[][];
  /** Which farmhouse doors are open. */
  doors?: boolean[];
}

const KEY = 'stackle.scene';
let last = '';
let enabled = true;

/** Forget the farm, so the app opens fresh next time; nothing more is saved until then. */
export function clear(): void {
  enabled = false;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to forget.
  }
}

export function load(): Saved | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null;
    return saved?.version === 1 && Array.isArray(saved.stacks) ? saved : null;
  } catch {
    return null;
  }
}

/** Write the scene, only when it changed. */
export function store(saved: Saved): void {
  if (!enabled) return;
  const text = JSON.stringify(saved);
  if (text === last) return;
  try {
    localStorage.setItem(KEY, text);
    last = text;
  } catch {
    // Storage full or blocked: play goes on, just without remembering.
  }
}
