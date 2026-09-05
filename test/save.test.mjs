// Save/restore round-trip: serialize -> fromSave -> serialize must be identical, and the restored world must keep running.
import { generateMap } from '../src/map/generator.js';
import { World, TICK } from '../src/game/world.js';
import { AI } from '../src/game/ai.js';
import assert from 'node:assert/strict';

const map = generateMap({ size: 64, theme: 'urban', seed: 'save' });
const world = new World(map, [{ faction: 'red' }, { faction: 'green', ai: 'normal' }], { seed: 'save' });
const ai = new AI(world, 1, 'normal');
const hq = world.byId(world.players[0].hqId);
world.cmdTrain(hq, 'bolts'); world.cmdTrain(hq, 'hammers');
for (let i = 0; i < 60 * 150; i++) { world.tick(TICK); ai.update(TICK); world.events.length = 0; world.dirtyTiles.length = 0; }
const a = world.serialize();
const json = JSON.stringify(a);
const restored = World.fromSave(JSON.parse(json));
const b = restored.serialize();
assert.equal(JSON.stringify(b), json, 'round-trip must be identical');
assert.equal(restored.squads.length, world.squads.length);
assert.deepEqual(Array.from(restored.blocked), Array.from(world.blocked), 'building occupancy grid');
// both worlds continue for 20s and stay in sync (same rng, same state; AI is fresh on both to compare fairly)
const ai1 = new AI(world, 1, 'normal'), ai2 = new AI(restored, 1, 'normal');
for (let i = 0; i < 60 * 20; i++) {
  world.tick(TICK); ai1.update(TICK); restored.tick(TICK); ai2.update(TICK);
  world.events.length = 0; restored.events.length = 0; world.dirtyTiles.length = 0; restored.dirtyTiles.length = 0;
}
assert.equal(JSON.stringify(restored.serialize()), JSON.stringify(world.serialize()), 'restored world diverged from original');
console.log(`Save round-trip OK (${(json.length / 1024).toFixed(0)} KB, ${world.squads.length} squads, ${world.buildings.length} buildings)`);
