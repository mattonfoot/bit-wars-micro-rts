// Scenario style builders. Each returns the mechanical part of a chapter (player/enemy setup, spawns,
// objectives) for a player faction `f` against rival factions, scaled by tier (1 = opening, 8 = finale).
import { obj, stage, wave } from './common.js';

export const R = {
  blue: { t1: ['darts', 'needles'], t2: ['wedges', 'kites'], t3: 'obelisk', hero: 'apex', heavy: 'obelisk', fast: 'wedges', ext: 'lode', prod: 'nest', prod2: 'spire', turret: 'thorn', post: 'claim', up: null, hq: 'hive', vehicle: 'kites', extName: 'Lode Burrow', turretName: 'Thorn', postName: 'Claim Spike', prodName: 'Nest', hqName: 'Hive', heavyName: 'Obelisk', heroName: 'the Apex' },
  red: { t1: ['bolts', 'hammers'], t2: ['breachers', 'crusher'], t3: 'mortar', hero: 'foreman', heavy: 'crusher', fast: 'breachers', ext: 'drill', prod: 'works', prod2: 'works', turret: 'bunker', post: 'post', up: 'armory', hq: 'foundry', vehicle: 'crusher', extName: 'Drill Rig', turretName: 'Bunker', postName: 'Watch Post', prodName: 'Iron Works', hqName: 'Foundry', heavyName: 'Crusher Tank', heroName: 'the Foreman' },
  green: { t1: ['wardens', 'lenses'], t2: ['pulsers', 'halo'], t3: 'nova', hero: 'oracle', heavy: 'nova', fast: 'pulsers', ext: 'siphon', prod: 'array', prod2: 'array', turret: 'bastion', post: 'beacon', up: 'sanctum', hq: 'core', vehicle: 'halo', extName: 'Siphon', turretName: 'Bastion', postName: 'Beacon', prodName: 'Array', hqName: 'Core', heavyName: 'Nova Sphere', heroName: 'the Oracle' },
};
const AI_BY_TIER = ['easy', 'easy', 'normal', 'normal', 'normal', 'hard', 'hard', 'hard'];
const aiFor = (tier) => AI_BY_TIER[Math.max(0, Math.min(7, tier - 1))];

