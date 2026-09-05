// Dev tool: run one headless game and print a per-minute summary.
// usage: node tools/sim-one.mjs [factionA] [factionB] [theme] [seed] [minutes]
import { generateMap } from '../src/map/generator.js';
import { World, TICK } from '../src/game/world.js';
import { AI } from '../src/game/ai.js';
const [fa = 'blue', fb = 'red', theme = 'verdant', seed = 'sim0', minutes = '20'] = process.argv.slice(2);
const map = generateMap({ size: 64, theme, seed });
const world = new World(map, [{ faction: fa, ai: 'normal' }, { faction: fb, ai: 'normal' }]);
const ais = [new AI(world, 0, 'normal'), new AI(world, 1, 'normal')];
let t0 = Date.now();
const evCount = {};
for (let m = 0; m < +minutes; m++) {
  for (let i = 0; i < 60 * 60; i++) {
    world.tick(TICK); for (const ai of ais) ai.update(TICK);
    for (const e of world.events) evCount[e.type] = (evCount[e.type] || 0) + 1;
    world.events.length = 0; world.dirtyTiles.length = 0;
    if (world.gameOver) break;
  }
  const P = world.players;
  console.log(`min ${m + 1}: ${Date.now() - t0}ms squads=${P.map((p) => world.playerSquads(p.id).length)} bld=${P.map((p) => world.playerBuildings(p.id).length)} ore=${P.map((p) => p.ore | 0)} flux=${P.map((p) => p.flux | 0)} pop=${P.map((p) => p.pop)} val=${P.map((p) => world.armyValue(p.id) | 0)} kills=${P.map((p) => p.stats.kills)} mode=${ais.map((a) => a.mode)} pts=${world.points.map((p) => p.owner < 0 ? '-' : p.owner).join('')}`);
  t0 = Date.now();
  if (world.gameOver) { console.log('GAME OVER winner', world.winner); break; }
}
console.log('events', JSON.stringify(evCount));
