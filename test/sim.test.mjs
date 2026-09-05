// Headless AI vs AI battles across all factions & themes. Verifies stability and that games end.
import { generateMap } from '../src/map/generator.js';
import { World, TICK } from '../src/game/world.js';
import { AI } from '../src/game/ai.js';
import { FACTION_KEYS } from '../src/game/data.js';
import { THEME_KEYS } from '../src/map/themes.js';

const results = [];
const matchups = [];
for (const a of FACTION_KEYS) for (const b of FACTION_KEYS) matchups.push([a, b]);
let i = 0;
const maxMinutes = 25;
for (const [fa, fb] of matchups) {
  const theme = THEME_KEYS[i % THEME_KEYS.length];
  const map = generateMap({ size: 64, theme, seed: 'sim' + i });
  const world = new World(map, [{ faction: fa, ai: 'normal' }, { faction: fb, ai: 'normal' }]);
  const ais = [new AI(world, 0, 'normal'), new AI(world, 1, 'normal')];
  const t0 = Date.now();
  let ticks = 0;
  while (!world.gameOver && world.time < maxMinutes * 60) {
    world.tick(TICK);
    for (const ai of ais) ai.update(TICK);
    world.events.length = 0; world.dirtyTiles.length = 0;
    ticks++;
  }
  const ms = Date.now() - t0;
  const p0 = world.players[0], p1 = world.players[1];
  results.push({ theme, fa, fb, winner: world.winner, time: (world.time / 60).toFixed(1) + 'm', simMs: ms, squads: world.squads.length, kills: [p0.stats.kills, p1.stats.kills], built: [p0.stats.built, p1.stats.built], pts: world.points.map((p) => p.owner).join('') });
  console.log(JSON.stringify(results[results.length - 1]));
  i++;
}
const ended = results.filter((r) => r.winner !== -1).length;
console.log(`Games ended: ${ended}/${results.length}`);
const perFaction = {};
for (const r of results) { if (r.winner >= 0) { const f = r.winner === 0 ? r.fa : r.fb; perFaction[f] = (perFaction[f] || 0) + 1; } }
console.log('wins by faction', perFaction);
