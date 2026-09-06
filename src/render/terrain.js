// Vector-map terrain on the jittered hex grid: black ground, thin outlines traced along cell edges.
// Mountains read as nested contour lines, water as coastlines, paths as edged tracks.
import { T } from '../map/terrain.js';
import { THEMES } from '../map/themes.js';
import { TAU } from '../engine/math.js';

export const INK = {
  ground: '#000000', mountain: 'rgba(255,255,255,0.85)', water: '#3b8bff', shallow: 'rgba(120,180,255,0.7)', road: '#8a8a8a',
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
function erode(grid, mask) {
  const out = new Uint8Array(grid.N);
  for (let i = 0; i < grid.N; i++) {
    if (!mask[i]) continue;
    let ok = true;
    for (let k = 0; k < 6 && ok; k++) { const n = grid.nb[i * 6 + k]; if (n >= 0 && !mask[n]) ok = false; }
    out[i] = ok ? 1 : 0;
  }
  return out;
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
    this.drawAll();
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
    // paths
    this.strokeLoops(traceLoops(g, this.mask((t) => t === T.ROAD)), INK.road, 1.4, 1);
    // water
    const water = this.mask((t) => t === T.WATER || t === T.SHALLOW);
    this.strokeLoops(traceLoops(g, water), INK.water, 1.8, 1);
    this.strokeLoops(traceLoops(g, erode(g, this.mask((t) => t === T.WATER))), 'rgba(59,139,255,0.35)', 1, 1);
    c.fillStyle = INK.shallow;
    for (let i = 0; i < N; i++) {
      if (tiles[i] !== T.SHALLOW) continue;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(g.cxs[i] + (h2(i, 30 + k) - 0.5) * 22, g.cys[i] + (h2(i, 40 + k) - 0.5) * 22, 1.2, 0, TAU); c.fill(); }
    }
    // vegetation
    const brush = this.mask((t) => t === T.BRUSH);
    this.strokeLoops(traceLoops(g, brush), INK.brush, 1.4, 1);
    c.strokeStyle = INK.brush; c.lineWidth = 1;
    for (let i = 0; i < N; i++) {
      if (!brush[i] || h2(i, 15) > 0.45) continue;
      c.beginPath(); c.arc(g.cxs[i] + (h2(i, 17) - 0.5) * 14, g.cys[i] + (h2(i, 18) - 0.5) * 14, 3 + h2(i, 16) * 3, 0, TAU); c.stroke();
    }
    // mountains: nested contours
    let m = this.mask((t) => t === T.MOUNTAIN);
    for (let level = 0; level < 5 && m.some((v) => v); level++) {
      this.strokeLoops(traceLoops(g, m), level === 0 ? INK.mountain : `rgba(255,255,255,${0.7 - level * 0.12})`, level === 0 ? 1.6 : 1.1, 1);
      m = erode(g, m);
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
