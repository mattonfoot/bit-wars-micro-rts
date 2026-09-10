// Faction silhouettes, defined once as flat primitives and rendered both to the map canvas and to the
// interface icons, so an entity always looks the same in play and in the GUI.
import { FACTIONS } from '../game/data.js';
import { TAU } from '../engine/math.js';

/** rel: 'own' | 'enemy' | 'ally' | 'neutral' */
export function factionColors(faction, owner, viewer, viewerFaction, rel) {
  const f = FACTIONS[faction];
  if (!rel) rel = owner === viewer ? 'own' : 'enemy';
  if (rel === 'neutral') return { fill: '#8a8f98', stroke: '#3a3d44', dark: '#5a5e66', light: '#b5b9c2', enemy: false, rel };
  const other = rel !== 'own';
  const fill = other && faction === viewerFaction ? f.alt : f.color;
  const stroke = rel === 'own' ? '#ffffff' : rel === 'ally' ? '#c9d6e3' : '#12070a';
  return { fill, stroke, dark: f.dark, light: f.light, enemy: rel === 'enemy', rel };
}

// ---------- primitive helpers (unit space: a unit has radius 1 and faces +x; a building's half-size is 1)
const P = (pts, c = 'fill') => ({ k: 'poly', pts, c });
const C = (x, y, r, c = 'fill') => ({ k: 'circle', x, y, r, c });
const E = (x, y, rx, ry, c = 'fill') => ({ k: 'ellipse', x, y, rx, ry, c });
const R = (x, y, r, w, c = 'fill') => ({ k: 'ring', x, y, r, w, c });
const L = (x1, y1, x2, y2, w, c = 'white') => ({ k: 'line', x1, y1, x2, y2, w, c });
const Q = (x, y, w, h, c = 'fill', rot = 0) => { const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; return P(rot ? rotPts(pts, rot) : pts, c); };
function rotPts(pts, a) { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]); }
const tri = (tip, back, half, c = 'fill') => P([[tip, 0], [back, half], [back, -half]], c);

/** Unit silhouettes. `glow` marks heroes and stars that get a soft bloom on the map. */
const UNITS = {
  tri: () => [tri(1.2, -0.9, 0.9)],
  needle: () => [P([[1.9, 0], [-0.8, 0.55], [-0.5, 0], [-0.8, -0.55]])],
  chevron: () => [P([[1.3, 0], [-1, 1], [-0.3, 0], [-1, -1]])],
  kite: () => [tri(0.7, -0.6, 1.6), tri(0.35, -0.35, 0.35, 'mark')],
  obelisk: () => [tri(1.1, -0.8, 1), tri(0.5, -0.4, 0.45, 'light'), tri(0.1, -0.25, 0.15, 'dark')],
  apex: () => [0, 1, 2].map((i) => P(rotPts([[1.3, 0], [-0.6, 0.6], [-0.6, -0.6]], (i * TAU) / 3))).concat([C(0, 0, 0.28, 'white')]),
  square: () => [Q(-1, -1, 2, 2), Q(0.35, -0.25, 0.5, 0.5, 'mark')],
  wide: () => [Q(-0.8, -1.4, 1.6, 2.8), Q(0.3, -0.2, 1.3, 0.4, 'mark')],
  shield: () => [Q(-1, -1, 2, 2), Q(0.5, -1.2, 0.6, 2.4, 'light')],
  tank: () => [Q(-1, -0.8, 2, 1.6), Q(-1, -0.95, 2, 0.25, 'dark'), Q(-1, 0.7, 2, 0.25, 'dark'), Q(-0.45, -0.45, 0.9, 0.9, 'light'), Q(0, -0.12, 1.5, 0.24, 'mark')],
  mortar: () => [Q(-1, -1, 2, 2), Q(-0.4, -0.4, 0.8, 0.8, 'dark'), Q(-0.15, -0.15, 0.3, 0.3, 'mark')],
  foreman: () => [Q(-1, -1, 2, 2, 'fill', Math.PI / 4), Q(-0.15, -0.7, 0.3, 1.4, 'white', Math.PI / 4), Q(-0.7, -0.15, 1.4, 0.3, 'white', Math.PI / 4)],
  circle: () => [C(0, 0, 1), C(0.5, 0, 0.25, 'mark')],
  lens: () => [E(0, 0, 1.6, 0.7), C(0.9, 0, 0.2, 'mark')],
  ring: () => [R(0, 0, 0.8, 0.55)],
  halo: () => [C(0, 0, 1), R(0, 0, 0.65, 0.16, 'light'), C(0, 0, 0.22, 'mark')],
  nova: () => [C(0, 0, 1), R(0, 0, 0.25, 0.12, 'dark'), R(0, 0, 0.5, 0.12, 'dark'), R(0, 0, 0.75, 0.12, 'dark'), C(0.6, 0, 0.14, 'white')],
  oracle: () => [C(0, 0, 1)].concat([...Array(8)].map((_, i) => { const a = (i * TAU) / 8; return L(Math.cos(a) * 0.5, Math.sin(a) * 0.5, Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0.12); })).concat([C(0, 0, 0.3, 'white')]),
};
const GLOW = { apex: 1.2, foreman: 1.0, nova: 0.8, oracle: 1.0 };

