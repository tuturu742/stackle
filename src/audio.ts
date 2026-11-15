// All sounds are synthesised with Web Audio, so there is nothing to download.
// iOS only allows audio after a user gesture, so unlock() runs on first touch.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

const MASTER_VOLUME = 0.5;

export function unlock(): void {
  if (!ctx) {
    ctx = new AudioContext();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 12;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_VOLUME;
    master.connect(limiter).connect(ctx.destination);
  }
  if (ctx.state !== 'running') void ctx.resume();
}

export function setMuted(value: boolean): void {
  muted = value;
  if (master) master.gain.value = muted ? 0 : MASTER_VOLUME;
}

function ready(): AudioContext | null {
  return ctx && master && ctx.state === 'running' ? ctx : null;
}

// A sine tone that glides from one pitch to another with a soft envelope.
function tone(from: number, to: number, duration: number, volume: number, delay = 0): void {
  const ac = ready();
  if (!ac || !master) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function noise(duration: number, frequency: number, volume: number): void {
  const ac = ready();
  if (!ac || !master) return;
  const t = ac.currentTime;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 0.8;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(gain).connect(master);
  src.start(t);
}

/** Fruit comes off the tree. */
export function pop(): void {
  tone(520, 880, 0.07, 0.35);
}

/** A new fruit finishes growing. Kept very quiet: it happens without a touch. */
export function grown(): void {
  tone(700, 950, 0.05, 0.08);
}

/** Something lands on the ground or on another thing. */
export function plop(strength: number): void {
  const s = Math.min(1, Math.max(0, strength));
  tone(240, 110, 0.08, 0.1 + 0.25 * s);
}

/** Tapping the tree. */
export function rustle(): void {
  noise(0.18, 2400, 0.12);
}

// A few plock variations, so the favourite sound stays fresh.
const PLOCKS = [
  { from: 360, to: 70 },
  { from: 320, to: 62 },
  { from: 400, to: 78 },
];
let plockIndex = 0;

/** Placed on the water. Bigger piles give a deeper, longer plock. */
export function plock(size: number): void {
  const v = PLOCKS[plockIndex++ % PLOCKS.length];
  const scale = Math.min(3, Math.max(1, size));
  const depth = 1 / Math.sqrt(scale);
  tone(v.from * depth, v.to * depth, 0.14 + 0.04 * scale, 0.6);
  noise(0.12, 900, 0.08 * scale);
  const bubbles = 2 + Math.round(scale);
  for (let i = 0; i < bubbles; i++) {
    const base = 380 + i * 90;
    tone(base, base * 2.2, 0.05, 0.12, 0.06 + i * 0.07);
  }
}
