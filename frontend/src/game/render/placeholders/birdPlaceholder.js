// Generated placeholder art for heroes: rounded bird shapes with eyes, one look per class.
// Feet sit at (0, 0); birds face right, toward the enemies.
import { Graphics } from 'pixi.js';
import { HERO_CLASS } from '../../../config/constants';
import { HERO_COLOR } from '../palette';

const BASE_RADIUS = 38;
const OUTLINE = 0x1c1414;
const BEAK = 0xf4a21d;
const BEAK_SHADE = 0xd27f14;
const TAIL = 0x2a1d1d;
const BLACK_FEATHER = 0x16161c;

// Head feathers as triangles around the top of the head (0, 0), in units of the head radius.
// Their roots sit below the top, so the body drawn afterwards covers them.
const TUFTS = {
  pair: [
    [[-0.15, 0.1], [-0.35, -0.45], [0.05, 0.05]],
    [[0, 0.08], [0.05, -0.35], [0.25, 0.1]],
  ],
  spray: [
    [[-0.2, 0.16], [-0.46, -0.34], [-0.04, 0.1]],
    [[-0.08, 0.14], [-0.02, -0.5], [0.1, 0.12]],
    [[0.04, 0.16], [0.32, -0.38], [0.2, 0.2]],
  ],
};

const LOOKS = {
  [HERO_CLASS.VANGUARD]: {
    shape: 'round', body: HERO_COLOR[HERO_CLASS.VANGUARD], belly: 0xf2dcc2, size: 1, tuft: { style: 'pair', color: HERO_COLOR[HERO_CLASS.VANGUARD] },
  },
  [HERO_CLASS.ARCANIST]: {
    shape: 'triangle', body: HERO_COLOR[HERO_CLASS.ARCANIST], belly: 0xfbecc0, size: 1, tuft: { style: 'spray', color: BLACK_FEATHER },
  },
  [HERO_CLASS.MENDER]: {
    shape: 'egg', body: HERO_COLOR[HERO_CLASS.MENDER], belly: 0xf6d3db, size: 1.05, tuft: { style: 'spray', color: BLACK_FEATHER },
  },
  [HERO_CLASS.DEMOLISHER]: { shape: 'round', body: HERO_COLOR[HERO_CLASS.DEMOLISHER], belly: 0x55566a, size: 1.18, fuse: true },
  [HERO_CLASS.SKIRMISHER]: {
    shape: 'trio', body: HERO_COLOR[HERO_CLASS.SKIRMISHER], belly: 0xd7edfb, size: 0.55, tuft: { style: 'spray', color: BLACK_FEATHER },
  },
};

// Offsets a list of [x, y] pairs given in units of `s` around (cx, cy).
const pts = (cx, cy, s, list) => list.flatMap(([x, y]) => [cx + x * s, cy + y * s]);

function drawTail(g, cx, cy, r) {
  g.poly(pts(cx, cy, r, [[-0.85, -0.2], [-1.35, -0.45], [-1.3, -0.25], [-0.9, 0]])).fill(TAIL);
  g.poly(pts(cx, cy, r, [[-0.85, 0], [-1.4, -0.05], [-1.3, 0.12], [-0.85, 0.2]])).fill(TAIL);
}

// (x, topY) is the top of the head; s is the head radius.
function drawTuft(g, x, topY, s, tuft) {
  if (!tuft) return;
  for (const feather of TUFTS[tuft.style]) {
    g.poly(pts(x, topY, s, feather)).fill(tuft.color).stroke({ width: 2, color: OUTLINE });
  }
}

function drawFuse(g, cx, cy, r) {
  g.rect(cx - r * 0.12, cy - r * 1.12, r * 0.24, r * 0.2).fill(0x6b6b78).stroke({ width: 2, color: OUTLINE });
  g.moveTo(cx, cy - r * 1.12).quadraticCurveTo(cx + r * 0.1, cy - r * 1.45, cx + r * 0.35, cy - r * 1.4);
  g.stroke({ width: 3, color: 0x8a6a3c });
  g.star(cx + r * 0.38, cy - r * 1.42, 5, r * 0.16, r * 0.07).fill(0xffd34d);
}

