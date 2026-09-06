// Tactical minimap: terrain, fog, points, structures, known enemy positions, camera frame, alerts.
import { TILE } from '../map/terrain.js';
import { factionColors } from '../render/shapes.js';

export class Minimap {
  constructor(canvas, world, renderer, viewer) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.world = world; this.renderer = renderer; this.viewer = viewer;
    this.size = 150;
    this.alerts = [];
    this.terrainCache = document.createElement('canvas');
    this.dirty = true;
    this.resize();
  }
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const css = this.size;
    this.canvas.style.width = css + 'px'; this.canvas.style.height = css + 'px';
    this.canvas.width = css * dpr; this.canvas.height = css * dpr;
    this.terrainCache.width = css * dpr; this.terrainCache.height = css * dpr;
    this.dpr = dpr; this.dirty = true;
  }
  alert(x, y) { this.alerts.push({ x, y, t: 0 }); }
  toWorld(mx, my) { const s = (this.world.w * TILE) / this.size; return [mx * s, my * s]; }
  draw(camera, dt) {
    const { ctx, world, size, dpr } = this;
    const scale = (size * dpr) / (world.w * TILE);
    if (this.dirty) {
      const tc = this.terrainCache.getContext('2d');
      tc.imageSmoothingEnabled = false;
      tc.drawImage(this.renderer.terrain.mini, 0, 0, this.terrainCache.width, this.terrainCache.height);
      this.dirty = false;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.terrainCache, 0, 0);
    ctx.save();
    ctx.scale(scale, scale);
    // fog
    if (this.renderer.showFog) { ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.85; ctx.drawImage(this.renderer.fog.canvas, 0, 0, world.w * TILE, world.h * TILE); ctx.globalAlpha = 1; }
    const vis = (x, y) => !this.renderer.showFog || world.visible(this.viewer, x, y);
    const vf = world.players[this.viewer].faction;
    // known enemy buildings
    for (const k of world.players[this.viewer].known.values()) {
      const c = factionColors(k.faction, k.owner, this.viewer, vf);
      ctx.fillStyle = c.fill; ctx.globalAlpha = 0.6; ctx.fillRect(k.tx * TILE, k.ty * TILE, k.w * TILE, k.h * TILE); ctx.globalAlpha = 1;
    }
    // buildings
    for (const b of world.buildings) {
      if (b.dead) continue;
      if (b.owner !== this.viewer && !vis(b.x, b.y)) continue;
      const c = factionColors(b.faction, b.owner, this.viewer, vf);
      ctx.fillStyle = c.fill; ctx.fillRect(b.tx * TILE, b.ty * TILE, b.w * TILE, b.h * TILE);
      if (b.def.hq) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / scale; ctx.strokeRect(b.tx * TILE, b.ty * TILE, b.w * TILE, b.h * TILE); }
    }
    // points
    for (const p of world.points) {
      ctx.fillStyle = p.owner >= 0 ? factionColors(world.players[p.owner].faction, p.owner, this.viewer, vf).fill : '#cfd3d8';
      ctx.beginPath(); ctx.arc(p.x, p.y, TILE * 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1 / scale; ctx.stroke();
      if (p.contested) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 / scale; ctx.beginPath(); ctx.arc(p.x, p.y, TILE * 1.6, 0, Math.PI * 2); ctx.stroke(); }
    }
    // ore
    for (const o of world.ore) { if (!world.explored(this.viewer, o.tx, o.ty)) continue; ctx.fillStyle = '#ffe680'; ctx.fillRect(o.x - TILE * 0.5, o.y - TILE * 0.5, TILE, TILE); }
    // squads
    for (const s of world.squads) {
      if (s.dead) continue;
      const own = s.owner === this.viewer;
      if (!own && !vis(s.x, s.y)) continue;
      const c = factionColors(s.faction, s.owner, this.viewer, vf);
      ctx.fillStyle = c.fill; ctx.beginPath(); ctx.arc(s.x, s.y, TILE * (own ? 0.75 : 0.85), 0, Math.PI * 2); ctx.fill();
      if (own) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1 / scale; ctx.stroke(); }
    }
    // alerts
    this.alerts = this.alerts.filter((a) => (a.t += dt) < 3);
    for (const a of this.alerts) { ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 2 / scale; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(a.t * 12); ctx.beginPath(); ctx.arc(a.x, a.y, TILE * (2 + (a.t % 1) * 3), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    // camera
    const vr = camera.visibleRect();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / scale; ctx.strokeRect(vr.x0, vr.y0, vr.x1 - vr.x0, vr.y1 - vr.y0);
    ctx.restore();
  }
}
