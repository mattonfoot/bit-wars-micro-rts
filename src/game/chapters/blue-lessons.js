// Handwritten opening lessons (chapters 1-5) for the Vector Swarm.
import { garrison, war, obj, stage, wave } from './common.js';

const F = 'blue';
export const BLUE_LESSONS = {
  faction: F, title: 'Shear', tagline: 'The Swarm wakes. The Swarm divides. The Swarm takes.',
  intro: 'The Hive slept through the long dark, its swarms folded flat against the shear-line. Now the ore hum has returned and the Apex stirs. The Swarm does not plan. It multiplies, it moves, and it arrives from the side nobody is watching.',
  chapters: [
    // ---------------- ACT I: lessons
    {
      key: 'blue-1', title: 'First Bloom', theme: 'verdant', size: 48, seed: 'shear-1',
      story: ['The Hive cracks open in the Verdant Basin. Around it, rusting Foundry outposts still guard the old ore veins, abandoned by a garrison that never expected the shear-line to wake.', 'You are the first thought of the Apex. Bloom. Feed. Spread.'],
      briefing: 'Learn the basics: train Dart Swarms, mine ore, and capture your first strategic point.',
      epilogue: ['The first point falls in seconds. The Foundry garrison did not even turn around. The Hive tastes ore and starts to divide faster.', 'Scouts report armour moving on the river road. The Foundry has noticed.'],
      player: { faction: F, ore: 300, flux: 60, units: ['darts'], buildings: ['lode'] },
      enemy: garrison('red', { squads: [{ key: 'bolts', at: 'point:2', hp: 0.7 }], points: [2] }),
      stages: [
        stage([obj('train', 'train', 'Train 2 Dart Swarms at the Hive', { key: 'darts', n: 2, hint: 'Tap the Hive, then tap Dart Swarm.' })]),
        stage([obj('lode', 'build', 'Build a Lode Burrow on an ore vein', { key: 'lode', n: 1, hint: 'Tap Build, choose Lode Burrow, tap the glowing vein.' })], 'Swarms need ore. Burrow into the vein beside the Hive.'),
        stage([obj('cap', 'capture', 'Capture the nearest strategic point', { rank: 0, hint: 'Select a swarm and tap the flag marker.' })], 'Flux comes only from strategic points. Stand on one to claim it.'),
        stage([obj('kill', 'kill', 'Destroy the Bolt Squad guarding the second point', { n: 1, hint: 'Long-press the ground near them to attack-move.' }), obj('cap2', 'capture', 'Capture the second point', { rank: 2 })], 'A Foundry squad holds the next point. Eight blades beat four rifles up close.'),
      ],
      hints: [{ at: 'start', text: 'Drag to pan, pinch to zoom. Your Hive is selected: tap Dart Swarm twice.' }, { at: 'stage:3', text: 'Darts are melee. Charge in together; do not trickle.' }],
    },
    {
      key: 'blue-2', title: 'Needle and Thread', theme: 'verdant', size: 48, seed: 'shear-2',
      story: ['A Crusher Tank grinds down the river road with Bolt Squads in its shadow. Darts shatter against its plating; blades cannot bite iron.', 'The Hive answers by growing something new: long, hollow Needles that punch through armour. And it learns the other lesson of the basin: the boulders and brush are not scenery. They are shields.'],
      briefing: 'Counters and cover: build Needle Squads to kill armour, fight from cover, and reinforce a bled squad.',
      epilogue: ['The tank dies with Needles still bristling from its hull. Its escort breaks and runs for the frost line.', 'The Apex follows the retreat with a thousand eyes. Where they run, the Foundry is thin.'],
      player: { faction: F, ore: 420, flux: 80, units: ['darts', 'needles'], buildings: ['lode', 'thorn'], squads: [{ key: 'darts', at: [3, 4] }] },
      enemy: garrison('red', { squads: [{ key: 'crusher', at: 'point:3' }, { key: 'bolts', at: 'point:3', n: 2 }, { key: 'bolts', at: 'point:1' }], points: [1, 3] }),
      waves: [wave(150, [{ key: 'bolts', n: 2 }], { from: 'point:3', target: 'point:0', text: 'Foundry infantry is moving on your point.' })],
      stages: [
        stage([obj('needles', 'train', 'Train 2 Needle Squads', { key: 'needles', n: 2 }), obj('lode', 'build', 'Claim both ore veins near the Hive', { key: 'lode', n: 2, optional: true })]),
        stage([obj('cap', 'capture', 'Capture the nearest point', { rank: 0 }), obj('cover', 'cover', 'Take 8 hits while in cover', { n: 8, hint: 'Park a squad beside a boulder facing the enemy, or inside brush.' }), obj('reinf', 'reinforce', 'Reinforce a damaged squad twice', { n: 2 })], 'Take the closest point, and fight from behind rocks and brush. The shield icon over a squad means the cover is working.'),
        stage([obj('tank', 'kill', 'Destroy the Crusher Tank', { key: 'crusher', n: 1 }), obj('cap3', 'capture', 'Capture the point it was guarding', { rank: 3 })], 'The tank sits at the far point. Needles first, Darts on its escort.'),
      ],
      hints: [{ at: 'start', text: 'Needle Squads deal anti-armour damage: 1.5× against vehicles, weak in melee.' }, { at: 'time:150', text: 'Enemy infantry inbound. Hold your point from cover.' }],
    },
    {
      key: 'blue-3', title: 'The Long Way Round', theme: 'frost', size: 64, seed: 'shear-3',
      story: ['The retreat leads into Frostbite, where the Foundry has dug Hammer Teams into the passes. A Hammer Team pins anything in front of it; squads that charge it head-on break before they arrive.', 'The Hive grows a Nest, and from the Nest come Wedges: the fastest thing on the ice. Wedges do not go through. They go around.'],
      briefing: 'Flanking and morale: build the Nest, raise Wedge Raiders, hit the gun teams from behind and break them.',
      epilogue: ['Three Hammer Teams die facing the wrong way. The passes belong to the Swarm.', 'Beyond the ice, the sky is orange. The Foundry has been drilling in the Ashfall for years, and its refineries are unguarded from above.'],
      player: { faction: F, ore: 500, flux: 120, units: ['darts', 'needles', 'wedges'], buildings: ['lode', 'nest', 'thorn', 'claim'], squads: [{ key: 'darts', at: [3, 4] }, { key: 'needles', at: [5, 2] }] },
      enemy: garrison('red', { squads: [{ key: 'hammers', at: 'point:1', order: 'hold' }, { key: 'hammers', at: 'point:3', order: 'hold' }, { key: 'hammers', at: 'point:4', order: 'hold' }, { key: 'bolts', at: 'point:3' }, { key: 'bolts', at: 'point:4' }], points: [1, 3, 4], structures: [{ key: 'post', at: 'point:3' }] }),
      stages: [
        stage([obj('nest', 'build', 'Build a Nest', { key: 'nest', n: 1 }), obj('wedges', 'train', 'Train 2 Wedge Raiders', { key: 'wedges', n: 2 })]),
        stage([obj('flank', 'flank', 'Land 8 flanking hits', { n: 8, hint: 'Select the Wedges, tap Flank, then tap a Hammer Team. They circle behind it on their own.' }), obj('broken', 'broken', 'Break 2 enemy squads', { n: 2 })], 'Attacks from behind deal extra damage and shred morale, and Wedges double the bonus. Use the Flank command: the squad swings wide around the gun team and hits it from the rear while it is still turning.'),
        stage([obj('post', 'destroy', 'Destroy the Watch Post', { key: 'post', n: 1 }), obj('cap', 'capture', 'Hold 4 strategic points', { n: 4 })], 'Now roll up the passes. The Watch Post must fall before its point can be taken.'),
      ],
      hints: [{ at: 'start', text: 'Hammer Teams must set up to fire, have a narrow arc and turn slowly. Never approach one from the front.' }, { at: 'stage:1', text: 'Keep the Darts in front of a Hammer Team to hold its attention, then send the Wedges round with Flank.' }, { at: 'stage:2', text: 'Broken squads fight at a third strength and take 50% more damage. Finish them.' }],
    },
    {
      key: 'blue-4', title: 'Wings over Ash', theme: 'ashfall', size: 64, seed: 'shear-4',
      story: ['The Ashfall is Foundry country: drill rigs on every vein, bunkers on every road, lava between. On the ground the Swarm would be ground down.', 'So the Hive raises a Spire, and from the Spire come Kites: hovering raiders that ignore lava, walls and roads alike. An economy that cannot be defended is not an economy.'],
      briefing: 'Harassment: build a Spire, raise Kites, burn the Foundry drill rigs, and starve a living opponent while you hold the points.',
      epilogue: ['Rig after rig goes dark. With no ore the Foundry stops building, then stops fighting, then simply stops.', 'The Apex has watched long enough. It will lead the next assault itself.'],
      player: { faction: F, ore: 800, flux: 300, incomeMult: 1.3, units: ['darts', 'needles', 'wedges', 'kites'], buildings: ['lode', 'nest', 'spire', 'thorn', 'claim'], structures: [{ key: 'lode', at: 'ore:0' }, { key: 'lode', at: 'ore:1' }, { key: 'thorn', at: [3, 3] }], squads: [{ key: 'darts', at: [2, 4] }], points: [0, 1] },
      enemy: war('red', 'easy', { incomeMult: 0.65, aiPop: 16, structures: [{ key: 'drill', at: 'ore:6' }, { key: 'drill', at: 'ore:7' }, { key: 'drill', at: 'ore:4' }, { key: 'bunker', at: [-3, 3] }, { key: 'works', at: [4, -2] }], squads: [{ key: 'bolts', at: [0, 5] }] }),
      stages: [
        stage([obj('spire', 'build', 'Build a Spire', { key: 'spire', n: 1 }), obj('kites', 'train', 'Train 2 Kite Wings', { key: 'kites', n: 2 })]),
        stage([obj('rigs', 'destroy', 'Destroy 3 Drill Rigs', { key: 'drill', n: 3 }), obj('hold', 'hold', 'Hold 3 points for 90 seconds', { n: 3, seconds: 90 })], 'Kites fly. Cross the lava, hit the drill rigs, and pull out before the bunkers turn. Two Burrows are already feeding the Hive; keep them alive.'),
      ],
      hints: [{ at: 'start', text: 'The Foundry here is alive and will attack. Claim points early and keep a Thorn and some Darts at home.' }, { at: 'stage:1', text: 'Kites are vehicles: rifles barely scratch them, but anti-armour, turrets and Breachers do. Hit a rig, then fly home to heal before the response arrives.' }],
    },
    {
      key: 'blue-5', title: 'Apex', theme: 'urban', size: 64, seed: 'shear-5',
      story: ['The Ruined City is where the Foundry makes its stand: walls, bunkers, and everything it has left thrown down the streets in waves.', 'The Apex takes the field. Where it moves the Swarm moves faster and never breaks; attached to a squad it becomes the point of a spear. But even the Apex knows when to pull back and bloom again.'],
      briefing: 'Hero and morale: train the Apex, attach it to a squad, retreat and rally a broken squad, and survive the Foundry counter-offensive.',
      epilogue: ['The last wave dies in the streets. Somewhere behind the walls the Foreman calls the retreat, and the Foundry pulls back along the river toward its heartland.', 'The Hive feels the Prime Vein now, faintly, like a heartbeat under the whole Lattice.'],
      player: { faction: F, ore: 600, flux: 200, squads: [{ key: 'darts', at: [3, 4] }, { key: 'needles', at: [5, 2] }, { key: 'wedges', at: [2, 6] }], structures: [{ key: 'nest', at: [-4, 3] }] },
      enemy: garrison('red', { structures: [{ key: 'bunker', at: 'point:3' }, { key: 'post', at: 'point:3' }], squads: [{ key: 'bolts', at: 'point:1' }], points: [1, 3] }),
      waves: [wave(90, [{ key: 'bolts', n: 2 }], { text: 'Foundry wave one. Hold the streets.' }), wave(180, [{ key: 'bolts', n: 2 }, { key: 'hammers', n: 1 }], { text: 'Wave two, with a gun team. Flank it.' }), wave(270, [{ key: 'breachers', n: 1 }, { key: 'bolts', n: 2 }], { text: 'Wave three: Breachers. Keep the Apex close.' }), wave(360, [{ key: 'crusher', n: 1 }, { key: 'bolts', n: 2 }, { key: 'hammers', n: 1 }], { text: 'Final wave: armour. Needles forward.' })],
      stages: [
        stage([obj('hero', 'hero', 'Train the Apex at the Hive'), obj('attach', 'attach', 'Attach the Apex to a squad', { hint: 'Select the Apex, tap Attach, then tap a squad.' })]),
        stage([obj('retreat', 'retreat', 'Order a retreat', { n: 1 }), obj('rally', 'rally', 'Rally a broken squad (let its morale recover)', { n: 1 }), obj('survive', 'survive', 'Survive the Foundry offensive (7 minutes)', { seconds: 420 })], 'Waves are coming. When a squad breaks, Retreat it: it sprints home, recovers, and comes back.'),
        stage([obj('bunker', 'destroy', 'Destroy the Bunker', { key: 'bunker', n: 1 }), obj('cap', 'capture', 'Capture the fortified point', { rank: 3 })], 'The waves are spent. Take their forward position.'),
      ],
      hints: [{ at: 'start', text: 'The Apex aura gives nearby squads speed and morale. Keep the army inside it.' }],
    },
  ],
};
