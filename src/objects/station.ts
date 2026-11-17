import { GROUND_Y } from '../config';
import { settings } from '../settings';
import type { Item } from './item';
import type { Perch } from './perch';

// Places that turn one thing into another, like the picnic grill: put the right
// thing on and after a little while the game swaps it for what it makes. Each
// shows it is at work while `working` (seconds, set by the game) counts up.

const WOOD = '#b98153';
const WOOD_DARK = '#8d5c4f';
const WOOD_LIGHT = '#d4a06f';
const IRON = '#5b6170';

/** A workbench for carving pumpkins into lanterns. */
export class CarvingTable implements Perch {
  readonly depth = GROUND_Y + 22;
  readonly seatCount = 1;
  working = 0;

  constructor(readonly x: number) {}

  seatX(): number {
    return this.x;
  }

  seatTop(): number {
    return this.depth - 78;
  }

  seatReach(): number {
    return 56;
  }

  accepts(_i: number, bottom: Item): boolean {
    return bottom.kind === 'pumpkin';
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const x = this.x;
    const top = this.seatTop();
    // Sturdy legs with a stretcher, and a thick top.
    ctx.fillStyle = WOOD_DARK;
    for (const dx of [-82, 68]) ctx.fillRect(x + dx, top + 10, 14, this.depth - top - 10);
    ctx.fillRect(x - 76, this.depth - 26, 150, 9);
    box(ctx, x - 96, top, 192, 16, 6, WOOD);
    ctx.fillStyle = WOOD_LIGHT;
    ctx.fillRect(x - 90, top + 3, 180, 3);
    // Tools laid out at the ends: a little knife and a spoon-scoop.
    box(ctx, x - 92, top - 5, 22, 6, 3, WOOD_DARK);
    box(ctx, x - 70, top - 4, 18, 4, 2, '#c7ccd4');
    box(ctx, x + 62, top - 4, 20, 5, 2.5, WOOD_DARK);
    ctx.fillStyle = '#c7ccd4';
    ctx.beginPath();
    ctx.ellipse(x + 88, top - 3, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // While carving, little curls of pumpkin flick off to the sides.
    if (this.working <= 0) return;
    const amount = settings.reduceMotion ? 0.4 : 1;
    ctx.fillStyle = '#f0a04b';
    for (let i = 0; i < 4; i++) {
      const t = (time * 1.6 + i * 0.25) % 1;
      const side = i % 2 ? 1 : -1;
      const cx = x + side * (30 + t * 60 * amount);
      const cy = top - 50 - Math.sin(t * Math.PI) * 40 * amount + t * 30;
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 1.4);
      ctx.lineTo(cx, cy);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** An old wooden fruit press: apples or pears on its tray come out as juice. */
export class CiderPress implements Perch {
  readonly depth = GROUND_Y + 22;
  readonly seatCount = 1;
  working = 0;

  constructor(readonly x: number) {}

  seatX(): number {
    return this.x;
  }

  seatTop(): number {
    return this.depth - 100;
  }

  seatReach(): number {
    return 50;
  }

  accepts(_i: number, bottom: Item): boolean {
    return bottom.kind === 'apple' || bottom.kind === 'pear';
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const x = this.x;
    const g = this.depth;
    const tray = this.seatTop();
    // The frame: two posts and a crossbeam high above the tray, carrying the screw.
    const beam = tray - 92;
    ctx.fillStyle = WOOD_DARK;
    for (const dx of [-62, 50]) ctx.fillRect(x + dx, beam, 12, g - beam);
    box(ctx, x - 70, beam - 6, 140, 16, 5, WOOD);
    // The stand and the slatted barrel.
    ctx.fillStyle = WOOD_DARK;
    ctx.fillRect(x - 46, g - 24, 92, 24);
    box(ctx, x - 40, tray + 8, 80, g - 24 - tray - 8, 8, WOOD_LIGHT);
    ctx.fillStyle = WOOD;
    for (const dx of [-24, -6, 12]) ctx.fillRect(x + dx, tray + 12, 6, g - 24 - tray - 16);
    ctx.fillStyle = IRON;
    ctx.fillRect(x - 42, tray + 18, 84, 5);
    ctx.fillRect(x - 42, g - 40, 84, 5);
    // The tray on top of the barrel, where the fruit goes.
    box(ctx, x - 50, tray, 100, 10, 4, WOOD);
    // The screw down through the beam, and the wheel on top that turns while pressing.
    const turn = this.working * 2.2;
    ctx.fillStyle = IRON;
    ctx.fillRect(x - 4, beam - 26, 8, 30);
    const wheelY = beam - 30;
    ctx.save();
    ctx.translate(x, wheelY);
    ctx.scale(1, 0.35);
    ctx.strokeStyle = WOOD_DARK;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 5;
    for (let k = 0; k < 4; k++) {
      const a = turn + (k * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30);
      ctx.stroke();
    }
    ctx.restore();
    // A handle peg on the wheel's rim, so the turning shows from the side.
    ctx.fillStyle = WOOD_LIGHT;
    ctx.beginPath();
    ctx.arc(x + Math.cos(turn) * 30, wheelY + Math.sin(turn) * 10.5 - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    // The spout and the little bucket under it.
    box(ctx, x + 36, g - 56, 26, 8, 3, WOOD_DARK);
    const bx = x + 70;
    ctx.fillStyle = '#9aa5b4';
    ctx.beginPath();
    ctx.moveTo(bx - 16, g - 30);
    ctx.lineTo(bx + 16, g - 30);
    ctx.lineTo(bx + 12, g);
    ctx.lineTo(bx - 12, g);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8b05a';
    ctx.beginPath();
    ctx.ellipse(bx, g - 29, 15, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // While pressing, juice drips from the spout.
    if (this.working <= 0) return;
    ctx.fillStyle = '#e8b05a';
    for (let i = 0; i < 3; i++) {
      const t = (time * 1.8 + i / 3) % 1;
      ctx.beginPath();
      ctx.ellipse(x + 60, g - 50 + t * 18, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A campfire: a ring of stones, crossed logs and soft flames, with a spit across it to toast on. */
export class Campfire implements Perch {
  readonly depth = GROUND_Y + 24;
  readonly seatCount = 1;
  working = 0;
  lit = true;

  constructor(readonly x: number) {}

  seatX(): number {
    return this.x;
  }

  seatTop(): number {
    return this.depth - 74;
  }

  /** Generous: anything let go over the fire lands on the spit. */
  seatReach(): number {
    return 80;
  }

  /** A marshmallow to toast, or wood to burn. */
  accepts(_i: number, bottom: Item): boolean {
    return bottom.kind === 'marshmallow' || bottom.kind === 'firewood' || bottom.kind === 'kindling';
  }

  /** Something held here, just over the flames, toasts too, like on a stick. */
  over(x: number, bottom: number): boolean {
    return Math.abs(x - this.x) <= 80 && bottom >= this.seatTop() - 70 && bottom <= this.depth - 10;
  }

  /** The fire and its stones (the spit's seat is for toasting, not tapping). */
  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= 70 + slop && py <= this.depth + 8 + slop && py >= this.depth - 60 - slop;
  }

  /** Returns whether it is lit now. */
  toggle(): boolean {
    this.lit = !this.lit;
    return this.lit;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const x = this.x;
    const g = this.depth;
    // The forked sticks either side, and the spit resting across them.
    ctx.strokeStyle = WOOD_DARK;
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    const top = this.seatTop();
    for (const side of [-1, 1]) {
      const sx = x + side * 66;
      ctx.beginPath();
      ctx.moveTo(sx, g - 4);
      ctx.lineTo(sx, top + 6);
      ctx.moveTo(sx, top + 14);
      ctx.lineTo(sx - side * 10, top - 4);
      ctx.moveTo(sx, top + 14);
      ctx.lineTo(sx + side * 10, top - 4);
      ctx.stroke();
    }
    // Crossed logs.
    for (const [dx, a] of [
      [-6, -0.35],
      [6, 0.35],
    ]) {
      ctx.save();
      ctx.translate(x + dx, g - 16);
      ctx.rotate(a);
      box(ctx, -40, -8, 80, 16, 8, '#9a6a4a');
      ctx.fillStyle = '#d4a06f';
      ctx.beginPath();
      ctx.ellipse(a < 0 ? -38 : 38, 0, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // The flames: a few soft teardrops that sway and breathe, never flashing.
    if (this.lit) {
      const calm = settings.reduceMotion ? 0.4 : 1;
      for (const [dx, h, color, speed] of [
        [-16, 46, '#f2a541', 3.1],
        [14, 52, '#f2a541', 2.7],
        [0, 64, '#f6c84c', 3.6],
        [0, 34, '#fbe39a', 4.2],
      ] as const) {
        const sway = Math.sin(time * speed + dx) * 4 * calm;
        const tall = h * (1 + Math.sin(time * speed * 1.3 + dx) * 0.08 * calm);
        const fx = x + dx;
        const base = g - 18;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(fx + sway, base - tall);
        ctx.quadraticCurveTo(fx + 20, base - tall * 0.35, fx + 12, base);
        ctx.quadraticCurveTo(fx, base + 6, fx - 12, base);
        ctx.quadraticCurveTo(fx - 20, base - tall * 0.35, fx + sway, base - tall);
        ctx.fill();
      }
    } else {
      // Unlit: embers glowing softly in the ashes.
      for (const [dx, dy] of [
        [-16, -26],
        [2, -32],
        [16, -24],
      ]) {
        ctx.fillStyle = '#e8873a';
        ctx.globalAlpha = 0.6 + 0.3 * Math.sin(time * 1.5 + dx);
        ctx.beginPath();
        ctx.arc(x + dx, g + dy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // The spit across, drawn over the flames.
    ctx.strokeStyle = '#a7774f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 76, top + 4);
    ctx.lineTo(x + 76, top + 4);
    ctx.stroke();
    // The ring of stones in front.
    for (let i = 0; i < 7; i++) {
      const sx = x - 66 + i * 22;
      ctx.fillStyle = i % 2 ? '#a9adb3' : '#b8bcc2';
      ctx.beginPath();
      ctx.ellipse(sx, g - 4, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** At night a lit fire glows warmly over the dark. */
  drawGlow(ctx: CanvasRenderingContext2D, night: number): void {
    if (!this.lit || night <= 0) return;
    const y = this.depth - 40;
    const glow = ctx.createRadialGradient(this.x, y, 6, this.x, y, 170);
    glow.addColorStop(0, `rgba(255, 190, 110, ${0.6 * night})`);
    glow.addColorStop(1, 'rgba(255, 190, 110, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, y, 170, 0, Math.PI * 2);
    ctx.fill();
  }
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
