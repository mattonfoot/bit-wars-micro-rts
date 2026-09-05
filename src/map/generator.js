// Procedural battleground generator. Point-symmetric (180° rotation) so both players get identical terrain.
import { RNG, Noise2D } from '../engine/rng.js';
import { T, TILE_HP, isPassable } from './terrain.js';
import { THEMES } from './themes.js';
import { findPath, flood } from '../game/pathfinding.js';

const FRACS = {
  verdant: { mountain: 0.10, lake: 0.06, brush: 0.20, rock: 0.012, crater: 0.003, ruin: 2 },
  ashfall: { mountain: 0.13, lake: 0.04, brush: 0.07, rock: 0.02, crater: 0.03, ruin: 1 },
  frost:   { mountain: 0.09, lake: 0.16, brush: 0.14, rock: 0.014, crater: 0.004, ruin: 2 },
  urban:   { mountain: 0.03, lake: 0.0, brush: 0.05, rock: 0.003, crater: 0.015, ruin: 0 },
  crystal: { mountain: 0.17, lake: 0.0, brush: 0.06, rock: 0.02, crater: 0.008, ruin: 1 },
};

export function generateMap({ size = 64, theme = 'verdant', seed = 'alpha' } = {}) {
  const w = size, h = size, N = w * h;
  const rng = new RNG(`${theme}:${seed}:${size}`);
  const th = THEMES[theme] || THEMES.verdant;
  const F = FRACS[th.key];
  const tiles = new Uint8Array(N).fill(T.GROUND);
  const elevN = new Noise2D(rng), moistN = new Noise2D(rng), detailN = new Noise2D(rng);
  const idx = (x, y) => y * w + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const get = (x, y) => tiles[idx(x, y)];
  const set = (x, y, t) => { if (inb(x, y)) tiles[idx(x, y)] = t; };
  const mirror = (x, y) => [w - 1 - x, h - 1 - y];
  const setSym = (x, y, t) => { set(x, y, t); const [mx, my] = mirror(x, y); set(mx, my, t); };
  const protectedTiles = new Uint8Array(N); // never overwritten by scatter

  const starts = [{ tx: 7, ty: 7 }, { tx: w - 8, ty: h - 8 }];
  const scale = size / 9;

  // --- Elevation / moisture fields
  const elev = new Float32Array(N), moist = new Float32Array(N);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    elev[idx(x, y)] = elevN.fbm(x / scale, y / scale, 4);
    moist[idx(x, y)] = moistN.fbm(x / (scale * 0.7) + 13, y / (scale * 0.7) + 7, 3);
  }
  const rankThreshold = (arr, fracTop) => {
    const s = Array.from(arr).sort((a, b) => a - b);
    return s[Math.max(0, Math.min(s.length - 1, Math.floor(s.length * (1 - fracTop))))];
  };
  const distToStart = (x, y) => Math.min(Math.hypot(x - starts[0].tx, y - starts[0].ty), Math.hypot(x - starts[1].tx, y - starts[1].ty));

  // --- Mountains
  if (F.mountain > 0) {
    const thr = rankThreshold(elev, F.mountain);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (elev[idx(x, y)] >= thr && distToStart(x, y) > 9) set(x, y, T.MOUNTAIN);
    }
  }
  // Crystal canyons: long thin ridges
  if (th.key === 'crystal') {
    for (let k = 0; k < 3; k++) {
      let x = rng.int(8, w - 9), y = rng.int(4, h / 2);
      let ang = rng.range(0, Math.PI);
      for (let s = 0; s < rng.int(10, 22); s++) {
        if (distToStart(x, y) > 9) set(Math.round(x), Math.round(y), T.MOUNTAIN);
        ang += rng.range(-0.35, 0.35);
        x += Math.cos(ang); y += Math.sin(ang);
        if (!inb(Math.round(x), Math.round(y))) break;
      }
    }
  }

  // --- Water
  const waterMode = th.gen.water;
  if (waterMode === 'river') {
    // A river from one edge through the centre; mirrored automatically later.
    const startY = rng.int(Math.floor(h * 0.15), Math.floor(h * 0.85));
    const pts = [];
    let x = 0, y = startY;
    const cx = w / 2, cy = h / 2;
    const steps = Math.ceil(Math.hypot(cx - x, cy - y) * 1.3);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = x + (cx - x) * t, py = y + (cy - y) * t;
      const wob = (detailN.fbm(px / 6, py / 6, 2) - 0.5) * size * 0.22 * Math.sin(t * Math.PI);
      const nx = px + wob * ((cy - y) / Math.hypot(cx - x, cy - y)), ny = py - wob * ((cx - x) / Math.hypot(cx - x, cy - y));
      pts.push([nx, ny]);
    }
    for (const [px, py] of pts) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const tx = Math.round(px + dx), ty = Math.round(py + dy);
        if (inb(tx, ty) && distToStart(tx, ty) > 7) setSym(tx, ty, T.WATER);
      }
    }
    // Fords
    const fordCount = 2;
    for (let f = 0; f < fordCount; f++) {
      const p = pts[Math.floor(pts.length * (0.25 + 0.5 * f / Math.max(1, fordCount - 1)) * 0.9)];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const tx = Math.round(p[0] + dx), ty = Math.round(p[1] + dy);
        if (inb(tx, ty) && get(tx, ty) === T.WATER) { setSym(tx, ty, T.SHALLOW); }
      }
    }
  } else if (waterMode === 'canal') {
    const cy = Math.floor(h * 0.5);
    for (let x = 4; x < w - 4; x++) {
      const yy = cy + Math.round((detailN.fbm(x / 9, 3, 2) - 0.5) * 6);
      for (let d = 0; d < 2; d++) if (distToStart(x, yy + d) > 9) set(x, yy + d, T.WATER);
    }
  }
  if (F.lake > 0) {
    const thr = rankThreshold(elev.map((v) => -v), F.lake); // lowest elevations
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (-elev[idx(x, y)] >= thr && distToStart(x, y) > 9 && get(x, y) === T.GROUND) {
        set(x, y, T.WATER);
      }
    }
    // Frozen: most lake becomes walkable ice, interior stays water.
    if (th.key === 'frost') {
      const iceThr = rankThreshold(elev.map((v) => -v), F.lake * 0.35);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (get(x, y) === T.WATER && -elev[idx(x, y)] < iceThr) set(x, y, T.SHALLOW);
      }
    } else {
      // shallow banks on lakes
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (get(x, y) === T.WATER && rng.chance(0.15)) {
          let edge = false;
          for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) if (inb(x + dx, y + dy) && get(x + dx, y + dy) === T.GROUND) { edge = true; break; }
          if (edge) set(x, y, T.SHALLOW);
        }
      }
    }
  }

  // --- Brush
  if (F.brush > 0) {
    const thr = rankThreshold(moist, F.brush);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (moist[idx(x, y)] >= thr && get(x, y) === T.GROUND && distToStart(x, y) > 5) set(x, y, T.BRUSH);
    }
  }

  // --- Rocks, craters, ruins (top half only; mirrored later)
  for (let y = 0; y < h / 2; y++) for (let x = 0; x < w; x++) {
    if (get(x, y) !== T.GROUND || distToStart(x, y) < 6) continue;
    const r = rng.next();
    if (r < F.rock) set(x, y, T.ROCK);
    else if (r < F.rock + F.crater) set(x, y, T.CRATER);
  }
  // small rock clusters near map centre band for cover
  for (let k = 0; k < Math.floor(size / 10); k++) {
    const x = rng.int(6, w - 7), y = rng.int(6, h / 2);
    for (let i = 0; i < rng.int(2, 4); i++) {
      const rx = x + rng.int(-1, 1), ry = y + rng.int(-1, 1);
      if (inb(rx, ry) && get(rx, ry) === T.GROUND && distToStart(rx, ry) > 6) set(rx, ry, T.ROCK);
    }
  }
  for (let k = 0; k < F.ruin; k++) {
    const x = rng.int(8, w - 10), y = rng.int(8, h / 2 - 2);
    if (distToStart(x, y) < 8) continue;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (get(x + dx, y + dy) === T.GROUND) set(x + dx, y + dy, T.RUIN);
  }
  // --- Urban blocks
  if (th.key === 'urban') {
    const blocks = Math.floor(size / 6);
    for (let k = 0; k < blocks; k++) {
      const bw = rng.int(3, 6), bh = rng.int(3, 5);
      const x0 = rng.int(3, w - bw - 4), y0 = rng.int(3, h / 2 - 2);
      let ok = true;
      for (let y = y0 - 1; y <= y0 + bh && ok; y++) for (let x = x0 - 1; x <= x0 + bw; x++) {
        if (!inb(x, y) || get(x, y) !== T.GROUND && get(x, y) !== T.BRUSH || distToStart(x, y) < 8) { ok = false; break; }
      }
      if (!ok) continue;
      const solid = rng.chance(0.45);
      const gapSide = rng.int(0, 3), gapPos = rng.int(1, Math.max(1, (gapSide % 2 ? bh : bw) - 2));
      for (let y = y0; y < y0 + bh; y++) for (let x = x0; x < x0 + bw; x++) {
        const edge = x === x0 || y === y0 || x === x0 + bw - 1 || y === y0 + bh - 1;
        if (solid) { set(x, y, edge ? T.RUIN : T.RUIN); continue; }
        if (edge) {
          const isGap = (gapSide === 0 && y === y0 && x - x0 === gapPos) || (gapSide === 2 && y === y0 + bh - 1 && x - x0 === gapPos) ||
            (gapSide === 1 && x === x0 + bw - 1 && y - y0 === gapPos) || (gapSide === 3 && x === x0 && y - y0 === gapPos);
          if (!isGap) set(x, y, rng.chance(0.85) ? T.WALL : T.RUBBLE);
        } else set(x, y, rng.chance(0.2) ? T.RUBBLE : T.GROUND);
      }
    }
    // some free-standing wall segments
    for (let k = 0; k < size / 5; k++) {
      const x = rng.int(4, w - 8), y = rng.int(4, h / 2), len = rng.int(2, 4), horiz = rng.chance(0.5);
      for (let i = 0; i < len; i++) {
        const tx = x + (horiz ? i : 0), ty = y + (horiz ? 0 : i);
        if (inb(tx, ty) && get(tx, ty) === T.GROUND && distToStart(tx, ty) > 7) set(tx, ty, T.WALL);
      }
    }
  }

  // --- Mirror: bottom half = rotated top half
  for (let i = 0; i < N / 2; i++) tiles[N - 1 - i] = tiles[i];

  // --- Border ring
  for (let x = 0; x < w; x++) { set(x, 0, T.MOUNTAIN); set(x, h - 1, T.MOUNTAIN); }
  for (let y = 0; y < h; y++) { set(0, y, T.MOUNTAIN); set(w - 1, y, T.MOUNTAIN); }

  // --- Bases: clear area
  const clearCircle = (cx, cy, r, t = T.GROUND) => {
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (!inb(x, y) || x === 0 || y === 0 || x === w - 1 || y === h - 1) continue;
      if (Math.hypot(x - cx, y - cy) <= r) { set(x, y, t); protectedTiles[idx(x, y)] = 1; }
    }
  };
  for (const s of starts) clearCircle(s.tx, s.ty, 5.5);

  // --- Ore deposits
  const ore = [];
  const addOreSym = (x, y) => {
    for (const [px, py] of [[x, y], mirror(x, y)]) {
      clearCircle(px, py, 1.2);
      set(px, py, T.ORE); protectedTiles[idx(px, py)] = 1;
      ore.push({ tx: px, ty: py });
    }
  };
  addOreSym(starts[0].tx + 5, starts[0].ty - 3);
  addOreSym(starts[0].tx - 3, starts[0].ty + 5);
  // contested mid deposits
  const midOre = 2;
  let tries = 0;
  while (ore.length < 4 + midOre * 2 && tries++ < 400) {
    const x = rng.int(6, w - 7), y = rng.int(6, h / 2 + 2);
    const dc = Math.hypot(x - w / 2, y - h / 2);
    if (dc < 6 || dc > size * 0.33) continue;
    if (distToStart(x, y) < 12) continue;
    if (ore.some((o) => Math.hypot(o.tx - x, o.ty - y) < 8)) continue;
    if (get(x, y) === T.WATER || get(x, y) === T.MOUNTAIN) continue;
    addOreSym(x, y);
  }

  // --- Strategic points
  const points = [];
  tries = 0;
  const perSide = size >= 72 ? 4 : 3;
  while (points.length < perSide * 2 && tries++ < 800) {
    const x = rng.int(5, w - 6), y = rng.int(5, h / 2 + 3);
    const d0 = Math.hypot(x - starts[0].tx, y - starts[0].ty);
    if (d0 < 11 || d0 > size * 0.75) continue;
    if (points.some((p) => Math.hypot(p.tx - x, p.ty - y) < Math.max(9, size / 6))) continue;
    if (ore.some((o) => Math.hypot(o.tx - x, o.ty - y) < 4)) continue;
    if (get(x, y) === T.WATER) continue;
    for (const [px, py] of [[x, y], mirror(x, y)]) {
      clearCircle(px, py, 1.6);
      points.push({ tx: px, ty: py });
    }
  }
  // central point (approximately symmetric)
  clearCircle(Math.floor(w / 2), Math.floor(h / 2), 1.6);
  points.push({ tx: Math.floor(w / 2), ty: Math.floor(h / 2) });

  // --- Roads
  const grid = { w, h, tiles };
  const carve = (ax, ay, bx, by, roadTile) => {
    const path = findPath(grid, ax, ay, bx, by, { carve: true, partial: true });
    if (!path) return;
    // Expand diagonal steps so 4-connected movement (and no-corner-cutting) works.
    const cells = [];
    for (let i = 0; i < path.length; i++) {
      cells.push(path[i]);
      if (i > 0) {
        const [ax, ay] = path[i - 1], [bx, by] = path[i];
        if (ax !== bx && ay !== by) cells.push([bx, ay]);
      }
    }
    for (const [x, y] of cells) {
      for (const [px, py] of [[x, y], mirror(x, y)]) {
        if (px === 0 || py === 0 || px === w - 1 || py === h - 1) continue;
        const t = get(px, py);
        if (t === T.WATER) set(px, py, T.SHALLOW);
        else if (t === T.ORE) continue;
        else if (t === T.MOUNTAIN || t === T.ROCK || t === T.WALL || t === T.RUIN || t === T.BRUSH) set(px, py, roadTile);
        else if (t === T.GROUND) set(px, py, roadTile);
      }
    }
  };
  if (th.gen.roads === 'grid') {
    const step = 10;
    for (let x = step; x < w - 2; x += step) for (let y = 1; y < h - 1; y++) if (get(x, y) === T.GROUND || get(x, y) === T.BRUSH) set(x, y, T.ROAD);
    for (let y = step; y < h - 2; y += step) for (let x = 1; x < w - 1; x++) if (get(x, y) === T.GROUND || get(x, y) === T.BRUSH) set(x, y, T.ROAD);
  }
  const roadTile = T.ROAD;
  const ownPoints = points.filter((p) => Math.hypot(p.tx - starts[0].tx, p.ty - starts[0].ty) < Math.hypot(p.tx - starts[1].tx, p.ty - starts[1].ty) + 0.5);
  for (const p of ownPoints) carve(starts[0].tx, starts[0].ty, p.tx, p.ty, roadTile);
  carve(starts[0].tx, starts[0].ty, Math.floor(w / 2), Math.floor(h / 2), roadTile);

  // --- Connectivity guarantee
  const keyLocs = [starts[1], ...points, ...ore];
  for (let pass = 0; pass < 3; pass++) {
    const reach = flood(grid, starts[0].tx, starts[0].ty);
    let fixed = false;
    for (const loc of keyLocs) {
      // ore tiles are impassable themselves; test a neighbour
      let target = [loc.tx, loc.ty];
      if (get(loc.tx, loc.ty) === T.ORE) {
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [loc.tx + dx, loc.ty + dy]).filter(([x, y]) => inb(x, y) && isPassable(get(x, y)));
        if (nb.some(([x, y]) => reach[idx(x, y)])) continue;
        target = nb[0] || [loc.tx + 1, loc.ty];
      } else if (reach[idx(target[0], target[1])]) continue;
      carve(starts[0].tx, starts[0].ty, target[0], target[1], T.GROUND);
      if (get(target[0], target[1]) !== T.ORE && !isPassable(get(target[0], target[1]))) setSym(target[0], target[1], T.GROUND);
      fixed = true;
    }
    if (!fixed) break;
  }

  // --- HP for destructibles
  const hp = new Uint16Array(N);
  for (let i = 0; i < N; i++) hp[i] = TILE_HP[tiles[i]];

  return { w, h, tiles, hp, theme: th.key, seed, starts, ore, points, name: `${th.name} · ${seed}` };
}
