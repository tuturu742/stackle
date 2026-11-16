import { GROUND_Y, SCREEN_W, WORLD_H } from './config';
import * as audio from './audio';
import type { Preview } from './previews';
import { settings } from './settings';

/** A level as the hub shows it: its card, and whether it can be played yet. */
export interface Card {
  id: string;
  preview: Preview;
  playable: boolean;
}

/** A finger that moves less than this (screen pixels) is a tap. */
const TAP_SLOP = 14;
/** How far past the first or last card a swipe can pull, in cards. */
const OVERPULL = 0.2;
/** The parents icon in the top left corner (screen pixels). */
const PARENTS = { x: 56, y: 56, r: 34 };

/**
 * Where the app opens: one full-screen card per level, side by side. Swipe left
 * or right to look through them; tap a card to go in. The top left corner holds
 * the hidden parent controls (see main.ts); a parents icon marks it.
 */
export class Hub {
  /** Which card is in view, as a position along the row: 1.5 is half way from the second to the third. */
  private pos: number;
  private target: number;
  private finger: { id: number; startX: number; startY: number; startPos: number; lastX: number; lastT: number; speed: number; moved: number } | null = null;
  private time = 0;
  private cssW = SCREEN_W;
  private cssH = WORLD_H;
  /** The play button gives a little pulse when pressed. */
  private press = 0;

  constructor(
    readonly cards: Card[],
    start: string | null,
    /** Called with a playable card when it is tapped. */
    private readonly onEnter: (card: Card) => void,
  ) {
    const i = cards.findIndex((c) => c.id === start);
    this.pos = this.target = Math.max(0, i >= 0 ? i : cards.findIndex((c) => c.playable));
  }

  /** The card in view (or being snapped to). */
  get current(): Card {
    return this.cards[this.target];
  }

  resize(cssW: number, cssH: number): void {
    this.cssW = cssW;
    this.cssH = cssH;
  }

  pointerDown(id: number, cssX: number, cssY: number): void {
    if (this.finger) return;
    this.finger = { id, startX: cssX, startY: cssY, startPos: this.pos, lastX: cssX, lastT: performance.now(), speed: 0, moved: 0 };
  }

  pointerMove(id: number, cssX: number, cssY: number): void {
    const f = this.finger;
    if (!f || f.id !== id) return;
    f.moved = Math.max(f.moved, Math.hypot(cssX - f.startX, cssY - f.startY));
    // Cards per second, smoothed, for a flick on release.
    const now = performance.now();
    const dt = Math.max(8, now - f.lastT) / 1000;
    f.speed = f.speed * 0.5 + (-(cssX - f.lastX) / this.cssW / dt) * 0.5;
    f.lastX = cssX;
    f.lastT = now;
    const last = this.cards.length - 1;
    let pos = f.startPos - (cssX - f.startX) / this.cssW;
    // Past either end it pulls less and less.
    if (pos < 0) pos = -OVERPULL * (1 - Math.exp(pos / OVERPULL));
    if (pos > last) pos = last + OVERPULL * (1 - Math.exp(-(pos - last) / OVERPULL));
    this.pos = pos;
  }

  /** The finger is taken for something else (the corner hold): it settles without a tap. */
  cancel(id: number): void {
    if (this.finger?.id !== id) return;
    this.finger = null;
    this.target = Math.max(0, Math.min(this.cards.length - 1, Math.round(this.pos)));
  }

  pointerUp(id: number): void {
    const f = this.finger;
    if (!f || f.id !== id) return;
    this.finger = null;
    if (f.moved < TAP_SLOP) return this.tap(f.startX, f.startY);
    // A flick goes one card on; a slow drag settles on the nearest.
    const from = Math.round(f.startPos);
    let to = Math.round(this.pos);
    if (Math.abs(f.speed) > 0.8) to = from + Math.sign(f.speed);
    to = Math.max(0, Math.min(this.cards.length - 1, Math.max(from - 1, Math.min(from + 1, to))));
    if (to !== this.target) audio.swoosh();
    this.target = to;
  }

