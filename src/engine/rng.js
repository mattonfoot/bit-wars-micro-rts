// Seeded PRNG (mulberry32) + helpers + value noise. Deterministic so map seeds are shareable.
export function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export class RNG {
  constructor(seed) {
    this.seed = typeof seed === 'string' ? hashString(seed) : (seed >>> 0) || 1;
    this.s = this.seed;
  }
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// Smooth 2D value noise with a per-instance permutation.
export class Noise2D {
  constructor(rng) {
    this.perm = new Uint8Array(512);
    const p = [];
    for (let i = 0; i < 256; i++) p.push(i);
    rng.shuffle(p);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  grad(ix, iy) {
    return this.perm[(this.perm[ix & 255] + iy) & 255] / 255;
  }
  at(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = this.grad(x0, y0), b = this.grad(x0 + 1, y0);
    const c = this.grad(x0, y0 + 1), d = this.grad(x0 + 1, y0 + 1);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  }
  fbm(x, y, octaves = 4, lac = 2, gain = 0.5) {
    let v = 0, amp = 1, f = 1, norm = 0;
    for (let i = 0; i < octaves; i++) {
      v += this.at(x * f, y * f) * amp;
      norm += amp;
      amp *= gain;
      f *= lac;
    }
    return v / norm;
  }
}
