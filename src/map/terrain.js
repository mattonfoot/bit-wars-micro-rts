// Tile types. Kept as small ints so the map is a Uint8Array.
export const T = {
  GROUND: 0,
  ROAD: 1,
  WATER: 2,
  SHALLOW: 3,
  MOUNTAIN: 4,
  BRUSH: 5,
  ROCK: 6,
  WALL: 7,
  RUIN: 8,
  CRATER: 9,
  RUBBLE: 10,
  ORE: 11,
};

export const TILE = 32; // world units per tile

// Movement cost / speed multiplier per tile (0 = impassable)
export const TILE_SPEED = [1.0, 1.25, 0, 0.55, 0, 0.75, 0, 0, 0, 0.9, 0.85, 0];

// Cover: 0 none, 1 light (standing in), 2 heavy (adjacent obstacle facing attacker)
export const TILE_COVER_IN = [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0];
export const TILE_COVER_ADJ = [0, 0, 0, 0, 2, 0, 2, 2, 2, 0, 0, 0];

// Destructible HP (0 = not destructible)
export const TILE_HP = [0, 0, 0, 0, 0, 120, 380, 260, 700, 0, 0, 0];

export const isPassable = (t) => TILE_SPEED[t] > 0;
export const isBuildable = (t) => t === T.GROUND || t === T.ROAD || t === T.CRATER || t === T.RUBBLE;
export const blocksSight = (t) => t === T.MOUNTAIN || t === T.RUIN;
