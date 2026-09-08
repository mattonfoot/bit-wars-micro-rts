// Faction silhouettes. Blue = triangles, Red = squares, Green = circles. Everything else is variation on that.
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

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}
function rot(pts, a) { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]); }

/** Draw one unit member. r = radius, facing = radians. */
export function drawUnit(ctx, shape, x, y, r, facing, col, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = col.fill; ctx.strokeStyle = 'rgba(0,0,0,0)' /* no outline: shapes are flat fills */; ctx.lineWidth = Math.max(0.6, r * 0.11);
  ctx.lineJoin = 'round';
  const a = facing;
  switch (shape) {
    case 'tri': poly(ctx, rot([[r * 1.2, 0], [-r * 0.9, r * 0.9], [-r * 0.9, -r * 0.9]], a)); ctx.fill(); ctx.stroke(); break;
    case 'needle': poly(ctx, rot([[r * 1.9, 0], [-r * 0.8, r * 0.55], [-r * 0.5, 0], [-r * 0.8, -r * 0.55]], a)); ctx.fill(); ctx.stroke(); break;
    case 'chevron': poly(ctx, rot([[r * 1.3, 0], [-r * 1.0, r * 1.0], [-r * 0.3, 0], [-r * 1.0, -r * 1.0]], a)); ctx.fill(); ctx.stroke(); break;
    case 'kite':
      poly(ctx, rot([[r * 0.7, 0], [-r * 0.6, r * 1.6], [-r * 0.6, -r * 1.6]], a)); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col.stroke; poly(ctx, rot([[r * 0.35, 0], [-r * 0.35, r * 0.35], [-r * 0.35, -r * 0.35]], a)); ctx.fill();
      break;
    case 'obelisk':
      poly(ctx, rot([[r * 1.1, 0], [-r * 0.8, r], [-r * 0.8, -r]], a)); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col.light; poly(ctx, rot([[r * 0.5, 0], [-r * 0.4, r * 0.45], [-r * 0.4, -r * 0.45]], a)); ctx.fill();
      ctx.fillStyle = col.dark; poly(ctx, rot([[r * 0.1, 0], [-r * 0.25, r * 0.15], [-r * 0.25, -r * 0.15]], a)); ctx.fill();
      break;
    case 'apex': {
      // star of three triangles
      ctx.shadowColor = col.fill; ctx.shadowBlur = r * 1.2;
      for (let i = 0; i < 3; i++) { poly(ctx, rot([[r * 1.3, 0], [-r * 0.6, r * 0.6], [-r * 0.6, -r * 0.6]], a + (i * TAU) / 3)); ctx.fill(); }
      ctx.shadowBlur = 0;
      poly(ctx, rot([[r * 1.3, 0], [-r * 0.6, r * 0.6], [-r * 0.6, -r * 0.6]], a)); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, TAU); ctx.fill();
      break;
    }
    case 'square': ctx.rotate(a); ctx.fillRect(-r, -r, r * 2, r * 2); ctx.strokeRect(-r, -r, r * 2, r * 2); ctx.fillStyle = col.stroke; ctx.fillRect(r * 0.35, -r * 0.25, r * 0.5, r * 0.5); break;
    case 'wide': ctx.rotate(a); ctx.fillRect(-r * 0.8, -r * 1.4, r * 1.6, r * 2.8); ctx.strokeRect(-r * 0.8, -r * 1.4, r * 1.6, r * 2.8); ctx.fillStyle = col.stroke; ctx.fillRect(r * 0.3, -r * 0.2, r * 1.3, r * 0.4); break;
    case 'shield': ctx.rotate(a); ctx.fillRect(-r, -r, r * 2, r * 2); ctx.strokeRect(-r, -r, r * 2, r * 2); ctx.fillStyle = col.light; ctx.fillRect(r * 0.5, -r * 1.2, r * 0.6, r * 2.4); ctx.strokeRect(r * 0.5, -r * 1.2, r * 0.6, r * 2.4); break;
    case 'tank':
      ctx.rotate(a);
      ctx.fillRect(-r, -r * 0.8, r * 2, r * 1.6); ctx.strokeRect(-r, -r * 0.8, r * 2, r * 1.6);
      ctx.fillStyle = col.dark; ctx.fillRect(-r, -r * 0.95, r * 2, r * 0.25); ctx.fillRect(-r, r * 0.7, r * 2, r * 0.25);
      ctx.fillStyle = col.fill; ctx.fillRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9); ctx.strokeRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9);
      ctx.fillStyle = col.stroke; ctx.fillRect(0, -r * 0.12, r * 1.5, r * 0.24);
      break;
    case 'mortar': ctx.rotate(a); ctx.fillRect(-r, -r, r * 2, r * 2); ctx.strokeRect(-r, -r, r * 2, r * 2); ctx.fillStyle = col.dark; ctx.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8); ctx.fillStyle = col.stroke; ctx.fillRect(-r * 0.15, -r * 0.15, r * 0.3, r * 0.3); break;
    case 'foreman':
      ctx.shadowColor = col.fill; ctx.shadowBlur = r; ctx.rotate(a + Math.PI / 4);
      ctx.fillRect(-r, -r, r * 2, r * 2); ctx.shadowBlur = 0; ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.fillStyle = '#fff'; ctx.fillRect(-r * 0.15, -r * 0.7, r * 0.3, r * 1.4); ctx.fillRect(-r * 0.7, -r * 0.15, r * 1.4, r * 0.3);
      break;
    case 'circle': ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = col.stroke; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.25, 0, TAU); ctx.fill(); break;
    case 'lens': ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.6, r * 0.7, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = col.stroke; ctx.beginPath(); ctx.arc(r * 0.9, 0, r * 0.2, 0, TAU); ctx.fill(); break;
    case 'ring': ctx.lineWidth = r * 0.55; ctx.strokeStyle = col.fill; ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, TAU); ctx.stroke(); ctx.lineWidth = Math.max(1, r * 0.18); ctx.strokeStyle = 'rgba(0,0,0,0)' /* no outline: shapes are flat fills */; ctx.beginPath(); ctx.arc(0, 0, r * 1.08, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.52, 0, TAU); ctx.stroke(); break;
    case 'halo':
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = col.light; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, TAU); ctx.stroke();
      ctx.fillStyle = col.stroke; ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, TAU); ctx.fill();
      break;
    case 'nova':
      ctx.shadowColor = col.fill; ctx.shadowBlur = r * 0.8;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
      ctx.strokeStyle = col.dark; ctx.lineWidth = r * 0.12;
      for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(0, 0, (r * i) / 4, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r * 0.14, 0, TAU); ctx.fill();
      break;
    case 'oracle':
      ctx.shadowColor = col.fill; ctx.shadowBlur = r;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.12;
      for (let i = 0; i < 8; i++) { const an = a + (i * TAU) / 8; ctx.beginPath(); ctx.moveTo(Math.cos(an) * r * 0.5, Math.sin(an) * r * 0.5); ctx.lineTo(Math.cos(an) * r * 1.5, Math.sin(an) * r * 1.5); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.fill();
      break;
    default: ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/** Draw a building. x,y centre, w,h in world units. */
export function drawBuilding(ctx, faction, def, x, y, w, h, col, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  const hw = w / 2 - 3, hh = h / 2 - 3;
  ctx.fillStyle = col.fill; ctx.strokeStyle = 'rgba(0,0,0,0)' /* no outline: shapes are flat fills */; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
  const t = opts.time || 0;
  if (faction === 'blue') {
    if (def.hq) {
      poly(ctx, [[0, -hh * 1.1], [hw, hh * 0.65], [-hw, hh * 0.65]]); ctx.fill(); ctx.stroke(); // apex and base placed so the centroid sits on the building centre
      ctx.fillStyle = col.dark; poly(ctx, [[0, -hh * 0.5], [hw * 0.5, hh * 0.38], [-hw * 0.5, hh * 0.38]]); ctx.fill();
    } else if (def.onOre) { poly(ctx, [[0, -hh * 1.1], [hw, hh * 0.75], [-hw, hh * 0.75]]); ctx.fill(); ctx.stroke(); ctx.fillStyle = col.dark; ctx.beginPath(); ctx.arc(0, hh * 0.2, hw * 0.35, 0, TAU); ctx.fill(); }
    else if (def.turret) { poly(ctx, [[0, -hh * 1.05], [hw * 0.8, hh * 0.6], [-hw * 0.8, hh * 0.6]]); ctx.fill(); ctx.stroke(); ctx.save(); ctx.rotate(opts.facing || 0); ctx.fillStyle = col.stroke; ctx.fillRect(0, -2, hw * 1.1, 4); ctx.restore(); }
    else if (def.onPoint) { poly(ctx, [[0, -hh * 1.15], [hw * 0.6, hh * 0.55], [-hw * 0.6, hh * 0.55]]); ctx.fill(); ctx.stroke(); }
    else if (def.trains?.includes('kites')) { poly(ctx, [[0, -hh], [hw, 0], [0, hh], [-hw, 0]]); ctx.fill(); ctx.stroke(); ctx.fillStyle = col.dark; poly(ctx, [[0, -hh * 0.5], [hw * 0.5, 0], [0, hh * 0.5], [-hw * 0.5, 0]]); ctx.fill(); }
    else { poly(ctx, [[-hw, -hh * 0.75], [hw, -hh * 0.75], [0, hh * 1.1]]); ctx.fill(); ctx.stroke(); ctx.fillStyle = col.dark; poly(ctx, [[-hw * 0.5, -hh * 0.42], [hw * 0.5, -hh * 0.42], [0, hh * 0.48]]); ctx.fill(); }
  } else if (faction === 'red') {
    ctx.fillRect(-hw, -hh, hw * 2, hh * 2); ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ctx.fillStyle = col.dark;
    if (def.hq) { ctx.fillRect(-hw * 0.7, -hh * 0.7, hw * 1.4, hh * 1.4); ctx.fillStyle = col.light; ctx.fillRect(-hw * 0.3, -hh * 0.3, hw * 0.6, hh * 0.6); ctx.fillStyle = col.fill; ctx.fillRect(-hw * 0.12, -hh * 0.12, hw * 0.24, hh * 0.24); }
    else if (def.onOre) { ctx.fillRect(-hw * 0.5, -hh * 0.5, hw, hh); ctx.fillStyle = col.light; ctx.fillRect(-hw * 0.5, -hh * 0.5, hw * 0.5, hh * 0.5); }
    else if (def.turret) { ctx.fillRect(-hw * 0.6, -hh * 0.6, hw * 1.2, hh * 1.2); ctx.save(); ctx.rotate(opts.facing || 0); ctx.fillStyle = col.stroke; ctx.fillRect(0, -2.5, hw * 1.2, 5); ctx.restore(); }
    else if (def.onPoint) { ctx.fillRect(-hw * 0.3, -hh, hw * 0.6, hh * 2); }
    else if (def.upgrade) { ctx.fillRect(-hw * 0.7, -hh * 0.7, hw * 0.55, hh * 0.55); ctx.fillRect(hw * 0.15, -hh * 0.7, hw * 0.55, hh * 0.55); ctx.fillRect(-hw * 0.7, hh * 0.15, hw * 0.55, hh * 0.55); ctx.fillRect(hw * 0.15, hh * 0.15, hw * 0.55, hh * 0.55); }
    else { ctx.fillRect(-hw * 0.7, -hh * 0.7, hw * 1.4, hh * 1.4); ctx.fillStyle = col.fill; ctx.fillRect(-hw * 0.7, -hh * 0.2, hw * 1.4, hh * 0.4); }
  } else {
    const R = Math.min(hw, hh);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col.dark;
    if (def.hq) { ctx.beginPath(); ctx.arc(0, 0, R * 0.7, 0, TAU); ctx.fill(); ctx.strokeStyle = col.light; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, R * 0.45, 0, TAU); ctx.stroke(); ctx.fillStyle = col.light; ctx.beginPath(); ctx.arc(0, 0, R * 0.2, 0, TAU); ctx.fill(); }
    else if (def.onOre) { ctx.beginPath(); ctx.arc(0, 0, R * 0.5, 0, TAU); ctx.fill(); ctx.fillStyle = col.light; ctx.beginPath(); ctx.arc(-R * 0.2, -R * 0.2, R * 0.18, 0, TAU); ctx.fill(); }
    else if (def.turret) { ctx.beginPath(); ctx.arc(0, 0, R * 0.55, 0, TAU); ctx.fill(); ctx.save(); ctx.rotate(opts.facing || 0); ctx.fillStyle = col.stroke; ctx.fillRect(0, -2, R * 1.2, 4); ctx.restore(); }
    else if (def.onPoint) { ctx.strokeStyle = col.light; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, R * 0.55, 0, TAU); ctx.stroke(); }
    else if (def.upgrade) { for (let i = 0; i < 3; i++) { const an = t * 0.8 + (i * TAU) / 3; ctx.beginPath(); ctx.arc(Math.cos(an) * R * 0.45, Math.sin(an) * R * 0.45, R * 0.22, 0, TAU); ctx.fill(); } }
    else { ctx.beginPath(); ctx.ellipse(0, 0, R * 0.75, R * 0.45, 0, 0, TAU); ctx.fill(); ctx.fillStyle = col.light; ctx.beginPath(); ctx.arc(0, 0, R * 0.2, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

/** Tiny icon for HUD buttons/minimap: returns an SVG string. */
export function unitIconSVG(faction, shape, color, size = 28) {
  const c = color, s = size, h = s / 2;
  let body = '';
  switch (faction) {
    case 'blue':
      body = shape === 'needle' ? `<polygon points="${s * 0.95},${h} ${s * 0.1},${s * 0.8} ${s * 0.25},${h} ${s * 0.1},${s * 0.2}" />`
        : shape === 'chevron' ? `<polygon points="${s * 0.9},${h} ${s * 0.1},${s * 0.9} ${s * 0.4},${h} ${s * 0.1},${s * 0.1}" />`
        : shape === 'kite' ? `<polygon points="${s * 0.8},${h} ${s * 0.2},${s * 0.97} ${s * 0.2},${s * 0.03}" />`
        : shape === 'apex' ? `<polygon points="${h},${s * 0.05} ${s * 0.95},${s * 0.8} ${s * 0.05},${s * 0.8}" /><circle cx="${h}" cy="${s * 0.55}" r="${s * 0.12}" fill="#fff"/>`
        : `<polygon points="${s * 0.92},${h} ${s * 0.12},${s * 0.9} ${s * 0.12},${s * 0.1}" />`;
      break;
    case 'red':
      body = shape === 'wide' ? `<rect x="${s * 0.3}" y="${s * 0.1}" width="${s * 0.4}" height="${s * 0.8}" />`
        : shape === 'tank' ? `<rect x="${s * 0.1}" y="${s * 0.25}" width="${s * 0.8}" height="${s * 0.5}" /><rect x="${h}" y="${s * 0.45}" width="${s * 0.45}" height="${s * 0.1}" fill="#111"/>`
        : shape === 'foreman' ? `<rect x="${s * 0.2}" y="${s * 0.2}" width="${s * 0.6}" height="${s * 0.6}" transform="rotate(45 ${h} ${h})"/><rect x="${s * 0.45}" y="${s * 0.3}" width="${s * 0.1}" height="${s * 0.4}" fill="#fff"/>`
        : shape === 'shield' ? `<rect x="${s * 0.15}" y="${s * 0.2}" width="${s * 0.5}" height="${s * 0.6}" /><rect x="${s * 0.7}" y="${s * 0.1}" width="${s * 0.15}" height="${s * 0.8}" fill="#fff" opacity=".8"/>`
        : shape === 'mortar' ? `<rect x="${s * 0.15}" y="${s * 0.15}" width="${s * 0.7}" height="${s * 0.7}" /><rect x="${s * 0.38}" y="${s * 0.38}" width="${s * 0.24}" height="${s * 0.24}" fill="#111"/>`
        : `<rect x="${s * 0.15}" y="${s * 0.15}" width="${s * 0.7}" height="${s * 0.7}" />`;
      break;
    default:
      body = shape === 'lens' ? `<ellipse cx="${h}" cy="${h}" rx="${s * 0.45}" ry="${s * 0.22}" />`
        : shape === 'ring' ? `<circle cx="${h}" cy="${h}" r="${s * 0.32}" fill="none" stroke="${c}" stroke-width="${s * 0.16}"/>`
        : shape === 'halo' ? `<circle cx="${h}" cy="${h}" r="${s * 0.42}" /><circle cx="${h}" cy="${h}" r="${s * 0.22}" fill="none" stroke="#fff" stroke-width="${s * 0.07}"/>`
        : shape === 'nova' ? `<circle cx="${h}" cy="${h}" r="${s * 0.44}" /><circle cx="${h}" cy="${h}" r="${s * 0.26}" fill="none" stroke="#111" stroke-width="2"/><circle cx="${h}" cy="${h}" r="${s * 0.1}" fill="#111"/>`
        : shape === 'oracle' ? `<circle cx="${h}" cy="${h}" r="${s * 0.3}" /><circle cx="${h}" cy="${h}" r="${s * 0.44}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="3 3"/>`
        : `<circle cx="${h}" cy="${h}" r="${s * 0.4}" />`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="${c}" stroke="none">${body}</svg>`;
}
export function buildingIconSVG(faction, def, color, size = 28) {
  const s = size, h = s / 2, c = color;
  let body;
  if (faction === 'blue') body = def.hq ? `<polygon points="${h},${s * 0.03} ${s * 0.95},${s * 0.84} ${s * 0.05},${s * 0.84}"/><polygon points="${h},${s * 0.34} ${s * 0.7},${s * 0.71} ${s * 0.3},${s * 0.71}" fill="#111"/>`
    : def.turret ? `<polygon points="${h},${s * 0.1} ${s * 0.85},${s * 0.85} ${s * 0.15},${s * 0.85}"/><rect x="${h}" y="${s * 0.5}" width="${s * 0.4}" height="${s * 0.1}" fill="#fff"/>`
    : def.onOre ? `<polygon points="${h},${s * 0.1} ${s * 0.9},${s * 0.9} ${s * 0.1},${s * 0.9}"/><circle cx="${h}" cy="${s * 0.68}" r="${s * 0.12}" fill="#111"/>`
    : def.onPoint ? `<polygon points="${h},${s * 0.05} ${s * 0.75},${s * 0.9} ${s * 0.25},${s * 0.9}"/>`
    : `<polygon points="${s * 0.1},${s * 0.15} ${s * 0.9},${s * 0.15} ${h},${s * 0.9}"/>`;
  else if (faction === 'red') body = def.hq ? `<rect x="${s * 0.1}" y="${s * 0.1}" width="${s * 0.8}" height="${s * 0.8}"/><rect x="${s * 0.3}" y="${s * 0.3}" width="${s * 0.4}" height="${s * 0.4}" fill="#111"/>`
    : def.turret ? `<rect x="${s * 0.15}" y="${s * 0.15}" width="${s * 0.7}" height="${s * 0.7}"/><rect x="${h}" y="${s * 0.45}" width="${s * 0.45}" height="${s * 0.1}" fill="#fff"/>`
    : def.onOre ? `<rect x="${s * 0.15}" y="${s * 0.15}" width="${s * 0.7}" height="${s * 0.7}"/><rect x="${s * 0.25}" y="${s * 0.25}" width="${s * 0.25}" height="${s * 0.25}" fill="#fff" opacity=".7"/>`
    : def.onPoint ? `<rect x="${s * 0.35}" y="${s * 0.05}" width="${s * 0.3}" height="${s * 0.9}"/>`
    : def.upgrade ? `<rect x="${s * 0.1}" y="${s * 0.1}" width="${s * 0.35}" height="${s * 0.35}"/><rect x="${s * 0.55}" y="${s * 0.1}" width="${s * 0.35}" height="${s * 0.35}"/><rect x="${s * 0.1}" y="${s * 0.55}" width="${s * 0.35}" height="${s * 0.35}"/><rect x="${s * 0.55}" y="${s * 0.55}" width="${s * 0.35}" height="${s * 0.35}"/>`
    : `<rect x="${s * 0.1}" y="${s * 0.1}" width="${s * 0.8}" height="${s * 0.8}"/><rect x="${s * 0.1}" y="${s * 0.4}" width="${s * 0.8}" height="${s * 0.2}" fill="#111"/>`;
  else body = def.hq ? `<circle cx="${h}" cy="${h}" r="${s * 0.45}"/><circle cx="${h}" cy="${h}" r="${s * 0.25}" fill="#111"/><circle cx="${h}" cy="${h}" r="${s * 0.1}" fill="#fff"/>`
    : def.turret ? `<circle cx="${h}" cy="${h}" r="${s * 0.4}"/><rect x="${h}" y="${s * 0.45}" width="${s * 0.45}" height="${s * 0.1}" fill="#fff"/>`
    : def.onOre ? `<circle cx="${h}" cy="${h}" r="${s * 0.4}"/><circle cx="${s * 0.4}" cy="${s * 0.4}" r="${s * 0.1}" fill="#fff"/>`
    : def.onPoint ? `<circle cx="${h}" cy="${h}" r="${s * 0.4}" fill="none" stroke="${c}" stroke-width="${s * 0.15}"/>`
    : def.upgrade ? `<circle cx="${s * 0.35}" cy="${s * 0.35}" r="${s * 0.2}"/><circle cx="${s * 0.65}" cy="${s * 0.35}" r="${s * 0.2}"/><circle cx="${h}" cy="${s * 0.68}" r="${s * 0.2}"/>`
    : `<circle cx="${h}" cy="${h}" r="${s * 0.45}"/><ellipse cx="${h}" cy="${h}" rx="${s * 0.3}" ry="${s * 0.16}" fill="#111"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="${c}" stroke="none">${body}</svg>`;
}
