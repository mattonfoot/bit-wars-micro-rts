// Scripted opponent: economy, tech, capture, army building, attack/defend/retreat cycles.
import { TILE } from '../map/terrain.js';
import { FACTIONS, POP_CAP } from './data.js';
import { dist } from '../engine/math.js';
import { nearestPassable, findPath } from './pathfinding.js';

const DIFF = {
  easy:   { income: 0.8,  react: 3.0, attackAt: 900,  armyCap: 0.6, micro: false, retreatAt: 0.3, firstAttack: 300 },
  normal: { income: 1.0,  react: 1.5, attackAt: 700,  armyCap: 0.85, micro: true, retreatAt: 0.4, firstAttack: 180 },
  hard:   { income: 1.25, react: 0.8, attackAt: 550,  armyCap: 1.0, micro: true, retreatAt: 0.5, firstAttack: 110 },
};

export class AI {
  constructor(world, pid, difficulty = 'normal', opts = {}) {
    this.w = world; this.pid = pid; this.passive = !!opts.passive;
    this.d = DIFF[difficulty] || DIFF.normal;
    world.players[pid].incomeMult = this.d.income;
    this.fac = FACTIONS[world.players[pid].faction];
    this.timer = 0; this.mode = 'build'; this.modeTimer = 0;
    this.attackTarget = null; this.rally = null;
    this.lastDefend = -99;
    this.unitCycle = 0;
    this.buildOrder = this.planBuildOrder();
  }
  planBuildOrder() {
    const b = Object.values(this.fac.buildings);
    const ext = b.find((x) => x.onOre).key;
    const prod = b.filter((x) => x.trains && !x.hq).map((x) => x.key);
    const turret = b.find((x) => x.turret).key;
    const outpost = b.find((x) => x.onPoint).key;
    const upgrade = b.find((x) => x.upgrade)?.key;
    return { ext, prod, turret, outpost, upgrade };
  }
  get me() { return this.w.players[this.pid]; }
  update(dt) {
    this.timer += dt;
    if (this.timer < this.d.react) return;
    this.timer = 0;
    if (!this.me.alive) return;
    const w = this.w;
    const hq = w.byId(this.me.hqId);
    if (!hq) return;
    this.economy(hq);
    this.production();
    this.army(hq);
  }

  economy(hq) {
    const w = this.w, me = this.me, bo = this.buildOrder;
    const mine = w.playerBuildings(this.pid);
    const count = (k) => mine.filter((b) => b.key === k).length;
    const t = w.time;
    const B = this.fac.buildings;
    const afford = (k) => me.ore >= B[k].cost.ore && me.flux >= B[k].cost.flux;
    this.saving = false;
    const want = (k) => { if (afford(k)) return true; this.saving = true; return false; };
    // extractors on reachable free veins (within build radius), nearest first
    const free = w.ore.filter((o) => !o.building || w.byId(o.building)?.dead).filter((o) => w.buildRadiusOk(this.pid, o.x, o.y)).sort((a, b) => dist(a.x, a.y, hq.x, hq.y) - dist(b.x, b.y, hq.x, hq.y));
    if (free.length) {
      if (!want(bo.ext)) return;
      for (const o of free) if (w.cmdBuild(this.pid, bo.ext, o.cell).ok) return;
    }
    const nProd = mine.filter((b) => b.def.trains && !b.def.hq).length;
    const wantProd = t < 90 ? 1 : t < 240 ? 2 : 3;
    if (nProd < wantProd) {
      for (const key of bo.prod) {
        if (count(key) === 0 || (nProd >= bo.prod.length && count(key) < 2)) {
          if (!want(key)) return;
          if (this.tryBuildNear(key, hq)) return;
          break;
        }
      }
    }
    // outposts on held points (only when no enemy is nearby)
    if (t > 60) {
      for (const pt of w.points) {
        if (pt.owner !== this.pid || (pt.outpost && !w.byId(pt.outpost)?.dead)) continue;
        if (w.squads.some((s) => !s.dead && s.owner !== this.pid && dist(s.x, s.y, pt.x, pt.y) < 8 * TILE)) continue;
        if (!want(bo.outpost)) return;
        if (w.cmdBuild(this.pid, bo.outpost, pt.cell).ok) return;
      }
    }
    if (bo.upgrade && t > 200 && count(bo.upgrade) === 0) { if (!want(bo.upgrade)) return; if (this.tryBuildNear(bo.upgrade, hq)) return; }
    // turrets when threatened, or a couple later in the game
    const threatened = t - this.lastDefend < 30;
    if ((threatened && count(bo.turret) < 2 + Math.floor(t / 300)) || (t > 300 && count(bo.turret) < 2)) {
      if (!want(bo.turret)) return;
      if (this.tryBuildNear(bo.turret, hq, true)) return;
    }
  }
  tryBuildNear(key, hq, towardCentre = false) {
    const w = this.w, g = w.grid;
    const cands = [];
    for (const c of g.cluster(hq.cell, 10)) {
      const d = g.hexDist(c, hq.cell);
      if (d < 3) continue;
      let score = d + w.rng.range(0, 1.5);
      if (towardCentre) score -= (Math.hypot(hq.x - g.cx, hq.y - g.cy) - Math.hypot(g.cxs[c] - g.cx, g.cys[c] - g.cy)) / TILE * 0.4;
      cands.push([score, c]);
    }
    cands.sort((a, b) => a[0] - b[0]);
    for (const [, c] of cands) { if (w.cmdBuild(this.pid, key, c).ok) return true; }
    return false;
  }

