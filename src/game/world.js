// Core simulation. DOM-free so it can run headless in Node for tests and balance sims.
import { T, TILE, TILE_SPEED, TILE_HP, isPassable, isBuildable } from '../map/terrain.js';
import { HexGrid } from '../map/hexgrid.js';
import { FACTIONS, POP_CAP, START_ORE, START_FLUX, hqKey, reinforceCost } from './data.js';
import { findPath, smoothPath, lineWalkable, nearestPassable } from './pathfinding.js';
import { coverAt, COVER_DMG, COVER_SUPP, isFlank, dmgMult } from './combat.js';
import { RNG } from '../engine/rng.js';
import { clamp, dist, angleTo, angleDiff, lerpAngle, TAU } from '../engine/math.js';

export const TICK = 1 / 60;
const VISION_INTERVAL = 6;
const TRAVERSE_RATE = 1.0; // radians per second for arc-limited weapons
const NONE = -1;

function formationSlots(n, radius) {
  const out = [];
  if (n === 1) return [[0, 0]];
  if (n <= 5) {
    const r = 6 + n * 1.6 + radius * 0.3;
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; out.push([Math.cos(a) * r, Math.sin(a) * r]); }
    return out;
  }
  const inner = 3, outer = n - inner;
  for (let i = 0; i < inner; i++) { const a = (i / inner) * TAU + 0.5; out.push([Math.cos(a) * 5, Math.sin(a) * 5]); }
  for (let i = 0; i < outer; i++) { const a = (i / outer) * TAU; out.push([Math.cos(a) * 14, Math.sin(a) * 14]); }
  return out;
}

export class World {
  constructor(map, players, opts = {}) {
    this.map = map;
    this.w = map.w; this.h = map.h;
    this.rng = new RNG(opts.seed || map.seed || 'battle');
    this.time = 0; this.ticks = 0;
    this.nextId = 1;
    this.squads = []; this.buildings = []; this.projectiles = [];
    this.events = []; // consumed by renderer / audio each frame
    this.dirtyTiles = []; // terrain changed; renderer redraws these
    this.grid = map.grid;
    this.blocked = new Int32Array(this.grid.N); // building occupancy (building id)
    this.winner = NONE;
    this.gameOver = false;
    this.restrict = {}; // owner -> { units: Set|null, buildings: Set|null } (campaign chapters)
    this.points = map.points.map((p, i) => ({ i, cell: p.i, x: p.x, y: p.y, owner: NONE, progress: 0, capturer: NONE, outpost: 0, contested: false }));
    this.ore = map.ore.map((o, i) => ({ i, cell: o.i, x: o.x, y: o.y, building: 0 }));
    this.players = players.map((p, i) => ({
      id: i, name: p.name || (i === 0 ? 'You' : 'Enemy'), faction: p.faction, isAI: !!p.ai, difficulty: p.ai || null, team: p.team ?? i, neutral: !!p.neutral,
      ore: START_ORE, flux: START_FLUX, pop: 0, alive: true, hqId: 0,
      vision: new Uint8Array(map.grid.N), heroAlive: false, heroQueued: false,
      incomeMult: p.incomeMult || 1, upgrades: { hp: 1, shield: 1 },
      known: new Map(), // enemy buildings once seen: id -> snapshot
      stats: { kills: 0, losses: 0, built: 0, destroyed: 0, captured: 0 },
      oreIncome: 0, fluxIncome: 0,
    }));
    if (opts.restore) return;
    for (const p of this.players) {
      const hq = this.placeBuilding(p.id, hqKey(p.faction), map.starts[p.id].i, true);
      p.hqId = hq.id;
      hq.rally = null;
    }
    this.updateVision(true);
  }

  // ---------- save / restore (plain JSON, round-trips exactly)
  serialize() {
    const m = this.map;
    return {
      v: 1, time: this.time, ticks: this.ticks, nextId: this.nextId, rng: this.rng.s, winner: this.winner, gameOver: this.gameOver,
      restrict: Object.fromEntries(Object.entries(this.restrict).map(([k, r]) => [k, { units: r.units ? [...r.units] : null, buildings: r.buildings ? [...r.buildings] : null }])),
      map: { w: m.w, h: m.h, theme: m.theme, seed: m.seed, name: m.name, starts: m.starts, ore: m.ore, points: m.points, tiles: Array.from(m.tiles), hp: Array.from(m.hp) },
      players: this.players.map((p) => ({
        id: p.id, name: p.name, faction: p.faction, isAI: p.isAI, difficulty: p.difficulty, team: p.team, neutral: p.neutral, ore: p.ore, flux: p.flux, pop: p.pop, alive: p.alive, hqId: p.hqId,
        vision: Array.from(p.vision), heroAlive: p.heroAlive, heroQueued: p.heroQueued, incomeMult: p.incomeMult, upgrades: { ...p.upgrades }, known: [...p.known.values()], stats: { ...p.stats },
      })),
      squads: this.squads.map((s) => ({
        id: s.id, owner: s.owner, faction: s.faction, key: s.key, x: s.x, y: s.y, facing: s.facing, members: s.members.map((mm) => ({ hp: mm.hp, shield: mm.shield, slot: mm.slot, px: mm.px, py: mm.py, hero: mm.hero })),
        morale: s.morale, broken: s.broken, lastHit: s.lastHit, order: s.order, path: s.path, pathIdx: s.pathIdx, targetId: s.targetId, cooldown: s.cooldown, setup: s.setup, moving: s.moving,
        reinforce: s.reinforce, reinforceTimer: s.reinforceTimer, hero: s.hero ? s.hero.key : null, homeX: s.homeX, homeY: s.homeY, repathTimer: s.repathTimer, acquireTimer: s.acquireTimer, cover: s.cover, spawnTime: s.spawnTime, killCount: s.killCount,
      })),
      buildings: this.buildings.map((b) => ({
        id: b.id, owner: b.owner, faction: b.faction, key: b.key, cell: b.cell, hp: b.hp, shield: b.shield, progress: b.progress, done: b.done, queue: [...b.queue], queueProgress: b.queueProgress, rally: b.rally, cooldown: b.cooldown, targetId: b.targetId, lastHit: b.lastHit, facing: b.facing,
      })),
      points: this.points.map((p) => ({ owner: p.owner, progress: p.progress, capturer: p.capturer, contested: p.contested })),
      projectiles: this.projectiles.map((p) => ({ ...p })),
    };
  }
  static fromSave(d) {
    const map = { ...d.map, tiles: Uint8Array.from(d.map.tiles), hp: Uint16Array.from(d.map.hp) };
    map.grid = new HexGrid(map.w, map.h, `${map.theme}:${map.seed}:${map.w}`);
    const w = new World(map, d.players.map((p) => ({ faction: p.faction, ai: p.isAI ? p.difficulty : null, name: p.name, team: p.team, neutral: p.neutral })), { seed: map.seed, restore: true });
    w.time = d.time; w.ticks = d.ticks; w.winner = d.winner; w.gameOver = d.gameOver;
    for (const b of d.buildings) {
      w.nextId = b.id;
      const nb = w.placeBuilding(b.owner, b.key, b.cell, b.done, b.faction);
      Object.assign(nb, { hp: b.hp, shield: b.shield, progress: b.progress, done: b.done, queue: [...b.queue], queueProgress: b.queueProgress, rally: b.rally, cooldown: b.cooldown, targetId: b.targetId, lastHit: b.lastHit, facing: b.facing });
    }
    for (const s of d.squads) {
      w.nextId = s.id;
      const ns = w.spawnSquad(s.owner, s.key, s.x, s.y, { size: 0, faction: s.faction });
      ns.members = s.members.map((mm) => ({ ...mm }));
      ns.hero = s.hero ? FACTIONS[s.faction].units[s.hero] : null;
      Object.assign(ns, { facing: s.facing, morale: s.morale, broken: s.broken, lastHit: s.lastHit, order: s.order, path: s.path, pathIdx: s.pathIdx, targetId: s.targetId, cooldown: s.cooldown, setup: s.setup, moving: s.moving, reinforce: s.reinforce, reinforceTimer: s.reinforceTimer, homeX: s.homeX, homeY: s.homeY, repathTimer: s.repathTimer, acquireTimer: s.acquireTimer, cover: s.cover, spawnTime: s.spawnTime, killCount: s.killCount });
    }
    w.nextId = d.nextId;
    d.players.forEach((p, i) => {
      const np = w.players[i];
      Object.assign(np, { ore: p.ore, flux: p.flux, pop: p.pop, alive: p.alive, hqId: p.hqId, heroAlive: p.heroAlive, heroQueued: p.heroQueued, incomeMult: p.incomeMult, upgrades: { ...p.upgrades }, stats: { ...p.stats } });
      np.vision = Uint8Array.from(p.vision);
      np.known = new Map(p.known.map((k) => [k.id, k]));
    });
    d.points.forEach((p, i) => Object.assign(w.points[i], { owner: p.owner, progress: p.progress, capturer: p.capturer, contested: p.contested }));
    w.projectiles = d.projectiles.map((p) => ({ ...p }));
    w.rebuildIndex();
    if (d.restrict) for (const [k, r] of Object.entries(d.restrict)) w.restrict[k] = { units: r.units ? new Set(r.units) : null, buildings: r.buildings ? new Set(r.buildings) : null };
    w.rng.s = d.rng; // last: spawning consumed random numbers
    return w;
  }

