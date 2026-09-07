// The Fracture War: one timeline, three memories. Events 6-40 are shared by all three campaigns; each
// faction plays its own side of the same battle, often in a different scenario style. Chapter numbers
// line up across campaigns, so chapter 12 in Shear, Doctrine and Protocol is the same day.
export const PHASES = [
  { title: 'Act I · Awakening', from: 0 }, { title: 'Act II · The Basin War', from: 5 }, { title: 'Act III · The Glass Front', from: 10 },
  { title: 'Act IV · The Long Winter', from: 15 }, { title: 'Act V · Scavengers', from: 20 }, { title: 'Act VI · Pacts', from: 25 },
  { title: 'Act VII · The Coalition', from: 30 }, { title: 'Act VIII · The Prime Vein', from: 35 },
];
const S = (style, params, story, briefing, epilogue) => ({ style, params, story, briefing, epilogue });

export const EVENTS = [
  // ---------------- ACT II · The Basin War (6-10): the Swarm and the Foundry fight for the Verdant Basin while the Collective watches.
  {
    title: 'Greywater Ford', theme: 'verdant', size: 64, tier: 2,
    sides: {
      blue: S('assault', { rival: 'red', ranks: [2, 3] }, ['The Foundry has dug in on the far bank of the Greywater with a Watch Post at each ford. The Swarm has never crossed water it could not simply cover.', 'The Apex sends everything at the fords at once. Rivers are a Foundry idea.'], 'Assault the Foundry positions at the two fords and hold the far bank.', ['The fords fall in a single tide. Foundry rifles fire at the river long after the Swarm is past.', 'The drill fields beyond the bank are unguarded, and the Hive is hungry.']),
      red: S('chokepoint', { rival: 'blue' }, ['The Greywater is the only line between the Swarm and the Foundry\'s drill fields, and the fords are the only way across it.', 'The Foreman gives the order the Foundry was built for: nothing crosses.'], 'Chokepoint defence: fortify the near ford with Bunkers and gun teams and hold it against the swarm tide.', ['The ford holds. The far bank is carpeted with blue shards.', 'But the Swarm went around, upstream, and the drill fields are burning.']),
      green: S('commando', { rival: 'red', target: 'prod' }, ['While the Swarm and the Foundry bleed each other at the Greywater, the Oracle sends a single cell across the river in the dark.', 'The Foundry\'s Works on the near bank is making the tanks that will one day roll on the Core. It should not finish them.'], 'Commando: infiltrate the Foundry rear with the Oracle and two squads, destroy the Iron Works, and escape.', ['The Works burns behind the Foundry line, and the Foundry blames the Swarm.', 'The Oracle notes how easily the two of them believe the worst of each other.']),
    },
  },
  {
    title: 'The Drill Fields', theme: 'ashfall', size: 64, tier: 2,
    sides: {
      blue: S('resourceRace', { rival: 'red', quota: 2200 }, ['The Ashfall drill fields hold more ore than the whole basin. The Foundry has a Works running and is claiming veins as fast as it can build rigs.', 'The Hive does not intend to fight the Foundry\'s army. It intends to have more ore than the Foundry ever will.'], 'Resource race: own four veins, hold the points and stockpile ore before the Foundry does.', ['The Hive is fat with ore and dividing faster than ever.', 'The Foundry, starved, starts hunting the Burrows that feed it.']),
      red: S('resourceRace', { rival: 'blue', quota: 2200 }, ['The Ashfall drill fields are the Foundry\'s future: enough ore to plate an army. The Swarm has found them too.', 'The Foreman\'s answer is rigs, and more rigs, and Bunkers between them.'], 'Resource race: own four veins, hold the points and stockpile ore before the Swarm does.', ['The stockpile is full and the Works has never run so hot.', 'The Swarm has planted Burrows on the far veins. They will have to go.']),
      green: S('raid', { rival: 'red', n: 3 }, ['Both armies are busy with the drill fields. Neither is watching the rigs on its own flanks.', 'The Oracle prefers economies that fail quietly.'], 'Deep raid: burn three Foundry Drill Rigs on the edge of the fields and lose no more than two squads.', ['Three rigs go dark and the Foundry never learns whose beams did it.', 'The Swarm and the Foundry are about to fight over the Salt Road. The Collective will be there first.']),
    },
  },
  {
    title: 'Burrow Hunt', theme: 'crystal', size: 64, tier: 3,
    sides: {
      blue: S('protectStructure', { rival: 'red' }, ['Foundry raiding columns are hunting the Swarm\'s Burrows and the Nest that feeds the raids. The Nest is half-grown and cannot move.', 'The Apex has to keep it alive for six minutes. Six minutes is a long time in the Swarm.'], 'Protect the Nest at your forward point from Foundry raids, then destroy the raiders\' outposts.', ['The Nest survives, scarred, and the raiders limp home.', 'The Salt Road is the only route between the two heartlands. Whoever holds its outposts holds the war.']),
      red: S('raid', { rival: 'blue', n: 4 }, ['Lode Burrows on every vein in the dunes, each feeding the Hive. The Swarm does not defend them; it simply grows more.', 'The Foreman wants them gone anyway. A Hive that cannot eat cannot divide.'], 'Deep raid: destroy four Lode Burrows without losing more than two squads.', ['The Hive\'s hum falters. When it recovers it is louder, and it is coming down the Salt Road.', 'The Foundry will meet it there.']),
      green: S('protectStructure', { rival: 'blue' }, ['The Swarm has noticed the Collective\'s Siphons in the dunes and sent Kites. A half-built Sanctum stands at the forward point with no shield yet.', 'The Oracle cannot let it fall. Everything the Collective will become is inside it.'], 'Protect the unfinished Sanctum from Swarm raids, then destroy the raiders\' Claim Spikes.', ['The Sanctum finishes its shield with Kites burning around it.', 'The Salt Road war begins tomorrow. The Collective will hold its outposts before either side arrives.']),
    },
  },
  {
    title: 'The Salt Road', theme: 'frost', size: 64, tier: 3,
    sides: {
      blue: S('tugOfWar', { rival: 'red' }, ['The Salt Road runs the length of Frostbite, outpost to outpost, from the Hive\'s forward camp to the Foundry\'s Works. Every outpost the Swarm takes, the Hive sends more swarms up the road.', 'The Apex does not hold ground. It flows.'], 'Tug-of-war: push down the Salt Road outpost by outpost; each one taken brings reinforcements.', ['The Works at the end of the road burns. The Foundry retreats into its quarry.', 'A quarry is a hole with walls. The Swarm has never liked those.']),
      red: S('tugOfWar', { rival: 'blue' }, ['The Salt Road runs outpost to outpost across the ice, from the Foundry camp to the Swarm\'s Nest. Every outpost the Foundry takes brings iron up the road behind it.', 'Doctrine says advance in steps. The Foreman has never been in a hurry.'], 'Tug-of-war: push down the Salt Road outpost by outpost; each one taken brings reinforcements.', ['The Nest at the end of the road burns green. The Swarm falls back to the crystal quarry.', 'The Foundry follows, slowly, with the guns.']),
      green: S('holdTheLine', { rival: 'blue', minutes: 7, points: 3, waves: 5 }, ['The Salt Road passes the Collective\'s forward Beacons. The Swarm, pushing the Foundry, has decided the Beacons are in the way.', 'The Oracle does not move Beacons. It moves everything else around them.'], 'Hold the line: keep three points on the Salt Road against swarm waves for seven minutes.', ['The waves stop. The road belongs to whoever is left, and the Collective is left.', 'The Foundry has cornered the Swarm in the quarry. The Oracle is curious what a cornered swarm does.']),
    },
  },
  {
    title: 'The Quarry', theme: 'crystal', size: 64, tier: 3,
    sides: {
      blue: S('countdown', { rival: 'red', minutes: 9, waves: 6 }, ['The Swarm is cornered in the crystal quarry with the Foundry\'s whole army at the rim. The Hive is growing an Obelisk. It needs nine minutes.', 'Nine minutes of Foundry doctrine coming down the ramps.'], 'Survive the countdown: hold the quarry for nine minutes until the Obelisk and its escort arrive, then break out.', ['The Obelisk walks out of the Hive on the ninth minute and the rim goes quiet, ramp by ramp.', 'The Basin War is over. The Foundry turns east, toward the glass lakes and the spheres that watched all of it.']),
      red: S('siege', { rival: 'blue' }, ['The Swarm has turned a crystal quarry into a fortress: Thorns on every ridge, Claim Spikes on every point, canyon walls between.', 'The Works sends up Crusher Tanks and Mortar Blocks. Walls are a temporary condition.'], 'Siege: field armour and artillery and dismantle the quarry\'s defences without charging the guns.', ['The quarry is craters and glass. The Swarm scatters into the canyons.', 'The Basin War is over. To the east, the Collective has woken fully, and it has been building Bastions on the ice.']),
      green: S('escort', { rival: 'red' }, ['While the Foundry sieges the quarry, the Oracle sends a Nova Sphere across the dunes to the Collective\'s new forward base. The road passes the Foundry\'s flank.', 'A Nova is slow. The Foundry\'s scouts are not.'], 'Escort duty: bring the Nova Sphere across the dunes through ambushes to the far Collective outpost.', ['The Nova rolls into the outpost with Foundry shells still landing behind it.', 'The Basin War is over. The Foundry is turning east, toward the glass lakes. Toward the Core.']),
    },
  },
  // ---------------- ACT III · The Glass Front (11-15): the Foundry and the Collective meet on the ice; the Swarm raids both.
  {
    title: 'The Glass Lake', theme: 'frost', size: 64, tier: 3,
    sides: {
      blue: S('raid', { rival: 'green', n: 3 }, ['The Foundry and the Collective have met on the frozen lake and neither is winning. The Collective\'s Siphons on the shore feed the whole front.', 'The Apex likes fronts that are fed from one place.'], 'Deep raid: burn three Collective Siphons on the lakeshore and lose no more than two squads.', ['The Siphons burn and the Collective line starts to starve.', 'The Swarm has met shields now. It will need a different kind of blade.']),
      red: S('assault', { rival: 'green', ranks: [2, 3] }, ['Collective Wardens on the ice behind shields that shrug off rifle fire. The Bolts empty their magazines and the spheres do not notice.', 'Shields do not care about rifles. They care about blast.'], 'Assault: burn through Collective shields with blast and focus fire and take the lakeshore points.', ['Four Wardens are glass on the lake. The Collective withdraws to compute.', 'It comes back with Beacons on every hill, and beams that reach further than the Bunkers.']),
      green: S('protectVip', { rival: 'red', ranks: [1, 2] }, ['The Foundry has crossed the ice with tanks, and it is hunting the Oracle specifically. Every Foundry squad has orders to shoot the bright one.', 'The Oracle finds this reasonable. It would hunt itself too.'], 'Protect the VIP: keep the Oracle alive while capturing the lakeshore points and destroying the hunting parties.', ['The hunters die on the ice, and the Oracle walks off it unscratched.', 'It has seen the Foundry\'s next move already: Beacon Hill.']),
    },
  },
  {
    title: 'Beacon Hill', theme: 'urban', size: 64, tier: 4,
    sides: {
      blue: S('assault', { rival: 'green', ranks: [2, 4, 5] }, ['The Collective has seeded the Ruined City with Beacons. From each it sees ten blocks, and where it sees, its Bastions fire.', 'The Swarm has never cared about being seen. Now it learns what the fog is for.'], 'Assault the Beacons and Bastions in the city and take the points they guarded.', ['The city goes blind, block by block. The Collective\'s beams fall silent for want of targets.', 'Then the sky lights up. Halos, and behind them, something larger.']),
      red: S('siege', { rival: 'green' }, ['Beacons on every point, Bastions beside them. The Collective can see the whole city, and its beams reach anything it sees.', 'The Foreman\'s answer is the oldest: shells that fall from beyond sight.'], 'Siege: field armour and Mortars and destroy the Beacons and Bastions from cover.', ['The city goes blind, block by block. The Collective pulls back behind its Halos.', 'The Foundry will have to kill the rings before it can kill anything else.']),
      green: S('chokepoint', { rival: 'red' }, ['Beacon Hill is the one high place in the Ruined City, and the Foundry wants it. The only road up is a single boulevard.', 'One boulevard, two Bastions, and the Oracle watching the whole approach.'], 'Chokepoint defence: hold the boulevard up Beacon Hill with Bastions and Lenses.', ['The boulevard is iron scrap from end to end. The hill holds.', 'The Halo column is ready to move. It will need an escort.']),
    },
  },
  {
    title: 'Halo Column', theme: 'crystal', size: 64, tier: 4,
    sides: {
      blue: S('interdiction', { rival: 'green' }, ['A Collective column crosses the dunes under hovering rings, fed by convoys from the far veins. Nothing the Swarm throws at the column sticks.', 'Kill the convoys, the Apex decides, and the column is just spheres.'], 'Supply interdiction: ambush the Collective convoys and burn the Siphons, then break the column\'s base.', ['The convoys stop coming and the rings go dim one by one.', 'The Collective answers with the sky. Nova Rain is beginning.']),
      red: S('escort', { rival: 'green' }, ['The Foundry\'s answer to Halos is a Crusher column of its own, crossing the dunes to hit the Collective forward base. The dunes are full of Lenses.', 'The tank is slow. The Foreman likes slow.'], 'Escort duty: bring the Crusher Tank across the dunes through Lens ambushes to the far point.', ['The tank arrives with beam scars from nose to tail and the forward base falls to it.', 'The Collective answers with the sky. Nova Rain is beginning.']),
      green: S('escort', { rival: 'red' }, ['The Halo column must cross the dunes to relieve the forward base, and the Foundry has Hammer Teams on every ridge between.', 'The Halo is the only thing keeping the column alive. It must arrive.'], 'Escort duty: bring the Halo across the dunes through Foundry ambushes to the far point.', ['The Halo arrives and the forward base\'s shields come back all at once.', 'The Novas are ready. The Oracle lets them roll.']),
    },
  },
  {
    title: 'Nova Rain', theme: 'ashfall', size: 64, tier: 4,
    sides: {
      blue: S('holdTheLine', { rival: 'green', minutes: 7, points: 3, waves: 5 }, ['Nova Spheres roll across the lava plain, each one a small star that leaves craters where swarms used to be.', 'They are slow, and the ground between shells is a place the Swarm knows how to cross.'], 'Hold the line: keep three points under Nova bombardment for seven minutes.', ['The last Sphere goes dark with Wedges on its shell. The plain is craters from edge to edge.', 'Something is wrong with the ground under the craters. It glows.']),
      red: S('countdown', { rival: 'green', minutes: 9, waves: 6 }, ['The Collective\'s Novas have the Foundry\'s forward base under the longest guns in the Lattice. Relief is coming from the Works, nine minutes away.', 'Nine minutes under stars.'], 'Survive the countdown: hold the forward base under Nova bombardment until relief arrives, then counter-attack.', ['The relief column arrives with Mortars and the Novas learn what it is to be outranged.', 'Under the craters, the ground has begun to glow.']),
      green: S('multiFront', { rival: 'red' }, ['The Novas fire from two bases at once, and the Foundry answers both. The Collective has to hold both or lose both.', 'The Oracle can watch two things at once. It has never had to fight two things at once.'], 'Multi-front: hold your two bases against Foundry pushes, then destroy the Foundry forward base.', ['Both bases hold. The Foundry falls back from the plain.', 'Under the craters the Novas left, something is glowing. The Oracle does not have a word for it yet.']),
    },
  },
  {
    title: 'The Sanctum', theme: 'frost', size: 64, tier: 4,
    sides: {
      blue: S('commando', { rival: 'green', target: 'up' }, ['The Collective\'s Sanctum harmonises every shield on the Glass Front. While it stands, the Foundry and the Swarm both lose.', 'The Apex goes in itself, with two squads, in the dark.'], 'Commando: infiltrate the Collective rear with the Apex, destroy the Sanctum, and escape.', ['The Sanctum falls silent and every shield on the front flickers.', 'The glow under the craters has spread to the lake. The ice is melting from below.']),
      red: S('assault', { rival: 'green', ranks: [3, 4] }, ['The Sanctum harmonises every Collective shield on the front, and an Array beside it is growing Nova Spheres.', 'The Foreman intends to be standing on the Array before it finishes.'], 'Assault: destroy the Sanctum\'s garrison and take the points around it.', ['The Sanctum falls silent. The Array cracks open on an unfinished star.', 'The ice around it is melting from below, and the water underneath is the wrong colour.']),
      green: S('protectStructure', { rival: 'red' }, ['The Sanctum is the Collective\'s heart on the front. The Foundry is coming for it with everything, and the Swarm is coming for it from behind.', 'The Oracle stands beside it and does not move.'], 'Protect the Sanctum from Foundry raids for six minutes, then destroy the raiders\' Watch Posts.', ['The Sanctum stands, scorched. The Foundry falls back across the ice.', 'The ice is melting from below. The Bleed has reached the glass lakes.']),
    },
  },
  // ---------------- ACT IV · The Long Winter (16-20): the Bleed rises from the Prime Vein and every faction must move.
  {
    title: 'The Bleed', theme: 'crystal', size: 64, tier: 4,
    sides: {
      blue: S('migrate', { rival: 'red', doomAt: 300 }, ['The glow under the craters has a name now: the Bleed, raw Prime Vein rising through the fracture and eating everything it touches. It is rising under the Hive.', 'The Swarm has never moved a Hive. It is about to learn.'], 'Migrating base: your base will be consumed in five minutes. Rebuild in the middle of the map and survive.', ['The old Hive is crystal and silence. The new one hums in the middle of the dunes.', 'Every faction is moving now. The middle of the world is about to get crowded.']),
      red: S('migrate', { rival: 'green', doomAt: 300 }, ['The Bleed rises under the Foundry: raw Prime Vein through the fracture, eating iron as easily as glass. The Foreman has five minutes.', 'Everything that lasts was built under fire. Nothing was ever built under this.'], 'Migrating base: your base will be consumed in five minutes. Rebuild in the middle of the map and survive.', ['The old Foundry is crystal and silence. The new one is a Works and two Bunkers on a point in the middle of nowhere.', 'The Collective is moving too. The middle of the world is about to get crowded.']),
      green: S('migrate', { rival: 'blue', doomAt: 300 }, ['The Bleed rises under the Core. The Oracle computed this a week ago and did not tell anyone, because there was nothing to be done except leave.', 'Now it is time to leave.'], 'Migrating base: your base will be consumed in five minutes. Rebuild in the middle of the map and survive.', ['The old Core is crystal and silence. The new one is an Array on a point with Wardens around it.', 'The Swarm is moving too. The middle of the world is about to get crowded.']),
    },
  },
  {
    title: 'The Walled City', theme: 'urban', size: 64, tier: 4,
    sides: {
      blue: S('siege', { rival: 'red' }, ['The Foundry has fled the Bleed into the Ruined City and walled every street. Behind the walls: Bunkers, Watch Posts, and the Foreman rebuilding.', 'The Obelisk does not mind walls.'], 'Siege: field an Obelisk and dismantle the walled city\'s defences.', ['The walls are rubble and the Foundry retreats deeper into the ruins.', 'The Ashfall behind the city is the Swarm\'s only way west. The Foundry knows it too.']),
      red: S('chokepoint', { rival: 'blue' }, ['The Ruined City is the Foundry\'s refuge from the Bleed, and it has one gate the Swarm can reach. The Foreman puts everything at the gate.', 'A wall is only a wall until a Breacher arrives. The Swarm does not have Breachers.'], 'Chokepoint defence: hold the city gate with Bunkers and gun teams against the swarm tide.', ['The gate holds. The Swarm goes looking for another way in, and there is none.', 'The Collective has taken the Ashfall behind the city. The Foundry is boxed in.']),
      green: S('tugOfWar', { rival: 'red' }, ['The Foundry has walled the Ruined City street by street. The Collective takes it the same way: street by street.', 'Each block taken is a Beacon planted, and a Beacon is a place the Oracle can see from.'], 'Tug-of-war: push through the walled city block by block; each block taken brings reinforcements.', ['The last block falls and the Foundry retreats into the Ashfall.', 'The Ashfall is where the Bleed began. There is nothing there but craters, and the Foundry.']),
    },
  },
  {
    title: 'Countdown at Ashfall', theme: 'ashfall', size: 64, tier: 5,
    sides: {
      blue: S('countdown', { rival: 'green', minutes: 12, waves: 8 }, ['The Swarm holds the Ashfall crossing alone. The Collective, fleeing the Bleed, has decided the crossing is its way out, and it is coming with everything.', 'Twelve minutes until the Hive\'s new swarms reach the crossing.'], 'Survive the countdown: hold the Ashfall crossing for twelve minutes until relief arrives, then counter-attack.', ['The relief swarms arrive on the twelfth minute and the crossing is a field of dark spheres.', 'The Foundry, boxed in behind the city, has started digging out. Toward the Swarm.']),
      red: S('holdTheLine', { rival: 'green', minutes: 10, points: 3, waves: 7 }, ['The Foundry has broken out of the city into the Ashfall and holds three points on the craters. The Collective wants the crossing behind them.', 'Ten minutes, three points, seven waves. Doctrine.'], 'Hold the line: keep three points on the Ashfall for ten minutes against Collective waves.', ['The craters are full of glass and the Foundry has not moved.', 'The Swarm holds the far crossing. The Foundry will need a second front to reach it.']),
      green: S('countdown', { rival: 'blue', minutes: 12, waves: 8 }, ['The Collective holds the Ashfall crossing with a half-built base and the Swarm on three sides. Relief is twelve minutes away.', 'The Oracle has computed exactly how many shields twelve minutes cost.'], 'Survive the countdown: hold the Ashfall crossing for twelve minutes until relief arrives, then counter-attack.', ['Relief arrives with a Nova and the swarms scatter across the craters.', 'The Foundry is digging out of the city. The Oracle would like to be on two sides of it when it does.']),
    },
  },
  {
    title: 'Two Fronts', theme: 'frost', size: 64, tier: 5,
    sides: {
      blue: S('multiFront', { rival: 'red' }, ['The Foundry has dug out of the city on two roads at once, and the Swarm has bases on both. Neither base can help the other.', 'The Apex divides. It always could.'], 'Multi-front: hold both bases against Foundry pushes, then destroy the Foundry\'s forward base.', ['Both bases hold and the Foundry\'s forward base is rubble.', 'The Long Winter is ending. The Foundry has one push left in it, and it is coming now.']),
      red: S('multiFront', { rival: 'green' }, ['The Foundry has two bases on the ice, far apart, and the Collective is pushing both. Two Works, two armies, one Foreman.', 'He cannot be in two places. The doctrine can.'], 'Multi-front: hold both bases against Collective pushes, then destroy the Collective forward base.', ['Both bases hold. The Collective forward base is a crater.', 'The Long Winter is ending. The Foundry has one push left in it, and the Foreman intends to make it count.']),
      green: S('multiFront', { rival: 'blue' }, ['Two Collective bases on the ice, and the Swarm hitting both because it can. The Oracle can see both. It cannot be at both.', 'Halos can.'], 'Multi-front: hold both bases against swarm pushes, then destroy the Swarm\'s forward base.', ['Both bases hold and the Swarm\'s Nest on the ice burns.', 'The Long Winter is ending. The Foundry is massing for a push, and the Oracle has read where.']),
    },
  },
  {
    title: 'The Winter Push', theme: 'urban', size: 80, tier: 5,
    sides: {
      blue: S('war', { rival: 'red' }, ['The Foundry comes out of the ruins with everything it rebuilt in the winter: Bolts, Hammers, Breachers, Crushers, Mortars, and the Foreman.', 'The Hive meets it with everything it grew.'], 'Full war against a living Foundry: destroy the Foundry in the ruins.', ['The Foundry cracks like a furnace door and the ruins go dark. The Foreman is not among the dead; he never is.', 'The Long Winter is over. What is left of three peoples is scattered across a world that is half crystal. The scavenging begins.']),
      red: S('war', { rival: 'green' }, ['The Foreman\'s winter push: everything the Foundry rebuilt, thrown at the Collective\'s Core in the ruins before the Bleed reaches it too.', 'There is no trick left. There is only doctrine.'], 'Full war against a living Collective: destroy the Core in the ruins.', ['The shield fails. The Core cracks like an egg.', 'The Long Winter is over. What is left of three peoples is scattered across a world that is half crystal. The scavenging begins.']),
      green: S('war', { rival: 'blue' }, ['The Swarm has bloomed in the ruins through the winter and the Hive squats on the last dry ground. The Oracle has computed the answer.', 'Deliver it.'], 'Full war against a living Swarm: destroy the Hive in the ruins.', ['The Hive collapses into itself, a pyramid of dark glass.', 'The Long Winter is over. What is left of three peoples is scattered across a world that is half crystal. The scavenging begins.']),
    },
  },
  // ---------------- ACT V · Scavengers (21-25): after the Bleed, armies are scattered and every base is someone else's ruin.
  {
    title: 'Ashes', theme: 'ashfall', size: 64, tier: 5,
    sides: {
      blue: S('commando', { rival: 'green', target: 'prod' }, ['The Bleed has eaten the Hive again, and the Apex walks out of the crystal with two squads and no home. The Collective has an Array in the ash, making Halos.', 'No home, no reinforcements. The Apex has never needed either.'], 'Commando: with no base, infiltrate the Collective facility in the ash with the Apex, destroy the Array, and escape.', ['The Array burns in the ash and the Apex walks out of the smoke with both squads.', 'Somewhere in the craters, stranded swarms are still alive. The Apex can feel them.']),
      red: S('commando', { rival: 'blue', target: 'prod' }, ['The Foundry is ash and the Foreman is walking out of it with a Breacher squad and a gun team. The Swarm has a Nest in the craters.', 'A Nest is a door. The Foreman has a hammer.'], 'Commando: with no base, infiltrate the Swarm\'s Nest in the ash with the Foreman, destroy it, and escape.', ['The Nest burns and the Foreman walks out of the ash with both squads.', 'Somewhere in the craters, stranded Foundry squads are waiting for orders. He has some.']),
      green: S('commando', { rival: 'red', target: 'prod' }, ['The Core is crystal and the Oracle walks out of it with a Warden Cell and a Lens Team. The Foundry has a Works in the ash, making tanks.', 'The Oracle has computed that it should not.'], 'Commando: with no base, infiltrate the Foundry facility in the ash with the Oracle, destroy the Works, and escape.', ['The Works burns and the Oracle walks out of the ash with both squads.', 'Somewhere in the craters, stranded Collective cells are waiting. The Oracle knows exactly where.']),
    },
  },
  {
    title: 'Scavenge', theme: 'crystal', size: 64, tier: 5,
    sides: {
      blue: S('scavenge', { rival: 'red' }, ['The dunes are littered with the war: stranded swarms folded flat against the crystal, a half-buried Nest, a Burrow nobody claimed. The Foundry is picking through the same wreckage.', 'The Apex was made for this. Bloom from what is left.'], 'Scavenge and build: rescue stranded squads, capture abandoned structures, and rebuild a base from nothing.', ['A Nest, a Burrow, three rescued swarms, and a Hive that is not quite a Hive yet. It is enough.', 'The Foundry has a convoy on the road. It would be a shame to let it arrive.']),
      red: S('scavenge', { rival: 'green' }, ['The dunes are littered with the war: Bolt Squads holding positions nobody remembers ordering, a Works with no Foundry, a Drill Rig still pumping. The Collective is picking through the same wreckage.', 'Doctrine says rebuild. It does not say with what.'], 'Scavenge and build: rescue stranded squads, capture abandoned structures, and rebuild a base from nothing.', ['A Works, a Rig, three rescued squads, and a Foreman. It is enough.', 'The Collective has a convoy on the road. The Foundry has a tank.']),
      green: S('scavenge', { rival: 'blue' }, ['The dunes are littered with the war: Warden Cells sitting in their shields waiting, an Array with no Core, a Siphon still drinking. The Swarm is picking through the same wreckage.', 'The Oracle computed where every piece fell.'], 'Scavenge and build: rescue stranded squads, capture abandoned structures, and rebuild a base from nothing.', ['An Array, a Siphon, three rescued cells, and the Oracle. It is enough.', 'The Swarm has a convoy on the road. The Oracle has a Lens Team.']),
    },
  },
  {
    title: 'The Convoy', theme: 'frost', size: 64, tier: 5,
    sides: {
      blue: S('escort', { rival: 'red' }, ['The scavenged Obelisk is the Swarm\'s only heavy weapon left in the world, and it is on the wrong side of the ice. The Foundry knows.', 'It walks. Everything else runs around it.'], 'Escort duty: bring the Obelisk across the ice through Foundry ambushes to the far outpost.', ['The Obelisk arrives with Foundry shells still landing behind it.', 'The Foundry\'s new base is a fortress. It is fed by a road, and roads can be cut.']),
      red: S('escort', { rival: 'green' }, ['The scavenged Crusher is the Foundry\'s only armour left in the world, and it is on the wrong side of the ice. The Collective knows.', 'It rolls. Everything else walks beside it.'], 'Escort duty: bring the Crusher Tank across the ice through Collective ambushes to the far outpost.', ['The tank arrives with beam scars from nose to tail.', 'The Collective\'s new base is a fortress. It is fed by a road, and roads can be cut.']),
      green: S('escort', { rival: 'blue' }, ['The scavenged Nova is the Collective\'s only star left in the world, and it is on the wrong side of the ice. The Swarm knows.', 'It rolls. The Halo goes with it.'], 'Escort duty: bring the Nova Sphere across the ice through swarm ambushes to the far outpost.', ['The Nova arrives with Wedge blades still stuck in its shield.', 'The Swarm\'s new Hive is a fortress. It is fed by a road, and roads can be cut.']),
    },
  },
  {
    title: 'Interdiction', theme: 'urban', size: 64, tier: 5,
    sides: {
      blue: S('interdiction', { rival: 'red' }, ['The Foundry\'s new fortress in the ruins cannot be stormed: Bunkers on every approach, the Foreman inside. It is fed by convoys from the far veins.', 'The Swarm does not storm. It starves.'], 'Supply interdiction: ambush the Foundry convoys and burn the rigs, then break the starving fortress.', ['The convoys stop coming and the fortress goes quiet, gun by gun.', 'The frozen river is the last line between the Swarm and the Foundry\'s heartland.']),
      red: S('interdiction', { rival: 'green' }, ['The Collective fortress in the ruins cannot be stormed: Bastions on every approach, the Oracle inside. It is fed by convoys from the far Siphons.', 'The Foreman has starved better places.'], 'Supply interdiction: ambush the Collective convoys and burn the Siphons, then break the starving fortress.', ['The convoys stop and the Bastions go dark one by one.', 'The frozen river is the last line between the Foundry and the Collective heartland.']),
      green: S('interdiction', { rival: 'blue' }, ['The Hive in the ruins cannot be stormed: Thorns in every window, the Apex inside. It is fed by convoys of Kites from the far Burrows.', 'The Oracle computes that hunger is faster than beams.'], 'Supply interdiction: ambush the Swarm convoys and burn the Burrows, then break the starving Hive.', ['The convoys stop and the Hive\'s hum thins to nothing.', 'The frozen river is the last line between the Collective and the Swarm heartland.']),
    },
  },
  {
    title: 'The Crossing', theme: 'frost', size: 64, tier: 6,
    sides: {
      blue: S('tugOfWar', { rival: 'red' }, ['The frozen river has five outposts along it, Foundry on every one. The Swarm takes them the way it takes everything: the next one, then the next.', 'Every outpost taken, the Hive sends more.'], 'Tug-of-war: push across the frozen river outpost by outpost; each one taken brings reinforcements.', ['The far bank is Swarm. The Foundry\'s Works on it is glass.', 'The scavenging is over. What is left is three armies, and a choice about who to fight first.']),
      red: S('tugOfWar', { rival: 'green' }, ['The frozen river has five outposts along it, Collective on every one. The Foundry takes them one step at a time, and iron follows each step.', 'The Foreman has never been in a hurry.'], 'Tug-of-war: push across the frozen river outpost by outpost; each one taken brings reinforcements.', ['The far bank is Foundry. The Collective\'s Array on it is dark.', 'The scavenging is over. What is left is three armies, and a choice about who to fight first.']),
      green: S('tugOfWar', { rival: 'blue' }, ['The frozen river has five outposts along it, Swarm on every one. The Collective takes them one Beacon at a time.', 'Each Beacon is a place the Oracle can see from. Soon it will see the far bank.'], 'Tug-of-war: push across the frozen river outpost by outpost; each one taken brings reinforcements.', ['The far bank is Collective. The Swarm\'s Nest on it is burning.', 'The scavenging is over. What is left is three armies, and a choice about who to fight first.']),
    },
  },
  // ---------------- ACT VI · Pacts (26-30): alliances form and break. The pacts are the same in every memory.
  {
    title: 'The Glass Pact', theme: 'frost', size: 64, tier: 6,
    sides: {
      blue: S('alliedAssault', { rival: 'red', ally: 'green' }, ['The Oracle sends an emissary: a truce on the ice, and a joint assault on the Foundry heartland. The Apex has never had an ally. It is curious.', 'The Collective attacks on its own schedule. The Swarm will have to learn to wait for it.'], 'Allied assault: fight beside the Collective against the Foundry heartland and keep your ally alive.', ['The Foundry heartland burns with spheres and triangles in the same streets.', 'The Oracle says nothing about what comes next. The Apex notices.']),
      red: S('crossfire', { r1: 'blue', r2: 'green' }, ['The Swarm and the Collective have made a pact on the ice, and the Foundry heartland is the first thing they agree on.', 'Two fronts, two enemies, one line. Doctrine.'], 'Two-front defence: hold three points for eight minutes against alternating Swarm and Collective waves.', ['The heartland holds and the pact\'s armies withdraw, still allies, for now.', 'The Foreman receives an emissary of his own. From the Swarm.']),
      green: S('alliedAssault', { rival: 'red', ally: 'blue' }, ['The Oracle proposes a truce on the ice and a joint assault on the Foundry heartland. The Swarm agrees faster than the Oracle computed it would.', 'Swarms attack on their own schedule. The Collective will have to keep up.'], 'Allied assault: fight beside the Swarm against the Foundry heartland and keep your ally alive.', ['The Foundry heartland burns with spheres and triangles in the same streets.', 'The Oracle has already computed how the pact ends. It does not tell the Apex.']),
    },
  },
  {
    title: 'The Iron Accord', theme: 'ashfall', size: 64, tier: 6,
    sides: {
      blue: S('crossfire', { r1: 'red', r2: 'green' }, ['The Foundry and the Collective have signed an accord over the ash, and the Swarm\'s new Hive is the first thing they agree on.', 'Two fronts. The Apex divides.'], 'Two-front defence: hold three points for eight minutes against alternating Foundry and Collective waves.', ['The Hive holds and the accord\'s armies withdraw, still allies, for now.', 'An emissary arrives from the Foundry. The Apex is starting to find diplomacy funny.']),
      red: S('alliedAssault', { rival: 'blue', ally: 'green' }, ['The Foreman signs an accord with the Oracle over the ash: a joint assault on the Swarm\'s new Hive. The Foundry has never trusted spheres. It trusts doctrine, and doctrine says use what you have.', 'The Collective attacks on its own schedule. The Foundry will match it.'], 'Allied assault: fight beside the Collective against the Swarm\'s Hive and keep your ally alive.', ['The Hive burns with squares and spheres in the same craters.', 'The Oracle says nothing about what comes next. The Foreman notices.']),
      green: S('alliedAssault', { rival: 'blue', ally: 'red' }, ['The Oracle signs an accord with the Foreman over the ash: a joint assault on the Swarm\'s Hive. The Foundry attacks on a schedule the Oracle can read to the second.', 'That is the only kind of ally the Collective likes.'], 'Allied assault: fight beside the Foundry against the Swarm\'s Hive and keep your ally alive.', ['The Hive burns with squares and spheres in the same craters.', 'The Oracle has already computed how the accord ends.']),
    },
  },
  {
    title: 'The Shear Pact', theme: 'crystal', size: 64, tier: 6,
    sides: {
      blue: S('alliedAssault', { rival: 'green', ally: 'red' }, ['The Foreman\'s emissary offers the Swarm a pact against the Collective: the Foundry\'s guns and the Swarm\'s numbers against the Core on the dunes.', 'The Apex agrees. It has decided to find out what betrayal feels like from the other side.'], 'Allied assault: fight beside the Foundry against the Collective\'s Core on the dunes and keep your ally alive.', ['The Core on the dunes cracks with iron and triangles pouring through the shield.', 'The Foreman says nothing about what comes next. The Apex has learned to notice.']),
      red: S('alliedAssault', { rival: 'green', ally: 'blue' }, ['The Foreman offers the Swarm a pact against the Collective. The Apex agrees before the emissary finishes. The Foundry does not trust that either.', 'Swarms attack on their own schedule. The Foundry will keep up.'], 'Allied assault: fight beside the Swarm against the Collective\'s Core on the dunes and keep your ally alive.', ['The Core on the dunes cracks with iron and triangles pouring through the shield.', 'The Foreman has read enough doctrine to know how pacts end.']),
      green: S('crossfire', { r1: 'blue', r2: 'red' }, ['The Swarm and the Foundry have made their own pact, and the Core on the dunes is the first thing they agree on.', 'The Oracle computed this. It did not enjoy it.'], 'Two-front defence: hold three points for eight minutes against alternating Swarm and Foundry waves.', ['The Core holds and the pact\'s armies withdraw, still allies, for now.', 'Every pact in the Lattice has now been made. The Oracle waits for the first one to break.']),
    },
  },
  {
    title: 'Betrayal', theme: 'urban', size: 64, tier: 6,
    sides: {
      blue: S('betrayal', { rival: 'green', ally: 'red', at: 360 }, ['The Foundry and the Swarm march on the Collective\'s last city together. Six minutes into the assault, the Foundry\'s guns turn around.', 'The Apex is not surprised. It is, for the first time, angry.'], 'Betrayal: fight beside the Foundry until it turns on you, then destroy both the Core and the Foundry.', ['Both the Core and the Foundry burn in the city, and the Swarm stands alone in the ash.', 'Alone is how the Swarm has always been strongest.']),
      red: S('betrayal', { rival: 'blue', ally: 'green', at: 360 }, ['The Foundry and the Collective march on the Hive in the ruins together. Six minutes in, the Collective\'s beams turn around.', 'The Foreman is not surprised. Doctrine has a chapter on this.'], 'Betrayal: fight beside the Collective until it turns on you, then destroy both the Hive and the Core.', ['Both the Hive and the Core burn in the ruins, and the Foundry stands alone.', 'Alone is how doctrine was written.']),
      green: S('betrayal', { rival: 'red', ally: 'blue', at: 360 }, ['The Collective and the Swarm march on the Foundry in the ruins together. Six minutes in, the Swarm turns.', 'The Oracle computed the minute. It did not compute how it would feel.'], 'Betrayal: fight beside the Swarm until it turns on you, then destroy both the Foundry and the Hive.', ['Both the Foundry and the Hive burn in the ruins, and the Collective stands alone.', 'The Oracle has always preferred it.']),
    },
  },
  {
    title: 'The Reckoning', theme: 'crystal', size: 80, tier: 6,
    sides: {
      blue: S('war', { rival: 'red' }, ['The Foundry\'s betrayal has a price. The Swarm goes to collect it at the Foundry\'s dune fortress with everything it has.', 'There will be no more pacts.'], 'Full war: destroy the Foundry at its dune fortress.', ['The Foundry falls. The Foreman is not among the dead; he never is.', 'The Collective and the Foundry have both learned the same lesson about the Swarm. They will learn it together.']),
      red: S('war', { rival: 'green' }, ['The Collective\'s betrayal has a price. The Foundry goes to collect it at the Core\'s dune fortress with everything it has.', 'There will be no more accords.'], 'Full war: destroy the Core at its dune fortress.', ['The Core falls. The Oracle\'s light goes out across the sand.', 'The Swarm and the Collective have both learned the same lesson about the Foundry. They will learn it together.']),
      green: S('war', { rival: 'blue' }, ['The Swarm\'s betrayal has a price. The Collective goes to collect it at the Hive\'s dune fortress with everything it has.', 'There will be no more pacts.'], 'Full war: destroy the Hive at its dune fortress.', ['The Hive falls. The Swarm scatters across the dunes.', 'The Foundry and the Swarm have both learned the same lesson about the Collective. They will learn it together.']),
    },
  },
  // ---------------- ACT VII · The Coalition (31-35): the other two factions unite against the player's.
  {
    title: 'Two Banners', theme: 'verdant', size: 64, tier: 7,
    sides: {
      blue: S('twoBanners', { r1: 'red', r2: 'green' }, ['Foundry Bunkers and Collective Bastions on the same ridge, under two banners. The old enemies have decided the Swarm is the newer problem.', 'The Apex finds this flattering.'], 'Mixed garrison: clear a ridge held by both Foundry and Collective forces and take every point on it.', ['The ridge falls. The two garrisons never learned to fight together, only to die together.', 'Both strongholds are now sending everything they have.']),
      red: S('twoBanners', { r1: 'blue', r2: 'green' }, ['Swarm Thorns and Collective Bastions on the same ridge. The old enemies have decided the Foundry is the newer problem.', 'The Foreman finds this reasonable. He would have done the same.'], 'Mixed garrison: clear a ridge held by both Swarm and Collective forces and take every point on it.', ['The ridge falls. The two garrisons never learned to fight together, only to die together.', 'Both strongholds are now sending everything they have.']),
      green: S('twoBanners', { r1: 'blue', r2: 'red' }, ['Swarm Thorns and Foundry Bunkers on the same ridge. The old enemies have decided the Collective is the newer problem.', 'The Oracle computed this outcome some time ago.'], 'Mixed garrison: clear a ridge held by both Swarm and Foundry forces and take every point on it.', ['The ridge falls. The two garrisons never learned to fight together, only to die together.', 'Both strongholds are now sending everything they have.']),
    },
  },
  {
    title: 'Crossfire', theme: 'urban', size: 80, tier: 7,
    sides: {
      blue: S('crossfire', { r1: 'red', r2: 'green', minutes: 9 }, ['The coalition attacks from both corners of the city at once, waves timed to arrive together.', 'The Hive has three points, a Spire, and nine minutes to prove that a swarm surrounded is a swarm with more targets.'], 'Two-front defence: hold three points for nine minutes against alternating Foundry and Collective waves.', ['The city is quiet and the streets are full of squares and spheres.', 'The Apex smells ore on the wind. Their economies are exposed.']),
      red: S('crossfire', { r1: 'blue', r2: 'green', minutes: 9 }, ['The coalition attacks from both corners of the city at once, Kites over the roofs and Novas behind.', 'The Foundry has an Iron Works, three points and nine minutes to remind everyone what it is for.'], 'Two-front defence: hold three points for nine minutes against alternating Swarm and Collective waves.', ['The city is quiet and the streets are full of triangles and spheres.', 'Their economies are exposed. The Foreman intends to make that permanent.']),
      green: S('crossfire', { r1: 'blue', r2: 'red', minutes: 9 }, ['The coalition attacks from both corners of the city at once, Kites over the roofs and Mortars behind.', 'The Collective has an Array, three points and nine minutes to prove that shields, given a breath, come back.'], 'Two-front defence: hold three points for nine minutes against alternating Swarm and Foundry waves.', ['The city is quiet and the streets are full of triangles and squares.', 'Their economies are exposed. The Oracle has already mapped them.']),
    },
  },
  {
    title: 'Scorched Vein', theme: 'ashfall', size: 80, tier: 7,
    sides: {
      blue: S('raid', { rival: 'red', n: 4 }, ['Foundry Drill Rigs and Collective Siphons share the lava fields now, each guarded by the other\'s turrets.', 'The Apex sends Kites and Wedges with one instruction: leave nothing that pumps ore.'], 'Deep raid: destroy four coalition extractors on the lava fields without losing more than two squads.', ['The lava fields are dark. Two economies starve at once.', 'Only the Foundry\'s anvil stands between the Swarm and the Prime Vein.']),
      red: S('raid', { rival: 'green', n: 4 }, ['Lode Burrows and Siphons share the lava fields, guarded by Thorns and Bastions. Two economies feeding two enemies.', 'The Foreman sends the tanks with one instruction: nothing that pumps ore is to be left standing.'], 'Deep raid: destroy four coalition extractors on the lava fields without losing more than two squads.', ['The lava fields are dark. Two economies starve at once.', 'Only the Collective\'s anvil stands between the Foundry and the Prime Vein.']),
      green: S('raid', { rival: 'blue', n: 4 }, ['Lode Burrows and Drill Rigs share the lava fields, guarded by Thorns and Bunkers.', 'The Oracle sends Lenses and a Halo with one instruction: nothing that pumps ore is to be left standing.'], 'Deep raid: destroy four coalition extractors on the lava fields without losing more than two squads.', ['The lava fields are dark. Two economies starve at once.', 'Only the Swarm\'s anvil stands between the Collective and the Prime Vein.']),
    },
  },
  {
    title: 'The Anvil', theme: 'crystal', size: 80, tier: 7,
    sides: {
      blue: S('war', { rival: 'red', extraEnemies: [{ faction: 'green', hq: false, ai: null, structures: [{ key: 'bastion', at: 'point:4' }, { key: 'beacon', at: 'point:4' }], squads: [{ key: 'wardens', at: 'point:4' }, { key: 'halo', at: 'point:4' }], points: [4] }] }, ['The Foundry has rebuilt in the canyons with Collective Bastions at its gates. It has learned everything.', 'So has the Apex.'], 'Full war against a hardened Foundry with Collective support at its gates: destroy the Foundry.', ['The Foundry falls for the last time. The Collective garrison surrenders the gates.', 'Beyond the canyons the Prime Vein hums, and every faction that is left is marching toward it.']),
      red: S('war', { rival: 'green', extraEnemies: [{ faction: 'blue', hq: false, ai: null, structures: [{ key: 'thorn', at: 'point:4' }, { key: 'claim', at: 'point:4' }], squads: [{ key: 'darts', at: 'point:4', n: 2 }, { key: 'needles', at: 'point:4' }], points: [4] }] }, ['The Collective has rebuilt in the canyons with Swarm Thorns at its gates. It has learned everything.', 'So has the Foreman.'], 'Full war against a hardened Collective with Swarm support at its gates: destroy the Core.', ['The Core falls for the last time. The Swarm garrison scatters from the gates.', 'Beyond the canyons the Prime Vein hums, and every faction that is left is marching toward it.']),
      green: S('war', { rival: 'blue', extraEnemies: [{ faction: 'red', hq: false, ai: null, structures: [{ key: 'bunker', at: 'point:4' }, { key: 'post', at: 'point:4' }], squads: [{ key: 'bolts', at: 'point:4' }, { key: 'hammers', at: 'point:4', order: 'hold' }], points: [4] }] }, ['The Swarm has rebuilt in the canyons with Foundry Bunkers at its gates. It has learned everything.', 'So has the Oracle.'], 'Full war against a hardened Swarm with Foundry support at its gates: destroy the Hive.', ['The Hive falls for the last time. The Foundry garrison surrenders the gates.', 'Beyond the canyons the Prime Vein hums, and every faction that is left is marching toward it.']),
    },
  },
  {
    title: 'The Approaches', theme: 'crystal', size: 64, tier: 7,
    sides: {
      blue: S('protectVip', { rival: 'green', ranks: [1, 2, 3] }, ['The approaches to the Prime Vein are three points on a ridge, and the Collective holds them. The Apex must take them itself; the Swarm will not advance without it.', 'The Collective knows. Every Lens on the ridge is looking for the bright one.'], 'Protect the VIP: keep the Apex alive while it leads the capture of the three approach points.', ['Three points, and the Apex still standing on the last of them.', 'The Vein is in sight. It glows.']),
      red: S('protectVip', { rival: 'blue', ranks: [1, 2, 3] }, ['The approaches to the Prime Vein are three points on a ridge, and the Swarm holds them. The Foreman must take them himself; the Foundry will not advance without him.', 'The Swarm knows. Every Wedge on the ridge is looking for him.'], 'Protect the VIP: keep the Foreman alive while he leads the capture of the three approach points.', ['Three points, and the Foreman still standing on the last of them.', 'The Vein is in sight. It glows.']),
      green: S('protectVip', { rival: 'red', ranks: [1, 2, 3] }, ['The approaches to the Prime Vein are three points on a ridge, and the Foundry holds them. The Oracle must take them itself; the Collective will not advance without it.', 'The Foundry knows. Every Hammer Team on the ridge is set up facing the bright one.'], 'Protect the VIP: keep the Oracle alive while it leads the capture of the three approach points.', ['Three points, and the Oracle still standing on the last of them.', 'The Vein is in sight. The Oracle has seen it for years.']),
    },
  },
  // ---------------- ACT VIII · The Prime Vein (36-40): the end of the world, three times.
  {
    title: 'The Outer Ring', theme: 'crystal', size: 80, tier: 8,
    sides: {
      blue: S('resourceRace', { rival: 'green', quota: 3000, minutes: 15 }, ['The Outer Ring of the Prime Vein is the richest ore in the Lattice, and the Collective is drinking it as fast as the Swarm can eat it.', 'Whoever has more when the Bleed returns wins the war before it starts.'], 'Resource race: own the Outer Ring veins and stockpile three thousand ore before the Collective does.', ['The stockpile is full. The Hive is larger than it has ever been.', 'And the ground under it is glowing again.']),
      red: S('resourceRace', { rival: 'blue', quota: 3000, minutes: 15 }, ['The Outer Ring of the Prime Vein is the richest ore in the Lattice, and the Swarm is eating it as fast as the Foundry can drill.', 'Whoever has more when the Bleed returns wins the war before it starts.'], 'Resource race: own the Outer Ring veins and stockpile three thousand ore before the Swarm does.', ['The stockpile is full. The Works has never run so hot.', 'And the ground under it is glowing again.']),
      green: S('resourceRace', { rival: 'red', quota: 3000, minutes: 15 }, ['The Outer Ring of the Prime Vein is the richest ore in the Lattice, and the Foundry is drilling it as fast as the Collective can drink.', 'Whoever has more when the Bleed returns wins the war before it starts.'], 'Resource race: own the Outer Ring veins and stockpile three thousand ore before the Foundry does.', ['The stockpile is full. Every shield in the Collective hums at once.', 'And the ground under it is glowing again.']),
    },
  },
  {
    title: 'The Bleed Returns', theme: 'ashfall', size: 80, tier: 8,
    sides: {
      blue: S('migrate', { rival: 'red', doomAt: 360 }, ['The Bleed rises again, this time under everyone at once. The Hive on the Outer Ring has six minutes.', 'The Swarm has done this before. It does it faster now.'], 'Migrating base: the Outer Ring base will be consumed in six minutes. Rebuild in the middle and survive the Foundry.', ['The old Hive is crystal. The new one stands at the centre of the world.', 'So does everyone else\'s.']),
      red: S('migrate', { rival: 'green', doomAt: 360 }, ['The Bleed rises again, under everyone at once. The Foundry on the Outer Ring has six minutes.', 'Doctrine has a chapter on this now. The Foreman wrote it.'], 'Migrating base: the Outer Ring base will be consumed in six minutes. Rebuild in the middle and survive the Collective.', ['The old Foundry is crystal. The new one stands at the centre of the world.', 'So does everyone else\'s.']),
      green: S('migrate', { rival: 'blue', doomAt: 360 }, ['The Bleed rises again, under everyone at once. The Core on the Outer Ring has six minutes.', 'The Oracle computed this a week ago. This time it told everyone.'], 'Migrating base: the Outer Ring base will be consumed in six minutes. Rebuild in the middle and survive the Swarm.', ['The old Core is crystal. The new one stands at the centre of the world.', 'So does everyone else\'s.']),
    },
  },
  {
    title: 'Last Convoy', theme: 'crystal', size: 80, tier: 8,
    sides: {
      blue: S('escort', { rival: 'green' }, ['The last Obelisk in the world walks from the Nest to the centre, and both other peoples want it dead before it arrives.', 'It arrives, or the Swarm has no answer to what is waiting.'], 'Escort duty: bring the last Obelisk to the centre through Collective ambushes.', ['The Obelisk stands at the centre of the world with the Swarm around it.', 'The other two armies are already there.']),
      red: S('escort', { rival: 'blue' }, ['The last Crusher in the world rolls from the Works to the centre, and both other peoples want it dead before it arrives.', 'It arrives, or doctrine has no answer to what is waiting.'], 'Escort duty: bring the last Crusher Tank to the centre through swarm ambushes.', ['The tank stands at the centre of the world with the Foundry around it.', 'The other two armies are already there.']),
      green: S('escort', { rival: 'red' }, ['The last Nova in the world rolls from the Array to the centre, and both other peoples want it dead before it arrives.', 'It arrives, or the Oracle\'s answer stays unspoken.'], 'Escort duty: bring the last Nova Sphere to the centre through Foundry ambushes.', ['The Nova stands at the centre of the world with the Collective around it.', 'The other two armies are already there.']),
    },
  },
  {
    title: 'Three Corners', theme: 'frost', size: 64, tier: 8,
    sides: {
      blue: S('threeWay', { r1: 'red', r2: 'green' }, ['Three armies in three corners of the ice, and the Prime Vein between them. Nobody is allied with anybody.', 'The Apex has waited its whole existence for a fight with no rules.'], 'Three-way war: destroy both the Foundry and the Core on the ice.', ['Two headquarters burn on the ice and the Swarm holds the lake.', 'One battle left. The Vein itself.']),
      red: S('threeWay', { r1: 'blue', r2: 'green' }, ['Three armies in three corners of the ice, and the Prime Vein between them. Nobody is allied with anybody.', 'Doctrine has always assumed this.'], 'Three-way war: destroy both the Hive and the Core on the ice.', ['Two headquarters burn on the ice and the Foundry holds the lake.', 'One battle left. The Vein itself.']),
      green: S('threeWay', { r1: 'blue', r2: 'red' }, ['Three armies in three corners of the ice, and the Prime Vein between them. Nobody is allied with anybody.', 'The Oracle computed this ending before the war began.'], 'Three-way war: destroy both the Hive and the Foundry on the ice.', ['Two headquarters burn on the ice and the Collective holds the lake.', 'One battle left. The Vein itself.']),
    },
  },
  {
    title: 'Prime Vein', theme: 'crystal', size: 80, tier: 8,
    sides: {
      blue: S('threeWay', { r1: 'red', r2: 'green' }, ['The Prime Vein lies open under the dunes, and around it, in three corners of the world, three peoples have built everything they have left.', 'The Swarm has always been the last thing standing, because it is the only one that can afford to be.'], 'All-out war on the largest battleground: destroy both the Foundry and the Core.', ['The Foundry falls. The Core falls. The Swarm pours over the Prime Vein in a tide of triangles.', 'The Lattice will be reforged, in the shape that divides. Campaign complete.']),
      red: S('threeWay', { r1: 'blue', r2: 'green' }, ['The Prime Vein lies open under the dunes, and around it, in three corners of the world, three peoples have built everything they have left.', 'The Foundry has always been the last thing standing, because it is the only one that was built to stand.'], 'All-out war on the largest battleground: destroy both the Hive and the Core.', ['The Hive falls. The Core falls. The Prime Vein lies in the open and the Foundry begins, immediately, to build.', 'The Lattice will be reforged, in the shape that lasts. Campaign complete.']),
      green: S('threeWay', { r1: 'blue', r2: 'red' }, ['The Prime Vein lies open under the dunes, and around it, in three corners of the world, three peoples have built everything they have left.', 'The Oracle computed this ending before the war began, and has only been waiting for the others to arrive.'], 'All-out war on the largest battleground: destroy both the Hive and the Foundry.', ['The Hive falls. The Foundry falls. The Collective settles over the Prime Vein and begins, slowly, to think about what shape a world should be.', 'The Lattice will be reforged, in the shape that endures. Campaign complete.']),
    },
  },
];