  production() {
    const w = this.w, me = this.me;
    const enemyIds = w.enemiesOf(this.pid);
    // enemy composition estimate (visible squads + memory of last seen)
    let inf = 0, veh = 0;
    for (const s of w.squads) {
      if (s.dead || !enemyIds.includes(s.owner)) continue;
      if (s.def.armor === 'vehicle') veh += s.def.pop; else inf += s.def.pop;
    }
    const wantAntiArmour = veh > inf * 0.6;
    const wantAntiInf = inf > veh * 2;
    const underThreat = w.time - this.lastDefend < 20;
    const armySmall = me.pop < 12 || (w.time < 240 && me.pop < 16);
    for (const b of w.playerBuildings(this.pid)) {
      if (!b.def.trains || !b.done || b.queue.length >= 1) continue;
      if (this.saving && !underThreat && !armySmall) break; // let the economy catch up
      const options = b.def.trains.map((k) => this.fac.units[k]).filter((u) => !u.hero);
      const hero = b.def.trains.map((k) => this.fac.units[k]).find((u) => u.hero);
      if (hero && !me.heroAlive && !me.heroQueued && w.time > 120 && me.ore > hero.cost.ore + 100) { if (w.cmdTrain(b, hero.key).ok) continue; }
      // weight options
      const weighted = options.map((u) => {
        let wgt = 1;
        const dt = u.weapon.type;
        if (wantAntiArmour && (dt === 'heavy' || dt === 'energy')) wgt += 1.5;
        if (wantAntiInf && (dt === 'light' || dt === 'melee' || u.weapon.supp >= 5)) wgt += 1.2;
        if (u.tier === 3) wgt *= w.time > 300 ? 1.2 : 0.2;
        if (u.weapon.minRange) wgt *= 0.5;
        if (u.pop >= 7 && me.pop < 12) wgt *= 0.5;
        return [wgt, u];
      });
      let total = weighted.reduce((a, [x]) => a + x, 0);
      let r = w.rng.range(0, total), pick = weighted[0][1];
      for (const [x, u] of weighted) { r -= x; if (r <= 0) { pick = u; break; } }
      if (me.ore >= pick.cost.ore && me.flux >= pick.cost.flux) w.cmdTrain(b, pick.key);
      else if (options.some((u) => me.ore >= u.cost.ore && me.flux >= u.cost.flux)) {
        // fallback: cheapest affordable
        const cheap = options.filter((u) => me.ore >= u.cost.ore && me.flux >= u.cost.flux).sort((a, c) => a.cost.ore - c.cost.ore)[0];
        if (w.rng.chance(0.6)) w.cmdTrain(b, cheap.key);
      }
    }
    // reinforce damaged squads near base
    for (const s of w.playerSquads(this.pid)) {
      if (s.def.size > 1 && s.members.length < s.def.size * 0.7 && s.reinforce === 0 && w.nearOwnBase(s, 12) && me.ore > 150) w.cmdReinforce(s, s.def.size - s.members.length);
    }
  }

