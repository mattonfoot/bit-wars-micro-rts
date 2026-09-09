// Handwritten opening lessons (chapters 1-5) for the Iron Foundry.
import { garrison, war, obj, stage, wave } from './common.js';

const F = 'red';
export const RED_LESSONS = {
  faction: F, title: 'Doctrine', tagline: 'Hold. Suppress. Breach. Rebuild.',
  intro: 'The Foundry does not bloom and it does not flow. It holds ground, one riveted block at a time, and it does not give ground back. The Foreman\'s guild has one teaching: everything that lasts was built under fire.',
  chapters: [
    // ---------------- ACT I
    {
      key: 'red-1', title: 'Hold the Line', theme: 'urban', size: 48, seed: 'doctrine-1',
      story: ['A single Foundry, fresh from the forge, on the edge of the Ruined City. The Swarm has already found it: Dart packs are coming down the boulevards in waves.', 'You have walls, rubble, and Bolt Squads. That is all a Foundry has ever needed.'],
      briefing: 'Learn the basics: train Bolt Squads, hold position in cover, survive the swarm waves and claim a point.',
      epilogue: ['The swarm breaks on the walls, three times. The street is carpeted with Swarm shards and not one Bolt Squad has moved.', 'The Foreman sends word: the swarms are being driven from the Verdant Basin. Go there. Bring the heavy guns.'],
      player: { faction: F, ore: 320, flux: 60, units: ['bolts'], buildings: ['drill'], terrain: [{ tile: 'rubble', at: [3, 3], radius: 1 }, { tile: 'brush', at: [5, 1], radius: 1 }, { tile: 'rubble', at: [1, 5] }, { tile: 'wall', at: [6, 4] }, { tile: 'wall', at: [4, 6] }] },
      enemy: garrison('blue', { squads: [{ key: 'darts', at: 'point:2' }], points: [2] }),
      waves: [wave(75, [{ key: 'needles', n: 1 }], { text: 'Needle Squad inbound. Hold in cover.' }), wave(140, [{ key: 'needles', n: 1 }, { key: 'darts', n: 1 }], { text: 'Needles and a swarm. Stay in cover.' }), wave(210, [{ key: 'needles', n: 2 }, { key: 'darts', n: 1 }], { text: 'Last wave. Hold the line.' })],
      stages: [
        stage([obj('train', 'train', 'Train 2 Bolt Squads', { key: 'bolts', n: 2, hint: 'Tap the Foundry, then Bolt Squad.' }), obj('drill', 'build', 'Build a Drill Rig on an ore vein', { key: 'drill', n: 1 })]),
        stage([obj('cover', 'cover', 'Take 8 hits while in cover', { n: 8, hint: 'The blue shield icon over a squad means cover is working. Cover stops shots, not blades: Darts ignore it.' }), obj('survive', 'survive', 'Survive the swarm waves', { seconds: 260 })], 'Needle Squads are coming. Put your squads behind walls, in rubble or in scrub and order Hold. Cover halves the damage from shots; melee swarms ignore it.'),
        stage([obj('cap', 'capture', 'Capture the nearest strategic point', { rank: 0 }), obj('kill', 'kill', 'Destroy the swarm holding the second point', { n: 1 }), obj('cap2', 'capture', 'Capture the second point', { rank: 2 })], 'The street is yours. Take the point.'),
      ],
      hints: [{ at: 'start', text: 'Bolt Squads are heavy infantry: slow, tough, good against light infantry. The rubble and scrub in front of the Foundry is your cover.' }, { at: 'stage:1', text: 'Put each squad in the rubble or scrub, then tap Hold so it does not chase into the open.' }],
    },
    {
      key: 'red-2', title: 'Suppressing Fire', theme: 'verdant', size: 48, seed: 'doctrine-2',
      story: ['The Verdant Basin, thick with brush and swarms. Rifles cannot kill swarms faster than the Hive makes them.', 'But a Hammer Team does not need to kill. Set up, and it pins a whole squad in place, breaks its morale, and leaves it helpless for the Bolts to finish.'],
      briefing: 'Suppression: build Hammer Teams, set them up, and break swarms before they reach you. Reinforce in the field.',
      epilogue: ['The basin is quiet. Broken swarms flee in every direction and do not come back.', 'The Foreman\'s next order is a map of the Ruined City, with the Swarm\'s new Claim Spikes marked on the map.'],
      player: { faction: F, ore: 450, flux: 90, units: ['bolts', 'hammers'], buildings: ['drill', 'bunker'], squads: [{ key: 'bolts', at: [3, 4] }] },
      enemy: garrison('blue', { squads: [{ key: 'darts', at: 'point:1', n: 2 }, { key: 'darts', at: 'point:3', n: 2 }, { key: 'needles', at: 'point:3' }], points: [1, 3] }),
      waves: [wave(120, [{ key: 'darts', n: 2 }], { from: 'point:3', target: 'point:0', text: 'Swarm inbound on your point. Guns up.' }), wave(240, [{ key: 'darts', n: 2 }, { key: 'wedges', n: 1 }], { from: 'point:3', target: 'point:0', text: 'Wedges: they will try to get behind the guns.' })],
      stages: [
        stage([obj('hammers', 'train', 'Train 2 Hammer Teams', { key: 'hammers', n: 2 }), obj('setup', 'setup', 'Set up a Hammer Team (stand still until the ▣ icon shows)', { hint: 'Hammers cannot fire while moving. Give them a moment.' })]),
        stage([obj('broken', 'broken', 'Break 4 enemy squads', { n: 4 }), obj('cap', 'capture', 'Capture the nearest point', { rank: 0 }), obj('reinf', 'reinforce', 'Reinforce a squad twice', { n: 2 })], 'Guns forward, Bolts on their flanks. Break the swarms as they come.'),
        stage([obj('cap1', 'capture', 'Capture the swarm point', { rank: 1 }), obj('cap3', 'capture', 'Capture the far point', { rank: 3 })], 'Clear the basin.'),
      ],
      hints: [{ at: 'start', text: 'Hammer Teams have a narrow firing arc and a long range. Face them down the road.' }],
    },
    {
      key: 'red-3', title: 'Breach', theme: 'urban', size: 64, seed: 'doctrine-3',
      story: ['The Swarm has fortified the Ruined City: Claim Spikes on the points, Thorns in the windows, and every alley walled off. Walls do not care about rifles.', 'The Iron Works opens. Breachers come out with hammers the size of doors. A wall is only a wall until a Breacher arrives.'],
      briefing: 'Demolition: build the Iron Works, raise Breachers, knock down walls, destroy the Claim Spike, retake the point.',
      epilogue: ['The Spike shatters; the point is Foundry ground again. The Swarm pulls back through gaps that did not exist an hour ago.', 'The Foreman orders armour forward. The Swarm has Spires now, and things that fly.'],
      player: { faction: F, ore: 520, flux: 130, units: ['bolts', 'hammers', 'breachers'], buildings: ['drill', 'works', 'bunker', 'post'], squads: [{ key: 'bolts', at: [3, 4] }, { key: 'hammers', at: [5, 2] }] },
      enemy: garrison('blue', { structures: [{ key: 'claim', at: 'point:2' }, { key: 'thorn', at: 'point:2' }, { key: 'claim', at: 'point:4' }], squads: [{ key: 'darts', at: 'point:2' }, { key: 'needles', at: 'point:2' }, { key: 'darts', at: 'point:4', n: 2 }], points: [2, 4] }),
      stages: [
        stage([obj('works', 'build', 'Build the Iron Works', { key: 'works', n: 1 }), obj('breach', 'train', 'Train 2 Breacher squads', { key: 'breachers', n: 2 })]),
        stage([obj('walls', 'terrain', 'Destroy 4 wall or rock cells', { n: 4 }), obj('spike', 'destroy', 'Destroy a Claim Spike', { key: 'claim', n: 1 }), obj('cap', 'capture', 'Capture the point behind it', { rank: 2 })], 'Breachers smash cover around whatever they hit. Use them to open the walls, then storm through.'),
        stage([obj('post', 'build', 'Build a Watch Post on a captured point', { key: 'post', n: 1 }), obj('cap4', 'capture', 'Hold 3 strategic points', { n: 3 })], 'Fortify what you take.'),
      ],
      hints: [{ at: 'start', text: 'Breachers are melee. Keep Hammers behind them to pin defenders while they work.' }],
    },
    {
      key: 'red-4', title: 'Iron Column', theme: 'ashfall', size: 64, seed: 'doctrine-4',
      story: ['The Swarm has grown Kites, and the Ashfall rigs are burning. Nothing on foot can catch a Kite. A Crusher Tank does not have to: it makes the Kites come to it.', 'The Foreman\'s doctrine for armour is simple. The tank goes first. Everything else goes next to the tank.'],
      briefing: 'Armour: field a Crusher Tank, escort it with Bolts, and roll up the Swarm\'s forward Thorns and Kites.',
      epilogue: ['Two Thorns and a Kite wing are scrap on the lava. The column did not stop once.', 'The Foreman himself is coming to the front. He wants to see the ice before the Collective does.'],
      player: { faction: F, ore: 600, flux: 170, units: ['bolts', 'hammers', 'breachers', 'crusher'], buildings: ['drill', 'works', 'bunker', 'post'], structures: [{ key: 'works', at: [-4, 3] }], squads: [{ key: 'bolts', at: [3, 4], n: 2 }] },
      enemy: garrison('blue', { structures: [{ key: 'thorn', at: 'point:2' }, { key: 'thorn', at: 'point:4' }, { key: 'lode', at: 'ore:4' }, { key: 'claim', at: 'point:4' }], squads: [{ key: 'kites', at: 'point:4' }, { key: 'darts', at: 'point:2', n: 2 }, { key: 'needles', at: 'point:4' }], points: [2, 4] }),
      stages: [
        stage([obj('tank', 'train', 'Build a Crusher Tank', { key: 'crusher', n: 1 })]),
        stage([obj('thorns', 'destroy', 'Destroy 2 Thorns', { key: 'thorn', n: 2 }), obj('kites', 'kill', 'Destroy the Kite Wing', { key: 'kites', n: 1 }), obj('cap', 'capture', 'Hold 4 points', { n: 4 })], 'The tank in front, Bolts beside it, Hammers behind. Move as one.'),
      ],
      hints: [{ at: 'start', text: 'Kites are vehicles: Hammer Teams barely scratch them. Let the tank\'s blast and the Bolts do it.' }],
    },
    {
      key: 'red-5', title: 'The Foreman', theme: 'frost', size: 64, seed: 'doctrine-5',
      story: ['Frostbite. The Swarm has Claim Spikes on the passes and is pouring Wedges through them at anything that moves.', 'The Foreman takes the field. Where he walks, iron mends: nearby squads take less damage, and tanks and bunkers repair themselves under fire.'],
      briefing: 'Hero and defence: train the Foreman, attach him, build Bunkers, and hold four points against the Swarm.',
      epilogue: ['The Wedges break on repaired bunkers and reforming squads, then stop coming.', 'The Foreman looks east across the ice, at nothing yet. He does not like the quiet.'],
      player: { faction: F, ore: 650, flux: 200, structures: [{ key: 'works', at: [-4, 3] }], squads: [{ key: 'bolts', at: [3, 4] }, { key: 'hammers', at: [5, 2] }] },
      enemy: war('blue', 'normal', { incomeMult: 0.95, structures: [{ key: 'claim', at: 'point:4' }, { key: 'claim', at: 'point:5' }, { key: 'thorn', at: [-3, 3] }, { key: 'nest', at: [4, -2] }], squads: [{ key: 'darts', at: [0, 5] }, { key: 'wedges', at: [-3, 2] }] }),
      stages: [
        stage([obj('hero', 'hero', 'Train the Foreman'), obj('attach', 'attach', 'Attach the Foreman to a squad'), obj('bunker', 'build', 'Build 2 Bunkers', { key: 'bunker', n: 2 })]),
        stage([obj('hold', 'hold', 'Hold 4 points for 2 minutes', { n: 4, seconds: 120 }), obj('kill', 'kill', 'Destroy 6 Swarm squads', { n: 6 })], 'Now hold. Four points, two minutes, whatever they send.'),
      ],
      hints: [{ at: 'start', text: 'The Foreman\'s repair aura heals vehicles and structures. Park him next to the Bunkers.' }],
    },
  ],
};
