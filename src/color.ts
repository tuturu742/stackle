/** Blend two `#rrggbb` colours: t = 0 gives `a`, t = 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const channel = (shift: number) => {
    const ca = (pa >> shift) & 255;
    return Math.round(ca + (((pb >> shift) & 255) - ca) * t);
  };
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}
