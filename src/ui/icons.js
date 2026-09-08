// Interface icons: thin single-stroke line art in the same vector style as the map, drawn with the
// current text colour so they follow button states. No emoji or symbol fonts anywhere in the UI.
const PATHS = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  sound: 'M4 10v4h4l5 4V6l-5 4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  mute: 'M4 10v4h4l5 4V6l-5 4H4zM16 9l5 6M21 9l-5 6',
  expand: 'M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7',
  close: 'M6 6l12 12M18 6L6 18',
  move: 'M4 12h14M13 6l6 6-6 6',
  attack: 'M5 19l7-7M12 12l7-7M5 5l14 14M9 5H5v4M15 19h4v-4',
  flank: 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M19 12a7 7 0 0 1-12 5M7 21v-4h4',
  hold: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z',
  retreat: 'M12 6l-6 6 6 6M19 6l-6 6 6 6',
  stop: 'M6 6h12v12H6z',
  box: 'M4 4h4M10 4h4M16 4h4M4 10v4M20 10v4M4 16v4M20 16v4M4 20h4M10 20h4M16 20h4',
  hero: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  build: 'M12 3l8 4.6v9.2L12 21l-8-4.6V7.6L12 3zM12 8v8M8 12h8',
  rally: 'M6 21V4M6 4h11l-2.5 3.5L17 11H6',
  check: 'M5 12.5l4.5 4.5L19 7',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
  play: 'M8 5v14l11-7L8 5z',
  circle: 'M12 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0',
  flag: 'M7 21V4M7 4h10l-2 3.5L17 11H7',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  down: 'M5 9l7 7 7-7',
  dice: 'M4 4h16v16H4zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  detach: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3zM4 4l16 16',
};

/** Inline SVG for a named icon at the given pixel size. Extra classes are appended to the `ic` class. */
export function ico(name, size = 16, cls = '') {
  const d = PATHS[name] || PATHS.circle;
  const fill = name === 'circle' || name === 'stop' ? ' fill="currentColor" fill-opacity="0.9"' : '';
  const sw = /\.01/.test(d) ? 2.4 : 1.8;
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"${fill}/></svg>`;
}

// Faction emblems in the same line style, coloured with the faction's own colour: the Swarm is an insect
// carapace (broad shoulders tapering to a point, an inverted triangle with plated segments), the Foundry a hammer (a chunky head with chamfered left corners and a flared right face, on a thin shaft with three wraps of binding at the grip, each piece separated by a thin gap),
// the Collective a solid core flanked by two outlined arc segments, split by a straight vertical gap top and bottom.
const EMBLEMS = {
  blue: 'M3 5h18l-2 4-7 12-7-12zM5 9h14M7.3 13h9.4M9.6 17h4.8',
  red: 'M5.6 2H21l-2.6 7H5.6L4 7.4V3.6zM10.7 9.9h2.6v4.8h-2.6zM10.2 16.7l3.6-1.1v1.2l-3.6 1.1zM10.2 19.4l3.6-1.1v1.2l-3.6 1.1zM10.2 22.1l3.6-1.1v1.2l-3.6 1.1z',
  green: { d: 'M13.8 2.67A9.5 9.5 0 0 1 13.8 21.33V18.04A6.3 6.3 0 0 0 13.8 5.96ZM10.2 2.67A9.5 9.5 0 0 0 10.2 21.33V18.04A6.3 6.3 0 0 1 10.2 5.96Z', fill: 'M12 12m-3.1 0a3.1 3.1 0 1 0 6.2 0a3.1 3.1 0 1 0-6.2 0' },
};
const EMBLEM_COLORS = { blue: '#3b8bff', red: '#ff5f5f', green: '#3fbf5a' };
/** Inline SVG emblem for a faction at the given pixel size; colour defaults to the faction colour. */
export function factionEmblemSVG(faction, size = 40, color = EMBLEM_COLORS[faction] || 'currentColor') {
  const e = EMBLEMS[faction] || EMBLEMS.green;
  const d = typeof e === 'string' ? e : e.d;
  const solid = typeof e === 'string' || !e.fill ? '' : `<path d="${e.fill}" fill="${color}" stroke="none"/>`;
  return `<svg class="ic emblem" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="butt" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/>${solid}</svg>`;
}

/** Canvas versions of the few marks drawn over units: a hero star, retreat chevrons, a set-up square, and pending dots. */
export function drawMark(ctx, name, x, y, color, s = 4) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  if (name === 'hero') { for (let k = 0; k < 10; k++) { const r = k % 2 ? s * 0.45 : s, a = -Math.PI / 2 + (k * Math.PI) / 5; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  else if (name === 'retreat') { ctx.moveTo(-s * 0.2, -s); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.2, s); ctx.moveTo(s * 0.9, -s); ctx.lineTo(s * 0.1, 0); ctx.lineTo(s * 0.9, s); ctx.stroke(); }
  else if (name === 'setup') { ctx.rect(-s, -s, s * 2, s * 2); ctx.stroke(); ctx.fillRect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9); }
  else if (name === 'pending') { for (let k = -1; k <= 1; k++) { ctx.moveTo(k * s * 0.8 + 1, 0); ctx.arc(k * s * 0.8, 0, 1, 0, Math.PI * 2); } ctx.fill(); }
  ctx.restore();
}
