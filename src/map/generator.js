// Procedural battleground generator on the jittered hex grid. Point-symmetric (180° rotation) so both
// players get identical terrain. Positions are cell indices; every location also carries world x,y.
import { RNG, Noise2D } from '../engine/rng.js';
import { T, TILE_HP, isPassable } from './terrain.js';
import { THEMES } from './themes.js';
import { HexGrid, HEX_W } from './hexgrid.js';
import { findPath, flood } from '../game/pathfinding.js';

const FRACS = {
  verdant: { mountain: 0.10, lake: 0.06, brush: 0.20, rock: 0.012, crater: 0.003, ruin: 2 },
  ashfall: { mountain: 0.13, lake: 0.04, brush: 0.07, rock: 0.02, crater: 0.03, ruin: 1 },
  frost:   { mountain: 0.09, lake: 0.16, brush: 0.14, rock: 0.014, crater: 0.004, ruin: 2 },
  urban:   { mountain: 0.03, lake: 0.0, brush: 0.05, rock: 0.003, crater: 0.015, ruin: 0 },
  crystal: { mountain: 0.17, lake: 0.0, brush: 0.06, rock: 0.02, crater: 0.008, ruin: 1 },
};

export function generateMap({ size = 64, theme = 'verdant', seed = 'alpha', threeWay = false } = {}) {
  const w = size, h = size;
  const grid = new HexGrid(w, h, `${theme}:${seed}:${size}`);
  const N = grid.N;
  const rng = new RNG(`${theme}:${seed}:${size}`);
  const th = THEMES[theme] || THEMES.verdant;
  const F = FRACS[th.key];
  const tiles = new Uint8Array(N).fill(T.GROUND);
  const elevN = new Noise2D(rng), moistN = new Noise2D(rng), detailN = new Noise2D(rng);
  const set = (i, t) => { if (i >= 0 && i < N) tiles[i] = t; };
  const setSym = (i, t) => { set(i, t); set(grid.mirror(i), t); };
  const protectedCells = new Uint8Array(N);
  const startCells = [grid.index(7, 7), grid.index(w - 8, h - 8)];
  if (threeWay) startCells.push(grid.index(w - 8, 7), grid.index(7, h - 8)); // a mirrored pair of extra bases
  const starts = startCells.map((i) => { const [x, y] = grid.center(i); return { i, x, y }; });
  const scale = (size * HEX_W) / 9; // noise feature size in world units
  const cx = grid.cxs, cy = grid.cys;
  const distToStart = (i) => Math.min(...starts.map((s) => Math.hypot(cx[i] - s.x, cy[i] - s.y))) / HEX_W;
  const isBorder = (i) => { const c = grid.col(i), r = grid.row(i); return c === 0 || r === 0 || c === w - 1 || r === h - 1; };

  // --- fields
  const elev = new Float32Array(N), moist = new Float32Array(N);
  for (let i = 0; i < N; i++) { elev[i] = elevN.fbm(cx[i] / scale, cy[i] / scale, 4); moist[i] = moistN.fbm(cx[i] / (scale * 0.7) + 13, cy[i] / (scale * 0.7) + 7, 3); }
  const rankThreshold = (arr, fracTop) => { const s = Array.from(arr).sort((a, b) => a - b); return s[Math.max(0, Math.min(s.length - 1, Math.floor(s.length * (1 - fracTop))))]; };

  // --- mountains
  if (F.mountain > 0) { const thr = rankThreshold(elev, F.mountain); for (let i = 0; i < N; i++) if (elev[i] >= thr && distToStart(i) > 9) set(i, T.MOUNTAIN); }
  if (th.key === 'crystal') {
    for (let k = 0; k < 3; k++) {
      let x = rng.range(8, w - 9) * HEX_W, y = rng.range(4, h / 2) * grid.V, ang = rng.range(0, Math.PI);
      for (let s = 0; s < rng.int(10, 22); s++) {
        const i = grid.cellAt(x, y); if (i < 0) break;
        if (distToStart(i) > 9) set(i, T.MOUNTAIN);
        ang += rng.range(-0.35, 0.35); x += Math.cos(ang) * HEX_W; y += Math.sin(ang) * HEX_W;
      }
    }
  }

  // --- water
  const waterMode = th.gen.water;
  if (waterMode === 'river') {
    const startY = rng.range(0.15, 0.85) * grid.worldH;
    let x = 0, y = startY;
    const mx = grid.cx, my = grid.cy;
    const steps = Math.ceil(Math.hypot(mx - x, my - y) / (HEX_W * 0.5));
    const pts = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, px = x + (mx - x) * t, py = y + (my - y) * t;
      const L = Math.hypot(mx - x, my - y);
      const wob = (detailN.fbm(px / (6 * HEX_W), py / (6 * HEX_W), 2) - 0.5) * size * HEX_W * 0.22 * Math.sin(t * Math.PI);
      pts.push([px + wob * ((my - y) / L), py - wob * ((mx - x) / L)]);
    }
    for (const [px, py] of pts) for (const i of grid.cellsWithin(px, py, grid.R * 1.2)) if (distToStart(i) > 7) setSym(i, T.WATER);
    for (let f = 0; f < 2; f++) {
      const p = pts[Math.floor(pts.length * (0.25 + 0.5 * f) * 0.9)];
      for (const i of grid.cellsWithin(p[0], p[1], grid.R * 2.6)) if (tiles[i] === T.WATER) setSym(i, T.SHALLOW);
    }
  } else if (waterMode === 'canal') {
    const mid = Math.floor(h / 2);
    for (let c = 4; c < w - 4; c++) {
      const r = mid + Math.round((detailN.fbm(c / 9, 3, 2) - 0.5) * 6);
      for (let d = 0; d < 2; d++) { const i = grid.index(c, r + d); if (grid.inb(c, r + d) && distToStart(i) > 9) set(i, T.WATER); }
    }
  }
  if (F.lake > 0) {
    const thr = rankThreshold(elev.map((v) => -v), F.lake);
    for (let i = 0; i < N; i++) if (-elev[i] >= thr && distToStart(i) > 9 && tiles[i] === T.GROUND) set(i, T.WATER);
    if (th.key === 'frost') {
      const iceThr = rankThreshold(elev.map((v) => -v), F.lake * 0.35);
      for (let i = 0; i < N; i++) if (tiles[i] === T.WATER && -elev[i] < iceThr) set(i, T.SHALLOW);
    } else {
      for (let i = 0; i < N; i++) {
        if (tiles[i] !== T.WATER || !rng.chance(0.15)) continue;
        for (let k = 0; k < 6; k++) { const n = grid.neighbor(i, k); if (n >= 0 && tiles[n] === T.GROUND) { set(i, T.SHALLOW); break; } }
      }
    }
  }

  // --- brush
  if (F.brush > 0) { const thr = rankThreshold(moist, F.brush); for (let i = 0; i < N; i++) if (moist[i] >= thr && tiles[i] === T.GROUND && distToStart(i) > 5) set(i, T.BRUSH); }

  // --- rocks, craters, ruins (top half only; mirrored later)
  for (let i = 0; i < N / 2; i++) {
    if (tiles[i] !== T.GROUND || distToStart(i) < 6) continue;
    const r = rng.next();
    if (r < F.rock) set(i, T.ROCK); else if (r < F.rock + F.crater) set(i, T.CRATER);
  }
  for (let k = 0; k < Math.floor(size / 10); k++) {
    const i = grid.index(rng.int(6, w - 7), rng.int(6, h / 2));
    const cl = grid.cluster(i, 1);
    for (let j = 0; j < rng.int(2, 4); j++) { const c = rng.pick(cl); if (tiles[c] === T.GROUND && distToStart(c) > 6) set(c, T.ROCK); }
  }
  for (let k = 0; k < F.ruin; k++) {
    const i = grid.index(rng.int(8, w - 10), rng.int(8, h / 2 - 2));
    if (distToStart(i) < 8) continue;
    for (const c of grid.cluster(i, 1)) if (tiles[c] === T.GROUND) set(c, T.RUIN);
  }
  // --- urban blocks: hex rings of wall with a gap, courtyards or solid ruins inside
  if (th.key === 'urban') {
    const blocks = Math.floor(size / 5);
    for (let k = 0; k < blocks; k++) {
      const rad = rng.chance(0.4) ? 2 : 1;
      const i = grid.index(rng.int(4, w - 5), rng.int(4, h / 2 - 2));
      const cells = grid.cluster(i, rad);
      if (cells.some((c) => (tiles[c] !== T.GROUND && tiles[c] !== T.BRUSH) || distToStart(c) < 8)) continue;
      const solid = rng.chance(0.4);
      const ring = cells.filter((c) => grid.hexDist(c, i) === rad);
      const gap = rng.pick(ring);
      for (const c of cells) {
        if (solid) { set(c, T.RUIN); continue; }
        if (grid.hexDist(c, i) === rad) { if (c !== gap) set(c, rng.chance(0.85) ? T.WALL : T.RUBBLE); }
        else set(c, rng.chance(0.2) ? T.RUBBLE : T.GROUND);
      }
    }
    for (let k = 0; k < size / 5; k++) {
      let c = grid.index(rng.int(4, w - 8), rng.int(4, h / 2));
      const dir = rng.int(0, 5), len = rng.int(2, 4);
      for (let s = 0; s < len && c >= 0; s++) { if (tiles[c] === T.GROUND && distToStart(c) > 7) set(c, T.WALL); c = grid.neighbor(c, dir); }
    }
  }

  // --- mirror bottom half from top half
  for (let i = 0; i < N / 2; i++) tiles[N - 1 - i] = tiles[i];
  // --- border ring
  for (let i = 0; i < N; i++) if (isBorder(i)) tiles[i] = T.MOUNTAIN;

  // --- bases
  const clearCluster = (i, rad) => { for (const c of grid.cluster(i, rad)) { if (isBorder(c)) continue; set(c, T.GROUND); protectedCells[c] = 1; } };
  for (const s of starts) clearCluster(s.i, 5);

  // --- ore
  const ore = [];
  const addOreSym = (i) => {
    for (const c of [i, grid.mirror(i)]) { clearCluster(c, 1); set(c, T.ORE); protectedCells[c] = 1; const [x, y] = grid.center(c); ore.push({ i: c, x, y }); }
  };
  const sc = grid.col(starts[0].i), sr = grid.row(starts[0].i);
  addOreSym(grid.index(sc + 5, sr - 3));
  addOreSym(grid.index(sc - 3, sr + 5));
  let tries = 0;
  while (ore.length < 8 && tries++ < 400) {
    const i = grid.index(rng.int(6, w - 7), rng.int(6, h / 2 + 2));
    const dc = Math.hypot(cx[i] - grid.cx, cy[i] - grid.cy) / HEX_W;
    if (dc < 6 || dc > size * 0.33 || distToStart(i) < 12) continue;
    if (ore.some((o) => Math.hypot(o.x - cx[i], o.y - cy[i]) / HEX_W < 8)) continue;
    if (tiles[i] === T.WATER || tiles[i] === T.MOUNTAIN) continue;
    addOreSym(i);
  }

  // --- strategic points
  const points = [];
  tries = 0;
  const perSide = size >= 72 ? 4 : 3;
  while (points.length < perSide * 2 && tries++ < 800) {
    const i = grid.index(rng.int(5, w - 6), rng.int(5, h / 2 + 3));
    const d0 = Math.hypot(cx[i] - starts[0].x, cy[i] - starts[0].y) / HEX_W;
    if (d0 < 11 || d0 > size * 0.75) continue;
    if (points.some((p) => Math.hypot(p.x - cx[i], p.y - cy[i]) / HEX_W < Math.max(9, size / 6))) continue;
    if (ore.some((o) => Math.hypot(o.x - cx[i], o.y - cy[i]) / HEX_W < 4)) continue;
    if (tiles[i] === T.WATER) continue;
    for (const c of [i, grid.mirror(i)]) { clearCluster(c, 1); const [x, y] = grid.center(c); points.push({ i: c, x, y }); }
  }
  const centreCell = grid.cellAt(grid.cx, grid.cy);
  clearCluster(centreCell, 1);
  { const [x, y] = grid.center(centreCell); points.push({ i: centreCell, x, y }); }

  // --- roads
  const map = { w, h, grid, tiles };
  const carve = (a, b, roadTile) => {
    const path = findPath(map, a, b, { carve: true, partial: true });
    if (!path) return;
    for (const i of path) for (const c of [i, grid.mirror(i)]) {
      if (isBorder(c)) continue;
      const t = tiles[c];
      if (t === T.WATER) set(c, T.SHALLOW);
      else if (t === T.ORE) continue;
      else set(c, roadTile);
    }
  };
  if (th.gen.roads === 'grid') {
    for (let i = 0; i < N; i++) {
      if (isBorder(i)) continue;
      const r = grid.row(i), q = grid.cube(i)[0];
      if ((r % 10 === 0 || ((q % 10) + 10) % 10 === 0) && (tiles[i] === T.GROUND || tiles[i] === T.BRUSH)) { const m = grid.mirror(i); if (!isBorder(m) && (tiles[m] === T.GROUND || tiles[m] === T.BRUSH || tiles[m] === T.ROAD)) setSym(i, T.ROAD); }
    }
  }
  const ownPoints = points.filter((p) => Math.hypot(p.x - starts[0].x, p.y - starts[0].y) < Math.hypot(p.x - starts[1].x, p.y - starts[1].y) + 0.5);
  for (const p of ownPoints) carve(starts[0].i, p.i, T.ROAD);
  carve(starts[0].i, centreCell, T.ROAD);

  // --- connectivity guarantee
  const keyLocs = [...starts.slice(1).map((s) => s.i), ...points.map((p) => p.i), ...ore.map((o) => o.i)];
  for (let pass = 0; pass < 3; pass++) {
    const reach = flood(map, starts[0].i);
    let fixed = false;
    for (const loc of keyLocs) {
      let target = loc;
      if (tiles[loc] === T.ORE) {
        const nbs = []; for (let k = 0; k < 6; k++) { const n = grid.neighbor(loc, k); if (n >= 0 && isPassable(tiles[n])) nbs.push(n); }
        if (nbs.some((n) => reach[n])) continue;
        target = nbs[0] ?? grid.neighbor(loc, 0);
      } else if (reach[target]) continue;
      if (target < 0) continue;
      carve(starts[0].i, target, T.GROUND);
      if (tiles[target] !== T.ORE && !isPassable(tiles[target])) setSym(target, T.GROUND);
      fixed = true;
    }
    if (!fixed) break;
  }

  const hp = new Uint16Array(N);
  for (let i = 0; i < N; i++) hp[i] = TILE_HP[tiles[i]];
  return { w, h, grid, tiles, hp, theme: th.key, seed, threeWay, starts, ore, points, name: `${th.name} · ${seed}` };
}
