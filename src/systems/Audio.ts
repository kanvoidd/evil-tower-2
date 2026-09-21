/**
 * Процедурный звук на WebAudio: внешних аудиофайлов нет, поэтому игра остаётся лёгкой,
 * а звук можно заменить на файлы позже, поменяв реализацию play().
 * Звук глушится при потере фокуса и на время рекламы (требование модерации Яндекс Игр).
 */
export type SfxName =
  | 'click' | 'hit' | 'crit' | 'hurt' | 'dodge' | 'parry' | 'kill' | 'coin' | 'chest' | 'potion'
  | 'buy' | 'upgrade' | 'error' | 'win' | 'lose' | 'spawn' | 'move' | 'open' | 'break' | 'burst' | 'reward';

class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private volume = 0.7;
  private muted = false;
  private paused = new Set<string>();
  private musicTimer: number | null = null;
  private musicOn = false;
  private step = 0;

  setup(volume: number, muted: boolean): void {
    this.volume = volume;
    this.muted = muted;
    this.apply();
    const unlock = (): void => {
      this.ensure();
      this.ctx?.resume();
      this.startMusic();
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock, { passive: true }));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.suspend('hidden');
      else this.unsuspend('hidden');
    });
    window.addEventListener('blur', () => this.suspend('blur'));
    window.addEventListener('focus', () => this.unsuspend('blur'));
  }

  private ensure(): void {
    if (this.ctx) return;
    const AC = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.apply();
  }

  private apply(): void {
    if (!this.master || !this.ctx) return;
    const silent = this.muted || this.paused.size > 0;
    this.master.gain.setTargetAtTime(silent ? 0 : this.volume, this.ctx.currentTime, 0.02);
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    this.apply();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.apply();
  }

  get isSilent(): boolean {
    return this.muted || this.volume <= 0;
  }

  /** Пауза звука по причине (реклама, свёрнутая вкладка, потеря фокуса). */
  suspend(reason: string): void {
    this.paused.add(reason);
    this.apply();
  }

  unsuspend(reason: string): void {
    this.paused.delete(reason);
    this.apply();
  }

  // ------------------------------------------------------------------ синтез

  private tone(
    freq: number, dur: number, type: OscillatorType = 'square', vol = 0.2, delay = 0, slideTo?: number,
    dest?: AudioNode,
  ): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest ?? this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.2, delay = 0, hp = 300): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  play(name: SfxName): void {
    this.ensure();
    if (!this.ctx || this.muted || this.volume <= 0 || this.paused.size > 0) return;
    switch (name) {
      case 'click': this.tone(520, 0.06, 'square', 0.12); break;
      case 'open': this.tone(300, 0.12, 'triangle', 0.16, 0, 620); break;
      case 'move': this.tone(180, 0.07, 'triangle', 0.12, 0, 120); break;
      case 'spawn': this.tone(420, 0.09, 'sine', 0.07, 0, 640); break;
      case 'hit': this.noise(0.09, 0.22); this.tone(160, 0.11, 'square', 0.16, 0, 70); break;
      case 'crit':
        this.noise(0.12, 0.28); this.tone(220, 0.14, 'sawtooth', 0.18, 0, 90); this.tone(1100, 0.12, 'triangle', 0.12, 0.03);
        break;
      case 'burst': this.tone(140, 0.25, 'sawtooth', 0.18, 0, 400); this.noise(0.15, 0.2); break;
      case 'hurt': this.tone(230, 0.22, 'sawtooth', 0.2, 0, 80); this.noise(0.1, 0.18); break;
      case 'dodge': this.noise(0.16, 0.14, 0, 1800); break;
      case 'parry': this.tone(1400, 0.08, 'triangle', 0.16); this.tone(2100, 0.1, 'triangle', 0.1, 0.04); break;
      case 'kill': this.tone(300, 0.18, 'square', 0.14, 0, 60); break;
      case 'coin': this.tone(988, 0.07, 'square', 0.1); this.tone(1319, 0.14, 'square', 0.1, 0.06); break;
      case 'chest': [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.14, i * 0.07)); break;
      case 'potion': this.tone(400, 0.3, 'sine', 0.16, 0, 900); this.tone(600, 0.25, 'sine', 0.1, 0.08, 1100); break;
      case 'buy': this.tone(1046, 0.08, 'square', 0.1); this.tone(1568, 0.2, 'square', 0.1, 0.07); break;
      case 'upgrade': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.14, i * 0.06)); break;
      case 'reward': [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.15, i * 0.08)); break;
      case 'error': this.tone(140, 0.16, 'sawtooth', 0.14, 0, 100); break;
      case 'break': this.noise(0.25, 0.22, 0, 120); this.tone(120, 0.25, 'square', 0.14, 0, 40); break;
      case 'win': [523, 659, 784, 1046, 1319].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.16, i * 0.11)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.14, i * 0.18)); break;
    }
  }

  // ------------------------------------------------------------------ фоновая музыка

  private startMusic(): void {
    if (this.musicOn || !this.ctx) return;
    this.musicOn = true;
    const scale = [110, 130.8, 146.8, 164.8, 196, 220];
    const tick = (): void => {
      if (!this.ctx || !this.musicGain) return;
      if (this.muted || this.paused.size > 0) return;
      const s = this.step++;
      const root = scale[[0, 2, 1, 3][Math.floor(s / 8) % 4]];
      if (s % 8 === 0) {
        this.tone(root, 4.2, 'sine', 0.2, 0, undefined, this.musicGain);
        this.tone(root * 1.5, 4.2, 'triangle', 0.08, 0, undefined, this.musicGain);
      }
      if (Math.random() < 0.45) {
        const n = scale[Math.floor(Math.random() * scale.length)] * 4;
        this.tone(n, 1.1, 'sine', 0.05, 0, undefined, this.musicGain);
      }
    };
    this.musicTimer = window.setInterval(tick, 520);
  }

  destroy(): void {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
  }
}

export const AUDIO = new AudioSystem();
