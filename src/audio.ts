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

export type AnimalSound = 'cow' | 'hen' | 'sheep' | 'pig' | 'horse' | 'duck' | 'cat';

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
    case 'cat':
      voice({ wave: 'sawtooth', from: 520, to: 780, duration: 0.22, volume: 0.22, filter: 1400, q: 2.5 });
      voice({ wave: 'sawtooth', from: 780, to: 460, duration: 0.4, volume: 0.22, filter: 1600, filterTo: 900, q: 2.5, delay: 0.2 });
      break;
    case 'horse':
      voice({ wave: 'sawtooth', from: 520, to: 280, duration: 0.8, volume: 0.32, filter: 1200, filterTo: 700, q: 1.4, vibrato: [11, 45] });
      noise(0.12, 500, 0.06, 0.85);
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

let rainGain: GainNode | null = null;

/** A soft, steady patter while any cloud is raining; fades in and out. */
export function setRain(on: boolean): void {
  const ac = ready();
  if (!ac || !master) return;
  if (!rainGain) {
    const seconds = 2;
    const buffer = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const low = ac.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 2500;
    const high = ac.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 500;
    rainGain = ac.createGain();
    rainGain.gain.value = 0;
    src.connect(low).connect(high).connect(rainGain).connect(master);
    src.start();
  }
  rainGain.gain.setTargetAtTime(on ? 0.12 : 0, ac.currentTime, 0.15);
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

/** Bunting flutters. */
export function flutter(): void {
  noise(0.3, 4000, 0.03);
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

interface Song {
  /** Seconds per step (an eighth note). */
  step: number;
  /** Melody and bass, one entry per step: semitones above the song's root, or null for a rest. */
  melody: (number | null)[];
  bass: (number | null)[];
  root: number;
}

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
];

let songTimer = 0;
let songStep = 0;
let songNext = 0;

/** Play song 1, 2 or 3 on a loop, or 0 for quiet. */
export function playSong(n: number): void {
  clearInterval(songTimer);
  songTimer = 0;
  const song = SONGS[n - 1];
  const ac = ready();
  if (!song || !ac) return;
  songStep = 0;
  songNext = ac.currentTime + 0.1;
  // Notes are scheduled a little ahead, so the beat stays even.
  songTimer = window.setInterval(() => {
    const now = ready()?.currentTime;
    if (now === undefined) return;
    // After a pause (the app was away), pick the beat up again from now.
    if (songNext < now - 0.5) songNext = now + 0.05;
    while (songNext < now + 0.3) {
      const delay = Math.max(0, songNext - now);
      const m = song.melody[songStep % song.melody.length];
      const b = song.bass[songStep % song.bass.length];
      if (m !== null) {
        const f = song.root * Math.pow(2, m / 12);
        tone(f, f, song.step * 1.6, 0.1, delay);
      }
      if (b !== null) {
        const f = song.root * Math.pow(2, b / 12);
        tone(f, f * 0.98, song.step * 3, 0.12, delay);
      }
      songStep++;
      songNext += song.step;
    }
  }, 50);
}
