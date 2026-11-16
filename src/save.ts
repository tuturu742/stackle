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
  /** The winter town: each stall's next thing, each vehicle's next gift or parcel. */
  stalls?: number[];
  offers?: number[];
  /** Which song each boombox plays, 0 for off. */
  songs?: number[];
  /** Which farmhouse windows are open. */
  windows?: boolean[][];
  /** Which farmhouse doors are open. */
  doors?: boolean[];
}

/**
 * The level being played is kept under its own key until it is left, so if the app is
 * reloaded mid-play (iPadOS does that to home-screen apps) it opens straight back into it.
 * Leaving a level forgets it: going in again starts fresh. Summer's farm was once the
 * only scene, kept under the old key.
 */
const PREFIX = 'stackle.scene.';
const OLD_KEY = 'stackle.scene';
/** Which level's card the hub shows when the app opens. */
const HUB_KEY = 'stackle.hub';
/** The level being played when the app was last left, if it was not left for the hub. */
const PLAYING_KEY = 'stackle.playing';
const last = new Map<string, string>();
let enabled = true;

/** Forget every level, so the app opens fresh next time; nothing more is saved until then. */
export function clear(): void {
  enabled = false;
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(OLD_KEY) || key === HUB_KEY || key === PLAYING_KEY) localStorage.removeItem(key);
  } catch {
    // Nothing to forget.
  }
}

export function load(level: string): Saved | null {
  try {
    let text = localStorage.getItem(PREFIX + level);
    if (text === null && level === 'summer') text = localStorage.getItem(OLD_KEY);
    const saved = JSON.parse(text ?? 'null') as Saved | null;
    return saved?.version === 1 && Array.isArray(saved.stacks) ? saved : null;
  } catch {
    return null;
  }
}

/** Write a level's scene, only when it changed. */
export function store(level: string, saved: Saved): void {
  if (!enabled) return;
  const text = JSON.stringify(saved);
  if (text === last.get(level)) return;
  try {
    localStorage.setItem(PREFIX + level, text);
    last.set(level, text);
  } catch {
    // Storage full or blocked: play goes on, just without remembering.
  }
}

/** The level being played, or null for the hub. */
export function loadPlaying(): string | null {
  try {
    return localStorage.getItem(PLAYING_KEY) ?? (localStorage.getItem(OLD_KEY) !== null ? 'summer' : null);
  } catch {
    return null;
  }
}

export function storePlaying(level: string | null): void {
  if (!enabled) return;
  try {
    if (level) localStorage.setItem(PLAYING_KEY, level);
    else localStorage.removeItem(PLAYING_KEY);
  } catch {
    // Not remembered; the app opens on the hub.
  }
}

/** Forget a level that was left, so it starts fresh next time. */
export function forget(level: string): void {
  last.delete(level);
  try {
    localStorage.removeItem(PREFIX + level);
    if (level === 'summer') localStorage.removeItem(OLD_KEY);
  } catch {
    // Nothing to forget.
  }
}

/** The hub's card, as it was left. */
export function loadHub(): string | null {
  try {
    return localStorage.getItem(HUB_KEY);
  } catch {
    return null;
  }
}

export function storeHub(level: string): void {
  if (!enabled) return;
  try {
    localStorage.setItem(HUB_KEY, level);
  } catch {
    // Not remembered; the hub opens on its first playable card.
  }
}
