// Pre-rendered terrain layer. Drawn once per map (and per destroyed tile) at TILE px per tile.
import { T, TILE } from '../map/terrain.js';
import { THEMES } from '../map/themes.js';
import { hashString } from '../engine/rng.js';
import { TAU } from '../engine/math.js';

function h2(i, salt) { // deterministic 0..1 per tile
  let x = (i * 374761393 + salt * 668265263) | 0; x = (x ^ (x >>> 13)) * 1274126177; x = x ^ (x >>> 16); return (x >>> 0) / 4294967296;
}

export class TerrainLayer {
  constructor(map) {
    this.map = map;
    this.theme = THEMES[map.theme];
    this.canvas = document.createElement('canvas');
    this.canvas.width = map.w * TILE; this.canvas.height = map.h * TILE;
    this.ctx = this.canvas.getContext('2d');
    this.drawAll();
  }
  drawAll() {
    const { w, h } = this.map;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.drawTile(x, y, true);
    // second pass for decorations that overlap neighbours
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.drawDecor(x, y);
  }
  redrawTile(i) {
    const { w } = this.map;
    const x = i % w, y = (i / w) | 0;
    // redraw a 3x3 neighbourhood so overlapping decorations look right
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < this.map.h) this.drawTile(nx, ny, true); }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < this.map.h) this.drawDecor(nx, ny); }
  }
  tile(x, y) { if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) return T.MOUNTAIN; return this.map.tiles[y * this.map.w + x]; }
  drawTile(x, y) {
    const c = this.ctx, C = this.theme.colors, i = y * this.map.w + x, t = this.map.tiles[i];
    const px = x * TILE, py = y * TILE;
    // base ground with variation
    c.fillStyle = C.ground[Math.floor(h2(i, 1) * C.ground.length)];
    c.fillRect(px, py, TILE, TILE);
    switch (t) {
      case T.ROAD: {
        c.fillStyle = C.road; c.fillRect(px, py, TILE, TILE);
        c.fillStyle = 'rgba(0,0,0,0.08)';
        for (let k = 0; k < 3; k++) c.fillRect(px + h2(i, 10 + k) * 26, py + h2(i, 20 + k) * 26, 4, 3);
        break;
      }
      case T.WATER: {
        c.fillStyle = C.water; c.fillRect(px, py, TILE, TILE);
        const deep = [this.tile(x - 1, y), this.tile(x + 1, y), this.tile(x, y - 1), this.tile(x, y + 1)].every((n) => n === T.WATER);
        if (deep) { c.fillStyle = C.waterDeep; c.fillRect(px + 4, py + 4, TILE - 8, TILE - 8); }
        c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1.5;
        c.beginPath(); const wy = py + 8 + h2(i, 3) * 16; c.moveTo(px + 4, wy); c.quadraticCurveTo(px + 12, wy - 4, px + 20, wy); c.stroke();
        break;
      }
      case T.SHALLOW: {
        c.fillStyle = C.shallow; c.fillRect(px, py, TILE, TILE);
        c.fillStyle = 'rgba(255,255,255,0.25)';
        for (let k = 0; k < 5; k++) c.fillRect(px + h2(i, 30 + k) * 28, py + h2(i, 40 + k) * 28, 3, 3);
        break;
      }
      case T.MOUNTAIN: {
        c.fillStyle = C.mountain; c.fillRect(px, py, TILE, TILE);
        break;
      }
      case T.BRUSH: {
        c.fillStyle = C.brush; c.globalAlpha = 0.45; c.fillRect(px, py, TILE, TILE); c.globalAlpha = 1;
        break;
      }
      case T.CRATER: {
        const g = c.createRadialGradient(px + 16, py + 16, 2, px + 16, py + 16, 15);
        g.addColorStop(0, C.crater); g.addColorStop(0.75, C.crater); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(px + 16, py + 16, 15, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; c.beginPath(); c.arc(px + 16, py + 16, 11, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(px + 16, py + 16, 11, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
        break;
      }
      case T.RUBBLE: {
        c.fillStyle = C.rubble;
        for (let k = 0; k < 7; k++) { const s = 3 + h2(i, 60 + k) * 6; c.fillRect(px + h2(i, 50 + k) * (TILE - s), py + h2(i, 70 + k) * (TILE - s), s, s * 0.7); }
        c.fillStyle = 'rgba(0,0,0,0.2)';
        for (let k = 0; k < 4; k++) c.fillRect(px + h2(i, 80 + k) * 28, py + h2(i, 90 + k) * 28, 3, 2);
        break;
      }
      case T.ORE: {
        c.fillStyle = C.oreDark; c.beginPath(); c.arc(px + 16, py + 16, 14, 0, TAU); c.fill();
        c.fillStyle = C.ore;
        for (let k = 0; k < 4; k++) {
          const a = k * 1.6 + h2(i, 5) * 2, r = 6 + h2(i, 6 + k) * 4;
          const cx = px + 16 + Math.cos(a) * 5, cy = py + 16 + Math.sin(a) * 5;
          c.beginPath(); c.moveTo(cx, cy - r); c.lineTo(cx + r * 0.6, cy); c.lineTo(cx, cy + r); c.lineTo(cx - r * 0.6, cy); c.closePath(); c.fill();
        }
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(px + 13, py + 12, 2.5, 0, TAU); c.fill();
        break;
      }
      default: {
        // ground speckle
        c.fillStyle = 'rgba(0,0,0,0.07)';
        for (let k = 0; k < 3; k++) c.fillRect(px + h2(i, 100 + k) * 30, py + h2(i, 110 + k) * 30, 2, 2);
        if (this.theme.decor === 'trees' && h2(i, 7) < 0.12) { c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(px + h2(i, 8) * 32, py + h2(i, 9) * 32, 3, 0, TAU); c.fill(); }
        if (this.theme.decor === 'crystals' && h2(i, 7) < 0.1) { c.strokeStyle = 'rgba(0,0,0,0.1)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px, py + h2(i, 8) * 32); c.quadraticCurveTo(px + 16, py + h2(i, 9) * 32, px + 32, py + h2(i, 8) * 32); c.stroke(); }
      }
    }
  }
  drawDecor(x, y) {
    const c = this.ctx, C = this.theme.colors, i = y * this.map.w + x, t = this.map.tiles[i];
    const px = x * TILE, py = y * TILE;
    const decor = this.theme.decor;
    switch (t) {
      case T.MOUNTAIN: {
        // jagged peak with light/shadow faces, slightly larger than the tile
        const cx = px + 16 + (h2(i, 11) - 0.5) * 6, cy = py + 14 + (h2(i, 12) - 0.5) * 6;
        const r = 17 + h2(i, 13) * 6;
        const pts = [];
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + h2(i, 14 + k) * 0.6; const rr = r * (0.75 + h2(i, 20 + k) * 0.35); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
        c.fillStyle = C.mountainDark; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]); c.closePath(); c.fill();
        c.fillStyle = C.mountain; c.beginPath(); c.moveTo(cx, cy - r * 0.9); c.lineTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(cx, cy); c.closePath(); c.fill();
        c.fillStyle = C.mountainLight; c.beginPath(); c.moveTo(cx, cy - r * 0.9); c.lineTo(pts[4][0], pts[4][1]); c.lineTo(pts[5][0], pts[5][1]); c.lineTo(cx, cy); c.closePath(); c.fill();
        if (decor === 'pines' || decor === 'trees') { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(cx, cy - r * 0.9); c.lineTo(cx + 5, cy - r * 0.5); c.lineTo(cx - 5, cy - r * 0.5); c.closePath(); c.fill(); }
        break;
      }
      case T.BRUSH: {
        const n = 3 + Math.floor(h2(i, 15) * 3);
        for (let k = 0; k < n; k++) {
          const bx = px + 5 + h2(i, 30 + k) * 22, by = py + 5 + h2(i, 40 + k) * 22, r = 4 + h2(i, 50 + k) * 5;
          if (decor === 'pines') {
            c.fillStyle = C.brush; c.beginPath(); c.moveTo(bx, by - r * 1.4); c.lineTo(bx + r, by + r * 0.6); c.lineTo(bx - r, by + r * 0.6); c.closePath(); c.fill();
            c.fillStyle = C.brushDot; c.beginPath(); c.moveTo(bx, by - r * 1.4); c.lineTo(bx + r * 0.5, by); c.lineTo(bx - r * 0.5, by); c.closePath(); c.fill();
          } else if (decor === 'crystals' || decor === 'embers') {
            c.fillStyle = C.brush; c.beginPath(); c.ellipse(bx, by, r * 0.7, r * 1.1, h2(i, 60 + k) * 3, 0, TAU); c.fill();
            c.fillStyle = C.brushDot; c.beginPath(); c.ellipse(bx, by - 1, r * 0.3, r * 0.6, h2(i, 60 + k) * 3, 0, TAU); c.fill();
          } else {
            c.fillStyle = C.brush; c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill();
            c.fillStyle = C.brushDot; c.beginPath(); c.arc(bx - r * 0.3, by - r * 0.3, r * 0.5, 0, TAU); c.fill();
          }
        }
        break;
      }
      case T.ROCK: {
        const cx = px + 16, cy = py + 16, r = 11 + h2(i, 16) * 4;
        const pts = [];
        for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; const rr = r * (0.7 + h2(i, 70 + k) * 0.4); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.moveTo(pts[0][0] + 3, pts[0][1] + 3); for (const p of pts) c.lineTo(p[0] + 3, p[1] + 3); c.closePath(); c.fill();
        c.fillStyle = C.rock; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]); c.closePath(); c.fill();
        c.strokeStyle = C.rockDark; c.lineWidth = 2; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(cx - r * 0.3, cy - r * 0.35, r * 0.25, 0, TAU); c.fill();
        break;
      }
      case T.WALL: {
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 5, py + 5, TILE - 4, TILE - 4);
        c.fillStyle = C.wall; c.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1.5;
        c.beginPath();
        for (let r = 0; r < 3; r++) { const yy = py + 2 + (r + 1) * 9; c.moveTo(px + 2, yy); c.lineTo(px + TILE - 2, yy); const off = r % 2 ? 8 : 16; c.moveTo(px + 2 + off, yy - 9); c.lineTo(px + 2 + off, yy); }
        c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.strokeRect(px + 2.5, py + 2.5, TILE - 5, TILE - 5);
        break;
      }
      case T.RUIN: {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(px + 4, py + 4, TILE, TILE);
        c.fillStyle = C.ruinDark; c.fillRect(px, py, TILE, TILE);
        c.fillStyle = C.ruin; c.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        c.fillStyle = C.ruinDark;
        for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) if (h2(i, 200 + r * 2 + k) < 0.75) c.fillRect(px + 6 + k * 13, py + 6 + r * 13, 7, 7);
        c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(px + 2, py + 2, TILE - 4, 3);
        break;
      }
      default: break;
    }
  }
}
