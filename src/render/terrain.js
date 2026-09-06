// Vector-map terrain: black ground, thin outlines. Regions are traced from the tile grid and smoothed
// so mountains read as contour lines, water as coastlines, paths as edged tracks.
import { T, TILE } from '../map/terrain.js';
import { THEMES } from '../map/themes.js';
import { TAU } from '../engine/math.js';

export const INK = {
  ground: '#000000',
  mountain: 'rgba(255,255,255,0.85)',
  water: '#3b8bff',
  shallow: 'rgba(120,180,255,0.7)',
  road: '#8a8a8a',
  building: '#b5793a',
  brush: '#3fbf5a',
  rock: '#cfcfcf',
  crater: '#8a8a8a',
  rubble: '#7a7a7a',
  ore: '#ffd54a',
};
// Filled colours for the minimap (one pixel per tile).
const MINI = ['#000000', '#3a3a3a', '#1d4a8a', '#2f6fb0', '#5a5a5a', '#1f4a2a', '#6a6a6a', '#5a3d1e', '#5a3d1e', '#2a2a2a', '#3a3a3a', '#c9a532'];

function h2(i, salt) {
  let x = (i * 374761393 + salt * 668265263) | 0; x = (x ^ (x >>> 13)) * 1274126177; x = x ^ (x >>> 16); return (x >>> 0) / 4294967296;
}

/** Trace the boundary of a tile mask into closed loops of corner points (tile units). */
export function traceLoops(mask, w, h) {
  // Directed edges keep the region on the left, so loops chain unambiguously.
  const next = new Map(); // key "x,y" -> [[x2,y2], ...]
  const add = (x1, y1, x2, y2) => { const k = x1 + ',' + y1; if (!next.has(k)) next.set(k, []); next.get(k).push([x2, y2]); };
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!mask[y * w + x]) continue;
    if (!at(x, y - 1)) add(x, y, x + 1, y);           // top edge, left→right
    if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);   // right edge, top→bottom
    if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);   // bottom edge, right→left
    if (!at(x - 1, y)) add(x, y + 1, x, y);           // left edge, bottom→top
  }
  const loops = [];
  for (const [k, outs] of next) {
    while (outs.length) {
      const start = k.split(',').map(Number);
      const loop = [start];
      let cur = outs.pop();
      let guard = 0;
      while (cur && (cur[0] !== start[0] || cur[1] !== start[1]) && guard++ < 100000) {
        loop.push(cur);
        const o = next.get(cur[0] + ',' + cur[1]);
        if (!o || !o.length) break;
        // prefer turning consistently when a vertex has two exits (diagonal touch)
        cur = o.pop();
      }
      if (loop.length >= 4) loops.push(loop);
    }
  }
  return loops;
}
/** Chaikin corner cutting for closed loops. */
export function smoothLoop(pts, iterations = 2) {
  let p = pts;
  for (let it = 0; it < iterations; it++) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = out;
  }
  return p;
}
function erode(mask, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!mask[i]) continue;
    const n = (x > 0 ? mask[i - 1] : 1) && (x < w - 1 ? mask[i + 1] : 1) && (y > 0 ? mask[i - w] : 1) && (y < h - 1 ? mask[i + w] : 1);
    out[i] = n ? 1 : 0;
  }
  return out;
}

