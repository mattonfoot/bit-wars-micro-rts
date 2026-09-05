// Game controller: bootstraps a battle, runs the fixed-step loop, translates gestures into commands.
import { generateMap } from './map/generator.js';
import { World, TICK } from './game/world.js';
import { AI } from './game/ai.js';
import { FACTIONS, FACTION_KEYS } from './game/data.js';
import { TILE } from './map/terrain.js';
import { Camera } from './engine/camera.js';
import { Input } from './engine/input.js';
import { Audio } from './engine/audio.js';
import { Renderer } from './render/renderer.js';
import { Minimap } from './ui/minimap.js';
import { HUD } from './ui/hud.js';
import { Menu } from './ui/menu.js';
import { dist, clamp } from './engine/math.js';

const MODE_LABELS = { move: 'MOVE: tap a destination', amove: 'ATTACK-MOVE: tap a destination', build: 'BUILD: choose a structure', rally: 'RALLY: tap a point', attach: 'ATTACH: tap a squad', box: 'BOX SELECT: drag over units' };

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.camera = new Camera();
    this.audio = new Audio();
    this.viewer = 0;
    this.selection = new Set();
    this.mode = 'normal';
    this.buildGhost = null;
    this.box = null;
    this.paused = false; this.running = false;
    this.lastAlert = null; this.lastAlertTime = -99;
    this.menu = new Menu(document.getElementById('menu'), document.getElementById('pause'), document.getElementById('gameover'), (s) => this.start(s));
    this.hud = new HUD(this);
    this.input = new Input(this.canvas, {
      tap: (x, y, e) => this.onTap(x, y, e), doubleTap: (x, y) => this.onDoubleTap(x, y), longPress: (x, y) => this.onLongPress(x, y),
      dragStart: (x, y, d) => this.onDragStart(x, y, d), drag: (x, y, dx, dy, d, p) => this.onDrag(x, y, d, p), dragEnd: (x, y, d, c) => this.onDragEnd(x, y, d, c),
      pinch: (k, cx, cy, dx, dy) => { if (!this.running) return; this.camera.zoomAt(k, cx, cy); this.camera.pan(dx, dy); },
      wheel: (dy, x, y) => { if (this.running) this.camera.zoomAt(dy > 0 ? 0.88 : 1.14, x, y); },
      rightClick: (x, y) => this.onCommandTap(x, y, true),
      hover: (x, y) => this.onHover(x, y),
    });
    const mm = this.hud.minimapCanvas;
    const mmHandler = (e) => { if (!this.running) return; e.preventDefault(); const r = mm.getBoundingClientRect(); const [wx, wy] = this.minimap.toWorld(e.clientX - r.left, e.clientY - r.top); this.camera.centerOn(wx, wy); };
    mm.addEventListener('pointerdown', (e) => { mm.setPointerCapture(e.pointerId); mmHandler(e); this.mmDrag = true; });
    mm.addEventListener('pointermove', (e) => { if (this.mmDrag) mmHandler(e); });
    mm.addEventListener('pointerup', () => { this.mmDrag = false; });
    mm.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 300));
    window.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.running && !this.paused) this.openPause(); });
    for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', (e) => { if (e.scale && e.scale !== 1) e.preventDefault(); }, { passive: false });
    const unlock = () => { this.audio.unlock(); };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    this.resize();
    this.keys = new Set();
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
    requestAnimationFrame((t) => this.frame(t));
  }
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr); this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.resize(w, h, dpr);
    this.minimap?.resize();
    if (this.minimap) this.minimap.dirty = true;
  }

  // ---------- lifecycle
  start(settings) {
    this.settings = settings;
    const enemyFaction = FACTION_KEYS[Math.floor(Math.random() * 3)];
    this.map = generateMap({ size: +settings.size || 64, theme: settings.theme, seed: settings.seed });
    this.world = new World(this.map, [{ faction: settings.faction, name: 'You' }, { faction: enemyFaction, ai: settings.difficulty, name: 'Enemy' }], { seed: settings.seed + ':' + Date.now() });
    this.ai = new AI(this.world, 1, settings.difficulty);
    this.renderer = new Renderer(this.canvas, this.world, this.camera, this.viewer);
    this.minimap = new Minimap(this.hud.minimapCanvas, this.world, this.renderer, this.viewer);
    this.camera.setWorld(this.map.w * TILE, this.map.h * TILE);
    this.camera.zoom = window.innerWidth < 700 ? 1.0 : 1.2;
    const hq = this.world.byId(this.world.players[0].hqId);
    this.camera.centerOn(hq.x + 60, hq.y + 60);
    this.selection.clear(); this.mode = 'normal'; this.buildGhost = null; this.box = null;
    this.hud.setMode(null); this.hud.clearToasts();
    this.menu.hide(); this.hud.show();
    this.running = true; this.paused = false; this.acc = 0; this.last = performance.now(); this.overShown = false;
    this.select([hq.id]);
    const themeName = this.map.name;
    this.hud.toast(`${themeName} · vs ${FACTIONS[enemyFaction].name} (${settings.difficulty})`, '');
    setTimeout(() => this.hud.toast('Capture strategic points to earn Flux. Build an extractor on an ore vein.', 'good'), 2500);
    if (window.innerHeight > window.innerWidth) setTimeout(() => this.hud.toast('Tip: rotate to landscape for a wider view', ''), 5000);
    this.audio.play('ui');
    try { localStorage.setItem('bw_last', JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }
  quit() { this.running = false; this.hud.hide(); this.menu.show(); }
  openPause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.menu.showPause({
      muted: this.audio.muted,
      resume: () => { this.paused = false; this.last = performance.now(); },
      toggleSound: () => this.toggleSound(),
      restart: () => { this.paused = false; this.start(this.settings); },
      quit: () => { this.paused = false; this.quit(); },
    });
  }
  toggleSound() { this.audio.setMuted(!this.audio.muted); document.getElementById('btnSound').textContent = this.audio.muted ? '🔇' : '🔊'; return this.audio.muted; }

  // ---------- loop
  frame(t) {
    requestAnimationFrame((tt) => this.frame(tt));
    if (!this.running) return;
    const dtReal = Math.min(0.1, (t - this.last) / 1000); this.last = t;
    if (!this.paused && !this.world.gameOver) {
      this.acc += dtReal;
      let steps = 0;
      while (this.acc >= TICK && steps < 6) {
        this.world.tick(TICK); this.ai.update(TICK);
        this.acc -= TICK; steps++;
      }
      if (steps === 6) this.acc = 0;
    } else if (this.world.gameOver && !this.paused) {
      // keep effects animating; sim frozen
    }
    this.handleEvents();
    this.keyboardPan(dtReal);
    // dirty terrain
    if (this.world.dirtyTiles.length) { for (const i of this.world.dirtyTiles) this.renderer.terrain.redrawTile(i); this.world.dirtyTiles.length = 0; this.minimap.dirty = true; }
    this.renderer.fog.update(this.world.players[this.viewer].vision, Math.floor(this.world.ticks / 6));
    this.pruneSelection();
    this.renderer.draw({ selected: this.selection, buildGhost: this.mode === 'build' ? this.buildGhost : null, box: this.box, rallyFor: this.selectedBuildings()[0] }, dtReal);
    this.minimap.draw(this.camera, dtReal);
    this.hud.update(dtReal);
    if (this.world.gameOver && !this.overShown) {
      this.overShown = true;
      const won = this.world.winner === this.viewer;
      this.audio.play(won ? 'victory' : 'defeat');
      setTimeout(() => this.menu.showGameOver({ won, time: this.world.time, me: this.world.players[0].stats, enemy: this.world.players[1].stats, handlers: { restart: () => this.start(this.settings), quit: () => this.quit() } }), 1800);
    }
  }
  handleEvents() {
    const ev = this.world.events;
    if (!ev.length) return;
    this.renderer.processEvents(ev);
    for (const e of ev) {
      switch (e.type) {
        case 'sound': if (this.onScreen(e.x, e.y) && this.renderer.visibleAt(e.x, e.y)) this.audio.play(e.name, 0.8); break;
        case 'launch': if (this.onScreen(e.x, e.y)) this.audio.play('launch'); break;
        case 'death': if (this.onScreen(e.x, e.y) && this.renderer.visibleAt(e.x, e.y)) this.audio.play('death'); break;
        case 'shieldHit': if (this.onScreen(e.x, e.y)) this.audio.play('shield'); break;
        case 'broken': if (e.owner === this.viewer) { this.audio.play('broken'); this.hud.toast('Squad broken! Retreat it to recover.', 'bad', () => this.centerOn(e.x, e.y), 4000); } break;
        case 'captured': this.audio.play(e.owner === this.viewer ? 'captured' : 'lost'); this.hud.toast(e.owner === this.viewer ? 'Strategic point captured' : 'Enemy captured a point', e.owner === this.viewer ? 'good' : 'bad', () => this.centerOn(e.x, e.y)); break;
        case 'lostPoint': if (e.owner === this.viewer) { this.audio.play('lost'); this.hud.toast('Losing a strategic point!', 'bad', () => this.centerOn(e.x, e.y), 3000); } break;
        case 'underAttack':
          if (e.owner === this.viewer && this.world.time - this.lastAlertTime > 8) {
            this.lastAlertTime = this.world.time; this.lastAlert = { x: e.x, y: e.y };
            this.audio.play('alarm'); this.minimap.alert(e.x, e.y);
            this.hud.toast('Structure under attack! (tap to view)', 'bad', () => this.centerOn(e.x, e.y));
          }
          break;
        case 'buildingDestroyed':
          this.audio.play('destroyed'); this.minimap.dirty = true;
          if (e.owner === this.viewer) this.hud.toast(`${FACTIONS[e.faction].buildings[e.key].name} destroyed!`, 'bad', () => this.centerOn(e.x, e.y));
          else this.hud.toast(`Enemy ${FACTIONS[e.faction].buildings[e.key].name} destroyed`, 'good');
          break;
        case 'built': if (e.owner === this.viewer) this.audio.play('built'); break;
        case 'spawn': if (e.owner === this.viewer) this.audio.play('spawn'); break;
        case 'heroDown': if (e.owner === this.viewer) this.hud.toast('Your hero has fallen. Retrain at HQ.', 'bad'); break;
        case 'upgrade': if (e.owner === this.viewer) this.hud.toast('Upgrade complete: all squads improved', 'good'); break;
        case 'terrainDestroyed': this.minimap.dirty = true; break;
        case 'squadDied': if (e.owner === this.viewer) this.hud.toast(`${FACTIONS[this.world.players[e.owner].faction].units[e.key].name} wiped out`, 'bad', () => this.centerOn(e.x, e.y), 1500); break;
        default: break;
      }
    }
    ev.length = 0;
  }
  onScreen(x, y) { const r = this.camera.visibleRect(); return x > r.x0 - 100 && x < r.x1 + 100 && y > r.y0 - 100 && y < r.y1 + 100; }
  keyboardPan(dt) {
    if (!this.keys.size) return;
    const v = 700 * dt;
    if (this.keys.has('ArrowLeft') || this.keys.has('a') && false) this.camera.pan(v, 0);
    if (this.keys.has('ArrowRight')) this.camera.pan(-v, 0);
    if (this.keys.has('ArrowUp')) this.camera.pan(0, v);
    if (this.keys.has('ArrowDown')) this.camera.pan(0, -v);
  }

  // ---------- selection helpers
  pruneSelection() { for (const id of [...this.selection]) { const e = this.world.byId(id); if (!e || e.dead) this.selection.delete(id); } }
  select(ids, additive = false) {
    if (!additive) this.selection.clear();
    for (const id of ids) this.selection.add(id);
    if (ids.length) this.audio.play('select');
    if (this.mode !== 'build' && this.mode !== 'box') this.setMode('normal', true);
  }
  selectedSquads() { return [...this.selection].map((id) => this.world.byId(id)).filter((e) => e && e.kind === 'squad' && e.owner === this.viewer); }
  selectedBuildings() { return [...this.selection].map((id) => this.world.byId(id)).filter((e) => e && e.kind === 'building' && e.owner === this.viewer); }
  selectedEnemy() { return [...this.selection].map((id) => this.world.byId(id)).find((e) => e && e.owner !== this.viewer) || null; }
  selectAllArmy() { const ids = this.world.playerSquads(this.viewer).map((s) => s.id); if (ids.length) { this.select(ids); this.hud.toast(`${ids.length} squads selected`, ''); } }
  centerOn(x, y) { this.camera.centerOn(x, y); }
  setMode(mode, quiet = false) {
    this.mode = mode;
    if (mode !== 'build') this.buildGhost = null;
    this.hud.setMode(MODE_LABELS[mode] || null);
    if (!quiet) this.audio.play('ui');
    if (mode === 'build') this.buildGhost = { key: null };
  }

  // ---------- hit testing
  worldAt(sx, sy) { return this.camera.screenToWorld(sx, sy); }
  entityAt(wx, wy, wantOwn = null) {
    const w = this.world, z = this.camera.zoom;
    const slack = 14 / z;
    let best = null, bd = Infinity;
    for (const s of w.squads) {
      if (s.dead) continue;
      if (wantOwn === true && s.owner !== this.viewer) continue;
      if (wantOwn === false && s.owner === this.viewer) continue;
      if (s.owner !== this.viewer && !this.renderer.visibleAt(s.x, s.y)) continue;
      for (const m of s.members) {
        const d = dist(wx, wy, m.px, m.py) - (s.def.radius + slack);
        if (d < 0 && d < bd) { bd = d; best = s; }
      }
      const dc = dist(wx, wy, s.x, s.y) - w.formationRadius(s) * 0.6;
      if (dc < 0 && dc - 4 < bd) { bd = dc - 4; best = s; }
    }
    if (best) return best;
    for (const b of w.buildings) {
      if (b.dead) continue;
      if (wantOwn === true && b.owner !== this.viewer) continue;
      if (wantOwn === false && b.owner === this.viewer) continue;
      if (b.owner !== this.viewer && !this.renderer.visibleAt(b.x, b.y)) continue;
      if (wx >= b.tx * TILE - slack && wx <= (b.tx + b.w) * TILE + slack && wy >= b.ty * TILE - slack && wy <= (b.ty + b.h) * TILE + slack) return b;
    }
    return null;
  }

  // ---------- gestures
  onTap(sx, sy, e) {
    if (!this.running || this.paused) return;
    const isMouse = e?.pointerType === 'mouse';
    const [wx, wy] = this.worldAt(sx, sy);
    switch (this.mode) {
      case 'build': this.placeGhost(wx, wy, true); return;
      case 'rally': { const b = this.selectedBuildings()[0]; if (b) { this.world.cmdRally(b, wx, wy); this.audio.play('order'); this.hud.toast('Rally point set', ''); } this.setMode('normal'); return; }
      case 'move': { const sq = this.selectedSquads(); if (sq.length) { this.world.cmdMove(sq, wx, wy); this.audio.play('order'); } this.setMode('normal', true); return; }
      case 'amove': {
        const sq = this.selectedSquads();
        const hit = this.entityAt(wx, wy, false);
        if (sq.length) { if (hit) this.world.cmdAttack(sq, hit); else this.world.cmdAttackMove(sq, wx, wy); this.audio.play('order'); }
        this.setMode('normal', true); return;
      }
      case 'attach': {
        const hero = this.selectedSquads().find((s) => s.def.hero);
        const t = this.entityAt(wx, wy, true);
        if (hero && t && t.kind === 'squad' && t !== hero) { if (this.world.cmdAttach(hero, t)) { this.audio.play('order'); this.hud.toast(`${hero.def.name} joining ${t.def.name}`, 'good'); } else this.hud.toast('Cannot attach to that squad', 'bad'); }
        this.setMode('normal', true); return;
      }
      default: break;
    }
    if (this.mode === 'box') this.setMode('normal', true);
    if (isMouse) { this.selectTap(wx, wy, e.shiftKey); return; }
    // touch: smart tap
    const hit = this.entityAt(wx, wy);
    const sq = this.selectedSquads();
    if (hit && hit.owner === this.viewer) { this.select([hit.id], e?.shiftKey); return; }
    if (hit && sq.length) { this.world.cmdAttack(sq, hit); this.audio.play('order'); return; }
    if (hit) { this.select([hit.id]); return; }
    if (sq.length) { this.world.cmdMove(sq, wx, wy); this.audio.play('order'); return; }
    if (this.selection.size) this.select([]);
  }
  selectTap(wx, wy, additive) {
    const hit = this.entityAt(wx, wy);
    if (hit) this.select([hit.id], additive && hit.owner === this.viewer);
    else if (this.selection.size) this.select([]);
  }
  onCommandTap(sx, sy) {
    // right-click (mouse): smart command
    if (!this.running || this.paused) return;
    const [wx, wy] = this.worldAt(sx, sy);
    if (this.mode === 'build') { this.setMode('normal'); return; }
    const sq = this.selectedSquads();
    const bl = this.selectedBuildings();
    const hit = this.entityAt(wx, wy);
    if (sq.length) {
      if (hit && hit.owner !== this.viewer) this.world.cmdAttack(sq, hit);
      else if (hit && hit.kind === 'squad' && sq.length === 1 && sq[0].def.hero && hit !== sq[0]) { this.world.cmdAttach(sq[0], hit); }
      else this.world.cmdMove(sq, wx, wy);
      this.audio.play('order');
    } else if (bl.length === 1 && bl[0].def.trains) { this.world.cmdRally(bl[0], wx, wy); this.audio.play('order'); }
  }
  onDoubleTap(sx, sy) {
    if (!this.running || this.paused) return;
    const [wx, wy] = this.worldAt(sx, sy);
    const hit = this.entityAt(wx, wy, true);
    if (hit && hit.kind === 'squad') {
      const r = this.camera.visibleRect();
      const ids = this.world.playerSquads(this.viewer).filter((s) => s.key === hit.key && s.x > r.x0 && s.x < r.x1 && s.y > r.y0 && s.y < r.y1).map((s) => s.id);
      this.select(ids);
    } else if (hit && hit.kind === 'building') this.centerOn(hit.x, hit.y);
  }
  onLongPress(sx, sy) {
    if (!this.running || this.paused) return;
    const [wx, wy] = this.worldAt(sx, sy);
    if (this.mode === 'build') { this.placeGhost(wx, wy, true); return; }
    const sq = this.selectedSquads();
    if (sq.length) {
      const hit = this.entityAt(wx, wy, false);
      if (hit) this.world.cmdAttack(sq, hit); else this.world.cmdAttackMove(sq, wx, wy);
      this.audio.play('order');
      if (navigator.vibrate) navigator.vibrate(15);
    } else {
      const hit = this.entityAt(wx, wy, true);
      if (hit && hit.kind === 'squad') this.onDoubleTap(sx, sy);
    }
  }
  onDragStart(sx, sy, d) {
    if (!this.running) return;
    const boxing = this.mode === 'box' || (d.type === 'mouse' && d.button === 0);
    d.boxing = boxing;
    if (boxing) this.box = { x0: sx, y0: sy, x1: sx, y1: sy };
  }
  onDrag(sx, sy, d, p) {
    if (!this.running) return;
    if (d.boxing) { this.box.x1 = sx; this.box.y1 = sy; return; }
    const px = p.px ?? p.sx, py = p.py ?? p.sy;
    this.camera.pan(sx - px, sy - py);
  }
  onDragEnd(sx, sy, d, cancelled) {
    if (!this.running) return;
    if (d.boxing && this.box && !cancelled) {
      const b = this.box;
      const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
      const [wx0, wy0] = this.worldAt(x0, y0), [wx1, wy1] = this.worldAt(x1, y1);
      const ids = this.world.playerSquads(this.viewer).filter((s) => s.x >= wx0 && s.x <= wx1 && s.y >= wy0 && s.y <= wy1).map((s) => s.id);
      if (ids.length) this.select(ids, d.shift);
      else if (x1 - x0 < 6 && y1 - y0 < 6) { /* tiny box = nothing */ }
      if (this.mode === 'box') this.setMode('normal', true);
    }
    this.box = null;
  }
  onHover(sx, sy) { if (this.running && this.mode === 'build' && this.buildGhost?.key) this.placeGhost(...this.worldAt(sx, sy), false); }
  onKey(e) {
    if (!this.running) return;
    this.keys.add(e.key);
    if (e.key === 'Escape') { if (this.mode !== 'normal') this.setMode('normal'); else if (this.paused) { this.menu.hidePause(); this.paused = false; this.last = performance.now(); } else this.select([]); }
    if (this.paused) return;
    const k = e.key.toLowerCase();
    if (k === 'a') this.setMode(this.selectedSquads().length ? 'amove' : 'normal');
    if (k === 'm') this.setMode(this.selectedSquads().length ? 'move' : 'normal');
    if (k === 'h') this.doHold();
    if (k === 's') this.doStop();
    if (k === 'r') this.doRetreat();
    if (k === 'b') this.setMode(this.mode === 'build' ? 'normal' : 'build');
    if (k === 'e') this.doReinforce();
    if (k === 'f') this.selectAllArmy();
    if (k === 'p') this.openPause();
    if (k === '+' || k === '=') this.camera.zoomAt(1.2, this.camera.viewW / 2, this.camera.viewH / 2);
    if (k === '-') this.camera.zoomAt(0.83, this.camera.viewW / 2, this.camera.viewH / 2);
    if (e.key === ' ') { e.preventDefault(); if (this.lastAlert) this.centerOn(this.lastAlert.x, this.lastAlert.y); else { const hq = this.world.byId(this.world.players[0].hqId); if (hq) this.centerOn(hq.x, hq.y); } }
    if (/^[1-9]$/.test(e.key)) { const sq = this.world.playerSquads(this.viewer); const s = sq[+e.key - 1]; if (s) { if (this.selection.size === 1 && this.selection.has(s.id)) this.centerOn(s.x, s.y); else this.select([s.id]); } }
    if (k === 'd' && e.shiftKey) { this.renderer.showFog = !this.renderer.showFog; }
  }

  // ---------- commands
  doHold() { const sq = this.selectedSquads(); if (sq.length) { this.world.cmdHold(sq); this.audio.play('order'); } }
  doStop() { const sq = this.selectedSquads(); if (sq.length) { this.world.cmdStop(sq); this.audio.play('order'); } this.setMode('normal', true); }
  doRetreat() { const sq = this.selectedSquads(); if (sq.length) { this.world.cmdRetreat(sq); this.audio.play('order'); this.hud.toast('Falling back', ''); } }
  doReinforce() {
    let n = 0;
    for (const s of this.selectedSquads()) n += this.world.cmdReinforce(s, 1);
    if (n) this.audio.play('ui'); else this.hud.toast('Cannot reinforce (full squad or no resources)', 'bad', null, 1000);
  }
  doDetach() { const s = this.selectedSquads().find((x) => x.hero); if (s) { const h = this.world.cmdDetach(s); if (h) { this.select([h.id]); this.audio.play('ui'); } } }
  doTrain(b, key) {
    const r = this.world.cmdTrain(b, key);
    if (r.ok) this.audio.play('ui'); else this.hud.toast(r.reason, 'bad', null, 800);
  }
  doCancelTrain(b) { if (b.queue.length) { this.world.cmdCancelTrain(b, b.queue.length - 1); this.audio.play('ui'); } }
  doCancelBuilding(b) {
    if (b.def.hq) { this.hud.toast('You cannot demolish your HQ', 'bad'); return; }
    this.world.cmdCancelBuilding(b); this.selection.delete(b.id); this.audio.play('ui'); this.minimap.dirty = true;
  }
  startBuild(key) {
    this.buildGhost = { key };
    const def = FACTIONS[this.world.players[this.viewer].faction].buildings[key];
    this.hud.setMode(def.onOre ? 'BUILD: tap an ore vein' : def.onPoint ? 'BUILD: tap a captured point' : `BUILD: tap where to place ${def.name}`);
    this.audio.play('ui');
  }
  placeGhost(wx, wy, confirmIfSame) {
    const g = this.buildGhost; if (!g?.key) return;
    const def = FACTIONS[this.world.players[this.viewer].faction].buildings[g.key];
    let tx = Math.floor(wx / TILE) - Math.floor(def.w / 2) + (def.w === 2 ? 1 : 0), ty = Math.floor(wy / TILE) - Math.floor(def.h / 2) + (def.h === 2 ? 1 : 0);
    if (def.w === 2) tx = Math.round(wx / TILE) - 1; if (def.h === 2) ty = Math.round(wy / TILE) - 1;
    if (def.onOre) { const o = this.world.ore.filter((o) => dist(o.x, o.y, wx, wy) < TILE * 2.5).sort((a, b) => dist(a.x, a.y, wx, wy) - dist(b.x, b.y, wx, wy))[0]; if (o) { tx = o.tx; ty = o.ty; } }
    if (def.onPoint) { const p = this.world.points.filter((p) => dist(p.x, p.y, wx, wy) < TILE * 3).sort((a, b) => dist(a.x, a.y, wx, wy) - dist(b.x, b.y, wx, wy))[0]; if (p) { tx = p.tx; ty = p.ty; } }
    tx = clamp(tx, 0, this.world.w - def.w); ty = clamp(ty, 0, this.world.h - def.h);
    const same = g.tx === tx && g.ty === ty;
    const chk = this.world.canPlace(this.viewer, g.key, tx, ty);
    g.tx = tx; g.ty = ty; g.ok = chk.ok; g.reason = chk.reason;
    if (confirmIfSame && same && chk.ok) this.confirmBuild();
    else if (confirmIfSame && !chk.ok) this.hud.toast(chk.reason, 'bad', null, 800);
  }
  confirmBuild() {
    const g = this.buildGhost; if (!g?.key || g.tx === undefined) return;
    const r = this.world.cmdBuild(this.viewer, g.key, g.tx, g.ty);
    if (r.ok) { this.audio.play('built'); this.minimap.dirty = true; const def = r.building.def; if (def.onOre || def.onPoint) this.buildGhost = { key: g.key }; else this.setMode('normal', true); }
    else this.hud.toast(r.reason, 'bad');
  }
}

window.addEventListener('load', () => {
  window.game = new Game();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
});
