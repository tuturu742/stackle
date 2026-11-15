// All sounds are synthesised with Web Audio, so there is nothing to download.
// iOS only starts audio from inside a touch, and only some touch events count
// (a touch ending does, a touch starting often does not), so unlock() runs on
// every touch start and end until audio is running. iOS can also pause audio
// later (sleep, switching apps); the next touch starts it again.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let pausedCallback: (() => void) | null = null;

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
    ctx.addEventListener('statechange', () => {
      if (ctx?.state !== 'running') pausedCallback?.();
    });
  }
  if (ctx.state === 'running') return;
  ctx.resume().catch(() => {
    // Not allowed from this event; a later touch will try again.
  });
  // Playing a sound inside the touch is what convinces iOS: a silent blip.
  const blip = ctx.createBufferSource();
  blip.buffer = ctx.createBuffer(1, 1, 22050);
  blip.connect(ctx.destination);
  blip.start(0);
}

export function isRunning(): boolean {
  return ctx?.state === 'running';
}

/** Called whenever iOS pauses audio (sleep, another app, a phone call). */
export function onPaused(callback: () => void): void {
  pausedCallback = callback;
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

function noise(duration: number, frequency: number, volume: number, delay = 0): void {
  const ac = ready();
  if (!ac || !master) return;
  const t = ac.currentTime + delay;
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

/** Food going down: a few soft crunches. */
export function munch(): void {
  noise(0.05, 1800, 0.12);
  noise(0.05, 1500, 0.1, 0.08);
}

interface Voice {
  wave: OscillatorType;
  from: number;
  to: number;
  duration: number;
  volume: number;
  /** Band-pass centre, sweeping from `filter` to `filterTo` if given. */
  filter: number;
  filterTo?: number;
  q?: number;
  /** Wobble in the pitch, as [rate in Hz, depth in Hz]. */
  vibrato?: [number, number];
  delay?: number;
}

// A buzzy oscillator shaped by a filter: enough to suggest an animal's voice.
function voice(v: Voice): void {
  const ac = ready();
  if (!ac || !master) return;
  const t = ac.currentTime + (v.delay ?? 0);
  const end = t + v.duration;
  const osc = ac.createOscillator();
  osc.type = v.wave;
  osc.frequency.setValueAtTime(v.from, t);
  osc.frequency.exponentialRampToValueAtTime(v.to, end);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = v.q ?? 1;
  filter.frequency.setValueAtTime(v.filter, t);
  if (v.filterTo) filter.frequency.exponentialRampToValueAtTime(v.filterTo, end);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(v.volume, t + Math.min(0.06, v.duration / 4));
  gain.gain.setValueAtTime(v.volume, end - Math.min(0.1, v.duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(filter).connect(gain).connect(master);
  if (v.vibrato) {
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = v.vibrato[0];
    depth.gain.value = v.vibrato[1];
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(end + 0.02);
  }
  osc.start(t);
  osc.stop(end + 0.02);
}

export type AnimalSound = 'cow' | 'hen' | 'sheep' | 'pig';

export function animal(kind: AnimalSound): void {
  switch (kind) {
    case 'cow':
      voice({ wave: 'sawtooth', from: 125, to: 100, duration: 0.9, volume: 0.5, filter: 300, filterTo: 700, q: 1.2 });
      break;
    case 'sheep':
      voice({ wave: 'sawtooth', from: 330, to: 300, duration: 0.6, volume: 0.35, filter: 1100, q: 1.5, vibrato: [7, 18] });
      break;
    case 'pig':
      for (const delay of [0, 0.18]) {
        voice({ wave: 'sawtooth', from: 190, to: 260, duration: 0.13, volume: 0.45, filter: 700, q: 3, delay });
        noise(0.1, 600, 0.06, delay);
      }
      break;
    case 'hen':
      for (const [delay, from] of [
        [0, 760],
        [0.13, 700],
        [0.24, 900],
      ]) {
        voice({ wave: 'square', from, to: from * 0.7, duration: 0.07, volume: 0.25, filter: 1300, q: 2, delay });
      }
      break;
  }
}

/** The sun or moon is tapped: a soft falling chime for night, rising for day. */
export function chime(toNight: boolean): void {
  const notes = toNight ? [784, 659, 523] : [523, 659, 784];
  notes.forEach((f, i) => tone(f, f * 0.995, 0.35, 0.12, i * 0.12));
}

/** A sleepy snore: a slow, low breath in and out. */
export function snore(): void {
  const ac = ready();
  if (!ac || !master) return;
  const t = ac.currentTime;
  const duration = 1.1;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 380;
  filter.Q.value = 4;
  // A slow rattle, like a real snore.
  const rattle = ac.createGain();
  const lfo = ac.createOscillator();
  const depth = ac.createGain();
  lfo.frequency.value = 28;
  depth.gain.value = 0.5;
  rattle.gain.value = 0.5;
  lfo.connect(depth).connect(rattle.gain);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.35, t + duration * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(rattle).connect(gain).connect(master);
  src.start(t);
  lfo.start(t);
  lfo.stop(t + duration);
}
