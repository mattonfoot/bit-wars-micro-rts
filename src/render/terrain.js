// Vector-map terrain on the jittered hex grid: black ground, thin outlines traced along cell edges.
// Mountains are contour lines of a height field, woods and shores are noised field outlines, paths are narrow stippled tracks.
import { T } from '../map/terrain.js';
import { THEMES } from '../map/themes.js';
import { TAU } from '../engine/math.js';
import { HEX_R } from '../map/hexgrid.js';

export const INK = {
  ground: '#000000', mountain: 'rgba(255,255,255,0.85)', water: '#3b8bff', shallow: 'rgba(120,180,255,0.7)', road: '#7d766a', roadDot: '#a89f8f',
  building: '#b5793a', brush: '#3fbf5a', rock: '#cfcfcf', crater: '#8a8a8a', rubble: '#7a7a7a', ore: '#ffd54a',
};
const MINI = ['#000000', '#3a3a3a', '#1d4a8a', '#2f6fb0', '#5a5a5a', '#1f4a2a', '#6a6a6a', '#5a3d1e', '#5a3d1e', '#2a2a2a', '#3a3a3a', '#c9a532'];

function h2(i, salt) { let x = (i * 374761393 + salt * 668265263) | 0; x = (x ^ (x >>> 13)) * 1274126177; x = x ^ (x >>> 16); return (x >>> 0) / 4294967296; }

// Edge k of a cell (corner k -> k+1) faces neighbour index 5-k (corner order starts at 30°, neighbours E,NE,NW,W,SW,SE).
const EDGE_NB = [5, 4, 3, 2, 1, 0];

/** Trace boundary loops of a cell mask as arrays of world points. */
export function traceLoops(grid, mask) {
  const starts = new Map(); // corner key -> [[x,y,endKey,ex,ey], ...]
  for (let i = 0; i < grid.N; i++) {
    if (!mask[i]) continue;
    for (let k = 0; k < 6; k++) {
      const n = grid.nb[i * 6 + k === 0 ? i * 6 + EDGE_NB[k] : i * 6 + EDGE_NB[k]];
      if (n >= 0 && mask[n]) continue;
      const a = k, b = (k + 1) % 6;
      const ka = grid.cornerKey(i, a), kb = grid.cornerKey(i, b);
      const o = i * 12;
      const seg = [grid.corner[o + a * 2], grid.corner[o + a * 2 + 1], kb, grid.corner[o + b * 2], grid.corner[o + b * 2 + 1]];
      if (!starts.has(ka)) starts.set(ka, []);
      starts.get(ka).push(seg);
    }
  }
  const loops = [];
  for (const [k0, segs] of starts) {
    while (segs.length) {
      const first = segs.pop();
      const loop = [[first[0], first[1]]];
      let cur = first;
      let guard = 0;
      while (cur[2] !== k0 && guard++ < 50000) {
        loop.push([cur[3], cur[4]]);
        const nxt = starts.get(cur[2]);
        if (!nxt || !nxt.length) break;
        cur = nxt.pop();
      }
      if (loop.length >= 3) loops.push(loop);
    }
  }
  return loops;
}
export function smoothLoop(pts, iterations = 1) {
  let p = pts;
  for (let it = 0; it < iterations; it++) {
    const out = [];
    for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]); out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    p = out;
  }
  return p;
}
// ---------- sampled fields: mountains and woods are drawn from smooth scalar fields with marching squares,
// so their outlines wind inside cells instead of following hex edges.
const SAMPLE = 6;                         // world units between field samples
const KERNEL_R = 1.75 * HEX_R;            // smoothing radius over cell centres
function hashLattice(ix, iy, seed) { let x = (ix * 374761393 + iy * 668265263 + seed * 1274126177) | 0; x = (x ^ (x >>> 13)) * 1103515245; x = x ^ (x >>> 16); return (x >>> 0) / 4294967296; }
function vnoise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hashLattice(ix, iy, seed), b = hashLattice(ix + 1, iy, seed), c = hashLattice(ix, iy + 1, seed), d = hashLattice(ix + 1, iy + 1, seed);
  return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
}
/** Fractal value noise in [-1, 1]. */
function fbm(x, y, seed, freq, octaves = 3) {
  let v = 0, amp = 1, f = freq, norm = 0;
  for (let o = 0; o < octaves; o++) { v += (vnoise(x * f, y * f, seed + o * 17) * 2 - 1) * amp; norm += amp; amp *= 0.5; f *= 2.1; }
  return v / norm;
}
/** Marching squares: append the level-set segments of a field to the current path. */
function contourPath(c, F, nx, ny, S, level) {
  const at = (x, y) => F[y * nx + x];
  const ip = (a, b) => (level - a) / (b - a || 1e-6);
  for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
    const v0 = at(x, y), v1 = at(x + 1, y), v2 = at(x + 1, y + 1), v3 = at(x, y + 1);
    const idx = (v0 >= level ? 1 : 0) | (v1 >= level ? 2 : 0) | (v2 >= level ? 4 : 0) | (v3 >= level ? 8 : 0);
    if (idx === 0 || idx === 15) continue;
    const X = x * S, Y = y * S;
    const top = [X + ip(v0, v1) * S, Y], right = [X + S, Y + ip(v1, v2) * S], bottom = [X + ip(v3, v2) * S, Y + S], left = [X, Y + ip(v0, v3) * S];
    const seg = (a, b) => { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); };
    switch (idx) {
      case 1: case 14: seg(left, top); break;
      case 2: case 13: seg(top, right); break;
      case 3: case 12: seg(left, right); break;
      case 4: case 11: seg(right, bottom); break;
      case 5: seg(left, top); seg(right, bottom); break;
      case 6: case 9: seg(top, bottom); break;
      case 7: case 8: seg(left, bottom); break;
      case 10: seg(top, right); seg(left, bottom); break;
      default: break;
    }
  }
}

