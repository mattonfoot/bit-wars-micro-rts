// Campaign content. Each faction has six chapters that teach its mechanics in order and end in a decisive battle.
// Position specs: 'base' | 'playerBase' | 'enemyBase' | 'center' | 'point:k' (k-th nearest strategic point to the
// player's base) | 'ore:k' (k-th nearest ore vein) | [dx,dy] tiles from the owner's base.
// Objective types: train, build, hero, kill, destroy, destroyHq, destroyAll, capture, hold, survive, reinforce,
// attach, retreat, rally, cover, flank, broken, terrain, pop, moveTo, setup, shieldRegen, loseMax (constraint).

export const LORE = {
  world: 'The Lattice was once a single crystal world. When it cracked, three peoples woke in the fracture: the Vector Swarm, endlessly dividing triangles born along the shear-lines; the Iron Foundry, square-cut folk of the deep forges who believe only in what lasts; and the Aegis Collective, contemplative spheres who read the future in the pattern of the break. At the heart of the Lattice lies the Prime Vein, the seam of ore that held the world together. Whoever holds it can forge the Lattice anew, in their own shape.',
};

const BLUE = {
  faction: 'blue', title: 'Shear', tagline: 'The Swarm wakes. The Swarm divides. The Swarm takes.',
  intro: 'The Hive slept through the long dark, its triangles folded flat against the shear-line. Now the ore hum has returned and the Apex stirs. The Swarm does not plan. It multiplies, it moves, and it arrives from the side nobody is watching.',
  chapters: [
    {
      key: 'blue-1', title: 'First Bloom', theme: 'verdant', size: 48, seed: 'shear-1',
      story: ['The Hive cracks open in the Verdant Basin. Around it, rusting Foundry outposts still guard the old ore veins, abandoned by a garrison that never expected the shear-line to wake.', 'You are the first thought of the Apex. Bloom. Feed. Spread.'],
      briefing: 'Learn the basics: train Dart Swarms, mine ore, and capture your first strategic point.',
      epilogue: ['The first point falls in seconds. The Foundry garrison did not even turn around. The Hive tastes ore and starts to divide faster.', 'Scouts report armour moving on the river road. The Foundry has noticed.'],
      player: { faction: 'blue', ore: 300, flux: 60, units: ['darts'], buildings: ['lode'] },
      enemy: { faction: 'red', hq: false, ai: null, squads: [{ key: 'bolts', at: 'point:2', hp: 0.7 }], points: [2] },
      lose: { hq: true },
      stages: [
        { objectives: [{ id: 'train', type: 'train', key: 'darts', n: 2, text: 'Train 2 Dart Swarms at the Hive', hint: 'Tap the Hive, then tap Dart Swarm.' }] },
        { intro: 'Swarms need ore. Burrow into the vein beside the Hive.', objectives: [{ id: 'lode', type: 'build', key: 'lode', n: 1, text: 'Build a Lode Burrow on an ore vein', hint: 'Tap Build, choose Lode Burrow, tap the glowing vein.' }] },
        { intro: 'Flux comes only from strategic points. Stand on one to claim it.', objectives: [{ id: 'cap', type: 'capture', rank: 0, text: 'Capture the nearest strategic point', hint: 'Select a swarm (tap it or its icon at the top) and tap the flag marker.' }] },
        { intro: 'A Foundry squad holds the next point. Eight blades beat four rifles up close.', objectives: [{ id: 'kill', type: 'kill', n: 1, text: 'Destroy the Bolt Squad guarding the second point', hint: 'Long-press on the ground near them to attack-move.' }, { id: 'cap2', type: 'capture', rank: 2, text: 'Capture the second point' }] },
      ],
      hints: [{ at: 'start', text: 'Drag to pan, pinch to zoom. Your Hive is selected: tap Dart Swarm twice.' }, { at: 'stage:3', text: 'Darts are melee. Charge in together; do not trickle.' }],
    },
    {
      key: 'blue-2', title: 'Needle and Thread', theme: 'verdant', size: 48, seed: 'shear-2',
      story: ['A Crusher Tank grinds down the river road with Bolt Squads in its shadow. Darts shatter against its plating; blades cannot bite iron.', 'The Hive answers by growing something new: long, hollow Needles that punch through armour. And it learns the other lesson of the basin: the boulders and brush are not scenery. They are shields.'],
      briefing: 'Counters and cover: build Needle Squads to kill armour, fight from cover, and reinforce a bled squad.',
      epilogue: ['The tank dies with Needles still bristling from its hull. Its escort breaks and runs for the frost line.', 'The Apex follows the retreat with a thousand eyes. Where they run, the Foundry is thin.'],
      player: { faction: 'blue', ore: 420, flux: 80, units: ['darts', 'needles'], buildings: ['lode', 'thorn'], squads: [{ key: 'darts', at: [3, 4] }] },
      enemy: { faction: 'red', hq: false, ai: null, squads: [{ key: 'crusher', at: 'point:3' }, { key: 'bolts', at: 'point:3', n: 2 }, { key: 'bolts', at: 'point:1' }], points: [1, 3] },
      waves: [{ at: 150, units: [{ key: 'bolts', n: 2 }], from: 'point:3', target: 'point:0', text: 'Foundry infantry is moving on your point.' }],
      stages: [
        { objectives: [{ id: 'needles', type: 'train', key: 'needles', n: 2, text: 'Train 2 Needle Squads' }, { id: 'lode', type: 'build', key: 'lode', n: 2, text: 'Claim both ore veins near the Hive', optional: true }] },
        { intro: 'Take the closest point, and fight from behind rocks and brush. The shield icon over a squad means the cover is working.', objectives: [{ id: 'cap', type: 'capture', rank: 0, text: 'Capture the nearest point' }, { id: 'cover', type: 'cover', n: 8, text: 'Take 8 hits while in cover', hint: 'Park a squad beside a boulder facing the enemy, or inside brush.' }, { id: 'reinf', type: 'reinforce', n: 2, text: 'Reinforce a damaged squad twice', hint: 'Select a squad missing members and tap Reinforce.' }] },
        { intro: 'The tank sits at the far point. Needles first, Darts on its escort.', objectives: [{ id: 'tank', type: 'kill', key: 'crusher', n: 1, text: 'Destroy the Crusher Tank' }, { id: 'cap3', type: 'capture', rank: 3, text: 'Capture the point it was guarding' }] },
      ],
      hints: [{ at: 'start', text: 'Needle Squads deal anti-armour damage: 1.5× against vehicles, weak in melee.' }, { at: 'time:150', text: 'Enemy infantry inbound. Hold your point from cover.' }],
    },
    {
      key: 'blue-3', title: 'The Long Way Round', theme: 'frost', size: 64, seed: 'shear-3',
      story: ['The retreat leads into Frostbite, where the Foundry has dug Hammer Teams into the passes. A Hammer Team pins anything in front of it; squads that charge it head-on break before they arrive.', 'The Hive grows a Nest, and from the Nest come Wedges: the fastest thing on the ice. Wedges do not go through. They go around.'],
      briefing: 'Flanking and morale: build the Nest, raise Wedge Raiders, hit the gun teams from behind and break them.',
      epilogue: ['Three Hammer Teams die facing the wrong way. The passes belong to the Swarm.', 'Beyond the ice, the sky is orange. The Foundry has been drilling in the Ashfall for years, and its refineries are unguarded from above.'],
      player: { faction: 'blue', ore: 500, flux: 120, units: ['darts', 'needles', 'wedges'], buildings: ['lode', 'nest', 'thorn', 'claim'], squads: [{ key: 'darts', at: [3, 4] }, { key: 'needles', at: [5, 2] }] },
      enemy: { faction: 'red', hq: false, ai: null, squads: [{ key: 'hammers', at: 'point:1', order: 'hold' }, { key: 'hammers', at: 'point:3', order: 'hold' }, { key: 'hammers', at: 'point:4', order: 'hold' }, { key: 'bolts', at: 'point:3' }, { key: 'bolts', at: 'point:4' }], points: [1, 3, 4], structures: [{ key: 'post', at: 'point:3' }] },
      stages: [
        { objectives: [{ id: 'nest', type: 'build', key: 'nest', n: 1, text: 'Build a Nest' }, { id: 'wedges', type: 'train', key: 'wedges', n: 2, text: 'Train 2 Wedge Raiders' }] },
        { intro: 'Attacks from behind deal extra damage and shred morale. Wedges double the bonus. Circle wide, then strike.', objectives: [{ id: 'flank', type: 'flank', n: 12, text: 'Land 12 flanking hits', hint: 'A squad is flanked when hit from more than 110° behind its facing.' }, { id: 'broken', type: 'broken', n: 2, text: 'Break 2 enemy squads' }] },
        { intro: 'Now roll up the passes. The Watch Post must fall before its point can be taken.', objectives: [{ id: 'post', type: 'destroy', key: 'post', n: 1, text: 'Destroy the Watch Post' }, { id: 'cap', type: 'capture', n: 4, text: 'Hold 4 strategic points' }] },
      ],
      hints: [{ at: 'start', text: 'Hammer Teams must set up to fire and have a narrow arc. Never approach one from the front.' }, { at: 'stage:2', text: 'Broken squads fight at a third strength and take 50% more damage. Finish them.' }],
    },
    {
      key: 'blue-4', title: 'Wings over Ash', theme: 'ashfall', size: 64, seed: 'shear-4',
      story: ['The Ashfall is Foundry country: drill rigs on every vein, bunkers on every road, lava between. On the ground the Swarm would be ground down.', 'So the Hive raises a Spire, and from the Spire come Kites: hovering triangles that ignore lava, walls and roads alike. An economy that cannot be defended is not an economy.'],
      briefing: 'Harassment: build a Spire, raise Kites, burn the Foundry drill rigs, and starve a living opponent while you hold the points.',
      epilogue: ['Rig after rig goes dark. With no ore the Foundry stops building, then stops fighting, then simply stops.', 'The Apex has watched long enough. It will lead the next assault itself.'],
      player: { faction: 'blue', ore: 550, flux: 150, units: ['darts', 'needles', 'wedges', 'kites'], buildings: ['lode', 'nest', 'spire', 'thorn', 'claim'] },
      enemy: { faction: 'red', ai: 'easy', incomeMult: 0.9, structures: [{ key: 'drill', at: 'ore:6' }, { key: 'drill', at: 'ore:7' }, { key: 'drill', at: 'ore:4' }, { key: 'bunker', at: [-3, 3] }, { key: 'works', at: [4, -2] }], squads: [{ key: 'bolts', at: [0, 5] }, { key: 'hammers', at: [-4, 0] }], points: [4, 5, 6] },
      stages: [
        { objectives: [{ id: 'spire', type: 'build', key: 'spire', n: 1, text: 'Build a Spire' }, { id: 'kites', type: 'train', key: 'kites', n: 2, text: 'Train 2 Kite Wings' }] },
        { intro: 'Kites fly. Cross the lava, hit the drill rigs, leave before the bunkers turn.', objectives: [{ id: 'rigs', type: 'destroy', key: 'drill', n: 3, text: 'Destroy 3 Drill Rigs' }, { id: 'hold', type: 'hold', n: 4, seconds: 90, text: 'Hold 4 points for 90 seconds' }] },
      ],
      hints: [{ at: 'start', text: 'The Foundry here is alive and will attack. Claim your veins and points early.' }, { at: 'stage:1', text: 'Kites are vehicles: anti-armour and energy hurt them. Avoid Needles-type fire and turrets.' }],
    },
    {
      key: 'blue-5', title: 'Apex', theme: 'urban', size: 64, seed: 'shear-5',
      story: ['The Ruined City is where the Foundry makes its stand: walls, bunkers, and everything it has left thrown down the streets in waves.', 'The Apex takes the field. Where it moves the Swarm moves faster and never breaks; attached to a squad it becomes the point of a spear. But even the Apex knows when to pull back and bloom again.'],
      briefing: 'Hero and morale: train the Apex, attach it to a squad, retreat and rally a broken squad, and survive the Foundry counter-offensive.',
      epilogue: ['The last wave dies in the streets. Somewhere behind the walls the Foreman calls the retreat to the Crystal Dunes, where the Foundry itself was forged.', 'The Hive feels the Prime Vein now, like a heartbeat under the sand.'],
      player: { faction: 'blue', ore: 600, flux: 200, squads: [{ key: 'darts', at: [3, 4] }, { key: 'needles', at: [5, 2] }, { key: 'wedges', at: [2, 6] }], structures: [{ key: 'nest', at: [-4, 3] }] },
      enemy: { faction: 'red', hq: false, ai: null, structures: [{ key: 'bunker', at: 'point:3' }, { key: 'post', at: 'point:3' }], squads: [{ key: 'bolts', at: 'point:1' }], points: [1, 3] },
      waves: [
        { at: 90, units: [{ key: 'bolts', n: 2 }], text: 'Foundry wave one. Hold the streets.' },
        { at: 180, units: [{ key: 'bolts', n: 2 }, { key: 'hammers', n: 1 }], text: 'Wave two, with a gun team. Flank it.' },
        { at: 270, units: [{ key: 'breachers', n: 1 }, { key: 'bolts', n: 2 }], text: 'Wave three: Breachers. Keep the Apex close.' },
        { at: 360, units: [{ key: 'crusher', n: 1 }, { key: 'bolts', n: 2 }, { key: 'hammers', n: 1 }], text: 'Final wave: armour. Needles forward.' },
      ],
      stages: [
        { objectives: [{ id: 'hero', type: 'hero', text: 'Train the Apex at the Hive' }, { id: 'attach', type: 'attach', text: 'Attach the Apex to a squad', hint: 'Select the Apex, tap Attach, then tap a squad.' }] },
        { intro: 'Waves are coming. When a squad breaks, Retreat it: it sprints home, recovers, and comes back.', objectives: [{ id: 'retreat', type: 'retreat', n: 1, text: 'Order a retreat' }, { id: 'rally', type: 'rally', n: 1, text: 'Rally a broken squad (let its morale recover)' }, { id: 'survive', type: 'survive', seconds: 420, text: 'Survive the Foundry offensive (7 minutes)' }] },
        { intro: 'The waves are spent. Take their forward position.', objectives: [{ id: 'bunker', type: 'destroy', key: 'bunker', n: 1, text: 'Destroy the Bunker' }, { id: 'cap', type: 'capture', rank: 3, text: 'Capture the fortified point' }] },
      ],
      hints: [{ at: 'start', text: 'The Apex aura gives nearby squads speed and morale. Keep the army inside it.' }],
    },
    {
      key: 'blue-6', title: 'Obelisk', theme: 'crystal', size: 80, seed: 'shear-6',
      story: ['Crystal Dunes. The Foundry, the whole Foundry, dug into the canyons around the Prime Vein with everything it has learned about the Swarm.', 'The Hive grows its final shape: the Obelisk, a walking pyramid that lobs shattering bolts across canyons and leaves craters where cover used to be. This is not a raid. This is the end of the Foundry.'],
      briefing: 'Full war against a living Foundry: build the Obelisk, break the canyon lines, and destroy the Foundry itself.',
      epilogue: ['The Foundry falls in fire and glass. The Prime Vein lies open, humming, and the Swarm pours over it in a tide of triangles.', 'Somewhere far to the east, the Aegis Collective closes its shield-domes and begins to compute a reply. Campaign complete.'],
      player: { faction: 'blue', ore: 600, flux: 200 },
      enemy: { faction: 'red', ai: 'normal', incomeMult: 1.1, structures: [{ key: 'bunker', at: [-4, 4] }, { key: 'bunker', at: [4, -4] }, { key: 'works', at: [5, 3] }, { key: 'drill', at: 'ore:6' }, { key: 'drill', at: 'ore:7' }], squads: [{ key: 'bolts', at: [0, 5], n: 2 }, { key: 'hammers', at: [-3, 2] }], points: [4, 5, 6] },
      stages: [
        { objectives: [{ id: 'econ', type: 'capture', n: 3, text: 'Hold 3 strategic points' }, { id: 'obelisk', type: 'train', key: 'obelisk', n: 1, text: 'Build an Obelisk' }] },
        { intro: 'The Obelisk outranges bunkers. Screen it with Darts and let it walk.', objectives: [{ id: 'hq', type: 'destroyHq', text: 'Destroy the Foundry' }, { id: 'loss', type: 'loseMax', n: 8, text: 'Lose no more than 8 squads', optional: true }] },
      ],
      hints: [{ at: 'start', text: 'The Obelisk needs a Nest and a Spire. Expand fast; the Foundry will not wait.' }],
    },
  ],
};

