// Small builders shared by the faction chapter files.
export const garrison = (faction, o = {}) => ({ faction, hq: false, ai: null, squads: o.squads || [], structures: o.structures || [], points: o.points || [] });
export const war = (faction, ai, o = {}) => ({ faction, ai, incomeMult: o.incomeMult || 1, structures: o.structures || [], squads: o.squads || [], points: o.points || [4, 5, 6], hq: o.hq });
export const obj = (id, type, text, extra = {}) => ({ id, type, text, ...extra });
export const stage = (objectives, intro) => (intro ? { intro, objectives } : { objectives });
export const wave = (at, units, extra = {}) => ({ at, units, ...extra });
// Standard forward bases per faction for enemy setups.
export const BASE = {
  blue: { ext: 'lode', prod: 'nest', prod2: 'spire', turret: 'thorn', post: 'claim', up: null },
  red: { ext: 'drill', prod: 'works', prod2: 'works', turret: 'bunker', post: 'post', up: 'armory' },
  green: { ext: 'siphon', prod: 'array', prod2: 'array', turret: 'bastion', post: 'beacon', up: 'sanctum' },
};
export const T1 = { blue: ['darts', 'needles'], red: ['bolts', 'hammers'], green: ['wardens', 'lenses'] };
export const T2 = { blue: ['wedges', 'kites'], red: ['breachers', 'crusher'], green: ['pulsers', 'halo'] };
export const T3 = { blue: 'obelisk', red: 'mortar', green: 'nova' };
export const HERO = { blue: 'apex', red: 'foreman', green: 'oracle' };
export const HQ = { blue: 'Hive', red: 'Foundry', green: 'Core' };
/** A fortified enemy main base for full-war chapters. */
export function fortified(faction, ai, extra = {}) {
  const B = BASE[faction];
  const structures = [{ key: B.turret, at: [-4, 4] }, { key: B.turret, at: [4, -4] }, { key: B.prod, at: [5, 3] }, { key: B.ext, at: 'ore:6' }, { key: B.ext, at: 'ore:7' }, ...(extra.structures || [])];
  const squads = [{ key: T1[faction][0], at: [0, 5], n: 2 }, { key: T1[faction][1], at: [-3, 2] }, ...(extra.squads || [])];
  return war(faction, ai, { incomeMult: extra.incomeMult || 1.1, structures, squads, points: extra.points || [4, 5, 6] });
}
