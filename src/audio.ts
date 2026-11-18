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

export type AnimalSound =
  | 'cow'
  | 'hen'
  | 'sheep'
  | 'pig'
  | 'horse'
  | 'duck'
  | 'cat'
  | 'bunny'
  | 'raccoon'
  | 'beaver'
  | 'penguin'
  | 'reindeer'
  | 'polarbear'
  | 'fox'
  | 'seal'
  | 'frog'
  | 'chick'
  | 'lamb'
  | 'squirrel'
  | 'hedgehog'
  | 'dog';

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
    case 'duck':
      for (const delay of [0, 0.2]) {
        voice({ wave: 'square', from: 420, to: 330, duration: 0.14, volume: 0.25, filter: 900, q: 3, delay });
      }
      break;
    case 'bunny':
      for (const delay of [0, 0.12]) voice({ wave: 'triangle', from: 1200, to: 1500, duration: 0.07, volume: 0.18, filter: 1800, q: 2, delay });
      break;
    case 'raccoon':
      for (const delay of [0, 0.09, 0.18, 0.27]) voice({ wave: 'square', from: 700, to: 560, duration: 0.06, volume: 0.14, filter: 1300, q: 3, delay });
      break;
    case 'beaver':
      voice({ wave: 'sawtooth', from: 300, to: 380, duration: 0.18, volume: 0.22, filter: 800, q: 2 });
      noise(0.08, 400, 0.12, 0.25);
      break;
    case 'dog':
      // Two soft, friendly little woofs.
      for (const delay of [0, 0.22]) {
        voice({ wave: 'sawtooth', from: 360, to: 250, duration: 0.12, volume: 0.28, filter: 900, q: 2, delay });
        noise(0.05, 700, 0.05, delay);
      }
      break;
    case 'cat':
      voice({ wave: 'sawtooth', from: 520, to: 780, duration: 0.22, volume: 0.22, filter: 1400, q: 2.5 });
      voice({ wave: 'sawtooth', from: 780, to: 460, duration: 0.4, volume: 0.22, filter: 1600, filterTo: 900, q: 2.5, delay: 0.2 });
      break;
    case 'horse':
      voice({ wave: 'sawtooth', from: 520, to: 280, duration: 0.8, volume: 0.32, filter: 1200, filterTo: 700, q: 1.4, vibrato: [11, 45] });
      noise(0.12, 500, 0.06, 0.85);
      break;
    case 'penguin':
      for (const delay of [0, 0.16]) voice({ wave: 'square', from: 560, to: 470, duration: 0.12, volume: 0.18, filter: 1100, q: 2.5, delay });
      break;
    case 'reindeer':
      voice({ wave: 'sawtooth', from: 170, to: 140, duration: 0.3, volume: 0.3, filter: 500, q: 1.5 });
      tone(1568, 1560, 0.3, 0.05, 0.3);
      tone(2093, 2090, 0.25, 0.03, 0.34);
      break;
    case 'polarbear':
      voice({ wave: 'sawtooth', from: 95, to: 85, duration: 0.7, volume: 0.42, filter: 260, filterTo: 420, q: 1.3, vibrato: [6, 4] });
      break;
    case 'fox':
      voice({ wave: 'sawtooth', from: 900, to: 1300, duration: 0.09, volume: 0.18, filter: 1500, q: 2.5 });
      voice({ wave: 'sawtooth', from: 1100, to: 700, duration: 0.14, volume: 0.16, filter: 1300, q: 2.5, delay: 0.1 });
      break;
    case 'seal':
      for (const delay of [0, 0.22]) {
        voice({ wave: 'sawtooth', from: 260, to: 200, duration: 0.14, volume: 0.32, filter: 600, q: 3, delay });
      }
      break;
    case 'frog':
      // A soft two-part croak: rib-bit.
      voice({ wave: 'square', from: 180, to: 150, duration: 0.12, volume: 0.22, filter: 500, q: 4, vibrato: [60, 25] });
      voice({ wave: 'square', from: 210, to: 160, duration: 0.16, volume: 0.22, filter: 520, q: 4, vibrato: [60, 25], delay: 0.17 });
      break;
    case 'chick':
      for (const delay of [0, 0.15]) tone(2600, 3300, 0.07, 0.1, delay);
      break;
    case 'lamb':
      voice({ wave: 'sawtooth', from: 520, to: 470, duration: 0.45, volume: 0.24, filter: 1500, q: 1.6, vibrato: [8, 30] });
      break;
    case 'squirrel':
      for (const delay of [0, 0.06, 0.12, 0.18, 0.24]) voice({ wave: 'square', from: 1500, to: 1200, duration: 0.04, volume: 0.1, filter: 2000, q: 3, delay });
      break;
    case 'hedgehog':
      for (const delay of [0, 0.14, 0.26]) noise(0.07, 1400, 0.07, delay);
      tone(700, 620, 0.06, 0.05, 0.36);
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

