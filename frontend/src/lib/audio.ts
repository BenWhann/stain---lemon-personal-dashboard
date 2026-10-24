// Synthesised sound: effects and an ambience mixer, built entirely with Web Audio.
// No audio files, so it works offline and adds nothing to the bundle.

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let muted = false;
let noiseBuffer: AudioBuffer | null = null;

function context(): Ctx | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.55;
    sfxBus.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean) {
  muted = value;
  if (master && ctx) master.gain.setTargetAtTime(value ? 0 : 0.9, ctx.currentTime, 0.05);
}

function noise(c: Ctx): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = c.sampleRate * 3;
  noiseBuffer = c.createBuffer(1, len, c.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function tone(
  freq: number,
  start: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; attack?: number; dest?: AudioNode; detune?: number } = {},
) {
  const c = context();
  if (!c || !sfxBus) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.value = freq;
  if (opts.detune) osc.detune.value = opts.detune;
  const peak = opts.gain ?? 0.2;
  const a = opts.attack ?? 0.008;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + a);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(opts.dest ?? sfxBus);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5]; // C major pentatonic-ish

export const sfx = {
  /** Marimba-like rising notes; each combo step climbs the scale. */
  complete(combo = 1) {
    const c = context();
    if (!c) return;
    const t = c.currentTime;
    const base = Math.min(combo - 1, 4);
    [0, 2, 4].forEach((step, i) => {
      const f = SCALE[Math.min(base + step, SCALE.length - 1)];
      tone(f, t + i * 0.07, 0.5, { type: 'sine', gain: 0.22 });
      tone(f * 4, t + i * 0.07, 0.12, { type: 'sine', gain: 0.03 });
    });
  },
  uncheck() {
    const c = context();
    if (!c) return;
    const t = c.currentTime;
    tone(523.25, t, 0.18, { gain: 0.12 });
    tone(392, t + 0.07, 0.25, { gain: 0.1 });
  },
  pop() {
    const c = context();
    if (!c || !sfxBus) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g).connect(sfxBus);
    osc.start(t);
    osc.stop(t + 0.16);
  },
  tick() {
    const c = context();
    if (!c) return;
    tone(1568, c.currentTime, 0.08, { type: 'triangle', gain: 0.06 });
  },
  whoosh() {
    const c = context();
    if (!c || !sfxBus) return;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noise(c);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.25);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(bp).connect(g).connect(sfxBus);
    src.start(t, Math.random());
    src.stop(t + 0.35);
  },
  /** A short purr: low rumble with a 26 Hz flutter, plus a little chirp for Lemon. */
  purr(cat: 'lemon' | 'stain') {
    const c = context();
    if (!c || !sfxBus) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = cat === 'lemon' ? 64 : 54;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    const flutter = c.createOscillator();
    flutter.frequency.value = 26;
    const fg = c.createGain();
    fg.gain.value = 0.5;
    const amp = c.createGain();
    amp.gain.value = 0.5;
    flutter.connect(fg).connect(amp.gain);
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.35, t + 0.15);
    env.gain.setValueAtTime(0.35, t + 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    osc.connect(lp).connect(amp).connect(env).connect(sfxBus);
    osc.start(t);
    flutter.start(t);
    osc.stop(t + 1.25);
    flutter.stop(t + 1.25);
    if (cat === 'lemon') {
      const chirp = c.createOscillator();
      const cg = c.createGain();
      chirp.frequency.setValueAtTime(900, t);
      chirp.frequency.exponentialRampToValueAtTime(1500, t + 0.09);
      chirp.frequency.exponentialRampToValueAtTime(1100, t + 0.16);
      cg.gain.setValueAtTime(0.0001, t);
      cg.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      chirp.connect(cg).connect(sfxBus);
      chirp.start(t);
      chirp.stop(t + 0.2);
    }
  },
  /** Singing-bowl bell for the end of a focus sprint. */
  bell() {
    const c = context();
    if (!c) return;
    const t = c.currentTime;
    [[528, 0.22, 3.2], [1056, 0.08, 2.2], [1584, 0.04, 1.4], [792, 0.06, 2.6]].forEach(([f, g, d]) =>
      tone(f, t, d, { gain: g, attack: 0.02 }),
    );
  },
  levelUp() {
    const c = context();
    if (!c) return;
    const t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      tone(f, t + i * 0.09, 0.7, { type: 'triangle', gain: 0.14 });
      tone(f * 2, t + i * 0.09, 0.3, { gain: 0.04 });
    });
  },
};

// ── Ambience mixer ──────────────────────────────────────────────────

export type AmbienceChannel = 'rain' | 'fire' | 'library' | 'purr' | 'keys';
export const AMBIENCE_CHANNELS: { id: AmbienceChannel; label: string }[] = [
  { id: 'rain', label: 'Rain' },
  { id: 'fire', label: 'Fireplace' },
  { id: 'library', label: 'Library' },
  { id: 'purr', label: 'Purring' },
  { id: 'keys', label: 'Lo-fi keys' },
];

interface Channel {
  gain: GainNode;
  stop: () => void;
}

const channels: Partial<Record<AmbienceChannel, Channel>> = {};

function loopNoise(c: Ctx): AudioBufferSourceNode {
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;
  src.start(0, Math.random() * 2);
  return src;
}

