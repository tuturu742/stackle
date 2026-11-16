// The spinning top: a toy like any other (carry it, stack it, stack on it), but
// dropped or thrown it lands spinning, wobbles as it slows, and flops over onto
// one of its four sides, each with its own picture and sound. Its eyes squeeze
// shut while it whirls and go dizzy when it falls over.

export const TOP = { radius: 30, height: 70 };

/** Seconds of spinning after a landing, before it wobbles over. */
export const SPIN_SECONDS = 2.6;
/** Seconds it takes to tip over onto its side. */
const TIP_SECONDS = 0.3;
/** Seconds of dizzy eyes after falling over. */
export const DIZZY_SECONDS = 1.4;

/** The four sides: panel colour and the picture on it. */
const SIDES: { color: string; mark: string; draw: (ctx: CanvasRenderingContext2D, r: number) => void }[] = [
  { color: '#8cc9e8', mark: '#fff3b0', draw: star },
  { color: '#f3a3c4', mark: '#e8665c', draw: heart },
  { color: '#a5d98a', mark: '#f2a541', draw: flower },
  { color: '#c3a9e6', mark: '#fff8dc', draw: moon },
];

export interface TopState {
  /** Seconds of spinning left, 0 when still. */
  spin: number;
  /** How far round it has turned, in sides (1 = one side further). */
  turn: number;
  /** The side it will land on, and shows once fallen over. */
  side: number;
  /** -1 or 1 lying on its left or right, 0 upright; in between while tipping. */
  lying: number;
  /** Which way it falls when it stops. */
  fallTo: number;
  dizzy: number;
}

export function newTop(): TopState {
  return { spin: 0, turn: 0, side: 0, lying: 0, fallTo: 1, dizzy: 0 };
}

/** It lands and starts spinning; where it ends up is picked now. */
export function startSpin(top: TopState): void {
  top.spin = SPIN_SECONDS;
  top.lying = 0;
  top.dizzy = 0;
  top.side = Math.floor(Math.random() * 4);
  top.fallTo = Math.random() < 0.5 ? -1 : 1;
  // Turn so the chosen side faces front exactly as it stops.
  top.turn = top.side - totalTurn();
}

/** Picked up: it stands upright again and stops. */
export function stopTop(top: TopState): void {
  top.spin = 0;
  top.lying = 0;
  top.dizzy = 0;
}

/** Sides turned in a whole spin: fast at first, slowing to a stop. */
function totalTurn(): number {
  return turned(SPIN_SECONDS);
}

/** Sides turned after `t` seconds of a spin: it starts at 22 sides a second and slows evenly to a stop. */
function turned(t: number): number {
  const v0 = 22;
  return v0 * t - (v0 / (2 * SPIN_SECONDS)) * t * t;
}

/** Returns true in the step it comes to rest on its side. */
export function updateTop(top: TopState, dt: number): boolean {
  top.dizzy = Math.max(0, top.dizzy - dt);
  if (top.spin > 0) {
    const before = SPIN_SECONDS - top.spin;
    top.spin = Math.max(0, top.spin - dt);
    top.turn += turned(SPIN_SECONDS - top.spin) - turned(before);
    // Run out: it starts to tip over onto its side.
    if (top.spin === 0) {
      top.turn = top.side;
      top.lying = top.fallTo * 0.01;
    }
    return false;
  }
  if (top.lying !== 0 && Math.abs(top.lying) < 1) {
    top.lying = Math.sign(top.lying) * Math.min(1, Math.abs(top.lying) + dt / TIP_SECONDS);
    if (Math.abs(top.lying) >= 1) {
      top.dizzy = DIZZY_SECONDS;
      return true;
    }
  }
  return false;
}

