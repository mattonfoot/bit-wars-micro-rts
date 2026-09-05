// Fog of war overlay: 1 pixel per tile, scaled up with smoothing for soft edges.
import { THEMES } from '../map/themes.js';

export class FogLayer {
  constructor(map) {
    this.map = map;
    this.canvas = document.createElement('canvas');
    this.canvas.width = map.w; this.canvas.height = map.h;
    this.ctx = this.canvas.getContext('2d');
    this.img = this.ctx.createImageData(map.w, map.h);
    const col = THEMES[map.theme].colors.fog;
    const n = parseInt(col.slice(1), 16);
    this.r = (n >> 16) & 255; this.g = (n >> 8) & 255; this.b = n & 255;
    this.version = -1;
  }
  update(vision, version) {
    if (version === this.version) return;
    this.version = version;
    const d = this.img.data;
    for (let i = 0; i < vision.length; i++) {
      const v = vision[i];
      const o = i * 4;
      d[o] = this.r; d[o + 1] = this.g; d[o + 2] = this.b;
      d[o + 3] = v === 2 ? 0 : v === 1 ? 120 : 236;
    }
    this.ctx.putImageData(this.img, 0, 0);
  }
}
