// Pointy-top hexagonal grid in "odd-r" offset coordinates, with corner points displaced by fractal
// noise so cells are irregular. The displacement is point-symmetric about the map centre, so the
// 180° mirrored halves used for fairness still match exactly. All world geometry (cell polygons,
// neighbours, point-in-cell) comes from this class, so simulation and rendering always agree.
import { Noise2D, RNG } from '../engine/rng.js';

export const HEX_R = 19;                 // circumradius (world units)
export const HEX_W = Math.sqrt(3) * HEX_R; // horizontal spacing between centres
export const HEX_V = 1.5 * HEX_R;          // vertical spacing between rows

export class HexGrid {
  constructor(w, h, seed = 'hex', jitter = 0.28) {
    this.w = w; this.h = h; this.N = w * h;
    this.R = HEX_R; this.W = HEX_W; this.V = HEX_V;
    this.worldW = (w + 0.5) * HEX_W;
    this.worldH = (h - 1) * HEX_V + 2 * HEX_R;
    // rotation centre: 180° symmetry maps (c,r) -> (w-1-c, h-1-r) when h is even
    this.cx = this.worldW / 2; this.cy = this.worldH / 2;
    this.jitter = jitter * HEX_R;
    const rng = new RNG('hex:' + seed);
    this.nx = new Noise2D(rng); this.ny = new Noise2D(rng);
    // centres
    this.cxs = new Float32Array(this.N); this.cys = new Float32Array(this.N);
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) { const i = r * w + c; this.cxs[i] = (c + 0.5 * (r & 1) + 0.5) * HEX_W; this.cys[i] = r * HEX_V + HEX_R; }
    // neighbours (6 per cell, -1 when out of bounds). Order: E, NE, NW, W, SW, SE.
    this.nb = new Int32Array(this.N * 6).fill(-1);
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const i = r * w + c;
      const odd = r & 1;
      const d = odd ? [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]] : [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
      for (let k = 0; k < 6; k++) { const nc = c + d[k][0], nr = r + d[k][1]; if (nc >= 0 && nr >= 0 && nc < w && nr < h) this.nb[i * 6 + k] = nr * w + nc; }
    }
    // corners: 6 per cell, shared between cells via an integer key on the ideal lattice
    this.cornerCache = new Map();
    this.corner = new Float32Array(this.N * 12); // x,y per corner per cell (jittered)
    for (let i = 0; i < this.N; i++) {
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 6 + (k * Math.PI) / 3; // 30°, 90°, ... pointy top
        const ix = this.cxs[i] + Math.cos(a) * HEX_R, iy = this.cys[i] + Math.sin(a) * HEX_R;
        const [x, y] = this.cornerAt(ix, iy);
        this.corner[i * 12 + k * 2] = x; this.corner[i * 12 + k * 2 + 1] = y;
      }
    }
  }
  /** Jittered position of the corner whose ideal position is (ix,iy). Symmetric: j(rot p) = -j(p). */
  cornerAt(ix, iy) {
    const kx = Math.round(ix / (HEX_W / 2)), ky = Math.round(iy / (HEX_R / 2));
    const key = ky * 4096 + kx;
    let p = this.cornerCache.get(key);
    if (p) return p;
    const rx = 2 * this.cx - ix, ry = 2 * this.cy - iy;
    const s = 0.045;
    const dx = (this.nx.fbm(ix * s, iy * s, 3) - this.nx.fbm(rx * s, ry * s, 3)) * this.jitter * 1.6;
    const dy = (this.ny.fbm(ix * s + 7, iy * s + 3, 3) - this.ny.fbm(rx * s + 7, ry * s + 3, 3)) * this.jitter * 1.6;
    p = [ix + dx, iy + dy];
    this.cornerCache.set(key, p);
    return p;
  }
  index(c, r) { return r * this.w + c; }
  col(i) { return i % this.w; }
  row(i) { return (i / this.w) | 0; }
  inb(c, r) { return c >= 0 && r >= 0 && c < this.w && r < this.h; }
  center(i) { return [this.cxs[i], this.cys[i]]; }
  mirror(i) { return this.N - 1 - i; }
  neighbor(i, k) { return this.nb[i * 6 + k]; }
  /** Ideal (un-jittered) cell containing world point. */
  idealCellAt(x, y) {
    // axial rounding for pointy-top
    const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / HEX_R, r = ((2 / 3) * y) / HEX_R;
    // shift: our centres are at x = (c + 0.5*(r&1) + 0.5) W, y = r V + R  -> adjust by (0.5W, R) offset
    const qq = ((Math.sqrt(3) / 3) * (x - HEX_W / 2) - (1 / 3) * (y - HEX_R)) / HEX_R, rr = ((2 / 3) * (y - HEX_R)) / HEX_R;
    void q; void r;
    let cx = qq, cz = rr, cy = -cx - cz;
    let rx = Math.round(cx), ry = Math.round(cy), rz = Math.round(cz);
    const dx = Math.abs(rx - cx), dy = Math.abs(ry - cy), dz = Math.abs(rz - cz);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    const row = rz, col = rx + ((rz - (rz & 1)) >> 1);
    if (!this.inb(col, row)) return -1;
    return this.index(col, row);
  }
  contains(i, x, y) {
    // point in (jittered) hexagon polygon
    let inside = false;
    const o = i * 12;
    for (let k = 0, j = 5; k < 6; j = k++) {
      const xi = this.corner[o + k * 2], yi = this.corner[o + k * 2 + 1], xj = this.corner[o + j * 2], yj = this.corner[o + j * 2 + 1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  /** Exact cell containing world point (accounts for jitter), or -1 outside the map. */
  cellAt(x, y) {
    let i = this.idealCellAt(x, y);
    if (i < 0) {
      // clamp to nearest in-bounds cell and test its polygon and neighbours
      const c = Math.max(0, Math.min(this.w - 1, Math.round(x / HEX_W - 0.5))), r = Math.max(0, Math.min(this.h - 1, Math.round((y - HEX_R) / HEX_V)));
      i = this.index(c, r);
    }
    if (this.contains(i, x, y)) return i;
    for (let k = 0; k < 6; k++) { const n = this.nb[i * 6 + k]; if (n >= 0 && this.contains(n, x, y)) return n; }
    // fell in a sliver at the map edge: return ideal cell if in bounds, else -1
    return this.idealCellAt(x, y) >= 0 ? i : -1;
  }
  cube(i) { const c = this.col(i), r = this.row(i); const x = c - ((r - (r & 1)) >> 1); return [x, -x - r, r]; }
  hexDist(i, j) { const a = this.cube(i), b = this.cube(j); return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])); }
  /** Cells within hex distance `radius` of cell i (in bounds). */
  cluster(i, radius) {
    const out = [i]; const seen = new Set([i]);
    let frontier = [i];
    for (let d = 0; d < radius; d++) {
      const next = [];
      for (const c of frontier) for (let k = 0; k < 6; k++) { const n = this.nb[c * 6 + k]; if (n >= 0 && !seen.has(n)) { seen.add(n); out.push(n); next.push(n); } }
      frontier = next;
    }
    return out;
  }
  /** Cells whose centre is within world radius of (x,y). */
  cellsWithin(x, y, radius) {
    const out = [];
    const r0 = Math.max(0, Math.floor((y - radius - HEX_R) / HEX_V)), r1 = Math.min(this.h - 1, Math.ceil((y + radius - HEX_R) / HEX_V));
    const c0 = Math.max(0, Math.floor((x - radius) / HEX_W - 1)), c1 = Math.min(this.w - 1, Math.ceil((x + radius) / HEX_W));
    const rr = radius * radius;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const i = r * this.w + c; const dx = this.cxs[i] - x, dy = this.cys[i] - y; if (dx * dx + dy * dy <= rr) out.push(i); }
    return out;
  }
  /** Ring of cells adjacent to a set (not in it). */
  fringe(cells) {
    const set = new Set(cells), out = [];
    for (const c of cells) for (let k = 0; k < 6; k++) { const n = this.nb[c * 6 + k]; if (n >= 0 && !set.has(n)) { set.add(n); out.push(n); } }
    return out;
  }
  /** Polygon corners of cell i as [[x,y]...]. */
  polygon(i) { const o = i * 12, p = []; for (let k = 0; k < 6; k++) p.push([this.corner[o + k * 2], this.corner[o + k * 2 + 1]]); return p; }
  /** Corner key for edge chaining (shared between cells). */
  cornerKey(i, k) { const o = i * 12; return Math.round(this.corner[o + k * 2] * 4) * 100003 + Math.round(this.corner[o + k * 2 + 1] * 4); }
}
