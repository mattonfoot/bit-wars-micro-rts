// All faction definitions. Three factions, zero shared units or buildings.
// Damage types vs armour classes. Rows: damage type, cols: armour class.
export const ARMOR = ['infantry', 'heavy', 'vehicle', 'building', 'shielded'];
export const DMG_MATRIX = {
  light:  { infantry: 1.0, heavy: 0.65, vehicle: 0.3, building: 0.2, shielded: 0.9 },
  heavy:  { infantry: 0.55, heavy: 1.0, vehicle: 1.5, building: 0.7, shielded: 0.6 },
  energy: { infantry: 0.8, heavy: 1.0, vehicle: 1.15, building: 0.5, shielded: 1.3 },
  blast:  { infantry: 1.25, heavy: 1.0, vehicle: 0.8, building: 1.5, shielded: 1.0 },
  melee:  { infantry: 1.2, heavy: 0.8, vehicle: 0.5, building: 0.3, shielded: 0.8 },
};
export const DMG_LABEL = { light: 'Light', heavy: 'Anti-armour', energy: 'Energy', blast: 'Blast', melee: 'Melee' };
export const ARMOR_LABEL = { infantry: 'Infantry', heavy: 'Heavy inf.', vehicle: 'Vehicle', building: 'Structure', shielded: 'Shielded' };

export const POP_CAP = 40;
export const START_ORE = 500;
export const START_FLUX = 100;