const RED = {
  faction: 'red', title: 'Doctrine', tagline: 'Hold. Suppress. Breach. Rebuild.',
  intro: 'The Foundry does not bloom and it does not flow. It holds ground, one riveted square at a time, and it does not give ground back. The Foreman\'s guild has one teaching: everything that lasts was built under fire.',
  chapters: [
    {
      key: 'red-1', title: 'Hold the Line', theme: 'urban', size: 48, seed: 'doctrine-1',
      story: ['A single Foundry, fresh from the forge, on the edge of the Ruined City. The Swarm has already found it: Dart packs are coming down the boulevards in waves.', 'You have walls, rubble, and Bolt Squads. That is all a Foundry has ever needed.'],
      briefing: 'Learn the basics: train Bolt Squads, hold position in cover, survive the swarm waves and claim a point.',
      epilogue: ['The swarm breaks on the walls, three times. The street is carpeted with blue shards and not one Bolt Squad has moved.', 'The Foreman sends word: the swarms are being driven from the Verdant Basin. Go there. Bring the heavy guns.'],
      player: { faction: 'red', ore: 320, flux: 60, units: ['bolts'], buildings: ['drill'] },
      enemy: { faction: 'blue', hq: false, ai: null, squads: [{ key: 'darts', at: 'point:2' }], points: [2] },
      waves: [{ at: 75, units: [{ key: 'darts', n: 1 }], text: 'Dart Swarm inbound. Hold.' }, { at: 140, units: [{ key: 'darts', n: 2 }], text: 'Two swarms. Stay in cover.' }, { at: 210, units: [{ key: 'darts', n: 2 }, { key: 'needles', n: 1 }], text: 'Last wave. Hold the line.' }],
      stages: [
        { objectives: [{ id: 'train', type: 'train', key: 'bolts', n: 2, text: 'Train 2 Bolt Squads', hint: 'Tap the Foundry, then Bolt Squad.' }, { id: 'drill', type: 'build', key: 'drill', n: 1, text: 'Build a Drill Rig on an ore vein' }] },
        { intro: 'Swarms are coming. Put your squads behind walls or in rubble and order Hold. Cover halves the damage.', objectives: [{ id: 'cover', type: 'cover', n: 10, text: 'Take 10 hits while in cover', hint: 'The blue shield icon over a squad means cover is working.' }, { id: 'survive', type: 'survive', seconds: 260, text: 'Survive the swarm waves' }] },
        { intro: 'The street is yours. Take the point.', objectives: [{ id: 'cap', type: 'capture', rank: 0, text: 'Capture the nearest strategic point' }, { id: 'kill', type: 'kill', n: 1, text: 'Destroy the swarm holding the second point' }, { id: 'cap2', type: 'capture', rank: 2, text: 'Capture the second point' }] },
      ],
      hints: [{ at: 'start', text: 'Bolt Squads are heavy infantry: slow, tough, good against light infantry.' }, { at: 'stage:1', text: 'Select a squad and tap Hold so it does not chase into the open.' }],
    },
    {
      key: 'red-2', title: 'Suppressing Fire', theme: 'verdant', size: 48, seed: 'doctrine-2',
      story: ['The Verdant Basin, thick with brush and swarms. Rifles cannot kill triangles faster than the Hive makes them.', 'But a Hammer Team does not need to kill. Set up, and it pins a whole squad in place, breaks its morale, and leaves it helpless for the Bolts to finish.'],
      briefing: 'Suppression: build Hammer Teams, set them up, and break swarms before they reach you. Reinforce in the field.',
      epilogue: ['The basin is quiet. Broken swarms flee in every direction and do not come back.', 'The Foreman\'s next order is a map of the Ruined City, with the Swarm\'s new Claim Spikes marked in red.'],
      player: { faction: 'red', ore: 450, flux: 90, units: ['bolts', 'hammers'], buildings: ['drill', 'bunker'], squads: [{ key: 'bolts', at: [3, 4] }] },
      enemy: { faction: 'blue', hq: false, ai: null, squads: [{ key: 'darts', at: 'point:1', n: 2 }, { key: 'darts', at: 'point:3', n: 2 }, { key: 'needles', at: 'point:3' }], points: [1, 3] },
      waves: [{ at: 120, units: [{ key: 'darts', n: 2 }], from: 'point:3', target: 'point:0', text: 'Swarm inbound on your point. Guns up.' }, { at: 240, units: [{ key: 'darts', n: 2 }, { key: 'wedges', n: 1 }], from: 'point:3', target: 'point:0', text: 'Wedges: they will try to get behind the guns.' }],
      stages: [
        { objectives: [{ id: 'hammers', type: 'train', key: 'hammers', n: 2, text: 'Train 2 Hammer Teams' }, { id: 'setup', type: 'setup', text: 'Set up a Hammer Team (stand still until the ▣ icon shows)', hint: 'Hammers cannot fire while moving. Give them a moment.' }] },
        { intro: 'Guns forward, Bolts on their flanks. Break the swarms as they come.', objectives: [{ id: 'broken', type: 'broken', n: 4, text: 'Break 4 enemy squads' }, { id: 'cap', type: 'capture', rank: 0, text: 'Capture the nearest point' }, { id: 'reinf', type: 'reinforce', n: 2, text: 'Reinforce a squad twice' }] },
        { intro: 'Clear the basin.', objectives: [{ id: 'cap1', type: 'capture', rank: 1, text: 'Capture the swarm point' }, { id: 'cap3', type: 'capture', rank: 3, text: 'Capture the far point' }] },
      ],
      hints: [{ at: 'start', text: 'Hammer Teams have a narrow firing arc and a long range. Face them down the road.' }],
    },
    {
      key: 'red-3', title: 'Breach', theme: 'urban', size: 64, seed: 'doctrine-3',
      story: ['The Swarm has fortified the Ruined City: Claim Spikes on the points, Thorns in the windows, and every alley walled off. Walls do not care about rifles.', 'The Iron Works opens. Breachers come out with hammers the size of doors. A wall is only a wall until a Breacher arrives.'],
      briefing: 'Demolition: build the Iron Works, raise Breachers, knock down walls, destroy the Claim Spike, retake the point.',
      epilogue: ['The Spike shatters; the point is Foundry ground again. The Swarm pulls back through gaps that did not exist an hour ago.', 'Reports from the Ashfall: the Aegis Collective has landed, and its Bastions are shielded. Rifles will not do. Bring the tanks.'],
      player: { faction: 'red', ore: 520, flux: 130, units: ['bolts', 'hammers', 'breachers'], buildings: ['drill', 'works', 'bunker', 'post'], squads: [{ key: 'bolts', at: [3, 4] }, { key: 'hammers', at: [5, 2] }] },
      enemy: { faction: 'blue', hq: false, ai: null, structures: [{ key: 'claim', at: 'point:2' }, { key: 'thorn', at: 'point:2' }, { key: 'claim', at: 'point:4' }], squads: [{ key: 'darts', at: 'point:2' }, { key: 'needles', at: 'point:2' }, { key: 'darts', at: 'point:4', n: 2 }], points: [2, 4] },
      stages: [
        { objectives: [{ id: 'works', type: 'build', key: 'works', n: 1, text: 'Build the Iron Works' }, { id: 'breach', type: 'train', key: 'breachers', n: 2, text: 'Train 2 Breacher squads' }] },
        { intro: 'Breachers smash cover around whatever they hit. Use them to open the walls, then storm through.', objectives: [{ id: 'walls', type: 'terrain', n: 4, text: 'Destroy 4 wall or rock tiles' }, { id: 'spike', type: 'destroy', key: 'claim', n: 1, text: 'Destroy a Claim Spike' }, { id: 'cap', type: 'capture', rank: 2, text: 'Capture the point behind it' }] },
        { intro: 'Fortify what you take.', objectives: [{ id: 'post', type: 'build', key: 'post', n: 1, text: 'Build a Watch Post on a captured point' }, { id: 'cap4', type: 'capture', n: 3, text: 'Hold 3 strategic points' }] },
      ],
      hints: [{ at: 'start', text: 'Breachers are melee. Keep Hammers behind them to pin defenders while they work.' }],
    },
    {
      key: 'red-4', title: 'Steel Rain', theme: 'ashfall', size: 64, seed: 'doctrine-4',
      story: ['The Ashfall drill fields, and among the lava channels, green spheres behind shields that shrug off rifle fire. The Aegis Bastions outrange everything the Foundry has fielded so far.', 'Everything except the Crusher Tank and the Mortar Block. Blast damage does not care what a shield is made of, and a shell from outside a Bastion\'s range is a shell it cannot answer.'],
      briefing: 'Armour and artillery: field Crusher Tanks and Mortar Blocks, crater the Collective\'s emplacements, and take the drill fields.',
      epilogue: ['The Bastions fall one shell at a time, their shields flickering out over craters that used to be lava banks.', 'The Collective withdraws to Frostbite and begins to dig. The Foreman decides to go and dig them out personally.'],
      player: { faction: 'red', ore: 600, flux: 180, units: ['bolts', 'hammers', 'breachers', 'crusher', 'mortar'], buildings: ['drill', 'works', 'bunker', 'post', 'armory'], structures: [{ key: 'works', at: [-4, 3] }], squads: [{ key: 'bolts', at: [3, 4] }] },
      enemy: { faction: 'green', hq: false, ai: null, structures: [{ key: 'bastion', at: 'point:2' }, { key: 'bastion', at: 'point:3' }, { key: 'siphon', at: 'ore:4' }, { key: 'siphon', at: 'ore:5' }, { key: 'beacon', at: 'point:3' }], squads: [{ key: 'wardens', at: 'point:2' }, { key: 'wardens', at: 'point:3' }, { key: 'lenses', at: 'point:3' }], points: [2, 3] },
      stages: [
        { objectives: [{ id: 'tank', type: 'train', key: 'crusher', n: 1, text: 'Build a Crusher Tank' }, { id: 'mortar', type: 'train', key: 'mortar', n: 1, text: 'Build a Mortar Block' }] },
        { intro: 'Mortars outrange Bastions. Set them up outside its reach and let the shells fall.', objectives: [{ id: 'bastions', type: 'destroy', key: 'bastion', n: 2, text: 'Destroy both Bastions' }, { id: 'kill', type: 'kill', n: 3, text: 'Destroy 3 Collective squads' }] },
        { intro: 'Take the drill fields.', objectives: [{ id: 'siphon', type: 'destroy', key: 'siphon', n: 2, text: 'Destroy the Siphons' }, { id: 'cap', type: 'capture', n: 4, text: 'Hold 4 points' }] },
      ],
      hints: [{ at: 'start', text: 'Mortars have a minimum range and must set up. Guard them: anything that reaches them kills them.' }, { at: 'stage:1', text: 'Shields recharge when a target is left alone. Focus fire and finish what you start.' }],
    },
    {
      key: 'red-5', title: 'The Foreman', theme: 'frost', size: 64, seed: 'doctrine-5',
      story: ['Frostbite, and the Collective has had time: Beacons on the points, shielded squads on the ice, a Core beneath the drifts.', 'The Foreman takes the field. Where he walks, iron mends: nearby squads take less damage, and tanks and bunkers repair themselves under fire. Hold the points, and let the Collective break on the Foreman\'s line.'],
      briefing: 'Hero and defence: train the Foreman, attach him, build Bunkers, and hold four points against a living Collective.',
      epilogue: ['The Collective\'s counter-attacks stall on repaired bunkers and reforming squads, then stop.', 'One base left: the Core itself, in the Crystal Dunes, sitting on the Prime Vein. The Foundry marches.'],
      player: { faction: 'red', ore: 650, flux: 200, structures: [{ key: 'works', at: [-4, 3] }], squads: [{ key: 'bolts', at: [3, 4] }, { key: 'hammers', at: [5, 2] }] },
      enemy: { faction: 'green', ai: 'normal', incomeMult: 0.95, structures: [{ key: 'beacon', at: 'point:4' }, { key: 'beacon', at: 'point:5' }, { key: 'bastion', at: [-3, 3] }, { key: 'array', at: [4, -2] }], squads: [{ key: 'wardens', at: [0, 5] }, { key: 'lenses', at: [-3, 2] }], points: [4, 5, 6] },
      stages: [
        { objectives: [{ id: 'hero', type: 'hero', text: 'Train the Foreman' }, { id: 'attach', type: 'attach', text: 'Attach the Foreman to a squad' }, { id: 'bunker', type: 'build', key: 'bunker', n: 2, text: 'Build 2 Bunkers' }] },
        { intro: 'Now hold. Four points, two minutes, whatever they send.', objectives: [{ id: 'hold', type: 'hold', n: 4, seconds: 120, text: 'Hold 4 points for 2 minutes' }, { id: 'kill', type: 'kill', n: 6, text: 'Destroy 6 Collective squads' }] },
      ],
      hints: [{ at: 'start', text: 'The Foreman\'s repair aura heals vehicles and structures. Park him next to the Bunkers.' }],
    },
    {
      key: 'red-6', title: 'Verdict', theme: 'crystal', size: 80, seed: 'doctrine-6',
      story: ['Crystal Dunes. The Aegis Core sits on the Prime Vein inside layers of Bastions, Halos and a shield that could stop the sky.', 'The Foundry brings everything: Bolts, Hammers, Breachers, Crushers, Mortars, the Armoury\'s plating and the Foreman himself. There is no trick left. There is only doctrine.'],
      briefing: 'Full war against a living Collective: out-produce, out-hold, and destroy the Core.',
      epilogue: ['The shield fails. The Core cracks like an egg. The Prime Vein lies in the open and the Foundry begins, immediately, to build.', 'In the west, the Hive stirs. It has never seen a wall it could not go around. Campaign complete.'],
      player: { faction: 'red', ore: 600, flux: 200 },
      enemy: { faction: 'green', ai: 'normal', incomeMult: 1.1, structures: [{ key: 'bastion', at: [-4, 4] }, { key: 'bastion', at: [4, -4] }, { key: 'array', at: [5, 3] }, { key: 'siphon', at: 'ore:6' }, { key: 'siphon', at: 'ore:7' }], squads: [{ key: 'wardens', at: [0, 5], n: 2 }, { key: 'lenses', at: [-3, 2] }], points: [4, 5, 6] },
      stages: [
        { objectives: [{ id: 'econ', type: 'capture', n: 3, text: 'Hold 3 strategic points' }, { id: 'armory', type: 'build', key: 'armory', n: 1, text: 'Build the Armoury' }] },
        { intro: 'Mortars to strip the Bastions, Crushers to crack the shell, Breachers for what is left.', objectives: [{ id: 'hq', type: 'destroyHq', text: 'Destroy the Core' }, { id: 'loss', type: 'loseMax', n: 8, text: 'Lose no more than 8 squads', optional: true }] },
      ],
      hints: [{ at: 'start', text: 'Energy weapons shred vehicles. Screen your tanks with Bolts and keep the Foreman near the armour.' }],
    },
  ],
};

