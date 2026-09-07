// Campaign content index. Chapters live in ./chapters/{blue,red,green}.js.
// Position specs: 'base' | 'playerBase' | 'enemyBase' | 'enemyBase2' | 'center' | 'point:k' (k-th nearest strategic
// point to the player's base) | 'ore:k' (k-th nearest ore vein) | [dx,dy] cells from the owner's base.
// Objective types: train, build, hero, kill, destroy, destroyHq (all:true for every enemy), destroyAll, capture, hold,
// survive, reinforce, attach, retreat, rally, cover, flank, broken, terrain, pop, moveTo, setup, shieldRegen, loseMax.
import { BLUE } from './chapters/blue.js';
import { RED } from './chapters/red.js';
import { GREEN } from './chapters/green.js';

export const LORE = {
  world: 'The Lattice was once a single crystal world. When it cracked, three peoples woke in the fracture: the Vector Swarm, endlessly dividing triangles born along the shear-lines; the Iron Foundry, square-cut folk of the deep forges who believe only in what lasts; and the Aegis Collective, contemplative spheres who read the future in the pattern of the break. At the heart of the Lattice lies the Prime Vein, the seam of ore that held the world together. Whoever holds it can forge the Lattice anew, in their own shape.',
};

export const CAMPAIGNS = { blue: BLUE, red: RED, green: GREEN };
export function chapterByKey(key) { for (const c of Object.values(CAMPAIGNS)) { const i = c.chapters.findIndex((ch) => ch.key === key); if (i >= 0) return { campaign: c, chapter: c.chapters[i], index: i }; } return null; }
export function actOf(campaign, index) { let a = null; for (const act of campaign.acts || []) if (index >= act.from) a = act; return a; }