  // ---------- helpers
  byId(id) { return this._idx?.get(id); }
  rebuildIndex() {
    this._idx = new Map();
    for (const s of this.squads) this._idx.set(s.id, s);
    for (const b of this.buildings) this._idx.set(b.id, b);
  }
  cellAt(x, y) { return this.grid.cellAt(x, y); }
  tileAtWorld(x, y) { const i = this.grid.cellAt(x, y); return i < 0 ? T.MOUNTAIN : this.map.tiles[i]; }
  isBlockedTile(i) { return this.blocked[i] !== 0; }
  blockedFn() { return (i) => this.blocked[i] !== 0; }
  passableWorld(x, y, flying) {
    if (flying) return x >= 0 && y >= 0 && x < this.grid.worldW && y < this.grid.worldH;
    const i = this.grid.cellAt(x, y);
    if (i < 0) return false;
    return isPassable(this.map.tiles[i]) && !this.blocked[i];
  }
  isBorderCell(i) { const c = this.grid.col(i), r = this.grid.row(i); return c === 0 || r === 0 || c === this.w - 1 || r === this.h - 1; }
  faction(pid) { return FACTIONS[this.players[pid].faction]; }
  allowed(owner, kind, key) { const r = this.restrict[owner]; if (!r) return true; const set = kind === 'unit' ? r.units : r.buildings; return !set || set.has(key); }
  emit(e) { this.events.push(e); }
  visible(pid, x, y) { const i = this.grid.cellAt(x, y); return i >= 0 && this.players[pid].vision[i] === 2; }
  explored(pid, i) { return i >= 0 && this.players[pid].vision[i] > 0; }
  hostile(a, b) { if (a === b || a < 0 || b < 0) return false; const pa = this.players[a], pb = this.players[b]; return !pa.neutral && !pb.neutral && pa.team !== pb.team; }
  allied(a, b) { if (a === b) return false; const pa = this.players[a], pb = this.players[b]; return !pa.neutral && !pb.neutral && pa.team === pb.team; }
  enemiesOf(pid) { return this.players.filter((p) => p.alive && this.hostile(pid, p.id)).map((p) => p.id); }
  /** Hand a squad to another player (rescues, defections). */
  transferSquad(s, owner) {
    const from = this.players[s.owner], to = this.players[owner];
    const pop = s.def.pop + (s.hero ? s.hero.pop : 0);
    from.pop -= pop; to.pop += pop;
    if (s.def.hero) { from.heroAlive = false; to.heroAlive = true; }
    s.owner = owner; s.targetId = 0; s.order = { type: 'idle', x: s.x, y: s.y }; s.homeX = s.x; s.homeY = s.y;
    this.emit({ type: 'transfer', x: s.x, y: s.y, owner, kind: 'squad', id: s.id });
  }
  transferBuilding(b, owner) {
    b.owner = owner; b.targetId = 0; b.queue = []; b.queueProgress = 0;
    if (b.def.hq && !this.players[owner].hqId) this.players[owner].hqId = b.id;
    for (const pl of this.players) pl.known.delete(b.id);
    this.emit({ type: 'transfer', x: b.x, y: b.y, owner, kind: 'building', id: b.id });
  }
  formationRadius(s) { return s.def.size === 1 ? s.def.radius + 2 : 8 + Math.sqrt(s.members.length) * 5; }
  memberMaxHp(s) { return Math.round(s.def.hp * this.players[s.owner].upgrades.hp); }
  memberMaxShield(s) { return Math.round((s.def.shield || 0) * this.players[s.owner].upgrades.shield); }
  squadHp(s) { let h = 0; for (const m of s.members) h += m.hp + m.shield; return h; }
  squadMaxHp(s) { return (this.memberMaxHp(s) + this.memberMaxShield(s)) * s.def.size + (s.hero ? s.hero.hp + (s.hero.shield || 0) : 0); }
  squadStrength(s) { return s.def.cost.ore * (this.squadHp(s) / Math.max(1, this.squadMaxHp(s))) + (s.hero ? 150 : 0); }

  // ---------- spawning
  spawnSquad(owner, key, x, y, opts = {}) {
    const fac = opts.faction ? FACTIONS[opts.faction] : this.faction(owner);
    const def = fac.units[key];
    const s = {
      id: this.nextId++, kind: 'squad', owner, faction: fac.key, key, def,
      x, y, facing: this.rng.range(0, TAU), members: [], morale: 100, broken: false, lastHit: -99,
      order: { type: 'idle', x, y }, path: null, pathIdx: 0, targetId: 0, cooldown: this.rng.range(0, 0.5),
      setup: 0, moving: false, reinforce: 0, reinforceTimer: 0, hero: null, dead: false,
      buff: { speed: 1, armor: 1, moraleRegen: 0, shieldRegen: 1, sight: 0 },
      homeX: x, homeY: y, repathTimer: 0, acquireTimer: this.rng.range(0, 0.2), cover: 0, vx: 0, vy: 0,
      spawnTime: this.time, killCount: 0,
    };
    const n = opts.size ?? def.size;
    const slots = formationSlots(def.size, def.radius);
    for (let i = 0; i < n; i++) s.members.push(this.makeMember(s, i, slots));
    s.slots = slots;
    this.squads.push(s);
    this.players[owner].pop += def.pop;
    if (def.hero) this.players[owner].heroAlive = true;
    this.rebuildIndex();
    return s;
  }
  makeMember(s, slot, slots) {
    const sl = (slots || s.slots)[slot % (slots || s.slots).length];
    const hp = this.memberMaxHp(s), sh = this.memberMaxShield(s);
    return { hp, shield: sh, slot, px: s.x + sl[0], py: s.y + sl[1], hero: false };
  }
  footprint(def, cell) { return this.grid.cluster(cell, def.w >= 2 ? 1 : 0); }
  placeBuilding(owner, key, cell, instant = false, faction = null) {
    const fac = faction ? FACTIONS[faction] : this.faction(owner);
    const def = fac.buildings[key];
    const cells = this.footprint(def, cell);
    const [x, y] = this.grid.center(cell);
    const b = {
      id: this.nextId++, kind: 'building', owner, faction: fac.key, key, def,
      cell, cells, x, y,
      hp: instant ? def.hp : Math.max(1, def.hp * 0.1), maxHp: def.hp, shield: instant ? (def.shield || 0) : 0, maxShield: def.shield || 0,
      progress: instant ? 1 : 0, done: instant, queue: [], queueProgress: 0, rally: null, cooldown: 0, targetId: 0,
      dead: false, lastHit: -99, pointIdx: NONE, oreIdx: NONE, facing: 0, radius: def.w >= 2 ? this.grid.R * 2.3 : this.grid.R * 0.95,
    };
    for (const c of cells) this.blocked[c] = b.id;
    if (def.onOre) { const o = this.ore.find((o) => o.cell === cell); if (o) { o.building = b.id; b.oreIdx = o.i; } }
    if (def.onPoint) { const p = this.points.find((p) => p.cell === cell); if (p) { p.outpost = b.id; b.pointIdx = p.i; } }
    this.buildings.push(b);
    this.rebuildIndex();
    this.players[owner].stats.built++;
    return b;
  }

