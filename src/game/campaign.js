// Campaign runtime: builds a chapter's world from its definition, tracks staged objectives from
// game state and events, fires scripted enemy waves and hints, and decides victory/defeat.
import { generateMap } from '../map/generator.js';
import { World } from './world.js';
import { FACTIONS, hqKey, START_ORE, START_FLUX } from './data.js';
import { TILE, isBuildable } from '../map/terrain.js';
import { nearestPassable } from './pathfinding.js';
import { dist } from '../engine/math.js';

export class Campaign {
  constructor(def) {
    this.def = def;
    this.stage = 0; this.counters = {}; this.done = {}; this.timers = {}; this.flags = {};
    this.status = 'playing'; this.reason = '';
    this.elapsed = 0; this.wavesFired = []; this.hintsFired = {};
    this.messages = []; // consumed by the UI: { kind: 'hint'|'stage'|'wave'|'objective', text }
    this.world = null;
  }

  // ---------- world construction
  static build(def) {
    const map = generateMap({ size: def.size || 64, theme: def.theme, seed: def.seed });
    const enemyAi = def.enemy.ai && def.enemy.ai !== 'passive' ? def.enemy.ai : (def.enemy.ai === 'passive' ? 'normal' : null);
    const world = new World(map, [{ faction: def.player.faction, name: 'You' }, { faction: def.enemy.faction, ai: enemyAi, name: 'Enemy' }], { seed: 'campaign:' + def.key, restore: true });
    const c = new Campaign(def);
    c.world = world;
    c.computeRanks();
    const P = def.player, E = def.enemy;
    // headquarters
    if (P.hq !== false) { const hq = world.placeBuilding(0, hqKey(P.faction), map.starts[0].i, true); world.players[0].hqId = hq.id; }
    if (E.hq !== false) { const hq = world.placeBuilding(1, hqKey(E.faction), map.starts[1].i, true); world.players[1].hqId = hq.id; }
    world.players[0].ore = P.ore ?? START_ORE; world.players[0].flux = P.flux ?? START_FLUX;
    world.players[1].ore = E.ore ?? START_ORE; world.players[1].flux = E.flux ?? START_FLUX;
    if (E.incomeMult) world.players[1].incomeMult = E.incomeMult;
    world.restrict[0] = { units: P.units ? new Set(P.units) : null, buildings: P.buildings ? new Set(P.buildings) : null };
    for (const b of P.structures || []) c.placeStructure(0, b);
    for (const b of E.structures || []) c.placeStructure(1, b);
    for (const s of P.squads || []) c.placeSquad(0, s);
    for (const s of E.squads || []) c.placeSquad(1, s);
    for (const k of E.points || []) { const pt = c.pointByRank(k); pt.owner = 1; pt.progress = 100; }
    for (const k of P.points || []) { const pt = c.pointByRank(k); pt.owner = 0; pt.progress = 100; }
    for (const p of world.players) p.stats = { kills: 0, losses: 0, built: 0, destroyed: 0, captured: 0 };
    world.updateVision(true);
    return c;
  }
  computeRanks() {
    const w = this.world, s = w.map.starts[0];
    const d = (o) => Math.hypot(o.x - s.x, o.y - s.y);
    this.pointRanks = [...w.points].sort((a, b) => d(a) - d(b));
    this.oreRanks = [...w.ore].sort((a, b) => d(a) - d(b));
  }
  pointByRank(k) { return this.pointRanks[Math.max(0, Math.min(this.pointRanks.length - 1, k))]; }
  oreByRank(k) { return this.oreRanks[Math.max(0, Math.min(this.oreRanks.length - 1, k))]; }
  /** Resolve a position spec to a cell index. */
  cellOf(at, owner = 0) {
    const w = this.world, g = w.grid, st = w.map.starts;
    if (at === 'base') return st[owner].i;
    if (at === 'playerBase') return st[0].i;
    if (at === 'enemyBase') return st[1].i;
    if (at === 'center') return g.cellAt(g.cx, g.cy);
    if (typeof at === 'string' && at.startsWith('point:')) return this.pointByRank(+at.slice(6)).cell;
    if (typeof at === 'string' && at.startsWith('ore:')) return this.oreByRank(+at.slice(4)).cell;
    if (Array.isArray(at)) { const b = st[owner]; const c = Math.max(1, Math.min(w.w - 2, g.col(b.i) + at[0])), r = Math.max(1, Math.min(w.h - 2, g.row(b.i) + at[1])); return g.index(c, r); }
    if (at && at.cell !== undefined) return at.cell;
    return st[owner].i;
  }
  tileOf(at, owner = 0) { const i = this.cellOf(at, owner); return [this.world.grid.col(i), this.world.grid.row(i)]; }
  worldOf(at, owner = 0) { const i = this.cellOf(at, owner); const [x, y] = this.world.grid.center(i); return { x, y, cell: i }; }
  placeSquad(owner, spec) {
    const w = this.world, g = w.grid;
    const n = spec.n || 1;
    for (let i = 0; i < n; i++) {
      const base = this.cellOf(spec.at, owner);
      let c = Math.min(w.w - 2, g.col(base) + (i % 3) * 2), r = Math.min(w.h - 2, g.row(base) + Math.floor(i / 3) * 2);
      const def = w.faction(owner).units[spec.key];
      let np = nearestPassable(w.map, g.index(c, r), { blocked: w.blockedFn(), flying: def.flying });
      if (np < 0) np = base;
      const s = w.spawnSquad(owner, spec.key, g.cxs[np], g.cys[np]);
      if (spec.hp) for (const m of s.members) m.hp *= spec.hp;
      if (spec.order === 'hold') w.cmdHold([s]);
      if (spec.order === 'attackBase') w.cmdAttackMove([s], ...(() => { const p = this.worldOf('playerBase'); return [p.x, p.y]; })());
      s.homeX = s.x; s.homeY = s.y;
    }
  }
  placeStructure(owner, spec) {
    const w = this.world, g = w.grid, def = w.faction(owner).buildings[spec.key];
    const cell = this.cellOf(spec.at, owner);
    if (def.onOre || def.onPoint) { const b = w.placeBuilding(owner, spec.key, cell, true); if (def.onPoint) { const pt = w.points.find((p) => p.cell === cell); if (pt) { pt.owner = owner; pt.progress = 100; } } return b; }
    const cands = g.cluster(cell, 8).sort((a, b) => g.hexDist(a, cell) - g.hexDist(b, cell));
    for (const c of cands) {
      const cells = w.footprint(def, c);
      if (cells.length < (def.w >= 2 ? 7 : 1)) continue;
      if (cells.every((x) => !w.isBorderCell(x) && isBuildable(w.map.tiles[x]) && !w.blocked[x] && !w.points.some((p) => p.cell === x))) return w.placeBuilding(owner, spec.key, c, true);
    }
    return null;
  }

