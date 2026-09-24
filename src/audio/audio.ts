/* Procedural audio: synthesized SFX + generative lounge-jazz soundtrack. No external files. */

export type SfxName =
  | 'ding'
  | 'gun_pistol'
  | 'gun_rifle'
  | 'gun_shotgun'
  | 'gun_smg'
  | 'gun_laser'
  | 'gun_plasma'
  | 'gun_gauss'
  | 'gun_tesla'
  | 'gun_flame'
  | 'gun_rocket'
  | 'gun_twang'
  | 'gun_nail'
  | 'gun_guitar'
  | 'gun_flare'
  | 'gun_cryo'
  | 'swing'
  | 'foam'
  | 'ignite'
  | 'impact'
  | 'boom'
  | 'burrow'
  | 'splat'
  | 'door_hit'
  | 'click'
  | 'open'
  | 'close'
  | 'collect_power'
  | 'collect_food'
  | 'collect_water'
  | 'collect_med'
  | 'coin'
  | 'build'
  | 'built'
  | 'upgrade'
  | 'levelup'
  | 'statup'
  | 'alarm'
  | 'hit'
  | 'rush_ok'
  | 'rush_fail'
  | 'door'
  | 'crate'
  | 'card'
  | 'legendary'
  | 'baby'
  | 'cat'
  | 'error'
  | 'toast'
  | 'explore'
  | 'home'
  | 'objective'
  | 'pickup'
  | 'drop'
  | 'heal'
  | 'whoosh'
  | 'type';