/** Building silhouettes per faction and role; `facing` turns a turret barrel, `t` animates the Sanctum's orbit. */
function buildingPrims(faction, def, facing = 0, t = 0) {
  const kind = def.hq ? 'hq' : def.onOre ? 'ore' : def.turret ? 'turret' : def.onPoint ? 'point' : def.upgrade ? 'upgrade' : def.trains?.includes('kites') ? 'spire' : 'prod';
  if (faction === 'blue') {
    switch (kind) {
      case 'hq': return [P([[0, -1.1], [1, 0.65], [-1, 0.65]]), P([[0, -0.5], [0.5, 0.38], [-0.5, 0.38]], 'dark')];
      case 'ore': return [P([[0, -1.1], [1, 0.75], [-1, 0.75]]), C(0, 0.2, 0.35, 'dark')];
      case 'turret': return [P([[0, -1.05], [0.8, 0.6], [-0.8, 0.6]]), Q(0, -0.12, 1.1, 0.24, 'mark', facing)];
      case 'point': return [P([[0, -1.15], [0.6, 0.55], [-0.6, 0.55]])];
      case 'spire': return [P([[0, -1], [1, 0], [0, 1], [-1, 0]]), P([[0, -0.5], [0.5, 0], [0, 0.5], [-0.5, 0]], 'dark')];
      default: return [P([[-1, -0.75], [1, -0.75], [0, 1.1]]), P([[-0.5, -0.42], [0.5, -0.42], [0, 0.48]], 'dark')];
    }
  }
  if (faction === 'red') {
    const base = [Q(-1, -1, 2, 2)];
    switch (kind) {
      case 'hq': return base.concat([Q(-0.7, -0.7, 1.4, 1.4, 'dark'), Q(-0.3, -0.3, 0.6, 0.6, 'light'), Q(-0.12, -0.12, 0.24, 0.24, 'fill')]);
      case 'ore': return base.concat([Q(-0.5, -0.5, 1, 1, 'dark'), Q(-0.5, -0.5, 0.5, 0.5, 'light')]);
      case 'turret': return base.concat([Q(-0.6, -0.6, 1.2, 1.2, 'dark'), Q(0, -0.15, 1.2, 0.3, 'mark', facing)]);
      case 'point': return base.concat([Q(-0.3, -1, 0.6, 2, 'dark')]);
      case 'upgrade': return base.concat([Q(-0.7, -0.7, 0.55, 0.55, 'dark'), Q(0.15, -0.7, 0.55, 0.55, 'dark'), Q(-0.7, 0.15, 0.55, 0.55, 'dark'), Q(0.15, 0.15, 0.55, 0.55, 'dark')]);
      default: return base.concat([Q(-0.7, -0.7, 1.4, 1.4, 'dark'), Q(-0.7, -0.2, 1.4, 0.4, 'fill')]);
    }
  }
  const base = [C(0, 0, 1)];
  switch (kind) {
    case 'hq': return base.concat([C(0, 0, 0.7, 'dark'), R(0, 0, 0.45, 0.1, 'light'), C(0, 0, 0.2, 'light')]);
    case 'ore': return base.concat([C(0, 0, 0.5, 'dark'), C(-0.2, -0.2, 0.18, 'light')]);
    case 'turret': return base.concat([C(0, 0, 0.55, 'dark'), Q(0, -0.12, 1.2, 0.24, 'mark', facing)]);
    case 'point': return base.concat([R(0, 0, 0.55, 0.1, 'light')]);
    case 'upgrade': return base.concat([0, 1, 2].map((i) => { const a = t * 0.8 + (i * TAU) / 3; return C(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.22, 'dark'); }));
    default: return base.concat([E(0, 0, 0.75, 0.45, 'dark'), C(0, 0, 0.2, 'light')]);
  }
}