/** Player starting kit scaled by tier. */
export function playerKit(f, tier, extra = {}) {
  const r = R[f];
  const kit = { faction: f, ore: 450 + tier * 45, flux: 120 + tier * 25 };
  if (tier >= 3) kit.structures = [{ key: r.prod, at: [-4, 3] }];
  if (tier >= 6 && r.prod2 !== r.prod) kit.structures.push({ key: r.prod2, at: [4, -3] });
  kit.squads = [{ key: r.t1[0], at: [3, 4], n: tier >= 4 ? 2 : 1 }, { key: r.t1[1], at: [5, 2] }];
  if (tier >= 3) kit.squads.push({ key: r.t2[0], at: [2, 6] });
  if (tier >= 5) kit.squads.push({ key: r.hero, at: [2, 2] });
  return { ...kit, ...extra };
}
/** Escalating waves from a rival roster. */
export function wavesFor(rival, tier, count, opts = {}) {
  const r = R[rival], out = [];
  const start = opts.start || 70, every = opts.every || 85;
  for (let k = 0; k < count; k++) {
    const units = [{ key: r.t1[0], n: 1 + Math.floor((k + tier) / 3) }];
    if (k >= 1) units.push({ key: r.t1[1], n: 1 });
    if (k >= 2 && tier >= 2) units.push({ key: r.t2[0], n: 1 });
    if (k >= 3 && tier >= 3) units.push({ key: r.vehicle, n: 1 });
    if (k >= 4 && tier >= 4) units.push({ key: r.t3, n: 1 });
    if (k === count - 1 && tier >= 5) units.push({ key: r.hero, n: 1 });
    out.push(wave(start + k * every, units, { owner: opts.owner, from: opts.from, target: opts.target, text: opts.texts?.[k] || `${rival === 'blue' ? 'Swarm' : rival === 'red' ? 'Foundry' : 'Collective'} wave ${k + 1}.` }));
  }
  return out;
}
/** A static garrison of a rival on given point ranks. */
export function garrisonOf(rival, ranks, tier, extra = {}) {
  const r = R[rival];
  const structures = [], squads = [];
  ranks.forEach((k, i) => {
    structures.push({ key: r.post, at: 'point:' + k });
    if (i % 2 === 0 || tier >= 4) structures.push({ key: r.turret, at: 'point:' + k });
    squads.push({ key: r.t1[i % 2], at: 'point:' + k, order: r.t1[i % 2] === 'hammers' || r.t1[i % 2] === 'lenses' ? 'hold' : undefined });
    if (tier >= 3) squads.push({ key: r.t2[i % 2], at: 'point:' + k });
  });
  return { faction: rival, hq: false, ai: null, structures: [...structures, ...(extra.structures || [])], squads: [...squads, ...(extra.squads || [])], points: ranks, ...extra.override };
}
/** A living rival base. */
export function liveEnemy(rival, tier, extra = {}) {
  const r = R[rival];
  const structures = [{ key: r.turret, at: [-4, 4] }, { key: r.turret, at: [4, -4] }, { key: r.prod, at: [5, 3] }, { key: r.ext, at: 'ore:6' }, { key: r.ext, at: 'ore:7' }];
  if (tier >= 5 && r.up) structures.push({ key: r.up, at: [-5, -3] });
  if (tier >= 6) structures.push({ key: r.post, at: 'point:5' }, { key: r.turret, at: [0, -6] });
  const squads = [{ key: r.t1[0], at: [0, 5], n: tier >= 4 ? 2 : 1 }, { key: r.t1[1], at: [-3, 2] }];
  if (tier >= 5) squads.push({ key: r.t2[1], at: [3, -4] });
  return { faction: rival, ai: extra.ai || aiFor(tier), incomeMult: extra.incomeMult ?? (0.85 + tier * 0.05), structures: [...structures, ...(extra.structures || [])], squads: [...squads, ...(extra.squads || [])], points: extra.points || [4, 5, 6], start: extra.start, team: extra.team, name: extra.name };
}
const capName = (r) => r === 'blue' ? 'Swarm' : r === 'red' ? 'Foundry' : 'Collective';
const an = (name) => (/^[aeiou]/i.test(name) ? 'an ' : 'a ') + name;