const GREEN = {
  faction: 'green', title: 'Protocol', tagline: 'Endure. Observe. Answer.',
  intro: 'The Collective wakes last, as it always does, having computed the others\' first moves before making its own. Its spheres are few and each is precious, wrapped in shields that heal if given a breath. The Oracle has read the fracture. The answer is already decided; the Collective only has to survive long enough to give it.',
  chapters: [
    {
      key: 'green-1', title: 'Awakening', theme: 'crystal', size: 48, seed: 'protocol-1',
      story: ['The Core opens on the Crystal Dunes. Foundry sentinels stand on the near points, left behind by a war that moved on without them.', 'You have three Wardens. Each is worth ten of anything else on this sand, if you never let one die.'],
      briefing: 'Learn the basics: train Warden Cells, mine ore, capture a point, and pull back to let shields recharge.',
      epilogue: ['Not one Warden lost. The Foundry sentinels are glass on the sand.', 'The Oracle reads new shapes in the fracture: Crusher Tanks moving across Frostbite towards the Core.'],
      player: { faction: 'green', ore: 320, flux: 70, units: ['wardens'], buildings: ['siphon'] },
      enemy: { faction: 'red', hq: false, ai: null, squads: [{ key: 'bolts', at: 'point:2', hp: 0.8 }, { key: 'bolts', at: 'point:1' }], points: [1, 2] },
      stages: [
        { objectives: [{ id: 'train', type: 'train', key: 'wardens', n: 2, text: 'Train 2 Warden Cells', hint: 'Tap the Core, then Warden Cell.' }, { id: 'siphon', type: 'build', key: 'siphon', n: 1, text: 'Build a Siphon on an ore vein' }] },
        { intro: 'Shields absorb damage first and recharge when a squad is left alone. Fight, pull back, recharge, return.', objectives: [{ id: 'cap', type: 'capture', rank: 0, text: 'Capture the nearest point' }, { id: 'regen', type: 'shieldRegen', text: 'Pull a damaged Warden Cell back until its shields refill', hint: 'Move a squad out of the fight (or tap Retreat). Rings around each orb show shield strength.' }] },
        { intro: 'Now answer.', objectives: [{ id: 'kill', type: 'kill', n: 2, text: 'Destroy both Bolt Squads' }, { id: 'cap2', type: 'capture', n: 3, text: 'Hold 3 strategic points' }, { id: 'loss', type: 'loseMax', n: 0, text: 'Lose no squads', optional: true }] },
      ],
      hints: [{ at: 'start', text: 'Wardens outrange Bolts. Fire, step back, fire.' }],
    },
    {
      key: 'green-2', title: 'Long Sight', theme: 'frost', size: 48, seed: 'protocol-2',
      story: ['Frostbite. Crusher Tanks on the ice, escorting drill crews to veins the Collective was saving.', 'The Core answers with the Lens Team: two spheres that focus light into a beam that can cross a frozen lake and open a tank like a tin. They see further than anything alive. They must, because they die to a stiff breeze.'],
      briefing: 'Range and vision: field Lens Teams, kill armour from beyond its reach, and take the veins back.',
      epilogue: ['The tanks burn on the ice with no idea where the beams came from.', 'The Oracle notes a new pattern: the Swarm is coming for the Verdant Basin, in numbers.'],
      player: { faction: 'green', ore: 480, flux: 110, units: ['wardens', 'lenses'], buildings: ['siphon', 'bastion'], squads: [{ key: 'wardens', at: [3, 4] }] },
      enemy: { faction: 'red', hq: false, ai: null, structures: [{ key: 'drill', at: 'ore:3' }, { key: 'drill', at: 'ore:4' }], squads: [{ key: 'crusher', at: 'ore:3' }, { key: 'crusher', at: 'point:3' }, { key: 'bolts', at: 'point:3' }, { key: 'bolts', at: 'point:1' }], points: [1, 3] },
      waves: [{ at: 200, units: [{ key: 'bolts', n: 2 }], from: 'point:3', target: 'point:0', text: 'Foundry infantry moving on your point.' }],
      stages: [
        { objectives: [{ id: 'lenses', type: 'train', key: 'lenses', n: 2, text: 'Train 2 Lens Teams' }, { id: 'cap', type: 'capture', rank: 0, text: 'Capture the nearest point' }] },
        { intro: 'Lenses outrange tanks. Wardens in front to absorb, Lenses behind to kill.', objectives: [{ id: 'tanks', type: 'kill', armor: 'vehicle', n: 2, text: 'Destroy 2 Crusher Tanks' }, { id: 'rigs', type: 'destroy', key: 'drill', n: 2, text: 'Destroy the Drill Rigs' }] },
        { intro: 'Claim what they were stealing.', objectives: [{ id: 'siphon', type: 'build', key: 'siphon', n: 3, text: 'Own 3 Siphons' }, { id: 'cap3', type: 'capture', n: 3, text: 'Hold 3 points' }] },
      ],
      hints: [{ at: 'start', text: 'Lens Teams have 8.5 range and 11 sight. Keep them at the back; they die in melee.' }],
    },
    {
      key: 'green-3', title: 'Resonance', theme: 'verdant', size: 64, seed: 'protocol-3',
      story: ['The Verdant Basin, and the Swarm in full bloom: Dart packs by the dozen, too many to shoot, fast enough to reach the Lenses.', 'The Array hums to life and produces the Pulse Ring: four rings that emit a crushing tone. Swarms that hear it forget why they came.'],
      briefing: 'Morale warfare: build the Array, field Pulse Rings, break swarms as they charge, and survive the bloom.',
      epilogue: ['The last swarm breaks a dozen paces from the Rings and scatters into the brush.', 'The Collective has held. Now it can afford to protect what it holds.'],
      player: { faction: 'green', ore: 520, flux: 150, units: ['wardens', 'lenses', 'pulsers'], buildings: ['siphon', 'array', 'bastion', 'beacon'], squads: [{ key: 'wardens', at: [3, 4] }, { key: 'lenses', at: [5, 2] }] },
      enemy: { faction: 'blue', hq: false, ai: null, squads: [{ key: 'darts', at: 'point:3', n: 2 }, { key: 'needles', at: 'point:3' }], points: [3] },
      waves: [
        { at: 100, units: [{ key: 'darts', n: 2 }], text: 'Swarm bloom, first wave.' },
        { at: 190, units: [{ key: 'darts', n: 3 }], text: 'Second wave. Rings forward.' },
        { at: 280, units: [{ key: 'darts', n: 2 }, { key: 'wedges', n: 2 }], text: 'Wedges: protect the Lenses.' },
        { at: 370, units: [{ key: 'darts', n: 3 }, { key: 'needles', n: 1 }, { key: 'wedges', n: 1 }], text: 'Final bloom.' },
      ],
      stages: [
        { objectives: [{ id: 'array', type: 'build', key: 'array', n: 1, text: 'Build the Array' }, { id: 'pulsers', type: 'train', key: 'pulsers', n: 2, text: 'Train 2 Pulse Rings' }] },
        { intro: 'Pulse Rings deal little damage and a lot of morale. Break the swarms, then let the Wardens finish them.', objectives: [{ id: 'broken', type: 'broken', n: 6, text: 'Break 6 swarm squads' }, { id: 'survive', type: 'survive', seconds: 430, text: 'Survive the bloom (7 minutes)' }, { id: 'cap', type: 'capture', n: 3, text: 'Hold 3 points' }] },
        { intro: 'Take their forward point and fortify it.', objectives: [{ id: 'cap3', type: 'capture', rank: 3, text: 'Capture the swarm point' }, { id: 'beacon', type: 'build', key: 'beacon', n: 1, text: 'Build a Beacon on a captured point' }] },
      ],
      hints: [{ at: 'start', text: 'Pulse Rings are short-ranged. Put them in front, in cover, with Wardens beside them.' }],
    },
    {
      key: 'green-4', title: 'Halo', theme: 'ashfall', size: 64, seed: 'protocol-4',
      story: ['The Ashfall: a Foundry drill field bristling with Bunkers, and Watch Posts on every point.', 'The Collective cannot trade losses with the Foundry; it does not have the numbers. So it fields the Halo, a hovering disc that recharges every shield near it. An army that never runs out of shields never has to stop.'],
      briefing: 'Sustain: field a Halo, keep the army inside its aura, and take the Foundry outposts without losing squads.',
      epilogue: ['The outposts fall and the Collective\'s losses are counted on one hand. The Foundry, for the first time, is the side running out of soldiers.', 'The Oracle rises. It has seen where the Foundry\'s ore comes from.'],
      player: { faction: 'green', ore: 600, flux: 200, units: ['wardens', 'lenses', 'pulsers', 'halo'], buildings: ['siphon', 'array', 'bastion', 'beacon'], structures: [{ key: 'array', at: [-4, 3] }], squads: [{ key: 'wardens', at: [3, 4] }, { key: 'lenses', at: [5, 2] }] },
      enemy: { faction: 'red', hq: false, ai: null, structures: [{ key: 'post', at: 'point:2' }, { key: 'bunker', at: 'point:2' }, { key: 'post', at: 'point:4' }, { key: 'bunker', at: 'point:4' }, { key: 'drill', at: 'ore:4' }], squads: [{ key: 'bolts', at: 'point:2' }, { key: 'hammers', at: 'point:4', order: 'hold' }, { key: 'bolts', at: 'point:4' }], points: [2, 4] },
      stages: [
        { objectives: [{ id: 'halo', type: 'train', key: 'halo', n: 1, text: 'Field a Halo' }, { id: 'pop', type: 'pop', n: 16, text: 'Raise an army of 16 population' }] },
        { intro: 'Keep everything inside the Halo\'s ring. Rotate damaged squads to the back; they will be full again in seconds.', objectives: [{ id: 'posts', type: 'destroy', key: 'post', n: 2, text: 'Destroy both Watch Posts' }, { id: 'bunkers', type: 'destroy', key: 'bunker', n: 2, text: 'Destroy both Bunkers' }, { id: 'loss', type: 'loseMax', n: 1, text: 'Lose at most 1 squad', optional: true }] },
        { objectives: [{ id: 'cap', type: 'capture', n: 5, text: 'Hold 5 points' }] },
      ],
      hints: [{ at: 'start', text: 'The Halo is a vehicle: anti-armour fire hurts it. Keep it behind the Wardens.' }],
    },
    {
      key: 'green-5', title: 'The Oracle', theme: 'urban', size: 64, seed: 'protocol-5',
      story: ['The Ruined City hides the Foundry\'s supply: Drill Rigs tucked into courtyards, invisible from the streets. The Foundry is alive here, and it is watching the roads.', 'The Oracle takes the field. It sees through the fog further than anything in the Lattice, and shields near it recharge even under fire. Find the rigs. Starve the city.'],
      briefing: 'Vision and hero: train the Oracle, attach it, find and destroy the hidden Drill Rigs, and fortify a point with a Beacon.',
      epilogue: ['Three rigs burn in three courtyards. The city\'s bunkers go quiet for want of ore.', 'The Oracle has read the final shape. The Swarm holds the Prime Vein, and the Hive is on it.'],
      player: { faction: 'green', ore: 650, flux: 220, structures: [{ key: 'array', at: [-4, 3] }], squads: [{ key: 'wardens', at: [3, 4] }, { key: 'pulsers', at: [5, 2] }] },
      enemy: { faction: 'red', ai: 'passive', incomeMult: 0.9, structures: [{ key: 'drill', at: 'ore:3' }, { key: 'drill', at: 'ore:5' }, { key: 'drill', at: 'ore:6' }, { key: 'bunker', at: 'point:4' }, { key: 'post', at: 'point:4' }], squads: [{ key: 'bolts', at: 'ore:3' }, { key: 'hammers', at: 'ore:5', order: 'hold' }], points: [4, 5, 6] },
      stages: [
        { objectives: [{ id: 'hero', type: 'hero', text: 'Train the Oracle' }, { id: 'attach', type: 'attach', text: 'Attach the Oracle to a squad' }] },
        { intro: 'The Oracle sees 14 tiles. Walk the courtyards; the rigs will appear on the minimap once seen.', objectives: [{ id: 'rigs', type: 'destroy', key: 'drill', n: 3, text: 'Find and destroy 3 hidden Drill Rigs' }, { id: 'beacon', type: 'build', key: 'beacon', n: 1, text: 'Build a Beacon on a captured point' }] },
        { objectives: [{ id: 'cap', type: 'capture', n: 4, text: 'Hold 4 points' }] },
      ],
      hints: [{ at: 'start', text: 'The Foundry here defends but does not attack. Take your time; scout before you commit.' }],
    },
    {
      key: 'green-6', title: 'Nova', theme: 'crystal', size: 80, seed: 'protocol-6',
      story: ['Crystal Dunes. The Hive squats on the Prime Vein, and the sand is alive with triangles.', 'The Sanctum raises every shield in the Collective. The Array grows the Nova Sphere: orbital artillery that leaves craters and silence. The Oracle has computed the answer. Deliver it.'],
      briefing: 'Full war against a living Swarm: build the Sanctum and a Nova Sphere, hold the sand, and destroy the Hive.',
      epilogue: ['The Hive collapses into itself, a pyramid of dark glass. The Swarm scatters across the dunes, dividing, dwindling.', 'The Collective settles over the Prime Vein and begins, slowly, to think about what shape a world should be. Campaign complete.'],
      player: { faction: 'green', ore: 600, flux: 220 },
      enemy: { faction: 'blue', ai: 'normal', incomeMult: 1.1, structures: [{ key: 'thorn', at: [-4, 4] }, { key: 'thorn', at: [4, -4] }, { key: 'nest', at: [5, 3] }, { key: 'lode', at: 'ore:6' }, { key: 'lode', at: 'ore:7' }], squads: [{ key: 'darts', at: [0, 5], n: 2 }, { key: 'needles', at: [-3, 2] }], points: [4, 5, 6] },
      stages: [
        { objectives: [{ id: 'econ', type: 'capture', n: 3, text: 'Hold 3 strategic points' }, { id: 'sanctum', type: 'build', key: 'sanctum', n: 1, text: 'Build the Sanctum' }, { id: 'nova', type: 'train', key: 'nova', n: 1, text: 'Field a Nova Sphere' }] },
        { intro: 'The Nova outranges everything. Screen it with Pulse Rings against the swarms and walk it to the Hive.', objectives: [{ id: 'hq', type: 'destroyHq', text: 'Destroy the Hive' }, { id: 'loss', type: 'loseMax', n: 6, text: 'Lose no more than 6 squads', optional: true }] },
      ],
      hints: [{ at: 'start', text: 'Swarms come fast and early. Two Pulse Rings and a Bastion will hold the door while you tech.' }],
    },
  ],
};

export const CAMPAIGNS = { blue: BLUE, red: RED, green: GREEN };
export function chapterByKey(key) { for (const c of Object.values(CAMPAIGNS)) { const i = c.chapters.findIndex((ch) => ch.key === key); if (i >= 0) return { campaign: c, chapter: c.chapters[i], index: i }; } return null; }