// ---------- canvas rendering
function paint(ctx, prims, scale, angle, colors) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const tx = (x, y) => [(x * c - y * s) * scale, (x * s + y * c) * scale];
  for (const p of prims) {
    const col = colors[p.c] || colors.fill;
    ctx.fillStyle = col; ctx.strokeStyle = col;
    if (p.k === 'poly') { ctx.beginPath(); p.pts.forEach(([x, y], i) => { const [X, Y] = tx(x, y); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); }
    else if (p.k === 'circle') { const [X, Y] = tx(p.x, p.y); ctx.beginPath(); ctx.arc(X, Y, p.r * scale, 0, TAU); ctx.fill(); }
    else if (p.k === 'ellipse') { const [X, Y] = tx(p.x, p.y); ctx.beginPath(); ctx.ellipse(X, Y, p.rx * scale, p.ry * scale, angle, 0, TAU); ctx.fill(); }
    else if (p.k === 'ring') { const [X, Y] = tx(p.x, p.y); ctx.lineWidth = Math.max(0.8, p.w * scale); ctx.beginPath(); ctx.arc(X, Y, p.r * scale, 0, TAU); ctx.stroke(); }
    else if (p.k === 'line') { const [X1, Y1] = tx(p.x1, p.y1), [X2, Y2] = tx(p.x2, p.y2); ctx.lineWidth = Math.max(0.8, p.w * scale); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X1, Y1); ctx.lineTo(X2, Y2); ctx.stroke(); }
  }
}
const canvasColors = (col) => ({ fill: col.fill, dark: col.dark, light: col.light, mark: col.stroke, white: '#ffffff' });

/** Draw one unit member. r = radius, facing = radians. */
export function drawUnit(ctx, shape, x, y, r, facing, col) {
  const prims = (UNITS[shape] || UNITS.circle)();
  ctx.save(); ctx.translate(x, y);
  if (GLOW[shape]) { ctx.shadowColor = col.fill; ctx.shadowBlur = r * GLOW[shape]; ctx.fillStyle = col.fill; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
  paint(ctx, prims, r, facing, canvasColors(col));
  ctx.restore();
}

/** Draw a building. x,y centre, w,h in world units. */
export function drawBuilding(ctx, faction, def, x, y, w, h, col, opts = {}) {
  const half = Math.min(w, h) / 2 - 3;
  ctx.save(); ctx.translate(x, y);
  paint(ctx, buildingPrims(faction, def, opts.facing || 0, opts.time || 0), half, 0, canvasColors(col));
  ctx.restore();
}

// ---------- SVG rendering (interface icons), from the very same primitives
function bounds(prims) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const p of prims) {
    if (p.k === 'poly') p.pts.forEach(([x, y]) => add(x, y));
    else if (p.k === 'circle') { add(p.x - p.r, p.y - p.r); add(p.x + p.r, p.y + p.r); }
    else if (p.k === 'ellipse') { add(p.x - p.rx, p.y - p.ry); add(p.x + p.rx, p.y + p.ry); }
    else if (p.k === 'ring') { const e = p.r + p.w / 2; add(p.x - e, p.y - e); add(p.x + e, p.y + e); }
    else if (p.k === 'line') { add(p.x1, p.y1); add(p.x2, p.y2); }
  }
  return { x0, y0, x1, y1 };
}
function svg(prims, colors, size) {
  const b = bounds(prims), pad = size * 0.08;
  const scale = (size - pad * 2) / Math.max(b.x1 - b.x0, b.y1 - b.y0);
  const ox = size / 2 - ((b.x0 + b.x1) / 2) * scale, oy = size / 2 - ((b.y0 + b.y1) / 2) * scale;
  const X = (x) => (ox + x * scale).toFixed(2), Y = (y) => (oy + y * scale).toFixed(2), S = (v) => (v * scale).toFixed(2);
  const body = prims.map((p) => {
    const col = colors[p.c] || colors.fill;
    if (p.k === 'poly') return `<polygon points="${p.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}" fill="${col}"/>`;
    if (p.k === 'circle') return `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${S(p.r)}" fill="${col}"/>`;
    if (p.k === 'ellipse') return `<ellipse cx="${X(p.x)}" cy="${Y(p.y)}" rx="${S(p.rx)}" ry="${S(p.ry)}" fill="${col}"/>`;
    if (p.k === 'ring') return `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${S(p.r)}" fill="none" stroke="${col}" stroke-width="${S(p.w)}"/>`;
    if (p.k === 'line') return `<line x1="${X(p.x1)}" y1="${Y(p.y1)}" x2="${X(p.x2)}" y2="${Y(p.y2)}" stroke="${col}" stroke-width="${S(p.w)}" stroke-linecap="round"/>`;
    return '';
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;
}
const iconColors = (faction, color) => { const f = FACTIONS[faction] || {}; return { fill: color, dark: f.dark || '#111', light: f.light || '#fff', mark: '#ffffff', white: '#ffffff' }; };

/** Icon of a unit shape, facing right, in the faction's colours: the same silhouette the map draws. */
export function unitIconSVG(faction, shape, color, size = 28) {
  return svg((UNITS[shape] || UNITS.circle)(), iconColors(faction, color), size);
}
/** Icon of a structure: the same silhouette the map draws. */
export function buildingIconSVG(faction, def, color, size = 28) {
  return svg(buildingPrims(faction, def, 0, 0), iconColors(faction, color), size);
}
