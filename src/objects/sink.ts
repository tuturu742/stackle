/** Somewhere things are put to make them go away: a puddle's water or a bin's opening. */
export interface Sink {
  readonly x: number;
  /** Drawing order. */
  readonly depth: number;
  /** Where a tower's bottom stays while its items go in one by one. */
  readonly drownY: number;
  /** Is a bottom edge let go at this point over the water or the opening? */
  holds(x: number, bottom: number): boolean;
  /** An animal put there stays: floating in water, sitting on a bin. */
  floatBottom(height: number): number;
  floatX(x: number, radius: number): number;
}