export function drawTop(
  ctx: CanvasRenderingContext2D,
  top: TopState,
  x: number,
  y: number,
  angle: number,
  scaleX: number,
  scaleY: number,
  reduceMotion: boolean,
): void {
  const { radius: r, height: h } = TOP;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Lying down: turned onto its side, resting on the ground, with a little bounce as it lands.
  const lie = top.lying;
  if (lie !== 0) {
    const t = Math.abs(lie);
    const ease = t * t;
    ctx.translate(0, h / 2);
    ctx.rotate(Math.sign(lie) * ease * (Math.PI / 2 - 0.22));
    ctx.translate(0, -h / 2 + ease * (h / 2 - r) * 0.2);
  } else if (top.spin > 0 && !reduceMotion) {
    // Wobbling more and more as it slows, round its tip.
    const slow = 1 - top.spin / SPIN_SECONDS;
    const wobble = slow * slow * 0.28 * Math.sin(top.turn * 1.2);
    ctx.translate(0, h / 2);
    ctx.rotate(wobble);
    ctx.translate(0, -h / 2);
  }
  ctx.scale(scaleX, scaleY);

  // Handle on top.
  ctx.fillStyle = '#d9a35b';
  ctx.beginPath();
  ctx.roundRect(-6, -h / 2, 12, 20, 6);
  ctx.fill();
  // Body: a shoulder, the barrel with its four sides, and a pointy tip.
  const turn = ((top.turn % 4) + 4) % 4;
  const front = Math.floor(turn + 0.5) % 4;
  ctx.fillStyle = SIDES[front].color;
  ctx.beginPath();
  ctx.ellipse(0, -h / 2 + 24, r * 0.82, 12, 0, Math.PI, 0);
  ctx.fill();
  const barrelTop = -h / 2 + 22;
  const barrelH = 32;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-r, barrelTop, r * 2, barrelH, 8);
  ctx.clip();
  // Two sides in view, sliding past as it turns.
  const shift = turn - Math.floor(turn);
  for (let k = 0; k < 2; k++) {
    const side = SIDES[(Math.floor(turn) + k) % 4];
    const cx = (k - shift) * r * 2;
    ctx.fillStyle = side.color;
    ctx.fillRect(cx - r, barrelTop, r * 2, barrelH);
    ctx.fillStyle = side.mark;
    ctx.save();
    ctx.translate(cx, barrelTop + barrelH / 2 + 1);
    side.draw(ctx, 10);
    ctx.restore();
  }
  // A soft shade on either edge makes it look round.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.fillRect(-r, barrelTop, 7, barrelH);
  ctx.fillRect(r - 7, barrelTop, 7, barrelH);
  ctx.restore();
  ctx.fillStyle = SIDES[front].color;
  ctx.beginPath();
  ctx.moveTo(-r, barrelTop + barrelH - 6);
  ctx.quadraticCurveTo(-r * 0.8, h / 2 - 10, 0, h / 2);
  ctx.quadraticCurveTo(r * 0.8, h / 2 - 10, r, barrelTop + barrelH - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, barrelTop + barrelH);
  ctx.quadraticCurveTo(-r * 0.5, h / 2 - 12, 0, h / 2);
  ctx.quadraticCurveTo(-r * 0.2, h / 2 - 16, -r * 0.2, barrelTop + barrelH);
  ctx.closePath();
  ctx.fill();
  // Eyes on the shoulder: squeezed shut while whirling, dizzy spirals after a fall, happy otherwise.
  drawEyes(ctx, top, barrelTop - 4);
  ctx.restore();
}

function drawEyes(ctx: CanvasRenderingContext2D, top: TopState, y: number): void {
  const ink = '#4a3f45';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (const dx of [-9, 9]) {
    ctx.beginPath();
    if (top.dizzy > 0) {
      // A little spiral.
      for (let a = 0; a < Math.PI * 4; a += 0.4) {
        const rr = 1 + a * 0.45;
        const px = dx + Math.cos(a + top.dizzy * 6) * rr;
        const py = y + Math.sin(a + top.dizzy * 6) * rr;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (top.spin > 0.6) {
      // > <
      const s = Math.sign(dx);
      ctx.moveTo(dx - s * 4, y - 4);
      ctx.lineTo(dx + s * 2, y);
      ctx.lineTo(dx - s * 4, y + 4);
      ctx.stroke();
    } else {
      ctx.arc(dx, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function star(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function heart(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.6, -r * 1.1, 0, -r * 0.4);
  ctx.bezierCurveTo(r * 0.6, -r * 1.1, r * 1.3, -r * 0.1, 0, r * 0.9);
  ctx.fill();
}

function flower(ctx: CanvasRenderingContext2D, r: number): void {
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function moon(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.3, Math.PI * 1.7);
  ctx.arc(r * 0.45, -r * 0.1, r * 0.75, Math.PI * 1.55, Math.PI * 0.45, true);
  ctx.closePath();
  ctx.fill();
}
