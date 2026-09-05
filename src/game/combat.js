// Pure combat helpers: cover, flanking, damage multipliers.
import { T, TILE, TILE_COVER_IN, TILE_COVER_ADJ } from '../map/terrain.js';
import { DMG_MATRIX } from './data.js';
import { angleDiff } from '../engine/math.js';

/**
 * Cover level for a unit at world (x,y) being attacked from (sx,sy).
 * 0 none, 1 light (standing in brush/crater/rubble), 2 heavy (obstacle between unit and shooter).
 */
export function coverAt(map, x, y, sx, sy) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return 0;
  let level = TILE_COVER_IN[map.tiles[ty * map.w + tx]];
  if (sx !== undefined) {
    // Direction towards shooter, rounded to 8 directions.
    const ang = Math.atan2(sy - y, sx - x);
    const dir = Math.round(ang / (Math.PI / 4));
    const DX = [1, 1, 0, -1, -1, -1, 0, 1], DY = [0, 1, 1, 1, 0, -1, -1, -1];
    const d = ((dir % 8) + 8) % 8;
    const nx = tx + DX[d], ny = ty + DY[d];
    if (nx >= 0 && ny >= 0 && nx < map.w && ny < map.h) {
      const adj = TILE_COVER_ADJ[map.tiles[ny * map.w + nx]];
      if (adj > level) level = adj;
    }
    // Also check the two neighbouring directions for a slightly generous heavy cover.
    if (level < 2) {
      for (const dd of [(d + 1) % 8, (d + 7) % 8]) {
        const ax = tx + DX[dd], ay = ty + DY[dd];
        if (ax >= 0 && ay >= 0 && ax < map.w && ay < map.h && TILE_COVER_ADJ[map.tiles[ay * map.w + ax]] === 2) { level = 2; break; }
      }
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
