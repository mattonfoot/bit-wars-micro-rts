// In-game HUD (DOM): resources, squad strip, selection info, contextual command card, toasts.
import { FACTIONS, POP_CAP, reinforceCost, ARMOR_LABEL, DMG_LABEL } from '../game/data.js';
import { unitIconSVG, buildingIconSVG } from '../render/shapes.js';
import { COVER_NAME } from '../game/combat.js';

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor(game) {
    this.g = game;
    this.root = $('hud');
    this.el = { ore: $('oreVal'), oreInc: $('oreInc'), flux: $('fluxVal'), fluxInc: $('fluxInc'), pop: $('popVal'), pts: $('ptsVal'), timer: $('timer'), squadbar: $('squadbar'), info: $('info'), cmd: $('cmd'), toasts: $('toasts'), mode: $('modeBanner'), obj: $('objectives') };
    this.el.obj.onclick = () => this.el.obj.classList.toggle('collapsed');
    this.minimapCanvas = $('minimap');
    this.acc = 0; this.squadKey = ''; this.cmdKey = '';
    $('btnMenu').onclick = () => game.openPause();
    $('btnSound').onclick = (e) => { const m = game.toggleSound(); e.target.textContent = m ? '🔇' : '🔊'; };
    $('btnSound').textContent = game.audio.muted ? '🔇' : '🔊';
    this.lastToast = new Map();
  }
  show() { this.root.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); }
  clearToasts() { this.el.toasts.innerHTML = ''; this.lastToast.clear(); }
  setMode(label) { this.el.mode.textContent = label || ''; this.el.mode.classList.toggle('show', !!label); }
  toast(text, kind = '', onClick = null, throttleMs = 0, durationMs = 3000) {
    if (throttleMs) { const t = performance.now(); if ((this.lastToast.get(text) || 0) + throttleMs > t) return; this.lastToast.set(text, t); }
    const d = document.createElement('div');
    d.className = 'toast ' + kind; d.textContent = text;
    d.style.animationDuration = durationMs + 'ms';
    if (onClick) { d.style.pointerEvents = 'auto'; d.onclick = onClick; }
    this.el.toasts.appendChild(d);
    while (this.el.toasts.children.length > 4) this.el.toasts.firstChild.remove();
    setTimeout(() => d.remove(), durationMs);
  }
  /** Campaign objectives panel. Pass null to hide. */
  setObjectives(list, title = '', stage = 0, stages = 1) {
    const el = this.el.obj;
    if (!list) { el.classList.add('hidden'); el.innerHTML = ''; this.objKey = ''; return; }
    el.classList.remove('hidden');
    const key = JSON.stringify([title, stage, list.map((o) => [o.id, o.cur, o.done, o.holding])]);
    if (key === this.objKey) return;
    this.objKey = key;
    el.innerHTML = `<div class="objhead">${title} · ${stage + 1}/${stages}</div>` + list.map((o) => {
      const prog = o.target > 1 ? ` <span class="prog">${o.cur}/${o.target}</span>` : '';
      const cls = (o.done ? 'done' : '') + (o.optional ? ' opt' : '') + (o.constraint && !o.done ? ' fail' : '') + (o.holding === false && o.target > 1 && !o.done ? ' warn' : '');
      return `<div class="obj ${cls}" title="${o.hint || ''}">${o.done ? '✓' : o.constraint ? '⚑' : '○'} ${o.text}${prog}</div>`;
    }).join('');
  }
  update(dt) {
    this.acc += dt;
    if (this.acc < 0.1) return;
    this.acc = 0;
    const g = this.g, w = g.world, p = w.players[g.viewer];
    this.el.ore.textContent = Math.floor(p.ore);
    this.el.oreInc.textContent = ` +${(p.oreIncome * 60).toFixed(0)}/m`;
    this.el.flux.textContent = Math.floor(p.flux);
    this.el.fluxInc.textContent = ` +${(p.fluxIncome * 60).toFixed(0)}/m`;
    this.el.pop.textContent = `${p.pop}/${POP_CAP}`;
    this.el.pop.classList.toggle('full', p.pop >= POP_CAP - 2);
    const t = Math.floor(w.time);
    this.el.timer.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    // points
    const ptsKey = w.points.map((pt) => pt.owner).join(',');
    if (this.ptsKey !== ptsKey) {
      this.ptsKey = ptsKey;
      this.el.pts.innerHTML = w.points.map((pt) => `<i style="background:${pt.owner < 0 ? '#666' : g.renderer.ownerColor(pt.owner)}"></i>`).join('');
    }
    this.updateSquadBar();
    this.updateInfo();
    this.updateCmd();
  }
  updateSquadBar() {
    const g = this.g, w = g.world;
    const squads = w.playerSquads(g.viewer);
    const key = squads.map((s) => s.id).join(',');
    if (key !== this.squadKey) {
      this.squadKey = key;
      const bar = this.el.squadbar; bar.innerHTML = '';
      const all = document.createElement('div'); all.className = 'sq all'; all.textContent = 'ALL'; all.title = 'Select whole army';
      all.onclick = () => g.selectAllArmy();
      bar.appendChild(all);
      for (const s of squads) {
        const d = document.createElement('div'); d.className = 'sq'; d.dataset.id = s.id;
        const f = FACTIONS[s.faction];
        d.innerHTML = `${unitIconSVG(s.faction, s.def.shape, f.color, 22)}<div class="n"></div><div class="hp"><i></i></div>${s.def.hero ? '<span class="hero">★</span>' : ''}`;
        d.onclick = () => {
          if (g.selection.size === 1 && g.selection.has(s.id)) g.centerOn(s.x, s.y);
          else g.select([s.id]);
        };
        bar.appendChild(d);
      }
    }
    for (const d of this.el.squadbar.children) {
      if (!d.dataset.id) continue;
      const s = w.byId(+d.dataset.id); if (!s) continue;
      d.classList.toggle('sel', g.selection.has(s.id));
      d.classList.toggle('broken', s.broken);
      const alive = s.members.filter((m) => !m.hero).length;
      d.querySelector('.n').textContent = s.def.size > 1 ? `${alive}/${s.def.size}` : s.hero ? '★' : '';
      const frac = w.squadHp(s) / Math.max(1, w.squadMaxHp(s));
      const bar = d.querySelector('.hp i'); bar.style.width = (frac * 100).toFixed(0) + '%'; bar.classList.toggle('low', frac < 0.4);
      let heroStar = d.querySelector('.hero');
      if (s.hero && !heroStar) { heroStar = document.createElement('span'); heroStar.className = 'hero'; heroStar.textContent = '★'; d.appendChild(heroStar); }
      if (!s.hero && !s.def.hero && heroStar) heroStar.remove();
    }
  }
  updateInfo() {
    const g = this.g, w = g.world;
    const sq = g.selectedSquads(), bl = g.selectedBuildings();
    const info = this.el.info;
    const enemy = g.selectedEnemy();
    if (!sq.length && !bl.length && !enemy) {
      if (!info.classList.contains('empty')) { info.classList.add('empty'); info.innerHTML = '<div class="body"><span class="role">Tap a squad or structure. Long-press the ground to attack-move.</span></div>'; }
      if (!info.innerHTML) info.innerHTML = '<div class="body"><span class="role">Tap a squad or structure. Long-press the ground to attack-move.</span></div>';
      return;
    }
    info.classList.remove('empty');
    const target = sq[0] || enemy;
    if (target && target.kind === 'squad' && (sq.length <= 1 || !sq.length)) {
      const s = target, d = s.def, f = FACTIONS[s.faction];
      const alive = s.members.filter((m) => !m.hero).length;
      const hp = w.squadHp(s) / Math.max(1, w.squadMaxHp(s));
      const tags = [];
      if (s.broken) tags.push('<span class="tag broken">BROKEN</span>');
      if (s.cover && !d.noCover && w.time - s.lastHit < 6) tags.push(`<span class="tag cover">${COVER_NAME[s.cover]}</span>`);
      if (s.order.type === 'retreat') tags.push('<span class="tag">Retreating</span>');
      if (s.reinforce) tags.push(`<span class="tag">Reinforcing +${s.reinforce}</span>`);
      if (s.hero) tags.push(`<span class="tag">★ ${s.hero.name} attached</span>`);
      if (d.weapon.setup) tags.push(`<span class="tag">${s.setup >= d.weapon.setup ? 'Set up' : 'Setting up…'}</span>`);
      if (s.owner !== g.viewer) tags.push('<span class="tag">Enemy</span>');
      const wpn = `${DMG_LABEL[d.weapon.type]} · rng ${d.weapon.range}`;
      info.innerHTML = `<div class="icon">${unitIconSVG(s.faction, d.shape, f.color, 36)}</div>
        <div class="body"><div class="name">${d.name} <span class="role">· ${d.role}</span></div>
        <div>${d.size > 1 ? `<span class="stat">${alive}/${d.size} members</span>` : ''}<span class="stat">${wpn}</span><span class="stat">${ARMOR_LABEL[d.armor]}</span>${tags.join('')}</div>
        <div class="cw">Strong vs <b>${d.strong}</b> · Weak vs <b>${d.weak}</b></div></div>
        <div class="bars"><div class="bar"><i style="width:${hp * 100}%;background:${s.owner === g.viewer ? '#5cff7a' : '#ff5c5c'}"></i></div><div class="bar"><i style="width:${s.morale}%;background:${s.broken ? '#ff3b3b' : '#ffd166'}"></i></div><div class="cw">HP · Morale</div></div>`;
      return;
    }
    if (sq.length > 1) {
      const counts = {};
      for (const s of sq) counts[s.def.name] = (counts[s.def.name] || 0) + 1;
      const broken = sq.filter((s) => s.broken).length;
      info.innerHTML = `<div class="body"><div class="name">${sq.length} squads selected</div><div class="role">${Object.entries(counts).map(([n, c]) => `${c}× ${n}`).join(', ')}${broken ? ` · <span style="color:#ff6b6b">${broken} broken</span>` : ''}</div></div>`;
      return;
    }
    const b = bl[0] || enemy;
    if (b) {
      const f = FACTIONS[b.faction];
      const q = b.queue.length ? `Training: ${b.queue.map((k) => f.units[k].name).join(', ')}` : '';
      info.innerHTML = `<div class="icon">${buildingIconSVG(b.faction, b.def, f.color, 36)}</div>
        <div class="body"><div class="name">${b.def.name}${b.owner !== g.viewer ? ' <span class="tag">Enemy</span>' : ''}</div><div class="role">${b.done ? b.def.desc : `Under construction ${(b.progress * 100).toFixed(0)}%`}</div><div class="role">${q}</div></div>
        <div class="bars"><div class="bar"><i style="width:${(b.hp / b.maxHp) * 100}%;background:#5cff7a"></i></div>${b.maxShield ? `<div class="bar"><i style="width:${(b.shield / b.maxShield) * 100}%;background:#a6fff0"></i></div>` : ''}<div class="cw">${Math.ceil(b.hp)}/${b.maxHp}</div></div>`;
    }
  }
  btn(html, onClick, cls = '', title = '') {
    const b = document.createElement('button'); b.innerHTML = html; b.className = cls; if (title) b.title = title;
    b.onclick = (e) => { e.stopPropagation(); onClick(); };
    return b;
  }
  updateCmd() {
    const g = this.g, w = g.world, p = w.players[g.viewer], f = FACTIONS[p.faction];
    const sq = g.selectedSquads(), bl = g.selectedBuildings();
    const mode = g.mode;
    const key = `${mode}|${sq.map((s) => s.id).join(',')}|${bl.map((b) => b.id + ':' + b.queue.length + ':' + (b.done ? 1 : 0)).join(',')}|${sq.filter((s) => s.hero).length}|${g.buildGhost?.key || ''}|${g.buildGhost?.cell ?? ''}|${Math.floor(p.ore / 10)}|${Math.floor(p.flux / 10)}|${p.pop}|${p.heroAlive}|${p.heroQueued}`;
    const cmd = this.el.cmd;
    if (key === this.cmdKey) { this.updateCmdProgress(bl); return; }
    this.cmdKey = key;
    cmd.innerHTML = '';
    const can = (c) => p.ore >= c.ore && p.flux >= c.flux;
    const costHtml = (c, ok) => `<span class="cost ${ok ? '' : 'no'}">${c.ore}${c.flux ? '·' + c.flux : ''}</span>`;
    if (mode === 'build') {
      const gh = g.buildGhost;
      for (const b of Object.values(f.buildings)) {
        if (b.hq || !w.allowed(g.viewer, 'building', b.key)) continue;
        const ok = can(b.cost);
        const el = this.btn(`${buildingIconSVG(p.faction, b, f.color, 22)}<span>${b.name}</span>${costHtml(b.cost, ok)}`, () => g.startBuild(b.key), (gh?.key === b.key ? 'on ' : '') + (ok ? '' : 'dis'), b.desc);
        cmd.appendChild(el);
      }
      if (gh?.key && gh.cell !== undefined) cmd.appendChild(this.btn(gh.ok ? '✔ Confirm placement' : '✖ ' + (gh.reason || 'Invalid'), () => g.confirmBuild(), 'wide ' + (gh.ok ? 'on' : 'dis')));
      else if (gh?.key) { const h = document.createElement('div'); h.className = 'hint'; h.textContent = f.buildings[gh.key].onOre ? 'Tap an ore vein' : f.buildings[gh.key].onPoint ? 'Tap a captured strategic point' : 'Tap where to build (near your structures)'; cmd.appendChild(h); }
      cmd.appendChild(this.btn('Cancel', () => g.setMode('normal'), 'wide'));
      return;
    }
    if (sq.length) {
      cmd.appendChild(this.btn('<span class="k">✕</span>Deselect', () => g.select([]), '', 'Clear the selection'));
      cmd.appendChild(this.btn('<span class="k">➜</span>Move', () => g.setMode(mode === 'move' ? 'normal' : 'move'), mode === 'move' ? 'on' : '', 'Next tap: move'));
      cmd.appendChild(this.btn('<span class="k">⚔</span>Attack', () => g.setMode(mode === 'amove' ? 'normal' : 'amove'), mode === 'amove' ? 'on' : '', 'Next tap: attack-move (or long-press the map)'));
      cmd.appendChild(this.btn('<span class="k">✋</span>Hold', () => g.doHold(), '', 'Hold position'));
      cmd.appendChild(this.btn('<span class="k">«</span>Retreat', () => g.doRetreat(), 'danger', 'Sprint home; recovers morale'));
      cmd.appendChild(this.btn('<span class="k">■</span>Stop', () => g.doStop()));
      const reinf = sq.filter((s) => s.def.size > 1 && s.members.filter((m) => !m.hero).length + s.reinforce < s.def.size);
      if (reinf.length) { const c = reinforceCost(reinf[0].def); cmd.appendChild(this.btn(`<span class="k">+1</span>Reinforce${costHtml(c, can(c))}`, () => g.doReinforce(), can(c) ? '' : 'dis', 'Add a member to the squad (slower away from base)')); }
      const hero = sq.length === 1 && sq[0].def.hero ? sq[0] : null;
      if (hero) cmd.appendChild(this.btn('<span class="k">★</span>Attach', () => g.setMode(mode === 'attach' ? 'normal' : 'attach'), mode === 'attach' ? 'on' : '', 'Next tap on a squad: attach hero'));
      const withHero = sq.find((s) => s.hero);
      if (withHero) cmd.appendChild(this.btn('<span class="k">★</span>Detach', () => g.doDetach(), '', 'Detach the hero'));
      cmd.appendChild(this.btn('<span class="k">⬚</span>Box', () => g.setMode(mode === 'box' ? 'normal' : 'box'), mode === 'box' ? 'on' : '', 'Drag to box-select'));
      return;
    }
    if (bl.length === 1) {
      const b = bl[0];
      if (b.def.trains && b.done) {
        for (const k of b.def.trains) {
          if (!w.allowed(g.viewer, 'unit', k)) continue;
          const u = f.units[k];
          const ok = can(u.cost) && (!u.hero || (!p.heroAlive && !p.heroQueued));
          const qn = b.queue.filter((x) => x === k).length;
          const req = u.requires && !w.buildings.some((x) => x.owner === g.viewer && !x.dead && x.done && x.key === u.requires) ? f.buildings[u.requires].name : null;
          const el = this.btn(`${unitIconSVG(p.faction, u.shape, f.color, 22)}<span>${u.name}</span>${req ? `<span class="cost no">needs ${req}</span>` : costHtml(u.cost, ok)}${qn ? `<span class="q">${qn}</span>` : ''}<span class="prog" data-k="${k}"></span>`, () => g.doTrain(b, k), ok && !req ? '' : 'dis', `${u.desc} Pop ${u.pop}.`);
          cmd.appendChild(el);
        }
        if (b.queue.length) cmd.appendChild(this.btn('Cancel last', () => g.doCancelTrain(b), 'wide'));
        cmd.appendChild(this.btn('<span class="k">⚑</span>Rally', () => g.setMode(mode === 'rally' ? 'normal' : 'rally'), mode === 'rally' ? 'on' : '', 'Next tap: set rally point'));
      }
      cmd.appendChild(this.btn(b.done ? 'Demolish' : 'Cancel build', () => g.doCancelBuilding(b), 'danger'));
      cmd.appendChild(this.btn('<span class="k">✕</span>Deselect', () => g.select([]), '', 'Clear the selection'));
      return;
    }
    if (bl.length > 1) { cmd.appendChild(this.btn('Select one structure to manage it', () => {}, 'wide dis')); cmd.appendChild(this.btn('<span class="k">✕</span>Deselect', () => g.select([]), 'wide')); return; }
    if (g.selectedEnemy()) { cmd.appendChild(this.btn('<span class="k">✕</span>Deselect', () => g.select([]), 'wide')); return; }
    cmd.appendChild(this.btn('<span class="k">🏗</span>Build', () => g.setMode('build'), ''));
    cmd.appendChild(this.btn('<span class="k">⬚</span>Box', () => g.setMode(mode === 'box' ? 'normal' : 'box'), mode === 'box' ? 'on' : '', 'Drag to box-select'));
    cmd.appendChild(this.btn('<span class="k">⚑</span>Army', () => g.selectAllArmy(), '', 'Select every squad'));
    const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'Hold points for Flux. Extractors on ore veins for Ore.'; cmd.appendChild(h);
  }
  updateCmdProgress(bl) {
    if (bl.length !== 1) return;
    const b = bl[0];
    for (const el of this.el.cmd.querySelectorAll('.prog')) el.style.width = b.queue[0] === el.dataset.k ? (b.queueProgress * 100).toFixed(0) + '%' : '0';
  }
}
