# Bit Wars: Micro RTS

A fast, squad-based real-time strategy game for phones. Installable on iPhone as a home-screen app (PWA), playable in any modern browser, zero dependencies, no build step.

**Play in a browser:** serve the folder with any static server (`npm start`), or deploy to GitHub Pages (workflow included).

**Native iOS app (App Store):** the `ios/` folder is a Capacitor project that wraps the same game. See [docs/APP_STORE.md](docs/APP_STORE.md) for the build, TestFlight and submission steps. Short version on a Mac with Xcode:

```
npm install
npm run ios:open     # build www/, sync into the Xcode project, open it
```

Battles autosave every few seconds and on backgrounding, and the menu offers **Resume battle** after a relaunch.

## Install as a web app (without the App Store)

1. Open the game URL in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. Launch from the home screen: it runs full-screen, offline, in landscape.

## The game

Two commanders, one procedurally generated battleground, one objective: reduce the enemy headquarters to rubble.

### Campaigns

Each faction has its own forty-chapter campaign with its own backstory, its own goal and its own ending: **Shear** (Vector Swarm, whose goal is the Bloom), **Doctrine** (Iron Foundry, the Great Forge) and **Protocol** (Aegis Collective, the Answer). The first five chapters teach the faction's mechanics one at a time against scripted garrisons with limited rosters. Chapters 6 to 40 are the faction's own story in eight acts, and the three stories cross over at twelve shared battles (Greywater Ford, the Drill Fields, the Glass Lake, the Halo Column, the Bleed, the Scavenge, the three pacts, the Betrayal, the Bleed's return and Three Corners). Each campaign reaches a crossover at its own chapter number and fights its own side of it, and what one faction does there is felt in the others' chapters: the Works the Collective burns at Greywater is blamed on the Swarm in Doctrine. Chapter 40 is each faction's finale, a three-way war in which both rivals must be broken before the faction can complete its own goal: the Swarm blooms and brings the Apex to the seam, the Foundry raises an Armory beside the Vein and holds the ground, the Collective brings the Oracle to the seam and holds the world still.

The chapters interweave many kinds of play: assault, hold the line, survive the countdown, chokepoint defence, protect the structure, protect the VIP, commando (no base), escort duty, scavenge and build (rescue grey neutral squads and claim abandoned structures), resource race, migrating base (a doom zone consumes the start position), supply-line interdiction (ambush convoys), multi-front split, tug-of-war (each outpost taken sends reinforcements), allied assault (an AI ally shares vision and must survive), betrayal (the ally turns mid-battle), raids, sieges, full wars, three-way wars and the finales. Progress is saved per campaign, and a chapter in progress can be resumed.

Handwritten lesson chapters live in `src/game/chapters/{blue,red,green}-lessons.js`, each faction's arc (goal, backstory, acts and chapters 6 to 40) in `src/game/chapters/{blue,red,green}-arc.js`, the crossover battles in `src/game/chapters/crossovers.js`, and the scenario style builders in `src/game/chapters/styles.js`; `src/game/campaigns.js` composes them and links each crossover chapter to the same battle in the other campaigns. The runtime that builds worlds (teams, allies, neutrals, tagged units, convoys, doom zones, rewards, scripted events) and tracks objectives is `src/game/campaign.js`.

### Three factions, nothing shared

| | Vector Swarm (blue, triangles) | Iron Foundry (red, squares) | Aegis Collective (green, circles) |
|---|---|---|---|
| Identity | Numbers, speed, flanks | Steel, suppression, siege | Shields, precision, patience |
| Infantry | Dart Swarm (8, melee), Needle Squad (5, anti-armour), Wedge Raiders (4, flankers) | Bolt Squad (4, line), Hammer Team (2, set-up suppression gun), Breachers (3, demolition) | Warden Cell (3, shielded), Lens Team (2, snipers), Pulse Ring (4, morale disruptors) |
| Vehicles | Kite Wing (flying harasser), Obelisk (siege walker) | Crusher Tank (blast cannon), Mortar Block (artillery) | Halo (shield projector), Nova Sphere (orbital artillery) |
| Hero | The Apex: speed + morale aura | The Foreman: armour + repair aura | The Oracle: vision + shield aura |
| Structures | Hive, Lode Burrow, Nest, Spire, Thorn, Claim Spike | Foundry, Drill Rig, Iron Works, Bunker, Armoury, Watch Post | Core, Siphon, Array, Bastion, Sanctum, Beacon |

Every unit has a damage type (light, anti-armour, energy, blast, melee) and an armour class (infantry, heavy, vehicle, shielded, structure). The counter matrix lives in `src/game/data.js`; every squad card in the game shows what it is strong and weak against.

### Systems

- **Frontline economics.** Ore comes from extractors on ore veins. Flux comes only from strategic points you hold with infantry. Fortify a point with an outpost for more income and to force the enemy to destroy it before recapturing.
- **Squads, not soldiers.** Reinforce a bled squad anywhere (faster near base). Attach your hero to a squad mid-fight.
- **Cover.** Brush, craters and rubble give light cover. Rocks, walls and ruins give heavy cover from the shooter's side. Blast weapons destroy cover and leave craters.
- **Morale.** Sustained fire and casualties break squads: broken squads fight at a third of their strength and take 50% more damage. Flanking (attacking from behind) hits harder and breaks faster. Retreat sends a squad sprinting home to recover.
- **Fog of war.** Vision comes from units and structures; enemy structures you have seen are remembered on the minimap.
- **Meaningful losses.** Squads die permanently, structures leave rubble, lose the HQ and the war is over.
- **Five themes.** Verdant Basin, Ashfall, Frostbite, Ruined City, Crystal Dunes. Maps are point-symmetric so both sides get identical terrain; seeds are shareable.
- **Irregular hex grid.** The battlefield is a hexagonal grid whose corner points are displaced by fractal noise, so cells, coastlines and contour lines are never straight. Pathfinding, cover, vision and building footprints all use the same jittered cells the renderer draws, and the displacement is point-symmetric so mirrored halves still match exactly (`src/map/hexgrid.js`).
- **Vector-map look.** Black ground with thin outlines: white contour lines for mountains, blue coastlines around water, grey edges along paths, brown outlines for walls and ruins, green outlines for vegetation. Units are solid coloured shapes so they always stand out from the terrain.

### Controls (touch)

| Gesture | Action |
|---|---|
| Tap unit / squad icon | Select squad (tap the icon again to jump the camera) |
| Tap ground / enemy | Move / attack with the selection |
| Long-press ground | Attack-move |
| Double-tap unit | Select all of that type on screen |
| One-finger drag | Pan · **Box** button turns the next drag into box-select |
| Pinch | Zoom |
| Tap minimap | Jump camera |

Mouse: left-click/drag selects, right-click commands, wheel zooms, middle-drag pans. Keys: `A` attack-move, `M` move, `H` hold, `S` stop, `R` retreat, `E` reinforce, `B` build, `F` select army, `1-9` squads, `Space` jump to last alert, `Esc` cancel.

## Development

```
npm start          # serve on http://localhost:8080
npm run test:map   # map generation: 90 maps, connectivity checks
npm run test:sim   # headless AI vs AI across all faction matchups
npm run test:campaign  # all 120 chapters build, run, round-trip; chapter 1 scripted playthrough
npm run test:mechanics # scripted checks of rescue, doom, rewards, betrayal, escort, convoys, allies
npm run sim -- blue red verdant seed 20   # one headless game, per-minute summary
npm run screenshots                        # Playwright smoke test at iPhone viewport
npm run icons                              # regenerate PNG/App Store icons and splash from SVG
npm run build                              # assemble the web bundle into www/ for native builds
npm run ios:sync                           # build + copy into the Xcode project (Mac)
```

`src/game` and `src/map` are DOM-free and run in Node; everything under `src/render`, `src/ui` and `src/engine/input.js` is browser-only.

```
ios/        Capacitor iOS project (Swift Package Manager, no CocoaPods)
tools/      icon/splash generation, www build, headless sim, Playwright screenshots
src/
  engine/   rng, math, camera, gesture input, procedural audio
  game/     data (factions), world (simulation), combat, pathfinding, ai
  map/      terrain constants, themes, generator
  render/   terrain layer, fog, shapes, world renderer
  ui/       hud, minimap, menu
```