  /** A tap goes into the level in view, or gives a card still to come a little wiggle. */
  private tap(cssX: number, cssY: number): void {
    // The parents corner is not for going in.
    if (Math.hypot(cssX - PARENTS.x, cssY - PARENTS.y) < PARENTS.r + 20) return;
    const card = this.cards[Math.round(this.pos)];
    if (!card) return;
    this.target = Math.round(this.pos);
    if (card.playable) {
      this.press = 1;
      audio.chime(false);
      this.onEnter(card);
    } else {
      card.preview.tap?.();
      audio.boop();
    }
  }

  update(dt: number): void {
    this.time += dt;
    this.press = Math.max(0, this.press - dt * 3);
    if (!this.finger) {
      const k = settings.reduceMotion ? 1 : Math.min(1, dt * 9);
      this.pos += (this.target - this.pos) * k;
      if (Math.abs(this.target - this.pos) < 0.001) this.pos = this.target;
    }
    for (const card of this.cards) card.preview.update?.(dt);
  }

  draw(ctx: CanvasRenderingContext2D, dpr: number): void {
    const scale = Math.min(this.cssW / SCREEN_W, this.cssH / WORLD_H);
    const viewW = this.cssW / scale;
    const viewH = this.cssH / scale;
    const camY = WORLD_H - viewH;
    // Each card's 1024-wide scene sits in the middle of the screen; wider screens show more either side.
    const left = -(viewW - SCREEN_W) / 2;
    const right = left + viewW;
    this.cards.forEach((card, i) => {
      const offset = (i - this.pos) * this.cssW;
      if (offset <= -this.cssW || offset >= this.cssW) return;
      const c = card.preview.colors;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, offset * dpr, 0);
      ctx.beginPath();
      ctx.rect(0, 0, this.cssW, this.cssH);
      ctx.clip();
      const sky = ctx.createLinearGradient(0, 0, 0, this.cssH);
      sky.addColorStop(0, c.skyTop);
      sky.addColorStop(1, c.skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, this.cssW, this.cssH);
      const k = scale * dpr;
      ctx.setTransform(k, 0, 0, k, offset * dpr - left * k, -camY * k);
      card.preview.draw(ctx, this.time, left, right);
      ctx.setTransform(dpr, 0, 0, dpr, offset * dpr, 0);
      if (card.playable) this.drawPlay(ctx, scale);
      ctx.restore();
    });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawDots(ctx);
    this.drawParents(ctx);
  }

  /** A big round play button low in the middle of a playable card. */
  private drawPlay(ctx: CanvasRenderingContext2D, scale: number): void {
    const r = Math.max(44, 64 * scale) * (1 + this.press * 0.1);
    const x = this.cssW / 2;
    const y = this.cssH - Math.max(60, (WORLD_H - GROUND_Y - 60) * scale);
    ctx.fillStyle = 'rgba(80, 120, 70, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y + 6, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f08a4b';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.86, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.28, y - r * 0.42);
    ctx.lineTo(x + r * 0.46, y);
    ctx.lineTo(x - r * 0.28, y + r * 0.42);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineWidth = r * 0.14;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.fill();
  }

  /** One dot per card along the bottom; the one in view is filled. */
  private drawDots(ctx: CanvasRenderingContext2D): void {
    const n = this.cards.length;
    const gap = 26;
    const y = this.cssH - 22;
    for (let i = 0; i < n; i++) {
      const x = this.cssW / 2 + (i - (n - 1) / 2) * gap;
      const near = Math.max(0, 1 - Math.abs(i - this.pos));
      ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + 0.5 * near})`;
      ctx.beginPath();
      ctx.arc(x, y, 6 + 2 * near, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** The parents icon in the top left corner, where a long hold opens the parent controls. */
  private drawParents(ctx: CanvasRenderingContext2D): void {
    const { x, y } = PARENTS;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, PARENTS.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a8f99';
    for (const [dx, head, body] of [
      [-8, 9, 15],
      [12, 7, 11],
    ]) {
      ctx.beginPath();
      ctx.arc(x + dx, y - 10 + (9 - head), head, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(x + dx - body, y + 4, body * 2, 18, [body, body, 3, 3]);
      ctx.fill();
    }
  }
}