export const FACTIONS = {
  blue: {
    key: 'blue',
    name: 'Vector Swarm',
    shape: 'tri',
    tagline: 'Numbers. Speed. Flanks.',
    color: '#3d8bff', alt: '#31d5e6', dark: '#1a3f86', light: '#a9ccff',
    lore: 'A hive that divides faster than it can be killed. Individually fragile, the Swarm wins by out-producing, out-running and out-flanking anything slower than itself.',
    playstyle: ['Cheapest, fastest units', 'Large squads: losses feel small, wins feel huge', 'Flank bonus doubled', 'Weak to blast and suppression'],
    units: {
      darts: {
        key: 'darts', name: 'Dart Swarm', building: 'hive', tier: 1,
        cost: { ore: 90, flux: 0 }, pop: 3, buildTime: 13,
        size: 8, hp: 20, armor: 'infantry', speed: 105, sight: 7, radius: 4.5,
        weapon: { range: 1.4, dmg: 4.2, rof: 1.6, type: 'melee', supp: 1.5, melee: true },
        capRate: 1.0, canCapture: true, shape: 'tri',
        role: 'Melee shredder', strong: 'Infantry, artillery', weak: 'Blast, suppression',
        desc: 'Eight fast blades. Swarm the enemy and tear infantry apart up close.',
      },
      needles: {
        key: 'needles', name: 'Needle Squad', building: 'hive', tier: 1,
        cost: { ore: 120, flux: 15 }, pop: 4, buildTime: 16,
        size: 5, hp: 24, armor: 'infantry', speed: 92, sight: 8, radius: 5,
        weapon: { range: 5.5, dmg: 9, rof: 0.9, type: 'heavy', supp: 1 },
        capRate: 1.0, canCapture: true, shape: 'needle',
        role: 'Anti-armour', strong: 'Vehicles, heavy infantry', weak: 'Melee, suppression',
        desc: 'Long piercing spikes. Punches through armour but folds in melee.',
      },
      wedges: {
        key: 'wedges', name: 'Wedge Raiders', building: 'nest', tier: 2,
        cost: { ore: 150, flux: 30 }, pop: 4, buildTime: 18,
        size: 4, hp: 34, armor: 'infantry', speed: 135, sight: 9, radius: 5.5,
        weapon: { range: 2.2, dmg: 11, rof: 1.3, type: 'light', supp: 3 },
        capRate: 1.6, canCapture: true, shape: 'chevron', flankMult: 1.6,
        role: 'Flanker / capturer', strong: 'Artillery, gun teams, points', weak: 'Heavy infantry, turrets',
        desc: 'Fastest unit in the war. Captures quickly and deals brutal damage from behind.',
      },
      kites: {
        key: 'kites', name: 'Kite Wing', building: 'spire', tier: 2,
        cost: { ore: 190, flux: 60 }, pop: 5, buildTime: 24,
        size: 3, hp: 70, armor: 'vehicle', speed: 150, sight: 10, radius: 7, flying: true,
        weapon: { range: 4.5, dmg: 7, rof: 2.0, type: 'light', supp: 4, travel: 0 },
        capRate: 0, canCapture: false, shape: 'kite', noCover: true,
        role: 'Air harasser', strong: 'Infantry, extractors', weak: 'Anti-armour, energy',
        desc: 'Hovering raiders that ignore terrain. Perfect for raiding economy and pinning squads.',
      },
      obelisk: {
        key: 'obelisk', name: 'Obelisk', building: 'spire', tier: 3, requires: 'nest',
        cost: { ore: 320, flux: 110 }, pop: 8, buildTime: 40,
        size: 1, hp: 520, armor: 'vehicle', speed: 55, sight: 9, radius: 13,
        weapon: { range: 7.5, dmg: 55, rof: 0.35, type: 'blast', supp: 12, splash: 1.3, travel: 260, minRange: 2, terrain: 60 },
        capRate: 0, canCapture: false, shape: 'obelisk', noCover: true,
        role: 'Siege walker', strong: 'Structures, clumps', weak: 'Anti-armour, flanking',
        desc: 'A walking pyramid that lobs shattering bolts. Slow, but nothing stands after it.',
      },
      apex: {
        key: 'apex', name: 'The Apex', building: 'hive', tier: 1, hero: true,
        cost: { ore: 200, flux: 80 }, pop: 3, buildTime: 30,
        size: 1, hp: 260, armor: 'heavy', speed: 120, sight: 10, radius: 8,
        weapon: { range: 3, dmg: 22, rof: 1.2, type: 'light', supp: 5 },
        capRate: 1.2, canCapture: true, shape: 'apex',
        aura: { radius: 5, speed: 1.2, moraleRegen: 2.0 },
        role: 'Hero: speed + morale aura', strong: 'Everything, briefly', weak: 'Being alone',
        desc: 'The point of the spear. Nearby squads move faster and never break.',
      },
    },
    buildings: {
      hive: { key: 'hive', name: 'Hive', hq: true, cost: { ore: 0, flux: 0 }, buildTime: 1, hp: 1600, w: 3, h: 3, sight: 9, trains: ['darts', 'needles', 'apex'], flux: 0.35, weapon: { range: 6, dmg: 5, rof: 2.5, type: 'light', supp: 2 }, desc: 'Swarm nexus. Spawns basic swarms and the Apex. Lose this and the swarm dies.' },
      lode: { key: 'lode', name: 'Lode Burrow', onOre: true, cost: { ore: 90, flux: 0 }, buildTime: 15, hp: 420, w: 1, h: 1, sight: 4, ore: 2.4, desc: 'Burrows into an ore vein. +Ore income.' },
      nest: { key: 'nest', name: 'Nest', cost: { ore: 170, flux: 20 }, buildTime: 25, hp: 800, w: 2, h: 2, sight: 6, trains: ['wedges'], desc: 'Breeds Wedge Raiders and unlocks the Obelisk.' },
      spire: { key: 'spire', name: 'Spire', cost: { ore: 240, flux: 60 }, buildTime: 35, hp: 950, w: 2, h: 2, sight: 7, trains: ['kites', 'obelisk'], desc: 'Grows Kites and Obelisks.' },
      thorn: { key: 'thorn', name: 'Thorn', turret: true, cost: { ore: 130, flux: 25 }, buildTime: 18, hp: 480, w: 1, h: 1, sight: 8, weapon: { range: 6, dmg: 8, rof: 3.0, type: 'light', supp: 3 }, desc: 'Rapid-fire spine launcher. Cheap area denial.' },
      claim: { key: 'claim', name: 'Claim Spike', onPoint: true, cost: { ore: 80, flux: 10 }, buildTime: 15, hp: 380, w: 1, h: 1, sight: 7, pointFlux: 0.35, buildRadius: 6, desc: 'Fortifies a strategic point: +Flux and it must be destroyed before recapture.' },
    },
  },
  red: {
    key: 'red',
    name: 'Iron Foundry',
    shape: 'square',
    tagline: 'Steel. Suppression. Siege.',
    color: '#ff4b3e', alt: '#ff9a2e', dark: '#7a1f18', light: '#ffb3ad',
    lore: 'Riveted iron forged for one purpose: to hold ground. Foundry squads are few but tough, and their heavy weapons pin whole armies in place.',
    playstyle: ['Sturdiest units and buildings', 'Suppression weapons break enemy morale', 'Breachers and tanks destroy terrain', 'Slow; weak to fast flankers'],
    units: {
      bolts: {
        key: 'bolts', name: 'Bolt Squad', building: 'foundry', tier: 1,
        cost: { ore: 110, flux: 0 }, pop: 4, buildTime: 15,
        size: 4, hp: 48, armor: 'heavy', speed: 78, sight: 8, radius: 5.5,
        weapon: { range: 5, dmg: 8, rof: 1.2, type: 'light', supp: 2 },
        capRate: 1.0, canCapture: true, shape: 'square',
        role: 'Line infantry', strong: 'Light infantry, holding ground', weak: 'Anti-armour, artillery',
        desc: 'Four armoured riflemen. Not fast, not fancy, very hard to move.',
      },
      hammers: {
        key: 'hammers', name: 'Hammer Team', building: 'foundry', tier: 1,
        cost: { ore: 140, flux: 25 }, pop: 4, buildTime: 20,
        size: 2, hp: 55, armor: 'heavy', speed: 70, sight: 9, radius: 6,
        weapon: { range: 7, dmg: 4, rof: 5.0, type: 'light', supp: 6, setup: 1.5, arc: 1.2 },
        capRate: 0.6, canCapture: true, shape: 'wide',
        role: 'Suppression gun', strong: 'Pins any infantry', weak: 'Flanking, vehicles',
        desc: 'Heavy machine gun. Must set up, then shreds morale in a wide arc. Guard its back.',
      },
      breachers: {
        key: 'breachers', name: 'Breachers', building: 'works', tier: 2,
        cost: { ore: 180, flux: 40 }, pop: 5, buildTime: 22,
        size: 3, hp: 85, armor: 'heavy', speed: 74, sight: 7, radius: 6.5,
        weapon: { range: 1.6, dmg: 24, rof: 0.9, type: 'blast', supp: 4, melee: true, terrain: 90 },
        capRate: 1.0, canCapture: true, shape: 'shield',
        role: 'Assault / demolition', strong: 'Walls, structures, heavy infantry', weak: 'Kiting, ranged',
        desc: 'Hammer-and-shield stormers who knock down walls and doors, and anything behind them.',
      },
      crusher: {
        key: 'crusher', name: 'Crusher Tank', building: 'works', tier: 2,
        cost: { ore: 260, flux: 80 }, pop: 7, buildTime: 34,
        size: 1, hp: 620, armor: 'vehicle', speed: 66, sight: 8, radius: 12,
        weapon: { range: 6, dmg: 40, rof: 0.5, type: 'blast', supp: 8, splash: 1.0, travel: 420, terrain: 70 },
        capRate: 0, canCapture: false, shape: 'tank', noCover: true,
        role: 'Main battle tank', strong: 'Infantry blobs, structures', weak: 'Anti-armour, energy',
        desc: 'A rolling block of iron with a cannon. Flattens cover and whoever hid behind it.',
      },
      mortar: {
        key: 'mortar', name: 'Mortar Block', building: 'works', tier: 3, requires: 'foundry',
        cost: { ore: 230, flux: 90 }, pop: 6, buildTime: 30,
        size: 2, hp: 60, armor: 'heavy', speed: 60, sight: 8, radius: 6,
        weapon: { range: 11, dmg: 34, rof: 0.3, type: 'blast', supp: 14, splash: 1.5, travel: 160, minRange: 4, setup: 2, terrain: 50, indirect: true },
        capRate: 0.5, canCapture: true, shape: 'mortar',
        role: 'Artillery', strong: 'Static defences, gun teams', weak: 'Anything up close',
        desc: 'Outranges everything. Shells crater the ground. Helpless if reached.',
      },
      foreman: {
        key: 'foreman', name: 'The Foreman', building: 'foundry', tier: 1, hero: true,
        cost: { ore: 220, flux: 80 }, pop: 3, buildTime: 30,
        size: 1, hp: 380, armor: 'heavy', speed: 80, sight: 9, radius: 8,
        weapon: { range: 4, dmg: 18, rof: 1.0, type: 'blast', supp: 6, splash: 0.6 },
        capRate: 1.0, canCapture: true, shape: 'foreman',
        aura: { radius: 5, armor: 0.8, repair: 6 },
        role: 'Hero: armour + repair aura', strong: 'Keeping vehicles alive', weak: 'Speed',
        desc: 'Walking workshop. Nearby squads take less damage; vehicles and structures self-repair.',
      },
    },
    buildings: {
      foundry: { key: 'foundry', name: 'Foundry', hq: true, cost: { ore: 0, flux: 0 }, buildTime: 1, hp: 2100, w: 3, h: 3, sight: 9, trains: ['bolts', 'hammers', 'foreman'], flux: 0.35, weapon: { range: 6.5, dmg: 7, rof: 2.0, type: 'light', supp: 3 }, desc: 'The Foundry forges Bolts, Hammers and the Foreman. Its fall ends the war.' },
      drill: { key: 'drill', name: 'Drill Rig', onOre: true, cost: { ore: 100, flux: 0 }, buildTime: 16, hp: 560, w: 1, h: 1, sight: 4, ore: 2.4, desc: 'Drills an ore vein. +Ore income.' },
      works: { key: 'works', name: 'Iron Works', cost: { ore: 210, flux: 30 }, buildTime: 30, hp: 1200, w: 2, h: 2, sight: 6, trains: ['breachers', 'crusher', 'mortar'], desc: 'Assembles Breachers, Crusher Tanks and Mortar Blocks.' },
      bunker: { key: 'bunker', name: 'Bunker', turret: true, cost: { ore: 160, flux: 30 }, buildTime: 22, hp: 900, w: 1, h: 1, sight: 8, weapon: { range: 6.5, dmg: 6, rof: 4.0, type: 'light', supp: 5 }, desc: 'Armoured gun nest. Suppresses everything in front of it.' },
      armory: { key: 'armory', name: 'Armoury', cost: { ore: 180, flux: 40 }, buildTime: 28, hp: 900, w: 2, h: 2, sight: 6, upgrade: { hp: 1.15 }, desc: 'Reinforced plating: +15% HP for all Foundry squads.' },
      post: { key: 'post', name: 'Watch Post', onPoint: true, cost: { ore: 90, flux: 10 }, buildTime: 18, hp: 520, w: 1, h: 1, sight: 8, pointFlux: 0.35, buildRadius: 6, desc: 'Fortifies a strategic point: +Flux and it must be destroyed before recapture.' },
    },
  },
  green: {
    key: 'green',
    name: 'Aegis Collective',
    shape: 'circle',
    tagline: 'Shields. Precision. Patience.',
    color: '#3ddc84', alt: '#b5e61d', dark: '#155c38', light: '#b6f5d1',
    lore: 'A serene order wrapped in regenerating shields. The Collective fields few units, each precious, each nearly impossible to kill if you let it breathe.',
    playstyle: ['Shields regenerate when out of combat', 'Fewest, most expensive units', 'Long range and vision', 'Weak to sustained blast damage'],
    units: {
      wardens: {
        key: 'wardens', name: 'Warden Cell', building: 'core', tier: 1,
        cost: { ore: 140, flux: 10 }, pop: 4, buildTime: 18,
        size: 3, hp: 40, shield: 42, armor: 'infantry', speed: 85, sight: 9, radius: 6,
        weapon: { range: 5.5, dmg: 11.5, rof: 1.1, type: 'energy', supp: 2.5 },
        capRate: 1.2, canCapture: true, shape: 'circle',
        role: 'Shielded infantry', strong: 'Attrition, vehicles', weak: 'Blast, being swarmed',
        desc: 'Three orbs behind humming shields. Pull back, recharge, return.',
      },
      lenses: {
        key: 'lenses', name: 'Lens Team', building: 'core', tier: 1,
        cost: { ore: 160, flux: 35 }, pop: 4, buildTime: 22,
        size: 2, hp: 30, shield: 25, armor: 'infantry', speed: 80, sight: 11, radius: 5.5,
        weapon: { range: 8.5, dmg: 34, rof: 0.45, type: 'energy', supp: 2 },
        capRate: 0.8, canCapture: true, shape: 'lens',
        role: 'Sniper / anti-armour', strong: 'Vehicles, heroes', weak: 'Melee, flankers',
        desc: 'Focused beams from extreme range. Sees far, hits hard, dies fast.',
      },
      pulsers: {
        key: 'pulsers', name: 'Pulse Ring', building: 'array', tier: 2,
        cost: { ore: 170, flux: 40 }, pop: 5, buildTime: 24,
        size: 4, hp: 36, shield: 30, armor: 'infantry', speed: 95, sight: 8, radius: 5.5,
        weapon: { range: 3.2, dmg: 6, rof: 2.5, type: 'light', supp: 5, splash: 0.5 },
        capRate: 1.2, canCapture: true, shape: 'ring',
        role: 'Disruptor / anti-infantry', strong: 'Infantry morale', weak: 'Vehicles',
        desc: 'Rings that emit crushing pulses. Enemy infantry nearby breaks and runs.',
      },
      halo: {
        key: 'halo', name: 'Halo', building: 'array', tier: 2,
        cost: { ore: 250, flux: 90 }, pop: 6, buildTime: 32,
        size: 1, hp: 300, shield: 220, armor: 'vehicle', speed: 100, sight: 9, radius: 11, flying: true,
        weapon: { range: 5, dmg: 16, rof: 1.5, type: 'energy', supp: 4 },
        capRate: 0, canCapture: false, shape: 'halo', noCover: true,
        aura: { radius: 4, shieldRegen: 2.0 },
        role: 'Shield projector', strong: 'Sustaining an army', weak: 'Anti-armour focus fire',
        desc: 'A hovering disc that recharges nearby shields. The heart of every Collective push.',
      },
      nova: {
        key: 'nova', name: 'Nova Sphere', building: 'array', tier: 3, requires: 'sanctum',
        cost: { ore: 340, flux: 130 }, pop: 8, buildTime: 42,
        size: 1, hp: 240, shield: 200, armor: 'vehicle', speed: 58, sight: 10, radius: 13,
        weapon: { range: 12, dmg: 60, rof: 0.25, type: 'blast', supp: 18, splash: 1.8, travel: 150, minRange: 4, terrain: 80, indirect: true },
        capRate: 0, canCapture: false, shape: 'nova', noCover: true,
        role: 'Orbital artillery', strong: 'Everything at range', weak: 'Everything up close',
        desc: 'Rolls slowly, then blossoms. Each shot leaves a crater and a silence.',
      },
      oracle: {
        key: 'oracle', name: 'The Oracle', building: 'core', tier: 1, hero: true,
        cost: { ore: 240, flux: 90 }, pop: 3, buildTime: 32,
        size: 1, hp: 180, shield: 200, armor: 'heavy', speed: 90, sight: 14, radius: 8,
        weapon: { range: 6, dmg: 20, rof: 1.0, type: 'energy', supp: 4 },
        capRate: 1.2, canCapture: true, shape: 'oracle',
        aura: { radius: 5, shieldRegen: 1.5, sightBonus: 4 },
        role: 'Hero: vision + shield aura', strong: 'Seeing it coming', weak: 'Ambush',
        desc: 'Sees through the fog. Nearby shields recharge even under fire.',
      },
    },
    buildings: {
      core: { key: 'core', name: 'Core', hq: true, cost: { ore: 0, flux: 0 }, buildTime: 1, hp: 1500, shield: 500, w: 3, h: 3, sight: 10, trains: ['wardens', 'lenses', 'oracle'], flux: 0.35, weapon: { range: 7, dmg: 10, rof: 1.0, type: 'energy', supp: 2 }, desc: 'The Core: shielded heart of the Collective. Its silence ends the war.' },
      siphon: { key: 'siphon', name: 'Siphon', onOre: true, cost: { ore: 110, flux: 0 }, buildTime: 16, hp: 340, shield: 150, w: 1, h: 1, sight: 5, ore: 2.4, desc: 'Draws ore from a vein. +Ore income.' },
      array: { key: 'array', name: 'Array', cost: { ore: 230, flux: 40 }, buildTime: 32, hp: 700, shield: 300, w: 2, h: 2, sight: 7, trains: ['pulsers', 'halo', 'nova'], desc: 'Grows Pulse Rings, Halos and the Nova Sphere.' },
      bastion: { key: 'bastion', name: 'Bastion', turret: true, cost: { ore: 170, flux: 35 }, buildTime: 22, hp: 400, shield: 350, w: 1, h: 1, sight: 9, weapon: { range: 7.5, dmg: 22, rof: 1.1, type: 'energy', supp: 3 }, desc: 'Long-range beam emplacement behind a thick shield.' },
      sanctum: { key: 'sanctum', name: 'Sanctum', cost: { ore: 200, flux: 60 }, buildTime: 30, hp: 600, shield: 300, w: 2, h: 2, sight: 7, upgrade: { shield: 1.3 }, desc: 'Harmonic focus: +30% shields for all Collective squads. Unlocks the Nova Sphere.' },
      beacon: { key: 'beacon', name: 'Beacon', onPoint: true, cost: { ore: 100, flux: 10 }, buildTime: 16, hp: 300, shield: 200, w: 1, h: 1, sight: 10, pointFlux: 0.35, buildRadius: 6, desc: 'Fortifies a strategic point: +Flux, vision, and it must be destroyed before recapture.' },
    },
  },
};

export const FACTION_KEYS = ['blue', 'red', 'green'];

export function unitDef(faction, key) { return FACTIONS[faction].units[key]; }
export function buildingDef(faction, key) { return FACTIONS[faction].buildings[key]; }
export function hqKey(faction) {
  return Object.values(FACTIONS[faction].buildings).find((b) => b.hq).key;
}
export function reinforceCost(def) {
  return { ore: Math.ceil((def.cost.ore / def.size) * 1.1), flux: Math.ceil((def.cost.flux / def.size) * 1.1) };
}
