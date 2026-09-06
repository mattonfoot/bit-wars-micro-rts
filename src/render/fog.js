// Fog of war as a tiny staggered image: two pixels per cell, odd rows shifted one pixel, so pixel
// centres coincide with hex centres. Drawn scaled up with smoothing, which gives soft edges cheaply.
import { THEMES } from '../map/themes.js';

export class FogLayer {
  constructor(map) {
    this.map = map; this.grid = map.grid;
    const g = this.grid;
    this.canvas = document.createElement('canvas');
    this.canvas.width = map.w * 2 + 1; this.canvas.height = map.h;
    this.ctx = this.canvas.getContext('2d');
    this.img = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const col = THEMES[map.theme].colors.fog;
    const n = parseInt(col.slice(1), 16);
    this.r = (n >> 16) & 255; this.g = (n >> 8) & 255; this.b = n & 255;
    // world rectangle the image maps onto (pixel row r centred on y = r*V + R; pixel px spans W/2)
    this.rect = { x: 0, y: g.R - g.V / 2, w: this.canvas.width * (g.W / 2), h: map.h * g.V };
    this.version = -1;
    const d = this.img.data;
    for (let i = 0; i < d.length; i += 4) { d[i] = this.r; d[i + 1] = this.g; d[i + 2] = this.b; d[i + 3] = 236; }
  }
  update(vision, version) {
    if (version === this.version) return;
    this.version = version;
    const d = this.img.data, W = this.canvas.width, w = this.map.w;
    for (let i = 0; i < vision.length; i++) {
      const v = vision[i];
      const a = v === 2 ? 0 : v === 1 ? 120 : 236;
      const row = (i / w) | 0, col = i - row * w;
      const px = (row * W + col * 2 + (row & 1)) * 4;
      d[px + 3] = a; d[px + 7] = a;
    }
    this.ctx.putImageData(this.img, 0, 0);
  }
}
