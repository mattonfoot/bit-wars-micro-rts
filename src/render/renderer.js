// World renderer: terrain, points, buildings, squads, projectiles, effects, fog, ghosts, selection.
import { T, TILE } from '../map/terrain.js';
import { FACTIONS, reinforceCost } from '../game/data.js';
import { TerrainLayer } from './terrain.js';
import { FogLayer } from './fog.js';
import { drawUnit, drawBuilding, factionColors } from './shapes.js';
import { THEMES } from '../map/themes.js';
import { TAU, clamp } from '../engine/math.js';
import { COVER_NAME } from '../game/combat.js';

const ORDER_COLORS = { move: '#7CFC9A', amove: '#ff5f5f', attack: '#ff5f5f', flank: '#ffa94d', retreat: '#ffd166', capture: '#fff' };

export class Renderer {
  constructor(canvas, world, camera, viewer) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.world = world; this.camera = camera; this.viewer = viewer;
    this.viewerFaction = world.players[viewer].faction;
    this.terrain = new TerrainLayer(world.map);
    this.fog = new FogLayer(world.map);
    this.effects = [];
    this.time = 0;
    this.theme = THEMES[world.map.theme];
    this.showFog = true;
  }
  rel(owner) { const w = this.world; if (owner === this.viewer) return 'own'; if (w.players[owner]?.neutral) return 'neutral'; return w.allied(this.viewer, owner) ? 'ally' : 'enemy'; }
  colors(faction, owner) { return factionColors(faction, owner, this.viewer, this.viewerFaction, this.rel(owner)); }
  ownerColor(owner) { if (owner < 0) return '#9aa0a6'; return this.colors(this.world.players[owner].faction, owner).fill; }

  // ---- events -> effects
  processEvents(events) {
    const w = this.world;
    for (const e of events) {
      switch (e.type) {
        case 'shot': {
          if (!this.visibleAt(e.x, e.y) && !this.visibleAt(e.tx, e.ty)) break;
          const col = this.colors(e.faction, 0).fill;
          if (e.melee) this.effects.push({ type: 'slash', x: e.tx, y: e.ty, t: 0, dur: 0.15, col });
          else this.effects.push({ type: 'tracer', x: e.x, y: e.y, tx: e.tx, ty: e.ty, t: 0, dur: e.wtype === 'energy' ? 0.18 : 0.1, col: e.wtype === 'energy' ? '#d6ffe9' : e.wtype === 'heavy' ? '#ffd27a' : '#ffffff', wide: e.wtype === 'energy' || e.wtype === 'heavy' });
          break;
        }
        case 'hit': if (this.visibleAt(e.x, e.y)) this.effects.push({ type: 'spark', x: e.x, y: e.y, t: 0, dur: 0.2 }); break;
        case 'shieldHit': if (this.visibleAt(e.x, e.y)) this.effects.push({ type: 'shield', x: e.x, y: e.y, t: 0, dur: 0.25 }); break;
        case 'death': if (this.visibleAt(e.x, e.y)) this.effects.push({ type: 'shards', x: e.x, y: e.y, t: 0, dur: 0.7, col: this.colors(e.faction, e.owner).fill, shape: e.shape, r: e.r, seed: Math.random() }); break;
        case 'explosion': this.effects.push({ type: 'explosion', x: e.x, y: e.y, r: e.r, t: 0, dur: e.big ? 0.6 : 0.4 }); break;
        case 'launch': break;
        case 'order': this.effects.push({ type: 'marker', x: e.x, y: e.y, t: 0, dur: 0.6, col: ORDER_COLORS[e.kind] || '#fff' }); break;
        case 'broken': if (this.visibleAt(e.x, e.y)) this.effects.push({ type: 'text', x: e.x, y: e.y, t: 0, dur: 1.4, text: 'BROKEN', col: '#ff6b6b' }); break;
        case 'rally': if (e.owner === this.viewer) this.effects.push({ type: 'text', x: e.x, y: e.y, t: 0, dur: 1.2, text: 'RALLIED', col: '#9dffb0' }); break;
        case 'captured': this.effects.push({ type: 'ring', x: e.x, y: e.y, t: 0, dur: 0.9, col: this.ownerColor(e.owner), r: TILE * 2.3 }); this.effects.push({ type: 'text', x: e.x, y: e.y - 20, t: 0, dur: 1.5, text: e.owner === this.viewer ? 'POINT CAPTURED' : 'POINT LOST', col: e.owner === this.viewer ? '#9dffb0' : '#ff6b6b' }); break;
        case 'buildingDestroyed': this.effects.push({ type: 'explosion', x: e.x, y: e.y, r: e.r * 1.6, t: 0, dur: 1.0 }); for (let k = 0; k < 4; k++) this.effects.push({ type: 'shards', x: e.x + (Math.random() - 0.5) * e.r, y: e.y + (Math.random() - 0.5) * e.r, t: -k * 0.08, dur: 0.9, col: this.colors(e.faction, e.owner).fill, shape: 'debris', r: 6, seed: Math.random() }); break;
        case 'built': if (e.owner === this.viewer) this.effects.push({ type: 'ring', x: e.x, y: e.y, t: 0, dur: 0.7, col: '#fff', r: 40 }); break;
        case 'reinforce': if (e.owner === this.viewer) this.effects.push({ type: 'text', x: e.x, y: e.y, t: 0, dur: 0.8, text: '+1', col: '#fff' }); break;
        case 'attach': this.effects.push({ type: 'ring', x: e.x, y: e.y, t: 0, dur: 0.6, col: '#fff', r: 30 }); break;
        case 'terrainDestroyed': this.effects.push({ type: 'shards', x: e.x, y: e.y, t: 0, dur: 0.8, col: '#8a8a8a', shape: 'debris', r: 5, seed: Math.random() }); break;
        default: break;
      }
    }
  }
  visibleAt(x, y) { return !this.showFog || this.world.visible(this.viewer, x, y); }

  // ---- main draw
  draw(state, dt) {
    this.time += dt;
    const { ctx, camera, world } = this;
    const dpr = camera.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    camera.apply(ctx);
    const vr = camera.visibleRect();
    // terrain (clipped to visible area)
    const WW = this.terrain.canvas.width, WH = this.terrain.canvas.height;
    const sx = clamp(Math.floor(vr.x0), 0, WW), sy = clamp(Math.floor(vr.y0), 0, WH);
    const ex = clamp(Math.ceil(vr.x1), 0, WW), ey = clamp(Math.ceil(vr.y1), 0, WH);
    if (ex > sx && ey > sy) ctx.drawImage(this.terrain.canvas, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);
    const inView = (x, y, m = 64) => x > vr.x0 - m && x < vr.x1 + m && y > vr.y0 - m && y < vr.y1 + m;

    this.drawPoints(inView, state);
    this.drawBuildings(inView, state);
    this.drawSquads(inView, state);
    this.drawProjectiles(inView);
    this.drawEffects(dt, inView);
    if (this.showFog) {
      ctx.imageSmoothingEnabled = true;
      const fr = this.fog.rect;
      ctx.drawImage(this.fog.canvas, fr.x, fr.y, fr.w, fr.h);
    }
    this.drawKnownGhosts(inView, state);
    if (state.buildGhost) this.drawBuildGhost(state.buildGhost);
    if (state.rallyFor) this.drawRally(state.rallyFor);
    // screen-space overlays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state.box) {
      const b = state.box;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5;
      ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    }
  }

  drawPoints(inView, state) {
    const { ctx, world } = this;
    for (const p of world.points) {
      if (!inView(p.x, p.y)) continue;
      const col = this.ownerColor(p.owner);
      const R = TILE * 0.85;
      ctx.save();
      ctx.translate(p.x, p.y);
      // capture radius
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(0, 0, TILE * 2.3, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      // base hex
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
      // progress arc
      const frac = p.progress / 100;
      const arcCol = p.owner >= 0 ? col : this.ownerColor(p.capturer);
      if (frac > 0) { ctx.strokeStyle = arcCol; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, R * 0.62, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.stroke(); }
      // flag
      ctx.fillStyle = col; ctx.fillRect(-2, -R * 0.55, 3, R * 0.9);
      ctx.beginPath(); ctx.moveTo(1, -R * 0.55); ctx.lineTo(R * 0.5, -R * 0.3); ctx.lineTo(1, -R * 0.05); ctx.closePath(); ctx.fill();
      if (p.contested) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.time * 12); ctx.beginPath(); ctx.arc(0, 0, R * 1.15, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.restore();
    }
  }

  drawBuildings(inView, state) {
    const { ctx, world } = this;
    for (const b of world.buildings) {
      if (b.dead || !inView(b.x, b.y, 96)) continue;
      const own = b.owner === this.viewer;
      if (!own && !this.visibleAt(b.x, b.y)) continue;
      const col = this.colors(b.faction, b.owner);
      const W = b.radius * 2, H = b.radius * 2;
      const sel = state.selected.has(b.id);
      // footprint: the hex cells it occupies
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
      this.cellsPath(b.cells); ctx.fill(); ctx.stroke();
      if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(b.x, b.y, b.radius + 3, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
      ctx.globalAlpha = b.done ? 1 : 0.35 + 0.65 * b.progress;
      drawBuilding(ctx, b.faction, b.def, b.x, b.y, W, H, col, { facing: b.facing, time: this.time });
      ctx.globalAlpha = 1;
      if (!b.done) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, W * 0.3, -Math.PI / 2, -Math.PI / 2 + TAU * b.progress); ctx.stroke(); }
      if (b.queue.length) { ctx.strokeStyle = col.light; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, W * 0.42, -Math.PI / 2, -Math.PI / 2 + TAU * b.queueProgress); ctx.stroke(); }
      if (b.maxShield && b.shield > 0) { ctx.strokeStyle = 'rgba(160,255,220,0.65)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, W * 0.55, 0, TAU * (b.shield / b.maxShield)); ctx.stroke(); }
      if (b.hp < b.maxHp || sel || !b.done) this.bar(b.x, b.y - b.radius - 8, W - 6, 5, b.hp / b.maxHp, own ? '#5cff7a' : '#ff5c5c');
    }
  }

  drawSquads(inView, state) {
    const { ctx, world, camera } = this;
    const z = camera.zoom;
    for (const s of world.squads) {
      if (s.dead || !inView(s.x, s.y, 80)) continue;
      const own = s.owner === this.viewer;
      if (!own && !this.visibleAt(s.x, s.y)) continue;
      const col = this.colors(s.faction, s.owner);
      const sel = state.selected.has(s.id);
      const fr = world.formationRadius(s);
      if (sel) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2 / Math.max(0.5, z);
        ctx.beginPath(); ctx.ellipse(s.x, s.y, fr + 4, (fr + 4) * 0.7, 0, 0, TAU); ctx.stroke();
        if (s.def.weapon.range > 2.5) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.arc(s.x, s.y, s.def.weapon.range * TILE, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        if (s.def.aura || s.hero?.aura) { const a = s.def.aura || s.hero.aura; ctx.strokeStyle = col.fill; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(s.x, s.y, a.radius * TILE, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      } else if (own) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, fr, fr * 0.7, 0, 0, TAU); ctx.fill();
      }
      // shadows + members
      if (s.def.flying) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (const m of s.members) { ctx.beginPath(); ctx.ellipse(m.px + 8, m.py + 14, s.def.radius * 0.9, s.def.radius * 0.5, 0, 0, TAU); ctx.fill(); } }
      const bob = s.def.flying ? Math.sin(this.time * 4 + s.id) * 3 : 0;
      for (const m of s.members) {
        const shape = m.hero ? s.hero.shape : s.def.shape;
        const r = m.hero ? s.hero.radius : s.def.radius;
        if (s.broken) { ctx.save(); ctx.globalAlpha = 0.75; }
        drawUnit(ctx, shape, m.px, m.py - bob, r, s.facing + (s.moving ? Math.sin(this.time * 14 + m.slot * 2) * 0.12 : 0), col);
        if (s.broken) ctx.restore();
        if (m.shield > 0) {
          const cap = m.hero ? (s.hero.shield || 1) : world.memberMaxShield(s) || 1;
          ctx.strokeStyle = `rgba(170,255,230,${0.3 + 0.5 * (m.shield / cap)})`; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(m.px, m.py - bob, r + 3.5, 0, TAU); ctx.stroke();
        }
      }
      // status bars (constant screen size)
      const showBars = own || sel || col.rel === 'ally' || world.squadHp(s) < world.squadMaxHp(s) * 0.999;
      if (showBars) {
        ctx.save();
        ctx.translate(s.x, s.y - fr - 10);
        const k = 1 / Math.max(0.6, z);
        ctx.scale(k, k);
        const w = 34 + s.def.size * 2;
        const hpFrac = world.squadHp(s) / Math.max(1, world.squadMaxHp(s));
        this.bar(0, 0, w, 4, hpFrac, own ? '#5cff7a' : '#ff5c5c');
        if (s.def.size > 1 || s.def.hero || true) this.bar(0, 5, w, 3, s.morale / 100, s.broken ? '#ff3b3b' : '#ffd166', s.broken);
        // member pips
        if (s.def.size > 1) {
          const n = s.def.size, pw = Math.min(6, (w - 2) / n);
          for (let i = 0; i < n; i++) { ctx.fillStyle = i < s.members.filter((m) => !m.hero).length ? col.fill : 'rgba(0,0,0,0.5)'; ctx.fillRect(-w / 2 + i * pw + 1, 9, pw - 1.5, 2.5); }
        }
        // icons
        let ix = w / 2 + 4;
        ctx.font = 'bold 9px system-ui, sans-serif'; ctx.textBaseline = 'middle';
        if (s.cover && !s.def.noCover && this.time - s.lastHit < 4 && s.lastHit > 0) { ctx.fillStyle = s.cover === 2 ? '#8ecbff' : '#c5e3ff'; ctx.beginPath(); ctx.moveTo(ix, -2); ctx.lineTo(ix + 7, 0); ctx.lineTo(ix + 3.5, 8); ctx.lineTo(ix, 0); ctx.closePath(); ctx.fill(); ix += 10; }
        if (s.broken) { ctx.fillStyle = '#ff3b3b'; ctx.fillText('!', ix, 3); ix += 8; }
        if (s.reinforce > 0) { ctx.fillStyle = '#fff'; ctx.fillText('+' + s.reinforce, ix, 3); ix += 12; }
        if (s.hero) { ctx.fillStyle = '#ffe680'; ctx.fillText('★', ix, 3); ix += 10; }
        if (s.order.type === 'retreat') { ctx.fillStyle = '#ffd166'; ctx.fillText('«', ix, 3); ix += 8; }
        if (s.setup > 0 && s.def.weapon.setup) { ctx.fillStyle = '#fff'; ctx.fillText(s.setup >= s.def.weapon.setup ? '▣' : '…', ix, 3); }
        ctx.restore();
      }
    }
  }
  bar(cx, y, w, h, frac, col, pulse = false) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(cx - w / 2 - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = col; if (pulse) ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.time * 10);
    ctx.fillRect(cx - w / 2, y, w * clamp(frac, 0, 1), h); ctx.globalAlpha = 1;
  }

  drawProjectiles(inView) {
    const { ctx } = this;
    for (const p of this.world.projectiles) {
      if (!inView(p.x, p.y)) continue;
      if (!this.visibleAt(p.x, p.y)) continue;
      const col = this.colors(p.faction, p.owner).fill;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 5, 3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = col; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(p.x, p.y - p.z, p.arc ? 5 : 3.5, 0, TAU); ctx.fill(); ctx.stroke();
      if (p.arc) { ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(p.tx, p.ty, p.splash, 0, TAU); ctx.stroke(); }
    }
  }

  drawEffects(dt, inView) {
    const { ctx } = this;
    const keep = [];
    for (const e of this.effects) {
      e.t += dt;
      if (e.t < 0) { keep.push(e); continue; }
      const k = e.t / e.dur;
      if (k >= 1) continue;
      keep.push(e);
      if (!inView(e.x, e.y, 120)) continue;
      switch (e.type) {
        case 'tracer': ctx.strokeStyle = e.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = e.wide ? 2.5 : 1.2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.tx, e.ty); ctx.stroke(); ctx.globalAlpha = 1; break;
        case 'slash': ctx.strokeStyle = e.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 6 + k * 6, k * 3, k * 3 + 1.5); ctx.stroke(); ctx.globalAlpha = 1; break;
        case 'spark': ctx.fillStyle = '#fff'; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(e.x, e.y, 2 + k * 4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; break;
        case 'shield': ctx.strokeStyle = '#a6fff0'; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 8 + k * 6, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; break;
        case 'explosion': {
          ctx.globalAlpha = (1 - k) * 0.8;
          const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * (0.4 + k * 0.8));
          g.addColorStop(0, '#fff8e0'); g.addColorStop(0.35, '#ffb347'); g.addColorStop(1, 'rgba(60,20,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.4 + k * 0.8), 0, TAU); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * k * 1.3, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 1; break;
        }
        case 'shards': {
          ctx.fillStyle = e.col; ctx.globalAlpha = 1 - k;
          for (let i = 0; i < 4; i++) {
            const a = e.seed * TAU + (i * TAU) / 4, d = k * 22;
            const x = e.x + Math.cos(a) * d, y = e.y + Math.sin(a) * d - Math.sin(k * Math.PI) * 10;
            ctx.save(); ctx.translate(x, y); ctx.rotate(a + k * 6);
            const r = e.r * 0.45;
            if (e.shape === 'debris' || e.shape === 'square' || e.shape === 'tank') ctx.fillRect(-r, -r, r * 2, r * 2);
            else if (e.shape === 'circle' || e.shape === 'ring' || e.shape === 'halo' || e.shape === 'lens') { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); }
            else { ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r, r); ctx.lineTo(-r, -r); ctx.closePath(); ctx.fill(); }
            ctx.restore();
          }
          ctx.globalAlpha = 1; break;
        }
        case 'marker': ctx.strokeStyle = e.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 6 + k * 18, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; break;
        case 'ring': ctx.strokeStyle = e.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.3 + k * 0.9), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; break;
        case 'text': {
          ctx.save(); ctx.translate(e.x, e.y - 24 - k * 18); const s = 1 / Math.max(0.6, this.camera.zoom); ctx.scale(s, s);
          ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.globalAlpha = 1 - k * k; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(e.text, 0, 0); ctx.fillStyle = e.col; ctx.fillText(e.text, 0, 0);
          ctx.restore(); break;
        }
        default: break;
      }
    }
    this.effects = keep;
  }

  cellsPath(cells) {
    const { ctx } = this, g = this.world.grid;
    ctx.beginPath();
    for (const i of cells) { const o = i * 12; for (let k = 0; k < 6; k++) { const x = g.corner[o + k * 2], y = g.corner[o + k * 2 + 1]; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); }
  }
  drawKnownGhosts(inView, state) {
    const { ctx, world } = this;
    const p = world.players[this.viewer];
    for (const k of p.known.values()) {
      if (!inView(k.x, k.y, 96)) continue;
      if (this.visibleAt(k.x, k.y)) continue; // real one is drawn
      const col = this.colors(k.faction, k.owner);
      const def = FACTIONS[k.faction].buildings[k.key];
      ctx.globalAlpha = 0.45;
      drawBuilding(ctx, k.faction, def, k.x, k.y, k.radius * 2, k.radius * 2, { ...col, fill: col.fill, stroke: '#000' }, {});
      ctx.globalAlpha = 1;
    }
  }

  drawBuildGhost(g) {
    const { ctx, world } = this;
    const def = g.key ? FACTIONS[this.viewerFaction].buildings[g.key] : null;
    // build radius hints
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
    for (const b of world.buildings) {
      if (b.owner !== this.viewer || b.dead || !b.done) continue;
      const r = (b.def.hq ? 11 : b.def.buildRadius || 4.5) * TILE;
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.stroke();
    }
    ctx.setLineDash([]);
    if (!def) return; // no structure chosen yet: radius hints only
    if (def.onOre) { ctx.strokeStyle = '#ffe680'; ctx.lineWidth = 2; for (const o of world.ore) if (!o.building && world.explored(this.viewer, o.cell)) { ctx.beginPath(); ctx.arc(o.x, o.y, TILE * 0.7 + Math.sin(this.time * 6) * 2, 0, TAU); ctx.stroke(); } }
    if (def.onPoint) { ctx.strokeStyle = '#ffe680'; ctx.lineWidth = 2; for (const p of world.points) if (p.owner === this.viewer && !p.outpost) { ctx.beginPath(); ctx.arc(p.x, p.y, TILE * 1.1 + Math.sin(this.time * 6) * 2, 0, TAU); ctx.stroke(); } }
    if (g.cell === undefined || g.cell < 0) return;
    const cells = world.footprint(def, g.cell);
    const [gx, gy] = world.grid.center(g.cell);
    const R = (def.w >= 2 ? world.grid.R * 2.3 : world.grid.R * 0.95) * 2;
    ctx.fillStyle = g.ok ? 'rgba(90,255,140,0.3)' : 'rgba(255,80,80,0.35)';
    ctx.strokeStyle = g.ok ? '#7CFC9A' : '#ff5f5f'; ctx.lineWidth = 2;
    this.cellsPath(cells); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 0.7;
    drawBuilding(ctx, this.viewerFaction, def, gx, gy, R, R, this.colors(this.viewerFaction, this.viewer), {});
    ctx.globalAlpha = 1;
  }
  drawRally(b) {
    if (!b.rally) return;
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.rally.x, b.rally.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#fff'; ctx.fillRect(b.rally.x - 1, b.rally.y - 14, 2, 14);
    ctx.beginPath(); ctx.moveTo(b.rally.x + 1, b.rally.y - 14); ctx.lineTo(b.rally.x + 11, b.rally.y - 10); ctx.lineTo(b.rally.x + 1, b.rally.y - 6); ctx.closePath(); ctx.fill();
  }
}
