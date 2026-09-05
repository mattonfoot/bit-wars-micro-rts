// Five procedural battleground themes. Each tunes generation and the palette used by the terrain renderer.
export const THEMES = {
  verdant: {
    key: 'verdant', name: 'Verdant Basin', blurb: 'Rivers, forests and boulders. Fords are chokepoints; brush is everywhere.',
    gen: { mountain: 0.78, water: 'river', lakes: 0.18, brush: 0.55, brushDensity: 0.62, rocks: 0.05, walls: 0, ruins: 0.004, craters: 0.004, roads: true },
    colors: { ground: ['#4c7a3a', '#527f3e', '#476f36', '#5a8845'], road: '#8b7b55', water: '#2b5f8f', waterDeep: '#1d4670', shallow: '#4f8fb8', mountain: '#6d6a5e', mountainLight: '#9b9788', mountainDark: '#464439', brush: '#2f5a26', brushDot: '#3f7a30', rock: '#8c8a80', rockDark: '#5b5a52', wall: '#8a8271', ruin: '#6d6a60', ruinDark: '#4a473f', crater: '#3b5a2c', rubble: '#6a6a60', ore: '#f2c94c', oreDark: '#8f6b12', fog: '#050a06' },
    decor: 'trees',
  },
  ashfall: {
    key: 'ashfall', name: 'Ashfall', blurb: 'Lava channels, craters and black rock. Cover is scarce but craters are plentiful.',
    gen: { mountain: 0.74, water: 'river', lakes: 0.1, brush: 0.2, brushDensity: 0.35, rocks: 0.09, walls: 0, ruins: 0.002, craters: 0.05, roads: true },
    colors: { ground: ['#3a3532', '#403a37', '#35302d', '#46403c'], road: '#5a524c', water: '#ff6a1f', waterDeep: '#c93f0a', shallow: '#4a3a34', mountain: '#2b2726', mountainLight: '#5e5450', mountainDark: '#161312', brush: '#4c3a2e', brushDot: '#7a4a2a', rock: '#5c5450', rockDark: '#2c2826', wall: '#6a5b52', ruin: '#4a4240', ruinDark: '#2a2422', crater: '#2a2523', rubble: '#4d4643', ore: '#ff9d3c', oreDark: '#8c3f0a', fog: '#000000' },
    decor: 'embers',
  },
  frost: {
    key: 'frost', name: 'Frostbite', blurb: 'Frozen lakes you can cross, pine stands, and drifts. Wide open and deadly.',
    gen: { mountain: 0.8, water: 'lakes', lakes: 0.3, ice: 0.6, brush: 0.4, brushDensity: 0.5, rocks: 0.06, walls: 0, ruins: 0.003, craters: 0.006, roads: true },
    colors: { ground: ['#d9e3ea', '#e2eaf0', '#cfdbe4', '#e8eef3'], road: '#b7c3cc', water: '#5f93c4', waterDeep: '#3b6b9b', shallow: '#a9d2ec', mountain: '#8e98a3', mountainLight: '#f3f7fa', mountainDark: '#5a636c', brush: '#5a7a68', brushDot: '#2f5540', rock: '#8a949c', rockDark: '#525a62', wall: '#9aa5ad', ruin: '#7c858d', ruinDark: '#4e565c', crater: '#b8c6d0', rubble: '#9ea9b1', ore: '#7fe3ff', oreDark: '#2f7fa0', fog: '#04060a' },
    decor: 'pines',
  },
  urban: {
    key: 'urban', name: 'Ruined City', blurb: 'Streets, walls and hollow buildings. Every block is a strongpoint. Breach or be breached.',
    gen: { mountain: 0.9, water: 'canal', lakes: 0.0, brush: 0.15, brushDensity: 0.3, rocks: 0.01, walls: 0.7, ruins: 0.03, craters: 0.02, roads: 'grid' },
    colors: { ground: ['#5c5e63', '#606267', '#57595e', '#65676c'], road: '#3c3e44', water: '#2e4a5c', waterDeep: '#213745', shallow: '#4a6f85', mountain: '#4a4c52', mountainLight: '#7a7d85', mountainDark: '#2a2b2f', brush: '#4b5f3d', brushDot: '#6a8a4a', wall: '#8f8a82', ruin: '#7d7a76', ruinDark: '#3b3937', rock: '#7c7a78', rockDark: '#45433f', crater: '#45474c', rubble: '#6e6c69', ore: '#e9c46a', oreDark: '#7a5c15', fog: '#030304' },
    decor: 'city',
  },
  crystal: {
    key: 'crystal', name: 'Crystal Dunes', blurb: 'Canyons, dry riverbeds and crystal spires. Long sightlines, few hiding places.',
    gen: { mountain: 0.7, water: 'none', lakes: 0, brush: 0.15, brushDensity: 0.3, rocks: 0.08, walls: 0, ruins: 0.002, craters: 0.01, roads: 'riverbed' },
    colors: { ground: ['#c9a86a', '#d1b074', '#c2a061', '#d8b87e'], road: '#b39258', water: '#3aa3a8', waterDeep: '#25767b', shallow: '#8ec9c8', mountain: '#9c6f3f', mountainLight: '#d7a26b', mountainDark: '#5c3f21', brush: '#8a9a52', brushDot: '#5c7a2e', rock: '#8fd3f4', rockDark: '#3d8fb8', wall: '#b08e5a', ruin: '#a2814f', ruinDark: '#5e4a2b', crater: '#a98a54', rubble: '#b7a074', ore: '#ff5fd2', oreDark: '#8e2a75', fog: '#0a0703' },
    decor: 'crystals',
  },
};
export const THEME_KEYS = Object.keys(THEMES);