  // ---------- build validation
  buildRadiusOk(owner, x, y) {
    for (const b of this.buildings) {
      if (b.owner !== owner || b.dead || !b.done) continue;
      const r = (b.def.hq ? 11 : b.def.buildRadius || 4.5) * TILE;
      if (dist(x, y, b.x, b.y) <= r) return true;
    }
    return false;
  }
  canPlace(owner, key, cell) {
    const def = this.faction(owner).buildings[key];
    if (!def || def.hq) return { ok: false, reason: 'Cannot build that' };
    if (!this.allowed(owner, 'building', key)) return { ok: false, reason: 'Not available in this chapter' };
    if (cell < 0 || cell >= this.grid.N) return { ok: false, reason: 'Out of bounds' };
    const p = this.players[owner];
    if (p.ore < def.cost.ore || p.flux < def.cost.flux) return { ok: false, reason: 'Not enough resources' };
    if (def.onOre) {
      const o = this.ore.find((o) => o.cell === cell);
      if (!o) return { ok: false, reason: 'Must be placed on an ore vein' };
      if (o.building && !this.byId(o.building)?.dead) return { ok: false, reason: 'Vein already claimed' };
    } else if (def.onPoint) {
      const pt = this.points.find((p) => p.cell === cell);
      if (!pt) return { ok: false, reason: 'Must be placed on a strategic point' };
      if (pt.owner !== owner) return { ok: false, reason: 'Capture the point first' };
      if (pt.outpost && !this.byId(pt.outpost)?.dead) return { ok: false, reason: 'Point already fortified' };
    } else {
      const cells = this.footprint(def, cell);
      if (cells.length < (def.w >= 2 ? 7 : 1)) return { ok: false, reason: 'Out of bounds' };
      for (const c of cells) {
        if (this.isBorderCell(c)) return { ok: false, reason: 'Out of bounds' };
        if (!isBuildable(this.map.tiles[c])) return { ok: false, reason: 'Blocked terrain' };
        if (this.blocked[c]) return { ok: false, reason: 'Overlaps a structure' };
        if (this.points.some((pt) => pt.cell === c)) return { ok: false, reason: 'Cannot cover a strategic point' };
      }
      if (!this.explored(owner, cell)) return { ok: false, reason: 'Unexplored' };
    }
    const [x, y] = this.grid.center(cell);
    if (!this.buildRadiusOk(owner, x, y)) return { ok: false, reason: 'Too far from your structures' };
    return { ok: true };
  }

