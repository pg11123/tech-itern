// Generated placeholder art for enemies: round pigs, one look per tier (minion / elite / boss).
// Feet sit at (0, 0); pigs face left, toward the heroes.
import { Graphics } from 'pixi.js';
import { ENEMY_TIER } from '../../../config/constants';

const BASE_RADIUS = 38;
const OUTLINE = 0x24420e;
const EYE_OUTLINE = 0x1c1414;

const LOOKS = {
  [ENEMY_TIER.MINION]: { body: 0x84c43e, snout: 0xa8dc6a, size: 0.9 },
  [ENEMY_TIER.ELITE]: { body: 0x5c9a2d, snout: 0x85bf4f, size: 1.15, hat: 'helmet' },
  [ENEMY_TIER.BOSS]: { body: 0x4b8a24, snout: 0x74ae44, size: 1.5, hat: 'crown' },
};

const pts = (cx, cy, s, list) => list.flatMap(([x, y]) => [cx + x * s, cy + y * s]);

function drawHelmet(g, cy, r) {
  const radius = r * 1.06;
  const [start, end] = [Math.PI * 1.18, Math.PI * 1.82];
  // Explicit moveTo: Pixi otherwise starts a path at the previous shape's last point.
  g.moveTo(Math.cos(start) * radius, cy + Math.sin(start) * radius).arc(0, cy, radius, start, end).closePath();
  g.fill(0x8d949c).stroke({ width: 3, color: 0x3d4248 });
  g.poly(pts(0, cy, r, [[-0.1, -1.02], [0, -1.32], [0.1, -1.02]])).fill(0xb5bcc4).stroke({ width: 2, color: 0x3d4248 });
}

function drawCrown(g, cy, r) {
  const crown = [[-0.5, -0.78], [-0.52, -1.22], [-0.25, -0.98], [0, -1.3], [0.25, -0.98], [0.52, -1.22], [0.5, -0.78]];
  g.poly(pts(0, cy, r, crown)).fill(0xf2c230).stroke({ width: 3, color: 0x8a6410 });
  g.circle(0, cy - r * 0.9, r * 0.07).fill(0xd8323a);
}

export function createPigPlaceholder(tier) {
  const look = LOOKS[tier] ?? LOOKS[ENEMY_TIER.MINION];
  const r = BASE_RADIUS * look.size;
  const cy = -r;
  const g = new Graphics();

  // Ears behind the head.
  for (const ex of [-0.55, 0.55]) {
    g.circle(ex * r, cy - r * 0.8, r * 0.24).fill(look.body).stroke({ width: 3, color: OUTLINE });
  }
  g.circle(0, cy, r).fill(look.body).stroke({ width: 3, color: OUTLINE });

  // Snout with nostrils.
  g.ellipse(-r * 0.42, cy + r * 0.08, r * 0.3, r * 0.23).fill(look.snout).stroke({ width: 2, color: OUTLINE });
  for (const nx of [-0.53, -0.32]) g.ellipse(nx * r, cy + r * 0.08, r * 0.055, r * 0.09).fill(OUTLINE);

  // Eyes looking left.
  for (const ex of [-0.62, -0.12]) {
    g.circle(ex * r, cy - r * 0.35, r * 0.17).fill(0xffffff).stroke({ width: 2, color: EYE_OUTLINE });
    g.circle((ex - 0.06) * r, cy - r * 0.33, r * 0.075).fill(EYE_OUTLINE);
  }

  if (look.hat === 'helmet') drawHelmet(g, cy, r);
  if (look.hat === 'crown') drawCrown(g, cy, r);

  return { view: g, width: r * 2.2, height: r * 2.4 };
}
