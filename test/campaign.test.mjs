// Every chapter must build, run for 45s of game time without errors, and its objectives must evaluate.
// Chapter 1 of each campaign is then driven programmatically to completion to prove the objective logic.
import { CAMPAIGNS } from '../src/game/campaigns.js';
import { Campaign } from '../src/game/campaign.js';
import { AI } from '../src/game/ai.js';
import { World, TICK } from '../src/game/world.js';
import { TILE } from '../src/map/terrain.js';
import assert from 'node:assert/strict';

let n = 0;
for (const camp of Object.values(CAMPAIGNS)) {
  for (const ch of camp.chapters) {
    const c = Campaign.build(ch);
    const w = c.world;
    const enemies = Campaign.enemies(ch);
    const ais = enemies.map((E, k) => (E.ai ? new AI(w, k + 1, E.ai === 'passive' ? 'normal' : E.ai, { passive: E.ai === 'passive' }) : null)).filter(Boolean);
    assert.ok(w.players[0].hqId || ch.player.hq === false, `${ch.key}: player HQ`);
    assert.equal(w.players.length, enemies.length + 1, `${ch.key}: player count`);
    enemies.forEach((E, k) => { if (E.hq !== false) assert.ok(w.buildings.some((b) => b.owner === k + 1 && b.def.hq), `${ch.key}: enemy ${k + 1} HQ`); });
    for (const st of ch.stages) for (const o of st.objectives) { const p = c.progressOf(o); assert.ok(Array.isArray(p) && p.length >= 2, `${ch.key}/${o.id} progress`); }
    for (let i = 0; i < 60 * 30; i++) {
      w.tick(TICK); for (const ai of ais) ai.update(TICK); c.onEvents(w.events); c.update(TICK); w.events.length = 0; w.dirtyTiles.length = 0;
    }
    assert.equal(c.status, 'playing', `${ch.key} should still be playing after 30s (was ${c.status}: ${c.reason})`);
    // save round-trip incl. campaign state
    const saved = JSON.parse(JSON.stringify({ world: w.serialize(), campaign: c.serialize() }));
    const w2 = World.fromSave(saved.world);
    const c2 = Campaign.restore(ch, w2, saved.campaign);
    assert.equal(JSON.stringify(c2.serialize()), JSON.stringify(c.serialize()), `${ch.key} campaign state round-trip`);
    n++;
    console.log(`${ch.key.padEnd(9)} ${ch.title.padEnd(20)} ok · players ${w.players.length} · squads ${w.squads.length} · buildings ${w.buildings.length} · objectives ${c.list().map((o) => `${o.cur}/${o.target}`).join(' ')}`);
  }
}
// Drive blue-1 to completion: train 2 darts, build lode, capture point 0, kill the guard, capture point 2.
{
  const ch = CAMPAIGNS.blue.chapters[0];
  const c = Campaign.build(ch); const w = c.world;
  const hq = w.byId(w.players[0].hqId);
  assert.ok(w.cmdTrain(hq, 'darts').ok && w.cmdTrain(hq, 'darts').ok);
  assert.equal(w.cmdTrain(hq, 'needles').ok, false, 'needles restricted in chapter 1');
  const run = (secs, fn) => { for (let i = 0; i < 60 * secs; i++) { w.tick(TICK); c.onEvents(w.events); c.update(TICK); w.events.length = 0; w.dirtyTiles.length = 0; if (fn && fn()) return; } };
  run(30);
  assert.equal(c.stage, 1, 'stage after training');
  const ore = c.oreByRank(0); w.players[0].ore = 500;
  assert.ok(w.cmdBuild(0, 'lode', ore.cell).ok, 'build lode');
  run(20);
  assert.equal(c.stage, 2, 'stage after lode');
  const p0 = c.pointByRank(0);
  w.cmdAttackMove(w.playerSquads(0), p0.x, p0.y);
  run(120, () => c.stage === 3);
  assert.equal(c.stage, 3, 'captured first point');
  const p2 = c.pointByRank(2);
  w.cmdAttackMove(w.playerSquads(0), p2.x, p2.y);
  run(240, () => c.status === 'won');
  assert.equal(c.status, 'won', `blue-1 should be won (stage ${c.stage}, objectives ${JSON.stringify(c.list())})`);
  console.log('blue-1 scripted playthrough won at', (c.elapsed / 60).toFixed(1), 'min');
}
console.log(`All ${n} chapters build and run`);
