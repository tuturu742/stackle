import { STEP } from './config';
import * as audio from './audio';
import { Game } from './game';
import * as save from './save';
import { orchard } from './scenes/orchard';
import { saveSettings, settings } from './settings';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const game = new Game(orchard);
const saved = save.load();
if (saved) game.restore(saved);
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
  cornerDown(e);
});
canvas.addEventListener('pointermove', (e) => {
  e.preventDefault();
  game.pointerMove(e.pointerId, e.clientX, e.clientY);
  cornerMove(e);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
  canvas.addEventListener(type, (e) => {
    game.pointerUp(e.pointerId);
    // iPadOS can cancel a long touch near the top edge while the finger is still
    // there, so only lifting the finger (or moving it away) stops the corner hold.
    if (type === 'pointerup') cornerUp(e);
  });
}

// --- Parent controls: hold a finger still in the top-left corner for a few
// seconds. A child tapping or dragging there just plays.

const CORNER = 140;
const CORNER_HOLD_MS = 3000;
const RESET_HOLD_MS = 2000;
const panel = document.getElementById('parent')!;
const muteButton = document.getElementById('mute')!;
const motionButton = document.getElementById('motion')!;
const resetButton = document.getElementById('reset')!;
// Dev builds only: a dashed circle marks where to hold, so testers can find it.
if (import.meta.env.DEV) {
  const hint = document.createElement('div');
  Object.assign(hint.style, {
    position: 'fixed',
    left: '10px',
    top: '10px',
    width: `${CORNER - 20}px`,
    height: `${CORNER - 20}px`,
    borderRadius: '50%',
    border: '4px dashed rgba(200, 60, 60, 0.8)',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  });
  document.body.appendChild(hint);
}

/** A faint ring under the finger that fills while the corner is held, so a parent knows it is working. */
const ring = document.getElementById('hold')!;
let corner: { id: number; timer: number } | null = null;

function cornerDown(e: PointerEvent): void {
  if (corner || e.clientX > CORNER || e.clientY > CORNER) return;
  const id = e.pointerId;
  ring.style.left = `${e.clientX}px`;
  ring.style.top = `${e.clientY}px`;
  ring.classList.add('on');
  corner = {
    id,
    timer: window.setTimeout(() => {
      corner = null;
      ring.classList.remove('on');
      game.pointerUp(id);
      showSettings();
      panel.hidden = false;
    }, CORNER_HOLD_MS),
  };
}
function cornerMove(e: PointerEvent): void {
  if (corner?.id === e.pointerId && (e.clientX > CORNER * 1.5 || e.clientY > CORNER * 1.5)) cornerUp(e);
}
function cornerUp(e: PointerEvent): void {
  if (corner?.id !== e.pointerId) return;
  clearTimeout(corner.timer);
  corner = null;
  ring.classList.remove('on');
}

function showSettings(): void {
  muteButton.setAttribute('aria-pressed', String(settings.muted));
  motionButton.setAttribute('aria-pressed', String(settings.reduceMotion));
  audio.setMuted(settings.muted);
}
showSettings();

muteButton.addEventListener('click', () => {
  settings.muted = !settings.muted;
  saveSettings();
  showSettings();
});
motionButton.addEventListener('click', () => {
  settings.reduceMotion = !settings.reduceMotion;
  saveSettings();
  showSettings();
});
document.getElementById('close')!.addEventListener('click', () => (panel.hidden = true));

// Starting the farm again needs the button held down, so it never happens by accident.
let resetTimer = 0;
resetButton.addEventListener('pointerdown', () => {
  resetButton.classList.add('holding');
  resetTimer = window.setTimeout(() => {
    save.clear();
    location.reload();
  }, RESET_HOLD_MS);
});
for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
  resetButton.addEventListener(type, () => {
    resetButton.classList.remove('holding');
    clearTimeout(resetTimer);
  });
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

// --- The farm is remembered on the device: every couple of seconds, and when the app is left.

setInterval(() => save.store(game.snapshot()), 2000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save.store(game.snapshot());
});
window.addEventListener('pagehide', () => save.store(game.snapshot()));

// --- Works offline once installed: the service worker keeps a copy of the app.

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

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