/** Notes the raindrops plink on: a calm pentatonic run, so the drops always sound together. */
const DROP_NOTES = [784, 880, 1047, 1175, 1319, 1568];
let raining = false;
let rainTimer: ReturnType<typeof setTimeout> | null = null;

/** One soft drop, like water dripping into a glass: a quick gentle plink, never a hiss. */
function drop(): void {
  const f = DROP_NOTES[Math.floor(Math.random() * DROP_NOTES.length)];
  tone(f, f * 1.25, 0.09, 0.03);
  tone(f * 2, f * 2.4, 0.05, 0.008);
}

/** While any cloud is raining, a few soft plinks a second, unevenly spaced like real drops. */
export function setRain(on: boolean): void {
  raining = on;
  if (!on || rainTimer) return;
  const next = () => {
    rainTimer = null;
    if (!raining) return;
    drop();
    rainTimer = setTimeout(next, 140 + Math.random() * 260);
  };
  next();
}

let motorGain: GainNode | null = null;

/** The model ship's little motor: a soft putt-putt while it sails in sight. */
export function setMotor(on: boolean): void {
  const ac = ready();
  if (!ac || !master) return;
  if (!motorGain) {
    const engine = ac.createOscillator();
    engine.type = 'sawtooth';
    engine.frequency.value = 58;
    const low = ac.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 380;
    // The putt-putt: the engine's loudness pulses quickly.
    const pulse = ac.createGain();
    pulse.gain.value = 0.5;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 9;
    const depth = ac.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(pulse.gain);
    motorGain = ac.createGain();
    motorGain.gain.value = 0;
    engine.connect(low).connect(pulse).connect(motorGain).connect(master);
    engine.start();
    lfo.start();
  }
  motorGain.gain.setTargetAtTime(on ? 0.09 : 0, ac.currentTime, 0.25);
}

/** A puff of smoke from the chimney starting or stopping. */
export function puff(starting: boolean): void {
  noise(0.35, starting ? 700 : 450, 0.05);
}

/** Something goes into the bin. */
export function gulp(): void {
  tone(300, 120, 0.12, 0.35);
  noise(0.06, 500, 0.06);
}

/** The bin has swallowed a whole pile. */
export function burp(delay = 0): void {
  tone(140, 90, 0.22, 0.3, delay);
  tone(180, 110, 0.12, 0.15, delay + 0.05);
}

/** After a third meal: a happy burp that turns into a sung note. */
export function burpNote(delay = 0): void {
  tone(160, 120, 0.18, 0.25, delay);
  tone(523, 659, 0.12, 0.14, delay + 0.2);
  tone(784, 784, 0.4, 0.16, delay + 0.32);
}

/** The barn doors swing. */
export function creak(opening: boolean): void {
  tone(opening ? 220 : 260, opening ? 300 : 180, 0.25, 0.1);
  noise(0.2, 1200, 0.03);
}

/** The windmill gets a push. */
export function whoosh(): void {
  noise(0.35, 700, 0.12);
}

/** A tap on a vehicle. */
export function honk(tractor: boolean): void {
  if (tractor) {
    for (let i = 0; i < 3; i++) tone(90, 70, 0.07, 0.3, i * 0.1);
  } else {
    tone(880, 860, 0.08, 0.15);
    tone(880, 860, 0.08, 0.15, 0.12);
  }
}

