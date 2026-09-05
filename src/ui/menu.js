// Main menu, pause and game-over overlays. Pure DOM.
import { FACTIONS, FACTION_KEYS, POP_CAP } from '../game/data.js';
import { THEMES, THEME_KEYS } from '../map/themes.js';
import { unitIconSVG, buildingIconSVG } from '../render/shapes.js';

const DEFAULTS = { faction: 'blue', theme: 'verdant', difficulty: 'normal', size: 64, seed: '' };

export class Menu {
  constructor(root, pauseRoot, overRoot, onStart) {
    this.root = root; this.pauseRoot = pauseRoot; this.overRoot = overRoot; this.onStart = onStart;
    this.settings = { ...DEFAULTS };
    try { Object.assign(this.settings, JSON.parse(localStorage.getItem('bw_settings') || '{}')); } catch (e) { /* ignore */ }
    this.render();
  }
  save() { try { localStorage.setItem('bw_settings', JSON.stringify(this.settings)); } catch (e) { /* ignore */ } }
  show() { this.root.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); }
  randomSeed() { return Math.random().toString(36).slice(2, 8); }

  render() {
    const s = this.settings;
    const r = this.root;
    r.innerHTML = `
      <div class="panel">
        <h1><span class="b">BIT</span> <span class="r">WARS</span> <span class="g">◉</span></h1>
        <div class="sub">Micro RTS · squads, cover, morale and frontline economics. Hold the points. Break the line. Burn the base.</div>
        <h2>Faction</h2>
        <div class="factions" id="fcards"></div>
        <h2>Battleground</h2>
        <div class="chips" id="themeChips"></div>
        <div class="row" style="margin-top:8px">
          <span class="chips" id="sizeChips"></span>
          <input id="seedInput" placeholder="seed (random)" value="${s.seed || ''}" autocomplete="off" />
          <button class="chip" id="seedRnd">🎲</button>
        </div>
        <h2>Enemy</h2>
        <div class="chips" id="diffChips"></div>
        <button class="big" id="btnStart">BATTLE</button>
        <div class="install" id="installHint">On iPhone: open in Safari, tap Share, then <b>Add to Home Screen</b> to install as an app.</div>
        <details style="margin-top:14px"><summary class="help" style="cursor:pointer"><b>How to play</b> — controls, systems, rosters</summary>
          <div class="help" style="margin-top:8px">
            <table>
              <tr><td>Tap unit</td><td>Select squad. Tap a squad icon in the top bar to select it; tap again to jump the camera there. Double-tap a unit to select all of that type on screen.</td></tr>
              <tr><td>Tap ground</td><td>Move selected squads. Tap an enemy to attack it.</td></tr>
              <tr><td>Long-press</td><td>Attack-move: advance and engage everything on the way.</td></tr>
              <tr><td>Drag / pinch</td><td>Pan and zoom. Tap the minimap to jump. Use <b>Box</b> to drag-select.</td></tr>
              <tr><td>Mouse</td><td>Left-click/drag selects, right-click commands, wheel zooms, middle-drag pans. Keys: A attack-move, H hold, S stop, R retreat, B build, Esc cancel, Space jump to last alert.</td></tr>
            </table>
            <p><b>Economy.</b> <span style="color:#ffe680">Ore</span> comes from extractors built on ore veins. <span style="color:#7fd3ff">Flux</span> comes from <b>strategic points</b>: stand infantry on a point to capture it, fortify it with an outpost to earn more and make it harder to take back. Your economy only grows if you hold territory.</p>
            <p><b>Squads.</b> You command squads, not soldiers. <b>Reinforce</b> a bled squad in the field, or <b>attach</b> your hero to it mid-fight. Losing a squad is permanent; losing your HQ is the end.</p>
            <p><b>Cover.</b> Brush, craters and rubble give light cover. Standing behind rocks, walls and ruins gives heavy cover from that side. Blast weapons flatten cover and leave craters. Vehicles ignore cover.</p>
            <p><b>Morale.</b> Sustained fire and casualties drain morale. A <b>broken</b> squad fights at a third of its strength and takes 50% more damage. Hitting a squad from behind (<b>flanking</b>) does more damage and breaks it faster. Pull broken squads back with <b>Retreat</b>: they sprint home and recover.</p>
            <p><b>Counters.</b> Light weapons shred infantry; anti-armour cracks vehicles; blast ruins clumps and structures; energy eats shields and armour. Every squad card shows what it is strong and weak against.</p>
            <h2>Rosters</h2>
            <div id="rosters"></div>
          </div>
        </details>
      </div>`;
    const fc = r.querySelector('#fcards');
    for (const k of FACTION_KEYS) {
      const f = FACTIONS[k];
      const el = document.createElement('div');
      el.className = 'fcard' + (s.faction === k ? ' sel' : '');
      el.style.setProperty('--fc', f.color);
      el.innerHTML = `${unitIconSVG(k, Object.values(f.units)[0].shape, f.color, 42)}<div class="fname">${f.name}</div><div class="ftag">${f.tagline}</div><ul>${f.playstyle.map((p) => `<li>${p}</li>`).join('')}</ul>`;
      el.onclick = () => { s.faction = k; fc.querySelectorAll('.fcard').forEach((c) => c.classList.remove('sel')); el.classList.add('sel'); this.save(); };
      fc.appendChild(el);
    }
    const chips = (id, items, key, fmt) => {
      const wrap = r.querySelector(id);
      for (const it of items) {
        const b = document.createElement('button');
        b.className = 'chip' + (String(s[key]) === String(it) ? ' sel' : '');
        b.textContent = fmt(it);
        b.onclick = () => { s[key] = it; wrap.querySelectorAll('.chip').forEach((c) => c.classList.remove('sel')); b.classList.add('sel'); this.save(); this.updateBlurb(); };
        wrap.appendChild(b);
      }
    };
    chips('#themeChips', [...THEME_KEYS, 'random'], 'theme', (k) => (k === 'random' ? '🎲 Random' : THEMES[k].name));
    chips('#sizeChips', [48, 64, 80], 'size', (v) => (v === 48 ? 'Small' : v === 64 ? 'Medium' : 'Large'));
    chips('#diffChips', ['easy', 'normal', 'hard'], 'difficulty', (v) => v[0].toUpperCase() + v.slice(1));
    r.querySelector('#seedRnd').onclick = () => { r.querySelector('#seedInput').value = this.randomSeed(); };
    r.querySelector('#btnStart').onclick = () => {
      s.seed = r.querySelector('#seedInput').value.trim();
      this.save();
      const theme = s.theme === 'random' ? THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)] : s.theme;
      this.onStart({ ...s, theme, seed: s.seed || this.randomSeed() });
    };
    // rosters
    const ro = r.querySelector('#rosters');
    for (const k of FACTION_KEYS) {
      const f = FACTIONS[k];
      const h = document.createElement('div');
      h.innerHTML = `<div style="color:${f.color};font-weight:800;margin:8px 0 4px">${f.name}</div><div style="margin-bottom:6px">${f.lore}</div>`;
      const ul = document.createElement('div'); ul.className = 'unitlist';
      for (const u of Object.values(f.units)) {
        const d = document.createElement('div'); d.className = 'u';
        d.innerHTML = `${unitIconSVG(k, u.shape, f.color, 26)}<div><b>${u.name}</b> <span class="m">· ${u.size > 1 ? u.size + ' members' : 'single'} · ${u.cost.ore} ore${u.cost.flux ? ' ' + u.cost.flux + ' flux' : ''}</span><br>${u.desc}<br><span class="m">Strong vs ${u.strong}. Weak vs ${u.weak}.</span></div>`;
        ul.appendChild(d);
      }
      for (const b of Object.values(f.buildings)) {
        const d = document.createElement('div'); d.className = 'u';
        d.innerHTML = `${buildingIconSVG(k, b, f.color, 26)}<div><b>${b.name}</b> <span class="m">· ${b.cost.ore ? b.cost.ore + ' ore' : 'HQ'}${b.cost.flux ? ' ' + b.cost.flux + ' flux' : ''}</span><br>${b.desc}</div>`;
        ul.appendChild(d);
      }
      h.appendChild(ul); ro.appendChild(h);
    }
    this.updateBlurb();
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) r.querySelector('#installHint').textContent = 'Installed. Tip: play in landscape.';
  }
  updateBlurb() {
    const t = this.settings.theme;
    const el = this.root.querySelector('#themeChips');
    let b = el.nextElementSibling;
    if (!b || !b.classList.contains('sub')) { b = document.createElement('div'); b.className = 'sub'; b.style.marginTop = '6px'; el.after(b); }
    b.textContent = t === 'random' ? 'A random theme every battle.' : THEMES[t].blurb;
  }

  showPause(handlers) {
    const r = this.pauseRoot;
    r.innerHTML = `<div class="panel" style="max-width:360px;text-align:center">
      <h1 style="font-size:24px">PAUSED</h1>
      <button class="big" id="pResume">RESUME</button>
      <button class="big secondary" id="pSound">${handlers.muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
      <button class="big secondary" id="pRestart">Restart battle</button>
      <button class="big secondary" id="pQuit">Quit to menu</button>
      <div class="help" style="margin-top:14px;text-align:left">
        <b>Quick reference</b><br>Tap = select / move · Tap enemy = attack · Long-press = attack-move · Pinch = zoom · Squad icons (top) select squads · <b>Retreat</b> sprints a squad home to recover morale · <b>Reinforce</b> refills a squad anywhere.
      </div></div>`;
    r.classList.remove('hidden');
    r.querySelector('#pResume').onclick = () => { r.classList.add('hidden'); handlers.resume(); };
    r.querySelector('#pSound').onclick = (e) => { const m = handlers.toggleSound(); e.target.textContent = m ? '🔇 Sound off' : '🔊 Sound on'; };
    r.querySelector('#pRestart').onclick = () => { r.classList.add('hidden'); handlers.restart(); };
    r.querySelector('#pQuit').onclick = () => { r.classList.add('hidden'); handlers.quit(); };
  }
  hidePause() { this.pauseRoot.classList.add('hidden'); }

  showGameOver({ won, time, me, enemy, handlers }) {
    const r = this.overRoot;
    const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    r.innerHTML = `<div class="panel">
      <h1 style="color:${won ? '#7CFC9A' : '#ff5f5f'}">${won ? 'VICTORY' : 'DEFEAT'}</h1>
      <div class="sub">${won ? 'The enemy headquarters is rubble.' : 'Your headquarters has fallen.'} · ${fmt(time)}</div>
      <div class="stats">
        <span>Squads killed</span><span>${me.kills} vs ${enemy.kills}</span>
        <span>Squads lost</span><span>${me.losses} vs ${enemy.losses}</span>
        <span>Structures destroyed</span><span>${me.destroyed} vs ${enemy.destroyed}</span>
        <span>Points captured</span><span>${me.captured} vs ${enemy.captured}</span>
      </div>
      <button class="big" id="goAgain">BATTLE AGAIN</button>
      <button class="big secondary" id="goMenu">Main menu</button>
    </div>`;
    r.classList.remove('hidden');
    r.querySelector('#goAgain').onclick = () => { r.classList.add('hidden'); handlers.restart(); };
    r.querySelector('#goMenu').onclick = () => { r.classList.add('hidden'); handlers.quit(); };
  }
}
