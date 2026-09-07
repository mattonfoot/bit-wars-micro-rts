// Campaign content index. Chapters 1-5 are handwritten lessons per faction (chapters/*-lessons.js);
// chapters 6-40 are the shared timeline in chapters/events.js played from each faction's side, built by
// the scenario styles in chapters/styles.js.
import { BLUE_LESSONS } from './chapters/blue-lessons.js';
import { RED_LESSONS } from './chapters/red-lessons.js';
import { GREEN_LESSONS } from './chapters/green-lessons.js';
import { EVENTS, PHASES } from './chapters/events.js';
import { STYLES } from './chapters/styles.js';

export const LORE = {
  world: 'The Lattice was once a single crystal world. When it cracked, three peoples woke in the fracture: the Vector Swarm, endlessly dividing triangles born along the shear-lines; the Iron Foundry, square-cut folk of the deep forges who believe only in what lasts; and the Aegis Collective, contemplative spheres who read the future in the pattern of the break. At the heart of the Lattice lies the Prime Vein, the seam of ore that held the world together. Whoever holds it can forge the Lattice anew, in their own shape.',
  memory: 'Three memories of one war. The battles are the same in every telling; only the ending is yours.',
};

const SEEDS = { blue: 'shear', red: 'doctrine', green: 'protocol' };
function buildCampaign(faction, lessons) {
  const chapters = [...lessons.chapters];
  EVENTS.forEach((ev, i) => {
    const side = ev.sides[faction];
    const n = chapters.length + 1;
    const built = STYLES[side.style]({ f: faction, tier: ev.tier, ...side.params });
    chapters.push({
      key: `${faction}-${n}`, title: ev.title, theme: ev.theme, size: ev.size, seed: `${SEEDS[faction]}-${n}`, style: side.style,
      story: side.story, briefing: side.briefing, epilogue: side.epilogue,
      ...built,
      hints: [...(built.hints || []), ...(side.hints || [])],
    });
  });
  return { ...lessons, acts: PHASES, chapters };
}

export const CAMPAIGNS = { blue: buildCampaign('blue', BLUE_LESSONS), red: buildCampaign('red', RED_LESSONS), green: buildCampaign('green', GREEN_LESSONS) };
export function chapterByKey(key) { for (const c of Object.values(CAMPAIGNS)) { const i = c.chapters.findIndex((ch) => ch.key === key); if (i >= 0) return { campaign: c, chapter: c.chapters[i], index: i }; } return null; }
export function actOf(campaign, index) { let a = null; for (const act of campaign.acts || []) if (index >= act.from) a = act; return a; }