export class TerrainLayer {
  constructor(map) {
    this.map = map;
    this.theme = THEMES[map.theme];
    this.canvas = document.createElement('canvas');
    this.canvas.width = map.w * TILE; this.canvas.height = map.h * TILE;
    this.ctx = this.canvas.getContext('2d');
    this.mini = document.createElement('canvas');
    this.mini.width = map.w; this.mini.height = map.h;
    this.dirty = false; this.lastDraw = 0;
    this.drawAll();
  }
  redrawTile() { this.dirty = true; }
  /** Call once per frame; redraws the whole layer at most a few times per second when tiles changed. */
  update(now) {
    if (this.dirty && now - this.lastDraw > 200) { this.drawAll(); this.dirty = false; this.lastDraw = now; return true; }
    return false;
  }
  mask(pred) {
    const { w, h, tiles } = this.map;
    const m = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) if (pred(tiles[i])) m[i] = 1;
    return m;
  }
  strokeLoops(loops, color, width, dash = null, smooth = 2) {
    const c = this.ctx;
    c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round';
    if (dash) c.setLineDash(dash);
    c.beginPath();
    for (const loop of loops) {
      const p = smooth ? smoothLoop(loop, smooth) : loop;
      c.moveTo(p[0][0] * TILE, p[0][1] * TILE);
      for (let i = 1; i < p.length; i++) c.lineTo(p[i][0] * TILE, p[i][1] * TILE);
      c.closePath();
    }
    c.stroke();
    if (dash) c.setLineDash([]);
  }
  drawAll() {
    const { w, h, tiles } = this.map;
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = INK.ground; c.fillRect(0, 0, w * TILE, h * TILE);

    // Paths: a thin grey line either side of the track.
    this.strokeLoops(traceLoops(this.mask((t) => t === T.ROAD), w, h), INK.road, 1.4);
    // Water: coastline in blue; fords / ice stippled.
    const water = this.mask((t) => t === T.WATER || t === T.SHALLOW);
    this.strokeLoops(traceLoops(water, w, h), INK.water, 1.8);
    const deep = this.mask((t) => t === T.WATER);
    this.strokeLoops(traceLoops(erode(deep, w, h), w, h), 'rgba(59,139,255,0.35)', 1);
    c.fillStyle = INK.shallow;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (tiles[i] !== T.SHALLOW) continue;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x * TILE + 5 + h2(i, 30 + k) * 22, y * TILE + 5 + h2(i, 40 + k) * 22, 1.2, 0, TAU); c.fill(); }
    }
    // Vegetation: green outline plus sparse tree rings inside.
    const brush = this.mask((t) => t === T.BRUSH);
    this.strokeLoops(traceLoops(brush, w, h), INK.brush, 1.4);
    c.strokeStyle = INK.brush; c.lineWidth = 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!brush[i] || h2(i, 15) > 0.45) continue;
      const r = 3 + h2(i, 16) * 3;
      c.beginPath(); c.arc(x * TILE + 8 + h2(i, 17) * 16, y * TILE + 8 + h2(i, 18) * 16, r, 0, TAU); c.stroke();
    }
    // Mountains: nested white contours.
    let m = this.mask((t) => t === T.MOUNTAIN);
    for (let level = 0; level < 5 && m.some((v) => v); level++) {
      this.strokeLoops(traceLoops(m, w, h), level === 0 ? INK.mountain : `rgba(255,255,255,${0.7 - level * 0.12})`, level === 0 ? 1.6 : 1.1, null, 2);
      m = erode(m, w, h);
    }
    // Buildings (walls and ruins): brown outlines. Ruins get an inner mark.
    const built = this.mask((t) => t === T.WALL || t === T.RUIN);
    this.strokeLoops(traceLoops(built, w, h), INK.building, 1.8, null, 0);
    c.strokeStyle = INK.building; c.lineWidth = 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, t = tiles[i];
      const px = x * TILE, py = y * TILE;
      if (t === T.RUIN) { c.strokeRect(px + 9, py + 9, 14, 14); }
      else if (t === T.WALL) { c.beginPath(); c.moveTo(px + 4, py + 16); c.lineTo(px + 28, py + 16); c.stroke(); }
    }
    // Per-tile symbols: rocks, craters, rubble, ore.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, t = tiles[i];
      const px = x * TILE, py = y * TILE, cx = px + 16, cy = py + 16;
      if (t === T.ROCK) {
        c.strokeStyle = INK.rock; c.lineWidth = 1.4; c.beginPath();
        for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; const rr = (10 + h2(i, 16) * 3) * (0.7 + h2(i, 70 + k) * 0.4); const X = cx + Math.cos(a) * rr, Y = cy + Math.sin(a) * rr; if (k) c.lineTo(X, Y); else c.moveTo(X, Y); }
        c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(cx - 4, cy - 2); c.lineTo(cx + 2, cy + 3); c.stroke();
      } else if (t === T.CRATER) {
        c.strokeStyle = INK.crater; c.lineWidth = 1.2;
        c.beginPath(); c.arc(cx, cy, 11, 0, TAU); c.stroke();
        c.beginPath(); c.arc(cx, cy, 6, Math.PI * 0.9, Math.PI * 1.9); c.stroke();
      } else if (t === T.RUBBLE) {
        c.strokeStyle = INK.rubble; c.lineWidth = 1.2; c.beginPath();
        for (let k = 0; k < 4; k++) { const X = px + 5 + h2(i, 50 + k) * 20, Y = py + 5 + h2(i, 60 + k) * 20; c.moveTo(X, Y); c.lineTo(X + 4 + h2(i, 70 + k) * 4, Y + (h2(i, 80 + k) - 0.5) * 4); }
        c.stroke();
      } else if (t === T.ORE) {
        c.strokeStyle = INK.ore; c.lineWidth = 1.5;
        c.beginPath(); c.arc(cx, cy, 13, 0, TAU); c.stroke();
        for (let k = 0; k < 3; k++) {
          const a = k * 2.1 + h2(i, 5), r = 5 + h2(i, 6 + k) * 3, X = cx + Math.cos(a) * 4, Y = cy + Math.sin(a) * 4;
          c.beginPath(); c.moveTo(X, Y - r); c.lineTo(X + r * 0.6, Y); c.lineTo(X, Y + r); c.lineTo(X - r * 0.6, Y); c.closePath(); c.stroke();
        }
      }
    }
    // Minimap image: one filled pixel per tile.
    const mc = this.mini.getContext('2d');
    const img = mc.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const col = MINI[tiles[i]] || '#000';
      const n = parseInt(col.slice(1), 16);
      img.data[i * 4] = (n >> 16) & 255; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255; img.data[i * 4 + 3] = 255;
    }
    mc.putImageData(img, 0, 0);
  }
}
