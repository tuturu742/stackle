import { sizeOf } from './item';
import type { Offered } from './offer';
import type { Perch } from './perch';

/**
 * The thing a giver has waiting to be taken (a stall's next thing, the honey jar, a
 * gift on the sleigh, a painted egg...) as a seat: a stack let go on top of it stays
 * there, and taking it takes that stack along, like a fruit on the tree.
 */
export class OfferSeat implements Perch {
  readonly seatCount = 1;

  constructor(
    /** The giver (or egg spot) it belongs to. */
    readonly owner: object,
    private readonly spot: () => Offered | null,
    private readonly depthOf: () => number,
  ) {}

  get depth(): number {
    return this.depthOf();
  }

  seatX(): number {
    return this.spot()?.x ?? 0;
  }

  seatTop(): number {
    const spot = this.spot();
    return spot ? spot.bottom - sizeOf(spot.kind as never).height : 0;
  }

  seatReach(): number {
    const spot = this.spot();
    return spot ? Math.max(24, sizeOf(spot.kind as never).radius) : 0;
  }

  accepts(): boolean {
    return this.spot() !== null;
  }
}