/** The hat machine gives a hat. */
export function clunk(): void {
  noise(0.06, 400, 0.15);
  tone(500, 900, 0.08, 0.25, 0.12);
}

/** The hat machine is pressed while enough hats are out already. */
export function boop(): void {
  tone(330, 300, 0.1, 0.12);
}

/** The swing gets a push. */
export function swoosh(): void {
  noise(0.25, 1000, 0.05);
}

/** A bird is startled off the fence. */
export function chirp(): void {
  tone(2200, 2800, 0.05, 0.08);
  tone(2400, 3000, 0.05, 0.08, 0.08);
}

/** A ladybird takes off. */
export function buzz(): void {
  voice({ wave: 'sawtooth', from: 220, to: 260, duration: 0.35, volume: 0.06, filter: 600, q: 1, vibrato: [40, 30] });
}

/** The owl: a soft hoo-hoo at night, a sleepy murmur by day. */
export function hoot(awake: boolean): void {
  if (!awake) {
    tone(330, 300, 0.4, 0.06);
    return;
  }
  tone(390, 370, 0.3, 0.22);
  tone(390, 340, 0.55, 0.22, 0.4);
}

/** A crow flies off. */
export function caw(): void {
  for (const delay of [0, 0.22]) voice({ wave: 'sawtooth', from: 520, to: 380, duration: 0.16, volume: 0.16, filter: 900, q: 2.5, delay });
}

/** A bush is tapped. */
export function rustle(): void {
  noise(0.18, 2500, 0.06);
}

// Pentatonic notes, so any flowers tapped together still sound nice.
const PENTATONIC = [523, 587, 659, 784, 880, 1047];

