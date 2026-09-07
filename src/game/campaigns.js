// Campaign content index. Each faction has its own forty-chapter story with its own goal and ending:
// chapters 1-5 are handwritten lessons (chapters/*-lessons.js), chapters 6-40 are the faction's arc
// (chapters/*-arc.js). Arcs are separate stories that cross over at shared events (chapters/crossovers.js),
// which each campaign reaches at its own chapter number and fights from its own side. Every chapter is built
// by a scenario style from chapters/styles.js.
import { BLUE_LESSONS } from './chapters/blue-lessons.js';
import { RED_LESSONS } from './chapters/red-lessons.js';
import { GREEN_LESSONS } from './chapters/green-lessons.js';
import { BLUE_ARC } from './chapters/blue-arc.js';
import { RED_ARC } from './chapters/red-arc.js';
import { GREEN_ARC } from './chapters/green-arc.js';
import { CROSSOVERS } from './chapters/crossovers.js';
import { STYLES } from './chapters/styles.js';

export const LORE = {
  world: 'The Lattice was once a single crystal world. When it cracked, three peoples woke in the fracture: the Vector Swarm, endlessly dividing triangles born along the shear-lines; the Iron Foundry, square-cut folk of the deep forges who believe only in what lasts; and the Aegis Collective, contemplative spheres who read the future in the pattern of the break. At the heart of the Lattice lies the Prime Vein, the seam of ore that held the world together. Whoever holds it can forge the Lattice anew, in their own shape.',
  memory: 'Three stories, three endings. They cross where the armies met; only one of them can be true.',
};

const SEEDS = { blue: 'shear', red: 'doctrine', green: 'protocol' };
const NAMES = { blue: 'Shear', red: 'Doctrine', green: 'Protocol' };

function buildCampaign(faction, lessons, arc) {
  const chapters = [...lessons.chapters];
  arc.chapters.forEach((entry) => {
    const n = chapters.length + 1;
    const ev = entry.crossover ? CROSSOVERS[entry.crossover] : null;
    const side = ev ? ev.sides[faction] : entry;
    if (!side) throw new Error(`${faction} has no side in crossover ${entry.crossover}`);
    const built = STYLES[side.style]({ f: faction, tier: entry.tier, ...side.params });
    chapters.push({
      key: `${faction}-${n}`, title: ev ? ev.title : entry.title, theme: ev ? ev.theme : entry.theme, size: ev ? ev.size : entry.size,
      seed: `${SEEDS[faction]}-${n}`, style: side.style, tier: entry.tier, crossover: entry.crossover || null,
      story: side.story, briefing: side.briefing, epilogue: side.epilogue,
      ...built,
      hints: [...(built.hints || []), ...(side.hints || [])],
    });
  });
  return { ...lessons, goal: arc.goal, backstory: arc.backstory, outcome: arc.outcome, acts: arc.acts, chapters };
}

export const CAMPAIGNS = { blue: buildCampaign('blue', BLUE_LESSONS, BLUE_ARC), red: buildCampaign('red', RED_LESSONS, RED_ARC), green: buildCampaign('green', GREEN_LESSONS, GREEN_ARC) };

// Link crossovers: each crossover chapter lists where the other campaigns fight the same battle.
for (const [fk, camp] of Object.entries(CAMPAIGNS)) {
  camp.chapters.forEach((ch, i) => {
    if (!ch.crossover) return;
    ch.also = Object.entries(CAMPAIGNS).filter(([ok]) => ok !== fk).map(([ok, oc]) => { const j = oc.chapters.findIndex((c) => c.crossover === ch.crossover); return j < 0 ? null : { faction: ok, campaign: NAMES[ok], index: j, key: oc.chapters[j].key }; }).filter(Boolean);
    void i;
  });
}

export function chapterByKey(key) { for (const c of Object.values(CAMPAIGNS)) { const i = c.chapters.findIndex((ch) => ch.key === key); if (i >= 0) return { campaign: c, chapter: c.chapters[i], index: i }; } return null; }
export function actOf(campaign, index) { let a = null; for (const act of campaign.acts || []) if (index >= act.from) a = act; return a; }