// ---------------- styles
export const STYLES = {
  /** Take a garrisoned position. */
  assault({ f, rival, tier, ranks = [2, 3, 4], holdN = 4 }) {
    const rr = R[rival];
    return {
      player: playerKit(f, tier), enemy: garrisonOf(rival, ranks, tier),
      stages: [
        stage([obj('posts', 'destroy', `Destroy ${ranks.length} ${rr.postName}s`, { key: rr.post, n: ranks.length }), obj('kill', 'kill', `Destroy ${ranks.length + 1} ${capName(rival)} squads`, { n: ranks.length + 1 })]),
        stage([obj('cap', 'capture', `Hold ${holdN} strategic points`, { n: holdN })]),
      ],
    };
  },
  /** Survive waves while holding points. */
  holdTheLine({ f, rival, tier, minutes = 7, points = 3, waves = 5 }) {
    const r = R[f];
    return {
      player: playerKit(f, tier, { structures: [{ key: r.prod, at: [-4, 3] }, { key: r.turret, at: [6, 1] }], points: [0, 1, 2].slice(0, points) }),
      enemy: { faction: rival, hq: false, ai: null, points: [4, 5] },
      waves: wavesFor(rival, tier, waves, { start: 60, every: Math.floor((minutes * 60 - 90) / waves) }),
      stages: [stage([obj('hold', 'hold', `Hold ${points} points for ${minutes} minutes`, { n: points, seconds: minutes * 60 }), obj('loss', 'loseMax', `Lose no more than ${2 + tier} squads`, { n: 2 + tier, optional: true })])],
    };
  },
  /** Survive until reinforcements arrive, then counter-attack. */
  countdown({ f, rival, tier, minutes = 10, waves = 7 }) {
    const r = R[f];
    const relief = [{ key: r.t1[0], n: 2 }, { key: r.t2[0], n: 1 }, { key: r.heavy, n: 1 }];
    return {
      player: playerKit(f, tier, { structures: [{ key: r.prod, at: [-4, 3] }, { key: r.turret, at: [6, 1] }, { key: r.turret, at: [-6, -1] }], points: [0, 1] }),
      enemy: garrisonOf(rival, [4, 5], tier, { override: { points: [3, 4, 5] } }),
      waves: wavesFor(rival, tier, waves, { start: 50, every: Math.floor((minutes * 60 - 80) / waves) }),
      spawns: [{ at: minutes * 60, owner: 'player', units: relief, from: 'playerBase', order: 'hold', text: 'Reinforcements have arrived. Counter-attack.' }],
      stages: [
        stage([obj('survive', 'survive', `Hold out for ${minutes} minutes until relief arrives`, { seconds: minutes * 60 }), obj('hq', 'protect', 'Keep your headquarters standing', { tag: 'hq' })]),
        stage([obj('posts', 'destroy', `Destroy the forward ${R[rival].postName}s`, { key: R[rival].post, n: 2 }), obj('cap', 'capture', 'Hold 4 points', { n: 4 })], 'Relief is here. Take the fight to them.'),
      ],
    };
  },
  /** Narrow-front defence with turrets and ranged units only. */
  chokepoint({ f, rival, tier, minutes = 6 }) {
    const r = R[f];
    return {
      player: playerKit(f, tier, { units: [r.t1[0], r.t1[1], r.t2[0]], buildings: [r.turret, r.ext, r.post], structures: [{ key: r.turret, at: [5, 2] }], points: [0] }),
      enemy: { faction: rival, hq: false, ai: null, points: [3, 4, 5] },
      waves: wavesFor(rival, tier, 5, { start: 60, every: Math.floor((minutes * 60 - 80) / 5), target: 'point:0' }),
      stages: [
        stage([obj('turrets', 'build', `Build 2 ${r.turretName}s`, { key: r.turret, n: 2 }), obj('post', 'build', `Fortify your point with ${an(r.postName)}`, { key: r.post, n: 1 })]),
        stage([obj('hold', 'hold', `Hold the pass for ${minutes} minutes`, { n: 1, seconds: minutes * 60 }), obj('broken', 'broken', 'Break 4 attacking squads', { n: 4 })], 'Static guns at the mouth of the pass, ranged squads behind them. Nothing gets through.'),
      ],
    };
  },
  /** Keep a fragile tagged structure alive under raids, then break the raiders. */
  protectStructure({ f, rival, tier, minutes = 6 }) {
    const r = R[f];
    return {
      player: playerKit(f, tier, { structures: [{ key: r.prod, at: [-4, 3] }, { key: r.up || r.prod2 || r.prod, at: 'point:0', tag: 'vip', hp: 0.6 }], points: [0] }),
      enemy: garrisonOf(rival, [3, 4], tier),
      waves: wavesFor(rival, tier, 4, { start: 60, every: Math.floor((minutes * 60 - 80) / 4), target: 'point:0', texts: ['Raiders heading for the structure.', 'A second raid. Intercept it early.', 'They are sending vehicles.', 'Last raid, everything they have.'] }),
      stages: [
        stage([obj('vip', 'protect', 'The structure at your forward point must survive', { tag: 'vip' }), obj('survive', 'survive', `Survive the raids (${minutes} minutes)`, { seconds: minutes * 60 })]),
        stage([obj('posts', 'destroy', `Destroy the raiders' ${R[rival].postName}s`, { key: R[rival].post, n: 2 }), obj('vip2', 'protect', 'The structure must still survive', { tag: 'vip' })], 'The raids are spent. Go and end them.'),
      ],
    };
  },
  /** Protect a tagged VIP squad while capturing. */
  protectVip({ f, rival, tier, ranks = [1, 2] }) {
    const r = R[f];
    return {
      player: playerKit(f, tier, { squads: [{ key: r.hero, at: [2, 2], tag: 'vip' }, { key: r.t1[0], at: [3, 4], n: 2 }, { key: r.t1[1], at: [5, 2] }] }),
      enemy: garrisonOf(rival, ranks, tier),
      waves: wavesFor(rival, tier, 3, { start: 90, every: 110, texts: ['Hunters are looking for your hero.', 'A second hunting party.', 'They are sending everything at the hero.'] }),
      stages: [
        stage([obj('vip', 'protect', `${r.heroName[0].toUpperCase() + r.heroName.slice(1)} must survive`, { tag: 'vip' }), ...ranks.map((k, i) => obj('cap' + k, 'capture', `Capture point ${i + 1} with ${r.heroName} in the army`, { rank: k }))]),
        stage([obj('vip2', 'protect', `${r.heroName[0].toUpperCase() + r.heroName.slice(1)} must survive`, { tag: 'vip' }), obj('kill', 'kill', 'Destroy the hunting parties', { n: 4 })]),
      ],
    };
  },
  /** No base: a hero and elite squads infiltrate and destroy a tagged target, then escape. */
  commando({ f, rival, tier, target = 'prod' }) {
    const r = R[f], rr = R[rival];
    return {
      player: { faction: f, hq: false, ore: 0, flux: 0, units: [], buildings: [], squads: [{ key: r.hero, at: [0, 0], tag: 'hero' }, { key: r.t2[0], at: [2, 0] }, { key: r.t1[1], at: [0, 2] }] },
      enemy: { faction: rival, hq: false, ai: null, structures: [{ key: rr[target], at: 'enemyBase', tag: 'target' }, { key: rr.turret, at: [-3, 3] }, { key: rr.turret, at: [3, -3] }, { key: rr.ext, at: 'ore:6' }, { key: rr.post, at: 'point:5' }, { key: rr.turret, at: 'point:3' }], squads: [{ key: rr.t1[0], at: 'point:3' }, { key: rr.t1[1], at: 'point:5', order: 'hold' }, { key: rr.t1[0], at: [0, 4], n: 2 }, { key: rr.t2[0], at: [-4, 0] }], points: [3, 4, 5, 6] },
      lose: { hq: false, army: true },
      stages: [
        stage([obj('hero', 'protect', `${r.heroName[0].toUpperCase() + r.heroName.slice(1)} must survive`, { tag: 'hero' }), obj('target', 'killTag', `Destroy the enemy ${rr[target + 'Name'] || 'facility'}`, { tag: 'target' })], 'No base, no reinforcements. Skirt the turrets, use cover, and hit the facility from the side.'),
        stage([obj('hero2', 'protect', `${r.heroName[0].toUpperCase() + r.heroName.slice(1)} must survive`, { tag: 'hero' }), obj('escape', 'moveTo', `Get ${r.heroName} back to the extraction point`, { at: 'playerBase', radius: 4, tag: 'hero' })], 'Now get out.'),
      ],
      hints: [{ at: 'start', text: 'Retreat will not save you here: there is no base. Pull back into cover by hand and let shields or morale recover.' }],
    };
  },
  /** Escort a slow tagged unit across the map through ambushes. */
  escort({ f, rival, tier }) {
    const r = R[f], rr = R[rival];
    return {
      player: { faction: f, hq: false, ore: 0, flux: 0, units: [], buildings: [], squads: [{ key: r.heavy, at: [0, 0], tag: 'convoy' }, { key: r.t1[0], at: [2, 1], n: 2 }, { key: r.t1[1], at: [0, 2] }, { key: r.t2[0], at: [-2, 1] }] },
      enemy: { faction: rival, hq: false, ai: null, structures: [{ key: rr.turret, at: 'point:2' }, { key: rr.post, at: 'point:4' }], squads: [{ key: rr.t1[1], at: 'point:2', order: 'hold' }, { key: rr.t2[0], at: 'point:4' }], points: [2, 4, 5] },
      waves: [wave(80, [{ key: rr.t1[0], n: 2 }], { from: 'point:1', target: 'point:0', text: 'Ambush on the road.' }), wave(200, [{ key: rr.fast, n: 2 }], { from: 'point:3', target: 'point:2', text: 'Fast movers coming for the convoy.' }), wave(330, [{ key: rr.vehicle, n: 1 }, { key: rr.t1[0], n: 1 }], { from: 'point:5', target: 'point:4', text: 'A vehicle blocks the far road.' })],
      lose: { hq: false, army: true },
      stages: [
        stage([obj('convoy', 'protect', `The ${r.heavyName} must survive`, { tag: 'convoy' }), obj('leg1', 'escort', `Bring the ${r.heavyName} to the second point`, { tag: 'convoy', at: 'point:2', radius: 3 })], 'The convoy is slow and everything on the road wants it dead. Scout ahead, clear, then move it.'),
        stage([obj('convoy2', 'protect', `The ${r.heavyName} must survive`, { tag: 'convoy' }), obj('leg2', 'escort', `Bring the ${r.heavyName} to the far point`, { tag: 'convoy', at: 'point:5', radius: 3 })]),
      ],
      hints: [{ at: 'start', text: 'Move the escort first, the convoy second. Never let the convoy lead.' }],
    };
  },
  /** No base: rescue neutral squads and capture abandoned structures, then strike. */
  scavenge({ f, rival, tier }) {
    const r = R[f], rr = R[rival];
    return {
      player: { faction: f, hq: false, ore: 150, flux: 60, squads: [{ key: r.t1[0], at: [0, 0] }, { key: r.t1[1], at: [2, 1] }] },
      enemy: garrisonOf(rival, [3, 5], tier, { structures: [{ key: rr.ext, at: 'ore:5' }] }),
      neutrals: {
        squads: [{ faction: f, key: r.t1[0], at: 'point:1', tag: 'lost1', order: 'hold' }, { faction: f, key: r.t2[0], at: 'point:2', order: 'hold' }, { faction: f, key: r.t1[1], at: 'ore:3', order: 'hold' }],
        structures: [{ faction: f, key: r.prod, at: 'point:0', capturable: true }, { faction: f, key: r.ext, at: 'ore:2', capturable: true }, { faction: f, key: r.turret, at: 'point:2', capturable: true }],
      },
      lose: { hq: false, army: true },
      stages: [
        stage([obj('rescue', 'rescue', 'Rescue 3 stranded squads', { n: 3, hint: 'Walk a squad next to the grey units.' }), obj('claim', 'claimStruct', 'Capture 2 abandoned structures', { n: 2, hint: 'Walk a squad next to a grey structure.' })], 'Grey units and structures are abandoned. Reach them and they are yours.'),
        stage([obj('cap', 'capture', 'Hold 3 points', { n: 3 }), obj('posts', 'destroy', `Destroy both enemy ${rr.postName}s`, { key: rr.post, n: 2 })], 'You have a base again. Use it.'),
      ],
    };
  },
  /** Reach an ore stockpile before the rival does. */
  resourceRace({ f, rival, tier, quota = 2500, minutes = 14 }) {
    const r = R[f];
    return {
      player: playerKit(f, tier),
      enemy: liveEnemy(rival, tier, { incomeMult: 0.9 + tier * 0.03 }),
      timeLimit: minutes * 60,
      stages: [
        stage([obj('ext', 'build', `Own 4 ${r.extName}s`, { key: r.ext, n: 4 }), obj('cap', 'capture', 'Hold 3 points', { n: 3 })], `${minutes} minutes. The central veins are contested; take them first.`),
        stage([obj('ore', 'ore', `Stockpile ${quota} ore`, { n: quota, hint: 'Stop spending. Defend the veins.' })]),
      ],
    };
  },
  /** The starting base is doomed; relocate before it is consumed. */
  migrate({ f, rival, tier, doomAt = 300 }) {
    const r = R[f];
    return {
      player: playerKit(f, tier, { structures: [{ key: r.prod, at: [-4, 3] }, { key: r.ext, at: 'ore:0' }, { key: r.ext, at: 'ore:1' }] }),
      enemy: garrisonOf(rival, [4, 5], tier),
      doom: { at: doomAt, from: 'playerBase', radius: 13, warn: 'The Bleed is rising under your base. Everything inside the crystal line dies in two minutes. Move.', text: 'The Bleed has taken your base.' },
      lose: { hq: false, army: true },
      stages: [
        stage([obj('cap', 'capture', 'Capture the point nearest the middle', { rank: 2 }), obj('prod', 'buildNear', `Build ${an(r.prodName)} near that point`, { key: r.prod, at: 'point:2', radius: 9, n: 1 }), obj('ext', 'buildNear', `Build ${an(r.extName)} on a vein near it`, { key: r.ext, at: 'point:2', radius: 12, n: 1 })], 'Your base has five minutes. Take a point in the middle and rebuild there.'),
        stage([obj('survive', 'survive', 'Survive the Bleed', { seconds: doomAt + 30 }), obj('army', 'pop', 'Rebuild an army of 16 population', { n: 16 })], 'Whatever is left at the old base is gone. Rebuild.'),
        stage([obj('posts', 'destroy', `Destroy the enemy ${R[rival].postName}s`, { key: R[rival].post, n: 2 })]),
      ],
      hints: [{ at: 'start', text: 'Walk everything out early. Structures cannot move; squads can.' }],
    };
  },
  /** Enemy base is impenetrable: starve it by killing convoys and extractors first. */
  interdiction({ f, rival, tier }) {
    const rr = R[rival];
    return {
      player: playerKit(f, tier),
      enemy: liveEnemy(rival, tier, { incomeMult: 1.3, structures: [{ key: rr.turret, at: [-3, -5] }, { key: rr.turret, at: [5, 0] }, { key: rr.turret, at: [0, 6] }, { key: rr.ext, at: 'ore:4' }, { key: rr.ext, at: 'ore:5' }] }),
      convoys: { owner: 'enemy', units: [{ key: rr.vehicle, n: 1, tag: 'convoy' }, { key: rr.t1[0], n: 1 }], from: 'ore:5', to: 'enemyBase', every: 100, first: 70, count: 8, text: 'An enemy supply convoy is moving from the far vein.' },
      stages: [
        stage([obj('convoys', 'kill', 'Destroy 3 supply convoys', { key: rr.vehicle, n: 3, hint: 'Convoys travel from the far vein to the enemy base. Ambush the road.' }), obj('ext', 'destroy', `Destroy 3 enemy ${rr.extName}s`, { key: rr.ext, n: 3 })], 'The base is too strong to storm. Starve it.'),
        stage([obj('hq', 'destroyHq', `Destroy the ${rr.hqName}`)], 'Their income is gone. Now push.'),
      ],
    };
  },
  /** Two separate bases to manage. */
  multiFront({ f, rival, tier }) {
    const r = R[f];
    return {
      player: playerKit(f, tier, { structures: [{ key: r.prod, at: [-4, 3] }, { key: r.prod, at: 'point:5' }, { key: r.ext, at: 'ore:5' }, { key: r.turret, at: 'point:5' }], squads: [{ key: r.t1[0], at: [3, 4] }, { key: r.t1[1], at: 'point:5' }, { key: r.t2[0], at: 'point:5' }], points: [0, 5] }),
      enemy: liveEnemy(rival, tier, { points: [3, 4, 6] }),
      waves: wavesFor(rival, tier, 3, { start: 90, every: 120, target: 'point:5', texts: ['They are hitting your far base.', 'Another push on the far base.', 'Armour on the far base.'] }),
      stages: [
        stage([obj('hold', 'hold', 'Hold both bases (2 points) for 5 minutes', { n: 2, seconds: 300 }), obj('cap', 'capture', 'Hold 4 points', { n: 4 })], 'Two bases, one army each. The far one gets hit first.'),
        stage([obj('hq', 'destroyHq', `Destroy the ${R[rival].hqName}`)]),
      ],
    };
  },
  /** Linear push: each captured outpost grants reinforcements. */
  tugOfWar({ f, rival, tier }) {
    const r = R[f], rr = R[rival];
    return {
      player: playerKit(f, tier),
      enemy: garrisonOf(rival, [2, 3, 4, 5], tier, { structures: [{ key: rr.prod, at: 'enemyBase' }, { key: rr.turret, at: 'enemyBase' }] }),
      rewards: [{ rank: 2, units: [{ key: r.t1[0], n: 1 }], text: 'Outpost taken: a fresh squad joins you.' }, { rank: 3, units: [{ key: r.t2[0], n: 1 }], text: 'Outpost taken: raiders join you.' }, { rank: 4, units: [{ key: r.vehicle, n: 1 }], text: 'Outpost taken: a vehicle joins you.' }, { rank: 5, units: [{ key: r.heavy, n: 1 }], text: 'Outpost taken: heavy support joins you.' }],
      waves: wavesFor(rival, tier, 4, { start: 120, every: 120, target: 'point:2', texts: ['They are pushing back down the road.', 'Counter-push.', 'A heavier counter-push.', 'Their last push.'] }),
      stages: [
        stage([obj('cap2', 'capture', 'Take outpost 1', { rank: 2 })], 'Every outpost you take sends you reinforcements. Push down the road.'),
        stage([obj('cap3', 'capture', 'Take outpost 2', { rank: 3 })]),
        stage([obj('cap4', 'capture', 'Take outpost 3', { rank: 4 })]),
        stage([obj('cap5', 'capture', 'Take outpost 4', { rank: 5 }), obj('prod', 'destroy', `Destroy the enemy ${rr.prodName}`, { key: rr.prod, n: 1 })]),
      ],
    };
  },
  /** Fight beside an AI ally against a live enemy. */
  alliedAssault({ f, rival, ally, tier }) {
    const rr = R[rival];
    return {
      player: playerKit(f, tier),
      enemies: [liveEnemy(rival, tier, { incomeMult: 1.0 + tier * 0.06, points: [4, 5, 6] })],
      allies: [liveEnemy(ally, tier, { ai: 'normal', incomeMult: 0.9, points: [], name: 'Ally' })],
      spawns: [{ at: 240, owner: 'ally', units: [{ key: R[ally].t1[0], n: 2 }, { key: R[ally].t2[0], n: 1 }], from: 'allyBase', target: 'enemyBase', text: 'Your ally is pushing. Push with them.' }, { at: 480, owner: 'ally', units: [{ key: R[ally].vehicle, n: 1 }, { key: R[ally].t1[1], n: 1 }], from: 'allyBase', target: 'enemyBase', text: 'Allied armour is moving on the enemy base.' }],
      stages: [
        stage([obj('ally', 'allyAlive', 'Your ally must survive'), obj('cap', 'capture', 'Hold 3 points', { n: 3 })], 'Your ally attacks on its own schedule. Match its pushes and cover its retreats.'),
        stage([obj('ally2', 'allyAlive', 'Your ally must survive'), obj('hq', 'destroyHq', `Destroy the ${rr.hqName}`)]),
      ],
    };
  },
  /** An ally turns on you mid-battle. */
  betrayal({ f, rival, ally, tier, at = 360 }) {
    const rr = R[rival], ra = R[ally];
    return {
      player: playerKit(f, tier),
      enemies: [liveEnemy(rival, tier, { points: [4, 5, 6] })],
      allies: [liveEnemy(ally, tier, { ai: 'normal', incomeMult: 1.0, points: [], name: 'Ally' })],
      events: [{ at, type: 'betray', owner: 'ally', text: 'Your ally has turned. Their guns are on you now.' }],
      stages: [
        stage([obj('cap', 'capture', 'Hold 3 points', { n: 3 }), obj('survive', 'survive', `Fight alongside the ${capName(ally)} (${Math.round(at / 60)} minutes)`, { seconds: at })], 'The alliance holds for now. Build while it does.'),
        stage([obj('hqs', 'destroyHq', `Destroy both the ${rr.hqName} and the ${ra.hqName}`, { all: true }), obj('loss', 'loseMax', 'Lose no more than 12 squads', { n: 12, optional: true })], 'Two enemies now. They will fight each other as well as you.'),
      ],
    };
  },
  /** Deep raid on enemy extractors with a loss limit. */
  raid({ f, rival, tier, n = 3 }) {
    const r = R[f], rr = R[rival];
    return {
      player: playerKit(f, tier, { squads: [{ key: r.fast, at: [3, 4], n: 2 }, { key: r.vehicle, at: [5, 2] }, { key: r.t1[1], at: [2, 6] }] }),
      enemy: liveEnemy(rival, tier, { ai: 'passive', incomeMult: 0.9, structures: [{ key: rr.ext, at: 'ore:4' }, { key: rr.ext, at: 'ore:5' }, { key: rr.turret, at: 'ore:4' }] }),
      stages: [stage([obj('ext', 'destroy', `Destroy ${n} ${rr.extName}s`, { key: rr.ext, n }), obj('loss', 'loseMax', 'Lose no more than 2 squads', { n: 2 })], 'Hit fast, leave, come back for what they rebuild.')],
    };
  },
  /** Field a heavy unit and dismantle static defences. */
  siege({ f, rival, tier }) {
    const r = R[f], rr = R[rival];
    return {
      player: playerKit(f, Math.max(tier, 4), { structures: [{ key: r.prod, at: [-4, 3] }, ...(r.prod2 !== r.prod ? [{ key: r.prod2, at: [4, -3] }] : [])] }),
      enemy: garrisonOf(rival, [3, 4, 5], Math.max(tier, 4), { structures: [{ key: rr.turret, at: 'point:3' }, { key: rr.turret, at: 'point:4' }] }),
      stages: [
        stage([obj('heavy', 'train', `Field ${an(r.heavyName)}`, { key: r.heavy, n: 1 })]),
        stage([obj('turrets', 'destroy', `Destroy 4 ${rr.turretName}s`, { key: rr.turret, n: 4 }), obj('posts', 'destroy', `Destroy 3 ${rr.postName}s`, { key: rr.post, n: 3 })], `Walk the ${r.heavyName} to the edge of each turret's range and let it work.`),
        stage([obj('cap', 'capture', 'Hold 5 points', { n: 5 })]),
      ],
    };
  },
  /** Full war. */
  war({ f, rival, tier, size = 64, extraEnemies = [] }) {
    const r = R[f], rr = R[rival];
    return {
      player: playerKit(f, tier, { structures: undefined, squads: undefined }),
      enemies: [liveEnemy(rival, tier), ...extraEnemies],
      stages: [
        stage([obj('econ', 'capture', 'Hold 3 strategic points', { n: 3 }), obj('heavy', 'train', `Field ${an(r.heavyName)}`, { key: r.heavy, n: 1 })]),
        stage([obj('hq', 'destroyHq', `Destroy the ${rr.hqName}`), obj('loss', 'loseMax', `Lose no more than ${6 + tier} squads`, { n: 6 + tier, optional: true })]),
      ],
    };
  },
  /** Mixed garrison of two rivals. */
  twoBanners({ f, r1, r2, tier }) {
    return {
      player: playerKit(f, tier),
      enemies: [garrisonOf(r1, [2], tier), garrisonOf(r2, [4], tier)],
      stages: [stage([obj('kill', 'kill', 'Destroy 5 enemy squads', { n: 5 }), obj('posts', 'destroy', 'Destroy both outposts', { n: 2 })]), stage([obj('cap', 'capture', 'Hold 5 points', { n: 5 })])],
    };
  },
  /** Two-front defence against alternating waves from two rivals. */
  crossfire({ f, r1, r2, tier, minutes = 8 }) {
    const r = R[f];
    const w1 = wavesFor(r1, tier, 3, { owner: 'enemy', start: 60, every: 160 }), w2 = wavesFor(r2, tier, 3, { owner: 'enemy2', start: 130, every: 160 });
    return {
      player: playerKit(f, tier, { structures: [{ key: r.prod, at: [-4, 3] }, { key: r.turret, at: [6, 1] }, { key: r.turret, at: [-6, -1] }], points: [0, 1, 2] }),
      enemies: [{ faction: r1, hq: false, ai: null, points: [4] }, { faction: r2, hq: false, ai: null, points: [5] }],
      waves: [...w1, ...w2].sort((a, b) => a.at - b.at),
      stages: [stage([obj('hold', 'hold', `Hold 3 points for ${minutes} minutes`, { n: 3, seconds: minutes * 60 }), obj('loss', 'loseMax', 'Lose no more than 5 squads', { n: 5, optional: true })])],
    };
  },
  /** Three-way war. */
  threeWay({ f, r1, r2, tier, size = 80 }) {
    const r = R[f];
    return {
      player: playerKit(f, tier, { structures: undefined, squads: undefined, ore: 800, flux: 320 }),
      enemies: [liveEnemy(r1, tier, { incomeMult: 1.2 }), liveEnemy(r2, tier, { incomeMult: 1.2, points: [] })],
      stages: [
        stage([obj('econ', 'capture', 'Hold 4 strategic points', { n: 4 }), obj('hero', 'hero', `Field ${r.heroName}`)]),
        stage([obj('hqs', 'destroyHq', `Destroy the ${R[r1].hqName} and the ${R[r2].hqName}`, { all: true }), obj('loss', 'loseMax', 'Lose no more than 15 squads', { n: 15, optional: true })], 'They will fight each other. Let them, then finish whoever wins.'),
      ],
      hints: [{ at: 'start', text: 'Three-way war: the two enemies attack each other too. Hold your corner, harvest, and strike the weaker one first.' }],
    };
  },
};
