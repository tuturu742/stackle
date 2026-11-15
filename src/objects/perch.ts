import type { Item } from './item';

/**
 * Somewhere a stack can be set down and then moves with: a vehicle seat, the
 * swing, the grill, the coop's nest, a window sill. A perch has one or more seats.
 */
export interface Perch {
  /** Stacks on a seat are drawn just in front of this. */
  readonly depth: number;
  readonly seatCount: number;
  seatX(i: number): number;
  /** Where a stack on the seat rests its bottom. */
  seatTop(i: number): number;
  /** How far either side of the seat's middle a let-go still counts. */
  seatReach(i: number): number;
  /** Will this seat take a stack with this bottom item right now? */
  accepts?(i: number, bottom: Item): boolean;
  /** Is whatever sits on this seat out of sight and reach (a shut window)? */
  hides?(i: number): boolean;
  /** Clip what sits on the seat, so it shows only through its opening. */
  clip?(ctx: CanvasRenderingContext2D, i: number): void;
  /** A stack was just set down here. */
  seated?(i: number, sideways: number): void;
}
