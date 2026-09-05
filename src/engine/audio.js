// Tiny procedural sound synth (WebAudio). No assets needed; unlocked on first user gesture.
export class Audio {
  constructor() {
    this.ctx = null; this.master = null;
    this.muted = false;
    try { this.muted = localStorage.getItem('bw_muted') === '1'; } catch (e) { /* ignore */ }
    this.lastPlay = new Map();
  }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('bw_muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02);
  }
  throttle(name, ms) {
    const now = performance.now();
    if ((this.lastPlay.get(name) || 0) + ms > now) return false;
    this.lastPlay.set(name, now); return true;
  }
  tone(freq, dur, type = 'square', vol = 0.2, slide = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, vol = 0.2, freq = 1000, q = 1) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t); src.stop(t + dur + 0.02);
  }
  play(name, vol = 1) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'ui': this.tone(660, 0.05, 'square', 0.08); break;
      case 'select': this.tone(520, 0.05, 'triangle', 0.08); this.tone(780, 0.06, 'triangle', 0.06); break;
      case 'order': this.tone(440, 0.07, 'triangle', 0.09, 200); break;
      case 'light': if (this.throttle('light', 45)) this.noise(0.06, 0.12 * vol, 2600, 2); break;
      case 'heavy': if (this.throttle('heavy', 70)) { this.noise(0.12, 0.16 * vol, 900, 1.5); this.tone(180, 0.08, 'sawtooth', 0.06, -80); } break;
      case 'energy': if (this.throttle('energy', 60)) this.tone(1200, 0.12, 'sine', 0.08 * vol, -700); break;
      case 'melee': if (this.throttle('melee', 60)) this.noise(0.05, 0.1 * vol, 1400, 3); break;
      case 'blast': if (this.throttle('blast', 80)) { this.noise(0.45, 0.35 * vol, 220, 0.8); this.tone(70, 0.4, 'sine', 0.25, -40); } break;
      case 'launch': if (this.throttle('launch', 100)) this.tone(300, 0.2, 'triangle', 0.08, 300); break;
      case 'death': if (this.throttle('death', 90)) { this.noise(0.15, 0.12, 600, 1); this.tone(220, 0.15, 'square', 0.05, -120); } break;
      case 'shield': if (this.throttle('shield', 90)) this.tone(900, 0.08, 'sine', 0.05, 300); break;
      case 'broken': this.tone(300, 0.3, 'sawtooth', 0.12, -150); break;
      case 'captured': this.tone(523, 0.12, 'triangle', 0.12); setTimeout(() => this.tone(784, 0.2, 'triangle', 0.12), 110); break;
      case 'lost': this.tone(440, 0.15, 'triangle', 0.1); setTimeout(() => this.tone(311, 0.25, 'triangle', 0.1), 130); break;
      case 'alarm': this.tone(880, 0.12, 'square', 0.1); setTimeout(() => this.tone(660, 0.14, 'square', 0.1), 140); break;
      case 'built': this.tone(392, 0.1, 'triangle', 0.1); setTimeout(() => this.tone(587, 0.15, 'triangle', 0.1), 100); break;
      case 'spawn': this.tone(494, 0.08, 'triangle', 0.08, 200); break;
      case 'destroyed': this.noise(0.8, 0.4, 150, 0.7); this.tone(55, 0.7, 'sine', 0.3, -20); break;
      case 'victory': [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.15), i * 160)); break;
      case 'defeat': [392, 349, 311, 262].forEach((f, i) => setTimeout(() => this.tone(f, 0.45, 'sawtooth', 0.12), i * 220)); break;
      default: break;
    }
  }
}
