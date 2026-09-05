// Grid A* with a binary heap. Fast enough to run synchronously on every command (64x64 = 4096 nodes).
import { TILE_SPEED, isPassable } from '../map/terrain.js';

class Heap {
  constructor() { this.a = []; }
  push(node) {
    const a = this.a; a.push(node);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1; let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

let _scratch = null;
function scratch(N) {
  if (!_scratch || _scratch.N !== N) _scratch = { N, g: new Float32Array(N), parent: new Int32Array(N), closed: new Uint8Array(N) };
  return _scratch;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * A* over a tile grid.
 * @param {object} grid {w,h,tiles:Uint8Array}
 * @param {number} sx,sy start tile; tx,ty target tile
 * @param {object} opts { blocked(x,y)=>bool extra blockers, cost(x,y)=>number|Infinity, carve: allow impassable at high cost, flying }
 * @returns {Array<[number,number]>|null}
 */
export function findPath(grid, sx, sy, tx, ty, opts = {}) {
  const { w, h, tiles } = grid;
  const extra = opts.blocked;
  const flying = !!opts.flying;
  const carve = !!opts.carve;
  const maxNodes = opts.maxNodes || w * h;
  const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const passCost = (x, y) => {
    const t = tiles[y * w + x];
    if (flying) return 1;
    if (extra && extra(x, y)) return carve ? 8 : Infinity;
    const s = TILE_SPEED[t];
    if (s <= 0) return carve ? (t === 4 ? 40 : 12) : Infinity;
    return 1 / s;
  };
  if (!inb(sx, sy) || !inb(tx, ty)) return null;
  if (!carve && passCost(tx, ty) === Infinity) {
    // Find nearest passable tile to target.
    const n = nearestPassable(grid, tx, ty, opts);
    if (!n) return null;
    tx = n[0]; ty = n[1];
  }
  const N = w * h;
  const sc = scratch(N);
  const g = sc.g, parent = sc.parent, closed = sc.closed;
  g.fill(Infinity); parent.fill(-1); closed.fill(0);
  const start = sy * w + sx, goal = ty * w + tx;
  g[start] = 0;
  const heap = new Heap();
  const hfn = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  heap.push({ i: start, f: hfn(sx, sy) });
  let expanded = 0;
  let best = start, bestH = hfn(sx, sy);
  while (heap.size) {
    const { i } = heap.pop();
    if (closed[i]) continue;
    closed[i] = 1;
    if (i === goal) { best = i; break; }
    if (++expanded > maxNodes) break;
    const x = i % w, y = (i / w) | 0;
    const hh = hfn(x, y);
    if (hh < bestH) { bestH = hh; best = i; }
    for (let d = 0; d < 8; d++) {
      const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
      if (!inb(nx, ny)) continue;
      const ni = ny * w + nx;
      if (closed[ni]) continue;
      const c = passCost(nx, ny);
      if (c === Infinity) continue;
      if (d >= 4) {
        // no corner cutting through blocked tiles
        if (passCost(x + DIRS[d][0], y) === Infinity || passCost(x, y + DIRS[d][1]) === Infinity) continue;
      }
      const step = (d >= 4 ? 1.4142 : 1) * c;
      const ng = g[i] + step;
      if (ng < g[ni]) {
        g[ni] = ng; parent[ni] = i;
        heap.push({ i: ni, f: ng + hfn(nx, ny) });
      }
    }
  }
  if (best !== goal && !opts.partial) {
    if (bestH > 2 && !carve) return null;
  }
  const path = [];
  let cur = best;
  while (cur !== -1) { path.push([cur % w, (cur / w) | 0]); cur = parent[cur]; }
  path.reverse();
  return path;
}

export function nearestPassable(grid, tx, ty, opts = {}) {
  const { w, h, tiles } = grid;
  const extra = opts.blocked;
  for (let r = 0; r < 12; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = tx + dx, y = ty + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if ((opts.flying || isPassable(tiles[y * w + x])) && !(extra && extra(x, y))) return [x, y];
      }
    }
  }
  return null;
}

/** BFS reachability set from (sx,sy). Returns Uint8Array mask. */
export function flood(grid, sx, sy, blocked) {
  const { w, h, tiles } = grid;
  const seen = new Uint8Array(w * h);
  const q = [sy * w + sx];
  seen[q[0]] = 1;
  while (q.length) {
    const i = q.pop();
    const x = i % w, y = (i / w) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (seen[ni]) continue;
      if (!isPassable(tiles[ni]) || (blocked && blocked(nx, ny))) continue;
      seen[ni] = 1; q.push(ni);
    }
  }
  return seen;
}

/** True if the straight segment between two tile centres only crosses passable tiles. */
export function lineWalkable(grid, x0, y0, x1, y1, blocked, flying) {
  if (flying) return true;
  const { w, tiles } = grid;
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + dx * t), y = Math.round(y0 + dy * t);
    if (x < 0 || y < 0 || x >= w || y >= grid.h) return false;
    if (!isPassable(tiles[y * w + x]) || (blocked && blocked(x, y))) return false;
  }
  return true;
}

/** String-pull a tile path into fewer waypoints. */
export function smoothPath(grid, path, blocked, flying) {
  if (!path || path.length < 3) return path;
  const out = [path[0]];
  let anchor = 0;
  for (let i = 2; i < path.length; i++) {
    if (!lineWalkable(grid, path[anchor][0], path[anchor][1], path[i][0], path[i][1], blocked, flying)) {
      out.push(path[i - 1]);
      anchor = i - 1;
    }
  }
  out.push(path[path.length - 1]);
  return out;
}