  // ---------- commands
  cmdBuild(owner, key, cell) {
    const chk = this.canPlace(owner, key, cell);
    if (!chk.ok) return chk;
    const def = this.faction(owner).buildings[key];
    const p = this.players[owner];
    p.ore -= def.cost.ore; p.flux -= def.cost.flux;
    const b = this.placeBuilding(owner, key, cell, false);
    // push squads off the footprint
    for (const s of this.squads) {
      if (s.def.flying) continue;
      if (b.cells.includes(this.grid.cellAt(s.x, s.y))) this.unstick(s);
    }
    this.emit({ type: 'build', x: b.x, y: b.y, owner });
    return { ok: true, building: b };
  }
  cmdCancelBuilding(b) {
    if (b.dead) return;
    const p = this.players[b.owner];
    const refund = b.done ? 0.5 : 0.75;
    p.ore += Math.floor(b.def.cost.ore * refund); p.flux += Math.floor(b.def.cost.flux * refund);
    for (const k of b.queue) { const d = FACTIONS[b.faction].units[k]; p.ore += d.cost.ore; p.flux += d.cost.flux; if (d.hero) p.heroQueued = false; }
    b.queue = [];
    this.destroyBuilding(b, NONE, true);
  }
  cmdTrain(b, key) {
    if (b.dead || !b.done) return { ok: false, reason: 'Not ready' };
    const def = FACTIONS[b.faction].units[key];
    if (!def || !b.def.trains.includes(key)) return { ok: false, reason: 'Cannot train here' };
    if (!this.allowed(b.owner, 'unit', key)) return { ok: false, reason: 'Not available in this chapter' };
    const p = this.players[b.owner];
    if (def.requires && !this.buildings.some((x) => x.owner === b.owner && !x.dead && x.done && x.key === def.requires)) return { ok: false, reason: `Requires ${this.faction(b.owner).buildings[def.requires].name}` };
    if (def.hero && (p.heroAlive || p.heroQueued)) return { ok: false, reason: 'Hero already fielded' };
    if (p.pop + def.pop + this.queuedPop(b.owner) > POP_CAP) return { ok: false, reason: 'Population cap' };
    if (p.ore < def.cost.ore || p.flux < def.cost.flux) return { ok: false, reason: 'Not enough resources' };
    if (b.queue.length >= 5) return { ok: false, reason: 'Queue full' };
    p.ore -= def.cost.ore; p.flux -= def.cost.flux;
    if (def.hero) p.heroQueued = true;
    b.queue.push(key);
    return { ok: true };
  }
  cmdCancelTrain(b, i) {
    const key = b.queue[i]; if (!key) return;
    const def = FACTIONS[b.faction].units[key];
    const p = this.players[b.owner];
    p.ore += def.cost.ore; p.flux += def.cost.flux;
    if (def.hero) p.heroQueued = false;
    b.queue.splice(i, 1);
    if (i === 0) b.queueProgress = 0;
  }
  cmdRally(b, x, y) { b.rally = { x, y }; }
  queuedPop(owner) {
    let n = 0;
    for (const b of this.buildings) if (b.owner === owner && !b.dead) for (const k of b.queue) n += FACTIONS[b.faction].units[k].pop;
    return n;
  }
  spreadTargets(squads, x, y) {
    const n = squads.length;
    if (n === 1) return [[x, y]];
    const out = [];
    const cols = Math.ceil(Math.sqrt(n));
    const spacing = 44;
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      let px = x + (c - (cols - 1) / 2) * spacing, py = y + (r - (Math.ceil(n / cols) - 1) / 2) * spacing;
      const flying = squads[i].def.flying;
      if (!this.passableWorld(px, py, flying)) {
        const np = nearestPassable(this.map, this.grid.cellAt(px, py), { blocked: this.blockedFn(), flying });
        if (np >= 0) { [px, py] = this.grid.center(np); } else { px = x; py = y; }
      }
      out.push([px, py]);
    }
    return out;
  }
  cmdMove(squads, x, y, type = 'move') {
    const targets = this.spreadTargets(squads, x, y);
    squads.forEach((s, i) => {
      if (s.dead) return;
      s.order = { type, x: targets[i][0], y: targets[i][1] };
      s.targetId = 0; s.setup = 0;
      this.setPath(s, targets[i][0], targets[i][1]);
    });
    this.emit({ type: 'order', x, y, kind: type, owner: squads[0]?.owner });
  }
  cmdAttackMove(squads, x, y) { this.cmdMove(squads, x, y, 'amove'); }
  cmdAttack(squads, target) {
    for (const s of squads) {
      if (s.dead) continue;
      s.order = { type: 'attack', targetId: target.id, x: target.x, y: target.y };
      s.targetId = target.id; s.repathTimer = 0;
    }
    this.emit({ type: 'order', x: target.x, y: target.y, kind: 'attack', owner: squads[0]?.owner });
  }
  /** Flank: swing wide around the target's facing and attack it from behind. */
  cmdFlank(squads, target) {
    for (const s of squads) {
      if (s.dead) continue;
      s.order = { type: 'flank', targetId: target.id, x: target.x, y: target.y, phase: 0 };
      s.targetId = 0; s.setup = 0; s.path = null; s.repathTimer = 0;
    }
    this.emit({ type: 'order', x: target.x, y: target.y, kind: 'flank', owner: squads[0]?.owner });
  }
  /** Waypoints for a flank: a wide point on the chosen side of the target's facing, then a point behind it. */
  flankWaypoints(s, t, side) {
    const facing = t.kind === 'squad' ? t.facing : angleTo(t.x, t.y, s.x, s.y);
    const D = Math.max(s.def.weapon.range * TILE * 0.9, 2.5 * TILE);
    const perp = facing + side * Math.PI / 2;
    const wide = 2.2 * D;
    const pts = [[t.x + Math.cos(perp) * wide + Math.cos(facing) * D * 0.3, t.y + Math.sin(perp) * wide + Math.sin(facing) * D * 0.3], [t.x - Math.cos(facing) * D, t.y - Math.sin(facing) * D]];
    return pts.map(([x, y]) => { const i = this.grid.cellAt(clamp(x, this.grid.R, this.grid.worldW - this.grid.R), clamp(y, this.grid.R, this.grid.worldH - this.grid.R)); const np = i >= 0 ? nearestPassable(this.map, i, { blocked: this.blockedFn(), flying: s.def.flying }) : -1; return np >= 0 ? this.grid.center(np) : [x, y]; });
  }
  cmdHold(squads) { for (const s of squads) { s.order = { type: 'hold', x: s.x, y: s.y }; s.path = null; s.targetId = 0; } }
  cmdStop(squads) { for (const s of squads) { s.order = { type: 'idle', x: s.x, y: s.y }; s.homeX = s.x; s.homeY = s.y; s.path = null; s.targetId = 0; } }
  cmdRetreat(squads) {
    for (const s of squads) {
      if (s.dead) continue;
      const home = this.retreatPoint(s.owner, s.x, s.y);
      s.order = { type: 'retreat', x: home.x, y: home.y };
      s.targetId = 0; s.setup = 0;
      this.setPath(s, home.x, home.y);
    }
    this.emit({ type: 'order', x: squads[0]?.x, y: squads[0]?.y, kind: 'retreat', owner: squads[0]?.owner });
  }
  retreatPoint(owner, x, y) {
    let best = null, bd = Infinity;
    for (const b of this.buildings) {
      if (b.owner !== owner || b.dead || !b.done || b.def.onOre || b.def.turret) continue;
      const d = dist(x, y, b.x, b.y) - (b.def.hq ? 400 : 0);
      if (d < bd) { bd = d; best = b; }
    }
    if (!best) return { x, y };
    const sp = this.spawnPointFor(best, false);
    return { x: sp.x, y: sp.y };
  }
  cmdReinforce(s, count = 1) {
    const p = this.players[s.owner];
    const cost = reinforceCost(s.def);
    let added = 0;
    for (let i = 0; i < count; i++) {
      const alive = s.members.filter((m) => !m.hero).length;
      if (alive + s.reinforce >= s.def.size) break;
      if (p.ore < cost.ore || p.flux < cost.flux) break;
      p.ore -= cost.ore; p.flux -= cost.flux; s.reinforce++; added++;
    }
    return added;
  }
  cmdAttach(hero, target) {
    if (!hero.def.hero || target.owner !== hero.owner || target.def.hero || target.def.size === 1 || target.hero) return false;
    hero.order = { type: 'attach', targetId: target.id, x: target.x, y: target.y };
    hero.targetId = 0;
    this.setPath(hero, target.x, target.y);
    return true;
  }
  cmdDetach(s) {
    if (!s.hero) return null;
    const idx = s.members.findIndex((m) => m.hero);
    const m = s.members[idx];
    s.members.splice(idx, 1);
    const def = s.hero; s.hero = null;
    const h = this.spawnSquad(s.owner, def.key, s.x + 20, s.y + 20);
    h.members[0].hp = m.hp; h.members[0].shield = m.shield;
    this.players[s.owner].pop -= def.pop; // spawnSquad added it; the attached member already counted
    h.order = { type: 'idle', x: h.x, y: h.y };
    return h;
  }

  // ---------- pathing
  setPath(s, x, y, quick = false) {
    const flying = !!s.def.flying;
    const g = this.grid;
    x = clamp(x, g.R, g.worldW - g.R); y = clamp(y, g.R, g.worldH - g.R);
    const si = g.cellAt(s.x, s.y), ti = g.cellAt(x, y);
    if (flying || (si >= 0 && lineWalkable(this.map, s.x, s.y, x, y, this.blockedFn(), flying))) {
      s.path = [[x, y]]; s.pathIdx = 0; return true;
    }
    if (si < 0 || ti < 0) { s.path = null; return false; }
    const raw = findPath(this.map, si, ti, { blocked: this.blockedFn(), flying, partial: true, maxNodes: quick ? 900 : 4000 });
    if (!raw) { s.path = null; return false; }
    s.path = smoothPath(this.map, raw, this.blockedFn(), flying);
    if (raw[raw.length - 1] === ti) s.path[s.path.length - 1] = [x, y];
    s.pathIdx = s.path.length > 1 ? 1 : 0;
    return true;
  }
  unstick(s) {
    const g = this.grid;
    let i = g.cellAt(s.x, s.y);
    if (i < 0) i = g.cellAt(clamp(s.x, g.R, g.worldW - g.R), clamp(s.y, g.R, g.worldH - g.R));
    const np = nearestPassable(this.map, i, { blocked: this.blockedFn(), flying: s.def.flying });
    if (np >= 0) { [s.x, s.y] = g.center(np); }
  }

  // ---------- main tick
  tick(dt = TICK) {
    if (this.gameOver) return;
    this.time += dt; this.ticks++;
    this.updateEconomy(dt);
    this.updateAuras();
    for (const b of this.buildings) if (!b.dead) this.updateBuilding(b, dt);
    for (const s of this.squads) if (!s.dead) this.updateSquad(s, dt);
    this.separate(dt);
    this.updateProjectiles(dt);
    this.updatePoints(dt);
    this.cleanup();
    if (this.ticks % VISION_INTERVAL === 0) this.updateVision();
    this.checkVictory();
  }

  updateEconomy(dt) {
    for (const p of this.players) {
      if (!p.alive) continue;
      let ore = 0.6, flux = 0;
      for (const b of this.buildings) {
        if (b.owner !== p.id || b.dead || !b.done) continue;
        if (b.def.ore) ore += b.def.ore;
        if (b.def.flux) flux += b.def.flux;
        if (b.def.pointFlux) flux += b.def.pointFlux;
      }
      for (const pt of this.points) if (pt.owner === p.id) flux += 0.35;
      ore *= p.incomeMult; flux *= p.incomeMult;
      p.oreIncome = ore; p.fluxIncome = flux;
      p.ore += ore * dt; p.flux += flux * dt;
    }
  }

  updateAuras() {
    for (const s of this.squads) { s.buff.speed = 1; s.buff.armor = 1; s.buff.moraleRegen = 0; s.buff.shieldRegen = 1; s.buff.sight = 0; }
    for (const src of this.squads) {
      if (src.dead) continue;
      const aura = src.def.aura || src.hero?.aura;
      if (!aura) continue;
      const r = aura.radius * TILE;
      for (const s of this.squads) {
        if (s.dead || s.owner !== src.owner) continue;
        if (dist(s.x, s.y, src.x, src.y) > r) continue;
        if (aura.speed) s.buff.speed = Math.max(s.buff.speed, aura.speed);
        if (aura.armor) s.buff.armor = Math.min(s.buff.armor, aura.armor);
        if (aura.moraleRegen) s.buff.moraleRegen = Math.max(s.buff.moraleRegen, aura.moraleRegen);
        if (aura.shieldRegen) s.buff.shieldRegen = Math.max(s.buff.shieldRegen, aura.shieldRegen);
        if (aura.sightBonus && s === src) s.buff.sight = aura.sightBonus;
        if (aura.repair && s.def.armor === 'vehicle') for (const m of s.members) m.hp = Math.min(this.memberMaxHp(s), m.hp + aura.repair * TICK);
      }
      if (aura.repair) for (const b of this.buildings) {
        if (b.dead || b.owner !== src.owner || !b.done) continue;
        if (dist(b.x, b.y, src.x, src.y) <= r + b.radius) b.hp = Math.min(b.maxHp, b.hp + aura.repair * 2 * TICK);
      }
    }
  }

  updateBuilding(b, dt) {
    const p = this.players[b.owner];
    if (!b.done) {
      b.progress = Math.min(1, b.progress + dt / b.def.buildTime);
      b.hp = Math.min(b.maxHp, Math.max(b.hp, b.maxHp * (0.1 + 0.9 * b.progress)));
      if (b.progress >= 1) {
        b.done = true; b.shield = b.maxShield;
        this.emit({ type: 'built', x: b.x, y: b.y, owner: b.owner, key: b.key });
        if (b.def.upgrade) this.applyUpgrade(b.owner, b.def.upgrade);
      }
      return;
    }
    // shield regen
    if (b.maxShield && this.time - b.lastHit > 4) b.shield = Math.min(b.maxShield, b.shield + b.maxShield * 0.06 * dt);
    // training
    if (b.queue.length) {
      const def = FACTIONS[b.faction].units[b.queue[0]];
      b.queueProgress += dt / def.buildTime;
      if (b.queueProgress >= 1) {
        b.queue.shift(); b.queueProgress = 0;
        if (def.hero) p.heroQueued = false;
        const sp = this.spawnPointFor(b, def.flying);
        const s = this.spawnSquad(b.owner, def.key, sp.x, sp.y, { faction: b.faction });
        s.homeX = sp.x; s.homeY = sp.y;
        if (b.rally) this.cmdMove([s], b.rally.x, b.rally.y, 'amove');
        this.emit({ type: 'spawn', x: sp.x, y: sp.y, owner: b.owner, key: def.key });
      }
    }
    // turret (neutral structures stay quiet)
    if (b.def.weapon && !p.neutral) {
      b.cooldown -= dt;
      let t = this.byId(b.targetId);
      const range = b.def.weapon.range * TILE;
      if (!t || t.dead || (t.kind === 'squad' && !t.members.length) || !this.inRange(b, t, range) || !this.visible(b.owner, t.x, t.y)) {
        t = this.acquire(b, range, true);
        b.targetId = t ? t.id : 0;
      }
      if (t) {
        b.facing = angleTo(b.x, b.y, t.x, t.y);
        if (b.cooldown <= 0) { b.cooldown = 1 / b.def.weapon.rof; this.fire(b, t, b.def.weapon, 1); }
      }
    }
  }
  applyUpgrade(owner, up) {
    const p = this.players[owner];
    if (up.hp) { p.upgrades.hp *= up.hp; for (const s of this.squads) if (s.owner === owner) for (const m of s.members) if (!m.hero) m.hp *= up.hp; }
    if (up.shield) { p.upgrades.shield *= up.shield; for (const s of this.squads) if (s.owner === owner) for (const m of s.members) if (!m.hero) m.shield *= up.shield; }
    this.emit({ type: 'upgrade', owner });
  }
  spawnPointFor(b, flying) {
    // cells around the footprint, preferring the side facing the map centre
    const g = this.grid;
    let ring = g.fringe(b.cells);
    let cands = ring.filter((c) => flying || (isPassable(this.map.tiles[c]) && !this.blocked[c]));
    if (!cands.length) { ring = g.fringe(ring.concat(b.cells)); cands = ring.filter((c) => isPassable(this.map.tiles[c]) && !this.blocked[c]); }
    if (!cands.length) return { x: b.x, y: b.y + b.radius + g.R };
    cands.sort((a, c) => Math.hypot(g.cxs[a] - g.cx, g.cys[a] - g.cy) - Math.hypot(g.cxs[c] - g.cx, g.cys[c] - g.cy));
    const [x, y] = g.center(cands[0]);
    return { x, y };
  }

  // ---------- squads
  updateSquad(s, dt) {
    const def = s.def;
    const p = this.players[s.owner];
    // morale
    const sinceHit = this.time - s.lastHit;
    if (sinceHit > 2) {
      let regen = 6 + s.buff.moraleRegen * 4;
      if (s.order.type === 'retreat' || this.nearOwnBase(s)) regen *= 2.5;
      s.morale = Math.min(100, s.morale + regen * dt);
      if (s.broken && s.morale >= 45) { s.broken = false; this.emit({ type: 'rally', x: s.x, y: s.y, owner: s.owner }); }
    }
    // shields
    const maxSh = this.memberMaxShield(s);
    if (maxSh || s.hero?.shield) {
      const regenOk = sinceHit > 3 || s.buff.shieldRegen > 1;
      if (regenOk) {
        const rate = 0.14 * s.buff.shieldRegen * (sinceHit > 3 ? 1 : 0.5) * dt;
        for (const m of s.members) {
          const cap = m.hero ? (s.hero.shield || 0) : maxSh;
          if (cap) m.shield = Math.min(cap, m.shield + cap * rate);
        }
      }
    }
    // reinforcement
    if (s.reinforce > 0) {
      s.reinforceTimer += dt * (this.nearOwnBase(s, 10) ? 1 : 0.5);
      if (s.reinforceTimer >= 2.5) {
        s.reinforceTimer = 0; s.reinforce--;
        const used = new Set(s.members.filter((m) => !m.hero).map((m) => m.slot));
        let slot = 0; while (used.has(slot)) slot++;
        const m = this.makeMember(s, slot);
        m.px = s.x; m.py = s.y;
        s.members.push(m);
        this.emit({ type: 'reinforce', x: s.x, y: s.y, owner: s.owner });
      }
    }
    s.cooldown -= dt;
    if (s.acquireTimer > 0) s.acquireTimer -= dt;
    if (s.repathTimer > 0) s.repathTimer -= dt;

    // orders
    const o = s.order;
    let moveTo = null;      // [x,y] to walk toward this tick
    let allowFire = true;
    let chase = false;
    let target = this.byId(s.targetId);
    if (target && (target.dead || (target.kind === 'squad' && !target.members.length))) { target = null; s.targetId = 0; }
    const weapon = def.weapon;
    const range = weapon.range * TILE;
    const sight = (def.sight + s.buff.sight) * TILE;

    switch (o.type) {
      case 'retreat':
        allowFire = false;
        if (s.path) moveTo = 'path';
        else { o.type = 'idle'; s.homeX = s.x; s.homeY = s.y; s.morale = Math.max(s.morale, 60); s.broken = false; }
        break;
      case 'attach': {
        const t = this.byId(o.targetId);
        if (!t || t.dead || t.hero) { o.type = 'idle'; s.path = null; break; }
        if (dist(s.x, s.y, t.x, t.y) < 2.2 * TILE) {
          const m = s.members[0];
          t.members.push({ hp: m.hp, shield: m.shield, slot: 99, px: s.x, py: s.y, hero: true });
          t.hero = def;
          s.members = []; s.dead = true;
          this.emit({ type: 'attach', x: t.x, y: t.y, owner: s.owner });
          return;
        }
        if (s.repathTimer <= 0) { this.setPath(s, t.x, t.y); s.repathTimer = 0.5; }
        moveTo = 'path'; allowFire = false;
        break;
      }
      case 'attack': {
        let t = this.byId(o.targetId);
        if (!t || t.dead || (t.kind === 'squad' && !t.members.length)) { o.type = 'amove'; o.x = s.x; o.y = s.y; s.path = null; s.targetId = 0; break; }
        target = t; s.targetId = t.id; chase = true;
        break;
      }
      case 'flank': {
        const t = this.byId(o.targetId);
        if (!t || t.dead || (t.kind === 'squad' && !t.members.length)) { o.type = 'amove'; o.x = s.x; o.y = s.y; s.path = null; s.targetId = 0; break; }
        // walk the wide arc without stopping to shoot; the side is chosen once, the route re-planned only if the target moves or turns
        allowFire = false; s.targetId = 0; target = null;
        const tf = t.kind === 'squad' ? t.facing : 0;
        if (o.side === undefined) o.side = angleDiff(angleTo(t.x, t.y, s.x, s.y), tf) >= 0 ? 1 : -1;
        const stale = !o.wp || dist(t.x, t.y, o.tx, o.ty) > 1.5 * TILE || Math.abs(angleDiff(tf, o.tf)) > 0.6;
        if (stale) { o.tx = t.x; o.ty = t.y; o.tf = tf; o.wp = this.flankWaypoints(s, t, o.side); s.path = null; }
        let goal = o.wp[Math.min(o.phase, 1)];
        if (dist(s.x, s.y, goal[0], goal[1]) < 1.2 * TILE) { o.phase++; s.path = null; goal = o.wp[1]; }
        if (o.phase >= 2) { o.type = 'attack'; o.x = t.x; o.y = t.y; s.targetId = t.id; s.path = null; target = t; chase = true; break; }
        if (!s.path && s.repathTimer <= 0) { this.setPath(s, goal[0], goal[1]); s.repathTimer = 0.5; }
        if (s.path) moveTo = 'path';
        break;
      }
      case 'amove':
      case 'idle':
      case 'hold':
      case 'move': {
        if (o.type === 'move') {
          if (s.path) moveTo = 'path'; else { o.type = 'idle'; s.homeX = s.x; s.homeY = s.y; }
          // shoot while moving, no chase, but not for melee / setup weapons
          if (weapon.melee || weapon.setup) allowFire = false;
        } else if (o.type === 'amove') {
          if (!target && s.acquireTimer <= 0) { target = this.acquire(s, Math.max(sight, range)); s.targetId = target ? target.id : 0; s.acquireTimer = 0.15; }
          if (target) chase = true;
          else if (s.path) moveTo = 'path';
          else if (dist(s.x, s.y, o.x, o.y) > TILE * 1.2 && !o.arrived && this.setPath(s, o.x, o.y)) moveTo = 'path';
          else { o.type = 'idle'; s.homeX = s.x; s.homeY = s.y; }
        } else if (o.type === 'idle') {
          if (!target && s.acquireTimer <= 0) { target = this.acquire(s, Math.max(range + TILE, sight * 0.8)); s.targetId = target ? target.id : 0; s.acquireTimer = 0.2; }
          if (target) {
            // leash: chase a little, then return home
            if (dist(s.x, s.y, s.homeX, s.homeY) < 5 * TILE || this.inRange(s, target, range)) chase = true;
            else { s.targetId = 0; target = null; this.setPath(s, s.homeX, s.homeY); moveTo = 'path'; }
          } else if (s.path) moveTo = 'path';
        } else if (o.type === 'hold') {
          if (!target && s.acquireTimer <= 0) { target = this.acquire(s, range); s.targetId = target ? target.id : 0; s.acquireTimer = 0.2; }
          if (target && !this.inRange(s, target, range)) { target = null; s.targetId = 0; }
        }
        break;
      }
    }

    // broken squads can't hold formation; they fire poorly
    if (chase && target) {
      if (weapon.minRange && dist(s.x, s.y, target.x, target.y) < weapon.minRange * TILE) {
        // too close for artillery: back off
        const a = angleTo(target.x, target.y, s.x, s.y);
        moveTo = [s.x + Math.cos(a) * 60, s.y + Math.sin(a) * 60];
      } else if (this.inRange(s, target, range)) {
        moveTo = null; s.path = null;
      } else if (o.type !== 'hold') {
        const end = s.path && s.path[s.path.length - 1];
        if (!end || (s.repathTimer <= 0 && dist(end[0], end[1], target.x, target.y) > 1.5 * TILE)) { this.setPath(s, target.x, target.y, true); s.repathTimer = 0.7; }
        moveTo = 'path';
      }
    }

    // movement
    let moved = false;
    if (moveTo) {
      let tx, ty;
      if (moveTo === 'path') {
        if (!s.path || s.pathIdx >= s.path.length) { s.path = null; }
        else { [tx, ty] = s.path[s.pathIdx]; }
      } else [tx, ty] = moveTo;
      if (tx !== undefined) {
        const d = dist(s.x, s.y, tx, ty);
        const tile = this.tileAtWorld(s.x, s.y);
        let speed = def.speed * s.buff.speed * (def.flying ? 1 : (TILE_SPEED[tile] || 0.5));
        if (o.type === 'retreat') speed *= 1.6;
        if (s.broken) speed *= 1.1;
        if (s.reinforce > 0) speed *= 0.85;
        const step = speed * dt;
        if (d <= step + 0.01) {
          s.x = tx; s.y = ty;
          if (moveTo === 'path') { s.pathIdx++; if (s.pathIdx >= s.path.length) s.path = null; }
        } else {
          const nx = s.x + ((tx - s.x) / d) * step, ny = s.y + ((ty - s.y) / d) * step;
          if (this.passableWorld(nx, ny, def.flying)) { s.x = nx; s.y = ny; }
          else if (this.passableWorld(nx, s.y, def.flying)) { s.x = nx; }
          else if (this.passableWorld(s.x, ny, def.flying)) { s.y = ny; }
          else if (moveTo === 'path') {
            if (s.repathTimer <= 0) { this.setPath(s, s.path[s.path.length - 1][0], s.path[s.path.length - 1][1]); s.repathTimer = 0.5; }
          } else { s.path = null; }
        }
        s.facing = lerpAngle(s.facing, angleTo(s.x, s.y, tx, ty), Math.min(1, dt * 10));
        moved = d > 0.5;
      }
    }
    s.moving = moved;
    if (moved) s.setup = 0;
    if (!this.passableWorld(s.x, s.y, def.flying)) this.unstick(s);

    // firing
    if (allowFire) {
      let ft = target;
      if (!ft || !this.inRange(s, ft, range)) {
        // opportunistic fire at anything in range (move orders, or chase target out of range)
        if (s.acquireTimer <= 0 && !(chase && target)) { ft = this.acquire(s, range); if (ft && !chase) { /* don't lock target on move orders */ } }
        else ft = null;
      }
      if (ft && this.inRange(s, ft, range) && !(weapon.minRange && dist(s.x, s.y, ft.x, ft.y) < weapon.minRange * TILE)) {
        if (!moved) {
          const want = angleTo(s.x, s.y, ft.x, ft.y);
          if (weapon.arc) {
            // set-up guns traverse slowly and can only fire inside their arc: flank them and they take seconds to answer
            const d = angleDiff(s.facing, want), step = TRAVERSE_RATE * dt;
            if (Math.abs(d) > weapon.arc) s.setup = 0; // swinging past the arc means re-deploying the gun
            s.facing = Math.abs(d) <= step ? want : s.facing + Math.sign(d) * step;
            if (Math.abs(angleDiff(s.facing, want)) > weapon.arc) { this.updateMembers(s, dt); return; }
          } else s.facing = lerpAngle(s.facing, want, Math.min(1, dt * 12));
        }
        if (weapon.setup) {
          if (!moved) s.setup = Math.min(weapon.setup, s.setup + dt);
          if (s.setup < weapon.setup) return;
        }
        if (s.cooldown <= 0) {
          s.cooldown = 1 / weapon.rof;
          this.fire(s, ft, weapon, s.broken ? 0.35 : 1);
        }
      }
    }
    // capture bookkeeping happens in updatePoints
    this.updateMembers(s, dt);
  }
  nearOwnBase(s, r = 8) {
    for (const b of this.buildings) if (b.owner === s.owner && !b.dead && b.done && !b.def.onOre && dist(b.x, b.y, s.x, s.y) < r * TILE) return true;
    return false;
  }
  updateMembers(s, dt) {
    const c = Math.cos(s.facing), sn = Math.sin(s.facing);
    const k = Math.min(1, dt * (s.moving ? 5 : 3));
    for (const m of s.members) {
      let ox, oy;
      if (m.hero) { ox = 0; oy = 0; }
      else { const sl = s.slots[m.slot % s.slots.length]; ox = sl[0]; oy = sl[1]; }
      const tx = s.x + ox * c - oy * sn, ty = s.y + ox * sn + oy * c;
      m.px += (tx - m.px) * k; m.py += (ty - m.py) * k;
    }
  }
  separate(dt) {
    const n = this.squads.length;
    for (let i = 0; i < n; i++) {
      const a = this.squads[i]; if (a.dead || a.def.flying) continue;
      const ra = this.formationRadius(a);
      for (let j = i + 1; j < n; j++) {
        const b = this.squads[j]; if (b.dead || b.def.flying) continue;
        const rb = this.formationRadius(b);
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy, minD = (ra + rb) * 0.7;
        if (d2 >= minD * minD || d2 === 0) continue;
        const d = Math.sqrt(d2), push = (minD - d) * 0.5 * Math.min(1, dt * 8);
        const ux = dx / d, uy = dy / d;
        // stationary squads are pushed less
        const wa = a.moving ? 0.35 : 0.65, wb = b.moving ? 0.35 : 0.65;
        const ax = a.x - ux * push * wa, ay = a.y - uy * push * wa;
        const bx = b.x + ux * push * wb, by = b.y + uy * push * wb;
        if (this.passableWorld(ax, ay)) { a.x = ax; a.y = ay; }
        if (this.passableWorld(bx, by)) { b.x = bx; b.y = by; }
      }
    }
  }

  // ---------- targeting
  entityDist(a, b) {
    if (b.kind === 'building') return Math.max(0, dist(a.x, a.y, b.x, b.y) - b.radius);
    return Math.max(0, dist(a.x, a.y, b.x, b.y) - this.formationRadius(b) * 0.6);
  }
  inRange(a, b, range) { return this.entityDist(a, b) <= range; }
  acquire(src, radius, isBuilding = false) {
    const owner = src.owner;
    if (this.players[owner].neutral) return null;
    let best = null, bestScore = Infinity;
    const weapon = src.def.weapon;
    for (const s of this.squads) {
      if (s.dead || !this.hostile(owner, s.owner) || !s.members.length) continue;
      if (!this.visible(owner, s.x, s.y)) continue;
      const d = this.entityDist(src, s);
      if (d > radius) continue;
      if (weapon?.melee && s.def.flying) continue;
      let score = d;
      if (s.broken) score += 40;
      if (s.def.weapon && !s.def.hero) score -= 30; // prioritise threats
      // arc-limited guns keep their lane: a target outside the arc costs a long traverse
      if (weapon?.arc && !isBuilding && Math.abs(angleDiff(src.facing, angleTo(src.x, src.y, s.x, s.y))) > weapon.arc) score += 6 * TILE;
      // counters: prefer targets our damage type is good against
      if (weapon) score -= dmgMult(weapon.type, s.def.armor) * 20;
      if (score < bestScore) { bestScore = score; best = s; }
    }
    for (const b of this.buildings) {
      if (b.dead || !this.hostile(owner, b.owner)) continue;
      if (!this.visible(owner, b.x, b.y) && !this.players[owner].known.has(b.id)) continue;
      const d = this.entityDist(src, b);
      if (d > radius) continue;
      let score = d + 60;
      if (b.def.turret) score -= 50;
      if (score < bestScore) { bestScore = score; best = b; }
    }
    return best;
  }

  // ---------- firing & damage
  fire(src, target, weapon, dmgScale) {
    const isSquad = src.kind === 'squad';
    const shooters = isSquad ? src.members : [{ hero: false }];
    const heroDef = isSquad ? src.hero : null;
    const flankMult = src.def.flankMult || 1;
    if (weapon.travel) {
      // ballistic projectile at the target's *current* position, dodgeable
      const dur = dist(src.x, src.y, target.x, target.y) / weapon.travel;
      const n = shooters.filter((m) => !m.hero).length || 1;
      this.projectiles.push({
        x: src.x, y: src.y, sx: src.x, sy: src.y, tx: target.x + this.rng.range(-10, 10), ty: target.y + this.rng.range(-10, 10),
        t: 0, dur: Math.max(0.25, dur), owner: src.owner, faction: src.faction,
        dmg: weapon.dmg * n * dmgScale, type: weapon.type, supp: weapon.supp * n, splash: (weapon.splash || 0.6) * TILE,
        terrain: weapon.terrain || 0, arc: !!weapon.indirect, srcId: src.id, flankMult,
      });
      this.emit({ type: 'launch', x: src.x, y: src.y, faction: src.faction, arc: !!weapon.indirect });
      return;
    }
    let shots = 0;
    for (const m of shooters) {
      const w = m.hero ? heroDef.weapon : weapon;
      const from = isSquad ? m : src;
      const fx = from.px ?? src.x, fy = from.py ?? src.y;
      if (target.kind === 'squad') {
        if (!target.members.length) return;
        const victim = target.members[Math.floor(this.rng.next() * target.members.length)];
        this.damageSquad(target, victim, w.dmg * dmgScale, w.type, w.supp, src, fx, fy, { melee: !!w.melee, flankMult });
        if (w.splash && target.members.length > 1) {
          for (const other of target.members) {
            if (other === victim || !target.members.includes(other)) continue;
            if (dist(other.px, other.py, victim.px, victim.py) <= w.splash * TILE) this.damageSquad(target, other, w.dmg * 0.5 * dmgScale, w.type, w.supp * 0.5, src, fx, fy, { melee: !!w.melee, flankMult });
          }
        }
        this.emit({ type: 'shot', x: fx, y: fy, tx: victim.px, ty: victim.py, faction: src.faction, wtype: w.type, melee: !!w.melee });
      } else {
        this.damageBuilding(target, w.dmg * dmgScale, w.type, src);
        this.emit({ type: 'shot', x: fx, y: fy, tx: target.x + this.rng.range(-12, 12), ty: target.y + this.rng.range(-12, 12), faction: src.faction, wtype: w.type, melee: !!w.melee });
      }
      shots++;
    }
    if (shots) this.emit({ type: 'sound', name: weapon.melee ? 'melee' : weapon.type, x: src.x, y: src.y, faction: src.faction });
    // Demolition weapons (e.g. Breachers) smash cover around whatever they hit.
    if (shots && weapon.terrain && target.kind === 'squad') this.damageTerrain(target.x, target.y, TILE * 1.1, weapon.terrain * shots * 0.5, src.owner);
  }

  damageSquad(target, member, dmg, type, supp, attacker, sx, sy, opts = {}) {
    if (target.dead || !target.members.includes(member)) return;
    let mult = 1, suppMult = 1;
    let cover = 0;
    if (!opts.melee && !target.def.noCover) {
      cover = coverAt(this.map, member.px, member.py, sx, sy);
      mult *= COVER_DMG[cover]; suppMult *= COVER_SUPP[cover];
    }
    target.cover = cover;
    if (cover > 0) this.emit({ type: 'coverHit', owner: target.owner, level: cover, id: target.id });
    const flank = isFlank(target, sx, sy);
    if (flank) { mult *= 1.25 * (opts.flankMult || 1); suppMult *= 1.5; if (attacker) this.emit({ type: 'flank', owner: attacker.owner, targetOwner: target.owner }); }
    if (target.broken) mult *= 1.5;
    mult *= target.buff.armor;
    let remaining = dmg * mult;
    if (member.shield > 0) {
      const sd = remaining * dmgMult(type, 'shielded');
      if (sd <= member.shield) { member.shield -= sd; remaining = 0; }
      else { remaining = (sd - member.shield) / Math.max(0.05, dmgMult(type, 'shielded')); member.shield = 0; }
      this.emit({ type: 'shieldHit', x: member.px, y: member.py });
    }
    if (remaining > 0) {
      const armor = member.hero ? target.hero.armor : target.def.armor;
      member.hp -= remaining * dmgMult(type, armor);
      this.emit({ type: 'hit', x: member.px, y: member.py, faction: target.faction });
    }
    target.lastHit = this.time;
    if (!target.def.noCover || target.def.size > 1) {
      target.morale -= supp * 1.4 * suppMult * (target.def.size === 1 ? 0.5 : 1) * (target.buff.moraleRegen > 0 ? 0.5 : 1);
      if (target.morale <= 0 && !target.broken) { target.morale = 0; target.broken = true; this.emit({ type: 'broken', x: target.x, y: target.y, owner: target.owner, id: target.id }); }
      if (target.morale < 0) target.morale = 0;
    }
    if (member.hp <= 0) {
      target.members.splice(target.members.indexOf(member), 1);
      this.emit({ type: 'death', x: member.px, y: member.py, faction: target.faction, shape: member.hero ? target.hero.shape : target.def.shape, owner: target.owner, r: member.hero ? target.hero.radius : target.def.radius });
      if (member.hero) { target.hero = null; this.players[target.owner].heroAlive = false; this.players[target.owner].pop -= target.hero?.pop || 3; this.emit({ type: 'heroDown', owner: target.owner, x: member.px, y: member.py }); }
      if (attacker && attacker.kind === 'squad') attacker.killCount++;
      if (!target.members.length) this.killSquad(target, attacker);
      else if (target.def.size > 1) {
        target.morale = Math.max(0, target.morale - 14 * (target.buff.moraleRegen > 0 ? 0.5 : 1));
        if (target.morale <= 0 && !target.broken) { target.broken = true; this.emit({ type: 'broken', x: target.x, y: target.y, owner: target.owner, id: target.id }); }
      }
    }
    // retaliate: idle squads turn on their attacker
    if (attacker && attacker.owner !== undefined && this.hostile(target.owner, attacker.owner) && !target.targetId && target.order.type === 'idle' && !target.def.weapon?.minRange && this.visible(target.owner, attacker.x, attacker.y)) target.targetId = attacker.id;
  }
  damageBuilding(b, dmg, type, attacker) {
    if (b.dead) return;
    b.lastHit = this.time;
    let remaining = dmg;
    if (b.shield > 0) {
      const sd = remaining * dmgMult(type, 'shielded');
      if (sd <= b.shield) { b.shield -= sd; remaining = 0; } else { remaining = (sd - b.shield) / Math.max(0.05, dmgMult(type, 'shielded')); b.shield = 0; }
    }
    if (remaining > 0) b.hp -= remaining * dmgMult(type, 'building');
    this.emit({ type: 'hit', x: b.x + this.rng.range(-b.radius, b.radius) * 0.6, y: b.y + this.rng.range(-b.radius, b.radius) * 0.6, faction: b.faction });
    if (b.hp <= 0) this.destroyBuilding(b, attacker ? attacker.owner : NONE);
    else if (attacker && b.owner !== attacker.owner) this.emit({ type: 'underAttack', owner: b.owner, x: b.x, y: b.y, id: b.id });
  }
  killSquad(s, attacker) {
    if (s.dead) return;
    s.dead = true;
    const p = this.players[s.owner];
    p.pop -= s.def.pop + (s.hero ? s.hero.pop : 0);
    if (s.hero) { p.heroAlive = false; }
    if (s.def.hero) p.heroAlive = false;
    p.stats.losses++;
    if (attacker) this.players[attacker.owner].stats.kills++;
    this.emit({ type: 'squadDied', x: s.x, y: s.y, owner: s.owner, key: s.key, by: attacker ? attacker.owner : NONE });
  }
  destroyBuilding(b, byOwner, silent = false) {
    if (b.dead) return;
    b.dead = true; b.hp = 0;
    for (const i of b.cells) {
      if (this.blocked[i] === b.id) this.blocked[i] = 0;
      if (!silent && this.map.tiles[i] !== T.ORE) { this.map.tiles[i] = T.RUBBLE; this.map.hp[i] = 0; this.dirtyTiles.push(i); }
    }
    if (b.oreIdx !== NONE) this.ore[b.oreIdx].building = 0;
    if (b.pointIdx !== NONE) this.points[b.pointIdx].outpost = 0;
    const p = this.players[b.owner];
    for (const k of b.queue) if (FACTIONS[b.faction].units[k].hero) p.heroQueued = false;
    if (byOwner !== NONE && byOwner !== b.owner) this.players[byOwner].stats.destroyed++;
    for (const pl of this.players) pl.known.delete(b.id);
    if (!silent) this.emit({ type: 'buildingDestroyed', x: b.x, y: b.y, r: b.radius, owner: b.owner, faction: b.faction, hq: !!b.def.hq, key: b.key, by: byOwner });
    if (b.def.hq) { p.alive = false; }
  }

  // ---------- projectiles
  updateProjectiles(dt) {
    for (const pr of this.projectiles) {
      pr.t += dt;
      const k = Math.min(1, pr.t / pr.dur);
      pr.x = pr.sx + (pr.tx - pr.sx) * k; pr.y = pr.sy + (pr.ty - pr.sy) * k;
      pr.z = pr.arc ? Math.sin(k * Math.PI) * 120 : Math.sin(k * Math.PI) * 18;
      if (k >= 1) { pr.done = true; this.impact(pr); }
    }
    this.projectiles = this.projectiles.filter((p) => !p.done);
  }
  impact(pr) {
    const R = pr.splash;
    this.emit({ type: 'explosion', x: pr.tx, y: pr.ty, r: R, faction: pr.faction, big: R > TILE });
    this.emit({ type: 'sound', name: 'blast', x: pr.tx, y: pr.ty });
    const attacker = this.byId(pr.srcId) || { owner: pr.owner, kind: 'none' };
    for (const s of this.squads) {
      if (s.dead || !this.hostile(pr.owner, s.owner)) continue;
      if (dist(s.x, s.y, pr.tx, pr.ty) > R + this.formationRadius(s)) continue;
      for (const m of [...s.members]) {
        const d = dist(m.px, m.py, pr.tx, pr.ty);
        if (d > R) continue;
        const fall = 1 - 0.5 * (d / R);
        this.damageSquad(s, m, pr.dmg * fall / Math.max(1, s.members.length * 0.5), pr.type, pr.supp * fall / Math.max(1, s.members.length * 0.5), attacker, pr.sx, pr.sy, { flankMult: pr.flankMult });
      }
    }
    for (const b of this.buildings) {
      if (b.dead || !this.hostile(pr.owner, b.owner)) continue;
      if (this.entityDist({ x: pr.tx, y: pr.ty }, b) <= R) this.damageBuilding(b, pr.dmg, pr.type, attacker);
    }
    if (pr.terrain) this.damageTerrain(pr.tx, pr.ty, R, pr.terrain, pr.owner);
  }
  damageTerrain(x, y, R, amount, byOwner = NONE) {
    const g = this.grid;
    for (const i of g.cellsWithin(x, y, R + g.R * 0.5)) {
      if (this.isBorderCell(i)) continue;
      const cx = g.cxs[i], cy = g.cys[i];
      const d = dist(cx, cy, x, y);
      const t = this.map.tiles[i];
      if (TILE_HP[t] > 0) {
        this.map.hp[i] -= amount * (1 - 0.4 * Math.min(1, d / R));
        if (this.map.hp[i] <= 0) {
          this.map.tiles[i] = t === T.BRUSH ? T.GROUND : T.RUBBLE; this.map.hp[i] = 0;
          this.dirtyTiles.push(i);
          this.emit({ type: 'terrainDestroyed', x: cx, y: cy, tile: t, owner: byOwner });
        }
      } else if (t === T.GROUND && d < g.R * 1.2 && this.rng.chance(0.6) && !this.blocked[i]) {
        this.map.tiles[i] = T.CRATER; this.dirtyTiles.push(i);
      }
    }
  }
  meleeTerrain(s, weapon) {
    // Breachers etc. chew through adjacent walls when attacking a target behind them (handled by movement fallback)
  }

  // ---------- points
  updatePoints(dt) {
    for (const pt of this.points) {
      const rates = new Map();
      for (const s of this.squads) {
        if (s.dead || !s.def.canCapture || s.broken || s.order.type === 'retreat' || this.players[s.owner].neutral) continue;
        if (dist(s.x, s.y, pt.x, pt.y) > 2.3 * TILE) continue;
        rates.set(s.owner, (rates.get(s.owner) || 0) + s.def.capRate * s.members.filter((m) => !m.hero).length + (s.hero ? 1 : 0));
      }
      pt.contested = rates.size > 1;
      if (rates.size !== 1) continue;
      const [o, r] = [...rates.entries()][0];
      if (pt.outpost && !this.byId(pt.outpost)?.dead) continue;
      const step = r * dt * 9;
      if (pt.owner === o) { pt.progress = Math.min(100, pt.progress + step); continue; }
      if (pt.owner === NONE) {
        if (pt.capturer !== o) { pt.capturer = o; pt.progress = 0; }
        pt.progress += step;
        if (pt.progress >= 100) { pt.owner = o; pt.progress = 100; pt.capturer = NONE; this.players[o].stats.captured++; this.emit({ type: 'captured', x: pt.x, y: pt.y, owner: o, i: pt.i }); }
      } else {
        pt.progress -= step;
        if (pt.progress <= 0) { const prev = pt.owner; pt.owner = NONE; pt.progress = 0; pt.capturer = o; this.emit({ type: 'lostPoint', x: pt.x, y: pt.y, owner: prev, i: pt.i }); }
      }
    }
  }

  cleanup() {
    if (this.squads.some((s) => s.dead)) { this.squads = this.squads.filter((s) => !s.dead); this.rebuildIndex(); }
    if (this.buildings.some((b) => b.dead)) { this.buildings = this.buildings.filter((b) => !b.dead); this.rebuildIndex(); }
  }

  // ---------- vision
  updateVision(force = false) {
    for (const p of this.players) {
      const v = p.vision;
      for (let i = 0; i < v.length; i++) if (v[i] === 2) v[i] = 1;
      const stamp = (x, y, r) => { for (const i of this.grid.cellsWithin(x, y, r * TILE + this.grid.R * 0.5)) v[i] = 2; };
      for (const s of this.squads) if (s.owner === p.id && !s.dead) stamp(s.x, s.y, s.def.sight + s.buff.sight);
      for (const b of this.buildings) if (b.owner === p.id && !b.dead) stamp(b.x, b.y, b.def.sight);
    }
    // allies share sight
    for (const p of this.players) for (const q of this.players) {
      if (!this.allied(p.id, q.id)) continue;
      const a = p.vision, b = q.vision;
      for (let i = 0; i < a.length; i++) if (b[i] > a[i]) a[i] = b[i];
    }
    for (const p of this.players) {
      // remember hostile buildings
      for (const b of this.buildings) {
        if (!this.hostile(p.id, b.owner) || b.dead) continue;
        if (this.visible(p.id, b.x, b.y)) p.known.set(b.id, { id: b.id, key: b.key, faction: b.faction, owner: b.owner, cell: b.cell, cells: b.cells, x: b.x, y: b.y, radius: b.radius, hp: b.hp, maxHp: b.maxHp, hq: !!b.def.hq, name: b.def.name });
      }
    }
  }

  checkVictory() {
    const alive = this.players.filter((p) => p.alive && !p.neutral);
    const teams = new Set(alive.map((p) => p.team));
    if (teams.size <= 1 && !this.gameOver) {
      this.gameOver = true;
      this.winner = alive.length ? (alive.find((p) => p.id === 0) ? 0 : alive[0].id) : NONE;
      this.emit({ type: 'gameOver', winner: this.winner });
    }
  }

  // ---------- summaries for UI/AI
  playerSquads(pid) { return this.squads.filter((s) => s.owner === pid && !s.dead); }
  playerBuildings(pid) { return this.buildings.filter((b) => b.owner === pid && !b.dead); }
  armyValue(pid) { let v = 0; for (const s of this.squads) if (s.owner === pid && !s.dead) v += this.squadStrength(s); return v; }
}
