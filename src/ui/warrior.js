// Title-screen portrait: a helmeted soldier seen in profile, drawn as flat vector plates in the game's
// line style. Dark armour, a red visor band under a peaked brow, a cyan ear disc and light strips on the
// shoulder plates. Drawn facing right; pass 'left' for the mirrored twin on the other side of the screen.
const ARMOUR = '#141925', PLATE = '#1c2232', EDGE = '#2a3349', DARK = '#0c0f16', LINE = 'rgba(170,190,230,0.28)';
const VISOR = '#ff2f3f', CYAN = '#3ce6ff';

export function warriorSVG(facing = 'right', cls = '') {
  const flip = facing === 'left' ? ' transform="translate(260 0) scale(-1 1)"' : '';
  const uid = facing === 'left' ? 'wl' : 'wr';
  return `<svg class="warrior ${cls}" viewBox="0 0 260 340" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <defs>
    <filter id="${uid}-glow" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="${uid}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
    <linearGradient id="${uid}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.6" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${uid}-mask"><rect width="260" height="340" fill="url(#${uid}-fade)"/></mask>
  </defs>
  <g${flip} mask="url(#${uid}-mask)" stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round">
    <!-- shoulders and chest -->
    <path d="M6 340V262C10 226 40 206 90 202L124 200V340Z" fill="${ARMOUR}"/>
    <path d="M124 200L196 214C232 224 250 256 254 300L256 340H124Z" fill="${PLATE}"/>
    <path d="M20 268C30 240 56 224 96 220L118 218V236L98 238C64 242 44 256 36 280Z" fill="${EDGE}"/>
    <path d="M136 226L192 238C220 246 236 268 240 300L232 302C226 276 212 258 188 252L136 242Z" fill="${EDGE}"/>
    <path d="M44 262L100 246" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
    <path d="M44 262L100 246" stroke="${CYAN}" stroke-width="8" stroke-linecap="round" opacity="0.25" filter="url(#${uid}-soft)"/>
    <path d="M150 262L204 276" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
    <path d="M150 262L204 276" stroke="${CYAN}" stroke-width="8" stroke-linecap="round" opacity="0.25" filter="url(#${uid}-soft)"/>
    <!-- neck and collar -->
    <path d="M104 168L162 176L168 222L108 216Z" fill="${DARK}"/>
    <path d="M92 208L182 218L190 238L84 230Z" fill="${PLATE}"/>
    <!-- helmet silhouette -->
    <path d="M60 150C48 70 100 20 160 26C212 30 242 62 238 96L256 106L248 116L242 118L242 148L246 152L238 178C230 190 206 198 180 200L150 202L112 200C80 196 60 172 60 150Z" fill="${ARMOUR}"/>
    <!-- dome panel and cheek plate -->
    <path d="M76 128C72 78 108 42 160 42C202 44 222 66 226 92L146 90L110 104Z" fill="${PLATE}" stroke="none"/>
    <path d="M76 128C72 78 108 42 160 42C202 44 222 66 226 92" fill="none"/>
    <path d="M156 150L242 150L246 154L238 178C230 190 206 198 180 200L150 202Z" fill="${PLATE}"/>
    <path d="M202 166L228 164M206 176L228 174M208 186L226 184" fill="none" stroke="${EDGE}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M132 152L156 150" fill="none"/>
    <path d="M136 156L160 194" fill="none"/>
    <!-- visor with glow, under a peaked brow -->
    <path d="M154 116L242 118L242 148L156 146Z" fill="none" stroke="${VISOR}" stroke-width="7" opacity="0.5" filter="url(#${uid}-glow)"/>
    <path d="M154 116L242 118L242 148L156 146Z" fill="#160408" stroke="none"/>
    <path d="M160 128L236 130L236 144L160 142Z" fill="${VISOR}" stroke="none" opacity="0.28"/>
    <path d="M154 116L242 118L242 148L156 146Z" fill="none" stroke="${VISOR}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M166 124L230 126" stroke="#ff9aa2" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
    <path d="M136 90L238 96L256 106L248 116L136 108Z" fill="${EDGE}"/>
    <!-- ear disc -->
    <circle cx="106" cy="132" r="24" fill="${DARK}" stroke="${CYAN}" stroke-width="2.5"/>
    <circle cx="106" cy="132" r="15" fill="none" stroke="${CYAN}" stroke-width="1.4" opacity="0.7"/>
    <path d="M98 128L106 138L114 128" fill="none" stroke="${CYAN}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="106" cy="132" r="30" fill="none" stroke="${CYAN}" stroke-width="6" opacity="0.18" filter="url(#${uid}-soft)"/>
  </g>
</svg>`;
}