function buildChannel(id: AmbienceChannel, c: Ctx): Channel {
  const out = c.createGain();
  out.gain.value = 0;
  out.connect(master!);
  const timers: number[] = [];
  const nodes: AudioScheduledSourceNode[] = [];

  if (id === 'rain') {
    const src = loopNoise(c);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7000;
    const g = c.createGain();
    g.gain.value = 0.22;
    src.connect(hp).connect(lp).connect(g).connect(out);
    nodes.push(src);
    // individual drops on the window
    const drop = () => {
      const t = c.currentTime;
      const o = c.createOscillator();
      const dg = c.createGain();
      o.frequency.setValueAtTime(1800 + Math.random() * 2200, t);
      o.frequency.exponentialRampToValueAtTime(600, t + 0.03);
      dg.gain.setValueAtTime(0.0001, t);
      dg.gain.exponentialRampToValueAtTime(0.03 + Math.random() * 0.04, t + 0.003);
      dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(dg).connect(out);
      o.start(t);
      o.stop(t + 0.06);
      timers.push(window.setTimeout(drop, 40 + Math.random() * 180));
    };
    drop();
  } else if (id === 'fire') {
    const src = loopNoise(c);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const g = c.createGain();
    g.gain.value = 0.35;
    src.connect(lp).connect(g).connect(out);
    nodes.push(src);
    const crackle = () => {
      const t = c.currentTime;
      const s = c.createBufferSource();
      s.buffer = noise(c);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500 + Math.random() * 3000;
      const cg = c.createGain();
      cg.gain.setValueAtTime(0.0001, t);
      cg.gain.exponentialRampToValueAtTime(0.15 + Math.random() * 0.2, t + 0.002);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.05);
      s.connect(bp).connect(cg).connect(out);
      s.start(t, Math.random() * 2);
      s.stop(t + 0.1);
      timers.push(window.setTimeout(crackle, 60 + Math.random() * 420));
    };
    crackle();
  } else if (id === 'library') {
    // brown-ish noise: heavily low-passed, the hush of a big quiet room
    const src = loopNoise(c);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 0.3;
    const g = c.createGain();
    g.gain.value = 0.9;
    src.connect(lp).connect(g).connect(out);
    nodes.push(src);
  } else if (id === 'purr') {
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 52;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    const flutter = c.createOscillator();
    flutter.frequency.value = 24;
    const fg = c.createGain();
    fg.gain.value = 0.4;
    const amp = c.createGain();
    amp.gain.value = 0.5;
    flutter.connect(fg).connect(amp.gain);
    // breathing: purr swells on the in-breath and the out-breath
    const breath = c.createOscillator();
    breath.frequency.value = 0.28;
    const bg = c.createGain();
    bg.gain.value = 0.25;
    const level = c.createGain();
    level.gain.value = 0.35;
    breath.connect(bg).connect(level.gain);
    osc.connect(lp).connect(amp).connect(level).connect(out);
    [osc, flutter, breath].forEach((n) => n.start());
    nodes.push(osc, flutter, breath);
  } else if (id === 'keys') {
    // A slow ii–V–I–vi loop on a soft electric-piano-like voice
    const chords = [
      [146.83, 174.61, 220, 261.63, 329.63], // Dm9
      [98, 174.61, 246.94, 329.63, 392], // G13
      [130.81, 164.81, 196, 246.94, 293.66], // Cmaj9
      [110, 164.81, 196, 261.63, 329.63], // Am9
    ];
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    lp.connect(out);
    let i = 0;
    const play = () => {
      const t = c.currentTime + 0.05;
      chords[i % chords.length].forEach((f, n) => {
        const o = c.createOscillator();
        o.type = n === 0 ? 'triangle' : 'sine';
        o.frequency.value = f;
        o.detune.value = (Math.random() - 0.5) * 8;
        const g = c.createGain();
        const strum = n * 0.035;
        g.gain.setValueAtTime(0.0001, t + strum);
        g.gain.exponentialRampToValueAtTime(n === 0 ? 0.12 : 0.07, t + strum + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.9);
        o.connect(g).connect(lp);
        o.start(t + strum);
        o.stop(t + 4);
      });
      i++;
      timers.push(window.setTimeout(play, 3800));
    };
    play();
  }

  return {
    gain: out,
    stop: () => {
      timers.forEach((t) => clearTimeout(t));
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      });
      out.disconnect();
    },
  };
}

/** Set a channel's level (0..1). Channels are built lazily and torn down at zero. */
export function setAmbience(id: AmbienceChannel, level: number) {
  const c = context();
  if (!c || !master) return;
  let ch = channels[id];
  if (level <= 0.001) {
    if (ch) {
      ch.gain.gain.setTargetAtTime(0, c.currentTime, 0.2);
      const doomed = ch;
      delete channels[id];
      window.setTimeout(() => doomed.stop(), 900);
    }
    return;
  }
  if (!ch) {
    ch = buildChannel(id, c);
    channels[id] = ch;
  }
  ch.gain.gain.setTargetAtTime(level * level * 0.9, c.currentTime, 0.25);
}

export function stopAllAmbience() {
  (Object.keys(channels) as AmbienceChannel[]).forEach((id) => setAmbience(id, 0));
}
