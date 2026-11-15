import { STEP } from './config';
import * as audio from './audio';
import { Game } from './game';
import { orchard } from './scenes/orchard';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const game = new Game(orchard);
// Dev builds only: lets browser tests inspect the scene.
if (import.meta.env.DEV) Object.assign(window, { game });

let dpr = 1;
function resize(): void {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  game.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

// --- Input: every finger is tracked on its own, so whole-hand taps are fine.

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  void keepAwake();
  canvas.setPointerCapture(e.pointerId);
  game.pointerDown(e.pointerId, e.clientX, e.clientY);
});
canvas.addEventListener('pointermove', (e) => {
  e.preventDefault();
  game.pointerMove(e.pointerId, e.clientX, e.clientY);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
  canvas.addEventListener(type, (e) => game.pointerUp(e.pointerId));
}

// Sound needs one tap on the play button: iOS starts audio from a tap, never
// from a drag, and almost everything in the game is a drag. The button comes
// back whenever iOS pauses audio, for one more tap.
const start = document.getElementById('start')!;
start.addEventListener('click', () => {
  audio.unlock();
  start.hidden = true;
  // If iOS refused anyway, offer the button again.
  setTimeout(() => {
    if (!audio.isRunning()) start.hidden = false;
  }, 600);
});
audio.onPaused(() => {
  if (document.visibilityState === 'visible') start.hidden = false;
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !audio.isRunning()) start.hidden = false;
});

// Also try to start audio on every touch start and end; iOS accepts only some of them.
for (const type of ['pointerdown', 'pointerup', 'touchend', 'click']) {
  document.addEventListener(type, audio.unlock, { capture: true, passive: true });
}

// Block Safari's pinch zoom, long-press menu and double-tap zoom.
for (const type of ['gesturestart', 'gesturechange', 'contextmenu', 'dblclick']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// --- Keep the screen awake while playing, where Safari allows it.

let wakeLock: WakeLockSentinel | null = null;
async function keepAwake(): Promise<void> {
  if (wakeLock || !('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => (wakeLock = null));
  } catch {
    // Not allowed right now; try again on the next touch.
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void keepAwake();
});

// --- Fixed-step loop: physics always advances in 1/60 s steps.

let last = performance.now();
let acc = 0;
function frame(now: number): void {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    game.step();
    acc -= STEP;
  }
  game.draw(ctx, dpr);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
