import { generateMap } from '../src/map/generator.js';
import { THEME_KEYS } from '../src/map/themes.js';
import { flood } from '../src/game/pathfinding.js';
import { isPassable } from '../src/map/terrain.js';

let fails = 0;
for (const theme of THEME_KEYS) {
  for (const size of [48, 64, 80]) {
    for (let s = 0; s < 6; s++) {
      const m = generateMap({ size, theme, seed: 'seed' + s });
      const reach = flood(m, m.starts[0].i);
      const ok1 = !!reach[m.starts[1].i];
      const okPts = m.points.every((p) => reach[p.i]);
      const okOre = m.ore.every((o) => { for (let k = 0; k < 6; k++) { const n = m.grid.neighbor(o.i, k); if (n >= 0 && reach[n]) return true; } return false; });
      // symmetry of terrain
      let sym = 0; for (let i = 0; i < m.grid.N / 2; i++) if (m.tiles[i] !== m.tiles[m.grid.mirror(i)]) sym++;
      const counts = {}; for (const t of m.tiles) counts[t] = (counts[t] || 0) + 1;
      const passable = m.tiles.filter((t) => isPassable(t)).length / m.tiles.length;
      if (!ok1 || !okPts || !okOre || passable < 0.5 || sym > m.grid.N * 0.02) { fails++; console.log('FAIL', theme, size, s, { ok1, okPts, okOre, passable, sym }); }
      if (s === 0 && size === 64) console.log(theme, size, 'points', m.points.length, 'ore', m.ore.length, 'passable', passable.toFixed(2), 'asym', sym, 'tiles', JSON.stringify(counts));
    }
  }
}
console.log(fails ? `FAILED ${fails}` : 'All map generation checks passed');
process.exit(fails ? 1 : 0);
