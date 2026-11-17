import { STEP } from './config';
import * as audio from './audio';
import { Game } from './game';
import { Hub, type Card } from './hub';
import { AutumnPreview, SpringPreview, SummerPreview, WinterPreview } from './previews';
import * as save from './save';
import type { SceneDef } from './scenes/scene';
import { autumn } from './scenes/autumn';
import { spring } from './scenes/spring';
import { summer } from './scenes/summer';
import { winter } from './scenes/winter';
import { saveSettings, settings } from './settings';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// --- Levels: the seasons, in order.

const SCENES: Record<string, SceneDef> = { spring, summer, autumn, winter };
const cards: Card[] = [
  { id: 'spring', preview: new SpringPreview(), playable: true },
  { id: 'summer', preview: new SummerPreview(), playable: true },
  { id: 'autumn', preview: new AutumnPreview(), playable: true },
  { id: 'winter', preview: new WinterPreview(), playable: true },
];

// --- The home button, in a level: faint at first; a tap makes it bright for a few
// seconds, and a second tap while it is bright goes back to the hub. A single
// stray tap from the child only lights it up.

const HOME_ARMED_MS = 3000;
const homeButton = document.getElementById('home')!;
let homeTimer = 0;

function showHome(on: boolean): void {
  homeButton.hidden = !on;
  homeButton.classList.remove('armed');
  clearTimeout(homeTimer);
  if (import.meta.env.DEV) hint?.style.setProperty('display', on ? 'none' : 'block');
}

homeButton.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  clearTimeout(homeTimer);
  if (homeButton.classList.contains('armed')) {
    leave();
    return;
  }
  homeButton.classList.add('armed');
  homeTimer = window.setTimeout(() => homeButton.classList.remove('armed'), HOME_ARMED_MS);
});

// Dev builds only: a dashed circle marks where to hold in the hub, so testers can find it.
let hint: HTMLDivElement | null = null;
if (import.meta.env.DEV) {
  hint = document.createElement('div');
  Object.assign(hint.style, {
    position: 'fixed',
    left: '10px',
    top: '10px',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '4px dashed rgba(200, 60, 60, 0.8)',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  });
  document.body.appendChild(hint);
}

/** The level being played, or null in the hub. */
let level: { id: string; game: Game } | null = null;
const hub = new Hub(cards, save.loadHub(), (card) => enter(card.id));
/** A soft fade from the sky colour when switching between the hub and a level: 1 just switched. */
let fade = 0;

/**
 * Into a level, always fresh. Only when the app was reloaded mid-play (`restore`) does it
 * pick up where it was.
 */
function enter(id: string, restore = false): void {
  const game = new Game(SCENES[id]);
  const saved = restore ? save.load(id) : null;
  if (saved) game.restore(saved);
  game.resize(window.innerWidth, window.innerHeight);
  game.resume();
  level = { id, game };
  save.storeHub(id);
  save.storePlaying(id);
  fade = 1;
  showHome(true);
  // Dev builds only: lets browser tests inspect the scene.
  if (import.meta.env.DEV) Object.assign(window, { game });
}

/** Back to the hub: the level's sounds stop and it is forgotten, so going in again starts fresh. */
function leave(): void {
  if (!level) return;
  level.game.leave();
  save.forget(level.id);
  save.storePlaying(null);
  level = null;
  fade = 1;
  showHome(false);
}

function saveLevel(): void {
  if (level) save.store(level.id, level.game.snapshot());
}

if (import.meta.env.DEV) Object.assign(window, { hub, enterLevel: enter, leaveLevel: leave });

let dpr = 1;
function resize(): void {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  hub.resize(w, h);
  level?.game.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

// Reloaded mid-play: straight back into the level, as it was.
const playing = save.loadPlaying();
if (playing && SCENES[playing]) {
  enter(playing, true);
  fade = 0;
}

// --- Input: every finger is tracked on its own, so whole-hand taps are fine.

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  void keepAwake();
  canvas.setPointerCapture(e.pointerId);
  if (level) level.game.pointerDown(e.pointerId, e.clientX, e.clientY);
  else hub.pointerDown(e.pointerId, e.clientX, e.clientY);
  cornerDown(e);
});
canvas.addEventListener('pointermove', (e) => {
  e.preventDefault();
  if (level) level.game.pointerMove(e.pointerId, e.clientX, e.clientY);
  else hub.pointerMove(e.pointerId, e.clientX, e.clientY);
  cornerMove(e);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
  canvas.addEventListener(type, (e) => {
    if (level) level.game.pointerUp(e.pointerId);
    else hub.pointerUp(e.pointerId);
    // iPadOS can cancel a long touch near the top edge while the finger is still
    // there, so only lifting the finger (or moving it away) stops the corner hold.
    if (type === 'pointerup') cornerUp(e);
  });
}

// --- The corner, in the hub: hold a finger still in the top-left corner for a
// few seconds to open the parent controls. A child tapping or dragging there just plays.

const CORNER = 140;
const CORNER_HOLD_MS = 3000;
const RESET_HOLD_MS = 2000;
const panel = document.getElementById('parent')!;
const muteButton = document.getElementById('mute')!;
const motionButton = document.getElementById('motion')!;
const resetButton = document.getElementById('reset')!;

/** A faint ring under the finger that fills while the corner is held, so a parent knows it is working. */
const ring = document.getElementById('hold')!;
let corner: { id: number; timer: number } | null = null;

function cornerDown(e: PointerEvent): void {
  if (level || corner || e.clientX > CORNER || e.clientY > CORNER) return;
  const id = e.pointerId;
  ring.style.left = `${e.clientX}px`;
  ring.style.top = `${e.clientY}px`;
  ring.classList.add('on');
  corner = {
    id,
    timer: window.setTimeout(() => {
      corner = null;
      ring.classList.remove('on');
      hub.cancel(id);
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

// --- Each level is remembered on the device: every couple of seconds, when it is left, and when the app is left.

setInterval(saveLevel, 2000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveLevel();
});
window.addEventListener('pagehide', saveLevel);

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
    if (level) level.game.step();
    else hub.update(STEP);
    fade = Math.max(0, fade - STEP * 3);
    acc -= STEP;
  }
  if (level) level.game.draw(ctx, dpr);
  else hub.draw(ctx, dpr);
  // A soft fade in after switching between the hub and a level.
  if (fade > 0 && !settings.reduceMotion) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(255, 255, 255, ${fade * 0.8})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
