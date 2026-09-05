// 2D camera: world units -> screen pixels, with pan/zoom and map clamping.
import { clamp } from './math.js';

export class Camera {
  constructor() {
    this.x = 0; this.y = 0; this.zoom = 1;
    this.viewW = 1; this.viewH = 1; this.dpr = 1;
    this.minZoom = 0.25; this.maxZoom = 2.6;
    this.worldW = 1000; this.worldH = 1000;
  }
  resize(viewW, viewH, dpr) { this.viewW = viewW; this.viewH = viewH; this.dpr = dpr; this.updateMinZoom(); this.clampPos(); }
  setWorld(w, h) { this.worldW = w; this.worldH = h; this.updateMinZoom(); }
  updateMinZoom() { this.minZoom = Math.max(0.18, Math.min(this.viewW / this.worldW, this.viewH / this.worldH) * 0.95); if (this.zoom < this.minZoom) this.zoom = this.minZoom; }
  screenToWorld(sx, sy) { return [this.x + (sx - this.viewW / 2) / this.zoom, this.y + (sy - this.viewH / 2) / this.zoom]; }
  worldToScreen(wx, wy) { return [(wx - this.x) * this.zoom + this.viewW / 2, (wy - this.y) * this.zoom + this.viewH / 2]; }
  pan(dx, dy) { this.x -= dx / this.zoom; this.y -= dy / this.zoom; this.clampPos(); }
  zoomAt(factor, sx, sy) {
    const [wx, wy] = this.screenToWorld(sx, sy);
    this.zoom = clamp(this.zoom * factor, this.minZoom, this.maxZoom);
    const [nx, ny] = this.screenToWorld(sx, sy);
    this.x += wx - nx; this.y += wy - ny;
    this.clampPos();
  }
  centerOn(wx, wy) { this.x = wx; this.y = wy; this.clampPos(); }
  clampPos() {
    const hw = this.viewW / 2 / this.zoom, hh = this.viewH / 2 / this.zoom;
    const margin = 64;
    if (hw * 2 >= this.worldW + margin * 2) this.x = this.worldW / 2; else this.x = clamp(this.x, hw - margin, this.worldW - hw + margin);
    if (hh * 2 >= this.worldH + margin * 2) this.y = this.worldH / 2; else this.y = clamp(this.y, hh - margin, this.worldH - hh + margin);
  }
  visibleRect() {
    const hw = this.viewW / 2 / this.zoom, hh = this.viewH / 2 / this.zoom;
    return { x0: this.x - hw, y0: this.y - hh, x1: this.x + hw, y1: this.y + hh };
  }
  apply(ctx) {
    const z = this.zoom * this.dpr;
    ctx.setTransform(z, 0, 0, z, (this.viewW / 2 - this.x * this.zoom) * this.dpr, (this.viewH / 2 - this.y * this.zoom) * this.dpr);
  }
}
