// Pure combat helpers: cover, flanking, damage multipliers.
import { TILE_COVER_IN, TILE_COVER_ADJ } from '../map/terrain.js';
import { DMG_MATRIX } from './data.js';
import { angleDiff } from '../engine/math.js';

/**
 * Cover level for a unit at world (x,y) being attacked from (sx,sy).
 * 0 none, 1 light (standing in brush/crater/rubble), 2 heavy (obstacle between unit and shooter).
 */
export function coverAt(map, x, y, sx, sy) {
  const g = map.grid;
  const i = g.cellAt(x, y);
  if (i < 0) return 0;
  let level = TILE_COVER_IN[map.tiles[i]];
  if (sx !== undefined && level < 2) {
    // Neighbouring cells within 60° of the direction to the shooter can give heavy cover.
    const ang = Math.atan2(sy - y, sx - x);
    for (let k = 0; k < 6; k++) {
      const n = g.neighbor(i, k);
      if (n < 0) continue;
      const na = Math.atan2(g.cys[n] - g.cys[i], g.cxs[n] - g.cxs[i]);
      if (Math.abs(angleDiff(ang, na)) > Math.PI / 3 + 0.05) continue;
      const adj = TILE_COVER_ADJ[map.tiles[n]];
      if (adj > level) level = adj;
    }
  }
  return level;
}

export const COVER_DMG = [1, 0.72, 0.5];
export const COVER_SUPP = [1, 0.65, 0.4];
export const COVER_NAME = ['No cover', 'Light cover', 'Heavy cover'];

/** True if attack from (sx,sy) hits the target from behind its facing (more than 110° off). */
export function isFlank(target, sx, sy) {
  const toAttacker = Math.atan2(sy - target.y, sx - target.x);
  return Math.abs(angleDiff(target.facing, toAttacker)) > Math.PI * 0.61;
}

export function dmgMult(type, armor) {
  const row = DMG_MATRIX[type] || DMG_MATRIX.light;
  return row[armor] ?? 1;
}
