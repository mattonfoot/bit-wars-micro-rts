// Hex-grid A* with a binary heap, plus flood fill, nearest-passable search and string-pulling.
// All functions take the map object ({ grid, tiles }) and cell indices.
import { TILE_SPEED, isPassable } from '../map/terrain.js';

class Heap {
  constructor() { this.a = []; }
  push(node) {
    const a = this.a; a.push(node);
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < a.length && a[l].f < a[m].f) m = l; if (r < a.length && a[r].f < a[m].f) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; }
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

/**
 * A* from cell si to cell ti.
 * opts: { blocked(i)=>bool, carve (impassable at high cost), flying, maxNodes, partial }
 * @returns {number[]|null} cell indices
 */
export function findPath(map, si, ti, opts = {}) {
  const { grid, tiles } = map;
  const N = grid.N;
  const extra = opts.blocked, flying = !!opts.flying, carve = !!opts.carve;
  const maxNodes = opts.maxNodes || N;
  const cost = (i) => {
    const t = tiles[i];
    if (flying) return 1;
    if (extra && extra(i)) return carve ? 8 : Infinity;
    const s = TILE_SPEED[t];
    if (s <= 0) return carve ? (t === 4 ? 40 : 12) : Infinity;
    return 1 / s;
  };
  if (si < 0 || ti < 0 || si >= N || ti >= N) return null;
  if (!carve && cost(ti) === Infinity) { const n = nearestPassable(map, ti, opts); if (n < 0) return null; ti = n; }
  const sc = scratch(N);
  const g = sc.g, parent = sc.parent, closed = sc.closed;
  g.fill(Infinity); parent.fill(-1); closed.fill(0);
  g[si] = 0;
  const heap = new Heap();
  const tc = grid.cube(ti);
  const hfn = (i) => { const c = grid.cube(i); return Math.max(Math.abs(c[0] - tc[0]), Math.abs(c[1] - tc[1]), Math.abs(c[2] - tc[2])); };
  heap.push({ i: si, f: hfn(si) });
  let expanded = 0, best = si, bestH = hfn(si);
  const nb = grid.nb;
  while (heap.size) {
    const { i } = heap.pop();
    if (closed[i]) continue;
    closed[i] = 1;
    if (i === ti) { best = i; break; }
    if (++expanded > maxNodes) break;
    const hh = hfn(i);
    if (hh < bestH) { bestH = hh; best = i; }
    for (let k = 0; k < 6; k++) {
      const n = nb[i * 6 + k];
      if (n < 0 || closed[n]) continue;
      const c = cost(n);
      if (c === Infinity) continue;
      const ng = g[i] + c;
      if (ng < g[n]) { g[n] = ng; parent[n] = i; heap.push({ i: n, f: ng + hfn(n) }); }
    }
  }
  if (best !== ti && !opts.partial && bestH > 2 && !carve) return null;
  const path = [];
  let cur = best;
  while (cur !== -1) { path.push(cur); cur = parent[cur]; }
  path.reverse();
  return path;
}

/** Nearest passable, unblocked cell to i by hex rings (BFS). -1 if none within 14 rings. */
export function nearestPassable(map, i, opts = {}) {
  const { grid, tiles } = map;
  if (i < 0) return -1;
  const ok = (c) => (opts.flying || isPassable(tiles[c])) && !(opts.blocked && opts.blocked(c));
  if (ok(i)) return i;
  const seen = new Uint8Array(grid.N); seen[i] = 1;
  let frontier = [i];
  for (let d = 0; d < 14 && frontier.length; d++) {
    const next = [];
    for (const c of frontier) for (let k = 0; k < 6; k++) { const n = grid.nb[c * 6 + k]; if (n < 0 || seen[n]) continue; seen[n] = 1; if (ok(n)) return n; next.push(n); }
    frontier = next;
  }
  return -1;
}

/** Reachability mask from cell si. */
export function flood(map, si, blocked) {
  const { grid, tiles } = map;
  const seen = new Uint8Array(grid.N);
  if (si < 0) return seen;
  const q = [si]; seen[si] = 1;
  while (q.length) {
    const i = q.pop();
    for (let k = 0; k < 6; k++) {
      const n = grid.nb[i * 6 + k];
      if (n < 0 || seen[n]) continue;
      if (!isPassable(tiles[n]) || (blocked && blocked(n))) continue;
      seen[n] = 1; q.push(n);
    }
  }
  return seen;
}

/** True if the straight segment between two world points crosses only passable, unblocked cells. */
export function lineWalkable(map, x0, y0, x1, y1, blocked, flying) {
  if (flying) return true;
  const { grid, tiles } = map;
  const d = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(d / (grid.R * 0.45)));
  let last = -2;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const i = grid.cellAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    if (i === last) continue;
    last = i;
    if (i < 0 || !isPassable(tiles[i]) || (blocked && blocked(i))) return false;
  }
  return true;
}

/** String-pull a cell path into world waypoints ([x,y]). */
export function smoothPath(map, path, blocked, flying) {
  const { grid } = map;
  const pts = path.map((i) => grid.center(i));
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  let anchor = 0;
  for (let i = 2; i < pts.length; i++) {
    if (!lineWalkable(map, pts[anchor][0], pts[anchor][1], pts[i][0], pts[i][1], blocked, flying)) { out.push(pts[i - 1]); anchor = i - 1; }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