/** A flower is tapped: one soft note, the same note for the same flower. */
export function flowerNote(i: number): void {
  const f = PENTATONIC[((i % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length];
  tone(f, f, 0.25, 0.1);
}

/** Something starts cooking on the grill. */
export function sizzle(): void {
  noise(0.5, 3500, 0.05);
}

/** Baked into a pie. */
export function ding(): void {
  tone(1320, 1320, 0.3, 0.12);
  tone(1760, 1760, 0.3, 0.06, 0.02);
}

/** An egg pops out of the coop. */
export function eggPop(): void {
  tone(600, 1000, 0.08, 0.2);
}

/** An animal steps into mud. */
export function squelch(): void {
  noise(0.15, 300, 0.12);
  tone(160, 90, 0.12, 0.15);
}

/** A treat comes out of the picnic basket. */
export function basket(): void {
  noise(0.08, 1800, 0.05);
  tone(600, 900, 0.07, 0.2, 0.06);
}

/** A lantern is switched on (a bright little ding) or off (a soft lower one). */
export function lantern(on: boolean): void {
  tone(on ? 1175 : 880, on ? 1175 : 780, 0.25, 0.08);
}

/** A shutter opens or closes. */
export function shutter(): void {
  tone(500, 380, 0.08, 0.12);
}

const TUNES: Record<string, number[]> = {
  guitar: [0, 4, 7, 12, 7, 4, 0],
  trumpet: [0, 2, 4, 7, 4, 7, 12],
};

/** An animal plays an instrument: a short tune, lower for bigger animals. */
export function music(instrument: 'drum' | 'guitar' | 'trumpet', pitch: number): void {
  if (instrument === 'drum') {
    for (let i = 0; i < 8; i++) {
      const accent = i % 4 === 0;
      tone(150 * pitch, 60 * pitch, 0.15, accent ? 0.45 : 0.25, i * 0.25);
      if (i % 2 === 1) noise(0.06, 3000, 0.05, i * 0.25);
    }
    return;
  }
  const base = 330 * pitch;
  TUNES[instrument].forEach((step, i) => {
    const f = base * Math.pow(2, step / 12);
    if (instrument === 'guitar') tone(f, f * 0.99, 0.4, 0.18, i * 0.28);
    else voice({ wave: 'sawtooth', from: f, to: f, duration: 0.24, volume: 0.12, filter: f * 2, q: 1.2, delay: i * 0.28 });
  });
}

// --- The boombox: three little song loops, stand-ins until real ones are made.
// The winter radio: three old carols, played on bells. The spring music box and the autumn
// gramophone: three old nursery tunes each.

interface Song {
  /** Seconds per step (an eighth note). */
  step: number;
  /** Melody and bass, one entry per step: semitones above the song's root, or null for a rest. */
  melody: (number | null)[];
  bass: (number | null)[];
  root: number;
  /** Melody notes ring like little bells. */
  bells?: boolean;
  /** Soft sleigh bells shake on every beat. */
  sleigh?: boolean;
}

/** A tune written as [semitones, eighths] pairs, spread out into one entry per step. */
function tune(notes: [number, number][]): (number | null)[] {
  return notes.flatMap(([note, length]) => [note, ...Array<null>(length - 1).fill(null)]);
}

/** A bass line: one note at the start of each bar (or every `every` steps within it). */
function bassLine(roots: number[], bar: number, every = bar, pickup = 0): (number | null)[] {
  const out: (number | null)[] = Array<null>(pickup).fill(null);
  for (const root of roots) for (let i = 0; i < bar; i++) out.push(i % every === 0 ? root : null);
  return out;
}

const JINGLE_HALF: [number, number][] = [
  [4, 2], [4, 2], [4, 4],
  [4, 2], [4, 2], [4, 4],
  [4, 2], [7, 2], [0, 3], [2, 1],
  [4, 8],
  [5, 2], [5, 2], [5, 3], [5, 1],
  [5, 2], [4, 2], [4, 2], [4, 1], [4, 1],
];
const JINGLE: [number, number][] = [
  ...JINGLE_HALF,
  [4, 2], [2, 2], [2, 2], [4, 2],
  [2, 4], [7, 4],
  ...JINGLE_HALF,
  [7, 2], [7, 2], [5, 2], [2, 2],
  [0, 8],
];
const DECK_LINE: [number, number][] = [
  [7, 3], [5, 1], [4, 2], [2, 2],
  [0, 2], [2, 2], [4, 2], [0, 2],
  [2, 1], [4, 1], [5, 1], [2, 1], [4, 3], [2, 1],
  [0, 2], [-1, 2], [0, 4],
];
const DECK: [number, number][] = [
  ...DECK_LINE,
  ...DECK_LINE,
  [2, 3], [4, 1], [5, 2], [2, 2],
  [4, 3], [5, 1], [7, 2], [2, 2],
  [4, 1], [6, 1], [7, 2], [9, 1], [11, 1], [12, 2],
  [11, 2], [9, 2], [7, 4],
  [7, 3], [5, 1], [4, 2], [2, 2],
  [0, 2], [2, 2], [4, 2], [0, 2],
  [9, 1], [9, 1], [9, 1], [9, 1], [7, 3], [5, 1],
  [4, 2], [2, 2], [0, 4],
];
// In 3/4, after a one-beat pickup.
const WISH: [number, number][] = [
  [-5, 2],
  [0, 2], [0, 1], [2, 1], [0, 1], [-1, 1],
  [-3, 2], [-3, 2], [-3, 2],
  [2, 2], [2, 1], [4, 1], [2, 1], [0, 1],
  [-1, 2], [-5, 2], [-5, 2],
  [4, 2], [4, 1], [5, 1], [4, 1], [2, 1],
  [0, 2], [-3, 2], [-5, 1], [-5, 1],
  [-3, 2], [2, 2], [-1, 2],
  [0, 6],
];

const LAMB: [number, number][] = [
  [4, 2], [2, 2], [0, 2], [2, 2],
  [4, 2], [4, 2], [4, 4],
  [2, 2], [2, 2], [2, 4],
  [4, 2], [7, 2], [7, 4],
  [4, 2], [2, 2], [0, 2], [2, 2],
  [4, 2], [4, 2], [4, 2], [4, 2],
  [2, 2], [2, 2], [4, 2], [2, 2],
  [0, 8],
];
const TWINKLE_START: [number, number][] = [
  [0, 2], [0, 2], [7, 2], [7, 2],
  [9, 2], [9, 2], [7, 4],
  [5, 2], [5, 2], [4, 2], [4, 2],
  [2, 2], [2, 2], [0, 4],
];
const TWINKLE_MIDDLE: [number, number][] = [
  [7, 2], [7, 2], [5, 2], [5, 2],
  [4, 2], [4, 2], [2, 4],
];
const TWINKLE: [number, number][] = [...TWINKLE_START, ...TWINKLE_MIDDLE, ...TWINKLE_MIDDLE, ...TWINKLE_START];
// In 6/8.
const ROW: [number, number][] = [
  [0, 3], [0, 3],
  [0, 2], [2, 1], [4, 3],
  [4, 2], [2, 1], [4, 2], [5, 1],
  [7, 6],
  [12, 1], [12, 1], [12, 1], [7, 1], [7, 1], [7, 1],
  [4, 1], [4, 1], [4, 1], [0, 1], [0, 1], [0, 1],
  [7, 2], [5, 1], [4, 2], [2, 1],
  [0, 6],
];
const JACQUES: [number, number][] = [
  [0, 2], [2, 2], [4, 2], [0, 2],
  [0, 2], [2, 2], [4, 2], [0, 2],
  [4, 2], [5, 2], [7, 4],
  [4, 2], [5, 2], [7, 4],
  [7, 1], [9, 1], [7, 1], [5, 1], [4, 2], [0, 2],
  [7, 1], [9, 1], [7, 1], [5, 1], [4, 2], [0, 2],
  [0, 2], [-5, 2], [0, 4],
  [0, 2], [-5, 2], [0, 4],
];
const BRIDGE_LINE: [number, number][] = [
  [7, 3], [9, 1], [7, 2], [5, 2],
  [4, 2], [5, 2], [7, 4],
];
const BRIDGE: [number, number][] = [
  ...BRIDGE_LINE,
  [2, 2], [4, 2], [5, 4],
  [4, 2], [5, 2], [7, 4],
  ...BRIDGE_LINE,
  [2, 4], [7, 4],
  [4, 2], [0, 6],
];
const JOY_LINE: [number, number][] = [
  [4, 2], [4, 2], [5, 2], [7, 2],
  [7, 2], [5, 2], [4, 2], [2, 2],
  [0, 2], [0, 2], [2, 2], [4, 2],
];
const JOY: [number, number][] = [...JOY_LINE, [4, 3], [2, 1], [2, 4], ...JOY_LINE, [2, 3], [0, 1], [0, 4]];

const SONGS: Song[] = [
  {
    step: 0.25,
    root: 392,
    melody: [0, null, 4, null, 7, null, 4, null, 5, null, 9, null, 7, null, null, null, 4, null, 7, null, 12, null, 9, 7, 5, null, 4, null, 0, null, null, null],
    bass: [-12, null, null, null, -5, null, null, null, -7, null, null, null, -5, null, null, null],
  },
  {
    step: 0.2,
    root: 440,
    melody: [0, 2, 4, null, 4, 2, 0, null, 7, null, 7, null, 4, null, null, null, 0, 2, 4, null, 4, 2, 0, null, 2, null, -1, null, 0, null, null, null],
    bass: [-12, null, -12, null, -17, null, -17, null, -15, null, -15, null, -17, null, -17, null],
  },
  {
    step: 0.3,
    root: 349,
    melody: [7, null, null, 4, null, null, 0, null, null, 4, null, null, 5, null, null, 4, null, null, 2, null, null, null, null, null],
    bass: [-12, null, null, -8, null, null, -5, null, null, -10, null, null],
  },
  // 4: Jingle Bells, with sleigh bells on the beat.
  {
    step: 0.17,
    root: 349,
    melody: tune(JINGLE),
    bass: bassLine([-12, -12, -12, -12, -7, -12, -5, -5, -12, -12, -12, -12, -7, -12, -5, -12], 8, 4),
    bells: true,
    sleigh: true,
  },
  // 5: Deck the Halls.
  {
    step: 0.19,
    root: 349,
    melody: tune(DECK),
    bass: bassLine([-12, -12, -5, -12, -12, -12, -5, -12, -5, -12, -5, -5, -12, -12, -7, -12], 8, 4),
    bells: true,
  },
  // 6: We Wish You a Merry Christmas.
  {
    step: 0.2,
    root: 392,
    melody: tune(WISH),
    bass: bassLine([-12, -7, -10, -12, -7, -10, -10, -12], 6, 6, 2),
    bells: true,
  },
  // 7: Mary Had a Little Lamb, on the spring music box.
  {
    step: 0.22,
    root: 523,
    melody: tune(LAMB),
    bass: bassLine([-12, -12, -17, -12, -12, -12, -17, -12], 8, 4),
    bells: true,
  },
  // 8: Twinkle, Twinkle, Little Star.
  {
    step: 0.24,
    root: 523,
    melody: tune(TWINKLE),
    bass: bassLine([-12, -19, -19, -17, -12, -17, -12, -17, -12, -19, -19, -12], 8, 4),
    bells: true,
  },
  // 9: Row, Row, Row Your Boat.
  {
    step: 0.17,
    root: 523,
    melody: tune(ROW),
    bass: bassLine([-12, -12, -12, -17, -12, -12, -17, -12], 6, 3),
    bells: true,
  },
  // 10: Frère Jacques, on the autumn gramophone.
  {
    step: 0.22,
    root: 349,
    melody: tune(JACQUES),
    bass: [-12, null, null, null, -5, null, null, null],
  },
  // 11: London Bridge.
  {
    step: 0.2,
    root: 392,
    melody: tune(BRIDGE),
    bass: bassLine([-12, -12, -17, -12, -12, -12, -17, -12], 8, 4),
  },
  // 12: Ode to Joy.
  {
    step: 0.22,
    root: 349,
    melody: tune(JOY),
    bass: bassLine([-12, -17, -12, -17, -12, -17, -12, -12], 8, 4),
  },
];

let songTimer = 0;
let songStep = 0;
let songNext = 0;

/** Play a song on a loop (1-3 the boombox's, 4-6 the winter radio's carols, 7-9 the spring music
 * box's, 10-12 the autumn gramophone's), or 0 for quiet. */
export function playSong(n: number): void {
  clearInterval(songTimer);
  songTimer = 0;
  const song = SONGS[n - 1];
  if (!song) return;
  songStep = 0;
  // Starts on the first beat once audio is running: a level can open before iOS allows sound.
  songNext = -Infinity;
  // Notes are scheduled a little ahead, so the beat stays even.
  songTimer = window.setInterval(() => {
    const now = ready()?.currentTime;
    if (now === undefined) return;
    // At the start, or after a pause (the app was away), pick the beat up from now.
    if (songNext < now - 0.5) songNext = now + 0.05;
    while (songNext < now + 0.3) {
      const delay = Math.max(0, songNext - now);
      const m = song.melody[songStep % song.melody.length];
      const b = song.bass[songStep % song.bass.length];
      if (m !== null) {
        const f = song.root * Math.pow(2, m / 12);
        if (song.bells) {
          // A bell: the note, an octave up ringing out, and a faint shimmer above that dies fast.
          tone(f, f, song.step * 2.4, 0.08, delay);
          tone(f * 2, f * 2, song.step * 1.8, 0.035, delay);
          tone(f * 3.01, f * 3.01, song.step * 0.6, 0.015, delay);
        } else tone(f, f, song.step * 1.6, 0.1, delay);
      }
      if (song.sleigh && songStep % 2 === 0) noise(0.05, 7000, songStep % 4 === 0 ? 0.03 : 0.018, delay);
      if (b !== null) {
        const f = song.root * Math.pow(2, b / 12);
        tone(f, f * 0.98, song.step * 3, 0.12, delay);
      }
      songStep++;
      songNext += song.step;
    }
  }, 50);
}

// --- Winter --------------------------------------------------------------

/** The spinning top whirs for `seconds`: up a little at first, then wobbling down as it slows. */
export function spinTop(seconds: number): void {
  const ac = ready();
  if (!ac || !master) return;
  const t = ac.currentTime;
  const end = t + Math.max(0.3, seconds);
  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.linearRampToValueAtTime(520, t + (end - t) * 0.25);
  osc.frequency.exponentialRampToValueAtTime(220, end);
  // The wobble grows as it slows down.
  const lfo = ac.createOscillator();
  lfo.frequency.setValueAtTime(18, t);
  lfo.frequency.linearRampToValueAtTime(5, end);
  const depth = ac.createGain();
  depth.gain.setValueAtTime(4, t);
  depth.gain.linearRampToValueAtTime(40, end);
  lfo.connect(depth).connect(osc.frequency);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.07, t + 0.08);
  gain.gain.setValueAtTime(0.07, end - (end - t) * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(master);
  osc.start(t);
  lfo.start(t);
  osc.stop(end + 0.02);
  lfo.stop(end + 0.02);
}

/** The top falls over on one of its four faces, and each face has its own little sound. */
export function topFace(face: number): void {
  switch (((face % 4) + 4) % 4) {
    case 0:
      // Boing.
      voice({ wave: 'triangle', from: 180, to: 420, duration: 0.3, volume: 0.22, filter: 600, q: 1, vibrato: [14, 40] });
      break;
    case 1:
      // A slide whistle going up.
      tone(500, 1400, 0.45, 0.12);
      break;
    case 2:
      // Ta-da.
      [523, 659, 784].forEach((f, i) => tone(f, f, i === 2 ? 0.4 : 0.14, 0.13, i * 0.11));
      break;
    case 3:
      // A little giggle.
      for (let i = 0; i < 5; i++) {
        const f = 900 - i * 60;
        voice({ wave: 'triangle', from: f, to: f * 1.15, duration: 0.07, volume: 0.13, filter: 1400, q: 2, delay: i * 0.09 });
      }
      break;
  }
}

/** A present is opened: paper rustles, then a sparkly rising run. */
export function giftOpen(): void {
  noise(0.12, 3000, 0.07);
  noise(0.1, 2400, 0.06, 0.1);
  [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.22, 0.09, 0.15 + i * 0.07));
}

let chargeOsc: OscillatorNode | null = null;
let chargeGain: GainNode | null = null;

/** The snowball cannon charging: a soft tone that rises while held, then holds; off stops it. */
export function cannonCharge(on: boolean): void {
  const ac = ready();
  if (!ac || !master) return;
  const t = ac.currentTime;
  if (!chargeOsc) {
    chargeOsc = ac.createOscillator();
    chargeOsc.type = 'sine';
    chargeOsc.frequency.value = 200;
    chargeGain = ac.createGain();
    chargeGain.gain.value = 0;
    chargeOsc.connect(chargeGain).connect(master);
    chargeOsc.start();
  }
  chargeOsc.frequency.cancelScheduledValues(t);
  if (on) {
    chargeOsc.frequency.setValueAtTime(200, t);
    chargeOsc.frequency.linearRampToValueAtTime(520, t + 2);
  }
  chargeGain!.gain.setTargetAtTime(on ? 0.06 : 0, t, 0.06);
}

/** The cannon fires a snowball: a soft poomf, lower for a bigger ball (size 0 to 1). */
export function cannonFire(size: number): void {
  const s = Math.min(1, Math.max(0, size));
  tone(220 - 100 * s, 60 - 20 * s, 0.25, 0.35);
  noise(0.2, 500 - 200 * s, 0.1 + 0.06 * s);
}

/** Down the hill on a sled: a gentle falling swoosh with a happy glide. */
export function whee(): void {
  noise(0.8, 1400, 0.05);
  tone(900, 600, 0.6, 0.06, 0.05);
}

/** Something slips across the ice: a very quiet scrape. */
export function scratch(): void {
  noise(0.12, 5000, 0.025);
}

/** An ice cube: a glassy clink. */
export function iceClink(): void {
  tone(2637, 2600, 0.18, 0.07);
  tone(3520, 3500, 0.12, 0.04, 0.02);
}

const CANDLE_NOTES = [659, 784, 880, 1047, 1175];

/** A candle is lit on an ice column: a soft bell, a different note for each colour. */
export function candle(index: number): void {
  const f = CANDLE_NOTES[((index % CANDLE_NOTES.length) + CANDLE_NOTES.length) % CANDLE_NOTES.length];
  tone(f, f, 0.5, 0.1);
  tone(f * 2, f * 2, 0.3, 0.03, 0.01);
}

/** Snow crunches underfoot or as a snowball lands (size 0 to 1). */
export function crunch(size: number): void {
  const s = Math.min(1, Math.max(0, size));
  noise(0.08 + 0.1 * s, 1200 - 500 * s, 0.07 + 0.06 * s);
}

/** One very soft shake of sleigh bells, again and again while the sleigh is driven. */
export function jingleStep(): void {
  const f = 2400 + Math.random() * 300;
  tone(f, f * 0.99, 0.09, 0.022);
  tone(f * 1.12, f * 1.11, 0.08, 0.016, 0.045);
  noise(0.03, 6500, 0.01);
}

/** Sleigh bells: a few soft taps. */
export function jingle(): void {
  for (let i = 0; i < 4; i++) {
    const f = i % 2 ? 2350 : 2637;
    tone(f, f * 0.99, 0.12, 0.05, i * 0.08);
    noise(0.04, 6000, 0.02, i * 0.08);
  }
}

// --- Spring and autumn ---------------------------------------------------

/** An egg hatches in the nest: crack, crack, then a peep. */
export function hatch(): void {
  noise(0.04, 2400, 0.12);
  noise(0.05, 2000, 0.12, 0.22);
  tone(2600, 3300, 0.08, 0.1, 0.5);
  tone(2700, 3400, 0.08, 0.1, 0.64);
}

/** Bees come out of the hive: a soft buzzing that drifts and fades. */
export function bees(): void {
  for (const [delay, from] of [
    [0, 210],
    [0.1, 240],
    [0.25, 225],
  ]) {
    voice({ wave: 'sawtooth', from, to: from * 1.1, duration: 1.3, volume: 0.04, filter: 550, filterTo: 450, q: 1, vibrato: [35, 20], delay });
  }
}

/** The campfire is lit: a few soft crackles. */
/** An axe comes down on a log: a woody knock. */
export function chop(): void {
  tone(220, 140, 0.08, 0.2);
  noise(0.06, 1400, 0.12);
}

/** Wood laid on the campfire: it flares up with a crackle. */
export function flare(): void {
  noise(0.4, 900, 0.06);
  for (const delay of [0.05, 0.18, 0.3]) noise(0.03, 3000, 0.07, delay);
}

export function crackle(): void {
  for (const delay of [0, 0.13, 0.21, 0.4, 0.55, 0.72]) noise(0.03, 2600 + Math.random() * 1500, 0.08 + Math.random() * 0.05, delay);
  noise(0.6, 500, 0.04);
}

// Five mushrooms, low to high, on a pentatonic scale.
const MUSHROOM_NOTES = [262, 294, 330, 392, 440];

/** A mushroom is tapped: a springy note that bends up and settles. */
export function boing(i: number): void {
  const f = MUSHROOM_NOTES[Math.max(0, Math.min(MUSHROOM_NOTES.length - 1, i))];
  tone(f * 0.75, f, 0.08, 0.16);
  tone(f, f, 0.3, 0.12, 0.07);
  tone(f * 2, f * 2, 0.15, 0.03, 0.07);
}

/** A pile of dry leaves is stirred. */
export function leaves(): void {
  noise(0.3, 3200, 0.05);
  noise(0.2, 2200, 0.04, 0.08);
  for (const delay of [0.03, 0.11, 0.19]) noise(0.03, 4500, 0.04, delay);
}

/** A pumpkin is carved: a gentle scrape or two. */
export function carve(): void {
  noise(0.22, 1600, 0.06);
  noise(0.18, 1900, 0.05, 0.3);
}

/** The cider press turns: a wooden creak, then a little pour. */
export function press(): void {
  tone(180, 140, 0.3, 0.08);
  noise(0.25, 900, 0.03);
  for (let i = 0; i < 4; i++) tone(900 + i * 60, 700 + i * 60, 0.06, 0.05, 0.4 + i * 0.07);
}

/** A rainbow appears: a soft rising shimmer. */
export function rainbow(): void {
  [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
    tone(f, f, 0.6, 0.06, i * 0.09);
    tone(f * 2, f * 2, 0.3, 0.015, i * 0.09 + 0.02);
  });
}