  // ---------- events
  onEvents(events) {
    const c = this.counters, w = this.world;
    const inc = (k) => { c[k] = (c[k] || 0) + 1; };
    for (const e of events) {
      switch (e.type) {
        case 'spawn': if (e.owner === 0) { inc('train'); inc('train:' + e.key); if (w.faction(0).units[e.key]?.hero) inc('hero'); } break;
        case 'built': if (e.owner === 0) { inc('build'); inc('build:' + e.key); } break;
        case 'squadDied':
          if (e.owner === 1) { inc('kill'); inc('kill:' + e.key); const u = w.faction(1).units[e.key]; if (u) inc('killArmor:' + u.armor); }
          else if (e.owner === 0) inc('losses');
          break;
        case 'buildingDestroyed': if (e.owner === 1) { inc('destroy'); inc('destroy:' + e.key); if (e.hq) inc('destroyHq'); } else if (e.owner === 0) inc('lostBuildings'); break;
        case 'reinforce': if (e.owner === 0) inc('reinforce'); break;
        case 'attach': if (e.owner === 0) inc('attach'); break;
        case 'order': if (e.owner === 0 && e.kind === 'retreat') inc('retreat'); break;
        case 'coverHit': if (e.owner === 0) inc('cover'); break;
        case 'flank': if (e.owner === 0) inc('flank'); break;
        case 'broken': if (e.owner === 1) inc('broken'); break;
        case 'rally': if (e.owner === 0) inc('rally'); break;
        case 'terrainDestroyed': if (e.owner === 0) inc('terrain'); break;
        case 'captured': if (e.owner === 0) inc('captured'); break;
        default: break;
      }
    }
  }

