// Menus: title -> faction carousel -> campaign chapters | skirmish setup. Plus briefing, pause and end screens.
import { FACTIONS, FACTION_KEYS } from '../game/data.js';
import { THEMES, THEME_KEYS } from '../map/themes.js';
import { unitIconSVG, buildingIconSVG } from '../render/shapes.js';
import { CAMPAIGNS, LORE, actOf } from '../game/campaigns.js';
import { ico } from './icons.js';
import { loadProgress } from '../game/campaign.js';
import { CODEX } from '../game/codex.js';
import { DMG_LABEL, ARMOR_LABEL } from '../game/data.js';

const DEFAULTS = { faction: 'blue', theme: 'verdant', difficulty: 'normal', size: 64, seed: '' };

export class Menu {
  constructor(root, pauseRoot, overRoot, onStart, onResume, onStartChapter) {
    this.root = root; this.pauseRoot = pauseRoot; this.overRoot = overRoot;
    this.onStart = onStart; this.onResume = onResume; this.onStartChapter = onStartChapter;
    this.settings = { ...DEFAULTS };
    try { Object.assign(this.settings, JSON.parse(localStorage.getItem('bw_settings') || '{}')); } catch (e) { /* ignore */ }
    if (!FACTIONS[this.settings.faction]) this.settings.faction = 'blue';
    this.screen = 'title';
    this.render();
  }
  save() { try { localStorage.setItem('bw_settings', JSON.stringify(this.settings)); } catch (e) { /* ignore */ } }
  show() { this.root.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); }
  randomSeed() { return Math.random().toString(36).slice(2, 8); }
  go(screen) { this.screen = screen; this.render(); }
  loadSave() { try { const s = JSON.parse(localStorage.getItem('bw_save') || 'null'); return s && s.world && !s.world.gameOver ? s : null; } catch (e) { return null; } }

  render() {
    const r = this.root;
    r.className = 'overlay page';
    switch (this.screen) {
      case 'faction': this.renderFaction(); break;
      case 'campaign': this.renderCampaign(); break;
      case 'codex': this.renderCodex(); break;
      case 'skirmish': this.renderSkirmish(); break;
      case 'help': this.renderHelp(); break;
      default: this.renderTitle();
    }
  }

  // ---------- title
  renderTitle() {
    const r = this.root, save = this.loadSave();
    r.innerHTML = `
      <div class="screen title">
        <div class="titlehead">
          <h1><span class="b">BIT</span> <span class="r">WARS</span> <span class="g">${ico('circle', 30)}</span></h1>
          <div class="sub">Micro RTS · squads, cover, morale and frontline economics</div>
        </div>
        <div class="setting">${LORE.world}</div>
        <div class="fpicks">${FACTION_KEYS.map((k) => { const f = FACTIONS[k]; return `<button class="fpick" data-f="${k}" style="--fc:${f.color}">${unitIconSVG(k, Object.values(f.units)[0].shape, f.color, 40)}<span class="fname">${f.name}</span><span class="ftag">${f.tagline}</span></button>`; }).join('')}</div>
        <div class="titlefoot">
          ${save ? `<button class="big slim" id="btnResume">RESUME BATTLE <span class="dim">· ${save.settings.mode === 'campaign' ? 'Campaign' : save.world.map.name} · ${Math.floor(save.world.time / 60)}:${String(Math.floor(save.world.time % 60)).padStart(2, '0')}</span></button>` : ''}
          <div class="links"><button class="link" id="btnHelp">How to play</button><span class="dim" id="installHint">On iPhone: Share, then Add to Home Screen</span></div>
        </div>
      </div>`;
    for (const b of r.querySelectorAll('.fpick')) b.onclick = () => { this.settings.faction = b.dataset.f; this.save(); this.go('faction'); };
    r.querySelector('#btnHelp').onclick = () => this.go('help');
    if (save) r.querySelector('#btnResume').onclick = () => this.onResume(save);
    const native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (native || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) r.querySelector('#installHint').remove();
  }

  // ---------- faction carousel
  renderFaction() {
    const r = this.root, k = this.settings.faction, f = FACTIONS[k], camp = CAMPAIGNS[k];
    const idx = FACTION_KEYS.indexOf(k), doneN = loadProgress()[k] || 0;
    const units = Object.values(f.units), buildings = Object.values(f.buildings);
    r.innerHTML = `
      <div class="screen faction" style="--fc:${f.color}">
        <div class="bar">
          <button class="nav" id="btnHome">${ico('left', 14)} Home</button>
          <div class="dots">${FACTION_KEYS.map((x) => `<i class="${x === k ? 'on' : ''}" data-f="${x}" style="--fc:${FACTIONS[x].color}"></i>`).join('')}</div>
          <div class="arrows"><button class="nav" id="btnPrev">${ico('left', 16)}</button><button class="nav" id="btnNext">${ico('right', 16)}</button></div>
        </div>
        <div class="fbody" id="fbody">
          <div class="fdetails">
            <div class="fhead">${unitIconSVG(k, units[0].shape, f.color, 44)}<div><div class="fname">${f.name}</div><div class="ftag">${f.tagline}</div></div></div>
            <ul class="fplay">${f.playstyle.map((p) => `<li>${p}</li>`).join('')}</ul>
            <div class="roster">${units.map((u) => `<span class="ric" data-k="${u.key}" title="${u.name}: ${u.role}">${unitIconSVG(k, u.shape, f.color, 22)}</span>`).join('')}<span class="sep"></span>${buildings.map((b) => `<span class="ric" data-k="${b.key}" title="${b.name}">${buildingIconSVG(k, b, f.color, 22)}</span>`).join('')}</div>
            <div class="fbtns">
              <button class="big" id="btnCampaign">CAMPAIGN <span class="dim">${doneN}/${camp.chapters.length}</span></button>
              <button class="big secondary" id="btnSkirmish">SKIRMISH</button>
              <button class="big secondary" id="btnCodex">CODEX</button>
            </div>
          </div>
          <div class="fhistory">
            <div class="hhead">History · ${camp.title}</div>
            <div class="hscroll">
              <p>${f.lore}</p>
              <p><b>${camp.goal}.</b> ${camp.backstory}</p>
              <p>${camp.intro}</p>
              <p class="dim">${LORE.world}</p>
              <p class="dim">Roster: ${units.map((u) => u.name).join(', ')}. Structures: ${buildings.map((b) => b.name).join(', ')}.</p>
            </div>
          </div>
        </div>
      </div>`;
    const step = (d) => { this.settings.faction = FACTION_KEYS[(idx + d + 3) % 3]; this.save(); this.renderFaction(); };
    r.querySelector('#btnHome').onclick = () => this.go('title');
    r.querySelector('#btnPrev').onclick = () => step(-1);
    r.querySelector('#btnNext').onclick = () => step(1);
    for (const d of r.querySelectorAll('.dots i')) d.onclick = () => { this.settings.faction = d.dataset.f; this.save(); this.renderFaction(); };
    r.querySelector('#btnCampaign').onclick = () => this.go('campaign');
    r.querySelector('#btnSkirmish').onclick = () => this.go('skirmish');
    r.querySelector('#btnCodex').onclick = () => { this.codexKey = null; this.go('codex'); };
    for (const ic of r.querySelectorAll('.ric')) ic.onclick = (e) => { e.stopPropagation(); this.codexKey = ic.dataset.k; this.go('codex'); };
    // swipe
    const body = r.querySelector('#fbody');
    let sx = null, sy = null;
    body.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    body.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1); });
  }

  // ---------- campaign chapters
  renderCampaign() {
    const r = this.root, k = this.settings.faction, f = FACTIONS[k], camp = CAMPAIGNS[k], doneN = loadProgress()[k] || 0;
    r.innerHTML = `
      <div class="screen" style="--fc:${f.color}">
        <div class="bar"><button class="nav" id="btnBack">${ico('left', 14)} ${f.name}</button><div class="bartitle">${camp.title} <span class="dim">· ${doneN}/${camp.chapters.length} complete</span></div><span></span></div>
        <div class="chapters" id="chapters"></div>
      </div>`;
    r.querySelector('#btnBack').onclick = () => this.go('faction');
    const list = r.querySelector('#chapters');
    let lastAct = null;
    camp.chapters.forEach((ch, i) => {
      const act = actOf(camp, i);
      if (act && act !== lastAct) { lastAct = act; const h = document.createElement('div'); h.className = 'acthead'; h.textContent = act.title; list.appendChild(h); }
      const state = i < doneN ? 'done' : i === doneN ? 'next' : 'locked';
      const row = document.createElement('button');
      row.className = 'chapter ' + state;
      row.innerHTML = `<span class="num">${i + 1}</span><span class="body"><b>${ch.title}${ch.crossover ? ' <span class="xo">crossover</span>' : ''}</b><span class="brief">${ch.briefing}</span></span><span class="state">${ico(state === 'done' ? 'check' : state === 'next' ? 'play' : 'lock', 16)}</span>`;
      row.onclick = () => { if (state !== 'locked') this.showBriefing(camp, ch, i); };
      list.appendChild(row);
    });
  }

  // ---------- skirmish setup
  renderCodex() {
    const k = this.settings.faction, f = FACTIONS[k];
    const units = Object.values(f.units), buildings = Object.values(f.buildings);
    const entries = [...units.map((u) => ({ kind: 'unit', d: u })), ...buildings.map((b) => ({ kind: 'building', d: b }))];
    if (!this.codexKey || !entries.some((e) => e.d.key === this.codexKey)) this.codexKey = entries[0].d.key;
    const cur = entries.find((e) => e.d.key === this.codexKey);
    const icon = (e, size) => e.kind === 'unit' ? unitIconSVG(k, e.d.shape, f.color, size) : buildingIconSVG(k, e.d, f.color, size);
    const stat = (label, val) => val === undefined || val === null || val === '' ? '' : `<div class="st"><span>${label}</span><b>${val}</b></div>`;
    const d = cur.d, c = CODEX[d.key] || { story: [], strengths: [], weaknesses: [], tactics: [] };
    let stats;
    if (cur.kind === 'unit') {
      const w = d.weapon;
      stats = stat('Cost', `${d.cost.ore} ore${d.cost.flux ? ` · ${d.cost.flux} flux` : ''}`) + stat('Population', d.pop) + stat('Squad', d.size > 1 ? `${d.size} members` : d.hero ? 'Hero (one only)' : 'Single') +
        stat('Health', `${d.hp}${d.size > 1 ? ' each' : ''}${d.shield ? ` + ${d.shield} shield` : ''}`) + stat('Armour', ARMOR_LABEL[d.armor]) + stat('Speed', d.speed) + stat('Sight', `${d.sight} tiles`) +
        stat('Weapon', `${DMG_LABEL[w.type]}${w.melee ? ' (melee)' : ''}`) + stat('Damage', `${w.dmg} × ${w.rof}/s`) + stat('Range', w.minRange ? `${w.minRange}–${w.range}` : w.range) + stat('Suppression', w.supp) +
        stat('Splash', w.splash ? `${w.splash} tiles` : undefined) + stat('Set-up', w.setup ? `${w.setup}s` : undefined) + stat('Flies', d.flying ? 'Yes' : undefined) + stat('Captures', d.canCapture ? `Yes (×${d.capRate})` : 'No') +
        stat('Aura', d.aura ? Object.entries(d.aura).filter(([a]) => a !== 'radius').map(([a, v]) => ({ speed: `+${Math.round((v - 1) * 100)}% speed`, moraleRegen: 'morale regen', armor: `-${Math.round((1 - v) * 100)}% damage taken`, repair: `repairs ${v}/s`, shieldRegen: `shield regen ×${v}`, sightBonus: `+${v} sight` })[a] || `${a} ${v}`).join(', ') + ` (${d.aura.radius} tiles)` : undefined) + stat('Trained at', f.buildings[d.building]?.name) + stat('Requires', d.requires ? f.buildings[d.requires].name : undefined);
    } else {
      stats = stat('Cost', d.hq ? 'Starting structure' : `${d.cost.ore} ore${d.cost.flux ? ` · ${d.cost.flux} flux` : ''}`) + stat('Build time', d.hq ? undefined : `${d.buildTime}s`) + stat('Health', `${d.hp}${d.shield ? ` + ${d.shield} shield` : ''}`) + stat('Footprint', d.w >= 2 ? '7 cells' : '1 cell') + stat('Sight', `${d.sight} tiles`) +
        stat('Trains', d.trains ? d.trains.map((u) => f.units[u].name).join(', ') : undefined) + stat('Income', d.ore ? `+${(d.ore * 60).toFixed(0)} ore/min` : d.pointFlux ? `+${(d.pointFlux * 60).toFixed(0)} flux/min` : d.flux ? `+${(d.flux * 60).toFixed(0)} flux/min` : undefined) +
        stat('Weapon', d.weapon ? `${DMG_LABEL[d.weapon.type]} ${d.weapon.dmg} × ${d.weapon.rof}/s, range ${d.weapon.range}` : undefined) + stat('Placement', d.onOre ? 'On an ore vein' : d.onPoint ? 'On a captured strategic point' : 'Near your structures') + stat('Upgrade', d.upgrade ? (d.upgrade.hp ? `+${Math.round((d.upgrade.hp - 1) * 100)}% squad health` : `+${Math.round((d.upgrade.shield - 1) * 100)}% squad shields`) : undefined);
    }
    const list = (title, items, cls) => items.length ? `<div class="cx-sec ${cls}"><div class="cx-h">${title}</div><ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul></div>` : '';
    this.root.innerHTML = `
      <div class="screen" style="--fc:${f.color}">
        <div class="bar"><button class="nav" id="cxBack">${ico('left', 14)} ${f.name}</button><div class="bartitle">Codex <span class="dim">· ${f.name}</span></div><span></span></div>
        <div class="codex">
          <div class="cx-list">
            <div class="cx-lh">Units</div>
            ${units.map((u) => `<button class="cx-item ${u.key === d.key ? 'sel' : ''}" data-k="${u.key}">${unitIconSVG(k, u.shape, f.color, 22)}<span>${u.name}</span></button>`).join('')}
            <div class="cx-lh">Structures</div>
            ${buildings.map((b) => `<button class="cx-item ${b.key === d.key ? 'sel' : ''}" data-k="${b.key}">${buildingIconSVG(k, b, f.color, 22)}<span>${b.name}</span></button>`).join('')}
          </div>
          <div class="cx-detail">
            <div class="cx-top">${icon(cur, 48)}<div><div class="cx-name" style="color:${f.color}">${d.name}</div><div class="cx-role">${d.role || (d.hq ? 'Headquarters' : d.turret ? 'Static defence' : d.onOre ? 'Extractor' : d.onPoint ? 'Outpost' : d.trains ? 'Production' : 'Upgrade')}</div></div></div>
            <div class="cx-desc">${d.desc}</div>
            <div class="cx-stats">${stats}</div>
            <div class="cx-sec story">${c.story.map((p) => `<p>${p}</p>`).join('')}</div>
            <div class="cx-cols">${list('Strengths', c.strengths, 'good')}${list('Weaknesses', c.weaknesses, 'bad')}</div>
            ${list('Tactics', c.tactics, 'tac')}
          </div>
        </div>
      </div>`;
    this.root.querySelector('#cxBack').onclick = () => this.go('faction');
    for (const b of this.root.querySelectorAll('.cx-item')) b.onclick = () => { this.codexKey = b.dataset.k; this.renderCodex(); const el = this.root.querySelector('.cx-detail'); if (el) el.scrollTop = 0; };
    const selItem = this.root.querySelector('.cx-item.sel'); if (selItem) selItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  renderSkirmish() {
    const r = this.root, s = this.settings, f = FACTIONS[s.faction];
    r.innerHTML = `
      <div class="screen" style="--fc:${f.color}">
        <div class="bar"><button class="nav" id="btnBack">${ico('left', 14)} ${f.name}</button><div class="bartitle">Skirmish</div><span></span></div>
        <div class="setup">
          <div class="row"><span class="lbl">Map</span><span class="chips" id="themeChips"></span></div>
          <div class="blurb dim" id="themeBlurb"></div>
          <div class="row"><span class="lbl">Size</span><span class="chips" id="sizeChips"></span><span class="lbl">Enemy</span><span class="chips" id="diffChips"></span></div>
          <div class="row"><span class="lbl">Seed</span><input id="seedInput" placeholder="random" value="${s.seed || ''}" autocomplete="off" /><button class="chip" id="seedRnd">${ico('dice', 14)}</button></div>
          <button class="big" id="btnStart">BATTLE</button>
        </div>
      </div>`;
    r.querySelector('#btnBack').onclick = () => this.go('faction');
    const chips = (id, items, key, fmt, after) => {
      const wrap = r.querySelector(id);
      for (const it of items) {
        const b = document.createElement('button');
        b.className = 'chip' + (String(s[key]) === String(it) ? ' sel' : ''); b.textContent = fmt(it);
        b.onclick = () => { s[key] = it; wrap.querySelectorAll('.chip').forEach((c) => c.classList.remove('sel')); b.classList.add('sel'); this.save(); after?.(); };
        wrap.appendChild(b);
      }
    };
    const blurb = () => { r.querySelector('#themeBlurb').textContent = s.theme === 'random' ? 'A random theme every battle.' : THEMES[s.theme].blurb; };
    chips('#themeChips', [...THEME_KEYS, 'random'], 'theme', (k) => (k === 'random' ? ico('dice', 12) + ' Random' : THEMES[k].name), blurb);
    chips('#sizeChips', [48, 64, 80], 'size', (v) => (v === 48 ? 'Small' : v === 64 ? 'Medium' : 'Large'));
    chips('#diffChips', ['easy', 'normal', 'hard'], 'difficulty', (v) => v[0].toUpperCase() + v.slice(1));
    blurb();
    r.querySelector('#seedRnd').onclick = () => { r.querySelector('#seedInput').value = this.randomSeed(); };
    r.querySelector('#btnStart').onclick = () => {
      s.seed = r.querySelector('#seedInput').value.trim(); this.save();
      const theme = s.theme === 'random' ? THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)] : s.theme;
      this.onStart({ ...s, theme, seed: s.seed || this.randomSeed() });
    };
  }

  // ---------- help
  renderHelp() {
    const r = this.root;
    r.innerHTML = `
      <div class="screen">
        <div class="bar"><button class="nav" id="btnBack">${ico('left', 14)} Home</button><div class="bartitle">How to play</div><span></span></div>
        <div class="hscroll help pad">
          <table>
            <tr><td>Tap unit</td><td>Select squad. Tap a squad icon in the top bar to select it; tap again to jump the camera there. Double-tap a unit to select all of that type on screen.</td></tr>
            <tr><td>Tap ground</td><td>Move selected squads. Tap an enemy to attack it. The cross button deselects.</td></tr>
            <tr><td>Long-press</td><td>Attack-move: advance and engage everything on the way.</td></tr>
            <tr><td>Flank</td><td>Tap Flank, then an enemy: the squad swings wide around the enemy's facing and attacks from behind. Set-up guns traverse slowly and cannot answer until they have turned.</td></tr>
            <tr><td>Drag / pinch</td><td>Pan and zoom. Tap the minimap to jump. Use <b>Box</b> to drag-select.</td></tr>
            <tr><td>Mouse</td><td>Left-click/drag selects, right-click commands, wheel zooms. Keys: A attack-move, H hold, S stop, R retreat, B build, Esc cancel, Space jump to last alert.</td></tr>
          </table>
          <p><b>Economy.</b> <span style="color:#ffe680">Ore</span> comes from extractors built on ore veins. <span style="color:#7fd3ff">Flux</span> comes from <b>strategic points</b>: stand infantry on a point to capture it, fortify it with an outpost to earn more and make it harder to take back.</p>
          <p><b>Squads.</b> You command squads, not soldiers. <b>Reinforce</b> a bled squad in the field, or <b>attach</b> your hero to it mid-fight. Losing a squad is permanent; losing your HQ is the end.</p>
          <p><b>Cover.</b> Brush, craters and rubble give light cover. Standing behind rocks, walls and ruins gives heavy cover from that side. Blast weapons flatten cover and leave craters. Vehicles ignore cover.</p>
          <p><b>Morale.</b> Sustained fire and casualties drain morale. A <b>broken</b> squad fights at a third of its strength and takes 50% more damage. Flanking does more damage and breaks squads faster. <b>Retreat</b> sprints a squad home to recover.</p>
          <p><b>Counters.</b> Light weapons shred infantry; anti-armour cracks vehicles; blast ruins clumps and structures; energy eats shields and armour. Every squad card shows what it is strong and weak against.</p>
          <div id="rosters"></div>
        </div>
      </div>`;
    r.querySelector('#btnBack').onclick = () => this.go('title');
    const ro = r.querySelector('#rosters');
    for (const k of FACTION_KEYS) {
      const f = FACTIONS[k];
      const h = document.createElement('div');
      h.innerHTML = `<div style="color:${f.color};font-weight:800;margin:10px 0 4px">${f.name}</div>`;
      const ul = document.createElement('div'); ul.className = 'unitlist';
      for (const u of Object.values(f.units)) { const d = document.createElement('div'); d.className = 'u'; d.innerHTML = `${unitIconSVG(k, u.shape, f.color, 26)}<div><b>${u.name}</b> <span class="m">· ${u.size > 1 ? u.size + ' members' : 'single'} · ${u.cost.ore} ore${u.cost.flux ? ' ' + u.cost.flux + ' flux' : ''}</span><br>${u.desc}<br><span class="m">Strong vs ${u.strong}. Weak vs ${u.weak}.</span></div>`; ul.appendChild(d); }
      for (const b of Object.values(f.buildings)) { const d = document.createElement('div'); d.className = 'u'; d.innerHTML = `${buildingIconSVG(k, b, f.color, 26)}<div><b>${b.name}</b> <span class="m">· ${b.cost.ore ? b.cost.ore + ' ore' : 'HQ'}${b.cost.flux ? ' ' + b.cost.flux + ' flux' : ''}</span><br>${b.desc}</div>`; ul.appendChild(d); }
      h.appendChild(ul); ro.appendChild(h);
    }
  }

  // ---------- briefing / chapter end / pause / game over (overlays on top of whatever is showing)
  showBriefing(camp, ch, i) {
    const r = this.overRoot, f = FACTIONS[camp.faction];
    const enemies = ch.enemies || [ch.enemy];
    const vs = enemies.map((E) => `${FACTIONS[E.faction].name}${E.ai ? '' : ' (garrison)'}`).join(' and ') + (ch.allies?.length ? ` · with ${ch.allies.map((A) => FACTIONS[A.faction].name).join(' and ')}` : '');
    const stages = ch.stages.map((st, k) => `<div class="stagebox"><div class="stagehead">${k === 0 ? 'Objectives' : 'Then'}</div>${st.intro ? `<div class="help" style="margin-bottom:4px">${st.intro}</div>` : ''}<ul>${st.objectives.map((o) => `<li class="${o.optional ? 'opt' : ''}">${o.text}${o.optional ? ' <em>(optional)</em>' : ''}</li>`).join('')}</ul></div>`).join('');
    r.className = 'overlay page';
    r.innerHTML = `<div class="screen" style="--fc:${f.color}">
      <div class="bar"><button class="nav" id="chBack">${ico('left', 14)} Chapters</button><div class="bartitle">${camp.title} · Chapter ${i + 1}</div><span></span></div>
      <div class="brief2">
        <div class="hscroll pad">
          <h1 style="font-size:24px;margin:0">${ch.title}</h1>
          <div class="sub">${THEMES[ch.theme].name} · vs ${vs}</div>
          ${ch.also?.length ? `<div class="sub xoline"><span class="xo">crossover</span> The same battle is fought in ${ch.also.map((a) => `${a.campaign} chapter ${a.index + 1}`).join(' and ')}.</div>` : ''}
          <div class="story">${ch.story.map((p) => `<p>${p}</p>`).join('')}</div>
          <div class="briefline"><b>Briefing.</b> ${ch.briefing}</div>
          ${stages}
        </div>
        <div class="briefside"><button class="big" id="chBegin">BEGIN CHAPTER</button></div>
      </div>
    </div>`;
    r.classList.remove('hidden');
    r.querySelector('#chBegin').onclick = () => { r.classList.add('hidden'); this.onStartChapter(ch.key); };
    r.querySelector('#chBack').onclick = () => r.classList.add('hidden');
  }
  showChapterEnd({ won, reason, campaign, chapter, index, time, me, enemy, objectives, handlers }) {
    const r = this.overRoot, f = FACTIONS[campaign.faction];
    const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const last = index === campaign.chapters.length - 1;
    r.className = 'overlay page';
    r.innerHTML = `<div class="screen" style="--fc:${f.color}">
      <div class="bar"><span class="dim">${campaign.title} · Chapter ${index + 1}: ${chapter.title}</span><div class="bartitle" style="color:${won ? '#7CFC9A' : '#ff5f5f'}">${won ? (last ? 'CAMPAIGN COMPLETE' : 'CHAPTER COMPLETE') : 'CHAPTER FAILED'}</div><span class="dim">${fmt(time)}</span></div>
      <div class="brief2">
        <div class="hscroll pad">
          ${won ? `<div class="story">${chapter.epilogue.map((p) => `<p>${p}</p>`).join('')}</div>` : `<div class="sub">${reason}</div><ul class="objlist">${objectives.map((o) => `<li class="${o.done ? 'done' : ''}">${ico(o.done ? 'check' : 'circle', 12)} ${o.text}${o.target > 1 ? ` (${o.cur}/${o.target})` : ''}</li>`).join('')}</ul>`}
          <div class="stats"><span>Squads killed</span><span>${me.kills} vs ${enemy.kills}</span><span>Squads lost</span><span>${me.losses}</span><span>Structures destroyed</span><span>${me.destroyed}</span></div>
        </div>
        <div class="briefside">
          ${won && handlers.next ? '<button class="big" id="ceNext">NEXT CHAPTER</button>' : ''}
          <button class="big ${won && handlers.next ? 'secondary' : ''}" id="ceReplay">${won ? 'Replay chapter' : 'RETRY'}</button>
          <button class="big secondary" id="ceMenu">Chapters</button>
        </div>
      </div>
    </div>`;
    r.classList.remove('hidden');
    if (handlers.next) { const b = r.querySelector('#ceNext'); if (b) b.onclick = () => { r.classList.add('hidden'); handlers.next(); }; }
    r.querySelector('#ceReplay').onclick = () => { r.classList.add('hidden'); handlers.replay(); };
    r.querySelector('#ceMenu').onclick = () => { r.classList.add('hidden'); this.screen = 'campaign'; handlers.quit(); };
  }
  showPause(handlers) {
    const r = this.pauseRoot;
    r.className = 'overlay';
    r.innerHTML = `<div class="panel" style="max-width:360px;text-align:center">
      <h1 style="font-size:24px">PAUSED</h1>
      <button class="big" id="pResume">RESUME</button>
      <button class="big secondary" id="pSound">${ico(handlers.muted ? 'mute' : 'sound', 14)} ${handlers.muted ? 'Sound off' : 'Sound on'}</button>
      <button class="big secondary" id="pRestart">Restart battle</button>
      <button class="big secondary" id="pQuit">Quit to menu</button>
      <div class="help" style="margin-top:14px;text-align:left">Tap = select / move · Tap enemy = attack · Long-press = attack-move · Pinch = zoom · Cross = deselect · <b>Retreat</b> sprints a squad home · <b>Reinforce</b> refills a squad.</div></div>`;
    r.classList.remove('hidden');
    r.querySelector('#pResume').onclick = () => { r.classList.add('hidden'); handlers.resume(); };
    r.querySelector('#pSound').onclick = (e) => { const m = handlers.toggleSound(); e.currentTarget.innerHTML = `${ico(m ? 'mute' : 'sound', 14)} ${m ? 'Sound off' : 'Sound on'}`; };
    r.querySelector('#pRestart').onclick = () => { r.classList.add('hidden'); handlers.restart(); };
    r.querySelector('#pQuit').onclick = () => { r.classList.add('hidden'); handlers.quit(); };
  }
  hidePause() { this.pauseRoot.classList.add('hidden'); }
  showGameOver({ won, time, me, enemy, handlers }) {
    const r = this.overRoot;
    const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    r.className = 'overlay';
    r.innerHTML = `<div class="panel" style="text-align:center">
      <h1 style="color:${won ? '#7CFC9A' : '#ff5f5f'};font-size:36px">${won ? 'VICTORY' : 'DEFEAT'}</h1>
      <div class="sub">${won ? 'The enemy headquarters is rubble.' : 'Your headquarters has fallen.'} · ${fmt(time)}</div>
      <div class="stats"><span>Squads killed</span><span>${me.kills} vs ${enemy.kills}</span><span>Squads lost</span><span>${me.losses} vs ${enemy.losses}</span><span>Structures destroyed</span><span>${me.destroyed} vs ${enemy.destroyed}</span><span>Points captured</span><span>${me.captured} vs ${enemy.captured}</span></div>
      <button class="big" id="goAgain">BATTLE AGAIN</button>
      <button class="big secondary" id="goMenu">Main menu</button>
    </div>`;
    r.classList.remove('hidden');
    r.querySelector('#goAgain').onclick = () => { r.classList.add('hidden'); handlers.restart(); };
    r.querySelector('#goMenu').onclick = () => { r.classList.add('hidden'); this.screen = 'title'; handlers.quit(); };
  }
}
