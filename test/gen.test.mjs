import { generateMap } from '../src/map/generator.js';
import { THEME_KEYS } from '../src/map/themes.js';
import { flood } from '../src/game/pathfinding.js';
import { T, isPassable } from '../src/map/terrain.js';

let fails = 0;
for (const theme of THEME_KEYS) {
  for (const size of [48, 64, 80]) {
    for (let s = 0; s < 6; s++) {
      const m = generateMap({ size, theme, seed: 'seed' + s });
      const reach = flood(m, m.starts[0].tx, m.starts[0].ty);
      const ok1 = reach[m.starts[1].ty * m.w + m.starts[1].tx];
      const okPts = m.points.every((p) => reach[p.ty * m.w + p.tx]);
      const okOre = m.ore.every((o) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const x = o.tx + dx, y = o.ty + dy; return x >= 0 && y >= 0 && x < m.w && y < m.h && reach[y * m.w + x];
      }));
      const counts = {};
      for (const t of m.tiles) counts[t] = (counts[t] || 0) + 1;
      const passable = m.tiles.filter((t) => isPassable(t)).length / m.tiles.length;
      if (!ok1 || !okPts || !okOre || passable < 0.5) { fails++; console.log('FAIL', theme, size, s, { ok1, okPts, okOre, passable }); }
      if (s === 0 && size === 64) console.log(theme, size, 'points', m.points.length, 'ore', m.ore.length, 'passable', passable.toFixed(2), 'tiles', JSON.stringify(counts));
    }
  }
}
console.log(fails ? `FAILED ${fails}` : 'All map generation checks passed');
process.exit(fails ? 1 : 0);