// Eyes, angry brow and beak around the face centre (cx, cy), scaled by s.
function drawFace(g, cx, cy, s) {
  for (const ex of [0.1, 0.48]) {
    g.circle(cx + ex * s, cy - 0.2 * s, 0.19 * s).fill(0xffffff).stroke({ width: 2, color: OUTLINE });
    g.circle(cx + (ex + 0.07) * s, cy - 0.18 * s, 0.085 * s).fill(OUTLINE);
  }
  const brow = [[-0.16, -0.58], [0.3, -0.4], [0.74, -0.54], [0.74, -0.42], [0.3, -0.27], [-0.16, -0.45]];
  g.poly(pts(cx, cy, s, brow)).fill(OUTLINE);
  g.poly(pts(cx, cy, s, [[0.24, 0.02], [0.86, 0.12], [0.28, 0.2]])).fill(BEAK).stroke({ width: 2, color: OUTLINE });
  g.poly(pts(cx, cy, s, [[0.28, 0.2], [0.74, 0.18], [0.3, 0.34]])).fill(BEAK_SHADE).stroke({ width: 2, color: OUTLINE });
}

function drawRoundBird(g, cx, cy, r, look) {
  drawTail(g, cx, cy, r);
  drawTuft(g, cx, cy - r, r, look.tuft);
  if (look.fuse) drawFuse(g, cx, cy, r);
  g.circle(cx, cy, r).fill(look.body).stroke({ width: 3, color: OUTLINE });
  g.ellipse(cx - r * 0.05, cy + r * 0.45, r * 0.62, r * 0.42).fill(look.belly);
  drawFace(g, cx, cy, r);
}

function drawTriangleBird(g, r, look) {
  const radius = r * 1.5;
  const cy = -radius / 2; // centroid of a triangle whose base sits on the ground
  drawTail(g, 0, cy + r * 0.2, r * 0.9);
  // The rounded apex is narrow, so the crest is rooted a little lower than the tip.
  drawTuft(g, 0, cy - radius + r * 0.42, r * 0.85, look.tuft);
  g.roundPoly(0, cy, radius, 3, r * 0.28).fill(look.body).stroke({ width: 3, color: OUTLINE });
  g.ellipse(0, cy + r * 0.45, r * 0.55, r * 0.26).fill(look.belly);
  drawFace(g, 0, cy - r * 0.05, r * 0.85);
}

function drawEggBird(g, r, look) {
  const cy = -r * 1.12;
  drawTail(g, 0, cy + r * 0.2, r);
  drawTuft(g, 0, cy - r * 1.12, r * 0.9, look.tuft);
  g.ellipse(0, cy, r * 0.92, r * 1.12).fill(look.body).stroke({ width: 3, color: OUTLINE });
  g.ellipse(-r * 0.05, cy + r * 0.55, r * 0.58, r * 0.45).fill(look.belly);
  drawFace(g, 0, cy - r * 0.05, r * 0.95);
}

// The Blues are one hero unit drawn as three small birds.
function drawTrio(g, r, look) {
  const birds = [
    { x: -4, y: -14 },
    { x: -26, y: 0 },
    { x: 22, y: 0 },
  ];
  for (const { x, y } of birds) drawRoundBird(g, x * (r / 21), y * (r / 21) - r, r, look);
}

export function createBirdPlaceholder(heroClass) {
  const look = LOOKS[heroClass] ?? LOOKS[HERO_CLASS.VANGUARD];
  const r = BASE_RADIUS * look.size;
  const g = new Graphics();

  if (look.shape === 'triangle') drawTriangleBird(g, r, look);
  else if (look.shape === 'egg') drawEggBird(g, r, look);
  else if (look.shape === 'trio') drawTrio(g, r, look);
  else drawRoundBird(g, 0, -r, r, look);

  const width = look.shape === 'trio' ? r * 5.4 : r * 2.2;
  const height = look.shape === 'trio' ? r * 2.8 : r * 2.4;
  return { view: g, width, height };
}