const NOTE = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  sfxBus!: GainNode;
  musicBus!: GainNode;
  reverb!: ConvolverNode;
  reverbSend!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private sfxVol = 0.8;
  private musicVol = 0.5;
  private muted = false;
  private musicOn = false;
  private nextBeat = 0;
  private beat = 0;
  private timer: any = 0;
  private lastPlay: Record<string, number> = {};

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && !this.muted) this.ctx.resume().catch(() => undefined);
      return;
    }
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC({ latencyHint: 'interactive' });
    } catch {
      this.ctx = null;
      return;
    }
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    this.sfxBus = ctx.createGain();
    this.musicBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.musicBus.connect(this.master);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(2.4);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.28;
    this.reverbSend.connect(this.reverb).connect(this.master);
    this.applyVolumes();
    if (this.musicOn) this.startMusic();
  }

  private makeImpulse(sec: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }

  private noise(): AudioBuffer {
    if (this.noiseBuf) return this.noiseBuf;
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    return buf;
  }

  setVolumes(sfx: number, music: number) {
    this.sfxVol = sfx;
    this.musicVol = music;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(this.muted ? 0 : this.sfxVol * 0.9, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.muted ? 0 : this.musicVol * 0.42, t, 0.3);
  }

  /** Global mute (ads, hidden tab). Suspends the context to save CPU. */
  setMuted(m: boolean) {
    this.muted = m;
    if (!this.ctx) return;
    this.applyVolumes();
    if (m) {
      setTimeout(() => {
        if (this.muted && this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => undefined);
      }, 120);
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
  }

  // ---------------------------------------------------------------- primitives
  private tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; attack?: number; t?: number; slide?: number; rev?: number; bus?: GainNode; filter?: number } = {}) {
    const ctx = this.ctx!;
    const t = (opts.t ?? ctx.currentTime) + 0.005;
    const o = ctx.createOscillator();
    o.type = opts.type ?? 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * opts.slide), t + dur);
    const gn = ctx.createGain();
    const vol = opts.vol ?? 0.3;
    const att = opts.attack ?? 0.005;
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + att);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = o;
    if (opts.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.filter;
      o.connect(f);
      node = f;
    }
    node.connect(gn);
    gn.connect(opts.bus ?? this.sfxBus);
    if (opts.rev) {
      const s = ctx.createGain();
      s.gain.value = opts.rev;
      gn.connect(s).connect(this.reverbSend);
    }
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private bell(freq: number, dur: number, vol = 0.25, t?: number, bus?: GainNode) {
    // FM bell
    const ctx = this.ctx!;
    const start = (t ?? ctx.currentTime) + 0.005;
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const mg = ctx.createGain();
    car.frequency.value = freq;
    mod.frequency.value = freq * 3.5;
    mg.gain.setValueAtTime(freq * 2.2, start);
    mg.gain.exponentialRampToValueAtTime(1, start + dur);
    mod.connect(mg).connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    car.connect(g);
    g.connect(bus ?? this.sfxBus);
    const s = ctx.createGain();
    s.gain.value = 0.5;
    g.connect(s).connect(this.reverbSend);
    car.start(start);
    mod.start(start);
    car.stop(start + dur + 0.05);
    mod.stop(start + dur + 0.05);
  }

  private noiseHit(dur: number, opts: { freq?: number; q?: number; type?: BiquadFilterType; vol?: number; t?: number; bus?: GainNode; sweep?: number; attack?: number } = {}) {
    const ctx = this.ctx!;
    const t = (opts.t ?? ctx.currentTime) + 0.005;
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    src.playbackRate.value = 0.7 + Math.random() * 0.6;
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? 'bandpass';
    f.frequency.setValueAtTime(opts.freq ?? 1200, t);
    if (opts.sweep) f.frequency.exponentialRampToValueAtTime(opts.sweep, t + dur);
    f.Q.value = opts.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.vol ?? 0.3, t + (opts.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(opts.bus ?? this.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // ---------------------------------------------------------------- sfx
  play(name: SfxName) {
    if (!this.ctx || this.muted || this.sfxVol <= 0) return;
    const now = this.ctx.currentTime;
    const last = this.lastPlay[name] ?? -1;
    const minGap = name === 'hit' || name === 'type' || name === 'impact' ? 0.06 : name === 'alarm' ? 1.8 : name === 'foam' || name === 'gun_flame' ? 0.18 : name === 'burrow' ? 0.3 : 0.04;
    if (now - last < minGap) return;
    this.lastPlay[name] = now;
    const t = now;
    switch (name) {
      // ---- combat
      case 'gun_pistol':
        this.noiseHit(0.12, { freq: 1600, q: 0.8, vol: 0.2, sweep: 400 });
        this.tone(140, 0.09, { type: 'square', vol: 0.06, slide: 0.4, filter: 900 });
        break;
      case 'gun_rifle':
        this.noiseHit(0.22, { freq: 1100, q: 0.7, vol: 0.24, sweep: 250 });
        this.tone(90, 0.16, { type: 'sawtooth', vol: 0.08, slide: 0.4, filter: 700 });
        this.noiseHit(0.4, { freq: 600, type: 'lowpass', vol: 0.05, t: t + 0.05 });
        break;
      case 'gun_shotgun':
        this.noiseHit(0.32, { freq: 800, q: 0.5, vol: 0.3, sweep: 150 });
        this.tone(70, 0.22, { type: 'sawtooth', vol: 0.1, slide: 0.35, filter: 500 });
        this.noiseHit(0.08, { freq: 3000, vol: 0.05, t: t + 0.35 });
        break;
      case 'gun_smg':
        for (let i = 0; i < 3; i++) this.noiseHit(0.07, { freq: 1500, q: 0.9, vol: 0.14, sweep: 500, t: t + i * 0.08 });
        break;
      case 'gun_laser':
        this.tone(1800, 0.16, { type: 'square', vol: 0.05, slide: 0.25, filter: 3500 });
        this.tone(900, 0.14, { type: 'sine', vol: 0.08, slide: 0.3 });
        break;
      case 'gun_plasma':
        this.tone(300, 0.25, { type: 'sawtooth', vol: 0.07, slide: 2.4, filter: 2000 });
        this.noiseHit(0.2, { freq: 2500, vol: 0.05, sweep: 600 });
        break;
      case 'gun_gauss':
        this.tone(200, 0.12, { type: 'sine', vol: 0.06, slide: 8, attack: 0.1 });
        this.noiseHit(0.18, { freq: 4000, vol: 0.12, t: t + 0.1, sweep: 800 });
        this.tone(60, 0.2, { type: 'square', vol: 0.06, t: t + 0.1, filter: 400 });
        break;
      case 'gun_tesla':
        for (let i = 0; i < 4; i++) this.noiseHit(0.05, { freq: 5000 + i * 700, q: 3, vol: 0.08, t: t + i * 0.035 });
        this.tone(120, 0.2, { type: 'sawtooth', vol: 0.05, filter: 2400 });
        break;
      case 'gun_flame':
        this.noiseHit(0.35, { freq: 500, type: 'lowpass', vol: 0.14, attack: 0.05, sweep: 900 });
        break;
      case 'gun_rocket':
        this.noiseHit(0.5, { freq: 900, type: 'bandpass', q: 0.6, vol: 0.18, sweep: 2500, attack: 0.03 });
        this.tone(110, 0.3, { type: 'sawtooth', vol: 0.05, slide: 1.8, filter: 800 });
        break;
      case 'gun_twang':
        this.tone(220, 0.18, { type: 'triangle', vol: 0.12, slide: 0.6 });
        this.noiseHit(0.1, { freq: 2600, vol: 0.05 });
        break;
      case 'gun_nail':
        this.noiseHit(0.05, { freq: 3500, q: 2, vol: 0.12 });
        this.tone(900, 0.05, { type: 'square', vol: 0.04, slide: 0.5 });
        break;
      case 'gun_guitar': {
        const root = [52, 55, 57, 59][Math.floor(Math.random() * 4)];
        [0, 7, 12].forEach((iv, i) => this.tone(NOTE(root + iv), 0.45, { type: 'sawtooth', vol: 0.05, filter: 1600 + i * 300, t: t + i * 0.015 }));
        break;
      }
      case 'gun_flare':
        this.noiseHit(0.25, { freq: 700, vol: 0.14, sweep: 2600, attack: 0.02 });
        this.tone(400, 0.3, { type: 'triangle', vol: 0.04, slide: 1.8 });
        break;
      case 'gun_cryo':
        this.noiseHit(0.3, { freq: 6000, type: 'highpass', vol: 0.08, attack: 0.03 });
        this.tone(1400, 0.2, { type: 'sine', vol: 0.05, slide: 1.4 });
        break;
      case 'swing':
        this.noiseHit(0.16, { freq: 700, q: 1.2, vol: 0.1, sweep: 2400, attack: 0.05 });
        break;
      case 'foam':
        this.noiseHit(0.3, { freq: 3500, type: 'highpass', vol: 0.05, attack: 0.04 });
        break;
      case 'ignite':
        this.noiseHit(0.6, { freq: 400, type: 'lowpass', vol: 0.2, sweep: 1600, attack: 0.08 });
        this.noiseHit(0.1, { freq: 3000, vol: 0.06 });
        break;
      case 'impact':
        this.noiseHit(0.07, { freq: 1200, q: 1.4, vol: 0.12 });
        this.tone(110, 0.06, { type: 'square', vol: 0.05, slide: 0.5, filter: 800 });
        break;
      case 'boom':
        this.noiseHit(0.9, { freq: 260, type: 'lowpass', vol: 0.35, sweep: 60, attack: 0.01 });
        this.tone(55, 0.7, { type: 'sine', vol: 0.25, slide: 0.5 });
        this.noiseHit(0.3, { freq: 2000, vol: 0.06, t: t + 0.05, sweep: 400 });
        break;
      case 'burrow':
        this.noiseHit(0.6, { freq: 180, type: 'lowpass', vol: 0.22, attack: 0.1, sweep: 90 });
        for (let i = 0; i < 4; i++) this.noiseHit(0.05, { freq: 900 + i * 300, q: 2, vol: 0.05, t: t + 0.1 + i * 0.07 });
        break;
      case 'splat':
        this.noiseHit(0.14, { freq: 500, q: 1.5, vol: 0.14, sweep: 150 });
        this.tone(180, 0.1, { type: 'sine', vol: 0.06, slide: 0.4 });
        break;
      case 'door_hit':
        this.tone(160, 0.3, { type: 'triangle', vol: 0.1, slide: 0.8 });
        this.noiseHit(0.12, { freq: 1800, q: 3, vol: 0.1 });
        this.bell(NOTE(43), 0.5, 0.04);
        break;
      case 'ding':
        // elevator arrival chime: two soft bells
        this.bell(NOTE(84), 0.9, 0.07);
        this.bell(NOTE(79), 1.1, 0.06, t + 0.16);
        break;
      case 'click':
        this.tone(1400, 0.05, { type: 'triangle', vol: 0.12 });
        this.noiseHit(0.03, { freq: 3500, vol: 0.05 });
        break;
      case 'open':
        this.tone(520, 0.12, { type: 'triangle', vol: 0.12, slide: 1.6 });
        this.noiseHit(0.12, { freq: 2000, sweep: 5000, vol: 0.04 });
        break;
      case 'close':
        this.tone(700, 0.1, { type: 'triangle', vol: 0.1, slide: 0.6 });
        break;
      case 'collect_power':
        this.bell(NOTE(79), 0.5, 0.18);
        this.bell(NOTE(86), 0.6, 0.14, t + 0.07);
        this.tone(NOTE(67), 0.2, { type: 'square', vol: 0.04, filter: 2000 });
        break;
      case 'collect_food':
        this.bell(NOTE(76), 0.5, 0.18);
        this.bell(NOTE(81), 0.6, 0.14, t + 0.07);
        break;
      case 'collect_water':
        this.tone(NOTE(84), 0.25, { vol: 0.15, slide: 1.4 });
        this.bell(NOTE(83), 0.6, 0.14, t + 0.06);
        this.tone(NOTE(90), 0.12, { vol: 0.08, slide: 1.6, t: t + 0.1 });
        break;
      case 'collect_med':
        this.bell(NOTE(74), 0.5, 0.16);
        this.bell(NOTE(78), 0.6, 0.14, t + 0.08);
        break;
      case 'coin':
        this.bell(NOTE(88), 0.35, 0.12);
        this.bell(NOTE(93), 0.5, 0.12, t + 0.06);
        break;
      case 'build':
        for (let i = 0; i < 3; i++) {
          this.noiseHit(0.12, { freq: 900 + i * 200, q: 6, vol: 0.2, t: t + i * 0.16 });
          this.tone(180 + i * 30, 0.08, { type: 'square', vol: 0.06, t: t + i * 0.16, filter: 1200 });
        }
        break;
      case 'built':
        [72, 76, 79, 84].forEach((m, i) => this.bell(NOTE(m), 0.7, 0.13, t + i * 0.07));
        break;
      case 'upgrade':
        [67, 71, 74, 79, 83].forEach((m, i) => this.tone(NOTE(m), 0.25, { type: 'triangle', vol: 0.12, t: t + i * 0.055, rev: 0.4 }));
        break;
      case 'levelup':
        [72, 76, 79].forEach((m, i) => this.tone(NOTE(m), 0.18, { type: 'square', vol: 0.06, t: t + i * 0.08, filter: 3000 }));
        this.tone(NOTE(84), 0.45, { type: 'square', vol: 0.07, t: t + 0.24, filter: 3200, rev: 0.4 });
        this.bell(NOTE(96), 0.6, 0.08, t + 0.24);
        break;
      case 'statup':
        this.tone(NOTE(76), 0.12, { type: 'triangle', vol: 0.12 });
        this.tone(NOTE(83), 0.25, { type: 'triangle', vol: 0.12, t: t + 0.08 });
        break;
      case 'alarm': {
        const ctx = this.ctx;
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(520, t);
        o.frequency.linearRampToValueAtTime(820, t + 0.35);
        o.frequency.linearRampToValueAtTime(520, t + 0.7);
        o.frequency.linearRampToValueAtTime(820, t + 1.05);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 900;
        f.Q.value = 2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.05);
        g.gain.setValueAtTime(0.06, t + 1);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        o.connect(f).connect(g).connect(this.sfxBus);
        o.start(t);
        o.stop(t + 1.25);
        break;
      }
      case 'hit':
        this.noiseHit(0.08, { freq: 1800, q: 1.5, vol: 0.12 });
        this.tone(160, 0.07, { type: 'square', vol: 0.05, slide: 0.5, filter: 1500 });
        break;
      case 'rush_ok':
        [67, 71, 74, 79].forEach((m, i) => this.tone(NOTE(m), 0.12, { type: 'sawtooth', vol: 0.05, t: t + i * 0.04, filter: 2500 }));
        this.bell(NOTE(91), 0.6, 0.12, t + 0.16);
        break;
      case 'rush_fail':
        this.tone(220, 0.35, { type: 'sawtooth', vol: 0.12, slide: 0.5, filter: 900 });
        this.tone(233, 0.35, { type: 'sawtooth', vol: 0.1, slide: 0.5, filter: 900 });
        break;
      case 'door':
        this.noiseHit(1.3, { freq: 300, type: 'lowpass', vol: 0.25, attack: 0.2, sweep: 900 });
        this.tone(55, 1.2, { type: 'sawtooth', vol: 0.08, filter: 200, attack: 0.2 });
        this.noiseHit(0.5, { freq: 4000, type: 'highpass', vol: 0.06, t: t + 1, attack: 0.02 });
        break;
      case 'crate':
        this.noiseHit(0.4, { freq: 800, sweep: 5000, vol: 0.14, attack: 0.1 });
        this.noiseHit(0.1, { freq: 400, q: 4, vol: 0.2, t: t + 0.35 });
        break;
      case 'card':
        this.noiseHit(0.1, { freq: 3000, vol: 0.08 });
        this.tone(NOTE(79 + Math.floor(Math.random() * 5)), 0.2, { type: 'triangle', vol: 0.08 });
        break;
      case 'legendary':
        [72, 76, 79, 83, 86, 91].forEach((m, i) => this.bell(NOTE(m), 1.2, 0.1, t + i * 0.06));
        this.noiseHit(1.2, { freq: 6000, type: 'highpass', vol: 0.05, attack: 0.3 });
        break;
      case 'baby':
        [84, 88, 91, 88, 84, 79].forEach((m, i) => this.bell(NOTE(m), 0.6, 0.08, t + i * 0.16));
        break;
      case 'cat': {
        const ctx = this.ctx;
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(700, t);
        o.frequency.linearRampToValueAtTime(1100, t + 0.15);
        o.frequency.linearRampToValueAtTime(600, t + 0.5);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.Q.value = 5;
        f.frequency.setValueAtTime(900, t);
        f.frequency.linearRampToValueAtTime(1800, t + 0.2);
        f.frequency.linearRampToValueAtTime(800, t + 0.5);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.1, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        o.connect(f).connect(g).connect(this.sfxBus);
        o.start(t);
        o.stop(t + 0.6);
        [83, 86, 90].forEach((m, i) => this.bell(NOTE(m), 0.8, 0.06, t + 0.5 + i * 0.1));
        break;
      }
      case 'error':
        this.tone(180, 0.18, { type: 'square', vol: 0.06, filter: 800 });
        this.tone(150, 0.2, { type: 'square', vol: 0.06, t: t + 0.1, filter: 800 });
        break;
      case 'toast':
        this.tone(NOTE(81), 0.15, { type: 'triangle', vol: 0.06 });
        break;
      case 'explore':
        [72, 74, 76, 79].forEach((m, i) => this.tone(NOTE(m), 0.15, { type: 'triangle', vol: 0.1, t: t + i * 0.09 }));
        break;
      case 'home':
        [67, 72, 76, 79, 84].forEach((m, i) => this.tone(NOTE(m), 0.3, { type: 'triangle', vol: 0.1, t: t + i * 0.1, rev: 0.4 }));
        break;
      case 'objective':
        this.bell(NOTE(84), 0.6, 0.14);
        this.bell(NOTE(88), 0.7, 0.14, t + 0.1);
        this.bell(NOTE(91), 0.9, 0.14, t + 0.2);
        break;
      case 'pickup':
        this.tone(600, 0.08, { type: 'triangle', vol: 0.1, slide: 1.8 });
        break;
      case 'drop':
        this.tone(300, 0.1, { type: 'triangle', vol: 0.12, slide: 0.6 });
        this.noiseHit(0.06, { freq: 600, vol: 0.08 });
        break;
      case 'heal':
        [76, 80, 83].forEach((m, i) => this.tone(NOTE(m), 0.3, { vol: 0.1, t: t + i * 0.06, rev: 0.5 }));
        break;
      case 'whoosh':
        this.noiseHit(0.3, { freq: 600, sweep: 3000, vol: 0.08, attack: 0.08 });
        break;
      case 'type':
        this.noiseHit(0.02, { freq: 4000, vol: 0.04 });
        break;
    }
  }

  // ---------------------------------------------------------------- music
  setMusic(on: boolean) {
    this.musicOn = on;
    if (on) this.startMusic();
    else this.stopMusic();
  }

  private startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextBeat = this.ctx.currentTime + 0.3;
    this.beat = 0;
    this.timer = setInterval(() => this.schedule(), 60);
  }
  private stopMusic() {
    clearInterval(this.timer);
    this.timer = 0;
  }

  // Lounge progression (chords as midi voicings), 2 bars each 4 beats
  private readonly chords: { root: number; voicing: number[]; scale: number[] }[] = [
    { root: 38, voicing: [53, 57, 60, 64], scale: [62, 64, 65, 67, 69, 72, 74] }, // Dm9
    { root: 43, voicing: [53, 57, 59, 64], scale: [62, 64, 67, 69, 71, 74, 76] }, // G13
    { root: 36, voicing: [52, 55, 59, 62], scale: [60, 62, 64, 67, 69, 71, 72] }, // Cmaj9
    { root: 45, voicing: [55, 58, 61, 64], scale: [61, 64, 67, 69, 70, 73, 76] }, // A7b9
    { root: 41, voicing: [52, 57, 60, 64], scale: [60, 64, 65, 67, 69, 72, 76] }, // Fmaj7
    { root: 40, voicing: [50, 55, 59, 62], scale: [59, 62, 64, 67, 69, 71, 74] }, // Em7
    { root: 38, voicing: [53, 57, 60, 65], scale: [60, 62, 65, 67, 69, 72, 74] }, // Dm7
    { root: 43, voicing: [53, 57, 59, 62], scale: [59, 62, 65, 67, 71, 74, 77] }, // G7
  ];
  private melodyNote = 67;

  private schedule() {
    if (!this.ctx || this.muted) {
      if (this.ctx) this.nextBeat = Math.max(this.nextBeat, this.ctx.currentTime + 0.2);
      return;
    }
    const spb = 60 / 82;
    while (this.nextBeat < this.ctx.currentTime + 0.25) {
      this.playBeat(this.beat, this.nextBeat, spb);
      this.nextBeat += spb;
      this.beat++;
    }
  }

  private playBeat(beat: number, t: number, spb: number) {
    const bar = Math.floor(beat / 4);
    const b = beat % 4;
    const chord = this.chords[bar % this.chords.length];
    const next = this.chords[(bar + 1) % this.chords.length];
    const bus = this.musicBus;
    const swing = spb * 0.66;
    // walking bass
    const bassSeq = [chord.root, chord.root + 7, chord.root + (b === 2 ? 3 + (bar % 2) : 5), next.root + (Math.random() < 0.5 ? 1 : -1)];
    const bn = b === 3 ? bassSeq[3] : bassSeq[b];
    this.tone(NOTE(bn), spb * 0.9, { type: 'triangle', vol: 0.34, bus, filter: 600, attack: 0.01 });
    this.tone(NOTE(bn + 12), spb * 0.5, { type: 'sine', vol: 0.06, bus, attack: 0.01 });
    // brushes: swish on 2 and 4, ride on swung eighths
    if (b === 1 || b === 3) this.noiseHit(spb * 0.6, { freq: 2500, q: 0.6, vol: 0.05, t, bus, attack: 0.03 });
    this.noiseHit(0.08, { freq: 9000, type: 'highpass', vol: 0.025, t, bus });
    if (Math.random() < 0.7) this.noiseHit(0.05, { freq: 9000, type: 'highpass', vol: 0.016, t: t + swing, bus });
    if (b === 0) this.tone(60, 0.25, { vol: 0.12, t, bus, slide: 0.5 });
    // electric piano comping (FM-ish via bells, softer)
    if (b === 0 || (b === 2 && Math.random() < 0.6) || (b === 1 && Math.random() < 0.3)) {
      const off = b === 1 ? swing : 0;
      for (const m of chord.voicing) this.ep(NOTE(m), spb * (b === 0 ? 1.6 : 0.8), 0.045, t + off);
    }
    // vibraphone melody phrases
    const phrase = bar % 4 < 2;
    if (phrase && Math.random() < 0.55) {
      const sc = chord.scale;
      let idx = sc.findIndex((m) => m >= this.melodyNote);
      if (idx < 0) idx = sc.length - 1;
      idx = Math.max(0, Math.min(sc.length - 1, idx + Math.floor(Math.random() * 5) - 2));
      this.melodyNote = sc[idx];
      const off = Math.random() < 0.5 ? 0 : swing;
      this.vibe(NOTE(this.melodyNote + 12), spb * 1.5, 0.06, t + off);
    }
  }

  private ep(freq: number, dur: number, vol: number, t: number) {
    const ctx = this.ctx!;
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const mg = ctx.createGain();
    car.frequency.value = freq;
    mod.frequency.value = freq;
    mg.gain.setValueAtTime(freq * 1.2, t);
    mg.gain.exponentialRampToValueAtTime(freq * 0.05, t + dur * 0.6);
    mod.connect(mg).connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2400;
    car.connect(f).connect(g).connect(this.musicBus);
    const s = ctx.createGain();
    s.gain.value = 0.6;
    g.connect(s).connect(this.reverbSend);
    car.start(t);
    mod.start(t);
    car.stop(t + dur + 0.05);
    mod.stop(t + dur + 0.05);
  }

  private vibe(freq: number, dur: number, vol: number, t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.frequency.value = freq * 4;
    const g2 = ctx.createGain();
    g2.gain.value = 0.15;
    const trem = ctx.createOscillator();
    trem.frequency.value = 5.5;
    const tg = ctx.createGain();
    tg.gain.value = 0.35;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const amp = ctx.createGain();
    amp.gain.value = 0.75;
    trem.connect(tg).connect(amp.gain);
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(amp).connect(this.musicBus);
    const s = ctx.createGain();
    s.gain.value = 0.9;
    amp.connect(s).connect(this.reverbSend);
    o.start(t);
    o2.start(t);
    trem.start(t);
    o.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
    trem.stop(t + dur + 0.05);
  }
}

export const audio = new AudioEngine();