  // ---------- objectives
  progressOf(o) {
    const w = this.world, c = this.counters;
    const n = o.n || 1;
    switch (o.type) {
      case 'train': return [Math.min(n, c[o.key ? 'train:' + o.key : 'train'] || 0), n];
      case 'build': return [Math.min(n, c[o.key ? 'build:' + o.key : 'build'] || 0), n];
      case 'hero': return [Math.min(1, c.hero || 0), 1];
      case 'kill': return [Math.min(n, c[o.key ? 'kill:' + o.key : o.armor ? 'killArmor:' + o.armor : 'kill'] || 0), n];
      case 'destroy': return [Math.min(n, c[o.key ? 'destroy:' + o.key : 'destroy'] || 0), n];
      case 'destroyHq': return [w.players[1].alive && w.buildings.some((b) => b.owner === 1 && b.def.hq) ? 0 : 1, 1];
      case 'destroyAll': return [w.buildings.some((b) => b.owner === 1 && !b.dead) ? 0 : 1, 1];
      case 'capture': {
        if (o.rank !== undefined) return [this.pointByRank(o.rank).owner === 0 ? 1 : 0, 1];
        return [Math.min(n, w.points.filter((p) => p.owner === 0).length), n];
      }
      case 'hold': {
        const have = w.points.filter((p) => p.owner === 0).length >= n;
        const t = this.timers[o.id] || 0;
        return [Math.min(o.seconds, Math.floor(t)), o.seconds, have];
      }
      case 'survive': return [Math.min(o.seconds, Math.floor(this.elapsed)), o.seconds];
      case 'reinforce': return [Math.min(n, c.reinforce || 0), n];
      case 'attach': return [Math.min(1, c.attach || 0), 1];
      case 'retreat': return [Math.min(n, c.retreat || 0), n];
      case 'rally': return [Math.min(n, c.rally || 0), n];
      case 'cover': return [Math.min(n, c.cover || 0), n];
      case 'flank': return [Math.min(n, c.flank || 0), n];
      case 'broken': return [Math.min(n, c.broken || 0), n];
      case 'terrain': return [Math.min(n, c.terrain || 0), n];
      case 'pop': return [Math.min(n, w.players[0].pop), n];
      case 'moveTo': {
        const p = this.worldOf(o.at);
        const r = (o.radius || 3) * TILE;
        const any = w.squads.some((s) => s.owner === 0 && !s.dead && dist(s.x, s.y, p.x, p.y) <= r);
        return [any ? 1 : 0, 1];
      }
      case 'setup': { const any = w.squads.some((s) => s.owner === 0 && s.def.weapon.setup && s.setup >= s.def.weapon.setup); return [any || this.flags.setup ? 1 : 0, 1]; }
      case 'shieldRegen': {
        for (const s of w.squads) {
          if (s.owner !== 0 || s.dead) continue;
          const max = w.memberMaxShield(s); if (!max) continue;
          const frac = s.members.reduce((a, m) => a + m.shield, 0) / (max * s.members.length);
          if (frac < 0.5) this.flags['shieldLow:' + s.id] = true;
          if (this.flags['shieldLow:' + s.id] && frac >= 0.95) this.flags.shieldRegen = true;
        }
        return [this.flags.shieldRegen ? 1 : 0, 1];
      }
      case 'loseMax': return [Math.min(n + 1, c.losses || 0), n]; // constraint: shown as x/n, "done" evaluated at chapter end
      default: return [0, 1];
    }
  }
  isDone(o) {
    if (o.type === 'loseMax') return (this.counters.losses || 0) <= (o.n || 0);
    const [cur, target] = this.progressOf(o);
    return cur >= target;
  }
  update(dt) {
    if (this.status !== 'playing') return;
    const w = this.world, def = this.def;
    this.elapsed += dt;
    // hold timers
    const stage = def.stages[this.stage];
    if (stage) for (const o of stage.objectives) {
      if (o.type === 'hold') { const have = w.points.filter((p) => p.owner === 0).length >= (o.n || 1); this.timers[o.id] = have ? (this.timers[o.id] || 0) + dt : 0; }
      if (o.type === 'setup' && this.progressOf(o)[0]) this.flags.setup = true;
    }
    // hints
    this.fireHints('time');
    // waves
    (def.waves || []).forEach((wv, i) => {
      if (this.wavesFired[i] || this.elapsed < wv.at) return;
      this.wavesFired[i] = true;
      const from = this.worldOf(wv.from || 'enemyBase', 1), to = this.worldOf(wv.target || 'playerBase', 0);
      for (const u of wv.units) for (let k = 0; k < (u.n || 1); k++) {
        const udef = w.faction(1).units[u.key]; if (!udef) continue;
        const g = w.grid, c = Math.min(w.w - 2, g.col(from.cell) + (k % 3) * 2), r = Math.min(w.h - 2, g.row(from.cell) + Math.floor(k / 3) * 2);
        let np = nearestPassable(w.map, g.index(c, r), { blocked: w.blockedFn(), flying: udef.flying }); if (np < 0) np = from.cell;
        const s = w.spawnSquad(1, u.key, g.cxs[np], g.cys[np]);
        w.cmdAttackMove([s], to.x, to.y);
      }
      this.messages.push({ kind: 'wave', text: wv.text || 'Enemy wave incoming!' });
    });
    // objectives
    if (stage) {
      let changed = false;
      for (const o of stage.objectives) {
        if (o.type === 'loseMax') continue;
        if (!this.done[o.id] && this.isDone(o)) { this.done[o.id] = true; changed = true; this.messages.push({ kind: 'objective', text: `Objective complete: ${o.text}` }); }
      }
      const primaryLeft = stage.objectives.filter((o) => !o.optional && o.type !== 'loseMax' && !this.done[o.id]);
      if (!primaryLeft.length) {
        this.stage++;
        if (this.stage >= def.stages.length) { this.status = 'won'; return; }
        const nx = def.stages[this.stage];
        if (nx.intro) this.messages.push({ kind: 'stage', text: nx.intro });
        this.fireHints('stage');
      }
      void changed;
    }
    // defeat
    if (def.lose?.hq !== false && def.player.hq !== false && !w.players[0].alive) { this.status = 'lost'; this.reason = 'Your headquarters was destroyed.'; return; }
    if (def.lose?.army && !w.squads.some((s) => s.owner === 0 && !s.dead) && !w.buildings.some((b) => b.owner === 0 && b.def.trains && b.queue.length)) { this.status = 'lost'; this.reason = 'Your force was wiped out.'; }
    if (def.timeLimit && this.elapsed > def.timeLimit) { this.status = 'lost'; this.reason = 'Time ran out.'; }
  }
  fireHints(kind) {
    for (const [i, h] of (this.def.hints || []).entries()) {
      if (this.hintsFired[i]) continue;
      const at = h.at || 'start';
      let fire = false;
      if (kind === 'time') fire = at === 'start' ? this.elapsed > 1.5 : at.startsWith('time:') ? this.elapsed >= +at.slice(5) : false;
      if (kind === 'stage') fire = at === 'stage:' + this.stage;
      if (fire) { this.hintsFired[i] = true; this.messages.push({ kind: 'hint', text: h.text }); }
    }
  }
  /** Objective list for the current stage (for the HUD). */
  list() {
    const stage = this.def.stages[Math.min(this.stage, this.def.stages.length - 1)];
    return stage.objectives.map((o) => {
      const [cur, target, extra] = this.progressOf(o);
      return { id: o.id, text: o.text, cur, target, done: !!this.done[o.id] || (o.type === 'loseMax' && this.isDone(o)), optional: !!o.optional, constraint: o.type === 'loseMax', holding: extra, hint: o.hint };
    });
  }
  serialize() {
    return { chapter: this.def.key, stage: this.stage, counters: this.counters, done: this.done, timers: this.timers, flags: this.flags, status: this.status, reason: this.reason, elapsed: this.elapsed, wavesFired: this.wavesFired, hintsFired: this.hintsFired };
  }
  static restore(def, world, st) {
    const c = new Campaign(def);
    c.world = world; c.computeRanks();
    Object.assign(c, { stage: st.stage, counters: st.counters, done: st.done, timers: st.timers, flags: st.flags, status: st.status, reason: st.reason, elapsed: st.elapsed, wavesFired: st.wavesFired, hintsFired: st.hintsFired });
    return c;
  }
}

// ---------- progress persistence
export function loadProgress() { try { return JSON.parse(localStorage.getItem('bw_campaign') || '{}'); } catch (e) { return {}; } }
export function saveProgress(p) { try { localStorage.setItem('bw_campaign', JSON.stringify(p)); } catch (e) { /* ignore */ } }
export function markComplete(faction, index) { const p = loadProgress(); p[faction] = Math.max(p[faction] || 0, index + 1); saveProgress(p); return p; }