  army(hq) {
    const w = this.w, me = this.me;
    const enemyIds = w.enemiesOf(this.pid);
    const squads = w.playerSquads(this.pid).filter((s) => !s.def.hero || true);
    if (!squads.length) return;
    const myValue = w.armyValue(this.pid);
    const enemyValue = enemyIds.reduce((a, id) => a + w.armyValue(id), 0);

    // 1. defend: enemies near our buildings
    let threat = null, threatD = Infinity;
    for (const s of w.squads) {
      if (s.dead || !enemyIds.includes(s.owner)) continue;
      for (const b of w.playerBuildings(this.pid)) {
        const d = dist(s.x, s.y, b.x, b.y);
        if (d < 11 * TILE && d < threatD) { threatD = d; threat = s; }
      }
    }
    if (threat) {
      this.lastDefend = w.time;
      if (this.mode !== 'defend' || this.modeTimer > 4) {
        this.mode = 'defend'; this.modeTimer = 0;
        const defenders = squads.filter((s) => !s.broken && s.order.type !== 'retreat');
        if (defenders.length) w.cmdAttackMove(defenders, threat.x, threat.y);
      }
      this.modeTimer += this.d.react;
      this.micro(squads);
      return;
    }

    // 2. retreat broken / badly hurt squads
    for (const s of squads) {
      if (s.order.type === 'retreat') continue;
      const hpFrac = w.squadHp(s) / Math.max(1, w.squadMaxHp(s));
      if ((s.broken || hpFrac < 0.3) && !w.nearOwnBase(s, 10) && this.d.micro) w.cmdRetreat([s]);
    }

    // 3. capturers: fastest infantry squads grab neutral/enemy points
    const capturers = squads.filter((s) => s.def.canCapture && !s.broken && s.order.type !== 'retreat').sort((a, b) => b.def.speed - a.def.speed);
    const targetsPts = w.points.filter((p) => p.owner !== this.pid && !(p.owner >= 0 && w.allied(this.pid, p.owner))).sort((a, b) => dist(a.x, a.y, hq.x, hq.y) - dist(b.x, b.y, hq.x, hq.y));
    const nCap = Math.min(capturers.length, this.mode === 'attack' ? 1 : 2, targetsPts.length);
    const used = new Set();
    for (let i = 0; i < nCap; i++) {
      const s = capturers[i];
      if (s.order.type === 'amove' && s.order.capturing && w.points[s.order.capturing].owner !== this.pid) { used.add(s.id); continue; }
      const pt = targetsPts.find((p) => !p.outpost && !squads.some((o) => o.order.capturing === p.i && o !== s)) || targetsPts[0];
      if (!pt) break;
      w.cmdAttackMove([s], pt.x, pt.y);
      s.order.capturing = pt.i;
      used.add(s.id);
    }

    // 4. main army
    const army = squads.filter((s) => !used.has(s.id) && !s.broken && s.order.type !== 'retreat');
    if (!army.length) return;
    this.modeTimer += this.d.react;
    const threshold = this.d.attackAt + Math.min(900, w.time * 1.2);
    const popReady = w.time > this.d.firstAttack && (me.pop >= Math.min(POP_CAP * this.d.armyCap, 12 + w.time / 30) || (w.time > 900 && me.pop >= 20));
    if (this.mode !== 'attack') {
      // rally between base and the centre
      if (!this.rally) {
        const cx = w.grid.cx, cy = w.grid.cy;
        const rx = hq.x + (cx - hq.x) * 0.35, ry = hq.y + (cy - hq.y) * 0.35;
        const np = nearestPassable(w.map, w.grid.cellAt(rx, ry), { blocked: w.blockedFn() });
        this.rally = np >= 0 ? { x: w.grid.cxs[np], y: w.grid.cys[np] } : { x: rx, y: ry };
      }
      const idle = army.filter((s) => s.order.type === 'idle' && dist(s.x, s.y, this.rally.x, this.rally.y) > 6 * TILE);
      if (idle.length) w.cmdAttackMove(idle, this.rally.x, this.rally.y);
      if (!this.passive && popReady && myValue > enemyValue * 0.8 && this.modeTimer > 10) {
        this.mode = 'attack'; this.modeTimer = 0;
        this.attackTarget = this.pickAttackTarget(hq);
        if (this.attackTarget) w.cmdAttackMove(army, this.attackTarget.x, this.attackTarget.y);
      }
    } else {
      if (myValue < enemyValue * this.d.retreatAt || me.pop < 6) {
        this.mode = 'build'; this.modeTimer = 0;
        w.cmdRetreat(army);
        return;
      }
      // re-issue if squads idle (target dead) or every 12s
      const t = this.attackTarget;
      const targetGone = !t || (t.id && !w.byId(t.id));
      if (targetGone || this.modeTimer > 12) {
        this.attackTarget = this.pickAttackTarget(hq);
        this.modeTimer = 0;
        if (this.attackTarget) w.cmdAttackMove(army.filter((s) => s.order.type === 'idle' || targetGone), this.attackTarget.x, this.attackTarget.y);
      }
    }
    this.micro(army);
  }
  pickAttackTarget(hq) {
    const w = this.w;
    const enemyIds = w.enemiesOf(this.pid);
    // nearest known enemy building (prefer economy and outposts before HQ), else enemy squad, else enemy point, else unexplored guess (enemy start)
    const known = [...this.me.known.values()].filter((k) => enemyIds.includes(k.owner) && w.byId(k.id));
    if (known.length) {
      known.sort((a, b) => (dist(a.x, a.y, hq.x, hq.y) - (a.hq ? -400 : 0)) - (dist(b.x, b.y, hq.x, hq.y) - (b.hq ? -400 : 0)));
      const k = known[0];
      return { id: k.id, x: k.x, y: k.y };
    }
    const pts = w.points.filter((p) => enemyIds.includes(p.owner));
    if (pts.length) { const p = pts[0]; return { x: p.x, y: p.y }; }
    const es = w.map.starts[enemyIds[0]];
    return es ? { x: es.x, y: es.y } : null;
  }
  micro(squads) {
    if (!this.d.micro) return;
    const w = this.w;
    for (const s of squads) {
      // artillery keeps distance
      if (s.def.weapon.minRange) {
        const near = w.squads.find((e) => !e.dead && e.owner !== this.pid && dist(e.x, e.y, s.x, s.y) < (s.def.weapon.minRange + 1) * TILE);
        if (near && s.order.type !== 'retreat') { const a = Math.atan2(s.y - near.y, s.x - near.x); w.cmdMove([s], s.x + Math.cos(a) * 5 * TILE, s.y + Math.sin(a) * 5 * TILE); }
      }
    }
  }
}
