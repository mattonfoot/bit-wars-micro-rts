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
    this.elapsed = 0; this.wavesFired = []; this.hintsFired = {}; this.tags = {}; this.rewarded = {}; this.eventsFired = {}; this.doomDone = false; this.convoyN = 0; this.convoyNext = 0;
    this.enemyIds = [1]; this.allyIds = []; this.neutralIds = {};
    this.messages = []; // consumed by the UI: { kind: 'hint'|'stage'|'wave'|'objective', text }
    this.world = null;
  }

  // ---------- world construction
  static enemies(def) { return def.enemies || [def.enemy]; }
  static allies(def) { return def.allies || []; }
  static aiOf(spec) { return spec.ai && spec.ai !== 'passive' ? spec.ai : spec.ai === 'passive' ? 'normal' : null; }
  static build(def) {
    const enemies = Campaign.enemies(def), allies = Campaign.allies(def);
    const neutralFactions = [...new Set([...(def.neutrals?.squads || []), ...(def.neutrals?.structures || [])].map((n) => n.faction))];
    const threeWay = enemies.length + allies.length >= 2 || def.threeWay;
    const map = generateMap({ size: def.size || 64, theme: def.theme, seed: def.seed, threeWay });
    const players = [{ faction: def.player.faction, name: 'You', team: 0 }];
    enemies.forEach((E, k) => players.push({ faction: E.faction, ai: Campaign.aiOf(E), name: E.name || 'Enemy', team: E.team ?? 10 + k }));
    allies.forEach((A) => players.push({ faction: A.faction, ai: Campaign.aiOf(A), name: A.name || 'Ally', team: 0 }));
    neutralFactions.forEach((f) => players.push({ faction: f, name: 'Neutral', neutral: true, team: -1 }));
    const world = new World(map, players, { seed: 'campaign:' + def.key, restore: true });
    const c = new Campaign(def);
    c.world = world;
    c.computeRanks();
    c.enemyIds = enemies.map((_, k) => 1 + k);
    c.allyIds = allies.map((_, k) => 1 + enemies.length + k);
    c.neutralIds = Object.fromEntries(neutralFactions.map((f, k) => [f, 1 + enemies.length + allies.length + k]));
    const P = def.player;
    const setup = (pid, spec, startIdx) => {
      const pl = world.players[pid];
      if (spec.hq !== false) { const st = map.starts[Math.min(startIdx, map.starts.length - 1)]; const hq = world.placeBuilding(pid, hqKey(spec.faction), st.i, true); pl.hqId = hq.id; if (pid === 0) c.tags.hq = hq.id; }
      pl.ore = spec.ore ?? START_ORE; pl.flux = spec.flux ?? START_FLUX;
      if (spec.incomeMult) pl.incomeMult = spec.incomeMult;
      for (const b of spec.structures || []) c.placeStructure(pid, b);
      for (const s of spec.squads || []) c.placeSquad(pid, s);
      for (const k of spec.points || []) { const pt = c.pointByRank(k); pt.owner = pid; pt.progress = 100; }
    };
    setup(0, P, 0);
    world.restrict[0] = { units: P.units ? new Set(P.units) : null, buildings: P.buildings ? new Set(P.buildings) : null };
    enemies.forEach((E, k) => setup(1 + k, E, E.start ?? 1 + k));
    allies.forEach((A, k) => setup(c.allyIds[k], A, A.start ?? 1 + enemies.length + k));
    for (const n of def.neutrals?.squads || []) c.placeSquad(c.neutralIds[n.faction], { ...n });
    for (const n of def.neutrals?.structures || []) c.placeStructure(c.neutralIds[n.faction], { ...n });
    for (const p of world.players) p.stats = { kills: 0, losses: 0, built: 0, destroyed: 0, captured: 0 };
    world.updateVision(true);
    return c;
  }
  ownerOf(spec) {
    if (typeof spec === 'number') return spec;
    if (spec === 'player' || spec === undefined) return 0;
    if (spec === 'enemy' || spec === 'enemy1') return this.enemyIds?.[0] ?? 1;
    if (spec === 'enemy2') return this.enemyIds?.[1] ?? 2;
    if (spec === 'ally') return this.allyIds?.[0] ?? 0;
    return 0;
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
    if (at === 'enemyBase2') return (st[2] || st[1]).i;
    if (at === 'allyBase') return (st[1 + (this.enemyIds?.length || 1)] || st[1]).i;
    if (at === 'enemyBase2') return (st[2] || st[1]).i;
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
      const fac = spec.faction || w.players[owner].faction;
      const def = FACTIONS[fac].units[spec.key];
      let np = nearestPassable(w.map, g.index(c, r), { blocked: w.blockedFn(), flying: def.flying });
      if (np < 0) np = base;
      const s = w.spawnSquad(owner, spec.key, g.cxs[np], g.cys[np], { faction: fac });
      if (spec.tag) this.tags[spec.tag + (n > 1 ? i : '')] = s.id;
      if (spec.hp) for (const m of s.members) m.hp *= spec.hp;
      if (spec.order === 'hold') w.cmdHold([s]);
      if (spec.order === 'attackBase') { const p = this.worldOf('playerBase'); w.cmdAttackMove([s], p.x, p.y); }
      s.homeX = s.x; s.homeY = s.y;
    }
  }
  placeStructure(owner, spec) {
    const w = this.world, g = w.grid;
    const fac = spec.faction || w.players[owner].faction;
    const def = FACTIONS[fac].buildings[spec.key];
    const cell = this.cellOf(spec.at, owner);
    let b = null;
    if (def.onOre || def.onPoint) { b = w.placeBuilding(owner, spec.key, cell, true, fac); if (def.onPoint && !w.players[owner].neutral) { const pt = w.points.find((p) => p.cell === cell); if (pt) { pt.owner = owner; pt.progress = 100; } } }
    else {
      const cands = g.cluster(cell, 8).sort((x, y) => g.hexDist(x, cell) - g.hexDist(y, cell));
      for (const c of cands) {
        const cells = w.footprint(def, c);
        if (cells.length < (def.w >= 2 ? 7 : 1)) continue;
        if (cells.every((x) => !w.isBorderCell(x) && isBuildable(w.map.tiles[x]) && !w.blocked[x] && !w.points.some((p) => p.cell === x))) { b = w.placeBuilding(owner, spec.key, c, true, fac); break; }
      }
    }
    if (b) { if (spec.tag) this.tags[spec.tag] = b.id; if (spec.hp) b.hp = b.maxHp * spec.hp; if (spec.capturable) b.capturable = true; }
    return b;
  }
  tagged(tag) { const id = this.tags[tag]; return id ? this.world.byId(id) : null; }
  /** Spawn a scripted group for any owner and give it an order. */
  spawnGroup(spec) {
    const w = this.world, g = w.grid;
    const owner = this.ownerOf(spec.owner ?? 'enemy');
    const fac = spec.faction || w.players[owner].faction;
    const from = this.worldOf(spec.from || (owner === 0 ? 'playerBase' : this.allyIds.includes(owner) ? 'allyBase' : owner === this.enemyIds[1] ? 'enemyBase2' : 'enemyBase'), owner);
    const target = spec.target ? this.worldOf(spec.target, owner) : (owner === 0 || this.allyIds.includes(owner)) ? this.worldOf('enemyBase', owner) : this.worldOf('playerBase', owner);
    const out = [];
    let k = 0;
    for (const u of spec.units) for (let i = 0; i < (u.n || 1); i++, k++) {
      const udef = FACTIONS[fac].units[u.key]; if (!udef) continue;
      const c = Math.min(w.w - 2, Math.max(1, g.col(from.cell) + (k % 3) * 2 - 2)), r = Math.min(w.h - 2, Math.max(1, g.row(from.cell) + Math.floor(k / 3) * 2 - 2));
      let np = nearestPassable(w.map, g.index(c, r), { blocked: w.blockedFn(), flying: udef.flying }); if (np < 0) np = from.cell;
      const s = w.spawnSquad(owner, u.key, g.cxs[np], g.cys[np], { faction: fac });
      if (u.tag) this.tags[u.tag] = s.id;
      const order = spec.order || 'attack';
      if (order === 'attack') w.cmdAttackMove([s], target.x, target.y);
      else if (order === 'move') w.cmdMove([s], target.x, target.y);
      else if (order === 'hold') w.cmdHold([s]);
      out.push(s);
    }
    return out;
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
          if (this.enemyIds.includes(e.owner) && !(e.by > 0)) { inc('kill'); inc('kill:' + e.key); const u = w.faction(e.owner).units[e.key]; if (u) inc('killArmor:' + u.armor); }
          else if (e.owner === 0) inc('losses');
          break;
        case 'buildingDestroyed': if (this.enemyIds.includes(e.owner) && !(e.by > 0)) { inc('destroy'); inc('destroy:' + e.key); if (e.hq) inc('destroyHq'); } else if (e.owner === 0) inc('lostBuildings'); break;
        case 'reinforce': if (e.owner === 0) inc('reinforce'); break;
        case 'attach': if (e.owner === 0) inc('attach'); break;
        case 'order': if (e.owner === 0 && e.kind === 'retreat') inc('retreat'); break;
        case 'coverHit': if (e.owner === 0) inc('cover'); break;
        case 'flank': if (e.owner === 0) inc('flank'); break;
        case 'broken': if (this.enemyIds.includes(e.owner)) inc('broken'); break;
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
      case 'destroyHq': { const ids = o.all ? this.enemyIds : [this.enemyIds[0]]; const alive = ids.filter((id) => w.players[id]?.alive && w.buildings.some((b) => b.owner === id && b.def.hq && !b.dead)).length; return [ids.length - alive, ids.length]; }
      case 'destroyAll': return [w.buildings.some((b) => this.enemyIds.includes(b.owner) && !b.dead) ? 0 : 1, 1];
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
        if (o.tag) { const e = this.tagged(o.tag); return [e && !e.dead && dist(e.x, e.y, p.x, p.y) <= r ? 1 : 0, 1]; }
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
      case 'protect': { const e = this.tagged(o.tag); return [e && !e.dead ? 1 : 0, 1]; } // constraint: must stay alive
      case 'escort': { const e = this.tagged(o.tag); if (!e || e.dead) return [0, 1]; const p = this.worldOf(o.at); return [dist(e.x, e.y, p.x, p.y) <= (o.radius || 3) * TILE ? 1 : 0, 1]; }
      case 'killTag': { const e = this.tagged(o.tag); return [!e || e.dead ? 1 : 0, 1]; }
      case 'ore': return [Math.min(n, Math.floor(w.players[0].ore)), n];
      case 'flux': return [Math.min(n, Math.floor(w.players[0].flux)), n];
      case 'buildNear': { const p = this.worldOf(o.at); const have = w.buildings.filter((b) => b.owner === 0 && !b.dead && b.done && (!o.key || b.key === o.key) && dist(b.x, b.y, p.x, p.y) <= (o.radius || 8) * TILE).length; return [Math.min(n, have), n]; }
      case 'rescue': return [Math.min(n, c.rescue || 0), n];
      case 'claimStruct': return [Math.min(n, c.claimStruct || 0), n];
      case 'allyAlive': { const id = this.allyIds[0]; return [id !== undefined && w.players[id].alive ? 1 : 0, 1]; }
      default: return [0, 1];
    }
  }
  isDone(o) {
    if (o.type === 'loseMax') return (this.counters.losses || 0) <= (o.n || 0);
    if (o.type === 'protect' || o.type === 'allyAlive') return this.progressOf(o)[0] === 1;
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
    // scripted spawns: enemy waves, allied pushes, player reinforcements
    const spawns = [...(def.waves || []), ...(def.spawns || [])];
    spawns.forEach((wv, i) => {
      if (this.wavesFired[i] || this.elapsed < wv.at) return;
      this.wavesFired[i] = true;
      const owner = this.ownerOf(wv.owner ?? 'enemy');
      this.spawnGroup({ ...wv, owner, order: wv.order || (owner === 0 ? 'hold' : 'attack') });
      const kind = owner === 0 || this.allyIds.includes(owner) ? 'hint' : 'wave';
      this.messages.push({ kind, text: wv.text || (owner === 0 ? 'Reinforcements have arrived.' : 'Enemy wave incoming!') });
    });
    // convoys: periodic groups that travel from one place to another
    if (def.convoys && this.convoyN < (def.convoys.count || 99)) {
      if (this.elapsed >= (this.convoyNext || def.convoys.first || 60)) {
        this.convoyNext = this.elapsed + (def.convoys.every || 90); this.convoyN++;
        const units = def.convoys.units.map((u) => ({ ...u, tag: u.tag ? u.tag + this.convoyN : undefined }));
        this.spawnGroup({ owner: def.convoys.owner || 'enemy', units, from: def.convoys.from, target: def.convoys.to, order: 'move' });
        this.messages.push({ kind: 'hint', text: def.convoys.text || 'A supply convoy is on the move.' });
      }
    }
    // doom: a zone that consumes everything in it at a set time
    if (def.doom && !this.doomDone) {
      const D = def.doom;
      for (const [k, warn] of [[0, D.at - 120], [1, D.at - 30]]) if (!this.hintsFired['doom' + k] && this.elapsed >= warn) { this.hintsFired['doom' + k] = true; this.messages.push({ kind: 'wave', text: k === 0 ? (D.warn || 'The ground here is failing. Move everything out within two minutes.') : 'Thirty seconds. Get out.' }); }
      if (this.elapsed >= D.at) {
        this.doomDone = true;
        const c = this.worldOf(D.from || 'playerBase'), R = (D.radius || 12) * TILE;
        for (const b of [...w.buildings]) if (!b.dead && dist(b.x, b.y, c.x, c.y) <= R) w.destroyBuilding(b, -1);
        for (const s of [...w.squads]) if (!s.dead && dist(s.x, s.y, c.x, c.y) <= R && !s.def.flying) { for (const m of [...s.members]) w.emit({ type: 'death', x: m.px, y: m.py, faction: s.faction, shape: s.def.shape, owner: s.owner, r: s.def.radius }); s.members = []; w.killSquad(s, null); }
        for (const i of w.grid.cellsWithin(c.x, c.y, R)) if (!w.isBorderCell(i) && w.map.tiles[i] !== 4 && w.map.tiles[i] !== 11) { w.map.tiles[i] = D.tile ?? 9; w.map.hp[i] = 0; w.dirtyTiles.push(i); }
        w.emit({ type: 'explosion', x: c.x, y: c.y, r: R * 0.6, faction: 'red', big: true });
        this.messages.push({ kind: 'wave', text: D.text || 'The ground has failed.' });
      }
    }
    // rewards on first capture of a point
    for (const rw of def.rewards || []) {
      const pt = this.pointByRank(rw.rank);
      if (!this.rewarded[rw.rank] && pt.owner === 0) { this.rewarded[rw.rank] = true; this.spawnGroup({ owner: 0, units: rw.units, from: 'point:' + rw.rank, order: 'hold' }); this.messages.push({ kind: 'hint', text: rw.text || 'Reinforcements have joined you at the captured point.' }); }
    }
    // scripted events (betrayals, side changes)
    (def.events || []).forEach((ev, i) => {
      if (this.eventsFired[i] || this.elapsed < ev.at) return;
      this.eventsFired[i] = true;
      if (ev.type === 'betray') { const id = this.ownerOf(ev.owner || 'ally'); w.players[id].team = 50 + id; this.allyIds = this.allyIds.filter((x) => x !== id); this.enemyIds.push(id); for (const pl of w.players) pl.known.clear(); }
      if (ev.type === 'join') { const id = this.ownerOf(ev.owner || 'enemy2'); w.players[id].team = 0; this.enemyIds = this.enemyIds.filter((x) => x !== id); this.allyIds.push(id); }
      this.messages.push({ kind: 'wave', text: ev.text || 'The situation has changed.' });
    });
    // rescues and captures of neutral units/structures
    if (Object.keys(this.neutralIds).length) {
      const mine = w.squads.filter((s) => s.owner === 0 && !s.dead);
      for (const s of w.squads) {
        if (s.dead || !w.players[s.owner].neutral) continue;
        if (mine.some((m) => dist(m.x, m.y, s.x, s.y) < 2.5 * TILE)) { w.transferSquad(s, 0); this.counters.rescue = (this.counters.rescue || 0) + 1; this.messages.push({ kind: 'hint', text: `${s.def.name} rescued and under your command.` }); }
      }
      for (const b of w.buildings) {
        if (b.dead || !w.players[b.owner].neutral || !b.capturable) continue;
        if (mine.some((m) => dist(m.x, m.y, b.x, b.y) < b.radius + 2 * TILE)) { w.transferBuilding(b, 0); this.counters.claimStruct = (this.counters.claimStruct || 0) + 1; this.messages.push({ kind: 'hint', text: `${b.def.name} captured. You can use it.` }); }
      }
    }
    // objectives
    if (stage) {
      let changed = false;
      const CONSTRAINT = (o) => o.type === 'loseMax' || o.type === 'protect' || o.type === 'allyAlive';
      for (const o of stage.objectives) {
        if (CONSTRAINT(o)) continue;
        if (!this.done[o.id] && this.isDone(o)) { this.done[o.id] = true; changed = true; this.messages.push({ kind: 'objective', text: `Objective complete: ${o.text}` }); }
      }
      for (const o of stage.objectives) {
        if ((o.type === 'protect' || o.type === 'allyAlive') && !o.optional && !this.isDone(o)) { this.status = 'lost'; this.reason = o.failText || `${o.text}: failed.`; return; }
      }
      const primaryLeft = stage.objectives.filter((o) => !o.optional && !CONSTRAINT(o) && !this.done[o.id]);
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
      const constraint = o.type === 'loseMax' || o.type === 'protect' || o.type === 'allyAlive';
      return { id: o.id, text: o.text, cur, target, done: !!this.done[o.id] || (constraint && this.isDone(o)), optional: !!o.optional, constraint, holding: extra, hint: o.hint };
    });
  }
  serialize() {
    return { chapter: this.def.key, stage: this.stage, counters: this.counters, done: this.done, timers: this.timers, flags: this.flags, status: this.status, reason: this.reason, elapsed: this.elapsed, wavesFired: this.wavesFired, hintsFired: this.hintsFired, tags: this.tags, rewarded: this.rewarded, eventsFired: this.eventsFired, doomDone: this.doomDone, convoyN: this.convoyN, convoyNext: this.convoyNext, enemyIds: this.enemyIds, allyIds: this.allyIds, neutralIds: this.neutralIds };
  }
  static restore(def, world, st) {
    const c = new Campaign(def);
    c.world = world; c.computeRanks();
    Object.assign(c, { stage: st.stage, counters: st.counters, done: st.done, timers: st.timers, flags: st.flags, status: st.status, reason: st.reason, elapsed: st.elapsed, wavesFired: st.wavesFired, hintsFired: st.hintsFired, tags: st.tags || {}, rewarded: st.rewarded || {}, eventsFired: st.eventsFired || {}, doomDone: !!st.doomDone, convoyN: st.convoyN || 0, convoyNext: st.convoyNext || 0, enemyIds: st.enemyIds || [1], allyIds: st.allyIds || [], neutralIds: st.neutralIds || {} });
    return c;
  }
}

// ---------- progress persistence
export function loadProgress() { try { return JSON.parse(localStorage.getItem('bw_campaign') || '{}'); } catch (e) { return {}; } }
export function saveProgress(p) { try { localStorage.setItem('bw_campaign', JSON.stringify(p)); } catch (e) { /* ignore */ } }
export function markComplete(faction, index) { const p = loadProgress(); p[faction] = Math.max(p[faction] || 0, index + 1); saveProgress(p); return p; }
