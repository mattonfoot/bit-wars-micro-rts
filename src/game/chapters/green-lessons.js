// Handwritten opening lessons (chapters 1-5) for the Aegis Collective.
import { garrison, war, obj, stage, wave } from './common.js';

const F = 'green';
export const GREEN_LESSONS = {
  faction: F, title: 'Protocol', tagline: 'Endure. Observe. Answer.',
  intro: 'The Collective wakes last, as it always does, having computed the others\' first moves before making its own. Its cells are few and each is precious, wrapped in shields that heal if given a breath. The Oracle has read the fracture. The answer is already decided; the Collective only has to survive long enough to give it.',
  chapters: [
    // ---------------- ACT I
    {
      key: 'green-1', title: 'Awakening', theme: 'crystal', size: 48, seed: 'protocol-1',
      story: ['The Core opens on the Crystal Dunes. Foundry sentinels stand on the near points, left behind by a war that moved on without them.', 'You have three Wardens. Each is worth ten of anything else on this sand, if you never let one die.'],
      briefing: 'Learn the basics: train Warden Cells, mine ore, capture a point, and pull back to let shields recharge.',
      epilogue: ['Not one Warden lost. The Foundry sentinels are glass on the sand.', 'The Oracle reads new shapes in the fracture: Crusher Tanks moving across Frostbite towards the Core.'],
      player: { faction: F, ore: 320, flux: 70, units: ['wardens'], buildings: ['siphon'] },
      enemy: garrison('red', { squads: [{ key: 'bolts', at: 'point:2', hp: 0.8, order: 'hold' }, { key: 'bolts', at: 'point:1', order: 'hold' }], points: [1, 2] }),
      stages: [
        stage([obj('train', 'train', 'Train 2 Warden Cells', { key: 'wardens', n: 2, hint: 'Tap the Core, then Warden Cell.' }), obj('siphon', 'build', 'Build a Siphon on an ore vein', { key: 'siphon', n: 1 })]),
        stage([obj('cap', 'capture', 'Capture the nearest point', { rank: 0 }), obj('regen', 'shieldRegen', 'Pull a damaged Warden Cell back until its shields refill', { hint: 'Move a squad out of the fight (or tap Retreat). Rings around each orb show shield strength.' })], 'Shields absorb damage first and recharge when a squad is left alone. Fight, pull back, recharge, return.'),
        stage([obj('kill', 'kill', 'Destroy both Bolt Squads', { n: 2 }), obj('cap1', 'capture', 'Capture the point the first sentinel held', { rank: 1, hint: 'Squads capture points by standing on them.' }), obj('cap2', 'capture', 'Capture the point the second sentinel held', { rank: 2 }), obj('loss', 'loseMax', 'Lose no squads', { n: 0, optional: true })], 'Now answer. Kill each sentinel, then stand on the point it was guarding.'),
      ],
      hints: [{ at: 'start', text: 'Wardens outrange Bolts. Fire, step back, fire.' }],
    },
    {
      key: 'green-2', title: 'Long Sight', theme: 'frost', size: 48, seed: 'protocol-2',
      story: ['Frostbite. Crusher Tanks on the ice, escorting drill crews to veins the Collective was saving.', 'The Core answers with the Lens Team: two lenses that focus light into a beam that can cross a frozen lake and open a tank like a tin. They see further than anything alive. They must, because they die to a stiff breeze.'],
      briefing: 'Range and vision: field Lens Teams, kill armour from beyond its reach, and take the veins back.',
      epilogue: ['The tanks burn on the ice with no idea where the beams came from.', 'The Oracle notes a new pattern: the Foundry is fortifying the drill fields with Bunkers.'],
      player: { faction: F, ore: 480, flux: 110, units: ['wardens', 'lenses'], buildings: ['siphon', 'bastion'], squads: [{ key: 'wardens', at: [3, 4] }] },
      enemy: garrison('red', { structures: [{ key: 'drill', at: 'ore:3' }, { key: 'drill', at: 'ore:4' }], squads: [{ key: 'crusher', at: 'ore:3' }, { key: 'crusher', at: 'point:3' }, { key: 'bolts', at: 'point:3' }, { key: 'bolts', at: 'point:1' }], points: [1, 3] }),
      waves: [wave(200, [{ key: 'bolts', n: 2 }], { from: 'point:3', target: 'point:0', text: 'Foundry infantry moving on your point.' })],
      stages: [
        stage([obj('lenses', 'train', 'Train 2 Lens Teams', { key: 'lenses', n: 2 }), obj('cap', 'capture', 'Capture the nearest point', { rank: 0 })]),
        stage([obj('tanks', 'kill', 'Destroy 2 Crusher Tanks', { armor: 'vehicle', n: 2 }), obj('rigs', 'destroy', 'Destroy the Drill Rigs', { key: 'drill', n: 2 })], 'Lenses outrange tanks. Wardens in front to absorb, Lenses behind to kill.'),
        stage([obj('siphon', 'build', 'Own 3 Siphons', { key: 'siphon', n: 3 }), obj('cap3', 'capture', 'Hold 3 points', { n: 3 })], 'Claim what they were stealing.'),
      ],
      hints: [{ at: 'start', text: 'Lens Teams have 8.5 range and 11 sight. Keep them at the back; they die in melee.' }],
    },
    {
      key: 'green-3', title: 'Halo', theme: 'ashfall', size: 64, seed: 'protocol-3',
      story: ['The Ashfall: a Foundry drill field bristling with Bunkers, and Watch Posts on every point.', 'The Collective cannot trade losses with the Foundry; it does not have the numbers. So it fields the Halo, a hovering disc that recharges every shield near it. An army that never runs out of shields never has to stop.'],
      briefing: 'Sustain: field a Halo, keep the army inside its aura, and take the Foundry outposts without losing squads.',
      epilogue: ['The outposts fall and the Collective\'s losses are counted on one hand.', 'The Oracle rises. It has seen where the Foundry\'s ore comes from.'],
      player: { faction: F, ore: 600, flux: 200, units: ['wardens', 'lenses', 'pulsers', 'halo'], buildings: ['siphon', 'array', 'bastion', 'beacon'], structures: [{ key: 'array', at: [-4, 3] }], squads: [{ key: 'wardens', at: [3, 4] }, { key: 'lenses', at: [5, 2] }] },
      enemy: garrison('red', { structures: [{ key: 'post', at: 'point:2' }, { key: 'bunker', at: 'point:2' }, { key: 'post', at: 'point:4' }, { key: 'bunker', at: 'point:4' }, { key: 'drill', at: 'ore:4' }], squads: [{ key: 'bolts', at: 'point:2' }, { key: 'hammers', at: 'point:4', order: 'hold' }, { key: 'bolts', at: 'point:4' }], points: [2, 4] }),
      stages: [
        stage([obj('halo', 'train', 'Field a Halo', { key: 'halo', n: 1 }), obj('pop', 'pop', 'Raise an army of 16 population', { n: 16 })]),
        stage([obj('posts', 'destroy', 'Destroy both Watch Posts', { key: 'post', n: 2 }), obj('bunkers', 'destroy', 'Destroy both Bunkers', { key: 'bunker', n: 2 }), obj('loss', 'loseMax', 'Lose at most 1 squad', { n: 1, optional: true })], 'Keep everything inside the Halo\'s ring. Rotate damaged squads to the back; they will be full again in seconds.'),
        stage([obj('cap', 'capture', 'Hold 5 points', { n: 5 })]),
      ],
      hints: [{ at: 'start', text: 'The Halo is a vehicle: anti-armour fire hurts it. Keep it behind the Wardens.' }],
    },
    {
      key: 'green-4', title: 'The Oracle', theme: 'urban', size: 64, seed: 'protocol-4',
      story: ['The Ruined City hides the Foundry\'s supply: Drill Rigs tucked into courtyards, invisible from the streets. The Foundry is alive here, and it is watching the roads.', 'The Oracle takes the field. It sees through the fog further than anything in the Lattice. Find the rigs. Starve the city.'],
      briefing: 'Vision and hero: train the Oracle, attach it, find and destroy the hidden Drill Rigs, and fortify a point with a Beacon.',
      epilogue: ['Three rigs burn in three courtyards. The city\'s bunkers go quiet for want of ore.', 'The Foundry answers with gun teams. The Oracle has already seen them coming.'],
      player: { faction: F, ore: 650, flux: 220, structures: [{ key: 'array', at: [-4, 3] }], squads: [{ key: 'wardens', at: [3, 4] }, { key: 'pulsers', at: [5, 2] }] },
      enemy: war('red', 'passive', { incomeMult: 0.9, structures: [{ key: 'drill', at: 'ore:3' }, { key: 'drill', at: 'ore:5' }, { key: 'drill', at: 'ore:6' }, { key: 'bunker', at: 'point:4' }, { key: 'post', at: 'point:4' }], squads: [{ key: 'bolts', at: 'ore:3' }, { key: 'hammers', at: 'ore:5', order: 'hold' }] }),
      stages: [
        stage([obj('hero', 'hero', 'Train the Oracle'), obj('attach', 'attach', 'Attach the Oracle to a squad')]),
        stage([obj('rigs', 'destroy', 'Find and destroy 3 hidden Drill Rigs', { key: 'drill', n: 3 }), obj('beacon', 'build', 'Build a Beacon on a captured point', { key: 'beacon', n: 1 })], 'The Oracle sees 14 tiles. Walk the courtyards; the rigs will appear on the minimap once seen.'),
        stage([obj('cap', 'capture', 'Hold 4 points', { n: 4 })]),
      ],
      hints: [{ at: 'start', text: 'The Foundry here defends but does not attack. Take your time; scout before you commit.' }],
    },
    {
      key: 'green-5', title: 'Bastion Line', theme: 'frost', size: 64, seed: 'protocol-5',
      story: ['The Foundry comes back across the ice in earnest: Hammer Teams, Breachers, Bolts in waves, a tank behind them.', 'The Collective answers with the Bastion: a Lens Team that stopped moving and grew a shield the size of a house. Two of them, and a Halo, and the ice becomes a wall.'],
      briefing: 'Static defence: build Bastions, hold three points, and let the Foundry waves break on your line.',
      epilogue: ['The last Breacher dies at the foot of a Bastion it never reached.', 'The Foundry has a drill field in the frost, and the Oracle has computed exactly how to take it.'],
      player: { faction: F, ore: 700, flux: 260, structures: [{ key: 'array', at: [-4, 3] }], squads: [{ key: 'wardens', at: [3, 4], n: 2 }, { key: 'lenses', at: [5, 2] }, { key: 'halo', at: [2, 6] }], points: [0, 1, 2] },
      enemy: garrison('red', { points: [4, 5] }),
      waves: [wave(70, [{ key: 'bolts', n: 2 }], { text: 'Bolt Squads on the ice.' }), wave(150, [{ key: 'hammers', n: 2 }], { text: 'Gun teams: hit them before they set up.' }), wave(240, [{ key: 'breachers', n: 2 }, { key: 'bolts', n: 1 }], { text: 'Breachers: they will go for the Bastions.' }), wave(330, [{ key: 'crusher', n: 1 }, { key: 'bolts', n: 2 }], { text: 'Armour. Lenses forward.' }), wave(420, [{ key: 'bolts', n: 3 }, { key: 'hammers', n: 1 }], { text: 'Their last push.' })],
      stages: [
        stage([obj('bastion', 'build', 'Build 2 Bastions', { key: 'bastion', n: 2 })]),
        stage([obj('hold', 'hold', 'Hold 3 points for 7 minutes', { n: 3, seconds: 420 }), obj('loss', 'loseMax', 'Lose no more than 2 squads', { n: 2, optional: true })], 'Bastions at the approaches, Wardens between them, the Halo behind.'),
      ],
      hints: [{ at: 'start', text: 'A Bastion beside a Beacon holds a point on its own. Put them where the waves must pass.' }],
    },
  ],
};