export class TerrainLayer {
  constructor(map) {
    this.map = map; this.grid = map.grid;
    this.theme = THEMES[map.theme];
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.ceil(this.grid.worldW); this.canvas.height = Math.ceil(this.grid.worldH);
    this.ctx = this.canvas.getContext('2d');
    this.mini = document.createElement('canvas');
    this.mini.width = map.w * 2 + 1; this.mini.height = map.h;
    this.dirty = false; this.lastDraw = 0;
    this.prepareFields();
    this.drawAll();
  }
  /** Sample lattice for the field-drawn layers: owning cell, smoothing weights and cached noise per sample. */
  prepareFields() {
    const g = this.grid, S = SAMPLE;
    const nx = Math.ceil(g.worldW / S) + 1, ny = Math.ceil(g.worldH / S) + 1, n = nx * ny;
    this.fnx = nx; this.fny = ny;
    this.fCells = new Int32Array(n * 7).fill(-1); this.fW = new Float32Array(n * 7);
    this.nWood = new Float32Array(n); this.nMtn = new Float32Array(n); this.steep = new Float32Array(n);
    let seed = 7; for (const ch of String(this.map.seed || '')) seed = (seed * 31 + ch.charCodeAt(0)) & 0xffff;
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const s = y * nx + x, wx = x * S, wy = y * S;
      const i = g.idealCellAt(wx, wy);
      if (i >= 0) {
        let tot = 0;
        for (let k = 0; k < 7; k++) {
          const j = k === 0 ? i : g.nb[i * 6 + k - 1];
          if (j < 0) continue;
          const d = Math.hypot(g.cxs[j] - wx, g.cys[j] - wy);
          let w = 1 - d / KERNEL_R; if (w <= 0) continue; w *= w;
          this.fCells[s * 7 + k] = j; this.fW[s * 7 + k] = w; tot += w;
        }
        if (tot > 0) for (let k = 0; k < 7; k++) this.fW[s * 7 + k] /= tot;
      }
      this.nWood[s] = fbm(wx, wy, seed + 1, 1 / 15, 3);
      this.nMtn[s] = fbm(wx, wy, seed + 2, 1 / 22, 3);
      this.steep[s] = 1.05 + 0.55 * fbm(wx, wy, seed + 3, 1 / 95, 2); // 0.5 shallow .. 1.6 steep
    }
  }
  /** Smooth per-cell values onto the sample lattice. */
  smoothField(cellVals) {
    const n = this.fnx * this.fny, F = new Float32Array(n);
    for (let s = 0; s < n; s++) { let v = 0; for (let k = 0; k < 7; k++) { const j = this.fCells[s * 7 + k]; if (j >= 0) v += cellVals[j] * this.fW[s * 7 + k]; } F[s] = v; }
    return F;
  }
  fieldAt(F, x, y) {
    const S = SAMPLE, fx = x / S, fy = y / S, ix = Math.max(0, Math.min(this.fnx - 2, Math.floor(fx))), iy = Math.max(0, Math.min(this.fny - 2, Math.floor(fy)));
    const tx = Math.min(1, Math.max(0, fx - ix)), ty = Math.min(1, Math.max(0, fy - iy));
    const a = F[iy * this.fnx + ix], b = F[iy * this.fnx + ix + 1], c = F[(iy + 1) * this.fnx + ix], d = F[(iy + 1) * this.fnx + ix + 1];
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  }
  strokeLevels(F, levels, style) {
    const c = this.ctx;
    levels.forEach((lv, k) => {
      const st = style(k, lv); if (!st) return;
      c.strokeStyle = st.color; c.lineWidth = st.width; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); contourPath(c, F, this.fnx, this.fny, SAMPLE, lv); c.stroke();
    });
  }
  /** Dotted stipple used to texture road surfaces. */
  roadPattern() {
    if (this._roadPat) return this._roadPat;
    const pc = document.createElement('canvas'); pc.width = 10; pc.height = 10;
    const x = pc.getContext('2d');
    x.fillStyle = INK.roadDot;
    for (const [px, py] of [[1, 2], [6, 1], [3, 7], [8, 6], [5, 4]]) x.fillRect(px, py, 1, 1);
    this._roadPat = this.ctx.createPattern(pc, 'repeat');
    return this._roadPat;
  }
  redrawTile() { this.dirty = true; }
  update(now) {
    if (this.dirty && now - this.lastDraw > 200) { this.drawAll(); this.dirty = false; this.lastDraw = now; return true; }
    return false;
  }
  mask(pred) { const m = new Uint8Array(this.grid.N); const t = this.map.tiles; for (let i = 0; i < m.length; i++) if (pred(t[i])) m[i] = 1; return m; }
  strokeLoops(loops, color, width, smooth = 1) {
    const c = this.ctx;
    c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    for (const loop of loops) {
      const p = smooth ? smoothLoop(loop, smooth) : loop;
      c.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
      c.closePath();
    }
    c.stroke();
  }
  drawAll() {
    const { tiles } = this.map, g = this.grid, c = this.ctx, N = g.N;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = INK.ground; c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // paths: narrow textured tracks along the centres of connected road cells, with a thin edge either side
    {
      const road = this.mask((t) => t === T.ROAD);
      const jx = (i) => g.cxs[i] + (h2(i, 91) - 0.5) * 7, jy = (i) => g.cys[i] + (h2(i, 92) - 0.5) * 7;
      const segs = [];
      for (let i = 0; i < N; i++) {
        if (!road[i]) continue;
        let linked = false;
        for (let k = 0; k < 6; k++) { const n = g.nb[i * 6 + k]; if (n > i && road[n]) { segs.push([jx(i), jy(i), jx(n), jy(n)]); linked = true; } else if (n >= 0 && road[n]) linked = true; }
        if (!linked) segs.push([jx(i) - 3, jy(i), jx(i) + 3, jy(i)]);
      }
      const path = () => { c.beginPath(); for (const [x1, y1, x2, y2] of segs) { c.moveTo(x1, y1); c.lineTo(x2, y2); } };
      c.lineCap = 'round'; c.lineJoin = 'round';
      path(); c.strokeStyle = INK.road; c.lineWidth = 9; c.stroke();
      path(); c.strokeStyle = INK.ground; c.lineWidth = 7; c.stroke();
      path(); c.strokeStyle = this.roadPattern(); c.lineWidth = 7; c.stroke();
    }
    // water
    // water: coastline and a fainter deep-water line from a lightly noised field, so shores curve through cells
    const water = this.mask((t) => t === T.WATER || t === T.SHALLOW);
    if (water.some((v) => v)) {
      const deep = this.mask((t) => t === T.WATER);
      const coast = this.smoothField(water), deepF = this.smoothField(deep);
      for (let s = 0; s < coast.length; s++) { coast[s] += this.nWood[s] * 0.16; deepF[s] += this.nMtn[s] * 0.16; }
      this.strokeLevels(coast, [0.5], () => ({ color: INK.water, width: 1.8 }));
      this.strokeLevels(deepF, [0.78], () => ({ color: 'rgba(59,139,255,0.35)', width: 1 }));
    }
    c.fillStyle = INK.shallow;
    for (let i = 0; i < N; i++) {
      if (tiles[i] !== T.SHALLOW) continue;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(g.cxs[i] + (h2(i, 30 + k) - 0.5) * 22, g.cys[i] + (h2(i, 40 + k) - 0.5) * 22, 1.2, 0, TAU); c.fill(); }
    }
    // vegetation: a smoothed density field pushed around by noise, so wood edges wind through the cells
    const brush = this.mask((t) => t === T.BRUSH);
    if (brush.some((v) => v)) {
      const wood = this.smoothField(brush);
      for (let s = 0; s < wood.length; s++) wood[s] += this.nWood[s] * 0.34;
      this.strokeLevels(wood, [0.5], () => ({ color: INK.brush, width: 1.4 }));
      c.strokeStyle = INK.brush; c.lineWidth = 1;
      for (let i = 0; i < N; i++) {
        if (!brush[i]) continue;
        for (let k = 0; k < 2; k++) {
          if (h2(i, 15 + k * 9) > 0.5) continue;
          const x = g.cxs[i] + (h2(i, 17 + k) - 0.5) * 22, y = g.cys[i] + (h2(i, 18 + k) - 0.5) * 22;
          if (this.fieldAt(wood, x, y) < 0.62) continue;
          c.beginPath(); c.arc(x, y, 2.5 + h2(i, 16 + k) * 2.5, 0, TAU); c.stroke();
        }
      }
    }
    // mountains: contour lines of a height field. Height grows with distance into the massif, scaled by a
    // slowly varying steepness, so lines bunch on steep faces and spread on gentle slopes like a real map.
    const mtn = this.mask((t) => t === T.MOUNTAIN);
    if (mtn.some((v) => v)) {
      const depth = new Float32Array(N);
      let frontier = [];
      for (let i = 0; i < N; i++) { if (!mtn[i]) continue; let edge = false; for (let k = 0; k < 6; k++) { const n = g.nb[i * 6 + k]; if (n >= 0 && !mtn[n]) { edge = true; break; } } /* off-map counts as more mountain: the rim rises out of frame */ if (edge) { depth[i] = 1; frontier.push(i); } }
      if (!frontier.length) for (let i = 0; i < N; i++) if (mtn[i]) { depth[i] = 1; frontier.push(i); }
      while (frontier.length) { const next = []; for (const i of frontier) for (let k = 0; k < 6; k++) { const n = g.nb[i * 6 + k]; if (n >= 0 && mtn[n] && depth[n] === 0) { depth[n] = depth[i] + 1; next.push(n); } } frontier = next; }
      const base = this.smoothField(depth);
      const height = new Float32Array(base.length);
      let maxH = 0;
      for (let s = 0; s < base.length; s++) { const h = base[s] * this.steep[s] + this.nMtn[s] * 0.22 * Math.min(1, base[s]); height[s] = h; if (h > maxH) maxH = h; }
      const outer = new Float32Array(base.length);
      for (let s = 0; s < base.length; s++) outer[s] = base[s] + this.nMtn[s] * 0.12;
      this.strokeLevels(outer, [0.5], () => ({ color: INK.mountain, width: 1.5 }));
      const levels = []; for (let lv = 0.9; lv < maxH; lv += 0.45) levels.push(lv);
      this.strokeLevels(height, levels, (k) => ({ color: k % 4 === 3 ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.48)', width: k % 4 === 3 ? 1.1 : 0.85 }));
    }
    // buildings (walls and ruins)
    this.strokeLoops(traceLoops(g, this.mask((t) => t === T.WALL || t === T.RUIN)), INK.building, 1.8, 0);
    c.strokeStyle = INK.building; c.lineWidth = 1;
    for (let i = 0; i < N; i++) {
      const t = tiles[i], x = g.cxs[i], y = g.cys[i];
      if (t === T.RUIN) c.strokeRect(x - 6, y - 6, 12, 12);
      else if (t === T.WALL) { c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + 10, y); c.stroke(); }
    }
    // per-cell symbols
    for (let i = 0; i < N; i++) {
      const t = tiles[i], cx = g.cxs[i], cy = g.cys[i];
      if (t === T.ROCK) {
        c.strokeStyle = INK.rock; c.lineWidth = 1.4; c.beginPath();
        for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; const rr = (9 + h2(i, 16) * 3) * (0.7 + h2(i, 70 + k) * 0.4); const X = cx + Math.cos(a) * rr, Y = cy + Math.sin(a) * rr; if (k) c.lineTo(X, Y); else c.moveTo(X, Y); }
        c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(cx - 4, cy - 2); c.lineTo(cx + 2, cy + 3); c.stroke();
      } else if (t === T.CRATER) {
        c.strokeStyle = INK.crater; c.lineWidth = 1.2;
        c.beginPath(); c.arc(cx, cy, 10, 0, TAU); c.stroke();
        c.beginPath(); c.arc(cx, cy, 5.5, Math.PI * 0.9, Math.PI * 1.9); c.stroke();
      } else if (t === T.RUBBLE) {
        c.strokeStyle = INK.rubble; c.lineWidth = 1.2; c.beginPath();
        for (let k = 0; k < 4; k++) { const X = cx - 10 + h2(i, 50 + k) * 20, Y = cy - 10 + h2(i, 60 + k) * 20; c.moveTo(X, Y); c.lineTo(X + 4 + h2(i, 70 + k) * 4, Y + (h2(i, 80 + k) - 0.5) * 4); }
        c.stroke();
      } else if (t === T.ORE) {
        c.strokeStyle = INK.ore; c.lineWidth = 1.5;
        c.beginPath(); c.arc(cx, cy, 12, 0, TAU); c.stroke();
        for (let k = 0; k < 3; k++) {
          const a = k * 2.1 + h2(i, 5), r = 5 + h2(i, 6 + k) * 3, X = cx + Math.cos(a) * 4, Y = cy + Math.sin(a) * 4;
          c.beginPath(); c.moveTo(X, Y - r); c.lineTo(X + r * 0.6, Y); c.lineTo(X, Y + r); c.lineTo(X - r * 0.6, Y); c.closePath(); c.stroke();
        }
      }
    }
    // fade the margin into black so the rim dissolves out of frame instead of ending at a straight edge
    {
      const W = this.canvas.width, H = this.canvas.height, F = 2.6 * HEX_R * 2;
      c.globalCompositeOperation = 'destination-out';
      for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, F, 0, 0, 0, F, H], [W, 0, W - F, 0, W - F, 0, F, H], [0, 0, 0, F, 0, 0, W, F], [0, H, 0, H - F, 0, H - F, W, F]]) {
        const grd = c.createLinearGradient(x0, y0, x1, y1);
        grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(0.45, 'rgba(0,0,0,0.75)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = grd; c.fillRect(rx, ry, rw, rh);
      }
      c.globalCompositeOperation = 'source-over';
    }
    // minimap image: 2px per cell, odd rows shifted by 1px (approximates the hex stagger)
    const mc = this.mini.getContext('2d');
    mc.fillStyle = '#000'; mc.fillRect(0, 0, this.mini.width, this.mini.height);
    for (let i = 0; i < N; i++) {
      const col = g.col(i), row = g.row(i);
      mc.fillStyle = MINI[tiles[i]] || '#000';
      mc.fillRect(col * 2 + (row & 1), row, 2, 1);
    }
  }
}
